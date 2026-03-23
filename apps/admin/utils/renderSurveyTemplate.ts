// apps/admin/utils/renderSurveyTemplate.ts

export function renderSurveyTemplate(code: string, inviteUrl: string) {
  const elvisAscii = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠿⠿⠛⣛⣻⣷⣶⣦⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠀⢠⣶⣿⣿⣷⣦⣴⣶⣶⣶⣾⣿⡿⣿⢻⣿⣿⠀⣷⣴⣴⣿⣷⣦⣄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⠃⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⢰⣿⣾⣿⣿⣆⠘⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣷⣼⣿⣿⣿⣿⣿⣿⣿⣆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣷⣌⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⢹⡀
⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⣤⡄⣸⡇
⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠋⠉⠻⠿⠿⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠛⠁
⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠻⢿⣿⣿⠛⣿⣿⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣻⣿⠀⢸⡇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⠀⢸⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣿⢿⢿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⡇⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢻⡄⢸⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣇⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⣇⠸⠇⠹⣿⣿⣿⠀⠀⠀⠀⠀⠀⠉⢛⣛⣛⣿⣿⣿⣿⠶⠆⠀⠀⢀⣴⣿⣿⣿⣿⡿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⢹⣿⣿⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⢛⣻⡿⠃⠀⠀⠀⢠⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⣽⣷⡄⠀⣼⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠀⠀⠀⠀⠀⢸⠿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣠⣶⣿⣿⣿⣿⠈⠋⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠀⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠀⢠⠘⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀
⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⠃⠀⠀⢤⣀⣀⣼⣧⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀
⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠛⣛⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠠⣀⠀⠀⠀⠀⠀⠀⠀⠐⠒⠉⠉⠙⠛⠛⢿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠈⠢⣀⠀⠀⠀⠀⠀⠀⠀⠀⢤⣤⣤⣴⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠈⠳⣄⡀⠀⠀⠀⠀⠀⠀⠀⠈⠉⢉⣾⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠙⠛⠛⠛⠛⢿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣶⣄⡀⠀⣀⣀⣤⣤⣴⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⣿⣿⠿⠟⣻⣿⣿⡿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣇⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <style>
    .force-void-bg { background-color: #020617 !important; }
    .ascii-container { color: #00ffff !important; font-family: monospace; font-size: 8px; line-height: 8px; white-space: pre; opacity: 0.4; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; color: #a855f7; font-family: 'Courier New', Courier, monospace;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" class="force-void-bg">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #000000; border: 1px solid #334155; border-radius: 40px; overflow: hidden; position: relative;">
          <tr>
            <td style="padding: 40px; position: relative;">
              <div class="ascii-container" style="text-align: center; margin-bottom: -200px;">${elvisAscii}</div>
              
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="position: relative; z-index: 10;">
                <tr>
                  <td align="center">
                    <h1 style="color: #00ffff; font-size: 12px; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 30px;">/// SYNAPTIC_LINK_INITIATED ///</h1>
                    <p style="font-size: 16px; line-height: 1.6; font-weight: bold; margin-bottom: 20px;">THE FREQUENCY HAS SHIFTED.</p>
                    <p style="margin-bottom: 24px;">Your presence has been detected in the upcoming sequence. To finalize system calibration, we require your neural imprint data.</p>
                    
                    <div style="border: 1px dashed #00ffff; padding: 20px; margin: 30px 0; border-radius: 20px; background: rgba(0,255,255,0.05);">
                      <span style="color: #00ffff; font-size: 10px; display: block; margin-bottom: 5px;">CLEARANCE_CODE:</span>
                      <span style="font-size: 24px; letter-spacing: 8px; color: #ffffff;">${code}</span>
                    </div>

                    <p style="margin-bottom: 30px; font-style: italic; font-size: 13px;">Confirm your itinerary and provide mission-critical feedback via the portal below.</p>

                    <a href="${inviteUrl}" style="background-color: #ffffff; color: #000000; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 2px; display: inline-block;">ACTIVATE_FEED</a>
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