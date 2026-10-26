package lk.careflow.service.lab;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.lab.EnterLabResultsRequest;
import lk.careflow.dto.lab.LabResultItemRequest;
import lk.careflow.dto.lab.LabResultResponse;
import lk.careflow.entity.lab.*;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.lab.LabRequestItemRepository;
import lk.careflow.repository.lab.LabRequestRepository;
import lk.careflow.repository.lab.LabResultRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabResultService {

    private final LabResultRepository labResultRepository;
    private final LabRequestItemRepository labRequestItemRepository;
    private final LabRequestRepository labRequestRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<LabResultResponse> getResultsByRequestItemId(Long requestItemId) {
        return labResultRepository.findByRequestItemId(requestItemId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LabResultResponse> getResultsByRequestId(Long requestId) {
        return labResultRepository.findByRequestId(requestId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<LabResultResponse> enterResults(
            EnterLabResultsRequest requestDto,
            User currentUser,
            HttpServletRequest httpRequest) {

        LabRequestItem item = labRequestItemRepository.findById(requestDto.getRequestItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Lab request item not found with id: " + requestDto.getRequestItemId()));

        LabRequest labRequest = item.getRequest();
        if (labRequest.getStatus() == LabRequestStatus.CANCELLED) {
            throw new BadRequestException("Cannot enter results for a cancelled lab request");
        }

        List<LabResult> existingResults = labResultRepository.findByRequestItemId(item.getId());
        if (!existingResults.isEmpty()) {
            labResultRepository.deleteAll(existingResults);
        }

        List<LabResult> savedResults = new ArrayList<>();
        for (LabResultItemRequest paramDto : requestDto.getResults()) {
            LabResult result = LabResult.builder()
                    .requestItem(item)
                    .parameterName(paramDto.getParameterName().trim())
                    .resultValue(paramDto.getResultValue().trim())
                    .referenceRange(paramDto.getReferenceRange())
                    .unit(paramDto.getUnit())
                    .flag(paramDto.getFlag() != null ? paramDto.getFlag() : ResultFlag.NORMAL)
                    .notes(paramDto.getNotes())
                    .enteredBy(currentUser)
                    .enteredAt(Instant.now())
                    .build();

            savedResults.add(labResultRepository.save(result));
        }

        // Update item status to COMPLETED
        item.setStatus(LabItemStatus.COMPLETED);
        labRequestItemRepository.save(item);

        // Check if all items in request are completed
        List<LabRequestItem> allItems = labRequestItemRepository.findByRequestId(labRequest.getId());
        boolean allCompleted = allItems.stream().allMatch(i -> i.getStatus() == LabItemStatus.COMPLETED || i.getStatus() == LabItemStatus.CANCELLED);

        if (allCompleted) {
            labRequest.setStatus(LabRequestStatus.COMPLETED);
        } else {
            labRequest.setStatus(LabRequestStatus.IN_PROGRESS);
        }
        labRequestRepository.save(labRequest);

        auditLogService.log(
                currentUser,
                "ENTER_LAB_RESULTS",
                "LabRequestItem",
                item.getId().toString(),
                "Entered " + savedResults.size() + " test parameter results for " + item.getLabTest().getTestName() + " (Request: " + labRequest.getRequestNumber() + ")",
                httpRequest
        );

        return savedResults.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public LabResultResponse mapToResponse(LabResult res) {
        return LabResultResponse.builder()
                .id(res.getId())
                .requestItemId(res.getRequestItem().getId())
                .parameterName(res.getParameterName())
                .resultValue(res.getResultValue())
                .referenceRange(res.getReferenceRange())
                .unit(res.getUnit())
                .flag(res.getFlag())
                .notes(res.getNotes())
                .enteredByName(res.getEnteredBy() != null ? res.getEnteredBy().getFirstName() + " " + res.getEnteredBy().getLastName() : "Staff")
                .enteredAt(res.getEnteredAt())
                .build();
    }
}
