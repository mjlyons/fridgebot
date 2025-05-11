import { describe, it, expect } from 'vitest';
import { createSensorChangeHandler, OPEN_SENSOR_ALERT_MS, SensorStates } from './sensor-change';
import {
  createTimeServiceFake,
  expectTimeoutId,
} from './Services/TimeService/TimeServiceFake.test-util';
import { createAlertServiceFake } from './Services/AlertService/AlertServiceFake.test-util';

describe('sensor change handler', () => {
  it('should should update sensor states when first run with a closed sensor', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
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

  it('should should update sensor states when first run with an open sensor', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
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

  it('should update when starting with an open and a closed sensor', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    sensorChangeHandler({
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

  it('should update when a closed sensor remains closed', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    time.mock.incrementTime(1000);
    sensorChangeHandler({
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

  it('should update when an open sensor remains open', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    time.mock.incrementTime(1000);
    sensorChangeHandler({
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

  it('should transition from closed to open', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    time.mock.incrementTime(1000);
    sensorChangeHandler({
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

  it('should transition from open to closed without an alert', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    time.mock.incrementTime(1000);
    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    time.mock.incrementTime(1000);
    sensorChangeHandler({
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

  it('should alert when a door is open for too long', () => {
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    time.mock.incrementTime(1000);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    time.mock.incrementTime(OPEN_SENSOR_ALERT_MS);

    expect(alerting.alert).toHaveBeenCalledOnce();
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
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });
    time.mock.setTime(1000);
    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });
    time.mock.incrementTime(OPEN_SENSOR_ALERT_MS);

    expect(alerting.alert).toHaveBeenCalledOnce();

    time.mock.incrementTime(1000);
    sensorChangeHandler({
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
    const time = createTimeServiceFake();
    const alerting = createAlertServiceFake();

    const sensorStates: SensorStates = {};
    const sensorChangeHandler = createSensorChangeHandler({ time, alerting }, sensorStates);

    // Start closed
    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'closed',
    });

    // Open door
    await time.mock.incrementTime(1000);
    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    // Verify open timeout was set
    expect(time.mock.setTimeout).toHaveBeenCalledExactlyOnceWith(
      expect.any(Function),
      OPEN_SENSOR_ALERT_MS
    );

    // Send another open event
    await time.mock.incrementTime(1000);
    sensorChangeHandler({
      locationId: 'L1',
      locationName: 'Loc1',
      sensorId: 'S1',
      sensorName: 'Sensor1',
      status: 'open',
    });

    // Verify open timeout was not cancelled and not set again
    expect(time.mock.cancelTimeout).not.toHaveBeenCalled();
    expect(time.mock.setTimeout).toHaveBeenCalledExactlyOnceWith(
      expect.any(Function),
      OPEN_SENSOR_ALERT_MS
    );
  });
});
