import { queueNotification } from './src/lib/notifications/outbox.ts';

async function run() {
  console.log("Calling queueNotification for whatsapp...");
  await queueNotification({
    template: 'booking_confirmed',
    channel: 'whatsapp',
    appointmentId: '7fc7c3a6-3f34-4a3e-926b-53b8d6f59e1d',
    dedupeKey: 'test_real_queue_' + Date.now(),
  });
  console.log("Finished calling queueNotification for whatsapp.");
}

run().catch(console.error);
