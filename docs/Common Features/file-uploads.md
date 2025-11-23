---
sidebar_position: 1
title: File Uploads (Multer)
---

# File Uploads

Handling file uploads in Express is notoriously tricky. The "unopinionated" way often leads to messy routes mixed with file system logic.

We will use **Multer** (a middleware) to handle the incoming file, but we will keep our business logic strictly in the **Service Layer**.

---

## Step 1: Install Dependencies

```bash
npm install multer
```

## Step 2: Create Upload Middleware

We need a configuration file to tell Multer where to store files. For this tutorial, we will store them locally in a `public/uploads` folder.

Create `src/middlewares/upload.middleware.js`:

```js
// src/middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/ApiError");

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/"); // Files will be saved here
    },
    filename: (req, file, cb) => {
        // Generate unique filename: user-1-123456789.jpg
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

// Filter files (Images only)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Not an image! Please upload an image."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 2, // Limit: 2MB
    },
});

module.exports = upload;
```

:::note
You must create the folder public/uploads in your project root manually, or the code might crash on the first run.
:::

```bash
mkdir -p public/uploads
```

## Step 3: Update the User Model

We need a place to store the filename in the database.

1. Generate Migration:

```bash
npx sequelize-cli migration:generate --name add-avatar-to-users
```

2. Edit Migration:

```js
// src/database/migrations/xxxx-add-avatar.js
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Users", "avatar", {
            type: Sequelize.STRING,
            allowNull: true, // Optional field
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Users", "avatar");
    },
};
```

3. Run Migration: `npx sequelize-cli db:migrate`

4. Update Model: Add avatar: `DataTypes.STRING` to your `src/models/user.js`.

## Step 4: Update User Service

Here is the Opinionated Part. The Controller will give the file details to the Service. The Service decides what to do (e.g., delete old avatar, save new URL).

Update `src/services/user.service.js` (Create this file if it doesn't exist, or add to it):

```js
// src/services/user.service.js
const userRepository = require("../repositories/user.repository"); // You'll need to add update methods here
const { User } = require("../models");

const updateAvatar = async (userId, file) => {
    // 1. Construct the file path/URL
    // In production, this would be a Cloudinary/S3 URL
    const avatarUrl = `/uploads/${file.filename}`;

    // 2. Update the user in DB
    // (Assuming you have an update method in repository, or use Model direct for brevity here)
    await User.update({ avatar: avatarUrl }, { where: { id: userId } });

    return avatarUrl;
};

module.exports = {
    updateAvatar,
};
```

## Step 5: Create the Route & Controller

We will add this to a new user.routes.js or your existing routes.

The Controller (`src/controllers/user.controller.js`):

```js
const userService = require("../services/user.service");
const catchAsync = require("../utils/catchAsync");

const uploadAvatar = catchAsync(async (req, res) => {
    if (!req.file) {
        throw new Error("Please upload a file");
    }

    const avatarUrl = await userService.updateAvatar(req.user.id, req.file);

    res.status(200).json({
        status: "success",
        data: { avatar: avatarUrl },
    });
});

module.exports = { uploadAvatar };
```

The Route (`src/routes/user.routes.js`):

```js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// POST /api/v1/users/avatar
// 1. Authenticate (Must be logged in)
// 2. Upload Middleware (Handles the file stream)
// 3. Controller (Handles the logic)
router.post(
    "/avatar",
    authenticate,
    upload.single("avatar"),
    userController.uploadAvatar
);

module.exports = router;
```

## Step 6: Serving Static Files

Finally, for the user to actually see the image, we must tell Express to serve the `public` folder.

Open `src/app.js`:

```js
const path = require("path");

// ... existing imports

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "../public")));

// ... existing routes
```

Now, if you upload an image, you can view it in your browser at `http://localhost:3001/uploads/filename.jpg`.

