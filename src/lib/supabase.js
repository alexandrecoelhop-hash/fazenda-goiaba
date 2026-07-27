import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════
//  CAMADA DE SINCRONIZAÇÃO (Supabase) — guarda os dados na nuvem
//  Credenciais vêm do .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
// ═══════════════════════════════════════════════════════════════════════════
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const envOk = Boolean(url && key);
export const supabase = envOk ? createClient(url, key) : null;

// Config local: guarda apenas o usuário ("usuario::senha"), como no modelo atual.
// Compatível com a config antiga ({ url, key, user }) — aproveita o campo user.
const CFG_KEY = "fazenda_sync_cfg";
export function getCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY) || "null"); }
  catch { return null; }
}
export function saveCfg(user) { localStorage.setItem(CFG_KEY, JSON.stringify({ user })); }
export function logout() { localStorage.removeItem(CFG_KEY); }

export async function loadData() {
  const c = getCfg();
  const { data, error } = await supabase
    .from("fazenda_dados")
    .select("dados")
    .eq("usuario", c.user)
    .maybeSingle();
  if (error) throw error;
  return data ? data.dados : null;
}

export async function saveData(dados) {
  const c = getCfg();
  const { error } = await supabase
    .from("fazenda_dados")
    .upsert(
      { usuario: c.user, dados, atualizado_em: new Date().toISOString() },
      { onConflict: "usuario" }
    );
  if (error) throw error;
  return true;
}

// Traduz um erro de sincronização para uma mensagem clara (e como corrigir)
export function descreverErro(e) {
  if (!envOk) return "As credenciais do Supabase não estão configuradas (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).";
  if (!e) return "Erro desconhecido ao sincronizar.";
  const msg = e.message || String(e);
  const code = e.code || "";
  if (/fetch|network|failed to fetch|load failed|timeout|networkerror/i.test(msg))
    return "Sem conexão com a internet (ou o servidor não respondeu). Verifique a rede e toque em “Tentar de novo”.";
  if (code === "42P01" || /does not exist|relation .* does not exist/i.test(msg))
    return "A tabela “fazenda_dados” não existe no seu projeto Supabase. Rode o SQL de criação da tabela (veja o README).";
  if (code === "42501" || /row-level security|rls|violates|not authorized|permission denied|policy/i.test(msg))
    return "Sem permissão para gravar na tabela (RLS). Confira as policies/grants da tabela “fazenda_dados” no Supabase.";
  if (/api key|jwt|invalid.*key|authoriz|anon/i.test(msg))
    return "Chave de acesso (anon key) inválida ou expirada. Confira a VITE_SUPABASE_ANON_KEY.";
  if (/payload|too large|413/i.test(msg))
    return "Os dados ficaram grandes demais para salvar de uma vez. Me avise para otimizar o armazenamento.";
  return "Não consegui salvar na nuvem: " + msg;
}

// Testa a conexão com as credenciais do .env (sem depender de dados)
export async function testConnection() {
  if (!envOk) return { ok: false, msg: "Credenciais do Supabase não configuradas. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o app." };
  const { error } = await supabase.from("fazenda_dados").select("usuario").limit(1);
  if (!error) return { ok: true };
  if (error.code === "42P01" || /does not exist/i.test(error.message)) return { ok: false, msg: "Tabela não encontrada. Rode o SQL de criação da tabela no Supabase (veja o README)." };
  if (/api key|jwt|authoriz/i.test(error.message)) return { ok: false, msg: "Chave (anon key) inválida ou sem permissão. Confira a chave no .env e se você rodou o SQL de configuração." };
  return { ok: false, msg: "Não consegui conectar: " + error.message };
}
