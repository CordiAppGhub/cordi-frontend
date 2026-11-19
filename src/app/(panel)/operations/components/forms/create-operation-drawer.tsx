import { useUIStore } from "@/store/use-ui.store";
import { OperationForm } from "./operation-form";
import { useState } from "react";
import type { Operation } from "@/types/operation-types";
import { OperationDispatchDrawer } from "../actions/operation-dispatch-drawer";
import { useAuthStore } from "@/store/use-auth.store";

export const CreateDrawerOperation: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal } = useUIStore();
  const { user } = useAuthStore();
  const [operationToDispatch, setOperationToDispatch] =
    useState<Operation | null>(null);

  return (
    <>
      <OperationForm
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreatedForDispatch={(operation) => {
          closeCreateModal();
          setOperationToDispatch(operation);
        }}
      />
      <OperationDispatchDrawer
        key={operationToDispatch?.id ?? 'closed'}
        operation={operationToDispatch}
        isAnalyst={user?.role === "ANALISTA"}
        onClose={() => setOperationToDispatch(null)}
        onAssigned={() => setOperationToDispatch(null)}
      />
    </>
  );
};