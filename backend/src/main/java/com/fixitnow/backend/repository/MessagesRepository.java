package com.fixitnow.backend.repository;

import com.fixitnow.backend.model.Messages;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessagesRepository extends JpaRepository<Messages, Long> {
    List<Messages> findBySenderIdOrReceiverId(Long senderId, Long receiverId);
}
