import 'dotenv/config';
import { listDoorMonitors } from './door-monitors';
import { setDoor } from './settings';
import { Command } from 'commander';
import { checkDoor } from './door-status';
import { watch } from './sensor-change';

const program = new Command();

program
  .name('fridgebot')
  .description('CLI for managing fridge door monitoring')
  .version('1.0.0');

program
  .command('list-doors')
  .description('List all available door monitors')
  .action(async () => {
    await listDoorMonitors();
    console.log('DONE');
  });

program
  .command('set-door')
  .description('Set the door ID to monitor')
  .argument('<locationId>', "The ID of the door's location")
  .argument('<doorId>', 'The ID of the door to monitor')
  .argument('<doorOpenAlertDelay>', 'Alerts if door open for longer than this many seconds', Number)
  .argument('<realertDelay>', 'If recently alerted, do not realert for this many seconds', Number)
  .action((locationId, doorId, doorOpenAlertDelay, realertDelay) => {
    setDoor(locationId, doorId, doorOpenAlertDelay, realertDelay);
  });

program
  .command('check-door')
  .description('Check the current door status')
  .action(async () => {
    await checkDoor()
    console.log('Door status checked and updated');
  });

program
  .command('watch')
  .description('Monitor the door status via push notifications')
  .action(async () => {
    await watch();
  })

async function main() {
    const ringRefreshToken = process.env.RING_REFRESH_TOKEN;
    if (!ringRefreshToken) {
        console.error('Refresh token not found in environment variables');
        process.exit(1);
    }

    await program.parseAsync();
}

main().then(() => process.exit(0)).catch(console.error);
