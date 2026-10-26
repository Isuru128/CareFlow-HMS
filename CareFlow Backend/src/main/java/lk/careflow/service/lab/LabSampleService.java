package lk.careflow.service.lab;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.lab.CollectSampleRequest;
import lk.careflow.dto.lab.LabSampleResponse;
import lk.careflow.dto.lab.UpdateSampleStatusRequest;
import lk.careflow.entity.lab.*;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.lab.LabRequestItemRepository;
import lk.careflow.repository.lab.LabRequestRepository;
import lk.careflow.repository.lab.LabSampleRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabSampleService {

    private final LabSampleRepository labSampleRepository;
    private final LabRequestRepository labRequestRepository;
    private final LabRequestItemRepository labRequestItemRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public Page<LabSampleResponse> searchSamples(String query, SampleStatus status, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return labSampleRepository.searchSamples(cleanQuery, status, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<LabSampleResponse> getSamplesByRequestId(Long requestId) {
        return labSampleRepository.findByRequestId(requestId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LabSampleResponse getSampleById(Long id) {
        LabSample sample = labSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab sample not found with id: " + id));
        return mapToResponse(sample);
    }

    @Transactional(readOnly = true)
    public LabSampleResponse getSampleByBarcode(String barcode) {
        LabSample sample = labSampleRepository.findBySampleBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Lab sample not found with barcode: " + barcode));
        return mapToResponse(sample);
    }

    @Transactional
    public LabSampleResponse collectSample(
            CollectSampleRequest requestDto,
            User currentUser,
            HttpServletRequest httpRequest) {

        LabRequest labRequest = labRequestRepository.findById(requestDto.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with id: " + requestDto.getRequestId()));

        if (labRequest.getStatus() == LabRequestStatus.CANCELLED) {
            throw new BadRequestException("Cannot collect sample for cancelled lab request");
        }

        String barcode = generateBarcode();

        LabSample sample = LabSample.builder()
                .sampleBarcode(barcode)
                .request(labRequest)
                .sampleType(requestDto.getSampleType())
                .collectedAt(Instant.now())
                .collectedBy(currentUser)
                .collectionSite(requestDto.getCollectionSite())
                .status(SampleStatus.COLLECTED)
                .notes(requestDto.getNotes())
                .build();

        LabSample saved = labSampleRepository.save(sample);

        // Update request status if currently REQUESTED
        if (labRequest.getStatus() == LabRequestStatus.REQUESTED) {
            labRequest.setStatus(LabRequestStatus.SAMPLE_COLLECTED);
            labRequestRepository.save(labRequest);
        }

        // Update pending items matching this sample type or all pending items
        List<LabRequestItem> items = labRequestItemRepository.findByRequestId(labRequest.getId());
        for (LabRequestItem item : items) {
            if (item.getStatus() == LabItemStatus.PENDING) {
                item.setStatus(LabItemStatus.SAMPLE_COLLECTED);
                labRequestItemRepository.save(item);
            }
        }

        auditLogService.log(
                currentUser,
                "COLLECT_LAB_SAMPLE",
                "LabSample",
                saved.getId().toString(),
                "Collected " + saved.getSampleType() + " sample barcode " + saved.getSampleBarcode() + " for request " + labRequest.getRequestNumber(),
                httpRequest
        );

        return mapToResponse(saved);
    }

    @Transactional
    public LabSampleResponse updateSampleStatus(
            Long id,
            UpdateSampleStatusRequest requestDto,
            User currentUser,
            HttpServletRequest httpRequest) {

        LabSample sample = labSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab sample not found with id: " + id));

        sample.setStatus(requestDto.getStatus());
        if (requestDto.getRejectionReason() != null) {
            sample.setRejectionReason(requestDto.getRejectionReason());
        }
        if (requestDto.getNotes() != null) {
            sample.setNotes(requestDto.getNotes());
        }

        LabSample updated = labSampleRepository.save(sample);

        // If sample status moved to PROCESSING, update request status to IN_PROGRESS
        if (requestDto.getStatus() == SampleStatus.PROCESSING || requestDto.getStatus() == SampleStatus.RECEIVED_IN_LAB) {
            LabRequest labReq = sample.getRequest();
            if (labReq.getStatus() == LabRequestStatus.SAMPLE_COLLECTED || labReq.getStatus() == LabRequestStatus.REQUESTED) {
                labReq.setStatus(LabRequestStatus.IN_PROGRESS);
                labRequestRepository.save(labReq);
            }
        }

        auditLogService.log(
                currentUser,
                "UPDATE_SAMPLE_STATUS",
                "LabSample",
                updated.getId().toString(),
                "Updated sample " + updated.getSampleBarcode() + " status to " + updated.getStatus(),
                httpRequest
        );

        return mapToResponse(updated);
    }

    private String generateBarcode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String candidate;
        do {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
            candidate = "SMP-" + datePart + "-" + randomNum;
        } while (labSampleRepository.existsBySampleBarcode(candidate));
        return candidate;
    }

    public LabSampleResponse mapToResponse(LabSample sample) {
        LabRequest req = sample.getRequest();
        return LabSampleResponse.builder()
                .id(sample.getId())
                .sampleBarcode(sample.getSampleBarcode())
                .requestId(req != null ? req.getId() : null)
                .requestNumber(req != null ? req.getRequestNumber() : null)
                .sampleType(sample.getSampleType())
                .collectedAt(sample.getCollectedAt())
                .collectedByName(sample.getCollectedBy() != null ? sample.getCollectedBy().getFirstName() + " " + sample.getCollectedBy().getLastName() : "Staff")
                .collectionSite(sample.getCollectionSite())
                .status(sample.getStatus())
                .rejectionReason(sample.getRejectionReason())
                .notes(sample.getNotes())
                .build();
    }
}
