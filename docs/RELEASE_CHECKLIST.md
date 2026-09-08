# Checklist de release v1.0.0

Use `[x]` somente com evidência do ambiente que será publicado. Itens marcados como pendentes bloqueiam a tag v1.0.0.

## Autenticação

- [ ] cadastro e confirmação de e-mail em ambiente de homologação;
- [ ] login por senha e Google;
- [x] logout e guarda da rota principal cobertos por E2E;
- [ ] recuperação e definição de nova senha com e-mail real.

## Segurança

- [x] teste transacional A/B executado sem resíduos;
- [x] usuário não altera plano nem role;
- [x] Service Role isolada em módulo de servidor;
- [x] chaves privadas sem prefixo `NEXT_PUBLIC_`;
- [x] `public.audit_logs` protegida por RLS e exclusiva da Service Role;
- [x] advisors Supabase sem findings de nível `ERROR` após as migrations;

## Stripe

- [x] checkout escolhe Price ID no servidor;
- [x] webhook valida assinatura e possui idempotência por Event ID;
- [x] status não pagos perdem entitlement;
- [ ] testar PRO e PREMIUM no Stripe Test Mode;
- [ ] testar renovação, cancelamento, `past_due` e Billing Portal.

## IA e OCR

- [x] autenticação, autorização, validação e limite de payload;
- [x] cotas persistidas;
- [x] OCR sem itens inventados e com confiança;
- [ ] smoke test dos provedores com credenciais de homologação.

## Financeiro e agenda

- [x] transferências fora de receita e despesa;
- [x] escopos pessoal e empresarial separados;
- [x] simulações e indisponibilidade de mercado identificadas;
- [x] agendamento persiste mesmo se convite falhar;
- [x] idempotência de agendamento validada por constraint no banco.

## Conta e qualidade

- [x] edição segura de perfil, exportação e exclusão implementadas;
- [x] typecheck e testes unitários aprovados;
- [x] CI configurada para bloquear build quebrado;
- [x] lint completo sem erros (avisos legados permanecem rastreados);
- [ ] E2E autenticado e integrações reais aprovados;
- [x] build de produção aprovado com variáveis de validação sem segredos;
- [ ] dependências sem vulnerabilidades críticas conhecidas.
