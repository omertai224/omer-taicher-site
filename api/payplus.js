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
      vibe:     { name: 'כלי AI שממיר כל סרטון והקלטה לטקסט, בעברית', price: 97 },
      ai:       { name: 'AI לכולם, ChatGPT, Claude וגוגל בשפה שלכם',  price: 47 },
      files:    { name: 'לסדר את המחשב, ארגון קבצים, תיקיות וענן',    price: 47 },
      security: { name: 'גלישה בטוחה, סיסמאות, הגנה ומה לא ללחוץ',  price: 47 },
      google:   { name: 'גוגל מאלף עד תו, Docs, Drive, Gmail ו-Slides', price: 97 }
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
      customerName,
      customerEmail,
      customerPhone
    } = req.body;

    const PRODUCTS = loadProducts();

    if (!productKey || !PRODUCTS[productKey]) {
      return res.status(400).json({ error: 'מוצר לא תקין' });
    }

    const product = PRODUCTS[productKey];

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'כתובת אימייל לא תקינה' });
    }

    const TUTORIAL_URLS = {
      vibe: 'https://omertai.net/interactive/tutorials/Vibe/',
      ai: 'https://omertai.net/interactive/AI/',
      files: 'https://omertai.net/interactive/Files/',
      security: 'https://omertai.net/interactive/Security/',
      google: 'https://omertai.net/interactive/Google/'
    };
    const successUrl = TUTORIAL_URLS[productKey] || 'https://omertai.net/interactive/';
    const failUrl    = `https://omertai.net/pages/checkout/?product=${productKey}&status=failed`;

    const payload = {
      payment_page_uid: PAGE_UID,
      charge_method: 1,
      amount: product.price,
      currency_code: 'ILS',
      sendEmailApproval: true,
      sendEmailFailure: true,
      initial_invoice: true,
      products: [
        {
          name: product.name,
          quantity: 1,
          price: product.price
        }
      ],
      customer: {
        customer_name: customerName || '',
        email: customerEmail || '',
        phone: customerPhone || ''
      },
      more_info: productKey,
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
