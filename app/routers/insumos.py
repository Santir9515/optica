from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import or_, asc, desc

from app.database import get_db
from app.models import Insumo, Proveedor
from app.schemas.insumo import InsumoCreate, InsumoUpdate, InsumoOut
from app.dependencies.optica import get_optica_id

router = APIRouter(prefix="/insumos", tags=["Insumos"])


def _get_proveedor_optica(db: Session, optica_id: str, id_proveedor: int) -> Proveedor:
    proveedor = (
        db.query(Proveedor)
        .filter(Proveedor.id_proveedor == id_proveedor, Proveedor.optica_id == optica_id)
        .first()
    )
    if not proveedor:
        raise HTTPException(status_code=400, detail="El proveedor indicado no existe en esta óptica.")
    return proveedor


def _get_insumo_optica(db: Session, optica_id: str, id_insumo: int) -> Insumo:
    insumo = (
        db.query(Insumo)
        .filter(Insumo.id_insumo == id_insumo, Insumo.optica_id == optica_id)
        .first()
    )
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado en esta óptica.")
    return insumo


@router.get("/avanzado")
def listar_insumos_avanzado(
    optica_id: str = Depends(get_optica_id),
    q: Optional[str] = Query(default=None, description="Búsqueda por descripción/códigos/tipo"),
    activo: Optional[bool] = Query(default=True, description="Filtra por activo"),
    proveedor_id: Optional[int] = Query(default=None, description="Filtra por id_proveedor"),
    tipo_insumo: Optional[str] = Query(default=None, description="Filtra por tipo_insumo"),
    order_by: str = Query(default="descripcion", description="Campo de orden"),
    order_dir: str = Query(default="asc", description="asc | desc"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Insumo).filter(Insumo.optica_id == optica_id)

    if activo is not None:
        query = query.filter(Insumo.activo == activo)

    if proveedor_id is not None:
        # valida proveedor en esta óptica
        _get_proveedor_optica(db, optica_id, proveedor_id)
        query = query.filter(Insumo.id_proveedor == proveedor_id)

    if tipo_insumo:
        query = query.filter(Insumo.tipo_insumo.ilike(f"%{tipo_insumo.strip()}%"))

    if q:
        qv = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Insumo.descripcion.ilike(qv),
                Insumo.tipo_insumo.ilike(qv),
                Insumo.codigo_proveedor.ilike(qv),
                Insumo.codigo_interno.ilike(qv),
            )
        )

    allowed_order = {
        "descripcion": Insumo.descripcion,
        "tipo_insumo": Insumo.tipo_insumo,
        "stock_actual": Insumo.stock_actual,
        "stock_minimo": Insumo.stock_minimo,
        "precio_costo": Insumo.precio_costo,
        "precio_sugerido": Insumo.precio_sugerido,
        "id_insumo": Insumo.id_insumo,
        "id_proveedor": Insumo.id_proveedor,
    }

    col = allowed_order.get(order_by)
    if not col:
        raise HTTPException(
            status_code=400,
            detail=f"order_by inválido. Permitidos: {list(allowed_order.keys())}",
        )

    direction = asc if order_dir.lower() == "asc" else desc
    query = query.order_by(direction(col), desc(Insumo.id_insumo))

    total = query.count()
    rows = query.offset(offset).limit(limit).all()

    items = [
        {
            "id_insumo": i.id_insumo,
            "descripcion": i.descripcion,
            "tipo_insumo": i.tipo_insumo,
            "id_proveedor": i.id_proveedor,
            "codigo_proveedor": i.codigo_proveedor,
            "codigo_interno": i.codigo_interno,
            "precio_costo": i.precio_costo,
            "precio_sugerido": i.precio_sugerido,
            "stock_minimo": i.stock_minimo,
            "stock_actual": i.stock_actual,
            "activo": i.activo,
        }
        for i in rows
    ]

    return {"total": total, "limit": limit, "offset": offset, "items": items}


@router.post("/", response_model=InsumoOut, status_code=status.HTTP_201_CREATED)
def crear_insumo(
    data: InsumoCreate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    if data.id_proveedor is not None:
        _get_proveedor_optica(db, optica_id, data.id_proveedor)

    payload = data.model_dump()
    payload["optica_id"] = optica_id  # <- clave multi-óptica

    nuevo = Insumo(**payload)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[InsumoOut])
def listar_insumos(
    optica_id: str = Depends(get_optica_id),
    id_proveedor: Optional[int] = Query(default=None),
    activo: Optional[bool] = Query(default=None),
    buscar: Optional[str] = Query(default=None, description="Busca en la descripción o código interno"),
    con_stock_bajo: Optional[bool] = Query(default=None, description="stock_actual <= stock_minimo"),
    db: Session = Depends(get_db),
):
    query = db.query(Insumo).filter(Insumo.optica_id == optica_id)

    if id_proveedor is not None:
        _get_proveedor_optica(db, optica_id, id_proveedor)
        query = query.filter(Insumo.id_proveedor == id_proveedor)

    if activo is not None:
        query = query.filter(Insumo.activo == activo)

    if buscar:
        like = f"%{buscar}%"
        query = query.filter(
            or_(
                Insumo.descripcion.ilike(like),
                Insumo.codigo_interno.ilike(like),
            )
        )

    if con_stock_bajo:
        query = query.filter(
            Insumo.stock_minimo.isnot(None),
            Insumo.stock_actual.isnot(None),
            Insumo.stock_actual <= Insumo.stock_minimo,
        )

    return query.order_by(Insumo.descripcion.asc()).all()


@router.get("/select")
def insumos_select(
    optica_id: str = Depends(get_optica_id),
    proveedor_id: int | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Insumo).filter(Insumo.optica_id == optica_id, Insumo.activo == True)

    if proveedor_id is not None:
        _get_proveedor_optica(db, optica_id, proveedor_id)
        query = query.filter(Insumo.id_proveedor == proveedor_id)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Insumo.descripcion.ilike(like),
                Insumo.codigo_interno.ilike(like),
                Insumo.codigo_proveedor.ilike(like),
            )
        )

    rows = query.order_by(Insumo.descripcion.asc()).limit(limit).all()

    return [
        {
            "id": i.id_insumo,
            "label": f"{i.descripcion} ({i.codigo_interno or '-'})",
            "stock_actual": i.stock_actual,
            "precio_costo": i.precio_costo,
        }
        for i in rows
    ]


@router.get("/{id_insumo}", response_model=InsumoOut)
def obtener_insumo(
    id_insumo: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    return _get_insumo_optica(db, optica_id, id_insumo)


@router.put("/{id_insumo}", response_model=InsumoOut)
def actualizar_insumo(
    id_insumo: int,
    data: InsumoUpdate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    insumo = _get_insumo_optica(db, optica_id, id_insumo)

    if data.id_proveedor is not None:
        _get_proveedor_optica(db, optica_id, data.id_proveedor)

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(insumo, campo, valor)

    db.commit()
    db.refresh(insumo)
    return insumo


@router.delete("/{id_insumo}")
def desactivar_insumo(
    id_insumo: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    insumo = _get_insumo_optica(db, optica_id, id_insumo)

    insumo.activo = False
    db.commit()
    return {"detail": "Insumo desactivado correctamente."}
