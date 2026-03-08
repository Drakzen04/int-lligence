import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTCH_PAY_KEY = process.env.NOTCH_PAY_PRIVATE_KEY;
  if (!NOTCH_PAY_KEY) return res.status(500).json({ error: 'Notch Pay API Key non configurée' });

  try {
    const { amount, currency, email, description, phone } = req.body;

    const initResponse = await axios.post(
      'https://api.notchpay.co/payments/initialize',
      {
        amount,
        currency: currency || 'XAF',
        email,
        description: description || 'Djiogo.ai Pro Subscription',
        callback: process.env.APP_URL || 'https://ton-app.vercel.app'
      },
      { headers: { Authorization: NOTCH_PAY_KEY, Accept: 'application/json' } }
    );

    const { reference } = initResponse.data.transaction;

    if (phone) {
      let channel = 'cm.orange';
      const cleanPhone = phone.replace(/\s/g, '').replace('+237', '');
      if (
        cleanPhone.startsWith('67') || cleanPhone.startsWith('68') ||
        cleanPhone.startsWith('650') || cleanPhone.startsWith('651') ||
        cleanPhone.startsWith('652') || cleanPhone.startsWith('653') ||
        cleanPhone.startsWith('654')
      ) {
        channel = 'cm.mtn';
      }

      try {
        const chargeResponse = await axios.post(
          `https://api.notchpay.co/payments/${reference}/charge`,
          { channel, data: { phone: cleanPhone } },
          { headers: { Authorization: NOTCH_PAY_KEY, Accept: 'application/json' } }
        );
        return res.json({ ...initResponse.data, charge: chargeResponse.data });
      } catch (chargeError: any) {
        return res.json({
          ...initResponse.data,
          charge_error: chargeError.response?.data?.message || 'Erreur lors de la charge'
        });
      }
    }

    res.json(initResponse.data);
  } catch (error: any) {
    console.error('Erreur paiement:', error.response?.data || error.message);
    res.status(500).json({ error: 'Initialisation du paiement échouée' });
  }
}
