"use client";

import React from "react";
import { ColumnDef } from "@/types/table";
import { ClientTariff } from "@/types/tariff-ypes";
import { Button } from "@/components/atoms/button/button";

export interface ClientTariffGroup {
  id: number;
  clientName: string;
  tariffs: ClientTariff[];
}

export const groupTariffsByClient = (
  tariffs: ClientTariff[],
): ClientTariffGroup[] => {
  const groups = new Map<number, ClientTariffGroup>();
  for (const tariff of tariffs) {
    const group = groups.get(tariff.clientId) ?? {
      id: tariff.clientId,
      clientName: tariff.client?.razonSocial || "Desconocido",
      tariffs: [],
    };
    group.tariffs.push(tariff);
    groups.set(tariff.clientId, group);
  }
  return [...groups.values()].sort((a, b) =>
    a.clientName.localeCompare(b.clientName),
  );
};

export const getClientGroupColumns = (): ColumnDef<ClientTariffGroup>[] => [
  {
    id: "client",
    header: "Cliente",
    type: "text",
    renderCell: (row) => (
      <strong style={{ color: "#0f172a" }}>{row.clientName}</strong>
    ),
  },
  {
    id: "count",
    header: "Tarifas configuradas",
    type: "text",
    renderCell: (row) => (
      <span
        style={{
          padding: "4px 8px",
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          borderRadius: "12px",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        {row.tariffs.length} {row.tariffs.length === 1 ? "tarifa" : "tarifas"}
      </span>
    ),
  },
];

export const getTariffColumns = (
  onEdit: (tariff: ClientTariff) => void,
): ColumnDef<ClientTariff>[] =>
  getClientTariffColumns(onEdit).filter((column) => column.id !== "client");

const getClientTariffColumns = (
  onEdit: (tariff: ClientTariff) => void,
): ColumnDef<ClientTariff>[] => [
  {
    id: "client",
    header: "Cliente",
    type: "text",
    renderCell: (row) => (
      <strong style={{ color: "#0f172a" }}>
        {row.client?.razonSocial || "Desconocido"}
      </strong>
    ),
  },
  {
    id: "cargoType",
    header: "Tipo de carga",
    type: "text",
    renderCell: (row) =>
      row.isContainerized ? "Contenerizada" : "Carga suelta",
  },
  {
    id: "location",
    header: "Ubicación del cliente",
    type: "text",
    renderCell: (row) => row.location?.name ?? "Sin ubicación asignada",
  },
  {
    id: "routeScope",
    header: "Alcance",
    type: "text",
    renderCell: (row) =>
      row.routeScope === "NACIONAL"
        ? "Nacional"
        : row.routeScope === "URBANO"
          ? "Urbano"
          : "Pendiente de clasificar",
  },
  {
    id: "operationType",
    header: "Tipo de operación",
    type: "text",
    renderCell: (row) => (
      <span
        style={{
          padding: "4px 8px",
          backgroundColor: "#e0f2fe",
          color: "#0369a1",
          borderRadius: "12px",
          fontSize: "0.8rem",
        }}
      >
        {row.operationType}
      </span>
    ),
  },
  {
    id: "price",
    header: "Precio de cobro (COP)",
    type: "text",
    renderCell: (row) => (
      <strong style={{ color: "#16a34a", fontSize: "1.1rem" }}>
        ${row.price.toLocaleString("es-CO")}
      </strong>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    type: "text",
    renderCell: (row) => (
      <Button
        type="button"
        variant="secondary"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(row);
        }}
      >
        Editar
      </Button>
    ),
  },
];
