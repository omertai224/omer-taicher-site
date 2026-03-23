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

import { readFileSync } from 'fs';
import { join } from 'path';

// טוען מוצרים מ-interactive.json (מקור אמת יחיד)
function loadProducts() {
  try {
    const raw = readFileSync(join(process.cwd(), 'interactive', 'interactive.json'), 'utf8');
    const items = JSON.parse(raw);
    const map = {};
    items.forEach(function(item) {
      if (item.key) map[item.key] = { name: item.title, price: item.price };
    });
    return map;
  } catch(e) {
    // fallback אם הקובץ לא נמצא
    return {
      vibe:       { name: 'כלי AI שממיר כל סרטון והקלטה לטקסט, בעברית', price: 47 },
      everything: { name: 'Everything — חיפוש מיידי בכל הקבצים במחשב', price: 47 },
      security:   { name: 'סיסמאות, אימות דו-שלבי ואבטחת חשבונות', price: 47 }
    };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://omertai.net');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      productKey,
      productKeys,
      customerName,
      customerEmail,
      customerPhone
    } = req.body;

    const PRODUCTS = loadProducts();

    // תמיכה במוצר בודד או כמה מוצרים בסל
    const keys = (productKeys && productKeys.length) ? productKeys : (productKey ? [productKey] : []);
    const validKeys = keys.filter(k => PRODUCTS[k]);

    if (validKeys.length === 0) {
      return res.status(400).json({ error: 'מוצר לא תקין' });
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'כתובת אימייל לא תקינה' });
    }

    const TUTORIAL_URLS = {
      vibe: 'https://omertai.net/interactive/tutorials/Vibe/',
      everything: 'https://omertai.net/interactive/tutorials/Everything/',
      security: 'https://omertai.net/interactive/tutorials/Security/'
    };

    // סכום כולל + רשימת מוצרים ל-PayPlus
    const totalAmount = validKeys.reduce((sum, k) => sum + PRODUCTS[k].price, 0);
    const payPlusProducts = validKeys.map(k => ({
      name: PRODUCTS[k].name,
      quantity: 1,
      price: PRODUCTS[k].price
    }));

    // אם מוצר בודד — הפניה ישירה להדרכה. כמה מוצרים — לדף ההדרכות
    const successUrl = validKeys.length === 1
      ? (TUTORIAL_URLS[validKeys[0]] || 'https://omertai.net/interactive/')
      : 'https://omertai.net/interactive/';
    const failUrl = validKeys.length === 1
      ? `https://omertai.net/pages/checkout/?product=${validKeys[0]}&status=failed`
      : `https://omertai.net/pages/checkout/?cart=${validKeys.join(',')}&status=failed`;

    // more_info שומר את כל ה-keys (מופרד בפסיקים) — ה-webhook יודע לפרסר
    const allKeys = validKeys.join(',');

    const payload = {
      payment_page_uid: PAGE_UID,
      charge_method: 1,
      amount: totalAmount,
      currency_code: 'ILS',
      sendEmailApproval: true,
      sendEmailFailure: true,
      initial_invoice: true,
      products: payPlusProducts,
      customer: {
        customer_name: customerName || '',
        email: customerEmail || '',
        phone: customerPhone || ''
      },
      more_info: allKeys,
      more_info_1: customerPhone || '',
      more_info_2: customerName || '',
      refURL_success: successUrl,
      refURL_failure: failUrl,
      refURL_callback: 'https://omertai.net/api/payplus-webhook',
      send_failure_callback: true
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

    console.log('PayPlus generateLink response:', JSON.stringify(data, null, 2));

    if (!response.ok || (status !== '1' && status !== 'success')) {
      console.error('PayPlus error:', data);
      return res.status(502).json({ error: 'שגיאה ביצירת קישור תשלום' });
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
