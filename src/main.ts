// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";

import luck from "./_luck.ts";

// ------------------------------------------------------------
// 1. CREATE DOM ELEMENTS
// ------------------------------------------------------------

// Map container
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// HUD for inventory (top-left)
const hudDiv = document.createElement("div");
hudDiv.id = "hud";
document.body.append(hudDiv);

// ------------------------------------------------------------
// 2. MAP SETUP
// ------------------------------------------------------------
const CLASSROOM = L.latLng(36.997936938057016, -122.05703507501151);

const map = L.map(mapDiv, {
  center: CLASSROOM,
  zoom: 19,
  minZoom: 19,
  maxZoom: 19,
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Marker just to show player position
L.marker(CLASSROOM).addTo(map);

// ------------------------------------------------------------
// 3. GRID PARAMETERS + CELL HELPERS
// ------------------------------------------------------------
const CELL_SIZE = 0.0001; // about a house
const VIEW_RADIUS = 80; // enough to cover screen
const INTERACT_RADIUS = 3; // how many cells away you can interact

// Convert lat/lng to grid coordinates
function latLngToCell(lat: number, lng: number): [number, number] {
  const i = Math.floor((lat - CLASSROOM.lat) / CELL_SIZE);
  const j = Math.floor((lng - CLASSROOM.lng) / CELL_SIZE);
  return [i, j];
}

// Player cell (fixed at classroom for D3.a)
const [PLAYER_I, PLAYER_J] = latLngToCell(CLASSROOM.lat, CLASSROOM.lng);

// Cell key for maps
function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

// Convert cell coordinates to Leaflet bounds
function cellBounds(i: number, j: number): L.LatLngBounds {
  const lat1 = CLASSROOM.lat + i * CELL_SIZE;
  const lng1 = CLASSROOM.lng + j * CELL_SIZE;
  const lat2 = lat1 + CELL_SIZE;
  const lng2 = lng1 + CELL_SIZE;
  return L.latLngBounds([lat1, lng1], [lat2, lng2]);
}

// Initial deterministic token using luck()
function initialTokenForCell(i: number, j: number): number {
  const r = luck(`${i},${j}`);
  if (r < 0.15) {
    return 1;
  }
  return 0;
}

// ------------------------------------------------------------
// 4. GAME STATE: CELLS + INVENTORY
// ------------------------------------------------------------

// Mutable cell state (token value per cell)
const cellState = new Map<string, number>();

// Layers (rectangle + optional marker) per cell, for updating visuals
type CellLayers = {
  rect: L.Rectangle;
  marker: L.Marker | null;
};

const cellLayers = new Map<string, CellLayers>();

// Held token: null means empty hand
let heldToken: number | null = null;

// HUD updater
function updateHUD(): void {
  if (heldToken === null) {
    hudDiv.textContent = "Held: (empty)";
  } else {
    hudDiv.textContent = `Held: ${heldToken}`;
  }
}

// Get current token value for a cell, initializing from luck() once
function getCellValue(i: number, j: number): number {
  const key = cellKey(i, j);
  const existing = cellState.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const initial = initialTokenForCell(i, j);
  cellState.set(key, initial);
  return initial;
}

// Update the marker for a cell to match its state
function updateCellVisual(i: number, j: number): void {
  const key = cellKey(i, j);
  const layers = cellLayers.get(key);
  if (!layers) {
    return;
  }

  const value = cellState.get(key) ?? 0;

  // Remove old marker if present
  if (layers.marker) {
    map.removeLayer(layers.marker);
    layers.marker = null;
  }

  // Add new marker if cell has a token
  if (value > 0) {
    const center = layers.rect.getBounds().getCenter();
    const marker = L.marker(center, {
      icon: L.divIcon({
        className: "token-label",
        html: `<div class="token-text">${value}</div>`,
      }),
      interactive: false,
    }).addTo(map);
    layers.marker = marker;
  }
}

// ------------------------------------------------------------
// 5. INTERACTION LOGIC (PICK UP / DROP, NO MERGE YET)
// ------------------------------------------------------------
function isWithinInteractRange(i: number, j: number): boolean {
  const di = Math.abs(i - PLAYER_I);
  const dj = Math.abs(j - PLAYER_J);
  const chebyshevDistance = Math.max(di, dj);
  return chebyshevDistance <= INTERACT_RADIUS;
}

function handleCellClick(i: number, j: number): void {
  if (!isWithinInteractRange(i, j)) {
    console.log("Too far to interact with cell", i, j);
    return;
  }

  const key = cellKey(i, j);
  const value = getCellValue(i, j);

  // Case 1: hand empty, cell has token -> pick up
  if (heldToken === null && value > 0) {
    heldToken = value;
    cellState.set(key, 0);
    updateCellVisual(i, j);
    updateHUD();
    console.log("Picked up token", value, "from", i, j);
    return;
  }

  // Case 2: hand has token, cell empty -> drop
  if (heldToken !== null && value === 0) {
    cellState.set(key, heldToken);
    console.log("Dropped token", heldToken, "into", i, j);
    heldToken = null;
    updateCellVisual(i, j);
    updateHUD();
    return;
  }

  // Other cases (merge, etc.) will be handled in Part 3 (crafting)
  console.log(
    "No action taken on cell",
    i,
    j,
    "value",
    value,
    "held",
    heldToken,
  );
}

// ------------------------------------------------------------
// 6. DRAW GRID (INITIAL RENDER)
// ------------------------------------------------------------
function drawGrid(): void {
  for (let di = -VIEW_RADIUS; di <= VIEW_RADIUS; di++) {
    for (let dj = -VIEW_RADIUS; dj <= VIEW_RADIUS; dj++) {
      const i = di;
      const j = dj;
      const key = cellKey(i, j);

      const bounds = cellBounds(i, j);
      const value = getCellValue(i, j);

      const rect = L.rectangle(bounds, {
        color: "#999",
        weight: 1,
        fillOpacity: 0.1,
      }).addTo(map);

      let marker: L.Marker | null = null;

      if (value > 0) {
        const center = bounds.getCenter();
        marker = L.marker(center, {
          icon: L.divIcon({
            className: "token-label",
            html: `<div class="token-text">${value}</div>`,
          }),
          interactive: false,
        }).addTo(map);
      }

      rect.on("click", () => {
        handleCellClick(i, j);
      });

      cellLayers.set(key, { rect, marker });
    }
  }
}

// ------------------------------------------------------------
// 7. BOOTSTRAP
// ------------------------------------------------------------
map.whenReady(() => {
  updateHUD();
  drawGrid();
});
