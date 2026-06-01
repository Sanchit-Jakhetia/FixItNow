package fixitnow.backend.repository;


import fixitnow.backend.model.Document;
import fixitnow.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByProvider(User provider);
    void deleteByProviderId(Long providerId);
}

