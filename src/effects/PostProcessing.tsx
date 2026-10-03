import React from 'react';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface PostProcessProps {
  qualityTier?: 'low' | 'medium' | 'high';
}

export function PostProcessing({ qualityTier = 'high' }: PostProcessProps) {
  if (qualityTier === 'low') return null; // No post-processing on low tier

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <ToneMapping 
        blendFunction={BlendFunction.NORMAL} 
        adaptive={true} 
      />
      <Bloom 
        intensity={1.2} 
        luminanceThreshold={0.4} 
        luminanceSmoothing={0.9} 
        mipmapBlur 
      />
      <Vignette 
        eskil={false} 
        offset={0.1} 
        darkness={0.8} 
        blendFunction={BlendFunction.NORMAL} 
      />
    </EffectComposer>
  );
}
