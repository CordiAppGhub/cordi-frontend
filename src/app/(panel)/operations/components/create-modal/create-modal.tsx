import { SuperModal } from "@/components/organisms/modal/modal";
import { useUIStore } from "@/store/use-ui.store";
import { OperationForm } from "../formOperation";

// CreateModal.tsx
export const CreateModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();
  return (
    <SuperModal 
      isOpen={isCreateModalOpen} 
      onClose={closeCreateModal} 
      title="Crear Nueva Operación"
      width="680px" // 🚀 Ancho ideal para formularios en grid de 2 columnas sin scroll
    >
      <OperationForm onClose={closeCreateModal} />
    </SuperModal>
  );
};