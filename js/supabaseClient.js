const SUPABASE_URL = 'https://bwqtzvxwyujmfgrmuxvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cXR6dnh3eXVqbWZncm11eHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjQ0MjYsImV4cCI6MjA5OTQ0MDQyNn0.fH1dJBemaTDy4q2jK6fPb5YIc5Q3QL_GR_Gb2h8a_W8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabase;
