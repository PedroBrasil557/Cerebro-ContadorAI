# Observabilidade

O logger estruturado em `lib/logger.ts` é o ponto de integração com a plataforma de logs. As respostas de erro carregam um `requestId` no JSON e no header `x-request-id` para correlação.

Campos permitidos: timestamp, nível, mensagem genérica, feature, route, provider, plan, environment, duração, código do erro, requestId e ID de usuário mascarado. Campos proibidos: valores financeiros, descrições de transações, prompts, OCR bruto, imagens, e-mails, nomes, tokens, cookies e segredos.

Alertas recomendados:

- aumento de respostas 500 por rota;
- falhas Supabase, Stripe, Groq, OCR e SMTP;
- webhook inválido ou repetidamente falho;
- latência e timeout por provedor;
- aumento de rejeições por cota.

Sentry não é dependência obrigatória. Se configurado no futuro, os hooks `beforeSend` devem remover request body, headers de autenticação, cookies e breadcrumbs com dados financeiros; tags devem se limitar a `feature`, `route`, `plan` e `environment`.
