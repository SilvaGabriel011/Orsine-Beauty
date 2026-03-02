# Guia Completo: Loading States, Empty States e 404

## Visão Geral

Este projeto implementa uma experiência de usuário aprimorada com:
- **Loading States**: Skeletons enquanto dados carregam
- **Empty States**: Mensagens amigáveis para listas vazias
- **Página 404**: Error page customizada
- **Loading Buttons**: Botões com feedback visual

---

## 1. Skeletons Reutilizáveis

### Localização
```
src/components/ui/skeletons.tsx
```

### Componentes Disponíveis

#### 1.1 CardSkeleton
Esqueleto genérico de card (título + subtítulo + badge).

```tsx
import { CardSkeleton } from "@/components/ui/skeletons";

export default function MinhaPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
```

#### 1.2 AppointmentSkeleton
Esqueleto para card de agendamento (avatar + info + status).

```tsx
import { AppointmentSkeleton } from "@/components/ui/skeletons";

export default function MeusAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  
  return (
    <div className="space-y-3">
      {agendamentos.length > 0 ? (
        agendamentos.map(apt => <AppointmentCard {...apt} />)
      ) : (
        <>
          <AppointmentSkeleton />
          <AppointmentSkeleton />
          <AppointmentSkeleton />
        </>
      )}
    </div>
  );
}
```

#### 1.3 ServiceListSkeleton
Esqueleto para lista de serviços com contador customizável.

```tsx
import { ServiceListSkeleton } from "@/components/ui/skeletons";

// Com valor padrão (3 itens)
<ServiceListSkeleton />

// Com customização
<ServiceListSkeleton count={5} />
```

#### 1.4 DashboardSkeleton
Esqueleto para dashboard admin (4 KPI cards + lista de agendamentos).

```tsx
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function AdminDashboard() {
  return (
    <div>
      <DashboardSkeleton />
    </div>
  );
}
```

#### 1.5 GameHubSkeleton
Esqueleto para hub de jogos (cabeçalho + grid 2x2).

```tsx
import { GameHubSkeleton } from "@/components/ui/skeletons";

export default function JogarPage() {
  return <GameHubSkeleton />;
}
```

#### 1.6 TableSkeleton
Esqueleto para tabelas com linhas e colunas customizáveis.

```tsx
import { TableSkeleton } from "@/components/ui/skeletons";

// Valor padrão (5 linhas, 4 colunas)
<TableSkeleton />

// Customizado
<TableSkeleton rows={10} cols={5} />
```

---

## 2. Páginas Loading (App Router)

### O que é?
No Next.js 14 App Router, `loading.tsx` é renderizado automaticamente enquanto `page.tsx` carrega.

### Como Funciona?
1. Usuário navega para `/cliente/ranking`
2. Next.js renderiza `loading.tsx` instantaneamente
3. `page.tsx` carrega em paralelo
4. Quando pronto, substitui `loading.tsx` pela página real
5. Transição é suave (mantém estado do cliente)

### Arquivos Criados

#### A) `/app/cliente/meus-agendamentos/loading.tsx`
```tsx
import { AppointmentSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-7 w-48 bg-gray-200 animate-pulse rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  );
}
```

**Uso**: Automático quando usuário acessa `/cliente/meus-agendamentos`

#### B) `/app/cliente/jogar/loading.tsx`
```tsx
import { GameHubSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="p-4">
      <GameHubSkeleton />
    </div>
  );
}
```

**Uso**: Automático quando usuário acessa `/cliente/jogar`

#### C) `/app/cliente/ranking/loading.tsx`
```tsx
import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-7 w-40 bg-gray-200 animate-pulse rounded" />
      <TableSkeleton rows={10} cols={4} />
    </div>
  );
}
```

**Uso**: Automático quando usuário acessa `/cliente/ranking`

#### D) `/app/admin/dashboard/loading.tsx`
```tsx
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  );
}
```

**Uso**: Automático quando admin acessa `/admin/dashboard`

#### E) `/app/admin/agendamentos/loading.tsx`
```tsx
import { AppointmentSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-7 w-48 bg-gray-200 animate-pulse rounded" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 animate-pulse rounded-full" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  );
}
```

