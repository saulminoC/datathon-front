// src/components/common/StatCard.tsx
import { Users, BrainCircuit, AlertTriangle, CheckCircle } from 'lucide-react';
import type { StatData } from '../../types';
const icons = {
  Users: <Users className="text-blue-600" />,
  Brain: <BrainCircuit className="text-purple-600" />,
  Alert: <AlertTriangle className="text-amber-600" />,
  Check: <CheckCircle className="text-emerald-600" />
};

export const StatCard = ({ data }: { data: StatData }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4">
        {icons[data.iconName as keyof typeof icons]}
      </div>
      <p className="text-sm text-slate-500 font-medium">{data.label}</p>
      <p className="text-2xl font-bold mt-1">{data.value}</p>
    </div>
  );
};