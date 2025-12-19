// src/pages/Compras/CompraDetalle.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCompraById } from "../../api/comprasInsumos";
import type { CompraDetalle } from "../../api/comprasInsumos";

export default function CompraDetalle() {
  const { id_compra } = useParams<{ id_compra: string }>();

  const [data, setData] = useState<CompraDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id_compra) return;

    setLoading(true);
    setError(null);

    getCompraById(Number(id_compra))
      .then((res) => {
        setData(res);
      })
      .catch((e) => {
        setError(e?.message ?? "Error consultando API");
      })
      .finally(() => setLoading(false));
  }, [id_compra]);

  if (!id_compra) {
    return <p>Falta el parámetro id_compra en la URL.</p>;
  }

  if (loading) return <p>Cargando compra...</p>;
  if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
  if (!data) return <p>No se encontró la compra.</p>;

  const {
    fecha_compra,
    tipo_comprobante,
    nro_comprobante,
    monto_total,
    observaciones,
    anulada,
    motivo_anulacion,
    fecha_anulacion,
    detalles,
  } = data;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1>Compra #{data.id_compra}</h1>
        <Link to="/compras-insumos">Volver al listado</Link>
      </div>

      <div
        style={{
          border: "1px solid #444",
          borderRadius: 4,
          padding: 12,
          marginBottom: 16,
          backgroundColor: anulada ? "#0e0d0dff" : "#f7f7f7",
        }}
      >
        <p>
          <strong>Fecha:</strong> {fecha_compra}
        </p>
        <p>
          <strong>Proveedor ID:</strong> {data.id_proveedor}
        </p>
        <p>
          <strong>Comprobante:</strong>{" "}
          {tipo_comprobante ? `${tipo_comprobante} ${nro_comprobante ?? ""}` : "-"}
        </p>
        <p>
          <strong>Monto total:</strong> ${monto_total.toFixed(2)}
        </p>
        <p>
          <strong>Observaciones:</strong> {observaciones || "-"}
        </p>
        <p>
          <strong>Estado:</strong>{" "}
          {anulada ? "ANULADA" : "VIGENTE"}
        </p>
        {anulada && (
          <>
            <p>
              <strong>Motivo anulación:</strong> {motivo_anulacion || "-"}
            </p>
            <p>
              <strong>Fecha anulación:</strong> {fecha_anulacion || "-"}
            </p>
          </>
        )}
      </div>

      <h2>Detalles de la compra</h2>

      {(!detalles || detalles.length === 0) ? (
        <p>No hay ítems cargados en esta compra.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>
                Insumo
              </th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #444", padding: 8 }}>
                Cantidad
              </th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #444", padding: 8 }}>
                Precio unitario
              </th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #444", padding: 8 }}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((d) => (
              <tr key={d.id_detalle}>
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {d.descripcion_insumo ?? `Insumo #${d.id_insumo}`}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  {d.cantidad}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  ${d.precio_unitario.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                  }}
                >
                  ${d.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
