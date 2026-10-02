export const formatLocationLabel = (
  loc: { 
    name: string; 
    address?: string | null; 
    client?: { razonSocial?: string } | null 
  }
): string => {
  let label = loc.name;

  if (loc.client && loc.client.razonSocial) {
    label += ` (${loc.client.razonSocial})`;
  }

  if (loc.address && loc.address.trim() !== '') {
    label += ` - ${loc.address}`;
  }

  return label;
};