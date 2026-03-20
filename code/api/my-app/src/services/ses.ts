import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import "dotenv/config";

const ses = new SESClient({ region: process.env.AWS_REGION || "eu-west-3" });
const FROM_EMAIL = process.env.SES_FROM_EMAIL!;

export async function sendInvitationEmail(
  toEmail: string,
  teamName: string,
  invitationId: string,
) {
  const acceptUrl = `${process.env.FRONTEND_URL}/invitations/${invitationId}/accept`;
  const rejectUrl = `${process.env.FRONTEND_URL}/invitations/${invitationId}/reject`;

  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: `Invitation à rejoindre l'équipe "${teamName}"`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Tu as été invité à rejoindre une équipe !</h2>
              <p>Tu as reçu une invitation pour rejoindre l'équipe <strong>${teamName}</strong>.</p>
              <div style="margin: 30px 0;">
                <a href="${acceptUrl}"
                   style="background-color: #22c55e; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; margin-right: 16px;">
                  Accepter
                </a>
                <a href="${rejectUrl}"
                   style="background-color: #ef4444; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px;">
                  Refuser
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Si tu n'attendais pas cette invitation, ignore cet email.
              </p>
            </div>
          `,
          },
          Text: {
            Charset: "UTF-8",
            Data: `Tu as été invité à rejoindre l'équipe "${teamName}". Accepter: ${acceptUrl} | Refuser: ${rejectUrl}`,
          },
        },
      },
    }),
  );
}
