// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const CELL_SIZE = 0.0001; // ~house-sized cells
const INTERACT_RADIUS = 3;
const WIN_VALUE = 32;

// ------------------------------------------------------------
// DOM SETUP
// ------------------------------------------------------------
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const hud = document.createElement("div");
hud.id = "hud";
hud.style.position = "absolute";
hud.style.top = "10px";
hud.style.left = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.padding = "6px 10px";
hud.style.color = "white";
hud.style.borderRadius = "4px";
document.body.append(hud);

const controls = document.createElement("div");
controls.id = "controls";
controls.style.position = "absolute";
controls.style.top = "80px";
controls.style.left = "10px";
controls.style.background = "rgba(0,0,0,0.5)";
controls.style.padding = "8px";
controls.style.borderRadius = "4px";
controls.style.color = "white";
controls.innerHTML = `
<button id="north">North</button><br>
<button id="south">South</button><br>
<button id="east">East</button><br>
<button id="west">West</button>
`;
document.body.append(controls);

// ------------------------------------------------------------
// MAP
// ------------------------------------------------------------
const NullIsland = L.latLng(0, 0);

const map = L.map(mapDiv, {
  center: NullIsland,
  zoom: 19,
  minZoom: 19,
  maxZoom: 19,
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// ------------------------------------------------------------
// GRID HELPERS
// ------------------------------------------------------------
function gridToLatLng(i: number, j: number): L.LatLng {
  return L.latLng(i * CELL_SIZE, j * CELL_SIZE);
}

function latLngToCell(lat: number, lng: number): [number, number] {
  const i = Math.floor(lat / CELL_SIZE);
  const j = Math.floor(lng / CELL_SIZE);
  return [i, j];
}

function cellToBounds(i: number, j: number): L.LatLngBounds {
  return L.latLngBounds(
    [i * CELL_SIZE, j * CELL_SIZE],
    [(i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE],
  );
}

function tokenForCell(i: number, j: number): number {
  const r = luck(`${i},${j}`);
  return r < 0.15 ? 1 : 0;
}

// ------------------------------------------------------------
// PLAYER STATE
// ------------------------------------------------------------
let playerI = 0;
let playerJ = 0;
let heldToken: number | null = null;

function updateHUD(): void {
  hud.textContent = `Player: (${playerI}, ${playerJ}) | Held: ${
    heldToken ?? "(empty)"
  }`;
}

const playerMarker = L.marker(gridToLatLng(playerI, playerJ)).addTo(map);

// ------------------------------------------------------------
// ACTIVE CELLS (MEMORYLESS PER VIEW)
// ------------------------------------------------------------
type CellLayers = {
  rect: L.Rectangle;
  marker: L.Marker | null;
  value: number;
};

const cellLayers = new Map<string, CellLayers>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function clearCells(): void {
  for (const { rect, marker } of cellLayers.values()) {
    map.removeLayer(rect);
    if (marker) {
      map.removeLayer(marker);
    }
  }
  cellLayers.clear();
}

// ------------------------------------------------------------
// INTERACTION RANGE
// ------------------------------------------------------------
function inRange(i: number, j: number): boolean {
  const di = Math.abs(i - playerI);
  const dj = Math.abs(j - playerJ);
  return Math.max(di, dj) <= INTERACT_RADIUS;
}

// ------------------------------------------------------------
// CRAFTING / PICKUP / DROP
// ------------------------------------------------------------
function updateCellVisual(i: number, j: number): void {
  const key = cellKey(i, j);
  const cell = cellLayers.get(key);
  if (!cell) return;

  const { rect } = cell;

  if (cell.marker) {
    map.removeLayer(cell.marker);
    cell.marker = null;
  }

  if (cell.value > 0) {
    const center = rect.getBounds().getCenter();
    cell.marker = L.marker(center, {
      icon: L.divIcon({
        className: "token-label",
        html: `<div class="token-text">${cell.value}</div>`,
      }),
      interactive: false,
    }).addTo(map);
  }
}

function handleInteraction(i: number, j: number): void {
  if (!inRange(i, j)) {
    console.log("Too far.");
    return;
  }

  const key = cellKey(i, j);
  const cell = cellLayers.get(key);
  if (!cell) return;

  const value = cell.value;

  // Empty hand → pick up
  if (heldToken === null && value > 0) {
    heldToken = value;
    cell.value = 0;
    updateCellVisual(i, j);
    updateHUD();
    console.log(`Picked up ${value}`);
    return;
  }

  // Drop into empty cell
  if (heldToken !== null && value === 0) {
    cell.value = heldToken;
    heldToken = null;
    updateCellVisual(i, j);
    updateHUD();
    console.log("Dropped token");
    return;
  }

  // Merge equal tokens
  if (heldToken !== null && value === heldToken) {
    const newValue = heldToken * 2;
    cell.value = newValue;
    heldToken = null;
    updateCellVisual(i, j);
    updateHUD();
    console.log(`Merged into ${newValue}`);

    if (newValue >= WIN_VALUE) {
      hud.textContent = `YOU WIN! Crafted ${newValue}!`;
    }

    return;
  }

  console.log("No action.");
}

// ------------------------------------------------------------
// GRID DRAW (MEMORYLESS WORLD)
// ------------------------------------------------------------
function drawVisibleGrid(): void {
  clearCells();

  const bounds = map.getBounds();
  const nw = bounds.getNorthWest();
  const se = bounds.getSouthEast();

  const [minI, minJ] = latLngToCell(se.lat, nw.lng);
  const [maxI, maxJ] = latLngToCell(nw.lat, se.lng);

  for (let i = minI - 2; i <= maxI + 2; i++) {
    for (let j = minJ - 2; j <= maxJ + 2; j++) {
      const value = tokenForCell(i, j);
      const boundsForCell = cellToBounds(i, j);

      const rect = L.rectangle(boundsForCell, {
        color: "#999",
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(map);

      let marker: L.Marker | null = null;

      if (value > 0) {
        const center = boundsForCell.getCenter();
        marker = L.marker(center, {
          icon: L.divIcon({
            className: "token-label",
            html: `<div class="token-text">${value}</div>`,
          }),
          interactive: false,
        }).addTo(map);
      }

      rect.on("click", () => handleInteraction(i, j));

      const key = cellKey(i, j);
      cellLayers.set(key, { rect, marker, value });
    }
  }
}

// ------------------------------------------------------------
// PLAYER MOVEMENT
// ------------------------------------------------------------
function movePlayer(di: number, dj: number): void {
  playerI += di;
  playerJ += dj;

  playerMarker.setLatLng(gridToLatLng(playerI, playerJ));
  map.setView(gridToLatLng(playerI, playerJ), map.getZoom());

  updateHUD();
  drawVisibleGrid();
}

document.getElementById("north")?.addEventListener(
  "click",
  () => movePlayer(1, 0),
);
document.getElementById("south")?.addEventListener(
  "click",
  () => movePlayer(-1, 0),
);
document.getElementById("east")?.addEventListener(
  "click",
  () => movePlayer(0, 1),
);
document.getElementById("west")?.addEventListener(
  "click",
  () => movePlayer(0, -1),
);

// ------------------------------------------------------------
// MAP MOVE HANDLER (SCROLLING)
// ------------------------------------------------------------
map.on("moveend", () => {
  drawVisibleGrid();
});

// ------------------------------------------------------------
// INITIAL BOOTSTRAP
// ------------------------------------------------------------
updateHUD();
drawVisibleGrid();
