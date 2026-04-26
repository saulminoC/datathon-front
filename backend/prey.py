import pandas as pd
import os

# Lista de tus archivos
files = [
    "ClientesCleanOF.parquet", 
    "ConversasionesClean.parquet", 
    "TransaccionesClean.parquet"
]

print("🔍 EXPLORADOR DE COLUMNAS HAVI\n" + "="*30)

for f in files:
    # Ajusta la ruta si tus archivos están dentro de 'modelo/'
    ruta = f"modelo/{f}" if os.path.exists(f"modelo/{f}") else f
    
    if os.path.exists(ruta):
        df = pd.read_parquet(ruta)
        print(f"\n📄 ARCHIVO: {f}")
        print(f"✅ COLUMNAS: {df.columns.tolist()}")
    else:
        print(f"\n❌ NO ENCONTRADO: {f}")

print("\n" + "="*30)