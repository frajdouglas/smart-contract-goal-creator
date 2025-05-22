// src/lib/validation.ts
import { ethers } from 'ethers';
import DOMPurify from 'dompurify';

// Define a type for our form data
export interface GoalFormData {
  title: string;
  description: string;
  deadline: Date;
  stake: string;
  refereeAddress: string;
  successRecipientAddress: string;
  failureRecipientAddress: string;
}

// Define a type for validation errors
export type FormErrors = {
  [key in keyof GoalFormData]?: string;
}

// --- Individual Field Validation Functions ---

export const validateTitle = (title: string): string | undefined => {
  const sanitizedTitle = DOMPurify.sanitize(title);
  if (!sanitizedTitle.trim()) return "Goal title is required.";
  if (sanitizedTitle.length < 3) return "Goal title must be at least 3 characters.";
  if (sanitizedTitle.length > 100) return "Goal title cannot exceed 100 characters.";
  return undefined;
};

export const validateDescription = (description: string): string | undefined => {
  const sanitizedDescription = DOMPurify.sanitize(description);
  if (!sanitizedDescription.trim()) return "Description is required.";
  if (sanitizedDescription.length < 10) return "Description must be at least 10 characters.";
  if (sanitizedDescription.length > 500) return "Description cannot exceed 500 characters.";
  return undefined;
};

export const validateDeadline = (deadline: Date): string | undefined => {
  if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) return "Deadline is required.";
  if (deadline <= new Date()) return "Deadline must be in the future.";
  return undefined;
};

export const validateStake = (stake: string): string | undefined => {
  const sanitizedStake = DOMPurify.sanitize(stake);
  const stakeNum = parseFloat(sanitizedStake);
  if (isNaN(stakeNum) || sanitizedStake.trim() === '') return "Stake amount is required.";
  if (stakeNum <= 0) return "Stake amount must be greater than 0.";
  return undefined;
};

export const validateRefereeAddress = (refereeAddress: string, walletAddress?: string): string | undefined => {
  const sanitizedRefereeAddress = DOMPurify.sanitize(refereeAddress);
  if (!sanitizedRefereeAddress.trim()) return "Referee address is required.";
  if (!ethers.isAddress(sanitizedRefereeAddress)) return "Invalid Ethereum address format.";
  if (walletAddress && sanitizedRefereeAddress.toLowerCase() === walletAddress.toLowerCase()) {
    return "Referee cannot be your own wallet address.";
  }
  return undefined;
};

export const validateSuccessRecipientAddress = (address: string): string | undefined => {
  const sanitizedAddress = DOMPurify.sanitize(address);
  if (!sanitizedAddress.trim()) return "Success recipient address is required.";
  if (!ethers.isAddress(sanitizedAddress)) return "Invalid Ethereum address format.";
  return undefined;
};

export const validateFailureRecipientAddress = (address: string): string | undefined => {
  const sanitizedAddress = DOMPurify.sanitize(address);
  if (!sanitizedAddress.trim()) return "Failure recipient address is required.";
  if (!ethers.isAddress(sanitizedAddress)) return "Invalid Ethereum address format.";
  return undefined;
};

// --- Main Validation Orchestrators ---

/**
 * Validates a single form field based on its name and value.
 * This function acts as a dispatcher to the specific field validator.
 * @param name The name of the form field.
 * @param value The current value of the form field.
 * @param walletAddress (Optional) The current user's wallet address, needed for referee validation.
 * @returns An error message string if validation fails, otherwise undefined.
 */
export const validateField = (
  name: keyof GoalFormData,
  value: any, // Use 'any' as value type depends on the field
  walletAddress?: string // Make optional if not always available when validating
): string | undefined => {
  switch (name) {
    case 'title': return validateTitle(value);
    case 'description': return validateDescription(value);
    case 'deadline': return validateDeadline(value);
    case 'stake': return validateStake(value);
    case 'refereeAddress': return validateRefereeAddress(value, walletAddress);
    case 'successRecipientAddress': return validateSuccessRecipientAddress(value);
    case 'failureRecipientAddress': return validateFailureRecipientAddress(value);
    default: return undefined;
  }
};

/**
 * Validates the entire form by iterating through all fields.
 * @param formData The current state of the form data.
 * @param walletAddress (Optional) The current user's wallet address.
 * @returns A FormErrors object containing error messages, and a boolean indicating overall validity.
 */
export const validateForm = (
  formData: GoalFormData,
  walletAddress?: string
): { errors: FormErrors; isValid: boolean } => {
  let newErrors: FormErrors = {};
  let isValid = true;

  (Object.keys(formData) as Array<keyof GoalFormData>).forEach((key) => {
    // Pass walletAddress to validateField, which will then pass to validateRefereeAddress if needed
    const error = validateField(key, formData[key], walletAddress);
    if (error) {
      newErrors[key] = error;
      isValid = false;
    }
  });

  return { errors: newErrors, isValid: isValid };
};