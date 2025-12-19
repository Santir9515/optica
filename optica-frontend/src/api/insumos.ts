import { api } from "./axios";

export interface Insumo {
  id_insumo: number;
  descripcion: string;
  tipo_insumo?: string | null;

  id_proveedor?: number | null;
  codigo_proveedor?: string | null;
  codigo_interno?: string | null;

  precio_costo?: number | null;
  precio_sugerido?: number | null;

  stock_minimo?: number | null;
  stock_actual?: number | null;

  activo: boolean;
}

export type OrderDir = "asc" | "desc";

export type InsumoOrderBy =
  | "descripcion"
  | "tipo_insumo"
  | "stock_actual"
  | "stock_minimo"
  | "precio_costo"
  | "precio_sugerido"
  | "id_insumo"
  | "id_proveedor";

export interface InsumosAvanzadoParams {
  q?: string;
  activo?: boolean;
  proveedor_id?: number;
  tipo_insumo?: string;
  order_by?: InsumoOrderBy;
  order_dir?: OrderDir;
  limit?: number;
  offset?: number;
}

export interface InsumosAvanzadoResponse {
  total: number;
  limit: number;
  offset: number;
  items: Insumo[];
}

export function getInsumosAvanzado(
  params: InsumosAvanzadoParams
): Promise<InsumosAvanzadoResponse> {
  return api
    .get("/insumos/avanzado", { params })
    .then((res) => res.data);
}
