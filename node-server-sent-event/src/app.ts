import {type Request, type Response} from 'express';
import {createSession} from 'better-sse';
import {buildTypeSafeError} from './utils/response.utils.js';
import {mainChannel} from './channels/mainChannel.js';
import {PORT, server} from './server.js';

server.get('/', (req: Request, res: Response): void => {
  res.send(`Go away!`);
});

server.get('/sse', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await createSession(req, res);

    mainChannel.register(session);

    req.on('close', () => console.log('Client disconnected'));
  } catch (error) {
    console.error('SSE session creation error:', error);
    res.status(500).end();
  }
});

type TriggerEventBody = {
  message: string;
};

server.post('/trigger-event', (req: Request, res: Response): void => {
  try {
    const {message}: TriggerEventBody = req.body;

    mainChannel.broadcast(
      {
        message,
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
