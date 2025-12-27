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
  fecha_alta?: string | null; 
  activo: boolean;
}

export interface ClienteDetalle extends Cliente {
  fecha_nacimiento?: string | null; 
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

export type ClienteUpdate = Partial<ClienteCreate>;

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

/** =======================
 *  Requests
 *  ======================= */

export function getClienteById(id_cliente: number): Promise<ClienteDetalle> {
  return api.get(`/clientes/${id_cliente}`).then((r) => r.data);
}

export function createCliente(
  payload: ClienteCreate
): Promise<{ id_cliente: number }> {
  return api.post("/clientes", payload).then((r) => r.data);
}

export function updateCliente(
  id_cliente: number,
  payload: ClienteUpdate
): Promise<any> {
  return api.patch(`/clientes/${id_cliente}`, payload).then((r) => r.data);
}


export function setClienteActivo(
  id_cliente: number,
  activo: boolean
): Promise<any> {
  return api.patch(`/clientes/${id_cliente}`, { activo }).then((r) => r.data);
}

export function getClientesAvanzado(
  params: ClientesAvanzadoParams
): Promise<ClientesAvanzadoResponse> {
  return api
    .get("/clientes/avanzado", { params: cleanParams(params) })
    .then((res) => res.data);
}

export function fmtDateARFromISO(iso?: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function deleteCliente(id_cliente: number): Promise<void> {
  return api.delete(`/clientes/${id_cliente}`).then(() => {});
}


