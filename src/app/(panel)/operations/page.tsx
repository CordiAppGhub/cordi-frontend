import { OperationsView } from "./views/operations-view";

export const metadata = {
  title: 'Operaciones | Corditrans TMS',
  description: 'Control de operaciones actuales e historial de viajes',
};

export default function OperationsPage() {
  return <OperationsView />;
}