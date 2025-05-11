import { createLogger } from './logger';
import { createAlertService } from './Services/AlertService/AlertServiceImpl';
import { createHeartbeatService } from './Services/HeartbeatService/HeartbeatServiceImpl';
import { createSensorService } from './Services/SensorService/SensorServiceImpl';
import { Services } from './Services/Services';
import { createSettingsService } from './Services/SettingsService/SettingsServiceImpl';
import { createTimeService } from './Services/TimeService/TimeServiceImpl';
import { watch } from './watch';

export async function watchForever() {
  console.log('Creating Services...');
  const alertService = createAlertService();
  const logger = createLogger(alertService);
  let _data = { isExitingWithException: false };

  process.on('uncaughtException', async error => {
    // The exception handler threw an exception, just let it go.
    if (_data.isExitingWithException) {
      return;
    }
    _data.isExitingWithException = true;

    console.error('Uncaught exception:', error);
    await logger.reportError(
      JSON.stringify({
        app: 'Fridge Door Monitor',
        name: error.name,
        message: error.message,

        // THIS MAKES THE ERROR MESSAGE IN PAGERDUTY TOO LONG
        // stack: error.stack,
      })
    );
    process.exit(1);
  });

  const services: Services = {
    alerting: alertService,
    heartbeat: createHeartbeatService(),
    sensor: createSensorService(),
    settings: createSettingsService(),
    time: createTimeService(),
  };

  await watch(services);
  return await new Promise(() => {});
}
