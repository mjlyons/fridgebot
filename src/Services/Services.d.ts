import { AlertService } from './AlertService/AlertService';
import { HeartbeatService } from './HeartbeatService/HeartbeatService';
import { SensorService } from './SensorService/SensorService';
import { SettingsService } from './SettingsService/SettingsService';
import { TimeService } from './TimeService/TimeService';
export type Services = {
  alerting: AlertService;
  heartbeat: HeartbeatService;
  sensor: SensorService;
  settings: SettingsService;
  time: TimeService;
};
