import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import stampCardRouter from './routes/stamp_card.js';
import quizRouter from './routes/quiz.js';

const app = express();
const PORT = process.env.PORT ?? 8080;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/stamp-card', stampCardRouter);
app.use('/quiz', quizRouter);

app.listen(PORT, () => {
  console.log(`ONE Samurai Backend が起動しました: http://localhost:${PORT}`);
});
