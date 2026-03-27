/**
 * api/send-tutorial-link.js — Vercel Serverless Function
 * שולח קישור להדרכה ב-WhatsApp ו/או אימייל (דרך שלח מסר)
 * משמש כשמישהו נכנס להדרכה מהנייד ורוצה לקבל את הקישור למחשב
 */

const WA_INSTANCE  = process.env.GREENAPI_INSTANCE_ID;
const WA_TOKEN     = process.env.GREENAPI_TOKEN;
const SENDMSG_SITE_ID  = process.env.SENDMSG_SITE_ID;
const SENDMSG_PASSWORD = process.env.SENDMSG_PASSWORD;

const TUTORIALS = {
  clipboard:  { name: 'העתקה חכמה (היסטוריית לוח)', url: 'https://omertai.net/interactive/tutorials/Clipboard/' },
  everything: { name: 'Everything - חיפוש מיידי בכל הקבצים', url: 'https://omertai.net/interactive/tutorials/Everything/' },
  vibe:       { name: 'תמלול שמע ווידאו בעברית', url: 'https://omertai.net/interactive/tutorials/Vibe/' },
  security:   { name: 'סיסמאות ואבטחת חשבונות', url: 'https://omertai.net/interactive/tutorials/Security/' },
  schedule:   { name: 'שליחה מתוזמנת ב-Gmail', url: 'https://omertai.net/interactive/tutorials/Gmail/Schedule/' }
};

function formatPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[\s\-()+]/g, '');
  if (clean.startsWith('0')) clean = '972' + clean.slice(1);
  if (!clean.startsWith('972') && clean.length === 9) clean = '972' + clean;
  return clean + '@c.us';
}

async function sendWhatsApp(phone, name, tutorial) {
  if (!WA_INSTANCE || !WA_TOKEN || !phone) return false;
  const chatId = formatPhone(phone);
  if (!chatId) return false;

  const greeting = name ? ` ${name}` : '';
  const url = tutorial.url + (name ? '?u=' + encodeURIComponent(name) : '');
  const message = `היי${greeting} 👋\n\nהנה הקישור להדרכה:\n*${tutorial.name}*\n\n${url}\n\nפתחו את הקישור במחשב Windows שלכם 💻\n\nשאלות? פשוט תענו להודעה הזו 😊\nעומר טייכר`;

  try {
    const apiUrl = `https://api.greenapi.com/waInstance${WA_INSTANCE}/sendMessage/${WA_TOKEN}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message })
    });
    return response.ok;
  } catch (err) {
    console.error('WhatsApp error:', err.message);
    return false;
  }
}

async function getSendMsgToken() {
  const response = await fetch('https://gconvertrest.sendmsg.co.il/api/sendMsg/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ SiteID: Number(SENDMSG_SITE_ID), Password: SENDMSG_PASSWORD })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error('SendMsg token error: ' + response.status + ' ' + err);
  }
  const data = await response.json();
  return data.Token;
}

async function sendEmail(email, name, tutorial) {
  if (!SENDMSG_SITE_ID || !SENDMSG_PASSWORD) { console.error('SendMsg credentials not configured'); return false; }
  if (!email) return false;
  const url = tutorial.url + (name ? '?u=' + encodeURIComponent(name) : '');

  const htmlContent = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Rubik',Arial,sans-serif;background:#fdf8f2;direction:rtl;">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;700;800&subset=hebrew&display=swap" rel="stylesheet">
<div style="max-width:520px;margin:0 auto;padding:32px 16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:1.2rem;font-weight:800;color:#1a4a6b;">עומר <span style="color:#e8854a;">טייכר</span></span>
  </div>
  <div style="background:#fff;border-radius:16px;padding:28px 24px;border:1px solid #e8e0d5;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg,#1a4a6b,#2d7d9a);border-radius:50%;display:inline-block;line-height:56px;text-align:center;font-size:28px;color:#fff;">💻</div>
    </div>
    <h1 style="text-align:center;color:#1a4a6b;font-size:1.3rem;margin:0 0 8px;">ההדרכה מחכה לכם במחשב</h1>
    <p style="text-align:center;color:#8a7f72;font-size:0.9rem;margin:0 0 24px;">
      ${name ? name + ',' : ''} פתחו את הקישור במחשב Windows שלכם.
    </p>
    <div style="background:#fdf8f2;border-radius:12px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:0.75rem;color:#8a7f72;font-weight:700;">ההדרכה שלכם</p>
      <p style="margin:0;font-size:0.95rem;color:#1a4a6b;font-weight:800;">${tutorial.name}</p>
    </div>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${url}" style="display:inline-block;background:#e8854a;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:800;font-size:1rem;">
        פתחו במחשב &#8592;
      </a>
    </div>
    <p style="text-align:center;color:#8a7f72;font-size:0.78rem;">
      שמרו את המייל הזה ופתחו אותו מהמחשב.
    </p>
  </div>
  <p style="text-align:center;color:#8a7f72;font-size:0.75rem;margin-top:20px;">
    שאלות? <a href="mailto:omer@omertai.net" style="color:#1a4a6b;font-weight:700;">omer@omertai.net</a>
  </p>
</div>
</body>
</html>`;

  try {
    const token = await getSendMsgToken();
    const response = await fetch('https://gconvertrest.sendmsg.co.il/api/Sendmsg/AddUsersAndSend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        users: [{
          EmailAddress: email,
          FirstName: name || ''
        }],
        Message: {
          MessageContent: htmlContent,
          MessageSubject: 'ההדרכה שלכם מחכה - ' + tutorial.name,
          MessageInnerName: 'mobile-link-' + Date.now(),
          SenderEmailAddress: 'omer@omertai.net',
          MessageDirection: 1,
          MessageBackColor: '#fdf8f2'
        }
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('SendMsg error:', response.status, errText);
      return false;
    }
    const result = await response.json();
    console.log('SendMsg email sent to:', email, result);
    return true;
  } catch (err) {
    console.error('SendMsg error:', err.message);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, email, tutorialKey } = req.body || {};

  if (!tutorialKey || !TUTORIALS[tutorialKey]) {
    return res.status(400).json({ error: 'Invalid tutorial key' });
  }
  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email required' });
  }

  const tutorial = TUTORIALS[tutorialKey];
  const results = await Promise.allSettled([
    phone ? sendWhatsApp(phone, name, tutorial) : Promise.resolve(false),
    email ? sendEmail(email, name, tutorial) : Promise.resolve(false)
  ]);

  const whatsappSent = results[0].status === 'fulfilled' && results[0].value;
  const emailSent = results[1].status === 'fulfilled' && results[1].value;

  console.log(`Tutorial link sent: ${tutorialKey} | name=${name} | phone=${phone ? 'yes' : 'no'} | email=${email ? 'yes' : 'no'} | wa=${whatsappSent} | email=${emailSent}`);

  return res.status(200).json({ sent: whatsappSent || emailSent, whatsapp: whatsappSent, email: emailSent });
}
