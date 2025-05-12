import { describe, it, expect } from 'vitest';
import { createSensorChangeHandler, SensorStates } from './sensor-change';
import {
  createTimeServiceFake,
  expectTimeoutId,
  TimeServiceFake,
} from './Services/TimeService/TimeServiceFake.test-util';
import {
  AlertServiceFake,
  createAlertServiceFake,
} from './Services/AlertService/AlertServiceFake.test-util';
import {
  createSettingsServiceFake,
  SettingsServiceFake,
} from './Services/SettingsService/SettingsServiceFake.test-util';
import { Settings } from './Services/SettingsService/SettingsService';

const OPEN_SENSOR_ALERT_SEC = 180;
const OPEN_SENSOR_ALERT_MS = OPEN_SENSOR_ALERT_SEC * 1000;

const DEFAULT_SETTINGS: Settings = [
  {
    locationId: 'L1',
    doorId: 'S1',
    doorOpenAlertDelaySec: 180,
  },
  {
    locationId: 'L1',
    doorId: 'S2',
    doorOpenAlertDelaySec: 180,
  },
];

const setup = (): {
  time: TimeServiceFake;
  alerting: AlertServiceFake;
  settings: SettingsServiceFake;
} => {
  const time = createTimeServiceFake();
  const alerting = createAlertServiceFake();
  const settings = createSettingsServiceFake(DEFAULT_SETTINGS);

  return { time, alerting, settings };
};

describe('sensor change handler', () => {
  it('should should update sensor states when first run with a closed sensor', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });

    console.log(`sensorStates: ${JSON.stringify(sensorStates, null, 2)}`);

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'closed',
          lastChangeTimestamp: 1000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: undefined,
        },
      },
    });
  });

  it('should should update sensor states when first run with an open sensor', async () => {
    const services = setup();
    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'open',
          lastChangeTimestamp: 1000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: expect.any(Number),
        },
      },
    });
  });

  it('should update when starting with an open and a closed sensor', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S2',
      sensorName: 'Sensor2',
      status: 'closed',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'open',
          lastChangeTimestamp: 1000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: expectTimeoutId(),
        },
        S2: {
          lastStatus: 'closed',
          lastChangeTimestamp: 1000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: undefined,
        },
      },
    });
  });

  it('should update when a closed sensor remains closed', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'closed',
          lastChangeTimestamp: 1000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
        },
      },
    });
  });

  it('should update when an open sensor remains open', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'open',
          lastChangeTimestamp: 1000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: expectTimeoutId(),
        },
      },
    });
  });

  it('should transition from closed to open', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'open',
          lastChangeTimestamp: 2000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: expectTimeoutId(),
        },
      },
    });
  });

  it('should transition from open to closed without an alert', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'closed',
          lastChangeTimestamp: 3000,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: undefined,
          openTimeoutId: undefined,
        },
      },
    });
  });

  it('should alert when a door is open for too long', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    services.time.mock.incrementTime(1000);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    services.time.mock.incrementTime(OPEN_SENSOR_ALERT_MS);

    expect(services.alerting.alert).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        kind: 'door-open',
        locationId: 'L1',
        sensorId: 'S1',
        sensorName: 'Sensor1',
      }),
      'critical'
    );
    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'open',
          lastChangeTimestamp: 2000,
          hasAlertedOnLastStatus: true,
          lastAlertTimestamp: 2000 + OPEN_SENSOR_ALERT_MS,
          openTimeoutId: undefined,
        },
      },
    });
  });

  it('should transition from open to close after an alert', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    services.time.mock.setTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    services.time.mock.incrementTime(OPEN_SENSOR_ALERT_MS);

    expect(services.alerting.alert).toHaveBeenCalledOnce();

    services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });

    expect(sensorStates).toEqual({
      L1: {
        S1: {
          lastStatus: 'closed',
          lastChangeTimestamp: 2000 + OPEN_SENSOR_ALERT_MS,
          hasAlertedOnLastStatus: false,
          lastAlertTimestamp: 1000 + OPEN_SENSOR_ALERT_MS,
          openTimeoutId: undefined,
        },
      },
    });
  });

  it('should not cancel the open timeout or start another one if the sensor is receives two back-to-back open events', async () => {
    const services = setup();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler(services, sensorStates);

    // Start closed
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });

    // Open door
    await services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    // Verify open timeout was set
    expect(services.time.mock.setTimeout).toHaveBeenCalledExactlyOnceWith(
      expect.any(Function),
      OPEN_SENSOR_ALERT_MS
    );

    // Send another open event
    await services.time.mock.incrementTime(1000);
    await sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    // Verify open timeout was not cancelled and not set again
    expect(services.time.mock.cancelTimeout).not.toHaveBeenCalled();
    expect(services.time.mock.setTimeout).toHaveBeenCalledExactlyOnceWith(
      expect.any(Function),
      OPEN_SENSOR_ALERT_MS
    );
  });
});
