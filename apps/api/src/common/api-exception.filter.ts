import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from './request-context';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.requestId ?? 'unknown';
    const isProd = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = statusToCode(status);
      message = messageFromHttpException(exception);
    } else if (exception instanceof Error && !isProd) {
      message = exception.message || message;
    }

    if (isProd && status >= 500) {
      code = 'INTERNAL_ERROR';
      message = 'Internal server error';
    }

    if (exception instanceof Error) {
      if (isProd) this.logger.error(exception.message);
      else this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unhandled non-error exception');
    }

    if (response.headersSent) return;
    response.status(status).json({ code, message, requestId });
  }
}

function messageFromHttpException(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object') {
    const raw = (body as { message?: unknown }).message;
    if (Array.isArray(raw)) return raw.map(String).join(', ');
    if (typeof raw === 'string' && raw.length > 0) return raw;
  }
  return exception.message;
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
  }
}
