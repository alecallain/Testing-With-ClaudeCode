import { Router } from 'express';
import type { Chore, Completion, Member } from '../src/types.js';
import * as db from './db.js';

type Broadcast = (eventName: string, data: unknown) => void;

export function createRoutes(broadcast: Broadcast): Router {
  const router = Router();

  // --- Full state snapshot ---

  router.get('/state', (_req, res) => {
    res.json(db.getState());
  });

  // --- Members ---

  router.post('/members', (req, res) => {
    const member = req.body as Member;
    db.insertMember(member);
    broadcast('member:add', member);
    res.sendStatus(204);
  });

  router.delete('/members/:id', (req, res) => {
    const { id } = req.params;
    const updatedChores = db.deleteMember(id);
    broadcast('member:remove', { id, updatedChores });
    res.sendStatus(204);
  });

  // --- Chores ---

  router.post('/chores', (req, res) => {
    const chore = req.body as Chore;
    db.insertChore(chore);
    broadcast('chore:add', chore);
    res.sendStatus(204);
  });

  router.put('/chores/:id', (req, res) => {
    const chore = req.body as Chore;
    db.updateChore(chore);
    broadcast('chore:update', chore);
    res.sendStatus(204);
  });

  router.delete('/chores/:id', (req, res) => {
    const { id } = req.params;
    db.deleteChore(id);
    broadcast('chore:remove', { id });
    res.sendStatus(204);
  });

  // --- Completions ---

  router.post('/completions/toggle', (req, res) => {
    const payload = req.body as Completion;
    const action = db.toggleCompletion(payload);

    // If the toggle removed a completion, find the existing record from the DB
    // before the delete — we rely on the payload for the 'removed' case
    // since the row is gone. The client sent us the speculative id; use choreId+date
    // as the canonical identity for removal.
    const completion: Completion =
      action === 'added'
        ? payload
        : {
            id: payload.id,
            choreId: payload.choreId,
            date: payload.date,
            completedAt: payload.completedAt,
          };

    broadcast('completion:toggle', { action, completion });
    res.sendStatus(204);
  });

  return router;
}
