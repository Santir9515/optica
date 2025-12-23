import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import {
  getPedidosAvanzado,
  type PedidoLabRow,
  type PedidoOrderBy,
  type OrderDir,
} from "../../api/pedidosLaboratorio";

type SortState = { orderBy: PedidoOrderBy; orderDir: OrderDir };

const ESTADOS = [
  "PENDIENTE",
  "ENVIADO",
  "EN_PROCESO",
  "RECIBIDO",
  "CANCELADO",
] as const;

export default function PedidosLabList() {
  const [items, setItems] = useState<PedidoLabRow[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 400);

  const [estado, setEstado] = useState<string | undefined>(undefined);

  const [sort, setSort] = useState<SortState>({
    orderBy: "fecha_envio",
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

  // cuando cambian filtros / sort / limit => volvemos a página 1
  useEffect(() => {
    setOffset(0);
  }, [qDebounced, estado, sort.orderBy, sort.orderDir, limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getPedidosAvanzado({
      q: qDebounced.trim() || undefined,
      estado: estado || undefined,
      order_by: sort.orderBy,
      order_dir: sort.orderDir,
      limit,
      offset,
    })
      .then((res) => {
        setItems(res?.data ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch((e) => {
        setError(e?.message ?? "Error consultando API");
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [qDebounced, estado, sort.orderBy, sort.orderDir, limit, offset]);

  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  function nextPage() {
    setOffset((o) => o + limit);
  }

  function toggleSort(col: PedidoOrderBy) {
    setSort((s) => {
      if (s.orderBy !== col) return { orderBy: col, orderDir: "asc" };
      return { orderBy: col, orderDir: s.orderDir === "asc" ? "desc" : "asc" };
    });
  }

  function sortIndicator(col: PedidoOrderBy) {
    if (sort.orderBy !== col) return "";
    return sort.orderDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Pedidos al laboratorio</h1>

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
          placeholder="Buscar por estado, nro orden, observaciones..."
          style={{ padding: 8, minWidth: 300 }}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Estado:
          <select
            value={estado ?? "all"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") setEstado(undefined);
              else setEstado(v);
            }}
          >
            <option value="all">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
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

      {loading && <p>Cargando pedidos...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {/* Tabla */}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("fecha_envio")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Fecha envío{sortIndicator("fecha_envio")}
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
                onClick={() => toggleSort("estado")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Estado{sortIndicator("estado")}
              </th>

              <th
                onClick={() => toggleSort("nro_orden_lab")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Nro orden{sortIndicator("nro_orden_lab")}
              </th>

              <th
                onClick={() => toggleSort("id_pedido_lab")}
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Ítems{sortIndicator("id_pedido_lab")}
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
              <tr key={p.id_pedido_lab}>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.fecha_envio ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.proveedor_nombre
                    ? p.proveedor_nombre
                    : `Proveedor #${p.id_proveedor}`}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.estado ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {p.nro_orden_lab ?? "-"}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {p.items}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "center",
                  }}
                >
                  <Link to={`/pedidos-laboratorio/${p.id_pedido_lab}`}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
