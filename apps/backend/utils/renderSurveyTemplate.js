// apps/backend/utils/renderSurveyTemplate.js

export function renderSurveyTemplate(code, inviteUrl) {
  const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII2.png";
  const deepPurple = "#44026a";
  const darkerPurple = "#2a0142"; // For the inner card contrast

return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: ${deepPurple} !important; }
    
    /* Ensure the purple persists in Gmail/Outlook */
    .force-bg {
      background-color: ${deepPurple} !important;
      background-image: linear-gradient(${deepPurple}, ${deepPurple}) !important;
    }
    .force-card-bg {
      background-color: ${darkerPurple} !important;
      background-image: linear-gradient(${darkerPurple}, ${darkerPurple}) !important;
    }
    .force-cyan-bg {
      background-color: #00ffff !important;
      background-image: linear-gradient(#00ffff, #00ffff) !important;
    }
  </style>
</head>
<body class="force-bg" style="margin: 0; padding: 0; background-color: ${deepPurple}; background-image: linear-gradient(${deepPurple}, ${deepPurple}); color: #ffffff; font-family: 'Courier New', Courier, monospace;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="force-bg" style="background-color: ${deepPurple}; background-image: linear-gradient(${deepPurple}, ${deepPurple}); width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" border="0" cellpadding="0" cellspacing="0" class="force-card-bg" style="max-width: 600px; width: 100%; background-color: ${darkerPurple}; background-image: linear-gradient(${darkerPurple}, ${darkerPurple}); border: 1px solid #00ffff; border-radius: 40px; overflow: hidden; text-align: left;" role="presentation">
          
          <tr>
            <td bgcolor="#00ffff" class="force-cyan-bg" style="background-color: #00ffff; background-image: linear-gradient(#00ffff, #00ffff); color: #000000; padding: 12px 24px; font-weight: bold; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; font-size: 13px; letter-spacing: 3px;">
              /// MISSION_MANIFEST_V2 ///
            </td>
          </tr>

          <tr>
            <td background="${bgImgUrl}" style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 40px; background-size: 320px; padding: 40px 30px; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.6; color: #ffffff;">
              
              <p style="margin: 0 0 16px 0; font-weight: bold; color: #00ffff; text-transform: uppercase; font-size: 18px; letter-spacing: 1px;">
                THE FREQUENCY HAS SHIFTED.
              </p>

              <p style="margin: 0 0 16px 0; color: #ffffff;">
                We’re excited to have you join the mission.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #ffffff; opacity: 0.9;">
                Please review the schedule below and confirm your arrival date + participation by following the link.<br/>
                <strong style="color: #00ffff;">Deadline: APRIL 1</strong><br/>
                <span style="font-size: 11px; opacity: 0.7;">(The link will stay active.)</span>
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;" role="presentation">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 15px; border-right: 1px dashed #cf4aff;">
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #00ffff; letter-spacing: 1px;">THU AUG 27</p>
                    <p style="margin: 2px 0 14px 0; font-size: 11px; color: #cf4aff; font-weight: bold;">THE ARRIVAL</p>
                    <p style="margin: 0 0 12px 0; font-size: 11px; opacity: 0.8;">Infiltration window opens</p>
                    
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #00ffff; letter-spacing: 1px;">FRI AUG 28</p>
                    <p style="margin: 2px 0 4px 0; font-size: 11px; color: #cf4aff; font-weight: bold;">PSYCHE-FEASTIA</p>
                    <p style="margin: 0; font-size: 11px; opacity: 0.8;">Midday: Off-World Excursion<br/>6PM: Communal Feast</p>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 15px;">
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #00ffff; letter-spacing: 1px;">SAT AUG 29</p>
                    <p style="margin: 2px 0 4px 0; font-size: 11px; color: #cf4aff; font-weight: bold;">ATMOSPHERIC TRANSIT</p>
                    <p style="margin: 0 0 14px 0; font-size: 11px; opacity: 0.8;">6PM: Ride into the sky</p>
                    
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #00ffff; letter-spacing: 1px;">SUN AUG 30</p>
                    <p style="margin: 2px 0 4px 0; font-size: 11px; color: #cf4aff; font-weight: bold;">POST-MISSION DEBRIEF</p>
                    <p style="margin: 0; font-size: 11px; opacity: 0.8;">Midday: Brunch<br/>6PM: Soft Entertainment</p>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;" role="presentation">
                <tr>
                  <td align="center" style="border: 1px dashed #00ffff; background-color: #000000; background-image: linear-gradient(#000000, #000000); padding: 18px; color: #00ffff; font-weight: bold; font-size: 20px; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">
                    CODE: ${code}
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: #ffffff; font-style: italic; font-size: 13px; text-align: center;">
                Be excellent to each other 👽
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" class="force-cyan-bg" style="background-color: #00ffff; background-image: linear-gradient(#00ffff, #00ffff); color: #000000; text-decoration: none; padding: 16px 40px; font-weight: bold; text-transform: uppercase; font-size: 14px; border-radius: 50px; display: inline-block; font-family: 'Courier New', Courier, monospace; letter-spacing: 2px;">
                      ACTIVATE_FEED
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          
          <tr>
            <td style="border-top: 1px solid #cf4aff; padding: 15px 30px; font-size: 10px; text-transform: uppercase; color: #00ffff; opacity: 0.5; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">
              SECURE LINE: ENCRYPTED // MISSION: AREA_51_SURVEY<br/>
              EYES ONLY. DO NOT REPLY.
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