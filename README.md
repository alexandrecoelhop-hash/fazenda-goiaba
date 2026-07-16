# Fazenda Goiaba — App de Gestão (Vite + React)

Projeto migrado do arquivo único (`fazenda-goiaba.html`) para Vite + React.
O contexto completo do app está no [README da pasta pai](../README.md).

## Configuração (uma vez)

1. Copie `.env.example` para `.env` e preencha com os dados do seu projeto Supabase
   (painel do Supabase → **Project Settings → API**):

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

2. Se ainda não criou a tabela, rode no **SQL Editor** do Supabase:

   ```sql
   create table if not exists fazenda_dados (
     usuario text primary key,
     dados jsonb not null default '{}',
     atualizado_em timestamptz default now()
   );

   -- Necessário para projetos criados após 30/05/2026 (grants explícitos)
   grant select, insert, update on public.fazenda_dados to anon;

   alter table fazenda_dados enable row level security;

   create policy "acesso_fazenda" on fazenda_dados
     for all to anon using (true) with check (true);
   ```

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento (http://localhost:5173)
npm run build    # build estático em dist/
```

Hospedar o conteúdo de `dist/` em Cloudflare Pages, GitHub Pages ou Vercel.
No celular, abrir o link e usar "Adicionar à tela inicial".

> Na hospedagem (Cloudflare/Vercel), configure as variáveis `VITE_SUPABASE_URL`
> e `VITE_SUPABASE_ANON_KEY` no painel do serviço — o `.env` não vai para o git.

## Estrutura

```
src/
├─ main.jsx              # bootstrap React
├─ App.jsx               # gate de login + layout + sincronização
├─ Login.jsx             # tela de entrada (usuário + senha)
├─ lib/
│  ├─ supabase.js        # cliente @supabase/supabase-js + load/save
│  ├─ format.js          # helpers (uid, fmtMoney, fmtDate, addDays...)
│  └─ excel.js           # exportação Excel (xlsx)
├─ data/
│  ├─ pests.js           # PEST_DB (pragas/doenças da goiaba)
│  ├─ schedule.js        # SCHEDULE_TEMPLATE (cronograma pós-poda)
│  └─ fertilizer.js      # tabelas Natale (P/K classes, doses, foliar)
├─ ui/
│  ├─ theme.js           # paleta de cores
│  └─ index.jsx          # Btn, Input, Select, Card, Modal, Table, StatCard, Badge, Icon
└─ sections/             # um componente por módulo
```
