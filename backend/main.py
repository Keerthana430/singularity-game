# backend/main.py
"""
Singularity AI Backend Microservice
Provides generative AI endpoints for Avatar Lore Generation, Live Battle Referee Commentary,
and NPC Tactical Combat Decision-Making.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import random

app = FastAPI(
    title="Singularity Avatar AI Engine",
    description="Python AI Backend for Avatar Lore, Combat Commentary, and Tactical RPG Decisions",
    version="1.0.0",
)

# Enable CORS — restrict origins via ALLOWED_ORIGINS env var
allowed = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiter (uses remote address by default)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# ─── Data Schemas ────────────────────────────────────────────────────────────

class AvatarProfileRequest(BaseModel):
    name: str = "Player"
    species: str = "human"
    classRole: str = "warrior"
    weapon: Optional[str] = "photon-blade"
    top: Optional[str] = "tshirt"
    accessories: Optional[Dict[str, Optional[str]]] = None
    stats: Optional[Dict[str, int]] = None


class AvatarLoreResponse(BaseModel):
    title: str
    lore: str
    battleCry: str
    personalityTraits: List[str]
    elementalAffinity: str


class CombatCommentaryRequest(BaseModel):
    roundNumber: int
    attackerName: str
    defenderName: str
    actionName: str
    damage: int
    isCritical: bool
    isDefeated: bool = False


class CommentaryResponse(BaseModel):
    commentary: str
    crowdHypeLevel: int  # 1 to 100


class TacticalMoveRequest(BaseModel):
    currentHp: int
    maxHp: int
    opponentHp: int
    opponentMaxHp: int
    availableMoves: List[str] = ["strike", "magic", "shield", "ultimate"]
    overdriveCharged: bool = False


class TacticalMoveResponse(BaseModel):
    chosenMove: str
    rationale: str


# ─── API Routes ──────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Singularity Avatar AI Engine",
        "version": "1.0.0",
        "endpoints": ["/api/ai/lore", "/api/ai/commentary", "/api/ai/tactics"],
    }


@limiter.limit("30/minute")
@app.post("/api/ai/lore", response_model=AvatarLoreResponse)
def generate_avatar_lore(profile: AvatarProfileRequest):
    """
    Generates dynamic RPG lore, backstories, titles, and battle cries
    tailored to the avatar's species, specialized class, and gear.
    """
    species = profile.species.lower()
    role = profile.classRole.lower()

    species_titles = {
        "human": ["Adaptive Pioneer", "Apex Strategist", "Grand Marshal of Neo-Earth"],
        "elf": ["Starlight Weaver", "Sylph Windstrider", "High Elder of the Astral Glade"],
        "ogre": ["Mountain Crusher", "Berserker of the Iron Crags", "Unstoppable Juggernaut"],
        "robot": ["Overclocked Synthesizer", "Prime Directive Zero", "Quantum Automaton 9"],
        "alien": ["Cosmic Harbinger", "Psionic Mindwalker", "Void Voidfarer of Sector 7"],
        "fairie": ["Faerie Luminary", "Glimmerwing Enchanter", "Aurora Sprite Queen"],
    }

    species_affinities = {
        "human": "Pure Kinetic Energy",
        "elf": "Celestial Light & Gale",
        "ogre": "Tectonic Molten Force",
        "robot": "Superconducting Ion Plasma",
        "alien": "Psionic Void Radiance",
        "fairie": "Prismatic Life Aether",
    }

    chosen_title = random.choice(species_titles.get(species, ["Cosmic Gladiator"]))
    affinity = species_affinities.get(species, "Starlight Energy")

    # Generate custom lore text
    lore_text = (
        f"Hailing from the outer sectors as a {species.capitalize()} {role.capitalize()}, "
        f"{profile.name} wields the {profile.weapon or 'bare hands'} with surgical precision. "
        f"Their innate species physiology grants uncanny combat synergy, channeling {affinity} "
        f"into every maneuver within the Singularity Colosseum."
    )

    battle_cries = {
        "human": f"By human grit and iron will, {profile.name} takes the crown!",
        "elf": "May the astral winds slice true!",
        "ogre": "CRUSH AND CONQUER! NONE STAND BEFORE ME!",
        "robot": "SYSTEM OVERCLOCK: 100%. TARGET ELIMINATION ENGAGED.",
        "alien": "Your dimensions cannot fathom our cosmic supremacy.",
        "fairie": "Glimmer and flutter... then strike with supernova force!",
    }

    return AvatarLoreResponse(
        title=f"{profile.name} the {chosen_title}",
        lore=lore_text,
        battleCry=battle_cries.get(species, f"Step forward if you dare face {profile.name}!"),
        personalityTraits=["Tenacious", "Tactical", "Fierce", "Charming"],
        elementalAffinity=affinity,
    )


@limiter.limit("60/minute")
@app.post("/api/ai/commentary", response_model=CommentaryResponse)
def generate_combat_commentary(req: CombatCommentaryRequest):
    """
    Simulates real-time esports referee commentary based on action telemetry.
    """
    if req.isDefeated:
        lines = [
            f"DOWN GOES {req.defenderName.upper()}! An absolute masterclass knockout by {req.attackerName}!",
            f"IT IS ALL OVER! The Singularity Colosseum erupts as {req.attackerName} seals the victory!",
        ]
        hype = 98
    elif req.isCritical:
        lines = [
            f"BOOM! {req.attackerName} cracks {req.defenderName} with a DEVASTATING CRITICAL {req.actionName} for {req.damage} DMG!",
            f"UNBELIEVABLE POWER! A clean critical hit from {req.attackerName} sends shockwaves across the neon platform!",
        ]
        hype = 88
    else:
        lines = [
            f"{req.attackerName} connects with {req.actionName}, dealing {req.damage} damage to {req.defenderName}!",
            f"Solid execution! {req.attackerName} tests the defensive plating of {req.defenderName}.",
        ]
        hype = 55

    return CommentaryResponse(
        commentary=random.choice(lines),
        crowdHypeLevel=hype,
    )


@limiter.limit("30/minute")
@app.post("/api/ai/tactics", response_model=TacticalMoveResponse)
def decide_tactical_move(req: TacticalMoveRequest):
    """
    AI opponent tactical decision engine. Analyzes HP thresholds and overdrive.
    """
    # 1. If Overdrive charged, unleash ultimate
    if req.overdriveCharged and "ultimate" in req.availableMoves:
        return TacticalMoveResponse(
            chosenMove="ultimate",
            rationale="Overdrive meter is full. Initiating maximum burst sequence to finish the opponent.",
        )

    # 2. If critically low on health, deploy defensive shield
    hp_pct = req.currentHp / max(1, req.maxHp)
    if hp_pct < 0.28 and "shield" in req.availableMoves:
        return TacticalMoveResponse(
            chosenMove="shield",
            rationale="Health critical (< 28%). Deploying Aegis Nano-Shield for damage mitigation.",
        )

    # 3. If opponent low on health, strike with fast physical blade
    opp_hp_pct = req.opponentHp / max(1, req.opponentMaxHp)
    if opp_hp_pct < 0.25 and "strike" in req.availableMoves:
        return TacticalMoveResponse(
            chosenMove="strike",
            rationale="Opponent in knockout territory. Swift weapon strike with 100% accuracy selected.",
        )

    # 4. Default offensive magic pulse
    return TacticalMoveResponse(
        chosenMove="magic" if "magic" in req.availableMoves else "strike",
        rationale="Mid-range tactical pressure applied using elemental arcana.",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
