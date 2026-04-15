import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getFirestore } from '../services/firebase_service.js';
import { mintStampCard, findStampCardByOwner } from '../services/sui_service.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const VerifyBody = z.object({
  suiAddress: z.string().min(1),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * POST /auth/verify
 * Firebase JWT を検証し、ユーザー情報を登録 or 取得する
 * 初回の場合はオンチェーンでスタンプカードを発行する
 */
router.post('/verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  const uid = (req as AuthenticatedRequest).uid;

  const parsed = VerifyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '入力値が正しくありません', details: parsed.error.issues });
    return;
  }

  const { suiAddress, displayName, email } = parsed.data;
  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    // 既存ユーザー: そのまま返す
    res.json({ user: userDoc.data(), isNew: false });
    return;
  }

  // 初回ユーザー: スタンプカードを発行する
  let stampCardObjectId: string | null = null;
  try {
    // チェーン上に既存のカードがないか確認
    stampCardObjectId = await findStampCardByOwner(suiAddress);

    if (!stampCardObjectId) {
      stampCardObjectId = await mintStampCard(suiAddress);
    }
  } catch (err) {
    console.error('スタンプカード発行エラー:', err);
    res.status(500).json({ error: 'スタンプカードの発行に失敗しました' });
    return;
  }

  const newUser = {
    uid,
    email: email ?? '',
    displayName: displayName ?? '',
    suiAddress,
    stampCardObjectId,
    createdAt: new Date(),
  };

  await userRef.set(newUser);

  res.status(201).json({ user: newUser, isNew: true });
});

export default router;
