# Guia de Configuração: Emails, Eventos e Alertas

Este guia explica passo a passo como configurar o sistema de notificações do Bela Orsine Beauty.

---

## 📧 1. Configurar Resend (Serviço de Email)

O sistema usa **Resend** (https://resend.com) para envio de emails transacionais.

### Passo 1.1: Criar conta no Resend

1. Acesse https://resend.com e crie uma conta gratuita
2. O plano gratuito permite **100 emails/dia** (suficiente para começar)

### Passo 1.2: Verificar domínio (RECOMENDADO para produção)

Para enviar emails de `@belaorsinebeauty.com.br`, você precisa verificar o domínio:

1. No dashboard do Resend, vá em **Domains** → **Add Domain**
2. Digite: `belaorsinebeauty.com.br`
3. Adicione os registros DNS que o Resend fornecer:
   - **MX Record** (para receber emails)
   - **TXT Record** (SPF - autenticação)
   - **CNAME Record** (DKIM - assinatura)
4. Aguarde propagação DNS (pode levar até 48h)

> **Nota**: Sem verificação de domínio, você só pode enviar para seu próprio email (modo teste).

### Passo 1.3: Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Nome: `bela-orsine-production` (ou `bela-orsine-dev` para desenvolvimento)
4. Permissão: **Full access**
5. Copie a chave gerada (começa com `re_`)

### Passo 1.4: Configurar variável de ambiente

Adicione no seu `.env.local`:

```env
RESEND_API_KEY=re_sua_chave_aqui
```

**Em produção (Vercel):**
1. Vá em Settings → Environment Variables
2. Adicione `RESEND_API_KEY` com o valor da chave
3. Marque para aplicar em Production

---

## 🔔 2. Tipos de Notificações do Sistema

O sistema envia automaticamente estes emails:

| Tipo | Quando é enviado | Arquivo |
|------|------------------|---------|
| **Confirmação** | Ao criar agendamento | `notifications.ts` → `buildConfirmationEmail()` |
| **Cancelamento** | Ao cancelar agendamento | `notifications.ts` → `buildCancellationEmail()` |
| **Reagendamento** | Ao reagendar | `notifications.ts` → `buildRescheduleEmail()` |
| **Lembrete 24h** | 24h antes do agendamento | Edge Function `send-reminders` |
| **Lembrete 2h** | 2h antes do agendamento | Edge Function `send-reminders` |
| **Admin: Cancelamento** | Quando cliente cancela | `notifications.ts` → `buildAdminCancellationEmail()` |

---

## ⚡ 3. Configurar Supabase Edge Functions

As Edge Functions rodam os lembretes automáticos. Você precisa configurá-las no Supabase.

### Passo 3.1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Passo 3.2: Login no Supabase

```bash
supabase login
```

### Passo 3.3: Linkar projeto

```bash
cd bela-orsine-beauty
supabase link --project-ref uavltywyhqpnxhsvyvqf
```

### Passo 3.4: Configurar secrets no Supabase

As Edge Functions precisam de variáveis de ambiente próprias:

```bash
# Definir RESEND_API_KEY para as Edge Functions
supabase secrets set RESEND_API_KEY=re_sua_chave_aqui

# Definir URL do app (para links nos emails)
supabase secrets set NEXT_PUBLIC_APP_URL=https://belaorsinebeauty.com.br
```

### Passo 3.5: Deploy das Edge Functions

```bash
# Deploy da função de lembretes
supabase functions deploy send-reminders

# Deploy da função de feedback (se existir)
supabase functions deploy feedback-cron
```

---

## ⏰ 4. Configurar Cron Jobs (Lembretes Automáticos)

Os lembretes são disparados por cron jobs no Supabase.

### Passo 4.1: Acessar configuração de cron

1. Acesse o dashboard do Supabase
2. Vá em **Database** → **Extensions**
3. Habilite a extensão `pg_cron` se não estiver ativa

### Passo 4.2: Criar o cron job

No **SQL Editor** do Supabase, execute:

```sql
-- Cron para enviar lembretes a cada 30 minutos
SELECT cron.schedule(
  'send-reminders-job',
  '*/30 * * * *',  -- A cada 30 minutos
  $$
  SELECT net.http_post(
    url := 'https://uavltywyhqpnxhsvyvqf.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Alternativa via Dashboard:**
1. Vá em **Edge Functions** → **send-reminders**
2. Clique em **Schedule**
3. Configure: `*/30 * * * *` (a cada 30 minutos)

### Passo 4.3: Verificar cron jobs ativos

```sql
SELECT * FROM cron.job;
```

---

## 🗄️ 5. Tabela de Notificações

O sistema usa a tabela `notifications` para controlar envios:

```sql
-- Estrutura da tabela (já existe no banco)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  type TEXT NOT NULL,  -- 'reminder_24h', 'reminder_2h', 'confirmation', etc
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'failed', 'cancelled'
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Como funciona:
1. Ao criar agendamento, o sistema insere notificações pendentes
2. O cron job busca notificações com `status = 'pending'` e `scheduled_for <= now()`
3. Envia o email e atualiza para `status = 'sent'`

---

## ✅ 6. Checklist de Configuração

### Desenvolvimento Local
- [ ] Criar conta no Resend
- [ ] Obter API Key de teste
- [ ] Adicionar `RESEND_API_KEY` no `.env.local`
- [ ] Testar enviando email para seu próprio email

### Produção
- [ ] Verificar domínio `belaorsinebeauty.com.br` no Resend
- [ ] Criar API Key de produção
- [ ] Adicionar `RESEND_API_KEY` na Vercel
- [ ] Configurar secrets no Supabase
- [ ] Deploy das Edge Functions
- [ ] Configurar cron job para lembretes
- [ ] Testar fluxo completo de agendamento

---

## 🧪 7. Testando o Sistema

### Testar email manualmente

```typescript
// No terminal do projeto
import { sendEmail } from '@/lib/notifications';

await sendEmail({
  to: 'seu@email.com',
  subject: 'Teste Bela Orsine',
  html: '<h1>Teste funcionando!</h1>'
});
```

### Testar Edge Function manualmente

```bash
# Via curl
curl -X POST https://uavltywyhqpnxhsvyvqf.supabase.co/functions/v1/send-reminders \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

### Verificar logs

```bash
# Logs das Edge Functions
supabase functions logs send-reminders
```

---

## 🔧 8. Troubleshooting

### Email não está sendo enviado

1. **Verifique `RESEND_API_KEY`**: Está configurado corretamente?
2. **Verifique domínio**: Se não verificado, só envia para seu email
3. **Verifique logs**: `console.log` aparece nos logs da Vercel/Supabase

### Lembretes não estão funcionando

1. **Edge Function deployed?**: `supabase functions list`
2. **Cron ativo?**: `SELECT * FROM cron.job;`
3. **Secrets configurados?**: `supabase secrets list`
4. **Notificações pendentes?**: `SELECT * FROM notifications WHERE status = 'pending';`

### Emails indo para spam

1. Verifique se o domínio está com SPF/DKIM configurados
2. Use um email de remetente válido (não `noreply@...` se possível)
3. Evite palavras de spam no assunto/corpo

---

## 📊 9. Monitoramento

### No Resend Dashboard
- Emails enviados/falhos
- Taxa de abertura
- Bounces e reclamações

### No Supabase
- Logs das Edge Functions
- Tabela `notifications` para histórico

---

## 🔗 Links Úteis

- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
