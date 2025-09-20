import express from "express";
import basicAuth from "basic-auth";

const app = express();
const port = process.env.PORT || 8080;

// Simple HTTP Basic Auth
const auth = (req, res, next) => {
  const user = basicAuth(req);
  const username = process.env.BASIC_AUTH_USER || "guest";
  const password = process.env.BASIC_AUTH_PASS || "secretpass";

  if (!user || user.name !== username || user.pass !== password) {
    res.set("WWW-Authenticate", "Basic realm=\"Protected\"");
    return res.status(401).send("Authentication required.");
  }
  next();
};

// Apply auth globally (protects everything)
app.use(auth);

// Serve static files from dist
app.use(express.static("dist"));

// Fallback to index.html for React Router
app.get("*", (req, res) => {
  res.sendFile("/app/dist/index.html");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend running at http://0.0.0.0:${port}`);
});