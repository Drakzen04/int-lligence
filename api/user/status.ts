import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  // Pour l'instant retourne toujours false (gratuit)
  // TODO: connecte ta base de données pour vérifier le statut premium
  res.json({ isPremium: false });
}
