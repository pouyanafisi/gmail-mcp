/**
 * Validation utilities
 */

import fs from 'fs';

/**
 * Validates an email address format
 * @param email - Email address to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a file path exists and is readable
 * @param filePath - File path to validate
 * @returns True if file exists and is readable
 */
export function validateFilePath(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Validates a label name
 * @param name - Label name to validate
 * @returns True if valid, false otherwise
 */
export function validateLabelName(name: string): boolean {
  // Gmail label names must be 1-225 characters
  return name.length > 0 && name.length <= 225;
}

/**
 * Validates an array of email addresses
 * @param emails - Array of email addresses
 * @throws Error if any email is invalid
 */
export function validateEmailArray(emails: string[]): void {
  for (const email of emails) {
    if (!validateEmail(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
  }
}

