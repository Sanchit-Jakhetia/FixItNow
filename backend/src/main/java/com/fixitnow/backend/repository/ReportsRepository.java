package com.fixitnow.backend.repository;

import com.fixitnow.backend.model.Reports;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportsRepository extends JpaRepository<Reports, Long> {
    List<Reports> findByReportedBy(Long reportedBy);
}
