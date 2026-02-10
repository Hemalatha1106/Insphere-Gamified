'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestRealtimePage() {
    const [messages, setMessages] = useState<any[]>([])
    const [status, setStatus] = useState('Disconnected')
    const supabase = createClient()

    useEffect(() => {
        // Simple listener for ANY message insert (no filter)
        const channel = supabase
            .channel('test-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'community_messages',
                },
                (payload) => {
                    console.log('Test Page: Message Received!', payload)
                    setMessages((prev) => [...prev, payload.new])
                }
            )
            .subscribe((status) => {
                console.log('Test Page: Status:', status)
                setStatus(status)
            })

        return () => {
            console.log('Test Page: Cleaning up...')
            supabase.removeChannel(channel)
        }
    }, [])

    const sendTestMessage = async () => {
        // Just insert a dummy message to trigger the realtime event
        // We pick a random community ID if possible, or just fail (but we want to test LISTEN first)
        // Wait, to insert we need a valid community_id.
        // Let's just listen for now. The user can use the main chat to send.
        alert('Use the main chat to send a message. Check if it appears below!')
    }

    return (
        <div className="p-8 text-white bg-slate-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Realtime Connection Test</h1>
            <div className="mb-4">
                Status: <span className={`font-bold ${status === 'SUBSCRIBED' ? 'text-green-400' : 'text-red-400'}`}>{status}</span>
            </div>

            <div className="border border-slate-700 p-4 rounded bg-slate-800 min-h-[300px]">
                <h2 className="text-lg font-bold mb-2">Live Messages (Listening to ALL):</h2>
                {messages.length === 0 ? (
                    <p className="text-slate-500 italic">Waiting for messages...</p>
                ) : (
                    <ul className="space-y-2">
                        {messages.map((msg, i) => (
                            <li key={i} className="bg-slate-700 p-2 rounded">
                                {JSON.stringify(msg)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
