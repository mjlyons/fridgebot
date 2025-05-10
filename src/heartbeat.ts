import { Services } from './Services/Services';
import { sleep } from './utils';

export const startHeartbeat = async (
  services: Pick<Services, 'heartbeat' | 'time'>
): Promise<NodeJS.Timeout> => {
  // Beat the heartbeat immediately
  services.heartbeat.beat();

  // Beat the heartbeat every minute
  const timeoutId = services.time.setInterval(() => {
    services.heartbeat.beat();
  }, 60000);

  return timeoutId;
};

export const stopHeartbeat = (services: Pick<Services, 'time'>, timeoutId: NodeJS.Timeout) => {
  services.time.cancelTimeout(timeoutId);
};
