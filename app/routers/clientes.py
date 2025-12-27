from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session
from app.schemas.cliente import ClienteOut, ClienteCreate, ClienteUpdate
from app.database import get_db
from app.models import Cliente
from app.dependencies.optica import get_optica_id

router = APIRouter(prefix="/clientes", tags=["Clientes"])


# ------------------- Schemas -------------------

class ClienteCreate(BaseModel):
    nombre: str
    apellido: str
    dni: int
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    observaciones: Optional[str] = None
    activo: bool = True


class ClienteOut(BaseModel):
    id_cliente: int
    nombre: str
    apellido: str
    dni: int
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_alta: Optional[date] = None
    activo: bool
    id_cliente_legacy: Optional[str] = None

    class Config:
        orm_mode = True


# ------------------- Endpoints -------------------

@router.get("/avanzado")
def listar_clientes_avanzado(
    optica_id: str = Depends(get_optica_id),
    q: str | None = None,
    dni: int | None = None,
    activo: bool | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    order_by: str = "apellido",
    order_dir: str = "asc",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(Cliente).filter(Cliente.optica_id == optica_id)

    # Búsqueda libre
    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Cliente.nombre.ilike(patron),
                Cliente.apellido.ilike(patron),
            )
        )

    # DNI exacto
    if dni is not None:
        query = query.filter(Cliente.dni == dni)

    # Activo/inactivo
    if activo is not None:
        query = query.filter(Cliente.activo == activo)

    # Rango fechas alta
    if fecha_desde:
        query = query.filter(Cliente.fecha_alta >= fecha_desde)

    if fecha_hasta:
        query = query.filter(Cliente.fecha_alta <= fecha_hasta)

    # Orden seguro (whitelist)
    columnas_validas = {
        "nombre": Cliente.nombre,
        "apellido": Cliente.apellido,
        "dni": Cliente.dni,
        "fecha_alta": Cliente.fecha_alta,
        "id_cliente": Cliente.id_cliente,
    }
    col = columnas_validas.get(order_by.lower())
    if not col:
        raise HTTPException(
            status_code=400,
            detail=f"order_by inválido. Opciones: {', '.join(columnas_validas.keys())}",
        )

    direction = asc if order_dir.lower() == "asc" else desc
    query = query.order_by(direction(col), asc(Cliente.apellido), asc(Cliente.nombre), desc(Cliente.id_cliente))

    total = query.count()
    clientes = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id_cliente": c.id_cliente,
                "nombre": c.nombre,
                "apellido": c.apellido,
                "dni": c.dni,
                "telefono": c.telefono,
                "email": c.email,
                "activo": c.activo,
                "fecha_alta": c.fecha_alta,
            }
            for c in clientes
        ],
    }


@router.post("/", response_model=ClienteOut, status_code=201)
def crear_cliente(
    cliente: ClienteCreate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    existente = (
        db.query(Cliente)
        .filter(Cliente.optica_id == optica_id, Cliente.dni == cliente.dni)
        .first()
    )
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese DNI en esta óptica")

    data = cliente.model_dump()
    data["optica_id"] = optica_id
    data["fecha_alta"] = date.today()

    nuevo = Cliente(**data)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[ClienteOut])
def listar_clientes(
    optica_id: str = Depends(get_optica_id),
    nombre: Optional[str] = Query(None, description="Búsqueda parcial por nombre"),
    apellido: Optional[str] = Query(None, description="Búsqueda parcial por apellido"),
    dni: Optional[int] = Query(None, description="DNI exacto"),
    activo: Optional[bool] = Query(None, description="True = activos, False = inactivos"),
    fecha_desde: Optional[date] = Query(None, description="Fecha de alta desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha de alta hasta"),
    offset: int = Query(0, ge=0, description="Desplazamiento (para paginar)"),
    limit: int = Query(100, ge=1, le=500, description="Cantidad máxima de registros"),
    db: Session = Depends(get_db),
):
    query = db.query(Cliente).filter(Cliente.optica_id == optica_id)

    if nombre:
        query = query.filter(Cliente.nombre.ilike(f"%{nombre.strip()}%"))

    if apellido:
        query = query.filter(Cliente.apellido.ilike(f"%{apellido.strip()}%"))

    if dni is not None:
        query = query.filter(Cliente.dni == dni)

    if activo is not None:
        query = query.filter(Cliente.activo == activo)

    if fecha_desde:
        query = query.filter(Cliente.fecha_alta >= fecha_desde)

    if fecha_hasta:
        query = query.filter(Cliente.fecha_alta <= fecha_hasta)

    return (
        query.order_by(Cliente.apellido.asc(), Cliente.nombre.asc(), Cliente.id_cliente.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/select")
def clientes_select(
    optica_id: str = Depends(get_optica_id),
    q: str | None = Query(default=None, description="Filtro por nombre/apellido"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Cliente).filter(Cliente.optica_id == optica_id, Cliente.activo == True)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Cliente.nombre.ilike(like),
                Cliente.apellido.ilike(like),
            )
        )

    rows = query.order_by(Cliente.apellido.asc(), Cliente.nombre.asc()).limit(limit).all()

    return [
        {
            "id": c.id_cliente,
            "label": f"{c.apellido}, {c.nombre} (DNI {c.dni})",
            "dni": c.dni,
        }
        for c in rows
    ]


@router.get("/{id_cliente}", response_model=ClienteOut)
def obtener_cliente(
    id_cliente: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == id_cliente, Cliente.optica_id == optica_id)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.patch("/{id_cliente}", response_model=ClienteOut)
def actualizar_cliente(
    id_cliente: int,
    data: ClienteUpdate,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == id_cliente, Cliente.optica_id == optica_id)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    patch = data.model_dump(exclude_unset=True)

#Validacion para que el dni no sea repetido
    if "dni" in patch and patch["dni"] is not None and patch["dni"] != cliente.dni:
        existe = (
            db.query(Cliente)
            .filter(Cliente.optica_id == optica_id, Cliente.dni == patch["dni"])
            .first()
        )
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con ese DNI en esta óptica")

    for k, v in patch.items():
        setattr(cliente, k, v)

    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{id_cliente}", status_code=204)
def eliminar_cliente(
    id_cliente: int,
    optica_id: str = Depends(get_optica_id),
    db: Session = Depends(get_db),
):
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id_cliente == id_cliente, Cliente.optica_id == optica_id)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente.activo = False
    db.commit()
    return
