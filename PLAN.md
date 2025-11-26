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
- [x] Implemented merging (crafting) mechanics
- [x] Added win condition for required token value

### Done Criteria

- [x] Deterministic grid visible on map
- [x] Player can interact only with nearby cells
- [x] Crafting system fully works
- [x] Win condition triggers at correct value

---

## D3.b — Globe-Spanning Gameplay (Complete)

### Steps Completed

- [x] Converted gameplay to global grid anchored at Null Island
- [x] Added movement controls (N/S/E/W)
- [x] Added playerI/playerJ to track player grid position
- [x] Implemented global latLng ↔ cell coordinate conversion
- [x] Added moveend handler for map-based grid redraw
- [x] Dynamic cell spawn/despawn based on visible area
- [x] Updated interaction range to use player grid coordinates
- [x] Updated crafting + win condition for global play

### Done Criteria

- [x] Player can move globally and interact with nearby cells
- [x] Map correctly renders cells anywhere on Earth
- [x] Cells forget state when off-screen (intended for D3.b)
- [x] Crafting and merging work across global positions

---

## D3.c — Object Persistence (In Progress)

### Part A — In-Memory Persistence (Complete)

- [x] Added worldState Map to store modified cell values
- [x] Introduced getStoredValue() and storeValue() helpers
- [x] Replaced tokenForCell() calls with persistent state lookup
- [x] Updated pick up / drop / merge actions to store new values
- [x] Ensured modified cells preserve state when off-screen
- [x] Fixed token farming exploit (cells no longer reset)

### Part A Done Criteria

- [x] Modified cells persist as long as the page is open
- [x] Cells restore correct values when returning into view
- [x] World remains deterministic for untouched cells

---

## D3.d — Real-World Geolocation + Multi-Session (Not Started)

### Planned Steps

- [ ] Add geolocation-based player movement using browser API
- [ ] Implement movement system behind Facade interface
- [ ] Store worldState, player position, and held token in localStorage
- [ ] Add "New Game" reset option
- [ ] Allow switching between button movement and geolocation movement
