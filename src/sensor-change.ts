import { AlertService } from './Services/AlertService/AlertService';
import { SensorChangeHandler, SensorStatus } from './Services/SensorService/SensorService';
import { TimeService } from './Services/TimeService/TimeService';

export const OPEN_SENSOR_ALERT_MS = 3 * 60 * 1000; // 3 minutes

export type SensorState = {
  lastStatus: SensorStatus;
  lastChangeTimestamp: number | undefined;
  hasAlertedOnLastStatus: boolean;
  lastAlertTimestamp?: number;
  openTimeoutId?: NodeJS.Timeout;
};

export type SensorStates = Record<string, Record<string, SensorState | undefined> | undefined>;

export const createSensorChangeHandler =
  (
    services: { time: TimeService; alerting: AlertService },
    sensorStates: SensorStates = {}
  ): SensorChangeHandler =>
  ({ locationId, sensorId, locationName, sensorName, status }) => {
    const locationSensorStates = sensorStates[locationId] ?? {};
    const oldSensorState = { ...(locationSensorStates[sensorId] ?? {}) };

    // Only update the timestamp if the status of the sensor has changed
    const lastChangeTimestamp =
      status === oldSensorState.lastStatus
        ? oldSensorState.lastChangeTimestamp
        : services.time.now();
    const hasAlertedOnLastStatus =
      (oldSensorState.lastStatus === 'open' &&
        status === 'open' &&
        oldSensorState.hasAlertedOnLastStatus) ??
      false;
    const lastAlertTimestamp = oldSensorState.lastAlertTimestamp;

    let openTimeoutId: NodeJS.Timeout | undefined = oldSensorState.openTimeoutId;
    console.log(
      `[t=${services.time.now()}] Sensor ${locationId}:${sensorId} changed: ${oldSensorState.lastStatus} -> ${status}`
    );
    if (status === 'open' && oldSensorState.lastStatus !== 'open') {
      if (!!openTimeoutId) {
        throw new Error(`openTimeoutId already set for ${locationId}:${sensorId}`);
      }
      console.log(`Setting open sensor timeout for ${locationId}:${sensorId}`);
      openTimeoutId = services.time.setTimeout(() => {
        console.log(`Open sensor timeout fired for ${locationId}:${sensorId}`);

        // Do some assertion checking before actually alerting
        const latestSensorState = sensorStates[locationId]?.[sensorId];
        if (!latestSensorState) {
          throw new Error(
            `Open sensor timeout fired without any sensor state (${locationId}:${sensorId})`
          );
        }
        if (latestSensorState.lastStatus === 'closed') {
          throw new Error(
            `Open sensor timeout fired but sensor was closed! (${locationId}:${sensorId})`
          );
        }
        if (latestSensorState.lastChangeTimestamp === undefined) {
          throw new Error(
            `Open sensor timeout fired but sensor has no last change timestamp (${locationId}:${sensorId})`
          );
        }
        const sensorOpenTimeMs = services.time.now() - latestSensorState.lastChangeTimestamp + 1;
        if (sensorOpenTimeMs < OPEN_SENSOR_ALERT_MS) {
          throw new Error(
            `Open sensor timeout fired prematurely (after ${sensorOpenTimeMs} ms) (${locationId}:${sensorId})`
          );
        }

        // Everything looks good, alert on door
        services.alerting.alert(
          { kind: 'door-open', locationId, sensorId, sensorName },
          'critical'
        );

        latestSensorState.hasAlertedOnLastStatus = true;
        latestSensorState.lastAlertTimestamp = services.time.now();
        latestSensorState.openTimeoutId = undefined;
      }, OPEN_SENSOR_ALERT_MS);
    }

    if (status === 'closed' && oldSensorState.lastStatus !== 'closed') {
      if (!!openTimeoutId) {
        services.time.cancelTimeout(openTimeoutId);
        openTimeoutId = undefined;
      }
    }

    const sensorState: SensorState = {
      lastStatus: status,
      lastChangeTimestamp,
      hasAlertedOnLastStatus,
      lastAlertTimestamp,
      openTimeoutId,
    };

    sensorStates[locationId] = {
      ...locationSensorStates,
      [sensorId]: sensorState,
    };

    console.log(`Sensor ${locationId}:${sensorId} changed: ${status}`);
  };
