const DUEL_MAX_HP = 100;
let gameMode = 'ai'; // 'ai' or 'friends'
let aiDifficulty = 'normal';
let isDuel = false;
let duelState = null;
const duelArenaCenter = new THREE.Vector3(-40, 20, -40);

const MATCHUP = {
  'attack': {
    'attack': { p1: -10, p2: -10, msg: 'CLASH!' },
    'heavy': { p1: 0, p2: -25, msg: 'INTERRUPT!' },
    'dodge': { p1: -15, p2: 0, msg: 'DODGE & COUNTER!' },
    'block': { p1: -5, p2: 0, msg: 'BLOCKED!' }
  },
  'heavy': {
    'attack': { p1: -25, p2: 0, msg: 'INTERRUPTED!' },
    'heavy': { p1: -20, p2: -20, msg: 'HEAVY CLASH!' },
    'dodge': { p1: 0, p2: -35, msg: 'CAUGHT DODGE!' },
    'block': { p1: 0, p2: -30, msg: 'GUARD BREAK!' }
  },
  'dodge': {
    'attack': { p1: 0, p2: -15, msg: 'DODGE & COUNTER!' },
    'heavy': { p1: -35, p2: 0, msg: 'CAUGHT DODGE!' },
    'dodge': { p1: 0, p2: 0, msg: 'REPOSITION' },
    'block': { p1: 0, p2: 0, msg: 'STAREDOWN' }
  },
  'block': {
    'attack': { p1: 0, p2: -5, msg: 'BLOCKED!' },
    'heavy': { p1: -30, p2: 0, msg: 'GUARD BREAK!' },
    'dodge': { p1: 0, p2: 0, msg: 'STAREDOWN' },
    'block': { p1: 0, p2: 0, msg: 'STAREDOWN' }
  }
};

function resolveDuelMove(m1, m2) {
  if(!m1) m1 = 'block'; // timeout default
  if(!m2) m2 = 'block';
  return MATCHUP[m1][m2];
}

function getAiMove(diff) {
  const moves = ['attack', 'heavy', 'dodge', 'block'];
  if(diff === 'easy') return moves[Math.floor(Math.random()*4)];
  const r = Math.random();
  if(diff === 'normal') {
    if(r < 0.4) return 'attack';
    if(r < 0.6) return 'heavy';
    if(r < 0.8) return 'dodge';
    return 'block';
  }
  if(r < 0.3) return 'attack';
  if(r < 0.5) return 'heavy';
  if(r < 0.8) return 'dodge';
  return 'block';
}

function showDmg(pos, amt) {
  if(amt >= 0) return;
  const d = document.createElement('div');
  d.className = 'dmg-popup';
  d.textContent = amt;
  document.body.appendChild(d);
  
  // Project 3d to 2d
  const p = pos.clone();
  p.project(cam);
  const x = (p.x * .5 + .5) * window.innerWidth;
  const y = (p.y * -.5 + .5) * window.innerHeight;
  d.style.left = (x - 20) + 'px';
  d.style.top = (y - 40) + 'px';
  
  setTimeout(()=>d.remove(), 1000);
}

async function playDuelAnim(p, action, isLeft) {
  const cg = p.c.g;
  const dir = isLeft ? 1 : -1;
  if(action === 'attack') {
    await tween(0.15, k => { cg.position.x += dir * Math.sin(k*Math.PI)*0.5; cg.rotation.z = -dir * Math.sin(k*Math.PI)*0.3; });
  } else if(action === 'heavy') {
    await tween(0.3, k => { cg.position.y += Math.sin(k*Math.PI)*1.0; cg.position.x += dir * Math.sin(k*Math.PI)*0.8; cg.rotation.x = Math.sin(k*Math.PI)*0.5; });
  } else if(action === 'dodge') {
    await tween(0.2, k => { cg.position.z += Math.sin(k*Math.PI)*1.5; cg.rotation.y += Math.sin(k*Math.PI)*1.0; });
  } else if(action === 'block') {
    await tween(0.2, k => { cg.scale.setScalar(1 - Math.sin(k*Math.PI)*0.1); });
  }
}

