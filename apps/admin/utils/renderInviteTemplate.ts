// apps/frontend/src/utils/renderInviteTemplate.ts

type InviteTemplate = "default" | "friendly";

export function renderInviteTemplate(
  template: InviteTemplate,
  subject?: string,
  htmlOverride?: string,
  textOverride?: string
) {
  if (htmlOverride?.trim()) return htmlOverride;

  const previewCode = "123456";
  const previewLink = "#";

  return `
    <div style="background-color: #000000; background-image: linear-gradient(#000000, #000000); padding: 20px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #000000; background-image: linear-gradient(#000000, #000000); width: 100%; color: #45CC2D; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center" style="padding: 20px;">
            
            <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="max-width: 600px; width: 100%; background-color: #0a0a0a; background-image: linear-gradient(#0a0a0a, #0a0a0a); border: 2px solid #45CC2D; text-align: left;">
              
              <tr>
                <td bgcolor="#45CC2D" style="background-color: #45CC2D; color: #000000; padding: 10px 20px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">
                  /// INCOMING TRANSMISSION ///
                </td>
              </tr>

              <tr>
                <td style="padding: 30px; font-size: 14px; line-height: 1.6; color: #45CC2D;">
                  
                  <p style="margin: 0 0 16px 0; font-weight: bold;">
                    IN THE YEAR 2006, CONTACT WAS MADE.<br/>
                    TWO TRAJECTORIES ALIGNED.
                  </p>

                  <p style="margin: 0 0 16px 0;"><strong>EARTH DWELLERS.</strong></p>
                  
                  <p style="margin: 0 0 16px 0;">
                    It would be our greatest pleasure if you would join us to witness this next phase of our evolution.
                  </p>
                  
                  <p style="margin: 0 0 16px 0;">
                    The link below is your portal to the next galaxy. 
                    Activate the link and input your clearance code to proceed.
                  </p>

                  <div style="border: 1px dashed #45CC2D; background-color: #000000; background-image: linear-gradient(#000000, #000000); padding: 15px; margin: 20px 0; text-align: center; color: #ffffff; font-size: 18px; letter-spacing: 3px;">
                    CODE: ${previewCode}
                  </div>

                  <p style="margin: 0 0 16px 0;">
                    <strong>DIRECTIVE:</strong> Confirm your coordinates by February 15th, 2026. 
                    Precise data is required for resource allocation and system calibration.
                  </p>

                  <p style="margin: 30px 0 0 0;">
                    Awaiting your signal.
                  </p>
                  
                  <p style="margin: 10px 0 0 0;">
                    BIG LOVE,<br/>
                    S&G
                  </p>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${previewLink}" style="background-color: #45CC2D; color: #000000; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 14px; border: 1px solid #45CC2D; display: inline-block;">
                      ACTIVATE PORTAL
                    </a>
                  </div>

                </td>
              </tr>
              
              <tr>
                <td style="border-top: 1px solid #45CC2D; padding: 10px 20px; font-size: 10px; text-transform: uppercase; color: #45CC2D; opacity: 0.7;">
                  SECURE LINE: ENCRYPTED // ID: PREVIEW<br/>
                  EYES ONLY. DO NOT REPLY.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}