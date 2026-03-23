// apps/admin/utils/renderSurveyTemplate.ts

export function renderSurveyTemplate(code: string, inviteUrl: string) {
  // Ensure this URL matches your Supabase storage path for the ASCII PNG
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
          border: 1px solid rgba(0, 255, 255, 0.2) !important;
          box-shadow: 0 0 40px rgba(0, 255, 255, 0.1);
        }
        .itinerary-text {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.4;
          color: #ffffff;
          text-align: left;
        }
        .day-label {
          color: #00ffff;
          font-weight: bold;
          letter-spacing: 2px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        /* Glass-morphism helper for text readability */
        .content-overlay {
          background-color: rgba(0, 0, 0, 0.6) !important;
          border-radius: 20px;
          padding: 20px;
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
                <td align="center" valign="top" 
                    background="${bgImgUrl}" 
                    style="background-image: url('${bgImgUrl}'); background-repeat: no-repeat; background-position: center 60px; background-size: 400px; padding: 60px 40px;">
                  
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="font-family: 'Courier New', Courier, monospace;">
                        <h1 style="color: #00ffff; font-size: 12px; letter-spacing: 6px; margin-bottom: 30px;">/// MISSION_MANIFEST_V2 ///</h1>
                        
                        <div class="content-overlay" style="margin-bottom: 30px;">
                          <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin-bottom: 15px;">THE FREQUENCY HAS SHIFTED.</p>
                          <div style="color: #ffffff; line-height: 1.6; font-size: 13px; text-align: center;">
                            <p>We’re excited to have you join the mission.</p>
                            <p style="opacity: 0.8;">
                              Please review the schedule below and confirm your arrival date + participation by following the link.<br>
                              Deadline: APRIL 1<br>
                              (The link will stay active.)
                            </p>
                          </div>
                        </div>
                        
                        <table width="100%" border="0" cellpadding="0" cellspacing="20" 
                               style="margin-bottom: 40px; background: rgba(0, 0, 0, 0.6); border-radius: 20px; border: 1px solid rgba(0, 255, 255, 0.1);">
                          <tr>
                            <td width="50%" valign="top" class="itinerary-text">
                              <div class="day-label">THU AUG 27</div>
                              <div style="font-weight: bold; color: #cf4aff;">THE ARRIVAL</div>
                              <div style="opacity: 0.7;">Infiltration window opens</div>
                              <br/>
                              <div class="day-label">FRI AUG 28</div>
                              <div style="font-weight: bold; color: #cf4aff;">PSYCHE-FEASTIA</div>
                              <div style="opacity: 0.7;">Midday: Off-World Excursion<br/>6PM: Ceremonial Feast</div>
                            </td>
                            <td width="50%" valign="top" class="itinerary-text">
                              <div class="day-label">SAT AUG 29</div>
                              <div style="font-weight: bold; color: #cf4aff;">ATMOSPHERIC TRANSIT</div>
                              <div style="opacity: 0.7;">6PM: Ride into the sky</div>
                              <br/>
                              <div class="day-label">SUN AUG 30</div>
                              <div style="font-weight: bold; color: #cf4aff;">POST-MISSION DEBRIEF</div>
                              <div style="opacity: 0.7;">Midday: Brunch<br/>Evening: Soft Entertainment</div>
                            </td>
                          </tr>
                        </table>

                        <div style="margin-bottom: 40px;">
                          <p style="color: #ff4a4a; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-bottom: 20px;">ACTION REQUIRED: CONFIRM BY APRIL 1</p>
                          <a href="${inviteUrl}" 
                             style="background-color: #00ffff; color: #000000; padding: 18px 45px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 2px; display: inline-block; box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);">
                             ACTIVATE_FEED
                          </a>
                        </div>

                        <div style="border-top: 1px solid rgba(0,255,255,0.1); padding-top: 30px;">
                           <span style="color: #00ffff; font-size: 10px; letter-spacing: 4px; display: block; margin-bottom: 10px;">CODE: ${code}</span>
                           <p style="color: #ffffff; font-style: italic; font-size: 12px; opacity: 0.6;">Be excellent to each other 👽</p>
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