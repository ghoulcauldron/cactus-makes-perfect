import express from "express";
import basicAuth from "basic-auth";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json()); // parse JSON body

// 🔑 Fake auth endpoint for calculator
app.post("/api/v1/auth/verify", (req, res) => {
  const { code } = req.body;
  const expected = process.env.AUTH_PASSCODE || "1234";

  if (code === expected) {
    // send back a token
    return res.json({ token: "dev_token_abc123" });
  }
  return res.status(401).send("Invalid passcode");
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
