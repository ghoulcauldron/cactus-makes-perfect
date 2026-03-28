// apps/backend/utils/ImapFetcher.js
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from "@supabase/supabase-js";

// Backend uses process.env (Server Side Only)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
        user: 'cactusmakesperfect51@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD // Generate this in Gmail Security settings
    }
});

export async function syncInbox() {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    try {
        for await (let message of client.listMessages({ seen: false })) {
            let { content } = await client.download(message.uid);
            let parsed = await simpleParser(content);

            // Filter for the Squarespace alias
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
            }
            await client.messageFlagsAdd(message.uid, ['\\Seen']);
        }
    } finally {
        lock.release();
        await client.logout();
    }
}