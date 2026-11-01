import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  CreditCard
} from 'lucide-react'
import { billingApi } from '../api/billingApi'
import { ChargeTypeBadge } from './BillingStatusBadge'

const ROOM_TARIFFS = [
  { code: 'WARD-GEN', label: 'General Medical / Surgical Ward Bed (Room + Nursing)', price: 3500 },
  { code: 'WARD-SEMI', label: 'Semi-Private Twin Sharing Room (Room + Nursing)', price: 8000 },
  { code: 'WARD-PVT', label: 'Private Air-Conditioned Room (Room + Nursing)', price: 14500 },
  { code: 'WARD-DLX', label: 'Deluxe Executive Patient Suite (Room + Nursing)', price: 24000 },
  { code: 'WARD-ICU', label: 'Intensive Care Unit (ICU) Critical Care Bed', price: 35000 },
  { code: 'WARD-OBS', label: 'Emergency Observation Unit (24-Hr Monitoring)', price: 5500 }
]

export default function GenerateInvoiceModal({
  isOpen,
  onClose,
  onInvoiceCreated,
  preselectedPatientId = null,
  preloadedItems = null
}) {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [labTests, setLabTests] = useState([])
  const [medicines, setMedicines] = useState([])

  const [patientId, setPatientId] = useState('')
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [notes, setNotes] = useState('')

  // Patient discovered billable charges (Consultation, Lab, Pharmacy, Admission)
  const [patientCharges, setPatientCharges] = useState([])
  const [loadingCharges, setLoadingCharges] = useState(false)

  // Invoice line items
  const [items, setItems] = useState([
    {
      chargeType: 'CONSULTATION',
      referenceType: 'MANUAL',
      referenceCode: '',
      description: '',
      serviceDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discountAmount: 0
    }
  ])

  // Optional immediate payment at billing time
  const [collectPaymentNow, setCollectPaymentNow] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [transactionReference, setTransactionReference] = useState('')
  const [insuranceProvider, setInsuranceProvider] = useState('')
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadReferenceCatalogs()
      if (preselectedPatientId) {
        setPatientId(String(preselectedPatientId))
        fetchBillableChargesForPatient(preselectedPatientId)
      } else {
        setPatientId('')
        setPatientCharges([])
      }
      if (preloadedItems && preloadedItems.length > 0) {
        setItems(preloadedItems)
      } else {
        setItems([
          {
            chargeType: 'CONSULTATION',
            referenceType: 'MANUAL',
            referenceCode: '',
            description: '',
            serviceDate: new Date().toISOString().split('T')[0],
            quantity: 1,
            unitPrice: 0,
            discountAmount: 0
          }
        ])
      }
      setDiscountAmount(0)
      setTaxAmount(0)
      setNotes('')
      setCollectPaymentNow(false)
      setPaymentAmount('')
      setTransactionReference('')
      setError(null)
    }
  }, [isOpen, preselectedPatientId, preloadedItems])

  const loadReferenceCatalogs = async () => {
    try {
      const [pts, docs, labs, meds] = await Promise.all([
        billingApi.getPatientsList().catch(() => []),
        billingApi.getDoctorsList().catch(() => []),
        billingApi.getLabTestsCatalog().catch(() => []),
        billingApi.getMedicinesCatalog().catch(() => [])
      ])
      setPatients(pts)
      setDoctors(docs)
      setLabTests(labs)
      setMedicines(meds)
    } catch (err) {
      console.error('Failed to load billing reference catalogs:', err)
    }
  }

  const fetchBillableChargesForPatient = async (pid) => {
    if (!pid) {
      setPatientCharges([])
      return
    }
    try {
      setLoadingCharges(true)
      const data = await billingApi.getPatientBillableCharges(pid)
      setPatientCharges(data || [])
    } catch (err) {
      console.error('Error loading patient billable charges:', err)
    } finally {
      setLoadingCharges(false)
    }
  }

  const handlePatientChange = (pid) => {
    setPatientId(pid)
    fetchBillableChargesForPatient(pid)
  }

  // Import a single discovered charge into the invoice items list
  const importChargeItem = (charge) => {
    const newItem = {
      chargeType: charge.chargeType,
      referenceType: charge.referenceType || 'SYSTEM',
      referenceId: charge.referenceId || null,
      referenceCode: charge.referenceCode || '',
      description: charge.description,
      serviceDate: charge.serviceDate || new Date().toISOString().split('T')[0],
      quantity: charge.quantity || 1,
      unitPrice: Number(charge.unitPrice) || 0,
      discountAmount: 0
    }

    // Replace empty first line if it has no description
    if (items.length === 1 && !items[0].description.trim() && Number(items[0].unitPrice) === 0) {
      setItems([newItem])
    } else {
      const exists = charge.referenceCode && items.some(i => i.referenceCode === charge.referenceCode)
      if (!exists) {
        setItems([...items, newItem])
      }
    }
  }

  // Import all unbilled charges for the selected patient
  const importAllUnbilledCharges = () => {
    const unbilled = patientCharges.filter(c => !c.alreadyBilled)
    if (unbilled.length === 0) return

    const mapped = unbilled.map(charge => ({
      chargeType: charge.chargeType,
      referenceType: charge.referenceType || 'SYSTEM',
      referenceId: charge.referenceId || null,
      referenceCode: charge.referenceCode || '',
      description: charge.description,
      serviceDate: charge.serviceDate || new Date().toISOString().split('T')[0],
      quantity: charge.quantity || 1,
      unitPrice: Number(charge.unitPrice) || 0,
      discountAmount: 0
    }))

    if (items.length === 1 && !items[0].description.trim() && Number(items[0].unitPrice) === 0) {
      setItems(mapped)
    } else {
      const existingCodes = new Set(items.map(i => i.referenceCode).filter(Boolean))
      const filtered = mapped.filter(m => !m.referenceCode || !existingCodes.has(m.referenceCode))
      setItems([...items, ...filtered])
    }
  }

  // Quick Catalog Add Helpers
  const handleQuickAddDoctorConsultation = (docId) => {
    if (!docId) return
    const doc = doctors.find(d => d.id === Number(docId))
    if (!doc) return
    importChargeItem({
      chargeType: 'CONSULTATION',
      referenceType: 'DOCTOR_TARIFF',
      referenceId: doc.id,
      referenceCode: doc.doctorNumber,
      description: `Specialist Consultation - Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization})`,
      serviceDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: Number(doc.consultationFee) || 2500
    })
  }

  const handleQuickAddLabTest = (testId) => {
    if (!testId) return
    const test = labTests.find(t => t.id === Number(testId))
    if (!test) return
    importChargeItem({
      chargeType: 'LABORATORY',
      referenceType: 'LAB_CATALOG',
      referenceId: test.id,
      referenceCode: test.testCode,
      description: `Lab Diagnostic Test: ${test.testName} (${test.category})`,
      serviceDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: Number(test.price) || 1000
    })
  }

  const handleQuickAddMedicine = (medId) => {
    if (!medId) return
    const med = medicines.find(m => m.id === Number(medId))
    if (!med) return
    importChargeItem({
      chargeType: 'PHARMACY',
      referenceType: 'PHARMACY_CATALOG',
      referenceId: med.id,
      referenceCode: med.medicineCode,
      description: `Pharmacy Medication: ${med.name} (${med.strength})`,
      serviceDate: new Date().toISOString().split('T')[0],
      quantity: 10,
      unitPrice: Number(med.unitPrice) || 15
    })
  }

  const handleQuickAddRoomTariff = (tariffCode) => {
    if (!tariffCode) return
    const tariff = ROOM_TARIFFS.find(r => r.code === tariffCode)
    if (!tariff) return
    importChargeItem({
      chargeType: 'ADMISSION',
      referenceType: 'WARD_TARIFF',
      referenceCode: tariff.code,
      description: `Admission Charge: ${tariff.label}`,
      serviceDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: tariff.price
    })
  }

  const handleAddEmptyRow = (chargeType = 'CONSULTATION') => {
    setItems([
      ...items,
      {
        chargeType,
        referenceType: 'MANUAL',
        referenceCode: '',
        description: '',
        serviceDate: new Date().toISOString().split('T')[0],
        quantity: 1,
        unitPrice: 0,
        discountAmount: 0
      }
    ])
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index))
    }
  }

  // Calculations
  const itemsSubtotal = items.reduce((sum, item) => {
    const gross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
    const disc = Number(item.discountAmount) || 0
    return sum + Math.max(0, gross - disc)
  }, 0)

  const netGrandTotal = Math.max(
    0,
    itemsSubtotal - (Number(discountAmount) || 0) + (Number(taxAmount) || 0)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!patientId) {
      setError('Please select a patient to generate the invoice.')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.description || !it.description.trim()) {
        setError(`Please enter a description for charge line item #${i + 1}.`)
        return
      }
      if ((Number(it.quantity) || 0) <= 0) {
        setError(`Quantity for line item #${i + 1} must be at least 1.`)
        return
      }
    }

    try {
      setLoading(true)
      const payload = {
        patientId: Number(patientId),
        dueDate: dueDate || null,
        discountAmount: Number(discountAmount) || 0,
        taxAmount: Number(taxAmount) || 0,
        status: 'ISSUED',
        notes: notes.trim() || null,
        items: items.map(it => ({
          chargeType: it.chargeType,
          referenceType: it.referenceType || 'MANUAL',
          referenceId: it.referenceId || null,
          referenceCode: it.referenceCode || null,
          description: it.description.trim(),
          serviceDate: it.serviceDate || null,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          discountAmount: Number(it.discountAmount) || 0
        }))
      }

      if (collectPaymentNow && Number(paymentAmount) > 0) {
        payload.initialPayment = {
          amount: Number(paymentAmount),
          paymentMethod,
          transactionReference: transactionReference.trim() || null,
          insuranceProvider: insuranceProvider.trim() || null,
          insurancePolicyNumber: insurancePolicyNumber.trim() || null,
          notes: 'Initial payment collected upon bill generation'
        }
      }

      const created = await billingApi.createInvoice(payload)
      onInvoiceCreated?.(created)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate invoice.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const unbilledCount = patientCharges.filter(c => !c.alreadyBilled).length

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1040px', width: '96%', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Generate Hospital Invoice & Bill
              </h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Consolidate Consultation, Laboratory, Pharmacy & Inpatient Admission Charges
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Patient & Due Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Select Patient *</label>
              <select
                className="form-select"
                value={patientId}
                onChange={(e) => handlePatientChange(e.target.value)}
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.patientNumber} — {p.firstName} {p.lastName} ({p.contactNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Payment Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Auto-Discovered Patient Hospital Charges Panel */}
          {patientId && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DownloadCloud size={18} style={{ color: '#0284c7' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    Discovered Patient Hospital Services (Consultations, Lab, Pharmacy, Admissions)
                  </span>
                  {unbilledCount > 0 && (
                    <span style={{
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {unbilledCount} Unbilled Item(s)
                    </span>
                  )}
                </div>

                {unbilledCount > 0 && (
                  <button
                    type="button"
                    onClick={importAllUnbilledCharges}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <DownloadCloud size={14} />
                    <span>Import All {unbilledCount} Unbilled Charges</span>
                  </button>
                )}
              </div>

              {loadingCharges ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  Scanning patient appointments, lab orders, pharmacy dispensations & ward admissions...
                </div>
              ) : patientCharges.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No recorded appointments, lab requests, pharmacy dispensations, or admissions found for this patient yet. You can add charges from the catalogs below.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '0.6rem', maxHeight: '185px', overflowY: 'auto' }}>
                  {patientCharges.map((chg, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${chg.alreadyBilled ? '#e2e8f0' : '#bae6fd'}`,
                        borderRadius: '8px',
                        padding: '0.65rem 0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: chg.alreadyBilled ? 0.7 : 1
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <ChargeTypeBadge chargeType={chg.chargeType} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7' }}>
                            {chg.referenceCode}
                          </span>
                          {chg.alreadyBilled && (
                            <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                              • Billed
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={chg.description}>
                          {chg.description}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>
                          LKR {Number(chg.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {chg.quantity > 1 ? ` (${chg.quantity} x ${chg.unitPrice})` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => importChargeItem(chg)}
                        className="btn btn-secondary btn-sm"
                        style={{ flexShrink: 0, fontSize: '0.74rem', padding: '0.3rem 0.55rem' }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Catalog Charge Pickers (Consultation, Lab, Pharmacy, Admission) */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
              Quick Add Standard Charges from Hospital Tariffs & Catalogs
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
              {/* 1. Consultation Charge Picker */}
              <div>
                <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <Stethoscope size={13} color="#0284c7" /> Consultation Charges
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.6rem' }}
                  value=""
                  onChange={(e) => handleQuickAddDoctorConsultation(e.target.value)}
                >
                  <option value="">+ Add Doctor Consultation...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization}) - LKR {d.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Laboratory Charge Picker */}
              <div>
                <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <FlaskConical size={13} color="#6d28d9" /> Laboratory Charges
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.6rem' }}
                  value=""
                  onChange={(e) => handleQuickAddLabTest(e.target.value)}
                >
                  <option value="">+ Add Lab Diagnostic Test...</option>
                  {labTests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.testCode}: {t.testName} - LKR {t.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Pharmacy Charge Picker */}
              <div>
                <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <Pill size={13} color="#0f766e" /> Pharmacy Charges
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.6rem' }}
                  value=""
                  onChange={(e) => handleQuickAddMedicine(e.target.value)}
                >
                  <option value="">+ Add Pharmacy Medication...</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.strength}) - LKR {m.unitPrice}/{m.unitOfMeasure}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Admission / Room Tariff Picker */}
              <div>
                <label style={{ fontSize: '0.73rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <BedDouble size={13} color="#b45309" /> Admission / Ward Charges
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.6rem' }}
                  value=""
                  onChange={(e) => handleQuickAddRoomTariff(e.target.value)}
                >
                  <option value="">+ Add Ward / Bed Stay Tariff...</option>
                  {ROOM_TARIFFS.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.label} - LKR {r.price}/day
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Itemized Bill Lines Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Itemized Invoice Charges ({items.length})
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleAddEmptyRow('CONSULTATION')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  + Consultation
                </button>
                <button type="button" onClick={() => handleAddEmptyRow('LABORATORY')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  + Lab Charge
                </button>
                <button type="button" onClick={() => handleAddEmptyRow('PHARMACY')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  + Pharmacy Charge
                </button>
                <button type="button" onClick={() => handleAddEmptyRow('ADMISSION')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  + Admission Charge
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Category</th>
                    <th style={{ width: '110px' }}>Ref Code</th>
                    <th>Description *</th>
                    <th style={{ width: '85px', textAlign: 'center' }}>Qty/Days</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Unit Price (LKR)</th>
                    <th style={{ width: '115px', textAlign: 'right' }}>Discount (LKR)</th>
                    <th style={{ width: '125px', textAlign: 'right' }}>Line Total</th>
                    <th style={{ width: '48px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineTotal = Math.max(
                      0,
                      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discountAmount) || 0)
                    )
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '0.55rem 0.6rem' }}>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.5rem' }}
                            value={item.chargeType}
                            onChange={(e) => handleItemChange(idx, 'chargeType', e.target.value)}
                          >
                            <option value="CONSULTATION">Consultation</option>
                            <option value="LABORATORY">Laboratory</option>
                            <option value="PHARMACY">Pharmacy</option>
                            <option value="ADMISSION">Admission</option>
                            <option value="PROCEDURE">Procedure</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.55rem 0.5rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.5rem' }}
                            placeholder="e.g. APT-1"
                            value={item.referenceCode || ''}
                            onChange={(e) => handleItemChange(idx, 'referenceCode', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.55rem 0.5rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                            placeholder="Enter service, consultation, test, drug, or ward stay description"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.55rem 0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '0.4rem', textAlign: 'center' }}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.55rem 0.5rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem', textAlign: 'right' }}
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.55rem 0.5rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem', textAlign: 'right' }}
                            value={item.discountAmount}
                            onChange={(e) => handleItemChange(idx, 'discountAmount', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="btn btn-danger-outline btn-sm"
                              style={{ padding: '0.3rem' }}
                              title="Remove line"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes + Financial Summary + Immediate Payment Option */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Billing Notes / Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Optional clinical billing remarks, insurance notes, or payment terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Collect Immediate Payment Checkbox */}
              <div style={{
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                backgroundColor: collectPaymentNow ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${collectPaymentNow ? '#6ee7b7' : '#e2e8f0'}`
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                  <input
                    type="checkbox"
                    checked={collectPaymentNow}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setCollectPaymentNow(checked)
                      if (checked && !paymentAmount) {
                        setPaymentAmount(String(netGrandTotal))
                      }
                    }}
                  />
                  <CreditCard size={16} color="#059669" />
                  <span>Record Immediate Payment with Invoice Generation</span>
                </label>

                {collectPaymentNow && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Amount Received (LKR) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={netGrandTotal}
                        className="form-input"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Method *</label>
                      <select
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Credit / Debit Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="INSURANCE">Insurance Claim</option>
                        <option value="ONLINE">Online Gateway</option>
                        <option value="CHEQUE">Bank Cheque</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Transaction / Card / Policy Ref</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Receipt slip, approval code, or policy number..."
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Totals Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.15rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  LKR {itemsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Invoice Discount (LKR):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ width: '130px', textAlign: 'right', padding: '0.35rem 0.5rem' }}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax / VAT (LKR):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ width: '130px', textAlign: 'right', padding: '0.35rem 0.5rem' }}
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                />
              </div>

              <div style={{
                borderTop: '2px solid #cbd5e1',
                paddingTop: '0.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Total Payable:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>
                  LKR {netGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ margin: '0 -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Generating Invoice...' : 'Generate Official Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

