import { Location, RingDevice } from 'ring-client-api';
import { getRingApi } from '../ring-auth';
import { SensorLocation, SensorService } from './SensorService';

const createSensorService = (): SensorService => {
  const ringApi = getRingApi();
  let _ringLocations: null | Location[] = null;
  let _ringSensors: Map<string, RingDevice> = new Map();

  const getLocations: SensorService['getLocations'] = async () => {
    if (!_ringLocations) {
      _ringLocations = await ringApi.getLocations();
    }
    const sensorLocations = _ringLocations.map(ringLoc => ({
      id: ringLoc.id,
      name: ringLoc.name,
    }));
    return sensorLocations;
  };

  return {
    getLocations,
    async getSensor(locationId, sensorId) {
      if (!_ringSensors.has(sensorId)) {
        if (!_ringLocations) {
          await getLocations();
        }
        const ringLoc = _ringLocations?.find(ringLoc => ringLoc.id === locationId);
        if (!ringLoc) {
          throw new Error(
            `Cannot find Ring Location ${ringLoc} (found these locations instead: ${JSON.stringify(_ringLocations?.map(ringLoc => ringLoc.id))})`
          );
        }
        const ringDevicesForLoc = await ringLoc.getDevices();
        ringDevicesForLoc.forEach(ringDevice => {
          if (ringDevice.deviceType !== 'sensor.contact') {
            return; // only process door sensors
          }
          _ringSensors.set(ringDevice.id, ringDevice);
        });
      }

      const ringSensor = _ringSensors.get(sensorId);
      if (!ringSensor) {
        throw new Error(`Cannot find Ring Sensor with ID ${sensorId}`);
      }
      if (ringSensor.data.faulted === undefined) {
        throw new Error(`Sensor ${sensorId} has undefined "faulted" state`);
      }
      return {
        id: ringSensor.id,
        name: ringSensor.name,
        isOpen: ringSensor.data.faulted,
      };
    },
  };
};
