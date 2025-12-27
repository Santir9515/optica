// src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";

import ClientesList from "./pages/Clientes/ClientesList";
import ProveedoresList from "./pages/Proveedores/ProveedoresList";
import InsumosList from "./pages/Insumos/InsumosList";
import ComprasList from "./pages/CompraInsumos/ComprasList";
import CompraDetalle from "./pages/CompraInsumos/CompraDetalle";
import PedidosLabList from "./pages/PedidosLaboratorio/PedidosLabList";
import RecetasList from "./pages/Recetas/RecetasList";
import RecetaDetalle from "./pages/Recetas/DetalleReceta";
import ClienteForm from "./pages/Clientes/ClienteForm";
import ClienteDetalle from "./pages/Clientes/ClienteDetalle";

export default function App() {
  return (
    <Routes>
      {/* Todo lo que quiera sidebar / layout va acá adentro */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/clientes" replace />} />

        <Route path="/clientes" element={<ClientesList />} />
        <Route path="/clientes/nuevo" element={<ClienteForm/>} />
        <Route path="/clientes/:id_cliente/editar" element={<ClienteForm />} />
        <Route path="/clientes/:id_cliente" element={<ClienteDetalle />} />

        <Route path="/proveedores" element={<ProveedoresList />} />
        <Route path="/insumos" element={<InsumosList />} />

        <Route path="/compras-insumos" element={<ComprasList />} />
        <Route path="/compras-insumos/:id_compra" element={<CompraDetalle />} />

        <Route path="/pedidos-laboratorio" element={<PedidosLabList />} />
        <Route path="/recetas" element={<RecetasList />} />
        <Route path="/recetas/:id_receta" element={<RecetaDetalle />} />
      </Route>

      {/* 404: cualquier otra ruta vuelve a clientes */}
      <Route path="*" element={<Navigate to="/clientes" replace />} />
    </Routes>
  );
}