**Uso**: Automático quando admin acessa `/admin/agendamentos`

---

## 3. Empty State Component

### Localização
```
src/components/ui/empty-state.tsx
```

### Interface
```tsx
interface EmptyStateProps {
  icon: LucideIcon;           // Ícone do lucide-react
  title: string;              // Título (ex: "Nenhum agendamento")
  description: string;        // Descrição
  action?: {
    label: string;            // Texto do botão
    href?: string;            // Link (se houver)
    onClick?: () => void;     // Callback (se houver)
  };
  className?: string;         // Classes CSS adicionais
}
```

### Exemplos de Uso

#### Exemplo 1: Lista vazia com ação de link
```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";

export default function MeusAgendamentos({ agendamentos }) {
  return (
    <div>
      {agendamentos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento"
          description="Você ainda não tem agendamentos. Agende seu próximo horário!"
          action={{
            label: "Agendar agora",
            href: "/agendar"
          }}
        />
      ) : (
        agendamentos.map(apt => <AppointmentCard key={apt.id} {...apt} />)
      )}
    </div>
  );
}
```

#### Exemplo 2: Sem ação
```tsx
<EmptyState
  icon={Star}
  title="Nenhuma conquista ainda"
  description="Complete desafios para desbloquear conquistas"
/>
```

#### Exemplo 3: Com ação de callback
```tsx
import { Plus } from "lucide-react";

<EmptyState
  icon={Plus}
  title="Nenhum serviço"
  description="Adicione seu primeiro serviço para começar"
  action={{
    label: "Adicionar serviço",
    onClick: () => setOpenDialog(true)
  }}
/>
```

#### Exemplo 4: Com classe customizada
```tsx
<EmptyState
  icon={AlertCircle}
  title="Erro ao carregar"
  description="Tente novamente mais tarde"
  className="min-h-96"
/>
```

### Ícones Disponíveis do lucide-react
```
Calendar, Star, AlertCircle, Package, ShoppingCart, Users, 
TrendingUp, Award, Gift, Zap, Search, Filter, Plus, Trash2, etc.
```

---

## 4. Loading Button

### Localização
```
src/components/ui/loading-button.tsx
```

### Propriedades
```tsx
interface LoadingButtonProps extends ComponentProps<typeof Button> {
  loading?: boolean;      // Estado de carregamento
  loadingText?: string;   // Texto durante carregamento (padrão: children)
}
```

### Exemplos

#### Exemplo 1: Básico
```tsx
import { LoadingButton } from "@/components/ui/loading-button";
import { useState } from "react";

export default function AgendarForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await fetch("/api/agendamentos", { method: "POST" });
      // sucesso
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoadingButton
      loading={loading}
      onClick={handleSubmit}
      className="bg-rose-500 hover:bg-rose-600 text-white"
    >
      Confirmar agendamento
    </LoadingButton>
  );
}
```

#### Exemplo 2: Com texto customizado durante loading
```tsx
<LoadingButton
  loading={isSubmitting}
  loadingText="Salvando mudanças..."
  onClick={handleSave}
>
  Salvar
</LoadingButton>
```

#### Exemplo 3: Desabilitado manualmente
```tsx
<LoadingButton
  loading={isLoading}
  disabled={!formValid}
  onClick={handleSubmit}
>
  Enviar
</LoadingButton>
```

---

## 5. Página 404

### Localização
```
src/app/not-found.tsx
```

### Características
- Design responsivo com gradiente rosa-pink
- Ícone Sparkles
- Mensagens personalizadas
- 2 botões: "Voltar para a home" e "Agendar um horário"
- Rodapé com marca do negócio

### Ativação Automática
A página 404 é renderizada automaticamente quando:
1. Usuário acessa rota inexistente (ex: `/inexistente`)
2. Você chama `notFound()` do Next.js

### Ativação Manual
```tsx
import { notFound } from "next/navigation";

export default function ProdutoPage({ params }) {
  const produto = null; // não encontrado

  if (!produto) {
    notFound(); // Renderiza /app/not-found.tsx
  }

  return <div>{produto.nome}</div>;
}
```

