# D3: World of Bits

## Vision

A map-based crafting game played on a global grid. Each cell can contain a deterministic token value. Players collect nearby tokens, merge equal tokens to craft higher-value ones, and try to reach a target value to win. The game supports both simulated and real-world movement, and gameplay persists across sessions.

## Technologies

- TypeScript
- Deno + Vite
- Leaflet for rendering the global grid
- luck() deterministic hashing for token spawning
- GitHub Pages (automated deployment)
- localStorage for persistence
- Browser Geolocation API for real-world movement

---

# Assignments

---

## D3.a — Core Mechanics (Complete)

### Steps Completed

- [x] Deleted provided starter main.ts and rebuilt from scratch
- [x] Created full-screen Leaflet map at initial location
- [x] Rendered grid cells using deterministic luck() values
- [x] Implemented HUD showing player position and held token
- [x] Added pick up / drop mechanics
- [x] Added crafting (merge equal-value tokens)
- [x] Implemented win condition on target value

### Done Criteria

- [x] Deterministic grid visible
- [x] Player interacts only with nearby cells
- [x] Crafting fully functional
- [x] Win condition triggers correctly

---

## D3.b — Globe-Spanning Gameplay (Complete)

### Steps Completed

- [x] Converted gameplay to a world-wide grid anchored at Null Island
- [x] Added simulated movement (N/S/E/W buttons)
- [x] Added playerI/playerJ grid coordinate system
- [x] Implemented global lat-lng ↔ cell conversion
- [x] Added moveend handler for re-rendering map after pan
- [x] Implemented dynamic spawn/despawn of visible cells
- [x] Updated crafting and win logic for global coordinates

### Done Criteria

- [x] Player can move anywhere on Earth
- [x] Grid renders for any map view
- [x] Interaction uses correct player grid range
- [x] Memoryless behavior exists (as required for D3.b)

---

## D3.c — Object Persistence (Complete)

### Steps Completed

- [x] Added worldState Map to preserve modified cells (Flyweight + Memento)
- [x] Added getStoredValue() + storeValue() helpers
- [x] Replaced tokenForCell() lookups with persistent state retrieval
- [x] Stored cell changes on pick up / drop / merge
- [x] Ensured modified cells persist across scrolling
- [x] Fixed token farming bug
- [x] Cleanly rebuild display from persistent state

### Done Criteria

- [x] Modified cells persist even when off-screen
- [x] Unmodified cells use deterministic hash
- [x] No duplication or refreshing exploits remain

---

## D3.d — Real-World Geolocation + Multi-Session Gameplay (Complete)

### Steps Completed

- [x] Implemented MovementController Facade interface
- [x] Added ButtonMovement controller (simulated movement)
- [x] Added GeoMovement controller (real geolocation)
- [x] Enabled runtime switching between movement modes
- [x] Persisted player position, held token, worldState, and movement mode via localStorage
- [x] Implemented New Game function
- [x] Player resumes from exact previous state after page reload
- [x] Fixed token alignment issue (centered multi-digit labels using iconAnchor/iconSize)

### Done Criteria

- [x] Player can move via geolocation
- [x] Player can move via buttons
- [x] Player can switch movement modes anytime
- [x] Game state persists across browser sessions
- [x] UI displays token values correctly
- [x] Fully satisfies assignment’s software + gameplay requirements
