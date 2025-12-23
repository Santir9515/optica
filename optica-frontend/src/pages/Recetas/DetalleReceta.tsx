import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRecetaById, type RecetaDetalle as RecetaDetalleType } from "../../api/recetas";

export default function RecetaDetalle() {
  const { id_receta } = useParams<{ id_receta: string }>();

  const [data, setData] = useState<RecetaDetalleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id_receta) return;

    setLoading(true);
    setError(null);

    getRecetaById(Number(id_receta))
      .then((res) => setData(res))
      .catch((e) => setError(e?.message ?? "Error consultando API"))
      .finally(() => setLoading(false));
  }, [id_receta]);

  if (!id_receta) return <p>Falta el parámetro id_receta en la URL.</p>;
  if (loading) return <p>Cargando receta...</p>;
  if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
  if (!data) return <p>No se encontró la receta.</p>;

  const c = data.cliente ?? null;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1>Receta #{data.id_receta}</h1>
        <Link to="/recetas">Volver</Link>
      </div>

      <div style={{ border: "1px solid #444", borderRadius: 4, padding: 12, marginBottom: 16 }}>
        <p><strong>Fecha:</strong> {new Date(data.fecha_receta).toLocaleDateString()}</p>
        <p><strong>Estado:</strong> {data.estado}</p>
        <p><strong>Profesional:</strong> {data.profesional ?? "-"}</p>
        <p><strong>Tipo lente:</strong> {data.tipo_lente ?? "-"}</p>
        <p><strong>Observaciones:</strong> {data.observaciones ?? "-"}</p>
      </div>

      <h2>Cliente</h2>
      <div style={{ border: "1px solid #444", borderRadius: 4, padding: 12 }}>
        <p><strong>ID:</strong> {data.id_cliente}</p>
        <p><strong>Nombre:</strong> {c?.apellido ? `${c.apellido}, ${c.nombre ?? ""}` : "-"}</p>
        <p><strong>DNI:</strong> {c?.dni ?? "-"}</p>
        <p><strong>Teléfono:</strong> {c?.telefono ?? "-"}</p>
        <p><strong>Email:</strong> {c?.email ?? "-"}</p>
      </div>
      <h2>Graduación</h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, border: "1px solid #444", padding: 12 }}>
          <h3>Ojo Derecho (OD)</h3>
          <p><strong>Esfera:</strong> {data.od_esfera ?? "-"}</p>
          <p><strong>Cilindro:</strong> {data.od_cilindro ?? "-"}</p>
          <p><strong>Eje:</strong> {data.od_eje ?? "-"}</p>
        </div>

        <div style={{ flex: 1, border: "1px solid #444", padding: 12 }}>
          <h3>Ojo Izquierdo (OI)</h3>
          <p><strong>Esfera:</strong> {data.ol_esfera ?? "-"}</p>
          <p><strong>Cilindro:</strong> {data.ol_cilindro ?? "-"}</p>
          <p><strong>Eje:</strong> {data.ol_eje ?? "-"}</p>
        </div>
      </div>

      <div style={{ border: "1px solid #444", padding: 12 }}>
        <p><strong>Adición:</strong> {data.adicion ?? "-"}</p>
        <p><strong>DP:</strong> {data.dp ?? "-"}</p>
      </div>

    </div>

    
  );
}

