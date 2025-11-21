---
sidebar_position: 3
title: Login & JWT Implementation
---

# Login & JWT Implementation

We can create users, but they can't "log in" yet. In a REST API, "logging in" doesn't mean creating a session on the server (stateful). Instead, it means exchanging valid credentials for a **Token** (stateless).

We will use **JWT (JSON Web Tokens)**. The user sends their email/password, and if correct, we give them a signed token. They must send this token in the header of every future request to prove who they are.

[Image of JWT login flow diagram]

---

## Step 1: Install Dependencies

We need a library to generate and sign tokens.

```bash
npm install jsonwebtoken
```

## Step 2: Update Configuration

Security Best Practice: Never hardcode your JWT secret. It must be in your environment variables.

1. Update `.env`: Add a secret key (make it long and random) and an expiration time.

```ini
# .env
# ... other vars
JWT_SECRET=my-super-secret-long-key-change-this
JWT_EXPIRES_IN=1d
```

2. **Update** `src/config/index.js`: Load these variables so our app can use them.

```js
// src/config/index.js
// ... existing config imports

const config = {
    app: {
        /* ... */
    },
    db: {
        /* ... */
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
};

module.exports = Object.freeze(config);
```

## Step 3: Update Auth Service (The Logic)

We need to add a `login` function to `src/services/auth.service.js`.

This function has three jobs:

1. Find the user by email.

2. Check if the password matches (using `bcrypt.compare`).

3. Generate a JWT token.

Update `src/services/auth.service.js`:

```js
// src/services/auth.service.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // <--- Import JWT
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/ApiError");
const config = require("../config"); // <--- Import Config

// ... (keep register function)

const login = async (email, password) => {
    // 1. Find user
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        // Security Tip: Don't say "User not found", just say "Incorrect email or password"
        throw new ApiError(401, "Incorrect email or password");
    }

    // 2. Check password
    // We compare the plain text password with the HASHED password in the DB
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new ApiError(401, "Incorrect email or password");
    }

    // 3. Generate Token
    const token = jwt.sign(
        { id: user.id, email: user.email }, // Payload (what's inside the token)
        config.jwt.secret, // Secret Key
        { expiresIn: config.jwt.expiresIn } // Options
    );

    // 4. Return user info (without password) and the token
    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
        user: userResponse,
        token,
    };
};

module.exports = {
    register,
    login, // <--- Export login
};
```

## Step 4: Update Auth Controller

Add the `login` handler to `src/controllers/auth.controller.js`.

```js
// src/controllers/auth.controller.js
const authService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");

// ... (keep register function)

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json({
        status: "success",
        data: result,
    });
});

module.exports = {
    register,
    login,
};
```

## Step 5: Update Auth Routes

Add the POST route to `src/routes/auth.routes.js`.

```js
// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// POST /api/v1/auth/register
router.post("/register", authController.register);

// POST /api/v1/auth/login
router.post("/login", authController.login);

module.exports = router;
```

## Step 6: Test Login

Start your server (`npm run dev`) and open Postman.

**Request**:

-   **Method**: POST

-   **URL**: http://localhost:3001/api/v1/auth/login

-   **Body (JSON)**:

```json
{
    "email": "john@example.com",
    "password": "supersecretpassword"
}
```

**Response**: You should receive a 200 OK with a token string.

```json
{
    "status": "success",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Test Failure**: Try changing the password to "wrongpassword". You should get:

```json
{
    "status": "fail",
    "message": "Incorrect email or password"
}
```

## Next Steps

We are issuing tokens, but our API doesn't use them yet. Our `POST /posts` endpoint is still open to the public!

In the final section of this category, **Protecting Routes**, we will build the authenticate middleware to lock down our API so only users with a valid token can access it.
