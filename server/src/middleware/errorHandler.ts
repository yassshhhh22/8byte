import type { ErrorRequestHandler, RequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, "NOT_FOUND", `Route ${request.method} ${request.path} was not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const code = error instanceof HttpError ? error.code : "INTERNAL_ERROR";
  const message = error instanceof HttpError ? error.message : "The server could not complete the request";

  response.status(statusCode).json({
    error: code,
    message,
    timestamp: new Date().toISOString(),
  });
};

