from app.database import engine, Base
from app import models 

def crear_tablas():
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas correctamente.")

if __name__ == "__main__":
    crear_tablas()
