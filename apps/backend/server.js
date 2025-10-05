// apps/backend/server.js
import express from "express";
import basicAuth from "basic-auth";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
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
app.use(auth);

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
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "mailtrap").toLowerCase();
const DEV_SKIP_EMAIL = process.env.DEV_SKIP_EMAIL === "true";
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 7000);
if (EMAIL_PROVIDER === "sendgrid" && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
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
    if (provider === "sendgrid") {
      const keyLen = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0;
      if (!keyLen) console.warn("[Email] WARN: SENDGRID_API_KEY is missing");
      else console.log(`[Email] SendGrid API key present (len=${keyLen})`);

      const res = await withHardTimeout(
        sgMail.send({ to, from, subject, html, text }),
        "sendgrid"
      );

      // sgMail returns an array of [response, body] per message
      const statuses = Array.isArray(res)
        ? res.map((r) => (r && r[0] && r[0].statusCode) || r?.statusCode || null)
        : [res?.statusCode || null];
      console.log("[Email] SendGrid response statusCodes:", statuses);
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

    await supabase.from("user_activity").insert([{ guest_id: guest.id, kind: "invite_sent", meta: { email } }]);
    console.log("Inserted user_activity");

    res.json({ ok: true });
    console.log("Responded with ok");
  } catch (e) {
    console.error("invite error", e);
    try {
      await supabase
        .from("invite_tokens")
        .update({
          provider: EMAIL_PROVIDER,
          delivery_status: "failed"
        })
        .eq("token", token);
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

    res.json({ token: jwt });
  } catch (e) {
    console.error("verify error", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: RSVP ----
app.post("/api/v1/rsvps/me", async (req, res) => {
  try {
    const { guest_id, status } = req.body || {};
    if (!guest_id || !status) return res.status(400).json({ error: "Missing guest_id or status" });

    await supabase.from("rsvps").insert([{ guest_id, status }]);
    await supabase.from("user_activity").insert([{ guest_id, kind: "rsvp_submitted", meta: { status } }]);

    res.json({ ok: true });
  } catch (e) {
    console.error("rsvp error", e);
    res.status(500).json({ error: "Internal error" });
  }
});

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
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setExpirationTime(JWT_TTL_SECONDS)
    .sign(new TextEncoder().encode(JWT_SECRET));
  return token;
}