from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import joblib
import json
import io

from kpis import router as kpis_router
from routers.dashboard import router as dashboard_router

from routers import dashboard
# from routers import clientes  <-- (Descomenta esto cuando muevas el código de clientes a routers/clientes.py)
# from routers import predict   <-- (Descomenta esto cuando muevas el código predictivo a routers/predict.py)
from kpis import router as kpis_router

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Havi Insights API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpis_router)
app.include_router(dashboard_router)

# ─── Carga del modelo ────────────────────────────────────────────────────────

try:
    print("Cargando cerebro CatBoost...")
    model_cat    = joblib.load("modelo/catboost_churn_model.pkl")
    feature_cols = joblib.load("modelo/feature_columns.pkl")
    cat_features = joblib.load("modelo/cat_features.pkl")
    with open("modelo/dtypes.json") as f:
        dtypes_json = json.load(f)
    print("¡Modelo IA cargado con éxito! 🚀")
except Exception as e:
    print(f"Advertencia: No se pudo cargar el modelo. Error: {e}")
    model_cat = None

# ─── Carga de datos ───────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent

clientes      = pd.read_parquet(BASE_DIR / "ClientesCleanOF.parquet")
productos     = pd.read_parquet(BASE_DIR / "ProductosClean.parquet")
transacciones = pd.read_parquet(BASE_DIR / "TransaccionesClean.parquet")
conversaciones = pd.read_parquet(BASE_DIR / "ConversasionesClean.parquet")

transacciones["fecha_hora"]  = pd.to_datetime(transacciones["fecha_hora"])
productos["fecha_apertura"]  = pd.to_datetime(productos["fecha_apertura"])
conversaciones["date"]       = pd.to_datetime(conversaciones["date"])

# ─── Cálculo del churn score ─────────────────────────────────────────────────

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
    df["score_login"]        = (df["dias_desde_ultimo_login"].clip(0, 90) / 90) * 35
    df["score_satisfaccion"] = ((10 - df["satisfaccion_1_10"].fillna(5)) / 9) * 25
    df["score_productos"]    = ((5 - df["num_productos_activos"].clip(0, 5)) / 5) * 20
    df["score_tx"]           = (df["dias_sin_tx"].fillna(90).clip(0, 90) / 90) * 20
    df["churn_score"]        = (
        df["score_login"] + df["score_satisfaccion"] + df["score_productos"] + df["score_tx"]
    ).round(1)
    df["riesgo"] = pd.cut(
        df["churn_score"],
        bins=[0, 30, 60, 100],
        labels=["Bajo", "Medio", "Alto"],
    )
    return df

df_main = calcular_churn(clientes, transacciones)

def safe_records(df: pd.DataFrame) -> list:
    return df.where(pd.notnull(df), None).to_dict(orient="records")

# ─── Predicción batch (Excel/CSV) ────────────────────────────────────────────

