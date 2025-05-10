export type SensorLocation = {
  id: string;
  name: string;
};

export type Sensor = {
  id: string;
  name: string;
  // isOpen: boolean;
};

export type SensorStatus = 'open' | 'closed';

type SensorChangeHandler = (event: {
  locationId: string;
  locationName: string;
  sensorId: string;
  sensorName: string;
  status: SensorStatus;
}) => void;

export type SensorService = {
  getLocations: () => Promise<SensorLocation[]>;
  getSensor: (
    locationId: string,
    sensorId: string
  ) => Promise<{ location: SensorLocation; sensor: Sensor }>;
  registerSensorChangeHandler: ({
    locationId: string,
    locationName: string,
    sensorId: string,
    sensorName: string,
    onChange: SensorChangeHandler,
  }) => void;
};
