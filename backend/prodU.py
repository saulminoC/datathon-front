from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
import os

router = APIRouter()

BASE_DIR = os.path.dirname(__file__)

# ── Carga de parquets ─────────────────────────────────────────────────────────
PRODS_PATH    = os.path.join(BASE_DIR, "productos_mas_utilizados.parquet")
CLIENTES_PATH = os.path.join(BASE_DIR, "ClientesCleanOF.parquet")

try:
    prods_df = pd.read_parquet(PRODS_PATH)
    print(f"[prodU] ✅ Productos cargado. Filas: {len(prods_df)} | Columnas: {prods_df.columns.tolist()}")
except Exception as e:
    prods_df = pd.DataFrame()
    print(f"[prodU] ❌ Error cargando productos parquet: {e}")

try:
    clientes_df = pd.read_parquet(CLIENTES_PATH)
    clientes_df["es_churn"] = clientes_df["UsuarioChurn"].str.strip().str.upper() == "CHURN"
    print(f"[prodU] ✅ Clientes cargado. Filas: {len(clientes_df)}")
except Exception as e:
    clientes_df = pd.DataFrame()
    print(f"[prodU] ❌ Error cargando clientes parquet: {e}")


# ── 1. Productos más utilizados ───────────────────────────────────────────────
@router.get("/productos-mas-utilizados")
def productos_mas_utilizados():
    if prods_df.empty:
        raise HTTPException(status_code=503, detail="Parquet de productos no disponible.")
    try:
        # Detectar columnas automáticamente
        cols = prods_df.columns.tolist()
        print(f"[prodU] Columnas productos: {cols}")

        # Intentar mapear columnas comunes
        col_producto = next((c for c in cols if 'producto' in c.lower() or 'nombre' in c.lower() or 'name' in c.lower()), cols[0])
        col_usos     = next((c for c in cols if 'uso' in c.lower() or 'count' in c.lower() or 'total' in c.lower() or 'cantidad' in c.lower()), cols[1] if len(cols) > 1 else col_producto)
        col_churn    = next((c for c in cols if 'churn' in c.lower()), None)

        records = []
        for _, row in prods_df.head(8).iterrows():
            records.append({
                "producto":  str(row[col_producto]),
                "usos":      int(row[col_usos]) if col_usos != col_producto else 0,
                "churn_pct": round(float(row[col_churn]), 1) if col_churn and pd.notna(row[col_churn]) else 0,
            })

        return {"data": records}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Mapa por estado ────────────────────────────────────────────────────────
@router.get("/mapa-estados")
def mapa_estados():
    if clientes_df.empty:
        raise HTTPException(status_code=503, detail="Parquet de clientes no disponible.")
    try:
        grp = clientes_df.groupby("estado").agg(
            clientes  = ("user_id",  "count"),
            churn_sum = ("es_churn", "sum"),
        ).reset_index()

        grp["churn_pct"] = (grp["churn_sum"] / grp["clientes"] * 100).round(1)

        records = grp[["estado", "clientes", "churn_pct"]].rename(
            columns={"estado": "nombre"}
        ).to_dict(orient="records")

        return {"data": records}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Edad vs Ingreso vs Churn ───────────────────────────────────────────────
@router.get("/edad-ingreso-churn")
def edad_ingreso_churn():
    if clientes_df.empty:
        raise HTTPException(status_code=503, detail="Parquet de clientes no disponible.")
    try:
        df = clientes_df.copy()

        bins   = [17, 25, 35, 45, 55, 65, 120]
        labels = ["18–25", "26–35", "36–45", "46–55", "56–65", "65+"]
        df["rango_edad"] = pd.cut(df["edad"], bins=bins, labels=labels)

        grp = df.groupby("rango_edad", observed=True).agg(
            ingreso_promedio = ("ingreso_mensual_mxn", "mean"),
            churn_sum        = ("es_churn",            "sum"),
            total            = ("user_id",             "count"),
        ).reset_index()

        grp["churn_pct"]        = (grp["churn_sum"] / grp["total"] * 100).round(1)
        grp["ingreso_promedio"] = grp["ingreso_promedio"].round(0).astype(int)

        records = grp[["rango_edad", "ingreso_promedio", "churn_pct", "total"]].to_dict(orient="records")
        # pd.Categorical -> str
        for r in records:
            r["rango_edad"] = str(r["rango_edad"])

        return {"data": records}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))