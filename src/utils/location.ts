export const formatLocationLabel = (
  loc: { 
    name: string; 
    address?: string | null; 
    client?: { razonSocial?: string } | null 
  }
): string => {
  let label = loc.name;

  // Si tiene una empresa o cliente específico operando en ese parque
  if (loc.client && loc.client.razonSocial) {
    label += ` (${loc.client.razonSocial})`;
  }

  // Si cuenta con una bodega o muelle específico dentro de la empresa
  if (loc.address && loc.address.trim() !== '') {
    label += ` - ${loc.address}`;
  }

  return label;
};