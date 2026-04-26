from fastapi import APIRouter
import pandas as pd
from pathlib import Path
import os

router = APIRouter()

# Como reim.py está en la raíz de backend, el parent es backend/
BASE_DIR = Path(__file__).resolve().parent

def cargar_datos():
    # Buscamos en todas las combinaciones posibles
    rutas = [
        BASE_DIR / "modelo" / "ClientesCleanOF.parquet",
        BASE_DIR / "ClientesCleanOF.parquet",
        Path("modelo/ClientesCleanOF.parquet"),
        Path("ClientesCleanOF.parquet")
    ]
    for r in rutas:
        if r.exists():
            return pd.read_parquet(r)
            
    print("❌ ERROR CRÍTICO: No encontré ClientesCleanOF.parquet en ninguna ruta.")
    return None

@router.get("/scatter-edad-ingreso")
async def get_scatter_data():
    try:
        df = cargar_datos()
        if df is None: 
            return []

        # Tomamos 800 clientes al azar para no trabar el navegador
        sample_df = df.sample(n=min(800, len(df)), random_state=42).copy()
        
        # Mapeamos usando tu columna real 'UsuarioChurn'
        sample_df['status'] = sample_df['UsuarioChurn'].apply(
            lambda x: 'CHURN' if str(x) in ['1', '1.0', 'CHURN'] else 'NO CHURN'
        )

        # Preparamos las 3 columnas exactas que React espera
        scatter_data = sample_df[['edad', 'ingreso_mensual_mxn', 'status']].rename(
            columns={'ingreso_mensual_mxn': 'ingreso'}
        )

        return scatter_data.to_dict(orient="records")
        
    except Exception as e:
        print(f"❌ Error interno en scatter: {e}")
        return []