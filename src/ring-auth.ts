import { readFile, writeFile } from "fs/promises";
import { RingApi } from "ring-client-api";

function getRingRefreshToken(): string {
  const refreshToken = process.env.RING_REFRESH_TOKEN;
  if (!refreshToken) {
      throw new Error('RING_REFRESH_TOKEN not found in environment variables')
  }
  return refreshToken;
}

let ringApi: null | RingApi = null;
export function getRingApi(): RingApi {
  if (!ringApi) {
    const refreshToken = getRingRefreshToken();
    ringApi = new RingApi({refreshToken});
    ringApi.onRefreshTokenUpdated.subscribe(
      async ({ newRefreshToken, oldRefreshToken }) => {
        if (!oldRefreshToken) return;
        const currentConfig = await readFile('.env');
        const updatedConfig = currentConfig.toString().replace(oldRefreshToken, newRefreshToken);
        await writeFile('.env', updatedConfig);
      }
    )
  }
  return ringApi;
}

