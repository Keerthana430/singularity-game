import dynamic from 'next/dynamic';
import React from 'react';

const HomeShell = dynamic(() => import('@/components/HomeShell'), { ssr: false });

export default function HomePage() {
  return <HomeShell />;
}
