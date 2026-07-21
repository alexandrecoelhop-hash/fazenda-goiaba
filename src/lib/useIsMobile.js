import { useState, useEffect } from "react";

// Telas pequenas: usado para trocar menu lateral por gaveta e tabelas por cartões
const MOBILE_Q = "(max-width: 760px)";
export const isMobileNow = () => typeof window !== "undefined" && window.matchMedia(MOBILE_Q).matches;

export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobileNow);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_Q);
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}
