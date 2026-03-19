// apps/backend/server.js
import express from "express";
import basicAuth from "basic-auth";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import cors from "cors";
// Load backend-local .env file
import dotenv from "dotenv";
dotenv.config();

process.on("SIGTERM", () => {
  console.log("[Signal] SIGTERM received at", new Date().toISOString());
});

process.on("SIGINT", () => {
  console.log("[Signal] SIGINT received at", new Date().toISOString());
});

process.on("unhandledRejection", (err) => {
  console.error("[UNHANDLED REJECTION]", err);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

// ---- Helper: canonicalize group labels ----
function canonicalizeGroupLabel(label) {
  if (!label) return null;
  return label.trim().toLowerCase();
}

// ---- Helper: get or create valid invite token (Phase 1.5) ----
async function getOrCreateInviteToken(guest) {
  // Look for most recent UNUSED token (ignore expiry for now)
  const { data: existing } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("guest_id", guest.id)
    .is("used_at", null) // STRUCTURAL LOCK: Only unused tokens can be reused
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const now = new Date();
    const expiry = new Date(existing.expires_at);

    // If it's expired, structurally "revive" it by updating the timestamp
    // This keeps the URL in their inbox the same.
    if (expiry <= now) {
      const newExpiresAt = new Date(Date.now() + RSVP_WINDOW_MS).toISOString();
      const { data: updated } = await supabase
        .from("invite_tokens")
        .update({ expires_at: newExpiresAt })
        .eq("id", existing.id)
        .select()
        .single();
      
      return { tokenRow: updated, reused: true, revived: true };
    }

    // Otherwise, just reuse the existing valid token
    return { tokenRow: existing, reused: true, revived: false };
  }

  // Create new if none exist OR if all previous are already "used"
  const code = genCode(6);
  const token = uuidv4();
  const expires_at = new Date(Date.now() + RSVP_WINDOW_MS).toISOString();

  const { data: inserted } = await supabase
    .from("invite_tokens")
    .insert([{
      guest_id: guest.id,
      token,
      code,
      expires_at,
      provider: EMAIL_PROVIDER,
      delivery_status: "pending"
    }])
    .select()
    .single();

  return { tokenRow: inserted, reused: false, revived: false };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5174",        
      "http://localhost:3000",        
      "https://area51.cactusmakesperfect.org", 
      "https://www.cactusmakesperfect.org"     
    ],
    // Change to true to allow Authorization headers/cookies across origins
    credentials: true, 
    // Add "DELETE" and "PUT" to ensure all admin actions are permitted
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Handle OPTIONS preflight explicitly
app.options("*", cors());

/** PORT: set by hosting platform (Railway, Render, etc.) */
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

/** PUBLIC_URL: used when composing invite links */
const PUBLIC_URL = process.env.PUBLIC_URL || "https://www.cactusmakesperfect.org";

/** RSVP window (days): used to compute invite_tokens.expires_at */
const RSVP_WINDOW_DAYS = Number(process.env.RSVP_WINDOW_DAYS || 14);
const RSVP_WINDOW_MS = RSVP_WINDOW_DAYS * 24 * 60 * 60 * 1000;

app.use(express.json());
/**---------Deprecated: use separate admin app---------
// ---- Basic auth for everything (keep while private) ----
const auth = (req, res, next) => {
  const creds = basicAuth(req);
  const user = process.env.BASIC_AUTH_USER || "guest";
  const pass = process.env.BASIC_AUTH_PASS || "secretpass";
  if (!creds || creds.name !== user || creds.pass !== pass) {
    res.set("WWW-Authenticate", 'Basic realm="Protected"');
    return res.status(401).send("Authentication required.");
  }
  next();
};
app.use((req, res, next) => {
  if (req.path.startsWith("/api/v1/admin")) {
    return next();
  }
  return auth(req, res, next);
});*/

// ---- Supabase ----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---- JWT ----
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const JWT_TTL_SECONDS = parseInt(process.env.JWT_TTL_SECONDS || "172800", 10);

// ---- Email providers ----
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "mailgun").toLowerCase();
const DEV_SKIP_EMAIL = process.env.DEV_SKIP_EMAIL === "true";
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 7000);
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

