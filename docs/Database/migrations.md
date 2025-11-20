---
sidebar_position: 10
title: Migrations
---

# Migrations

We have defined our `Post` model in JavaScript, but if you check your PostgreSQL database, the `Posts` table **does not exist yet**.

To create it, we use **Migrations**.

### What is a Migration?

Think of migrations as **Version Control (Git) for your database**.

-   They allow you to modify your database schema (create tables, add columns) over time.
-   They provide a history of changes.
-   They let you "undo" changes if something goes wrong.

:::danger Stop! Do not use sync()
Many tutorials teach `sequelize.sync({ force: true })`. **Never use this in production.** It deletes your tables and recreates them, wiping out all your data. Migrations are the only professional way to handle database changes.
:::

---

## Step 1: Edit the Migration File

When we ran the model generator in the previous step, Sequelize automatically created a file in `src/database/migrations` (e.g., `2025...-create-post.js`).

**Crucial Step:** The auto-generated file is basic. It doesn't know about the `defaultValue` or `allowNull` rules we added to our Model. We must add them manually to ensure our Database rules match our App rules.

Open the migration file and update the `up` function:

```javascript
// src/database/migrations/XXXXXXXXXXXXXX-create-post.js
"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Posts", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false, // <--- ADD THIS (Match Model validation)
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false, // <--- ADD THIS
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "draft", // <--- ADD THIS
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Posts");
    },
};
```

Now, our Database (Postgres) will physically reject any attempt to save a Post without a title, acting as a final safety net.

## Step 2: Run the Migration

Now, let's apply this change to your running database.

Run the following command in your terminal:

```bash
npx sequelize-cli db:migrate
```

You should see output confirming the migration was executed:

```bash
== 20251120123456-create-post: migrating =======
== 20251120123456-create-post: migrated (0.023s)
```

## Step 3: Verify in Database

Open your database GUI (pgAdmin, TablePlus, DBeaver) and look at your express_tutorial_dev database.

You will now see two tables:

1. `Posts`: Your new table. If you inspect the structure, you will see `title` is set to `NOT NULL` and status has a default of `'draft'`.

2. `SequelizeMeta`: This is a special table Sequelize uses internally. It creates a list of executed migrations so it knows not to run the same file twice.

## Step 4: Undo (Reverting)

One of the best features of migrations is the ability to "undo" if you made a mistake.

To revert the last migration, run:

```bash
npx sequelize-cli db:migrate:undo
```

This will run the `down` function in your migration file (dropping the `Posts` table).

For now, make sure you keep the migration APPLIED (run `db:migrate` again if you undid it). We need the table to exist for the final step.

## Next Steps

Our database is ready! We have a real Posts table with the correct structure and safety rules.

Now we need to update our code. We are currently using a "fake array" in our Repository. In the final section, Refactoring the Repository, we will delete that fake code and connect our application to this new database table.
