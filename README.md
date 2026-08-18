# ??? Pen Fight - Classroom Championship (2.5D Tabletop Physics Simulator)

A web-based 2.5D tabletop pen fighting simulation game built around realistic rigid-body physics, mass distribution, center-of-mass rotational dynamics, and 8-Ball pool aiming mechanics.

---

## ?? Features

- **Realistic Rigid-Body Physics**: Sub-stepped impulse-based collision simulation, center-of-mass angular inertia ($I = I_{cm} + M d^2$), contact manifold torque, restitution, and surface friction.
- **8-Ball Pool Aiming System**: Drag back to charge intensity (Low / Med / High / Max) with trajectory guidelines and contact-point selector (Tip hook, Center ram, Tail sweep).
- **8 Distinct Pen Archetypes & Sizes**:
  - *Mini Pocket Dart* (80mm, 12g)
  - *Slim Needle Gel* (110mm, 14g)
  - *Standard Ballpoint* (125mm, 18g)
  - *Center-Heavy Balancer* (120mm, 22g)
  - *Imported Gel Pen* (135mm, 28g)
  - *Executive Metal Tank* (130mm, 52g)
  - *Long Caligraphy Wand* (165mm, 36g)
  - *Jumbo Heavy Marker* (145mm, 65g)
- **10 Custom Pen Color Themes**: Cyber Cyan, Crimson Flame, Neon Lime, Matte Stealth, Luxury Gold, Royal Purple, Electric Orange, Pearl White, Neon Pink, Emerald Gem.
- **Team Battle Modes**: Solo 1v1 (2 Pens), Tag Team 2v2 (4 Pens), Squad Brawl 3v3 (6 Pens) selectable from Game Settings.
- **Fair Play Rules**:
  - **Individual First-Shot Protection**: Both players get a protected opening move (turns 1 & 2) where the boundary acts as a safety bumper. Knockouts activate on Turn 3+.
  - **Starting Player Alternation**: Shuffled match openers and strictly alternating round starts.
  - **Double-Knockout Auto-Restart**: When both pens tumble off at the end of a collision sequence, the match automatically resets.
- **5 Tabletop Arenas**: Classic Mahogany Desk, Dark Stealth Arena, School Bench & Doodles, Pro Studio Slate, Cybernetic Grid.
- **Synthesized Audio Engine**: Procedural Web Audio API sound effects (flicks, strikes, wood thuds, tumbling falls, victory fanfare).
- **Tactical AI Bot**: 3 difficulty levels (Easy, Medium, Hard).

---

## ?? Getting Started

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Node.js (optional, for local server)

### Running Locally
```bash
# Option 1: Using Node.js server
node server.js

# Option 2: Using any static file server (e.g. npx serve, python http.server, etc.)
npx serve .
```

Open `http://localhost:8080` in your web browser.

---

## ??? Controls
- **Aim**: Click / touch and drag back from your pen.
- **Power**: Pull back further to charge strike power.
- **Contact Point**: Select Tip (spin hook), Center (forward ram), or Tail (wide sweep) from the bottom dock.
- **Debug Telemetry**: Press `F3` or click Debug.
