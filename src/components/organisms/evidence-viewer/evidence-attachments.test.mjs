import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getEvidenceAttachments } from './evidence-attachments.ts';

test('collects and deduplicates all images and documents in order', () => {
  assert.deepEqual(
    getEvidenceAttachments({
      type: 'CARGA',
      url: 'https://example.test/a.jpg',
      photosUrl: ['https://example.test/a.jpg', 'https://example.test/b.jpg'],
      anomalyPhotosUrl: ['https://example.test/c.jpg'],
      deliveryDocsUrl: ['https://example.test/doc.PDF?download=1', 'https://example.test/d.jpg'],
      tirillaEirUrl: 'https://example.test/e.jpg',
    }),
    [
      { url: 'https://example.test/a.jpg', isPdf: false },
      { url: 'https://example.test/b.jpg', isPdf: false },
      { url: 'https://example.test/c.jpg', isPdf: false },
      { url: 'https://example.test/doc.PDF?download=1', isPdf: true },
      { url: 'https://example.test/d.jpg', isPdf: false },
      { url: 'https://example.test/e.jpg', isPdf: false },
    ],
  );
});

test('handles missing primary URLs and recognizes the primary PDF format', () => {
  assert.deepEqual(getEvidenceAttachments({ type: 'VACIO', url: null }), []);
  assert.deepEqual(
    getEvidenceAttachments({ type: 'PDF', url: 'https://example.test/file', formato: 'PDF' }),
    [{ url: 'https://example.test/file', isPdf: true }],
  );
});
