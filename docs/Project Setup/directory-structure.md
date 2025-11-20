---
sidebar_position: 3
title: Directory Structure
---

# Directory Structure

So far, our project is simple. We have a `package.json` and a `src` folder containing:

```
src/
├── config/
    │
    └── index.js
└── server.js
```

In the `server.js` file, we define and run our Express app. This is fine for a tiny project, but it will quickly become a single, thousand-line file that is impossible to maintain.

To build a scalable API, we must separate our concerns. The "opinion" of this tutorial is the **Controller-Service-Repository (C-S-R)** pattern. Our directory structure is designed to enforce this pattern, ensuring every file has one specific job.

---

## Step 1: Create the Project Folders

First, let's create the directories that will hold our application logic.

Inside the `src/` directory, create the following new folders:

Make sure you are in the root of your project

```bash
# On macOS/Linux
mkdir -p src/{controllers,services,repositories,routes,middlewares,utils}
```

```bash
# On Windows (cmd)
mkdir src\controllers src\services src\repositories src\routes src\middlewares src\utils
```

**Why these folders? (The C-S-R Pattern)**
This structure is the physical foundation of our architecture. Here is the responsibility of each folder:

-   src/config/ (Done)

    -   Job: Holds our centralized configuration (like index.js).

-   src/routes/

    -   Job: The "Signposts." These files define your API endpoints (e.g., GET /users, POST /posts) and do nothing but point them to the correct Controller function.

-   src/controllers/

    -   Job: The "Traffic Cops." Their only job is to handle the raw HTTP request and response. They manage req, res, and next. They call a Service to do the real work and then send the response.

-   src/services/

    -   Job: The "Brains." This is where all your business logic lives. Calculating a total, registering a user, or processing data all happens here. A service cannot access the database directly; it must ask a Repository.

-   src/repositories/

    -   Job: The "Database Clerks." Their only job is to read from and write to the database (using our ORM, Sequelize). They contain all the SQL or ORM queries.

-   src/middlewares/

    -   Job: Functions that run between the request and the controller (e.g., checking if a user is authenticated, logging requests).

-   src/utils/

    -   Job: Reusable helper functions that don't fit anywhere else (e.g., date formatters, API response wrappers).

## Step 2: Separate the Server from the App

Our current src/server.js has two jobs:

1. It creates and configures the Express app (e.g., app.get(...)).

2. It starts the server (i.e., app.listen(...)).

This makes testing difficult, because you can't import the app object for testing without also starting the server.

We will fix this by splitting it into two files:

-   src/app.js: Will create and configure the Express app, then export it.

-   src/server.js: Will import the app and tell it to listen. This file becomes our main entry point.

1. Rename your server file: First, rename src/server.js to src/app.js.

```bash
# On macOS/Linux
mv src/server.js src/app.js
```

```bash
# On Windows (cmd)
ren src\server.js app.js
```

2. Modify src/app.js: Open the new src/app.js. Remove the config import (we don't need it here) and the entire app.listen() block. Instead, export the app object at the end.

The file should now look like this:

```js showLineNumbers
// src/app.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hello, Express!");
});

// Export the app for server.js to use
module.exports = app;
```

3. Create the new src/server.js: Now, create a new file at src/server.js. This file will be our new entry point.

```js showLineNumbers
// src/server.js
const config = require("./config");
const app = require("./app");

const PORT = config.app.port;
const ENV = config.app.env;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${ENV} mode.`);
});
```

This is a much cleaner pattern. src/app.js builds the app, and src/server.js runs it. Your package.json scripts ("start": "node src/server.js") will work without any changes.

## Final Project Structure

Your project should now look like this. This professional structure is the foundation we will build upon for the rest of the tutorial.

```
express-api-tutorial/
├── .env
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
└── src/
    ├── app.js           <-- Our Express app configuration
    ├── config/
    │   └── index.js
    ├── controllers/
    ├── middlewares/
    ├── repositories/
    ├── routes/
    ├── server.js        <-- Our app's main entry point (runs the server)
    ├── services/
    └── utils/
```

## Next Steps

We have a professional, scalable folder structure. Now, let's use it to build our first proper feature: a simple "Health Check" route that uses our new Route and Controller pattern.
