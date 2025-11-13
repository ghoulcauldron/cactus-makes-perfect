// apps/backend/server.js
import express from "express";
import basicAuth from "basic-auth";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/** PORT: set by hosting platform (Railway, Render, etc.) */
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

/** PUBLIC_URL: used when composing invite links */
const PUBLIC_URL = process.env.PUBLIC_URL || "https://www.cactusmakesperfect.org";

app.use(express.json());

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
});

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

// ---- API: send invite ----
let lastToken = null;
app.post("/api/v1/invites/send", async (req, res) => {
  try {
    console.log("Received invite send request");
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("*")
      .eq("email", email)
      .single();
    if (gErr || !guest) return res.status(404).json({ error: "Guest not found" });
    console.log("Found guest:", guest);

    const code = genCode(6);
    const token = uuidv4();
    lastToken = token;
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

    await supabase.from("invite_tokens").insert([{
      guest_id: guest.id,
      token,
      code,
      expires_at,
      provider: EMAIL_PROVIDER,
      delivery_status: "pending"
    }]);
    console.log("Inserted invite token (with provider + pending status)");

    const inviteUrl = `${PUBLIC_URL}/invite?token=${encodeURIComponent(token)}`;
    const subject = "You're Invited! 🌵";
    const html = `<p>Hello ${guest.first_name || ""},</p>
      <p>Your entry code: <b>${code}</b></p>
      <p>Or click to continue: <a href="${inviteUrl}">${inviteUrl}</a></p>`;
    const text = `Hello ${guest.first_name || ""}\nCode: ${code}\nLink: ${inviteUrl}`;

    console.log("About to send email");
    await sendEmail({ to: email, subject, html, text });
    await supabase
      .from("invite_tokens")
      .update({
        provider: EMAIL_PROVIDER,
        delivery_status: "sent"
      })
      .eq("token", token);
    console.log("Email sent");

    await supabase.from("guests").update({ invited_at: new Date().toISOString() }).eq("id", guest.id);
    console.log("Updated guests.invited_at");

    await supabase.from("user_activity").insert([{ guest_id: guest.id, kind: "invite_sent", meta: { email } }]);
    console.log("Inserted user_activity");

    res.json({ ok: true });
    console.log("Responded with ok");
  } catch (e) {
    console.error("invite error", e);
    try {
      if (lastToken) {
        await supabase
          .from("invite_tokens")
          .update({
            provider: EMAIL_PROVIDER,
            delivery_status: "failed"
          })
          .eq("token", lastToken);
      }
    } catch (_) {
      // ignore errors here to not mask original error
    }
    res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: resend invite ----
app.post("/api/v1/invites/resend", async (req, res) => {
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
    if (!invite?.guest) return res.status(401).json({ error: "Invalid invite" });
    if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: "Code expired" });

    await supabase
      .from("invite_tokens")
      .update({ used_at: new Date().toISOString(), delivery_status: "responded" })
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

    return res.json({ rsvp: data || null });
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

// ---- Protect all subsequent admin routes ----

// ---- Admin: GET full guest list with filters ----
app.get("/api/v1/admin/guests", requireAdminAuth, async (req, res) => {
  try {
    const { rsvp, invited, responded, search } = req.query;

    let query = supabase.from("admin_guests_view").select("*");

    // invited=yes/no
    if (invited === "yes") query = query.not("invited_at", "is", null);
    if (invited === "no") query = query.is("invited_at", null);

    // responded=yes/no
    if (responded === "yes") query = query.not("responded_at", "is", null);
    if (responded === "no") query = query.is("responded_at", null);

    // rsvp status
    if (rsvp) query = query.eq("rsvps->>status", rsvp);

    // search by name or email
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order("last_activity_at", { ascending: false });
    if (error) {
      console.error("[AdminGuests] View query failed", error);
      return res.status(422).json({ error: "Supabase view query failed", details: error });
    }

    return res.json({ guests: data || [] });
  } catch (e) {
    console.error("[AdminGuests] Unexpected error", e);
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

// ---- Admin: GET guest activity ----
app.get("/api/v1/admin/guest/:id/activity", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing guest id" });

    const { data: activity, error } = await supabase
      .from("user_activity")
      .select("*")
      .eq("guest_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminGuestActivity] Query failed", error);
      return res.status(422).json({ error: "Supabase query failed", details: error });
    }

    return res.json({ activity: activity || [] });
  } catch (e) {
    console.error("[AdminGuestActivity] Unexpected error", e);
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
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

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

// ---- Admin: Nudge guests (bulk) ----
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
        console.warn(`[AdminNudge] Guest not found for id=${id}`);
        results.push({ id, status: "guest_not_found" });
        continue;
      }

      console.log(`[AdminNudge] Sending nudge to ${guest.email} (${guest.id})`);
      try {
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
      } catch (e) {
        console.error(`[AdminNudge] Failed sending to ${guest.email}`, e);
        results.push({ id, status: "failed" });
      }
    }

    return res.json({ ok: true, results });
  } catch (e) {
    console.error("[AdminNudge] Unexpected error", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.use("/api/v1/admin", requireAdminAuth);

// ---- Serve built frontend from /app/dist (we'll place it there in Docker) ----
const distDir = path.join(__dirname, "public");
app.use(express.static(distDir));
app.get("/health", (req, res) => res.json({ ok: true, at: new Date().toISOString() }));
app.use((_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

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