# Arquitetura

## Visão geral

```text
Browser
  ↓
Next.js (App Router)
  ├─ páginas e componentes React
  ├─ Server Actions
  └─ Route Handlers /api/*
       ↓
Supabase Postgres/Auth/Storage · Stripe · Groq · SMTP
```

O browser nunca recebe chaves privadas. A chave pública do Supabase identifica o projeto, enquanto a sessão do usuário e as políticas RLS determinam quais linhas podem ser acessadas.

## Limites de confiança

Operações diretas ao Supabase são aceitáveis para CRUD de dados pertencentes ao usuário quando a tabela tem RLS habilitada, políticas por `auth.uid()` e privilégios mínimos. O cliente ainda inclui filtros por `user_id` por clareza e eficiência, mas o filtro não substitui RLS.

Devem passar pelo backend:

- Stripe Checkout, Portal e webhook;
- chamadas Groq e limites de IA;
- OCR e processamento de arquivos;
- agendamento e SMTP;
- métricas administrativas;
- exportação e exclusão da conta;
- qualquer uso da Service Role.

## Organização

- `app/`: rotas, páginas e limites server/client;
- `core/action/`: Server Actions autenticadas;
- `core/finance/` e `core/engines/`: regras puras testáveis;
- `lib/`: clientes, env, billing, validação, segurança e observabilidade;
- `modules/`: interfaces de domínio;
- `services/`: consultas de dados reutilizadas;
- `supabase/migrations/`: mudanças aditivas e auditáveis do schema.

## Fluxos críticos

No billing, o cliente envia apenas o código de plano; o servidor escolhe o Price ID. O webhook valida a assinatura e uma função transacional registra o Event ID antes de atualizar a assinatura. Em IA/OCR, o backend autentica, valida o payload, consulta o entitlement e consome a cota antes de chamar o provedor. No Storage, recibos são privados e entregues por URL assinada temporária.
