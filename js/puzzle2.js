/* ============================================
   Puzzle 2 - Where in the World?
   She's shown a series of holiday photos (and one
   final round with no photo) and must click the
   correct location on a map for each one. All
   rounds must be answered correctly to unlock.
   ============================================ */

/* ---- EDIT ME ----
   Each round has a label, optional photo, the real
   lat/lng answer, and an acceptable radius in km.
   Set photo to null for a "guess from memory" round.
*/
const ROUNDS = [
  { key: "budapest", label: "Location 1", photo: "images/Budapest.jpg", lat: 47.4979, lng: 19.0402, radiusKm: 500 },
  { key: "france", label: "Location 2", photo: "images/France.jpg", lat: 48.8566, lng: 2.3522, radiusKm: 500 },
  { key: "malta", label: "Location 3", photo: "images/Malta.jpg", lat: 35.9375, lng: 14.3754, radiusKm: 500 },
  { key: "morocco", label: "Location 4", photo: "images/Morocco.jpg", lat: 31.6295, lng: -7.9811, radiusKm: 500 },
  { key: "scotland", label: "Location 5", photo: "images/Scotland.jpg", lat: 55.9533, lng: -3.1883, radiusKm: 500 },
  { key: "tenerife", label: "Location 6", photo: "images/Tenerife.jpg", lat: 28.2916, lng: -16.6291, radiusKm: 500 },
  { key: "thailand", label: "Location 7", photo: "images/Thailand.jpg", lat: 13.7563, lng: 100.5018, radiusKm: 500 },
  { key: "amsterdam", label: "Location 8 - The Missing One!", photo: null, lat: 52.3676, lng: 4.9041, radiusKm: 500 },
];

const PROGRESS_STORAGE_KEY = "puzzle2RoundIndex";

let currentIndex = 0;
let map = null;
let marker = null;
let selectedLatLng = null;

/**
 * Haversine distance between two lat/lng points, in km.
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function initMap() {
  if (map) {
    map.remove();
  }
  map = L.map("mapContainer").setView([20, 10], 2);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: "abcd",
  }).addTo(map);

  marker = null;
  selectedLatLng = null;

  map.on("click", (e) => {
    selectedLatLng = e.latlng;
    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }
    document.getElementById("guessBtn").disabled = false;
  });
}

function renderRound() {
  const round = ROUNDS[currentIndex];
  const photoArea = document.getElementById("photoArea");
  const progressTracker = document.getElementById("progressTracker");
  const feedback = document.getElementById("feedback");
  const guessBtn = document.getElementById("guessBtn");
  const nextBtn = document.getElementById("nextBtn");

  progressTracker.textContent = `Location ${currentIndex + 1} of ${ROUNDS.length}`;
  feedback.textContent = "";
  feedback.className = "feedback";
  guessBtn.style.display = "inline-block";
  guessBtn.disabled = true;
  nextBtn.style.display = "none";

  if (round.photo) {
    photoArea.innerHTML = `
      <div class="photo-frame">
        <img src="${round.photo}" alt="${round.label}" />
      </div>
    `;
  } else {
    photoArea.innerHTML = `
      <div class="no-photo-card">
        <div class="big-emoji">🤔</div>
        <div>No photo for this one! Where was the final stop on the trip?</div>
      </div>
    `;
  }

  initMap();
}

function handleGuess() {
  if (!selectedLatLng) return;

  const round = ROUNDS[currentIndex];
  const feedback = document.getElementById("feedback");
  const guessBtn = document.getElementById("guessBtn");
  const nextBtn = document.getElementById("nextBtn");
  const mapContainer = document.getElementById("mapContainer");

  const dist = distanceKm(selectedLatLng.lat, selectedLatLng.lng, round.lat, round.lng);

  if (dist <= round.radiusKm) {
    feedback.textContent = `🎉 Correct! (You were ${Math.round(dist)} km away)`;
    feedback.className = "feedback success";
    guessBtn.style.display = "none";

    if (currentIndex === ROUNDS.length - 1) {
      // Last round solved - puzzle complete
      markSolved("puzzle2");
      nextBtn.textContent = "Open your reward 🎁";
      nextBtn.onclick = () => {
        window.location.href = "reward2.html";
      };
    } else {
      nextBtn.textContent = "Next location →";
      nextBtn.onclick = () => {
        currentIndex++;
        saveRoundIndex(currentIndex);
        renderRound();
      };
    }
    nextBtn.style.display = "inline-block";
  } else {
    feedback.textContent = `Not quite... you were ${Math.round(dist)} km away. Try again! 💭`;
    feedback.className = "feedback error";
    mapContainer.classList.remove("shake");
    void mapContainer.offsetWidth;
    mapContainer.classList.add("shake");
  }
}

function saveRoundIndex(index) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, String(index));
  } catch (e) {
    /* ignore */
  }
}

function loadRoundIndex() {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const parsed = raw !== null ? parseInt(raw, 10) : 0;
    if (Number.isNaN(parsed) || parsed < 0 || parsed >= ROUNDS.length) {
      return 0;
    }
    return parsed;
  } catch (e) {
    return 0;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();

  if (isSolved("puzzle2")) {
    document.getElementById("alreadySolved").style.display = "block";
    document.getElementById("gameArea").style.display = "none";
    return;
  }

  currentIndex = loadRoundIndex();
  renderRound();

  document.getElementById("guessBtn").addEventListener("click", handleGuess);
});
