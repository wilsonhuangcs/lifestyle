import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dswetxilqyzvrgocqobf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd2V0eGlscXl6dnJnb2Nxb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjEyMzEsImV4cCI6MjA4ODczNzIzMX0.Zh3z4fMfvGeH5w7qsoQZ7LpSC43KDAgt8JNVI6OHGmE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
