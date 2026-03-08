import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const event = req.body;
  console.log('Webhook reçu:', event.event);

  if (event.event === 'payment.complete') {
    const email = event.data?.customer?.email;
    console.log(`Paiement confirmé pour: ${email}`);
    // TODO: Enregistre dans ta base de données (Supabase, PlanetScale, etc.)
  }

  res.sendStatus(200);
}
