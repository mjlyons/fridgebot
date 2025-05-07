import { Location, RingApi } from 'ring-client-api';
import 'dotenv/config';
import { getRingApi } from './ring-auth';

export type DoorState = 'open' | 'closed';

function getDoorStateFromFaulted(faulted: boolean): DoorState {
  return faulted ? 'open' : 'closed';
}

export async function listDoorMonitors() {
  console.log("Listing doors...");

    try {
        const locations = await getRingApi().getLocations();
        
        for (const location of locations) {
            console.log(`\nLocation: ${location.name} (ID: ${location.id})`);
            const devices = await location.getDevices();
            console.log(`Received location devices.`)

            devices.forEach(device => {
              console.log(`DEVICE ${JSON.stringify(device, null, 2)}`)
            })

            const doorMonitors = devices.filter(device => 
                device.data.deviceType === 'sensor.contact' || 
                device.data.deviceType === 'sensor.motion'
            );

            if (doorMonitors.length === 0) {
                console.log('No door monitors found in this location');
                continue;
            }

            for (const monitor of doorMonitors) {
                const faulted = monitor.data.faulted;
                if (faulted === undefined) {
                    throw new Error(`Door monitor ${monitor.id} has undefined faulted state`);
                }
                const doorState: DoorState = getDoorStateFromFaulted(faulted);
                console.log(`- ${monitor.name} (ID: ${monitor.id}): ${doorState}`);
            }
        }
    } catch (error) {
        console.error('Error fetching door monitors:', error);
    }
}

export async function getDoorState(locationId: string, doorId: string): Promise<DoorState> {
  const locations = await getRingApi().getLocations();
  const location = locations.find(loc => loc.id === locationId);
  if (!location) {
    throw new Error(`Location with ID ${locationId} not found`);
  }

  const devices = await location.getDevices();
  const door = devices.find(device => device.id === doorId);
  if (!door) {
    throw new Error(`Door with ID ${doorId} not found in location ${locationId}`);
  }

  const faulted = door.data.faulted;
  if (faulted === undefined) {
    throw new Error(`Door monitor ${doorId} has undefined faulted state`);
  }

  door.onData.subscribe(data => {
    console.log(`Device ${door.id}: "faulted" changed to ${data}`);
  })

  // Wait 60 seconds to ensure we get any state changes
  await new Promise(resolve => setTimeout(resolve, 60000));

  return getDoorStateFromFaulted(faulted);
}
