export async function doAlert() {
  console.log('Fridge has been open too long, alerting...');

  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    throw new Error('PAGERDUTY_ROUTING_KEY not found in environment variables');
  }
  console.log('Using PagerDuty routing key:', routingKey);

  try {
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: {
          summary: 'Fridge Door Alert',
          severity: 'critical',
          source: 'Fridge Door Monitor',
        },
        routing_key: routingKey,
        event_action: 'trigger',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PagerDuty API responded with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Fridge alert sent successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Failed to send fridge alert:', error);
    throw error;
  }
}
