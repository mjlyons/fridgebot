export type TimeService = {
  now: () => number;
  setTimeout: (callback: () => void, delayMs: number) => NodeJS.Timeout;
  setInterval: (callback: () => void, delayMs: number) => NodeJS.Timeout;
  cancelTimeout: (timeoutId: NodeJS.Timeout) => void;
};
