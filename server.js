// In: server.js

const express = require('express');
const path = require('path');
const app = express();

// This tells the server to serve all the static files (html, css, js, img)
// from the root directory of your project.
app.use(express.static(path.join(__dirname, '/')));

// MODIFIED: Replaced the old '*' syntax with the modern '/*' syntax for a catch-all route.
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Azure App Service provides the port number via an environment variable.
// We use that port, or a default (8080) for local testing.
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});