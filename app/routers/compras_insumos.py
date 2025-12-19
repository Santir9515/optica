from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import CompraInsumos, DetalleCompraInsumos, Insumo, Proveedor
from app.dependencies.optica import get_optica_id

router = APIRouter(prefix="/compras-insumos", tags=["Compras de insumos"])


# -------------------- Schemas --------------------

class ItemCompra(BaseModel):
    id_insumo: int
    cantidad: int = Field(gt=0)
    precio_unitario: float = Field(gt=0)


class CompraInsumosCreate(BaseModel):
    id_proveedor: int
    fecha_compra: date
    tipo_comprobante: Optional[str] = None
    nro_comprobante: Optional[str] = None
    observaciones: Optional[str] = None
    items: List[ItemCompra]


class CompraInsumosPatchCabecera(BaseModel):
    fecha_compra: Optional[date] = None
    tipo_comprobante: Optional[str] = None
    nro_comprobante: Optional[str] = None
    observaciones: Optional[str] = None


class CompraInsumosAnular(BaseModel):
    motivo: Optional[str] = None


# -------------------- Helpers --------------------

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
        raise HTTPException(status_code=400, detail=f"Insumo id {id_insumo} no existe, inactivo o fuera de esta óptica")
    return insumo


def _get_compra_optica(db: Session, optica_id: str, id_compra: int) -> CompraInsumos:
    compra = (
        db.query(CompraInsumos)
        .filter(CompraInsumos.id_compra == id_compra, CompraInsumos.optica_id == optica_id)
        .first()
    )
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada en esta óptica")
    return compra


# -------------------- Listado avanzado --------------------

@router.get("/avanzado")
def listar_compras_insumos_avanzado(
    optica_id: str = Depends(get_optica_id),
    q: Optional[str] = Query(default=None, description="Busca en tipo/nro/observaciones"),
    id_proveedor: Optional[int] = Query(default=None),
    anulada: Optional[bool] = Query(default=None, description="Filtra anuladas (true/false)"),
    fecha_desde: Optional[date] = Query(default=None),
    fecha_hasta: Optional[date] = Query(default=None),
    order_by: str = Query(default="fecha_compra", description="fecha_compra|monto_total|id_compra"),
    order_dir: str = Query(default="desc", description="asc|desc"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(CompraInsumos).filter(CompraInsumos.optica_id == optica_id)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                CompraInsumos.tipo_comprobante.ilike(like),
                CompraInsumos.nro_comprobante.ilike(like),
                CompraInsumos.observaciones.ilike(like),
            )
        )

    if id_proveedor is not None:
        _get_proveedor_optica(db, optica_id, id_proveedor)
        query = query.filter(CompraInsumos.id_proveedor == id_proveedor)

    if anulada is not None:
        query = query.filter(CompraInsumos.anulada == anulada)

    if fecha_desde is not None:
        query = query.filter(CompraInsumos.fecha_compra >= fecha_desde)

    if fecha_hasta is not None:
        query = query.filter(CompraInsumos.fecha_compra <= fecha_hasta)

    allowed = {
        "fecha_compra": CompraInsumos.fecha_compra,
        "monto_total": CompraInsumos.monto_total,
        "id_compra": CompraInsumos.id_compra,
    }
    col = allowed.get(order_by)
    if not col:
        raise HTTPException(status_code=400, detail=f"order_by inválido. Opciones: {list(allowed.keys())}")

    direction = asc if order_dir.lower() == "asc" else desc
    query = query.order_by(direction(col), desc(CompraInsumos.id_compra))

    total = query.count()
    rows = query.offset(offset).limit(limit).all()

    items = []
    for c in rows:
        items.append(
            {
                "id_compra": c.id_compra,
                "id_proveedor": c.id_proveedor,
                "fecha_compra": c.fecha_compra,
                "tipo_comprobante": c.tipo_comprobante,
                "nro_comprobante": c.nro_comprobante,
                "monto_total": c.monto_total,
                "observaciones": c.observaciones,
                "anulada": c.anulada,
                "motivo_anulacion": c.motivo_anulacion,
                "fecha_anulacion": c.fecha_anulacion,
            }
        )

    return {"total": total, "limit": limit, "offset": offset, "items": items}


# -------------------- GET básicos --------------------

@router.get("/")
def listar_compras(
    optica_id: str = Depends(get_optica_id),
    incluir_anuladas: bool = Query(default=True, description="Si false, oculta anuladas"),
    db: Session = Depends(get_db),
):
    query = db.query(CompraInsumos).filter(CompraInsumos.optica_id == optica_id)
    if not incluir_anuladas:
        query = query.filter(CompraInsumos.anulada == False)

    return query.order_by(CompraInsumos.fecha_compra.desc(), CompraInsumos.id_compra.desc()).all()


