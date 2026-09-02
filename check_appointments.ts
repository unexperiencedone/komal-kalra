import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data, error } = await supabase.from('appointments').select('id, contact_phone, contact_email').order('created_at', { ascending: false }).limit(2);
  console.log("APPOINTMENTS:");
  console.log(JSON.stringify(data, null, 2));
  if (error) console.log("ERROR:", error);
}

run();
