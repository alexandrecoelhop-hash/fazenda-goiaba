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
│  ├─ excel.js           # exportação Excel (xlsx)
│  ├─ voz.js             # frase falada → lançamento (valor, data, loja, destino)
│  └─ useFala.js         # microfone: fala → texto pelo próprio navegador
├─ data/
│  ├─ pests.js           # PEST_DB (pragas/doenças da goiaba)
│  ├─ schedule.js        # SCHEDULE_TEMPLATE (cronograma pós-poda)
│  └─ fertilizer.js      # tabelas Natale (P/K classes, doses, foliar)
├─ ui/
│  ├─ theme.js           # paleta de cores
│  └─ index.jsx          # Btn, Input, Select, Card, Modal, Table, StatCard, Badge, Icon
└─ sections/             # um componente por módulo
   └─ LancarVoz.jsx      # falar o gasto → conferir → salvar
```

## Lançar por voz

Na tela **Lançar por Voz** (também no atalho do Dashboard) é só tocar no
microfone e falar, por exemplo:

- “Comprei 3 sacos de ureia na Agro Rural por 180 reais cada”
- “Paguei 2 diárias de 150 reais para o João”
- “Conta de luz de 840 reais”
- “Vendi 10 caixas de goiaba a 60 reais a caixa para o mercado central”

O app entende valor, quantidade, unidade, data (“hoje”, “ontem”, “dia 12”),
loja (“na Agro Rural”) e pessoa (“para o João”), decide sozinho se aquilo é
**Insumo, Material, Mão de Obra, Energia ou Venda**, mostra o lançamento
montado para conferência e só grava depois do seu “Salvar”. Dali em diante é
um lançamento como qualquer outro: entra no Financeiro, sincroniza no
Supabase e sai na planilha em **Exportar Excel**. Compra de insumo também
soma no Estoque, igual ao lançamento manual.

Como funciona por baixo:

- A fala vira texto pelo reconhecimento de voz do próprio navegador
  (`SpeechRecognition`) — sem chave de API, sem servidor e sem custo. Precisa
  de HTTPS, que a hospedagem (Cloudflare/Vercel/GitHub Pages) já oferece.
- A frase é interpretada em `src/lib/voz.js`, dentro do aparelho: nada do que
  você fala é enviado para outro serviço.
- Se o navegador não reconhecer voz (alguns iPhones e navegadores antigos), dá
  para ditar no campo de texto usando o microfone do próprio teclado — o
  resultado é o mesmo.

