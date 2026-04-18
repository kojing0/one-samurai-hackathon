import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getFirestore } from '../services/firebase_service.js';
import { getQuizzesByDifficulty, validateAnswers } from '../services/quiz_service.js';
import { addStamp } from '../services/sui_service.js';
import { authenticate, optionalAuthenticate, type AuthenticatedRequest, type OptionalAuthRequest } from '../middleware/auth.js';
import { type Difficulty } from '../types/index.js';

const router = Router();

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

const SubmitAnswersBody = z.object({
  sessionId: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(3)),
});

/**
 * GET /quiz/:difficulty
 * 指定難易度のクイズ問題一覧を取得する（正解は含まない）
 */
router.get('/:difficulty', async (req: Request, res: Response): Promise<void> => {
  const difficulty = req.params.difficulty as Difficulty;

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({ error: '難易度が正しくありません（beginner / intermediate / advanced）' });
    return;
  }

  const quizzes = await getQuizzesByDifficulty(difficulty);
  res.json({ quizzes });
});

/**
 * POST /quiz/session/start
 * クイズセッションを開始する
 */
router.post('/session/start', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const uid = (req as OptionalAuthRequest).uid ?? null;

  const parsed = z.object({ difficulty: z.enum(['beginner', 'intermediate', 'advanced']) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '難易度を指定してください' });
    return;
  }

  const { difficulty } = parsed.data;
  const db = getFirestore();

  const sessionRef = db.collection('quiz_sessions').doc();
  const session = {
    id: sessionRef.id,
    uid,
    difficulty,
    answers: [],
    completed: false,
    passed: false,
    createdAt: new Date(),
  };

  await sessionRef.set(session);
  res.status(201).json({ sessionId: sessionRef.id });
});

/**
 * POST /quiz/session/answer
 * 全問の回答を送信する。全問正解ならスタンプを付与する
 */
router.post('/session/answer', optionalAuthenticate, async (req: Request, res: Response): Promise<void> => {
  const uid = (req as OptionalAuthRequest).uid ?? null;

  const parsed = SubmitAnswersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '入力値が正しくありません', details: parsed.error.issues });
    return;
  }

  const { sessionId, answers } = parsed.data;
  const db = getFirestore();

  const sessionRef = db.collection('quiz_sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists || sessionDoc.data()?.uid !== uid) {
    res.status(403).json({ error: 'セッションが見つかりません' });
    return;
  }

  if (sessionDoc.data()?.completed) {
    res.status(400).json({ error: 'このセッションはすでに終了しています' });
    return;
  }

  const difficulty = sessionDoc.data()!.difficulty as Difficulty;
  const { passed } = await validateAnswers(difficulty, answers);

  await sessionRef.update({ answers, completed: true, passed });

  if (!passed) {
    res.json({ passed: false, stampGranted: false, message: '不正解の問題があります。再挑戦してください。' });
    return;
  }

  // ゲストの場合はスタンプ付与なしで結果を返す
  if (!uid) {
    res.json({ passed: true, stampGranted: false });
    return;
  }

  // 全問正解: スタンプ付与
  const userDoc = await db.collection('users').doc(uid).get();
  const stampCardObjectId = userDoc.data()?.stampCardObjectId as string | undefined;

  if (!stampCardObjectId) {
    res.status(500).json({ error: 'スタンプカードが見つかりません' });
    return;
  }

  try {
    const txDigest = await addStamp(stampCardObjectId, difficulty);
    res.json({ passed: true, stampGranted: true, txDigest });
  } catch (err) {
    console.error('スタンプ付与エラー:', err);
    res.status(500).json({ error: 'スタンプの付与に失敗しました' });
  }
});

export default router;
