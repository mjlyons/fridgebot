import { vi } from 'vitest';
import { AlertService } from './AlertService';
import { MockFn } from '../../test-utils';

type AlertServiceMock = {
  clearMocks: () => void;
  alert: MockFn<AlertService['alert']>;
};

export const createAlertServiceFake = (): AlertService & { mock: AlertServiceMock } => {
  const alertImpl: AlertService['alert'] = async (payload, severity) => {
    console.log(`Alerting: [${severity}] ${JSON.stringify(payload)}`);
  };
  const alert: MockFn<AlertService['alert']> = vi.fn(alertImpl);

  return {
    alert,
    mock: {
      clearMocks: () => {
        alert.mockClear();
      },
      alert,
    },
  };
};
