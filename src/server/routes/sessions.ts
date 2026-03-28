import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { wsService } from '../services/websocket';
import { vertexAI } from '../services/vertex-ai';
import { InterviewSession } from '../types';

const router = Router();

/**
 * Get all active sessions
 */
router.get('/', (req: Request, res: Response) => {
  // Return list of active sessions (filtered for privacy)
  const sessions: Array<{
    sessionId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // Note: This would need to be implemented to iterate through sessions
  // For now, return empty array
  res.json({ sessions });
});

/**
 * Create a new interview session
 */
router.post('/new', async (req: Request, res: Response) => {
  try {
    const { questionId, candidateName, language, exerciseId } = req.body;

    if (!language) {
      return res.status(400).json({ error: 'Missing required field: language' });
    }

    if (!exerciseId) {
      return res.status(400).json({ error: 'Missing required field: exerciseId' });
    }

    const sessionId = uuidv4();
    
    // Create session via WebSocket service
    const session: InterviewSession = {
      sessionId,
      candidateId: candidateName || 'anonymous',
      status: 'idle',
      language, // Add this
      exerciseId, // Add this
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: questionId ? [] : [],
      feedback: [],
      metrics: {
        totalTime: 0,
        stuckTime: 0,
        codeLinesWritten: 0,
        testCasesPassed: 0,
        testCasesFailed: 0,
        hintsRequested: 0,
        feedbackCount: 0,
        communicationScore: 0,
        technicalScore: 0,
      },
    };

    res.status(201).json({
      sessionId,
      message: 'Session created successfully',
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get session details
 */
router.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = wsService.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
});

/**
 * End session and get final assessment
 */
router.post('/:sessionId/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = wsService.endSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate final assessment using Vertex AI
    const assessment = await vertexAI.generateAssessment(
      session.sessionId,
      session.metrics,
      session.feedback,
      session.transcriptSegments || []
    );

    res.json({
      session,
      assessment,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      error: 'Failed to end session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get session transcript
 */
router.get('/:sessionId/transcript', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = wsService.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    transcript: session.transcriptSegments || [],
    codeSnippets: session.codeSnippets || [],
  });
});

/**
 * Get session feedback history
 */
router.get('/:sessionId/feedback', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = wsService.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    feedback: session.feedback || [],
    metrics: session.metrics,
  });
});

export default router;
