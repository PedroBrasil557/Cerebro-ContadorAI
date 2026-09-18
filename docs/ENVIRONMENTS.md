# Ambientes Supabase

## Mapa canônico

| Papel               | Projeto               | Project ref            | Região      | Uso permitido                                                 |
| ------------------- | --------------------- | ---------------------- | ----------- | ------------------------------------------------------------- |
| Production          | `Cerebro.ai`          | `ebbvknikigxibqtjibqg` | `us-west-2` | Produção. **DO NOT USE FOR STAGING TESTS.**                   |
| Legacy test sandbox | `cerebro-auth-test`   | `aenlidohcgopjkgmqfmc` | `us-west-1` | Preservado somente para investigação. Não é staging canônico. |
| Canonical staging   | `Cerebro.ai Staging`  | `wybnnedsdrtbgxdfinac` | `us-west-1` | Homologação da cadeia canônica de migrations e dos previews.  |

Os project refs não são secretos. Access tokens, senhas de banco, chaves privadas e Service Role são secretos e nunca devem ser gravados no Git.

O staging canônico foi criado em 18 de setembro de 2026 como projeto Supabase standalone na mesma organização de Production, com custo reportado pelo Supabase de US$ 0/mês no momento da criação. O conector de provisioning disponível não expôs `us-west-2` para novos projetos; por isso o staging foi criado em `us-west-1`. Essa diferença de região é aceitável para homologação de schema, Auth, RLS, CI e previews e não altera a região de Production.

O sandbox legado foi pausado sem exclusão de dados para preservar seu conteúdo e liberar o ambiente de homologação. Ele não deve ser restaurado ou reutilizado como staging sem decisão separada.

## Arquitetura atual

```text
LOCAL
  ↓
CI ISOLADO
  ↓
STAGING CANÔNICO
  ↓
PRODUCTION
```

O staging canônico é um projeto standalone dedicado. Ele possui banco, credenciais e Auth independentes e não deve receber cópia de dados reais de Production. Se futuramente a organização migrar para um plano com Branching e houver justificativa operacional/custo, uma Persistent Branch poderá substituir este projeto por decisão explícita.

Nenhum recurso pago deve ser criado sem autorização explícita.

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
2. exige exatamente o project ref canônico `wybnnedsdrtbgxdfinac`;
3. recusa explicitamente Production e o sandbox legado;
4. vincula o runner ao staging canônico;
5. lista o histórico local/remoto;
6. executa `db push --dry-run`.

Ele não contém `db push` real. Configure um GitHub Environment chamado `staging`, com revisão obrigatória, e adicione estes secrets:

- `SUPABASE_ACCESS_TOKEN`
- `STAGING_PROJECT_ID`
- `STAGING_DB_PASSWORD`

`STAGING_PROJECT_ID` deve conter exatamente `wybnnedsdrtbgxdfinac`.

Antes de qualquer aplicação futura, revise manualmente a identidade do projeto, o histórico e a saída do dry-run. O pipeline de Production permanece fora de escopo.

## Auth e Founder no staging

O Auth do staging é independente. Não copie UUIDs de Production.

1. crie ou confirme `pbrasil470@gmail.com` pelo fluxo normal de Auth do staging;
2. aplique a cadeia canônica de migrations;
3. execute ou confirme `bootstrap_initial_founder()` em contexto administrativo confiável;
4. valide que o UUID do Auth é igual ao `profiles.id`, que `system_role = 'founder'` e que existe exatamente um Founder.

Depois do bootstrap, a autorização continua baseada em UUID + `profiles.system_role`, nunca no e-mail.

## Vercel Preview

Não assuma que Preview significa staging. Os previews devem receber a URL e a chave publicável do staging quando a integração for ativada. `SUPABASE_SERVICE_ROLE_KEY` continua restrita ao servidor e nenhuma variável `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` deve existir.
