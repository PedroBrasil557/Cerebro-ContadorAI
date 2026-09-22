# Auth 2.1 — templates transacionais

Os templates versionados nesta entrega são a fonte de verdade visual e textual para os e-mails de autenticação do Cérebro:

- `supabase/templates/confirmation.html`
- `supabase/templates/recovery.html`
- `supabase/templates/password_changed_notification.html`

## Confirmação de cadastro

O cadastro e o reenvio usam `emailRedirectTo` apontando para `/auth/confirm`.

O template aprovado cria o link com `{{ .RedirectTo }}?token_hash={{ .TokenHash }}`. A rota `/auth/confirm` valida esse token com `verifyOtp({ type: 'signup' })` e também aceita o retorno PKCE por `code` enquanto ambientes ainda usam o template padrão do Supabase.

Sucesso: `/login?state=confirmed`.
Falha/token inválido: `/login?state=link-expired`.

## Recuperação de senha

`resetPasswordForEmail` aponta para `/nova-senha`.

O template aprovado cria o link com `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`. A página valida o token com `verifyOtp({ type: 'recovery' })` antes de habilitar a troca de senha. O evento `PASSWORD_RECOVERY` continua aceito para compatibilidade com links padrão já emitidos.

Depois de `updateUser({ password })`, a sessão de recuperação é encerrada e o usuário volta ao Login.

## Aviso de senha alterada

O template `password_changed_notification.html` é somente informativo e não possui CTA. A notificação de alteração de senha deve estar habilitada no projeto Supabase de produção.

## Aplicação nos ambientes

Os arquivos deste repositório não alteram automaticamente a configuração remota do projeto Supabase. Antes de promover o Auth 2.1 em um novo ambiente:

1. aplicar os conteúdos versionados aos templates correspondentes no Supabase;
2. habilitar o aviso de senha alterada;
3. confirmar `Site URL` e URLs de redirecionamento permitidas para `/auth/confirm`, `/auth/callback` e `/nova-senha`;
4. usar SMTP próprio antes de produção em escala;
5. nunca inserir credenciais SMTP no repositório.

A aplicação deve continuar funcionando durante a transição de templates porque os callbacks aceitam tanto os contratos novos por `token_hash` quanto o retorno PKCE esperado pelo fluxo padrão compatível.
