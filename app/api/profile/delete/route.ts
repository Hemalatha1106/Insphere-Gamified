import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Initialize Admin Client
        // We need the service role key to delete a user from auth.users
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 3. Delete User
        // This should cascade to profiles and other tables if foreign keys are set correctly with ON DELETE CASCADE
        // If not, we might need to manually delete from public tables first.
        // Let's try to delete from public tables first just in case to ensure data cleanup.

        // Delete from coding_stats
        // We use admin client here to bypass any potential RLS that might prevent deletion if not set up for self-delete
        await supabaseAdmin.from('coding_stats').delete().eq('user_id', user.id)

        // Delete from profiles
        await supabaseAdmin.from('profiles').delete().eq('id', user.id)

        // Finally delete from auth.users
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Error deleting user from auth:', deleteError)
            return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Account deleted successfully' })

    } catch (error) {
        console.error('Unexpected error in delete route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
