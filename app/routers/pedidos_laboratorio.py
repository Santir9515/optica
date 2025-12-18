from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, asc, desc
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    PedidoLaboratorio,
    DetallePedidoLaboratorioInsumo,
    Receta,
    Proveedor,
    Insumo,
)
from app.dependencies.optica import get_optica_id

router = APIRouter(prefix="/pedidos-laboratorio", tags=["Pedidos al laboratorio"])


# ----------------- Schemas (Request) -----------------

class ItemPedidoLab(BaseModel):
    id_insumo: int
    cantidad: int = Field(gt=0)
    precio_unitario: float = Field(gt=0)
    observaciones: Optional[str] = None


class PedidoLaboratorioCreate(BaseModel):
    id_receta: int
    id_proveedor: int
    fecha_envio: Optional[date] = None
    fecha_estimada_rec: Optional[date] = None
    fecha_recepcion: Optional[date] = None
    estado: Optional[str] = "ENVIADO"
    nro_orden_lab: Optional[str] = None
    observaciones: Optional[str] = None
    items: List[ItemPedidoLab]


class PedidoPatch(BaseModel):
    estado: Optional[str] = None
    nro_orden_lab: Optional[str] = None
    fecha_estimada_rec: Optional[date] = None
    observaciones: Optional[str] = None


class PedidoEstadoUpdate(BaseModel):
    estado: str = Field(..., description="Nuevo estado del pedido")


class PedidoRecepcionUpdate(BaseModel):
    fecha_recepcion: Optional[date] = None  # si no viene, usamos hoy
    estado: Optional[str] = None            # default: RECIBIDO
    nro_orden_lab: Optional[str] = None
    observaciones: Optional[str] = None
    descontar_stock: bool = True


# ----------------- Helpers -----------------

def _estado_normalizado(s: Optional[str]) -> Optional[str]:
    return s.strip().upper() if isinstance(s, str) else s


def _validar_estado(estado: str) -> str:
    estados_validos = {"PENDIENTE", "ENVIADO", "EN_PROCESO", "RECIBIDO", "CANCELADO"}
    est = _estado_normalizado(estado)
    if est not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Permitidos: {', '.join(sorted(estados_validos))}",
        )
    return est


def _get_receta_optica(db: Session, optica_id: str, id_receta: int) -> Receta:
    receta = (
        db.query(Receta)
        .filter(Receta.id_receta == id_receta, Receta.optica_id == optica_id)
        .first()
    )
    if not receta:
        raise HTTPException(status_code=400, detail="La receta no existe en esta óptica")
    return receta


def _get_proveedor_optica(db: Session, optica_id: str, id_proveedor: int) -> Proveedor:
    proveedor = (
        db.query(Proveedor)
        .filter(
            Proveedor.id_proveedor == id_proveedor,
            Proveedor.optica_id == optica_id,
            Proveedor.activo == True,
        )
        .first()
    )
    if not proveedor:
        raise HTTPException(status_code=400, detail="Proveedor no encontrado, inactivo o fuera de esta óptica")
    return proveedor


def _get_insumo_optica(db: Session, optica_id: str, id_insumo: int) -> Insumo:
    insumo = (
        db.query(Insumo)
        .filter(
            Insumo.id_insumo == id_insumo,
            Insumo.optica_id == optica_id,
            Insumo.activo == True,
        )
        .first()
    )
    if not insumo:
        raise HTTPException(status_code=400, detail=f"Insumo con id {id_insumo} no existe, inactivo o fuera de esta óptica")
    return insumo


