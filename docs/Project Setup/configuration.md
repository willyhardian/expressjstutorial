---
sidebar_position: 2
title: Configuration
---

# Configuration & Environment Variables

In the previous step, we set up a minimal Express server. However, we hard-coded the port number directly into our `src/server.js` file. This is bad practice.

A scalable and secure application **must never** store sensitive data (like database passwords, API keys) or environment-specific settings (like port numbers, database hosts) directly in the source code.

We manage this separation using **Environment Variables**. This guide follows the standard convention of using a `.env` file to manage this configuration locally.

---

## Why Use Environment Variables?

1.  **Security:** You never commit sensitive credentials (like database passwords or API keys) to version control (e.g., Git). This prevents secrets from being exposed to everyone who has access to the repository.
2.  **Portability:** You can define different configurations for different environments (development, staging, production) without changing any code. Your production server can use a different database and port than your local machine, simply by providing a different set of environment variables.
3.  **Flexibility:** It allows you and other developers on your team to customize settings locally without affecting anyone else.

To manage this, we use the `dotenv` package we installed in the "Project Setup" step. This package loads variables from a file named `.env` directly into Node.js's `process.env` object, making them accessible throughout your application.

---

## Step 1: Create `.env` and `.env.example`

In the **root** of your project directory (the same level as `package.json`), create two new files:

1.  `.env`
2.  `.env.example`

### .env (The Secret File)

This file will contain your actual configuration values for your _local development_ environment. It **must not** be committed to Git.

Open `.env` and add your first variable:

```ini
# .env
PORT=3001
NODE_ENV=development
```

:::note

-   PORT=3001: We'll use this to tell our server which port to run on.

-   NODE_ENV=development: This is a standard variable used to tell Node.js (and many packages) that we are in "development" mode.
    :::

### .env.example (The Template File)

This file is a template that shows what variables the application needs to run. It is committed to Git. It serves as a guide for other developers to know what variables they need to create in their own .env file.

It should never contain sensitive values.

```ini
# .env.example

PORT=
NODE_ENV=
```

## Step 2: Update .gitignore (Critical Security)

Before you do anything else, you must prevent your .env file from ever being committed to your repository.

Open your .gitignore file (create one in the root if it doesn't exist) and add .env to it:

```
# .gitignore

# Dependencies
node_modules/

# Environment Variables
.env
```

This tells Git to ignore the .env file completely. Now, you can safely commit the .env.example file as a template for your team.

## Step 3: Centralize Your Configuration

While `dotenv` loads variables into `process.env`, directly accessing `process.env.PORT` all over your application can become messy and hard to manage.

A best practice is to create a single, centralized configuration file that imports, validates, and exports all your settings.

1. Create a new folder: `src/config`

2. Inside that folder, create a new file: `index.js`

Add the following code to `src/config/index.js`:

```js showLineNumbers
// src/config/index.js

const dotenv = require("dotenv");

// Load .env file contents into process.env
// This should be at the very top of your application's entry point
dotenv.config();

/**
 * We will later use a library like Joi to validate environment variables
 * This ensures that our application has all the required variables
 * and that they are of the correct type.
 *
 * For now, we'll just load the variables directly.
 */

const config = {
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || "development",
    },

    // Future database config
    // db: {
    //   host: process.env.DB_HOST,
    //   port: process.env.DB_PORT,
    //   user: process.env.DB_USER,
    //   pass: process.env.DB_PASS,
    //   name: process.env.DB_NAME,
    // }
};

// We freeze the object to prevent accidental modifications
module.exports = Object.freeze(config);
```

What is this file doing?

1. It loads dotenv.config() at the very top. This is the only place we will need to do this.

2. It creates a clean, nested config object.

3. It reads the values from process.env.

4. It provides sensible default values (e.g., || 3000) in case a variable isn't defined in the .env file.

5. It exports the configuration object for the rest of our app to use.

## Step 4: Update server.js

Finally, let's update our src/server.js file to use this new configuration file.

Notice that we no longer need require('dotenv').config() here, because our config file already handles it. We also no longer need to hard-code the PORT.

```js showLineNumbers
// src/server.js

// Import our centralized configuration
// This must be at the top
const config = require("./src/config");

const express = require("express");
const app = express();

// Use the port and env from our config object
const PORT = config.app.port;
const ENV = config.app.env;

app.get("/", (req, res) => {
    res.send("Hello, Express!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${ENV} mode.`);
});
```

Now, run your server again:

```bash
npm run dev
```

You should see the following output in your terminal, confirming that it's correctly loading the variables from your .env file:

```bash
[nodemon] starting `node src/server.js`
Server is running on port 3001 in development mode.
```

:::info
If you stop the server, delete your .env file, and run npm run dev again, you will see it use the defaults:

```
[nodemon] starting `node src/server.js`
Server is running on port 3000 in development mode.
```

:::

You have now successfully decoupled your application's configuration from its code. This is a foundational step for building a scalable and secure backend.
