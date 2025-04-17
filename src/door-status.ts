import * as fs from 'fs';

import { getFilePathInDataDir } from './data';
import { loadSettings } from './settings';
import { DoorState, getDoorState } from './door-monitors';
import { doAlert } from './alert';
import { registerSuccess } from './heartbeat';

const DOOR_STATUS_FILENAME = 'door-status.json';

export type DoorStatus = {
  doorState?: DoorState;
  lastUpdated?: string;
  lastClosed?: string;
  lastOpen?: string;
  lastAlerted?: string;
}

export async function checkDoor(): Promise<void> {
    const {locationId, doorId, doorOpenAlertDelaySec, realertDelaySec} = loadSettings();
    if (!locationId) {
      throw new Error(`Door location not configured. locationId is required but got: locationId=${locationId}. Run set-door command first.`);
    }
    if (!doorId) {
      throw new Error(`Door ID not configured. doorId is required but got: doorId=${doorId}. Run set-door command first.`);
    }
    if (!doorOpenAlertDelaySec) {
      throw new Error(`Door open alert delay not configured. doorOpenAlertDelaySec is required but got: doorOpenAlertDelaySec=${doorOpenAlertDelaySec}. Run set-door command first.`);
    }
    if (!realertDelaySec) {
      throw new Error(`Realert delay not configured. realertDelaySec is required but got: realertDelaySec=${realertDelaySec}. Run set-door command first.`);
    }

    const doorState = await getDoorState(locationId, doorId);

    const statusPath = getFilePathInDataDir(DOOR_STATUS_FILENAME);
    const oldDoorStatus: DoorStatus = fs.existsSync(statusPath) ? 
      JSON.parse(fs.readFileSync(statusPath, 'utf-8')) : {};

    const now = new Date();
    const alertStatus = await alertIfFridgeOpenTooLong(now, doorState, oldDoorStatus, doorOpenAlertDelaySec, realertDelaySec);

    // Write new status
    const nowStr = now.toISOString();
    const newDoorStatus = {
      ...oldDoorStatus,
      ...alertStatus,
      doorState,
      lastUpdated: nowStr,
    };

    if (doorState === 'open') {
      newDoorStatus.lastOpen = nowStr;
    } else if (doorState === 'closed') {
      newDoorStatus.lastClosed = nowStr;
    }
    const doorStatusJson = JSON.stringify(newDoorStatus, null, 2)
    fs.writeFileSync(statusPath, doorStatusJson);
    console.log(`Wrote door status: ${doorStatusJson}`);

    await registerSuccess();
}

async function alertIfFridgeOpenTooLong(now: Date, doorState: DoorState, oldDoorStatus: DoorStatus, doorOpenAlertDelaySec: number, realertDelaySec: number): Promise<Pick<DoorStatus, 'lastAlerted'>> {
  if (doorState === 'closed') return {};
  
  // Check if the fridge has been open too long
  const lastClosedDate = new Date(oldDoorStatus.lastClosed ?? 0);
  const openTimeSec = Math.floor((now.getTime() - lastClosedDate.getTime()) / 1000);
  const isDoorOpenTooLong = openTimeSec > doorOpenAlertDelaySec;
  if (!isDoorOpenTooLong) return {};

  // Door has been open too long, but may need to supress alert if we've already alerted recently.
  console.log(`DOOR OPEN TOO LONG! (${openTimeSec} sec)`);
  const lastAlertedDate = new Date(oldDoorStatus.lastAlerted ?? 0);
  const timeSinceLastAlertSec = Math.floor((now.getTime() - lastAlertedDate.getTime()) / 1000);
  const hasRecentlyAlerted = timeSinceLastAlertSec < realertDelaySec;
  if (hasRecentlyAlerted) {
    console.log(`Door has been open too long (${openTimeSec} sec), but alert was recent (${timeSinceLastAlertSec} sec ago)`);  
    return {};
  }

  // Door has been open too long, and there has not been an alert (or it was awhile ago). ALERT!
  await doAlert();
  return {lastAlerted: now.toISOString()}
}