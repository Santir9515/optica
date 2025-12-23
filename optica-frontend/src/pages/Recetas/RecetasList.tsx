// src/pages/Recetas/RecetasList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import {
  getRecetasAvanzado,
  type Receta,
  type RecetaOrderBy,
  type OrderDir,
} from "../../api/recetas";

type SortState = { orderBy: RecetaOrderBy; orderDir: OrderDir };

const ESTADOS = ["ACTIVA", "EN_LABORATORIO", "FINALIZADA", "CANCELADA"] as const;

export default function RecetasList() {
  const [items, setItems] = useState<Receta[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 400);

  const [estado, setEstado] = useState<string | undefined>(undefined);

  const [sort, setSort] = useState<SortState>({
    orderBy: "fecha_receta",
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

  // reset página cuando cambian filtros/sort
  useEffect(() => {
    setOffset(0);
  }, [qDebounced, estado, sort.orderBy, sort.orderDir, limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getRecetasAvanzado({
      q: qDebounced.trim() || undefined,
      estado: estado || undefined,
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
  }, [qDebounced, estado, sort.orderBy, sort.orderDir, limit, offset]);

  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  function nextPage() {
    setOffset((o) => o + limit);
  }

  function toggleSort(col: RecetaOrderBy) {
    setSort((s) => {
      if (s.orderBy !== col) return { orderBy: col, orderDir: "asc" };
      return { orderBy: col, orderDir: s.orderDir === "asc" ? "desc" : "asc" };
    });
  }

  function sortIndicator(col: RecetaOrderBy) {
    if (sort.orderBy !== col) return "";
    return sort.orderDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Recetas</h1>

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
          placeholder="Buscar por cliente, profesional, tipo lente, estado..."
          style={{ padding: 8, minWidth: 320 }}
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

      {loading && <p>Cargando recetas...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {/* Tabla */}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("fecha_receta")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Fecha{sortIndicator("fecha_receta")}
              </th>
              <th
                onClick={() => toggleSort("cliente_apellido")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Cliente{sortIndicator("cliente_apellido")}
              </th>
              <th
                onClick={() => toggleSort("profesional")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Profesional{sortIndicator("profesional")}
              </th>
              <th
                onClick={() => toggleSort("tipo_lente")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Tipo lente{sortIndicator("tipo_lente")}
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
            {items.map((r) => (
              <tr key={r.id_receta}>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {r.fecha_receta}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {/* Por ahora mostramos solo el id_cliente, más adelante podemos traer datos del cliente */}
                  Cliente #{r.id_cliente}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {r.profesional ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {r.tipo_lente ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {r.estado ?? "-"}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "center",
                  }}
                >
                  <Link to={`/recetas/${r.id_receta}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
