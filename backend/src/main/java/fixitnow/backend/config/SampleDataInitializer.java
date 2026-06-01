package fixitnow.backend.config;

import fixitnow.backend.enums.Role;
import fixitnow.backend.enums.BookingStatus;
import fixitnow.backend.model.ServiceProvider;
import fixitnow.backend.model.User;
import fixitnow.backend.model.Booking;
import fixitnow.backend.model.Review;
import fixitnow.backend.repository.ServiceRepository;
import fixitnow.backend.repository.UserRepository;
import fixitnow.backend.repository.BookingRepository;
import fixitnow.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.sample-data", havingValue = "true")
public class SampleDataInitializer implements CommandLineRunner {

    private static final int CUSTOMER_COUNT = 34;
    private static final int PROVIDER_COUNT = 16;
    private static final int SERVICES_PER_PROVIDER = 2;

    private static final List<String> LOCATIONS = List.of(
            "Mumbai",
            "Delhi",
            "Bengaluru",
            "Hyderabad",
            "Chennai",
            "Pune",
            "Ahmedabad",
            "Kolkata"
    );

    private static final List<Map<String, String>> SERVICE_TEMPLATES = List.of(
            Map.of("category", "Electrician", "subcategory", "Wiring", "description", "Residential wiring, repairs, and small electrical installations."),
            Map.of("category", "Plumber", "subcategory", "Leak Fix", "description", "Pipe repairs, faucet fixes, and drainage support."),
            Map.of("category", "Cleaning", "subcategory", "Deep Cleaning", "description", "Home and office deep cleaning services."),
            Map.of("category", "AC Repair", "subcategory", "Cooling Service", "description", "Air conditioner servicing, repair, and maintenance."),
            Map.of("category", "Painting", "subcategory", "Interior Paint", "description", "Wall painting and touch-up work for homes."),
            Map.of("category", "Carpentry", "subcategory", "Furniture Repair", "description", "Furniture assembly, repair, and custom fixes."),
            Map.of("category", "Appliance Repair", "subcategory", "Home Appliances", "description", "Repair and maintenance for major appliances."),
            Map.of("category", "Pest Control", "subcategory", "Home Treatment", "description", "General pest control and preventive treatment.")
    );

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.sample-data-password}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        int createdUsers = 0;
        int createdServices = 0;
        int createdBookings = 0;
        int createdReviews = 0;

        createdUsers += seedUsers(Role.CUSTOMER, CUSTOMER_COUNT, "customer");
        createdUsers += seedUsers(Role.PROVIDER, PROVIDER_COUNT, "provider");
        createdServices += seedServices();
        createdBookings += seedBookings();
        createdReviews += seedReviews();

        if (createdUsers > 0 || createdServices > 0 || createdBookings > 0 || createdReviews > 0) {
            System.out.println(
                    "Seeded " + createdUsers + " users, " + createdServices + " services, "
                    + createdBookings + " bookings, " + createdReviews + " reviews."
            );
        } else {
            System.out.println("Sample data already exists; skipping seed.");
        }
    }

    private int seedUsers(Role role, int count, String prefix) {
        int created = 0;

        for (int index = 1; index <= count; index++) {
            String email = String.format("sample.%s%02d@example.com", prefix, index);

            if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
                continue;
            }

            User user = new User();
            user.setName((role == Role.CUSTOMER ? "Customer " : "Provider ") + String.format("%02d", index));
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(defaultPassword));
            user.setRole(role);
            user.setLocation(LOCATIONS.get((index - 1) % LOCATIONS.size()));
            user.setVerified(role == Role.PROVIDER);

            userRepository.save(user);
            created++;
        }

        return created;
    }

    private int seedServices() {
        int created = 0;
        List<User> providers = userRepository.findByRole(Role.PROVIDER);
        providers.sort(Comparator.comparing(User::getEmail, String.CASE_INSENSITIVE_ORDER));

        for (int providerIndex = 0; providerIndex < providers.size(); providerIndex++) {
            User provider = providers.get(providerIndex);
            List<ServiceProvider> existingServices = serviceRepository.findByProviderId(provider.getId());

            for (int slot = 0; slot < SERVICES_PER_PROVIDER; slot++) {
                int templateIndex = (providerIndex * SERVICES_PER_PROVIDER + slot) % SERVICE_TEMPLATES.size();
                Map<String, String> template = SERVICE_TEMPLATES.get(templateIndex);
                String generatedSubcategory = template.get("subcategory") + " " + String.format("%02d", providerIndex + 1) + "-" + (slot + 1);

                boolean alreadyExists = existingServices.stream().anyMatch(service ->
                        template.get("category").equalsIgnoreCase(service.getCategory())
                                && generatedSubcategory.equalsIgnoreCase(String.valueOf(service.getSubcategory()))
                );

                if (alreadyExists) {
                    continue;
                }

                ServiceProvider service = ServiceProvider.builder()
                        .provider(provider)
                        .category(template.get("category"))
                    .subcategory(generatedSubcategory)
                        .description(template.get("description"))
                        .price(BigDecimal.valueOf(499 + (providerIndex * 75L) + (slot * 50L)))
                        .availability("Mon-Sat, 9:00 AM - 6:00 PM")
                        .location(provider.getLocation())
                        .build();

                serviceRepository.save(service);
                created++;
            }
        }

        return created;
    }

    private int seedBookings() {
        int created = 0;
        List<User> customers = userRepository.findByRole(Role.CUSTOMER);
        List<ServiceProvider> allServices = serviceRepository.findAll();

        if (customers.isEmpty() || allServices.isEmpty()) {
            return 0;
        }

        customers.sort(Comparator.comparing(User::getEmail, String.CASE_INSENSITIVE_ORDER));

        String[] timeSlots = {"9:00 AM - 12:00 PM", "1:00 PM - 4:00 PM", "4:00 PM - 7:00 PM"};

        for (int customerIndex = 0; customerIndex < customers.size(); customerIndex++) {
            User customer = customers.get(customerIndex);

            // Create 3 bookings per customer with mixed statuses
            for (int bookingSlot = 0; bookingSlot < 3; bookingSlot++) {
                int serviceIndex = (customerIndex * 3 + bookingSlot) % allServices.size();
                ServiceProvider service = allServices.get(serviceIndex);
                User provider = service.getProvider();

                // Deterministic status: PENDING(0), CONFIRMED(1), COMPLETED(2), CANCELLED(3)
                int statusCode = (customerIndex * 3 + bookingSlot) % 4;
                BookingStatus status = BookingStatus.values()[statusCode];

                // Spread booking dates across last 30 days
                LocalDate bookingDate = LocalDate.now().minusDays(30 - ((customerIndex * 3 + bookingSlot) % 30));

                // Check if booking already exists
                List<Booking> existingBookings = bookingRepository.findByCustomer(customer);
                boolean alreadyExists = existingBookings.stream().anyMatch(b ->
                        b.getService().getId().equals(service.getId())
                                && b.getBookingDate().equals(bookingDate)
                );

                if (alreadyExists) {
                    continue;
                }

                Booking booking = Booking.builder()
                        .service(service)
                        .customer(customer)
                        .provider(provider)
                        .bookingDate(bookingDate)
                        .timeSlot(timeSlots[bookingSlot % timeSlots.length])
                        .status(status)
                        .providerMarkedComplete(status == BookingStatus.COMPLETED)
                        .customerVerified(status == BookingStatus.COMPLETED)
                        .createdAt(LocalDateTime.now().minusDays(30 - ((customerIndex * 3 + bookingSlot) % 30)))
                        .build();

                bookingRepository.save(booking);
                created++;
            }
        }

        return created;
    }

    private int seedReviews() {
        int created = 0;
        List<Booking> completedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .toList();

        String[] comments = {
            "Excellent work! Very professional and punctual.",
            "Great service, would definitely book again!",
            "Outstanding quality of work, highly satisfied.",
            "Very experienced and efficient professional.",
            "Highly recommended, will use again soon."
        };

        for (int index = 0; index < completedBookings.size(); index++) {
            Booking booking = completedBookings.get(index);

            // Check if review already exists
            if (reviewRepository.existsByBookingId(booking.getId())) {
                continue;
            }

            int ratingIndex = index % 2;
            int rating = ratingIndex == 0 ? 5 : 4;
            String comment = comments[index % comments.length];

            Review review = Review.builder()
                    .booking(booking)
                    .customer(booking.getCustomer())
                    .provider(booking.getProvider())
                    .service(booking.getService())
                    .rating(rating)
                    .comment(comment)
                    .createdAt(booking.getCreatedAt().plusDays(2))
                    .build();

            reviewRepository.save(review);
            created++;
        }

        return created;
    }
}