import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore - Ignoramos o erro de versão se o TS reclamar, mas usamos a que o sistema pediu
  apiVersion: '2026-02-25.clover', 
  appInfo: {
    name: 'Cérebro.OS',
    version: '2.0.0',
  },
});