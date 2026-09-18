# Ambientes Supabase

## Mapa canônico

| Papel               | Projeto             | Project ref            | Uso permitido                                                 |
| ------------------- | ------------------- | ---------------------- | ------------------------------------------------------------- |
| Production          | `Cerebro.ai`        | `ebbvknikigxibqtjibqg` | Produção. **DO NOT USE FOR STAGING TESTS.**                   |
| Legacy test sandbox | `cerebro-auth-test` | `aenlidohcgopjkgmqfmc` | Preservado somente para investigação. Não é staging canônico. |
| Canonical staging   | ainda não criado    | a definir              | Homologação da cadeia canônica de migrations e dos previews.  |

Os project refs não são secretos. Access tokens, senhas de banco, chaves privadas e Service Role são secretos e nunca devem ser gravados no Git.

## Arquitetura desejada

```text
LOCAL
  ↓
CI ISOLADO
  ↓
STAGING CANÔNICO
  ↓
PRODUCTION
```

A opção preferencial para o staging canônico é uma Supabase Persistent Branch derivada de `Cerebro.ai`, condicionada à aprovação de custo e disponibilidade pelo proprietário. Ela oferece banco, credenciais e Auth isolados, não copia dados de produção por padrão e pode ser integrada aos previews do GitHub/Vercel. Se branching não estiver disponível, use um projeto standalone novo; não reutilize o sandbox legado.

Nenhum recurso pago deve ser criado sem autorização explícita. A criação do ambiente não faz parte desta PR.

## Fonte de verdade das migrations

`supabase/migrations/` é a cadeia canônica. Não renomeie migrations para coincidir com históricos remotos e não use `migration repair` para esconder divergências.

O histórico de Production foi confirmado por leitura em 18 de setembro de 2026:

| Migration local                                              | Production       | Estado                                 |
| ------------------------------------------------------------ | ---------------- | -------------------------------------- |
| `20260908000000_baseline_public_schema.sql`                  | `20260908000000` | aplicado                               |
| `20260908152704_create_subscriptions.sql`                    | `20260908152704` | aplicado                               |
| `20260908152707_create_stripe_events.sql`                    | `20260908152707` | aplicado                               |
| `20260908152710_create_api_usage.sql`                        | `20260908152710` | aplicado                               |
| `20260908152713_harden_profiles.sql`                         | `20260908152713` | aplicado                               |
| `20260908155512_harden_appointments.sql`                     | `20260908155512` | aplicado                               |
| `20260908155540_private_receipt_storage.sql`                 | `20260908155540` | aplicado                               |
| `20260908161803_add_transaction_scope.sql`                   | `20260908161803` | aplicado                               |
| `20260908214908_account_deletion_rpc.sql`                    | `20260908214908` | aplicado                               |
| `20260908223749_enforce_limits_and_idempotency.sql`          | `20260908223749` | aplicado                               |
| `20260908224044_harden_legacy_database_exposure.sql`         | `20260908224044` | aplicado                               |
| `20260909134622_complete_rls_entitlements_and_indexes.sql`   | `20260909134622` | aplicado                               |
| `20260909134727_finalize_server_only_rls.sql`                | `20260909134727` | aplicado                               |
| `20260909192729_enforce_shopping_session_uniqueness.sql`     | `20260909192729` | aplicado                               |
| `20260910142000_seed_brl_reference_currency.sql`             | ausente          | pendente após o baseline de Production |
| `20260915013000_normalize_transaction_amounts.sql`           | ausente          | pendente após o baseline de Production |
| `20260916125508_separate_personal_professional_products.sql` | ausente          | pendente após o baseline de Production |
| `20260917234335_founder_platform_authority.sql`              | ausente          | pendente após o baseline de Production |

O sandbox legado possui migrations com os mesmos nomes, mas timestamps diferentes. Ele deve permanecer preservado até uma decisão separada sobre seus dados; não execute `db push`, `db reset --linked`, `migration repair`, bootstrap Founder ou alterações em massa nesse projeto.

## Preflight manual de staging

O workflow `.github/workflows/staging-preflight.yml` é exclusivamente manual e somente leitura em relação ao schema:

1. valida a presença dos secrets;
2. recusa os refs de Production e do sandbox legado;
3. vincula o runner ao project ref informado;
4. lista o histórico local/remoto;
5. executa `db push --dry-run`.

Ele não contém `db push` real. Depois que o staging canônico existir, configure um GitHub Environment chamado `staging`, com revisão obrigatória, e adicione estes secrets:

- `SUPABASE_ACCESS_TOKEN`
- `STAGING_PROJECT_ID`
- `STAGING_DB_PASSWORD`

Antes de qualquer aplicação futura, revise manualmente a identidade do projeto, o histórico e a saída do dry-run. O pipeline de Production permanece fora de escopo.

## Auth e Founder no futuro staging

O Auth do staging é independente. Não copie UUIDs de Production. Quando o ambiente existir:

1. crie ou confirme `pbrasil470@gmail.com` pelo fluxo normal de Auth do staging;
2. aplique a cadeia canônica de migrations;
3. execute ou confirme `bootstrap_initial_founder()` em contexto administrativo confiável;
4. valide que o UUID do Auth é igual ao `profiles.id`, que `system_role = 'founder'` e que existe exatamente um Founder.

Depois do bootstrap, a autorização continua baseada em UUID + `profiles.system_role`, nunca no e-mail.

## Vercel Preview

Não assuma que Preview significa staging. Depois da criação do ambiente canônico, os previews devem receber a URL e a chave publicável do staging. `SUPABASE_SERVICE_ROLE_KEY` continua restrita ao servidor e nenhuma variável `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` deve existir.
