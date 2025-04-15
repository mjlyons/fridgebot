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
  }
  return ringApi;
}