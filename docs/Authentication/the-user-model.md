---
sidebar_position: 1
title: The User Model
---

# The User Model

Before we can log anyone in, we need a `User` entity.

In this section, we will define the User model and migration. We will also add a critical "opinionated" rule: **Passwords must never be stored in plain text.**

---

## Step 1: Generate Model & Migration

Run the Sequelize CLI command to generate the User model. We need `name`, `email`, and `password`.

```bash
npx sequelize-cli model:generate --name User --attributes name:string,email:string,password:string
```

## Step 2: Refine the Migration (Database Security)

Open the newly created migration file in `src/database/migrations/xxxx-create-user.js`.

The auto-generated migration is too loose. We need to add strict constraints:

1. Email must be unique. (Two users can't have the same email).

2. Fields cannot be null.

Update the `up` function:

```js
// src/database/migrations/xxxx-create-user.js
"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Users", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true, // <--- CRITICAL: No duplicate emails
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
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
        await queryInterface.dropTable("Users");
    },
};
```

Now, run the migration to create the table:

```bash
npx sequelize-cli db:migrate
```

## Step 3: Refine the Model (App Security)

Open `src/models/user.js`.

We need to update the `init` block to include validation. This ensures valid emails and prevents saving users without passwords.

```js
// src/models/user.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // define association here
            // e.g., User.hasMany(models.Post);
        }
    }

    User.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: { msg: "Name cannot be empty" },
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: { msg: "Must be a valid email address" }, // <--- Built-in Sequelize validation
                    notEmpty: { msg: "Email cannot be empty" },
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                // We do NOT enforce complexity here (e.g. "Must have 1 special char").
                // Why? Because this stores the HASHED password, which looks like gibberish.
                // Complexity validation belongs in the Joi/Service layer.
            },
        },
        {
            sequelize,
            modelName: "User",
        }
    );

    return User;
};
```

## Why no "Password Hashing" hook?

Many tutorials teach you to use Sequelize "Hooks" (like beforeCreate) to hash the password automatically inside the Model.

**We do not do this**.

In our **Opinionated Architecture**, business logic (like "Hashing a Password") belongs in the **Service Layer**, not hidden inside a Model hook. This makes the code explicit, easier to debug, and keeps the Model focused purely on data structure.

## Next Steps

We have our `Users` table ready. Now, let's build the Registration feature to safely create a new user and hash their password.
