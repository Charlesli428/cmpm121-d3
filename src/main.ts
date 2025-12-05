// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
const CELL_SIZE = 0.0001;
const INTERACT_RADIUS = 3;
const WIN_VALUE = 32;
const STORAGE_KEY = "world-of-bits-state-v1";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type MovementMode = "buttons" | "geo";

type SavedState = {
  playerI: number;
  playerJ: number;
  heldToken: number | null;
  worldStateEntries: [string, number][];
  movementMode: MovementMode;
};

interface MovementController {
  start(): void;
  stop(): void;
}

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

const northButton = document.getElementById("north") as
  | HTMLButtonElement
  | null;
const southButton = document.getElementById("south") as
  | HTMLButtonElement
  | null;
const eastButton = document.getElementById("east") as HTMLButtonElement | null;
const westButton = document.getElementById("west") as HTMLButtonElement | null;

const modeToggleButton = document.createElement("button") as HTMLButtonElement;
modeToggleButton.id = "modeToggle";
modeToggleButton.style.marginTop = "6px";
modeToggleButton.style.display = "block";
modeToggleButton.textContent = "Switch to Geolocation Movement";
controls.appendChild(modeToggleButton);

const newGameButton = document.createElement("button") as HTMLButtonElement;
newGameButton.id = "newGame";
newGameButton.style.marginTop = "6px";
newGameButton.style.display = "block";
newGameButton.textContent = "New Game";
controls.appendChild(newGameButton);

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
// CELL MEMORY (D3.c)
// ------------------------------------------------------------
const worldState = new Map<string, number>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function getStoredValue(i: number, j: number): number {
  const key = cellKey(i, j);
  if (worldState.has(key)) return worldState.get(key)!;
  return tokenForCell(i, j);
}

function storeValue(i: number, j: number, value: number): void {
  const key = cellKey(i, j);
  worldState.set(key, value);
}

// ------------------------------------------------------------
// ACTIVE CELL LAYERS
// ------------------------------------------------------------
type CellLayers = {
  rect: L.Rectangle;
  marker: L.Marker | null;
  value: number;
};

const cellLayers = new Map<string, CellLayers>();

function clearCells(): void {
  for (const { rect, marker } of cellLayers.values()) {
    map.removeLayer(rect);
    if (marker) map.removeLayer(marker);
  }
  cellLayers.clear();
}

// ------------------------------------------------------------
// INTERACTION RANGE CHECK
// ------------------------------------------------------------
function inRange(i: number, j: number): boolean {
  const di = Math.abs(i - playerI);
  const dj = Math.abs(j - playerJ);
  return Math.max(di, dj) <= INTERACT_RADIUS;
}

// ------------------------------------------------------------
// INTERACTION RANGE VISUAL (NEW)
// ------------------------------------------------------------
let interactRect: L.Rectangle | null = null;

function updateInteractRange(): void {
  if (interactRect) {
    map.removeLayer(interactRect);
  }

  const minI = playerI - INTERACT_RADIUS;
  const maxI = playerI + INTERACT_RADIUS;
  const minJ = playerJ - INTERACT_RADIUS;
  const maxJ = playerJ + INTERACT_RADIUS;

  interactRect = L.rectangle(
    cellToBounds(minI, minJ).extend(cellToBounds(maxI, maxJ)),
    {
      color: "yellow",
      weight: 2,
      fill: false,
      dashArray: "4 4",
    },
  ).addTo(map);
}

// ------------------------------------------------------------
// UPDATE CELL VISUAL
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
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
      interactive: false,
    }).addTo(map);
  }
}

// ------------------------------------------------------------
// SAVE / LOAD
// ------------------------------------------------------------
let loadedMovementMode: MovementMode | null = null;

function saveGame(): void {
  const state: SavedState = {
    playerI,
    playerJ,
    heldToken,
    worldStateEntries: Array.from(worldState.entries()),
    movementMode: currentMovementMode,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save game:", err);
  }
}

function loadGame(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw) as SavedState;
    playerI = data.playerI ?? 0;
    playerJ = data.playerJ ?? 0;
    heldToken = data.heldToken ?? null;

    worldState.clear();
    for (const [key, v] of data.worldStateEntries ?? []) {
      worldState.set(key, v);
    }

    loadedMovementMode = data.movementMode;
  } catch (err) {
    console.error("Error loading game:", err);
  }
}