const mailtrapTransport = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
  port: Number(process.env.MAILTRAP_PORT || 2525),
  auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 5000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 5000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 7000),
  tls: { rejectUnauthorized: false }
});

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.FROM_EMAIL || "noreply@cactusmakesperfect.org";
  const provider = EMAIL_PROVIDER;

  // DEV short-circuit
  if (DEV_SKIP_EMAIL) {
    console.log(`[Email] DEV_SKIP_EMAIL=true, skipping send → to=${to}, subject="${subject}"`);
    return;
  }

  // Helper: hard timeout wrapper
  const withHardTimeout = (promise, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`HARD_TIMEOUT_${label}_${EMAIL_SEND_TIMEOUT_MS}ms`)), EMAIL_SEND_TIMEOUT_MS)
      ),
    ]);

  // Common preflight debug
  console.log("[Email] send start", {
    provider,
    from,
    to,
    subjLen: subject ? subject.length : 0,
    textLen: text ? text.length : 0,
    htmlLen: html ? html.length : 0,
  });

  const t0 = Date.now();
  try {
    if (provider === "mailgun") {
      if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        console.error("[Email] No MAILGUN_API_KEY or MAILGUN_DOMAIN set");
        return;
      }
      const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
      console.log("[Email] Sending via Mailgun API", { url, to });
      const formData = new URLSearchParams();
      formData.append("from", from);
      formData.append("to", to);
      formData.append("subject", subject);
      if (text) formData.append("text", text);
      if (html) formData.append("html", html);
      const authHeader = "Basic " + Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
      const data = await resp.json().catch(() => ({}));
      console.log("[Email] Mailgun API response", { status: resp.status, id: data.id, message: data.message });
      if (!resp.ok) throw new Error(`Mailgun API send failed: ${resp.status}`);
      // --- Supabase logging for Mailgun success ---
      // Attempt to fetch guest by email for logging
      let guest = null;
      try {
        const { data: g } = await supabase.from("guests").select("*").eq("email", to).single();
        guest = g;
      } catch {}
      await supabase.from("emails_log").insert([{
        guest_id: guest?.id || null,
        type: "invite",
        subject,
        provider,
        status: "sent",
        sent_at: new Date().toISOString(),
        meta: { to }
      }]);
      console.log("[Email] Logged email to emails_log");
    } else if (provider === "mailtrap_api") {
      const token = process.env.MAILTRAP_API_TOKEN;
      if (!token) {
        console.error("[Email] No MAILTRAP_API_TOKEN set");
        return;
      }
      const inboxId = process.env.MAILTRAP_INBOX_ID; // e.g. 4063326
      const url = `https://sandbox.api.mailtrap.io/api/send/${inboxId}`;
      console.log("[Email] Sending via Mailtrap API", { url, to });
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: { email: from, name: "CMP Test" },
          to: [{ email: to }],
          subject,
          text,
          html,
          category: "CMP Integration Test",
        }),
      });
      const data = await resp.json().catch(() => ({}));
      console.log("[Email] Mailtrap API response", { status: resp.status, data });
      if (!resp.ok) throw new Error(`Mailtrap API send failed: ${resp.status}`);
    } else {
      // Nodemailer (SMTP / Mailtrap by default)
      console.log("[Email] SMTP transport config", {
        host: mailtrapTransport.options?.host,
        port: mailtrapTransport.options?.port,
        user: (process.env.MAILTRAP_USER || "").slice(0, 4) + "…",
        connectionTimeout: mailtrapTransport.options?.connectionTimeout,
        greetingTimeout: mailtrapTransport.options?.greetingTimeout,
        socketTimeout: mailtrapTransport.options?.socketTimeout,
      });

      const info = await withHardTimeout(
        mailtrapTransport.sendMail({ from, to, subject, html, text }),
        "smtp"
      );

      console.log("[Email] SMTP send result", {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
        response: info?.response,
      });
    }

    console.log(`[Email] sent ok in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error("[Email] SEND FAILED", {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      // SendGrid puts helpful details under response.body; Nodemailer under response too sometimes
      response: err?.response?.body || err?.response || null,
    });
    throw err;
  }
}

// =====================================================
// INVITES (ADMIN CANONICAL ROUTE)
// =====================================================
//
// This route replaces BOTH the old /invites/send and /invites/resend.
// Phase 1.5+ will add server-side “reuse valid token” logic here.
// For now: always generates a new token, sends it, logs activity.
//
// Expect body:
//   { guest_id: "<uuid>", template?: "default" | "friendly" }
//
// NOTE: This route is protected by requireAdminAuth automatically because
// it's mounted under /api/v1/admin and you already have:
//   app.use("/api/v1/admin", requireAdminAuth);

let lastToken = null;

app.post("/api/v1/admin/invites/send", async (req, res) => {
  try {
    const { guest_id, template } = req.body || {};
    if (!guest_id) {
      return res.status(400).json({ error: "Missing guest_id" });
    }

    // 1. Load guest
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guest_id)
      .single();

    if (gErr || !guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    // 2. Get or reuse invite token (Phase 1.5 core)
    const { tokenRow, reused } = await getOrCreateInviteToken(guest);

    const { token, code, expires_at } = tokenRow;

    const inviteUrl = `${PUBLIC_URL}/invite?token=${encodeURIComponent(token)}`;
    const subject = "🌵 PROJECT: CACTUS MAKES PERFECT (Operation: 20 Year Dare) 🌵";

    // --- 3. Template rendering (HARDENED: Table Shell + Gradient Hack) ---

    // Format expires_at for email templates
    const expiresDate = new Date(expires_at);
    const formattedExpires = expiresDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // HARDENED + DEEP GRADIENT HACK TEMPLATE
    let html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #000000 !important; }
    
    /* THE HACK: Apply this class to ANYTHING that must stay black/dark */
    .force-black-bg {
      background-color: #000000 !important;
      background-image: linear-gradient(#000000, #000000) !important;
    }
    .force-card-bg {
      background-color: #0a0a0a !important;
      background-image: linear-gradient(#0a0a0a, #0a0a0a) !important;
    }
  </style>
</head>
<body class="force-black-bg" style="margin: 0; padding: 0; background-color: #000000; background-image: linear-gradient(#000000, #000000); color: #45CC2D; font-family: 'Courier New', Courier, monospace;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="force-black-bg" style="background-color: #000000; background-image: linear-gradient(#000000, #000000); width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" class="force-card-bg" style="max-width: 600px; width: 100%; background-color: #0a0a0a; background-image: linear-gradient(#0a0a0a, #0a0a0a); border: 2px solid #45CC2D; text-align: left;" role="presentation">
          
          <tr>
            <td bgcolor="#45CC2D" style="background-color: #45CC2D; color: #000000; padding: 10px 20px; font-weight: bold; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">
              /// INCOMING TRANSMISSION ///
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.6; color: #45CC2D;">
              
              <p style="margin: 0 0 16px 0; font-weight: bold; color: #45CC2D;">
                IN THE YEAR 2006, CONTACT WAS MADE.<br/>
                TWO TRAJECTORIES ALIGNED.
              </p>

              <p style="margin: 0 0 16px 0; color: #45CC2D;"><strong>EARTH DWELLERS.</strong></p>
              
              <p style="margin: 0 0 16px 0; color: #45CC2D;">
                It would be our greatest pleasure if you would join us to witness this next phase of our evolution.
              </p>
              
              <p style="margin: 0 0 16px 0; color: #45CC2D;">
                The link below is your portal to the next galaxy. 
                Activate the link, input your clearance code, and press "=" to proceed.
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;" role="presentation">
                <tr>
                  <td align="center" style="border: 1px dashed #45CC2D; background-color: #000000; background-image: linear-gradient(#000000, #000000); padding: 15px; color: #45CC2D; font-weight: bold; font-size: 18px; letter-spacing: 3px; font-family: 'Courier New', Courier, monospace;">
                    CODE: ${code}
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #45CC2D;">
                <strong>DIRECTIVE:</strong> Confirm your coordinates by ${formattedExpires}. 
                Precise data is required for resource allocation and system calibration.
              </p>

              <p style="margin: 30px 0 0 0; color: #45CC2D;">
                Awaiting your signal.
              </p>
              
              <p style="margin: 10px 0 0 0; color: #45CC2D;">
                BIG LOVE,<br/>
                S&G
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="background-color: #45CC2D; color: #000000; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 14px; border: 1px solid #45CC2D; display: inline-block; font-family: 'Courier New', Courier, monospace;">
                      ACTIVATE PORTAL
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          
          <tr>
            <td style="border-top: 1px solid #45CC2D; padding: 10px 20px; font-size: 10px; text-transform: uppercase; color: #45CC2D; opacity: 0.7; font-family: 'Courier New', Courier, monospace;">
              SECURE LINE: ENCRYPTED // ID: ${guest_id.split('-')[0]}<br/>
              EYES ONLY. DO NOT REPLY.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text fallback
    let text = `
IN THE YEAR 2006, CONTACT WAS MADE.
TWO TRAJECTORIES ALIGNED.

EARTH DWELLERS.

It would be our greatest pleasure if you would join us to witness this next phase of our evolution.

The link below is your portal to the next galaxy. 
Activate the link, input your clearance code, and press "=" to proceed.

YOUR CODE: ${code}
PORTAL LINK: ${inviteUrl}

DIRECTIVE: Confirm your coordinates by ${formattedExpires}. 
Precise data is required for resource allocation and system calibration.

Awaiting your signal.

BIG LOVE,
S&G
    `.trim();

    // 4. Send email
    await sendEmail({
      to: guest.email,
      subject,
      html,
      text,
    });

    // 5. Mark token as sent (idempotent-safe)
    await supabase
      .from("invite_tokens")
      .update({
        provider: EMAIL_PROVIDER,
        delivery_status: "sent",
      })
      .eq("id", tokenRow.id);

    // 6. Set invited_at if first invite
    if (!guest.invited_at) {
      await supabase
        .from("guests")
        .update({ invited_at: new Date().toISOString() })
        .eq("id", guest.id);
    }

    // 7. Log normalized activity
    await supabase.from("user_activity").insert([
      {
        guest_id: guest.id,
        kind: reused ? "invite_resent" : "invite_sent",
        meta: {
          email: guest.email,
          template: template || "default",
          reused_token: reused,
          expires_at,
        },
      },
    ]);

    return res.json({
      ok: true,
      reused,
      expires_at,
    });

  } catch (e) {
    console.error("[AdminInviteSend] error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// DEPRECATED: Invite resend is now handled by POST /api/v1/admin/invites/send (Phase 1.5)
/*
// ---- API: resend invite ----
app.post("/api/v1/admin/invites/resend", requireAdminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("*")
      .eq("email", email)
      .single();

    if (gErr || !guest) {
      console.warn(`Invite resend requested for unknown email: ${email}`);
      await supabase.from("user_activity").insert([{ kind: "invite_resend_failed", meta: { email } }]);
      return res.json({ ok: true });
    }

    const code = genCode(6);
    const token = uuidv4();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

    await supabase.from("invite_tokens").insert([{ guest_id: guest.id, token, code, expires_at }]);

    const inviteUrl = `${PUBLIC_URL}/invite?token=${encodeURIComponent(token)}`;
    const subject = "You're Invited! 🌵";
    const html = `<p>Hello ${guest.first_name || ""},</p>
      <p>Your entry code: <b>${code}</b></p>
      <p>Or click to continue: <a href="${inviteUrl}">${inviteUrl}</a></p>`;
    const text = `Hello ${guest.first_name || ""}\nCode: ${code}\nLink: ${inviteUrl}`;

    await sendEmail({ to: email, subject, html, text });

    await supabase.from("user_activity").insert([{ guest_id: guest.id, kind: "invite_resent", meta: { email } }]);

    res.json({ ok: true });
  } catch (e) {
    console.error("invite resend error", e);
    res.status(500).json({ error: "Internal error" });
  }
});
*/

// ---- API: verify ----
app.post("/api/v1/auth/verify", async (req, res) => {
  try {
    const { token, code } = req.body || {};
    if (!token || !code) return res.status(400).json({ error: "Missing fields" });

    const { data: rows, error } = await supabase
      .from("invite_tokens")
      .select("*, guest:guest_id(*)")
      .eq("token", token)
      .eq("code", code)
      .limit(1);

    if (error || !rows?.length) return res.status(401).json({ error: "Invalid code or token" });

    const invite = rows[0];
    
    // STRUCTURAL CHECK 1: Is it already used?
    if (invite.used_at) {
      return res.status(403).json({ 
        error: "Link already used", 
        message: "This portal link has already been activated. Please check your latest device session or request a fresh link." 
      });
    }

    // STRUCTURAL CHECK 2: Is it expired?
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ 
        error: "Link expired", 
        message: "This portal link has expired. Please contact S&G to reactivate your coordinates." 
      });
    }

    // SUCCESS: Mark as used and proceed
    await supabase
      .from("invite_tokens")
      .update({ 
        delivery_status: "responded",
        used_at: new Date().toISOString() // LOCK THE TOKEN
      })
      .eq("token", token);

    const jwt = await issueJWT({ guest_id: invite.guest.id, email: invite.guest.email });
    await supabase.from("user_activity").insert([{ guest_id: invite.guest.id, kind: "auth_success" }]);

    res.json({ token: jwt, guest_id: invite.guest.id });
  } catch (e) {
    console.error("verify error", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: RSVP (create or update) ----
app.post("/api/v1/rsvps/me", async (req, res) => {
  try {
    const { guest_id, status } = req.body || {};
    if (!guest_id || !status) return res.status(400).json({ error: "Missing guest_id or status" });

    console.log("[RSVP] Upsert received", { guest_id, status });

    // Upsert on guest_id so a second submission updates the existing row.
    const { data, error } = await supabase
      .from("rsvps")
      .upsert(
        [
          {
            guest_id,
            status,
            submitted_at: new Date().toISOString(), // your schema column
          },
        ],
        { onConflict: "guest_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[RSVP] Upsert failed", error);
      return res.status(422).json({ error: "Supabase upsert failed", details: error });
    }

    await supabase
      .from("user_activity")
      .insert([{ guest_id, kind: "rsvp_submitted", meta: { status } }]);

    console.log("[RSVP] Upsert success", data);
    return res.json({ ok: true, rsvp: data });
  } catch (e) {
    console.error("[RSVP] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: Get my RSVP ----
app.get("/api/v1/rsvps/me/:guest_id", async (req, res) => {
  try {
    const { guest_id } = req.params;
    if (!guest_id) return res.status(400).json({ error: "Missing guest_id" });

    // Fetch latest RSVP
    const { data, error } = await supabase
      .from("rsvps")
      .select("guest_id,status,submitted_at")
      .eq("guest_id", guest_id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[RSVP] Fetch failed", error);
      return res.status(422).json({ error: "Supabase fetch failed", details: error });
    }

    // Fetch latest active invite token for this guest (unused, not expired)
    const { data: inviteRow, error: inviteErr } = await supabase
      .from("invite_tokens")
      .select("expires_at")
      .eq("guest_id", guest_id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If inviteRow exists, extract expires_at
    return res.json({
      rsvp: data || null,
      invite: inviteRow ? { expires_at: inviteRow.expires_at } : null,
    });
  } catch (e) {
    console.error("[RSVP] Unexpected fetch error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: Nudge emails ----
app.post("/api/v1/emails/nudge", async (req, res) => {
  try {
    const { guest_ids, subject, html, text } = req.body;
    console.log("[Nudge] Received payload", { count: guest_ids?.length, subject });
    if (!Array.isArray(guest_ids) || guest_ids.length === 0)
      return res.status(400).json({ error: "guest_ids must be a non-empty array" });
    for (const id of guest_ids) {
      const { data: guest } = await supabase.from("guests").select("*").eq("id", id).single();
      if (!guest) continue;
      console.log(`[Nudge] Sending email to ${guest.email} (${guest.id})`);
      await sendEmail({ to: guest.email, subject, html, text });
      await supabase.from("emails_log").insert([{
        guest_id: guest.id,
        type: "nudge",
        subject,
        provider: EMAIL_PROVIDER,
        status: "sent",
        sent_at: new Date().toISOString(),
        meta: { to: guest.email }
      }]);
      console.log(`[Nudge] Sent to ${guest.email} via provider=${EMAIL_PROVIDER}`);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("emails/nudge error", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ---- Middleware: requireAdminAuth ----
async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing admin token" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { payload } = await import("jose").then(j =>
      j.jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    );

    if (!payload || payload.admin !== true) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.admin = payload; // attach decoded payload
    next();
  } catch (e) {
    console.error("[requireAdminAuth] Failed verification", e);
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}

// NOTE: Ensure Supabase view `admin_guests_view` is created separately.
// This backend expects a consolidated view for admin dashboard queries.

// ---- API: Admin Login ----
app.post("/api/v1/admin/login", async (req, res) => {
  try {
    const { password } = req.body || {};
    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    if (!ADMIN_SECRET) {
      console.error("[AdminLogin] Missing ADMIN_SECRET env var");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    if (password !== ADMIN_SECRET) {
      console.warn("[AdminLogin] Incorrect admin password attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Issue admin JWT
    const adminJwt = await issueJWT({ admin: true });

    console.log("[AdminLogin] Success — admin JWT issued");
    return res.json({ token: adminJwt });
  } catch (e) {
    console.error("[AdminLogin] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: Admin Verify ----
app.get("/api/v1/admin/verify", requireAdminAuth, (req, res) => {
  return res.json({ ok: true });
});

// ---- Protect all subsequent admin routes ----
app.use("/api/v1/admin", requireAdminAuth);

// ---- Admin: GET full guest list with filters ----
app.get("/api/v1/admin/guests", requireAdminAuth, async (req, res) => {
  try {
    const { rsvp, invited, search } = req.query;

    // Use the newly created view
    let query = supabase.from("admin_guests_view").select("*");

    if (invited === "yes") query = query.not("invited_at", "is", null);
    if (invited === "no") query = query.is("invited_at", null);

    // Use the alias 'rsvp_status' from the view
    if (rsvp) query = query.eq("rsvp_status", rsvp);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // Sort by the new alias name or invited_at
    const { data, error } = await query.order("invited_at", { ascending: false });
    
    if (error) {
      console.error("[AdminGuests] Query failed:", error);
      return res.status(422).json({ error: "Query failed", details: error });
    }

    return res.json({ guests: data || [] });
  } catch (e) {
    console.error("[AdminGuests] Server error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Admin: GET guest detail ----
app.get("/api/v1/admin/guest/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing guest id" });

    // Fetch guest record
    const { data: guest, error: guestErr } = await supabase
      .from("guests")
      .select("*")
      .eq("id", id)
      .single();

    if (guestErr || !guest) {
      console.error("[AdminGuestDetail] Guest lookup failed", guestErr);
      return res.status(404).json({ error: "Guest not found" });
    }

    // Latest RSVP
    const { data: rsvp } = await supabase
      .from("rsvps")
      .select("*")
      .eq("guest_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Invite tokens history
    const { data: tokens } = await supabase
      .from("invite_tokens")
      .select("*")
      .eq("guest_id", id)
      .order("created_at", { ascending: false });

    // Emails sent to this guest
    const { data: emails } = await supabase
      .from("emails_log")
      .select("*")
      .eq("guest_id", id)
      .order("sent_at", { ascending: false });

    // Activity log
    const { data: activity } = await supabase
      .from("user_activity")
      .select("*")
      .eq("guest_id", id)
      .order("created_at", { ascending: false });

    return res.json({
      guest,
      rsvp: rsvp || null,
      tokens: tokens || [],
      emails: emails || [],
      activity: activity || []
    });

  } catch (e) {
    console.error("[AdminGuestDetail] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Admin: GET guest activity (normalized) ----
// apps/backend/server.js

// ---- Admin: GET guest activity (normalized) ----
app.get("/api/v1/admin/guest/:id/activity", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing guest id" });

    const rawEvents = [];

    // 1. User Activity (The Real Log)
    const { data: ua } = await supabase
      .from("user_activity")
      .select("*")
      .eq("guest_id", id);

    for (const row of ua || []) {
      let kind = row.kind;
      // Normalize semantics
      if (kind === "rsvp_submitted") kind = "rsvp_created";
      if (kind === "invite_resent" || kind === "admin_invite_resent") kind = "invite_sent";
      if (kind === "auth_success") kind = "invite_used";

      rawEvents.push({
        kind,
        occurred_at: row.created_at,
        meta: row.meta || null
      });
    }

    // 2. Emails Log (Telemetry)
    const { data: emails } = await supabase
      .from("emails_log")
      .select("*")
      .eq("guest_id", id);

    for (const row of emails || []) {
      rawEvents.push({
        kind: "email_sent",
        occurred_at: row.sent_at || row.created_at,
        meta: {
          subject: row.subject,
          type: row.type,
          provider: row.provider
        }
      });
    }

    // 3. Sort Newest -> Oldest
    rawEvents.sort(
      (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );

    // 4. Deduplicate (The Fix)
    // We filter out events that look identical to the previous one within a 2-second window.
    // This catches "Double Clicks" (RSVP) and "Ghosts" (Legacy Invite Token reads).
    const normalized = rawEvents.filter((item, index) => {
      if (index === 0) return true; // Always keep the newest
      const prev = rawEvents[index - 1];

      const sameKind = item.kind === prev.kind;
      const timeDiff = Math.abs(new Date(item.occurred_at).getTime() - new Date(prev.occurred_at).getTime());

      // If it's the same action within 2 seconds, assume it's a duplicate/ghost and drop it
      if (sameKind && timeDiff < 2000) {
        return false;
      }
      return true;
    });

    return res.json({ activity: normalized });
  } catch (e) {
    console.error("[AdminNormalizedActivity] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Admin: CREATE guest ----
app.post("/api/v1/admin/guests/create", requireAdminAuth, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      group_label,
      auto_invite = false, // future-safe
    } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const canonGroup = canonicalizeGroupLabel(group_label);

    // 1. Check for existing guest
    const { data: existing } = await supabase
      .from("guests")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: "Guest already exists",
        guest_id: existing.id,
      });
    }

    // 2. Insert guest
    const { data: guest, error } = await supabase
      .from("guests")
      .insert([
        {
          first_name: first_name || null,
          last_name: last_name || null,
          email: normalizedEmail,
          group_label: canonGroup,
        },
      ])
      .select()
      .single();

    if (error || !guest) {
      console.error("[AdminGuestCreate] Insert failed", error);
      return res.status(422).json({ error: "Failed to create guest" });
    }

    // 3. Activity log
    await supabase.from("user_activity").insert([
      {
        guest_id: guest.id,
        kind: "guest_created",
        meta: {
          email: normalizedEmail,
          group_label: canonGroup,
          admin: req.admin,
        },
      },
    ]);

    // 4. Optional auto-invite (Phase 2 ready, but OFF by default)
    if (auto_invite === true) {
      try {
        await fetch(`${process.env.INTERNAL_API_URL || "http://localhost:3000"}/api/v1/admin/invites/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
          body: JSON.stringify({ guest_id: guest.id }),
        });
      } catch (e) {
        console.warn("[AdminGuestCreate] Auto-invite failed", e);
      }
    }

    return res.json({
      ok: true,
      guest,
    });
  } catch (e) {
    console.error("[AdminGuestCreate] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Admin: Resend Invite ----
app.post("/api/v1/admin/resend", requireAdminAuth, async (req, res) => {
  try {
    const { guest_id } = req.body || {};
    if (!guest_id) return res.status(400).json({ error: "Missing guest_id" });

    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guest_id)
      .single();

    if (gErr || !guest) {
      console.warn(`[AdminResend] Guest not found for id=${guest_id}`);
      return res.status(404).json({ error: "Guest not found" });
    }

    const code = genCode(6);
    const token = uuidv4();
    const expires_at = new Date(Date.now() + RSVP_WINDOW_MS).toISOString();

    await supabase.from("invite_tokens").insert([
      { guest_id, token, code, expires_at, provider: EMAIL_PROVIDER, delivery_status: "pending" }
    ]);

    const inviteUrl = `${PUBLIC_URL}/invite?token=${encodeURIComponent(token)}`;
    const subject = "You're Invited! 🌵 (Resent)";
    const html = `<p>Hello ${guest.first_name || ""},</p>
      <p>Your entry code: <b>${code}</b></p>
      <p>Or click to continue: <a href="${inviteUrl}">${inviteUrl}</a></p>`;
    const text = `Hello ${guest.first_name || ""}\nCode: ${code}\nLink: ${inviteUrl}`;

    await sendEmail({ to: guest.email, subject, html, text });

    await supabase.from("invite_tokens")
      .update({ delivery_status: "sent", provider: EMAIL_PROVIDER })
      .eq("token", token);

    await supabase.from("user_activity").insert([
      { guest_id, kind: "admin_invite_resent", meta: { email: guest.email } }
    ]);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[AdminResend] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Admin: PATCH guest/:id/group ----
app.patch("/api/v1/admin/guest/:id/group", requireAdminAuth, async (req, res) => {
  const guestId = req.params.id;
  const { group_label } = req.body || {};
  try {
    const canonLabel = canonicalizeGroupLabel(group_label);
    const { error } = await supabase
      .from("guests")
      .update({ group_label: canonLabel })
      .eq("id", guestId);
    if (error) throw error;
    await supabase.from("user_activity").insert([
      { guest_id: guestId, kind: "group_update", meta: { group_label: canonLabel } }
    ]);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[AdminGroupUpdate] Failed", e);
    return res.status(500).json({ error: "Failed to update group" });
  }
});

// ---- Admin: PATCH group/bulk ----
app.patch("/api/v1/admin/group/bulk", requireAdminAuth, async (req, res) => {
  const { guest_ids, group_label } = req.body || {};
  if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
    return res.status(400).json({ error: "guest_ids must be non-empty array" });
  }
  try {
    const canonLabel = canonicalizeGroupLabel(group_label);
    const { error } = await supabase
      .from("guests")
      .update({ group_label: canonLabel })
      .in("id", guest_ids);
    if (error) throw error;
    for (const gid of guest_ids) {
      await supabase.from("user_activity").insert([
        { guest_id: gid, kind: "group_update_bulk", meta: { group_label: canonLabel } }
      ]);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error("[AdminGroupBulkUpdate] Failed", e);
    return res.status(500).json({ error: "Bulk group update failed" });
  }
});

// ---- Admin: GET groups ----
app.get("/api/v1/admin/groups", requireAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guests")
      .select("group_label")
      .not("group_label", "is", null);

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      const label = row.group_label;
      counts[label] = (counts[label] || 0) + 1;
    }

    const groups = Object.entries(counts).map(([group_label, member_count]) => ({
      group_label,
      member_count
    }));

    groups.sort((a, b) => a.group_label.localeCompare(b.group_label));
    return res.json({ groups });
  } catch (e) {
    console.error("[AdminGroups] Failed", e);
    return res.status(500).json({ error: "Failed to load groups" });
  }
});

// ---- Admin: POST groups/:group_label/nudge ----
app.post("/api/v1/admin/groups/:group_label/nudge", requireAdminAuth, async (req, res) => {
  const group_label = canonicalizeGroupLabel(req.params.group_label);
  const { subject, html, text } = req.body || {};
  if (!subject || !html || !text) {
    return res.status(400).json({ error: "subject, html, text required" });
  }
  try {
    const { data: guests, error } = await supabase
      .from("guests")
      .select("id,email")
      .eq("group_label", group_label);
    if (error) throw error;
    for (const g of guests) {
      await sendEmail({ to: g.email, subject, html, text });
      await supabase.from("emails_log").insert([
        {
          guest_id: g.id,
          type: "group_nudge",
          subject,
          provider: EMAIL_PROVIDER,
          status: "sent",
          sent_at: new Date().toISOString(),
          meta: { group_label, to: g.email }
        }
      ]);
      await supabase.from("user_activity").insert([
        { guest_id: g.id, kind: "group_nudge_sent", meta: { group_label } }
      ]);
    }
    return res.json({ ok: true, count: guests.length });
  } catch (e) {
    console.error("[AdminGroupNudge] Failed", e);
    return res.status(500).json({ error: "Failed to send group nudge" });
  }
});

// ---- Admin: Nudge guests (bulk) — ACTUAL IMPLEMENTATION ----
app.post("/api/v1/admin/guests/nudge", requireAdminAuth, async (req, res) => {
  try {
    const { guest_ids, subject, html, text } = req.body || {};
    console.log("[AdminNudge] Payload received", { count: guest_ids?.length });

    if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
      return res.status(400).json({ error: "guest_ids must be a non-empty array" });
    }
    if (!subject || !html) {
      return res.status(400).json({ error: "Missing subject or html" });
    }

    const results = [];

    for (const id of guest_ids) {
      const { data: guest, error: gErr } = await supabase
        .from("guests")
        .select("*")
        .eq("id", id)
        .single();

      if (gErr || !guest) {
        results.push({ id, status: "guest_not_found" });
        continue;
      }

      await sendEmail({ to: guest.email, subject, html, text });
      await supabase.from("emails_log").insert([{
        guest_id: guest.id,
        type: "admin_nudge",
        subject,
        provider: EMAIL_PROVIDER,
        status: "sent",
        sent_at: new Date().toISOString(),
        meta: { to: guest.email, admin: req.admin }
      }]);

      await supabase.from("user_activity").insert([{
        guest_id: guest.id,
        kind: "admin_nudge_sent",
        meta: { subject }
      }]);

      results.push({ id, status: "sent" });
    }

    return res.json({ ok: true, results });
  } catch (e) {
    console.error("[AdminNudge] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// ---- Admin: Manual RSVP Override ----
app.post("/api/v1/admin/guest/:id/rsvp-override", requireAdminAuth, async (req, res) => {
  try {
    const guest_id = req.params.id;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: "Missing status" });

    // Upsert the RSVP status
    const { data, error } = await supabase
      .from("rsvps")
      .upsert(
        [{ 
          guest_id, 
          status, 
          submitted_at: new Date().toISOString() 
        }],
        { onConflict: "guest_id" }
      )
      .select()
      .single();

    if (error) throw error;

    // Log the override in user_activity
    await supabase.from("user_activity").insert([{
      guest_id,
      kind: "rsvp_submitted", // Matches timeline mapping for "RSVP Created"
      meta: { 
        response: status, 
        source: "admin_override",
        admin_id: req.admin?.id 
      }
    }]);

    return res.json({ ok: true, rsvp: data });
  } catch (e) {
    console.error("[AdminRSVPOverride] Error:", e);
    return res.status(500).json({ error: "Override failed" });
  }
});

// ---- Admin: PATCH update guest's active invite token expiry ----
app.patch("/api/v1/admin/guest/:id/invite-token", requireAdminAuth, async (req, res) => {
  try {
    const { id: guest_id } = req.params;
    const { expires_at } = req.body;

    if (!expires_at) return res.status(400).json({ error: "Missing expires_at" });

    // Update the most recent unused, non-expired token for this guest
    const { data, error } = await supabase
      .from("invite_tokens")
      .update({ expires_at })
      .eq("guest_id", guest_id)
      .is("used_at", null)
      .select()
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No active token found to update" });
    }

    return res.json({ ok: true, token: data[0] });
  } catch (e) {
    console.error("[AdminTokenUpdate] Error:", e);
    return res.status(500).json({ error: "Failed to update token expiry" });
  }
});

// ---- Admin: GET all lodging locations with units and assigned guests ----
app.get("/api/v1/admin/lodging", requireAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("lodging_locations")
      .select(`
        *,
        units:lodging_units(
          *,
          guests:guests(id, first_name, last_name, email, rsvps(status))
        )
      `);

    if (error) throw error;
    return res.json({ locations: data || [] });
  } catch (e) {
    console.error("[AdminLodgingFetch] Error:", e);
    return res.status(500).json({ error: "Failed to fetch lodging data" });
  }
});

