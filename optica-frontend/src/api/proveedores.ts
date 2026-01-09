import { api } from "./axios";

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
}

export interface ProveedorDetalle extends Proveedor {}

export interface ProveedorCreate {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

export type OrderDir = "asc" | "desc";

export type ProveedorOrderBy =
  | "id_proveedor"
  | "nombre"
  | "telefono"
  | "email"
  | "direccion"
  | "activo";

export interface ProveedoresAvanzadoParams {
  q?: string;
  activo?: boolean;
  order_by?: ProveedorOrderBy;
  order_dir?: OrderDir;
  limit?: number;
  offset?: number;
}

export interface ProveedoresAvanzadoResponse {
  total: number;
  limit: number;
  offset: number;
  items: Proveedor[];
}

export function getProveedoresAvanzado(
  params: ProveedoresAvanzadoParams
): Promise<ProveedoresAvanzadoResponse> {
  return api.get("/proveedores/avanzado", { params }).then((res) => res.data);
}

export function getProveedorById(id_proveedor: number): Promise<ProveedorDetalle> {
  return api.get(`/proveedores/${id_proveedor}`).then((r) => r.data);
}

export function createProveedor(payload: ProveedorCreate): Promise<{ id_proveedor: number }> {
  return api.post("/proveedores", payload).then((r) => r.data);
}

export function updateProveedor(id_proveedor: number, payload: ProveedorCreate): Promise<any> {
  // tu backend usa PUT para actualizar
  return api.put(`/proveedores/${id_proveedor}`, payload).then((r) => r.data);
}

export function setProveedorActivo(id_proveedor: number, activo: boolean): Promise<any> {
  return api.patch(`/proveedores/${id_proveedor}/activo`, { activo }).then((r) => r.data);
}


