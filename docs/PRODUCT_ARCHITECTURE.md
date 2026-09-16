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

Dados pessoais continuam vinculados a `user_id` e as policies exigem também `has_product_access(user_id, 'personal')`. Dados profissionais pertencem a `business_workspaces` e são autorizados pela associação em `business_workspace_members`. Na V1, memberships e capabilities são gerenciadas exclusivamente pelo backend/Service Role: clientes autenticados podem consultá-las, mas não criar, alterar ou apagar membros e capacidades pela Data API. Team Management será habilitado futuramente por uma API própria, com convite, aceitação e auditoria. Toda consulta profissional deve incluir `workspace_id` e toda transação profissional também exige `scope=business`. Agendamentos profissionais, inclusive replay idempotente e atualização de convite, são sempre limitados ao workspace autorizado.

O assistente Pessoal recebe somente uma mensagem do navegador. O servidor autentica, valida o produto e monta o contexto com dados pessoais. A análise Profissional é separada, consulta somente o workspace autorizado e sinaliza dados ausentes. Nenhum fluxo aceita contexto financeiro enviado pelo cliente.

## Rota autenticada e legado

`/app` é a rota canônica. `/` permanece como wrapper de compatibilidade enquanto links antigos são migrados. A autenticação inicial é validada no servidor.

As tabelas `nail_clients`, `nail_products`, `businesses`, `clients` e `services` são legadas. A migration V2 copia dados para as tabelas universais sem apagar a origem. Para cada proprietário, o workspace novo recebe o nome do `businesses` mais antigo por `created_at` e, em caso de empate, por `id`; sem registro utilizável, usa `Meu negócio`. Um workspace já existente nunca tem seu nome sobrescrito. Clientes genéricos de `clients` são migrados com identidade de origem e UUID determinístico por namespace, evitando colisão com `nail_clients` e mantendo o backfill idempotente. A interface ativa usa somente os modelos universais; a agenda permanece fora da navegação até sua generalização visual, mas o backend preservado agora grava e consulta por workspace.

## Taxas tributárias legadas

As versões antigas criavam `business_settings.tax_rate` e `businesses.default_tax_rate` com default de 6%. Não existe histórico confiável para distinguir um 6% confirmado pelo usuário de um valor gerado pelo default. A migration preserva todos os números, remove os defaults e adiciona timestamps de confirmação. Enquanto `tax_rate_confirmed_at`/`default_tax_rate_confirmed_at` estiver nulo, a aplicação trata a taxa como legada e não confirmada, não calcula reserva tributária e solicita configuração futura. Uma tela futura deverá salvar a taxa e o timestamp juntos após confirmação explícita.

Não use `localStorage` como fonte de autorização. Preferências locais antigas podem existir no navegador, mas são ignoradas pelos guards e pelo RLS.
