---
sidebar_position: 2
title: Registration & Password Hashing
---

# Registration & Password Hashing

Now that we have a User model, we need a way to create users. However, we cannot just save the password exactly as the user typed it. If our database were ever hacked, everyone's passwords would be stolen.

We must **Hash** the password before saving it.

---

## Step 1: Install Dependencies

We need a library to handle the hashing algorithms. `bcryptjs` is the industry standard for Node.js.

```bash
npm install bcryptjs
```

## Step 2: Create the User Repository

First, we need a way to talk to the `Users` table.

Create `src/repositories/user.repository.js`:

```js
// src/repositories/user.repository.js
const { User } = require("../models");

const createUser = async (userData) => {
    const newUser = await User.create(userData);
    return newUser;
};

const findUserByEmail = async (email) => {
    const user = await User.findOne({ where: { email } });
    return user;
};

module.exports = {
    createUser,
    findUserByEmail,
};
```

## Step 3: Create the Auth Service (The Logic)

This is the most important file. This is where our security logic lives.

We need to:

1. Check if the email is already taken.

2. Hash the password.

3. Save the user.

Create `src/services/auth.service.js`:

```js
// src/services/auth.service.js
const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/ApiError");

const register = async (userData) => {
    // 1. Check if user already exists
    const existingUser = await userRepository.findUserByEmail(userData.email);
    if (existingUser) {
        throw new ApiError(409, "Email already in use");
    }

    // 2. Encrypt the password
    // 10 is the "salt rounds" - higher is safer but slower. 10 is standard.
    const encryptedPassword = await bcrypt.hash(userData.password, 10);

    // 3. Create the user in the database
    const newUser = await userRepository.createUser({
        name: userData.name,
        email: userData.email,
        password: encryptedPassword, // Save the HASH, not the plain text
    });

    // 4. Remove password from the returned object (Security Best Practice)
    // We convert the Sequelize model instance to a plain JSON object
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return userResponse;
};

module.exports = {
    register,
};
```

## Step 4: Create the Auth Controller

The controller simply receives the request and passes it to the service.

Create `src/controllers/auth.controller.js`:

```js
// src/controllers/auth.controller.js
const authService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");

const register = catchAsync(async (req, res) => {
    const result = await authService.register(req.body);

    res.status(201).json({
        status: "success",
        data: result,
    });
});

module.exports = {
    register,
};
```

## Step 5: Create the Auth Routes

Create `src/routes/auth.routes.js`:

```js
// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// POST /api/v1/auth/register
router.post("/register", authController.register);

module.exports = router;
```

## Step 6: Register the Routes

Finally, plug the new auth routes into our main router.

Open `src/routes/index.js`:

```js
// src/routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes"); // <--- Import
const postRoutes = require("./post.routes");
const healthController = require("../controllers/health.controller");

router.get("/health", healthController.checkHealth);

// Mount routes
router.use("/auth", authRoutes); // <--- /api/v1/auth/register
router.use("/posts", postRoutes);

module.exports = router;
```

## Step 7: Test Registration

Start your server (`npm run dev`) and open Postman.

Request:

Method: POST

URL: `http://localhost:3001/api/v1/auth/register`

Body (JSON):

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "supersecretpassword"
}
```

**Response**: You should see the user created, but without the password field.

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "updatedAt": "...",
        "createdAt": "..."
    }
}
```

**Verify Database**: If you look at your database table, the password column will look like gibberish (`$2a$10$ExampleHash...`). This is perfect! Even if you (the developer) look at the database, you cannot see the user's real password.

## Next Steps

We can create users, but they can't log in yet. In the next section, we will implement Login & JWT to allow users to authenticate and receive a secure token.
