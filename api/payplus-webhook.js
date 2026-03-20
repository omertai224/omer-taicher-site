/**
 * api/payplus-webhook.js — Vercel Serverless Function
 * מקבל התראות IPN מ-PayPlus כשתשלום מתבצע
 *
 * PayPlus שולח POST עם פרטי העסקה לאחר תשלום מוצלח/נכשל.
 * ה-endpoint הזה מאמת את העסקה מול PayPlus API, שולח מייל עם קישור להדרכה
 * ושולח הודעת WhatsApp אם הלקוח השאיר טלפון.
 */

const PAYPLUS_BASE_URL = process.env.PAYPLUS_ENV === 'production'
  ? 'https://restapi.payplus.co.il'
  : 'https://restapidev.payplus.co.il';

const API_KEY      = process.env.PAYPLUS_API_KEY;
const SECRET_KEY   = process.env.PAYPLUS_SECRET_KEY;
const BREVO_KEY    = process.env.BREVO_API_KEY;
const WA_INSTANCE  = process.env.GREENAPI_INSTANCE_ID;
const WA_TOKEN     = process.env.GREENAPI_TOKEN;

const PRODUCTS = {
  vibe:     { name: 'כלי AI שממיר כל סרטון והקלטה לטקסט, בעברית', url: 'https://omertai.net/interactive/Vibe/', user: 'student', pass: 'Sv8472t' },
  ai:       { name: 'AI לכולם, ChatGPT, Claude וגוגל בשפה שלכם',  url: 'https://omertai.net/interactive/AI/' },
  files:    { name: 'לסדר את המחשב, ארגון קבצים, תיקיות וענן',    url: 'https://omertai.net/interactive/Files/' },
  security: { name: 'גלישה בטוחה, סיסמאות, הגנה ומה לא ללחוץ',  url: 'https://omertai.net/interactive/Security/' },
  google:   { name: 'גוגל מאלף עד תו, Docs, Drive, Gmail ו-Slides', url: 'https://omertai.net/interactive/Google/' }
};

