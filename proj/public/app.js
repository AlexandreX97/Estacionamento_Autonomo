const map = document.getElementById("map");
const lista = document.getElementById("lista");

function carroSVG() {
  return `
  <svg viewBox="0 0 64 32">
    <rect x="8" y="10" width="48" height="12" rx="4"/>
    <rect x="16" y="4" width="32" height="10" rx="4"/>
    <circle cx="18" cy="26" r="3"/>
    <circle cx="46" cy="26" r="3"/>
  </svg>`;
}

function formatarTempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

let index = 0;

for (let s = 0; s < 4; s++) {

  const setor = document.createElement("div");
  setor.className = "setor";

  const grid = document.createElement("div");
  grid.className = "grid";

  for (let i = 0; i < 5; i++) {

    const vaga = document.createElement("div");
    vaga.className = "vaga livre";
    vaga.id = "vaga-" + index;

    vaga.innerHTML = `<div class="carro">${carroSVG()}</div>`;

    grid.appendChild(vaga);
    index++;
  }

  setor.appendChild(grid);
  map.appendChild(setor);
}

const ws = new WebSocket("ws://localhost:3001");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  lista.innerHTML = "";

  let livres = 0;
  let ocupadas = 0;

  data.vagas.forEach((ocupada, i) => {

    const vaga = document.getElementById("vaga-" + i);

    vaga.classList.toggle("ocupada", ocupada);
    vaga.classList.toggle("livre", !ocupada);

    if (ocupada) ocupadas++;
    else livres++;

    const tempo = formatarTempo(data.tempo ? data.tempo[i] : 0);

    const item = document.createElement("div");
    item.className = "item";

    item.innerHTML = `
      <span>Vaga ${i+1}</span>
      <span>${ocupada ? "Ocupada" : "Livre"}</span>
      <span>${tempo}</span>
    `;

    lista.appendChild(item);
  });

  document.getElementById("livres").innerText = livres;
  document.getElementById("ocupadas").innerText = ocupadas;
};