// ------------------------------------------------------------
// INTERACTION LOGIC
// ------------------------------------------------------------
function handleInteraction(i: number, j: number): void {
  if (!inRange(i, j)) return;

  const key = cellKey(i, j);
  const cell = cellLayers.get(key);
  if (!cell) return;

  const value = cell.value;

  // PICKUP
  if (heldToken === null && value > 0) {
    heldToken = value;
    cell.value = 0;
    storeValue(i, j, 0);
    updateCellVisual(i, j);
    updateHUD();
    saveGame();
    return;
  }

  // DROP
  if (heldToken !== null && value === 0) {
    cell.value = heldToken;
    storeValue(i, j, heldToken);
    heldToken = null;
    updateCellVisual(i, j);
    updateHUD();
    saveGame();
    return;
  }

  // MERGE
  if (heldToken !== null && value === heldToken) {
    const newValue = heldToken * 2;
    cell.value = newValue;
    storeValue(i, j, newValue);
    heldToken = null;
    updateCellVisual(i, j);
    updateHUD();
    saveGame();

    if (newValue >= WIN_VALUE) {
      hud.textContent = `YOU WIN! Crafted ${newValue}!`;
    }
    return;
  }
}

// ------------------------------------------------------------
// DRAW GRID
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
      const value = getStoredValue(i, j);
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
            iconSize: [30, 30],
            iconAnchor: [15, 15],
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
// MOVEMENT HELPERS
// ------------------------------------------------------------
function movePlayer(di: number, dj: number): void {
  playerI += di;
  playerJ += dj;

  const newPos = gridToLatLng(playerI, playerJ);
  playerMarker.setLatLng(newPos);
  map.setView(newPos, map.getZoom());

  updateHUD();
  drawVisibleGrid();
  updateInteractRange();
  saveGame();
}

function setPlayerFromLatLng(lat: number, lng: number): void {
  const [i, j] = latLngToCell(lat, lng);
  playerI = i;
  playerJ = j;

  const newPos = gridToLatLng(playerI, playerJ);
  playerMarker.setLatLng(newPos);
  map.setView(newPos, map.getZoom());

  updateHUD();
  drawVisibleGrid();
  updateInteractRange();
  saveGame();
}

// ------------------------------------------------------------
// MOVEMENT CONTROLLERS
// ------------------------------------------------------------
class ButtonMovement implements MovementController {
  private handlers: Array<[HTMLButtonElement, () => void]> = [];

  start(): void {
    if (!northButton) return;

    this.handlers = [
      [northButton!, () => movePlayer(1, 0)],
      [southButton!, () => movePlayer(-1, 0)],
      [eastButton!, () => movePlayer(0, 1)],
      [westButton!, () => movePlayer(0, -1)],
    ];

    for (const [btn, fn] of this.handlers) {
      btn.addEventListener("click", fn);
      btn.disabled = false;
    }
  }

  stop(): void {
    for (const [btn, fn] of this.handlers) {
      btn.removeEventListener("click", fn);
      btn.disabled = true;
    }
  }
}

class GeoMovement implements MovementController {
  private watchId: number | null = null;

  start(): void {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    for (const btn of [northButton, southButton, eastButton, westButton]) {
      if (btn) btn.disabled = true;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPlayerFromLatLng(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true },
    );
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

// ------------------------------------------------------------
// MOVEMENT MODE MANAGEMENT
// ------------------------------------------------------------
const buttonMovement = new ButtonMovement();
const geoMovement = new GeoMovement();

let currentMovement: MovementController = buttonMovement;
let currentMovementMode: MovementMode = "buttons";

function updateMovementModeUI() {
  modeToggleButton.textContent = currentMovementMode === "buttons"
    ? "Switch to Geolocation Movement"
    : "Switch to Button Movement";
}

function switchMovement(mode: MovementMode) {
  currentMovement.stop();
  currentMovementMode = mode;
  currentMovement = mode === "buttons" ? buttonMovement : geoMovement;

  updateMovementModeUI();
  currentMovement.start();
  saveGame();
}

// ------------------------------------------------------------
// NEW GAME
// ------------------------------------------------------------
function startNewGame() {
  worldState.clear();
  playerI = 0;
  playerJ = 0;
  heldToken = null;

  const pos = gridToLatLng(playerI, playerJ);
  playerMarker.setLatLng(pos);
  map.setView(pos, map.getZoom());

  updateHUD();
  drawVisibleGrid();
  updateInteractRange();
  saveGame();
}

// ------------------------------------------------------------
// MAP MOVE HANDLER
// ------------------------------------------------------------
map.on("moveend", drawVisibleGrid);

// ------------------------------------------------------------
// BUTTON HANDLERS
// ------------------------------------------------------------
modeToggleButton.addEventListener("click", () => {
  switchMovement(currentMovementMode === "buttons" ? "geo" : "buttons");
});

newGameButton.addEventListener("click", () => {
  if (confirm("Start new game?")) startNewGame();
});

// ------------------------------------------------------------
// INITIAL BOOTSTRAP
// ------------------------------------------------------------
loadGame();

const initialPos = gridToLatLng(playerI, playerJ);
playerMarker.setLatLng(initialPos);
map.setView(initialPos, map.getZoom());
updateHUD();
drawVisibleGrid();
updateInteractRange();

currentMovementMode = loadedMovementMode ?? "buttons";
currentMovement = currentMovementMode === "buttons"
  ? buttonMovement
  : geoMovement;

updateMovementModeUI();
currentMovement.start();
saveGame();
