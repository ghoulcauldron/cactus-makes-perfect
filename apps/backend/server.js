import express from "express";
import basicAuth from "basic-auth";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// --- new imports ---
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // parse JSON body

// --- Supabase client setup ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- JWT setup ---
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const JWT_TTL_SECONDS = parseInt(process.env.JWT_TTL_SECONDS || "7200", 10); // 2h default

// --- SendGrid setup ---
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "mailtrap";
if (EMAIL_PROVIDER === "sendgrid") {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// --- Nodemailer (Mailtrap) setup ---
const mailtrapTransport = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
  port: process.env.MAILTRAP_PORT || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// --- Helper: sendEmail ---
async function sendEmail({ to, subject, html, text }) {
  if (EMAIL_PROVIDER === "sendgrid") {
    const msg = {
      to,
      from: process.env.FROM_EMAIL || "noreply@cactus-makes-perfect.com",
      subject,
      html,
      text,
    };
    await sgMail.send(msg);
  } else {
    // Default: Mailtrap
    await mailtrapTransport.sendMail({
      from: process.env.FROM_EMAIL || "noreply@cactus-makes-perfect.com",
      to,
      subject,
      html,
      text,
    });
  }
}

// --- Utility: generate code ---
function generateCode(length = 6) {
  return Array.from({ length })
    .map(() => Math.floor(Math.random() * 10))
    .join("");
}

// --- Utility: generate JWT ---
async function generateJWT(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(Buffer.from(JWT_SECRET, "utf-8"));
}


// --- Invite: Send invite email ---
app.post("/api/v1/invites/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    // 1. Find guest by email
    const { data: guest, error: guestErr } = await supabase
      .from("guests")
      .select("*")
      .eq("email", email)
      .single();
    if (guestErr || !guest) return res.status(404).json({ error: "Guest not found" });

    // 2. Generate code, token, expiry
    const code = generateCode(6);
    const token = uuidv4();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours
    const invited_at = new Date();

    // 3. Store invite token
    await supabase.from("invite_tokens").insert([
      {
        guest_id: guest.id,
        code,
        token,
        expires_at: expires_at.toISOString(),
        invited_at: invited_at.toISOString(),
      },
    ]);

    // 4. Compose invite email
    const inviteUrl = `${process.env.PUBLIC_URL || "http://www.cactusmakesperfect.org"}/invite?token=${token}&email=${encodeURIComponent(email)}&code=${code}`;
    const subject = "You're Invited! 🌵";
    const html = `<p>Hello ${guest.name || ""},<br />You're invited! Use code <b>${code}</b> or <a href="${inviteUrl}">click here to RSVP</a>.<br>This link expires in 2 hours.</p>`;
    const text = `Hello ${guest.name || ""},\nYou're invited! Use code ${code} or visit: ${inviteUrl}\nThis link expires in 2 hours.`;

    // 5. Send email
    await sendEmail({ to: email, subject, html, text });

    // 6. Log activity
    await supabase.from("user_activity").insert([
      {
        guest_id: guest.id,
        action: "invite_sent",
        details: { email, code, token },
        at: new Date().toISOString(),
      },
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error("invite send error", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// --- Auth: Verify code/token ---
app.post("/api/v1/auth/verify", async (req, res) => {
  try {
    const { token, email, code } = req.body;
    if (!token || !email || !code) return res.status(400).json({ error: "Missing fields" });

    // Find invite_token joined with guest
    const { data, error } = await supabase
      .from("invite_tokens")
      .select("*, guest:guest_id(*)")
      .eq("token", token)
      .eq("code", code)
      .limit(1);
    if (error || !data || data.length === 0) return res.status(401).json({ error: "Invalid code or token" });
    const invite = data[0];
    if (!invite.guest || invite.guest.email !== email) return res.status(401).json({ error: "Email mismatch" });
    if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: "Code expired" });

    // Issue JWT
    const jwt = await generateJWT({
      guest_id: invite.guest.id,
      email: invite.guest.email,
      name: invite.guest.name,
      iat: Math.floor(Date.now() / 1000),
    });

    // Update responded_at
    await supabase
      .from("invite_tokens")
      .update({ responded_at: new Date().toISOString() })
      .eq("id", invite.id);

    // Log activity
    await supabase.from("user_activity").insert([
      {
        guest_id: invite.guest.id,
        action: "invite_verified",
        details: { code, token },
        at: new Date().toISOString(),
      },
    ]);

    return res.json({ token: jwt });
  } catch (err) {
    console.error("auth verify error", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// --- RSVP: Me ---
app.post("/api/v1/rsvps/me", async (req, res) => {
  try {
    const { guest_id, status, dietary_notes, song_request } = req.body;
    if (!guest_id || !status) return res.status(400).json({ error: "Missing guest_id or status" });
    // Insert RSVP
    await supabase.from("rsvps").insert([
      {
        guest_id,
        status,
        dietary_notes: dietary_notes || null,
        song_request: song_request || null,
        responded_at: new Date().toISOString(),
      },
    ]);
    // Log activity
    await supabase.from("user_activity").insert([
      {
        guest_id,
        action: "rsvp_submitted",
        details: { status, dietary_notes, song_request },
        at: new Date().toISOString(),
      },
    ]);
    return res.json({ success: true });
  } catch (err) {
    console.error("rsvp error", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// --- basic auth to keep site private during dev ---
const auth = (req, res, next) => {
  const user = basicAuth(req);
  const username = process.env.BASIC_AUTH_USER || "guest";
  const password = process.env.BASIC_AUTH_PASS || "secretpass";

  if (!user || user.name !== username || user.pass !== password) {
    res.set("WWW-Authenticate", 'Basic realm="Protected"');
    return res.status(401).send("Authentication required.");
  }
  next();
};
app.use(auth);

// --- serve frontend ---
app.use(express.static(join(__dirname, "dist")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend running at http://0.0.0.0:${port}`);
});
