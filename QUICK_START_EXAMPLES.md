# Quick Start: Exemplos Prontos para Copiar e Colar

## 1. Usar Skeletons em Componentes Client-Side

```tsx
'use client';

import { useState, useEffect } from "react";
import { AppointmentSkeleton, ServiceListSkeleton } from "@/components/ui/skeletons";

export function AppointmentsList() {
  const [agendamentos, setAgendamentos] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/agendamentos");
        setAgendamentos(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // Mostrar skeleton enquanto carrega
  if (agendamentos === null) {
    return (
      <div className="space-y-3">
        <AppointmentSkeleton />
        <AppointmentSkeleton />
        <AppointmentSkeleton />
      </div>
    );
  }

  // Mostrar conteúdo quando pronto
  return (
    <div className="space-y-3">
      {agendamentos.map((apt) => (
        <div key={apt.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">{apt.serviceName}</h3>
          <p className="text-sm text-gray-500">{apt.date}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 2. Usar EmptyState para Listas Vazias

```tsx
'use client';

import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, ShoppingCart, Star, AlertCircle } from "lucide-react";

// Exemplo 1: Agendamentos vazios
export function EmptyAppointments() {
  return (
    <EmptyState
      icon={Calendar}
      title="Nenhum agendamento"
      description="Você ainda não tem agendamentos. Agende seu próximo horário!"
      action={{
        label: "Agendar agora",
        href: "/agendar"
      }}
    />
  );
}

// Exemplo 2: Carrinho vazio
export function EmptyCart() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Carrinho vazio"
      description="Explore nossos produtos e adicione itens ao seu carrinho"
      action={{
        label: "Ver loja",
        href: "/cliente/loja"
      }}
    />
  );
}

// Exemplo 3: Sem conquistas (sem botão)
export function NoAchievements() {
  return (
    <EmptyState
      icon={Star}
      title="Nenhuma conquista ainda"
      description="Complete desafios e ganhe pontos para desbloquear conquistas"
    />
  );
}

// Exemplo 4: Erro (com callback)
export function ErrorState() {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Erro ao carregar"
      description="Houve um problema ao carregar os dados"
      action={{
        label: "Tentar novamente",
        onClick: () => window.location.reload()
      }}
    />
  );
}

// Uso em componente:
export default function MeusAgendamentos({ agendamentos }: { agendamentos: any[] }) {
  if (agendamentos.length === 0) {
    return <EmptyAppointments />;
  }

  return (
    <div className="space-y-3">
      {agendamentos.map((apt) => (
        <div key={apt.id}>{/* seu card */}</div>
      ))}
    </div>
  );
}
```

---

## 3. Usar LoadingButton

```tsx
'use client';

import { LoadingButton } from "@/components/ui/loading-button";
import { useState } from "react";

// Exemplo 1: Agendar com loading
export function BookingForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: "123",
          date: "2026-03-15",
          time: "14:00"
        })
      });

      if (res.ok) {
        alert("Agendamento confirmado!");
        // redirecionar ou atualizar UI
      }
    } catch (error) {
      alert("Erro ao agendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" placeholder="Nome" required />
      <input type="email" placeholder="Email" required />
      <LoadingButton
        type="submit"
        loading={loading}
        loadingText="Agendando..."
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        Confirmar agendamento
      </LoadingButton>
    </form>
  );
}

// Exemplo 2: Salvar perfil
export function SaveProfileButton() {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await fetch("/api/profile", { method: "PUT" });
      alert("Perfil salvo!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoadingButton
      loading={loading}
      loadingText="Salvando..."
      onClick={handleSave}
      className="bg-green-500 hover:bg-green-600 text-white"
    >
      Salvar alterações
    </LoadingButton>
  );
}

// Exemplo 3: Com disabled manual
export function SubmitButton({ isValid }: { isValid: boolean }) {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingButton
      type="submit"
      loading={loading}
      disabled={!isValid}
      onClick={() => setLoading(true)}
    >
      Enviar
    </LoadingButton>
  );
}
```

---

## 4. Implementar Loading Pages Automáticas

### Passo 1: Criar estrutura de diretórios

```
src/app/cliente/meus-agendamentos/
├── page.tsx      (seu componente)
├── loading.tsx   (novo - UI de carregamento)
└── error.tsx     (opcional - para erros)
```

### Passo 2: Criar `loading.tsx`

```tsx
import { AppointmentSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      {/* Título skeleton */}
      <div className="h-7 w-48 bg-gray-200 animate-pulse rounded" />
      
      {/* Cards skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Passo 3: Next.js faz o resto!

Quando usuário acessa `/cliente/meus-agendamentos`:
1. Next.js renderiza `loading.tsx` instantaneamente
2. `page.tsx` carrega em paralelo
3. Quando pronto, substitui `loading.tsx` pela página real

---

## 5. Página 404 Customizada - Como Usar

### Automático (rotas inexistentes)

Qualquer rota que não existir renderiza `src/app/not-found.tsx` automaticamente.

### Manual (quando recurso não existe)

```tsx
import { notFound } from "next/navigation";

export default async function ProdutoPage({ params }: { params: { id: string } }) {
  // Buscar produto
  const produto = await fetchProduto(params.id);

  // Se não encontrar, renderiza not-found.tsx
  if (!produto) {
    notFound();
  }

  return (
    <div>
      <h1>{produto.nome}</h1>
      {/* resto do conteúdo */}
    </div>
  );
}
```

---

## 6. Padrão Completo: Loading + Empty + 404

### Estrutura

```
src/app/cliente/ranking/
├── page.tsx
├── loading.tsx
└── error.tsx
```

### page.tsx

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { TrendingUp } from "lucide-react";

interface RankingEntry {
  id: string;
  name: string;
  points: number;
  position: number;
}

async function fetchRanking(): Promise<RankingEntry[]> {
  const res = await fetch("https://api.example.com/ranking", {
    cache: "no-store"
  });
  
  if (!res.ok) throw new Error("Failed to fetch ranking");
  return res.json();
}

export default async function RankingPage() {
  const ranking = await fetchRanking();

  // Empty state
  if (ranking.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Ranking vazio"
        description="Seja o primeiro a conquistar pontos!"
      />
    );
  }

  // Conteúdo
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Posição</th>
            <th className="text-left p-2">Nome</th>
            <th className="text-right p-2">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry) => (
            <tr key={entry.id} className="border-b">
              <td className="p-2">#{entry.position}</td>
              <td className="p-2">{entry.name}</td>
              <td className="p-2 text-right font-semibold">{entry.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### loading.tsx

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

### error.tsx

```tsx
'use client';

