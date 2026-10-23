package lk.careflow.service.patient;

import jakarta.annotation.PostConstruct;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${careflow.upload.dir:./uploads/patient-documents}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        if (rawOriginalFilename == null || rawOriginalFilename.trim().isEmpty()) {
            rawOriginalFilename = "document";
        }

        String originalFilename = StringUtils.cleanPath(rawOriginalFilename);

        if (originalFilename.contains("..")) {
            throw new BadRequestException("Filename contains invalid path sequence: " + originalFilename);
        }

        String sanitizedFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String uniqueFileName = UUID.randomUUID() + "_" + sanitizedFilename;

        try {
            Path targetDir = this.fileStorageLocation;
            if (subFolder != null && !subFolder.trim().isEmpty()) {
                String cleanSubFolder = StringUtils.cleanPath(subFolder);
                if (cleanSubFolder.contains("..")) {
                    throw new BadRequestException("Subfolder contains invalid path sequence: " + subFolder);
                }
                targetDir = targetDir.resolve(cleanSubFolder).normalize();
                Files.createDirectories(targetDir);
            }

            Path targetLocation = targetDir.resolve(uniqueFileName).normalize();

            // Verify security constraint: targetLocation must be inside fileStorageLocation
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new BadRequestException("Cannot store file outside current storage directory.");
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return (subFolder != null && !subFolder.trim().isEmpty())
                    ? subFolder + "/" + uniqueFileName
                    : uniqueFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String relativeFilePath) {
        try {
            Path filePath = this.fileStorageLocation.resolve(StringUtils.cleanPath(relativeFilePath)).normalize();

            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new BadRequestException("Invalid file path request.");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found or not readable: " + relativeFilePath);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found: " + relativeFilePath);
        }
    }

    public boolean deleteFile(String relativeFilePath) {
        if (relativeFilePath == null || relativeFilePath.trim().isEmpty()) {
            return false;
        }
        try {
            Path filePath = this.fileStorageLocation.resolve(StringUtils.cleanPath(relativeFilePath)).normalize();
            if (filePath.startsWith(this.fileStorageLocation)) {
                return Files.deleteIfExists(filePath);
            }
            return false;
        } catch (IOException e) {
            return false;
        }
    }
}
