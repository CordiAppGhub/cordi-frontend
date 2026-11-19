export interface EvidenceAttachmentSource {
  type: string;
  url?: string | null;
  formato?: string | null;
  photosUrl?: string[];
  anomalyPhotosUrl?: string[];
  deliveryDocsUrl?: string[];
  tirillaEirUrl?: string | null;
  assets?: Array<{
    url: string;
    mimeType?: string | null;
    order?: number;
  }>;
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
  [...(evidence.assets ?? [])]
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .forEach((asset) =>
      add(
        asset.url,
        asset.mimeType?.toLowerCase() === 'application/pdf',
      ),
    );
  add(evidence.url, evidence.formato?.toLowerCase() === 'pdf');
  evidence.photosUrl?.forEach((url) => add(url));
  evidence.anomalyPhotosUrl?.forEach((url) => add(url));
  evidence.deliveryDocsUrl?.forEach((url) => add(url));
  add(evidence.tirillaEirUrl);
  return [...attachments.values()];
}
