import { Location, RingDevice, RingDeviceData } from 'ring-client-api';
import { getRingApi } from '../../ring-auth';
import { SensorLocation, SensorService, SensorStatus } from './SensorService';
import { sleep } from '../../utils';

const faultedToStatus = (faulted: boolean | undefined): SensorStatus => {
  if (faulted === undefined) {
    throw new Error('Cannot determine sensor status - faulted state is undefined');
  }
  return faulted ? 'open' : 'closed';
};

export const createSensorService = (): SensorService => {
  const ringApi = getRingApi();
  const _data: {
    ringLocations: null | Location[];
    ringSensors: Map<string, RingDevice>;
  } = {
    ringLocations: null,
    ringSensors: new Map(),
  };

  const getLocations: SensorService['getLocations'] = async () => {
    if (!_data.ringLocations) {
      console.log('[RINGAPI] Getting locations...');
      _data.ringLocations = await ringApi.getLocations();
      console.log(`[RINGAPI] Got locations: ${_data.ringLocations.map(ringLoc => ringLoc.id)}`);
    }
    const sensorLocations = _data.ringLocations.map(ringLoc => ({
      id: ringLoc.id,
      name: ringLoc.name,
    }));
    return sensorLocations;
  };

  const _getRingSensorsForLocation = async (locationId: string): Promise<RingDevice[]> => {
    if (!_data.ringLocations) {
      await getLocations();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const ringLoc = _data.ringLocations?.find(ringLoc => ringLoc.id === locationId);
    if (!ringLoc) {
      throw new Error(
        `Cannot find Ring Location ${ringLoc} (found these locations instead: ${JSON.stringify(_data.ringLocations?.map(ringLoc => ringLoc.id))})`
      );
    }
    console.log(
      `(2) _ringSensors: ${_data.ringSensors}, _ringLocations: ${_data.ringLocations}, ringLoc: ${ringLoc}`
    );
    const getDevicesStartTime = new Date();
    console.log(
      `[${getDevicesStartTime.toISOString()}] [RINGAPI] Getting devices for location ${ringLoc.id}`
    );
    const ringDevicesForLoc = await ringLoc.getDevices();
    const getDevicesEndTime = new Date();
    console.log(`[${getDevicesEndTime}] [RINGAPI] Got devices for location ${ringLoc.id}`);
    console.log(`(took ${getDevicesEndTime.getTime() - getDevicesStartTime.getTime()}ms)`);

    // Update contact sensor cache
    const ringContactSensors = ringDevicesForLoc.filter(
      ringDevice => ringDevice.deviceType === 'sensor.contact'
    );
    ringContactSensors.forEach(ringDevice => {
      _data.ringSensors.set(ringDevice.id, ringDevice);
    });

    return ringContactSensors;
  };

  const _getRingSensor = async (
    locationId: string,
    sensorId: string
  ): Promise<Promise<RingDevice>> => {
    console.log(`(1) _ringSensors: ${_data.ringSensors}, _ringLocations: ${_data.ringLocations}`);
    if (!_data.ringSensors.has(sensorId)) {
      const ringDevicesForLoc = await _getRingSensorsForLocation(locationId);
      ringDevicesForLoc.forEach(ringDevice => {
        console.log(`DEVICE: ${ringDevice.id} - ${ringDevice.name} (${ringDevice.deviceType})`);
        if (ringDevice.deviceType !== 'sensor.contact') {
          return; // only process door sensors
        }
        _data.ringSensors.set(ringDevice.id, ringDevice);
      });
    }

    const ringSensor = _data.ringSensors.get(sensorId);
    if (!ringSensor) {
      throw new Error(`Cannot find Ring Sensor with ID ${sensorId}`);
    }

    return ringSensor;
  };

  const getSensorsForLocation: SensorService['getSensorsForLocation'] = async locationId => {
    const ringDevicesForLoc = await _getRingSensorsForLocation(locationId);
    return ringDevicesForLoc.map(ringDevice => ({
      id: ringDevice.id,
      name: ringDevice.name,
    }));
  };

  const getSensor: SensorService['getSensor'] = async (locationId, sensorId) => {
    const ringSensor = await _getRingSensor(locationId, sensorId);
    if (ringSensor.data.faulted === undefined) {
      throw new Error(`Sensor ${sensorId} has undefined "faulted" state`);
    }
    return {
      location: {
        id: ringSensor.location.id,
        name: ringSensor.location.name,
      },
      sensor: {
        id: ringSensor.id,
        name: ringSensor.name,
        isOpen: ringSensor.data.faulted,
      },
    };
  };

  const registerSensorChangeHandler: SensorService['registerSensorChangeHandler'] = async ({
    locationId,
    locationName,
    sensorId,
    sensorName,
    onChange,
  }) => {
    const ringSensor = await _getRingSensor(locationId, sensorId);

    const handleData = async (value: RingDeviceData): Promise<void> => {
      await onChange({
        locationId,
        locationName,
        sensorId,
        sensorName,
        status: faultedToStatus(value.faulted),
      });
    };

    ringSensor.onData.subscribe(handleData);
  };

  return {
    getLocations,
    getSensorsForLocation,
    getSensor,
    registerSensorChangeHandler,
  };
};
