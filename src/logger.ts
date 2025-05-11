import { AlertService } from './Services/AlertService/AlertService';

export type Logger = {
  /** Reports an error to PagerDuty. DOES NOT THROW THE ERROR. */
  reportError: (message: string) => Promise<void>;
};

export const createLogger = (alertService: AlertService): Logger => {
  return {
    reportError: async message => {
      await alertService.alert(
        {
          message,
        },
        'info'
      );
    },
  };
};
