# Guia de Testes - Tooltip Component

## Testes Manuais

### 1. Marketplace - CartSummary
**Arquivo:** `/src/components/marketplace/CartSummary.tsx`

Passos:
1. Abrir página de agendamento
2. Adicionar um serviço ao carrinho
3. Localizar o CartSummary na lateral/resumo
4. Fazer hover sobre o ícone Trash2 (lixeira vermelha)
5. Verificar se aparece tooltip: "Remover [nome do serviço]"

Resultado Esperado:
- Tooltip aparece acima do ícone
- Desaparece ao remover o mouse
- Clique remove o item corretamente

---

### 2. Marketplace - CartDrawer
**Arquivo:** `/src/components/marketplace/CartDrawer.tsx`

Passos:
1. Abrir página de agendamento
2. Adicionar um ou mais serviços ao carrinho
3. Abrir gaveta do carrinho (clique no ícone de sacola)
4. Fazer hover sobre cada ícone Trash2 na lista
5. Verificar se aparece tooltip: "Remover [nome do serviço]"

Resultado Esperado:
- Tooltip aparece acima de cada ícone
- Tooltip dinâmico com nome do serviço correto
- Clique remove o item e atualiza lista

---

### 3. Marketplace - CategoryCarousel
**Arquivo:** `/src/components/marketplace/CategoryCarousel.tsx`

Passos:
1. Abrir página de agendamento
2. Localizar carrossel de categorias
3. Em desktop, fazer hover sobre seta esquerda (ChevronLeft)
4. Verificar tooltip: "Anterior"
5. Fazer hover sobre seta direita (ChevronRight)
6. Verificar tooltip: "Próximo"

Resultado Esperado:
- Tooltips aparecem abaixo/acima das setas
- Animação suave de fade-in
- Clique nas setas navega o carrossel

---

### 4. Admin - Categories
**Arquivo:** `/src/app/admin/categorias/categories-client.tsx`

Passos:
1. Acessar /admin/categorias
2. Localizar tabela de categorias
3. Na coluna "Ações", fazer hover sobre Pencil (edit)
4. Verificar tooltip: "Editar"
5. Fazer hover sobre Trash2 (delete)
6. Verificar tooltip: "Excluir"

Resultado Esperado:
- Tooltips aparecem acima dos ícones
- Ícone Pencil leva ao modal de edição
- Ícone Trash2 ativa/desativa a categoria

---

### 5. Admin - Services
**Arquivo:** `/src/app/admin/servicos/services-client.tsx`

Passos:
1. Acessar /admin/servicos
2. Localizar tabela de serviços
3. Na coluna "Ações", fazer hover sobre Pencil
4. Verificar tooltip: "Editar"
5. Fazer hover sobre Trash2
6. Verificar tooltip: "Excluir"

Resultado Esperado:
- Tooltips aparecem acima dos ícones
- Comportamento idêntico ao de categorias
- Operações funcionam corretamente

---

### 6. Admin - Portfolio
**Arquivo:** `/src/app/admin/portfolio/portfolio-client.tsx`

Passos:
1. Acessar /admin/portfolio
2. Localizar cards de fotos
3. Fazer hover sobre ícone Trash2 em cada card
4. Verificar tooltip: "Excluir"

Resultado Esperado:
- Tooltip aparece acima do ícone
- Clique exibe confirmação e remove foto
- Gallery se atualiza após exclusão

---

## Testes de Acessibilidade

### Navegação por Teclado
```
1. Abrir dev tools (F12)
2. Pressionar Tab repetidamente
3. Navegar entre buttons/IconButtons
4. Pressionar Enter para ativar
5. Verificar se tooltips aparecem com foco
```

Esperado:
- IconButton é focável com Tab
- Focus visual claramente visível
- Enter ativa a ação do botão

### Leitores de Tela
```
1. Com NVDA ou JAWS habilitado
2. Navegar para cada IconButton
3. Verificar se texto descritivo é lido
```

Esperado:
- "Editar botão" ou similar é anunciado
- Tooltip é lido ao focar

---

## Testes de Responsividade

### Mobile
- CategoryCarousel: Setas não aparecem em mobile (hidden)
- Todos os outros tooltips: Funcionam em touch ao long-press (depende do navegador)

### Tablet
- Todos os tooltips funcionam normalmente
- Setas do carrossel aparecem

### Desktop
- Todos os tooltips com efeito hover
- Setas do carrossel visíveis

---

## Testes de Performance

### Bundle Size
```bash
# Verificar tamanho dos novos arquivos
ls -lh src/components/ui/tooltip.tsx
ls -lh src/components/ui/icon-button.tsx
```

Esperado: < 2KB cada

### Render Performance
```bash
# Usar React DevTools Profiler
# Monitorar re-renders ao fazer hover
# Não deve causar renders desnecessários
```

---

## Testes de Estilo

### Cores
- Background: rose-600 (RGB: 229, 62, 112)
- Text: white (RGB: 255, 255, 255)
- Verificar contraste com ferramentas como WebAIM

### Animações
- Fade-in suave (0s)
- Zoom-in subtle (95%)
- Sem flicker ou saltos

### Posicionamento
- Tooltip acima do elemento (padrão "top")
- Espaço de 4px entre trigger e tooltip
- Ajusta-se automaticamente se perto das bordas

---

## Checklist de Teste Final

- [ ] Todos os 9 componentes com tooltips funcionam
- [ ] Tooltips aparecem ao fazer hover
- [ ] Textos dos tooltips estão corretos e em português
- [ ] Cliques nos botões funcionam corretamente
- [ ] Navegação por teclado funciona
- [ ] Leitores de tela anunciam os tooltips
- [ ] Sem erros no console do navegador
- [ ] Sem erros de TypeScript (npm run build)
- [ ] Performance aceitável (< 300ms para interaction)
- [ ] Responsivo em mobile, tablet e desktop

---

## Resolução de Problemas

### Tooltip não aparece
1. Verificar se TooltipProvider está no layout.tsx
2. Verificar se @radix-ui/react-tooltip está instalado
3. Limpar cache: `rm -rf .next && npm run dev`

### Erro de tipo TypeScript
1. Verificar import: `import { IconButton } from "@/components/ui/icon-button"`
2. Verificar propriedades: `tooltip`, `variant`, `size`

### Estilo incorreto
1. Verificar classes Tailwind: `bg-primary text-primary-foreground`
2. Verificar config do Tailwind em tailwind.config.ts
3. Limpar cache CSS

---

## Relatório de Teste

Use este template para documentar resultados:

```
Data: [DATA]
Testador: [NOME]
Componente: [NOME]
Status: [PASSOU/FALHOU]

Resultado:
[Descrever observações]

Ações Necessárias:
[Listar qualquer issue encontrada]

Assinatura: [ASSINATURA]
```

---

**Data:** 02 de Março de 2026
**Versão:** 1.0.0
**Projeto:** Bela Orsine Beauty
