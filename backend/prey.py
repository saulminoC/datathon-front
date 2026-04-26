import pandas as pd
# Asegúrate de poner la ruta correcta hacia tu archivo
df = pd.read_parquet("C:/Users/saul_/datathon-front/backend/ProductosClean.parquet")
print(df.columns)