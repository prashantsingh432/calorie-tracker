import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface NutritionRingProps {
  current: number;
  target: number;
  color: string;
  label: string;
  unit: string;
  size?: 'sm' | 'md' | 'lg';
}

const NutritionRing: React.FC<NutritionRingProps> = ({ current, target, color, label, unit, size = 'md' }) => {
  const remaining = Math.max(0, target - current);
  const data = [
    { name: 'Consumed', value: current },
    { name: 'Remaining', value: remaining },
  ];

  const sizeConfig = {
    sm: { height: 60, outerRadius: 28, innerRadius: 20, fontSize: 'text-xs' },
    md: { height: 100, outerRadius: 45, innerRadius: 35, fontSize: 'text-sm' },
    lg: { height: 160, outerRadius: 75, innerRadius: 60, fontSize: 'text-lg' },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ height: config.height, width: config.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell key="cell-0" fill={color} />
              <Cell key="cell-1" fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
          <span className={`font-bold text-gray-800 ${config.fontSize}`}>{Math.round(current)}</span>
          {size === 'lg' && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>
      <span className="mt-1 text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
};

export default NutritionRing;