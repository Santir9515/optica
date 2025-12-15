from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import clientes
from app.routers import proveedores
from app.routers import insumos
from app.routers import compras_insumos
from app.routers import pedidos_laboratorio
from app.routers import recetas

app = FastAPI(
    title="API Óptica",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API de Óptica funcionando"}

# Routers
app.include_router(clientes.router)
app.include_router(proveedores.router)
app.include_router(insumos.router)
app.include_router(compras_insumos.router)
app.include_router(pedidos_laboratorio.router)
app.include_router(recetas.router)
