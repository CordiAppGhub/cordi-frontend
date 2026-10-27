"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Ship, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { Button } from "@/components/atoms/button/button";
import { SuperModal } from "@/components/organisms/modal/modal";
import {
  ShippingLine,
  ShippingLineInput,
  shippingLinesService,
} from "@/services/shipping-lines.service";
import {
  ShippingLineFormData,
  shippingLineSchema,
} from "@/schemas/shipping-line.schema";
import { showToast } from "@/utils/alerts";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import styles from "../locations.module.css";

export function ShippingLinesView() {
  const queryClient = useQueryClient();
  const [editingLine, setEditingLine] = useState<ShippingLine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const linesQuery = useQuery({
    queryKey: ["shipping-lines"],
    queryFn: shippingLinesService.getAll,
  });
  const form = useForm<ShippingLineFormData>({
    resolver: zodResolver(shippingLineSchema),
    defaultValues: { name: "", nit: "" },
  });

  const saveMutation = useMutation({
    mutationFn: (input: ShippingLineInput) =>
      editingLine
        ? shippingLinesService.update(editingLine.id, input)
        : shippingLinesService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shipping-lines"] });
      showToast.success(
        editingLine
          ? "Línea naviera actualizada correctamente."
          : "Línea naviera creada correctamente.",
      );
      closeModal();
    },
    onError: (error: unknown) => {
      showToast.error(
        getUserFriendlyErrorMessage(
          error,
          "No se pudo guardar la línea naviera.",
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: shippingLinesService.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shipping-lines"] });
      showToast.success("Línea naviera eliminada correctamente.");
    },
    onError: (error: unknown) => {
      showToast.error(
        getUserFriendlyErrorMessage(
          error,
          "No se pudo eliminar la línea naviera.",
        ),
      );
    },
  });

  function openCreate() {
    setEditingLine(null);
    form.reset({ name: "", nit: "" });
    setIsModalOpen(true);
  }

  function openEdit(line: ShippingLine) {
    setEditingLine(line);
    form.reset({ name: line.name, nit: line.nit });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingLine(null);
    form.reset({ name: "", nit: "" });
  }

  async function removeLine(line: ShippingLine) {
    const confirmation = await Swal.fire({
      title: "¿Eliminar línea naviera?",
      text: `Las operaciones asociadas conservarán sus datos y quedarán sin naviera (${line.name}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (confirmation.isConfirmed) deleteMutation.mutate(line.id);
  }

  const submit = form.handleSubmit((values) =>
    saveMutation.mutate({
      name: values.name.trim(),
      nit: values.nit.trim(),
    }),
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Líneas navieras</h2>
          <p className={styles.subtitle}>
            Administra las navieras que pueden exigir inspección de contenedor.
          </p>
        </div>
        <Button onClick={openCreate} variant="primary">
          <Plus size={16} /> Nueva naviera
        </Button>
      </header>

      {linesQuery.isLoading ? (
        <p role="status">Cargando líneas navieras...</p>
      ) : linesQuery.isError ? (
        <div role="alert" className={styles.shippingError}>
          <span>No se pudieron cargar las líneas navieras.</span>
          <Button onClick={() => void linesQuery.refetch()} variant="secondary">
            Reintentar
          </Button>
        </div>
      ) : (linesQuery.data ?? []).length === 0 ? (
        <div className={styles.shippingEmpty}>
          <Ship size={24} />
          <p>Aún no hay líneas navieras registradas.</p>
        </div>
      ) : (
        <div className={styles.shippingTableWrap}>
          <table className={styles.shippingTable}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Creada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(linesQuery.data ?? []).map((line) => (
                <tr key={line.id}>
                  <td>{line.name}</td>
                  <td>{line.nit}</td>
                  <td>
                    {new Date(line.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td>
                    <div className={styles.shippingActions}>
                      <Button
                        variant="secondary"
                        type="button"
                        aria-label={`Editar ${line.name}`}
                        onClick={() => openEdit(line)}
                      >
                        <Pencil size={16} /> Editar
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        aria-label={`Eliminar ${line.name}`}
                        disabled={deleteMutation.isPending}
                        onClick={() => void removeLine(line)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SuperModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingLine ? "Editar línea naviera" : "Nueva línea naviera"}
        width="520px"
      >
        <form className={styles.shippingForm} onSubmit={(event) => void submit(event)}>
          <label>
            Nombre *
            <input
              autoComplete="organization"
              {...form.register("name")}
              placeholder="Ej.: Maersk"
            />
            {form.formState.errors.name && (
              <span role="alert">{form.formState.errors.name.message}</span>
            )}
          </label>
          <label>
            NIT *
            <input
              {...form.register("nit")}
              placeholder="Identificación tributaria"
            />
            {form.formState.errors.nit && (
              <span role="alert">{form.formState.errors.nit.message}</span>
            )}
          </label>
          <div className={styles.shippingFormActions}>
            <Button type="button" variant="secondary" onClick={closeModal}>
              <X size={15} /> Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Guardando..."
                : editingLine
                  ? "Guardar cambios"
                  : "Crear naviera"}
            </Button>
          </div>
        </form>
      </SuperModal>
    </section>
  );
}
