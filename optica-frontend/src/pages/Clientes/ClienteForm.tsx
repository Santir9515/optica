// src/pages/Clientes/ClienteForm.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createCliente,
  updateCliente,
  getClienteById,
  type ClienteCreate,
} from "../../api/clientes";

type FormState = ClienteCreate;

function dateInputFromISO(value?: string | null): string {
  if (!value) return "";
  // Si viene "YYYY-MM-DD" -> ok
  // Si viene "YYYY-MM-DDTHH:mm:ss" -> cortamos
  return value.slice(0, 10);
}

const emptyForm: FormState = {
  nombre: "",
  apellido: "",
  dni: 0,
  telefono: "",
  email: "",
  direccion: "",
  fecha_nacimiento: null,
  observaciones: "",
  activo: true,
};

export default function ClienteForm() {
  const { id_cliente } = useParams<{ id_cliente: string }>();
  const isEdit = useMemo(() => Boolean(id_cliente), [id_cliente]);

  const nav = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos si edita
  useEffect(() => {
    if (!isEdit) {
      setForm(emptyForm);
      return;
    }

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
          fecha_nacimiento: c.fecha_nacimiento ? c.fecha_nacimiento.slice(0, 10) : null,
          observaciones: c.observaciones ?? "",
          activo: c.activo ?? true,
        });
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? "Error cargando cliente"))
      .finally(() => setLoading(false));
  }, [isEdit, id_cliente]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones mínimas
    if (!form.nombre?.trim()) return setError("Nombre es obligatorio");
    if (!form.apellido?.trim()) return setError("Apellido es obligatorio");
    if (!form.dni || Number.isNaN(Number(form.dni))) return setError("DNI inválido");

    setLoading(true);
    try {
      const payload: ClienteCreate = {
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: Number(form.dni),
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        direccion: form.direccion?.trim() || null,
        observaciones: form.observaciones?.trim() || null,
        // IMPORTANTE: que sea "YYYY-MM-DD" o null
        fecha_nacimiento: form.fecha_nacimiento ? form.fecha_nacimiento.slice(0, 10) : null,
        activo: form.activo ?? true,
      };

      if (isEdit) {
        await updateCliente(Number(id_cliente), payload);
        nav(`/clientes/${id_cliente}`);
      } else {
        const created = await createCliente(payload);
        nav(`/clientes/${created.id_cliente}`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error guardando cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{isEdit ? `Editar cliente #${id_cliente}` : "Nuevo cliente"}</h1>
        <Link to="/clientes">Volver</Link>
      </div>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      {loading && <p>Cargando...</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Nombre
            <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Apellido
            <input value={form.apellido} onChange={(e) => set("apellido", e.target.value)} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            DNI
            <input
              type="number"
              value={form.dni ? String(form.dni) : ""}
              onChange={(e) => set("dni", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Fecha nacimiento
            <input
              type="date"
              value={dateInputFromISO(form.fecha_nacimiento)}
              onChange={(e) => set("fecha_nacimiento", e.target.value ? e.target.value : null)}
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Teléfono
            <input value={form.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Email
            <input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          Dirección
          <input value={form.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Observaciones
          <textarea
            rows={3}
            value={form.observaciones ?? ""}
            onChange={(e) => set("observaciones", e.target.value)}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={Boolean(form.activo)}
            onChange={(e) => set("activo", e.target.checked)}
          />
          Activo
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={loading}>
            {isEdit ? "Guardar cambios" : "Crear cliente"}
          </button>
          <Link to="/clientes">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
