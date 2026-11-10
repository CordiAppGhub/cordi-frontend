"use client";

import React, { useMemo, useState } from "react";
import { useClients } from "@/hooks/useClient";
import { useLocations } from "../../locations/hooks/useLocation";
import { useTariffs } from "../hooks/useTariff";
import { formatLocationLabel } from "@/utils/location";
import { SuperForm } from "@/components/organisms/form/form";
import {
  FormField,
  FormFieldValue,
} from "@/components/organisms/form/types/form.types";
import { ClientTariff, OperationType } from "@/types/tariff-ypes";
import { clientTariffSchema } from "@/schemas/tariff.schema";
import { operationOptions } from "@/app/constants/operation.constants";

interface ClientTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ClientTariff | null;
}


export const ClientTariffModal: React.FC<ClientTariffModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const {
    createTariff,
    updateTariff,
    isLoadingTariffs,
  } = useTariffs();
  const { locations } = useLocations();
  const { clients } = useClients();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultValues = useMemo(
    () =>
      initialData
        ? {
            clientId: String(initialData.clientId),
            operationType: initialData.operationType,
            routeScope: initialData.routeScope ?? "",
            isContainerized: initialData.isContainerized,
            locationId: initialData.locationId
              ? String(initialData.locationId)
              : "",
            price: String(initialData.price),
          }
        : { isContainerized: true },
    [initialData],
  );

  const formFields = useMemo<FormField[]>(
    () => [
      {
        name: "isContainerized",
        label: "Tipo de carga: contenerizada",
        type: "checkbox",
      },
      {
        name: "operationType",
        label: "Tipo de operación *",
        type: "select",
        options: [
          { value: "", label: "-- Seleccionar operación --" },
          ...operationOptions,
        ],
      },
      {
        name: "routeScope",
        label: "Alcance de operación *",
        type: "select",
        options: [
          { value: "", label: "-- Seleccionar alcance --" },
          { value: "URBANO", label: "Urbano" },
          { value: "NACIONAL", label: "Nacional" },
        ],
      },
      {
        name: "clientId",
        label: "Cliente *",
        type: "select",
        options: [
          { value: "", label: "-- Seleccionar cliente --" },
          ...clients.map((client) => ({
            value: String(client.id),
            label: client.razonSocial,
          })),
        ],
      },
      {
        name: "locationId",
        label: "Ubicación del cliente *",
        type: "select",
        disabled: (formData) => !formData.clientId,
        options: (formData: Record<string, FormFieldValue>) => {
          const clientId = Number(formData.clientId);
          const clientLocations = locations.filter((location) =>
            location.clients?.some(
              (clientLocation) => clientLocation.clientId === clientId,
            ),
          );
          return [
            {
              value: "",
              label: clientId
                ? "-- Seleccionar ubicación --"
                : "Seleccione un cliente primero...",
            },
            ...clientLocations.map((location) => ({
              value: String(location.id),
              label: formatLocationLabel(location),
            })),
          ];
        },
      },
      {
        name: "price",
        label: "Precio de cobro (COP) *",
        type: "number",
        placeholder: "Ej: 900000",
      },
    ],
    [clients, locations],
  );

  const handleCloseModal = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const parsedForm = clientTariffSchema.safeParse(formData);
    if (!parsedForm.success) {
      const localErrors: Record<string, string> = {};
      for (const issue of parsedForm.error.issues) {
        localErrors[String(issue.path[0] ?? "operationType")] = issue.message;
      }
      setErrors(localErrors);
      return;
    }

    const success = initialData
      ? await updateTariff(initialData.id, parsedForm.data)
      : await createTariff(parsedForm.data);
    if (success) handleCloseModal();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "24px",
          borderRadius: "12px",
          width: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}
        >
          {initialData ? "Editar Tarifa Comercial" : "Nueva Tarifa Comercial"}
        </h2>
        <SuperForm
          key={`${isOpen}-${initialData?.id ?? "new"}`}
          fields={formFields}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          onChange={(name) => {
            if (errors[name]) {
              setErrors((previous) => ({ ...previous, [name]: "" }));
            }
          }}
          clearFieldsOnChange={{
            clientId: ["locationId"],
          }}
          errors={errors}
          isLoading={isLoadingTariffs}
          submitText={initialData ? "Actualizar Tarifa" : "Guardar Tarifa"}
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
};
