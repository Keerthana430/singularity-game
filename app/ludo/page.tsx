import dynamic from 'next/dynamic';
import React from 'react';

const LudoShell = dynamic(() => import('@/components/LudoShell'), { ssr: false });

export default function LudoPage() {
  return <LudoShell />;
}
