from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from app.database import get_db
from app.models import Receta, Cliente
from typing import Optional
from app.schemas.enums import EstadoReceta



router = APIRouter(prefix="/recetas", tags=["Recetas"])


# ------------------- SCHEMAS -------------------

class RecetaCreate(BaseModel):
    id_cliente: int
    fecha_receta: date
    profesional: Optional[str] = None
    tipo_lente: Optional[str] = None

    od_esfera: Optional[float] = None
    od_cilindro: Optional[float] = None
    od_eje: Optional[int] = None

    ol_esfera: Optional[float] = None
    ol_cilindro: Optional[float] = None
    ol_eje: Optional[int] = None

    adicion: Optional[float] = None
    dp: Optional[float] = None

    observaciones: Optional[str] = None
    estado: Optional[str] = "ACTIVA"
    fecha_creacion_reg: Optional[date] = None

class RecetaEstadoUpdate(BaseModel):
    estado: str
    observaciones: Optional[str] = None

class RecetaEstadoPatch(BaseModel):
    estado: EstadoReceta

class RecetaPatch(BaseModel):
    profesional: Optional[str] = None
    tipo_lente: Optional[str] = None

    od_esfera: Optional[float] = None
    od_cilindro: Optional[float] = None
    od_eje: Optional[int] = None

    ol_esfera: Optional[float] = None
    ol_cilindro: Optional[float] = None
    ol_eje: Optional[int] = None

    adicion: Optional[float] = None
    dp: Optional[float] = None

    observaciones: Optional[str] = None
    estado: Optional[str] = None


# ------------------- ENDPOINTS -------------------

@router.post("/", status_code=201)
def crear_receta(receta_in: RecetaCreate, db: Session = Depends(get_db)):
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == receta_in.id_cliente, Cliente.activo == True)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=400, detail="Cliente no encontrado o inactivo")

    receta = Receta(**receta_in.model_dump())
    db.add(receta)
    db.commit()
    db.refresh(receta)

    return {"id_receta": receta.id_receta, "mensaje": "Receta creada correctamente"}


@router.get("/avanzado")
def listar_recetas_avanzado(
    q: Optional[str] = Query(default=None),
    activo_cliente: Optional[bool] = Query(default=None),
    id_cliente: Optional[int] = Query(default=None),
    dni: Optional[int] = Query(default=None),
    estado: Optional[str] = Query(default=None),
    tipo_lente: Optional[str] = Query(default=None),
    profesional: Optional[str] = Query(default=None),
    fecha_desde: Optional[date] = Query(default=None),
    fecha_hasta: Optional[date] = Query(default=None),
    order_by: str = Query(default="fecha_receta"),
    order_dir: str = Query(default="desc"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Receta).join(Cliente, Receta.id_cliente == Cliente.id_cliente)

    if id_cliente:
        query = query.filter(Receta.id_cliente == id_cliente)
    if dni:
        query = query.filter(Cliente.dni == dni)
    if activo_cliente is not None:
        query = query.filter(Cliente.activo == activo_cliente)
    if estado:
        query = query.filter(Receta.estado == estado)
    if tipo_lente:
        query = query.filter(Receta.tipo_lente == tipo_lente)
    if profesional:
        query = query.filter(Receta.profesional == profesional)
    if fecha_desde:
        query = query.filter(Receta.fecha_receta >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Receta.fecha_receta <= fecha_hasta)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Cliente.nombre.ilike(like),
                Cliente.apellido.ilike(like),
                Receta.profesional.ilike(like),
                Receta.tipo_lente.ilike(like),
                Receta.estado.ilike(like),
                Receta.observaciones.ilike(like),
            )
        )

    allowed_order = {
        "id_receta": Receta.id_receta,
        "fecha_receta": Receta.fecha_receta,
        "estado": Receta.estado,
        "tipo_lente": Receta.tipo_lente,
        "profesional": Receta.profesional,
        "cliente_apellido": Cliente.apellido,
        "cliente_nombre": Cliente.nombre,
        "dni": Cliente.dni,
    }

    col = allowed_order.get(order_by)
    if not col:
        raise HTTPException(status_code=400, detail=f"order_by inválido: {order_by}")

    direction = asc if order_dir.lower() == "asc" else desc
    query = query.order_by(direction(col), desc(Receta.id_receta))

    total = query.count()
    data = query.offset(offset).limit(limit).all()

    items = [
        {
            "id_receta": r.id_receta,
            "id_cliente": r.id_cliente,
            "fecha_receta": r.fecha_receta,
            "profesional": r.profesional,
            "tipo_lente": r.tipo_lente,
            "estado": r.estado,
            "observaciones": r.observaciones,
        }
        for r in data
    ]

    return {"total": total, "limit": limit, "offset": offset, "items": items}


@router.get("/")
def listar_recetas(db: Session = Depends(get_db)):
    return db.query(Receta).order_by(Receta.id_receta.desc()).all()

@router.patch("/{id_receta}/estado")
def actualizar_estado_receta(
    id_receta: int,
    data: RecetaEstadoUpdate,
    db: Session = Depends(get_db),
):
    receta = db.query(Receta).filter(
        Receta.id_receta == id_receta
    ).first()

    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    estados_validos = {
        "ACTIVA",
        "EN_LABORATORIO",
        "FINALIZADA",
        "CANCELADA",
    }

    estado_nuevo = data.estado.upper()

    if estado_nuevo not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Permitidos: {', '.join(estados_validos)}",
        )

    receta.estado = estado_nuevo

    if data.observaciones is not None:
        receta.observaciones = data.observaciones

    db.commit()
    db.refresh(receta)

    return {
        "id_receta": receta.id_receta,
        "estado": receta.estado,
        "observaciones": receta.observaciones,
        "mensaje": "Estado de la receta actualizado correctamente",
    }


@router.patch("/{id_receta}/estado")
def patch_estado_receta(id_receta: int, data: RecetaEstadoPatch, db: Session = Depends(get_db)):
    receta = db.query(Receta).filter(Receta.id_receta == id_receta).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    receta.estado = data.estado.value
    db.commit()
    db.refresh(receta)

    return {"id_receta": receta.id_receta, "estado": receta.estado}


@router.patch("/{id_receta}")
def patch_receta(id_receta: int, data: RecetaPatch, db: Session = Depends(get_db)):
    receta = db.query(Receta).filter(Receta.id_receta == id_receta).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    patch = data.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=400, detail="No se enviaron campos")

    for k, v in patch.items():
        setattr(receta, k, v)

    db.commit()
    db.refresh(receta)
    return {"id_receta": receta.id_receta, "estado": receta.estado}

