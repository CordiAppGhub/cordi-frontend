import { FleetStatusView } from "./fleet-status-view";

export const metadata = {
  title: "Estado de Flota | Corditrans TMS",
  description: "Ubicación y estado operativo de la flota",
};

export default function FleetStatusPage() {
  return <FleetStatusView />;
}
