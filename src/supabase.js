import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ulsfhakbpvnjlanebjef.supabase.co'
const supabaseKey = 'sb_publishable_U-oTfMWAFnnjG7AnwGbggQ_c4jc9fzX'

export const supabase = createClient(supabaseUrl, supabaseKey)
