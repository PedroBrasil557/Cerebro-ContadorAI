# Autoridade da plataforma

## Hierarquia

`profiles.system_role` é a única fonte de verdade para autoridade global:

- `founder`: autoridade máxima e única; administra papéis de plataforma e lê o log global;
- `admin`: acessa operações administrativas, mas não concede nem remove autoridade;
- `user`: usuário comum.

Esses papéis não são planos comerciais nem papéis de workspace. `subscriptions` controla produtos Pessoal/Profissional e `business_workspace_members.role` controla somente um workspace. Comprar, cancelar ou atrasar uma assinatura nunca cria nem remove autoridade de plataforma.

Os helpers do servidor `requireFounder` e `requirePlatformAdmin` consultam o papel atual pelo UUID autenticado em cada operação crítica. E-mail e `user_metadata` não autorizam nada.

## Bootstrap inicial

A migration `20260917234335_founder_platform_authority.sql` contém o único vínculo inicial por e-mail. Ela procura `pbrasil470@gmail.com` em `auth.users`, associa seu UUID a `profiles.system_role = 'founder'`, recria o perfil se ele ainda não existir e registra `founder_bootstrap` em `audit_logs`.

Se a conta ainda não existir quando a migration for aplicada:

1. crie ou confirme a conta pelo fluxo normal do Supabase Auth;
2. em um ambiente administrativo confiável, execute `select public.bootstrap_initial_founder();` com a Service Role ou pelo SQL Editor;
3. confirme que a função retornou o UUID esperado e que existe exatamente um perfil `founder`;
4. encerre a sessão anterior e autentique novamente antes de validar o painel.

A função é idempotente, não recebe e-mail ou UUID arbitrário e não pode ser executada por `anon` ou `authenticated`. `FOUNDER_USER_ID` não é variável de ambiente e não deve ser reintroduzida.

## Administração de papéis

O endpoint `PATCH /api/admin/users/:id/role` aceita somente `{ "role": "admin" }` ou `{ "role": "user" }`. Ele exige Founder autenticado e chama uma função transacional restrita à Service Role. A operação:

- rejeita usuário, administrador e anônimo como ator;
- rejeita autoalteração, alvo Founder, alvo inexistente e qualquer novo papel Founder;
- bloqueia a linha do alvo durante a alteração;
- registra ator, alvo, papel anterior, papel novo e horário em `audit_logs`;
- retorna sucesso idempotente quando o alvo já possui o papel solicitado.

Alterações diretas de `profiles.system_role` pela Data API são bloqueadas por grants e por trigger. Nem administrador global nem owner/admin de workspace ganha permissão para mudar papéis de plataforma.

## Proteções do Founder

O banco mantém um índice único parcial para permitir no máximo um Founder. O trigger de autoridade bloqueia exclusão do perfil Founder e qualquer mudança de seu papel fora do procedimento controlado. A API de exclusão da conta também interrompe o fluxo antes de cancelar assinatura, remover arquivos ou apagar dados quando o usuário é Founder.

O Stripe atualiza apenas assinatura, plano, produto e período. Estados ausente, FREE, cancelado ou `past_due` não reduzem a autoridade Founder.

## Recuperação e rotação

Troca de e-mail não exige mudança de autoridade: o vínculo permanente é o UUID do usuário. Se o perfil desaparecer, a função de bootstrap o recria para o UUID da conta inicial fixa.

Perda definitiva da conta ou necessidade de transferir a autoridade exige uma migration extraordinária, revisada por duas pessoas e aplicada primeiro em staging. Ela deve, em uma única transação, validar os UUIDs em `auth.users`, registrar a troca no audit log, remover o papel do UUID antigo, promover o novo UUID e preservar a regra de Founder único. Não crie endpoint genérico, não edite `user_metadata`, não desative permanentemente o trigger e não use e-mail como autoridade após o bootstrap.

Antes da aplicação remota, valide a migration em Supabase local, execute `npm run test`, `npm run test:rls`, `npm run test:e2e`, os advisors de segurança/performance e a revisão manual dos cenários Founder/admin/user.
