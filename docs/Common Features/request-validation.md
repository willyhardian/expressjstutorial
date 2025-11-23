---
sidebar_position: 3
title: Request Validation (Zod)
---

# Request Validation (Zod)

In a scalable application, you must never trust user input.

**The Wrong Way:**
Writing manual checks inside your Controller:

```javascript
if (!req.body.email || !req.body.password.length > 6) {
    return res.status(400).send("Invalid input");
}
```

This clutters your code and is easy to forget.

The Opinionated Way: We use [Zod](https://zod.dev), the modern standard for data validation. Although famous for TypeScript, it works perfectly in plain JavaScript and provides a cleaner, more functional API than older libraries like Joi.

## Step 1: Install Dependencies

```bash
npm install zod
```

## Step 2: Create the Validation Middleware

We need a reusable function that acts as a gatekeeper. It checks the incoming request against a Zod schema.

Create `src/middlewares/validate.middleware.js`:

```js
// src/middlewares/validate.middleware.js
const { z } = require("zod");
const ApiError = require("../utils/ApiError");

/**
 * Higher-Order Function: Returns a middleware that validates the request
 * @param {Object} schema - The Zod validation schema
 */
const validate = (schema) => (req, res, next) => {
    // We create a single object containing all parts of the request
    const objectToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
    };

    // Zod .safeParse() returns an object with either { success: true, data } or { success: false, error }
    // We use strict() in the schema definition to strip unknown keys
    const result = schema.safeParse(objectToValidate);

    if (!result.success) {
        // Format Zod errors into a readable string
        // Example: "body.email: Invalid email"
        const errorMessage = result.error.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ");

        return next(new ApiError(400, errorMessage));
    }

    // Replace req properties with the sanitized values
    // This ensures that any extra fields sent by the user are stripped out
    Object.assign(req, result.data);
    return next();
};

module.exports = validate;
```

## Step 3: Define a Schema

Now let's create a schema for our Register and Login features.

Create `src/validations/auth.validation.js`:

```js
// src/validations/auth.validation.js
const { z } = require("zod");

// Schema for Register
const register = z.object({
    body: z.object({
        name: z.string().min(2).max(30),
        email: z.string().email(),
        // Password: Min 8 chars, must contain at least 1 number
        password: z
            .string()
            .min(8)
            .regex(/\d/, { message: "Password must contain a number" }),
    }),
});

// Schema for Login
const login = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

module.exports = {
    register,
    login,
};
```

## Step 4: Apply Middleware to Routes

Plug the middleware into your routes.

Open `src/routes/auth.routes.js`:

```js
// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Import Middleware and Schema
const validate = require("../middlewares/validate.middleware");
const authValidation = require("../validations/auth.validation");

// POST /register
// 1. Validate Request (Zod) -> 2. Call Controller
router.post(
    "/register",
    validate(authValidation.register),
    authController.register
);

// POST /login
router.post("/login", validate(authValidation.login), authController.login);

module.exports = router;
```

## Step 5: Test It

1. Restart Server: `npm run dev`

2. Send Bad Data:

    - POST to `/auth/register`

    - Body: `{"name": "A", "email": "not-an-email"}`

3. Verify Response: The middleware should catch it and return a clean 400 error:

```json
{
    "status": "fail",
    "message": "body.name: String must contain at least 2 character(s), body.email: Invalid email"
}
```
