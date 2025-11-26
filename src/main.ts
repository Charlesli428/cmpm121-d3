// @deno-types="npm:@types/leaflet"
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";

import luck from "./_luck.ts";

// ------------------------------------------------------------
// 1. CREATE MAP CONTAINER
// ------------------------------------------------------------
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

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

// Show a marker at the classroom (does not affect clicking)
L.marker(CLASSROOM).addTo(map);

// ------------------------------------------------------------
// 3. GRID PARAMETERS
// ------------------------------------------------------------
const CELL_SIZE = 0.0001; // about a house-size
const VIEW_RADIUS = 80; // number of cells outward (fills whole screen)

type CellID = string;

// lat/lng → cell index
function _latLngToCell(lat: number, lng: number): [number, number] {
  const i = Math.floor((lat - CLASSROOM.lat) / CELL_SIZE);
  const j = Math.floor((lng - CLASSROOM.lng) / CELL_SIZE);
  return [i, j];
}

// cell index → bounds for rectangle
function cellBounds(i: number, j: number): L.LatLngBounds {
  const lat1 = CLASSROOM.lat + i * CELL_SIZE;
  const lng1 = CLASSROOM.lng + j * CELL_SIZE;
  const lat2 = lat1 + CELL_SIZE;
  const lng2 = lng1 + CELL_SIZE;
  return L.latLngBounds([lat1, lng1], [lat2, lng2]);
}

// deterministic token generator
function tokenForCell(i: number, j: number): number {
  const r = luck(`${i},${j}`);
  if (r < 0.15) return 1; // fixed 15% chance for D3.a
  return 0;
}

// ------------------------------------------------------------
// 4. DRAW GRID
// ------------------------------------------------------------
function drawGrid() {
  for (let di = -VIEW_RADIUS; di <= VIEW_RADIUS; di++) {
    for (let dj = -VIEW_RADIUS; dj <= VIEW_RADIUS; dj++) {
      const i = di;
      const j = dj;

      const bounds = cellBounds(i, j);
      const value = tokenForCell(i, j);

      // Draw rectangle for the cell
      const rect = L.rectangle(bounds, {
        color: "#999",
        weight: 1,
        fillOpacity: 0.1,
      }).addTo(map);

      // Display token visually (if present)
      if (value > 0) {
        const center = bounds.getCenter();
        L.marker(center, {
          icon: L.divIcon({
            className: "token-label",
            html: `<div class="token-text">${value}</div>`,
          }),
          interactive: false, // IMPORTANT: prevents blocking clicks
        }).addTo(map);
      }

      // Click handler — WORKS NOW
      rect.on("click", () => {
        console.log("Clicked cell:", i, j, "value:", value);
      });
    }
  }
}

// draw grid only after map fully loads
map.whenReady(() => {
  drawGrid();
});