import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle } from "lucide-react";

export default function Error() {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Erro ao carregar ranking"
      description="Tente novamente mais tarde"
      action={{
        label: "Tentar novamente",
        onClick: () => window.location.reload()
      }}
    />
  );
}
```

---

## 7. Ícones Lucide Disponíveis

```tsx
import {
  Calendar,        // Calendário
  ShoppingCart,    // Carrinho
  Star,            // Estrela
  TrendingUp,      // Tendência
  Award,           // Prêmio
  Gift,            // Presente
  AlertCircle,     // Alerta
  Package,         // Pacote
  Users,           // Usuários
  Zap,             // Raio (energia)
  Check,           // Checkmark
  X,               // Fechar
  Trash2,          // Lixo
  Edit,            // Editar
  Plus,            // Adicionar
  Search,          // Buscar
  Filter,          // Filtrar
  Download,        // Download
  Share2,          // Compartilhar
  Heart,           // Coração
  MapPin,          // Localização
  Phone,           // Telefone
  Mail,            // Email
  Clock,           // Relógio
} from "lucide-react";
```

---

## 8. Customizar Cores

### Cores Padrão do Projeto

```tsx
// Rosa principal
className="bg-rose-500 hover:bg-rose-600 text-white"

// Rosa mais clara
className="bg-pink-400 hover:bg-pink-500"

// Rosa escuro
className="bg-rose-700 hover:bg-rose-800"

// Cinza (padrão Tailwind)
className="bg-gray-200"
```

### Usar em EmptyState

```tsx
<EmptyState
  icon={Calendar}
  title="..."
  description="..."
  action={{
    label: "Agendar",
    href: "/agendar"
  }}
  // Botão automaticamente tem cores rosadas
/>
```

### Customizar LoadingButton

```tsx
<LoadingButton
  loading={isLoading}
  onClick={handleSubmit}
  className="bg-rose-500 hover:bg-rose-600 text-white w-full"
>
  Confirmar
</LoadingButton>
```

---

## 9. Testar em Desenvolvimento

### Simulador Slow Network

1. Abra DevTools (F12)
2. Vá para "Network"
3. Selecione "Slow 3G" no dropdown de throttling
4. Navegue entre páginas para ver skeletons

### Testar Empty States

```tsx
// Simular lista vazia
const agendamentos = []; // vazio

if (agendamentos.length === 0) {
  return <EmptyAppointments />;
}
```

### Testar Loading Button

```tsx
// Simular promise lenta
async function handleSubmit() {
  setLoading(true);
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos
  setLoading(false);
}
```

---

## 10. Exemplo Completo: Mini App

```tsx
'use client';

import { useState, useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingButton } from "@/components/ui/loading-button";
import { AppointmentSkeleton } from "@/components/ui/skeletons";
import { Calendar, Plus } from "lucide-react";

export default function AppointmentsApp() {
  const [appointments, setAppointments] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/agendamentos");
        setAppointments(await res.json());
      } catch {
        setAppointments([]);
      }
    };

    fetchData();
  }, []);

  // Agendar novo
  async function handleNewAppointment() {
    setLoading(true);
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (res.ok) {
        const newAppt = await res.json();
        setAppointments([...(appointments || []), newAppt]);
      }
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (appointments === null) {
    return (
      <div className="space-y-3 p-4">
        <AppointmentSkeleton />
        <AppointmentSkeleton />
        <AppointmentSkeleton />
      </div>
    );
  }

  // Empty state
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nenhum agendamento"
        description="Agende seu próximo horário!"
        action={{
          label: "Novo agendamento",
          onClick: handleNewAppointment
        }}
      />
    );
  }

  // Conteúdo
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
        <LoadingButton
          loading={loading}
          loadingText="Agendando..."
          onClick={handleNewAppointment}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </LoadingButton>
      </div>

      <div className="space-y-3">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100" />
            <div className="flex-1">
              <h3 className="font-semibold">{apt.serviceName}</h3>
              <p className="text-sm text-gray-500">{apt.date} às {apt.time}</p>
            </div>
            <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">
              {apt.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Referências Rápidas

**Arquivos principais:**
- Skeletons: `/src/components/ui/skeletons.tsx`
- EmptyState: `/src/components/ui/empty-state.tsx`
- LoadingButton: `/src/components/ui/loading-button.tsx`
- Página 404: `/src/app/not-found.tsx`

**Documentação completa:**
- Veja `LOADING_STATES_GUIDE.md`

**Ícones:**
- https://lucide.dev/

**Next.js Docs:**
- Loading UI: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
- Error Handling: https://nextjs.org/docs/app/building-your-application/routing/error-handling

