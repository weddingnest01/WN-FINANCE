const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://bwqtzvxwyujmfgrmuxvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cXR6dnh3eXVqbWZncm11eHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjQ0MjYsImV4cCI6MjA5OTQ0MDQyNn0.fH1dJBemaTDy4q2jK6fPb5YIc5Q3QL_GR_Gb2h8a_W8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Fetching from wedding_crm_state...");
  const { data, error } = await supabase
    .from('wedding_crm_state')
    .select('data')
    .eq('id', '1')
    .single();
    
  console.log("Fetch result:", { data, error });
  
  if (error && error.code === 'PGRST116') {
      console.log("Got PGRST116, attempting upsert...");
      const { data: upsertData, error: upsertError } = await supabase
        .from('wedding_crm_state')
        .upsert({ id: '1', data: { test: true } });
        
      console.log("Upsert result:", { upsertData, upsertError });
  }
}
test();
