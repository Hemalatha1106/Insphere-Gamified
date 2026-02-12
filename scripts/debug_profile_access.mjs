
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Needed to verify if data exists

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

async function testSearch() {
    console.log('Testing Profile Search...')

    // 1. Search with Anon Key (Client Simulation)
    console.log('\n--- Searching with Anon Key ---')
    const { data: anonData, error: anonError } = await supabaseAnon
        .from('profiles')
        .select('username')
        .limit(5)

    if (anonError) {
        console.error('Anon Search Error:', anonError.message)
    } else {
        console.log(`Anon Search found ${anonData.length} profiles:`, anonData.map(p => p.username))
    }

    // 2. Search with Service Key (Admin verification)
    if (supabaseAdmin) {
        console.log('\n--- Searching with Service Key ---')
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .limit(5)

        if (adminError) {
            console.error('Admin Search Error:', adminError.message)
        } else {
            console.log(`Admin Search found ${adminData.length} profiles:`, adminData.map(p => p.username))
        }
    } else {
        console.log('Skipping Admin check (no service key)')
    }
}

testSearch()
