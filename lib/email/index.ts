import nodemailer from "nodemailer";
import { getInviteEmailTemplate } from "./templates/invite";
import { getResetPasswordEmailTemplate } from "./templates/resetPassword";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendInviteEmail(to: string, token: string) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${token}`;

  const { subject, html } = getInviteEmailTemplate({ inviteUrl });

  const mailOptions = {
    from: `"Bean Counter" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/resetPassword/${token}`;

  const { subject, html } = getResetPasswordEmailTemplate({ resetUrl });

  const mailOptions = {
    from: `"Bean Counter" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}
