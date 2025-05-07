export async function registerSuccess(): Promise<void> {
  // Check in with Dead Man's Snitch
  const deadMansSnitchUrl = process.env.DEAD_MANS_SNITCH_URL;
  if (!deadMansSnitchUrl) {
    throw new Error('DEAD_MANS_SNITCH_URL not found in environment variables');
  }

  const response = await fetch(deadMansSnitchUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to check in with Dead Man's Snitch: ${response.status} ${response.statusText}`
    );
  }

  console.log("Checked into Dead Man's Snitch OK");
}
