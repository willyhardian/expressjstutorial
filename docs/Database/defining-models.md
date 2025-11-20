---
sidebar_position: 9
title: Defining Models
---

# Defining Models

In Sequelize, a **Model** is a JavaScript class that represents a table in your database. It defines the columns (title, content) and their data types (String, Text, Integer).

When you ask the Repository to `Post.create()`, Sequelize looks at this Model to know how to construct the SQL query.

---

## Step 1: Generate the Model

We will use the Sequelize CLI to generate our Post model. This is better than writing it from scratch because it automatically creates a corresponding **Migration** file (which we will use in the next step).

Run this command in your terminal:

```bash
npx sequelize-cli model:generate --name Post --attributes title:string,content:text,status:string
```

-   --name Post: The name of the model (Singular, PascalCase). Sequelize will automatically pluralize this to make the table name Posts.

-   --attributes ...: The list of columns and their types.

You should see output indicating that two files were created:

1. `src/models/post.js` (The Model)

2. `src/database/migrations/XXXXXXXXXXXXXX-create-post.js` (The Migration)

## Step 2: Understand the Model Structure

Open the newly created `src/models/post.js`.

It generates a standard class-based structure that works with the Sequelize autoloader. Let's clean it up and understand what's happening.

```js
// src/models/post.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Post extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            // Example: this.belongsTo(models.User);
        }
    }

    Post.init(
        {
            title: DataTypes.STRING,
            content: DataTypes.TEXT,
            status: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "Post",
        }
    );

    return Post;
};
```

**Key Concepts:**

-   `Post.init`: This is where we define the schema. Notice we only passed title, content, and status.

-   **Automatic Fields**: You might notice id, createdAt, and updatedAt are missing. Sequelize (and the migration) adds these automatically by default.

-   `DataTypes`: These map to database types (e.g., `DataTypes.STRING` becomes `VARCHAR(255)` in Postgres).

## Step 3: Refine the Model (Opinionated Best Practice)

The default generator is a bit too simple for a production app. We should add validations and defaults to ensure data integrity at the code level.

Update your `src/models/post.js` init block to look like this:

```js
// ... inside Post.init({ ... })

Post.init(
    {
        title: {
            type: DataTypes.STRING,
            allowNull: false, // Validation: Title cannot be empty
            validate: {
                notEmpty: { msg: "Title is required" },
            },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "draft", // Default value if none provided
            validate: {
                isIn: [["draft", "published", "archived"]], // Validation: Enum check
            },
        },
    },
    {
        sequelize,
        modelName: "Post",
        // Optional: Start table names with lowercase if you prefer
        // tableName: 'posts',
    }
);
```

**Why add validation here?** Even though we validate in the Service/Controller, adding validation to the Model is the "final line of defense." It ensures that bad data can never enter the database, even if a developer makes a mistake in the Service layer.

## A Note on the Migration File

You noticed that `sequelize-cli` also created a file in `src/database/migrations`.

Do not run the app yet. Even though we defined the Model code, the table does not exist in the database yet.

If you try to run `Post.create()` now, it will fail with `relation "Posts" does not exist`.

To actually create the table, we need to run the migration. We will cover this in the very next section.
