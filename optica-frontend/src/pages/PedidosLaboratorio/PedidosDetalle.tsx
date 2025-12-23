// src/pages/PedidosLaboratorio/PedidoDetalle.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPedidoById, type PedidoDetalle } from "../../api/pedidosLaboratorio";

export default function PedidoDetalle() {
  const { id_pedido_lab } = useParams<{ id_pedido_lab: string }>();

  const [data, setData] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id_pedido_lab) return;

    setLoading(true);
    setError(null);

    getPedidoById(Number(id_pedido_lab))
      .then((res) => setData(res))
      .catch((e) =>
        setError(e?.message ?? "Error consultando API")
      )
      .finally(() => setLoading(false));
  }, [id_pedido_lab]);

  if (!id_pedido_lab) {
    return <p>Falta el parámetro id_pedido_lab en la URL.</p>;
  }

  if (loading) return <p>Cargando pedido...</p>;
  if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
  if (!data) return <p>No se encontró el pedido.</p>;

  const {
    fecha_envio,
    fecha_estimada_rec,
    fecha_recepcion,
    estado,
    nro_orden_lab,
    observaciones,
    proveedor,
    receta,
    insumos,
  } = data;

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Pedido laboratorio #{data.id_pedido_lab}</h1>
        <Link to="/pedidos-laboratorio">Volver al listado</Link>
      </div>

      {/* Cabecera */}
      <div
        style={{
          border: "1px solid #444",
          borderRadius: 4,
          padding: 12,
          marginBottom: 16,
          backgroundColor: "#050505ff",
        }}
      >
        <p>
          <strong>Proveedor:</strong>{" "}
          {proveedor?.nombre
            ? `${proveedor.nombre} (ID ${proveedor.id_proveedor})`
            : `ID ${data.id_proveedor}`}
        </p>

        <p>
          <strong>Receta:</strong>{" "}
          {receta?.id_receta
            ? `Receta #${receta.id_receta} (Cliente ID ${receta.id_cliente ?? "-"})`
            : `ID receta ${data.id_receta}`}
        </p>

        <p>
          <strong>Fecha envío:</strong> {fecha_envio ?? "-"}
        </p>
        <p>
          <strong>Fecha estimada recepción:</strong> {fecha_estimada_rec ?? "-"}
        </p>
        <p>
          <strong>Fecha recepción:</strong> {fecha_recepcion ?? "-"}
        </p>

        <p>
          <strong>Estado:</strong> {estado ?? "-"}
        </p>

        <p>
          <strong>Nro orden laboratorio:</strong> {nro_orden_lab ?? "-"}
        </p>

        <p>
          <strong>Observaciones:</strong> {observaciones || "-"}
        </p>
      </div>

      {/* Detalle de insumos */}
      <h2>Insumos del pedido</h2>

      {(!insumos || insumos.length === 0) ? (
        <p>No hay insumos cargados en este pedido.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                }}
              >
                Insumo
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                }}
              >
                Cantidad
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #444",
                  padding: 8,
                }}
              >
                Precio unitario
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  padding: 8,
                }}
              >
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((d) => (
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
                <td style={{ padding: 8, borderBottom: "1px solid #333" }}>
                  {d.observaciones || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
