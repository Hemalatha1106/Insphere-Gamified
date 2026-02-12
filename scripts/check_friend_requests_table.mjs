
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

async function checkTable() {
    const { error } = await supabase
        .from('friend_requests')
        .select('*')
        .limit(1)

    if (error) {
        console.log('Error querying friend_requests:', error.message)
    } else {
        console.log('friend_requests table exists and is accessible.')
    }
}

checkTable()
