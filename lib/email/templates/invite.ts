type InviteEmailProps = {
  inviteUrl: string;
  expiryDays?: number;
};

export function getInviteEmailTemplate({
  inviteUrl,
  expiryDays = 7,
}: InviteEmailProps) {
  return {
    subject: "You're invited to join Bean Counter",
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
                        You're Invited! ☕
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
                        You have been invited to join <strong>Bean Counter</strong>, the coffee shop inventory system.
                      </p>
                      <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.5;">
                        Click the button below to accept your invitation and set up your account:
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                              Accept Invitation
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px; line-height: 1.5;">
                        This invitation expires in <strong>${expiryDays} days</strong>.
                      </p>
                      <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">
                        If you didn't expect this invitation, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 8px 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                        ${inviteUrl}
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
