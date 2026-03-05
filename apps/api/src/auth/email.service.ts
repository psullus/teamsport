import { Injectable } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

@Injectable()
export class EmailService {
  private ses = new SESv2Client({});
  private sender = process.env.EMAIL_SENDER;
  private appUrl = process.env.APP_URL;

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    if (!this.sender) {
      console.log(`[Email Verification] ${verifyUrl}`);
      return;
    }

    await this.ses.send(
      new SendEmailCommand({
        FromEmailAddress: this.sender,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: 'Verify your email — Teamsport' },
            Body: {
              Html: {
                Data: `
                  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
                    <h2 style="color: #111;">Verify your email</h2>
                    <p style="color: #555; line-height: 1.6;">
                      Click the button below to verify your email address and activate your account.
                    </p>
                    <a href="${verifyUrl}"
                       style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem;
                              background-color: #2563eb; color: #fff; text-decoration: none;
                              border-radius: 6px; font-weight: 500;">
                      Verify email
                    </a>
                    <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #888;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </div>
                `,
              },
            },
          },
        },
      }),
    );
  }
}
