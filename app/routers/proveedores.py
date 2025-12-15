from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from sqlalchemy import or_

from app.database import get_db
from app.models import Proveedor
from app.schemas.proveedor import ProveedorCreate, ProveedorOut

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


@router.get("/avanzado")
def listar_proveedores_avanzado(
    q: Optional[str] = None,
    activo: Optional[bool] = None,
    order_by: str = "nombre",
    order_dir: str = "asc",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Listado avanzado de proveedores con:
    - búsqueda por texto (q)
    - filtro por activo
    - orden dinámico
    - paginación
    """

    query = db.query(Proveedor)

    # Búsqueda parcial por nombre / email / teléfono / dirección
    if q:
        patron = f"%{q}%"
        query = query.filter(
            or_(
                Proveedor.nombre.ilike(patron),
                Proveedor.email.ilike(patron),
                Proveedor.telefono.ilike(patron),
                Proveedor.direccion.ilike(patron),
            )
        )

    # Filtro por estado
    if activo is not None:
        query = query.filter(Proveedor.activo == activo)

    # Mapeo de columnas válidas para ordenar
    columnas_validas = {
        "id": Proveedor.id_proveedor,
        "nombre": Proveedor.nombre,
        "email": Proveedor.email,
        "telefono": Proveedor.telefono,
    }

    columna_orden = columnas_validas.get(order_by.lower(), Proveedor.nombre)

    if order_dir.lower() == "desc":
        query = query.order_by(columna_orden.desc())
    else:
        query = query.order_by(columna_orden.asc())

    # Paginación
    query = query.offset(offset).limit(limit)

    proveedores = query.all()

    return {
        "total": len(proveedores),
        "items": [
            {
                "id_proveedor": p.id_proveedor,
                "nombre": p.nombre,
                "telefono": p.telefono,
                "email": p.email,
                "direccion": p.direccion,
                "activo": p.activo,
            }
            for p in proveedores
        ],
    }



@router.post("/", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
def crear_proveedor(data: ProveedorCreate, db: Session = Depends(get_db)):
    nuevo = Proveedor(**data.model_dump())
    db.add(nuevo)
    try:
        db.commit()
        db.refresh(nuevo)
    except IntegrityError as e:
        db.rollback()
        if "nombre" in str(e.orig).lower():
            raise HTTPException(
                status_code=400,
                detail="Ya existe un proveedor con ese nombre."
            )
        raise HTTPException(status_code=400, detail="Error al crear proveedor.")

    return nuevo


@router.get("/", response_model=list[ProveedorOut])
def listar_proveedores(
    activo: Optional[bool] = Query(default=None),
    nombre: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Proveedor)

    if activo is not None:
        query = query.filter(Proveedor.activo == activo)

    if nombre:
        query = query.filter(Proveedor.nombre.like(f"%{nombre}%"))

    return query.all()

@router.get("/select")
def proveedores_select(
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Proveedor).filter(Proveedor.activo == True)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(Proveedor.nombre.ilike(like))

    rows = query.order_by(Proveedor.nombre.asc()).limit(limit).all()

    return [{"id": p.id_proveedor, "label": p.nombre} for p in rows]

@router.get("/{id_proveedor}", response_model=ProveedorOut)
def obtener_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).get(id_proveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return proveedor


@router.put("/{id_proveedor}", response_model=ProveedorOut)
def actualizar_proveedor(
    id_proveedor: int,
    data: ProveedorCreate,
    db: Session = Depends(get_db),
):
    proveedor = db.query(Proveedor).get(id_proveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    for key, value in data.model_dump().items():
        setattr(proveedor, key, value)

    try:
        db.commit()
        db.refresh(proveedor)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="El nombre del proveedor ya existe."
        )

    return proveedor


@router.delete("/{id_proveedor}")
def eliminar_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).get(id_proveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")

    proveedor.activo = False
    db.commit()

    return {"detail": "Proveedor desactivado correctamente."}

