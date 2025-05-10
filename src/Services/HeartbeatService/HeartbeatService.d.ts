export type HeartbeatService = {
  beat: () => Promise<void>;
};
