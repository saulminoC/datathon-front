// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes'
import { Predicciones } from './pages/Predicciones';
import { RiesgoAlto } from './pages/RiesgoAlto'; // <-- 1. IMPORTAMOS LA NUEVA PÁGINA
import { MainLayout } from './components/layout/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Siempre será el Login al entrar */}
        <Route path="/" element={<Login />} />

        {/* El sistema interno (Protegido bajo /panel) */}
        <Route path="/panel" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="predicciones" element={<Predicciones />} />
          <Route path="riesgo-alto" element={<RiesgoAlto />} /> {/* <-- 2. AGREGAMOS LA RUTA */}
        </Route>

        {/* Si escriben una URL que no existe, los regresamos al Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;