import { useEffect, useRef, useState } from "react";

// ─── Microfone: transforma fala em texto usando o próprio navegador ──────────
// Não precisa de chave, de servidor nem de internet paga: o Chrome/Safari já
// trazem o reconhecimento de voz embutido. Exige HTTPS (o app hospedado já é).
const Reconhecimento = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export const falaSuportada = () => !!Reconhecimento;

const MENSAGENS = {
  "not-allowed": "O microfone está bloqueado. Libere o acesso ao microfone para este site nas configurações do navegador.",
  "service-not-allowed": "O microfone está bloqueado. Libere o acesso ao microfone para este site nas configurações do navegador.",
  "no-speech": "Não ouvi nada. Toque no microfone e fale logo em seguida.",
  "audio-capture": "Não encontrei um microfone neste aparelho.",
  "network": "Sem conexão para reconhecer a fala. Verifique a internet e tente de novo.",
  "aborted": "",
};

export function useFala(aoTerminar) {
  const [ouvindo, setOuvindo] = useState(false);
  const [parcial, setParcial] = useState("");
  const [erro, setErro] = useState("");
  const recRef = useRef(null);
  const finalRef = useRef("");
  const parcialRef = useRef("");
  const cbRef = useRef(aoTerminar);
  useEffect(() => { cbRef.current = aoTerminar; });
  useEffect(() => () => { try { recRef.current && recRef.current.abort(); } catch { /* ignora */ } }, []);

  const ouvir = () => {
    if (ouvindo) { parar(); return; }
    if (!Reconhecimento) {
      setErro("Este navegador não reconhece voz. Use o Chrome no Android, o Safari no iPhone — ou o microfone do próprio teclado no campo de texto abaixo.");
      return;
    }
    const rec = new Reconhecimento();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    finalRef.current = "";
    parcialRef.current = "";
    rec.onresult = (ev) => {
      let emAndamento = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalRef.current += t + " ";
        else emAndamento += t;
      }
      parcialRef.current = (finalRef.current + emAndamento).trim();
      setParcial(parcialRef.current);
    };
    rec.onerror = (ev) => {
      const m = MENSAGENS[ev.error];
      if (m !== "") setErro(m || `Não consegui ouvir (${ev.error}).`);
    };
    rec.onend = () => {
      setOuvindo(false);
      const texto = (finalRef.current.trim() || parcialRef.current).trim();
      if (texto && cbRef.current) cbRef.current(texto);
    };
    setErro("");
    setParcial("");
    try {
      rec.start();
      recRef.current = rec;
      setOuvindo(true);
    } catch {
      setErro("Não consegui abrir o microfone. Tente de novo.");
    }
  };

  const parar = () => { try { recRef.current && recRef.current.stop(); } catch { /* ignora */ } };

  return { ouvindo, parcial, erro, setErro, ouvir, parar, suportado: !!Reconhecimento };
}
