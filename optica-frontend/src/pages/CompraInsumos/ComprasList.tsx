// src/pages/ComprasInsumos/ComprasList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";              // 👈 NUEVO
import { useDebounce } from "../../hooks/useDebounce";
import { getComprasAvanzado } from "../../api/comprasInsumos";
import type {
  CompraInsumos,
  CompraOrderBy,
  OrderDir,
} from "../../api/comprasInsumos";

type SortState = { orderBy: CompraOrderBy; orderDir: OrderDir };

export default function ComprasList() {
  const [items, setItems] = useState<CompraInsumos[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 400);

  const [anulada, setAnulada] = useState<boolean | undefined>(undefined);

  const [sort, setSort] = useState<SortState>({
    orderBy: "fecha_compra",
    orderDir: "desc",
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

  useEffect(() => {
    setOffset(0);
  }, [qDebounced, anulada, sort.orderBy, sort.orderDir, limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getComprasAvanzado({
      q: qDebounced.trim() || undefined,
      anulada,
      order_by: sort.orderBy,
      order_dir: sort.orderDir,
      limit,
      offset,
    })
      .then((res) => {
        setItems(res?.items ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch((e) => {
        setError(e?.message ?? "Error consultando API");
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [qDebounced, anulada, sort.orderBy, sort.orderDir, limit, offset]);

  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  function nextPage() {
    setOffset((o) => o + limit);
  }

  function toggleSort(col: CompraOrderBy) {
    setSort((s) => {
      if (s.orderBy !== col) return { orderBy: col, orderDir: "asc" };
      return { orderBy: col, orderDir: s.orderDir === "asc" ? "desc" : "asc" };
    });
  }

  function sortIndicator(col: CompraOrderBy) {
    if (sort.orderBy !== col) return "";
    return sort.orderDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Compras de Insumos</h1>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, tipo comprobante, observaciones..."
          style={{ padding: 8, minWidth: 300 }}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Estado:
          <select
            value={anulada === undefined ? "all" : anulada ? "true" : "false"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") setAnulada(undefined);
              else setAnulada(v === "true");
            }}
          >
            <option value="all">Todas</option>
            <option value="true">Anuladas</option>
            <option value="false">Válidas</option>
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

      {loading && <p>Cargando compras...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {/* Tabla */}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("fecha_compra")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Fecha{sortIndicator("fecha_compra")}
              </th>

              <th
                onClick={() => toggleSort("id_proveedor")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Proveedor{sortIndicator("id_proveedor")}
              </th>

              <th
                onClick={() => toggleSort("monto_total")}
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Total{sortIndicator("monto_total")}
              </th>

              <th
                onClick={() => toggleSort("anulada")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Estado{sortIndicator("anulada")}
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((c) => (
              <tr key={c.id_compra}>
                {/* Enlace al detalle */}
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  <Link to={`/compras-insumos/${c.id_compra}`}>
                    {c.fecha_compra}
                  </Link>
                </td>

                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {c.id_proveedor}
                </td>

                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {c.monto_total != null ? c.monto_total.toFixed(2) : "-"}
                </td>

                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {c.anulada ? "Anulada" : "Vigente"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
