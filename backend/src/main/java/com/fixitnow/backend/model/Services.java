package com.fixitnow.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "services")
public class Services {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(nullable = false)
    private String category;

    private String subcategory;

    private String description;

    private BigDecimal price;

    @Column(columnDefinition = "json")
    private String availability; // store JSON as String

    private String location;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public Services() {}

    public Services(Long id, Long providerId, String category, String subcategory, String description,
                    BigDecimal price, String availability, String location, LocalDateTime createdAt) {
        this.id = id;
        this.providerId = providerId;
        this.category = category;
        this.subcategory = subcategory;
        this.description = description;
        this.price = price;
        this.availability = availability;
        this.location = location;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProviderId() { return providerId; }
    public void setProviderId(Long providerId) { this.providerId = providerId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
