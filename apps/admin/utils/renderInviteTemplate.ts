type InviteTemplate = "default" | "friendly";

export function renderInviteTemplate(
  template: InviteTemplate,
  subject?: string,
  htmlOverride?: string,
  textOverride?: string
) {
  // If admin pasted custom HTML, preview that verbatim
  if (htmlOverride?.trim()) {
    return htmlOverride;
  }

  // Otherwise use canned templates
  switch (template) {
    case "friendly":
      return `
        <div style="font-family: sans-serif; padding: 24px; color: #222;">
          <h2 style="margin-bottom: 12px;">Just a quick reminder 🌵</h2>
          <p>
            We’re excited to have you join us.
            If you haven’t already, you can use your invite link to RSVP.
          </p>
          <p style="margin-top: 24px;">
            See you soon,<br/>
            <strong>Cactus Makes Perfect</strong>
          </p>
        </div>
      `;

    case "default":
    default:
      return `
        <div style="font-family: sans-serif; padding: 24px; color: #222;">
          <h2 style="margin-bottom: 12px;">You're Invited 🌵</h2>
          <p>
            Please use your invite link to access the event portal and RSVP.
          </p>
          <p style="margin-top: 24px;">
            <strong>Cactus Makes Perfect</strong>
          </p>
        </div>
      `;
  }
}