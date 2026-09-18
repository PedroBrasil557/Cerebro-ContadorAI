# Cérebro Design System 1.0 — Figma → Código

Este documento é o contrato de implementação da interface auditada do Cérebro.IA.

## 1. Fonte de verdade

- Figma: `0Vi9Lvk8qvuZSOr1t0lIKb`
- Fonte visual: Cérebro Design System 1.0, auditado em 18/09/2026.
- Fonte de lógica e dados: este repositório, `main` e suas migrations/APIs atuais.
- Tipografia oficial: **Inter**.
- Ícones de produto: **Lucide**.
- Gráficos: **Recharts**.
- Comportamento acessível de primitives: **Radix UI** quando aplicável.
- Motion: **Framer Motion**, respeitando os tokens e `prefers-reduced-motion`.

O Figma define aparência, hierarquia, estados, responsividade e interação. O código existente continua sendo a autoridade para autenticação, segurança, billing, Supabase, regras financeiras e separação Personal/Professional.

## 2. Invariantes — não negociar durante a migração visual

1. Não alterar migrations, RLS, Founder authority, Stripe ou entitlements em PRs puramente visuais.
2. Não misturar dados Personal e Professional.
3. Não reescrever serviços/engines para adequar uma tela. Adaptar a view ao contrato de dados existente ou criar uma camada de apresentação tipada.
4. Não introduzir cores hex locais quando existir token semântico equivalente.
5. Não criar um segundo componente se o Design System já cobre a necessidade.
6. Toda ação financeira destrutiva ou alteração proposta pela IA exige confirmação explícita.
7. A IA pode explicar evidências e atividade observável; não exibe chain-of-thought.
8. Estados loading, vazio, erro, disabled e focus fazem parte do componente, não são remendos de tela.
9. Light e Dark usam a mesma semântica; apenas os aliases mudam.
10. `npm run check` deve passar antes de abrir uma PR para review.

## 3. Arquitetura atual a preservar

O produto já possui uma base madura:

- `core/layouts/MainAppLayout.tsx`: shell autenticado e seleção Personal/Professional.
- `core/components/Navigation.tsx`: navegação atual.
- `core/components/ViewContainer.tsx`: composição de views.
- `core/ui/*`: primitives atuais baseadas em Radix/CVA.
- `modules/personal/*`: produto Personal e sua lógica de apresentação.
- `modules/professional/*`: produto Professional.
- `modules/admin/*`: superfícies internas existentes.
- `core/components/ai/*` e `app/api/ai/*`: IA atual.

A migração deve ser incremental. Evitar um rewrite do shell e das views em uma única PR.

## 4. Tokens

Os valores finais auditados do Figma estão em `app/globals.css`.

Coleções do Figma:

- Core / Primitives: 39
- Core / Semantic: 69
- Core / Dimensions: 14
- Core / Motion: 4

Total: **126 variables**.

Consumir tokens semânticos, por exemplo:

```css
background: var(--color-bg-canvas);
color: var(--color-text-primary);
border-color: var(--color-card-border);
```

Primitives (`--brand-*`, `--neutral-*`, etc.) existem para resolver aliases; componentes de produto não devem depender delas diretamente quando houver semantic token.

## 5. Breakpoints oficiais

- Mobile: `< 768px`
- Tablet: `768px–1279px`
- Desktop: `>= 1280px`

Referências do Figma:

- Mobile: viewport 390×844.
- Tablet: viewport 834×1194.
- Desktop: shell com sidebar 280px nas telas de produto.

Regra: reorganizar antes de comprimir. Não transformar Desktop em Mobile apenas reduzindo dimensões.

## 6. Mapeamento de primitives

| Figma | Código alvo | Estratégia |
| --- | --- | --- |
| Button | `core/ui/button.tsx` | Migrar in-place, mantendo aliases legados até as telas antigas serem convertidas. |
| Icon Button | `core/ui/icon-button.tsx` | Wrapper tipado sobre Button com tamanhos 36/44/52. |
| Badge | `core/ui/badge.tsx` | Novo primitive CVA com tones semantic. |
| Input | `core/ui/input.tsx` | Novo primitive tokenizado. |
| Field | `core/ui/field.tsx` | Composição label + input + helper/error. |
| Select | `core/ui/select.tsx` | Preferir Radix; migrar usos de `CustomSelect` gradualmente. |
| Textarea | `core/ui/textarea.tsx` | Novo primitive responsivo. |
| Checkbox / Radio / Switch | `core/ui/*` | Radix quando aplicável; estados Focus obrigatórios. |
| Tooltip | `core/ui/tooltip.tsx` | Reutilizar Radix existente, trocar somente tokens. |
| Menu Item | `core/ui/dropdown-menu.tsx` | Reutilizar Radix existente, alinhar estados. |
| Dialog | `core/ui/dialog.tsx` | Radix Dialog; Desktop e Mobile com actions responsivas. |
| Drawer | `core/ui/drawer.tsx` | Superfície lateral contextual; não substituir por página inteira. |

