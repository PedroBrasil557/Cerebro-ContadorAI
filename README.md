# Cérebro.IA

Cérebro.IA é uma plataforma de organização financeira pessoal e profissional. O produto reúne fluxo de caixa, cartões, dívidas, metas, investimentos, compras, agenda e análises assistidas por IA em uma única aplicação web.

## Principais funcionalidades

- dashboard e transações separados por escopo pessoal e empresarial;
- cartões, metas, dívidas, patrimônio e investimentos;
- leitura de recibos por OCR com revisão dos resultados;
- chat financeiro, estratégia de dívidas e análise de CFO via Groq;
- agenda com convite por e-mail e persistência independente do envio;
- planos FREE, PRO e PREMIUM com Stripe Checkout e Billing Portal;
- exportação dos dados e exclusão da conta;
- painel administrativo com métricas agregadas.

## Stack

- Next.js 16, React 19 e TypeScript;
- Tailwind CSS 4, Radix UI, Framer Motion e Recharts;
- Supabase Auth, Postgres, Row Level Security e Storage;
- Stripe Billing;
- Groq para IA e Tesseract.js no servidor para OCR;
- Vitest e Playwright.

## Arquitetura

O browser acessa dados do próprio usuário diretamente pelo cliente Supabase somente quando a tabela está protegida por RLS. Operações privilegiadas, integrações secretas, billing, IA, OCR, agenda, administração e ciclo de vida da conta passam pelo backend Next.js. Consulte `docs/ARCHITECTURE.md` e `docs/DATABASE.md`.

## Requisitos

- Node.js 22 LTS ou superior;
- npm 10 ou superior;
- projeto Supabase;
- conta Stripe em modo de teste ou produção;
- chave Groq;
- credenciais SMTP opcionais para convites.

## Configuração local

```bash
git clone https://github.com/PedroBrasil557/Cerebro-ContadorAI.git
cd Cerebro-ContadorAI
npm ci
cp .env.example .env.local
```

Preencha `.env.local`; nunca faça commit desse arquivo.

## Variáveis de ambiente

| Variável | Escopo | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | público | URL canônica da aplicação |
| `NEXT_PUBLIC_SUPABASE_URL` | público | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | operações administrativas; nunca expor no browser |
| `GROQ_API_KEY` | servidor | APIs de IA |
| `STRIPE_SECRET_KEY` | servidor | Stripe SDK |
| `STRIPE_WEBHOOK_SECRET` | servidor | validação do webhook |
| `STRIPE_PRICE_PRO` | servidor | preço permitido do plano PRO |
| `STRIPE_PRICE_PREMIUM` | servidor | preço permitido do plano PREMIUM |
| `SMTP_USER`, `SMTP_PASS` | servidor, opcionais | envio de convites |
| `FOUNDER_USER_ID` | servidor, opcional | bootstrap controlado do fundador |

As variáveis `SUPABASE_TEST_*` e `E2E_USER_*` são opcionais e devem apontar apenas para contas e ambientes de teste.

## Supabase

As migrations versionadas ficam em `supabase/migrations`. Aplique-as em ordem com a CLI do Supabase ou pelo pipeline controlado da equipe. Depois de qualquer mudança de schema, execute os advisors de segurança e performance e os testes RLS.

## Stripe

Configure os dois Price IDs e encaminhe eventos para `/api/webhooks/stripe`. A aplicação aceita apenas códigos internos `pro` e `premium`; Price IDs enviados pelo cliente não são usados. Veja `docs/BILLING.md`.

## Groq e SMTP

A chave Groq e as credenciais SMTP são lidas somente no servidor. Sem SMTP, o agendamento continua salvo e o convite é marcado como falho para nova tentativa; nenhum segredo deve usar prefixo `NEXT_PUBLIC_`.

## Executar, testar e gerar build

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Os E2E autenticados e os testes RLS exigem as credenciais opcionais descritas em `.env.example`. Sem elas, esses cenários são ignorados explicitamente.

## Estrutura

```text
app/                 páginas e APIs Next.js
core/                regras, ações e layout compartilhado
lib/                 auth, billing, validação, segurança e integrações
modules/             módulos pessoais, profissionais e administrativos
services/            acesso a dados da aplicação
supabase/migrations/  evolução aditiva do banco
tests/                testes unitários, integração/RLS e E2E
docs/                 arquitetura, banco, billing, segurança e release
```

## Segurança e deploy

Antes de publicar, siga `docs/SECURITY.md` e `docs/RELEASE_CHECKLIST.md`. O deploy deve injetar segredos pelo provedor, aplicar migrations antes da nova versão e validar o webhook Stripe no domínio final.

## Licença

Este repositório não publica uma licença de código aberto. Todos os direitos permanecem com o proprietário do projeto até que um arquivo `LICENSE` defina outros termos.
