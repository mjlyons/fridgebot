import { Mock, vi } from 'vitest';

import { SensorChangeHandler, SensorService, SensorStatus } from './SensorService';
import { MockFn } from '../../test-utils';
import { deepCopy } from '../../utils';

type FakeDevice = {
  id: string;
  name: string;
  status: SensorStatus;
  _onChange?: SensorChangeHandler;
};

type FakeLocation = {
  id: string;
  name: string;
  devices: Record<string, FakeDevice>;
};

type SensorServiceMock = {
  changeStatus: (
    locationId: string,
    sensorId: string,
    updatedStatus: SensorStatus
  ) => Promise<void>;
  clearMocks: () => void;
  getLocations: MockFn<SensorService['getLocations']>;
  getSensor: MockFn<SensorService['getSensor']>;
  registerSensorChangeHandler: MockFn<SensorService['registerSensorChangeHandler']>;
};

export type SensorServiceFake = SensorService & { mock: SensorServiceMock };

export type FakeSensorConfig = {
  [id: string]: FakeLocation;
};
export const createSensorServiceFake = (locations: FakeSensorConfig): SensorServiceFake => {
  const _locations = deepCopy(locations);

  const _getFakeDevice = (locationId: string, sensorId: string): FakeDevice => {
    const location = _locations[locationId];
    if (!location) {
      throw new Error(`Cannot find location ${locationId}`);
    }

    const device = location.devices[sensorId];
    if (!device) {
      throw new Error(`Cannot find sensor ${sensorId} in location ${locationId}`);
    }

    return device;
  };

  const getLocationsImpl: SensorService['getLocations'] = async () => {
    return Object.values(_locations).map(location => ({
      id: location.id,
      name: location.name,
    }));
  };
  const getLocations = vi.fn(getLocationsImpl);

  const getSensorsForLocationImpl: SensorService['getSensorsForLocation'] = async locationId => {
    return Object.values(_locations[locationId].devices).map(device => ({
      id: device.id,
      name: device.name,
    }));
  };
  const getSensorsForLocation = vi.fn(getSensorsForLocationImpl);

  const getSensorImpl: SensorService['getSensor'] = async (locationId, sensorId) => {
    const fakeDevice = _getFakeDevice(locationId, sensorId);
    return {
      location: {
        id: locationId,
        name: locations[locationId].name,
      },
      sensor: {
        id: fakeDevice.id,
        name: fakeDevice.name,
      },
    };
  };
  const getSensor = vi.fn(getSensorImpl);

  const registerSensorChangeHandlerImpl: SensorService['registerSensorChangeHandler'] = async ({
    locationId,
    locationName,
    sensorId,
    sensorName,
    onChange,
  }) => {
    const fakeDevice = _getFakeDevice(locationId, sensorId);
    fakeDevice._onChange = onChange;
    fakeDevice._onChange?.({
      locationId,
      locationName,
      sensorId,
      sensorName,
      status: fakeDevice.status,
    });
  };

  const registerSensorChangeHandler = vi.fn(registerSensorChangeHandlerImpl);

  return {
    getLocations,
    getSensorsForLocation,
    getSensor,
    registerSensorChangeHandler,

    mock: {
      changeStatus: async (locationId, sensorId, updatedStatus) => {
        const fakeDevice = _getFakeDevice(locationId, sensorId);
        fakeDevice.status = updatedStatus;
        await fakeDevice._onChange?.({
          locationId,
          locationName: _locations[locationId].name,
          sensorId,
          sensorName: fakeDevice.name,
          status: fakeDevice.status,
        });
      },
      clearMocks() {
        getLocations.mockClear();
        getSensorsForLocation.mockClear();
        getSensor.mockClear();
        registerSensorChangeHandler.mockClear();
      },

      getLocations,
      getSensor,
      registerSensorChangeHandler,
    },
  };
};
