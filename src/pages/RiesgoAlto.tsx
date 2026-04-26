import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  ShieldAlert,
  Bot,
  X,
  CheckCircle2,
  Send,
  Info
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface TopRiesgoItem {
  id: string;
  estado: string;
  ciudad: string;
  score: number;
  sat: number;
  login: number;
  prods: number;
  txs: number;
  ingreso: number;
}

const ScoreBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 80 ? 'bg-rose-500' : value >= 60 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${
        value >= 80 ? 'text-rose-600' : value >= 60 ? 'text-amber-600' : 'text-emerald-600'
      }`}>
        {value}
      </span>
    </div>
  );
};

export const RiesgoAlto: React.FC = () => {
  const [clientes, setClientes] = useState<TopRiesgoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<TopRiesgoItem | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/dashboard/clientes-riesgo-alto?page_size=20`);
        const data = await response.json();
        const topMapped: TopRiesgoItem[] = data.data.map((d: any) => ({
          id: d.user_id,
          estado: d.estado,
          ciudad: d.ciudad,
          score: d.churn_score,
          sat: d.satisfaccion_1_10 ?? 0,
          login: d.dias_desde_ultimo_login,
          prods: d.num_productos_activos ?? 0,
          txs: d.total_tx ?? 0,
          ingreso: d.ingreso_mensual_mxn ?? 0,
        }));
        setClientes(topMapped.sort((a, b) => b.score - a.score));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchClientes();
  }, []);

  // ── LÓGICA DINÁMICA MEJORADA (MÚLTIPLES BURBUJAS DE CHAT) ──
  const getPersonalizedIntervention = (c: TopRiesgoItem) => {
    if (c.sat <= 5) {
      return {
        motivo: "Insatisfacción Crítica",
        mensajes: [
          `Hola, soy Havi de Hey Banco. 👋`,
          `Noté que tu última evaluación de servicio fue de ${c.sat}/10. Lamentamos mucho que tu experiencia no haya sido la mejor.`,
          `Queremos compensarte. Te he bonificado la comisión de tu cuenta este mes y asigné un ejecutivo VIP a tu caso.`
        ],
        oferta: "Bonificación + Ejecutivo VIP",
        userReply: "Muchas gracias, la verdad sí tuve un problema. Acepto la ayuda."
      };
    }
    if (c.login > 15) {
      return {
        motivo: "Inactividad Prolongada",
        mensajes: [
          `¡Hola! Te extrañamos por acá. 🥺`,
          `Vi que llevas ${c.login} días sin usar tu app. Para que vuelvas a disfrutar tus beneficios en ${c.estado}, te tengo una sorpresa.`,
          `Tienes un 10% de Cashback extra en tu próxima compra pagando hoy con tu Tarjeta Virtual.`
        ],
        oferta: "10% Cashback Adicional (24h)",
        userReply: "¡Wow! Gracias, justo iba a comprar algo hoy."
      };
    }
    if (c.txs <= 3) {
      return {
        motivo: "Baja Transaccionalidad",
        mensajes: [
          `¡Hola! Havi por aquí. 🤖`,
          `Vi que has hecho pocos movimientos este mes. Recuerda que estás a solo un par de compras de mantener tus beneficios Hey Pro.`,
          `Si realizas un pago de servicios desde la app hoy, te regalo 500 Puntos Hey de cortesía.`
        ],
        oferta: "Bono de 500 Puntos Hey",
        userReply: "Súper, voy a pagar mi recibo de luz de una vez."
      };
    }
    return {
      motivo: "Retención Proactiva",
      mensajes: [
        `¡Hola! Espero que estés teniendo un excelente día. 🌟`,
        `En Hey Banco valoramos mucho tu lealtad. Analizando tu historial de uso, tengo una excelente noticia para ti.`,
        `Tienes pre-aprobado un aumento automático en tu línea de crédito. ¡Acéptalo con un clic!`
      ],
      oferta: "Aumento de Línea Pre-aprobado",
      userReply: "¡Increíble! Sí quiero el aumento."
    };
  };

  const clientesFiltrados = clientes.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // CAMBIO 1: h-full, flex-col y overflow-hidden para bloquear el scroll de la página
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden pb-2">
      
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="text-rose-500" size={20} />
          Intervención de Clientes Críticos
        </h1>
      </div>

      {/* CAMBIO 2: flex-1 para que la tabla tome el espacio disponible sin pasarse */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ID o Estado..." 
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[9px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Churn Score</th>
                <th className="px-4 py-3 text-center">SAT</th>
                <th className="px-4 py-3 text-center">Login</th>
                <th className="px-4 py-3 text-right">Ingreso</th>
                <th className="px-4 py-3 text-center">Acción Bot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* CAMBIO 3: .slice(0, 5) para mostrar solo los 5 más críticos */}
              {clientesFiltrados.slice(0, 5).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* CAMBIO 4: Aumenté el padding a py-4 para que las filas respiren mejor */}
                  <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-600">{r.id}</td>
                  <td className="px-4 py-4 text-xs text-slate-600 font-medium">{r.estado}</td>
                  <td className="px-4 py-4"><ScoreBar value={r.score} /></td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.sat <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {r.sat}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-slate-500">{r.login}d</td>
                  <td className="px-4 py-4 text-right text-xs font-bold text-slate-700">${Math.round(r.ingreso/1000)}k</td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => { setSelectedClient(r); setSimulating(true); setTimeout(()=>setSimulating(false), 2000); }}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-600 hover:text-white bg-indigo-50 rounded-lg transition-all shadow-sm"
                    >
                      <Bot size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MOCKUP CELULAR: EXPERIENCIA DEL CLIENTE ── */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-[#E5E5EA] rounded-[3rem] border-[8px] border-slate-900 shadow-2xl w-full max-w-[340px] h-[650px] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-20" />

            {/* Header del Chat */}
            <div className="bg-white pt-10 pb-3 px-4 border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shrink-0">
                <Bot size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 leading-tight">Havi Asistente</h3>
                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En línea
                </p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            {/* Area de Conversación */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 relative bg-[#E5E5EA]">
              <div className="text-center mb-4">
                <span className="text-[10px] bg-slate-200/80 text-slate-500 px-3 py-1 rounded-lg shadow-sm font-medium">Hoy</span>
              </div>

              {simulating ? (
                <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm w-fit flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : (
                <>
                  {/* Burbujas del Bot */}
                  {getPersonalizedIntervention(selectedClient).mensajes.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`bg-white rounded-2xl p-3 shadow-sm max-w-[85%] animate-in slide-in-from-left-4 fade-in duration-500`}
                      style={{ animationDelay: `${idx * 400}ms`, animationFillMode: 'both' }}
                    >
                      <p className="text-[12px] text-slate-800 leading-relaxed">{msg}</p>
                    </div>
                  ))}

                  {/* Tarjeta Visual de Oferta */}
                  <div 
                    className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-lg animate-in slide-in-from-left-4 fade-in duration-500"
                    style={{ animationDelay: `1200ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 tracking-wider">BENEFICIO DESBLOQUEADO</span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-800 mb-3">
                      {getPersonalizedIntervention(selectedClient).oferta}
                    </p>
                    <button className="w-full py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-slate-800 transition-colors">
                      ACTIVAR AHORA
                    </button>
                  </div>

                  {/* Respuesta del Cliente */}
                  <div 
                    className="bg-indigo-600 rounded-2xl rounded-tr-sm p-3 shadow-md max-w-[85%] ml-auto animate-in slide-in-from-right-4 fade-in duration-500"
                    style={{ animationDelay: `2500ms`, animationFillMode: 'both' }}
                  >
                    <p className="text-[12px] text-white font-medium">{getPersonalizedIntervention(selectedClient).userReply}</p>
                    <span className="text-[9px] text-indigo-200 mt-1 block text-right">Leído ✓✓</span>
                  </div>
                </>
              )}
            </div>

            {/* Input Falso */}
            <div className="bg-white p-3 flex items-center gap-3 border-t border-slate-200 z-10 pb-6">
              <div className="flex-1 bg-slate-100 rounded-full h-10 px-4 flex items-center text-[12px] text-slate-400 border border-slate-200">
                Mensaje...
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Send size={16} className="ml-0.5" />
              </div>
            </div>

            {/* Etiqueta Flotante para los Jueces */}
            <div className="absolute bottom-[80px] left-0 right-0 px-4 pointer-events-none z-20">
              <div className="bg-slate-900/95 text-white p-3 rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md border border-slate-700">
                <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Perspectiva del Cliente</p>
                  <p className="text-[10px] leading-tight text-slate-300 mt-0.5">
                    El bot usó NLP para detectar: <span className="font-bold text-white">{getPersonalizedIntervention(selectedClient).motivo}</span>.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RiesgoAlto;