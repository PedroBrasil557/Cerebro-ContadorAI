# Cérebro — Plano de Migração do App Shell

Este documento detalha a PR B do handoff (`Responsive App Shell`). A implementação só deve começar depois da Design System Foundation estar validada.

## Objetivo

Substituir o shell visual atual por uma infraestrutura responsiva alinhada ao Figma sem alterar contratos de dados, entitlements, account mode ou remover módulos existentes.

## 1. Regra de transição

O Figma final tem cinco destinos primários por produto, mas o código atual ainda não possui todas essas views como `ActiveTab`.

**Não criar navegação para uma view inexistente.**

A PR de shell deve:

1. criar os componentes responsivos oficiais;
2. integrar os `ActiveTab` existentes;
3. manter todos os módulos alcançáveis;
4. preparar configuração para receber novos destinos;
5. deixar a promoção para `Orçamento`, `Metas`, `Cérebro`, `Contas` e `Obrigações` para as PRs que implementarem essas views.

## 2. Componentes alvo

Criar em `core/navigation/` ou namespace equivalente:

- `AppSidebar`
- `AppTopBar`
- `TabletNavigationRail`
- `TabletTopBar`
- `MobileTopBar`
- `MobileBottomNavigation`
- `ProductSwitcher`
- `SecondaryNavigation` / `MoreMenu`

A fonte de itens deve ser configuração tipada, não arrays duplicados dentro de cada componente responsivo.

## 3. Breakpoints

- `< 768px`: Mobile
- `768–1279px`: Tablet
- `>= 1280px`: Desktop

### Desktop

- Sidebar persistente com largura de referência 280px.
- Destinos principais no topo.
- Destinos secundários em grupo separado.
- Perfil/Plano/Admin/Sair preservados.
- Top Bar com título/contexto e ações.

### Tablet

- Navigation Rail de referência 80px.
- Top Bar exibe contexto e Product Switcher.
- Módulos secundários entram em menu complementar.

### Mobile

- Top Bar 64px.
- Bottom Navigation 72px.
- Máximo de cinco ações visíveis na bottom nav.
- Módulos secundários ficam em `Mais`/menu, nunca desaparecem.
- Conteúdo deve reservar safe area para a bottom nav.

## 4. Configuração de navegação — estado atual

### Personal existente

| ActiveTab | Label atual | Papel na transição |
| --- | --- | --- |
| `dashboard` | Painel Central | Primário / futuro Visão geral |
| `transações` | Transações | Primário |
| `compras inteligentes` | Smart Shopping | Secundário |
| `investimentos` | Patrimônio | Secundário; mantém entitlement |
| `minha carteira` | Carteira de Cartões | Secundário |
| `central de dividas` | Central de Dívidas | Secundário; mantém entitlement |
| `meu perfil` | Perfil | Global/secundário |
| `admin` | Administração | Global protegido |

### Personal futuro

Quando as views existirem:

- `dashboard` → Visão geral
- `transações` → Transações
- novo tab → Orçamento
- novo tab → Metas
- novo tab → Cérebro

Os módulos atuais continuam acessíveis em navegação secundária.

### Professional existente

| ActiveTab | Label atual | Papel na transição |
| --- | --- | --- |
| `visão do negócio` | Visão do Negócio | Primário / futuro Visão geral |
| `caixa empresarial` | Financeiro | Primário / base de Fluxo de caixa |
| `admin` | Administração | Global protegido |

### Professional futuro

- Visão geral
- Fluxo de caixa
- Contas
- Obrigações
- Cérebro

As novas entradas só são ativadas quando suas views/adapters existirem.

## 5. ProductSwitcher

O comportamento existente é autoridade e deve ser preservado:

- respeitar `access.canSwitchProducts`;
- continuar usando `PATCH /api/account/mode`;
- atualizar `accountMode` somente após resposta válida;
- preservar `refreshEntitlements` e `router.refresh()`;
- destino inicial ao trocar de produto continua sendo uma view existente e válida;
- nenhuma escolha puramente visual pode liberar o Professional para uma conta sem acesso.

## 6. Entitlements

A configuração tipada de navegação deve aceitar regra/gate por item.

Primeiros gates a preservar:

- `investimentos` → `entitlements.investments`
- `central de dividas` → `entitlements.debtCenter`
- Admin → `access.canAccessAdmin`
- ProductSwitcher → `access.canSwitchProducts`

Um item bloqueado pode aparecer com estado locked quando isso ajudar descoberta, mas clicar deve continuar levando ao fluxo de upgrade, nunca à view protegida.

## 7. Estado e acessibilidade

- `aria-current="page"` no destino ativo.
- Todo icon-only control possui `aria-label`.
- Focus visible usa `--color-focus-ring`.
- Drawer/menu mobile fecha após seleção.
- Escape fecha superfícies temporárias quando aplicável.
- Não depender apenas de cor para item locked/active.
- Respeitar `prefers-reduced-motion`.

## 8. Estratégia de implementação

### Passo B1 — configuração tipada

Extrair as regras de navegação de `Navigation.tsx` para um módulo declarativo, preservando `ActiveTab` atual.

### Passo B2 — ProductSwitcher

Isolar o comportamento de troca de modo num componente reutilizável sem mudar o endpoint/contrato.

### Passo B3 — Desktop shell

Implementar Sidebar + Top Bar com tokens e integrar os destinos existentes.

### Passo B4 — Tablet shell

Adicionar Rail + Top Bar usando a mesma configuração.

### Passo B5 — Mobile shell

Adicionar Top Bar + Bottom Navigation + MoreMenu; não duplicar arrays.

### Passo B6 — integração em `MainAppLayout`

Trocar o shell atual mantendo:

- loading/error states;
- dados já carregados;
- `ViewContainer`;
- `AIAssistant` até a PR dedicada de Cérebro;
- logout;
- upgrade;
- entitlements;
- account mode.

## 9. O que NÃO fazer na PR B

- não criar telas Orçamento/Metas/Cérebro ainda;
- não remover Smart Shopping/Investimentos/Carteira/Dívidas;
- não alterar `ViewContainer` para apontar para views inexistentes;
- não tocar em migrations/RLS/Stripe;
- não converter toda a UI das views antigas;
- não esconder Admin de Founder/Admin;
- não duplicar navegação por breakpoint.

## 10. Critérios de aceite

- `npm run check` verde;
- todos os `ActiveTab` existentes continuam alcançáveis;
- gates de acesso continuam funcionando;
- troca Personal/Professional mantém o mesmo contrato;
- teclado e focus visível em todos os destinos;
- 390px, 834px e >=1280px sem overflow estrutural;
- nenhum hex novo no shell quando houver token equivalente;
- nenhuma regressão funcional em logout, upgrade, profile ou admin.
