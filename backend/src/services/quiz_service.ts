import { getFirestore } from './firebase_service.js';
import { type Difficulty, type Quiz } from '../types/index.js';

/**
 * 指定難易度のクイズ一覧を取得する（correctIndex は含めない）
 */
export async function getQuizzesByDifficulty(
  difficulty: Difficulty,
): Promise<Omit<Quiz, 'correctIndex'>[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection('quizzes')
    .where('difficulty', '==', difficulty)
    .orderBy('order')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Quiz;
    return {
      id: doc.id,
      difficulty: data.difficulty,
      question: data.question,
      choices: data.choices,
      order: data.order,
    };
  });
}

/**
 * 回答リストを検証し、全問正解かどうかを返す
 */
export async function validateAnswers(
  difficulty: Difficulty,
  answers: number[],
): Promise<{ passed: boolean; correctAnswers: number[] }> {
  const db = getFirestore();
  const snapshot = await db
    .collection('quizzes')
    .where('difficulty', '==', difficulty)
    .orderBy('order')
    .get();

  const quizzes = snapshot.docs.map((doc) => doc.data() as Quiz);
  const correctAnswers = quizzes.map((q) => q.correctIndex);

  if (answers.length !== correctAnswers.length) {
    return { passed: false, correctAnswers };
  }

  const passed = answers.every((answer, i) => answer === correctAnswers[i]);
  return { passed, correctAnswers };
}
