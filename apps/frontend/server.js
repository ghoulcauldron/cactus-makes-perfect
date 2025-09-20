import express from "express";
import basicAuth from "basic-auth";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// HTTP Basic Auth
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

// Serve static dist
app.use(express.static(join(__dirname, "dist")));

// Catch-all for React Router
app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend running at http://0.0.0.0:${port}`);
});