---
sidebar_position: 4
title: Your First Route & Controller
---

# Your First Route & Controller

We have a clean directory structure and a separated `app.js` / `server.js`. However, our `src/app.js` file still has a route handler directly inside it:

```javascript
// src/app.js (current)
// ...
app.get("/", (req, res) => {
    res.send("Hello, Express!");
});
// ...
```

This violates our Separation of Concerns principle. The app.js file's only job should be to configure the application (like adding middleware and plugging in route files), not to define what happens at a specific URL.

In this step, we will refactor this by creating our first proper Controller and Route file. We will create a GET /health endpoint, which is a common best practice for APIs to signal that they are online and healthy.

Step 1: Create Your First Controller
The Controller's job is to handle the HTTP request and response. It's the "traffic cop." It parses the request, calls the necessary services (which we will add later), and sends the final response.

Create a new file: `src/controllers/health.controller.js`

Add the following code:

```js
// src/controllers/health.controller.js

/**
 * Handles the health check endpoint.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const checkHealth = (req, res, next) => {
    // We send a simple JSON response to indicate the API is live
    res.status(200).json({
        status: "ok",
        message: "Service is healthy",
    });
};

module.exports = {
    checkHealth,
};
```

:::note
Note: The JSDoc comments (@param) are optional but highly recommended. They provide IntelliSense (auto-completion) in VS Code, giving you a "TypeScript-like" experience in plain JavaScript.
:::

## Step 2: Create Your First Route File

The Route file's job is to be a "signpost." It maps a URL (like /health) to its designated controller function.

We will create a main index.js file in our routes folder. This file will act as the central "router" for our entire application.

1. Create a new file: `src/routes/index.js`

Add the following code:

```js
// src/routes/index.js
const express = require("express");
const router = express.Router();

// Import the controller
const healthController = require("../controllers/health.controller");

// Define the route
// GET /health
router.get("/health", healthController.checkHealth);

// We will add other routers here later, e.g.:
// router.use('/users', require('./user.routes'));

module.exports = router;
```

This file:

Creates an express.Router(). This is a mini-app just for handling routes.

Imports our healthController.

Tells the router: "When you receive a GET request to /health, call the healthController.checkHealth function."

Exports the fully configured router.

## Step 3: Update app.js (The Final Refactor)

Now we will "plug in" our new main router to app.js and remove the old test route.

Open `src/app.js` and modify it to look like this:

```js
// src/app.js
const express = require("express");
const app = express();

// Import our main router
const mainRouter = require("./routes");

// Add global middleware
app.use(express.json()); // Allows us to parse JSON in request bodies

// --- API Routes ---
// We'll prefix all our API routes with /api/v1
// This is a good practice for versioning
app.use("/api/v1", mainRouter);

// --- 404 Handler ---
// Catch-all for routes that don't exist
app.use((req, res, next) => {
    res.status(404).json({
        message: "Error: Route not found",
    });
});

// Export the app for server.js to use
module.exports = app;
```

Key Changes:

1. Removed the old app.get('/') handler.

2. Added app.use('/api/v1', mainRouter). This tells Express: "Use our mainRouter for any request that starts with /api/v1."

3. Added a 404 handler middleware at the end.

## Step 4: Test Your New Endpoint

Run your server as usual:

```bash
npm run dev
```

Now, open your browser or an API client (like Postman) and navigate to: http://localhost:3001/api/v1/health

(Note: Ensure you use the port defined in your .env file. We used 3001 in the previous step).

You should see your JSON response:

```json
{
    "status": "ok",
    "message": "Service is healthy"
}
```

Checklist:

-   src/controllers/health.controller.js created.

-   src/routes/index.js created.

-   src/app.js refactored to use the router.

-   /api/v1/health returns a 200 OK JSON response.

You have successfully implemented the first two layers of our architecture! Next, we will look at how to handle errors globally.
