export interface SequencePhase {
  name: string;
  duration: number; // in seconds
  onEnter?: () => void;
  onUpdate?: (progress: number) => void; // progress from 0 to 1
  onExit?: () => void;
}

export interface CinematicSequence {
  id: string;
  phases: SequencePhase[];
  maxDuration: number;
  canSkip?: boolean;
  canShorten?: boolean;
}

export class Sequencer {
  private activeSequences: Map<string, ActiveSequence> = new Map();

  start(sequence: CinematicSequence, onComplete: () => void) {
    const active: ActiveSequence = {
      sequence,
      currentPhaseIndex: 0,
      phaseElapsed: 0,
      totalElapsed: 0,
      onComplete,
    };
    this.activeSequences.set(sequence.id, active);
    this.enterPhase(active, 0);
  }

  skip(id: string, forceCompleteCallback: () => void) {
    const active = this.activeSequences.get(id);
    if (!active) return;
    
    // Call any necessary cleanup or force complete logic
    forceCompleteCallback();
    this.activeSequences.delete(id);
    active.onComplete();
  }

  update(delta: number) {
    for (const [id, active] of Array.from(this.activeSequences.entries())) {
      active.totalElapsed += delta;

      if (active.totalElapsed >= active.sequence.maxDuration) {
        console.warn(`Sequence ${id} exceeded max duration. Force completing.`);
        this.activeSequences.delete(id);
        active.onComplete();
        continue;
      }

      const phase = active.sequence.phases[active.currentPhaseIndex];
      if (!phase) {
        this.activeSequences.delete(id);
        active.onComplete();
        continue;
      }

      active.phaseElapsed += delta;
      const progress = phase.duration > 0 ? Math.min(1, active.phaseElapsed / phase.duration) : 1;

      if (phase.onUpdate) {
        phase.onUpdate(progress);
      }

      if (progress >= 1) {
        if (phase.onExit) phase.onExit();
        active.currentPhaseIndex++;
        active.phaseElapsed = 0;

        if (active.currentPhaseIndex < active.sequence.phases.length) {
          this.enterPhase(active, active.currentPhaseIndex);
        } else {
          this.activeSequences.delete(id);
          active.onComplete();
        }
      }
    }
  }

  private enterPhase(active: ActiveSequence, index: number) {
    const phase = active.sequence.phases[index];
    if (phase && phase.onEnter) {
      phase.onEnter();
    }
  }
}

interface ActiveSequence {
  sequence: CinematicSequence;
  currentPhaseIndex: number;
  phaseElapsed: number;
  totalElapsed: number;
  onComplete: () => void;
}

export const globalSequencer = new Sequencer();
