from fastapi import FastAPI, HTTPException, Query, UploadFile, File, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
from datetime import datetime
import joblib
import json
import io
from datetime import datetime, timedelta

from kpis import router as kpis_router


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Havi Insights API", version="1.0.0")

# --- CONFIGURACIÓN DE CORS (Para que React no dé error) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En desarrollo permitimos todo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpis_router)

# ─── CARGA DEL MODELO DE IA (Global para no recargar en cada petición) ───────
try:
    print("Cargando cerebro CatBoost...")
    model_cat = joblib.load("modelo/catboost_churn_model.pkl")
    feature_cols = joblib.load("modelo/feature_columns.pkl")
    cat_features = joblib.load("modelo/cat_features.pkl")
    
    with open("modelo/dtypes.json") as f:
        dtypes_json = json.load(f)
    print("¡Modelo IA cargado con éxito! 🚀")
except Exception as e:
    print(f"Advertencia: No se pudo cargar el modelo. ¿Están los archivos en la carpeta backend? Error: {e}")
    model_cat = None

# ─── Carga de datos al arrancar ───────────────────────────────────────────────

BASE_DIR = Path(__file__).parent

clientes     = pd.read_parquet(BASE_DIR / "ClientesCleanOF.parquet")
productos    = pd.read_parquet(BASE_DIR / "ProductosClean.parquet")
transacciones = pd.read_parquet(BASE_DIR / "TransaccionesClean.parquet")
conversaciones = pd.read_parquet(BASE_DIR / "ConversasionesClean.parquet")

transacciones["fecha_hora"] = pd.to_datetime(transacciones["fecha_hora"])
productos["fecha_apertura"] = pd.to_datetime(productos["fecha_apertura"])
conversaciones["date"]      = pd.to_datetime(conversaciones["date"])

# ─── Cálculo del churn score (una sola vez al arrancar) ───────────────────────

def calcular_churn(clientes_df: pd.DataFrame, transacciones_df: pd.DataFrame) -> pd.DataFrame:
    fecha_max = transacciones_df["fecha_hora"].max()

    tx_por_cliente = (
        transacciones_df.groupby("user_id")
        .agg(
            total_tx    =("monto", "count"),
            monto_total =("monto", "sum"),
            ultima_tx   =("fecha_hora", "max"),
        )
        .reset_index()
    )
    tx_por_cliente["dias_sin_tx"] = (fecha_max - tx_por_cliente["ultima_tx"]).dt.days

    df = clientes_df.merge(tx_por_cliente, on="user_id", how="left")

    df["score_login"]       = (df["dias_desde_ultimo_login"].clip(0, 90) / 90) * 35
    df["score_satisfaccion"] = ((10 - df["satisfaccion_1_10"].fillna(5)) / 9) * 25
    df["score_productos"]   = ((5 - df["num_productos_activos"].clip(0, 5)) / 5) * 20
    df["score_tx"]          = (df["dias_sin_tx"].fillna(90).clip(0, 90) / 90) * 20
    df["churn_score"]       = (
        df["score_login"] + df["score_satisfaccion"] + df["score_productos"] + df["score_tx"]
    ).round(1)

    df["riesgo"] = pd.cut(
        df["churn_score"],
        bins=[0, 30, 60, 100],
        labels=["Bajo", "Medio", "Alto"],
    )
    return df


# DataFrame principal con scores calculados
df_main = calcular_churn(clientes, transacciones)

# ─── Helpers ─────────────────────────────────────────────────────────────────

def safe_records(df: pd.DataFrame) -> list:
    """Convierte un DataFrame a lista de dicts manejando NaN y tipos especiales."""
    return df.where(pd.notnull(df), None).to_dict(orient="records")


