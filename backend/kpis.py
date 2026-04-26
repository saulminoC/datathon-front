import pandas as pd
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException
from dateutil.relativedelta import relativedelta

router = APIRouter()

BASE_DIR = Path(__file__).parent
_PARQUET_PATH = BASE_DIR / "kpis-2.parquet"


print(f"[kpis] __file__       = {__file__}")
print(f"[kpis] BASE_DIR       = {BASE_DIR}")
print(f"[kpis] Buscando en    = {_PARQUET_PATH}")
print(f"[kpis] ¿Existe?       = {_PARQUET_PATH.exists()}")


def cargar_datos() -> pd.DataFrame | None:
    if _PARQUET_PATH.exists():
        df = pd.read_parquet(_PARQUET_PATH)
        df["mes"] = pd.to_datetime(df["mes"], errors="coerce")
        filas_antes = len(df)
        df = df.dropna(subset=["mes"])
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
async def get_global_kpis(mes_filtro: str = Query("2025-12")):
    df = _get_df()

    # ── Parsear el mes solicitado ──────────────────────────────────────────────
    try:
        mes_actual = pd.to_datetime(mes_filtro + "-01")
    except Exception:
        raise HTTPException(status_code=400, detail=f"Formato de mes inválido: '{mes_filtro}'. Usa YYYY-MM.")

    mes_previo = mes_actual - relativedelta(months=1)

    # ── Filtrar filas por mes ──────────────────────────────────────────────────
    df_actual = df[df["mes"].dt.to_period("M") == mes_actual.to_period("M")]
    df_previo = df[df["mes"].dt.to_period("M") == mes_previo.to_period("M")]

    # ── Extraer métricas ───────────────────────────────────────────────────────
    def get_metrics(sub: pd.DataFrame):
        if sub.empty:
            return 0.0, 0, 0, 0
        return (
            float(sub["monto_total"].sum()),
            int(sub["num_inputs"].sum()),
            int(sub["nuevos_churn"].sum()),
            int(sub["num_transacciones"].sum()),
        )

    m_act, i_act, c_act, t_act = get_metrics(df_actual)
    m_pre, i_pre, c_pre, t_pre = get_metrics(df_previo)

    # ── Calcular diferencia porcentual ────────────────────────────────────────
    def calc_diff(actual: float, previo: float, invertido: bool = False) -> dict:
        """
        Devuelve el valor actual + porcentaje de cambio vs mes previo.
        invertido=True significa que bajar es bueno (ej: churns).
        """
        if previo == 0:
            pct = 100.0 if actual > 0 else 0.0
        else:
            pct = round(((actual - previo) / abs(previo)) * 100, 1)

        es_bueno = (pct >= 0) if not invertido else (pct <= 0)

        return {
            "valor":      actual,
            "porcentaje": pct,
            "es_bueno":   es_bueno,
        }

    return {
        "monto_total":       calc_diff(m_act, m_pre),
        "num_inputs":        calc_diff(i_act, i_pre),
        "nuevos_churns":     calc_diff(c_act, c_pre, invertido=True),
        "num_transacciones": calc_diff(t_act, t_pre),
    }