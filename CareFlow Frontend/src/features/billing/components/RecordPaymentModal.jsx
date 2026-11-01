import React, { useState, useEffect } from 'react'
import { X, CreditCard, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react'
import { billingApi } from '../api/billingApi'
import { InvoiceStatusBadge } from './BillingStatusBadge'

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoice: initialInvoice = null,
  openInvoices = [],
  onPaymentRecorded
}) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [transactionReference, setTransactionReference] = useState('')
  const [payerName, setPayerName] = useState('')
  const [insuranceProvider, setInsuranceProvider] = useState('')
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const activeInvoice = initialInvoice || openInvoices.find(inv => inv.id === Number(selectedInvoiceId)) || null

  useEffect(() => {
    if (isOpen) {
      if (initialInvoice) {
        setSelectedInvoiceId(String(initialInvoice.id))
        setAmount(String(initialInvoice.balanceDue || 0))
        setPayerName(initialInvoice.patientName || '')
      } else if (openInvoices.length > 0) {
        const firstUnpaid = openInvoices.find(i => Number(i.balanceDue) > 0) || openInvoices[0]
        setSelectedInvoiceId(String(firstUnpaid.id))
        setAmount(String(firstUnpaid.balanceDue || 0))
        setPayerName(firstUnpaid.patientName || '')
      } else {
        setSelectedInvoiceId('')
        setAmount('')
        setPayerName('')
      }
      setPaymentMethod('CASH')
      setTransactionReference('')
      setInsuranceProvider('')
      setInsurancePolicyNumber('')
      setNotes('')
      setError(null)
    }
  }, [isOpen, initialInvoice, openInvoices])

  if (!isOpen) return null

  const handleInvoiceSelect = (invId) => {
    setSelectedInvoiceId(invId)
    const found = openInvoices.find(i => i.id === Number(invId))
    if (found) {
      setAmount(String(found.balanceDue || 0))
      setPayerName(found.patientName || '')
    }
  }

  const balanceDue = Number(activeInvoice?.balanceDue || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const targetInvoiceId = initialInvoice?.id || Number(selectedInvoiceId)
    if (!targetInvoiceId) {
      setError('Please select an invoice to record payment against.')
      return
    }

    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Payment amount must be greater than zero.')
      return
    }
    if (numAmount > balanceDue) {
      setError(`Payment amount (LKR ${numAmount.toLocaleString()}) cannot exceed the remaining balance due (LKR ${balanceDue.toLocaleString()}).`)
      return
    }

    try {
      setLoading(true)
      const payment = await billingApi.recordPayment(targetInvoiceId, {
        invoiceId: targetInvoiceId,
        amount: numAmount,
        paymentMethod,
        transactionReference: transactionReference.trim() || null,
        payerName: payerName.trim() || null,
        insuranceProvider: insuranceProvider.trim() || null,
        insurancePolicyNumber: insurancePolicyNumber.trim() || null,
        notes: notes.trim() || null
      })

      onPaymentRecorded?.(payment)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record payment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '620px', width: '95%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Receive Patient Payment
              </h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record full or partial settlement and generate official payment receipt
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Selector if not preselected */}
          {!initialInvoice && (
            <div>
              <label className="form-label">Select Unpaid / Partially Paid Invoice *</label>
              <select
                className="form-select"
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                required
              >
                <option value="">-- Choose Invoice --</option>
                {openInvoices
                  .filter(inv => Number(inv.balanceDue) > 0 && inv.status !== 'CANCELLED')
                  .map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.patientName} ({inv.patientNumber}) | Balance: LKR {Number(inv.balanceDue).toLocaleString()}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Invoice Balance Summary Card */}
          {activeInvoice && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1rem' }}>{activeInvoice.invoiceNumber}</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {activeInvoice.patientName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({activeInvoice.patientNumber})</span>
                  </div>
                </div>
                <InvoiceStatusBadge status={activeInvoice.status} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '0.75rem',
                fontSize: '0.82rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Total Bill</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    LKR {Number(activeInvoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Already Paid</div>
                  <div style={{ fontWeight: 700, color: '#059669' }}>
                    LKR {Number(activeInvoice.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Balance Due</div>
                  <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                    LKR {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Quick Buttons */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Payment Amount (LKR) *</label>
              {balanceDue > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setAmount(String(balanceDue))}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    Full Balance ({balanceDue.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round((balanceDue / 2) * 100) / 100))}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    50% Installment
                  </button>
                </div>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue || undefined}
              className="form-input"
              style={{ fontSize: '1.05rem', fontWeight: 700 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Cash Counter</option>
                <option value="CARD">Credit / Debit Card (POS)</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                <option value="INSURANCE">Corporate / Medical Insurance</option>
                <option value="ONLINE">Online Payment Gateway</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="form-label">Payer Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Patient or relative name"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
              />
            </div>
          </div>

          {paymentMethod !== 'CASH' && (
            <div>
              <label className="form-label">Transaction / Approval / Slip Reference</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. TXN-VISA-482910, Bank Transfer Ref, or Cheque No."
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>
          )}

          {paymentMethod === 'INSURANCE' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Insurance Provider *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ceylinco Health, AIA, Softlogic Life"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Policy / Claim Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Policy or Pre-Auth ID"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Payment Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Optional cashier remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '0 -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }} disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Processing...' : 'Confirm & Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

