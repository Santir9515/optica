import { api } from "./axios";

export interface CompraInsumos {
  id_compra: number;
  id_proveedor: number;
  fecha_compra: string;
  tipo_comprobante?: string | null;
  nro_comprobante?: string | null;
  observaciones?: string | null;
  monto_total: number;
  anulada: boolean;
  motivo_anulacion?: string | null;
  fecha_anulacion?: string | null;
}

export interface DetalleCompraItem {
  id_detalle: number;
  id_insumo: number;
  descripcion_insumo?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CompraDetalle {
  id_compra: number;
  id_proveedor: number;
  fecha_compra: string;
  tipo_comprobante?: string | null;
  nro_comprobante?: string | null;
  observaciones?: string | null;
  monto_total: number;
  anulada: boolean;
  motivo_anulacion?: string | null;
  fecha_anulacion?: string | null;
  detalles: DetalleCompraItem[];
}

export type OrderDir = "asc" | "desc";

export type CompraOrderBy =
  | "id_compra"
  | "fecha_compra"
  | "monto_total"
  | "id_proveedor"
  | "anulada";

export interface ComprasAvanzadoParams {
  q?: string;
  id_proveedor?: number;
  anulada?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  order_by?: CompraOrderBy;
  order_dir?: OrderDir;
  limit?: number;
  offset?: number;
}

export interface ComprasAvanzadoResponse {
  total: number;
  limit: number;
  offset: number;
  items: CompraInsumos[];
}

// LISTADO AVANZADO
export function getComprasAvanzado(params: ComprasAvanzadoParams) {
  return api.get("/compras-insumos/avanzado", { params }).then((res) => res.data);
}

// DETALLE DE UNA COMPRA
export function getCompraById(id_compra: number): Promise<CompraDetalle> {
  return api.get(`/compras-insumos/${id_compra}`).then((res) => res.data);
}
