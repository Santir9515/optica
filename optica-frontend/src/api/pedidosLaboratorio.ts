import { api } from "./axios";

export type OrderDir = "asc" | "desc";

export type PedidoOrderBy =
  | "id_pedido_lab"
  | "fecha_envio"
  | "fecha_estimada_rec"
  | "fecha_recepcion"
  | "estado"
  | "nro_orden_lab"
  | "id_proveedor"
  | "id_receta";

export interface PedidoLabRow {
  id_pedido_lab: number;
  id_receta: number;
  id_proveedor: number;
  proveedor_nombre?: string | null;
  fecha_envio?: string | null;
  fecha_estimada_rec?: string | null;
  fecha_recepcion?: string | null;
  estado?: string | null;
  nro_orden_lab?: string | null;
  items: number;
}

export interface PedidosAvanzadoParams {
  q?: string;
  id_proveedor?: number;
  id_receta?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  order_by?: PedidoOrderBy;
  order_dir?: OrderDir;
  limit?: number;
  offset?: number;
}

export interface PedidosAvanzadoResponse {
  total: number;
  limit: number;
  offset: number;
  data: PedidoLabRow[];
}

// --------- DETALLE ---------

export interface PedidoDetalleInsumo {
  id_detalle: number;
  id_insumo: number;
  descripcion_insumo?: string | null;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string | null;
}

export interface PedidoDetalle {
  id_pedido_lab: number;
  id_receta: number;
  id_proveedor: number;
  fecha_envio?: string | null;
  fecha_estimada_rec?: string | null;
  fecha_recepcion?: string | null;
  estado?: string | null;
  nro_orden_lab?: string | null;
  observaciones?: string | null;
  proveedor: {
    id_proveedor: number | null;
    nombre: string | null;
  };
  receta: {
    id_receta: number | null;
    id_cliente: number | null;
  };
  insumos: PedidoDetalleInsumo[];
}

// listado paginado
export function getPedidosAvanzado(
  params: PedidosAvanzadoParams
): Promise<PedidosAvanzadoResponse> {
  return api.get("/pedidos-laboratorio/avanzado", { params }).then((res) => res.data);
}

// detalle por id
export function getPedidoById(id_pedido_lab: number): Promise<PedidoDetalle> {
  return api
    .get(`/pedidos-laboratorio/${id_pedido_lab}`)
    .then((res) => res.data);
}
