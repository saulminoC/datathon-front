import pandas as pd
import joblib
import json

# Cargar artefactos
model = joblib.load("catboost_churn_model.pkl")
feature_cols = joblib.load("feature_columns.pkl")
cat_features = joblib.load("cat_features.pkl")

with open("dtypes.json") as f:
    dtypes = json.load(f)

# df_new: tu nuevo dataset con las MISMAS columnas lógicas (sin user_id si no lo necesitas para salida)
df_new = df_nuevo.copy()
#boton para cargar archivo
#boton para cargar las graficas

# Asegurar que tenga todas las columnas (si falta alguna, crearla)
for col in feature_cols:
    if col not in df_new.columns:
        # numéricas -> 0, categóricas -> "SIN REGISTRO", booleanas -> False
        if col in cat_features:
            df_new[col] = "SIN REGISTRO"
        else:
            df_new[col] = 0

# Ordenar columnas
X_new = df_new[feature_cols].copy()

# Tipos
for c in cat_features:
    X_new[c] = X_new[c].astype("string")

# Predicción
proba_new = model.predict_proba(X_new)[:, 1]
pred_new  = (proba_new >= 0.5).astype(int)

df_output = pd.DataFrame({
    "user_id": df_new.get("user_id", pd.Series(range(len(X_new)))),
    "prob_churn": proba_new,
    "pred_churn": pred_new
})