import express, { Request, Response } from 'express';

const router = express.Router();

interface SessionItem {
  id: string;
  interviewer_user_id: number;
  candidate_user_id: number;
  profession: string;
  language: string;
  slot_utc: string;
  created_at: string;
  status: 'completed' | 'active' | 'cancelled' | string;
  jitsi_room: string;
  interviewer_tools?: string[];
  candidate_tools?: string[];
}

interface FeedbackItem {
  id: number;
  session_id: string;
  from_user_id: number;
  to_user_id: number;
  rating: number;
  comments: string;
  created_at: string;
}

// GET /api/history/:userId
router.get('/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  // Простые демо-данные для dev-окружения
  const sessions: SessionItem[] = [];
  const feedbacks: FeedbackItem[] = [];

  res.json({ sessions, feedbacks, userId: Number(userId) });
});

export default router;


