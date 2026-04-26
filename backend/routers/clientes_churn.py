from fastapi import APIRouter
import pandas as pd
from pathlib import Path

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
_PARQUET_CLIENTES = BASE_DIR / "modelo" / "ClientesCleanOF.parquet"
_PARQUET_CHURN_COUNTS = BASE_DIR / "modelo" / "usuario_churn_counts.parquet"


def _leer(path: Path) -> pd.DataFrame | None:
    if path.exists():
        return pd.read_parquet(path)
    print(f"[clientes-churn] ❌ No encontrado: {path}")
    return None


# --- CHURN VS NO CHURN (dona / barra) ---
@router.get("/clientes-churn")
async def get_clientes_churn():
    """
    Devuelve el conteo de clientes Churn vs No Churn.
    Fuente: ClientesCleanOF.parquet  →  columna 'UsuarioChurn'
    """
    try:
        df = _leer(_PARQUET_CLIENTES)
        if df is None:
            return []

        conteo = df["UsuarioChurn"].value_counts()
        return [
            {"status": "No Churn", "cantidad": int(conteo.get(0, 0))},
            {"status": "Churn",    "cantidad": int(conteo.get(1, 0))},
        ]
    except Exception as e:
        print(f"[clientes-churn] Error en get_clientes_churn: {e}")
        return []


# --- CHURN POR MES (línea de tiempo) ---
@router.get("/churn-por-mes")
async def get_churn_por_mes():
    """
    Devuelve la evolución mensual de usuarios en churn.
    Fuente: usuario_churn_counts.parquet
    """
    try:
        df = _leer(_PARQUET_CHURN_COUNTS)
        if df is None:
            return []

        # Normaliza nombre de columnas a minúsculas por seguridad
        df.columns = [c.lower() for c in df.columns]

        # Aseguramos que 'mes' sea string tipo '2025-01'
        if "mes" in df.columns:
            df["mes"] = pd.to_datetime(df["mes"], errors="coerce").dt.strftime("%Y-%m")
            df = df.dropna(subset=["mes"])

        return df.sort_values("mes").to_dict(orient="records")
    except Exception as e:
        print(f"[clientes-churn] Error en get_churn_por_mes: {e}")
        return []