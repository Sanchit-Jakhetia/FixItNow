package com.fixitnow.backend.repository;

import com.fixitnow.backend.model.Services;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServicesRepository extends JpaRepository<Services, Long> {
    List<Services> findByCategory(String category);
    List<Services> findByProviderId(Long providerId);
}
