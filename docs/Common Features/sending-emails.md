---
sidebar_position: 2
title: Sending Emails (Nodemailer)
---

# Sending Emails

In a production application, you never want to clutter your Controllers with SMTP configuration or HTML template strings.

We will implement a dedicated **Email Service**. This allows any part of your application to say "Send an email to X" without worrying about _how_ it gets delivered.

---

## Step 1: Install Dependencies

We will use **Nodemailer**, the standard library for Node.js email sending.

```bash
npm install nodemailer
```

## Step 2: Update Configuration

Security Rule: Never hardcode your email credentials.

1. Update `.env`: For development, we recommend using [Mailtrap](https://mailtrap.io) or [Ethereal Email](https://ehtereal.email). They catch emails so you don't accidentally spam real users.

```ini
# .env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
EMAIL_FROM=noreply@myapp.com
```

2. Update `src/config/index.js`: Add the email config to our centralized object.

```js
// src/config/index.js
const config = {
    // ... other config
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        },
        from: process.env.EMAIL_FROM,
    },
};

module.exports = Object.freeze(config);
```

## Step 3: Create the Email Service

Create `src/services/email.service.js`.

This service will handle the connection to the SMTP provider. We will create a generic `sendEmail` function that can be reused everywhere.

```js
// src/services/email.service.js
const nodemailer = require("nodemailer");
const config = require("../config");

// 1. Create the Transporter (The Connection)
const transporter = nodemailer.createTransport(config.email.smtp);

/**
 * Verify connection configuration (Optional, runs on startup)
 */
if (config.app.env !== "test") {
    transporter
        .verify()
        .then(() => console.log("✅ Connected to Email Server"))
        .catch((err) =>
            console.error("❌ Unable to connect to email server:", err)
        );
}

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
const sendEmail = async (to, subject, text, html = "") => {
    const msg = {
        from: config.email.from,
        to,
        subject,
        text,
        html: html || text, // Fallback to text if no HTML provided
    };

    await transporter.sendMail(msg);
};

/**
 * Pre-defined template: Send Welcome Email
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 */
const sendWelcomeEmail = async (to, name) => {
    const subject = "Welcome to ExpressJSTutorial!";
    const text = `Hi ${name},\n\nWelcome to our platform! We are glad to have you.`;
    // In a real app, you might load an HTML template file here
    const html = `<h1>Hi ${name},</h1><p>Welcome to our platform!</p>`;

    await sendEmail(to, subject, text, html);
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
};
```

## Step 4: Usage Example (Architecture Check)

Now, how do we use this?

The Wrong Way: Importing nodemailer inside a Controller.

The Right Way (C-S-R Pattern): Your Controller calls a Service (e.g., `AuthService`), and that Service calls the `EmailService`.

Example: Integrating into Registration

Open `src/services/auth.service.js`:

```js

// src/services/auth.service.js
const emailService = require('./email.service'); // <--- Import the service

const register = async (userData) => {
  // ... existing logic (check email, hash password, create user) ...

  const newUser = await userRepository.createUser({ ... });

  // Send the email!
  // We don't 'await' this if we don't want to delay the response to the user.
  // Or we can await it if email delivery is critical.
  await emailService.sendWelcomeEmail(newUser.email, newUser.name);

  return newUser;
};
```

**Why this is Scalable**

1. Decoupling: If you switch from SMTP to SendGrid API later, you only change src/services/email.service.js. The rest of your app (Auth, Orders, etc.) doesn't need to know.

2. Testing: You can easily mock emailService.sendEmail in your unit tests so you don't actually send emails when testing your registration flow.
