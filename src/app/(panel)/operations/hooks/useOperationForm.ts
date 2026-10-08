'use client';

import { useState, useMemo, useEffect } from 'react';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { useClients } from '@/hooks/useClient';
import { useLocations } from '@/app/(panel)/locations/hooks/useLocation';
import { operationService } from '@/services/operation.service';
import { useTariffs } from '../../tariff/hooks/useTariff';
import { Operation } from '@/types/operation-types';
import { useTrafico } from './useOperations';

export const useOperationForm = (onClose: () => void, operationBase?: Operation | null) => {
    const { updateOperation, isLoadingOperations } = useTrafico(); 
    const { clients } = useClients();
    const { locations, isLoadingLocations } = useLocations();
    const { suggestedPrice, isCalculatingPrice, getLiveQuote, resetQuote } = useTariffs();

    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEdit = !!operationBase;

    const [currentType, setCurrentType] = useState<string>(operationBase?.type || '');
    const [isAnticipada, setIsAnticipada] = useState<boolean>(operationBase?.isAnticipada || false);
    const [selectedDescargueId, setSelectedDescargueId] = useState<number | null>(
        operationBase?.descargue?.id || operationBase?.cargue?.id || null
    );
    const [origenId, setOrigenId] = useState<number | null>(operationBase?.origen?.id || null);
    const [destinoId, setDestinoId] = useState<number | null>(operationBase?.destino?.id || null);
    const [clientId, setClientId] = useState<number | null>(operationBase?.client?.id || operationBase?.clientId || null);

    const isExport = currentType === 'EXPORTACION' || currentType.includes('Exportación');
    const isImport = currentType === 'IMPORTACION' || currentType.includes('Importación');
    const isRetiroVacio = currentType === 'RETIRO_VACIO';
    const isDevolucion = currentType === 'DEVOLUCION';

    // 📍 Búsqueda de locaciones físicas
    const origenLocation = locations.find(loc => loc.id === origenId);
    const destinoLocation = locations.find(loc => loc.id === destinoId);
    const descargueLocation = locations.find(loc => loc.id === selectedDescargueId);

    // 🚀 USO DE LAS VARIABLES: Control dinámico de citas obligatorias
    const exigeCitaOrigen = Boolean(origenLocation?.exigeCita);
    const exigeCitaDestino = Boolean(destinoLocation?.exigeCita || descargueLocation?.exigeCita);

    // 🚀 Valores precargados alineados al esquema oficial de Prisma
    const initialValues = useMemo(() => {
        if (!operationBase) return {};
        const formatDate = (dateStr?: string | Date | null) => 
            dateStr ? new Date(dateStr).toISOString().slice(0, 16) : '';

        return {
            type: operationBase.type,
            clientId: operationBase.client?.id || operationBase.clientId,
            isAnticipada: operationBase.isAnticipada,
            origenId: operationBase.origen?.id,
            descargueId: operationBase.descargue?.id || operationBase.cargue?.id,
            destinoId: operationBase.destino?.id,
            
            // Datos Pesados de Tráfico y Carga
            containerNumber: operationBase.containerNumber || '',
            containerType: operationBase.containerType || 'DRY_40',
            peso: operationBase.peso || '', 
            sealNumber: operationBase.sealNumber || '', 
            pinRetiro: operationBase.pinRetiro || '', 
            
            // Documentación
            numeroPedido: operationBase.numeroPedido || '', 
            documentoTransporte: operationBase.documentoTransporte || '', 
            
            observaciones: operationBase.observaciones || '',
            fleteCobroManual: operationBase.fleteCobroManual || operationBase.fleteCobro || '', 
            
            // Fechas operativas
            scheduledAt: formatDate(operationBase.scheduledAt),
            fechaCitaOrigen: formatDate(operationBase.fechaCitaOrigen),
            fechaCitaDestino: formatDate(operationBase.fechaCitaDestino),
            fechaRetiro: formatDate(operationBase.fechaRetiro),
            fechaLimiteDevolucion: formatDate(operationBase.fechaLimiteDevolucion),
        };
    }, [operationBase]);

    useEffect(() => {
        // 🚀 Quitamos '!isEdit' para que TAMBIÉN consulte cuando esté editando
        if (!clientId || !currentType) {
            resetQuote();
            return;
        }

        // Definimos la locación comercial según el tipo de operación
        const commercialLocationId = (isImport || isExport) ? (selectedDescargueId || undefined) : undefined;
        
        // ¡Aquí se lanza la petición al backend en tiempo real!
        getLiveQuote(clientId, currentType, isAnticipada, commercialLocationId);
    }, [clientId, currentType, isAnticipada, selectedDescargueId, isImport, isExport, getLiveQuote, resetQuote]);

    const typeOptions = [
        { value: 'IMPORTACION', label: 'Importación' },
        { value: 'EXPORTACION', label: 'Exportación' },
        { value: 'RETIRO_VACIO', label: 'Retiro de Vacío' },
        { value: 'DEVOLUCION', label: 'Devolución de Vacío' }
    ];

    const getOrigenOptions = () => {
        if (isImport) return locations.filter(loc => loc.isPort).map(l => ({ value: l.id, label: l.name }));
        if (isExport || isRetiroVacio) return locations.filter(loc => loc.isDepot).map(l => ({ value: l.id, label: l.name }));
        return locations.map(l => ({ value: l.id, label: l.name }));
    };

    const getDescargueOptions = () => {
        return locations
            .filter(loc => !loc.isPort && !loc.isDepot && loc.clients?.some(c => c.isClient))
            .map(l => ({ value: l.id, label: l.name }));
    };

    const getDestinoOptions = () => {
        if (isImport || isDevolucion) return locations.filter(loc => loc.isDepot).map(l => ({ value: l.id, label: l.name }));
        if (isExport) return locations.filter(loc => loc.isPort).map(l => ({ value: l.id, label: l.name }));
        if (isRetiroVacio) {
            return locations
                .filter(loc => !loc.isPort && !loc.isDepot && loc.clients?.some(c => c.isClient))
                .map(l => ({ value: l.id, label: l.name }));
        }
        return locations.map(l => ({ value: l.id, label: l.name }));
    };

    const getClientOptions = () => {
        if (selectedDescargueId) {
            const selectedLoc = locations.find(loc => loc.id === selectedDescargueId);
            if (selectedLoc && selectedLoc.clients && selectedLoc.clients.length > 0) {
                const validClientIds = selectedLoc.clients.map((c: any) => c.clientId);
                return clients
                    .filter(client => validClientIds.includes(client.id))
                    .map(client => ({ value: client.id, label: client.razonSocial }));
            }
        }
        return clients.map(client => ({ value: client.id, label: client.razonSocial }));
    };

    // 🚀 FORM FIELDS (Integrando exigeCitaOrigen y exigeCitaDestino en las etiquetas)
    const formFields: FormField[] = useMemo(() => {
        const fields: FormField[] = [
            { name: 'type', label: 'Tipo de Operación *', type: 'select', options: typeOptions, disabled: isEdit },
            { name: 'clientId', label: 'Cliente *', type: 'select', options: getClientOptions(), disabled: isEdit },
        ];

        if (isExport) {
            fields.push({ name: 'isAnticipada', label: '¿Es Exportación Anticipada?', type: 'checkbox', disabled: isEdit });
            if (isAnticipada) {
                fields.push({ name: 'scheduledAt', label: 'Fecha Programada *', type: 'datetime-local' });
            }
        }

        if (currentType) {
            fields.push(
                { name: 'origenId', label: isExport ? 'Patio de Retiro (Vacío) *' : 'Puerto de Retiro (Lleno) *', type: 'select', options: getOrigenOptions() },
                { name: 'descargueId', label: isExport ? 'Lugar de Cargue (Cliente) *' : 'Lugar de Descargue (Cliente) *', type: 'select', options: getDescargueOptions() },
                { name: 'destinoId', label: isExport ? 'Puerto de Ingreso (Lleno) *' : 'Patio de Devolución (Vacío) *', type: 'select', options: getDestinoOptions() },
                
                { name: 'containerNumber', label: 'Número de Contenedor', type: 'text', placeholder: 'Ej: MSKU1234567' },
                { name: 'containerType', label: 'Tipo Contenedor *', type: 'select', options: [{ value: 'DRY_20', label: 'DRY 20' }, { value: 'DRY_40', label: 'DRY 40' }, { value: 'HC_40', label: 'High Cube 40' }] },
                { name: 'peso', label: 'Peso (Kilos / Toneladas)', type: 'number' },
                
                { name: 'sealNumber', label: 'Sello / Precinto', type: 'text', placeholder: 'Ej: 123456' },
                { name: 'pinRetiro', label: 'PIN de Retiro', type: 'text', placeholder: 'Opcional' },
                
                { name: 'numeroPedido', label: 'Número de Pedido / Booking', type: 'text' },
                { name: 'documentoTransporte', label: 'Manifiesto / DO / BL', type: 'text', placeholder: 'Ej: BL-987654' },
                
                // Etiquetas dinámicas según si el puerto/cliente exige cita
                { 
                    name: 'fechaCitaOrigen', 
                    label: exigeCitaOrigen ? 'Cita en Origen (Obligatoria) *' : 'Cita en Origen (Opcional)', 
                    type: 'datetime-local' 
                },
                { 
                    name: 'fechaCitaDestino', 
                    label: exigeCitaDestino ? 'Cita en Destino (Obligatoria) *' : 'Cita en Destino (Opcional)', 
                    type: 'datetime-local' 
                }
            );

            if (isExport) fields.push({ name: 'fechaRetiro', label: 'Fecha de Retiro (Vacío)', type: 'datetime-local' });
            if (isImport) fields.push({ name: 'fechaLimiteDevolucion', label: 'Fecha Límite Devolución', type: 'datetime-local' });

            fields.push(
                { name: 'fleteCobroManual', label: 'Flete Manual (Opcional)', type: 'number' },
                { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
            );
        }

        return fields;
    }, [currentType, isAnticipada, selectedDescargueId, isEdit, exigeCitaOrigen, exigeCitaDestino]);

    const handleFormChange = (name: string, value: FormFieldValue) => {
        setErrors({});
        if (name === 'type') {
            setCurrentType(String(value));
            setIsAnticipada(false);
        }
        if (name === 'isAnticipada') setIsAnticipada(Boolean(value));
        if (name === 'descargueId') setSelectedDescargueId(Number(value) || null);
        if (name === 'origenId') setOrigenId(Number(value) || null);
        if (name === 'destinoId') setDestinoId(Number(value) || null);
        if (name === 'clientId') setClientId(Number(value) || null);
    };

    const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
        setErrors({});
        const localErrors: Record<string, string> = {};

        if (!formData.type && !isEdit) localErrors.type = 'El tipo es obligatorio.';
        if (!formData.clientId && !isEdit) localErrors.clientId = 'El cliente es obligatorio.';
        if (!formData.containerType) localErrors.containerType = 'El tipo de contenedor es obligatorio.';

        if (Object.keys(localErrors).length > 0) {
            setErrors(localErrors);
            return;
        }

        const payload: Record<string, any> = {};

        if (!isEdit) {
            payload.type = String(formData.type);
            payload.clientId = Number(formData.clientId);
            payload.isAnticipada = isAnticipada;
        }

        if (formData.containerType) payload.containerType = String(formData.containerType);
        if (formData.scheduledAt) payload.scheduledAt = new Date(String(formData.scheduledAt)).toISOString();
        if (formData.containerNumber) payload.containerNumber = String(formData.containerNumber).toUpperCase();
        
        if (formData.peso) payload.peso = Number(formData.peso);
        if (formData.sealNumber) payload.sealNumber = String(formData.sealNumber).toUpperCase();
        if (formData.pinRetiro) payload.pinRetiro = String(formData.pinRetiro);
        
        if (formData.numeroPedido) payload.numeroPedido = String(formData.numeroPedido);
        if (formData.documentoTransporte) payload.documentoTransporte = String(formData.documentoTransporte);
        if (formData.observaciones) payload.observaciones = String(formData.observaciones);
        if (formData.fleteCobroManual !== undefined && formData.fleteCobroManual !== '' && formData.fleteCobroManual !== null) {
            payload.fleteCobroManual = Number(formData.fleteCobroManual);
            payload.fleteCobro = null;
        } else {
            payload.fleteCobroManual = null;
            if (suggestedPrice) {
                payload.fleteCobro = Number(suggestedPrice);
            }
        }

        if (formData.origenId) payload.origenId = Number(formData.origenId);
        if (formData.destinoId) payload.destinoId = Number(formData.destinoId);
        
        if (isExport && formData.descargueId) payload.cargueId = Number(formData.descargueId);
        if (isImport && formData.descargueId) payload.descargueId = Number(formData.descargueId);

        if (formData.fechaCitaOrigen) payload.fechaCitaOrigen = new Date(String(formData.fechaCitaOrigen)).toISOString();
        if (formData.fechaCitaDestino) payload.fechaCitaDestino = new Date(String(formData.fechaCitaDestino)).toISOString();
        if (formData.fechaRetiro) payload.fechaRetiro = new Date(String(formData.fechaRetiro)).toISOString();
        if (formData.fechaLimiteDevolucion) payload.fechaLimiteDevolucion = new Date(String(formData.fechaLimiteDevolucion)).toISOString();

        try {
            if (isEdit && operationBase) {
                await updateOperation(operationBase.id, payload);
            } else {
                await operationService.createOperation(payload as any);
            }
            onClose();
        } catch (error) {
            console.error('Error al guardar la operación:', error);
            setErrors({ global: 'Ocurrió un error al guardar en el servidor.' });
        }
    };

    return {
        formFields,
        initialValues,
        handleSubmit,
        handleFormChange,
        errors,
        isLoadingOperations: isLoadingOperations || isLoadingLocations,
        suggestedPrice,
        isCalculatingPrice
    };
};