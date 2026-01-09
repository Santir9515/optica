import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createProveedor,
  getProveedorById,
  updateProveedor,
  type ProveedorCreate,
} from "../../api/proveedores";

type FormState = ProveedorCreate;

const emptyForm: FormState = {
  nombre: "",
  telefono: "",
  email: "",
  direccion: "",
  activo: true,
};

export default function ProveedorForm() {
  const { id_proveedor } = useParams<{ id_proveedor: string }>();
  const isEdit = useMemo(() => Boolean(id_proveedor), [id_proveedor]);

  const nav = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos si edita
  useEffect(() => {
    if (!isEdit) return;

    setLoading(true);
    setError(null);

    getProveedorById(Number(id_proveedor))
      .then((p) => {
        setForm({
          nombre: p.nombre ?? "",
          telefono: p.telefono ?? "",
          email: p.email ?? "",
          direccion: p.direccion ?? "",
          activo: p.activo ?? true,
        });
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? "Error cargando proveedor"))
      .finally(() => setLoading(false));
  }, [isEdit, id_proveedor]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nombre?.trim()) return setError("Nombre es obligatorio");

    setLoading(true);
    try {
      const payload: ProveedorCreate = {
        nombre: form.nombre.trim(),
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        direccion: form.direccion?.trim() || null,
        activo: form.activo ?? true,
      };

      if (isEdit) {
        await updateProveedor(Number(id_proveedor), payload); // usa PUT en el api
        nav(`/proveedores/${id_proveedor}`);
      } else {
        const created = await createProveedor(payload);
        nav(`/proveedores/${created.id_proveedor}`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error guardando proveedor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{isEdit ? `Editar proveedor #${id_proveedor}` : "Nuevo proveedor"}</h1>
        <Link to="/proveedores">Volver</Link>
      </div>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      {loading && <p>Cargando...</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Nombre
          <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
        </label>

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
            {isEdit ? "Guardar cambios" : "Crear proveedor"}
          </button>
          <Link to="/proveedores">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
