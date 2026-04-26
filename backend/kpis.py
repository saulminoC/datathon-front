import pandas as pd
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

# backend/kpis.py  →  BASE_DIR = backend/  →  parquet en backend/modelo/kpis.parquet
BASE_DIR = Path(__file__).parent
_PARQUET_PATH = BASE_DIR / "modelo" / "kpis.parquet"

print(f"[kpis] __file__       = {__file__}")
print(f"[kpis] BASE_DIR       = {BASE_DIR}")
print(f"[kpis] Buscando en    = {_PARQUET_PATH}")
print(f"[kpis] ¿Existe?       = {_PARQUET_PATH.exists()}")


def cargar_datos() -> pd.DataFrame | None:
    if _PARQUET_PATH.exists():
        df = pd.read_parquet(_PARQUET_PATH)
        df["mes"] = pd.to_datetime(df["mes"], errors="coerce")
        filas_antes = len(df)
        df = df.dropna(subset=["mes"])  # elimina filas con mes = NaN
        filas_dropped = filas_antes - len(df)
        if filas_dropped:
            print(f"[kpis] ⚠️  Se eliminaron {filas_dropped} filas con mes=NaN")
        print(f"[kpis] ✅ Parquet cargado. Filas: {len(df)} | Meses: {df['mes'].dt.strftime('%Y-%m').unique().tolist()}")
        return df
    print(f"[kpis] ❌ No se encontró el parquet en: {_PARQUET_PATH}")
    return None


df_kpis = cargar_datos()


def _get_df() -> pd.DataFrame:
    global df_kpis
    if df_kpis is None:
        df_kpis = cargar_datos()
    if df_kpis is None:
        raise HTTPException(
            status_code=500,
            detail=f"kpis.parquet no encontrado en {_PARQUET_PATH}. Verifica que el archivo exista.",
        )
    return df_kpis


# ── Meses disponibles ─────────────────────────────────────────────────────────

@router.get("/api/dashboard/meses")
async def get_meses():
    df = _get_df()
    meses = (
        df["mes"]
        .dt.strftime("%Y-%m")
        .drop_duplicates()
        .sort_values(ascending=False)
        .tolist()
    )
    return {"meses": meses}


# ── KPIs globales ─────────────────────────────────────────────────────────────

@router.get("/api/dashboard/global-kpis")
async def get_global_kpis(mes_filtro: str = Query("2026-04")):
    # ... (carga de datos igual) ...
    def get_metrics(df):
        if df.empty: return 0, 0, 0, 0 # Agregamos un 0
        return (
            float(df['monto_total'].sum()),
            int(df['num_inputs'].sum()),
            int(df['nuevos_churn'].sum()),
            int(df['num_transacciones'].sum()) # NUEVA COLUMNA
        )

    m_act, i_act, c_act, t_act = get_metrics(df_actual)
    m_pre, i_pre, c_pre, t_pre = get_metrics(df_previo)

    return {
        "monto_total": calc_diff(m_act, m_pre),
        "num_inputs": calc_diff(i_act, i_pre),
        "nuevos_churns": calc_diff(c_act, c_pre, invertido=True),
        "num_transacciones": calc_diff(t_act, t_pre) # NUEVO KPI
    }