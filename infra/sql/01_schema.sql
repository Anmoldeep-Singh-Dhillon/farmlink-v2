-- ============================================================
--  FarmLink — Complete Database Schema
--  Engine  : PostgreSQL 16 + PostGIS 3.4
--  Runs on : first container start (docker-entrypoint-initdb.d)
--
--  TABLE INDEX
--  ──────────────────────────────────────────────────────────
--  1.  users
--  2.  equipment_listings
--  3.  equipment_images
--  4.  equipment_rental_requests
--  5.  operator_profiles
--  6.  operator_images  (profile pic handled separately via minio)
--  7.  operator_hire_requests
--  8.  job_posts
--  9.  job_applications
--  10. notifications
-- ============================================================

-- Enable PostGIS (must be first)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- ENUM TYPES  (define once, reuse everywhere)
-- ============================================================

-- Rental basis for equipment
CREATE TYPE rental_basis AS ENUM ('HOURLY', 'DAILY', 'BOTH');

-- Status for any request / booking
CREATE TYPE request_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- Listing / post availability status
CREATE TYPE listing_status AS ENUM ('ACTIVE', 'BOOKED', 'EXPIRED', 'DELETED');

-- Operator service types (stored as text array on profile)
-- We use text so new services can be added without migration.
-- Allowed values enforced at application layer:
--   SEEDING, PLOUGHING, HARVESTING, TRANSPORT, LEVELING, OTHER

-- Notification event types
CREATE TYPE notification_type AS ENUM (
  'RENTAL_REQUEST_RECEIVED',
  'RENTAL_REQUEST_ACCEPTED',
  'RENTAL_REQUEST_REJECTED',
  'HIRE_REQUEST_RECEIVED',
  'HIRE_REQUEST_ACCEPTED',
  'HIRE_REQUEST_REJECTED',
  'JOB_APPLICATION_RECEIVED',
  'JOB_APPLICATION_ACCEPTED',
  'JOB_APPLICATION_REJECTED'
);

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id                BIGSERIAL       PRIMARY KEY,
  full_name         VARCHAR(120)    NOT NULL,
  mobile            VARCHAR(15)     NOT NULL UNIQUE,  -- login identifier
  password_hash     VARCHAR(255)    NOT NULL,
  aadhaar_number    VARCHAR(12)     NOT NULL UNIQUE,  -- masked/encrypted in app layer
  address_line      VARCHAR(300)    NOT NULL,
  city              VARCHAR(100)    NOT NULL,
  state             VARCHAR(100)    NOT NULL,
  pincode           VARCHAR(10)     NOT NULL,

  -- PostGIS point: SRID 4326 = standard GPS lat/lng
  location          GEOGRAPHY(POINT, 4326) NOT NULL,

  -- For quick display without a spatial query
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,

  profile_picture_url VARCHAR(500),
  is_active         BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_mobile   ON users(mobile);
CREATE INDEX idx_users_location ON users USING GIST(location);

-- ============================================================
-- 2. EQUIPMENT LISTINGS
-- ============================================================
CREATE TABLE equipment_listings (
  id                  BIGSERIAL       PRIMARY KEY,
  owner_id            BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  equipment_type      VARCHAR(100)    NOT NULL,  -- e.g. "Plough", "Seeder", "Trolley"
  description         TEXT,

  rental_basis        rental_basis    NOT NULL,  -- HOURLY | DAILY | BOTH
  hourly_rate         NUMERIC(10,2),             -- NULL if rental_basis = DAILY
  daily_rate          NUMERIC(10,2),             -- NULL if rental_basis = HOURLY
  security_deposit    NUMERIC(10,2)   NOT NULL DEFAULT 0,

  available_from      DATE            NOT NULL,
  available_till      DATE            NOT NULL,

  status              listing_status  NOT NULL DEFAULT 'ACTIVE',

  -- Denormalised location (copy from owner at listing time so geo queries work
  -- even if owner updates their address later)
  location            GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,

  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dates   CHECK (available_till >= available_from),
  CONSTRAINT chk_hourly  CHECK (rental_basis = 'DAILY'  OR hourly_rate IS NOT NULL),
  CONSTRAINT chk_daily   CHECK (rental_basis = 'HOURLY' OR daily_rate  IS NOT NULL)
);

