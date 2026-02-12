
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStats() {
    const { data: stats, error } = await supabase
        .from('coding_stats')
        .select('user_id, platform, total_problems, problems_solved')
        .limit(5)

    if (error) {
        console.error('Error fetching stats:', error)
        return
    }

    console.log('Coding Stats Sample:', JSON.stringify(stats, null, 2))
}

checkStats()
