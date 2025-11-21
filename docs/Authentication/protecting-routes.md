---
sidebar_position: 4
title: Protecting Routes (Auth Middleware)
---

# Protecting Routes (Auth Middleware)

We can issue tokens, but right now our API ignores them. Anyone can still send a `POST` request to create a post without logging in.

In this section, we will create the **Authentication Middleware**. This function will run _before_ the controller. It will check for a valid token and, if valid, allow the request to proceed.

---

## Step 1: Create the Middleware

Create a new file: `src/middlewares/auth.middleware.js`.

This middleware needs to:

1.  Read the `Authorization` header from the request.
2.  Extract the token (remove the "Bearer " prefix).
3.  Verify the token using our secret key.
4.  Attach the user data to the `req` object (so the controller can use it).

```javascript
// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const { User } = require("../models");

const authenticate = async (req, res, next) => {
    try {
        // 1. Get the token from the header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Unauthorized: No token provided");
        }

        // Extract the token string (remove "Bearer " space)
        const token = authHeader.split(" ")[1];

        // 2. Verify the token
        // If invalid, jwt.verify throws an error automatically
        const decoded = jwt.verify(token, config.jwt.secret);

        // 3. Check if user still exists (Optional but recommended)
        // What if the user was deleted after getting the token?
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new ApiError(401, "Unauthorized: User not found");
        }

        // 4. Attach user to request
        // This is the "magic". Now any controller after this has access to req.user!
        req.user = user;

        next(); // Move to the controller
    } catch (error) {
        // Handle JWT specific errors
        if (error.name === "JsonWebTokenError") {
            next(new ApiError(401, "Unauthorized: Invalid token"));
        } else if (error.name === "TokenExpiredError") {
            next(new ApiError(401, "Unauthorized: Token expired"));
        } else {
            next(error);
        }
    }
};

module.exports = authenticate;
```

## Step 2: Apply Middleware to Routes

Now we can use this "Security Guard" to protect specific routes.

Let's lock down the "Create Post" route so only logged-in users can post. The "Get Posts" route can remain public (for now).

Open `src/routes/post.routes.js`:

```js
// src/routes/post.routes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const authenticate = require("../middlewares/auth.middleware"); // <--- Import

// POST /api/v1/posts (PROTECTED)
// We insert 'authenticate' before the controller
router.post("/", authenticate, postController.createPost);

// GET /api/v1/posts (PUBLIC)
// Anyone can read posts
router.get("/", postController.getPosts);

module.exports = router;
```

## Step 3: Verify the Protection

Let's verify that our security guard is working.

1. Restart Server: `npm run dev`

2. Test Blocked Request (No Token):

-   Open Postman.

-   Send a **POST** to `http://localhost:3001/api/v1/posts`.

-   Do **NOT** add any headers.

-   **Result**: You should get a `401 Unauthorized` error.

```json
{
    "status": "fail",
    "message": "Unauthorized: No token provided"
}
```

3. Test Allowed Request (With Token):

-   Login first: Send a POST to `/api/v1/auth/login` and copy the `token` from the response.

-   Go back to Create Post: In Postman, go to the Auth tab (or Headers).

-   Type: Select "Bearer Token".

-   Token: Paste your token.

-   Send: The request should succeed!

## Bonus: Using req.user in Controller

Since our middleware attached `req.user`, we can now access the current user's ID inside our controller.

This is useful for auditing (e.g., "Who created this post?").

Open `src/controllers/post.controller.js` and modify the `createPost` function:

```js
// src/controllers/post.controller.js

const createPost = catchAsync(async (req, res) => {
    const postData = req.body;

    // Access the logged-in user!
    const currentUser = req.user;

    console.log(
        `Post created by user: ${currentUser.email} (ID: ${currentUser.id})`
    );

    const result = await postService.createPost(postData);

    res.status(201).json({
        status: "success",
        data: result,
    });
});
```

## Conclusion

Congratulations! You have finished the Authentication category.

You now have a professional-grade security system:

-   Database: Users table with unique emails.

-   Registration: Secure password hashing (bcrypt).

-   Login: Stateless authentication via JWT.

-   Protection: Middleware to lock down sensitive routes.

-   This is the foundation for any SaaS or Enterprise application.
