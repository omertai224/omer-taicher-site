/**
 * api/payplus.js — Vercel Serverless Function
 * תקשורת עם PayPlus בצד השרת
 *
 * Environment Variables ב-Vercel:
 *   PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY, PAYPLUS_PAGE_UID
 *   PAYPLUS_ENV=production (לפרודקשן בלבד)
 */

const PAYPLUS_BASE_URL = process.env.PAYPLUS_ENV === 'production'
  ? 'https://restapi.payplus.co.il'
  : 'https://restapidev.payplus.co.il';

const API_KEY    = process.env.PAYPLUS_API_KEY    || 'dac11423-0481-4d1b-a08d-98485b596c2e';
const SECRET_KEY = process.env.PAYPLUS_SECRET_KEY || '6352f66d-931d-47c2-b562-f2fd5016da00';
const PAGE_UID   = process.env.PAYPLUS_PAGE_UID   || '1e3f5175-576a-4abf-962c-b5e19dd82da8';

export default async function handler(req, res) {
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
      customerPhone
    } = req.body;

    if (!productName || !amount) {
      return res.status(400).json({ error: 'חסרים פרטי מוצר' });
    }

    const successUrl = productKey
      ? `https://omertai.net/pages/checkout/success.html?product=${productKey}`
      : 'https://omertai.net/pages/checkout/success.html';

    const failUrl = productKey
      ? `https://omertai.net/pages/checkout/?product=${productKey}&status=failed`
      : 'https://omertai.net/pages/checkout/?status=failed';

    const cancelUrl = productKey
      ? `https://omertai.net/pages/checkout/?product=${productKey}&status=cancelled`
      : 'https://omertai.net/pages/checkout/?status=cancelled';

    const payload = {
      payment_page_uid: PAGE_UID,
      charge_method: 1,
      amount: parseFloat(amount),
      currency_code: 'ILS',
      sendEmailApproval: true,
      sendEmailFailure: false,
      initial_invoice: true,
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
      fail_url: failUrl,
      cancel_url: cancelUrl
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
