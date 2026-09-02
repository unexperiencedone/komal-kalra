import { createClient } from '@supabase/supabase-js';

async function run() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data } = await admin
    .from('appointments')
    .select('*, profiles!appointments_user_id_fkey(id, email, full_name, phone)')
    .eq('id', '7fc7c3a6-3f34-4a3e-926b-53b8d6f59e1d')
    .maybeSingle();

  if (!data) throw new Error("not found");

  const recipient = data.contact_phone ?? data.profiles?.phone ?? null;
  const payload = {
    appointment: {
      id: data.id,
      contact_phone: recipient
    }
  };

  console.log("Inserting WhatsApp row with recipient:", recipient);

  const res = await admin.from('notification_outbox').insert({
    user_id: data.user_id,
    channel: 'whatsapp',
    recipient: recipient,
    template: 'booking_confirmed',
    payload: payload,
    dedupe_key: 'test_insert_wa_' + Date.now(),
    scheduled_for: new Date().toISOString(),
  });

  console.log("Insert result:", JSON.stringify(res, null, 2));
}

run().catch(console.error);