async function runDuel(p1, p2) {
  isDuel = true;
  duelState = { p1, p2, p1Hp: DUEL_MAX_HP, p2Hp: DUEL_MAX_HP, phase: 'init', p1Action: null, p2Action: null };
  
  // 1. Save state & move to arena
  const p1Base = p1.c.g.position.clone();
  const p2Base = p2.c.g.position.clone();
  const p1Rot = p1.c.g.rotation.clone();
  const p2Rot = p2.c.g.rotation.clone();
  
  p1.c.g.position.copy(duelArenaCenter).add(new THREE.Vector3(-3, 0, 0));
  p2.c.g.position.copy(duelArenaCenter).add(new THREE.Vector3(3, 0, 0));
  p1.c.g.rotation.set(0, Math.PI/2, 0);
  p2.c.g.rotation.set(0, -Math.PI/2, 0);
  
  // 2. Setup UI
  $('duel-ui').classList.add('active');
  $('duel-p1-name').textContent = p1.name;
  $('duel-p2-name').textContent = p2.name;
  
  const updateHp = () => {
    $('duel-p1-hp').style.width = Math.max(0, (duelState.p1Hp / DUEL_MAX_HP)*100) + '%';
    $('duel-p2-hp').style.width = Math.max(0, (duelState.p2Hp / DUEL_MAX_HP)*100) + '%';
    $('duel-p1-val').textContent = Math.max(0, duelState.p1Hp) + ' / ' + DUEL_MAX_HP;
    $('duel-p2-val').textContent = Math.max(0, duelState.p2Hp) + ' / ' + DUEL_MAX_HP;
  };
  updateHp();
  
  // Move camera
  const oldCamPos = cam.position.clone();
  const oldTarget = ctl.target.clone();
  
  ctl.target.copy(duelArenaCenter).add(new THREE.Vector3(0, 2, 0));
  cam.position.copy(duelArenaCenter).add(new THREE.Vector3(0, 4, 12));
  
  cap("DUEL! " + p1.name + " vs " + p2.name);
  await sleep(1500);
  
  // Duel Loop
  while(duelState.p1Hp > 0 && duelState.p2Hp > 0) {
    duelState.p1Action = null;
    duelState.p2Action = null;
    duelState.phase = 'input';
    
    cap("SELECT YOUR MOVE!");
    
    // Timer for input
    for(let t=0; t<30; t++) {
      if(gameMode === 'ai') {
        if(p1.isAi && !duelState.p1Action) duelState.p1Action = getAiMove(aiDifficulty);
        if(p2.isAi && !duelState.p2Action) duelState.p2Action = getAiMove(aiDifficulty);
      }
      if(duelState.p1Action && duelState.p2Action) break;
      await sleep(100);
    }
    
    duelState.phase = 'resolve';
    const m1 = duelState.p1Action;
    const m2 = duelState.p2Action;
    
    const res = resolveDuelMove(m1, m2);
    cap(res.msg);
    
    // Animations
    const p1Anim = playDuelAnim(p1, m1, true);
    const p2Anim = playDuelAnim(p2, m2, false);
    await Promise.all([p1Anim, p2Anim]);
    
    duelState.p1Hp += res.p1;
    duelState.p2Hp += res.p2;
    updateHp();
    
    if(res.p1 < 0) { showDmg(p1.c.g.position.clone().add(new THREE.Vector3(0,2,0)), res.p1); burst(p1.c.g.position); Snd.playSnake(); }
    if(res.p2 < 0) { showDmg(p2.c.g.position.clone().add(new THREE.Vector3(0,2,0)), res.p2); burst(p2.c.g.position); Snd.playSnake(); }
    
    // Re-center
    p1.c.g.position.copy(duelArenaCenter).add(new THREE.Vector3(-3, 0, 0));
    p2.c.g.position.copy(duelArenaCenter).add(new THREE.Vector3(3, 0, 0));
    
    await sleep(1000);
  }
  
  const winner = duelState.p1Hp > 0 ? p1 : (duelState.p2Hp > 0 ? p2 : p1); // p1 wins ties
  cap(winner.name + " WINS THE DUEL!");
  Snd.playWin();
  await sleep(2000);
  
  $('duel-ui').classList.remove('active');
  isDuel = false;
  duelState = null;
  
  // Restore
  p1.c.g.position.copy(p1Base);
  p2.c.g.position.copy(p2Base);
  p1.c.g.rotation.copy(p1Rot);
  p2.c.g.rotation.copy(p2Rot);
  
  ctl.target.copy(oldTarget);
  cam.position.copy(oldCamPos);
  
  return winner;
}

async function retreatPlayer(p) {
  const safeTile = Math.max(1, p.i - 1);
  cap(p.name + " retreats to tile " + safeTile);
  p.i = safeTile;
  await hopTo(p, stand(p, safeTile), 0.2);
}
