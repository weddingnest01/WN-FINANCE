const SUPABASE_URL = 'https://bwqtzvxwyujmfgrmuxvl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fU1lIVA92G2TMEAEfeJZBw_rXrcj1WG';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabase;
