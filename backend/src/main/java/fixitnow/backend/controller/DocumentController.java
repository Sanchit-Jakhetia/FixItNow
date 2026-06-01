package fixitnow.backend.controller;

import fixitnow.backend.dto.DocumentDTO;
import fixitnow.backend.model.Document;
import fixitnow.backend.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // Provider uploads document
    @PreAuthorize("hasRole('PROVIDER')")
    @PostMapping("/upload/{providerId}")
    public ResponseEntity<Document> uploadDocument(
            @PathVariable Long providerId,
            @RequestParam("file") MultipartFile file) throws IOException {
        Document saved = documentService.uploadDocument(providerId, file);
        return ResponseEntity.ok(saved);
    }

    // Provider views their uploaded documents
    @PreAuthorize("hasRole('PROVIDER')")
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<List<Document>> getDocumentsByProvider(@PathVariable Long providerId) {
        System.out.println("Fetching documents for providerId: " + providerId);

        return ResponseEntity.ok(documentService.getDocumentsByProvider(providerId));
    }

    // Admin views all documents
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PROVIDER')")
    public ResponseEntity<List<DocumentDTO>> getAllDocuments() {
        List<Document> docs = documentService.getAllDocuments();

        List<DocumentDTO> dtos = docs.stream().map(d -> new DocumentDTO(
                d.getId(),
                d.getFileName(),
                d.getFileType(),
                d.getFileUrl(),
                d.getUploadedAt(),
                d.isApproved(),
                d.isRejected(),
                d.getRejectionReason(),
                d.getProvider() != null ? d.getProvider().getName() : "Unknown",
                d.getProvider() != null ? d.getProvider().getId() : null
        )).toList();

        return ResponseEntity.ok(dtos);
    }

    // Admin approves a document
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/approve/{id}")
    public ResponseEntity<Document> approveDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.approveDocument(id));
    }

    // Admin rejects a document with reason
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/reject/{id}")
    public ResponseEntity<Document> rejectDocument(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(documentService.rejectDocument(id, reason));
    }

    // Admin deletes a document
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok("Document deleted successfully");
    }
}

