import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent

clientes       = pd.read_parquet(BASE_DIR / "ClientesCleanOF.parquet")
productos      = pd.read_parquet(BASE_DIR / "ProductosClean.parquet")
transacciones  = pd.read_parquet(BASE_DIR / "TransaccionesClean.parquet")
conversaciones = pd.read_parquet(BASE_DIR / "ConversasionesClean.parquet")

transacciones["fecha_hora"] = pd.to_datetime(transacciones["fecha_hora"])
productos["fecha_apertura"] = pd.to_datetime(productos["fecha_apertura"])
conversaciones["date"]      = pd.to_datetime(conversaciones["date"])

def calcular_churn(clientes_df, transacciones_df):
    fecha_max = transacciones_df["fecha_hora"].max()
    tx_por_cliente = (
        transacciones_df.groupby("user_id")
        .agg(total_tx=("monto","count"), monto_total=("monto","sum"), ultima_tx=("fecha_hora","max"))
        .reset_index()
    )
    tx_por_cliente["dias_sin_tx"] = (fecha_max - tx_por_cliente["ultima_tx"]).dt.days
    df = clientes_df.merge(tx_por_cliente, on="user_id", how="left")
    df["score_login"]        = (df["dias_desde_ultimo_login"].clip(0,90) / 90) * 35
    df["score_satisfaccion"] = ((10 - df["satisfaccion_1_10"].fillna(5)) / 9) * 25
    df["score_productos"]    = ((5 - df["num_productos_activos"].clip(0,5)) / 5) * 20
    df["score_tx"]           = (df["dias_sin_tx"].fillna(90).clip(0,90) / 90) * 20
    df["churn_score"]        = (df["score_login"] + df["score_satisfaccion"] + df["score_productos"] + df["score_tx"]).round(1)
    df["riesgo"] = pd.cut(df["churn_score"], bins=[0,30,60,100], labels=["Bajo","Medio","Alto"])
    return df

df_main = calcular_churn(clientes, transacciones)

def safe_records(df):
    return df.where(pd.notnull(df), None).to_dict(orient="records")