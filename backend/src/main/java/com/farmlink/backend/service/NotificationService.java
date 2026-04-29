package com.farmlink.backend.service;

import com.farmlink.backend.entity.Notification;
import com.farmlink.backend.enums.HistoryType;
import com.farmlink.backend.repository.NotificationRepository;
import com.farmlink.backend.util.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EntityManager entityManager;

    public List<Notification> getMyNotifications() {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                SecurityUtils.getCurrentUserId());
    }

    public long getUnreadCount() {
        return notificationRepository.countByRecipientIdAndIsReadFalse(
                SecurityUtils.getCurrentUserId());
    }

    @Transactional
    public void markRead(Long notificationId) {
        entityManager.createNativeQuery(
                "UPDATE notifications SET is_read = true WHERE id = :id AND recipient_id = :userId")
                .setParameter("id", notificationId)
                .setParameter("userId", SecurityUtils.getCurrentUserId())
                .executeUpdate();
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.markAllRead(SecurityUtils.getCurrentUserId());
    }
}