package com.fixitnow.backend.controller;

import com.fixitnow.backend.model.*;
import com.fixitnow.backend.repository.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TestController {

    private final UsersRepository usersRepository;
    private final ServicesRepository servicesRepository;
    private final BookingsRepository bookingsRepository;
    private final ReviewsRepository reviewsRepository;
    private final MessagesRepository messagesRepository;
    private final ReportsRepository reportsRepository;
    private final AdminLogsRepository adminLogsRepository;

    public TestController(
            UsersRepository usersRepository,
            ServicesRepository servicesRepository,
            BookingsRepository bookingsRepository,
            ReviewsRepository reviewsRepository,
            MessagesRepository messagesRepository,
            ReportsRepository reportsRepository,
            AdminLogsRepository adminLogsRepository
    ) {
        this.usersRepository = usersRepository;
        this.servicesRepository = servicesRepository;
        this.bookingsRepository = bookingsRepository;
        this.reviewsRepository = reviewsRepository;
        this.messagesRepository = messagesRepository;
        this.reportsRepository = reportsRepository;
        this.adminLogsRepository = adminLogsRepository;
    }

    @GetMapping("/test/users")
    public List<Users> getAllUsers() {
        return usersRepository.findAll();
    }

    @GetMapping("/test/services")
    public List<Services> getAllServices() {
        return servicesRepository.findAll();
    }

    @GetMapping("/test/bookings")
    public List<Bookings> getAllBookings() {
        return bookingsRepository.findAll();
    }

    @GetMapping("/test/reviews")
    public List<Reviews> getAllReviews() {
        return reviewsRepository.findAll();
    }

    @GetMapping("/test/messages")
    public List<Messages> getAllMessages() {
        return messagesRepository.findAll();
    }

    @GetMapping("/test/reports")
    public List<Reports> getAllReports() {
        return reportsRepository.findAll();
    }

    @GetMapping("/test/adminlogs")
    public List<AdminLogs> getAllAdminLogs() {
        return adminLogsRepository.findAll();
    }

    @GetMapping("/test/hello")
    public String hello() {
        return "FixItNow backend is running!";
    }
}
