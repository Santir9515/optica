import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createCliente, getClienteById, updateCliente, type ClienteCreate } from "../../api/clientes";

type Props = { mode: "create" | "edit" };

const empty: ClienteCreate = {
  nombre: "",
  apellido: "",
  dni: 0,
  telefono: "",
  email: "",
  direccion: "",
  fecha_nacimiento: "",
  observaciones: "",
  activo: true,
};

export default function ClienteForm({ mode }: Props) {
  const nav = useNavigate();
  const { id_cliente } = useParams<{ id_cliente: string }>();
  const isEdit = mode === "edit";

  const [form, setForm] = useState<ClienteCreate>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    if (!id_cliente) return;

    setLoading(true);
    setError(null);

    getClienteById(Number(id_cliente))
      .then((c) => {
        setForm({
          nombre: c.nombre ?? "",
          apellido: c.apellido ?? "",
          dni: c.dni ?? 0,
          telefono: c.telefono ?? "",
          email: c.email ?? "",
          direccion: c.direccion ?? "",
          fecha_nacimiento: c.fecha_nacimiento ?? "",
          observaciones: c.observaciones ?? "",
          activo: c.activo ?? true,
        });
      })
      .catch((e) => setError(e?.message ?? "Error cargando cliente"))
      .finally(() => setLoading(false));
  }, [isEdit, id_cliente]);

  function set<K extends keyof ClienteCreate>(key: K, value: ClienteCreate[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!form.nombre.trim() || !form.apellido.trim()) {
        throw new Error("Nombre y apellido son obligatorios");
      }
      if (!form.dni || form.dni <= 0) {
        throw new Error("DNI inválido");
      }

      if (isEdit) {
        await updateCliente(Number(id_cliente), {
          ...form,
          telefono: form.telefono || null,
          email: form.email || null,
          direccion: form.direccion || null,
          fecha_nacimiento: form.fecha_nacimiento || null,
          observaciones: form.observaciones || null,
        });
        nav(`/clientes/${id_cliente}`);
      } else {
        const res = await createCliente({
          ...form,
          telefono: form.telefono || null,
          email: form.email || null,
          direccion: form.direccion || null,
          fecha_nacimiento: form.fecha_nacimiento || null,
          observaciones: form.observaciones || null,
        });
        nav(`/clientes/${res.id_cliente}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ padding: 16 }}>Cargando...</p>;

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h1>{isEdit ? "Editar cliente" : "Nuevo cliente"}</h1>
        <Link to="/clientes">Volver</Link>
      </div>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Nombre
            <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Apellido
            <input value={form.apellido} onChange={(e) => set("apellido", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            DNI
            <input
              type="number"
              value={form.dni}
              onChange={(e) => set("dni", Number(e.target.value))}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            Fecha nacimiento
            <input
              type="date"
              value={form.fecha_nacimiento ?? ""}
              onChange={(e) => set("fecha_nacimiento", e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Teléfono
            <input value={form.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Email
            <input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>
        </div>

        <label>
          Dirección
          <input value={form.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </label>

        <label>
          Observaciones
          <textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.activo ?? true}
            onChange={(e) => set("activo", e.target.checked)}
          />
          Activo
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          {isEdit && id_cliente && (
            <Link to={`/clientes/${id_cliente}`}>Cancelar</Link>
          )}
        </div>
      </form>
    </div>
  );
}