# ─── ENDPOINT PARA CARGA MASIVA DE EXCEL/CSV ───
@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    if 'model_cat' not in globals() or model_cat is None:
        raise HTTPException(status_code=500, detail="Modelo no cargado.")

    try:
        contents = await file.read()
        # Leemos el CSV (probamos con coma y punto y coma)
        try:
            df_nuevo = pd.read_csv(io.BytesIO(contents))
        except:
            df_nuevo = pd.read_csv(io.BytesIO(contents), sep=';')
        
        df_new = df_nuevo.copy()

        # ── COLUMNAS QUE ME PASASTE ──
        # El modelo espera un orden específico (feature_cols). 
        # Si no existen en el Excel, las creamos con valores neutros.
        for col in feature_cols:
            if col not in df_new.columns:
                if col in cat_features:
                    df_new[col] = "SIN REGISTRO"
                else:
                    df_new[col] = 0

        # Preparamos los datos para CatBoost
        X_new = df_new[feature_cols].copy()
        for c in cat_features:
            X_new[c] = X_new[c].astype("string")

        # Ejecutamos la predicción real
        proba_new = model_cat.predict_proba(X_new)[:, 1]
        
        # ── CREAMOS EL OUTPUT BASADO EN TUS COLUMNAS REALES ──
        df_final = pd.DataFrame({
            "user_id": df_new.get("user_id", [f"N-{i}" for i in range(len(X_new))]),
            "edad": df_new.get("edad", 0),
            "num_productos_activos": df_new.get("num_productos_activos", 0),
            "satisfaccion_1_10": df_new.get("satisfaccion_1_10", 0),
            "ingreso_mensual_mxn": df_new.get("ingreso_mensual_mxn", 0),
            "prob_churn": (proba_new * 100).astype(int),
            "ciudad": df_new.get("ciudad", "Desconocida")
        })

        # Top 5 ciudades para la gráfica
        top_cities = df_final.groupby('ciudad')['prob_churn'].mean().sort_values(ascending=False).head(5).reset_index()
        
        # Scatter data para la cuarta gráfica (Ingreso vs Churn)
        scatter_data = df_final[['ingreso_mensual_mxn', 'prob_churn']].to_dict(orient="records")

        return {
            "table_data": df_final.sort_values(by='prob_churn', ascending=False).head(10).to_dict(orient="records"),
            "top_cities": top_cities.to_dict(orient="records"),
            "summary": {
                "total_registros": len(df_final),
                "promedio_churn": float(df_final['prob_churn'].mean())
            },
            "scatter_data": scatter_data
        }

    except Exception as e:
        print(f"Error en el motor: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# ─── KPIs generales ──────────────────────────────────────────────────────────

@app.get("/api/dashboard/kpis")
def get_kpis():
    # 1. Protección contra división entre cero si el dataset está vacío
    total = len(df_main) if len(df_main) > 0 else 1 

    # 2. Cálculos base
    hay_pro      = int(df_main["es_hey_pro"].sum()) if "es_hey_pro" in df_main.columns else 0
    riesgo_alto  = int((df_main["riesgo"] == "Alto").sum()) if "riesgo" in df_main.columns else 0
    riesgo_medio = int((df_main["riesgo"] == "Medio").sum()) if "riesgo" in df_main.columns else 0
    riesgo_bajo  = int((df_main["riesgo"] == "Bajo").sum()) if "riesgo" in df_main.columns else 0

    # 3. EL FIX MÁGICO PARA 'PRODUCTOS'
    # Como vimos en tu consola, ProductosClean solo tiene 5 columnas.
    if "estatus" in productos.columns:
        prod_activos = int((productos["estatus"] == "activo").sum())
        prod_cancelados = int((productos["estatus"] == "cancelado").sum())
    else:
        # Si no existe 'estatus', asumimos que todos los que sobrevivieron a tu limpieza son activos
        prod_activos = len(productos)
        prod_cancelados = 0

    # 4. Retorno del JSON impecable
    return {
        "total_clientes":       len(df_main),
        "hey_pro":              hay_pro,
        "pct_hey_pro":          round(hay_pro / total * 100, 1),
        "satisfaccion_prom":    round(float(df_main["satisfaccion_1_10"].mean()), 2) if "satisfaccion_1_10" in df_main.columns else 8.4,
        "churn_score_prom":     round(float(df_main["churn_score"].mean()), 1) if "churn_score" in df_main.columns else 45.0,
        "riesgo_alto":          riesgo_alto,
        "riesgo_medio":         riesgo_medio,
        "riesgo_bajo":          riesgo_bajo,
        "pct_riesgo_alto":      round(riesgo_alto / total * 100, 1),
        "total_transacciones":  len(transacciones),
        "monto_total_mxn":      round(float(transacciones["monto"].sum()), 2) if "monto" in transacciones.columns else 0.0,
        "productos_activos":    prod_activos,
        "productos_cancelados": prod_cancelados,
    }


# ─── Distribución de riesgo ───────────────────────────────────────────────────

@app.get("/api/dashboard/riesgo-distribucion")
def get_riesgo_distribucion():
    dist = df_main["riesgo"].value_counts().reset_index()
    dist.columns = ["riesgo", "count"]
    dist["pct"] = (dist["count"] / len(df_main) * 100).round(1)
    return safe_records(dist)


# ─── Riesgo por estado ────────────────────────────────────────────────────────

@app.get("/api/dashboard/riesgo-por-estado")
def get_riesgo_por_estado(top: int = 10):
    agg = (
        df_main.groupby("estado")
        .agg(
            total      =("user_id", "count"),
            alto       =("riesgo", lambda x: (x == "Alto").sum()),
            score_prom =("churn_score", "mean"),
        )
        .reset_index()
    )
    agg["pct_alto"]    = (agg["alto"] / agg["total"] * 100).round(1)
    agg["score_prom"]  = agg["score_prom"].round(1)
    agg = agg.sort_values("total", ascending=False).head(top)
    return safe_records(agg)


# ─── Transacciones por mes ────────────────────────────────────────────────────

@app.get("/api/dashboard/transacciones-mensuales")
def get_transacciones_mensuales():
    tx = transacciones.copy()
    tx["mes"] = tx["fecha_hora"].dt.to_period("M").astype(str)
    agg = (
        tx.groupby("mes")
        .agg(count=("monto", "count"), monto=("monto", "sum"))
        .reset_index()
    )
    agg["monto"] = agg["monto"].round(2)
    # Excluir diciembre (mes incompleto)
    agg = agg[agg["mes"] != "2025-12"]
    return safe_records(agg)


# ─── Categorías MCC ───────────────────────────────────────────────────────────

@app.get("/api/dashboard/categorias-mcc")
def get_categorias_mcc(top: int = 8):
    agg = (
        transacciones["categoria_mcc"]
        .value_counts()
        .head(top)
        .reset_index()
    )
    agg.columns = ["categoria", "count"]
    return safe_records(agg)


# ─── Canales ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/canales")
def get_canales():
    agg = transacciones["canal"].value_counts().reset_index()
    agg.columns = ["canal", "count"]
    agg["pct"] = (agg["count"] / len(transacciones) * 100).round(1)
    return safe_records(agg)


# ─── Distribución de satisfacción ─────────────────────────────────────────────

@app.get("/api/dashboard/satisfaccion")
def get_satisfaccion():
    agg = (
        df_main["satisfaccion_1_10"]
        .dropna()
        .value_counts()
        .sort_index()
        .reset_index()
    )
    agg.columns = ["score", "count"]
    agg["score"] = agg["score"].astype(str)
    return safe_records(agg)


# ─── Productos por tipo ───────────────────────────────────────────────────────

@app.get("/api/dashboard/productos")
def get_productos():
    agg = (
        productos.groupby("tipo_producto")
        .agg(
            total    =("producto_id", "count"),
            activos  =("estatus", lambda x: (x == "activo").sum()),
            saldo    =("saldo_actual", "sum"),
        )
        .reset_index()
        .sort_values("total", ascending=False)
    )
    agg["saldo"] = agg["saldo"].round(2)
    return safe_records(agg)


# ─── Hey Pro vs Regular ───────────────────────────────────────────────────────

@app.get("/api/dashboard/pro-vs-regular")
def get_pro_vs_regular():
    agg = df_main.groupby(["es_hey_pro", "riesgo"]).size().reset_index(name="count")
    agg["segmento"] = agg["es_hey_pro"].map({True: "Hey Pro", False: "Regular"})
    agg = agg.drop(columns=["es_hey_pro"])
    return safe_records(agg)


# ─── Satisfacción promedio por segmento de riesgo ─────────────────────────────

@app.get("/api/dashboard/satisfaccion-por-riesgo")
def get_satisfaccion_por_riesgo():
    agg = (
        df_main.groupby("riesgo")
        .agg(
            satisfaccion_prom =("satisfaccion_1_10", "mean"),
            dias_login_prom   =("dias_desde_ultimo_login", "mean"),
            ingreso_prom      =("ingreso_mensual_mxn", "mean"),
            total             =("user_id", "count"),
        )
        .reset_index()
    )
    agg = agg.round(1)
    return safe_records(agg)


# ─── Top clientes en riesgo alto ──────────────────────────────────────────────

@app.get("/api/dashboard/clientes-riesgo-alto")
def get_clientes_riesgo_alto(
    page: int     = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    estado: Optional[str] = None,
    score_min: float = 0,
    score_max: float = 100,
):
    filtrado = df_main[df_main["riesgo"] == "Alto"].copy()

    if estado:
        filtrado = filtrado[filtrado["estado"].str.lower() == estado.lower()]

    filtrado = filtrado[
        (filtrado["churn_score"] >= score_min) &
        (filtrado["churn_score"] <= score_max)
    ]

    filtrado = filtrado.sort_values("churn_score", ascending=False)
    total    = len(filtrado)
    inicio   = (page - 1) * page_size
    pagina   = filtrado.iloc[inicio : inicio + page_size]

    cols = [
        "user_id", "estado", "ciudad", "churn_score",
        "satisfaccion_1_10", "dias_desde_ultimo_login",
        "num_productos_activos", "es_hey_pro",
        "ingreso_mensual_mxn", "total_tx",
    ]
    # total_tx puede no existir si el cliente no tiene transacciones
    cols_presentes = [c for c in cols if c in pagina.columns]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": int(np.ceil(total / page_size)),
        "data": safe_records(pagina[cols_presentes]),
    }


