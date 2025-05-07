export type SensorLocation = {
  id: string;
  name: string;
};

export type Sensor = {
  id: string;
  name: string;
  isOpen: boolean;
};

export type SensorService = {
  getLocations: () => Promise<SensorLocation[]>;
  getSensor: (locationId: string, sensorId: string) => Promise<Sensor>;
};
