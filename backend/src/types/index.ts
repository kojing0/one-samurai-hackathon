export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_INDEX: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export interface User {
  uid: string;
  email: string;
  displayName: string;
  suiAddress: string;
  stampCardObjectId: string | null;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Quiz {
  id: string;
  difficulty: Difficulty;
  question: string;
  choices: string[];
  correctIndex: number;
  order: number;
}

export interface QuizSession {
  id: string;
  uid: string;
  difficulty: Difficulty;
  answers: number[];
  completed: boolean;
  passed: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface StampCardState {
  objectId: string;
  owner: string;
  beginnerStamped: boolean;
  intermediateStamped: boolean;
  advancedStamped: boolean;
}
