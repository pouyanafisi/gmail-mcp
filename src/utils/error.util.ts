/**
 * Error handling utilities
 */

/**
 * Custom error class for Gmail MCP errors
 */
export class GmailMCPError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'GmailMCPError';
    Object.setPrototypeOf(this, GmailMCPError.prototype);
  }
}

/**
 * Creates an authentication error
 * @param message - Error message
 * @returns GmailMCPError instance
 */
export function createAuthError(message: string): GmailMCPError {
  return new GmailMCPError(message, 'AUTH_ERROR', 401);
}

/**
 * Creates an API error
 * @param message - Error message
 * @param code - Optional HTTP status code
 * @returns GmailMCPError instance
 */
export function createAPIError(message: string, code?: number): GmailMCPError {
  return new GmailMCPError(message, 'API_ERROR', code);
}

/**
 * Creates a validation error
 * @param message - Error message
 * @returns GmailMCPError instance
 */
export function createValidationError(message: string): GmailMCPError {
  return new GmailMCPError(message, 'VALIDATION_ERROR', 400);
}

/**
 * Creates a not found error
 * @param message - Error message
 * @returns GmailMCPError instance
 */
export function createNotFoundError(message: string): GmailMCPError {
  return new GmailMCPError(message, 'NOT_FOUND', 404);
}

