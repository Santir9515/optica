// src/pages/Clientes/ClienteDetalle.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getClienteById, deleteCliente, fmtDateARFromISO } from "../../api/clientes";
import type { ClienteDetalle as ClienteDetalleType } from "../../api/clientes";

export default function ClienteDetalle() {
  const { id_cliente } = useParams<{ id_cliente: string }>();
  const nav = useNavigate();

  const [data, setData] = useState<ClienteDetalleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    if (!id_cliente) return;
    setLoading(true);
    setError(null);

    try {
      const res = await getClienteById(Number(id_cliente));
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Error consultando API");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_cliente]);

  async function onDelete() {
    if (!data) return;

    const ok = window.confirm(
      `¿Seguro que querés desactivar el cliente "${data.apellido}, ${data.nombre}"?\n\nEsto lo marcará como INACTIVO (no se borra físicamente).`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await deleteCliente(data.id_cliente);
      nav("/clientes");
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando cliente");
    } finally {
      setLoading(false);
    }
  }

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
        <p>
          <strong>DNI:</strong> {data.dni}
        </p>
        <p>
          <strong>Teléfono:</strong> {data.telefono ?? "-"}
        </p>
        <p>
          <strong>Email:</strong> {data.email ?? "-"}
        </p>
        <p>
          <strong>Dirección:</strong> {data.direccion ?? "-"}
        </p>

        <p>
          <strong>Fecha alta:</strong> {fmtDateARFromISO(data.fecha_alta)}
        </p>
        <p>
          <strong>Fecha nacimiento:</strong> {fmtDateARFromISO(data.fecha_nacimiento)}
        </p>
        <p>
          <strong>Activo:</strong> {data.activo ? "Sí" : "No"}
        </p>
        <p>
          <strong>Observaciones:</strong> {data.observaciones ?? "-"}
        </p>

        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <Link to={`/clientes/${data.id_cliente}/editar`}>Editar</Link>

          <button
            type="button"
            onClick={onDelete}
            style={{
              background: "transparent",
              border: "1px solid #a33",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