## 7. Mapeamento de componentes de produto

Criar/normalizar sob namespaces compartilhados em vez de duplicar Personal/Professional:

- `BalanceCard`
- `FinancialMetricCard`
- `CerebroAICard`
- `ChartCard`
- `FinancialHealth`
- `GoalProgress`
- `SmartAlert`
- `TransactionRow`
- `EmptyState`
- `Skeleton`

Personal e Professional alteram conteúdo, prioridade e data adapters; a linguagem visual e os primitives permanecem os mesmos.

## 8. Ordem de PRs

### PR A — Design System Foundation

Escopo:

- tokens Light/Dark;
- Inter global;
- focus/reduced-motion;
- Button;
- Badge;
- Icon Button;
- primitives de formulário essenciais;
- documentação do handoff.

Sem alterações de negócio.

### PR B — Responsive App Shell

Escopo:

- Sidebar Desktop;
- Top Bar Desktop;
- Tablet Navigation Rail + Tablet Top Bar;
- Mobile Top Bar + Bottom Navigation;
- Product switch Personal/Professional;
- preservar entitlements e `accountMode` existentes.

### PR C — Personal Core

Telas:

- Visão geral;
- Transações;
- Orçamento;
- Metas;
- Cérebro.

Responsivo Desktop/Tablet/Mobile.

### PR D — Professional Core

Telas:

- Visão geral;
- Fluxo de caixa;
- Contas;
- Obrigações;
- Cérebro.

Responsivo Desktop/Tablet/Mobile.

### PR E — Importe sua vida financeira

Implementar o fluxo auditado:

`Arquivo → Analisando → Revisão → Confirmação → Concluído`, mais erro recuperável.

Regras:

- análise nunca equivale a importação;
- baixa confiança deve ser revisável;
- provável duplicata nasce desmarcada;
- commit apenas após confirmação.

### PR F — Pergunte ao seu dinheiro

Estados:

`Pergunta → Analisando → Resposta → Ação proposta → Confirmação`, mais dados insuficientes.

Resposta precisa expor evidências e escopo consultado. Alterações ficam separadas da análise e só executam após confirmação.

### PR G — Seu mês em 60 segundos

- Personal + Professional;
- resultado positivo/negativo;
- estado sem histórico;
- CTA para perguntar ao Cérebro sobre o mês/empresa;
- feedback contextual opcional.

### PR H — Cérebro Control

Superfícies internas:

- Visão geral;
- Produto;
- IA;
- Jobs;
- Feedback.

Founder/Admin only. Não expor dados operacionais internos a clientes.

## 9. Regras de acessibilidade

O Figma final foi auditado para AA nos pares semânticos críticos.

Implementação deve preservar:

- `:focus-visible` perceptível em todos os controles;
- alvo frequente de pelo menos 44px quando aplicável;
- cor nunca como único indicador de status;
- icon-only actions com `aria-label`;
- validação próxima ao campo;
- `prefers-reduced-motion`;
- informações financeiras críticas visíveis, nunca escondidas apenas em Tooltip.

## 10. QA obrigatório por PR

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npm run test:e2e` quando a PR tocar fluxos já cobertos por Playwright.
6. Verificar Mobile 390px, Tablet 834px e Desktop >=1280px quando a PR alterar telas.
7. Comparar visualmente com o frame correspondente do Figma.
8. Confirmar que não houve mudança de contrato de segurança/dados fora do escopo.

## 11. Critério para criar algo que não existe no Figma

Só criar um novo token/componente quando houver diferença funcional real não coberta pelo Design System. Antes disso:

1. procurar primitive existente;
2. tentar composição;
3. documentar a lacuna;
4. adicionar ao Figma e ao código com o mesmo nome semântico.

Nunca resolver uma necessidade local com hex, radius ou spacing arbitrário se o sistema já possuir equivalente.
