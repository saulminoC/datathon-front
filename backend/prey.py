#%matplotlib inline
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Cargar el DataFrame
df = pd.read_parquet("ClientesCleanOF.parquet")

# 1. Crear la figura y los ejes
fig, ax = plt.subplots(figsize=(10, 6))

# 2. Generar el gráfico de dispersión (Scatter plot)
sns.scatterplot(
    data=df,
    x="edad",
    y="ingreso_mensual_mxn",
    hue="UsuarioChurn",
    palette={"CHURN": "#e74c3c", "NO CHURN": "#2ecc71"}, # Ajusta los textos si tus datos dicen otra cosa (ej. "Si"/"No")
    alpha=0.6,      # Transparencia vital para ver "clústers" cuando los puntos se amontonan
    edgecolor=None, # Quitar bordes de los puntos para mayor limpieza visual
    s=40,           # Tamaño de los puntos
    ax=ax
)

# 3. Personalizar etiquetas y título
ax.set_title("Relación entre Edad e Ingreso Mensual vs. Churn", fontsize=14, pad=15)
ax.set_xlabel("Edad (Años)", fontsize=12)
ax.set_ylabel("Ingreso Mensual Estimado (MXN)", fontsize=12)

# 4. Formatear el eje Y para que los miles tengan coma (ej. 15000 -> 15,000)
ax.get_yaxis().set_major_formatter(plt.FuncFormatter(lambda x, loc: f"${int(x):,}"))

# Quitar los bordes superior y derecho
sns.despine()

# Ajustar los márgenes automáticamente
plt.tight_layout()

# 5. Mostrar la gráfica
plt.show()