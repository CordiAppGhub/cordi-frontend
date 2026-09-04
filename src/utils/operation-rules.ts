export interface OperationRules {
  showOrigen: boolean;
  showDestino: boolean;
  showDescargue: boolean; // Sirve tanto para Cargue (Exportación) como Descargue (Importación)
  showContainer: boolean;
}

export const getOperationRules = (type: string): OperationRules => {
  switch (type) {
    case 'Retiro de Importación':
      // 3 puntos: Puerto -> Bodega -> Patio
      return { showOrigen: true, showDestino: true, showDescargue: true, showContainer: true };
      
    case 'Ingreso de Exportación':
      // 3 puntos: Patio -> Bodega -> Puerto
      return { showOrigen: true, showDestino: true, showDescargue: true, showContainer: false }; 

    case 'Devolución de Contenedor Vacío':
      // 2 puntos: Bodega -> Patio
      return { showOrigen: true, showDestino: true, showDescargue: false, showContainer: true };
      
    case 'Retiro de Contenedor Vacío':
      // 2 puntos: Patio -> Bodega
      return { showOrigen: true, showDestino: true, showDescargue: false, showContainer: false };
      
    case 'Traslado de Carga Suelta':
    case 'Operación Nacional':
    case 'Transporte en Tanque':
      return { showOrigen: true, showDestino: true, showDescargue: false, showContainer: false };
      
    case 'Reporte de Novedad Mecánica':
    default:
      return { showOrigen: false, showDestino: false, showDescargue: false, showContainer: false };
  }
};