// In: server.js

const express = require('express');
const path = require('path');
const app = express();

// This single line is all we need.
// It correctly serves index.html for the root path ('/')
// and all other files like moderator.html, presenter.html, and all CSS/JS files.
app.use(express.static(path.join(__dirname, '/')));

// The problematic app.get('/*', ...) route has been completely removed.

// Azure App Service provides the port number via an environment variable.
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});