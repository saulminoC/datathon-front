from fastapi import APIRouter, HTTPException, Query, UploadFile, File
import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import json
import io

# Importante: No le ponemos prefijo aquí, se lo pondremos en el main
router = APIRouter()

# Localizamos la raíz del backend para que no se pierda buscando archivos
BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Carga del modelo ────────────────────────────────────────────────────────
try:
    print("Cargando cerebro CatBoost...")
    model_cat    = joblib.load(BASE_DIR / "modelo" / "catboost_churn_model.pkl")
    feature_cols = joblib.load(BASE_DIR / "modelo" / "feature_columns.pkl")
    cat_features = joblib.load(BASE_DIR / "modelo" / "cat_features.pkl")
    with open(BASE_DIR / "modelo" / "dtypes.json") as f:
        dtypes_json = json.load(f)
    print("¡Modelo IA cargado con éxito! 🚀")
except Exception as e:
    print(f"Advertencia: No se pudo cargar el modelo. Error: {e}")
    model_cat = None

# ─── Carga de datos ───────────────────────────────────────────────────────────
clientes       = pd.read_parquet(BASE_DIR / "ClientesCleanOF.parquet")
productos      = pd.read_parquet(BASE_DIR / "ProductosClean.parquet")
transacciones  = pd.read_parquet(BASE_DIR / "TransaccionesClean.parquet")
conversaciones = pd.read_parquet(BASE_DIR / "ConversasionesClean.parquet")

transacciones["fecha_hora"]  = pd.to_datetime(transacciones["fecha_hora"])
productos["fecha_apertura"]  = pd.to_datetime(productos["fecha_apertura"])
conversaciones["date"]       = pd.to_datetime(conversaciones["date"])

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
    df["churn_score"]        = (df["score_login"] + df["score_satisfaccion"] + df["score_productos"] + df["score_tx"]).round(1)
    df["riesgo"] = pd.cut(df["churn_score"], bins=[0, 30, 60, 100], labels=["Bajo", "Medio", "Alto"])
    return df

df_main = calcular_churn(clientes, transacciones)

def safe_records(df: pd.DataFrame) -> list:
    return df.where(pd.notnull(df), None).to_dict(orient="records")

# ─── Predicción batch (Excel/CSV) ────────────────────────────────────────────
@router.post("/batch")
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
@router.get("/{user_id}")
async def predict_cliente(user_id: str):
    row = df_main[df_main["user_id"] == user_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Cliente {user_id} no encontrado")

    r = row.iloc[0]
    score = float(r["churn_score"])
    
    # ... (Si necesitas toda la lógica de sugerencias que tenías antes, puedes pegarla aquí) ...
    suggestion = "Contacto urgente" if score >= 70 else "Monitoreo estándar"

    return {
        "id": user_id,
        "score": score,
        "riesgo": str(r["riesgo"]),
        "suggestion": suggestion
    }