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
const WA_INSTANCE  = process.env.GREENAPI_INSTANCE_ID;
const WA_TOKEN     = process.env.GREENAPI_TOKEN;
const SENDMSG_SITE_ID  = process.env.SENDMSG_SITE_ID;
const SENDMSG_PASSWORD = process.env.SENDMSG_PASSWORD;

const PRODUCTS = {
  vibe:       { name: 'כלי AI שממיר כל סרטון והקלטה לטקסט, בעברית', url: 'https://omertai.net/interactive/tutorials/Vibe/' },
  everything: { name: 'Everything - חיפוש מיידי בכל הקבצים במחשב', url: 'https://omertai.net/interactive/tutorials/Everything/' },
  security:   { name: 'סיסמאות, אימות דו-שלבי ואבטחת חשבונות', url: 'https://omertai.net/interactive/tutorials/Security/' }
};

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

// שולח מייל דרך שלח מסר — תומך במוצר בודד או כמה מוצרים (products = מערך)
async function sendTutorialEmail(customerEmail, customerName, products) {
  if (!SENDMSG_SITE_ID || !SENDMSG_PASSWORD || !customerEmail) return;

  const isMulti = products.length > 1;
  const subject = isMulti
    ? `ההדרכות שלכם מוכנות (${products.length} הדרכות)`
    : `ההדרכה שלכם מוכנה - ${products[0].name}`;

  const greeting = isMulti ? 'ההדרכות שלכם מוכנות ומחכות.' : 'ההדרכה שלכם מוכנה ומחכה.';

  // בלוק מוצרים — כל מוצר עם שם + כפתור
  const productBlocks = products.map(product => `
    <div style="background:#fdf8f2;border-radius:12px;padding:16px;margin-bottom:12px;">
      <p style="margin:0 0 4px;font-size:0.75rem;color:#8a7f72;font-weight:700;">מה קניתם</p>
      <p style="margin:0;font-size:0.95rem;color:#1a4a6b;font-weight:800;">${product.name}</p>
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${product.url}" style="display:inline-block;background:#e8854a;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:800;font-size:1rem;">
        עברו להדרכה עכשיו &#8592;
      </a>
    </div>
  `).join('<hr style="border:none;border-top:1px solid #e8e0d5;margin:8px 0 16px;">');

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
      <div style="width:56px;height:56px;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:50%;display:inline-block;line-height:56px;text-align:center;font-size:28px;color:#fff;">&#10003;</div>
    </div>
    <h1 style="text-align:center;color:#1a4a6b;font-size:1.4rem;margin:0 0 8px;">התשלום התקבל בהצלחה</h1>
    <p style="text-align:center;color:#8a7f72;font-size:0.9rem;margin:0 0 24px;">
      ${customerName ? customerName + ',' : ''} ${greeting}
    </p>
    ${productBlocks}
    <p style="text-align:center;color:#8a7f72;font-size:0.78rem;margin-top:16px;">
      ${isMulti ? 'הקישורים האלה שלכם לצמיתות. שמרו את המייל הזה.' : 'הקישור הזה שלכם לצמיתות. שמרו את המייל הזה.'}
    </p>
  </div>
  <p style="text-align:center;color:#8a7f72;font-size:0.75rem;margin-top:20px;">
    שאלות? <a href="mailto:omertai224@gmail.com" style="color:#1a4a6b;font-weight:700;">omertai224@gmail.com</a>
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
          EmailAddress: customerEmail,
          FirstName: customerName || ''
        }],
        Message: {
          MessageContent: htmlContent,
          MessageSubject: subject,
          MessageInnerName: 'purchase-' + Date.now(),
          SenderEmailAddress: 'omertai224@gmail.com',
          MessageDirection: 1,
          MessageBackColor: '#fdf8f2'
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('SendMsg email error:', response.status, err);
    } else {
      const result = await response.json();
      console.log('Tutorial email sent to:', customerEmail, result);
    }
  } catch (err) {
    console.error('SendMsg email error:', err.message);
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

// שולח WhatsApp — תומך במוצר בודד או כמה מוצרים (products = מערך)
async function sendWhatsApp(customerPhone, customerName, products) {
  if (!WA_INSTANCE || !WA_TOKEN || !customerPhone) return;

  const chatId = formatPhone(customerPhone);
  if (!chatId) return;

  const name = customerName ? ` ${customerName}` : '';
  const isMulti = products.length > 1;

  // בניית בלוק לכל מוצר
  const productBlocks = products.map(product => {
    return `*${product.name}*\n\nלחצו כאן: ${product.url}`;
  }).join('\n\n\n');

  const intro = isMulti
    ? `התשלום התקבל בהצלחה ✅\n\n${products.length} הדרכות מוכנות עבורכם:`
    : `התשלום התקבל בהצלחה ✅\n\nההדרכה מוכנה עבורכם:`;

  const message = `היי${name} 👋\n\n${intro}\n\n${productBlocks}\n\nשאלות?\nפשוט תענו להודעה הזו 😊\nעומר טייכר`;

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
      const moreInfo      = transaction.more_info || '';

      // תמיכה במוצר בודד ("vibe") או כמה מוצרים ("vibe,everything")
      const productKeys = moreInfo.split(',').filter(k => k && PRODUCTS[k]);

      console.log('Transaction approved, sending notifications:', {
        customerEmail, customerName, customerPhone, productKeys
      });

      if (productKeys.length > 0) {
        // בניית מערך מוצרים עם URL אישי לכל אחד
        const personalProducts = productKeys.map(key => {
          const product = { ...PRODUCTS[key] };
          if (customerName) {
            const sep = product.url.includes('?') ? '&' : '?';
            product.url = product.url + sep + 'u=' + encodeURIComponent(customerName);
          }
          return product;
        });

        const tasks = [];
        if (customerEmail) tasks.push(sendTutorialEmail(customerEmail, customerName, personalProducts));
        if (customerPhone) tasks.push(sendWhatsApp(customerPhone, customerName, personalProducts));
        if (tasks.length) await Promise.allSettled(tasks);
      } else {
        console.warn('Cannot send notifications:', { customerEmail, customerPhone, moreInfo });
      }
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
