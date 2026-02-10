import { createClient } from './supabase/client'

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

export async function getFriendStatus(currentUserId: string, targetUserId: string): Promise<FriendStatus> {
    const supabase = createClient()

    // Check if current user sent a request
    const { data: sentRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', targetUserId)
        .maybeSingle()

    if (sentRequest) {
        return sentRequest.status === 'accepted' ? 'friends' : 'pending_sent'
    }

    // Check if current user received a request
    const { data: receivedRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', targetUserId)
        .eq('receiver_id', currentUserId)
        .maybeSingle()

    if (receivedRequest) {
        return receivedRequest.status === 'accepted' ? 'friends' : 'pending_received'
    }

    return 'none'
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
    const supabase = createClient()
    return await supabase
        .from('friend_requests')
        .insert([{ sender_id: senderId, receiver_id: receiverId }])
}

export async function acceptFriendRequest(senderId: string, receiverId: string) {
    const supabase = createClient()
    // The request was sent BY senderId TO receiverId (current user)
    // We need to update that specific record
    return await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
}

export async function removeFriend(currentUserId: string, targetUserId: string) {
    const supabase = createClient()
    // Delete any relationship between these two
    return await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
}
