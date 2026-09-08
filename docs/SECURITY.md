# Segurança

## Controles implementados

- autenticação validada no servidor com `getUser()`;
- RLS e filtros de propriedade nos dados de usuário;
- Service Role importada apenas em módulos `server-only`;
- autorização de plano derivada de subscription confiável;
- Zod nos payloads das APIs críticas;
- assinatura Stripe validada sobre o corpo bruto;
- cotas persistidas e consumidas atomicamente;
- bucket de recibos privado, com caminhos por usuário e URLs assinadas;
- logs estruturados sem payloads financeiros, e-mails, tokens ou segredos;
- IDs de usuário mascarados e `requestId` retornado em erros de API.

## Segredos

Somente URL e chave pública Supabase usam `NEXT_PUBLIC_`. Service Role, Stripe, Groq e SMTP permanecem no servidor e devem ser rotacionados se aparecerem em logs, commits ou artefatos. Arquivos `.env*` são ignorados, com exceção do modelo sem valores `.env.example`.

## RLS

O teste de integração `tests/integration/supabaseRls.test.ts` exige dois usuários dedicados. Ele verifica que A não lê/edita/exclui linhas de B e que A não altera `plan` ou `system_role`. Execute também os advisors após toda migration.

`public.audit_logs` opera como tabela interna: RLS está habilitada e os privilégios de `anon` e `authenticated` foram revogados. Acesso de aplicação é exclusivo da Service Role. A migration também remove a descoberta anônima das tabelas públicas e fixa o `search_path` das funções legadas executadas por triggers.

## Validação e abuso

As APIs limitam tamanho, tipo, enums e formatos antes de chamar provedores. IA, OCR, CFO e estratégia de dívida devem passar pelo limitador central. Limites de cartões/metas precisam existir no backend ou banco, não apenas na interface.

## Observabilidade

Erros de API produzem metadados `feature`, `route`, `provider`, `environment`, código e `requestId`. Não registrar prompts completos, extratos, dívidas, recibos, tokens, e-mails ou respostas integrais dos provedores. Se Sentry for ativado, aplicar scrubbing antes do envio e usar apenas as mesmas tags seguras.

## Resposta a incidente

1. revogar ou rotacionar o segredo afetado;
2. preservar logs e Event IDs sem copiar dados financeiros;
3. avaliar escopo por usuário, rota e período;
4. corrigir política ou código por migration e pull request;
5. testar RLS, webhook e regressões antes do deploy;
6. documentar impacto e ações adotadas.
