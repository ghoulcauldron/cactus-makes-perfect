import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function syncInbox() {
    // MOVE INITIALIZATION HERE: Create a fresh instance for every heartbeat
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: 'cactusmakesperfect51@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD 
        },
        logger: false // Set to true if you need deep protocol debugging
    });

    console.log("[IMAP] Attempting connection...");
    await client.connect();
    
    let lock = await client.getMailboxLock('INBOX');
    try {
        for await (let message of client.listMessages({ seen: false })) {
            let { content } = await client.download(message.uid);
            let parsed = await simpleParser(content);

            const isForAlias = parsed.to.text.toLowerCase().includes('eyesonly@cactusmakesperfect.org');

            if (isForAlias) {
                const fromEmail = parsed.from.value[0].address;
                const { data: guest } = await supabase.from("guests").select("id").eq("email", fromEmail).maybeSingle();

                await supabase.from("emails_log").insert([{
                    guest_id: guest?.id || null,
                    type: "inbound_comm",
                    subject: parsed.subject,
                    provider: "squarespace_relay",
                    status: "received",
                    sent_at: parsed.date,
                    meta: { body: parsed.text, from: fromEmail }
                }]);
                console.log(`[IMAP] Logged transmission from: ${fromEmail}`);
            }
            await client.messageFlagsAdd(message.uid, ['\\Seen']);
        }
    } finally {
        lock.release();
        await client.logout();
        console.log("[IMAP] Session closed.");
    }
}