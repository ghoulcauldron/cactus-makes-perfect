// apps/admin/utils/renderSurveyTemplate.ts

export function renderSurveyTemplate(code: string, inviteUrl: string) {
  // Ensure this URL matches your Supabase storage path for the Elvis ASCII PNG
  const elvisUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/elvisASCII.png";

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <style>
    .force-void-bg { background-color: #020617 !important; }
    /* Ensure the chrome card maintains its bioluminescent border */
    .chrome-card {
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      background-color: #000000 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; color: #cf4aff; font-family: 'Courier New', Courier, monospace;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" class="force-void-bg">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" border="0" cellpadding="0" cellspacing="0" class="chrome-card" style="max-width: 600px; width: 100%; border-radius: 40px; overflow: hidden; background-color: #000000;">
          <tr>
            <td align="center" valign="middle" 
                background="${elvisUrl}" 
                style="background-image: url('${elvisUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; padding: 80px 40px;">
              
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace;">
                    <h1 style="color: #00ffff; font-size: 12px; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 30px; filter: drop-shadow(0 0 8px #00ffff);">
                      /// SYNAPTIC_LINK_INITIATED ///
                    </h1>
                    
                    <p style="font-size: 18px; line-height: 1.6; font-weight: bold; margin-bottom: 20px; color: #cf4aff;">
                      THE FREQUENCY HAS SHIFTED.
                    </p>
                    
                    <p style="margin-bottom: 24px; color: #cf4aff; font-size: 14px; line-height: 1.6;">
                      Your presence has been detected in the upcoming sequence.<br/> 
                      To finalize system calibration, we require your neural imprint data.
                    </p>
                    
                    <div style="border: 1px dashed rgba(0, 255, 255, 0.3); padding: 20px; margin: 30px 0; border-radius: 20px; background: rgba(0, 255, 255, 0.03);">
                      <span style="color: #00ffff; font-size: 10px; display: block; margin-bottom: 8px; letter-spacing: 2px;">CLEARANCE_CODE:</span>
                      <span style="font-size: 28px; letter-spacing: 10px; color: #ffffff; font-weight: bold;">${code}</span>
                    </div>

                    <p style="margin-bottom: 35px; font-style: italic; font-size: 13px; color: #cf4aff; opacity: 0.8;">
                      Confirm your itinerary via the feed link below.
                    </p>

                    <a href="${inviteUrl}" 
                       style="background-color: #ffffff; color: #000000; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 3px; display: inline-block; box-shadow: 0 0 25px rgba(0,255,255,0.4);">
                       ACTIVATE_FEED
                    </a>
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
</html>`;
}