@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    if model_cat is None:
        raise HTTPException(status_code=500, detail="Modelo no cargado.")
    try:
        contents = await file.read()
        try:
            df_nuevo = pd.read_csv(io.BytesIO(contents))
        except:
            df_nuevo = pd.read_csv(io.BytesIO(contents), sep=';')

        df_new = df_nuevo.copy()
        for col in feature_cols:
            if col not in df_new.columns:
                df_new[col] = "SIN REGISTRO" if col in cat_features else 0

        X_new = df_new[feature_cols].copy()
        for c in cat_features:
            X_new[c] = X_new[c].astype("string")

        proba_new = model_cat.predict_proba(X_new)[:, 1]

        df_final = pd.DataFrame({
            "user_id":               df_new.get("user_id", [f"N-{i}" for i in range(len(X_new))]),
            "edad":                  df_new.get("edad", 0),
            "num_productos_activos": df_new.get("num_productos_activos", 0),
            "satisfaccion_1_10":     df_new.get("satisfaccion_1_10", 0),
            "ingreso_mensual_mxn":   df_new.get("ingreso_mensual_mxn", 0),
            "prob_churn":            (proba_new * 100).astype(int),
            "ciudad":                df_new.get("ciudad", "Desconocida"),
        })

        top_cities   = df_final.groupby("ciudad")["prob_churn"].mean().sort_values(ascending=False).head(5).reset_index()
        scatter_data = df_final[["ingreso_mensual_mxn", "prob_churn"]].to_dict(orient="records")

        return {
            "table_data":  df_final.sort_values("prob_churn", ascending=False).head(10).to_dict(orient="records"),
            "top_cities":  top_cities.to_dict(orient="records"),
            "summary": {
                "total_registros": len(df_final),
                "promedio_churn":  float(df_final["prob_churn"].mean()),
            },
            "scatter_data": scatter_data,
        }
    except Exception as e:
        print(f"Error en el motor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Predicción individual ───────────────────────────────────────────────────

@app.get("/api/predict/{user_id}")
async def predict_cliente(user_id: str):
    row = df_main[df_main["user_id"] == user_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Cliente {user_id} no encontrado")

    r = row.iloc[0]

    prods_cliente = productos[productos["user_id"] == user_id]
    saldo_total   = float(prods_cliente["saldo_actual"].sum()) if not prods_cliente.empty else 0.0
    tipo_prods    = prods_cliente["tipo_producto"].tolist() if not prods_cliente.empty else []

    tx_cliente = transacciones[transacciones["user_id"] == user_id]
    ultima_tx  = str(tx_cliente["fecha_hora"].max().date()) if not tx_cliente.empty else None
    total_tx   = len(tx_cliente)

    conv_cliente = conversaciones[conversaciones["user_id"] == user_id]
    num_conv     = len(conv_cliente)

    score = float(r["churn_score"])

    if model_cat is not None:
        df_user = row.copy()
        for col in feature_cols:
            if col not in df_user.columns:
                df_user[col] = "SIN REGISTRO" if col in cat_features else 0

        X_new = df_user[feature_cols].copy()
        for c in cat_features:
            X_new[c] = X_new[c].astype("string")

        proba_new  = model_cat.predict_proba(X_new)[:, 1]
        score      = int(proba_new[0] * 100)
        suggestion = (
            "Ofrecer exención de anualidad urgente" if score >= 80
            else "Enviar promoción de cashback al 2%" if score >= 60
            else "Mantener monitoreo regular"
        )
    else:
        suggestion = (
            "Contacto urgente: llamada personalizada con oferta de retención" if score >= 70
            else "Enviar oferta personalizada según perfil de productos" if score >= 40
            else "Monitoreo estándar, cliente estable"
        )

    return {
        "id":     user_id,
        "score":  score,
        "riesgo": str(r["riesgo"]),
        "details": {
            "satisfaccion":          float(r["satisfaccion_1_10"]) if pd.notnull(r["satisfaccion_1_10"]) else None,
            "dias_sin_login":        int(r["dias_desde_ultimo_login"]),
            "antiguedad_dias":       int(r["antiguedad_dias"]),
            "num_productos_activos": int(r["num_productos_activos"]),
            "es_hey_pro":            bool(r["es_hey_pro"]),
            "ingreso_mensual_mxn":   int(r["ingreso_mensual_mxn"]),
            "saldo":                 round(saldo_total, 2),
            "productos":             tipo_prods,
            "ultima_transaccion":    ultima_tx,
            "total_transacciones":   total_tx,
            "total_conversaciones":  num_conv,
            "estado":                str(r["estado"]),
            "ciudad":                str(r["ciudad"]),
            "canal_preferido":       str(r["preferencia_canal"]),
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

# ─── Transacciones de un cliente ─────────────────────────────────────────────

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
    return {
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     int(np.ceil(total / page_size)),
        "data":      safe_records(tx.iloc[inicio: inicio + page_size]),
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

# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status":        "ok",
        "clientes":      len(clientes),
        "transacciones": len(transacciones),
        "productos":     len(productos),
        "conversaciones": len(conversaciones),
    }