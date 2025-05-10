import { TimeService } from './Services/TimeService/TimeService';

export async function sleep(seconds: number, timeService: TimeService): Promise<void> {
  return new Promise(resolve => timeService.setTimeout(resolve, seconds * 1000));
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
