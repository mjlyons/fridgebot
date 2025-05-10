import { expect, describe, it, vi } from 'vitest';
import { createTimeServiceFake } from './Services/TimeService/TimeServiceFake.test-util';
import { startHeartbeat, stopHeartbeat } from './heartbeat';
import { createHeartbeatServiceFake } from './Services/HeartbeatService/HeartbeatServiceFake.test-util';

describe('heartbeat', () => {
  it('should beat right away', async () => {
    // Setup
    const _timeService = createTimeServiceFake();
    const services = {
      time: _timeService,
      heartbeat: createHeartbeatServiceFake(_timeService),
    };

    // Run
    startHeartbeat(services);

    // Assert
    console.log('DOING ASSERT');
    expect(services.heartbeat.beat).toHaveBeenCalledOnce();
    console.log('DOING WAITFOR');
    expect(services.heartbeat.beat).toHaveBeenCalledOnce();
  });

  it('should beat every minute', async () => {
    // Setup
    const timeService = createTimeServiceFake();
    const services = {
      time: timeService,
      heartbeat: createHeartbeatServiceFake(timeService),
    };
    startHeartbeat(services);

    // Make sure the instant heartbeat is called, so we're not just finding that one.
    () => expect(services.heartbeat.beat).toHaveBeenCalledTimes(1);

    // Wait 1 second for heartbeat to complete, 60 seconds & check for another beat
    await services.time.mock.incrementTime(60000);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(2);

    // Wait 1 second for heartbeat to complete,60 seconds & check for another beat
    await services.time.mock.incrementTime(60000);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(3);
  });

  it('tries again if the heartbeat fails after normal delay', async () => {
    // Setup
    const timeService = createTimeServiceFake();
    const services = {
      time: timeService,
      heartbeat: createHeartbeatServiceFake(timeService),
    };
    services.heartbeat.mock.rejectAfter(1000);

    // Run
    startHeartbeat(services);

    // Assert
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(1);

    await services.time.mock.incrementTime(60000);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(2);
  });

  it('allows heartbeats to overlap', async () => {
    // Setup
    const timeService = createTimeServiceFake();
    const services = {
      time: timeService,
      heartbeat: createHeartbeatServiceFake(timeService),
    };
    services.heartbeat.mock.resolveAfter(60000 * 3);

    // Run
    startHeartbeat(services);
    // This should run three heartbeats (one immediately, one after ~60 seconds, one after~120 seconds)
    await services.time.mock.incrementTime(60000 * 2);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(3);
  });

  it('stops the heartbeat when the service is stopped', async () => {
    // Setup
    const timeService = createTimeServiceFake();
    const services = {
      time: timeService,
      heartbeat: createHeartbeatServiceFake(timeService),
    };
    const heartbeatTimeoutId = await startHeartbeat(services);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(1);

    // Let heartbeat run after a minute
    await services.time.mock.incrementTime(60000);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(2);

    // Now stop the heartbeat
    stopHeartbeat(services, heartbeatTimeoutId);

    // Wait over a minute and make sure the heartbeat doesn't run again
    await services.time.mock.incrementTime(60001);
    expect(services.heartbeat.beat).toHaveBeenCalledTimes(2);
  });
});
