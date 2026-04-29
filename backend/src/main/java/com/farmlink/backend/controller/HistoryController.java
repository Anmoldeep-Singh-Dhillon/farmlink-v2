package com.farmlink.backend.controller;

import com.farmlink.backend.entity.BookingHistory;
import com.farmlink.backend.enums.HistoryType;
import com.farmlink.backend.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<List<BookingHistory>> getMyHistory() {
        return ResponseEntity.ok(historyService.getMyHistory());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<BookingHistory>> getHistoryByType(
            @RequestParam HistoryType type) {
        return ResponseEntity.ok(historyService.getHistoryByType(type));
    }
}