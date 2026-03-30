import express from 'express';
import cors from 'cors';
import type { Response } from 'express';
import { createRoutes } from './routes.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- SSE client registry ---

const sseClients = new Set<Response>();

export function broadcast(eventName: string, data: unknown): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// --- SSE endpoint ---

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send keepalive every 30 seconds to prevent proxy timeouts
  const keepalive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 30_000);

  req.on('close', () => {
    clearInterval(keepalive);
    sseClients.delete(res);
  });
});

// --- Routes ---

app.use('/api', createRoutes(broadcast));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
