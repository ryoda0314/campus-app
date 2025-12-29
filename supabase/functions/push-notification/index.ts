import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidMailto = Deno.env.get('VAPID_MAILTO')!

webpush.setVapidDetails(
    vapidMailto,
    vapidPublicKey,
    vapidPrivateKey
)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
    const payload = await req.json()

    // Webhook payload structure for INSERT
    const record = payload.record
    if (!record || !record.room_id || !record.user_id) {
        return new Response(JSON.stringify({ message: 'Invalid payload' }), { status: 400 })
    }

    const senderId = record.user_id
    const roomId = record.room_id
    const content = record.content || 'New image/attachment'

    try {
        // 1. Get Room Name and Sender Name
        const { data: roomData } = await supabase
            .from('rooms')
            .select('name')
            .eq('id', roomId)
            .single()

        const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', senderId)
            .single()

        const roomName = roomData?.name || 'Room'
        const senderName = senderProfile?.display_name || 'Someone'

        // 2. Get recipients (members of the room who are NOT the sender)
        // We join room_members with push_subscriptions
        const { data: recipients, error } = await supabase
            .from('room_members')
            .select(`
            user_id,
            push_subscriptions!inner (
                endpoint,
                p256dh,
                auth
            )
        `)
            .eq('room_id', roomId)
            .neq('user_id', senderId) // Don't notify sender

        if (error) {
            console.error('Error fetching recipients:', error)
            throw error
        }

        if (!recipients || recipients.length === 0) {
            return new Response(JSON.stringify({ message: 'No recipients found' }), { status: 200 })
        }

        // 3. Send notifications
        const notifications = []

        for (const member of recipients) {
            // One user might have multiple subscriptions (multiple devices), handled by !inner join returning array?
            // Actually select returns array of objects usually.
            // Assuming push_subscriptions is one-to-many from user.
            // The join result structure: { user_id: '...', push_subscriptions: { endpoint: ... } } if one-to-one?
            // Or { user_id: '...', push_subscriptions: [{ endpoint: ... }] } if one-to-many.

            // Supabase join syntax usually returns an array for one-to-many if inferred correctly.
            // Let's iterate safely.

            const subs = Array.isArray(member.push_subscriptions)
                ? member.push_subscriptions
                : [member.push_subscriptions]

            for (const sub of subs) {
                const pushPayload = JSON.stringify({
                    title: roomName,
                    body: `${senderName}: ${content}`,
                    url: `/rooms/${roomId}`,
                    icon: '/icon-192x192.png',
                    tag: roomId
                })

                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }

                notifications.push(
                    webpush.sendNotification(pushSubscription, pushPayload)
                        .catch(err => {
                            console.error('Failed to send to', sub.endpoint, err)
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                // Subscription gone, remove from DB
                                supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint).then()
                            }
                        })
                )
            }
        }

        await Promise.all(notifications)

        return new Response(JSON.stringify({ message: `Sent ${notifications.length} notifications` }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
