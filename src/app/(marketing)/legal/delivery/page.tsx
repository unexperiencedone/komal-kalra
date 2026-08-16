import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/marketing/LegalDocument';
import { LEGAL_DOCUMENTS } from '@/lib/content/legal';

const doc = LEGAL_DOCUMENTS.delivery;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: '/legal/delivery' },
};

export default function Page() {
  return <LegalDocumentView doc={doc} />;
}
