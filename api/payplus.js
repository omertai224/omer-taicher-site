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

const API_KEY    = process.env.PAYPLUS_API_KEY;
const SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAGE_UID   = process.env.PAYPLUS_PAGE_UID;

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

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10000) {
      return res.status(400).json({ error: 'סכום לא תקין' });
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'כתובת אימייל לא תקינה' });
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
      amount: parsedAmount,
      currency_code: 'ILS',
      sendEmailApproval: true,
      sendEmailFailure: false,
      initial_invoice: true,
      products: [
        {
          name: productName,
          quantity: 1,
          price: parsedAmount
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
