/**
 * api/payplus-webhook.js — Vercel Serverless Function
 * מקבל התראות IPN מ-PayPlus כשתשלום מתבצע
 *
 * PayPlus שולח POST עם פרטי העסקה לאחר תשלום מוצלח/נכשל.
 * ה-endpoint הזה מאמת את העסקה מול PayPlus API ומלוג את התוצאה.
 */

const PAYPLUS_BASE_URL = process.env.PAYPLUS_ENV === 'production'
  ? 'https://restapi.payplus.co.il'
  : 'https://restapidev.payplus.co.il';

const API_KEY    = process.env.PAYPLUS_API_KEY;
const SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transaction_uid, page_request_uid } = req.body || {};

    if (!transaction_uid && !page_request_uid) {
      console.error('Webhook: missing transaction identifiers', req.body);
      return res.status(400).json({ error: 'Missing transaction data' });
    }

    console.log('PayPlus webhook received:', {
      transaction_uid,
      page_request_uid,
      status: req.body?.status,
      status_description: req.body?.status_description,
      amount: req.body?.amount,
      currency_code: req.body?.currency_code,
      type: req.body?.type
    });

    // אימות העסקה מול PayPlus API
    if (page_request_uid) {
      const verifyResponse = await fetch(`${PAYPLUS_BASE_URL}/api/v1.0/PaymentPages/ipn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify({ api_key: API_KEY, secret_key: SECRET_KEY })
        },
        body: JSON.stringify({ page_request_uid })
      });

      const verifyData = await verifyResponse.json();
      const paymentStatus = verifyData?.data?.status_description;

      console.log('PayPlus IPN verification:', {
        page_request_uid,
        verified_status: paymentStatus,
        amount: verifyData?.data?.amount,
        customer_email: verifyData?.data?.customer_email
      });
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
