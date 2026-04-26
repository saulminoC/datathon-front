from fastapi import APIRouter
import pandas as pd
from pathlib import Path

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent

MESES_ES = {
    "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
}

def leer_parquet_seguro(nombre: str) -> pd.DataFrame | None:
    for ruta in [BASE_DIR / "modelo" / nombre, BASE_DIR / nombre]:
        if ruta.exists():
            print(f"[dashboard] ✅ {ruta}")
            return pd.read_parquet(ruta)
    print(f"[dashboard] ❌ No encontrado: {nombre}")
    return None


def mes_a_str(serie: pd.Series) -> pd.Series:
    """Convierte fecha/periodo a 'Ene 2025', 'Feb 2025', etc."""
    try:
        dt = pd.to_datetime(serie.astype(str))
        return dt.apply(lambda d: f"{MESES_ES[d.strftime('%m')]} {d.year}")
    except Exception:
        return serie.astype(str)


# ── GRÁFICA 1: Churn vs No Churn ─────────────────────────────────────────────
# usuario_churn_counts.parquet → UsuarioChurn (0/1/bool), count

@router.get("/api/dashboard/clientes-churn")
async def get_clientes_churn():
    try:
        df = leer_parquet_seguro("usuario_churn_counts.parquet")
        if df is None:
            return []

        df["_key"] = df["UsuarioChurn"].str.strip().str.upper()

        no_churn = int(df.loc[df["_key"] == "NO CHURN", "count"].sum())
        churn    = int(df.loc[df["_key"] == "CHURN",    "count"].sum())

        print(f"[churn] No Churn={no_churn} | Churn={churn}")
        return [
            {"status": "Churn",    "cantidad": churn},
            {"status": "No Churn", "cantidad": no_churn},
        ]
    except Exception as e:
        print(f"[dashboard] Error clientes-churn: {e}")
        return []

# ── GRÁFICA 2: Motivos por Mes ────────────────────────────────────────────────
# top3_inputs_por_mes.parquet → month (Period/date), input, count

@router.get("/api/dashboard/conversaciones-motivos")
async def get_conversaciones():
    try:
        df = leer_parquet_seguro("top3_inputs_por_mes.parquet")
        if df is None:
            return []

        # Convertimos month a string legible
        df["mes"] = mes_a_str(df["month"])

        pivoted = (
            df.pivot_table(index="mes", columns="input", values="count", aggfunc="sum")
            .fillna(0)
            .reset_index()
        )
        pivoted.columns.name = None

        # Convertimos floats a int para que el tooltip sea limpio
        for col in pivoted.columns:
            if col != "mes":
                pivoted[col] = pivoted[col].astype(int)

        return pivoted.sort_values("mes").to_dict(orient="records")
    except Exception as e:
        print(f"[dashboard] Error conversaciones-motivos: {e}")
        return []


# ── GRÁFICA 3: Transacciones Mensuales ───────────────────────────────────────
# top3_operaciones_por_mes.parquet → month (Period/date), tipo_operacion, monto

@router.get("/api/dashboard/transacciones-mensuales")
async def get_transacciones():
    try:
        df = leer_parquet_seguro("top3_operaciones_por_mes.parquet")
        if df is None:
            return []

        # Convertimos month a string legible
        df["mes"] = mes_a_str(df["month"])

        pivoted = (
            df.pivot_table(index="mes", columns="tipo_operacion", values="monto", aggfunc="sum")
            .fillna(0)
        )
        pivoted["total"] = pivoted.sum(axis=1)

        # A millones con 2 decimales
        pivoted = (pivoted / 1_000_000).round(2).reset_index()
        pivoted.columns.name = None

        return pivoted.sort_values("mes").to_dict(orient="records")
    except Exception as e:
        print(f"[dashboard] Error transacciones-mensuales: {e}")
        return []


# ── Lista de meses ────────────────────────────────────────────────────────────

@router.get("/api/dashboard/meses")
async def get_meses():
    try:
        df = leer_parquet_seguro("kpis-2.parquet")
        if df is None:
            return {"meses": []}
        meses = sorted(
            pd.to_datetime(df["mes"]).dt.strftime("%Y-%m").dropna().unique().tolist(),
            reverse=True,
        )
        return {"meses": meses}
    except Exception as e:
        print(f"[dashboard] Error meses: {e}")
        return {"meses": []}