from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    Date,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from app.database import Base

class Cliente(Base):
    __tablename__ = "cliente"
    __table_args__ = (UniqueConstraint("optica_id", "nombre", name="uq_proveedor_optica_nombre"),)
    optica_id = Column(String(36), nullable=False, index=True)
    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(Text, nullable=False)
    apellido = Column(Text, nullable=False)
    dni = Column(Integer, unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(Text, nullable=True)
    direccion = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_alta = Column(Date, nullable=True)
    activo = Column(Boolean, default=True)
    id_cliente_legacy = Column(Text, nullable=True)

    recetas = relationship("Receta", back_populates="cliente")


class Receta(Base):
    __tablename__ = "receta"
    optica_id = Column(String(36), nullable=False, index=True)
    id_receta = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    fecha_receta = Column(Date, nullable=False)
    profesional = Column(Text, nullable=True)
    tipo_lente = Column(Text, nullable=True)

    od_esfera = Column(Float, nullable=True)
    od_cilindro = Column(Float, nullable=True)
    od_eje = Column(Integer, nullable=True)

    ol_esfera = Column(Float, nullable=True)
    ol_cilindro = Column(Float, nullable=True)
    ol_eje = Column(Integer, nullable=True)

    adicion = Column(Float, nullable=True)
    dp = Column(Float, nullable=True)

    observaciones = Column(Text, nullable=True)
    estado = Column(Text, nullable=True)
    fecha_creacion_reg = Column(Date, nullable=True)
    id_receta_legacy = Column(Text, nullable=True)

    cliente = relationship("Cliente", back_populates="recetas")
    pedidos_laboratorio = relationship(
        "PedidoLaboratorio",
        back_populates="receta",
        cascade="all, delete-orphan",
    )


class Proveedor(Base):
    __tablename__ = "proveedor"
    __table_args__ = (UniqueConstraint("optica_id", "nombre", name="uq_proveedor_optica_nombre"),)
    optica_id = Column(String(36), nullable=False, index=True)
    id_proveedor = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(191), nullable=False)
    telefono = Column(String(20), nullable=True)
    email = Column(Text, nullable=True)
    direccion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)

    insumos = relationship("Insumo", back_populates="proveedor")
    compras_insumos = relationship("CompraInsumos", back_populates="proveedor")
    pedidos_laboratorio = relationship(
        "PedidoLaboratorio",
        back_populates="proveedor",
        cascade="all, delete-orphan",
    )


class Insumo(Base):
    __tablename__ = "insumo"
    __table_args__ = (
    UniqueConstraint("optica_id", "codigo_interno", name="uq_insumo_optica_codigo_interno"),
)
    optica_id = Column(String(36), nullable=False, index=True)
    id_insumo = Column(Integer, primary_key=True, index=True)
    descripcion = Column(Text, nullable=False)
    tipo_insumo = Column(Text, nullable=True)

    id_proveedor = Column(Integer, ForeignKey("proveedor.id_proveedor"), nullable=True)

    codigo_proveedor = Column(Text, nullable=True)
    codigo_interno = Column(Text, nullable=True)

    precio_costo = Column(Float, nullable=True)
    precio_sugerido = Column(Float, nullable=True)

    stock_minimo = Column(Integer, nullable=True)
    stock_actual = Column(Integer, nullable=True)

    activo = Column(Boolean, default=True)
    id_insumo_legacy = Column(Text, nullable=True)

    proveedor = relationship("Proveedor", back_populates="insumos")

    detalles_compra = relationship(
        "DetalleCompraInsumos",
        back_populates="insumo",
        cascade="all, delete-orphan",
    )

    detalles_pedido_lab = relationship(
        "DetallePedidoLaboratorioInsumo",
        back_populates="insumo",
        cascade="all, delete-orphan",
    )



class CompraInsumos(Base):
    __tablename__ = "compra_insumos"

    optica_id = Column(String(36), nullable=False, index=True)
    id_compra = Column(Integer, primary_key=True, index=True)
    id_proveedor = Column(Integer, ForeignKey("proveedor.id_proveedor"), nullable=False)
    fecha_compra = Column(Date, nullable=False)
    tipo_comprobante = Column(Text, nullable=True)
    nro_comprobante = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    monto_total = Column(Float, nullable=True)

    anulada = Column(Boolean, nullable=False, default=False)
    motivo_anulacion = Column(Text, nullable=True)
    fecha_anulacion = Column(DateTime, nullable=True)

    proveedor = relationship("Proveedor", back_populates="compras_insumos")
    detalles = relationship(
        "DetalleCompraInsumos",
        back_populates="compra",
        cascade="all, delete-orphan",
    )




class DetalleCompraInsumos(Base):
    __tablename__ = "detalle_compra_insumos"
    __table_args__ = (
        UniqueConstraint("optica_id", "id_compra", "id_insumo", name="uq_detalle_compra_optica_compra_insumo"),
    )

    optica_id = Column(String(36), nullable=False, index=True)
    id_detalle_compra = Column(Integer, primary_key=True, index=True)
    id_compra = Column(Integer, ForeignKey("compra_insumos.id_compra"), nullable=False)
    id_insumo = Column(Integer, ForeignKey("insumo.id_insumo"), nullable=False)

    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    compra = relationship("CompraInsumos", back_populates="detalles")
    insumo = relationship("Insumo", back_populates="detalles_compra")



class PedidoLaboratorio(Base):
    __tablename__ = "pedido_laboratorio"
    __table_args__ = (
        UniqueConstraint("optica_id", "nro_orden_lab", name="uq_pedido_lab_optica_nro_orden"),
    )

    optica_id = Column(String(36), nullable=False, index=True)

    id_pedido_lab = Column(Integer, primary_key=True, index=True)
    id_receta = Column(Integer, ForeignKey("receta.id_receta"), nullable=False)
    id_proveedor = Column(Integer, ForeignKey("proveedor.id_proveedor"), nullable=False)

    fecha_envio = Column(Date, nullable=True)
    fecha_estimada_rec = Column(Date, nullable=True)
    fecha_recepcion = Column(Date, nullable=True)
    estado = Column(Text, nullable=True)
    nro_orden_lab = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    id_pedido_lab_legacy = Column(Text, nullable=True)

    receta = relationship("Receta", back_populates="pedidos_laboratorio")
    proveedor = relationship("Proveedor", back_populates="pedidos_laboratorio")

    detalles_insumo = relationship(
        "DetallePedidoLaboratorioInsumo",
        back_populates="pedido_laboratorio",
        cascade="all, delete-orphan",
    )



class DetallePedidoLaboratorioInsumo(Base):
    __tablename__ = "detalle_pedido_laboratorio_insumo"
    __table_args__ = (
        UniqueConstraint("optica_id", "id_pedido_lab", "id_insumo", name="uq_det_pedido_optica_pedido_insumo"),
    )

    optica_id = Column(String(36), nullable=False, index=True)
    id_detalle_pedido_lab_insumo = Column(Integer, primary_key=True, index=True)
    id_pedido_lab = Column(Integer, ForeignKey("pedido_laboratorio.id_pedido_lab"), nullable=False)
    id_insumo = Column(Integer, ForeignKey("insumo.id_insumo"), nullable=False)

    cantidad = Column(Integer, nullable=False)
    observaciones = Column(Text, nullable=True)
    precio_unitario = Column(Float, nullable=False)

    pedido_laboratorio = relationship("PedidoLaboratorio", back_populates="detalles_insumo")
    insumo = relationship("Insumo", back_populates="detalles_pedido_lab")
