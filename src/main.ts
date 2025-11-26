// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";

import luck from "./_luck.ts";

// ------------------------------------------------------------
// DOM elements
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
// Map setup
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
// Grid + token helpers
// ------------------------------------------------------------
const CELL_SIZE = 0.0001; // degrees
const INTERACT_RADIUS = 3;

// Player grid coordinates (NOT lat/lng)
let playerI = 0;
let playerJ = 0;

function updateHUD(): void {
  hud.textContent = `Player grid: (${playerI}, ${playerJ})`;
}

// Convert grid cell → lat/lng center
function gridToLatLng(i: number, j: number): L.LatLng {
  return L.latLng(i * CELL_SIZE, j * CELL_SIZE);
}

// Convert lat/lng → grid cell
function latLngToCell(lat: number, lng: number): [number, number] {
  const i = Math.floor(lat / CELL_SIZE);
  const j = Math.floor(lng / CELL_SIZE);
  return [i, j];
}

// Get bounds of a cell
function cellToBounds(i: number, j: number): L.LatLngBounds {
  return L.latLngBounds(
    [i * CELL_SIZE, j * CELL_SIZE],
    [(i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE],
  );
}

// Deterministic token
function tokenForCell(i: number, j: number): number {
  const r = luck(`${i},${j}`);
  return r < 0.15 ? 1 : 0;
}

// ------------------------------------------------------------
// Player marker
// ------------------------------------------------------------
const playerMarker = L.marker(gridToLatLng(playerI, playerJ)).addTo(map);

// ------------------------------------------------------------
// Active cell storage (for clearing/redrawing)
// ------------------------------------------------------------
const activeCells = new Map<
  string,
  { rect: L.Rectangle; marker: L.Marker | null }
>();

function clearCells(): void {
  for (const { rect, marker } of activeCells.values()) {
    map.removeLayer(rect);
    if (marker) map.removeLayer(marker);
  }
  activeCells.clear();
}

// ------------------------------------------------------------
// Interaction
// ------------------------------------------------------------
function inRange(i: number, j: number): boolean {
  const di = Math.abs(i - playerI);
  const dj = Math.abs(j - playerJ);
  return Math.max(di, dj) <= INTERACT_RADIUS;
}

// ------------------------------------------------------------
// Dynamic grid drawing
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
      const token = tokenForCell(i, j);
      const b = cellToBounds(i, j);

      const rect = L.rectangle(b, {
        color: "#999",
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(map);

      let marker: L.Marker | null = null;

      if (token > 0) {
        const center = b.getCenter();
        marker = L.marker(center, {
          icon: L.divIcon({
            className: "token-label",
            html: `<div class="token-text">${token}</div>`,
          }),
          interactive: false,
        }).addTo(map);
      }

      rect.on("click", () => {
        if (inRange(i, j)) {
          console.log(`Interact with cell (${i}, ${j})`);
        } else {
          console.log("Too far away.");
        }
      });

      activeCells.set(`${i},${j}`, { rect, marker });
    }
  }
}

// ------------------------------------------------------------
// Player movement
// ------------------------------------------------------------
function movePlayer(di: number, dj: number): void {
  playerI += di;
  playerJ += dj;

  updateHUD();
  playerMarker.setLatLng(gridToLatLng(playerI, playerJ));
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
// Redraw grid when map stops moving
// ------------------------------------------------------------
map.on("moveend", () => {
  drawVisibleGrid();
});

// ------------------------------------------------------------
// Initial load
// ------------------------------------------------------------
updateHUD();
drawVisibleGrid();
