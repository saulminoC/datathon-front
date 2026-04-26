from fastapi import APIRouter, HTTPException
import pandas as pd
import os

router = APIRouter()

# ── Carga del DataFrame de clientes ──────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
CLIENTES_PATH = os.path.join(BASE_DIR, "ClientesCleanOF.parquet")

try:
    clientes_df = pd.read_parquet(CLIENTES_PATH)
    print(f"[riesgo_alto] ✅ Parquet cargado. Filas: {len(clientes_df)}")
except Exception as e:
    clientes_df = pd.DataFrame()
    print(f"[riesgo_alto] ❌ Error cargando parquet: {e}")


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.get("/clientes-riesgo-alto")
def clientes_riesgo_alto(page_size: int = 20):
    """
    Devuelve los clientes con mayor probabilidad de churn,
    ordenados de mayor a menor riesgo.
    """
    if clientes_df.empty:
        raise HTTPException(
            status_code=503,
            detail="DataFrame de clientes no disponible. Verifica el archivo parquet."
        )

    try:
        df = clientes_df.copy()

        # UsuarioChurn viene en 0-1, lo convertimos a 0-100
        df["churn_score"] = df["UsuarioChurn"].apply(
            lambda x: 95.0 if str(x).strip().upper() == "CHURN" else 20.0
        )

        # total_tx no existe en el parquet, la ponemos en 0
        df["total_tx"] = 0

        df_alto = (
            df[df["churn_score"] >= 60]
            .sort_values("churn_score", ascending=False)
            .head(page_size)
        )

        records = df_alto[[
            "user_id",
            "estado",
            "ciudad",
            "churn_score",
            "satisfaccion_1_10",
            "dias_desde_ultimo_login",
            "num_productos_activos",
            "total_tx",
            "ingreso_mensual_mxn",
        ]].fillna(0).to_dict(orient="records")

        return {"data": records, "total": len(records)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))