# FixItNow Backend

This is the backend for the **FixItNow** application, built with **Spring Boot**, **Spring Data JPA**, **Spring Security**, and **MySQL**.

---

## Table of Contents

1. [Project Structure](#project-structure)  
2. [Requirements](#requirements)  
3. [Setup](#setup)  
4. [Database Configuration](#database-configuration)  
5. [Running the Application](#running-the-application)  
6. [API Endpoints](#api-endpoints)  
7. [Entities & Repositories](#entities--repositories)  
8. [Development Notes](#development-notes)  

---

## Project Structure

backend/
│
├── src/main/java/com/fixitnow/backend/
│   ├── model/          # Entity classes (Users, Services, Bookings, Reviews, Messages, Reports, AdminLogs)
│   ├── repository/     # Spring Data JPA repositories
│   ├── controller/     # REST controllers
│   └── BackendApplication.java  # Main Spring Boot application
│
├── src/main/resources/
│   ├── application.properties   # Application configuration
│
├── pom.xml             # Maven dependencies
└── README.md           # Project documentation

---

## Requirements

- Java 24+
- Maven
- MySQL 8+
- IntelliJ IDEA (recommended)
- Optional: Postman or browser for testing APIs

---

## Setup

1. Clone the repository:

```
git clone https://github.com/yourusername/FixItNow.git
cd FixItNow/backend
````

2. Build the project using Maven:

```
mvn clean install
```

3. Make sure MySQL server is running.

---

## Database Configuration

Edit `src/main/resources/application.properties` with your MySQL credentials:

```
spring.datasource.url=jdbc:mysql://localhost:3306/fixitnow
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

> `ddl-auto=update` allows Hibernate to automatically create/update tables from entity definitions.

---

## Running the Application

From the backend folder:

```
mvn spring-boot:run
```

* Backend runs on default port `8080`.
* Check if it’s running by visiting:

```
http://localhost:8080/test/hello
```

---

## API Endpoints (Test Controller)

You can quickly inspect table data using the test endpoints:

| Endpoint        | Method | Description                |
| --------------- | ------ | -------------------------- |
| /test/hello     | GET    | Test if backend is running |
| /test/users     | GET    | Returns all users          |
| /test/services  | GET    | Returns all services       |
| /test/bookings  | GET    | Returns all bookings       |
| /test/reviews   | GET    | Returns all reviews        |
| /test/messages  | GET    | Returns all messages       |
| /test/reports   | GET    | Returns all reports        |
| /test/adminlogs | GET    | Returns all admin logs     |

> Each endpoint returns JSON arrays of the respective table data.

---

## Entities & Repositories

* **Users** → `UsersRepository`
* **Services** → `ServicesRepository`
* **Bookings** → `BookingsRepository`
* **Reviews** → `ReviewsRepository`
* **Messages** → `MessagesRepository`
* **Reports** → `ReportsRepository`
* **AdminLogs** → `AdminLogsRepository`

**Note:** All entities use explicit getters and setters (no Lombok) for clarity.

---

## Development Notes

* All ManyToOne relationships can be mapped either as **object references** (`Users reportedBy`) or **IDs only** (`Long reportedBy`). Using IDs simplifies JSON output for API testing.
* You can extend the `TestController` to add filters, sorting, or joins for more complex queries.
* Security is enabled by default. For development, Spring Boot generates a random password in the console. Update your security config for production.
* Use Postman or browser to explore endpoints.

---

## Next Steps

* Implement full CRUD endpoints for each entity.
* Add services layer for business logic.
* Implement JWT-based authentication and role-based access control.
* Connect frontend (React) to these endpoints.

---

> Track completed: Backend setup, entities, repositories, test endpoints.

```
