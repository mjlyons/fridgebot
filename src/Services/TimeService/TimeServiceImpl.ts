import { TimeService } from './TimeService';

export const createTimeService = (): TimeService => {
  return {
    now: () => Date.now(),
    setTimeout: (callback: () => void, delayMs: number) => setTimeout(callback, delayMs),
    setInterval: (callback: () => void, delayMs: number) => setInterval(callback, delayMs),
    cancelTimeout: (timeoutId: NodeJS.Timeout) => clearTimeout(timeoutId),
  };
};
