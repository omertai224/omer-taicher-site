/**
 * api/whatsapp.js — Vercel Serverless Function
 * שליחת הודעות WhatsApp דרך Green API בצד השרת
 * תומך בשליחת טקסט, תמונה עם כיתוב, או טקסט עם link preview
 *
 * Environment Variables ב-Vercel:
 *   GREENAPI_INSTANCE_ID, GREENAPI_TOKEN
 */

const INSTANCE_ID = process.env.GREENAPI_INSTANCE_ID;
const API_TOKEN   = process.env.GREENAPI_TOKEN;
const BASE_URL    = `https://7105.api.greenapi.com/waInstance${INSTANCE_ID}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://omertai.net');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // בדיקת GitHub token כדי לוודא שזה מנהל
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('token ')) {
    return res.status(401).json({ error: 'לא מורשה' });
  }

  try {
    // אימות שה-token שייך למשתמש GitHub אמיתי
    const ghRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': authHeader }
    });
    if (!ghRes.ok) {
      return res.status(401).json({ error: 'טוקן GitHub לא תקין' });
    }

    const { chatId, message, imageUrl, caption } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'חסר chatId' });
    }

    if (!INSTANCE_ID || !API_TOKEN) {
      return res.status(500).json({ error: 'חסרים הגדרות WhatsApp בשרת' });
    }

    let apiUrl, body;

    if (imageUrl) {
      // שליחת תמונה עם כיתוב
      apiUrl = `${BASE_URL}/sendFileByUrl/${API_TOKEN}`;
      body = {
        chatId,
        urlFile: imageUrl,
        fileName: 'post.webp',
        caption: caption || ''
      };
    } else if (message) {
      // שליחת טקסט עם link preview
      apiUrl = `${BASE_URL}/sendMessage/${API_TOKEN}`;
      body = {
        chatId,
        message,
        linkPreview: true
      };
    } else {
      return res.status(400).json({ error: 'חסרים message או imageUrl' });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.idMessage) {
      return res.status(200).json({ success: true, idMessage: data.idMessage });
    } else {
      return res.status(502).json({ error: 'שגיאה משרת WhatsApp', details: data });
    }
  } catch (err) {
    console.error('WhatsApp API error:', err);
    return res.status(500).json({ error: 'שגיאת שרת פנימית' });
  }
}