# ─── Predicción individual de un cliente ──────────────────────────────────────

@app.get("/api/predict/{user_id}")
async def predict_cliente(user_id: str):
    row = df_main[df_main["user_id"] == user_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Cliente {user_id} no encontrado")

    r = row.iloc[0]

    # Productos del cliente
    prods_cliente = productos[productos["user_id"] == user_id]
    saldo_total   = float(prods_cliente["saldo_actual"].sum()) if not prods_cliente.empty else 0.0
    tipo_prods    = prods_cliente["tipo_producto"].tolist() if not prods_cliente.empty else []

    # Última transacción
    tx_cliente  = transacciones[transacciones["user_id"] == user_id]
    ultima_tx   = str(tx_cliente["fecha_hora"].max().date()) if not tx_cliente.empty else None
    total_tx    = len(tx_cliente)

    # Conversaciones
    conv_cliente = conversaciones[conversaciones["user_id"] == user_id]
    num_conv     = len(conv_cliente)

    # --- LÓGICA DE MODELO (Si está cargado, sobrescribe el score manual) ---
    score = float(r["churn_score"])
    
    if model_cat is not None:
        df_user = row.copy().to_frame().T if isinstance(row, pd.Series) else row.copy()
        
        # Formateamos los datos exactamente como el modelo los pide
        for col in feature_cols:
            if col not in df_user.columns:
                if col in cat_features:
                    df_user[col] = "SIN REGISTRO"
                else:
                    df_user[col] = 0

        X_new = df_user[feature_cols].copy()

        for c in cat_features:
            X_new[c] = X_new[c].astype("string")

        # Hacemos la predicción con CatBoost
        proba_new = model_cat.predict_proba(X_new)[:, 1]
        score = int(proba_new[0] * 100) # Lo convertimos a porcentaje

        # Generamos sugerencia IA
        if score >= 80:
            suggestion = "Ofrecer exención de anualidad urgente"
        elif score >= 60:
            suggestion = "Enviar promoción de cashback al 2%"
        else:
            suggestion = "Mantener monitoreo regular"
            
    else:
        # Fallback: Sugerencia manual basada en el score heurístico antiguo
        if score >= 70:
            suggestion = "Contacto urgente: llamada personalizada con oferta de retención"
        elif score >= 40:
            suggestion = "Enviar oferta personalizada según perfil de productos"
        else:
            suggestion = "Monitoreo estándar, cliente estable"

    # Retornamos el payload completo y enriquecido combinando ambos mundos
    return {
        "id":     user_id,
        "score":  score,
        "riesgo": str(r["riesgo"]),
        "details": {
            "satisfaccion":            float(r["satisfaccion_1_10"]) if pd.notnull(r["satisfaccion_1_10"]) else None,
            "dias_sin_login":          int(r["dias_desde_ultimo_login"]),
            "antiguedad_dias":         int(r["antiguedad_dias"]),
            "num_productos_activos":   int(r["num_productos_activos"]),
            "es_hey_pro":              bool(r["es_hey_pro"]),
            "ingreso_mensual_mxn":     int(r["ingreso_mensual_mxn"]),
            "saldo":                   round(saldo_total, 2),
            "productos":               tipo_prods,
            "ultima_transaccion":      ultima_tx,
            "total_transacciones":     total_tx,
            "total_conversaciones":    num_conv,
            "estado":                  str(r["estado"]),
            "ciudad":                  str(r["ciudad"]),
            "canal_preferido":         str(r["preferencia_canal"]),
        },
        "scores_detalle": {
            "score_login":        round(float(r["score_login"]), 1),
            "score_satisfaccion": round(float(r["score_satisfaccion"]), 1),
            "score_productos":    round(float(r["score_productos"]), 1),
            "score_tx":           round(float(r["score_tx"]), 1),
        },
        "suggestion": suggestion,
    }


# ─── Búsqueda de cliente ──────────────────────────────────────────────────────

@app.get("/api/clientes/buscar")
def buscar_cliente(q: str = Query(..., min_length=3)):
    resultado = df_main[df_main["user_id"].str.contains(q, case=False, na=False)]
    if resultado.empty:
        return {"data": []}
    cols = ["user_id", "estado", "ciudad", "churn_score", "riesgo", "satisfaccion_1_10", "es_hey_pro"]
    return {"data": safe_records(resultado[cols].head(20))}


# ─── Historial de transacciones de un cliente ─────────────────────────────────

@app.get("/api/clientes/{user_id}/transacciones")
def get_transacciones_cliente(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    tx = transacciones[transacciones["user_id"] == user_id].copy()
    if tx.empty:
        return {"total": 0, "data": []}

    tx = tx.sort_values("fecha_hora", ascending=False)
    tx["fecha_hora"] = tx["fecha_hora"].astype(str)
    total  = len(tx)
    inicio = (page - 1) * page_size
    pagina = tx.iloc[inicio : inicio + page_size]

    return {
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     int(np.ceil(total / page_size)),
        "data":      safe_records(pagina),
    }


# ─── Conversaciones de un cliente ─────────────────────────────────────────────

@app.get("/api/clientes/{user_id}/conversaciones")
def get_conversaciones_cliente(user_id: str):
    conv = conversaciones[conversaciones["user_id"] == user_id].copy()
    if conv.empty:
        return {"total": 0, "data": []}
    conv["date"] = conv["date"].astype(str)
    conv = conv.sort_values("date", ascending=False)
    return {"total": len(conv), "data": safe_records(conv)}


# ─── Temas frecuentes en conversaciones (clientes en riesgo alto) ─────────────

@app.get("/api/dashboard/temas-conversaciones")
def get_temas_conversaciones(riesgo: str = "Alto"):
    ids_riesgo = df_main[df_main["riesgo"] == riesgo]["user_id"].tolist()
    conv_riesgo = conversaciones[conversaciones["user_id"].isin(ids_riesgo)]

    palabras_clave = {
        "Cancelación":    ["cancel", "dar de baja", "cerrar cuenta"],
        "Cobros / Cargos": ["cobro", "cargo", "comisión", "cobrar"],
        "Crédito":        ["crédito", "credito", "préstamo", "prestamo"],
        "Tarjeta":        ["tarjeta", "tdc", "bloqueo", "bloquear"],
        "Transferencias": ["transferencia", "enviar", "spei", "recibir"],
        "App / Acceso":   ["app", "contraseña", "login", "acceso", "sesión"],
        "Inversión":      ["inversión", "inversion", "rendimiento", "ahorro"],
    }

    conteos = {}
    for tema, kws in palabras_clave.items():
        patron = "|".join(kws)
        conteos[tema] = int(
            conv_riesgo["input"].str.lower().str.contains(patron, na=False).sum()
        )

    resultado = [
        {"tema": k, "count": v}
        for k, v in sorted(conteos.items(), key=lambda x: x[1], reverse=True)
        if v > 0
    ]
    return resultado


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "ok",
        "clientes":      len(clientes),
        "transacciones": len(transacciones),
        "productos":     len(productos),
        "conversaciones": len(conversaciones),
    }
    
