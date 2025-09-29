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

// ---- Supabase ----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---- JWT ----
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const JWT_TTL_SECONDS = parseInt(process.env.JWT_TTL_SECONDS || "7200", 10);

// ---- Email providers ----
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "mailtrap").toLowerCase();
const DEV_SKIP_EMAIL = process.env.DEV_SKIP_EMAIL === "true";
if (EMAIL_PROVIDER === "sendgrid" && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
const mailtrapTransport = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
  port: Number(process.env.MAILTRAP_PORT || 2525),
  auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS }
});

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.FROM_EMAIL || "noreply@cactusmakesperfect.org";
  if (DEV_SKIP_EMAIL) {
    console.log(`DEV_SKIP_EMAIL is true, skipping sending email to ${to}`);
    return;
  }
  if (EMAIL_PROVIDER === "sendgrid") {
    await sgMail.send({ to, from, subject, html, text });
  } else {
    await mailtrapTransport.sendMail({ to, from, subject, html, text });
  }
}

const genCode = (len = 6) => [...Array(len)].map(() => Math.floor(Math.random() * 10)).join("");
const issueJWT = async (payload) =>
  await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(Buffer.from(JWT_SECRET, "utf-8"));

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
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();

    await supabase.from("invite_tokens").insert([{ guest_id: guest.id, token, code, expires_at }]);
    console.log("Inserted invite token");

    const inviteUrl = `${PUBLIC_URL}/invite?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const subject = "You're Invited! 🌵";
    const html = `<p>Hello ${guest.first_name || ""},</p>
      <p>Your entry code: <b>${code}</b></p>
      <p>Or click to continue: <a href="${inviteUrl}">${inviteUrl}</a></p>`;
    const text = `Hello ${guest.first_name || ""}\nCode: ${code}\nLink: ${inviteUrl}`;

    console.log("About to send email");
    await sendEmail({ to: email, subject, html, text });
    console.log("Email sent");

    await supabase.from("user_activity").insert([{ guest_id: guest.id, kind: "invite_sent", meta: { email } }]);
    console.log("Inserted user_activity");

    res.json({ ok: true });
    console.log("Responded with ok");
  } catch (e) {
    console.error("invite error", e);
    res.status(500).json({ error: "Internal error" });
  }
});

// ---- API: verify ----
app.post("/api/v1/auth/verify", async (req, res) => {
  try {
    const { token, email, code } = req.body || {};
    if (!token || !email || !code) return res.status(400).json({ error: "Missing fields" });

    const { data: rows, error } = await supabase
      .from("invite_tokens")
      .select("*, guest:guest_id(*)")
      .eq("token", token)
      .eq("code", code)
      .limit(1);
    if (error || !rows?.length) return res.status(401).json({ error: "Invalid code or token" });

    const invite = rows[0];
    if (!invite?.guest || invite.guest.email !== email) return res.status(401).json({ error: "Email mismatch" });
    if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: "Code expired" });

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

// ---- Serve built frontend from /app/dist (we'll place it there in Docker) ----
const distDir = path.join(__dirname, "public");
app.use(express.static(distDir));
app.get("/health", (req, res) => res.json({ ok: true, at: new Date().toISOString() }));
app.use((_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(port, () => {
  console.log(`Server listening on port ${port} (PUBLIC_URL=${PUBLIC_URL})`);
});