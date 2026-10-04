import dynamic from 'next/dynamic';
import React from 'react';

const StudioShell = dynamic(() => import('@/components/StudioShell'), { ssr: false });

export default function StudioPage() {
  return <StudioShell />;
}
