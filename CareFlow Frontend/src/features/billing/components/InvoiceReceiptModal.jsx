import React, { useState } from 'react'
import {
  X,
  Printer,
  HeartPulse,
  CreditCard,
  Plus,
  CheckCircle2,
  Receipt
} from 'lucide-react'
import {
  InvoiceStatusBadge,
  ChargeTypeBadge,
  PaymentMethodBadge,
  PaymentRecordStatusBadge
} from './BillingStatusBadge'
import { billingApi } from '../api/billingApi'

export default function InvoiceReceiptModal({
  isOpen,
  onClose,
  invoice,
  onOpenPaymentModal,
  onInvoiceUpdated
}) {
  const [showAddChargeForm, setShowAddChargeForm] = useState(false)
  const [newChargeType, setNewChargeType] = useState('CONSULTATION')
  const [newDescription, setNewDescription] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [addingCharge, setAddingCharge] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !invoice) return null

  const items = invoice.items || []
  const payments = invoice.payments || []

  const handlePrint = () => {
    window.print()
  }

  const handleAddChargeItem = async (e) => {
    e.preventDefault()
    if (!newDescription.trim() || !newUnitPrice) return

    try {
      setAddingCharge(true)
      setError(null)
      const updated = await billingApi.addInvoiceItem(invoice.id, {
        chargeType: newChargeType,
        referenceType: 'MANUAL',
        description: newDescription.trim(),
        serviceDate: new Date().toISOString().split('T')[0],
        quantity: Number(newQuantity) || 1,
        unitPrice: Number(newUnitPrice) || 0,
        discountAmount: 0
      })
      setShowAddChargeForm(false)
      setNewDescription('')
      setNewQuantity(1)
      setNewUnitPrice('')
      onInvoiceUpdated?.(updated)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add charge item.')
    } finally {
      setAddingCharge(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '860px', width: '96%', maxHeight: '92vh' }}>
        {/* Modal Header (Hidden on Print) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Hospital Invoice & Official Receipt — {invoice.invoiceNumber}
              </h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Itemized statement of Consultation, Laboratory, Pharmacy & Admission charges
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Printable Sheet Body */}
        <div className="modal-body">
          <div
            className="printable-billing-sheet"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1.75rem',
              color: '#0f172a'
            }}
          >
            {/* Hospital Letterhead */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              borderBottom: '2px solid #0284c7',
              paddingBottom: '1.15rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HeartPulse size={30} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    CareFlow General Hospital
                  </h2>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Department of Finance, Patient Billing & Revenue Services
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                    No. 128, Healthcare Avenue, Colombo 07, Sri Lanka • Tel: +94 11 234 5678 • billing@careflow.lk
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Invoice / Statement No.
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
                  {invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Issued: {invoice.issueDate ? new Date(invoice.issueDate).toLocaleString() : 'N/A'}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </div>
            </div>

            {/* Patient & Billing Metadata Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.95rem 1.15rem',
              marginBottom: '1.25rem',
              fontSize: '0.82rem'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Billed Patient
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginTop: '0.15rem' }}>
                  {invoice.patientName}
                </div>
                <div style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.78rem' }}>
                  ID: {invoice.patientNumber}
                </div>
                {invoice.patientContact && (
                  <div style={{ color: '#475569', fontSize: '0.76rem' }}>Tel: {invoice.patientContact}</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Clinical References
                </div>
                <div style={{ marginTop: '0.15rem', color: '#334155' }}>
                  {invoice.appointmentNumber ? <div>Appointment: <strong>{invoice.appointmentNumber}</strong></div> : null}
                  {invoice.admissionNumber ? <div>Admission: <strong>{invoice.admissionNumber}</strong></div> : null}
                  {!invoice.appointmentNumber && !invoice.admissionNumber && <div>Consolidated Outpatient / Inpatient Bill</div>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Billing Account Details
                </div>
                <div style={{ marginTop: '0.15rem', color: '#334155' }}>
                  <div>Due Date: <strong>{invoice.dueDate || 'Upon Receipt'}</strong></div>
                  <div>Prepared By: <strong>{invoice.createdByName || 'Billing Officer'}</strong></div>
                </div>
              </div>
            </div>

            {/* Itemized Charges Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                  Itemized Hospital Charges Breakdown
                </h4>
                {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => setShowAddChargeForm(prev => !prev)}
                    className="btn btn-secondary btn-sm no-print"
                    style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Plus size={13} />
                    <span>{showAddChargeForm ? 'Close Form' : 'Append Charge to Bill'}</span>
                  </button>
                )}
              </div>

              {/* Optional Inline Append Charge Form */}
              {showAddChargeForm && (
                <form
                  onSubmit={handleAddChargeItem}
                  className="no-print"
                  style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr 80px 130px auto',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}
                >
                  <select
                    className="form-select"
                    style={{ fontSize: '0.78rem', padding: '0.4rem' }}
                    value={newChargeType}
                    onChange={(e) => setNewChargeType(e.target.value)}
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="LABORATORY">Laboratory</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="ADMISSION">Admission</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                    placeholder="Charge description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ fontSize: '0.78rem', padding: '0.4rem', textAlign: 'center' }}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                    placeholder="Price (LKR)"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={addingCharge}>
                    {addingCharge ? 'Adding...' : 'Add'}
                  </button>
                </form>
              )}

              {error && (
                <div className="alert alert-danger no-print" style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                  {error}
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.5rem', width: '36px' }}>#</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Category</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Service Description</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Date</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Unit Price (LKR)</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Subtotal (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.65rem 0.5rem', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <ChargeTypeBadge chargeType={item.chargeType} />
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</div>
                        {item.referenceCode && (
                          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                            Ref: {item.referenceCode}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', color: '#475569' }}>
                        {item.serviceDate || '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#334155' }}>
                        {Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {Number(item.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payments History + Totals Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {/* Left: Recorded Payment Receipts */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                  Recorded Payment Receipts ({payments.length})
                </h4>
                {payments.length === 0 ? (
                  <div style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}>
                    No payments recorded yet for this invoice.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {payments.map((pay, idx) => (
                      <div
                        key={pay.id || idx}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.78rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ color: '#0284c7' }}>{pay.paymentNumber}</strong>
                            <PaymentMethodBadge method={pay.paymentMethod} />
                            <PaymentRecordStatusBadge status={pay.status} />
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                            {pay.paymentDate ? new Date(pay.paymentDate).toLocaleString() : ''}
                            {pay.transactionReference ? ` • Ref: ${pay.transactionReference}` : ''}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.9rem' }}>
                          LKR {Number(pay.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {invoice.notes && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: '#475569' }}>
                    <strong>Remarks:</strong> {invoice.notes}
                  </div>
                )}
              </div>

              {/* Right: Financial Totals Summary */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '1rem 1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Charges Subtotal:</span>
                  <span>LKR {Number(invoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Discount Applied:</span>
                  <span>- LKR {Number(invoice.discountAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Tax / VAT:</span>
                  <span>+ LKR {Number(invoice.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: '#0f172a',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '0.45rem'
                }}>
                  <span>Net Invoice Total:</span>
                  <span>LKR {Number(invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#059669' }}>
                  <span>Total Paid Received:</span>
                  <span>LKR {Number(invoice.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: Number(invoice.balanceDue) > 0 ? '#dc2626' : '#047857',
                  borderTop: '2px solid #cbd5e1',
                  paddingTop: '0.5rem'
                }}>
                  <span>Balance Due:</span>
                  <span>LKR {Number(invoice.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '0.85rem',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.74rem',
              color: '#64748b'
            }}>
              <span>Computer-generated official CareFlow Hospital Invoice & Receipt.</span>
              <span>Thank you for choosing CareFlow Hospital Services. Wishing you good health!</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions (Hidden on Print) */}
        <div className="modal-footer no-print">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>

          {Number(invoice.balanceDue) > 0 && invoice.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenPaymentModal?.(invoice)
              }}
              className="btn btn-primary"
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              <CreditCard size={16} />
              <span>Receive Payment (LKR {Number(invoice.balanceDue).toLocaleString()})</span>
            </button>
          )}

          <button type="button" onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print Invoice / Receipt</span>
          </button>
        </div>
      </div>
    </div>
  )
}