// ---- Admin: POST create location (Hydrate logic placeholder) ----
app.post("/api/v1/admin/lodging/locations", requireAdminAuth, async (req, res) => {
  try {
    const { name, address, google_maps_url } = req.body;
    const { data, error } = await supabase
      .from("lodging_locations")
      .insert([{ name, address, google_maps_url }])
      .select()
      .single();

    if (error) throw error;
    return res.json({ ok: true, location: data });
  } catch (e) {
    return res.status(500).json({ error: "Failed to create location" });
  }
});

// ---- Admin: PATCH assign guests to unit (DEPLOY) ----
app.patch("/api/v1/admin/lodging/assign", requireAdminAuth, async (req, res) => {
  try {
    const { guest_ids, unit_id } = req.body; // unit_id can be null to unassign
    const { error } = await supabase
      .from("guests")
      .update({ lodging_unit_id: unit_id })
      .in("id", guest_ids);

    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Deployment failed" });
  }
});

// ---- Admin: Hydrate Location from Google Maps URL ----
app.post("/api/v1/admin/lodging/hydrate", requireAdminAuth, async (req, res) => {
  try {
    const { url: sourceUrl } = req.body;
    const isPreview = req.query.preview === 'true'; // Check if this is just a preview scan
    const API_KEY = process.env.MAPS_API_KEY;

    if (!sourceUrl) return res.status(400).json({ error: "URL is required" });

    let url = sourceUrl;
    console.log(`[LodgingHydrate] ${isPreview ? 'PREVIEW' : 'EXECUTE'} - Source:`, url);

    // 1. Resolve Shortened / Redirect URLs
    if (url.includes("goo.gl") || url.includes("maps.app.goo.gl") || url.includes("googleusercontent.com/maps.google.com")) {
      console.log("[LodgingHydrate] Resolving shortened link...");
      const headResp = await fetch(url, { method: 'GET', redirect: 'follow' });
      url = headResp.url;
      console.log("[LodgingHydrate] Resolved to:", url);
    }

    // 2. Intelligence Gathering: Extract Search Terms
    const nameMatch = url.match(/\/place\/([^/]+)\//);
    const placeIdMatch = url.match(/place_id=([^&/]+)/);
    
    const query = placeIdMatch 
      ? placeIdMatch[1] 
      : (nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, ' ') : url);

    console.log("[LodgingHydrate] Searching for:", query);

    // 3. Convert Query/Slug into Alphanumeric Place ID
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${API_KEY}`;
    const findResp = await fetch(findUrl);
    const findData = await findResp.json();

    if (findData.status !== "OK" || !findData.candidates?.[0]?.place_id) {
      console.error("[LodgingHydrate] FindPlace Failed:", findData);
      return res.status(400).json({ 
        error: `Google Status: ${findData.status}. Ensure you share a specific point of interest.` 
      });
    }

    const placeId = findData.candidates[0].place_id;

    // 4. Query Official Metadata
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,url&key=${API_KEY}`;
    const detailsResp = await fetch(detailsUrl);
    const detailsData = await detailsResp.json();

    if (detailsData.status !== "OK") {
      throw new Error(`Google API Detail Error: ${detailsData.status}`);
    }

    const { name, formatted_address, url: official_url } = detailsData.result;

    const locationData = {
      name,
      address: formatted_address,
      google_maps_url: official_url,
      place_id: placeId
    };

    // --- NEW PREVIEW LOGIC ---
    if (isPreview) {
      console.log("[LodgingHydrate] Returning preview data for validation");
      return res.json({ ok: true, location: locationData });
    }

    // 5. Final Execution: Save to Supabase
    const { data: location, error } = await supabase
      .from("lodging_locations")
      .insert([locationData])
      .select()
      .single();

    if (error) throw error;

    return res.json({ ok: true, location });
  } catch (e) {
    console.error("[LodgingHydrate] Failed:", e.message);
    return res.status(500).json({ error: e.message || "Hydration failed" });
  }
});

