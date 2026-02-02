
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oixyutprpefcbnnsayfx.supabase.co';
const supabaseAnonKey = 'sb_publishable_sgB9HXhkR9VY8wwGy3BKSw_LA7wuHj0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