---

## 6. Padrões de Implementação

### Padrão 1: Skeleton manual em componente
```tsx
'use client';

import { useState, useEffect } from "react";
import { AppointmentSkeleton } from "@/components/ui/skeletons";
import { AppointmentCard } from "./AppointmentCard";

export function AppointmentsList() {
  const [agendamentos, setAgendamentos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/agendamentos");
        setAgendamentos(await res.json());
      } catch (err) {
        setError(err);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <ErrorMessage />;
  }

  if (agendamentos === null) {
    return (
      <div className="space-y-3">
        <AppointmentSkeleton />
        <AppointmentSkeleton />
        <AppointmentSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agendamentos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento"
          description="Agende seu próximo horário!"
          action={{ label: "Agendar", href: "/agendar" }}
        />
      ) : (
        agendamentos.map(apt => <AppointmentCard key={apt.id} {...apt} />)
      )}
    </div>
  );
}
```

### Padrão 2: Loading automático (loading.tsx)
```
src/app/cliente/meus-agendamentos/
├── page.tsx           (seu componente)
├── loading.tsx        (renderizado automaticamente)
└── error.tsx          (opcional - para erros)
```

**page.tsx** (seu código)
**loading.tsx** (automático durante carregamento)

### Padrão 3: Combinando loading + empty state
```tsx
// page.tsx
import { EmptyState } from "@/components/ui/empty-state";

export default async function RankingPage() {
  const ranking = await fetchRanking();

  return (
    <div>
      {ranking.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Ranking vazio"
          description="Seja o primeiro a conquistar pontos!"
        />
      ) : (
        <RankingTable data={ranking} />
      )}
    </div>
  );
}

// loading.tsx
import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return <TableSkeleton rows={10} cols={4} />;
}
```

---

## 7. Boas Práticas

### 1. Use loading.tsx para carregamento de página
- Renderizado automaticamente
- Melhor UX que componentes client-side
- Mantém estado do cliente

### 2. Use EmptyState para listas vazias
- Melhor que texto vago
- Fornece ação clara ao usuário
- Ícone visual ajuda

### 3. Use LoadingButton para operações async
- Feedback visual
- Previne cliques duplos
- Melhor UX

### 4. Customize as cores conforme marca
```tsx
// Use classes Tailwind do tema
className="bg-rose-500 hover:bg-rose-600"
className="bg-pink-400 hover:bg-pink-500"
```

### 5. Teste com slow network
Dev Tools → Network → Slow 3G

---

## 8. Troubleshooting

### P: Loading.tsx não aparece
R: Verifique se:
- Está no diretório correto
- Arquivo é exportado padrão
- Página.tsx existe no mesmo diretório

### P: EmptyState não está estilizado
R: Verifique:
- Tailwind CSS configurado
- shadcn/ui Button instalado
- Ícone lucide-react importado

### P: Loading Button não funciona
R: Certifique-se:
- Usando "use client" no arquivo
- Estado `loading` é boolean
- onClick é async/promise

### P: Página 404 customizada não aparece
R: Verifique:
- Arquivo em `src/app/not-found.tsx`
- Sem page.tsx no mesmo nível
- Chamando `notFound()` quando apropriado

---

## 9. Próximos Passos

1. **Adicionar error.tsx**: Para tratamento de erros
   ```tsx
   // src/app/cliente/meus-agendamentos/error.tsx
   'use client';
   import { EmptyState } from "@/components/ui/empty-state";
   import { AlertCircle } from "lucide-react";

   export default function Error() {
     return (
       <EmptyState
         icon={AlertCircle}
         title="Erro ao carregar"
         description="Tente novamente mais tarde"
       />
     );
   }
   ```

2. **Adicionar loading states inline**: Para componentes específicos
3. **Testar em dispositivos móveis**: Verificar responsividade
4. **Analytics**: Rastrear tempo de carregamento

---

## 10. Referências

- [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react Icons](https://lucide.dev/)

---

**Implementado por**: Claude AI
**Data**: 2026-03-02
**Versão**: 1.0
