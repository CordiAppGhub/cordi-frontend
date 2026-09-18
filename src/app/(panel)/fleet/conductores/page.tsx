import { DriversView } from './views/drivers-view';

export const metadata = {
  title: 'Directorio de Conductores | Corditrans TMS',
  description: 'Gestión del personal y directorio de conductores de la flota',
};

export default function DriversPage() {
  return <DriversView />;
}