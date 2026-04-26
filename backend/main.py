from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Importación de Routers ──────────────────────────────────────────────────
from kpis import router as kpis_router
from routers.dashboard import router as dashboard_router
from routers.clientes_churn import router as churn_router
from riesgoalto import router as riesgo_alto_router
from prodU import router as produ_router
from reim import router as reim_router 
from routers.motor_ia import router as motor_ia_router  # <--- NUESTRO NUEVO CEREBRO

app = FastAPI(title="Havi Insights API", version="1.0.0")

# ─── 1. CORS (Siempre va hasta arriba) ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 2. Inclusión de Routers ─────────────────────────────────────────────────
# Routers directos
app.include_router(kpis_router)
app.include_router(dashboard_router)

# Routers con prefijos inyectados
app.include_router(churn_router, prefix="/api/dashboard")
app.include_router(riesgo_alto_router, prefix="/api/dashboard")
app.include_router(produ_router, prefix="/api/clientes")
app.include_router(reim_router, prefix="/api/reim")

# El router de predicciones (El frontend llamará a /api/predict/batch)
app.include_router(motor_ia_router, prefix="/api/predict")

# ─── 3. Health Check ─────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "online", "message": "API centralizada y súper limpia corriendo al 100% 🚀"}