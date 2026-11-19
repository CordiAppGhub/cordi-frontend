"use client";

import React, { useRef, useState } from "react";
import { SuperForm } from "@/components/organisms/form/form";
import { useOperationForm } from "../../hooks/use-operation-form";
import type { Operation } from "@/types/operation-types";
import { useAuthStore } from "@/store/use-auth.store";
import { Drawer } from "@/components/Drawer";
import { Tabs } from "@/components/molecules/tabs/tabs";
import { Button } from "@/components/atoms/button/button";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./operation-form.module.css";

interface OperationFormProps {
  isOpen: boolean; // El componente padre debe controlar si está abierto o no
  onClose: () => void;
  scheduleBase?: Operation | null;
  onCreatedForDispatch?: (operation: Operation) => void;
}

export const OperationForm: React.FC<OperationFormProps> = ({
  isOpen,
  onClose,
  scheduleBase,
  onCreatedForDispatch,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("general");
  const submitForDispatch = useRef(false);

  const {
    categorizedFields,
    isDevolucion,
    initialValues,
    handleSubmit,
    handleFormChange,
    setFieldsOnChange,
    errors,
    isLoadingOperations,
    suggestedPrice,
    isCalculatingPrice,
    shippingLinesError,
    vehicleTypesError,
    relatedOperationsError,
  } = useOperationForm(onClose, scheduleBase, onCreatedForDispatch);

  const tabsConfig = [
    { id: "general", label: isDevolucion ? "Devolución" : "General & Ruta" },
    ...(categorizedFields.cargaFields.length > 0
      ? [
          {
            id: "carga",
            label: isDevolucion ? "Contenedor" : "Datos de Carga",
          },
        ]
      : []),
    ...(categorizedFields.liquidacionFields.length > 0
      ? [{ id: "liquidacion", label: "Liquidación" }]
      : []),
  ];

  const visibleActiveTab = tabsConfig.some((tab) => tab.id === activeTab)
    ? activeTab
    : "general";

  // Determinar qué campos mostrar según la pestaña activa
  const currentFields =
    visibleActiveTab === "general"
      ? categorizedFields.generalFields
      : visibleActiveTab === "carga"
        ? categorizedFields.cargaFields
        : categorizedFields.liquidacionFields;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        scheduleBase
          ? `Editar Operación #${scheduleBase.id}`
          : user?.role === "ANALISTA"
            ? "Crear solicitud de operación"
            : "Crear Nueva Operación"
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {errors.global && (
          <div role="alert" style={{ color: "#b91c1c" }}>
            {errors.global}
          </div>
        )}
        {shippingLinesError && !scheduleBase && !isDevolucion && (
          <div role="alert" style={{ color: "#b91c1c" }}>
            No se pudieron cargar las líneas navieras. Cierra y vuelve a abrir
            el formulario para reintentar.
          </div>
        )}
        {vehicleTypesError && !scheduleBase && (
          <div role="alert" style={{ color: "#b91c1c" }}>
            No se pudieron cargar las configuraciones vehiculares. Cierra y
            vuelve a abrir el formulario para reintentar.
          </div>
        )}
        {relatedOperationsError && isDevolucion && (
          <div role="alert" style={{ color: "#b91c1c" }}>
            No se pudieron cargar las operaciones padre disponibles. Puedes
            reintentar cerrando y abriendo el formulario.
          </div>
        )}

        {/* Componente TABS */}
        <Tabs
          tabs={tabsConfig}
          activeTab={visibleActiveTab}
          onChange={setActiveTab}
          fullWidth={true}
        />

        {/* Panel Informativo de Tarifa (Solo se muestra en la pestaña de Liquidación o General) */}
        {!isDevolucion &&
          (visibleActiveTab === "general" ||
            visibleActiveTab === "liquidacion") && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
              }}
            >
              {isCalculatingPrice ? (
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#2563eb",
                    fontWeight: 500,
                  }}
                >
                  ⏳ Consultando contrato del cliente...
                </span>
              ) : suggestedPrice ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.95rem",
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    💰 Flete Sugerido: ${suggestedPrice.toLocaleString("es-CO")}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#475569" }}>
                    Si dejas Flete Manual en blanco, se facturará este valor
                    según contrato.
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#d97706",
                    fontWeight: 600,
                  }}
                >
                  ⚠️ No hay una tarifa comercial configurada para el cliente, la
                  ruta y el tipo de operación seleccionados. Ingresa el flete
                  manualmente o solicita que configuren la tarifa.
                </span>
              )}
            </div>
          )}

        {/* El Formulario dinámico */}
        <SuperForm
          fields={currentFields} // Cambia dinámicamente según el Tab
          onSubmit={async (values) => {
            const shouldDispatch = submitForDispatch.current;
            submitForDispatch.current = false;
            await handleSubmit(values, shouldDispatch);
          }}
          onInvalid={() => {
            submitForDispatch.current = false;
          }}
          defaultValues={initialValues}
          onCancel={onClose}
          onChange={handleFormChange}
          setFieldsOnChange={setFieldsOnChange}
          clearFieldsOnChange={{
            destinoTemporalTipo: ["destinoTemporalId"],
            isAnticipada: ["destinoTemporalTipo", "destinoTemporalId"],
            type: ["destinoTemporalTipo", "destinoTemporalId"],
          }}
          errors={errors}
          isLoading={isLoadingOperations}
          submitText={
            scheduleBase
              ? "Guardar cambios"
              : user?.role === "ANALISTA"
                ? "Enviar a flota"
                : "Crear Operación"
          }
          cancelText="Cancelar"
          renderFooter={() => (
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoadingOperations}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isLoadingOperations}
                onClick={() => {
                  submitForDispatch.current = false;
                }}
              >
                {scheduleBase
                  ? "Guardar cambios"
                  : user?.role === "ANALISTA"
                    ? "Enviar a flota"
                    : "Crear Operación"}
              </Button>
              {!scheduleBase && onCreatedForDispatch && (
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoadingOperations}
                  onClick={() => {
                    submitForDispatch.current = true;
                  }}
                >
                  Crear y Asignar
                </Button>
              )}
            </div>
          )}
        />
      </div>
    </Drawer>
  );
};
