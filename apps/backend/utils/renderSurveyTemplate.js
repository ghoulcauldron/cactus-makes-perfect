// apps/backend/utils/renderSurveyTemplate.js

export function renderSurveyTemplate(code, inviteUrl) {
  // Use the transparent PNG URL you generated earlier
  const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII.png";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        .void-bg { background-color: #020617 !important; }
        .chrome-card {
          background-color: #000000 !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background-color:#020617;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" class="void-bg">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="chrome-card" 
                   style="border-radius: 40px; overflow: hidden; background-color: #000000;">
              <tr>
                <td align="center" valign="middle" 
                    background="${bgImgUrl}" 
                    style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; padding: 60px 40px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="font-family: 'Courier New', Courier, monospace; color: #cf4aff;">
                        <h1 style="color: #00ffff; font-size: 12px; letter-spacing: 6px; margin-bottom: 40px;">/// SYNAPTIC_LINK_INITIATED ///</h1>
                        <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">THE FREQUENCY HAS SHIFTED.</p>
                        <p style="margin-bottom: 40px; line-height: 1.6;">Your presence has been detected. <br/>To finalize system calibration, we require your neural imprint data.</p>
                        <a href="${inviteUrl}" 
                           style="background-color: #ffffff; color: #000000; padding: 15px 35px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 2px; display: inline-block;">
                           ACTIVATE_FEED
                        </a>
                        <div style="margin-top: 40px; border-top: 1px solid rgba(0,255,255,0.1); padding-top: 20px;">
                           <span style="color: #00ffff; font-size: 10px; letter-spacing: 4px;">CODE: ${code}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}