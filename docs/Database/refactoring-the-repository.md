---
sidebar_position: 11
title: Refactoring the Repository
---

# Refactoring the Repository

We have a running PostgreSQL database and a `Posts` table. However, our application is still saving data to a fake JavaScript array in `src/repositories/post.repository.js`.

In this final step, we will delete that fake code and connect our **Repository Layer** to **Sequelize**.

---

## Step 1: Update the Repository

Open `src/repositories/post.repository.js`. We will import our database models and replace the array logic with Sequelize queries.

```javascript
// src/repositories/post.repository.js
const { Post } = require("../models"); // Import the Sequelize Model

const createPost = async (data) => {
    // Sequencing 'create' saves the data to Postgres automatically
    const newPost = await Post.create(data);
    return newPost;
};

// Let's add a read method to prove data persistence!
const findAllPosts = async () => {
    const posts = await Post.findAll();
    return posts;
};

module.exports = {
    createPost,
    findAllPosts,
};
```

**Notice**: We did not have to change the method signature. It still takes `data` and returns a `promise`. This means our Service layer (mostly) doesn't even need to know we switched databases!

## Step 2: Update the Service

We added a new feature (`findAllPosts`) to the repository. Let's expose that in the Service layer.

Open `src/services/post.service.js` and add the `getAllPosts` function.

```js
// src/services/post.service.js
const postRepository = require("../repositories/post.repository");
const ApiError = require("../utils/ApiError");

const createPost = async (postData) => {
    if (!postData.title) {
        throw new ApiError(400, "Title is required");
    }

    // Prepare data (Sequelize will handle the ID and timestamps)
    const dataToSave = {
        title: postData.title,
        content: postData.content,
        status: "published",
    };

    const savedPost = await postRepository.createPost(dataToSave);
    return savedPost;
};

// New method to get all posts
const getAllPosts = async () => {
    const posts = await postRepository.findAllPosts();
    return posts;
};

module.exports = {
    createPost,
    getAllPosts, // Export the new function
};
```

## Step 3: Update the Controller

Now, let's allow the outside world to call this new feature.

Open `src/controllers/post.controller.js`:

```js
// src/controllers/post.controller.js
const postService = require("../services/post.service");
const catchAsync = require("../utils/catchAsync");

const createPost = catchAsync(async (req, res) => {
    const postData = req.body;
    const result = await postService.createPost(postData);

    res.status(201).json({
        status: "success",
        data: result,
    });
});

// New handler
const getPosts = catchAsync(async (req, res) => {
    const result = await postService.getAllPosts();

    res.status(200).json({
        status: "success",
        data: result,
    });
});

module.exports = {
    createPost,
    getPosts, // Export the new handler
};
```

## Step 4: Update the Route

Finally, add the GET route.

Open `src/routes/post.routes.js`:

```js
// src/routes/post.routes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");

// POST /api/v1/posts (Create)
router.post("/", postController.createPost);

// GET /api/v1/posts (Read)
router.get("/", postController.getPosts);

module.exports = router;
```

## Step 5: Verify Persistence (The Final Test)

This is the most important test of the entire tutorial.

Start your server: `npm run dev`

Create a Post:

Send a POST request to `http://localhost:3001/api/v1/posts`.

Body: `{"title": "Real Database Post", "content": "This is saved in Postgres!"}`.

Verify Response: You should see the created post with an id (likely 1) and createdAt timestamp.

Restart the Server: Go to your terminal, press Ctrl+C to stop, and run npm run dev again.

Get Posts:

Send a GET request to `http://localhost:3001/api/v1/posts`.

**Success:** You should receive the post you created before the restart.

```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "title": "Real Database Post",
            "content": "This is saved in Postgres!",
            "status": "draft",
            "createdAt": "2025-11-20T...",
            "updatedAt": "2025-11-20T..."
        }
    ]
}
```

If you see this, congratulations! You have successfully built a full-stack, scalable API using the Controller-Service-Repository pattern with a real PostgreSQL database.

**Conclusion**
You now have the "Golden Stack":

1. **Express.js** for the server.
2. **Sequelize** for the database.
3. **C-S-R Architecture** for scalability.
4. **Centralized Error Handling** for reliability.
