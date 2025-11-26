# D3: World of Bits

## Vision

A map-based crafting game played on a global grid. Each cell can contain a deterministic token value. Players collect nearby tokens, merge equal tokens to craft higher-value ones, and try to reach a target value to win.

## Technologies

- TypeScript
- Deno + Vite
- Leaflet
- luck() hashing function
- GitHub Pages (automated deployment)

---

# Assignments

## D3.a — Core Mechanics (Complete)

### Steps Completed

- [x] Deleted starter main.ts and rebuilt from scratch
- [x] Created full-screen Leaflet map centered at starting location
- [x] Rendered grid cells using deterministic luck() values
- [x] Added HUD showing player position and held token
- [x] Implemented pick up / drop interactions
- [x] Implemented merging (crafting) of equal-value tokens
- [x] Added win condition for required token value

### Done Criteria

- [x] Deterministic grid visible on map
- [x] Player can interact only with nearby cells
- [x] Crafting system functions (pick up, drop, merge)
- [x] Win condition triggers at correct value

---

## D3.b — Globe-Spanning Gameplay (Complete)

### Steps Completed

- [x] Converted game to global grid anchored at Null Island
- [x] Added N/S/E/W movement buttons and playerI/playerJ state
- [x] Implemented global latLng ↔ cell coordinate conversion
- [x] Added moveend listener to redraw grid on map movement
- [x] Implemented full dynamic spawning/despawning of cells
- [x] Ensured interaction range uses player grid coordinates
- [x] Updated crafting + win condition to use global system
- [x] Increased target value and validated new merge flow

### Done Criteria

- [x] Player movement updates world position correctly
- [x] Map displays valid cells anywhere on Earth
- [x] Cells forget state when off-screen (memoryless behavior)
- [x] Crafting works at global coordinates
- [x] Player can reach higher-value goal

---

## D3.c — Object Persistence (Next)

### Planned Steps

- [ ] Introduce persistent world-state Map keyed by cell coordinates
- [ ] Remove memoryless behavior; preserve modified cell states
- [ ] Apply Flyweight pattern for unmodified off-screen cells
- [ ] Use Memento-like save/restore for modified cells
- [ ] Prevent farming by re-entering the same area
- [ ] Rebuild displayed cells from persistent data on move

---

## D3.d — Real-World Geolocation + Multi-Session Play (Later)

### Planned Steps

- [ ] Add geolocation-based movement (navigator.geolocation)
- [ ] Implement movement control behind a Facade interface
- [ ] Persist game state to localStorage (tokens, player pos, inventory)
- [ ] Add "New Game" option to clear stored state
- [ ] Allow switching movement mode (buttons vs geolocation)
