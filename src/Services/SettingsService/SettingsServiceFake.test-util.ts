import { vi } from 'vitest';
import { MockFn } from '../../test-utils';
import { Settings, SettingsService } from './SettingsService';
import { deepCopy } from '../../utils';

type SettingsServiceMock = {
  clearMocks: () => void;

  loadSettings: MockFn<SettingsService['loadSettings']>;
  saveSettings: MockFn<SettingsService['saveSettings']>;
};

export const createSettingsServiceFake = (
  initialSettings: Settings
): SettingsService & { mock: SettingsServiceMock } => {
  let _settings: Settings = deepCopy(initialSettings);

  const loadSettingsImpl: SettingsService['loadSettings'] = async () => {
    return _settings;
  };
  const loadSettings = vi.fn(loadSettingsImpl);

  const saveSettingsImpl: SettingsService['saveSettings'] = async (settings: Settings) => {
    _settings = deepCopy(settings);
  };
  const saveSettings = vi.fn(saveSettingsImpl);

  return {
    loadSettings,
    saveSettings,
    mock: {
      clearMocks: () => {
        loadSettings.mockClear();
        saveSettings.mockClear();
      },
      loadSettings,
      saveSettings,
    },
  };
};
