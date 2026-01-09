import { api } from "./axios";

/** =======================
 *  Tipos base
 *  ======================= */

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dni: number;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
  fecha_alta?: string | null; // ISO "YYYY-MM-DD"
  activo: boolean;
}

export interface ClienteDetalle extends Cliente {
  fecha_nacimiento?: string | null; // ISO "YYYY-MM-DD"
}

/** =======================
 *  Payloads ABM
 *  ======================= */

export interface ClienteCreate {
  nombre: string;
  apellido: string;
  dni: number;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  observaciones?: string | null;
  activo?: boolean;
}

export interface ClienteUpdate extends Partial<ClienteCreate> {}

/** =======================
 *  Ordenamiento y filtros
 *  ======================= */

export type OrderDir = "asc" | "desc";
export type ClienteOrderBy = "dni" | "nombre" | "apellido" | "fecha_alta";

export interface ClientesAvanzadoParams {
  q?: string;
  dni?: number;
  activo?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  order_by?: ClienteOrderBy;
  order_dir?: OrderDir;
  limit?: number;
  offset?: number;
}

export interface ClientesAvanzadoResponse {
  total: number;
  limit: number;
  offset: number;
  items: Cliente[];
}

/** =======================
 *  Helpers
 *  ======================= */

function cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    out[k] = v;
  });
  return out as Partial<T>;
}

export function fmtDateARFromISO(value?: string | null): string {
  if (!value) return "-";
  // Soporta "YYYY-MM-DD" y "YYYY-MM-DDTHH:mm:ss..."
  const iso = value.split("T")[0];
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export function isoFromInputDate(value: string): string | null {
  return value?.trim() ? value : null;
}

/** =======================
 *  Requests
 *  ======================= */

export function getClienteById(id_cliente: number): Promise<ClienteDetalle> {
  return api.get(`/clientes/${id_cliente}`).then((r) => r.data);
}

export function createCliente(payload: ClienteCreate): Promise<{ id_cliente: number }> {
  return api.post("/clientes", payload).then((r) => r.data);
}

export function updateCliente(id_cliente: number, payload: ClienteUpdate): Promise<any> {
  return api.patch(`/clientes/${id_cliente}`, payload).then((r) => r.data);
}

/**
 * Activa/Desactiva (soft delete)
 */
export function setClienteActivo(id_cliente: number, activo: boolean): Promise<any> {
  return api.patch(`/clientes/${id_cliente}`, { activo }).then((r) => r.data);
}


export function deactivateCliente(id_cliente: number): Promise<any> {
  return setClienteActivo(id_cliente, false);
}

export function reactivateCliente(id_cliente: number): Promise<any> {
  return setClienteActivo(id_cliente, true);
}


export function getClientesAvanzado(params: ClientesAvanzadoParams): Promise<ClientesAvanzadoResponse> {
  return api.get("/clientes/avanzado", { params: cleanParams(params) }).then((res) => res.data);
}


export function deleteCliente(id_cliente: number): Promise<void> {
  return api.delete(`/clientes/${id_cliente}`).then(() => undefined);
}
