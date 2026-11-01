package lk.careflow.service.billing;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.billing.*;
import lk.careflow.entity.appointment.Appointment;
import lk.careflow.entity.appointment.AppointmentStatus;
import lk.careflow.entity.billing.*;
import lk.careflow.entity.lab.LabRequest;
import lk.careflow.entity.lab.LabRequestItem;
import lk.careflow.entity.lab.LabRequestStatus;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.pharmacy.DispensationStatus;
import lk.careflow.entity.pharmacy.PaymentStatus;
import lk.careflow.entity.pharmacy.PharmacyDispensation;
import lk.careflow.entity.user.User;
import lk.careflow.exception.BadRequestException;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.billing.*;
import lk.careflow.repository.lab.LabRequestRepository;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.repository.pharmacy.PharmacyDispensationRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingInvoiceRepository invoiceRepository;
    private final BillingInvoiceItemRepository invoiceItemRepository;
    private final BillingPaymentRepository paymentRepository;
    private final AdmissionRepository admissionRepository;
    private final AdmissionService admissionService;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final LabRequestRepository labRequestRepository;
    private final PharmacyDispensationRepository dispensationRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public BillingDashboardStatsDto getDashboardStats() {
        LocalDate today = LocalDate.now();
        Instant startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        long totalInvoices = invoiceRepository.count();
        long issuedCount = invoiceRepository.countByStatus(InvoiceStatus.ISSUED);
        long paidCount = invoiceRepository.countByStatus(InvoiceStatus.PAID);
        long partiallyPaidCount = invoiceRepository.countByStatus(InvoiceStatus.PARTIALLY_PAID);
        long overdueCount = invoiceRepository.countByStatus(InvoiceStatus.OVERDUE);
        long activeAdmissions = admissionRepository.countByStatus(AdmissionStatus.ADMITTED);

        BigDecimal totalBilled = invoiceRepository.sumTotalBilledAmount();
        BigDecimal totalCollected = invoiceRepository.sumTotalCollectedAmount();
        BigDecimal outstanding = invoiceRepository.sumOutstandingReceivables();
        BigDecimal todayCollections = paymentRepository.sumTodayCollections(startOfDay, endOfDay);
        long todayPaymentsCount = paymentRepository.countTodayPayments(startOfDay, endOfDay);

        BigDecimal consultationRev = invoiceItemRepository.sumRevenueByChargeType(ChargeType.CONSULTATION);
        BigDecimal labRev = invoiceItemRepository.sumRevenueByChargeType(ChargeType.LABORATORY);
        BigDecimal pharmacyRev = invoiceItemRepository.sumRevenueByChargeType(ChargeType.PHARMACY);
        BigDecimal admissionRev = invoiceItemRepository.sumRevenueByChargeType(ChargeType.ADMISSION);
        BigDecimal procedureRev = invoiceItemRepository.sumRevenueByChargeType(ChargeType.PROCEDURE);
        BigDecimal otherRev = invoiceItemRepository.sumRevenueByChargeType(ChargeType.OTHER);

        return BillingDashboardStatsDto.builder()
                .totalInvoices(totalInvoices)
                .issuedInvoicesCount(issuedCount)
                .paidInvoicesCount(paidCount)
                .partiallyPaidCount(partiallyPaidCount)
                .overdueInvoicesCount(overdueCount)
                .activeAdmissionsCount(activeAdmissions)
                .totalBilledAmount(totalBilled != null ? totalBilled : BigDecimal.ZERO)
                .totalCollectedAmount(totalCollected != null ? totalCollected : BigDecimal.ZERO)
                .outstandingReceivables(outstanding != null ? outstanding : BigDecimal.ZERO)
                .todayCollections(todayCollections != null ? todayCollections : BigDecimal.ZERO)
                .todayPaymentsCount(todayPaymentsCount)
                .consultationRevenue(consultationRev != null ? consultationRev : BigDecimal.ZERO)
                .laboratoryRevenue(labRev != null ? labRev : BigDecimal.ZERO)
                .pharmacyRevenue(pharmacyRev != null ? pharmacyRev : BigDecimal.ZERO)
                .admissionRevenue(admissionRev != null ? admissionRev : BigDecimal.ZERO)
                .otherRevenue((procedureRev != null ? procedureRev : BigDecimal.ZERO).add(otherRev != null ? otherRev : BigDecimal.ZERO))
                .build();
    }

    @Transactional(readOnly = true)
    public Page<BillingInvoiceDto> searchInvoices(
            String query,
            Long patientId,
            InvoiceStatus status,
            Pageable pageable) {
        return invoiceRepository.searchInvoices(query, patientId, status, pageable)
                .map(this::mapToInvoiceDto);
    }

    @Transactional(readOnly = true)
    public BillingInvoiceDto getInvoiceById(Long id) {
        BillingInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BillingInvoice", "id", id));
        return mapToInvoiceDto(invoice);
    }

    @Transactional(readOnly = true)
    public BillingInvoiceDto getInvoiceByNumber(String invoiceNumber) {
        BillingInvoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("BillingInvoice", "invoiceNumber", invoiceNumber));
        return mapToInvoiceDto(invoice);
    }

    @Transactional(readOnly = true)
    public List<BillingInvoiceDto> getPatientInvoices(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByIssueDateDesc(patientId).stream()
                .map(this::mapToInvoiceDto)
                .collect(Collectors.toList());
    }

    /**
     * Discovers all hospital charges for a patient across:
     * 1. Consultation Charges (Appointments)
     * 2. Laboratory Charges (Lab Requests & Test Items)
     * 3. Pharmacy Charges (Dispensations)
     * 4. Admission Charges (Inpatient Ward/Room Stays)
     * Marks whether each reference code has already been billed on an active invoice.
     */
    @Transactional(readOnly = true)
    public List<PatientBillableChargeDto> getPatientBillableCharges(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient", "id", patientId);
        }

        Set<String> billedCodes = new HashSet<>(invoiceItemRepository.findBilledReferenceCodesByPatientId(patientId));
        List<PatientBillableChargeDto> charges = new ArrayList<>();

        // 1. Consultation Charges from Appointments
        List<Appointment> appointments = appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId);
        for (Appointment apt : appointments) {
            if (apt.getStatus() == AppointmentStatus.CANCELLED) continue;
            BigDecimal fee = apt.getConsultationFee() != null
                    ? apt.getConsultationFee()
                    : (apt.getDoctor() != null && apt.getDoctor().getConsultationFee() != null
                        ? apt.getDoctor().getConsultationFee()
                        : new BigDecimal("2500.00"));
            String doctorTitle = apt.getDoctor() != null
                    ? "Dr. " + apt.getDoctor().getFirstName() + " " + apt.getDoctor().getLastName() + " (" + apt.getDoctor().getSpecialization() + ")"
                    : "Medical Specialist";

            charges.add(PatientBillableChargeDto.builder()
                    .chargeType(ChargeType.CONSULTATION)
                    .referenceType("APPOINTMENT")
                    .referenceId(apt.getId())
                    .referenceCode(apt.getAppointmentNumber())
                    .description("Consultation (" + apt.getAppointmentType() + ") - " + doctorTitle)
                    .serviceDate(apt.getAppointmentDate())
                    .quantity(1)
                    .unitPrice(fee)
                    .subtotal(fee)
                    .alreadyBilled(billedCodes.contains(apt.getAppointmentNumber()))
                    .build());
        }

        // 2. Laboratory Charges from Lab Requests
        List<LabRequest> labRequests = labRequestRepository.findByPatientIdOrderByRequestedAtDesc(patientId);
        for (LabRequest lr : labRequests) {
            if (lr.getStatus() == LabRequestStatus.CANCELLED) continue;
            BigDecimal totalLabPrice = BigDecimal.ZERO;
            List<String> testNames = new ArrayList<>();
            if (lr.getItems() != null) {
                for (LabRequestItem item : lr.getItems()) {
                    if (item.getLabTest() != null) {
                        BigDecimal price = item.getLabTest().getPrice() != null ? item.getLabTest().getPrice() : BigDecimal.ZERO;
                        totalLabPrice = totalLabPrice.add(price);
                        testNames.add(item.getLabTest().getTestName());
                    }
                }
            }
            if (totalLabPrice.compareTo(BigDecimal.ZERO) > 0) {
                LocalDate reqDate = lr.getRequestedAt() != null
                        ? lr.getRequestedAt().atZone(ZoneId.systemDefault()).toLocalDate()
                        : LocalDate.now();
                String summary = String.join(", ", testNames);
                if (summary.length() > 160) {
                    summary = summary.substring(0, 157) + "...";
                }
                charges.add(PatientBillableChargeDto.builder()
                        .chargeType(ChargeType.LABORATORY)
                        .referenceType("LAB_REQUEST")
                        .referenceId(lr.getId())
                        .referenceCode(lr.getRequestNumber())
                        .description("Laboratory Diagnostics (" + lr.getRequestNumber() + "): " + summary)
                        .serviceDate(reqDate)
                        .quantity(1)
                        .unitPrice(totalLabPrice)
                        .subtotal(totalLabPrice)
                        .alreadyBilled(billedCodes.contains(lr.getRequestNumber()))
                        .build());
            }
        }

        // 3. Pharmacy Charges from Pharmacy Dispensations
        List<PharmacyDispensation> dispensations = dispensationRepository.findByPatientIdOrderByDispensedAtDesc(patientId);
        for (PharmacyDispensation dsp : dispensations) {
            if (dsp.getStatus() == DispensationStatus.CANCELLED) continue;
            BigDecimal amount = dsp.getTotalAmount() != null ? dsp.getTotalAmount() : BigDecimal.ZERO;
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                LocalDate dspDate = dsp.getDispensedAt() != null
                        ? dsp.getDispensedAt().atZone(ZoneId.systemDefault()).toLocalDate()
                        : LocalDate.now();
                String medNames = dsp.getItems() != null
                        ? dsp.getItems().stream()
                            .map(i -> i.getMedicine().getName() + " x" + i.getQuantity())
                            .collect(Collectors.joining(", "))
                        : "Medications";
                if (medNames.length() > 160) {
                    medNames = medNames.substring(0, 157) + "...";
                }
                charges.add(PatientBillableChargeDto.builder()
                        .chargeType(ChargeType.PHARMACY)
                        .referenceType("PHARMACY_DISPENSATION")
                        .referenceId(dsp.getId())
                        .referenceCode(dsp.getDispensationNumber())
                        .description("Pharmacy Dispensation (" + dsp.getDispensationNumber() + "): " + medNames)
                        .serviceDate(dspDate)
                        .quantity(1)
                        .unitPrice(amount)
                        .subtotal(amount)
                        .alreadyBilled(billedCodes.contains(dsp.getDispensationNumber()))
                        .build());
            }
        }

        // 4. Admission Charges from Inpatient Admissions
        List<Admission> admissions = admissionRepository.findByPatientIdOrderByAdmissionDateDesc(patientId);
        for (Admission adm : admissions) {
            if (adm.getStatus() == AdmissionStatus.CANCELLED) continue;
            int stayDays = admissionService.calculateStayDays(adm);
            BigDecimal dailyTariff = (adm.getDailyRoomRate() != null ? adm.getDailyRoomRate() : BigDecimal.ZERO)
                    .add(adm.getNursingFeePerDay() != null ? adm.getNursingFeePerDay() : BigDecimal.ZERO);
            BigDecimal totalAdmission = dailyTariff.multiply(BigDecimal.valueOf(stayDays));
            LocalDate admDate = adm.getAdmissionDate() != null
                    ? adm.getAdmissionDate().atZone(ZoneId.systemDefault()).toLocalDate()
                    : LocalDate.now();

            charges.add(PatientBillableChargeDto.builder()
                    .chargeType(ChargeType.ADMISSION)
                    .referenceType("ADMISSION")
                    .referenceId(adm.getId())
                    .referenceCode(adm.getAdmissionNumber())
                    .description("Inpatient Admission: " + adm.getWardName() + " (Bed " + adm.getBedNumber() + ", " + adm.getRoomType() + ") - Room & Nursing Care")
                    .serviceDate(admDate)
                    .quantity(stayDays)
                    .unitPrice(dailyTariff)
                    .subtotal(totalAdmission)
                    .alreadyBilled(billedCodes.contains(adm.getAdmissionNumber()))
                    .build());
        }

        return charges;
    }

    @Transactional
    public BillingInvoiceDto createInvoice(
            CreateInvoiceRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        Admission admission = null;
        if (request.getAdmissionId() != null) {
            admission = admissionRepository.findById(request.getAdmissionId()).orElse(null);
        }

        String invoiceNumber = generateInvoiceNumber();

        BillingInvoice invoice = BillingInvoice.builder()
                .invoiceNumber(invoiceNumber)
                .patient(patient)
                .appointment(appointment)
                .admission(admission)
                .issueDate(Instant.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(7))
                .subtotal(BigDecimal.ZERO)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .balanceDue(BigDecimal.ZERO)
                .status(request.getStatus() != null ? request.getStatus() : InvoiceStatus.ISSUED)
                .notes(request.getNotes())
                .createdBy(currentUser)
                .build();

        invoice = invoiceRepository.save(invoice);

        BigDecimal itemsSubtotal = BigDecimal.ZERO;
        List<BillingInvoiceItem> savedItems = new ArrayList<>();

        for (InvoiceItemRequest itemReq : request.getItems()) {
            BigDecimal qty = BigDecimal.valueOf(itemReq.getQuantity());
            BigDecimal gross = itemReq.getUnitPrice().multiply(qty);
            BigDecimal itemDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal lineSubtotal = gross.subtract(itemDiscount).max(BigDecimal.ZERO);

            itemsSubtotal = itemsSubtotal.add(lineSubtotal);

            BillingInvoiceItem item = BillingInvoiceItem.builder()
                    .invoice(invoice)
                    .chargeType(itemReq.getChargeType())
                    .referenceType(itemReq.getReferenceType())
                    .referenceId(itemReq.getReferenceId())
                    .referenceCode(itemReq.getReferenceCode())
                    .description(itemReq.getDescription().trim())
                    .serviceDate(itemReq.getServiceDate() != null ? itemReq.getServiceDate() : LocalDate.now())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .discountAmount(itemDiscount)
                    .subtotal(lineSubtotal)
                    .build();

            savedItems.add(invoiceItemRepository.save(item));
        }

        BigDecimal headerDiscount = invoice.getDiscountAmount() != null ? invoice.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal headerTax = invoice.getTaxAmount() != null ? invoice.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal grandTotal = itemsSubtotal.subtract(headerDiscount).add(headerTax).max(BigDecimal.ZERO);

        invoice.setSubtotal(itemsSubtotal);
        invoice.setTotalAmount(grandTotal);
        invoice.setBalanceDue(grandTotal);
        invoice.setItems(savedItems);

        if (grandTotal.compareTo(BigDecimal.ZERO) == 0 && invoice.getStatus() != InvoiceStatus.DRAFT) {
            invoice.setStatus(InvoiceStatus.PAID);
        }

        BillingInvoice savedInvoice = invoiceRepository.save(invoice);

        auditLogService.log(
                currentUser,
                "INVOICE_GENERATED",
                "BILLING_INVOICE",
                String.valueOf(savedInvoice.getId()),
                "Generated invoice " + invoiceNumber + " for patient " + patient.getPatientNumber() + " Total: LKR " + grandTotal,
                httpRequest
        );

        // Process optional initial payment if included during invoice creation
        if (request.getInitialPayment() != null
                && request.getInitialPayment().getAmount() != null
                && request.getInitialPayment().getAmount().compareTo(BigDecimal.ZERO) > 0) {
            RecordPaymentRequest payReq = request.getInitialPayment();
            payReq.setInvoiceId(savedInvoice.getId());
            recordPayment(savedInvoice.getId(), payReq, currentUser, httpRequest);
            savedInvoice = invoiceRepository.findById(savedInvoice.getId()).orElse(savedInvoice);
        }

        return mapToInvoiceDto(savedInvoice);
    }

    @Transactional
    public BillingInvoiceDto addInvoiceItem(
            Long invoiceId,
            InvoiceItemRequest itemReq,
            User currentUser,
            HttpServletRequest httpRequest) {

        BillingInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingInvoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.REFUNDED) {
            throw new BadRequestException("Cannot add charges to a cancelled or refunded invoice");
        }

        BigDecimal qty = BigDecimal.valueOf(itemReq.getQuantity());
        BigDecimal gross = itemReq.getUnitPrice().multiply(qty);
        BigDecimal itemDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal lineSubtotal = gross.subtract(itemDiscount).max(BigDecimal.ZERO);

        BillingInvoiceItem item = BillingInvoiceItem.builder()
                .invoice(invoice)
                .chargeType(itemReq.getChargeType())
                .referenceType(itemReq.getReferenceType())
                .referenceId(itemReq.getReferenceId())
                .referenceCode(itemReq.getReferenceCode())
                .description(itemReq.getDescription().trim())
                .serviceDate(itemReq.getServiceDate() != null ? itemReq.getServiceDate() : LocalDate.now())
                .quantity(itemReq.getQuantity())
                .unitPrice(itemReq.getUnitPrice())
                .discountAmount(itemDiscount)
                .subtotal(lineSubtotal)
                .build();

        invoice.getItems().add(invoiceItemRepository.save(item));
        recalculateInvoiceTotals(invoice);

        BillingInvoice saved = invoiceRepository.save(invoice);

        auditLogService.log(
                currentUser,
                "INVOICE_ITEM_ADDED",
                "BILLING_INVOICE",
                String.valueOf(saved.getId()),
                "Added " + itemReq.getChargeType() + " charge (" + itemReq.getDescription() + ") LKR " + lineSubtotal + " to " + saved.getInvoiceNumber(),
                httpRequest
        );

        return mapToInvoiceDto(saved);
    }

    @Transactional
    public BillingInvoiceDto cancelInvoice(
            Long id,
            String reason,
            User currentUser,
            HttpServletRequest httpRequest) {

        BillingInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BillingInvoice", "id", id));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Invoice is already cancelled");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setBalanceDue(BigDecimal.ZERO);
        invoice.setNotes((invoice.getNotes() != null ? invoice.getNotes() + "\n" : "") + "CANCELLED: " + reason);

        BillingInvoice saved = invoiceRepository.save(invoice);

        auditLogService.log(
                currentUser,
                "INVOICE_CANCELLED",
                "BILLING_INVOICE",
                String.valueOf(saved.getId()),
                "Cancelled invoice " + saved.getInvoiceNumber() + ". Reason: " + reason,
                httpRequest
        );

        return mapToInvoiceDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<BillingPaymentDto> searchPayments(
            String query,
            Long invoiceId,
            Long patientId,
            PaymentMethod paymentMethod,
            BillingPaymentStatus status,
            Pageable pageable) {
        return paymentRepository.searchPayments(query, invoiceId, patientId, paymentMethod, status, pageable)
                .map(this::mapToPaymentDto);
    }

    @Transactional
    public BillingPaymentDto recordPayment(
            Long invoiceId,
            RecordPaymentRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        BillingInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingInvoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Cannot record payment against a cancelled invoice");
        }
        if (invoice.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invoice " + invoice.getInvoiceNumber() + " has already been paid in full");
        }
        if (request.getAmount().compareTo(invoice.getBalanceDue()) > 0) {
            throw new BadRequestException("Payment amount (LKR " + request.getAmount() + ") exceeds balance due (LKR " + invoice.getBalanceDue() + ")");
        }

        String paymentNumber = generatePaymentNumber();
        Patient patient = invoice.getPatient();
        String defaultPayer = patient.getFirstName() + " " + patient.getLastName();

        BillingPayment payment = BillingPayment.builder()
                .paymentNumber(paymentNumber)
                .invoice(invoice)
                .patient(patient)
                .paymentDate(Instant.now())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .payerName(request.getPayerName() != null && !request.getPayerName().isBlank() ? request.getPayerName().trim() : defaultPayer)
                .insuranceProvider(request.getInsuranceProvider())
                .insurancePolicyNumber(request.getInsurancePolicyNumber())
                .status(BillingPaymentStatus.COMPLETED)
                .receivedBy(currentUser)
                .notes(request.getNotes())
                .build();

        BillingPayment savedPayment = paymentRepository.save(payment);
        invoice.getPayments().add(savedPayment);

        BigDecimal newPaid = invoice.getPaidAmount().add(request.getAmount());
        BigDecimal newBalance = invoice.getTotalAmount().subtract(newPaid).max(BigDecimal.ZERO);

        invoice.setPaidAmount(newPaid);
        invoice.setBalanceDue(newBalance);

        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            // Sync any linked pharmacy dispensations to PAID
            if (invoice.getItems() != null) {
                for (BillingInvoiceItem item : invoice.getItems()) {
                    if (item.getChargeType() == ChargeType.PHARMACY && item.getReferenceCode() != null) {
                        dispensationRepository.findByDispensationNumber(item.getReferenceCode())
                                .ifPresent(dsp -> {
                                    if (dsp.getPaymentStatus() == PaymentStatus.PENDING) {
                                        dsp.setPaymentStatus(PaymentStatus.PAID);
                                        dispensationRepository.save(dsp);
                                    }
                                });
                    }
                }
            }
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);

        auditLogService.log(
                currentUser,
                "PAYMENT_RECORDED",
                "BILLING_PAYMENT",
                String.valueOf(savedPayment.getId()),
                "Recorded payment " + paymentNumber + " (LKR " + request.getAmount() + " via " + request.getPaymentMethod() + ") for invoice " + invoice.getInvoiceNumber(),
                httpRequest
        );

        return mapToPaymentDto(savedPayment);
    }

    @Transactional
    public BillingPaymentDto refundPayment(
            Long paymentId,
            String reason,
            User currentUser,
            HttpServletRequest httpRequest) {

        BillingPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingPayment", "id", paymentId));

        if (payment.getStatus() == BillingPaymentStatus.REFUNDED) {
            throw new BadRequestException("Payment is already marked as refunded");
        }

        payment.setStatus(BillingPaymentStatus.REFUNDED);
        payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "") + "REFUNDED: " + reason);
        BillingPayment savedPayment = paymentRepository.save(payment);

        BillingInvoice invoice = payment.getInvoice();
        recalculateInvoiceTotals(invoice);
        invoiceRepository.save(invoice);

        auditLogService.log(
                currentUser,
                "PAYMENT_REFUNDED",
                "BILLING_PAYMENT",
                String.valueOf(savedPayment.getId()),
                "Refunded payment " + savedPayment.getPaymentNumber() + " (LKR " + savedPayment.getAmount() + "). Reason: " + reason,
                httpRequest
        );

        return mapToPaymentDto(savedPayment);
    }

    private void recalculateInvoiceTotals(BillingInvoice invoice) {
        BigDecimal itemsSubtotal = invoice.getItems().stream()
                .map(BillingInvoiceItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = invoice.getDiscountAmount() != null ? invoice.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal tax = invoice.getTaxAmount() != null ? invoice.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal total = itemsSubtotal.subtract(discount).add(tax).max(BigDecimal.ZERO);

        BigDecimal activePaid = invoice.getPayments().stream()
                .filter(p -> p.getStatus() == BillingPaymentStatus.COMPLETED)
                .map(BillingPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = total.subtract(activePaid).max(BigDecimal.ZERO);

        invoice.setSubtotal(itemsSubtotal);
        invoice.setTotalAmount(total);
        invoice.setPaidAmount(activePaid);
        invoice.setBalanceDue(balance);

        if (invoice.getStatus() != InvoiceStatus.CANCELLED) {
            if (balance.compareTo(BigDecimal.ZERO) == 0 && total.compareTo(BigDecimal.ZERO) > 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            } else if (activePaid.compareTo(BigDecimal.ZERO) > 0) {
                invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            } else {
                invoice.setStatus(InvoiceStatus.ISSUED);
            }
        }
    }

    public BillingInvoiceDto mapToInvoiceDto(BillingInvoice inv) {
        List<BillingInvoiceItemDto> itemDtos = inv.getItems() != null
                ? inv.getItems().stream().map(this::mapToItemDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<BillingPaymentDto> paymentDtos = inv.getPayments() != null
                ? inv.getPayments().stream().map(this::mapToPaymentDto).collect(Collectors.toList())
                : new ArrayList<>();

        Patient p = inv.getPatient();

        return BillingInvoiceDto.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .patientId(p.getId())
                .patientNumber(p.getPatientNumber())
                .patientName(p.getFirstName() + " " + p.getLastName())
                .patientContact(p.getContactNumber())
                .patientAddress(p.getAddress())
                .appointmentId(inv.getAppointment() != null ? inv.getAppointment().getId() : null)
                .appointmentNumber(inv.getAppointment() != null ? inv.getAppointment().getAppointmentNumber() : null)
                .admissionId(inv.getAdmission() != null ? inv.getAdmission().getId() : null)
                .admissionNumber(inv.getAdmission() != null ? inv.getAdmission().getAdmissionNumber() : null)
                .issueDate(inv.getIssueDate())
                .dueDate(inv.getDueDate())
                .subtotal(inv.getSubtotal())
                .discountAmount(inv.getDiscountAmount())
                .taxAmount(inv.getTaxAmount())
                .totalAmount(inv.getTotalAmount())
                .paidAmount(inv.getPaidAmount())
                .balanceDue(inv.getBalanceDue())
                .status(inv.getStatus())
                .notes(inv.getNotes())
                .createdById(inv.getCreatedBy() != null ? inv.getCreatedBy().getId() : null)
                .createdByName(inv.getCreatedBy() != null ? inv.getCreatedBy().getFirstName() + " " + inv.getCreatedBy().getLastName() : "Billing Desk")
                .createdAt(inv.getCreatedAt())
                .updatedAt(inv.getUpdatedAt())
                .items(itemDtos)
                .payments(paymentDtos)
                .build();
    }

    public BillingInvoiceItemDto mapToItemDto(BillingInvoiceItem item) {
        return BillingInvoiceItemDto.builder()
                .id(item.getId())
                .chargeType(item.getChargeType())
                .referenceType(item.getReferenceType())
                .referenceId(item.getReferenceId())
                .referenceCode(item.getReferenceCode())
                .description(item.getDescription())
                .serviceDate(item.getServiceDate())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountAmount(item.getDiscountAmount())
                .subtotal(item.getSubtotal())
                .createdAt(item.getCreatedAt())
                .build();
    }

    public BillingPaymentDto mapToPaymentDto(BillingPayment pay) {
        return BillingPaymentDto.builder()
                .id(pay.getId())
                .paymentNumber(pay.getPaymentNumber())
                .invoiceId(pay.getInvoice().getId())
                .invoiceNumber(pay.getInvoice().getInvoiceNumber())
                .patientId(pay.getPatient().getId())
                .patientNumber(pay.getPatient().getPatientNumber())
                .patientName(pay.getPatient().getFirstName() + " " + pay.getPatient().getLastName())
                .paymentDate(pay.getPaymentDate())
                .amount(pay.getAmount())
                .paymentMethod(pay.getPaymentMethod())
                .transactionReference(pay.getTransactionReference())
                .payerName(pay.getPayerName())
                .insuranceProvider(pay.getInsuranceProvider())
                .insurancePolicyNumber(pay.getInsurancePolicyNumber())
                .status(pay.getStatus())
                .receivedById(pay.getReceivedBy() != null ? pay.getReceivedBy().getId() : null)
                .receivedByName(pay.getReceivedBy() != null ? pay.getReceivedBy().getFirstName() + " " + pay.getReceivedBy().getLastName() : "Cashier")
                .notes(pay.getNotes())
                .createdAt(pay.getCreatedAt())
                .build();
    }

    private synchronized String generateInvoiceNumber() {
        return invoiceRepository.findTopByOrderByIdDesc()
                .map(inv -> String.format("INV-%05d", inv.getId() + 10001))
                .orElse("INV-10001");
    }

    private synchronized String generatePaymentNumber() {
        return paymentRepository.findTopByOrderByIdDesc()
                .map(pay -> String.format("PAY-%05d", pay.getId() + 10001))
                .orElse("PAY-10001");
    }
}

