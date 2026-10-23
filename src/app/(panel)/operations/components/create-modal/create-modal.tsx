import { useUIStore } from "@/store/use-ui.store";
import { OperationForm } from "../formOperation";

export const CreateDrawerOperation: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();

  return (
    <OperationForm 
      isOpen={isCreateModalOpen} 
      onClose={closeCreateModal} 
    />
  );
};