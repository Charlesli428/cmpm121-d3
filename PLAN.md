# D3: World of Bits

## Vision

A map-based crafting game played on a global grid. Every cell may contain a
token whose value is generated deterministically. Players collect nearby tokens,
merge equal tokens to craft higher-value ones, and try to reach an assigned
target value to win.

## Technologies

- TypeScript
- Deno + Vite
- Leaflet (map, rectangles, markers)
- GitHub Pages (automated deployment)
- luck() hashing function for deterministic token spawning

## D3.a: Core Mechanics (Complete)

### Steps Completed

- [x] Deleted starter main.ts and rebuilt file from scratch
- [x] Created full-screen Leaflet map centered at classroom
- [x] Rendered grid cells using deterministic luck() values
- [x] Added HUD showing held token
- [x] Implemented pick up and drop interactions
- [x] Implemented merging (crafting) of equal-value tokens
- [x] Added win condition once crafted token reaches required value

### Done Criteria for D3.a

- [x] Map loads and fills the screen
- [x] Visible grid of deterministic cells
- [x] Player can pick up and drop tokens within range
- [x] Player can merge equal tokens into higher values
- [x] Win condition triggers at target value

## D3.b: Globe-Spanning Gameplay (In Progress)

### Goal

Convert the local classroom-based grid into a full Earth-wide grid anchored at
Null Island (0, 0). Allow simulated player movement and dynamic cell spawning
based on map view. Cells should forget their state when off-screen.

### Steps

#### Part 1 — Map and Movement

- [ ] Add UI buttons to simulate movement (N/S/E/W)
- [ ] Introduce playerI and playerJ grid coordinates (start at 0, 0)
- [ ] Convert all coordinate math to use Null Island instead of the classroom
- [ ] Implement global latLng ↔ cell coordinate conversions
- [ ] Add map moveend listener to detect when the map stops panning
- [ ] Spawn and despawn visible cells dynamically based on map bounds
- [ ] Ensure interaction range depends on playerI and playerJ

#### Part 2 — Crafting Updates

- [ ] Increase win threshold (example: craft value 32)
- [ ] Re-enable crafting using global coordinates
- [ ] Update win condition and HUD text
- [ ] Add commit: "D3.b Part 2 complete"

## D3.c: Persistence (Not Started)

- [ ] Replace memoryless cell behavior with persistent world state
- [ ] Prevent token farming when leaving and re-entering areas
- [ ] Store cell states in a suitable persistent structure

## D3.d: Geolocation and Multi-Session (Not Started)

- [ ] Add real geolocation for player movement
- [ ] Save game state to localStorage so progress survives reloads
- [ ] Support play sessions involving real and simulated movement
