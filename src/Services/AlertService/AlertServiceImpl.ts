import { AlertService } from './AlertService';

export const createAlertService = (): AlertService => {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    throw new Error('PAGERDUTY_ROUTING_KEY not found in environment variables');
  }
  console.log('Using PagerDuty routing key:', routingKey);

  return {
    async alert(payload, severity: 'critical' | 'info') {
      const summary = payload;
      try {
        const requestInput = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: {
              summary: JSON.stringify(payload),
              source: 'Fridge Door Monitor',
              severity,
            },
            routing_key: routingKey,
            event_action: 'trigger',
          }),
        };
        console.log('Sending PagerDuty alert:', requestInput);
        const response = await fetch('https://events.pagerduty.com/v2/enqueue', requestInput);

        const responseData = await response.json();
        console.log('Fridge alert sent successfully:', responseData);
      } catch (error) {
        console.error('Failed to send fridge alert:', error);
        throw error;
      }
    },
  };
};
