import { useUIStore } from "@/store/use-ui.store";
import { OperationForm } from "./operation-form";

export const CreateDrawerOperation: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();

  return (
    <OperationForm 
      isOpen={isCreateModalOpen} 
      onClose={closeCreateModal} 
    />
  );
};