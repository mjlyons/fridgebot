import 'dotenv/config';
import { Command } from 'commander';
import { listLocations, listSensors, watchForever } from './main';

const program = new Command();

program.name('fridgebot').description('CLI for managing fridge door monitoring').version('1.0.0');

program
  .command('list-locations')
  .description('List all available Ring locations')
  .action(async () => {
    const locations = await listLocations();
    for (const location of locations) {
      console.log(`${location.id} - ${location.name}`);
    }
  });

program
  .command('list-sensors')
  .description('List all sensors for a Ring location')
  .argument('<locationId>', 'ID of the Ring location')
  .action(async locationId => {
    const sensors = await listSensors(locationId);
    console.log(`${sensors.length} sensors found for location ${locationId}`);
    for (const sensor of sensors) {
      console.log(`${sensor.id} - ${sensor.name}`);
    }
  });

program
  .command('watch')
  .description('Monitor the door status via push notifications')
  .action(async () => {
    await watchForever();
  });

async function main() {
  const ringRefreshToken = process.env.RING_REFRESH_TOKEN;
  if (!ringRefreshToken) {
    console.error('Refresh token not found in environment variables');
    process.exit(1);
  }

  await program.parseAsync();
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
