# Arquitetura de produtos

## Produtos independentes

| Produto | Planos atuais | Dados | Entrada principal |
| --- | --- | --- | --- |
| Pessoal | FREE e PRO | transações `scope=personal`, cartões, metas, dívidas, investimentos e compras | `/app` |
| Profissional | PREMIUM durante a transição comercial | workspace, transações `scope=business`, clientes, catálogo, custos e configurações | `/app` |

O plano descreve a oferta comercial; `subscriptions.product` define o produto autorizado. O mapeamento temporário é `free/pro → personal` e `premium → professional`. Ele deve ser substituído quando o catálogo comercial definitivo estiver pronto, sem reutilizar metadata de autenticação.

## Matriz de acesso

- cliente Pessoal: somente Pessoal; não vê seletor;
- cliente Profissional: somente Profissional; não vê seletor;
- `admin` e `founder`: ambos os produtos, Administração e seletor;
- `active` e `trialing`: assinatura atual;
- `past_due`, `canceled`, `unpaid` e `incomplete`: fallback Pessoal FREE para usuário comum.

`subscriptions` é a fonte de verdade. `profiles.account_mode` guarda apenas a preferência visual de administradores e fundadores. `profiles.plan`, `plan_tier` e `user_metadata` nunca concedem acesso.

## Limites de dados e IA

Dados pessoais continuam vinculados a `user_id`. Dados profissionais pertencem a `business_workspaces` e são autorizados pela associação em `business_workspace_members`. Toda consulta profissional deve incluir `workspace_id` e toda transação profissional também exige `scope=business`.

O assistente Pessoal recebe somente uma mensagem do navegador. O servidor autentica, valida o produto e monta o contexto com dados pessoais. A análise Profissional é separada, consulta somente o workspace autorizado e sinaliza dados ausentes. Nenhum fluxo aceita contexto financeiro enviado pelo cliente.

## Rota autenticada e legado

`/app` é a rota canônica. `/` permanece como wrapper de compatibilidade enquanto links antigos são migrados. A autenticação inicial é validada no servidor.

As tabelas `nail_clients`, `nail_products`, `businesses`, `clients` e `services` são legadas. A migration V2 copia dados para as tabelas universais sem apagar a origem. A interface ativa usa somente os modelos universais; a agenda antiga foi retirada da navegação e permanece isolada para migração futura.

Não use `localStorage` como fonte de autorização. Preferências locais antigas podem existir no navegador, mas são ignoradas pelos guards e pelo RLS.
