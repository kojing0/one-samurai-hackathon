import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('ログインが必要です');
  return user.getIdToken();
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'エラーが発生しました' }));
    throw new Error(error.error ?? 'エラーが発生しました');
  }

  return res.json() as Promise<T>;
}

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'エラーが発生しました' }));
    throw new Error(error.error ?? 'エラーが発生しました');
  }

  return res.json() as Promise<T>;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Quiz {
  id: string;
  difficulty: Difficulty;
  question: string;
  choices: string[];
  order: number;
}

export interface StampCard {
  objectId: string;
  owner: string;
  beginnerStamped: boolean;
  intermediateStamped: boolean;
  advancedStamped: boolean;
}

// ユーザー登録 / ログイン
export async function verifyUser(suiAddress: string) {
  const user = auth.currentUser;
  return apiFetch<{ user: unknown; isNew: boolean }>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      suiAddress,
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
    }),
  });
}

// スタンプカード取得
export async function fetchStampCard() {
  return apiFetch<{ stampCard: StampCard }>('/stamp-card');
}

// クイズ取得（ゲスト・ログイン共通）
export async function fetchQuizzes(difficulty: Difficulty) {
  return publicFetch<{ quizzes: Quiz[] }>(`/quiz/${difficulty}`);
}

// クイズセッション開始（ゲスト・ログイン共通）
export async function startQuizSession(difficulty: Difficulty) {
  return publicFetch<{ sessionId: string }>('/quiz/session/start', {
    method: 'POST',
    body: JSON.stringify({ difficulty }),
  });
}

// 回答送信（ゲスト・ログイン共通）
export async function submitAnswers(sessionId: string, answers: number[]) {
  return publicFetch<{
    passed: boolean;
    stampGranted: boolean;
    txDigest?: string;
    message?: string;
  }>('/quiz/session/answer', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answers }),
  });
}
