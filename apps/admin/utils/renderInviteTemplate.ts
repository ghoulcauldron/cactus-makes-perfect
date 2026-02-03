// apps/frontend/src/utils/renderInviteTemplate.ts

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

  // Common styles for the Area 51 look
  const containerStyle = `
    background-color: #000000;
    color: #45CC2D;
    font-family: 'Courier New', Courier, monospace;
    padding: 40px 20px;
    text-align: center;
  `;
  
  const cardStyle = `
    max-width: 600px;
    margin: 0 auto;
    border: 2px solid #45CC2D;
    background-color: #0a0a0a;
    text-align: left;
  `;

  const headerStyle = `
    background-color: #45CC2D;
    color: #000000;
    padding: 10px 20px;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 2px;
  `;

  const bodyStyle = `
    padding: 30px;
    font-size: 14px;
    line-height: 1.6;
  `;

  const codeBoxStyle = `
    border: 1px dashed #45CC2D;
    padding: 15px;
    margin: 20px 0;
    text-align: center;
    color: #ffffff;
    font-size: 18px;
    letter-spacing: 3px;
  `;

  const buttonStyle = `
    display: block;
    width: fit-content;
    margin: 30px auto 0;
    background-color: #45CC2D;
    color: #000000;
    text-decoration: none;
    padding: 12px 24px;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    border: 1px solid #45CC2D;
  `;

  // Note: In the preview, we don't have the real token/code, so we use placeholders.
  const previewCode = "123456";
  const previewLink = "#";

  switch (template) {
    case "friendly":
       // Keep friendly as a backup or alternative if desired, or duplicate the logic below
       return `...`; 

    case "default":
    default:
      return `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <div style="${headerStyle}">
              /// INCOMING TRANSMISSION ///
            </div>
            
            <div style="${bodyStyle}">
              <p style="margin-bottom: 16px;"><strong>EARTH DWELLERS.</strong></p>
              
              <p style="margin-bottom: 16px;">
                It would be our greatest pleasure if you would join us to celebrate a nuptial milestone.
              </p>
              
              <p style="margin-bottom: 16px;">
                The link below will be your portal to the next galaxy. 
                Please activate the link and enter your code, followed by the = sign.
              </p>

              <div style="${codeBoxStyle}">
                CODE: ${previewCode}
              </div>

              <p style="margin-bottom: 16px;">
                Kindly let us know if you can come by February 15th, 2026 so we can start crunching the numbers and make sure it all adds up perfectly.
              </p>

              <p style="margin-top: 30px; margin-bottom: 0;">
                We can’t wait to see you there xx.
              </p>
              
              <p style="margin-top: 10px;">
                BIG LOVE,<br/>
                S&G
              </p>

              <a href="${previewLink}" style="${buttonStyle}">
                ACTIVATE PORTAL
              </a>
            </div>
            
             <div style="border-top: 1px solid #45CC2D; padding: 10px 20px; font-size: 10px; text-transform: uppercase; color: #45CC2D; opacity: 0.7;">
              SECURE LINE: ENCRYPTED
            </div>
          </div>
        </div>
      `;
  }
}