export function formatAppointmentLocationLabel(
  baseLabel: string,
  locationName?: string | null,
): string {
  const normalizedLocationName = locationName?.trim();
  return normalizedLocationName
    ? `${baseLabel} (${normalizedLocationName})`
    : baseLabel;
}
