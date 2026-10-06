import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestContextMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

/** Map /api/v1/... onto the existing unversioned routes. /auth/login is unchanged. */
export function apiV1Rewrite(req: Request, _res: Response, next: NextFunction) {
  const url = req.url ?? '';
  if (url === '/api/v1' || url.startsWith('/api/v1/') || url.startsWith('/api/v1?')) {
    const stripped = url.slice('/api/v1'.length);
    req.url = stripped.length === 0 ? '/' : stripped.startsWith('?') ? `/${stripped}` : stripped;
  }
  next();
}
