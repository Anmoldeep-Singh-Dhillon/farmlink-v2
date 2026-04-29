package com.farmlink.backend.repository;

import com.farmlink.backend.entity.BookingHistory;
import com.farmlink.backend.enums.HistoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingHistoryRepository extends JpaRepository<BookingHistory, Long> {

    List<BookingHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<BookingHistory> findByUserIdAndHistoryTypeOrderByCreatedAtDesc(
            Long userId, HistoryType historyType);
}