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

    try {
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
    } catch (err) {
      console.error('[Email] SES send failed, falling back to console:', err);
      console.log(`[Email Verification] ${verifyUrl}`);
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<string | null> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    if (!this.sender) {
      console.log(`[Password Reset] ${resetUrl}`);
      return resetUrl;
    }

    try {
      await this.ses.send(
        new SendEmailCommand({
          FromEmailAddress: this.sender,
          Destination: { ToAddresses: [to] },
          Content: {
            Simple: {
              Subject: { Data: 'Reset your password — Teamsport' },
              Body: {
                Html: {
                  Data: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
                      <h2 style="color: #111;">Reset your password</h2>
                      <p style="color: #555; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to choose a new one.
                      </p>
                      <a href="${resetUrl}"
                         style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem;
                                background-color: #2563eb; color: #fff; text-decoration: none;
                                border-radius: 6px; font-weight: 500;">
                        Reset password
                      </a>
                      <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #888;">
                        If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </div>
                  `,
                },
              },
            },
          },
        }),
      );
    return null;
    } catch (err) {
      console.error('[Email] SES send failed, falling back to console:', err);
      console.log(`[Password Reset] ${resetUrl}`);
      return resetUrl;
    }
  }

  async sendJoinRequestEmail(
    to: string,
    userName: string,
    targetName: string,
    targetType: string,
  ): Promise<void> {
    if (!this.sender) {
      console.log(`[Join Request] ${userName} wants to join ${targetType} "${targetName}"`);
      return;
    }

    try {
      await this.ses.send(
        new SendEmailCommand({
          FromEmailAddress: this.sender,
          Destination: { ToAddresses: [to] },
          Content: {
            Simple: {
              Subject: { Data: `New join request — Teamsport` },
              Body: {
                Html: {
                  Data: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
                      <h2 style="color: #111;">New join request</h2>
                      <p style="color: #555; line-height: 1.6;">
                        <strong>${userName}</strong> has requested to join the ${targetType}
                        <strong>${targetName}</strong>. Log in to your admin dashboard to approve or reject
                        this request.
                      </p>
                      <a href="${this.appUrl}"
                         style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem;
                                background-color: #2563eb; color: #fff; text-decoration: none;
                                border-radius: 6px; font-weight: 500;">
                        Review request
                      </a>
                    </div>
                  `,
                },
              },
            },
          },
        }),
      );
    } catch (err) {
      console.error('[Email] SES send failed, falling back to console:', err);
      console.log(`[Join Request] ${userName} wants to join ${targetType} "${targetName}"`);
    }
  }

  async sendInviteEmail(to: string, token: string, organisationName: string): Promise<void> {
    const inviteUrl = `${this.appUrl}/invite?token=${token}`;

    if (!this.sender) {
      console.log(`[Invite] ${inviteUrl}`);
      return;
    }

    try {
      await this.ses.send(
        new SendEmailCommand({
          FromEmailAddress: this.sender,
          Destination: { ToAddresses: [to] },
          Content: {
            Simple: {
              Subject: { Data: `You've been invited to ${organisationName} — Teamsport` },
              Body: {
                Html: {
                  Data: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
                      <h2 style="color: #111;">You're invited!</h2>
                      <p style="color: #555; line-height: 1.6;">
                        You've been invited to join <strong>${organisationName}</strong> on Teamsport.
                        Click the button below to create your account.
                      </p>
                      <a href="${inviteUrl}"
                         style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem;
                                background-color: #2563eb; color: #fff; text-decoration: none;
                                border-radius: 6px; font-weight: 500;">
                        Accept invite
                      </a>
                      <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #888;">
                        If you weren't expecting this invite, you can safely ignore this email.
                      </p>
                    </div>
                  `,
                },
              },
            },
          },
        }),
      );
    } catch (err) {
      console.error('[Email] SES send failed, falling back to console:', err);
      console.log(`[Invite] ${inviteUrl}`);
    }
  }
}
