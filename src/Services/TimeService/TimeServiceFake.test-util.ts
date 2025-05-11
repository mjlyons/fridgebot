import { expect, vi } from 'vitest';
import { MockFn } from '../../test-utils';
import { TimeService } from './TimeService';

const realSetTimeout = setTimeout;

export const expectTimeoutId = () => {
  return expect.any(Number);
};

type TimeServiceMock = {
  setTime: (timestamp: number) => void;
  incrementTime: (ms: number) => Promise<void>;
  clearMocks: () => void;
  now: MockFn<TimeService['now']>;
  setTimeout: MockFn<TimeService['setTimeout']>;
  setInterval: MockFn<TimeService['setInterval']>;
  cancelTimeout: MockFn<TimeService['cancelTimeout']>;
};

type InternalTimeout = {
  id: NodeJS.Timeout;
  timestamp: number;
  callback: () => void;
  kind: 'timeout' | 'interval';
  delayMs: number;
};

export const createTimeServiceFake = (): TimeService & { mock: TimeServiceMock } => {
  let _time = 1000;
  let _lastTimeoutId: NodeJS.Timeout = 1 as unknown as NodeJS.Timeout;
  // sorted list of timeouts
  const _pendingTimeouts: InternalTimeout[] = [];

  const nowImpl: TimeService['now'] = () => _time;
  const now = vi.fn(nowImpl);

  const _setTimeoutImpl = (
    callback: InternalTimeout['callback'],
    delayMs: number,
    kind: InternalTimeout['kind'] = 'timeout',
    forceId?: NodeJS.Timeout
  ): NodeJS.Timeout => {
    const timeoutId = forceId !== undefined ? forceId : _lastTimeoutId;
    if (forceId === undefined) {
      (_lastTimeoutId as unknown as number)++;
    }

    const timestamp = _time + delayMs;
    const timeout = { id: timeoutId, timestamp, callback, kind, delayMs };

    // Find insertion point to maintain sorted order
    const insertIndex = _pendingTimeouts.findIndex(t => t.timestamp > timestamp);
    if (insertIndex === -1) {
      _pendingTimeouts.push(timeout);
    } else {
      _pendingTimeouts.splice(insertIndex, 0, timeout);
    }

    console.log('setTimeout', { currentTime: _time, delayMs, timeoutId, _pendingTimeouts });

    return timeoutId;
  };
  const setTimeoutImpl: TimeService['setTimeout'] = (callback, delayMs) =>
    _setTimeoutImpl(callback, delayMs, 'timeout');
  const setTimeout = vi.fn(setTimeoutImpl);

  const setIntervalImpl: TimeService['setInterval'] = (callback, delayMs) => {
    return _setTimeoutImpl(callback, delayMs, 'interval');
  };
  const setInterval = vi.fn(setIntervalImpl);

  const cancelTimeoutImpl: TimeService['cancelTimeout'] = timeoutId => {
    for (let i = _pendingTimeouts.length - 1; i >= 0; i--) {
      if (_pendingTimeouts[i].id === timeoutId) {
        _pendingTimeouts.splice(i, 1);
      }
    }
  };
  const cancelTimeout = vi.fn(cancelTimeoutImpl);

  const setTime = async (timestamp: number) => {
    // Execute any timeouts that have elapsed
    console.log('setTime', { timestamp, _pendingTimeouts });

    while (_pendingTimeouts.length > 0 && _pendingTimeouts[0].timestamp <= timestamp) {
      console.log('setTime: executing timeout', _pendingTimeouts[0]);
      _time = _pendingTimeouts[0].timestamp;
      console.log('setTime: _time', _time);
      console.log(`Shifting timeout: ${JSON.stringify(_pendingTimeouts)}`);
      const timeout = _pendingTimeouts.shift()!;
      console.log(`Timeout shifted: ${JSON.stringify(_pendingTimeouts)}`);

      // Insert the next timeout if it's an interval
      if (timeout.kind === 'interval') {
        _setTimeoutImpl(timeout.callback, timeout.delayMs, 'interval', timeout.id);
      }

      timeout.callback();
      // If we executed a timeout, we need to flush the event loop and
      // start checking over because that timeout callback
      // may have created a new timeout
      console.log('flushing event loop...');
      await new Promise<void>(resolve => {
        realSetTimeout(() => {
          resolve();
        }, 0);
      });
      console.log('flushed event loop');
    }

    // if we didn't execute any timeouts, we're done
    _time = timestamp;
    console.log('setTime (final): _time', _time);
  };

  const incrementTime = async (ms: number): Promise<void> => {
    await setTime(_time + ms);
  };

  const clearMocks = () => {
    now.mockClear();
    setTimeout.mockClear();
    setInterval.mockClear();
    cancelTimeout.mockClear();
  };

  return {
    now,
    setTimeout,
    setInterval,
    cancelTimeout,
    mock: {
      setTime,
      incrementTime,
      clearMocks,
      now,
      setTimeout,
      setInterval,
      cancelTimeout,
    },
  };
};
