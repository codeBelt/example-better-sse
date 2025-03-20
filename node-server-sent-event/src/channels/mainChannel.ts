import {createChannel} from 'better-sse';

export const mainChannel = createChannel();

const broadcastSessionCount = (): void => {
  mainChannel.broadcast(mainChannel.sessionCount, 'session-count');
};

mainChannel.on('session-registered', broadcastSessionCount).on('session-deregistered', broadcastSessionCount);
