export interface EvidenceAttachmentSource {
  type: string;
  url?: string | null;
  formato?: string | null;
  photosUrl?: string[];
  anomalyPhotosUrl?: string[];
  deliveryDocsUrl?: string[];
  tirillaEirUrl?: string | null;
}

export interface EvidenceAttachment {
  url: string;
  isPdf: boolean;
}

export function getEvidenceAttachments(evidence: EvidenceAttachmentSource): EvidenceAttachment[] {
  const attachments = new Map<string, EvidenceAttachment>();
  const add = (url: string | null | undefined, isDocument = false) => {
    const value = url?.trim();
    if (!value) return;
    const isPdf = isDocument || /\.pdf(?:[?#]|$)/i.test(value);
    const existing = attachments.get(value);
    attachments.set(value, { url: value, isPdf: isPdf || Boolean(existing?.isPdf) });
  };
  add(evidence.url, evidence.formato?.toLowerCase() === 'pdf');
  evidence.photosUrl?.forEach((url) => add(url));
  evidence.anomalyPhotosUrl?.forEach((url) => add(url));
  evidence.deliveryDocsUrl?.forEach((url) => add(url));
  add(evidence.tirillaEirUrl);
  return [...attachments.values()];
}
