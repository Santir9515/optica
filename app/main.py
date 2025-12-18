from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# importa los módulos de routers, no el objeto router directamente
from app.routers import clientes, proveedores, insumos, recetas, compras_insumos, pedidos_laboratorio

app = FastAPI(title="API Óptica")

# CORS si lo estás usando con el front en http://localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CLIENTES
app.include_router(clientes.router)

# PROVEEDORES  ← IMPORTANTE
app.include_router(proveedores.router)

# INSUMOS
app.include_router(insumos.router)

# RECETAS
app.include_router(recetas.router)

# COMPRAS DE INSUMOS
app.include_router(compras_insumos.router)

# PEDIDOS LABORATORIO
app.include_router(pedidos_laboratorio.router)
