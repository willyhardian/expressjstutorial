---
sidebar_position: 6
title: The Service Layer
---

# The Service Layer (Business Logic)

Now that our foundation is built, we will implement the first major pillar of our architecture: **The Service Layer**.

## The Golden Rule

**Controllers should never contain business logic.**

-   **Controllers** are "Traffic Cops." They only know about HTTP (`req`, `res`). They validate input, call a Service, and send a response.
-   **Services** are "The Brains." They know about the domain (Users, Posts, Products). They perform calculations, handle data formatting, and coordinate tasks. They **never** touch `req` or `res`.

This separation means you can reuse your business logic (e.g., in a CLI script or a background job) because it isn't tied to an Express request.

---

## Step 1: Create a Service

We will build a simple "Create Post" feature. Since we don't have a database yet, our service will just simulate saving data.

Create a new file: `src/services/post.service.js`

```javascript
// src/services/post.service.js
const ApiError = require("../utils/ApiError");

/**
 * Create a new post.
 * @param {Object} postData - The data for the post (title, content, etc.)
 * @returns {Object} - The created post
 */
const createPost = async (postData) => {
    // 1. Business Logic: Validation (Simple example)
    if (!postData.title) {
        // We throw an error, and our Controller + Global Handler will catch it!
        throw new ApiError(400, "Title is required");
    }

    // 2. Business Logic: Data Manipulation
    // (Here we would usually call the Repository to save to DB)
    const newPost = {
        id: Date.now(), // Simulate an ID
        title: postData.title,
        content: postData.content,
        createdAt: new Date(),
        status: "published", // Default logic
    };

    return newPost;
};

module.exports = {
    createPost,
};
```

Notice: There is no `req` or `res` here. Just plain JavaScript objects.

## Step 2: Create a Controller

Now we need a controller to handle the HTTP request and call our new service.

Create a new file: `src/controllers/post.controller.js`

```js
// src/controllers/post.controller.js
const postService = require("../services/post.service");
const catchAsync = require("../utils/catchAsync");

const createPost = catchAsync(async (req, res) => {
    // 1. Extract data from the request
    const postData = req.body;

    // 2. Call the Service
    const result = await postService.createPost(postData);

    // 3. Send the response
    res.status(201).json({
        status: "success",
        data: result,
    });
});

module.exports = {
    createPost,
};
```

See how clean this is? The controller doesn't know how a post is created. It just asks the service to do it.

## Step 3: Create the Route

Now we connect a URL to this controller.

Create a new file: `src/routes/post.routes.js`

```js
// src/routes/post.routes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");

// POST /api/v1/posts
router.post("/", postController.createPost);

module.exports = router;
```

## Step 4: Register the Route

Finally, tell our main application router to use these new post routes.

Open `src/routes/index.js` and update it:

```js
// src/routes/index.js
const express = require("express");
const router = express.Router();

const healthController = require("../controllers/health.controller");
const postRoutes = require("./post.routes"); // <--- Import the new routes

router.get("/health", healthController.checkHealth);

// Mount the post routes under /posts
router.use("/posts", postRoutes);

module.exports = router;
```

## Step 5: Test It

Run your server (`npm run dev`) and open your API client (like Postman).

Request:

Method: POST

URL: `http://localhost:3001/api/v1/posts`

Body (JSON):

```json
{
    "title": "My First Service",
    "content": "This logic lives in the service layer!"
}
```

`Response`: You should see the object returned by your service, including the generated `id` and `createdAt`.

```json
{
    "status": "success",
    "data": {
        "id": 1732001234567,
        "title": "My First Service",
        "content": "This logic lives in the service layer!",
        "createdAt": "2025-11-19T...",
        "status": "published"
    }
}
```

Test the Error Handling: Try sending an empty JSON body `{}`. Your service will `throw new ApiError(400, 'Title is required')`, and your Global Error Handler will automatically format it:

```json
{
    "status": "fail",
    "message": "Title is required"
}
```

## Recap

You have successfully separated Business Logic (Service) from HTTP Transport (Controller).

However, our Service is currently "faking" the database part. In a scalable app, the Service shouldn't know about data storage details either. That is the job of the Repository.
