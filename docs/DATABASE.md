# Banco de dados

## Fonte de verdade

O schema em produção evolui por migrations SQL aditivas em `supabase/migrations`. A migration `20260908000000_baseline_public_schema.sql` é o baseline não destrutivo extraído do projeto canônico `ebbvknikigxibqtjibqg`; ela permite que as migrations de hardening seguintes também sejam aplicadas em um banco vazio. Os tipos compartilhados de aplicação ficam em `types_db.ts`; mudanças de banco devem atualizar ambos no mesmo pull request.

## Domínios principais

| Domínio | Tabelas principais | Propriedade |
| --- | --- | --- |
| Identidade | `profiles` | `id = auth.uid()` |
| Financeiro | `transactions`, `credit_cards`, `debts`, `goals`, `investments` | `user_id` |
| Compras | `monthly_shopping_sessions`, `shopping_items`, `shopping_receipts` | usuário da sessão |
| Profissional | `business_workspaces`, membros, capacidades, clientes, catálogo, custos, configurações e transações business | `workspace_id` + associação |
| Billing | `subscriptions`, `stripe_events` | usuário; eventos só Service Role |
| Consumo | `api_usage` | usuário; escrita só Service Role |

Transações usam `scope = personal | business`. Transferências permanecem registradas, mas não entram como receita ou despesa.

## RLS e privilégios

Toda tabela exposta pela Data API deve ter RLS habilitada. Políticas de usuário usam `(select auth.uid())` e não confiam em IDs enviados pelo cliente. `profiles` permite ao usuário alterar somente campos de perfil; `plan`, `plan_tier` e `system_role` não fazem parte do grant de atualização. `subscriptions` e `api_usage` são gerenciadas pelo servidor e legíveis apenas pelo proprietário. `audit_logs` e `stripe_events` são internos e exclusivos da Service Role. Tabelas globais de regras, flags, moedas e inflação são referências read-only para usuários autenticados.

`subscriptions` é a fonte de autorização paga; `profiles.system_role` concede somente a elevação administrativa controlada pelo servidor. A coluna `product` separa Pessoal de Profissional. FREE e PRO são Pessoal; PREMIUM é Profissional durante a transição. Um cliente Profissional não herda módulos pessoais. `user_metadata` e campos de plano no perfil não concedem entitlement. Cartões, metas, investimentos, dívidas, patrimônio, compras, recibos, insights e arquivos do bucket `receipts` exigem produto Pessoal além da propriedade. Workspaces, clientes, custos, transações business e appointments exigem produto Profissional e membership. Os limites de IA/OCR recebem os entitlements já resolvidos no servidor; o trigger de cartões/metas consulta `system_role` e não reduz `admin`/`founder` aos limites FREE.

Na V1, `business_workspace_members` e `business_workspace_capabilities` são server-managed: `authenticated` recebe somente `SELECT`; escrita é exclusiva de `service_role` e do bootstrap backend. Isso impede que o navegador adicione membros, altere papéis, remova o owner ou habilite capacidades. Team Management dependerá de uma futura API auditada com convite e aceitação.

## Funções

- `consume_api_usage`: consumo atômico de cota;
- `process_stripe_subscription_event_v2`: idempotência do webhook e atualização atômica de plano + produto;
- `bootstrap_business_workspace_v2`: cria workspace, proprietário e capacidades iniciais; somente Service Role;
- `delete_account_data`: remoção transacional dos dados da conta, executável apenas pela Service Role.

Funções privilegiadas devem definir `search_path` explicitamente, receber grants mínimos e permanecer inacessíveis a `anon` e `authenticated` quando forem internas.

## Processo de mudança

1. criar uma migration nova, sem editar histórico aplicado;
2. evitar `DROP TABLE`, `TRUNCATE`, remoção de coluna e deletes amplos na v1;
3. aplicar em ambiente controlado;
4. gerar/atualizar tipos;
5. executar advisors de segurança e performance;
6. executar testes RLS com usuários dedicados FREE, PRO e PREMIUM;
7. confirmar rollback lógico ou plano de recuperação.

Para a fundação V2, aplique `20260916125508_separate_personal_professional_products.sql` antes de publicar o código que consulta `subscriptions.product`. A migration é aditiva, faz backfill de produto/workspace e mantém as tabelas legadas. O nome do workspace vem deterministicamente do `businesses` mais antigo por `created_at/id`, sem sobrescrever workspaces existentes. `clients` e `nail_clients` são copiados para `business_customers` com identidade de origem; `clients` usa UUID namespaced determinístico para não colidir com a outra origem. `tax_regime` e `default_tax_rate` não são importados como valores confirmados. Não execute manualmente contra produção sem backup, janela aprovada e validação prévia em banco local/staging.

Antes da aplicação em produção, audite separadamente os valores 6 em `business_settings.tax_rate` e `businesses.default_tax_rate`. Eles são preservados, mas ficam sem timestamp de confirmação e não são utilizados pelos cálculos atuais. Após disponibilizar uma configuração tributária explícita, grave o valor confirmado junto de `tax_rate_confirmed_at` (ou `default_tax_rate_confirmed_at` no legado). Nunca converta 6 para `NULL` em massa.

## Reconstrução e validação

Pré-requisitos: Docker Desktop em execução e Supabase CLI. Não use o projeto remoto de produção para `db reset`.

```bash
npx supabase start
npx supabase db reset
npm run test:rls
```

O gate de release exige as variáveis `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY` e credenciais separadas em `SUPABASE_TEST_USER_A_*` (FREE), `SUPABASE_TEST_USER_B_*` (PRO) e `SUPABASE_TEST_USER_C_*` (PREMIUM). Com `RELEASE_RLS_REQUIRED=true`, a ausência de qualquer credencial falha a suíte em vez de ignorá-la.

Em 2026-09-09 o baseline foi comparado com as 31 tabelas públicas do projeto canônico, teve sua sintaxe validada dentro de uma transação com rollback e foi registrado no histórico remoto como `20260908000000`. A execução completa de `supabase db reset` continua obrigatória em uma máquina com Docker disponível.
