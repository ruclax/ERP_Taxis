import { EmptyState } from '@erp/ui/data';
import { Card, CardBody, CardHeader } from '@erp/ui/primitives';
import type { ReactNode } from 'react';

export function PlaceholderPage({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <EmptyState
          title="Módulo en desarrollo"
          description="Esta sección se construye sobre las tablas ya creadas en Supabase. Pronto disponible."
          icon={icon}
        />
      </CardBody>
    </Card>
  );
}