// NEW DELETE ROUTE (for manual correction)
app.delete("/api/v1/admin/lodging/locations/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Perform the deletion in Supabase
    const { error } = await supabase
      .from("lodging_locations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[LodgingDelete] Supabase error:", error);
      return res.status(422).json({ error: "Could not delete location", details: error });
    }

    console.log(`[LodgingDelete] Success: Location ${id} removed.`);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[LodgingDelete] Unexpected error:", e);
    return res.status(500).json({ error: "Internal server error during deletion" });
  }
});

// NEW: Admin PATCH location (for renaming or correcting addresses)
app.patch("/api/v1/admin/lodging/locations/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const { data, error } = await supabase
      .from("lodging_locations")
      .update({ name, address })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[LodgingUpdate] Supabase error:", error);
      return res.status(422).json({ error: "Update failed", details: error });
    }

    return res.json({ ok: true, location: data });
  } catch (e) {
    console.error("[LodgingUpdate] Unexpected error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Admin: POST create unit in a location ----
app.post("/api/v1/admin/lodging/units", requireAdminAuth, async (req, res) => {
  try {
    const { location_id, label, capacity } = req.body;
    if (!location_id || !label) return res.status(400).json({ error: "Missing fields" });

    const { data, error } = await supabase
      .from("lodging_units")
      .insert([{ location_id, label, capacity: capacity || 2 }])
      .select()
      .single();

    if (error) throw error;
    return res.json({ ok: true, unit: data });
  } catch (e) {
    return res.status(500).json({ error: "Failed to create unit" });
  }
});

// ---- Admin: PATCH update unit (label, capacity) ----
app.patch("/api/v1/admin/lodging/units/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, capacity } = req.body;

    const { data, error } = await supabase
      .from("lodging_units")
      .update({ label, capacity })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ ok: true, unit: data });
  } catch (e) {
    console.error("[AdminUnitUpdate] Error:", e);
    return res.status(500).json({ error: "Failed to update unit" });
  }
});