CREATE INDEX idx_eq_listings_owner    ON equipment_listings(owner_id);
CREATE INDEX idx_eq_listings_status   ON equipment_listings(status);
CREATE INDEX idx_eq_listings_location ON equipment_listings USING GIST(location);
CREATE INDEX idx_eq_listings_type     ON equipment_listings(equipment_type);

-- ============================================================
-- 3. EQUIPMENT IMAGES
-- ============================================================
CREATE TABLE equipment_images (
  id              BIGSERIAL   PRIMARY KEY,
  listing_id      BIGINT      NOT NULL REFERENCES equipment_listings(id) ON DELETE CASCADE,
  image_url       VARCHAR(500) NOT NULL,   -- full MinIO presigned or public URL
  object_key      VARCHAR(300) NOT NULL,   -- MinIO object key (bucket/uuid.ext)
  display_order   SMALLINT    NOT NULL DEFAULT 0,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eq_images_listing ON equipment_images(listing_id);

-- ============================================================
-- 4. EQUIPMENT RENTAL REQUESTS
-- ============================================================
CREATE TABLE equipment_rental_requests (
  id              BIGSERIAL       PRIMARY KEY,
  listing_id      BIGINT          NOT NULL REFERENCES equipment_listings(id) ON DELETE CASCADE,
  requester_id    BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  rental_basis    rental_basis    NOT NULL,  -- which mode requester chose
  from_date       DATE,                      -- for DAILY requests
  to_date         DATE,                      -- for DAILY requests
  num_hours       SMALLINT,                  -- for HOURLY requests

  description     TEXT,                      -- requester's note to owner

  status          request_status  NOT NULL DEFAULT 'PENDING',

  -- timestamps
  requested_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,               -- when owner accepted/rejected

  CONSTRAINT chk_rental_dates  CHECK (
    (rental_basis = 'DAILY'  AND from_date IS NOT NULL AND to_date IS NOT NULL AND to_date >= from_date)
    OR
    (rental_basis = 'HOURLY' AND num_hours IS NOT NULL AND num_hours > 0)
  )
);

CREATE INDEX idx_eq_req_listing   ON equipment_rental_requests(listing_id);
CREATE INDEX idx_eq_req_requester ON equipment_rental_requests(requester_id);
CREATE INDEX idx_eq_req_status    ON equipment_rental_requests(status);

-- ============================================================
-- 5. OPERATOR PROFILES
-- ============================================================
CREATE TABLE operator_profiles (
  id                  BIGSERIAL       PRIMARY KEY,
  user_id             BIGINT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Services offered: stored as Postgres text array
  -- e.g. {"SEEDING","PLOUGHING","TRANSPORT"}
  services_offered    TEXT[]          NOT NULL,

  profile_picture_url VARCHAR(500),
  profile_picture_key VARCHAR(300),   -- MinIO object key

  hourly_rate         NUMERIC(10,2),
  daily_rate          NUMERIC(10,2),
  is_rate_negotiable  BOOLEAN         NOT NULL DEFAULT FALSE,

  bio                 TEXT,           -- optional self-description

  status              listing_status  NOT NULL DEFAULT 'ACTIVE',

  -- Denormalised location (same reason as equipment_listings)
  location            GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,

  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_op_profiles_user     ON operator_profiles(user_id);
CREATE INDEX idx_op_profiles_status   ON operator_profiles(status);
CREATE INDEX idx_op_profiles_location ON operator_profiles USING GIST(location);

-- ============================================================
-- 6. OPERATOR HIRE REQUESTS
-- ============================================================
CREATE TABLE operator_hire_requests (
  id              BIGSERIAL       PRIMARY KEY,
  operator_id     BIGINT          NOT NULL REFERENCES operator_profiles(id) ON DELETE CASCADE,
  requester_id    BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  from_date       DATE            NOT NULL,
  to_date         DATE            NOT NULL,

  offered_rate    NUMERIC(10,2)   NOT NULL,  -- rate requester is willing to pay
  rate_basis      rental_basis    NOT NULL,  -- HOURLY or DAILY

  description     TEXT,

  status          request_status  NOT NULL DEFAULT 'PENDING',

  requested_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,

  CONSTRAINT chk_hire_dates CHECK (to_date >= from_date)
);

CREATE INDEX idx_op_hire_operator  ON operator_hire_requests(operator_id);
CREATE INDEX idx_op_hire_requester ON operator_hire_requests(requester_id);
CREATE INDEX idx_op_hire_status    ON operator_hire_requests(status);

-- ============================================================
-- 7. JOB POSTS
-- ============================================================
CREATE TABLE job_posts (
  id              BIGSERIAL       PRIMARY KEY,
  posted_by       BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title           VARCHAR(200)    NOT NULL,   -- e.g. "Need someone to plough 2 acres"
  description     TEXT            NOT NULL,
  service_needed  VARCHAR(100)    NOT NULL,   -- SEEDING | PLOUGHING | etc.

  desired_rate    NUMERIC(10,2),              -- farmer's budget
  rate_basis      rental_basis,               -- HOURLY or DAILY

  work_from_date  DATE            NOT NULL,
  work_to_date    DATE            NOT NULL,

  status          listing_status  NOT NULL DEFAULT 'ACTIVE',

  -- Denormalised location
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,

  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_job_dates CHECK (work_to_date >= work_from_date)
);

CREATE INDEX idx_job_posts_posted_by ON job_posts(posted_by);
CREATE INDEX idx_job_posts_status    ON job_posts(status);
CREATE INDEX idx_job_posts_location  ON job_posts USING GIST(location);
CREATE INDEX idx_job_posts_service   ON job_posts(service_needed);

-- ============================================================
-- 8. JOB APPLICATIONS (operator applies to a job post)
-- ============================================================
CREATE TABLE job_applications (
  id              BIGSERIAL       PRIMARY KEY,
  job_post_id     BIGINT          NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  applicant_id    BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  offered_rate    NUMERIC(10,2),              -- what operator is willing to charge
  rate_basis      rental_basis,

  cover_note      TEXT,                       -- operator's message

  status          request_status  NOT NULL DEFAULT 'PENDING',

  applied_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,

  -- One application per operator per job
  CONSTRAINT uq_job_application UNIQUE(job_post_id, applicant_id)
);

CREATE INDEX idx_job_app_post      ON job_applications(job_post_id);
CREATE INDEX idx_job_app_applicant ON job_applications(applicant_id);
CREATE INDEX idx_job_app_status    ON job_applications(status);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id              BIGSERIAL           PRIMARY KEY,
  recipient_id    BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type            notification_type   NOT NULL,
  message         TEXT                NOT NULL,

  -- Generic FK: points to the relevant record (request / application / listing)
  -- The type field tells the app which table to look in.
  reference_id    BIGINT,             -- e.g. rental_request.id, hire_request.id, etc.

  is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id);
CREATE INDEX idx_notif_is_read   ON notifications(recipient_id, is_read);

-- ============================================================
-- TRIGGERS — auto-update updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_eq_listings_updated_at
  BEFORE UPDATE ON equipment_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_op_profiles_updated_at
  BEFORE UPDATE ON operator_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_job_posts_updated_at
  BEFORE UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VIEWS — handy for debugging / reporting (optional)
-- ============================================================

-- Active equipment listings with owner info
CREATE VIEW v_active_equipment AS
SELECT
  el.id,
  el.equipment_type,
  el.rental_basis,
  el.hourly_rate,
  el.daily_rate,
  el.security_deposit,
  el.available_from,
  el.available_till,
  el.status,
  el.latitude,
  el.longitude,
  u.full_name    AS owner_name,
  u.mobile       AS owner_mobile,
  u.address_line AS owner_address,
  u.city         AS owner_city
FROM equipment_listings el
JOIN users u ON u.id = el.owner_id
WHERE el.status = 'ACTIVE'
  AND el.available_till >= CURRENT_DATE;

-- Active operator profiles with user info
CREATE VIEW v_active_operators AS
SELECT
  op.id,
  op.services_offered,
  op.hourly_rate,
  op.daily_rate,
  op.is_rate_negotiable,
  op.profile_picture_url,
  op.status,
  op.latitude,
  op.longitude,
  u.full_name  AS operator_name,
  u.mobile     AS operator_mobile,
  u.city       AS operator_city
FROM operator_profiles op
JOIN users u ON u.id = op.user_id
WHERE op.status = 'ACTIVE';
