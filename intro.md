---
sidebar_position: 1
title: Project Setup & Dependencies
---

# Project Setup & Dependencies

Welcome to the tutorial. This guide establishes a definitive, opinionated foundation for building a scalable and production-ready REST API with Express.js.

We will not just build a simple server; we will set up a project structure that scales, implementing best practices from the start.

## Prerequisites

Before you begin, ensure you have the following tools installed on your system:

-   [**Node.js**](https://nodejs.org): The latest LTS (Long-Term Support) version is recommended.
-   [**npm**](https://npmjs.com) (or **yarn**): This tutorial will use `npm` commands.

---

## Step 1: Initialize Your Project

First, create a new directory for your project, navigate into it, and initialize a new Node.js project.

```bash
# Create and enter the project folder
mkdir express-api-tutorial
cd express-api-tutorial

# Initialize a new project with npm
# The -y flag accepts all the default settings
npm init -y
```

This creates a package.json file in your root directory. This file manages your project's metadata, dependencies, and scripts.

## Step 2: Install Dependencies

We'll install our dependencies in two groups:

-   Core Dependencies: Packages required for the application to run (e.g., express).

-   Development Dependencies: Tools used only for development, like nodemon for auto-reloading.

**Core Dependencies**

Run the following command to install the essential packages:

```bash
npm install express dotenv
```

:::note

-   express: The core Express.js framework. This is the only package required to create a minimal server.

-   dotenv: A package that loads environment variables from a .env file. We will use this in the very next step to manage our configuration securely.
    :::

**Development Dependencies**

Run the following command to install our primary development tool:

```bash
npm install nodemon --save-dev
```

:::note

-   nodemon: A tool that automatically restarts your server whenever it detects file changes in your project. This saves you from manually stopping and starting the server during development.

-   --save-dev (or -D): This flag tells npm to list nodemon under devDependencies in your package.json. These packages are not installed in a production environment, saving space.
    :::

## Step 3: Create the Initial Server File

Instead of cluttering our root directory, we'll follow a best practice by placing all our application code in a src folder.

1. Create a src directory:

```bash
mkdir src
```

2. Inside src, create your main server file, server.js:

```bash
# On Windows (cmd)
type nul > src\server.js

# On macOS/Linux
touch src/server.js
```

3. Open src/server.js and add the following code:

```js
// src/server.js
const express = require("express");
const app = express();

// We hard-code the port for now, but we will fix this in the next step!
const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Hello, Express!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

:::note
This is the most basic Express server possible. It starts a server and listens on port 3000, responding with "Hello, Express!" to any requests to the homepage (/).
:::

## Step 4: Add npm Scripts

To make running our server easy, we'll add scripts to our package.json file. Open package.json and replace the default "scripts" section with this:

```json
// package.json

"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

:::note

-   npm start: This is the standard command to run a Node.js application in production. It uses node directly.

-   npm run dev: This is our development command. It uses nodemon to watch our files and automatically restart the server on any change.
    :::

Step 5: Run Your Server
You're all set. Run the dev script from your terminal:

```bash
npm run dev
```

You should see the output from nodemon and our console.log:

```
[nodemon] starting `node src/server.js`
Server is running on port 3000
```

Open your browser and navigate to `http://localhost:3000`. You will see "Hello, Express!"

## Next Steps

Congratulations! You have a running Express server.

However, we have a problem: we hard-coded the port number (PORT = 3000) directly in our code. This is bad practice for security and portability.

In the next section, Configuration, we will fix this by using the dotenv package to create a secure and flexible configuration system.
