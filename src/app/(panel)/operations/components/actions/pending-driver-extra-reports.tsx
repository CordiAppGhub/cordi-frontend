'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperModal } from '@/components/organisms/modal/modal';
import { Button } from '@/components/atoms/button/button';
import {
  operationService,
  type DriverExtraReport,
} from '@/services/operation.service';
import { useTariffs } from '@/app/(panel)/tariff/hooks/useTariff';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { showToast } from '@/utils/alerts';
import { OperationPatioChargeSelector } from './operation-patio-charge-selector';

interface PendingDriverExtraReportsProps {
  autoOpenOperationId?: number | null;
  autoOpenReportId?: number | null;
  compact?: boolean;
  onAutoOpenHandled?: () => void;
  onClose?: () => void;
}

export function PendingDriverExtraReports({
  autoOpenOperationId,
  autoOpenReportId,
  compact = false,
  onAutoOpenHandled,
  onClose,
}: PendingDriverExtraReportsProps) {
  const queryClient = useQueryClient();
  const { surcharges } = useTariffs();
  const reportsQuery = useQuery({
    queryKey: ['driver-extra-reports', 'pending'],
    queryFn: operationService.getPendingExtraReports,
  });
  const [selectedReport, setSelectedReport] = useState<DriverExtraReport | null>(
    null,
  );
  const selectedOperationQuery = useQuery({
    queryKey: ['trafico-detail', selectedReport?.operationId],
    queryFn: () =>
      operationService.getOperationById(selectedReport?.operationId ?? 0),
    enabled: selectedReport !== null,
  });
  const [conceptId, setConceptId] = useState('');
  const [amount, setAmount] = useState('');
  const [cost, setCost] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPatioCharge, setIsPatioCharge] = useState(false);
  const [patioLocationId, setPatioLocationId] = useState<number | null>(null);

  const openReport = (report: DriverExtraReport) => {
    setSelectedReport(report);
    setConceptId(
      report.concept?.code ??
        report.novedad?.metadata?.conceptId ??
        report.conceptCode ??
        '',
    );
    setAmount('');
    setCost('0');
    setIsPatioCharge(false);
    setPatioLocationId(null);
  };

  const closeReport = () => {
    setSelectedReport(null);
    setIsPatioCharge(false);
    setPatioLocationId(null);
    onClose?.();
  };

  useEffect(() => {
    if (
      (autoOpenOperationId == null && autoOpenReportId == null) ||
      !reportsQuery.data
    ) return;
    const report = reportsQuery.data.find((item) =>
      autoOpenReportId != null
        ? item.id === autoOpenReportId
        : item.operationId === autoOpenOperationId,
    );
    if (report) openReport(report);
    onAutoOpenHandled?.();
  }, [
    autoOpenOperationId,
    autoOpenReportId,
    onAutoOpenHandled,
    reportsQuery.data,
  ]);

  const visibleReports =
    autoOpenOperationId == null && autoOpenReportId == null
      ? reportsQuery.data
      : reportsQuery.data?.filter(
          (report) =>
            autoOpenReportId != null
              ? report.id === autoOpenReportId
              : report.operationId === autoOpenOperationId,
        );

  const approveReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedReport || !conceptId) return;
    if (isPatioCharge && patioLocationId === null) {
      showToast.error('Selecciona el patio asociado al cobro.');
      return;
    }
    const parsedAmount = Number(amount);
    const parsedCost = Number(cost);
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0 ||
      !Number.isFinite(parsedCost) ||
      parsedCost < 0
    ) {
      showToast.error('Ingresa valores válidos para el cobro y el costo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await operationService.approveExtraReport(selectedReport.id, {
        conceptId,
        amount: parsedAmount,
        cost: parsedCost,
        isPatioCharge,
        ...(isPatioCharge && patioLocationId !== null
          ? { patioLocationId }
          : {}),
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['driver-extra-reports', 'pending'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['trafico-detail', selectedReport.operationId],
        }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({
          queryKey: ['trafico-client-operations'],
        }),
        queryClient.invalidateQueries({ queryKey: ['profiles'] }),
      ]);
      showToast.success('Reporte aprobado y recargo agregado a la operación.');
      closeReport();
      onAutoOpenHandled?.();
    } catch (error) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo aprobar el reporte.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    {/* {!compact && <section
      aria-labelledby="pending-extra-reports-heading"
      style={{
        margin: 0,
        padding: '12px 16px',
        border: '1px solid #fed7aa',
        borderRadius: 10,
        background: '#fff7ed',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <h2 id="pending-extra-reports-heading" style={{ margin: 0 }}>
            Reportes de cobros extras
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12 }}>
            Revisa y valoriza los reportes de conductores.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!reportsQuery.isLoading && !reportsQuery.isError && (
            <span
              style={{
                padding: '4px 9px',
                borderRadius: 999,
                background: '#ffedd5',
                color: '#9a3412',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {visibleReports?.length ?? 0} pendientes
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void reportsQuery.refetch()}
            disabled={reportsQuery.isFetching}
          >
            Actualizar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Contraer' : 'Ver'}
          </Button>
        </div>
      </div>

      {reportsQuery.isLoading ? (
        isExpanded && <p role="status" style={{ marginBottom: 0 }}>Cargando reportes pendientes…</p>
      ) : reportsQuery.isError ? (
        isExpanded && <p role="alert" style={{ marginBottom: 0 }}>No se pudieron cargar los reportes pendientes.</p>
      ) : visibleReports?.length ? (
        isExpanded && <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {visibleReports.map((report) => (
            <article
              key={report.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                padding: 12,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              <div>
                <strong>
                  {report.concept?.name ?? report.novedad?.metadata?.conceptName ?? report.conceptCode ?? 'Novedad'} · Operación #{report.operationId}
                </strong>
                <div style={{ color: '#475569', marginTop: 4 }}>
                  {report.operation.client?.razonSocial ?? 'Cliente sin registrar'}
                  {' · '}
                  {report.driver.name ?? `Conductor #${report.driver.id}`}
                  {report.durationHours != null
                    ? ` · ${report.durationHours} h`
                    : ''}
                </div>
                <small>{new Date(report.createdAt).toLocaleString('es-CO')}</small>
              </div>
              <Button type="button" onClick={() => openReport(report)}>
                Revisar y monetizar
              </Button>
            </article>
          ))}
        </div>
      ) : (
        isExpanded && <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: 13 }}>No hay reportes pendientes.</p>
      )}
    </section>} */}

      <SuperModal
        isOpen={selectedReport !== null}
        onClose={closeReport}
        title={
          selectedReport
            ? `Aprobar reporte #${selectedReport.id} · Operación #${selectedReport.operationId}`
            : 'Aprobar reporte'
        }
        width="620px"
      >
        {selectedReport && (
          <form onSubmit={(event) => void approveReport(event)} style={{ display: 'grid', gap: 12 }}>
            <div>
              <strong>{selectedReport.concept?.name ?? selectedReport.novedad?.metadata?.conceptName ?? selectedReport.conceptCode ?? 'Novedad'}</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
              {selectedReport.durationHours != null && (
                <p>Duración reportada: {selectedReport.durationHours} horas</p>
              )}
              {selectedReport.operation.containerNumber && (
                <p>Contenedor: {selectedReport.operation.containerNumber}</p>
              )}
              {selectedReport.evidenceUrl ? (
                <a href={selectedReport.evidenceUrl} target="_blank" rel="noreferrer">
                  Abrir evidencia del conductor
                </a>
              ) : (
                <p>No se adjuntó evidencia fotográfica.</p>
              )}
            </div>

            <OperationPatioChargeSelector
              operation={selectedOperationQuery.data}
              isPatioCharge={isPatioCharge}
              patioLocationId={patioLocationId}
              disabled={isSubmitting}
              onPatioChargeChange={setIsPatioCharge}
              onPatioLocationChange={setPatioLocationId}
            />

            <label style={{ display: 'grid', gap: 6 }}>
              Concepto del catálogo
              <select
                required
                value={conceptId}
                onChange={(event) => {
                  const selectedCode = event.target.value;
                  setConceptId(selectedCode);
                  const concept = surcharges.find(
                    (item) => item.code === selectedCode,
                  );
                  if (concept) setAmount(String(concept.basePrice ?? 0));
                }}
              >
                <option value="">Selecciona un concepto</option>
                {surcharges.map((concept) => (
                  <option key={concept.code} value={concept.code}>
                    {concept.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              Cobro al cliente (COP)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              Costo (COP)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
              />
            </label>
            {surcharges.length === 0 && (
              <p role="alert">
                No hay conceptos de recargo configurados. Crea uno en Tarifas
                antes de aprobar el reporte.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={closeReport}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={
                  isSubmitting ||
                  !conceptId ||
                  surcharges.length === 0 ||
                  (isPatioCharge && patioLocationId === null)
                }
              >
                Aprobar y agregar recargo
              </Button>
            </div>
          </form>
        )}
      </SuperModal>
    </>
  );
}
