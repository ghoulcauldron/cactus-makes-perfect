import express from "express";
import basicAuth from "basic-auth";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Basic auth
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

// Serve static dist first
app.use(express.static(join(__dirname, "dist")));

// Only fallback for non-file requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/assets') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.svg')) {
    return next(); // let express.static handle it
  }
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend running at http://0.0.0.0:${port}`);
});