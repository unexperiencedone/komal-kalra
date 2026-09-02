'use client';

import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ConfirmActionButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row print:hidden">
      <Button onClick={() => window.print()} size="lg">
        <Printer aria-hidden /> Print receipt
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="/">
          <ArrowLeft aria-hidden /> Back to home
        </Link>
      </Button>
    </div>
  );
}
