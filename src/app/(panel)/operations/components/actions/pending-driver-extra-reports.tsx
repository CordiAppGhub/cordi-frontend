'use client';

import { useState } from 'react';
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

const reportTypeLabels: Record<DriverExtraReport['type'], string> = {
  STAND_BY: 'Stand by / espera',
  DESVIO: 'Desvío operativo',
  MANIOBRA_EXTRA: 'Maniobra extra',
  EN_PISO: 'Contenedor en piso',
};

export function PendingDriverExtraReports() {
  const queryClient = useQueryClient();
  const { surcharges } = useTariffs();
  const reportsQuery = useQuery({
    queryKey: ['driver-extra-reports', 'pending'],
    queryFn: operationService.getPendingExtraReports,
  });
  const [selectedReport, setSelectedReport] = useState<DriverExtraReport | null>(
    null,
  );
  const [conceptId, setConceptId] = useState('');
  const [amount, setAmount] = useState('');
  const [cost, setCost] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openReport = (report: DriverExtraReport) => {
    setSelectedReport(report);
    setConceptId('');
    setAmount('');
    setCost('0');
  };

  const approveReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedReport || !conceptId) return;
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
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['driver-extra-reports', 'pending'],
        }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({
          queryKey: ['trafico-client-operations'],
        }),
        queryClient.invalidateQueries({ queryKey: ['profiles'] }),
      ]);
      showToast.success('Reporte aprobado y recargo agregado a la operación.');
      setSelectedReport(null);
    } catch (error) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo aprobar el reporte.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="pending-extra-reports-heading"
      style={{
        marginBottom: 20,
        padding: 18,
        border: '1px solid #fed7aa',
        borderRadius: 12,
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
          <p style={{ margin: '5px 0 0', color: '#475569' }}>
            Revisa la evidencia y define el concepto y valores del recargo.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void reportsQuery.refetch()}
          disabled={reportsQuery.isFetching}
        >
          Actualizar
        </Button>
      </div>

      {reportsQuery.isLoading ? (
        <p role="status">Cargando reportes pendientes…</p>
      ) : reportsQuery.isError ? (
        <p role="alert">No se pudieron cargar los reportes pendientes.</p>
      ) : reportsQuery.data?.length ? (
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {reportsQuery.data.map((report) => (
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
                  {reportTypeLabels[report.type]} · Operación #{report.operationId}
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
        <p style={{ marginBottom: 0 }}>No hay reportes pendientes.</p>
      )}

      <SuperModal
        isOpen={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
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
              <strong>{reportTypeLabels[selectedReport.type]}</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
              {selectedReport.durationHours != null && (
                <p>Duración reportada: {selectedReport.durationHours} horas</p>
              )}
              {selectedReport.operation.containerNumber && (
                <p>Contenedor: {selectedReport.operation.containerNumber}</p>
              )}
              <a href={selectedReport.evidenceUrl} target="_blank" rel="noreferrer">
                Abrir evidencia del conductor
              </a>
            </div>

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
                onClick={() => setSelectedReport(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting || !conceptId || surcharges.length === 0}
              >
                Aprobar y agregar recargo
              </Button>
            </div>
          </form>
        )}
      </SuperModal>
    </section>
  );
}
