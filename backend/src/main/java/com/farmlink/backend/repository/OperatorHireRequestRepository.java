package com.farmlink.backend.repository;

import com.farmlink.backend.entity.OperatorHireRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OperatorHireRequestRepository extends JpaRepository<OperatorHireRequest, Long> {

    @Query("SELECT r FROM OperatorHireRequest r " +
           "JOIN FETCH r.requester " +
           "WHERE r.operator.user.id = :userId " +
           "ORDER BY r.requestedAt DESC")
    List<OperatorHireRequest> findReceivedByOperatorUserId(@Param("userId") Long userId);

    List<OperatorHireRequest> findByRequesterIdOrderByRequestedAtDesc(Long requesterId);

    @Modifying
    @Query("UPDATE OperatorHireRequest r SET r.status = 'REJECTED', r.respondedAt = CURRENT_TIMESTAMP " +
       "WHERE r.operator.id = :operatorId AND r.status = 'PENDING' AND r.id <> :acceptedId")
    int rejectOtherRequests(@Param("operatorId") Long operatorId, @Param("acceptedId") Long acceptedId);
}