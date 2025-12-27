import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClienteById } from "../../api/clientes";
import type { ClienteDetalle as ClienteDetalleType } from "../../api/clientes";
import { fmtDateARFromISO } from "../../api/clientes";


export default function ClienteDetalle() {
  const { id_cliente } = useParams<{ id_cliente: string }>();

  const [data, setData] = useState<ClienteDetalleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id_cliente) return;

    setLoading(true);
    setError(null);

    getClienteById(Number(id_cliente))
      .then((res) => setData(res))
      .catch((e) => setError(e?.message ?? "Error consultando API"))
      .finally(() => setLoading(false));
  }, [id_cliente]);

  if (!id_cliente) return <p>Falta el parámetro id_cliente en la URL.</p>;
  if (loading) return <p>Cargando cliente...</p>;
  if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
  if (!data) return <p>No se encontró el cliente.</p>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1>
          Cliente #{data.id_cliente} — {data.apellido}, {data.nombre}
        </h1>
        <Link to="/clientes">Volver</Link>
      </div>

      <div style={{ border: "1px solid #444", borderRadius: 4, padding: 12 }}>
        <p><strong>DNI:</strong> {data.dni}</p>
        <p><strong>Teléfono:</strong> {data.telefono ?? "-"}</p>
        <p><strong>Email:</strong> {data.email ?? "-"}</p>
        <p><strong>Dirección:</strong> {data.direccion ?? "-"}</p>

        <p><strong>Fecha alta:</strong> {fmtDateARFromISO(data.fecha_alta)}</p>
        <p><strong>Fecha nacimiento:</strong> {fmtDateARFromISO(data.fecha_nacimiento)}</p>
        <p><strong>Activo:</strong> {data.activo ? "Sí" : "No"}</p>
        <p><strong>Observaciones:</strong> {data.observaciones ?? "-"}</p>

        <div style={{ marginTop: 12 }}>
          <Link to={`/clientes/${data.id_cliente}/editar`}>Editar</Link>
        </div>
      </div>
    </div>
  );
}
