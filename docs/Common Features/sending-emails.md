---
sidebar_position: 2
title: Sending Emails (Resend)
---

# Sending Emails (Resend)

In a production application, you never want to clutter your Controllers with email logic or HTML template strings.

We will implement a dedicated **Email Service**. This allows any part of your application (Auth, Billing, Notifications) to say "Send an email" without knowing _how_ it gets delivered.

For this opinionated guide, we use **[Resend](https://resend.com)**. It is modern, developer-friendly, and has excellent deliverability compared to standard SMTP.

---

## Step 1: Install Dependencies

We need the official Resend SDK.

```bash
npm install resend
```

## Step 2: Update Configuration

Security Rule: Never hardcode your API keys.

Get your API Key: Sign up at [Resend.com](https://resend.com) and generate an API Key.

Update `.env`: For testing, Resend gives you a free testing domain (`onboarding@resend.dev`).

```ini
# .env
RESEND_API_KEY=re_123456_your_key_here
EMAIL_FROM=onboarding@resend.dev
```

3. Update `src/config/index.js`: Add the email config to our centralized object.

```js
// src/config/index.js
const config = {
    // ... other config
    email: {
        resendApiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    },
};

module.exports = Object.freeze(config);
```

## Step 3: Create the Email Service

Create `src/services/email.service.js`.

This is the most important part. We are abstracting the email provider. If you ever want to switch back to Nodemailer or SendGrid, you only have to change this one file. The rest of your app won't know the difference.

```js
// src/services/email.service.js
const { Resend } = require("resend");
const config = require("../config");
const ApiError = require("../utils/ApiError");

// Initialize Resend Client
const resend = new Resend(config.email.resendApiKey);

/**
 * Core function to send an email.
 * This wraps the Resend API so we can handle errors centrally.
 * * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
const sendEmail = async (to, subject, text, html = "") => {
    // In Development, Resend only allows sending to your own email
    // unless you verify a domain.

    const { data, error } = await resend.emails.send({
        from: config.email.from,
        to: to,
        subject: subject,
        text: text,
        html: html || text, // Use text as fallback
    });

    if (error) {
        console.error("❌ Email Error:", error);
        // We usually don't want to crash the app if an email fails,
        // so we just log it. But you could throw an error if critical.
        // throw new ApiError(500, 'Email could not be sent');
    } else {
        console.log(`✅ Email sent to ${to} (ID: ${data.id})`);
    }
};

/**
 * Business Logic: Send Welcome Email
 * * This function prepares the content. It doesn't care about "how" it is sent.
 */
const sendWelcomeEmail = async (to, name) => {
    const subject = "Welcome to ExpressJSTutorial!";

    const text = `Hi ${name},\n\nWelcome to our platform! We are glad to have you.`;

    // In a real app, you would use a template engine (like React Email) here
    const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h1>Hi ${name},</h1>
      <p>Welcome to <strong>ExpressJSTutorial</strong>!</p>
      <p>We are glad to have you on board.</p>
    </div>
  `;

    await sendEmail(to, subject, text, html);
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
};
```

## Step 4: Usage Example (Integration)

Now, let's use this service in our Auth Flow.

Open `src/services/auth.service.js` and import the email service.

```js
// src/services/auth.service.js
const emailService = require('./email.service'); // <--- Import
// ... other imports

const register = async (userData) => {
  // ... existing logic (hash password, create user) ...

  const newUser = await userRepository.createUser({ ... });

  // Send the email!
  // We use 'catch' here so that if the email fails, the registration
  // doesn't fail. The user is created regardless.
  emailService.sendWelcomeEmail(newUser.email, newUser.name)
    .catch(err => console.error('Failed to send welcome email:', err));

  return newUser;
};
```

Why is this Scalable?

1. Separation of Concerns: The AuthService doesn't know what an API Key is. It just asks for an email to be sent.

2. Safety: If Resend is down, we catch the error so the user can still sign up.

3. Simplicity: We are using modern tools (Resend) that keep our code clean and minimal, avoiding the bloated configuration of older SMTP libraries.
