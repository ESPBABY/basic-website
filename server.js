const path = require("path");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const wsServer = new WebSocket.Server({ port: 8888 }, () =>
  console.log("WebSocket server is listening at port 8888")
);

const username = "rj";
const password = "12345678";

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Authentication Required"');
    res.sendStatus(401);
    return;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [authUsername, authPassword] = credentials.split(":");

  if (authUsername === username && authPassword === password) {
    next();
  } else {
    res.set("WWW-Authenticate", 'Basic realm="Authentication Required"');
    res.sendStatus(401);
  }
};

wsServer.on("connection", (ws, req) => {
  console.log("WebSocket connected");

  ws.on("message", (data) => {
    if (data.indexOf("WEB_CLIENT") !== -1) {
      console.log("WEB_CLIENT added");
      return;
    }

    wsServer.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on("error", (error) => {
    console.error("WebSocket error observed:", error);
  });
});

app.use(authenticate, express.static(path.join(__dirname, ".")));

// Route for serving client.html on the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client.html"));
});

const server = app.listen(8000, () =>
  console.log("HTTP server is listening at port 8000")
);
