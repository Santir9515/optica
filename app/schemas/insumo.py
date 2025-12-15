from pydantic import BaseModel
from typing import Optional


class InsumoBase(BaseModel):
    descripcion: str
    tipo_insumo: Optional[str] = None
    id_proveedor: Optional[int] = None
    codigo_proveedor: Optional[str] = None
    codigo_interno: Optional[str] = None
    precio_costo: Optional[float] = None
    precio_sugerido: Optional[float] = None
    stock_minimo: Optional[int] = None
    stock_actual: Optional[int] = None
    activo: bool = True


class InsumoCreate(InsumoBase):
    pass


class InsumoUpdate(BaseModel):
    descripcion: Optional[str] = None
    tipo_insumo: Optional[str] = None
    id_proveedor: Optional[int] = None
    codigo_proveedor: Optional[str] = None
    codigo_interno: Optional[str] = None
    precio_costo: Optional[float] = None
    precio_sugerido: Optional[float] = None
    stock_minimo: Optional[int] = None
    stock_actual: Optional[int] = None
    activo: Optional[bool] = None


class InsumoOut(InsumoBase):
    id_insumo: int

    class Config:
        from_attributes = True
