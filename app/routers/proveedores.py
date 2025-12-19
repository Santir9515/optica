from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from sqlalchemy import or_, asc, desc

from app.database import get_db
from app.models import Proveedor
from app.schemas.proveedor import ProveedorCreate, ProveedorOut
from app.dependencies.optica import get_optica_id

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


@router.get("/avanzado")
def listar_proveedores_avanzado(
    optica_id: str = Depends(get_optica_id),
    q: Optional[str] = None,
    activo: Optional[bool] = None,
    order_by: str = "nombre",
    order_dir: str = "asc",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Listado avanzado de proveedores (multi-óptica) con:
    - búsqueda por texto (q)
    - filtro por activo
    - orden dinámico seguro
    - paginación
    """

    query = db.query(Proveedor).filter(Proveedor.optica_id == optica_id)

    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Proveedor.nombre.ilike(patron),
                Proveedor.email.ilike(patron),
                Proveedor.telefono.ilike(patron),
                Proveedor.direccion.ilike(patron),
            )
        )

    if activo is not None:
        query = query.filter(Proveedor.activo == activo)

    columnas_validas = {
    "id_proveedor": Proveedor.id_proveedor,
    "nombre": Proveedor.nombre,
    "email": Proveedor.email,
    "telefono": Proveedor.telefono,
    "direccion": Proveedor.direccion,
    "activo": Proveedor.activo,
    }


    col = columnas_validas.get(order_by.lower())
    if not col:
        raise HTTPException(
            status_code=400,
            detail=f"order_by inválido. Opciones: {', '.join(columnas_validas.keys())}",
        )

    direction = asc if order_dir.lower() == "asc" else desc

    total = query.count()
    rows = (
        query.order_by(direction(col), asc(Proveedor.nombre), desc(Proveedor.id_proveedor))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id_proveedor": p.id_proveedor,
                "nombre": p.nombre,
                "telefono": p.telefono,
                "email": p.email,
                "direccion": p.direccion,
                "activo": p.activo,
            }
            for p in rows
        ],
    }


@router.post("/", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
def crear_proveedor(
    data: ProveedorCreate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    nuevo = Proveedor(**data.model_dump(), optica_id=optica_id)
    db.add(nuevo)

    try:
        db.commit()
        db.refresh(nuevo)
    except IntegrityError as e:
        db.rollback()
        if "nombre" in str(getattr(e, "orig", "")).lower():
            raise HTTPException(status_code=400, detail="Ya existe un proveedor con ese nombre en esta óptica.")
        raise HTTPException(status_code=400, detail="Error al crear proveedor.")

    return nuevo


@router.get("/", response_model=list[ProveedorOut])
def listar_proveedores(
    optica_id: str = Depends(get_optica_id),
    activo: Optional[bool] = Query(default=None),
    nombre: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Proveedor).filter(Proveedor.optica_id == optica_id)

    if activo is not None:
        query = query.filter(Proveedor.activo == activo)

    if nombre:
        query = query.filter(Proveedor.nombre.ilike(f"%{nombre.strip()}%"))

    return query.order_by(Proveedor.nombre.asc(), Proveedor.id_proveedor.desc()).all()


@router.get("/select")
def proveedores_select(
    optica_id: str = Depends(get_optica_id),
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Proveedor).filter(Proveedor.optica_id == optica_id, Proveedor.activo == True)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(Proveedor.nombre.ilike(like))

    rows = query.order_by(Proveedor.nombre.asc()).limit(limit).all()
    return [{"id": p.id_proveedor, "label": p.nombre} for p in rows]


@router.get("/{id_proveedor}", response_model=ProveedorOut)
def obtener_proveedor(
    id_proveedor: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    proveedor = (
        db.query(Proveedor)
        .filter(Proveedor.id_proveedor == id_proveedor, Proveedor.optica_id == optica_id)
        .first()
    )
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return proveedor


@router.put("/{id_proveedor}", response_model=ProveedorOut)
def actualizar_proveedor(
    id_proveedor: int,
    data: ProveedorCreate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    proveedor = (
        db.query(Proveedor)
        .filter(Proveedor.id_proveedor == id_proveedor, Proveedor.optica_id == optica_id)
        .first()
    )
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    for key, value in data.model_dump().items():
        setattr(proveedor, key, value)

    try:
        db.commit()
        db.refresh(proveedor)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El nombre del proveedor ya existe en esta óptica.")

    return proveedor


@router.delete("/{id_proveedor}")
def eliminar_proveedor(
    id_proveedor: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    proveedor = (
        db.query(Proveedor)
        .filter(Proveedor.id_proveedor == id_proveedor, Proveedor.optica_id == optica_id)
        .first()
    )
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    proveedor.activo = False
    db.commit()

    return {"detail": "Proveedor desactivado correctamente."}
