import { Metadata } from 'next';
import { ClientsView } from './views/clienViews';

export const metadata: Metadata = {
  title: 'Clientes | Corditrans TMS',
  description: 'Gestión comercial, NITs y razones sociales de clientes logísticos.',
};

export default function ClientsPage() {
  return <ClientsView />;
}