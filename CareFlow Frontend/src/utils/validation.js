/**
 * CareFlow HMS - Centralized Attribute Validation Utilities
 * Enforces strict attribute validation rules:
 * - Phone numbers: 10 digits (e.g., 0771234567)
 * - Email addresses: ***@***.com / ***@***.lk format
 * - NIC / Passport: 12-digit new NIC, 9-digit+V/X old NIC, or 6-15 char Passport
 * - Names: 2-50 letters, spaces, dots, hyphens, apostrophes
 * - Clinical vitals & financial values: realistic medical and positive numeric bounds
 */

export const PHONE_REGEX = /^(\d{10}|\+94\d{9})$/
export const TEN_DIGIT_PHONE_REGEX = /^\d{10}$/
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const NIC_OR_PASSPORT_REGEX = /^([0-9]{9}[VvXx]|[0-9]{12}|[A-Za-z0-9-]{6,15})$/
export const NAME_REGEX = /^[A-Za-z .'-]{2,100}$/
export const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/
export const LICENSE_REGEX = /^[A-Za-z0-9/-]{3,50}$/
export const DEPT_CODE_REGEX = /^[A-Za-z0-9_-]{2,20}$/
export const BLOOD_PRESSURE_REGEX = /^[0-9]{2,3}\/[0-9]{2,3}(\s*mmHg)?$/

/**
 * Normalizes a phone string by converting +94XXXXXXXXX to 0XXXXXXXXX (10 digits)
 * and stripping spaces or dashes.
 */
export function normalizePhoneTo10Digits(raw) {
  if (!raw) return ''
  const cleaned = String(raw).replace(/[\s-]/g, '')
  if (/^\+94\d{9}$/.test(cleaned)) {
    return '0' + cleaned.slice(3)
  }
  return cleaned
}

export function validatePhone(phone, label = 'Phone number', required = true) {
  const val = normalizePhoneTo10Digits(phone)
  if (!val) {
    return required ? `${label} is required.` : null
  }
  if (!TEN_DIGIT_PHONE_REGEX.test(val)) {
    return `${label} must be exactly 10 digits (e.g., 0771234567).`
  }
  return null
}

export function validateEmail(email, label = 'Email address', required = true) {
  const val = (email || '').trim()
  if (!val) {
    return required ? `${label} is required.` : null
  }
  if (!EMAIL_REGEX.test(val)) {
    return `${label} must be a valid format (e.g., name@domain.com or name@domain.lk).`
  }
  return null
}

export function validateName(name, label = 'Name', required = true) {
  const val = (name || '').trim()
  if (!val) {
    return required ? `${label} is required.` : null
  }
  if (val.length < 2 || val.length > 50) {
    return `${label} must be between 2 and 50 characters.`
  }
  if (!NAME_REGEX.test(val)) {
    return `${label} can only contain letters, spaces, dots, hyphens, and apostrophes.`
  }
  return null
}

export function validateNicOrPassport(nic, required = false) {
  const val = (nic || '').trim()
  if (!val) {
    return required ? 'NIC or Passport number is required.' : null
  }
  if (!NIC_OR_PASSPORT_REGEX.test(val)) {
    return 'NIC/Passport must be a valid 12-digit NIC (e.g., 199012345678), 9-digit+V/X NIC (e.g., 901234567V), or Passport number.'
  }
  return null
}

export function validatePatientForm(formData) {
  const fnErr = validateName(formData.firstName, 'First name', true)
  if (fnErr) return fnErr

  const lnErr = validateName(formData.lastName, 'Last name', true)
  if (lnErr) return lnErr

  if (!formData.dateOfBirth) {
    return 'Date of birth is required.'
  }
  if (new Date(formData.dateOfBirth) > new Date()) {
    return 'Date of birth cannot be in the future.'
  }

  const nicErr = validateNicOrPassport(formData.nicOrPassport, false)
  if (nicErr) return nicErr

  const phoneErr = validatePhone(formData.contactNumber, 'Contact number', true)
  if (phoneErr) return phoneErr

  const emailErr = validateEmail(formData.email, 'Email address', false)
  if (emailErr) return emailErr

  if (formData.emergencyContactName && formData.emergencyContactName.trim()) {
    const emNameErr = validateName(formData.emergencyContactName, 'Emergency contact name', false)
    if (emNameErr) return emNameErr
  }

  const emPhoneErr = validatePhone(formData.emergencyContactNumber, 'Emergency contact phone number', false)
  if (emPhoneErr) return emPhoneErr

  return null
}

export function validateDoctorForm(formData) {
  const fnErr = validateName(formData.firstName, 'First name', true)
  if (fnErr) return fnErr

  const lnErr = validateName(formData.lastName, 'Last name', true)
  if (lnErr) return lnErr

  if (!formData.licenseNumber || !LICENSE_REGEX.test(formData.licenseNumber.trim())) {
    return 'Medical license number must be 3-50 alphanumeric characters (e.g., SLMC-12345).'
  }

  if (!formData.specialization || formData.specialization.trim().length < 2) {
    return 'Specialization is required (minimum 2 characters).'
  }

  if (!formData.departmentId) {
    return 'Please select a department.'
  }

  if (!formData.qualification || formData.qualification.trim().length < 2) {
    return 'Qualifications are required.'
  }

  const exp = Number(formData.experienceYears)
  if (Number.isNaN(exp) || exp < 0 || exp > 70) {
    return 'Experience years must be between 0 and 70.'
  }

  const fee = Number(formData.consultationFee)
  if (Number.isNaN(fee) || fee < 0) {
    return 'Consultation fee must be a non-negative amount.'
  }

  const phoneErr = validatePhone(formData.contactNumber, 'Contact number', true)
  if (phoneErr) return phoneErr

  const emailErr = validateEmail(formData.email, 'Email address', false)
  if (emailErr) return emailErr

  return null
}

export function validateDepartmentForm(formData) {
  if (!formData.name || formData.name.trim().length < 2) {
    return 'Department name must be at least 2 characters.'
  }
  if (!formData.code || !DEPT_CODE_REGEX.test(formData.code.trim())) {
    return 'Department code must be 2-20 alphanumeric characters (e.g., CARD).'
  }
  const phoneErr = validatePhone(formData.contactNumber, 'Department contact number', false)
  if (phoneErr) return phoneErr

  return null
}

export function validateUserForm(formData, isEditing = false) {
  if (!isEditing) {
    if (!formData.username || !USERNAME_REGEX.test(formData.username.trim())) {
      return 'Username must be 3-50 characters and contain only letters, numbers, dots, underscores, or hyphens.'
    }
    const emailErr = validateEmail(formData.email, 'Email address', true)
    if (emailErr) return emailErr

    if (!formData.password || formData.password.length < 6) {
      return 'Password must be at least 6 characters.'
    }
  }

  const fnErr = validateName(formData.firstName, 'First name', true)
  if (fnErr) return fnErr

  const lnErr = validateName(formData.lastName, 'Last name', true)
  if (lnErr) return lnErr

  const phoneErr = validatePhone(formData.phoneNumber, 'Phone number', false)
  if (phoneErr) return phoneErr

  if (!formData.roles || formData.roles.length === 0) {
    return 'At least one user role must be assigned.'
  }

  return null
}

export function validateEmployeeForm(formData) {
  const fnErr = validateName(formData.firstName, 'First name', true)
  if (fnErr) return fnErr

  const lnErr = validateName(formData.lastName, 'Last name', true)
  if (lnErr) return lnErr

  const nicErr = validateNicOrPassport(formData.nicOrPassport, true)
  if (nicErr) return nicErr

  if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
    return 'Date of birth cannot be in the future.'
  }

  const phoneErr = validatePhone(formData.contactNumber, 'Contact number', true)
  if (phoneErr) return phoneErr

  const emailErr = validateEmail(formData.email, 'Official email', true)
  if (emailErr) return emailErr

  const emPhoneErr = validatePhone(formData.emergencyContactNumber, 'Emergency contact phone', false)
  if (emPhoneErr) return emPhoneErr

  if (!formData.designation || formData.designation.trim().length < 2) {
    return 'Designation / Job title is required (minimum 2 characters).'
  }

  if (!formData.departmentId) {
    return 'Please select an assigned hospital department.'
  }

  const salary = Number(formData.basicSalary)
  if (Number.isNaN(salary) || salary < 0) {
    return 'Basic monthly salary cannot be negative.'
  }

  return null
}

