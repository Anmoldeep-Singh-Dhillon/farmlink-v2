package com.farmlink.backend.service;

import com.farmlink.backend.entity.BookingHistory;
import com.farmlink.backend.enums.HistoryType;
import com.farmlink.backend.repository.BookingHistoryRepository;
import com.farmlink.backend.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final BookingHistoryRepository historyRepository;

    public List<BookingHistory> getMyHistory() {
        return historyRepository.findByUserIdOrderByCreatedAtDesc(
                SecurityUtils.getCurrentUserId());
    }

    public List<BookingHistory> getHistoryByType(HistoryType type) {
        return historyRepository.findByUserIdAndHistoryTypeOrderByCreatedAtDesc(
                SecurityUtils.getCurrentUserId(), type);
    }
}