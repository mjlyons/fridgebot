export type AlertOpenDoor = {
  kind: 'door-open';
  locationId: string;
  sensorId: string;
  sensorName: string;
};

export type AlertPayload = AletPayloadGeneric; // This should be a union of the payloads

export type AlertService = {
  alert: (payload: AlertPayload) => Promise<void>;
};
