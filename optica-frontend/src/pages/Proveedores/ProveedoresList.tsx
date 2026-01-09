import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import {
  getProveedoresAvanzado,
  setProveedorActivo,
} from "../../api/proveedores";
import type { Proveedor, ProveedorOrderBy, OrderDir } from "../../api/proveedores";

type SortState = { orderBy: ProveedorOrderBy; orderDir: OrderDir };

export default function ProveedoresList() {
  const [items, setItems] = useState<Proveedor[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 400);

  const [activo, setActivo] = useState<boolean | undefined>(true);

  const [sort, setSort] = useState<SortState>({
    orderBy: "nombre",
    orderDir: "asc",
  });

  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const desde = total === 0 ? 0 : offset + 1;
  const hasta = Math.min(offset + limit, total);

  // cuando cambian filtros/sort/limit => volver a página 1
  useEffect(() => {
    setOffset(0);
  }, [qDebounced, activo, sort.orderBy, sort.orderDir, limit]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getProveedoresAvanzado({
        q: qDebounced.trim() || undefined,
        activo,
        order_by: sort.orderBy,
        order_dir: sort.orderDir,
        limit,
        offset,
      });

      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        e?.message ??
        "Error consultando API";
      setError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [qDebounced, activo, sort.orderBy, sort.orderDir, limit, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  function nextPage() {
    setOffset((o) => o + limit);
  }

  function toggleSort(col: ProveedorOrderBy) {
    setSort((s) => {
      if (s.orderBy !== col) return { orderBy: col, orderDir: "asc" };
      return { orderBy: col, orderDir: s.orderDir === "asc" ? "desc" : "asc" };
    });
  }

  function sortIndicator(col: ProveedorOrderBy) {
    if (sort.orderBy !== col) return "";
    return sort.orderDir === "asc" ? " ▲" : " ▼";
  }

  async function onDeactivate(id_proveedor: number, label?: string) {
    const ok = window.confirm(
      `¿Seguro que querés desactivar el proveedor${label ? ` "${label}"` : ""}?\n\nEsto NO lo elimina: solo lo marca como INACTIVO.`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await setProveedorActivo(id_proveedor, false);
      await fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error desactivando proveedor");
    } finally {
      setLoading(false);
    }
  }

  async function onReactivate(id_proveedor: number, label?: string) {
    const ok = window.confirm(
      `¿Seguro que querés reactivar el proveedor${label ? ` "${label}"` : ""}?`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await setProveedorActivo(id_proveedor, true);
      await fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error reactivando proveedor");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h1>Proveedores</h1>
        <Link to="/proveedores/nuevo">+ Nuevo</Link>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono, dirección..."
          style={{ padding: 8, minWidth: 340 }}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Activo:
          <select
            value={activo === undefined ? "all" : activo ? "true" : "false"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") setActivo(undefined);
              else setActivo(v === "true");
            }}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
            <option value="all">Todos</option>
          </select>
        </label>
      </div>

      {/* Paginación */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <button onClick={prevPage} disabled={!canPrev}>
          Anterior
        </button>

        <span>
          Página {page}/{totalPages} — Mostrando {desde}-{hasta} de {total}
        </span>

        <button onClick={nextPage} disabled={!canNext}>
          Siguiente
        </button>

        <div style={{ marginLeft: "auto" }}>
          <label>
            Por página:{" "}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <p>Cargando proveedores...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {/* Tabla */}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("nombre")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Nombre{sortIndicator("nombre")}
              </th>

              <th
                onClick={() => toggleSort("telefono")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Teléfono{sortIndicator("telefono")}
              </th>

              <th
                onClick={() => toggleSort("email")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Email{sortIndicator("email")}
              </th>

              <th
                onClick={() => toggleSort("direccion")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Dirección{sortIndicator("direccion")}
              </th>

              <th
                onClick={() => toggleSort("activo")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Activo{sortIndicator("activo")}
              </th>

              <th
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #444",
                  padding: 8,
                }}
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((p) => (
              <tr key={p.id_proveedor}>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.nombre}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.telefono ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.email ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.direccion ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.activo ? "Sí" : "No"}
                </td>

                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Link
                    to={`/proveedores/${p.id_proveedor}`}
                    style={{ marginRight: 12 }}
                  >
                    Ver
                  </Link>

                  <Link
                    to={`/proveedores/${p.id_proveedor}/editar`}
                    style={{ marginRight: 12 }}
                  >
                    Editar
                  </Link>

                  {p.activo ? (
                    <button onClick={() => onDeactivate(p.id_proveedor, p.nombre)} style={{
                        background: "transparent",
                        border: "1px solid #a33",
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}>Eliminar</button>
                  ) : (
                    <button onClick={() => onReactivate(p.id_proveedor, p.nombre)} style={{
                        background: "transparent",
                        border: "1px solid #3a3",
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}>Reactivar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
