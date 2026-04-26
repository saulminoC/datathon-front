from fastapi import APIRouter, Query
import pandas as pd
import os
from pathlib import Path

router = APIRouter() # El prefijo se controla desde main.py para evitar errores 404

# Localizar la carpeta modelo correctamente
BASE_DIR = Path(__file__).resolve().parent.parent

def leer_parquet_seguro(nombre):
    rutas = [
        BASE_DIR / "modelo" / nombre,
        BASE_DIR / nombre,
        Path(nombre)
    ]
    for r in rutas:
        if r.exists():
            return pd.read_parquet(r)
    return None

# --- GRAFICA 1: CHURN VS NO CHURN ---
@router.get("/api/dashboard/clientes-churn")
async def get_clientes_churn():
    try:
        df = leer_parquet_seguro("ClientesCleanOF.parquet")
        if df is None: return []
        conteo = df['UsuarioChurn'].value_counts()
        return [
            {"status": "No Churn", "cantidad": int(conteo.get(0, 0))},
            {"status": "Churn", "cantidad": int(conteo.get(1, 0))}
        ]
    except: return []

# --- GRAFICA 2: MOTIVOS (TOP 3 INPUTS) ---
@router.get("/api/dashboard/conversaciones-motivos")
async def get_conversaciones():
    try:
        # Usamos el archivo que mandó Diego
        df = leer_parquet_seguro("top3_inputs_por_mes.parquet")
        if df is None: return []
        # Pivotamos para que cada input sea una columna
        pivoted = df.pivot(index='mes', columns='input', values='cantidad').fillna(0).reset_index()
        return pivoted.to_dict(orient="records")
    except: return []

# --- GRAFICA 3: TRANSACCIONES (OPERACIONES) ---
@router.get("/api/dashboard/transacciones-mensuales")
async def get_transacciones():
    try:
        # Usamos el archivo que mandó Diego
        df = leer_parquet_seguro("top3_operaciones_por_mes.parquet")
        if df is None: return []
        # Pivotamos por tipo de operacion
        pivoted = df.pivot(index='mes', columns='tipo_operacion', values='monto').fillna(0)
        pivoted['total'] = pivoted.sum(axis=1)
        # Convertimos a millones y devolvemos
        return (pivoted / 1_000_000).round(2).reset_index().to_dict(orient="records")
    except: return []

# --- LISTA DE MESES PARA EL SELECTOR ---
@router.get("/api/dashboard/meses")
async def get_meses():
    try:
        df = leer_parquet_seguro("kpis.parquet")
        if df is None: return {"meses": []}
        meses = sorted(pd.to_datetime(df['mes']).dt.strftime('%Y-%m').unique().tolist(), reverse=True)
        return {"meses": meses}
    except: return {"meses": []}