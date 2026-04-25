// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Predicciones } from './pages/Predicciones';
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
          <Route path="predicciones" element={<Predicciones />} />
        </Route>

        {/* Si escriben una URL que no existe, los regresamos al Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;