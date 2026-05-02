-- ============================================================
--  FarmLink — Booking History Table
--  Added separately as DB was already initialised
-- ============================================================

CREATE TYPE history_type AS ENUM (
    'EQUIPMENT_RENTED_OUT',   -- I owned equipment, someone rented it
    'EQUIPMENT_RENTED_IN',    -- I rented someone else's equipment
    'OPERATOR_HIRED_OUT',     -- I am operator, someone hired me
    'OPERATOR_HIRED_IN',      -- I hired an operator
    'JOB_POSTED_FILLED',      -- I posted a job, operator accepted
    'JOB_APPLICATION_ACCEPTED' -- I applied for a job, got accepted
);

CREATE TABLE booking_history (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    history_type        history_type    NOT NULL,

    -- Reference IDs — only the relevant one is filled, rest are NULL
    equipment_listing_id    BIGINT REFERENCES equipment_listings(id) ON DELETE SET NULL,
    rental_request_id       BIGINT REFERENCES equipment_rental_requests(id) ON DELETE SET NULL,
    operator_profile_id     BIGINT REFERENCES operator_profiles(id) ON DELETE SET NULL,
    hire_request_id         BIGINT REFERENCES operator_hire_requests(id) ON DELETE SET NULL,
    job_post_id             BIGINT REFERENCES job_posts(id) ON DELETE SET NULL,
    job_application_id      BIGINT REFERENCES job_applications(id) ON DELETE SET NULL,

    -- Snapshot of key info at time of booking (so history stays intact even if listing deleted)
    title               VARCHAR(300)    NOT NULL,  -- e.g. "Plough rented to Ramesh Kumar"
    other_party_name    VARCHAR(120),              -- name of the other person involved
    other_party_mobile  VARCHAR(15),               -- their mobile
    from_date           DATE,
    to_date             DATE,
    amount              NUMERIC(10,2),             -- total amount if applicable

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_history_user ON booking_history(user_id);
CREATE INDEX idx_booking_history_type ON booking_history(history_type);
CREATE INDEX idx_booking_history_date ON booking_history(created_at);