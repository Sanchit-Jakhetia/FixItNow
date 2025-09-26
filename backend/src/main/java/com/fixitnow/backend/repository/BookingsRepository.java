package com.fixitnow.backend.repository;

import com.fixitnow.backend.model.Bookings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingsRepository extends JpaRepository<Bookings, Long> {
    List<Bookings> findByCustomerId(Long customerId);
    List<Bookings> findByProviderId(Long providerId);
}
