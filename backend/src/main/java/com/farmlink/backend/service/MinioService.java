package com.farmlink.backend.service;

import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket.equipment}")
    private String equipmentBucket;

    @Value("${minio.bucket.operators}")
    private String operatorsBucket;

    @Value("${minio.endpoint}")
    private String endpoint;

    @PostConstruct
    public void initBuckets() {
        createBucketIfNotExists(equipmentBucket);
        createBucketIfNotExists(operatorsBucket);
    }

    private void createBucketIfNotExists(String bucket) {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucket).build());
                String policy = """
                    {
                      "Version":"2012-10-17",
                      "Statement":[{
                        "Effect":"Allow",
                        "Principal":{"AWS":["*"]},
                        "Action":["s3:GetObject"],
                        "Resource":["arn:aws:s3:::%s/*"]
                      }]
                    }
                    """.formatted(bucket);
                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(bucket)
                                .config(policy)
                                .build());
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.error("Failed to init MinIO bucket {}: {}", bucket, e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file, String bucket, Long userId) {
        try {
            String extension = getExtension(file.getOriginalFilename());
            String objectKey = userId + "/" + UUID.randomUUID() + "." + extension;

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            return objectKey;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String bucket, String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .build());
        } catch (Exception e) {
            log.warn("Failed to delete MinIO object {}/{}: {}", bucket, objectKey, e.getMessage());
        }
    }

    public String buildPublicUrl(String bucket, String objectKey) {
        return endpoint + "/" + bucket + "/" + objectKey;
    }

    public String getEquipmentBucket() { return equipmentBucket; }
    public String getOperatorsBucket() { return operatorsBucket; }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}