// ---- Admin: GET unassigned guests (eligible for lodging) ----
app.get("/api/v1/admin/lodging/eligible-guests", requireAdminAuth, async (req, res) => {
  try {
    // 1. Filter for guests with no lodging_unit_id assigned
    // 2. Look for positive RSVPs in the 'rsvp_status' field from our view
    const { data, error } = await supabase
      .from("admin_guests_view")
      .select("id, first_name, last_name, email, rsvp_status")
      .is("lodging_unit_id", null)
      .or('rsvp_status.ilike.yes,rsvp_status.ilike.maybe,rsvp_status.ilike.attending,rsvp_status.ilike.accepted');

    if (error) {
      console.error("[AdminEligibleGuests] Supabase query error:", error);
      return res.status(422).json({ error: "Query failed", details: error });
    }

    return res.json({ guests: data || [] });
  } catch (e) {
    console.error("[AdminEligibleGuests] Unexpected server error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Serve built frontend from /app/dist (we'll place it there in Docker) ----
const distDir = path.join(__dirname, "public");
app.use(express.static(distDir));
app.get("/health", (req, res) => res.json({ ok: true, at: new Date().toISOString() }));
app.use((req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port} (PUBLIC_URL=${PUBLIC_URL})`);
});
// ---- Helper: generate numeric code ----
const genCode = (len = 6) =>
  [...Array(len)].map(() => Math.floor(Math.random() * 10)).join("");

// ---- Helper: issue JWT ----
async function issueJWT(payload) {
  const alg = "HS256";
  // Ensure TTL is treated as a relative duration string (e.g., "172800s")
  const ttl = typeof JWT_TTL_SECONDS === "number" ? `${JWT_TTL_SECONDS}s` : String(JWT_TTL_SECONDS);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(new TextEncoder().encode(JWT_SECRET));
  return token;
}