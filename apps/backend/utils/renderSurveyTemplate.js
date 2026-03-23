// apps/backend/utils/renderSurveyTemplate.js

export function renderSurveyTemplate(code, inviteUrl) {
  const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII2.png";
  
  // PRIMARY ENVIRONMENT
  const deepPurple = "#44026a";
  const darkerPurple = "#2a0142";
  
  // THE GREEN-SCALE SPECTRUM (Replacing all white/gray)
  const electricGreen = "#5be942"; // Primary punch / Heads
  const terminalMoss = "#70f049";   // Body text (tinted green-white)
  const fadedRadioactive = "#5ed540"; // Secondary/dimmed text
  
  // ACCENTS
  const softCyan = "#bcfeff";     // "Glow" Blue (keeping as a data-accent)
  const mutedMagenta = "#cf4aff"; // Your working anchor

return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: ${deepPurple} !important; }
    .force-bg { background-color: ${deepPurple} !important; background-image: linear-gradient(${deepPurple}, ${deepPurple}) !important; }
    .force-card-bg { background-color: ${darkerPurple} !important; background-image: linear-gradient(${darkerPurple}, ${darkerPurple}) !important; }
    .force-green-bg { background-color: ${electricGreen} !important; background-image: linear-gradient(${electricGreen}, ${electricGreen}) !important; }
  </style>
</head>
<body class="force-bg" style="margin: 0; padding: 0; background-color: ${deepPurple}; color: ${terminalMoss}; font-family: 'Courier New', Courier, monospace;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="force-bg" style="background-color: ${deepPurple};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" border="0" cellpadding="0" cellspacing="0" class="force-card-bg" style="max-width: 600px; width: 100%; background-color: ${darkerPurple}; border: 1px solid ${electricGreen}; border-radius: 40px; overflow: hidden; text-align: left;" role="presentation">
          
          <tr>
            <td bgcolor="${electricGreen}" class="force-green-bg" style="background-color: ${electricGreen}; color: #343434; padding: 12px 24px; font-weight: bold; font-family: 'Courier New', Courier, monospace; text-transform: uppercase; font-size: 13px; letter-spacing: 3px;">
              /// MISSION_MANIFEST_V3 ///
            </td>
          </tr>

          <tr>
            <td background="${bgImgUrl}" style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 40px; background-size: 320px; padding: 40px 30px; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.6; color: ${terminalMoss};">
              
              <p style="margin: 0 0 16px 0; font-weight: bold; color: ${electricGreen}; text-transform: uppercase; font-size: 18px; letter-spacing: 1px;">
                THE FREQUENCY HAS SHIFTED.
              </p>

              <p style="margin: 0 0 16px 0; color: ${terminalMoss};">
                We’re excited to have you join the mission.
              </p>
              
              <p style="margin: 0 0 24px 0; color: ${terminalMoss};">
                Please review the schedule below and confirm your arrival date + participation by following the link.<br/>
                <strong style="color: ${softCyan};">Deadline: APRIL 1</strong><br/>
                <span style="font-size: 11px; color: ${mutedMagenta}; opacity: 0.9;">(The link will stay active.)</span>
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;" role="presentation">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 15px; border-right: 1px dashed ${mutedMagenta};">
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: ${softCyan}; letter-spacing: 1px;">THU AUG 27</p>
                    <p style="margin: 2px 0 14px 0; font-size: 11px; color: ${mutedMagenta}; font-weight: bold;">THE ARRIVAL</p>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: ${fadedRadioactive};">Infiltration window opens</p>
                    
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: ${softCyan}; letter-spacing: 1px;">FRI AUG 28</p>
                    <p style="margin: 2px 0 4px 0; font-size: 11px; color: ${mutedMagenta}; font-weight: bold;">PSYCHE-FEASTIA</p>
                    <p style="margin: 0; font-size: 11px; color: ${fadedRadioactive};">Midday: Off-World Excursion<br/>6PM: Communal Feast</p>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 15px;">
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: ${softCyan}; letter-spacing: 1px;">SAT AUG 29</p>
                    <p style="margin: 2px 0 4px 0; font-size: 11px; color: ${mutedMagenta}; font-weight: bold;">ATMOSPHERIC TRANSIT</p>
                    <p style="margin: 0 0 14px 0; font-size: 11px; color: ${fadedRadioactive};">6PM: Ride into the sky</p>
                    
                    <p style="margin: 0; font-weight: bold; font-size: 12px; color: ${softCyan}; letter-spacing: 1px;">SUN AUG 30</p>
                    <p style="margin: 2px 0 4px 0; font-size: 11px; color: ${mutedMagenta}; font-weight: bold;">POST-MISSION DEBRIEF</p>
                    <p style="margin: 0; font-size: 11px; color: ${fadedRadioactive};">Midday: Brunch<br/>6PM: Soft Entertainment</p>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;" role="presentation">
                <tr>
                  <td align="center" style="border: 1px dashed ${electricGreen}; background-color: ${darkerPurple}; padding: 18px; color: ${electricGreen}; font-weight: bold; font-size: 20px; letter-spacing: 4px;">
                    CODE: ${code}
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: ${mutedMagenta}; font-style: italic; font-size: 13px; text-align: center;">
                Be excellent to each other 👽
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" class="force-green-bg" style="background-color: ${electricGreen}; color: #000000; text-decoration: none; padding: 16px 40px; font-weight: bold; text-transform: uppercase; font-size: 14px; border-radius: 50px; display: inline-block; letter-spacing: 2px;">
                      ACTIVATE_FEED
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          
          <tr>
            <td style="border-top: 1px solid ${mutedMagenta}; padding: 15px 30px; font-size: 10px; text-transform: uppercase; color: ${fadedRadioactive}; letter-spacing: 1px;">
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