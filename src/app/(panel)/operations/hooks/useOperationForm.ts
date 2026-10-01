'use client';

import { useState, useEffect, useMemo } from 'react';
import { TIPO_OPCIONES } from '@/app/constants/operation.constants';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { createOperationSchema } from '@/schemas/operation.schema';
import { useClients } from '@/hooks/useClient';
import { useLocations } from '@/app/(panel)/locations/hooks/useLocation';
import { getOperationRules } from '@/utils/operation-rules';
import { formatLocationLabel } from '@/utils/location';
import { useOperations } from './useOperations';
import { useTariffs } from '../../tariff/hooks/useTariff';

export const useOperationForm = (onClose: () => void) => {
    const { createOperation, isLoadingOperations } = useOperations();
    const { clients } = useClients();
    const { locations, isLoadingLocations } = useLocations();
    const { suggestedPrice, isCalculatingPrice, getLiveQuote, resetQuote } = useTariffs();

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [currentType, setCurrentType] = useState<string>('');
    const [origenId, setOrigenId] = useState<number | null>(null);
    const [destinoId, setDestinoId] = useState<number | null>(null);
    const [clientId, setClientId] = useState<number | null>(null);
    const [containerType, setContainerType] = useState<string>('DRY_40');
    const [selectedDescargueId, setSelectedDescargueId] = useState<number | null>(null);
    const [isAnticipated, setIsAnticipated] = useState<boolean>(false);
    const [fleteManual, setFleteManual] = useState<number | null>(null);

    // ==========================================
    // 🧠 1. INTELIGENCIA DE TIPOS Y UBICACIONES
    // ==========================================
    const isExport = currentType === 'Ingreso de Exportación' || currentType === 'Exportación';
    const isImport = currentType === 'Retiro de Importación' || currentType === 'Importación';

    const origenLocation = locations.find(loc => loc.id === origenId);
    const destinoLocation = locations.find(loc => loc.id === destinoId);
    const descargueLocation = locations.find(loc => loc.id === selectedDescargueId);

    const exigeCitaOrigen = Boolean(origenLocation?.exigeCita);
    const exigeCitaDestino = Boolean(destinoLocation?.exigeCita || descargueLocation?.exigeCita);

    // ==========================================
    // EFECTO: COTIZADOR EN VIVO
    // ==========================================
    useEffect(() => {
        if (!clientId || !currentType) {
            resetQuote();
            return;
        }

        const typeMap: Record<string, string> = {
            'Retiro de Importación': 'IMPORTACION',
            'Ingreso de Exportación': 'EXPORTACION',
            'Retiro de Contenedor Vacío': 'RETIRO_VACIO',
            'Devolución de Contenedor Vacío': 'DEVOLUCION',
            'Importación': 'IMPORTACION',
            'Exportación': 'EXPORTACION'
        };
        const backendOperationType = typeMap[currentType] || currentType.toUpperCase().replace(/\s+/g, '_');

        let commercialLocationId = undefined;

        if (backendOperationType === 'IMPORTACION') {
            commercialLocationId = selectedDescargueId;
        } else if (backendOperationType === 'EXPORTACION') {
            commercialLocationId = selectedDescargueId;
        }

        getLiveQuote(clientId, backendOperationType, isAnticipated, commercialLocationId);
    }, [clientId, currentType, isAnticipated, selectedDescargueId, getLiveQuote, resetQuote]);

    const rules = useMemo(() => getOperationRules(currentType), [currentType]);

    const getOrigenOptions = () => {
        if (currentType === 'Retiro de Importación') return locations.filter(loc => loc.isPort).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
        if (currentType === 'Ingreso de Exportación' || currentType === 'Retiro de Contenedor Vacío') return locations.filter(loc => loc.isDepot).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
        return locations.map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    };

    const getDescargueOptions = () => {
        if (currentType === 'Retiro de Importación' || currentType === 'Ingreso de Exportación') {
            return locations.filter(loc => loc.isClient || loc.isDepot).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
        }
        return locations.map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    };

    const getDestinoOptions = () => {
        if (currentType === 'Retiro de Importación' || currentType === 'Devolución de Contenedor Vacío') return locations.filter(loc => loc.isDepot).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
        if (currentType === 'Ingreso de Exportación') return locations.filter(loc => loc.isPort).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
        if (currentType === 'Retiro de Contenedor Vacío') return locations.filter(loc => loc.isClient).map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
        return locations.map(loc => ({ value: loc.id, label: formatLocationLabel(loc) }));
    };

    const getClientOptions = () => {
        const locationIdToFilterBy = selectedDescargueId;

        if (locationIdToFilterBy) {
            const selectedLocation = locations.find(loc => loc.id === locationIdToFilterBy);

            if (selectedLocation && selectedLocation.clients && selectedLocation.clients.length > 0) {
                const validClientIds = selectedLocation.clients.map(c => c.clientId);
                return clients
                    .filter(client => validClientIds.includes(client.id))
                    .map(client => ({ value: client.id, label: client.razonSocial }));
            }

            if (selectedLocation && (selectedLocation.isClient || selectedLocation.isDepot)) {
                return [];
            }
        }

        return clients.map(client => ({ value: client.id, label: client.razonSocial }));
    };

    // ==========================================
    // 📦 2. CONFIGURACIÓN DEL SUPERFORM
    // ==========================================
    const formFields: FormField[] = [
        { name: 'type', label: 'Tipo de Operación', type: 'select', options: TIPO_OPCIONES },
        { name: 'isAnticipated', label: '¿Es una Exportación Anticipada?', type: 'checkbox', visible: currentType === 'Ingreso de Exportación' },
        { name: 'scheduledAt', label: 'Fecha Programada de Carga', type: 'date', visible: currentType === 'Ingreso de Exportación' && isAnticipated },

        { name: 'origenId', label: currentType === 'Ingreso de Exportación' ? 'Lugar de Origen (Patio Vacíos)' : 'Lugar de Origen (Puerto)', type: 'select', options: getOrigenOptions(), visible: rules.showOrigen },
        { name: 'descargueId', label: currentType === 'Ingreso de Exportación' ? 'Lugar de Cargue (Bodega)' : 'Lugar de Descargue (Bodega)', type: 'select', options: getDescargueOptions(), visible: rules.showDescargue },
        { name: 'clientId', label: 'Cliente (Filtrado por Ubicación)', type: 'select', options: getClientOptions() },
        { name: 'destinoId', label: currentType === 'Ingreso de Exportación' ? 'Destino Final (Puerto)' : 'Lugar de Devolución (Patio Vacíos)', type: 'select', options: getDestinoOptions(), visible: rules.showDestino },

        { name: 'containerNumber', label: 'Número de Contenedor', type: 'text', placeholder: 'Ej: MSKU1234567', visible: currentType === 'Ingreso de Exportación' ? isAnticipated : rules.showContainer },
        { name: 'peso', label: 'Peso (Toneladas)', type: 'number', placeholder: 'Ej: 28.5', visible: rules.showContainer },

        // 🚀 NUEVO: Documentación Legal Adicional
        { name: 'numeroPedido', label: 'Número de Pedido', type: 'text', placeholder: 'Ej: PED-2026' },
        { name: 'documentoTransporte', label: 'Manifiesto de Carga', type: 'text', placeholder: 'Opcional si es tercero' },

        {
            name: 'fechaCitaOrigen',
            label: `Cita en Origen (${origenLocation?.name || ''}) *`,
            type: 'datetime-local',
            visible: exigeCitaOrigen
        },
        {
            name: 'fechaCitaDestino',
            label: `Cita en Destino (${destinoLocation?.name || descargueLocation?.name || ''}) *`,
            type: 'datetime-local',
            visible: exigeCitaDestino
        },
        {
            name: 'fechaRetiro',
            label: 'Fecha de Retiro (Vacío)',
            type: 'datetime-local',
            visible: isExport
        },
        {
            name: 'fechaLimiteDevolucion',
            label: 'Fecha Límite Devolución (Vacío)',
            type: 'datetime-local',
            visible: isImport
        },

        { name: 'fleteCobroManual', label: 'Flete Cobrado Manual (Opcional)', type: 'number', placeholder: 'Ej: 1500000', visible: true },

        // 🚀 NUEVO: Comentarios Generales
        {
            name: 'observaciones',
            label: 'Comentarios / Observaciones',
            type: 'textarea',
            placeholder: 'Instrucciones especiales para el viaje...',
            // fullWidth: true
        }
    ];

    const handleFormChange = (name: string, value: FormFieldValue) => {
        if (name === 'type') {
            setCurrentType(String(value));
            setSelectedDescargueId(null);
            if (String(value) !== 'Ingreso de Exportación') setIsAnticipated(false);
        }

        if (name === 'descargueId') setSelectedDescargueId(Number(value) || null);
        if (name === 'origenId') setOrigenId(Number(value) || null);
        if (name === 'destinoId') setDestinoId(Number(value) || null);
        if (name === 'clientId') setClientId(Number(value) || null);
        if (name === 'containerType') setContainerType(String(value));
        if (name === 'isAnticipated') setIsAnticipated(Boolean(value));
        if (name === 'fleteCobroManual') setFleteManual(Number(value) || null);
    };

    const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
        setErrors({});
        const localErrors: Record<string, string> = {};

        // Validaciones Base
        if (!formData.type) localErrors.type = 'Seleccione un tipo';
        if (!formData.clientId) localErrors.clientId = 'Seleccione un cliente';
        if (rules.showOrigen && !formData.origenId) localErrors.origenId = 'El origen es obligatorio';
        if (rules.showDescargue && !formData.descargueId) localErrors.descargueId = 'El lugar intermedio es obligatorio';
        if (rules.showDestino && !formData.destinoId) localErrors.destinoId = 'El destino final es obligatorio';
        if (currentType === 'Ingreso de Exportación' && isAnticipated && !formData.scheduledAt) {
            localErrors.scheduledAt = 'Especifique la fecha del cronograma';
        }

        if (exigeCitaOrigen && !formData.fechaCitaOrigen) localErrors.fechaCitaOrigen = 'La cita en origen es requerida por la ubicación';
        if (exigeCitaDestino && !formData.fechaCitaDestino) localErrors.fechaCitaDestino = 'La cita en destino/descargue es requerida por la ubicación';

        if (Object.keys(localErrors).length > 0) {
            setErrors(localErrors);
            return;
        }

        const isExportAnticipada = isExport && isAnticipated;
        const showContainerFinal = isExportAnticipada || rules.showContainer;

        // Construcción del Payload
        const dataToSend: Record<string, any> = {
            type: String(formData.type),
            clientId: Number(formData.clientId),
            containerType: containerType,
            isAnticipada: isExportAnticipada,
        };

        if (isExportAnticipada && formData.scheduledAt) dataToSend.scheduledAt = new Date(String(formData.scheduledAt)).toISOString();

        if (showContainerFinal && formData.containerNumber) dataToSend.containerNumber = String(formData.containerNumber);
        if (showContainerFinal && formData.peso) dataToSend.peso = Number(formData.peso);

        // 🚀 Enviando los nuevos campos de texto
        if (formData.numeroPedido) dataToSend.numeroPedido = String(formData.numeroPedido);
        if (formData.documentoTransporte) dataToSend.documentoTransporte = String(formData.documentoTransporte);
        if (formData.observaciones) dataToSend.observaciones = String(formData.observaciones);

        if (exigeCitaOrigen && formData.fechaCitaOrigen) dataToSend.fechaCitaOrigen = new Date(String(formData.fechaCitaOrigen)).toISOString();
        if (exigeCitaDestino && formData.fechaCitaDestino) dataToSend.fechaCitaDestino = new Date(String(formData.fechaCitaDestino)).toISOString();
        if (isExport && formData.fechaRetiro) dataToSend.fechaRetiro = new Date(String(formData.fechaRetiro)).toISOString();
        if (isImport && formData.fechaLimiteDevolucion) dataToSend.fechaLimiteDevolucion = new Date(String(formData.fechaLimiteDevolucion)).toISOString();

        if (fleteManual) dataToSend.fleteCobroManual = fleteManual;

        if (formData.origenId) dataToSend.origenId = Number(formData.origenId);
        if (formData.destinoId) dataToSend.destinoId = Number(formData.destinoId);
        if (isExport && formData.descargueId) dataToSend.cargueId = Number(formData.descargueId);
        if (isImport && formData.descargueId) dataToSend.descargueId = Number(formData.descargueId);

        // Validación con Zod
        const validation = createOperationSchema.safeParse(dataToSend);
        if (!validation.success) {
            const fieldErrors: Record<string, string> = {};
            validation.error.issues.forEach(issue => {
                fieldErrors[String(issue.path[0])] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            await createOperation(validation.data as any);
            onClose();
        } catch (error) {
            console.error('💥 ERROR DEL BACKEND:', error);
        }
    };

    return {
        formFields,
        handleSubmit,
        handleFormChange,
        errors,
        isLoadingOperations: isLoadingOperations || isLoadingLocations,
        suggestedPrice,
        isCalculatingPrice
    };
};