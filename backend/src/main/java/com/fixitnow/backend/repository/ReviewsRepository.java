package com.fixitnow.backend.repository;

import com.fixitnow.backend.model.Reviews;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewsRepository extends JpaRepository<Reviews, Long> {
    List<Reviews> findByProviderId(Long providerId);
}
