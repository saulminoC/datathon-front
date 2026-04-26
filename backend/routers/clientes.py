from fastapi import APIRouter, Query
from typing import Optional
import numpy as np
from database import df_main, transacciones, conversaciones, safe_records

router = APIRouter(prefix="/api/clientes")

@router.get("/buscar")
def buscar_cliente(q: str = Query(..., min_length=3)):
    resultado = df_main[df_main["user_id"].str.contains(q, case=False, na=False)]
    cols = ["user_id","estado","ciudad","churn_score","riesgo","satisfaccion_1_10","es_hey_pro"]
    return {"data": safe_records(resultado[cols].head(20)) if not resultado.empty else []}

@router.get("/riesgo-alto")
def get_clientes_riesgo_alto(
    page: int = Query(1, ge=1), page_size: int = Query(15, ge=1, le=100),
    estado: Optional[str] = None, score_min: float = 0, score_max: float = 100,
):
    filtrado = df_main[df_main["riesgo"] == "Alto"].copy()
    if estado:
        filtrado = filtrado[filtrado["estado"].str.lower() == estado.lower()]
    filtrado = filtrado[(filtrado["churn_score"] >= score_min) & (filtrado["churn_score"] <= score_max)]
    filtrado = filtrado.sort_values("churn_score", ascending=False)
    total  = len(filtrado)
    inicio = (page - 1) * page_size
    cols   = ["user_id","estado","ciudad","churn_score","satisfaccion_1_10",
              "dias_desde_ultimo_login","num_productos_activos","es_hey_pro","ingreso_mensual_mxn","total_tx"]
    cols_presentes = [c for c in cols if c in filtrado.columns]
    return {"total":total,"page":page,"page_size":page_size,
            "pages":int(np.ceil(total/page_size)),"data":safe_records(filtrado.iloc[inicio:inicio+page_size][cols_presentes])}

@router.get("/{user_id}/transacciones")
def get_transacciones_cliente(user_id: str, page: int = Query(1,ge=1), page_size: int = Query(20,ge=1,le=100)):
    tx = transacciones[transacciones["user_id"] == user_id].copy()
    if tx.empty:
        return {"total":0,"data":[]}
    tx = tx.sort_values("fecha_hora", ascending=False)
    tx["fecha_hora"] = tx["fecha_hora"].astype(str)
    total  = len(tx)
    inicio = (page-1)*page_size
    return {"total":total,"page":page,"page_size":page_size,
            "pages":int(np.ceil(total/page_size)),"data":safe_records(tx.iloc[inicio:inicio+page_size])}

@router.get("/{user_id}/conversaciones")
def get_conversaciones_cliente(user_id: str):
    conv = conversaciones[conversaciones["user_id"] == user_id].copy()
    if conv.empty:
        return {"total":0,"data":[]}
    conv["date"] = conv["date"].astype(str)
    return {"total":len(conv),"data":safe_records(conv.sort_values("date",ascending=False))}