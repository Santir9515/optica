import { api } from "./axios";

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

export function getClientesAvanzado(
  params: ClientesAvanzadoParams
): Promise<ClientesAvanzadoResponse> {
  return api
    .get("/clientes/avanzado", { params })
    .then((res) => res.data);
}
