package com.fixitnow.backend.repository;

import com.fixitnow.backend.model.AdminLogs;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminLogsRepository extends JpaRepository<AdminLogs, Long> {
}