@router.get("/{id_compra}")
def obtener_compra(
    id_compra: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    compra = (
        db.query(CompraInsumos)
        .options(joinedload(CompraInsumos.detalles).joinedload(DetalleCompraInsumos.insumo))
        .filter(CompraInsumos.id_compra == id_compra, CompraInsumos.optica_id == optica_id)
        .first()
    )
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    detalles = []
    for det in compra.detalles:
        detalles.append(
            {
                "id_detalle": det.id_detalle_compra,
                "id_insumo": det.id_insumo,
                "descripcion_insumo": det.insumo.descripcion if det.insumo else None,
                "cantidad": det.cantidad,
                "precio_unitario": det.precio_unitario,
                "subtotal": det.subtotal,
            }
        )

    return {
        "id_compra": compra.id_compra,
        "id_proveedor": compra.id_proveedor,
        "fecha_compra": compra.fecha_compra,
        "tipo_comprobante": compra.tipo_comprobante,
        "nro_comprobante": compra.nro_comprobante,
        "observaciones": compra.observaciones,
        "monto_total": compra.monto_total,
        "anulada": compra.anulada,
        "motivo_anulacion": compra.motivo_anulacion,
        "fecha_anulacion": compra.fecha_anulacion,
        "detalles": detalles,
    }


# -------------------- POST crear --------------------

@router.post("/", status_code=201)
def crear_compra(
    compra_in: CompraInsumosCreate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    _get_proveedor_optica(db, optica_id, compra_in.id_proveedor)

    if not compra_in.items:
        raise HTTPException(status_code=400, detail="La compra debe tener al menos un ítem")

    monto_total = 0.0
    detalles_objs: List[DetalleCompraInsumos] = []

    for item in compra_in.items:
        _get_insumo_optica(db, optica_id, item.id_insumo)

        subtotal = item.cantidad * item.precio_unitario
        monto_total += subtotal

        detalles_objs.append(
            DetalleCompraInsumos(
                id_insumo=item.id_insumo,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=subtotal,
            )
        )

    compra = CompraInsumos(
        optica_id=optica_id,
        id_proveedor=compra_in.id_proveedor,
        fecha_compra=compra_in.fecha_compra,
        tipo_comprobante=compra_in.tipo_comprobante,
        nro_comprobante=compra_in.nro_comprobante,
        observaciones=compra_in.observaciones,
        monto_total=monto_total,
        anulada=False,
        detalles=detalles_objs,
    )

    db.add(compra)

    # actualizar stock
    for item in compra_in.items:
        insumo = (
            db.query(Insumo)
            .filter(Insumo.id_insumo == item.id_insumo, Insumo.optica_id == optica_id)
            .first()
        )
        if not insumo:
            raise HTTPException(status_code=400, detail=f"Insumo id {item.id_insumo} no pertenece a esta óptica")

        if insumo.stock_actual is None:
            insumo.stock_actual = 0
        insumo.stock_actual += item.cantidad

        if insumo.precio_costo is None:
            insumo.precio_costo = item.precio_unitario

    db.commit()
    db.refresh(compra)

    return {"id_compra": compra.id_compra, "monto_total": compra.monto_total, "cantidad_items": len(compra.detalles)}


# -------------------- PATCH cabecera --------------------

@router.patch("/{id_compra}")
def patch_compra_cabecera(
    id_compra: int,
    data: CompraInsumosPatchCabecera,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    compra = _get_compra_optica(db, optica_id, id_compra)

    if compra.anulada:
        raise HTTPException(status_code=400, detail="No se puede modificar una compra anulada")

    patch = data.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")

    for k, v in patch.items():
        setattr(compra, k, v)

    db.commit()
    db.refresh(compra)

    return {
        "id_compra": compra.id_compra,
        "fecha_compra": compra.fecha_compra,
        "tipo_comprobante": compra.tipo_comprobante,
        "nro_comprobante": compra.nro_comprobante,
        "observaciones": compra.observaciones,
    }


# -------------------- PATCH anular --------------------

@router.patch("/{id_compra}/anular")
def anular_compra(
    id_compra: int,
    payload: CompraInsumosAnular,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    compra = (
        db.query(CompraInsumos)
        .options(joinedload(CompraInsumos.detalles))
        .filter(CompraInsumos.id_compra == id_compra, CompraInsumos.optica_id == optica_id)
        .first()
    )
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    if compra.anulada:
        raise HTTPException(status_code=400, detail="La compra ya está anulada")

    if not compra.detalles:
        raise HTTPException(status_code=400, detail="La compra no tiene detalles para anular")

    # revertir stock (solo insumos de la misma óptica)
    for det in compra.detalles:
        insumo = (
            db.query(Insumo)
            .filter(Insumo.id_insumo == det.id_insumo, Insumo.optica_id == optica_id)
            .first()
        )
        if not insumo:
            raise HTTPException(
                status_code=400,
                detail=f"No existe insumo id {det.id_insumo} en esta óptica para revertir stock",
            )

        if insumo.stock_actual is None:
            insumo.stock_actual = 0

        nuevo_stock = insumo.stock_actual - det.cantidad
        if nuevo_stock < 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede anular: el insumo id {insumo.id_insumo} quedaría con stock negativo",
            )

        insumo.stock_actual = nuevo_stock

    compra.anulada = True
    compra.motivo_anulacion = payload.motivo
    compra.fecha_anulacion = datetime.utcnow()

    db.commit()

    return {"detail": "Compra anulada correctamente", "id_compra": compra.id_compra}
