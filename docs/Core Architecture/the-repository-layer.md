---
sidebar_position: 7
title: The Repository Layer
---

# The Repository Layer (Data Access)

We have separated HTTP (Controller) from Logic (Service). But our Service currently contains this line:

```javascript
const newPost = { id: Date.now(), ...postData }; // Simulating a database save
```

This is bad practice. Services should not know how data is saved.

If you put SQL queries inside your Service, your business logic becomes tightly coupled to your database. If you want to switch from MongoDB to SQL, or write a unit test without a real database, you have to rewrite your Service.

We solve this with The Repository Layer.

Repositories are "Database Clerks." Their only job is to talk to the database (Select, Insert, Update, Delete). They return pure JavaScript objects to the Service.

## Step 1: Create a Repository

Create a new file: src/repositories/post.repository.js

For now, we will continue to simulate a database. Later, in the Database section, we will replace this code with real Sequelize commands, but the method names will stay the same.

```js
// src/repositories/post.repository.js

/**
 * Simulates a database table.
 * In a real app, this would be your database connection (e.g., Sequelize Model).
 */
const _fakeDb = [];

const createPost = async (data) => {
    // Simulate Database logic
    const newRecord = {
        id: Date.now(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    _fakeDb.push(newRecord); // "Saving" to the array

    return newRecord;
};

// We'll add more methods later, like:
// const findAll = async () => { ... }
// const findById = async (id) => { ... }

module.exports = {
    createPost,
};
```

## Step 2: Refactor the Service

Now, update `src/services/post.service.js`. We will remove the "fake data creation" logic and instead ask the Repository to do it.

```js
// src/services/post.service.js
const postRepository = require("../repositories/post.repository"); // <--- Import Repository
const ApiError = require("../utils/ApiError");

const createPost = async (postData) => {
    // 1. Business Logic: Validation
    if (!postData.title) {
        throw new ApiError(400, "Title is required");
    }

    // 2. Business Logic: Prepare data for the database
    // The service decides WHAT to save (e.g., setting default status)
    const dataToSave = {
        title: postData.title,
        content: postData.content,
        status: "published", // Default status logic
    };

    // 3. Call the Repository to save it
    // The service doesn't care if it's SQL, Mongo, or a text file.
    const savedPost = await postRepository.createPost(dataToSave);

    return savedPost;
};

module.exports = {
    createPost,
};
```

## The Full Architecture Flow

You have now implemented the complete Controller-Service-Repository pattern.

Here is the lifecycle of a request in your new system:

1. Request: The user sends `POST /posts`.

2. Route: `post.routes.js` receives it and points to `post.controller.js`.

3. Controller: Extracts `req.body` and calls `postService.createPost()`.

4. Service: Validates the title (Business Logic) and `calls postRepository.createPost()`.

5. Repository: "Saves" the data to the database (Data Access) and returns the new record.

6. Response: The data travels back up the chain (Repo -> Service -> Controller) and is sent as JSON.

## Why did we do all this work?

It might seem like overkill for a simple "Create Post," but this architecture is scalable:

Testing: You can now write a unit test for `post.service.js` that mocks the repository. You can test your validation logic without ever needing a running database.

Flexibility: If you change your database ORM in the future, you only change the `src/repositories` folder. Your Controllers and Services don't change at all.

Clarity: When you open a file, you know exactly what to expect. No more hunting through 500-line files to find a SQL query.

## Next Steps

We have a perfect architecture, but it relies on fake data. It's time to get real.

In the next category, Database & Sequelize, we will install PostgreSQL and replace our fake repository code with real database queries.
