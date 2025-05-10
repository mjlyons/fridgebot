import { startHeartbeat } from './heartbeat';
import { createSensorChangeHandler } from './sensor-change';
import { Services } from './Services/Services';

export const watch = async (services: Services) => {
  console.log('Loading settings...');
  const settings = await services.settings.loadSettings();
  console.log(`Loaded ${settings.length} settings`);
  const onChange = createSensorChangeHandler(services);

  console.log(`Registering for sensor changes... (${settings.length})`);
  for (let i = 0; i < settings.length; i++) {
    const sensorSettings = settings[i];
    if (!sensorSettings.locationId) throw new Error(`Location ${i} is missing locationId`);
    if (!sensorSettings.doorId) throw new Error(`Location ${i} is missing doorId`);

    const sensorData = await services.sensor.getSensor(
      sensorSettings.locationId,
      sensorSettings.doorId
    );

    console.log(`Got info for sensor ${i}: ${JSON.stringify(sensorData)}`);

    // Monitor each door sensor
    services.sensor.registerSensorChangeHandler({
      locationId: sensorSettings.locationId,
      locationName: sensorData.location.name,
      sensorId: sensorSettings.doorId,
      sensorName: sensorData.sensor.name,
      onChange,
    });
    console.log(`Registered for sensor ${i}`);
  }

  startHeartbeat(services);
};
