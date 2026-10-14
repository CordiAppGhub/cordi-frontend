import { SuperModal } from "@/components/organisms/modal/modal";
import { useUIStore } from "@/store/use-ui.store";
import { useAuthStore } from "@/store/use-auth.store";
import { OperationForm } from "../formOperation";

// CreateModal.tsx
export const CreateModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();
  const { user } = useAuthStore();
  return (
    <SuperModal 
      isOpen={isCreateModalOpen} 
      onClose={closeCreateModal} 
      title={user?.role === 'ANALISTA' ? 'Crear solicitud de operación' : 'Crear Nueva Operación'}
      width="680px" 
    >
      <OperationForm onClose={closeCreateModal} />
    </SuperModal>
  );
};