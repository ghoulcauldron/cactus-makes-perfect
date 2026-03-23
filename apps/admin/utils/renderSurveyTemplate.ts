// apps/admin/utils/renderSurveyTemplate.ts

export function renderSurveyTemplate(code: string, inviteUrl: string) {
  // Ensure this URL matches your Supabase storage path for the ASCII PNG
const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII.png";

return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #020617 !important; }
    
    .force-black-bg {
      background-color: #000000 !important;
      background-image: linear-gradient(#000000, #000000) !important;
    }
    .force-void-bg {
      background-color: #020617 !important;
      background-image: linear-gradient(#020617, #020617) !important;
    }
    /* Solid background for overlays to prevent grey-out */
    .force-overlay-bg {
      background-color: #0a0a0a !important;
      background-image: linear-gradient(#0a0a0a, #0a0a0a) !important;
    }
    /* Button hardening */
    .force-cyan-bg {
      background-color: #00ffff !important;
      background-image: linear-gradient(#00ffff, #00ffff) !important;
    }
  </style>
</head>
<body class="force-void-bg" style="margin: 0; padding: 0; background-color: #020617;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="force-void-bg" style="width: 100%; background-color: #020617;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" border="0" cellpadding="0" cellspacing="0" class="force-black-bg" style="max-width: 600px; width: 100%; background-color: #000000; border: 1px solid #1a1a1a; border-radius: 40px; overflow: hidden; text-align: center;" role="presentation">
          <tr>
            <td align="center" valign="top" background="${bgImgUrl}" style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 60px; background-size: 400px; padding: 60px 40px;">
              
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace;">
                    
                    <h1 style="color: #00ffff !important; font-size: 12px; letter-spacing: 6px; margin: 0 0 30px 0; text-transform: uppercase;">/// MISSION_MANIFEST_V2 ///</h1>
                    <p style="color: #ffffff !important; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">THE FREQUENCY HAS SHIFTED.</p>

                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 30px;">
                      <tr>
                        <td class="force-overlay-bg" style="background-color: #0a0a0a; border-radius: 20px; padding: 20px; text-align: center;">
                          <p style="color: #ffffff !important; margin: 0 0 10px 0; font-size: 13px;">We’re excited to have you join the mission.</p>
                          <p style="color: #ffffff !important; margin: 0; opacity: 0.8; font-size: 13px; line-height: 1.6;">
                            Please review the schedule below and confirm your arrival date + participation by following the link.<br/>
                            Deadline: APRIL 1<br/>
                            (The link will stay active.)
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" border="0" cellpadding="20" cellspacing="0" role="presentation" class="force-overlay-bg" style="margin-bottom: 40px; background-color: #0a0a0a; border-radius: 20px; border: 1px solid #1a1a1a;">
                      <tr>
                        <td width="50%" valign="top" style="text-align: left; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.4;">
                          <div style="color: #00ffff !important; font-weight: bold; letter-spacing: 2px; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase;">THU AUG 27</div>
                          <div style="font-weight: bold; color: #cf4aff !important; margin-bottom: 4px;">THE ARRIVAL</div>
                          <div style="color: #ffffff !important; opacity: 0.7;">Infiltration window opens</div>
                          <br/>
                          <div style="color: #00ffff !important; font-weight: bold; letter-spacing: 2px; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase;">FRI AUG 28</div>
                          <div style="font-weight: bold; color: #cf4aff !important; margin-bottom: 4px;">PSYCHE-FEASTIA</div>
                          <div style="color: #ffffff !important; opacity: 0.7;">Midday: Off-World Excursion<br/>6PM: Ceremonial Feast</div>
                        </td>
                        <td width="50%" valign="top" style="text-align: left; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.4;">
                          <div style="color: #00ffff !important; font-weight: bold; letter-spacing: 2px; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase;">SAT AUG 29</div>
                          <div style="font-weight: bold; color: #cf4aff !important; margin-bottom: 4px;">ATMOSPHERIC TRANSIT</div>
                          <div style="color: #ffffff !important; opacity: 0.7;">6PM: Ride into the sky</div>
                          <br/>
                          <div style="color: #00ffff !important; font-weight: bold; letter-spacing: 2px; border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase;">SUN AUG 30</div>
                          <div style="font-weight: bold; color: #cf4aff !important; margin-bottom: 4px;">POST-MISSION DEBRIEF</div>
                          <div style="color: #ffffff !important; opacity: 0.7;">Midday: Brunch<br/>Evening: Soft Entertainment</div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-bottom: 40px;">
                      <p style="color: #ff4a4a !important; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin: 0 0 20px 0; text-transform: uppercase;">ACTION REQUIRED: CONFIRM BY APRIL 1</p>
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td align="center" class="force-cyan-bg" style="background-color: #00ffff; border-radius: 50px;">
                            <a href="${inviteUrl}" style="color: #000000 !important; padding: 18px 45px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 2px; display: inline-block; font-family: 'Courier New', Courier, monospace;">
                              ACTIVATE_FEED
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <div style="border-top: 1px solid #1a1a1a; padding-top: 30px;">
                       <span style="color: #00ffff !important; font-size: 10px; letter-spacing: 4px; display: block; margin-bottom: 10px;">CODE: ${code}</span>
                       <p style="color: #ffffff !important; font-style: italic; font-size: 12px; margin: 0;">Be excellent to each other 👽</p>
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