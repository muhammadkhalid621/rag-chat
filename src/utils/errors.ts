export class AppError extends Error {
  statusCode: number;
  details?: unknown;
  errorCode?: string;

  constructor(statusCode: number, message: string, details?: unknown, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
  }
}
