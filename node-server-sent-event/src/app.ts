import express, {type Request, type Response} from 'express';
import cors from 'cors';
import {createSession, createChannel} from 'better-sse';
import {buildTypeSafeError} from './utils/response.utils.js';

// Create an Express application
const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: true, // Allow requests from any origin in development
    credentials: true,
  })
);

// Add JSON middleware for parsing request bodies
app.use(express.json());

// Create a channel for broadcasting messages to multiple sessions
const ticker = createChannel();

// Counter and broadcasting logic
let count: number = 0;

// Broadcast counter every second with proper event naming
setInterval(() => {
  ticker.broadcast(count++, 'tick');
}, 2500);

// Function to broadcast the current session count
const broadcastSessionCount = (): void => {
  ticker.broadcast(ticker.sessionCount, 'session-count');
};

// Set up event listeners for session changes
ticker.on('session-registered', broadcastSessionCount).on('session-deregistered', broadcastSessionCount);

app.get('/', (req: Request, res: Response): void => {
  res.send(`404 Dude!`);
});

app.get('/test', (req: Request, res: Response): void => {
  const dateStr: string = new Date().toISOString().slice(0, 19);

  res.send(`It worked! - ${dateStr}`);
});

// SSE endpoint
app.get('/sse', async (req: Request, res: Response): Promise<void> => {
  console.log(`connecting to /sse`);
  try {
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    console.log(`set headers to /sse`);
    // Create and register the SSE session
    const session = await createSession(req, res);
    console.log(`createSession /sse`);
    ticker.register(session);

    console.log(`register /sse`);
    // Handle client disconnection
    req.on('close', () => {
      console.log('Client disconnected');
    });
  } catch (error) {
    console.error('SSE session creation error:', error);
    res.status(500).end();
  }
});

// Trigger a custom event
interface TriggerEventBody {
  message?: string;
}

app.post('/trigger-event', (req: Request, res: Response): void => {
  try {
    const {message}: TriggerEventBody = req.body;

    // Broadcast the custom event with the message
    ticker.broadcast(
      {
        message: message || 'Button clicked!',
        timestamp: new Date().toISOString(),
      },
      'custom-event'
    );

    res.status(200).json({success: true, message: 'Event triggered successfully'});
  } catch (error) {
    const err = buildTypeSafeError(error);

    console.error('Error triggering event:', err);

    res.status(500).json({success: false, error: err});
  }
});

// Start the server
const PORT: string | number = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server listening. Open http://localhost:${PORT} in your browser.`);
});
