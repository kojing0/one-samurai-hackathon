import { type Request, type Response, type NextFunction } from 'express';
import { verifyIdToken } from '../services/firebase_service.js';

export interface AuthenticatedRequest extends Request {
  uid: string;
}

export interface OptionalAuthRequest extends Request {
  uid?: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '認証トークンがありません' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await verifyIdToken(idToken);
    (req as AuthenticatedRequest).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: '認証トークンが無効です' });
  }
}

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decoded = await verifyIdToken(idToken);
      (req as OptionalAuthRequest).uid = decoded.uid;
    } catch {
      // 無効なトークンは無視してゲストとして続行
    }
  }

  next();
}
