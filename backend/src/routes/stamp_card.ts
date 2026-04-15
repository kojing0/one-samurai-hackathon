import { Router, type Request, type Response } from 'express';
import { getFirestore } from '../services/firebase_service.js';
import { getStampCard } from '../services/sui_service.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /stamp-card
 * オンチェーンのスタンプカード状態を取得する
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const uid = (req as AuthenticatedRequest).uid;
  const db = getFirestore();

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    res.status(404).json({ error: 'ユーザーが見つかりません' });
    return;
  }

  const user = userDoc.data()!;
  if (!user.stampCardObjectId) {
    res.status(404).json({ error: 'スタンプカードが発行されていません' });
    return;
  }

  try {
    const stampCard = await getStampCard(user.stampCardObjectId);
    res.json({ stampCard });
  } catch (err) {
    console.error('スタンプカード取得エラー:', err);
    res.status(500).json({ error: 'スタンプカードの取得に失敗しました' });
  }
});

export default router;
