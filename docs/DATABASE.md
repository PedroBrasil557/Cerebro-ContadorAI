# Banco de dados

## Fonte de verdade

O schema em produção evolui por migrations SQL aditivas em `supabase/migrations`. Os tipos compartilhados de aplicação ficam em `types_db.ts`; mudanças de banco devem atualizar ambos no mesmo pull request.

## Domínios principais

| Domínio | Tabelas principais | Propriedade |
| --- | --- | --- |
| Identidade | `profiles` | `id = auth.uid()` |
| Financeiro | `transactions`, `credit_cards`, `debts`, `goals`, `investments` | `user_id` |
| Compras | `monthly_shopping_sessions`, `shopping_items`, `shopping_receipts` | usuário da sessão |
| Profissional | `businesses`, `appointments` e tabelas operacionais | `user_id`/empresa |
| Billing | `subscriptions`, `stripe_events` | usuário; eventos só Service Role |
| Consumo | `api_usage` | usuário; escrita só Service Role |

Transações usam `scope = personal | business`. Transferências permanecem registradas, mas não entram como receita ou despesa.

## RLS e privilégios

Toda tabela exposta pela Data API deve ter RLS habilitada. Políticas de usuário usam `auth.uid()` e não confiam em IDs enviados pelo cliente. `profiles` permite ao usuário alterar somente campos de perfil; `plan`, `plan_tier` e `system_role` não fazem parte do grant de atualização. `subscriptions`, `api_usage` e recibos têm políticas específicas. `stripe_events` é exclusivo do backend.

## Funções

- `consume_api_usage`: consumo atômico de cota;
- `process_stripe_subscription_event`: idempotência do webhook e atualização da assinatura;
- `delete_account_data`: remoção transacional dos dados da conta, executável apenas pela Service Role.

Funções privilegiadas devem definir `search_path` explicitamente, receber grants mínimos e permanecer inacessíveis a `anon` e `authenticated` quando forem internas.

## Processo de mudança

1. criar uma migration nova, sem editar histórico aplicado;
2. evitar `DROP TABLE`, `TRUNCATE`, remoção de coluna e deletes amplos na v1;
3. aplicar em ambiente controlado;
4. gerar/atualizar tipos;
5. executar advisors de segurança e performance;
6. executar testes RLS com usuários A e B;
7. confirmar rollback lógico ou plano de recuperação.
