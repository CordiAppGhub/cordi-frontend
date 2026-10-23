import { z } from "zod";

export const inspectionResultSchema = z
  .object({
    result: z.enum(["APROBADO", "RECHAZADO_MAL_ESTADO"]),
    newLocationId: z.string(),
    observations: z.string(),
    comodato: z.custom<FileList>(
      (value) => typeof FileList !== "undefined" && value instanceof FileList,
    ).optional(),
  })
  .superRefine((data, context) => {
    if (data.result !== "RECHAZADO_MAL_ESTADO") return;

    if (!data.newLocationId) {
      context.addIssue({
        code: "custom",
        path: ["newLocationId"],
        message: "Selecciona el nuevo patio de destino.",
      });
    }
    if (!data.comodato?.item(0)) {
      context.addIssue({
        code: "custom",
        path: ["comodato"],
        message: "Adjunta la fotografía del comodato.",
      });
    }
  });

export type InspectionResultFormData = z.infer<typeof inspectionResultSchema>;
