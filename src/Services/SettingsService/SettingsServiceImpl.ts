import { getFilePathInDataDir } from '../../data';
import { Settings, SettingsService } from './SettingsService';
import { access, readFile, writeFile } from 'fs/promises';

const SETTINGS_FILENAME = 'settings.json';

function getSettingsPath(): string {
  return getFilePathInDataDir(SETTINGS_FILENAME);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export const createSettingsService = (): SettingsService => {
  return {
    async loadSettings() {
      const settingsPath = getFilePathInDataDir('settings.json');
      if (await exists(settingsPath)) {
        return JSON.parse(await readFile(settingsPath, 'utf-8'));
      }
      return [];
    },

    async saveSettings(settings: Settings) {
      const settingsPath = getSettingsPath();
      await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    },
  };
};
