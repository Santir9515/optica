import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { getInsumosAvanzado } from "../../api/insumos";
import type {
  Insumo,
  InsumoOrderBy,
  OrderDir,
} from "../../api/insumos";

type SortState = { orderBy: InsumoOrderBy; orderDir: OrderDir };

export default function InsumosList() {
  const [items, setItems] = useState<Insumo[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 400);

  const [activo, setActivo] = useState<boolean | undefined>(true);
  const [tipoInsumo, setTipoInsumo] = useState("");

  const [sort, setSort] = useState<SortState>({
    orderBy: "descripcion",
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

  // reset de página cuando cambian filtros/sort/limit
  useEffect(() => {
    setOffset(0);
  }, [qDebounced, activo, tipoInsumo, sort.orderBy, sort.orderDir, limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getInsumosAvanzado({
      q: qDebounced.trim() || undefined,
      activo,
      tipo_insumo: tipoInsumo.trim() || undefined,
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
  }, [qDebounced, activo, tipoInsumo, sort.orderBy, sort.orderDir, limit, offset]);

  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  function nextPage() {
    setOffset((o) => o + limit);
  }

  function onChangeLimit(v: number) {
    setLimit(v);
  }

  function toggleSort(col: InsumoOrderBy) {
    setSort((s) => {
      if (s.orderBy !== col) return { orderBy: col, orderDir: "asc" };
      return { orderBy: col, orderDir: s.orderDir === "asc" ? "desc" : "asc" };
    });
  }

  function sortIndicator(col: InsumoOrderBy) {
    if (sort.orderBy !== col) return "";
    return sort.orderDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Insumos</h1>

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
          placeholder="Buscar por descripción, código, tipo..."
          style={{ padding: 8, minWidth: 260 }}
        />

        <input
          value={tipoInsumo}
          onChange={(e) => setTipoInsumo(e.target.value)}
          placeholder="Filtrar por tipo de insumo (lente, armazón, etc.)"
          style={{ padding: 8, minWidth: 220 }}
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

      {loading && <p>Cargando insumos...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("descripcion")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Descripción{sortIndicator("descripcion")}
              </th>
              <th
                onClick={() => toggleSort("tipo_insumo")}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Tipo{sortIndicator("tipo_insumo")}
              </th>
              <th
                onClick={() => toggleSort("stock_actual")}
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Stock actual{sortIndicator("stock_actual")}
              </th>
              <th
                onClick={() => toggleSort("stock_minimo")}
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Stock mínimo{sortIndicator("stock_minimo")}
              </th>
              <th
                onClick={() => toggleSort("precio_costo")}
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Precio costo{sortIndicator("precio_costo")}
              </th>
              <th
                onClick={() => toggleSort("precio_sugerido")}
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                Precio sugerido{sortIndicator("precio_sugerido")}
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
                Proveedor ID{sortIndicator("id_proveedor")}
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                Activo
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((i) => (
              <tr key={i.id_insumo}>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {i.descripcion}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {i.tipo_insumo ?? "-"}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {i.stock_actual ?? 0}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {i.stock_minimo ?? "-"}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {i.precio_costo != null ? i.precio_costo.toFixed(2) : "-"}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {i.precio_sugerido != null ? i.precio_sugerido.toFixed(2) : "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {i.id_proveedor ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {i.activo ? "Sí" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
