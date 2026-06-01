/**
 * Formats a CNIC number string into XXXXX-XXXXXXX-X format as the user types.
 */
export function formatCNIC(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.substring(0, 5)}-${digits.substring(5)}`;
  }
  return `${digits.substring(0, 5)}-${digits.substring(5, 12)}-${digits.substring(12)}`;
}

/**
 * Formats a phone number string into 03XX-XXXXXXX format as the user types.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.substring(0, 4)}-${digits.substring(4)}`;
}

/**
 * Validates whether a CNIC string matches the XXXXX-XXXXXXX-X format.
 */
export function validateCNIC(value: string): boolean {
  return /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value);
}

/**
 * Validates whether a phone number string matches the 03XX-XXXXXXX format.
 */
export function validatePhone(value: string): boolean {
  return /^03[0-9]{2}-[0-9]{7}$/.test(value);
}

/**
 * Validates whether an email string is formatted correctly.
 */
export function validateEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validates a Date of Birth string.
 * Must be a valid date, not in the future, and customer must be at least 18 years old.
 */
export function validateDOB(value: string): { isValid: boolean; message?: string } {
  if (!value) return { isValid: true };
  
  const dobDate = new Date(value);
  if (isNaN(dobDate.getTime())) {
    return { isValid: false, message: 'Invalid date format.' };
  }
  
  const today = new Date();
  // Strip time parts for accurate comparison
  today.setHours(0, 0, 0, 0);
  
  if (dobDate > today) {
    return { isValid: false, message: 'Date of birth cannot be in the future.' };
  }
  
  // Calculate exact age
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  const dayDiff = today.getDate() - dobDate.getDate();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  
  if (age < 18) {
    return { isValid: false, message: 'Customer must be at least 18 years old.' };
  }
  
  return { isValid: true };
}

/**
 * Validates a House/Apartment Number string.
 */
export function validateHouseNo(value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'House / Apartment No is required.' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 1) {
    return { isValid: false, message: 'House / Apartment No is too short.' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'House / Apartment No cannot exceed 50 characters.' };
  }
  // Allow alphanumeric, spaces, hyphens, slashes, hash, commas, and periods
  const safePattern = /^[a-zA-Z0-9\s,/#.-]+$/;
  if (!safePattern.test(trimmed)) {
    return { isValid: false, message: 'House/Apartment No contains invalid characters.' };
  }
  // Reject long strings of purely numbers (like 10+ digits without punctuation) which look like phone numbers or database IDs
  if (/^\d{8,}$/.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid House/Apartment number (cannot be a long numeric sequence).' };
  }
  return { isValid: true };
}

/**
 * Validates a Street/Lane string.
 */
export function validateStreet(value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'Street / Lane is required.' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 3) {
    return { isValid: false, message: 'Street / Lane must be at least 3 characters.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: 'Street / Lane cannot exceed 100 characters.' };
  }
  // Allow alphanumeric, spaces, hyphens, slashes, hash, commas, and periods
  const safePattern = /^[a-zA-Z0-9\s,/#.-]+$/;
  if (!safePattern.test(trimmed)) {
    return { isValid: false, message: 'Street/Lane contains invalid characters.' };
  }
  // Basic gibberish detector for keyboard smash (e.g. e5y534e6ty):
  // Check if string contains 6+ consonants/numbers in a row without vowels, or looks like random hex/alphanumeric strings
  if (/[bcdfghjklmnpqrstvwxyz0-9]{6,}/i.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid Street/Lane name (avoid keyboard smashes).' };
  }
  return { isValid: true };
}

/**
 * Validates an Area/Sector string.
 */
export function validateArea(value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'Area / Sector is required.' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 3) {
    return { isValid: false, message: 'Area / Sector must be at least 3 characters.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: 'Area / Sector cannot exceed 100 characters.' };
  }
  // Allow alphanumeric, spaces, hyphens, slashes, hash, commas, periods, parentheses
  const safePattern = /^[a-zA-Z0-9\s,/#.()-]+$/;
  if (!safePattern.test(trimmed)) {
    return { isValid: false, message: 'Area/Sector contains invalid characters.' };
  }
  // Basic gibberish detector for keyboard smash (e.g. gsrsgtr)
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid Area/Sector name (avoid keyboard smashes).' };
  }
  return { isValid: true };
}

/**
 * Validates a City string.
 */
export function validateCity(value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'City is required.' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 3) {
    return { isValid: false, message: 'City must be at least 3 characters.' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'City name is too long.' };
  }
  // City names must only contain letters, spaces, hyphens
  if (!/^[a-zA-Z\s-]+$/.test(trimmed)) {
    return { isValid: false, message: 'City must only contain letters.' };
  }
  // Basic check to ensure it doesn't have 6+ consecutive consonants
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid City name (avoid keyboard smashes).' };
  }
  return { isValid: true };
}

/**
 * Validates a Postal/Zip Code string (Pakistani standard: 5 digits).
 */
export function validateZipCode(value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'Postal / Zip Code is required.' };
  }
  const trimmed = value.trim();
  if (!/^\d{5}$/.test(trimmed)) {
    return { isValid: false, message: 'Zip Code must be exactly 5 digits.' };
  }
  return { isValid: true };
}

/**
 * Validates optional GPS Coordinates in 'latitude, longitude' format.
 */
export function validateCoordinates(value: string): { isValid: boolean; message?: string } {
  if (!value || !value.trim()) {
    return { isValid: true }; // Optional field
  }
  const trimmed = value.trim();
  // Validates standard latitude, longitude (e.g. 31.4826, 74.3702)
  const coordsPattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (!coordsPattern.test(trimmed)) {
    return { isValid: false, message: 'Coordinates must be in "latitude, longitude" format (e.g., 31.4826, 74.3702).' };
  }
  return { isValid: true };
}

/**
 * Validates password strength (min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character).
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }
  return { isValid: true };
}


