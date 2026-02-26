// Email service — isolated Nodemailer setup
// All email sending flows through here so SMTP config and templates
// are in one place. Swap transporter for SES/SendGrid without touching
// any other file.
import nodemailer from 'nodemailer';
import config from '../config/env.config.js';

// Create transporter once at module load — reused across all sends
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  // port 465 = SSL, port 587 = STARTTLS
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

/**
 * Verify SMTP connection on startup (non-fatal — logs warning if it fails)
 */
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
  } catch (err) {
    console.warn(`[Email] SMTP connection failed: ${err.message}`);
  }
};

/**
 * Core send function — all other helpers call this
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
};

/**
 * Sends the forgot-password email with the reset link.
 * The link contains the raw (un-hashed) token — only valid for 15 minutes.
 *
 * @param {string} toEmail  - Recipient email address
 * @param {string} name     - Recipient name for personalisation
 * @param {string} rawToken - Plain reset token (NOT the hashed version)
 */
export const sendPasswordResetEmail = async (toEmail, name, rawToken) => {
  // Frontend reset page URL — token passed as query param
  const resetUrl = `${config.cors.clientUrl}/reset-password?token=${rawToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Reset your Prometrix password</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a1a2e; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header span { color: #7c6af7; }
        .body { padding: 36px 40px; color: #333333; }
        .body p { line-height: 1.6; margin: 0 0 16px; }
        .btn-wrap { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; padding: 14px 32px; background: #7c6af7; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold; letter-spacing: 0.5px; }
        .notice { font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 8px; }
        .url-fallback { word-break: break-all; font-size: 12px; color: #aaaaaa; }
        .footer { background: #f4f4f7; padding: 16px 40px; text-align: center; font-size: 12px; color: #aaaaaa; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Prometrix</h1>
        </div>
        <div class="body">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset the password for your Prometrix account. Click the button below to choose a new password:</p>
          <div class="btn-wrap">
            <a href="${resetUrl}" class="btn">Reset My Password</a>
          </div>
          <p class="notice">
            ⏱ This link expires in <strong>15 minutes</strong>.<br/>
            If you did not request a password reset, you can safely ignore this email — your password will not change.
          </p>
          <p class="url-fallback">
            If the button doesn't work, paste this URL into your browser:<br/>
            ${resetUrl}
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PromptForge. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: 'Reset your PromptForge password (expires in 15 minutes)',
    html,
  });
};

/**
 * Sends a confirmation email after password has been successfully reset.
 */
export const sendPasswordChangedEmail = async (toEmail, name) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <title>Password changed</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a1a2e; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .header span { color: #7c6af7; }
        .body { padding: 36px 40px; color: #333333; }
        .body p { line-height: 1.6; margin: 0 0 16px; }
        .success-badge { display: inline-block; background: #e6f9f0; color: #1a8a55; border-radius: 4px; padding: 6px 14px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
        .footer { background: #f4f4f7; padding: 16px 40px; text-align: center; font-size: 12px; color: #aaaaaa; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Prometrix</h1>
        </div>
        <div class="body">
          <p>Hi <strong>${name}</strong>,</p>
          <div><span class="success-badge">✓ Password changed successfully</span></div>
          <p>Your Prometrix account password was just updated. You can now log in with your new password.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Prometrix. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: toEmail,
    subject: 'Your Prometrix password has been changed',
    html,
  });
};
