import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlertEmail(visitorQuestion, visitorName = null, visitorEmail = null, adminToken = null) {
    try {
        const adminLink = adminToken
            ? `${process.env.SITE_URL || "http://localhost:3000"}/admin/reply/${adminToken}`
            : null;

        await resend.emails.send({
            from: process.env.ALERT_EMAIL_FROM,
            to: process.env.ALERT_EMAIL_TO,
            subject: "New unanswered question on your portfolio chatbot",
            html: `
        <p>A visitor asked a question that didn't match any known answer:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #333;">
          ${visitorQuestion}
        </blockquote>
        ${visitorName || visitorEmail
                    ? `
          <p><strong>Visitor contact:</strong><br/>
          ${visitorName ? `Name: ${visitorName}<br/>` : ""}
          ${visitorEmail ? `Email: ${visitorEmail}` : ""}
          </p>
        `
                    : `<p><em>No contact info provided yet.</em></p>`
                }
        <p>The chatbot replied using the LLM fallback. You may want to add this as a known answer.</p>
        ${adminLink
                    ? `<p><a href="${adminLink}" style="color:#2563eb;">Reply to this visitor →</a></p>`
                    : ""
                }
      `,
        });
        console.log("Alert email sent");
    } catch (err) {
        console.error("Failed to send alert email:", err.message);
    }
}