'use client';

import React from 'react';
import FleetScheduleGrid from './components/FleetScheduleGrid'; // Ajusta la ruta según donde hayas guardado el componente Grid

export default function FleetSchedulePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenedor principal de la vista de programación */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-1">
            <FleetScheduleGrid />
          </div>
        </div>
      </div>
    </div>
  );
}