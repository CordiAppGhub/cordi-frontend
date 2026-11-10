"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAnalysts } from "@/hooks/useAnalysts";
import { useAuthStore } from "@/store/use-auth.store";
import { clientService } from "@/services/client-service";
import { driversService } from "@/services/driver.service";
import {
  operationService,
  type HistoricalFilterOptionKind,
} from "@/services/operation.service";
import { profilesService } from "@/services/profiles.service";
import type { Client } from "@/types/client.-types";
import type { Driver } from "@/types/drivers";
import { getUserFriendlyErrorMessage } from "@/utils/api-error";
import styles from "./operation-history.module.css";

type HistoryFilterKind =
  | HistoricalFilterOptionKind
  | "container"
  | "client"
  | "analyst"
  | "driver";

interface HistorySearchSelectProps {
  kind: HistoryFilterKind;
  value: string;
  label: string;
  placeholder: string;
  onSelect: (value: string) => void;
}

export function HistorySearchSelect({
  kind,
  value,
  label,
  placeholder,
  onSelect,
}: HistorySearchSelectProps) {
  const listboxId = `history-filter-${kind}-options`;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const analystsQuery = useAnalysts(
    isOpen && kind === "analyst" && user?.role !== "ANALISTA",
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const optionsQuery = useQuery({
    queryKey: [
      "operation-history-filter-options",
      kind,
      kind === "driver" || kind === "client" ? "" : debouncedSearch,
      user?.role,
    ],
    queryFn: async () => {
      if (kind === "manifest") {
        return operationService.getHistoricalFilterOptions(
          kind,
          debouncedSearch,
        );
      }
      if (kind === "container") {
        const result = await profilesService.list(
          "containers",
          debouncedSearch,
          1,
          30,
        );
        return result.data.map((profile) => ({
          value: String(profile.id),
          label: profile.name || String(profile.id),
        }));
      }
      if (kind === "driver") {
        const drivers: Driver[] = await driversService.getAll();
        return drivers.map((driver) => ({
          value: String(driver.id),
          label: driver.name || `Conductor #${driver.id}`,
        }));
      }
      if (kind === "client") {
        const clients: Client[] = await clientService.getAll();
        return clients.map((client) => ({
          value: String(client.id),
          label: client.razonSocial,
        }));
      }
      const result = await profilesService.list(
        "analysts",
        debouncedSearch,
        1,
        30,
      );
      return result.data.map((profile) => ({
        value: String(profile.id),
        label: profile.name || `Analista #${profile.id}`,
      }));
    },
    enabled: isOpen && (kind !== "analyst" || user?.role === "ANALISTA"),
    staleTime: 30_000,
  });

  const isFetching =
    optionsQuery.isFetching ||
    (kind === "analyst" &&
      (user?.role === "ANALISTA"
        ? optionsQuery.isFetching
      : analystsQuery.isLoadingAnalysts));
  const analystOptions =
    kind === "analyst" && user?.role !== "ANALISTA"
      ? analystsQuery.analysts
          .filter((analyst) =>
            analyst.name
              .toLocaleLowerCase()
              .includes(debouncedSearch.toLocaleLowerCase()),
          )
          .slice(0, 30)
          .map((analyst) => ({
            value: String(analyst.id),
            label: analyst.name,
          }))
      : optionsQuery.data;

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    if (value) onSelect("");
  };

  const sourceOptions =
    (kind === "analyst" ? analystOptions : optionsQuery.data) ?? [];
  const options =
    kind === "client" || kind === "driver"
      ? sourceOptions
          .filter((option) =>
            option.label
              .toLocaleLowerCase()
              .includes(debouncedSearch.toLocaleLowerCase()),
          )
          .slice(0, 30)
      : sourceOptions;
  const activeError =
    kind === "analyst" && user?.role !== "ANALISTA"
      ? analystsQuery.error
      : optionsQuery.error;
  const queryError = activeError
    ? getUserFriendlyErrorMessage(
        activeError,
        "No se pudieron cargar las opciones del historial.",
      )
    : null;

  return (
    <div className={styles.searchSelect} onBlur={handleBlur}>
      <input
        type="text"
        role="combobox"
        aria-controls={listboxId}
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        value={search}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => handleSearchChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
      />
      <div
        id={listboxId}
        className={styles.searchSelectMenu}
        role="listbox"
        hidden={!isOpen}
      >
        {isOpen ? (
          isFetching ? (
            <span className={styles.searchSelectMessage}>Buscando...</span>
          ) : queryError ? (
            <span className={styles.searchSelectError} role="alert">
              {queryError}
            </span>
          ) : options.length ? (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={styles.searchSelectOption}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(option.value);
                  setSearch(option.label);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <span className={styles.searchSelectMessage}>
              No hay opciones para esta búsqueda.
            </span>
          )
        ) : null}
      </div>
    </div>
  );
}
