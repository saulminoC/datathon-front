import React, { useState } from 'react';
import { ShieldCheck, BarChart3, PieChart as PieIcon, ScatterChart as ScatterIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

export const Predicciones: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:8000/api/predict/batch', { method: 'POST', body: formData });
      const res = await response.json();
      setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-[90vh] flex flex-col space-y-3 bg-slate-50 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md"><ShieldCheck className="text-white" size={16} /></div>
          <h1 className="text-sm font-bold">Motor IA <span className="text-indigo-600">Havi</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[10px] cursor-pointer" />
          <button onClick={handleUpload} disabled={loading || !file} className="bg-slate-950 text-white px-4 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12}/>}
            {loading ? "PROCESANDO..." : "CORRER MODELO"}
          </button>
        </div>
      </div>

      {data && (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Fila Superior: Tabla (5 filas) + KPI */}
          <div className="flex gap-4 h-[40%] min-h-0">
            <div className="flex-[7] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Top 5 Riesgo Crítico (Datos Reales del Archivo)
              </div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2 text-center">EDAD</th>
                    <th className="px-4 py-2 text-center">PRODS</th>
                    <th className="px-4 py-2 text-center">SAT</th>
                    <th className="px-4 py-2 text-right text-rose-600">CHURN %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.table_data.slice(0, 5).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-indigo-50/30">
                      <td className="px-4 py-2 font-mono font-bold text-indigo-600">{row.user_id}</td>
                      <td className="px-4 py-2 text-center text-slate-500">{row.edad}</td>
                      <td className="px-4 py-2 text-center text-slate-500">{row.num_productos_activos}</td>
                      <td className="px-4 py-2 text-center font-bold">{row.satisfaccion_1_10}/10</td>
                      <td className="px-4 py-2 text-right font-black text-rose-600">{row.prob_churn}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex-[3] bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative">
              <h3 className="absolute top-4 left-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Riesgo Global</h3>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={[{value: data.summary.promedio_churn}, {value: 100 - data.summary.promedio_churn}]} innerRadius={35} outerRadius={48} paddingAngle={4} dataKey="value" stroke="none" startAngle={180} endAngle={0}>
                    <Cell fill="#4f46e5" /><Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-[-30px]">
                <p className="text-3xl font-black text-slate-900 leading-none">{data.summary.promedio_churn.toFixed(1)}%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Prob. Promedio</p>
              </div>
            </div>
          </div>

          {/* Fila Inferior: Ciudades + Scatter Mejorado */}
          <div className="flex gap-4 h-[50%] min-h-0">
            <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-1">
                <BarChart3 size={12} className="text-indigo-600" /> Hotspots por Ciudad
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_cities} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="ciudad" type="category" width={75} style={{fontSize: '10px', fontWeight: 'bold', fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Bar dataKey="prob_churn" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-1">
                <ScatterIcon size={12} className="text-rose-500" /> Churn vs Ingreso Mensual
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="ingreso_mensual_mxn" name="Ingreso" domain={['dataMin', 'dataMax']} tickFormatter={(val) => `$${Math.round(val/1000)}k`} style={{fontSize: '9px'}} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="prob_churn" domain={[0, 100]} style={{fontSize: '9px'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={data.scatter_data} fill="#4f46e5" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predicciones;