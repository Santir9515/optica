from pydantic import BaseModel
from typing import Optional

class ProveedorBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorOut(ProveedorBase):
    id_proveedor: int

    class Config:
        from_attributes = True
