import React from 'react';

// 1. Core Macro Breakdown Component
export default function NutritionChart({ protein = 0, carbs = 0, fat = 0 }) {
  const total = protein + carbs + fat || 1;
  const pPct = ((protein / total) * 100).toFixed(0);
  const cPct = ((carbs / total) * 100).toFixed(0);
  const fPct = ((fat / total) * 100).toFixed(0);

  return (
    <div className="nutrition-chart">
      <h4>Macros Breakdown</h4>
      <div className="macro-bar" style={{ display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden', margin: '10px 0' }}>
        <div style={{ width: `${pPct}%`, backgroundColor: '#e74c3c' }} title={`Protein: ${protein}g`}></div>
        <div style={{ width: `${cPct}%`, backgroundColor: '#3498db' }} title={`Carbs: ${carbs}g`}></div>
        <div style={{ width: `${fPct}%`, backgroundColor: '#f1c40f' }} title={`Fat: ${fat}g`}></div>
      </div>
      <div className="chart-legend" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span><b style={{color: '#e74c3c'}}>■</b> Protein ({protein}g)</span>
        <span><b style={{color: '#3498db'}}>■</b> Carbs ({carbs}g)</span>
        <span><b style={{color: '#f1c40f'}}>■</b> Fat ({fat}g)</span>
      </div>
    </div>
  );
}

// 2. Named Export: MacroPieChart (Used in Today tab)
export function MacroPieChart({ protein = 0, carbs = 0, fat = 0 }) {
  return <NutritionChart protein={protein} carbs={carbs} fat={fat} />;
}

// 3. Named Export: WeeklyCalorieChart (Used in Dashboard & Weekly tab)
export function WeeklyCalorieChart({ data = [] }) {
  const maxCalories = Math.max(...data.map(d => d.calories || 0), 2000);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '10px 0' }}>
      {data.map((day, i) => {
        const heightPct = Math.min(((day.calories || 0) / maxCalories) * 100, 100);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '60%', minWidth: '16px' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${heightPct || 5}%`, 
                  background: 'var(--cyan, #00d2ff)', 
                  borderRadius: '4px 4px 0 0'
                }} 
                title={`${day.date || 'Day'}: ${day.calories || 0} kcal`}
              />
            </div>
            <span style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
              {day.date ? day.date.slice(5) : `D${i+1}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 4. Named Export: MacroBarChart (Used in Weekly tab)
export function MacroBarChart({ data = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
      {data.slice(-7).map((day, i) => {
        const p = day.protein || 0;
        const c = day.carbs || 0;
        const f = day.fat || 0;
        const total = p + c + f || 1;
        
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', width: '45px', color: '#888' }}>{day.date ? day.date.slice(5) : `Day ${i+1}`}</span>
            <div style={{ flex: 1, display: 'flex', height: '12px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(p/total)*100}%`, backgroundColor: '#e74c3c' }} title={`Protein: ${p}g`} />
              <div style={{ width: `${(c/total)*100}%`, backgroundColor: '#3498db' }} title={`Carbs: ${c}g`} />
              <div style={{ width: `${(f/total)*100}%`, backgroundColor: '#f1c40f' }} title={`Fat: ${f}g`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}