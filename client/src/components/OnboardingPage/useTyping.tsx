import { useEffect, useState } from "react";

function useTyping(text: string, start: boolean, cps = 20) {
  const [out, setOut] = useState("");
  
  useEffect(() => {
    if (!start) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, Math.max(10, 1000 / cps));
    return () => clearInterval(id);
  }, [text, start, cps]);
  
  return out;
}

export default useTyping;