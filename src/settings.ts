import { getFilePathInDataDir } from "./data";
import * as fs from 'fs';

const SETTINGS_FILENAME = 'settings.json';

export type Settings = {
  locationId?: string;
  doorId?: string;
  doorOpenAlertDelaySec?: number;
  realertDelaySec?: number;
}

function getSettingsPath(): string {
  return getFilePathInDataDir(SETTINGS_FILENAME);
}

export function loadSettings(): Settings {
  const settingsPath = getFilePathInDataDir('settings.json');
  if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  }
  return {};
}

export function saveSettings(settings: Settings) {
  const settingsPath = getSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

export function setDoor(locationId: string, doorId: string, doorOpenAlertDelaySec: number, realertDelaySec: number): void {
  const oldSettings = loadSettings();
  const newSettings = {
    ...oldSettings,
    locationId,
    doorOpenAlertDelaySec,
    realertDelaySec,
    doorId,

  };
  saveSettings(newSettings);
  console.log(`Door ID ${doorId} saved successfully`);
}