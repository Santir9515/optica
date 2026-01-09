import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProveedorById } from "../../api/proveedores";
import type { ProveedorDetalle as ProveedorDetalleType } from "../../api/proveedores";

export default function ProveedorDetalle() {
  const { id_proveedor } = useParams<{ id_proveedor: string }>();

  const id = useMemo(() => {
    const n = Number(id_proveedor);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [id_proveedor]);

  const [data, setData] = useState<ProveedorDetalleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    getProveedorById(id)
      .then((res) => setData(res))
      .catch((e: any) => {
        const msg =
          e?.response?.data?.detail ??
          e?.message ??
          "Error consultando API";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id_proveedor) return <p>Falta el parámetro id_proveedor en la URL.</p>;
  if (!id) return <p>El parámetro id_proveedor es inválido.</p>;
  if (loading) return <p>Cargando proveedor...</p>;
  if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
  if (!data) return <p>No se encontró el proveedor.</p>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1>
          Proveedor #{data.id_proveedor} — {data.nombre}
        </h1>
        <Link to="/proveedores">Volver</Link>
      </div>

      <div style={{ border: "1px solid #444", borderRadius: 4, padding: 12 }}>
        <p><strong>Teléfono:</strong> {data.telefono ?? "-"}</p>
        <p><strong>Email:</strong> {data.email ?? "-"}</p>
        <p><strong>Dirección:</strong> {data.direccion ?? "-"}</p>
        <p><strong>Activo:</strong> {data.activo ? "Sí" : "No"}</p>

        <div style={{ marginTop: 12 }}>
          <Link to={`/proveedores/${data.id_proveedor}/editar`}>Editar</Link>
        </div>
      </div>
    </div>
  );
}
