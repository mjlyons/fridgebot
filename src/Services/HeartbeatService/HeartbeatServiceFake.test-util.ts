import { vi } from 'vitest';
import { MockFn } from '../../test-utils';
import { HeartbeatService } from './HeartbeatService';
import { TimeService } from '../TimeService/TimeService';

export type HeartbeatServiceMock = {
  clearMocks: () => void;
  beat: MockFn<HeartbeatService['beat']>;
  resolveAfter: (ms: number) => void;
  rejectAfter: (ms: number) => void;
};

export const createHeartbeatServiceFake = (
  timeService: TimeService
): HeartbeatService & { mock: HeartbeatServiceMock } => {
  let _simulatedBehavior: 'resolve' | 'reject';
  let _simulatedTimeout: number;
  const _setDefaultSimulation = () => {
    _simulatedBehavior = 'resolve';
    _simulatedTimeout = 1000;
  };
  _setDefaultSimulation();

  const beatImpl: HeartbeatService['beat'] = async () => {
    if (_simulatedBehavior === 'resolve') {
      return new Promise(resolve => {
        timeService.setTimeout(resolve, _simulatedTimeout);
      });
    } else if (_simulatedBehavior === 'reject') {
      return new Promise((_, reject) => {
        timeService.setTimeout(
          () => reject(new Error('Simulated heartbeat rejection')),
          _simulatedTimeout
        );
      });
    }
    throw new Error(
      `HeartbeatServiceFake: beat called with unknown _simulatedBehavior: ${_simulatedBehavior}`
    );
  };
  const beat = vi.fn(beatImpl);

  const resolveAfter = (ms: number) => {
    _simulatedBehavior = 'resolve';
    _simulatedTimeout = ms;
  };

  const rejectAfter = (ms: number) => {
    _simulatedBehavior = 'reject';
    _simulatedTimeout = ms;
  };

  return {
    beat,
    mock: {
      clearMocks: () => {
        beat.mockClear();
        _setDefaultSimulation();
      },
      resolveAfter,
      rejectAfter,
      beat,
    },
  };
};
