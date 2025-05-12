import { createLogger } from './logger';
import { createAlertService } from './Services/AlertService/AlertServiceImpl';
import { createHeartbeatService } from './Services/HeartbeatService/HeartbeatServiceImpl';
import { Sensor, SensorLocation } from './Services/SensorService/SensorService';
import { createSensorService } from './Services/SensorService/SensorServiceImpl';
import { Services } from './Services/Services';
import { createSettingsService } from './Services/SettingsService/SettingsServiceImpl';
import { createTimeService } from './Services/TimeService/TimeServiceImpl';
import { watch } from './watch';

const setupEnvironment = () => {
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

  return services;
};

export async function listLocations(): Promise<SensorLocation[]> {
  const services = setupEnvironment();
  const locations = await services.sensor.getLocations();
  return locations;
}

export async function listSensors(locationId: string): Promise<Sensor[]> {
  const services = setupEnvironment();
  const sensors = await services.sensor.getSensorsForLocation(locationId);
  return sensors;
}

export async function watchForever() {
  const services = setupEnvironment();
  await watch(services);
  return await new Promise(() => {});
}
