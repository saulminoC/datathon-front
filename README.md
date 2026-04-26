# 🚀 Havi Insights | System 32

![Havi Insights](https://img.shields.io/badge/Status-Datathon_Ready-success?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![CatBoost](https://img.shields.io/badge/AI_Model-CatBoost-FFCC00?style=for-the-badge)

**Havi Insights** es una plataforma integral (End-to-End) de inteligencia de negocios y prevención de Churn (abandono de clientes) diseñada para el sector de la banca digital. 

No es un simple dashboard de métricas históricas; es una **herramienta predictiva y prescriptiva** que utiliza Inteligencia Artificial para identificar a los usuarios con mayor riesgo de fuga y sugerir acciones comerciales tácticas para retenerlos antes de que vacíen sus cuentas.

---

## ✨ Características Principales

* 🧠 **Motor IA Predictivo:** Integración de un modelo de Machine Learning (`CatBoost`) capaz de procesar lotes masivos de usuarios (.csv) y devolver predicciones de churn en milisegundos.
* 🎯 **Analítica Prescriptiva:** El sistema no solo da un *Score de Riesgo*, sino que evalúa el perfil del cliente para sugerir acciones de retención precisas (Ej. *Ofertas de Cashback, Exención de Anualidad*).
* 🗺️ **Inteligencia Geográfica:** Mapa de calor interactivo que identifica los *hotspots* de riesgo a nivel nacional.
* ⚡ **Arquitectura Big Data:** Backend optimizado para lectura de archivos `.parquet`, garantizando escalabilidad y bajo consumo de memoria.
* 📊 **Tableros Dinámicos:** UI responsiva construida con componentes interactivos y tablas que se adaptan dinámicamente a la salida del modelo de IA.

---

## 🛠️ Stack Tecnológico

**Frontend:**
* React 19 + TypeScript
* Vite (Bundler)
* Tailwind CSS (Estilos)
* Recharts & React Simple Maps (Visualización de Datos)

**Backend & Data Science:**
* Python 3.10+
* FastAPI (Core API)
* Pandas & FastParquet (Procesamiento de Datos)
* CatBoost & Scikit-Learn (Machine Learning)

---

## ⚙️ Instrucciones de Instalación y Ejecución

Sigue estos pasos para levantar el entorno de desarrollo de manera local.

### 1. Clonar el repositorio
```bash
git clone <tu-url-del-repositorio>
cd datathon-front