async function sendTutorialEmail(customerEmail, customerName, product) {
  if (!BREVO_KEY || !customerEmail) return;

  const htmlContent = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Rubik',Arial,Helvetica,sans-serif;background:#fdf8f2;direction:rtl;">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;700;800&subset=hebrew&display=swap" rel="stylesheet">
<div style="max-width:520px;margin:0 auto;padding:32px 16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:1.2rem;font-weight:800;color:#1a4a6b;">עומר <span style="color:#e8854a;">טייכר</span></span>
  </div>
  <div style="background:#fff;border-radius:16px;padding:28px 24px;border:1px solid #e8e0d5;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
    <h1 style="text-align:center;color:#1a4a6b;font-size:1.4rem;margin:0 0 8px;">התשלום התקבל בהצלחה</h1>
    <p style="text-align:center;color:#8a7f72;font-size:0.9rem;margin:0 0 24px;">
      ${customerName ? customerName + ',' : ''} ההדרכה שלכם מוכנה ומחכה.
    </p>
    <div style="background:#fdf8f2;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:0.75rem;color:#8a7f72;font-weight:700;">מה קניתם</p>
      <p style="margin:0;font-size:0.95rem;color:#1a4a6b;font-weight:800;">${product.name}</p>
    </div>
    ${product.user && product.pass ? `
    <div style="background:#f0f7ff;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #d0e3f5;">
      <p style="margin:0 0 10px;font-size:0.75rem;color:#8a7f72;font-weight:700;">פרטי הכניסה שלכם</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-size:0.85rem;color:#8a7f72;width:90px;">שם משתמש</td>
          <td style="padding:4px 0;font-size:0.95rem;color:#1a4a6b;font-weight:800;letter-spacing:0.5px;">${product.user}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:0.85rem;color:#8a7f72;">סיסמה</td>
          <td style="padding:4px 0;font-size:0.95rem;color:#1a4a6b;font-weight:800;letter-spacing:0.5px;">${product.pass}</td>
        </tr>
      </table>
    </div>
    ` : ''}
    <div style="text-align:center;">
      <a href="${product.url}" style="display:inline-block;background:#e8854a;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:800;font-size:1rem;">
        עברו להדרכה עכשיו
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><circle cx="12" cy="12" r="10"/><polyline points="12 8 8 12 12 16"/><line x1="16" y1="12" x2="8" y2="12"/></svg>
      </a>
    </div>
    <p style="text-align:center;color:#8a7f72;font-size:0.78rem;margin-top:16px;">
      הקישור הזה שלכם לצמיתות. שמרו את המייל הזה.
    </p>
  </div>
  <p style="text-align:center;color:#8a7f72;font-size:0.75rem;margin-top:20px;">
    שאלות? <a href="mailto:omertai224@gmail.com" style="color:#1a4a6b;font-weight:700;">omertai224@gmail.com</a>
  </p>
</div>
</body>
</html>`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_KEY
    },
    body: JSON.stringify({
      sender: { name: 'עומר טייכר', email: 'omertai224@gmail.com' },
      to: [{ email: customerEmail, name: customerName || customerEmail }],
      subject: `ההדרכה שלכם מוכנה - ${product.name}`,
      htmlContent
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Brevo email error:', response.status, err);
  } else {
    console.log('Tutorial email sent to:', customerEmail);
  }
}

function formatPhone(phone) {
  if (!phone) return null;
  // מסיר מקפים, רווחים וסוגריים
  let clean = phone.replace(/[\s\-()+]/g, '');
  // ישראלי שמתחיל ב-0 → 972
  if (clean.startsWith('0')) clean = '972' + clean.slice(1);
  // מוסיף 972 אם חסר קידומת
  if (!clean.startsWith('972') && clean.length === 9) clean = '972' + clean;
  return clean + '@c.us';
}

async function sendWhatsApp(customerPhone, customerName, product) {
  if (!WA_INSTANCE || !WA_TOKEN || !customerPhone) return;

  const chatId = formatPhone(customerPhone);
  if (!chatId) return;

  const name = customerName ? ` ${customerName}` : '';
  const loginBlock = product.user && product.pass
    ? `\n\nפרטי הכניסה שלכם:\nשם משתמש: *${product.user}*\nסיסמה: *${product.pass}*`
    : '';
  const message = `היי${name} 👋\n\nהתשלום התקבל בהצלחה ✅\nההדרכה *${product.name}* מוכנה עבורכם.\n\nלחצו כאן כדי להתחיל:\n${product.url}${loginBlock}\n\nשאלות? פשוט תענו להודעה הזו 😊\nעומר טייכר`;

  try {
    const apiUrl = `https://api.greenapi.com/waInstance${WA_INSTANCE}/sendMessage/${WA_TOKEN}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('WhatsApp API error:', response.status, err.slice(0, 200));
      return;
    }

    const data = await response.json();
    if (data.idMessage) {
      console.log('WhatsApp sent to:', customerPhone);
    } else {
      console.error('WhatsApp send error:', data);
    }
  } catch (err) {
    console.error('WhatsApp fetch error:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // PayPlus sends callback as POST with nested structure:
    // { transaction_type, transaction: { uid, payment_page_request_uid, ... }, data: { customer_email, ... } }
    const body = req.method === 'GET' ? req.query : (req.body || {});
    const transaction = body.transaction || {};
    const callbackData = body.data || {};

    const transactionUid = transaction.uid || body.transaction_uid;
    const pageRequestUid = transaction.payment_page_request_uid || body.page_request_uid;

    if (!transactionUid && !pageRequestUid) {
      console.error('Webhook: missing transaction identifiers', { method: req.method, body });
      return res.status(400).json({ error: 'Missing transaction data' });
    }

    console.log('PayPlus webhook received:', {
      method: req.method,
      transaction_type: body.transaction_type,
      transaction_uid: transactionUid,
      page_request_uid: pageRequestUid,
      status_code: transaction.status_code,
      amount: transaction.amount,
      currency: transaction.currency,
      more_info: transaction.more_info,
      more_info_1_phone: transaction.more_info_1,
      more_info_2_name: transaction.more_info_2,
      customer_email: callbackData.customer_email
    });

    // status_code "000" = עסקה מוצלחת
    const isApproved = transaction.status_code === '000';

    if (isApproved) {
      // שימוש בנתונים ישירות מה-callback
      // PayPlus לא מחזיר phone/name ב-data, אז שומרים אותם ב-more_info_1/more_info_2
      const customerEmail = callbackData.customer_email;
      const customerName  = transaction.more_info_2 || callbackData.customer_name;
      const customerPhone = transaction.more_info_1 || callbackData.customer_phone;
      const productKey    = transaction.more_info;
      const product       = productKey && PRODUCTS[productKey] ? PRODUCTS[productKey] : null;

      console.log('Transaction approved, sending notifications:', {
        customerEmail, customerName, customerPhone, productKey, hasProduct: !!product
      });

      if (product) {
        // URL אישי עם שם הלקוח — מרגיש כמו חשבון אישי
        const personalProduct = { ...product };
        if (customerName) {
          const sep = product.url.includes('?') ? '&' : '?';
          personalProduct.url = product.url + sep + 'u=' + encodeURIComponent(customerName);
        }
        const tasks = [];
        if (customerEmail) tasks.push(sendTutorialEmail(customerEmail, customerName, personalProduct));
        if (customerPhone) tasks.push(sendWhatsApp(customerPhone, customerName, personalProduct));
        if (tasks.length) await Promise.allSettled(tasks);
      } else {
        console.warn('Cannot send notifications:', { customerEmail, customerPhone, productKey, hasProduct: !!product });
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
