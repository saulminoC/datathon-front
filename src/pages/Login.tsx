import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [email, setEmail] = useState('demo@hey-banco.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados de la interfaz
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null); // Limpiamos errores previos
    
    // 1. Validación básica de frontend
    if (!email || !password) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    
    // 2. Simulación de llamada a Laravel (Aquí meterás tu Axios después)
    setTimeout(() => {
      setIsLoading(false);
      
      // EL TRUCO PARA EL DATATHON: 
      // Si usan el correo demo, entran. Si no, mostramos un error elegante.
      if (email === 'demo@hey-banco.com' && password.length >= 6) {
        // Aquí llamarías a tu AuthContext login() en la versión final
        navigate('/panel');
      } else {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    }, 1200); // Simulamos 1.2 seg de latencia para que se vea el "spinner"
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Ingresa tu correo primero para enviarte el enlace de recuperación.');
      return;
    }
    setErrorMsg(null);
    setRecoverySent(true);
    setTimeout(() => setRecoverySent(false), 4000); // Se oculta después de 4 seg
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Sección del Formulario (Izquierda) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 md:p-24 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.03)] z-10">
        <div className="w-full max-w-md space-y-8">
          
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Activity className="text-blue-600" size={28} />
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                VitalData Pro
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Panel de Acceso Seguro
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tus credenciales corporativas para acceder a los modelos predictivos.
            </p>
          </div>

          {/* Banner de Error */}
          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Banner de Éxito (Recuperación) */}
          {recoverySent && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
              <p className="text-sm text-emerald-800 font-medium">
                Enlace de recuperación enviado a <strong>{email}</strong>
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Input Correo */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Correo Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all bg-slate-50 outline-none"
                    placeholder="usuario@empresa.com"
                  />
                </div>
              </div>

              {/* Input Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all bg-slate-50 outline-none"
                    placeholder="••••••••"
                  />
                  {/* Botón Ver/Ocultar Contraseña */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Opciones extra */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                  Recordar sesión
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Autenticando...
                </span>
              ) : (
                <span className="flex items-center">
                  Ingresar a la plataforma
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Sección Visual / Branding (Derecha) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative z-10 p-12 max-w-lg text-center">
          <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-500/30">
            <ShieldCheck className="text-blue-400" size={32} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">
            Infraestructura de Datos Segura
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Conectamos modelos de Machine Learning avanzados con interfaces de alto rendimiento en tiempo real.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <span className="text-sm font-medium text-slate-200">Conexión al Backend (Laravel)</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs text-slate-300 font-mono">API Status: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs text-slate-300 font-mono">Modelos IA: Cargados</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};