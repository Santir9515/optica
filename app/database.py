from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
import os

# CONFIGURACIÓN DE CONEXIÓN A MYSQL

# URL de conexión (ajustar usuario/clave si es necesario)
MYSQL_USER = os.getenv("MYSQL_USER", "optica")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Optica2025!")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_DB = os.getenv("MYSQL_DB", "optica")

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
)

# Motor de conexión
engine = create_engine(
    DATABASE_URL,
    echo=True,              
    future=True,            
    pool_pre_ping=True      
)

# Creador de sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

# Clase base para los modelos
Base = declarative_base()


# DEPENDENCIA DE SESIÓN PARA FASTAPI

def get_db() -> Generator:
    """
    Crea y cierra una sesión de base de datos para cada request.
    FastAPI la usa automáticamente vía Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
