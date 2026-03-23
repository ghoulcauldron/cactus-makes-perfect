// apps/backend/utils/renderSurveyTemplate.js

export function renderSurveyTemplate(code, inviteUrl) {
  const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII.png";

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
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #000000 !important; }
    
    .force-black-bg {
      background-color: #000000 !important;
      background-image: linear-gradient(#000000, #000000) !important;
    }
    .force-card-bg {
      background-color: #0a0a0a !important;
      background-image: linear-gradient(#0a0a0a, #0a0a0a) !important;
    }
  </style>
</head>
<body class="force-black-bg" style="margin: 0; padding: 0; background-color: #000000; background-image: linear-gradient(#000000, #000000); color: #45CC2D; font-family: 'Courier New', Courier, monospace;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="force-black-bg" style="background-color: #000000; background-image: linear-gradient(#000000, #000000); width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" class="force-card-bg" style="max-width: 600px; width: 100%; background-color: #0a0a0a; background-image: linear-gradient(#0a0a0a, #0a0a0a); border: 2px solid #45CC2D; text-align: left;" role="presentation">
          
          <tr>
            <td bgcolor="#45CC2D" style="background-color: #45CC2D; color: #000000; padding: 10px 20px; font-weight: bold; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">
              /// MISSION_MANIFEST_V2 ///
            </td>
          </tr>

          <tr>
            <td background="${bgImgUrl}" style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 30px; background-size: 300px; padding: 30px; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.6; color: #45CC2D;">
              
              <p style="margin: 0 0 16px 0; font-weight: bold; color: #45CC2D; text-transform: uppercase; font-size: 18px;">
                THE FREQUENCY HAS SHIFTED.
              </p>

              <p style="margin: 0 0 16px 0; color: #45CC2D;">
                We’re excited to have you join the mission.
              </p>
              
              <p style="margin: 0 0 16px 0; color: #45CC2D;">
                Please review the schedule below and confirm your arrival date + participation by following the link.<br/>
                <strong>Deadline: APRIL 1</strong><br/>
                (The link will stay active.)
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;" role="presentation">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 10px; border-right: 1px dashed #45CC2D;">
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #45CC2D;">THU AUG 27</p>
                    <p style="margin: 0 0 12px 0; font-size: 11px;">THE ARRIVAL<br/>Infiltration opens</p>
                    
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #45CC2D;">FRI AUG 28</p>
                    <p style="margin: 0; font-size: 11px;">PSYCHE-FEASTIA<br/>Midday: Excursion<br/>6PM: Feast</p>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 10px;">
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #45CC2D;">SAT AUG 29</p>
                    <p style="margin: 0 0 12px 0; font-size: 11px;">ATMOSPHERIC TRANSIT<br/>6PM: Ride the sky</p>
                    
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: #45CC2D;">SUN AUG 30</p>
                    <p style="margin: 0; font-size: 11px;">POST-MISSION DEBRIEF<br/>Midday: Brunch</p>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0;" role="presentation">
                <tr>
                  <td align="center" style="border: 1px dashed #45CC2D; background-color: #000000; background-image: linear-gradient(#000000, #000000); padding: 15px; color: #45CC2D; font-weight: bold; font-size: 18px; letter-spacing: 3px; font-family: 'Courier New', Courier, monospace;">
                    CODE: ${code}
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #45CC2D; font-weight: bold;">
                ACTION REQUIRED: Confirm by APRIL 1
              </p>

              <p style="margin: 30px 0 0 0; color: #45CC2D;">
                Be excellent to each other 👽
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="background-color: #45CC2D; color: #000000; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 14px; border: 1px solid #45CC2D; display: inline-block; font-family: 'Courier New', Courier, monospace;">
                      ACTIVATE_FEED
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          
          <tr>
            <td style="border-top: 1px solid #45CC2D; padding: 10px 20px; font-size: 10px; text-transform: uppercase; color: #45CC2D; opacity: 0.7; font-family: 'Courier New', Courier, monospace;">
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