/**
 * api/payplus.js — Vercel Serverless Function
 * מטפל בתקשורת עם PayPlus בצד השרת (המפתחות לא חשופים בצד הלקוח)
 *
 * להחלפה לפרודקשן: שנו את המפתחות ב-Environment Variables ב-Vercel:
 *   PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY, PAYPLUS_PAGE_UID, PAYPLUS_ENV=production
 */

const PAYPLUS_BASE_URL = process.env.PAYPLUS_ENV === 'production'
  ? 'https://restapi.payplus.co.il'
  : 'https://restapidev.payplus.co.il';

const API_KEY    = process.env.PAYPLUS_API_KEY    || 'dac11423-0481-4d1b-a08d-98485b596c2e';
const SECRET_KEY = process.env.PAYPLUS_SECRET_KEY || '6352f66d-931d-47c2-b562-f2fd5016da00';
const PAGE_UID   = process.env.PAYPLUS_PAGE_UID   || '1e3f5175-576a-4abf-962c-b5e19dd82da8';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://omertai.net');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      productName,
      productKey,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      failUrl
    } = req.body;

    if (!productName || !amount) {
      return res.status(400).json({ error: 'חסרים פרטי מוצר' });
    }

    // success_url עם פרמטר המוצר — מוביל לדף ההצלחה שלנו
    const successUrl = productKey
      ? `https://omertai.net/pages/checkout/success.html?product=${productKey}`
      : 'https://omertai.net/pages/checkout/success.html';

    const defaultFailUrl = productKey
      ? `https://omertai.net/pages/checkout/?product=${productKey}&status=failed`
      : 'https://omertai.net/pages/checkout/?status=failed';

    const defaultCancelUrl = productKey
      ? `https://omertai.net/pages/checkout/?product=${productKey}&status=cancelled`
      : 'https://omertai.net/pages/checkout/?status=cancelled';

    const payload = {
      payment_page_uid: PAGE_UID,
      charge_default: {
        charge_type: 'regular',
        number_of_payments: 1
      },
      amount: parseFloat(amount),
      currency_code: 'ILS',
      order: {
        total_price: parseFloat(amount),
        vat_type: 1,
        language_code: 'HE',
        currency_code: 'ILS'
      },
      products: [
        {
          name: productName,
          quantity: 1,
          price: parseFloat(amount)
        }
      ],
      customer: {
        customer_name: customerName || '',
        email: customerEmail || '',
        phone: customerPhone || ''
      },
      success_url: successUrl,
      fail_url: failUrl || defaultFailUrl,
      cancel_url: defaultCancelUrl
    };

    const response = await fetch(`${PAYPLUS_BASE_URL}/api/v1.0/PaymentPages/generateLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': JSON.stringify({ api_key: API_KEY, secret_key: SECRET_KEY })
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const status = data?.results?.status;

    if (!response.ok || (status !== '1' && status !== 'success')) {
      console.error('PayPlus error:', data);
      return res.status(502).json({ error: 'שגיאה ביצירת קישור תשלום', details: data });
    }

    return res.status(200).json({
      paymentUrl: data.data?.payment_page_link,
      transactionUid: data.data?.page_request_uid
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'שגיאת שרת פנימית' });
  }
}
