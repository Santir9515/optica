import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";

import ClientesList from "./pages/Clientes/ClientesList";
import ProveedoresList from "./pages/Proveedores/ProveedoresList";
import InsumosList from "./pages/Insumos/InsumosList";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/clientes" replace />} />
        <Route path="/clientes" element={<ClientesList />} />
        <Route path="/proveedores" element={<ProveedoresList />} />
        <Route path="/insumos" element={<InsumosList />} />
        {/* <Route path="/compras-insumos" element={<ComprasList />} /> */}
        {/* <Route path="/pedidos-laboratorio" element={<PedidosList />} /> */}
        {/* <Route path="/recetas" element={<RecetasList />} /> */}
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/clientes" replace />} />
    </Routes>
  );
}
