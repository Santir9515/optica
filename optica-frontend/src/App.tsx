import { useEffect, useState } from "react";
import api from "./lib/api";

function App() {
  const [status, setStatus] = useState<string>("Cargando...");

  useEffect(() => {
    api.get("/")
      .then(res => setStatus(res.data.message))
      .catch(() => setStatus("API no disponible"));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Óptica</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
