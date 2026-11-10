package lk.careflow.service.report;

import jakarta.servlet.http.HttpServletRequest;
import lk.careflow.dto.report.*;
import lk.careflow.entity.appointment.Appointment;
import lk.careflow.entity.appointment.AppointmentStatus;
import lk.careflow.entity.appointment.AppointmentType;
import lk.careflow.entity.billing.*;
import lk.careflow.entity.doctor.Department;
import lk.careflow.entity.doctor.Doctor;
import lk.careflow.entity.lab.*;
import lk.careflow.entity.patient.Gender;
import lk.careflow.entity.patient.Patient;
import lk.careflow.entity.patient.PatientStatus;
import lk.careflow.entity.pharmacy.*;
import lk.careflow.entity.report.HospitalReport;
import lk.careflow.entity.report.ReportCategory;
import lk.careflow.entity.report.ReportStatus;
import lk.careflow.entity.staff.*;
import lk.careflow.entity.user.User;
import lk.careflow.exception.ResourceNotFoundException;
import lk.careflow.repository.appointment.AppointmentRepository;
import lk.careflow.repository.billing.*;
import lk.careflow.repository.doctor.DepartmentRepository;
import lk.careflow.repository.doctor.DoctorRepository;
import lk.careflow.repository.emr.MedicalRecordRepository;
import lk.careflow.repository.lab.*;
import lk.careflow.repository.patient.PatientRepository;
import lk.careflow.repository.pharmacy.*;
import lk.careflow.repository.report.HospitalReportRepository;
import lk.careflow.repository.staff.StaffAttendanceRepository;
import lk.careflow.repository.staff.StaffEmployeeRepository;
import lk.careflow.repository.staff.StaffLeaveRecordRepository;
import lk.careflow.service.user.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final HospitalReportRepository reportRepository;
    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final BillingInvoiceRepository invoiceRepository;
    private final BillingInvoiceItemRepository invoiceItemRepository;
    private final BillingPaymentRepository paymentRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;
    private final PharmacyDispensationRepository dispensationRepository;
    private final LabTestRepository labTestRepository;
    private final LabRequestRepository labRequestRepository;
    private final LabSampleRepository labSampleRepository;
    private final LabResultRepository labResultRepository;
    private final LabReportRepository labReportRepository;
    private final StaffEmployeeRepository staffEmployeeRepository;
    private final StaffAttendanceRepository staffAttendanceRepository;
    private final StaffLeaveRecordRepository staffLeaveRecordRepository;
    private final AuditLogService auditLogService;

    // =========================================================================
    // CONSOLIDATED ANALYTICS OVERVIEW
    // =========================================================================

    @Transactional(readOnly = true)
    public HospitalAnalyticsOverviewDto getAnalyticsOverview() {
        return HospitalAnalyticsOverviewDto.builder()
                .totalSavedReportsCount(reportRepository.count())
                .patientReport(getPatientReportAnalytics())
                .appointmentReport(getAppointmentReportAnalytics())
                .revenueReport(getRevenueReportAnalytics())
                .pharmacyReport(getPharmacyReportAnalytics())
                .laboratoryReport(getLaboratoryReportAnalytics())
                .staffReport(getStaffReportAnalytics())
                .build();
    }

    // =========================================================================
    // 1. PATIENT REPORTS ANALYTICS
    // =========================================================================

    @Transactional(readOnly = true)
    public PatientReportAnalyticsDto getPatientReportAnalytics() {
        List<Patient> patients = patientRepository.findAll();
        List<Admission> admissions = admissionRepository.findAll();

        long total = patients.size();
        long active = patients.stream().filter(p -> p.getStatus() == PatientStatus.ACTIVE).count();
        long inactive = patients.stream().filter(p -> p.getStatus() == PatientStatus.INACTIVE).count();
        long deceased = patients.stream().filter(p -> p.getStatus() == PatientStatus.DECEASED).count();

        long male = patients.stream().filter(p -> p.getGender() == Gender.MALE).count();
        long female = patients.stream().filter(p -> p.getGender() == Gender.FEMALE).count();
        long otherGender = patients.stream().filter(p -> p.getGender() == Gender.OTHER).count();

        long totalAdm = admissions.size();
        long activeAdm = admissions.stream().filter(a -> a.getStatus() == AdmissionStatus.ADMITTED).count();
        long dischargedAdm = admissions.stream().filter(a -> a.getStatus() == AdmissionStatus.DISCHARGED).count();
        long totalEmr = medicalRecordRepository.count();

        List<ReportMetricItemDto> genderBreakdown = Arrays.asList(
                buildMetric("MALE", "Male Patients", male, BigDecimal.ZERO, total, "Registered male demographic"),
                buildMetric("FEMALE", "Female Patients", female, BigDecimal.ZERO, total, "Registered female demographic"),
                buildMetric("OTHER", "Other / Unspecified", otherGender, BigDecimal.ZERO, total, "Other demographic")
        );

        Map<String, Long> bloodCounts = patients.stream()
                .collect(Collectors.groupingBy(
                        p -> (p.getBloodGroup() != null && !p.getBloodGroup().isBlank()) ? p.getBloodGroup() : "Unknown",
                        Collectors.counting()
                ));
        List<ReportMetricItemDto> bloodGroupBreakdown = bloodCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> buildMetric(e.getKey(), "Blood Group " + e.getKey(), e.getValue(), BigDecimal.ZERO, total, "Verified blood group"))
                .collect(Collectors.toList());

        List<ReportMetricItemDto> statusBreakdown = Arrays.asList(
                buildMetric("ACTIVE", "Active Patients", active, BigDecimal.ZERO, total, "Currently active care cohort"),
                buildMetric("INACTIVE", "Inactive Patients", inactive, BigDecimal.ZERO, total, "Archived / inactive records"),
                buildMetric("DECEASED", "Deceased", deceased, BigDecimal.ZERO, total, "Deceased records")
        );

        Map<RoomType, Long> roomCounts = admissions.stream()
                .collect(Collectors.groupingBy(Admission::getRoomType, Collectors.counting()));
        List<ReportMetricItemDto> roomBreakdown = new ArrayList<>();
        for (RoomType rt : RoomType.values()) {
            long c = roomCounts.getOrDefault(rt, 0L);
            if (c > 0 || rt == RoomType.GENERAL_WARD || rt == RoomType.SEMI_PRIVATE || rt == RoomType.ICU) {
                roomBreakdown.add(buildMetric(rt.name(), rt.name().replace('_', ' '), c, BigDecimal.ZERO, Math.max(1, totalAdm), "Inpatient ward category"));
            }
        }

        return PatientReportAnalyticsDto.builder()
                .totalPatients(total)
                .activePatientsCount(active)
                .inactivePatientsCount(inactive)
                .deceasedPatientsCount(deceased)
                .malePatientsCount(male)
                .femalePatientsCount(female)
                .otherGenderCount(otherGender)
                .totalAdmissionsCount(totalAdm)
                .activeAdmissionsCount(activeAdm)
                .dischargedAdmissionsCount(dischargedAdm)
                .totalMedicalRecordsCount(totalEmr)
                .genderBreakdown(genderBreakdown)
                .bloodGroupBreakdown(bloodGroupBreakdown)
                .statusBreakdown(statusBreakdown)
                .admissionRoomTypeBreakdown(roomBreakdown)
                .build();
    }

    // =========================================================================
    // 2. APPOINTMENT REPORTS ANALYTICS
    // =========================================================================

    @Transactional(readOnly = true)
    public AppointmentReportAnalyticsDto getAppointmentReportAnalytics() {
        List<Appointment> appointments = appointmentRepository.findAll();
        long total = appointments.size();

        long scheduled = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED || a.getStatus() == AppointmentStatus.RESCHEDULED).count();
        long confirmed = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED || a.getStatus() == AppointmentStatus.IN_PROGRESS).count();
        long completed = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long cancelled = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
        long noShow = appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();

        double completionRate = total > 0 ? roundPct(((double) (completed + confirmed + scheduled) / total) * 100.0) : 0.0;
        double cancellationRate = total > 0 ? roundPct(((double) (cancelled + noShow) / total) * 100.0) : 0.0;

        BigDecimal estValue = appointments.stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .map(a -> a.getConsultationFee() != null ? a.getConsultationFee() : new BigDecimal("2500.00"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ReportMetricItemDto> statusBreakdown = Arrays.asList(
                buildMetric("SCHEDULED", "Scheduled / Rescheduled", scheduled, BigDecimal.ZERO, total, "Upcoming bookings"),
                buildMetric("CONFIRMED", "Confirmed / In Progress", confirmed, BigDecimal.ZERO, total, "Checked-in clinic queue"),
                buildMetric("COMPLETED", "Completed Consultations", completed, BigDecimal.ZERO, total, "Fulfilled visits"),
                buildMetric("CANCELLED", "Cancelled", cancelled, BigDecimal.ZERO, total, "Cancelled bookings"),
                buildMetric("NO_SHOW", "No-Show", noShow, BigDecimal.ZERO, total, "Missed appointments")
        );

        List<ReportMetricItemDto> typeBreakdown = new ArrayList<>();
        for (AppointmentType t : AppointmentType.values()) {
            long c = appointments.stream().filter(a -> a.getAppointmentType() == t).count();
            typeBreakdown.add(buildMetric(t.name(), t.name().replace('_', ' '), c, BigDecimal.ZERO, total, "Visit type"));
        }

        Map<String, Long> deptCounts = appointments.stream()
                .filter(a -> a.getDepartment() != null)
                .collect(Collectors.groupingBy(a -> a.getDepartment().getName(), Collectors.counting()));
        List<ReportMetricItemDto> deptBreakdown = deptCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> buildMetric(e.getKey(), e.getKey(), e.getValue(), BigDecimal.ZERO, total, "Department clinic bookings"))
                .collect(Collectors.toList());

        Map<String, List<Appointment>> docGroups = appointments.stream()
                .filter(a -> a.getDoctor() != null)
                .collect(Collectors.groupingBy(a -> "Dr. " + a.getDoctor().getFirstName() + " " + a.getDoctor().getLastName()));
        List<ReportMetricItemDto> docWorkload = docGroups.entrySet().stream()
                .map(e -> {
                    long count = e.getValue().size();
                    BigDecimal rev = e.getValue().stream()
                            .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                            .map(a -> a.getConsultationFee() != null ? a.getConsultationFee() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    String spec = e.getValue().get(0).getDoctor().getSpecialization();
                    return buildMetric(e.getKey(), e.getKey(), count, rev, total, spec);
                })
                .sorted(Comparator.comparingLong(ReportMetricItemDto::getCount).reversed())
                .collect(Collectors.toList());

        return AppointmentReportAnalyticsDto.builder()
                .totalAppointments(total)
                .scheduledCount(scheduled)
                .confirmedCount(confirmed)
                .completedCount(completed)
                .cancelledCount(cancelled)
                .noShowCount(noShow)
                .completionRatePercentage(completionRate)
                .cancellationRatePercentage(cancellationRate)
                .estimatedConsultationValue(estValue)
                .statusBreakdown(statusBreakdown)
                .typeBreakdown(typeBreakdown)
                .departmentBreakdown(deptBreakdown)
                .doctorWorkloadBreakdown(docWorkload)
                .build();
    }

    // =========================================================================
    // 3. REVENUE REPORTS ANALYTICS
    // =========================================================================

    @Transactional(readOnly = true)
    public RevenueReportAnalyticsDto getRevenueReportAnalytics() {
        List<BillingInvoice> invoices = invoiceRepository.findAll();
        List<BillingPayment> payments = paymentRepository.findAll();

        long totalInv = invoices.size();
        long paidInv = invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.PAID).count();
        long partialInv = invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.PARTIALLY_PAID).count();
        long unpaidInv = invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.ISSUED || i.getStatus() == InvoiceStatus.OVERDUE).count();

        BigDecimal totalBilled = invoiceRepository.sumTotalBilledAmount();
        BigDecimal totalCollected = invoiceRepository.sumTotalCollectedAmount();
        BigDecimal outstanding = invoiceRepository.sumOutstandingReceivables();
        BigDecimal totalDiscounts = invoices.stream()
                .filter(i -> i.getStatus() != InvoiceStatus.CANCELLED)
                .map(i -> i.getDiscountAmount() != null ? i.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        totalBilled = totalBilled != null ? totalBilled : BigDecimal.ZERO;
        totalCollected = totalCollected != null ? totalCollected : BigDecimal.ZERO;
        outstanding = outstanding != null ? outstanding : BigDecimal.ZERO;

        double collectionRate = totalBilled.compareTo(BigDecimal.ZERO) > 0
                ? roundPct(totalCollected.multiply(BigDecimal.valueOf(100)).divide(totalBilled, 2, RoundingMode.HALF_UP).doubleValue())
                : 0.0;

        BigDecimal consultRev = defaultZero(invoiceItemRepository.sumRevenueByChargeType(ChargeType.CONSULTATION));
        BigDecimal labRev = defaultZero(invoiceItemRepository.sumRevenueByChargeType(ChargeType.LABORATORY));
        BigDecimal pharmRev = defaultZero(invoiceItemRepository.sumRevenueByChargeType(ChargeType.PHARMACY));
        BigDecimal admRev = defaultZero(invoiceItemRepository.sumRevenueByChargeType(ChargeType.ADMISSION));
        BigDecimal procOtherRev = defaultZero(invoiceItemRepository.sumRevenueByChargeType(ChargeType.PROCEDURE))
                .add(defaultZero(invoiceItemRepository.sumRevenueByChargeType(ChargeType.OTHER)));

        BigDecimal grossItemsSum = consultRev.add(labRev).add(pharmRev).add(admRev).add(procOtherRev);

        List<ReportMetricItemDto> chargeBreakdown = Arrays.asList(
                buildAmountMetric("ADMISSION", "Inpatient Admission & Ward Charges", admRev, grossItemsSum, "Room & nursing care tariffs"),
                buildAmountMetric("CONSULTATION", "Specialist Consultation Charges", consultRev, grossItemsSum, "Doctor consultation fees"),
                buildAmountMetric("LABORATORY", "Diagnostic Laboratory Charges", labRev, grossItemsSum, "Pathology & imaging panels"),
                buildAmountMetric("PHARMACY", "Pharmacy Medication Charges", pharmRev, grossItemsSum, "Dispensed drugs & consumables"),
                buildAmountMetric("OTHER", "Procedures & Other Hospital Fees", procOtherRev, grossItemsSum, "Minor procedures & misc")
        );

        List<BillingPayment> completedPayments = payments.stream()
                .filter(p -> p.getStatus() == BillingPaymentStatus.COMPLETED)
                .collect(Collectors.toList());

        List<ReportMetricItemDto> methodBreakdown = new ArrayList<>();
        for (PaymentMethod pm : PaymentMethod.values()) {
            List<BillingPayment> byMethod = completedPayments.stream()
                    .filter(p -> p.getPaymentMethod() == pm)
                    .collect(Collectors.toList());
            BigDecimal sum = byMethod.stream()
                    .map(BillingPayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (!byMethod.isEmpty() || pm == PaymentMethod.CASH || pm == PaymentMethod.CARD || pm == PaymentMethod.INSURANCE) {
                ReportMetricItemDto item = buildAmountMetric(pm.name(), pm.name().replace('_', ' '), sum, totalCollected, byMethod.size() + " receipt(s)");
                item.setCount(byMethod.size());
                methodBreakdown.add(item);
            }
        }

        List<ReportMetricItemDto> invStatusBreakdown = Arrays.asList(
                buildMetric("PAID", "Paid in Full", paidInv, BigDecimal.ZERO, totalInv, "Fully settled bills"),
                buildMetric("PARTIALLY_PAID", "Partially Paid", partialInv, BigDecimal.ZERO, totalInv, "Installment / advance paid"),
                buildMetric("ISSUED", "Issued / Open", unpaidInv, BigDecimal.ZERO, totalInv, "Awaiting settlement")
        );

        return RevenueReportAnalyticsDto.builder()
                .totalInvoicesCount(totalInv)
                .paidInvoicesCount(paidInv)
                .partiallyPaidInvoicesCount(partialInv)
                .unpaidInvoicesCount(unpaidInv)
                .totalPaymentsCount(completedPayments.size())
                .totalBilledRevenue(totalBilled)
                .totalCollectedRevenue(totalCollected)
                .outstandingReceivables(outstanding)
                .totalDiscountsGranted(totalDiscounts)
                .collectionRatePercentage(collectionRate)
                .consultationRevenue(consultRev)
                .laboratoryRevenue(labRev)
                .pharmacyRevenue(pharmRev)
                .admissionRevenue(admRev)
                .procedureAndOtherRevenue(procOtherRev)
                .chargeCategoryBreakdown(chargeBreakdown)
                .paymentMethodBreakdown(methodBreakdown)
                .invoiceStatusBreakdown(invStatusBreakdown)
                .build();
    }

    // =========================================================================
    // 4. PHARMACY REPORTS ANALYTICS
    // =========================================================================

    @Transactional(readOnly = true)
    public PharmacyReportAnalyticsDto getPharmacyReportAnalytics() {
        List<Medicine> medicines = medicineRepository.findAll();
        List<MedicineBatch> batches = batchRepository.findAll();
        List<PharmacyDispensation> dispensations = dispensationRepository.findAll();

        long totalMeds = medicines.size();
        long activeMeds = medicines.stream().filter(m -> Boolean.TRUE.equals(m.getIsActive())).count();
        long totalBatches = batches.size();

        LocalDate today = LocalDate.now();
        LocalDate expSoonThreshold = today.plusDays(60);

        long totalUnits = batches.stream()
                .filter(b -> b.getStatus() == BatchStatus.ACTIVE && !b.getExpiryDate().isBefore(today))
                .mapToLong(b -> b.getCurrentQuantity() != null ? b.getCurrentQuantity() : 0)
                .sum();

        BigDecimal inventoryValuation = batches.stream()
                .filter(b -> b.getStatus() == BatchStatus.ACTIVE && !b.getExpiryDate().isBefore(today))
                .map(b -> {
                    BigDecimal price = b.getUnitSellingPrice() != null ? b.getUnitSellingPrice() : BigDecimal.ZERO;
                    int qty = b.getCurrentQuantity() != null ? b.getCurrentQuantity() : 0;
                    return price.multiply(BigDecimal.valueOf(qty));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long expiringSoon = batches.stream()
                .filter(b -> b.getStatus() == BatchStatus.ACTIVE
                        && b.getCurrentQuantity() != null && b.getCurrentQuantity() > 0
                        && !b.getExpiryDate().isBefore(today)
                        && !b.getExpiryDate().isAfter(expSoonThreshold))
                .count();

        long expiredCount = batches.stream()
                .filter(b -> b.getStatus() == BatchStatus.EXPIRED || b.getExpiryDate().isBefore(today))
                .count();

        long lowStockCount = 0;
        List<ReportMetricItemDto> alertItems = new ArrayList<>();
        for (Medicine m : medicines) {
            int avail = batches.stream()
                    .filter(b -> b.getMedicine().getId().equals(m.getId())
                            && b.getStatus() == BatchStatus.ACTIVE
                            && !b.getExpiryDate().isBefore(today))
                    .mapToInt(b -> b.getCurrentQuantity() != null ? b.getCurrentQuantity() : 0)
                    .sum();
            int reorder = m.getReorderLevel() != null ? m.getReorderLevel() : 50;
            if (avail <= reorder) {
                lowStockCount++;
                alertItems.add(ReportMetricItemDto.builder()
                        .key(m.getMedicineCode())
                        .label(m.getName() + " (" + m.getStrength() + ")")
                        .count(avail)
                        .amount(m.getUnitPrice())
                        .percentage(reorder)
                        .secondaryInfo("Reorder Threshold: " + reorder + " units")
                        .build());
            }
        }

        BigDecimal dispRevenue = dispensations.stream()
                .filter(d -> d.getStatus() == DispensationStatus.COMPLETED)
                .map(d -> d.getTotalAmount() != null ? d.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<MedicineCategory, Long> catCounts = medicines.stream()
                .collect(Collectors.groupingBy(Medicine::getCategory, Collectors.counting()));
        List<ReportMetricItemDto> categoryBreakdown = catCounts.entrySet().stream()
                .sorted(Map.Entry.<MedicineCategory, Long>comparingByValue().reversed())
                .map(e -> buildMetric(e.getKey().name(), e.getKey().name().replace('_', ' '), e.getValue(), BigDecimal.ZERO, totalMeds, "Formulary drug class"))
                .collect(Collectors.toList());

        List<ReportMetricItemDto> batchBreakdown = Arrays.asList(
                buildMetric("ACTIVE", "Active Healthy Batches", Math.max(0, totalBatches - expiredCount - expiringSoon), BigDecimal.ZERO, totalBatches, "Standard FEFO stock"),
                buildMetric("EXPIRING_SOON", "Expiring Within 60 Days", expiringSoon, BigDecimal.ZERO, totalBatches, "Prioritize FEFO issue"),
                buildMetric("EXPIRED", "Expired Batches", expiredCount, BigDecimal.ZERO, totalBatches, "Quarantined for disposal")
        );

        return PharmacyReportAnalyticsDto.builder()
                .totalMedicinesCount(totalMeds)
                .activeMedicinesCount(activeMeds)
                .totalBatchesCount(totalBatches)
                .totalUnitsInStock(totalUnits)
                .lowStockMedicinesCount(lowStockCount)
                .expiringSoonBatchesCount(expiringSoon)
                .expiredBatchesCount(expiredCount)
                .totalDispensationsCount(dispensations.size())
                .totalDispensationRevenue(dispRevenue)
                .totalInventoryValuation(inventoryValuation)
                .categoryStockBreakdown(categoryBreakdown)
                .batchStatusBreakdown(batchBreakdown)
                .alertItemsSummary(alertItems)
                .build();
    }

    // =========================================================================
    // 5. LABORATORY REPORTS ANALYTICS
    // =========================================================================

    @Transactional(readOnly = true)
    public LaboratoryReportAnalyticsDto getLaboratoryReportAnalytics() {
        List<LabTest> tests = labTestRepository.findAll();
        List<LabRequest> requests = labRequestRepository.findAll();
        List<LabResult> results = labResultRepository.findAll();

        long totalTests = tests.size();
        long totalReqs = requests.size();
        long completedReqs = requests.stream().filter(r -> r.getStatus() == LabRequestStatus.COMPLETED).count();
        long pendingReqs = requests.stream().filter(r -> r.getStatus() != LabRequestStatus.COMPLETED && r.getStatus() != LabRequestStatus.CANCELLED).count();
        long samplesCount = labSampleRepository.count();
        long finalizedReports = labReportRepository.count();

        long normalRes = results.stream().filter(r -> r.getFlag() == ResultFlag.NORMAL).count();
        long abnormalRes = results.stream().filter(r -> r.getFlag() == ResultFlag.HIGH || r.getFlag() == ResultFlag.LOW || r.getFlag() == ResultFlag.ABNORMAL).count();
        long criticalRes = results.stream().filter(r -> r.getFlag() == ResultFlag.CRITICAL).count();
        long totalRes = results.size();

        BigDecimal estLabRevenue = requests.stream()
                .filter(r -> r.getStatus() != LabRequestStatus.CANCELLED && r.getItems() != null)
                .flatMap(r -> r.getItems().stream())
                .map(i -> i.getLabTest() != null && i.getLabTest().getPrice() != null ? i.getLabTest().getPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<LabCategory, Long> catCounts = tests.stream()
                .collect(Collectors.groupingBy(LabTest::getCategory, Collectors.counting()));
        List<ReportMetricItemDto> categoryBreakdown = catCounts.entrySet().stream()
                .sorted(Map.Entry.<LabCategory, Long>comparingByValue().reversed())
                .map(e -> buildMetric(e.getKey().name(), e.getKey().name(), e.getValue(), BigDecimal.ZERO, totalTests, "Diagnostic catalog tests"))
                .collect(Collectors.toList());

        List<ReportMetricItemDto> priorityBreakdown = new ArrayList<>();
        for (LabPriority p : LabPriority.values()) {
            long c = requests.stream().filter(r -> r.getPriority() == p).count();
            priorityBreakdown.add(buildMetric(p.name(), p.name() + " Priority", c, BigDecimal.ZERO, totalReqs, "Ordered test urgency"));
        }

        List<ReportMetricItemDto> statusBreakdown = Arrays.asList(
                buildMetric("COMPLETED", "Completed & Verified", completedReqs, BigDecimal.ZERO, totalReqs, "Finalized diagnostic orders"),
                buildMetric("PENDING", "In Progress / Sample Collected", pendingReqs, BigDecimal.ZERO, totalReqs, "Active laboratory queue")
        );

        List<ReportMetricItemDto> flagBreakdown = Arrays.asList(
                buildMetric("NORMAL", "Normal Reference Range", normalRes, BigDecimal.ZERO, totalRes, "Within physiological limits"),
                buildMetric("ABNORMAL", "High / Low / Borderline", abnormalRes, BigDecimal.ZERO, totalRes, "Requires clinical correlation"),
                buildMetric("CRITICAL", "Critical Panic Value", criticalRes, BigDecimal.ZERO, totalRes, "Immediate physician alert")
        );

        return LaboratoryReportAnalyticsDto.builder()
                .totalCatalogTestsCount(totalTests)
                .totalLabRequestsCount(totalReqs)
                .completedRequestsCount(completedReqs)
                .pendingRequestsCount(pendingReqs)
                .totalSamplesCollectedCount(samplesCount)
                .finalizedLabReportsCount(finalizedReports)
                .normalResultsCount(normalRes)
                .abnormalHighLowResultsCount(abnormalRes)
                .criticalResultsCount(criticalRes)
                .estimatedLabTestRevenue(estLabRevenue)
                .testCategoryBreakdown(categoryBreakdown)
                .requestPriorityBreakdown(priorityBreakdown)
                .requestStatusBreakdown(statusBreakdown)
                .resultFlagBreakdown(flagBreakdown)
                .build();
    }

    // =========================================================================
    // 6. STAFF REPORTS ANALYTICS
    // =========================================================================

    @Transactional(readOnly = true)
    public StaffReportAnalyticsDto getStaffReportAnalytics() {
        List<StaffEmployee> staffList = staffEmployeeRepository.findAll();
        List<Department> departments = departmentRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();
        List<StaffLeaveRecord> leaves = staffLeaveRecordRepository.findAll();

        LocalDate today = LocalDate.now();
        long totalStaff = staffList.size();
        long activeStaff = staffList.stream().filter(s -> s.getStatus() == StaffStatus.ACTIVE).count();
        long onLeaveStaff = staffList.stream().filter(s -> s.getStatus() == StaffStatus.ON_LEAVE).count();
        long inactiveStaff = Math.max(0, totalStaff - activeStaff - onLeaveStaff);

        long todayPresent = staffAttendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.PRESENT)
                + staffAttendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.HALF_DAY);
        long todayLate = staffAttendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.LATE);
        long todayAbsent = staffAttendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.ABSENT);
        long todayOnLeave = staffAttendanceRepository.countByAttendanceDateAndStatus(today, AttendanceStatus.ON_LEAVE);

        long pendingLeaves = leaves.stream().filter(l -> l.getStatus() == LeaveStatus.PENDING).count();
        long approvedLeaves = leaves.stream().filter(l -> l.getStatus() == LeaveStatus.APPROVED).count();

        BigDecimal monthlyPayroll = defaultZero(staffEmployeeRepository.sumActiveMonthlyPayroll());

        List<ReportMetricItemDto> roleBreakdown = new ArrayList<>();
        for (StaffRoleCategory rc : StaffRoleCategory.values()) {
            List<StaffEmployee> byRole = staffList.stream().filter(s -> s.getRoleCategory() == rc).collect(Collectors.toList());
            if (!byRole.isEmpty()) {
                BigDecimal rolePayroll = byRole.stream()
                        .map(s -> s.getBasicSalary() != null ? s.getBasicSalary() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                roleBreakdown.add(buildMetric(rc.name(), rc.name().replace('_', ' '), byRole.size(), rolePayroll, totalStaff, "Monthly Basic: LKR " + rolePayroll.toPlainString()));
            }
        }

        List<ReportMetricItemDto> deptStaffing = departments.stream()
                .map(d -> {
                    long empCount = staffList.stream().filter(s -> s.getDepartment() != null && s.getDepartment().getId().equals(d.getId())).count();
                    long docCount = doctors.stream().filter(doc -> doc.getDepartment() != null && doc.getDepartment().getId().equals(d.getId())).count();
                    return buildMetric(d.getCode(), d.getName() + " (" + d.getCode() + ")", empCount, BigDecimal.valueOf(docCount), totalStaff, docCount + " Specialist Doctor(s)");
                })
                .collect(Collectors.toList());

        List<ReportMetricItemDto> shiftBreakdown = new ArrayList<>();
        for (ShiftType st : ShiftType.values()) {
            long c = staffList.stream().filter(s -> s.getShiftType() == st).count();
            if (c > 0) {
                shiftBreakdown.add(buildMetric(st.name(), st.name().replace('_', ' '), c, BigDecimal.ZERO, totalStaff, "Assigned roster shift"));
            }
        }

        Map<LeaveType, Long> leaveCounts = leaves.stream()
                .collect(Collectors.groupingBy(StaffLeaveRecord::getLeaveType, Collectors.counting()));
        List<ReportMetricItemDto> leaveBreakdown = leaveCounts.entrySet().stream()
                .map(e -> buildMetric(e.getKey().name(), e.getKey().name() + " Leave", e.getValue(), BigDecimal.ZERO, Math.max(1, leaves.size()), "Leave applications"))
                .collect(Collectors.toList());

        return StaffReportAnalyticsDto.builder()
                .totalStaffEmployees(totalStaff)
                .activeStaffCount(activeStaff)
                .onLeaveStaffCount(onLeaveStaff)
                .inactiveStaffCount(inactiveStaff)
                .totalDoctorsCount(doctors.size())
                .todayPresentCount(todayPresent)
                .todayLateCount(todayLate)
                .todayAbsentCount(todayAbsent)
                .todayOnLeaveCount(todayOnLeave)
                .pendingLeaveRequestsCount(pendingLeaves)
                .approvedLeaveRequestsCount(approvedLeaves)
                .monthlyPayrollCommitment(monthlyPayroll)
                .roleCategoryBreakdown(roleBreakdown)
                .departmentStaffingBreakdown(deptStaffing)
                .shiftTypeBreakdown(shiftBreakdown)
                .leaveTypeBreakdown(leaveBreakdown)
                .build();
    }

    // =========================================================================
    // SAVED / GENERATED REPORTS REGISTRY (CRUD & SNAPSHOT GENERATION)
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<HospitalReportDto> searchSavedReports(
            String query,
            ReportCategory category,
            ReportStatus status,
            Pageable pageable) {
        return reportRepository.searchReports(query, category, status, pageable)
                .map(this::mapToReportDto);
    }

    @Transactional(readOnly = true)
    public HospitalReportDto getSavedReportById(Long id) {
        HospitalReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HospitalReport", "id", id));
        return mapToReportDto(report);
    }

    @Transactional
    public HospitalReportDto generateAndSaveReport(
            GenerateReportRequest request,
            User currentUser,
            HttpServletRequest httpRequest) {

        String reportNumber = generateReportNumber();
        LocalDate start = request.getPeriodStart() != null ? request.getPeriodStart() : LocalDate.now().minusDays(30);
        LocalDate end = request.getPeriodEnd() != null ? request.getPeriodEnd() : LocalDate.now();
        String deptName = (request.getDepartmentName() != null && !request.getDepartmentName().isBlank())
                ? request.getDepartmentName().trim()
                : "All Hospital Departments";

        // Automatically compute live metrics for the selected category
        long recordsAnalyzed = 0;
        String primaryLabel = "Records Analyzed";
        String primaryValue = "0";
        String defaultSummary = "";
        String defaultFindings = "";
        String defaultRecommendations = "";

        switch (request.getReportCategory()) {
            case PATIENT_REPORT -> {
                PatientReportAnalyticsDto p = getPatientReportAnalytics();
                recordsAnalyzed = p.getTotalPatients() + p.getTotalAdmissionsCount();
                primaryLabel = "Total Registered Patients";
                primaryValue = p.getTotalPatients() + " Patients (" + p.getActiveAdmissionsCount() + " Active Inpatient)";
                defaultSummary = "Live demographic and inpatient admission snapshot covering " + p.getTotalPatients() + " registered patients and " + p.getTotalAdmissionsCount() + " ward admissions.";
                defaultFindings = "Active Patients: " + p.getActivePatientsCount() + " | Male: " + p.getMalePatientsCount() + " | Female: " + p.getFemalePatientsCount() + " | EMR Files: " + p.getTotalMedicalRecordsCount();
                defaultRecommendations = "Continue routine demographic & allergy verification across outpatient and inpatient desks.";
            }
            case APPOINTMENT_REPORT -> {
                AppointmentReportAnalyticsDto a = getAppointmentReportAnalytics();
                recordsAnalyzed = a.getTotalAppointments();
                primaryLabel = "Appointment Fulfillment";
                primaryValue = a.getCompletionRatePercentage() + "% Active/Completed";
                defaultSummary = "Outpatient appointment scheduling and specialist clinic utilization analysis across " + a.getTotalAppointments() + " bookings.";
                defaultFindings = "Scheduled/Confirmed: " + (a.getScheduledCount() + a.getConfirmedCount()) + " | Completed: " + a.getCompletedCount() + " | Est. Consultation Value: LKR " + a.getEstimatedConsultationValue();
                defaultRecommendations = "Optimize specialist queue allocations for peak morning outpatient clinic hours.";
            }
            case REVENUE_REPORT -> {
                RevenueReportAnalyticsDto r = getRevenueReportAnalytics();
                recordsAnalyzed = r.getTotalInvoicesCount() + r.getTotalPaymentsCount();
                primaryLabel = "Total Billed Revenue";
                primaryValue = "LKR " + r.getTotalBilledRevenue().toPlainString() + " (" + r.getCollectionRatePercentage() + "% Collected)";
                defaultSummary = "Financial revenue audit across Consultation, Laboratory, Pharmacy, and Inpatient Admission charges.";
                defaultFindings = "Total Billed: LKR " + r.getTotalBilledRevenue() + " | Collected: LKR " + r.getTotalCollectedRevenue() + " | Outstanding Balance: LKR " + r.getOutstandingReceivables();
                defaultRecommendations = "Follow up on partially paid and open invoices to maximize cash flow recovery.";
            }
            case PHARMACY_REPORT -> {
                PharmacyReportAnalyticsDto ph = getPharmacyReportAnalytics();
                recordsAnalyzed = ph.getTotalMedicinesCount() + ph.getTotalBatchesCount();
                primaryLabel = "Inventory Valuation";
                primaryValue = "LKR " + ph.getTotalInventoryValuation().toPlainString() + " (" + ph.getTotalUnitsInStock() + " Units)";
                defaultSummary = "Pharmacy formulary stock valuation, FEFO expiry audit, and dispensing revenue summary.";
                defaultFindings = "Active Medicines: " + ph.getActiveMedicinesCount() + " | Low Stock Alerts: " + ph.getLowStockMedicinesCount() + " | Expiring Soon: " + ph.getExpiringSoonBatchesCount() + " | Expired: " + ph.getExpiredBatchesCount();
                defaultRecommendations = "Replenish low-stock items and prioritize FEFO dispensing for batches nearing expiry.";
            }
            case LABORATORY_REPORT -> {
                LaboratoryReportAnalyticsDto l = getLaboratoryReportAnalytics();
                recordsAnalyzed = l.getTotalLabRequestsCount() + l.getNormalResultsCount() + l.getAbnormalHighLowResultsCount();
                primaryLabel = "Diagnostic Requests";
                primaryValue = l.getTotalLabRequestsCount() + " Orders (" + l.getFinalizedLabReportsCount() + " Finalized Reports)";
                defaultSummary = "Clinical pathology diagnostic test volume, specimen collection, and abnormal result flag audit.";
                defaultFindings = "Completed Requests: " + l.getCompletedRequestsCount() + " | Abnormal/High Flags: " + l.getAbnormalHighLowResultsCount() + " | Critical Flags: " + l.getCriticalResultsCount();
                defaultRecommendations = "Maintain rapid turnaround for Urgent/STAT diagnostic panels and abnormal flag notifications.";
            }
            case STAFF_REPORT -> {
                StaffReportAnalyticsDto s = getStaffReportAnalytics();
                recordsAnalyzed = s.getTotalStaffEmployees() + s.getTotalDoctorsCount();
                primaryLabel = "Hospital Workforce";
                primaryValue = s.getTotalStaffEmployees() + " Staff & " + s.getTotalDoctorsCount() + " Doctors";
                defaultSummary = "Human resources workforce distribution, daily shift attendance, leave utilization, and monthly payroll report.";
                defaultFindings = "Active Staff: " + s.getActiveStaffCount() + " | Today On-Duty: " + (s.getTodayPresentCount() + s.getTodayLateCount()) + " | Monthly Payroll: LKR " + s.getMonthlyPayrollCommitment();
                defaultRecommendations = "Ensure balanced shift rotation and timely supervisor review of pending leave applications.";
            }
        }

        HospitalReport report = HospitalReport.builder()
                .reportNumber(reportNumber)
                .reportTitle(request.getReportTitle().trim())
                .reportCategory(request.getReportCategory())
                .periodStart(start)
                .periodEnd(end)
                .departmentName(deptName)
                .totalRecordsAnalyzed(recordsAnalyzed)
                .primaryMetricLabel(primaryLabel)
                .primaryMetricValue(primaryValue)
                .executiveSummary(notBlankOrDefault(request.getExecutiveSummary(), defaultSummary))
                .keyFindings(notBlankOrDefault(request.getKeyFindings(), defaultFindings))
                .recommendations(notBlankOrDefault(request.getRecommendations(), defaultRecommendations))
                .status(request.getStatus() != null ? request.getStatus() : ReportStatus.FINALIZED)
                .generatedBy(currentUser)
                .build();

        HospitalReport saved = reportRepository.save(report);

        auditLogService.log(
                currentUser,
                "HOSPITAL_REPORT_GENERATED",
                "HOSPITAL_REPORT",
                String.valueOf(saved.getId()),
                "Generated analytical report " + saved.getReportNumber() + " (" + saved.getReportCategory() + "): " + saved.getReportTitle(),
                httpRequest
        );

        return mapToReportDto(saved);
    }

    @Transactional
    public void deleteSavedReport(Long id, User currentUser, HttpServletRequest httpRequest) {
        HospitalReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HospitalReport", "id", id));
        reportRepository.delete(report);

        auditLogService.log(
                currentUser,
                "HOSPITAL_REPORT_DELETED",
                "HOSPITAL_REPORT",
                String.valueOf(id),
                "Deleted saved report " + report.getReportNumber() + " (" + report.getReportTitle() + ")",
                httpRequest
        );
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public HospitalReportDto mapToReportDto(HospitalReport r) {
        return HospitalReportDto.builder()
                .id(r.getId())
                .reportNumber(r.getReportNumber())
                .reportTitle(r.getReportTitle())
                .reportCategory(r.getReportCategory())
                .periodStart(r.getPeriodStart())
                .periodEnd(r.getPeriodEnd())
                .departmentName(r.getDepartmentName())
                .totalRecordsAnalyzed(r.getTotalRecordsAnalyzed())
                .primaryMetricLabel(r.getPrimaryMetricLabel())
                .primaryMetricValue(r.getPrimaryMetricValue())
                .executiveSummary(r.getExecutiveSummary())
                .keyFindings(r.getKeyFindings())
                .recommendations(r.getRecommendations())
                .reportPayloadJson(r.getReportPayloadJson())
                .status(r.getStatus())
                .generatedByName(r.getGeneratedBy() != null
                        ? r.getGeneratedBy().getFirstName() + " " + r.getGeneratedBy().getLastName()
                        : "System Analytics Engine")
                .generatedAt(r.getGeneratedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private ReportMetricItemDto buildMetric(String key, String label, long count, BigDecimal amount, long totalCount, String secondaryInfo) {
        double pct = totalCount > 0 ? roundPct(((double) count / totalCount) * 100.0) : 0.0;
        return ReportMetricItemDto.builder()
                .key(key)
                .label(label)
                .count(count)
                .amount(amount != null ? amount : BigDecimal.ZERO)
                .percentage(pct)
                .secondaryInfo(secondaryInfo)
                .build();
    }

    private ReportMetricItemDto buildAmountMetric(String key, String label, BigDecimal amount, BigDecimal totalAmount, String secondaryInfo) {
        BigDecimal safeAmt = amount != null ? amount : BigDecimal.ZERO;
        double pct = (totalAmount != null && totalAmount.compareTo(BigDecimal.ZERO) > 0)
                ? roundPct(safeAmt.multiply(BigDecimal.valueOf(100)).divide(totalAmount, 2, RoundingMode.HALF_UP).doubleValue())
                : 0.0;
        return ReportMetricItemDto.builder()
                .key(key)
                .label(label)
                .count(0)
                .amount(safeAmt)
                .percentage(pct)
                .secondaryInfo(secondaryInfo)
                .build();
    }

    private BigDecimal defaultZero(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private double roundPct(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private String notBlankOrDefault(String val, String fallback) {
        return (val != null && !val.isBlank()) ? val.trim() : fallback;
    }

    private synchronized String generateReportNumber() {
        return reportRepository.findTopByOrderByIdDesc()
                .map(r -> String.format("RPT-%05d", r.getId() + 10001))
                .orElse("RPT-10001");
    }
}
