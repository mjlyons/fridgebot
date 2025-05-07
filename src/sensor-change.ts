import { getRingApi } from './ring-auth';
import { sleep } from './utils';

const handleRingSensorChanges = async () => {
  const locationId = '2424907f-71c0-4e66-afee-6cf1dfe8d3c6';
  const deviceId = '29d44172-8dfe-416c-9948-63c66bc06091'; // freezer

  const ringApi = getRingApi();

  console.log(`Getting locations...`);
  const locations = await ringApi.getLocations();
  const location = locations.find(location => location.id === locationId);
  if (!location) throw new Error(`Cannot find location ${locationId}`);

  console.log(`Getting devices for location ${locationId}...`);
  const devices = await location.getDevices();
  const device = devices.find(device => device.id === deviceId);
  if (!device) throw new Error(`Cannot find device ${locationId}:${deviceId}`);

  console.log(`Subscribing to updates for ${locationId}:${deviceId}...`);
  device.onData.subscribe(data => {
    console.log(`Sensor ${locationId}:${deviceId} faulted=${data.faulted}`);
  });

  // TODO: Send periodic heartbeat to deadmanssnitch
  // TODO: make sure this program re-runs if closed
};

export async function watch() {
  console.log('Registering for sensor changes');
  await handleRingSensorChanges();

  console.log('Watching...');
  while (true) {
    await sleep(1);
  }
}
