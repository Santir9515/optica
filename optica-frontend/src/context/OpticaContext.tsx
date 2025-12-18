// src/context/OpticaContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type OpticaContextType = {
  opticaId: string;
  setOpticaId: (id: string) => void;
};

const OpticaContext = createContext<OpticaContextType | undefined>(undefined);

// Para desarrollo podés dejar un ID fijo
const DEFAULT_OPTICA_ID = "optica-demo-001";

export function OpticaProvider({ children }: { children: ReactNode }) {
  const [opticaId, setOpticaIdState] = useState<string>(DEFAULT_OPTICA_ID);

  useEffect(() => {
    const stored = localStorage.getItem("optica_id");
    if (stored) {
      setOpticaIdState(stored);
    } else {
      localStorage.setItem("optica_id", DEFAULT_OPTICA_ID);
    }
  }, []);

  function setOpticaId(id: string) {
    setOpticaIdState(id);
    localStorage.setItem("optica_id", id);
  }

  return (
    <OpticaContext.Provider value={{ opticaId, setOpticaId }}>
      {children}
    </OpticaContext.Provider>
  );
}

export function useOptica() {
  const ctx = useContext(OpticaContext);
  if (!ctx) {
    throw new Error("useOptica debe usarse dentro de un OpticaProvider");
  }
  return ctx;
}
