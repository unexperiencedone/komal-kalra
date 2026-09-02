import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data, error } = await supabase.from('notification_outbox').select('*').order('created_at', { ascending: false }).limit(10);
  console.log("OUTBOX ROWS:");
  console.log(JSON.stringify(data, null, 2));
  console.log("ERROR:");
  console.log(error);
}

run();
