import * as fs from 'fs';
import * as path from 'path';

const getDataDir = (): string => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

export function getFilePathInDataDir(filename: string): string {
  const dataDir = getDataDir();
  return path.join(dataDir, filename);
}