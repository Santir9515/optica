import { api } from "./axios";

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
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
  items: Proveedor[];
}

export function getProveedoresAvanzado(
  params: ProveedoresAvanzadoParams
): Promise<ProveedoresAvanzadoResponse> {
  return api
    .get<ProveedoresAvanzadoResponse>("/proveedores/avanzado", { params })
    .then((res) => res.data);
}
