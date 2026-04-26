import pandas as pd 
df = pd.read_parquet('ClientesCleanOF.parquet') 
print(df.columns.tolist())
