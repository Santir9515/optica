import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  "navLink" + (isActive ? " active" : "");

export default function AppLayout() {
  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">Ó</div>
          <div>
            <div className="title">Óptica</div>
            <div className="subtitle">Sistema de gestión</div>
          </div>
        </div>

        {/* A futuro: multi-óptica/tenant selector */}
        <div className="topbarRight">
          <select className="tenantSelect" defaultValue="default">
            <option value="default">Óptica (demo)</option>
            <option value="optica-2" disabled>
              Óptica 2 (próximamente)
            </option>
          </select>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <nav className="nav">
            <NavLink to="/clientes" className={linkClass}>
              Clientes
            </NavLink>
            <NavLink to="/proveedores" className={linkClass}>
              Proveedores
            </NavLink>
            <NavLink to="/insumos" className={linkClass}>
              Insumos
            </NavLink>
            <NavLink to="/compras-insumos" className={linkClass}>
              Compras
            </NavLink>
            <NavLink to="/pedidos-laboratorio" className={linkClass}>
              Pedidos Lab
            </NavLink>
            <NavLink to="/recetas" className={linkClass}>
              Recetas
            </NavLink>
          </nav>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
