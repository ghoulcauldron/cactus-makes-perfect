// apps/backend/utils/renderSurveyTemplate.js

export function renderSurveyTemplate(code, inviteUrl) {
  // Use the transparent PNG URL you generated earlier
const bgImgUrl = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/alienASCII.png";

return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #000000 !important; }
    
    .force-black-bg {
      background-color: #000000 !important;
      background-image: linear-gradient(#000000, #000000) !important;
    }
    
    .force-cyan-bg {
      background-color: #00ffff !important;
      background-image: linear-gradient(#00ffff, #00ffff) !important;
    }

    /* THE IOS BRIGHTNESS FIX: Using gradients as text fill to lock colors */
    .lock-white {
      color: #ffffff !important;
      background-image: linear-gradient(#ffffff, #ffffff) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      display: inline-block;
    }

    .lock-cyan {
      color: #00ffff !important;
      background-image: linear-gradient(#00ffff, #00ffff) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      display: inline-block;
    }

    .lock-red {
      color: #ff4a4a !important;
      background-image: linear-gradient(#ff4a4a, #ff4a4a) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      display: inline-block;
    }

    @media (prefers-color-scheme: dark) {
      .brighten { text-shadow: 0 0 1px rgba(255,255,255,0.2) !important; }
    }
  </style>
</head>
<body class="force-black-bg" style="margin: 0; padding: 0; background-color: #000000;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="force-black-bg" style="width: 100%; background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" border="0" cellpadding="0" cellspacing="0" class="force-black-bg" style="max-width: 600px; width: 100%; background-color: #000000; border: 1px solid #00ffff; border-radius: 40px; overflow: hidden;" role="presentation">
          <tr>
            <td align="center" valign="top" background="${bgImgUrl}" style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 60px; background-size: 400px; padding: 60px 40px;">
              
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="font-family: 'Courier New', Courier, monospace;">
                    
                    <h1 style="margin: 0 0 30px 0;"><span class="lock-cyan" style="font-size: 12px; letter-spacing: 6px; text-transform: uppercase;">/// MISSION_MANIFEST_V2 ///</span></h1>
                    <p style="margin: 0 0 10px 0;"><span class="lock-white" style="font-size: 18px; font-weight: bold; text-transform: uppercase;">THE FREQUENCY HAS SHIFTED.</span></p>

                    <div style="margin: 0 0 40px 0; line-height: 1.6; font-size: 14px; text-align: center;">
                      <p style="margin: 0 0 10px 0;"><span class="lock-white">We’re excited to have you join the mission.</span></p>
                      <p style="margin: 0; font-size: 13px;">
                        <span class="lock-white">Please review the schedule below and confirm your arrival date + participation by following the link.</span><br/>
                        <span class="lock-cyan" style="font-weight: bold;">Deadline: APRIL 1</span><br/>
                        <span class="lock-white" style="font-size: 11px; opacity: 0.8;">(The link will stay active.)</span>
                      </p>
                    </div>

                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 40px;">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 15px; text-align: left; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.5;">
                          <div style="border-bottom: 1px solid #00ffff; padding-bottom: 4px; margin-bottom: 8px;"><span class="lock-cyan" style="font-weight: bold; letter-spacing: 2px;">THU AUG 27</span></div>
                          <div style="margin-bottom: 4px;"><span class="lock-white" style="font-weight: bold;">THE ARRIVAL</span></div>
                          <div><span class="lock-cyan">Infiltration window opens</span></div>
                          <br/>
                          <div style="border-bottom: 1px solid #00ffff; padding-bottom: 4px; margin-bottom: 8px;"><span class="lock-cyan" style="font-weight: bold; letter-spacing: 2px;">FRI AUG 28</span></div>
                          <div style="margin-bottom: 4px;"><span class="lock-white" style="font-weight: bold;">PSYCHE-FEASTIA</span></div>
                          <div><span class="lock-cyan">Midday: Off-World Excursion<br/>6PM: Ceremonial Feast</span></div>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 15px; text-align: left; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.5;">
                          <div style="border-bottom: 1px solid #00ffff; padding-bottom: 4px; margin-bottom: 8px;"><span class="lock-cyan" style="font-weight: bold; letter-spacing: 2px;">SAT AUG 29</span></div>
                          <div style="margin-bottom: 4px;"><span class="lock-white" style="font-weight: bold;">ATMOSPHERIC TRANSIT</span></div>
                          <div><span class="lock-cyan">6PM: Ride into the sky</span></div>
                          <br/>
                          <div style="border-bottom: 1px solid #00ffff; padding-bottom: 4px; margin-bottom: 8px;"><span class="lock-cyan" style="font-weight: bold; letter-spacing: 2px;">SUN AUG 30</span></div>
                          <div style="margin-bottom: 4px;"><span class="lock-white" style="font-weight: bold;">POST-MISSION DEBRIEF</span></div>
                          <div><span class="lock-cyan">Midday: Brunch<br/>Evening: Soft Entertainment</span></div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-bottom: 40px;">
                      <p style="margin: 0 0 20px 0;"><span class="lock-red" style="font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">ACTION REQUIRED: CONFIRM BY APRIL 1</span></p>
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center">
                        <tr>
                          <td align="center" class="force-cyan-bg" style="background-color: #00ffff; border-radius: 50px;">
                            <a href="${inviteUrl}" style="color: #000000 !important; padding: 18px 45px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 2px; display: inline-block; font-family: 'Courier New', Courier, monospace;">
                              ACTIVATE_FEED
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <div style="border-top: 1px solid #00ffff; padding-top: 30px;">
                       <span style="display: block; margin-bottom: 10px;"><span class="lock-cyan" style="font-size: 14px; font-weight: bold; letter-spacing: 4px;">CODE: ${code}</span></span>
                       <p style="margin: 0;"><span class="lock-white" style="font-style: italic; font-size: 13px; font-weight: bold;">Be excellent to each other 👽</span></p>
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