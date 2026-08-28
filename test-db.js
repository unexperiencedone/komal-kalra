const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jjuyybxikomkpmtvzlkl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdXl5Ynhpa29ta3BtdHZ6bGtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ1OTcyMCwiZXhwIjoyMTAyMDM1NzIwfQ.-A03Yec0rkr4ajPpTMutFIi7z5Tn2vp3rdUjB9GoGnA');

async function test() {
  const { data, error } = await supabase.from('testimonials').select('*');
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