def _get_pedido_optica(db: Session, optica_id: str, id_pedido_lab: int) -> PedidoLaboratorio:
    pedido = (
        db.query(PedidoLaboratorio)
        .filter(PedidoLaboratorio.id_pedido_lab == id_pedido_lab, PedidoLaboratorio.optica_id == optica_id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado en esta óptica")
    return pedido


# ----------------- Endpoints -----------------

@router.post("/", status_code=201)
def crear_pedido(
    pedido_in: PedidoLaboratorioCreate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    _get_receta_optica(db, optica_id, pedido_in.id_receta)
    _get_proveedor_optica(db, optica_id, pedido_in.id_proveedor)

    if not pedido_in.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un ítem")

    detalles_objs: List[DetallePedidoLaboratorioInsumo] = []

    for item in pedido_in.items:
        _get_insumo_optica(db, optica_id, item.id_insumo)

        detalles_objs.append(
            DetallePedidoLaboratorioInsumo(
                id_insumo=item.id_insumo,
                cantidad=item.cantidad,
                observaciones=item.observaciones,
                precio_unitario=item.precio_unitario,
            )
        )

    pedido = PedidoLaboratorio(
        optica_id=optica_id,
        id_receta=pedido_in.id_receta,
        id_proveedor=pedido_in.id_proveedor,
        fecha_envio=pedido_in.fecha_envio,
        fecha_estimada_rec=pedido_in.fecha_estimada_rec,
        fecha_recepcion=pedido_in.fecha_recepcion,
        estado=_estado_normalizado(pedido_in.estado) or "ENVIADO",
        nro_orden_lab=pedido_in.nro_orden_lab,
        observaciones=pedido_in.observaciones,
        detalles_insumo=detalles_objs,
    )

    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    return {
        "id_pedido_lab": pedido.id_pedido_lab,
        "id_receta": pedido.id_receta,
        "id_proveedor": pedido.id_proveedor,
        "estado": pedido.estado,
        "cantidad_items": len(pedido.detalles_insumo),
    }


@router.get("/avanzado")
def listar_pedidos_avanzado(
    optica_id: str = Depends(get_optica_id),
    q: Optional[str] = Query(default=None, description="Busca en estado / nro_orden_lab / observaciones"),
    id_proveedor: Optional[int] = None,
    id_receta: Optional[int] = None,
    estado: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    order_by: str = Query(default="fecha_envio"),
    order_dir: str = Query(default="desc"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    order_map = {
        "id_pedido_lab": PedidoLaboratorio.id_pedido_lab,
        "fecha_envio": PedidoLaboratorio.fecha_envio,
        "fecha_estimada_rec": PedidoLaboratorio.fecha_estimada_rec,
        "fecha_recepcion": PedidoLaboratorio.fecha_recepcion,
        "estado": PedidoLaboratorio.estado,
        "nro_orden_lab": PedidoLaboratorio.nro_orden_lab,
        "id_proveedor": PedidoLaboratorio.id_proveedor,
        "id_receta": PedidoLaboratorio.id_receta,
    }

    col = order_map.get(order_by)
    if not col:
        raise HTTPException(
            status_code=400,
            detail=f"order_by inválido. Opciones: {', '.join(order_map.keys())}",
        )

    direction = asc if order_dir.lower() == "asc" else desc

    query = (
        db.query(PedidoLaboratorio)
        .filter(PedidoLaboratorio.optica_id == optica_id)
        .options(
            joinedload(PedidoLaboratorio.proveedor),
            joinedload(PedidoLaboratorio.receta),
            joinedload(PedidoLaboratorio.detalles_insumo).joinedload(DetallePedidoLaboratorioInsumo.insumo),
        )
    )

    filtros = []

    if id_proveedor is not None:
        _get_proveedor_optica(db, optica_id, id_proveedor)
        filtros.append(PedidoLaboratorio.id_proveedor == id_proveedor)

    if id_receta is not None:
        _get_receta_optica(db, optica_id, id_receta)
        filtros.append(PedidoLaboratorio.id_receta == id_receta)

    if estado:
        filtros.append(PedidoLaboratorio.estado.ilike(f"%{estado.strip()}%"))

    if fecha_desde:
        filtros.append(PedidoLaboratorio.fecha_envio >= fecha_desde)

    if fecha_hasta:
        filtros.append(PedidoLaboratorio.fecha_envio <= fecha_hasta)

    if q:
        q_like = f"%{q.strip()}%"
        filtros.append(
            or_(
                PedidoLaboratorio.estado.ilike(q_like),
                PedidoLaboratorio.nro_orden_lab.ilike(q_like),
                PedidoLaboratorio.observaciones.ilike(q_like),
            )
        )

    if filtros:
        query = query.filter(and_(*filtros))

    total = query.count()

    pedidos = (
        query.order_by(direction(col), desc(PedidoLaboratorio.id_pedido_lab))
        .offset(offset)
        .limit(limit)
        .all()
    )

    data = []
    for p in pedidos:
        data.append(
            {
                "id_pedido_lab": p.id_pedido_lab,
                "id_receta": p.id_receta,
                "id_proveedor": p.id_proveedor,
                "proveedor_nombre": p.proveedor.nombre if p.proveedor else None,
                "fecha_envio": p.fecha_envio,
                "fecha_estimada_rec": p.fecha_estimada_rec,
                "fecha_recepcion": p.fecha_recepcion,
                "estado": p.estado,
                "nro_orden_lab": p.nro_orden_lab,
                "items": len(p.detalles_insumo) if p.detalles_insumo else 0,
            }
        )

    return {"total": total, "limit": limit, "offset": offset, "data": data}


@router.patch("/{id_pedido_lab}")
def patch_pedido(
    id_pedido_lab: int,
    data: PedidoPatch,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    pedido = _get_pedido_optica(db, optica_id, id_pedido_lab)

    patch = data.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=400, detail="No se enviaron campos")

    if "estado" in patch and patch["estado"] is not None:
        if pedido.estado == "RECIBIDO" and _estado_normalizado(patch["estado"]) != "RECIBIDO":
            raise HTTPException(status_code=400, detail="No se puede modificar el estado de un pedido ya recibido")
        patch["estado"] = _validar_estado(patch["estado"])

    for k, v in patch.items():
        setattr(pedido, k, v)

    db.commit()
    db.refresh(pedido)
    return {"id_pedido_lab": pedido.id_pedido_lab}


@router.patch("/{id_pedido_lab}/estado")
def actualizar_estado_pedido(
    id_pedido_lab: int,
    data: PedidoEstadoUpdate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    pedido = _get_pedido_optica(db, optica_id, id_pedido_lab)

    nuevo_estado = _validar_estado(data.estado)

    if pedido.estado == "RECIBIDO" and nuevo_estado != "RECIBIDO":
        raise HTTPException(status_code=400, detail="No se puede cambiar el estado de un pedido ya recibido")

    pedido.estado = nuevo_estado
    db.commit()
    db.refresh(pedido)

    return {"id_pedido_lab": pedido.id_pedido_lab, "estado": pedido.estado}


@router.patch("/{id_pedido_lab}/recepcion")
def recepcionar_pedido(
    id_pedido_lab: int,
    data: PedidoRecepcionUpdate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    pedido = (
        db.query(PedidoLaboratorio)
        .options(
            joinedload(PedidoLaboratorio.detalles_insumo).joinedload(DetallePedidoLaboratorioInsumo.insumo)
        )
        .filter(PedidoLaboratorio.id_pedido_lab == id_pedido_lab, PedidoLaboratorio.optica_id == optica_id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.fecha_recepcion:
        raise HTTPException(status_code=400, detail="Pedido ya recibido")

    pedido.fecha_recepcion = data.fecha_recepcion or date.today()
    pedido.estado = _estado_normalizado(data.estado) or "RECIBIDO"

    if data.nro_orden_lab is not None:
        pedido.nro_orden_lab = data.nro_orden_lab

    if data.observaciones is not None:
        pedido.observaciones = data.observaciones

    if data.descontar_stock:
        for det in pedido.detalles_insumo:
            insumo = det.insumo
            if not insumo:
                raise HTTPException(status_code=400, detail=f"Detalle con insumo inexistente (id_insumo={det.id_insumo}).")

            # seguridad tenant: el insumo debe pertenecer a la óptica
            if getattr(insumo, "optica_id", None) != optica_id:
                raise HTTPException(status_code=400, detail=f"Insumo id {insumo.id_insumo} no pertenece a esta óptica")

            if insumo.stock_actual is None:
                insumo.stock_actual = 0

            if insumo.stock_actual < det.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuficiente para insumo id={insumo.id_insumo} "
                        f"({insumo.descripcion}). Stock={insumo.stock_actual}, requiere={det.cantidad}"
                    ),
                )

            insumo.stock_actual -= det.cantidad

    db.commit()
    db.refresh(pedido)

    return {
        "id_pedido_lab": pedido.id_pedido_lab,
        "fecha_recepcion": pedido.fecha_recepcion,
        "estado": pedido.estado,
        "descontar_stock": data.descontar_stock,
        "mensaje": "Pedido recepcionado correctamente",
    }


@router.get("/")
def listar_pedidos(
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    pedidos = (
        db.query(PedidoLaboratorio)
        .filter(PedidoLaboratorio.optica_id == optica_id)
        .options(
            joinedload(PedidoLaboratorio.proveedor),
            joinedload(PedidoLaboratorio.receta),
            joinedload(PedidoLaboratorio.detalles_insumo).joinedload(DetallePedidoLaboratorioInsumo.insumo),
        )
        .order_by(PedidoLaboratorio.id_pedido_lab.desc())
        .all()
    )

    items = []
    for p in pedidos:
        items.append(
            {
                "id_pedido_lab": p.id_pedido_lab,
                "id_receta": p.id_receta,
                "id_proveedor": p.id_proveedor,
                "fecha_envio": p.fecha_envio,
                "fecha_estimada_rec": p.fecha_estimada_rec,
                "fecha_recepcion": p.fecha_recepcion,
                "estado": p.estado,
                "nro_orden_lab": p.nro_orden_lab,
                "observaciones": p.observaciones,
                "proveedor_nombre": p.proveedor.nombre if p.proveedor else None,
                "cantidad_insumos": len(p.detalles_insumo),
            }
        )
    return items


@router.get("/{id_pedido_lab}")
def obtener_pedido(
    id_pedido_lab: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    pedido = (
        db.query(PedidoLaboratorio)
        .options(
            joinedload(PedidoLaboratorio.proveedor),
            joinedload(PedidoLaboratorio.receta),
            joinedload(PedidoLaboratorio.detalles_insumo).joinedload(DetallePedidoLaboratorioInsumo.insumo),
        )
        .filter(PedidoLaboratorio.id_pedido_lab == id_pedido_lab, PedidoLaboratorio.optica_id == optica_id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    detalles = []
    for d in pedido.detalles_insumo:
        detalles.append(
            {
                "id_detalle": d.id_detalle_pedido_lab_insumo,
                "id_insumo": d.id_insumo,
                "descripcion_insumo": d.insumo.descripcion if d.insumo else None,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_unitario,
                "observaciones": d.observaciones,
            }
        )

    return {
        "id_pedido_lab": pedido.id_pedido_lab,
        "id_receta": pedido.id_receta,
        "id_proveedor": pedido.id_proveedor,
        "fecha_envio": pedido.fecha_envio,
        "fecha_estimada_rec": pedido.fecha_estimada_rec,
        "fecha_recepcion": pedido.fecha_recepcion,
        "estado": pedido.estado,
        "nro_orden_lab": pedido.nro_orden_lab,
        "observaciones": pedido.observaciones,
        "proveedor": {
            "id_proveedor": pedido.proveedor.id_proveedor if pedido.proveedor else None,
            "nombre": pedido.proveedor.nombre if pedido.proveedor else None,
        },
        "receta": {
            "id_receta": pedido.receta.id_receta if pedido.receta else None,
            "id_cliente": pedido.receta.id_cliente if pedido.receta else None,
        },
        "insumos": detalles,
    }
