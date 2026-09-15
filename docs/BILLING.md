# Billing

## Planos e entitlements

| Recurso | FREE | PRO | PREMIUM |
| --- | ---: | ---: | ---: |
| IA por dia | 5 | 50 | 100 |
| OCR por mês | 3 | 50 | 100 |
| Cartões | 3 | ilimitado | ilimitado |
| Metas | 3 | ilimitado | ilimitado |
| Investimentos e dívidas | bloqueado | liberado | liberado |
| Modo profissional | bloqueado | bloqueado | liberado |

Somente `active` e `trialing` concedem acesso pago. `past_due`, `canceled`, `incomplete` e `unpaid` retornam os entitlements FREE.

## Checkout

`POST /api/checkout` aceita apenas `{ "plan": "pro" | "premium" }`. O servidor resolve o Price ID pelas variáveis privadas e vincula a sessão ao usuário autenticado. O cliente nunca decide o Price ID nem o plano final persistido.

## Webhook

`POST /api/webhooks/stripe` valida o corpo bruto com `STRIPE_WEBHOOK_SECRET`. Eventos relevantes são normalizados e enviados à função `process_stripe_subscription_event`. `stripe_events.event_id` impede reprocessamento do mesmo evento.

Eventos cobertos incluem criação, atualização e exclusão de assinatura, checkout concluído, pagamento de fatura e falha de pagamento. Eventos desconhecidos retornam sucesso sem mutação para evitar retries desnecessários.

## Portal, cancelamento e mudanças

`POST /api/billing/portal` cria uma sessão do Billing Portal para o customer associado ao usuário. Upgrade, downgrade e cancelamento são refletidos pelo webhook, não por parâmetros do browser. Se `cancel_at_period_end` estiver ativo, o acesso continua enquanto o status permanecer pago. Após `canceled` ou `past_due`, a aplicação aplica o plano FREE.

## Testes

Use produtos e preços do Stripe Test Mode, um endpoint de webhook de teste e contas dedicadas. Valide PRO, PREMIUM, checkout cancelado/aprovado, renovação, `past_due`, replay do mesmo Event ID e Portal. Não reutilize customers de produção.
