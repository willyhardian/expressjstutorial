---
sidebar_position: 4
title: Pagination & Filtering
---

# Pagination & Filtering

As your application grows, you cannot just `findAll()` and return 1,000 records at once. It hurts performance and user experience.

You need **Pagination** (getting data in chunks) and **Filtering** (searching for specific data).

Instead of using a complex library that hides the logic, we will create a reusable utility to handle the math (`limit` and `offset`) for us.

---

## Step 1: Create Pagination Utilities

We need two helper functions:

1.  **`getPagination`**: Converts user input (`page=2`, `limit=10`) into database parameters (`offset=10`, `limit=10`).
2.  **`getPagingData`**: Converts the database result into a clean JSON API response (adding `currentPage`, `totalPages`).

Create `src/utils/pagination.js`:

```javascript
// src/utils/pagination.js

const getPagination = (page, size) => {
    const limit = size ? +size : 10; // Default to 10 items per page
    const offset = page ? (page - 1) * limit : 0;

    return { limit, offset };
};

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;
    const currentPage = page ? +page : 1;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, items, totalPages, currentPage };
};

module.exports = {
    getPagination,
    getPagingData,
};
```

## Step 2: Update the Repository

We need to update our repository to accept these new parameters.

We will also switch from `findAll` to `findAndCountAll`. This Sequelize method returns the data and the total count of records, which is essential for calculating "Total Pages."

Open `src/repositories/post.repository.js`:

```js
// src/repositories/post.repository.js
const { Post } = require("../models");
const { Op } = require("sequelize"); // <--- Import Sequelize Operators

const createPost = async (data) => {
    const newPost = await Post.create(data);
    return newPost;
};

/**
 * Find all posts with pagination and search support
 * @param {Object} condition - The "Where" clause (e.g. { title: { [Op.iLike]: '%search%' } })
 * @param {number} limit - How many items to return
 * @param {number} offset - How many items to skip
 */
const findAllPosts = async (condition, limit, offset) => {
    const data = await Post.findAndCountAll({
        where: condition,
        limit,
        offset,
        order: [["createdAt", "DESC"]], // Sort by newest first
    });

    return data;
};

module.exports = {
    createPost,
    findAllPosts,
};
```

## Step 3: Update the Service

The Service layer acts as the bridge. It extracts the query parameters, calls the utility to get the math right, calls the repository, and then formats the final output.

Open `src/services/post.service.js`:

```js
// src/services/post.service.js
const postRepository = require("../repositories/post.repository");
const { getPagination, getPagingData } = require("../utils/pagination");
const { Op } = require("sequelize");

// ... (createPost remains the same)

const getAllPosts = async (query) => {
    // 1. Extract Params
    const { page, size, title } = query;

    // 2. Build the "Search" condition
    // If a title is provided, search for it (case-insensitive). If not, get all.
    const condition = title ? { title: { [Op.iLike]: `%${title}%` } } : null;

    // 3. Calculate Pagination (Limit & Offset)
    const { limit, offset } = getPagination(page, size);

    // 4. Get Data from Repository
    const data = await postRepository.findAllPosts(condition, limit, offset);

    // 5. Format the response
    const response = getPagingData(data, page, limit);

    return response;
};

module.exports = {
    // ...
    getAllPosts,
};
```

## Step 4: Update the Controller

The controller logic remains very simple. It just passes req.query (where ?page=1 lives) into the service.

Open `src/controllers/post.controller.js`:

```js
// src/controllers/post.controller.js
// ... imports

const getPosts = catchAsync(async (req, res) => {
    // Pass the entire query object (req.query) to the service
    const result = await postService.getAllPosts(req.query);

    res.status(200).json({
        status: "success",
        data: result,
    });
});

// ...
```

## Step 5: Test It

1. Restart Server: npm run dev

2. Create Data: Create 3 or 4 posts using your POST /posts endpoint so you have data to test.

3. Test Pagination:

    - GET /api/v1/posts?page=1&size=2

    - Result: You should see only 2 items, and metadata telling you there are more pages.

```json
{
  "status": "success",
  "data": {
    "totalItems": 4,
    "items": [ ... ],
    "totalPages": 2,
    "currentPage": 1
  }
}
```

4. Test Filtering:

    - GET `/api/v1/posts?title=First`

    - Result: Only posts with "First" in the title will appear.

Why is this Scalable?

-   Performance: We are processing the limit at the Database Level (SQL LIMIT 10). We are not fetching 10,000 records and filtering them in JavaScript (which would crash your server).

-   Reusability: The `src/utils/pagination.js` file can be used for Users, Comments, Orders, or any other resource in your system.
