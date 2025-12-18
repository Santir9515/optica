import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import {
  getProveedoresAvanzado,
  type Proveedor,
  type ProveedorOrderBy,
  type OrderDir,
} from "../../api/proveedores";

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

  // Reset de página cuando cambian filtros / sort / limit
  useEffect(() => {
    setOffset(0);
  }, [qDebounced, activo, sort.orderBy, sort.orderDir, limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getProveedoresAvanzado({
      q: qDebounced.trim() || undefined,
      activo,
      order_by: sort.orderBy,
      order_dir: sort.orderDir,
      limit,
      offset,
    })
      .then((res) => {
        // Por si acaso, defensivo:
        const lista = Array.isArray(res.items) ? res.items : [];
        setItems(lista);
        setTotal(res.total ?? lista.length);
      })
      .catch((e) => setError(e?.message ?? "Error consultando API"))
      .finally(() => setLoading(false));
  }, [qDebounced, activo, sort.orderBy, sort.orderDir, limit, offset]);

  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  function nextPage() {
    setOffset((o) => o + limit);
  }

  function onChangeLimit(v: number) {
    setLimit(v);
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

  return (
    <div style={{ padding: 16 }}>
      <h1>Proveedores</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono..."
          style={{ padding: 8, minWidth: 320 }}
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

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
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
              onChange={(e) => onChangeLimit(Number(e.target.value))}
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
