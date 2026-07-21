import { useState, useEffect } from "react";

// Telas pequenas: usado para trocar menu lateral por gaveta e tabelas por cartões
const MOBILE_Q = "(max-width: 760px)";
export const isMobileNow = () => typeof window !== "undefined" && window.matchMedia(MOBILE_Q).matches;

export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobileNow);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_Q);
    // resize cobre casos em que o evento do matchMedia não dispara (ex.: girar a tela)
    const sync = () => setMobile(mq.matches);
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    sync();
    return () => { mq.removeEventListener("change", sync); window.removeEventListener("resize", sync); };
  }, []);
  return mobile;
}
