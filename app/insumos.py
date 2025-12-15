from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Insumo

router = APIRouter(prefix="/insumos", tags=["Insumos"])


# Crear insumo
@router.post("/", status_code=201)
def crear_insumo(data: dict, db: Session = Depends(get_db)):
    nuevo = Insumo(**data)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# Listar todos
@router.get("/")
def listar_insumos(db: Session = Depends(get_db)):
    return db.query(Insumo).all()


# Obtener por ID
@router.get("/{id_insumo}")
def obtener_insumo(id_insumo: int, db: Session = Depends(get_db)):
    insumo = db.query(Insumo).filter(Insumo.id_insumo == id_insumo).first()
    if not insumo:
        raise HTTPException(404, "Insumo no encontrado")
    return insumo


# Actualizar
@router.put("/{id_insumo}")
def actualizar_insumo(id_insumo: int, data: dict, db: Session = Depends(get_db)):
    insumo = db.query(Insumo).filter(Insumo.id_insumo == id_insumo).first()
    if not insumo:
        raise HTTPException(404, "Insumo no encontrado")

    for campo, valor in data.items():
        setattr(insumo, campo, valor)

    db.commit()
    db.refresh(insumo)
    return insumo


# Baja lógica
@router.delete("/{id_insumo}")
def eliminar_insumo(id_insumo: int, db: Session = Depends(get_db)):
    insumo = db.query(Insumo).filter(Insumo.id_insumo == id_insumo).first()
    if not insumo:
        raise HTTPException(404, "Insumo no encontrado")

    insumo.activo = False
    db.commit()
    return {"mensaje": "Insumo desactivado correctamente"}

