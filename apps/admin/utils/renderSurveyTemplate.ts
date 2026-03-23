// apps/admin/utils/renderSurveyTemplate.ts

export function renderSurveyTemplate(code: string, inviteUrl: string) {
  // Ensure this URL matches your Supabase storage path for the ASCII PNG
const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII.png";

return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #000000 !important; }
    
    .force-black-bg {
      background-color: #000000 !important;
      background-image: linear-gradient(#000000, #000000) !important;
    }

    /* THE FIX: Apply the gradient hack to TEXT colors to lock them */
    .lock-cyan { color: #00ffff !important; background-image: linear-gradient(#00ffff, #00ffff) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; }
    .lock-white { color: #ffffff !important; background-image: linear-gradient(#ffffff, #ffffff) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; }
  </style>
</head>
<body class="force-black-bg" style="margin: 0; padding: 0; background-color: #000000;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" class="force-black-bg">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" border="0" cellpadding="0" cellspacing="0" class="force-black-bg" style="max-width: 600px; width: 100%; border: 1px solid #00ffff; border-radius: 40px; overflow: hidden;">
          <tr>
            <td align="center" background="${bgImgUrl}" style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 60px; background-size: 400px; padding: 60px 40px; font-family: 'Courier New', Courier, monospace;">
              
              <h1 style="margin: 0 0 30px 0;"><span class="lock-cyan" style="font-size: 12px; letter-spacing: 6px;">/// MISSION_MANIFEST_V2 ///</span></h1>
              
              <p style="margin: 0 0 40px 0;"><span class="lock-white" style="font-size: 18px; font-weight: bold;">THE FREQUENCY HAS SHIFTED.</span></p>

              <div style="margin-bottom: 40px; color: #ffffff !important;">
                 <span class="lock-white">We’re excited to have you join the mission.</span><br/><br/>
                 <span class="lock-white">Please review the schedule below and confirm your arrival date.</span><br/>
                 <span class="lock-cyan" style="font-weight: bold;">Deadline: APRIL 1</span>
              </div>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
                <tr>
                  <td width="50%" align="left" valign="top" style="padding-right: 10px;">
                    <div style="border-bottom: 1px solid #00ffff; margin-bottom: 8px;"><span class="lock-cyan" style="font-weight: bold;">THU AUG 27</span></div>
                    <span class="lock-white" style="font-size: 11px;">THE ARRIVAL<br/>Infiltration opens</span>
                  </td>
                  <td width="50%" align="left" valign="top" style="padding-left: 10px;">
                    <div style="border-bottom: 1px solid #00ffff; margin-bottom: 8px;"><span class="lock-cyan" style="font-weight: bold;">SAT AUG 29</span></div>
                    <span class="lock-white" style="font-size: 11px;">ATMOSPHERIC TRANSIT<br/>6PM: Ride the sky</span>
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: #00ffff; background-image: linear-gradient(#00ffff, #00ffff); border-radius: 50px; padding: 18px 45px;">
                    <a href="${inviteUrl}" style="color: #000000 !important; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 2px;">ACTIVATE_FEED</a>
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