import { describe, it, expect, vi } from 'vitest';
import { Sequencer, CinematicSequence } from '../src/animation/Sequencer';

describe('Sequencer', () => {
  it('runs through phases sequentially and calls onComplete', () => {
    const sequencer = new Sequencer();
    
    const onEnter1 = vi.fn();
    const onEnter2 = vi.fn();
    const onComplete = vi.fn();

    const sequence: CinematicSequence = {
      id: 'test-seq',
      maxDuration: 10,
      phases: [
        { name: 'phase1', duration: 1, onEnter: onEnter1 },
        { name: 'phase2', duration: 1, onEnter: onEnter2 }
      ]
    };

    sequencer.start(sequence, onComplete);

    expect(onEnter1).toHaveBeenCalled();
    expect(onEnter2).not.toHaveBeenCalled();

    sequencer.update(1.0); // finishes phase 1
    
    expect(onEnter2).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();

    sequencer.update(1.0); // finishes phase 2

    expect(onComplete).toHaveBeenCalled();
  });

  it('force-completes if maxDuration is exceeded', () => {
    const sequencer = new Sequencer();
    const onComplete = vi.fn();

    const sequence: CinematicSequence = {
      id: 'test-seq-watchdog',
      maxDuration: 2,
      phases: [
        { name: 'phase1', duration: 10 }
      ]
    };

    sequencer.start(sequence, onComplete);
    sequencer.update(2.1); // exceeds maxDuration

    expect(onComplete).toHaveBeenCalled();
  });

  it('allows skipping and calls forceCompleteCallback', () => {
    const sequencer = new Sequencer();
    const onComplete = vi.fn();
    const forceComplete = vi.fn();

    const sequence: CinematicSequence = {
      id: 'test-seq-skip',
      maxDuration: 5,
      phases: [
        { name: 'phase1', duration: 5 }
      ]
    };

    sequencer.start(sequence, onComplete);
    sequencer.skip('test-seq-skip', forceComplete);

    expect(forceComplete).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });
});
