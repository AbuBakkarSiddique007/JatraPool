export class AppError extends Error {
  readonly statusCode: number;
  readonly success: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.success = false;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;