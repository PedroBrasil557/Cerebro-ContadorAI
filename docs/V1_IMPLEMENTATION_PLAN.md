# Cérebro.IA v1.0 — execução em 8 blocos

Este agrupamento preserva a ordem obrigatória do plano técnico original. Cada bloco deve terminar com typecheck, lint, testes e build; falhas herdadas da baseline ficam registradas até serem corrigidas no bloco responsável.

## Bloco 1 — Base segura

- baseline e branch `release/v1-hardening`;
- package/tooling, validação de ambiente e `.env.example`;
- clientes Supabase browser/server/admin;
- helpers de autenticação, erros e respostas;
- rotas públicas e recuperação de senha.

## Bloco 2 — Banco, planos e Stripe

- migrations aditivas, RLS, subscriptions, eventos e consumo;
- checkout por código de plano, webhook idempotente e Billing Portal;
- entitlements como fonte de verdade;
- integração de plano na navegação e no perfil.

## Bloco 3 — IA, OCR, agenda e recibos

- autenticação, autorização, Zod e cotas nas APIs de IA;
- OCR limitado, sem dados inventados, parser puro e testes;
- remoção do Gemini público;
- agendamento sem duplicação e status de convite;
- recibos em Storage privado com Signed URL.

## Bloco 4 — Integridade financeira e qualidade interna

- cálculos financeiros e transferências;
- separação pessoal/empresarial;
- remoção de scores, CDI e demais hardcodes fictícios;
- tipagem única;
- erros estruturados, logger e redução de refetch.

## Bloco 5 — Ciclo de conta, jurídico e administração

- exportação e exclusão de conta;
- política de privacidade e termos coerentes com a v1;
- painel administrativo protegido e métricas agregadas;
- branding centralizado e remoção confirmada de código morto.

## Bloco 6 — Testes

- testes unitários obrigatórios;
- testes de integração/RLS entre usuários A e B;
- E2E de autenticação, finanças, billing e perfil.

## Bloco 7 — Entrega e operação

- CI no GitHub;
- README e documentação de arquitetura, banco, billing e segurança;
- observabilidade sem vazamento de dados financeiros.

## Bloco 8 — Revisão de lançamento

- acessibilidade, UX crítica e mobile;
- revisão final de validação, headers, concorrência e performance;
- auditoria de segurança;
- `npm run check`, E2E e build de produção;
- checklist final antes da tag `v1.0.0`.
