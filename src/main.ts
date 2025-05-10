import { getRingApi } from './ring-auth';
import { createAlertService } from './Services/AlertService/AlertServiceImpl';
import { createHeartbeatService } from './Services/HeartbeatService/HeartbeatServiceImpl';
import { SensorChangeHandler, SensorService } from './Services/SensorService/SensorService';
import { createSensorService } from './Services/SensorService/SensorServiceImpl';
import { Services } from './Services/Services';
import { createSettingsService } from './Services/SettingsService/SettingsServiceImpl';
import { createTimeService } from './Services/TimeService/TimeServiceImpl';
import { sleep } from './utils';
import { watch } from './watch';

const createServices = (): Services => {
  return {
    alerting: createAlertService(),
    heartbeat: createHeartbeatService(),
    sensor: createSensorService(),
    settings: createSettingsService(),
    time: createTimeService(),
  };
};

export async function watchForever() {
  console.log('Creating Services...');
  const services = createServices();

  await watch(services);
  return await new Promise(() => {});
}
