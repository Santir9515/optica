from enum import Enum

class EstadoReceta(str, Enum):
    ACTIVA = "ACTIVA"
    CERRADA = "CERRADA"
    ANULADA = "ANULADA"

class EstadoPedidoLab(str, Enum):
    PENDIENTE = "PENDIENTE"
    ENVIADO = "ENVIADO"
    RECIBIDO = "RECIBIDO"
    CANCELADO = "CANCELADO"
