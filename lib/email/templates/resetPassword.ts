type ResetPasswordEmailProps = {
  resetUrl: string;
  expiryMinutes?: number;
};

export function getResetPasswordEmailTemplate({
  resetUrl,
  expiryMinutes = 30,
}: ResetPasswordEmailProps) {
  return {
    subject: "Reset your password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <img src="${process.env.NEXT_PUBLIC_APP_URL}/brand/icon-192.png" width="48" height="48" alt="Bean Counter" style="display: block; margin: 0 auto 16px auto; border: 0; border-radius: 10px;">
                      <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                        Reset Your Password 🔐
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 40px 30px 40px;">
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.5;">
                        Hello,
                      </p>
                      <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password for your <strong>Bean Counter</strong> account.
                      </p>
                      <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.5;">
                        Click the button below to set a new password:
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px; line-height: 1.5;">
                        This link will expire in <strong>${expiryMinutes} minutes</strong>.
                      </p>
                      <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">
                        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 0 0 16px 0; color: #a0aec0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                        — Bean Counter Team
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}
