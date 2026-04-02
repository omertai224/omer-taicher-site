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

// טוען כללי הנחות מ-interactive.json
function loadDiscountRules() {
  try {
    const raw = readFileSync(join(process.cwd(), 'interactive', 'interactive.json'), 'utf8');
    const data = JSON.parse(raw);
    return data.discountRules || [];
  } catch(e) {
    return [];
  }
}

// טוען מוצרים מ-interactive.json (מקור אמת יחיד)
function loadProducts() {
  try {
    const raw = readFileSync(join(process.cwd(), 'interactive', 'interactive.json'), 'utf8');
    const data = JSON.parse(raw);
    const items = data.products || data; // תומך בפורמט ישן (מערך) וחדש (אובייקט עם products)
    const map = {};
    items.forEach(function(item) {
      if (item.key) {
        map[item.key] = { name: item.title, price: item.price };
        if (item.bundleKeys) map[item.key].bundleKeys = item.bundleKeys;
      }
    });
    return map;
  } catch(e) {
    // fallback אם הקובץ לא נמצא
    return {
      vibe:       { name: 'כלי AI שממיר כל סרטון והקלטה לטקסט, בעברית', price: 47 },
      everything: { name: 'Everything - חיפוש מיידי בכל הקבצים במחשב', price: 47 },
      taskmanager: { name: 'מנהל המשימות - השלט רחוק של המחשב', price: 47 },
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
      customerPhone,
      testMode,
      testSecret
    } = req.body;

    // מצב בדיקה — מחיר 3 ש"ח לכל מוצר (מוגן בסיסמה)
    const isTestMode = testMode === true && testSecret === 'omer-test-2026';

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
      vibe: 'https://omertai.net/interactive/tutorials/Apps/Vibe/',
      everything: 'https://omertai.net/interactive/tutorials/Apps/Everything/',
      taskmanager: 'https://omertai.net/interactive/tutorials/Windows/TaskManager/',
      security: 'https://omertai.net/interactive/tutorials/Security/'
    };

    // פירוק חבילות — חבילה מכילה bundleKeys שמצביעים להדרכות בודדות
    // more_info שומר את ה-keys המקוריים (כולל חבילות) לחישוב מחיר
    // tutorialKeys = ההדרכות בפועל שהלקוח מקבל גישה אליהן
    const tutorialKeys = [];
    validKeys.forEach(k => {
      if (PRODUCTS[k].bundleKeys) {
        PRODUCTS[k].bundleKeys.forEach(bk => {
          if (TUTORIAL_URLS[bk] && tutorialKeys.indexOf(bk) === -1) tutorialKeys.push(bk);
        });
      } else if (TUTORIAL_URLS[k]) {
        if (tutorialKeys.indexOf(k) === -1) tutorialKeys.push(k);
      }
    });

    // הנחות כמות — נטענות מ-interactive.json (discountRules)
    const paidSingles = validKeys.filter(k => PRODUCTS[k].price > 0 && !PRODUCTS[k].bundleKeys);
    const discountRules = loadDiscountRules();
    const discountPct = discountRules.reduce((best, rule) => paidSingles.length >= rule.minItems ? rule.percent : best, 0);

    // סכום כולל + רשימת מוצרים ל-PayPlus
    const pricePerItem = isTestMode ? 3 : null;
    const rawTotal = validKeys.reduce((sum, k) => sum + (pricePerItem || PRODUCTS[k].price), 0);
    const savings = isTestMode ? 0 : Math.round(rawTotal * discountPct / 100);
    const totalAmount = rawTotal - savings;
    const payPlusProducts = validKeys.map(k => ({
      name: PRODUCTS[k].name + (isTestMode ? ' (בדיקה)' : ''),
      quantity: 1,
      price: pricePerItem || PRODUCTS[k].price
    }));

    // הפניה: הדרכה בודדת → ישירות אליה. חבילה/כמה → דף תודה
    const successUrl = tutorialKeys.length === 1
      ? (TUTORIAL_URLS[tutorialKeys[0]] || 'https://omertai.net/interactive/')
      : 'https://omertai.net/pages/thank-you/';
    const failUrl = validKeys.length === 1
      ? `https://omertai.net/pages/checkout/?product=${validKeys[0]}&status=failed`
      : `https://omertai.net/pages/checkout/?cart=${validKeys.join(',')}&status=failed`;

    // more_info שומר: keys מקוריים + tutorialKeys מפורקים (webhook צריך את שניהם)
    // פורמט: "bundle-key|tutorial1,tutorial2,tutorial3"
    const allKeys = validKeys.join(',');
    const allTutorials = tutorialKeys.join(',');

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
      more_info: allTutorials || allKeys,
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
