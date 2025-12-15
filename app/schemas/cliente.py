from pydantic import BaseModel, ConfigDict
from datetime import date


class ClienteBase(BaseModel):
    nombre: str
    apellido: str
    dni: int
    fecha_nacimiento: date | None = None
    telefono: str | None = None 
    email: str | None = None
    direccion: str | None = None
    observaciones: str | None = None
    fecha_alta: date | None = None
    activo: bool = True



class ClienteCreate(ClienteBase):
    """Datos necesarios para crear un cliente."""
    pass


class ClienteUpdate(BaseModel):
    """Campos opcionales para actualizar un cliente."""
    nombre: str | None = None
    apellido: str | None = None
    dni: int | None = None
    fecha_nacimiento: date | None = None
    telefono: int | None = None
    email: str | None = None
    direccion: str | None = None
    observaciones: str | None = None
    fecha_alta: date | None = None
    activo: bool | None = None


class ClienteOut(ClienteBase):
    id_cliente: int

    # Para que FastAPI pueda leer desde el ORM (SQLAlchemy)
    model_config = ConfigDict(from_attributes=True)
