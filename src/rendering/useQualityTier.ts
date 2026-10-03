import { useState, useEffect } from 'react';
import { getGPUTier } from 'detect-gpu';
import { QualityTier, TIER_CONFIGS, PerformanceConfig } from './qualityConfig';

export function useQualityTier() {
  const [tier, setTier] = useState<QualityTier>('high');
  const [config, setConfig] = useState<PerformanceConfig>(TIER_CONFIGS.high);
  const [dpr, setDpr] = useState<number>(1);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function detect() {
      try {
        const gpuTier = await getGPUTier();
        
        if (!mounted) return;

        let resolvedTier: QualityTier = 'high';
        
        // detect-gpu returns tier 1 (low), 2 (mid), 3 (high)
        if (gpuTier.tier === 1 || gpuTier.isMobile) {
           // On mobile, default to medium unless it's a very high-end device (tier 3)
           resolvedTier = (gpuTier.isMobile && gpuTier.tier === 3) ? 'high' : (gpuTier.tier === 1 ? 'low' : 'medium');
        } else if (gpuTier.tier === 2) {
          resolvedTier = 'medium';
        }

        setTier(resolvedTier);
        
        const tierConfig = TIER_CONFIGS[resolvedTier];
        setConfig(tierConfig);
        
        // Calculate DPR based on config
        const maxDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
        setDpr(tierConfig.pixelRatio === 0 ? maxDpr : Math.min(maxDpr, tierConfig.pixelRatio));
        
      } catch (e) {
        // Fallback to medium if detection fails
        if (mounted) {
          setTier('medium');
          setConfig(TIER_CONFIGS.medium);
          setDpr(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5));
        }
      } finally {
        if (mounted) setIsDetecting(false);
      }
    }

    detect();
    
    return () => { mounted = false; };
  }, []);

  return { tier, config, dpr, isDetecting, setTier };
}
