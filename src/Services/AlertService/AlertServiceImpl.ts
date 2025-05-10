import { AlertService } from './AlertService';

export const createAlertService = (): AlertService => {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    throw new Error('PAGERDUTY_ROUTING_KEY not found in environment variables');
  }
  console.log('Using PagerDuty routing key:', routingKey);

  return {
    async alert(payload) {
      const summary = payload;
      try {
        const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: {
              summary: JSON.stringify(payload),
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
      } catch (error) {
        console.error('Failed to send fridge alert:', error);
        throw error;
      }
    },
  };
};
