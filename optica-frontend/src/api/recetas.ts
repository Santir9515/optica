import { api } from "./axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Tipos
export interface Receta {
  id_receta: number;
  id_cliente: number;
  fecha_receta: string; 
  profesional?: string | null;
  tipo_lente?: string | null;
  estado?: string | null;
  observaciones?: string | null;
}

export type OrderDir = "asc" | "desc";

export type RecetaOrderBy =
  | "id_receta"
  | "fecha_receta"
  | "estado"
  | "tipo_lente"
  | "profesional"
  | "cliente_apellido"
  | "cliente_nombre"
  | "dni";

export interface RecetasAvanzadoParams {
  q?: string;
  activo_cliente?: boolean;
  id_cliente?: number;
  dni?: number;
  estado?: string;
  tipo_lente?: string;
  profesional?: string;
  fecha_desde?: string; 
  fecha_hasta?: string; 
  order_by?: RecetaOrderBy;
  order_dir?: OrderDir;
  limit?: number;
  offset?: number;
}

export interface RecetasAvanzadoResponse {
  total: number;
  limit: number;
  offset: number;
  items: Receta[];
}

// Listado avanzado
export function getRecetasAvanzado(
  params: RecetasAvanzadoParams
): Promise<RecetasAvanzadoResponse> {
  return api
    .get("/recetas/avanzado", { params })
    .then((res) => res.data as RecetasAvanzadoResponse);
}

//export interface RecetaDetalle extends Receta {}

export interface RecetaDetalle {
  id_receta: number;
  id_cliente: number;
  fecha_receta: string; // "YYYY-MM-DD"
  estado: string;
  profesional?: string | null;
  tipo_lente?: string | null;
  observaciones?: string | null;

  od_esfera?: number | null;
  od_cilindro?: number | null;
  od_eje?: number | null;

  ol_esfera?: number | null;
  ol_cilindro?: number | null;
  ol_eje?: number | null;

  adicion?: number | null;
  dp?: number | null;

  cliente?: {
    id_cliente?: number | null;
    nombre?: string | null;
    apellido?: string | null;
    dni?: number | null;
    telefono?: string | null;
    email?: string | null;
  } | null;
}



export function getRecetaById(id_receta: number): Promise<RecetaDetalle> {
  return api
    .get(`/recetas/${id_receta}`)
    .then((res) => res.data as RecetaDetalle);
}


