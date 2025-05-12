import { describe, it, expect } from 'vitest';
import { Settings } from './Services/SettingsService/SettingsService';
import { createSettingsServiceFake } from './Services/SettingsService/SettingsServiceFake.test-util';
import { Services } from './Services/Services';
import { createTimeServiceFake } from './Services/TimeService/TimeServiceFake.test-util';
import {
  createSensorServiceFake,
  FakeSensorConfig,
} from './Services/SensorService/SensorServiceFake.test-utils';
import { createAlertServiceFake } from './Services/AlertService/AlertServiceFake.test-util';
import { OPEN_SENSOR_ALERT_MS, SensorStates } from './sensor-change';
import { createHeartbeatServiceFake } from './Services/HeartbeatService/HeartbeatServiceFake.test-util';
import { watch } from './watch';
const DEFAULT_SETTINGS: Settings = [
  {
    locationId: 'L1',
    doorId: 'D1',
    doorOpenAlertDelaySec: 10,
  },
  {
    locationId: 'L1',
    doorId: 'D2',
    doorOpenAlertDelaySec: 20,
  },
];

const DEFAULT_SENSOR_STATES: FakeSensorConfig = {
  L1: {
    id: 'L1',
    name: 'Location 1',
    devices: {
      D1: {
        id: 'D1',
        name: 'Door 1',
        status: 'closed',
      },
      D2: {
        id: 'D2',
        name: 'Door 2',
        status: 'closed',
      },
    },
  },
};

const setupServices = () => {
  const time = createTimeServiceFake();
  return {
    settings: createSettingsServiceFake(DEFAULT_SETTINGS),
    sensor: createSensorServiceFake(DEFAULT_SENSOR_STATES),
    alerting: createAlertServiceFake(),
    heartbeat: createHeartbeatServiceFake(time),
    time,
  };
};

describe('watch', () => {
  it('registers for sensor changes based on settings', async () => {
    const services = setupServices();
    await watch(services);
    expect(services.sensor.mock.registerSensorChangeHandler).toHaveBeenCalledTimes(2);
  });

  it('alerts when either door is open too long', async () => {
    const services = setupServices();
    await watch(services);
    await services.time.mock.incrementTime(1000);

    // Open Door 1
    services.sensor.mock.changeStatus('L1', 'D1', 'open');
    await services.time.mock.incrementTime(OPEN_SENSOR_ALERT_MS / 2 + 1);
    expect(services.alerting.alert).toHaveBeenCalledTimes(0);

    // Open Door 2
    services.sensor.mock.changeStatus('L1', 'D2', 'open');

    // Wait for Door 1 to alert
    await services.time.mock.incrementTime(OPEN_SENSOR_ALERT_MS / 2 + 1);
    console.log('Verifying Door 1 alerted');
    expect(services.alerting.alert).toHaveBeenCalledTimes(1);
    expect(services.alerting.alert).toHaveBeenCalledWith(
      {
        kind: 'door-open',
        locationId: 'L1',
        sensorId: 'D1',
        sensorName: 'Door 1',
      },
      'critical'
    );

    // Close Door 1, but leave Door 2 open, and wait for door 2 to alert
    services.sensor.mock.changeStatus('L1', 'D1', 'closed');
    await services.time.mock.incrementTime(OPEN_SENSOR_ALERT_MS / 2 + 1);
    expect(services.alerting.alert).toHaveBeenCalledTimes(2);
    expect(services.alerting.alert).toHaveBeenCalledWith(
      {
        kind: 'door-open',
        locationId: 'L1',
        sensorId: 'D2',
        sensorName: 'Door 2',
      },
      'critical'
    );
  });
});
