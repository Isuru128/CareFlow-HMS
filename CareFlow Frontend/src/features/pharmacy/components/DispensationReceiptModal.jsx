import React, { useRef } from 'react'
import { X, Printer, HeartPulse, CheckCircle2, Pill } from 'lucide-react'
import { DispensationStatusBadge, PaymentStatusBadge } from './PharmacyStatusBadge'

export default function DispensationReceiptModal({ isOpen, onClose, dispensation }) {
  const printAreaRef = useRef(null)

  if (!isOpen || !dispensation) return null

  const handlePrint = () => {
    window.print()
  }

  const items = dispensation.items || []

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Printer size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                Pharmacy Dispensation Receipt
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official invoice #{dispensation.dispensationNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Printable Invoice Container */}
          <div
            ref={printAreaRef}
            id="printable-pharmacy-receipt"
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#38bdf8' }}>
                  <HeartPulse size={36} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
                    CareFlow Hospital
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.05em' }}>
                    PHARMACY & DISPENSARY SERVICES
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No 128, Healthcare Avenue, Colombo 07 | Tel: +94 11 234 5678
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                  {dispensation.dispensationNumber}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {new Date(dispensation.dispensedAt).toLocaleString()}
                </div>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                  <DispensationStatusBadge status={dispensation.status} />
                  <PaymentStatusBadge status={dispensation.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Patient & Dispenser Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', marginBottom: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient</span>
                <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                  {dispensation.patientName}
                </div>
                {dispensation.patientNumber && (
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{dispensation.patientNumber}</div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prescriber / Doctor</span>
                <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.88rem' }}>
                  {dispensation.doctorName ? `Dr. ${dispensation.doctorName}` : 'Walk-In / OTC Sale'}
                </div>
                {dispensation.prescriptionNumber && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rx: {dispensation.prescriptionNumber}</div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pharmacist</span>
                <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.88rem' }}>
                  {dispensation.dispensedByName || 'Licensed Pharmacist'}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.2rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem 0.25rem' }}>#</th>
                  <th style={{ padding: '0.5rem' }}>Medicine & Strength</th>
                  <th style={{ padding: '0.5rem' }}>Batch</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price (LKR)</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.82rem' }}>
                    <td style={{ padding: '0.6rem 0.25rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '0.6rem' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.medicineName}</div>
                      {item.dosageInstructions && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.dosageInstructions}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem', color: '#38bdf8' }}>{item.batchNumber || 'N/A'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                      {(item.subtotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem' }}>
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>LKR {(dispensation.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Discount / Tax:</span>
                  <span>LKR 0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.4rem' }}>
                  <span>Total Due:</span>
                  <span>LKR {(dispensation.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Counseling Note */}
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.05)', border: '1px dashed rgba(56, 189, 248, 0.2)', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              Thank you for trusting CareFlow Pharmacy. Keep medicines in a cool, dry place out of reach of children. Take exactly as advised by your physician.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Printer size={16} />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
