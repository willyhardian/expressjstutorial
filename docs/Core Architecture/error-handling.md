---
sidebar_position: 5
title: Centralized Error Handling
---

# Centralized Error Handling

In a typical "unopinionated" Express app, you often see code like this in every controller:

```javascript
// The "Bad" Way
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
```

This is not scalable. If you have 50 controllers, you have 50 try...catch blocks. If you want to change how errors look (e.g., adding a timestamp), you have to edit 50 files.

Our "opinionated" architecture uses Centralized Error Handling. We will create a custom Error class and a single Global Error Middleware.

## Step 1: Create a Custom Error Class

First, we need a standardized way to create errors. We don't just want to throw a generic Error; we want to attach a specific HTTP status code (like 404 or 400) to it.

Create a new file: `src/utils/ApiError.js`

```js
// src/utils/ApiError.js

/**
 * Custom Error class to handle operational errors.
 * Extends the built-in Error class.
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true; // Identifies this as a known, handled error

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
```

Now, instead of writing res.status(404).json(...), we can just throw new ApiError(404, 'User not found').

## Step 2: Create the Global Error Middleware

This middleware will catch any error thrown in our application, format it safely, and send the response.

Create a new file: `src/middlewares/error.middleware.js`

```js
// src/middlewares/error.middleware.js
const config = require("../config");

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // Development: Send detailed error (stack trace)
    if (config.app.env === "development") {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    // Production: Send generic message to not leak secrets
    else {
        // 1. Operational, trusted error: send message to client
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // 2. Programming or other unknown error: don't leak details
        else {
            console.error("ERROR 💥", err); // Log it for the developer
            res.status(500).json({
                status: "error",
                message: "Something went very wrong!",
            });
        }
    }
};

module.exports = globalErrorHandler;
```

## Step 3: Handle Async Errors (The Wrapper)

Express (v4) does not automatically catch errors in async functions. You usually have to pass them to next(err).

To avoid writing try...catch blocks, we will create a higher-order function that wraps our controllers.

Create a new file: src/utils/catchAsync.js

```js
// src/utils/catchAsync.js

/**
 * Wraps an async function and catches any errors,
 * passing them to the next() middleware.
 */
module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
```

## Step 4: Update app.js

Now, let's plug our new Global Error Handler into the main application. It must be the very last middleware added.

Open `src/app.js` and update it:

```js
// src/app.js
const express = require("express");
const app = express();
const mainRouter = require("./routes");
const globalErrorHandler = require("./middlewares/error.middleware"); // Import middleware
const ApiError = require("./utils/ApiError"); // Import custom error

app.use(express.json());

app.use("/api/v1", mainRouter);

// Handle 404 errors for unknown routes
app.all("*", (req, res, next) => {
    // We just throw the error, and the global handler will catch it!
    next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// --- Global Error Handler ---
// This must be the last app.use()
app.use(globalErrorHandler);

module.exports = app;
```

## Step 5: Refactor the Controller

Now, let's see the magic. Let's update our health.controller.js to use these new tools.

```js
// src/controllers/health.controller.js
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

const checkHealth = catchAsync(async (req, res) => {
    // Example: Simulate an error to test the handler
    // throw new ApiError(400, 'This is a simulated bad request');

    res.status(200).json({
        status: "ok",
        message: "Service is healthy",
    });
});

module.exports = {
    checkHealth,
};
```

Why is this better?

1. No Try/Catch: The catchAsync wrapper handles it.

2. Clean Logic: The controller only focuses on the "happy path."

3. Uniform Responses: Every error in your app will now have the same consistent JSON structure.

## Next Steps

Our foundation is rock solid. We have Configuration, Routes, Controllers, and Error Handling.

Now we are ready for the "Brain" of the application. In the next section, we will introduce The Service Layer and move our business logic out of the controller.
