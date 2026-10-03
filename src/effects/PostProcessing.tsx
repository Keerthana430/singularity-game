import React from 'react';
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { PerformanceConfig } from '../rendering/qualityConfig';

interface PostProcessProps {
  config: PerformanceConfig;
}

export function PostProcessing({ config }: PostProcessProps) {
  if (config.postProcessing === 'none') return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* SMAA handles Anti-aliasing efficiently as a pass if requested, else we rely on WebGL MSAA on the canvas if possible, but composer disables it by default so we explicitely add SMAA for high tier */}
      {config.antiAliasing === 'smaa' && <SMAA />}
      
      <ToneMapping 
        blendFunction={BlendFunction.NORMAL} 
        adaptive={true} 
      />
      
      {config.postProcessing === 'full' && (
        <Bloom 
          intensity={1.2} 
          luminanceThreshold={0.4} 
          luminanceSmoothing={0.9} 
          mipmapBlur 
        />
      )}
      
      {config.postProcessing === 'bloom-only' && (
        <Bloom 
          intensity={1.0} 
          luminanceThreshold={0.5} 
          luminanceSmoothing={0.5} 
          // No mipmapBlur to save performance
        />
      )}

      {config.postProcessing === 'full' && (
        <Vignette 
          eskil={false} 
          offset={0.1} 
          darkness={0.8} 
          blendFunction={BlendFunction.NORMAL} 
        />
      )}
    </EffectComposer>
  );
}
