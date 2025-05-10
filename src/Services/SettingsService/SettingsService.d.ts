export type Settings = {
  description?: string;
  locationId?: string;
  doorId?: string;
  doorOpenAlertDelaySec?: number;
}[];

export type SettingsService = {
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
};
