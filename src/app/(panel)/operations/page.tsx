import { OperationsView } from "./views/operation-views";

export const metadata = {
  title: 'Operaciones | Corditrans TMS',
  description: 'Control de operaciones actuales e historial de viajes',
};

export default function OperationsPage() {
  return <OperationsView />;
}