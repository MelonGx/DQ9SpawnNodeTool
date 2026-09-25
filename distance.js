// Ideal-walk panel: shortest walking distance between the stairs and chests of the current floor,
// computed by ideal-walk.js on TKG's rendered terrain, with the path drawn on the map.
(function () {
    const walk = createIdealWalk();
    const TILE = walk.TILE;
    const PX_PER_TILE = 64;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PATH_COLOR = "#ff00ff";

    let state = null;               // { points, dist, straight, diag, dq9at, paths }
    let sel = { from: 'up', to: 'down' };

    function isWalkableTile(tx, ty) {
        return tx >= 0 && ty >= 0 && tx < mapWidth && ty < mapHeight &&
               mapGrid[ty][tx] !== TILE_WALL && mapGrid[ty][tx] !== TILE_DIVIDER;
    }

    // DQ9AT's calcPointWalkCost, for side-by-side display (not an equivalent of the distance above):
    // A* between tile centres, orthogonal step 1, diagonal step 1.5, diagonal only when both
    // orthogonal neighbours are walkable (no corner cutting). Only the tile edge is shared with our model.
    const DQ9AT_DIAG = 1.5;
    function dq9atStepCost(sx, sy, tx, ty) {
        const w = mapWidth, h = mapHeight;
        const g = new Float64Array(w * h).fill(Infinity);
        const closed = new Uint8Array(w * h);
        const hScore = (x, y) => {
            const dx = Math.abs(x - tx), dy = Math.abs(y - ty);
            return Math.max(dx, dy) + (DQ9AT_DIAG - 1) * Math.min(dx, dy);
        };
        const open = [sy * w + sx];
        g[sy * w + sx] = 0;
        while (open.length) {
            let bi = 0;
            for (let i = 1; i < open.length; i++) {
                const a = open[i], b = open[bi];
                if (g[a] + hScore(a % w, (a / w) | 0) < g[b] + hScore(b % w, (b / w) | 0)) bi = i;
            }
            const cur = open.splice(bi, 1)[0];
            if (closed[cur]) continue;
            closed[cur] = 1;
            const cx = cur % w, cy = (cur / w) | 0;
            if (cx === tx && cy === ty) return g[cur];
            for (let oy = -1; oy <= 1; oy++) {
                for (let ox = -1; ox <= 1; ox++) {
                    if (!ox && !oy) continue;
                    const nx = cx + ox, ny = cy + oy;
                    if (!isWalkableTile(nx, ny)) continue;
                    if (ox && oy && (!isWalkableTile(cx + ox, cy) || !isWalkableTile(cx, cy + oy))) continue;
                    const ng = g[cur] + (ox && oy ? DQ9AT_DIAG : 1);
                    const ni = ny * w + nx;
                    if (ng < g[ni]) { g[ni] = ng; open.push(ni); }
                }
            }
        }
        return Infinity;
    }

    function collectPoints() {
        const pts = [];
        const sc = mapContext.stairsCoords || {};
        const add = (key, label, name, color, c, tile) => {
            if (c && tile && c.fx !== undefined) pts.push({ key, label, name, color, x: c.fx, y: c.fz, tx: tile.x, ty: tile.y });
        };
        add('up', 'U', 'Up Stairs', '#00ff00', sc.up, mapContext.upStairs);
        add('down', 'D', 'Down Stairs', '#ff4040', sc.down, mapContext.downStairs);
        const chestTiles = (mapContext.field_0 && mapContext.field_0._chestCoords) || [];
        (mapContext.chestCoords || []).forEach((c, i) =>
            add('c' + i, String(i + 1), 'Chest ' + (i + 1), '#ffff00', c, chestTiles[i]));
        return pts;
    }

    function recompute() {
        if (!mapContext) { state = null; return; }
        walk.setFloor({ grid: mapGrid, width: mapWidth, height: mapHeight, bitfield: bitfieldGrid,
                        env: envIndices[getEnvironment(mapContext.field_0.mapseed)] });
        const points = collectPoints();
        const graph = walk.buildGraph(points);

        // straight / diag: tiles walked orthogonally / diagonal steps (1 tile on both axes) on that path
        const dist = {}, straight = {}, diag = {}, dq9at = {}, paths = {};
        points.forEach((a, i) => {
            const res = walk.dijkstra(graph.nodes, graph.adj, i);
            points.forEach((b, j) => {
                const id = a.key + '>' + b.key;
                dist[id] = res.dist[j];
                dq9at[id] = dq9atStepCost(a.tx, a.ty, b.tx, b.ty);

                const chain = walk.chainTo(graph, res, j);
                straight[id] = diag[id] = 0;
                for (let s = 1; s < chain.length; s++) {
                    const dx = Math.abs(chain[s].x - chain[s - 1].x), dy = Math.abs(chain[s].y - chain[s - 1].y);
                    straight[id] += (Math.max(dx, dy) - Math.min(dx, dy)) / TILE;
                    diag[id] += Math.min(dx, dy) / TILE;
                }
                const legs = chain.length ? [chain[0]] : [];
                for (let s = 1; s < chain.length; s++) legs.push(...walk.octileLegs(chain[s - 1], chain[s], 6));
                paths[id] = legs;
            });
        });

        state = { points, dist, straight, diag, dq9at, paths };
    }

    function drawPath(walk) {
        const topOverlay = document.getElementById("topOverlay");
        const old = document.getElementById("distPath");
        if (old) old.remove();
        if (!walk || walk.length < 2) return;

        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("id", "distPath");
        const pts = walk.map(p => `${p.x / TILE * PX_PER_TILE},${p.y / TILE * PX_PER_TILE}`).join(" ");
        [["#000000", 6], [PATH_COLOR, 3]].forEach(([color, width]) => {
            const line = document.createElementNS(SVG_NS, "polyline");
            line.setAttribute("points", pts);
            line.setAttribute("fill", "none");
            line.setAttribute("stroke", color);
            line.setAttribute("stroke-width", width);
            line.setAttribute("stroke-linejoin", "round");
            line.setAttribute("stroke-linecap", "round");
            g.appendChild(line);
        });
        // Below the stairs/chest markers
        topOverlay.insertBefore(g, topOverlay.firstChild);
    }

    const fmt = (v, digits) => v === Infinity ? 'unreachable' : v.toFixed(digits);

    function render() {
        const fromSel = document.getElementById("distFrom");
        const toSel = document.getElementById("distTo");
        const result = document.getElementById("distResult");
        const posTable = document.getElementById("distPosTable");
        const table = document.getElementById("distTable");

        if (!state || state.points.length < 2) {
            fromSel.innerHTML = toSel.innerHTML = table.innerHTML = posTable.innerHTML = "";
            result.textContent = "Nothing to measure on this floor.";
            drawPath(null);
            return;
        }

        const pts = state.points;
        const keys = pts.map(p => p.key);
        if (!keys.includes(sel.from)) sel.from = 'up';
        if (!keys.includes(sel.to)) sel.to = 'down';

        const options = pts.map(p => `<option value="${p.key}">${p.label}　${p.name}</option>`).join("");
        fromSel.innerHTML = toSel.innerHTML = options;
        fromSel.value = sel.from;
        toSel.value = sel.to;

        const id = sel.from + '>' + sel.to;
        const d = state.dist[id];
        if (d === Infinity) {
            result.innerHTML = `Distance: <b>unreachable</b>`;
        } else {
            const a = state.straight[id], b = state.diag[id];
            result.innerHTML =
                `<div>Distance: <b>${fmt(d, 3)}</b> tiles = straight ${a.toFixed(3)} + diagonal ${b.toFixed(3)} steps × √2</div>` +
                `<div class="dist-muted">DQ9AT A* (tile centres, no corner cutting): ${fmt(state.dq9at[id], 1)}</div>`;
        }

        // In-tile position: bottom-left of the tile is (0, 0), centre is (0.5, 0.5)
        const posRows = pts.map(p => {
            const inX = p.x / TILE - p.tx, inY = 1 - (p.y / TILE - p.ty);
            return `<tr><th style="color:${p.color}">${p.label}</th><td class="dist-name">${p.name}</td>` +
                   `<td>(${p.tx}, ${p.ty})</td><td>${inX.toFixed(3)}</td><td>${inY.toFixed(3)}</td></tr>`;
        }).join("");
        posTable.innerHTML = `<tr><th></th><th>Name</th><th>Tile</th><th>In-tile X</th><th>In-tile Y</th></tr>${posRows}`;

        const head = pts.map(p => `<th style="color:${p.color}">${p.label}</th>`).join("");
        const rows = pts.map(a => {
            const cells = pts.map(b => {
                const cid = a.key + '>' + b.key;
                if (a.key === b.key) return `<td class="dist-self">–</td>`;
                const cls = cid === id ? 'pick sel' : 'pick';
                const tip = `straight ${state.straight[cid].toFixed(3)} + diagonal ${state.diag[cid].toFixed(3)} steps | DQ9AT A*: ${fmt(state.dq9at[cid], 1)}`;
                return `<td class="${cls}" data-from="${a.key}" data-to="${b.key}" title="${tip}">${fmt(state.dist[cid], 2)}</td>`;
            }).join("");
            return `<tr><th style="color:${a.color}">${a.label}</th>${cells}</tr>`;
        }).join("");
        table.innerHTML = `<tr><th></th>${head}</tr>${rows}`;

        drawPath(state.paths[id]);
    }

    function buildPanel() {
        const style = document.createElement("style");
        style.textContent = `
            .dist-panel { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; max-width: 100%; box-sizing: border-box; }
            .dist-panel .dist-row { display: flex; gap: 8px 12px; align-items: center; flex-wrap: wrap; }
            .dist-panel select { background: #1e1e1e; border: 1px solid #555; color: #fff; padding: 6px 8px; font-family: monospace; font-size: 16px; }
            .dist-panel .dist-muted { color: #999; }
            .dist-panel .dist-note { color: #999; font-size: 12px; }
            .dist-table { border-collapse: collapse; }
            .dist-table th, .dist-table td { border: 1px solid #555; padding: 4px 10px; text-align: right; }
            .dist-table td.pick { cursor: pointer; }
            .dist-table td.pick:hover { background: #3a3a3a; }
            .dist-table td.sel { background: #6a206a; color: #fff; }
            .dist-table td.dist-self { color: #666; text-align: center; }
            .dist-table td.dist-name { text-align: left; }
            .dist-panel .dist-tables { align-items: flex-start; gap: 16px; }
        `;
        document.head.appendChild(style);

        const panel = document.createElement("div");
        panel.className = "panel dist-panel";
        panel.innerHTML = `
            <div class="dist-row">
                <b>Ideal Walk</b><span class="dist-note">horizontal / vertical / 45° moves only; unit = one tile edge</span>
            </div>
            <div class="dist-row">
                <label for="distFrom">From</label><select id="distFrom"></select>
                <label for="distTo">To</label><select id="distTo"></select>
            </div>
            <div id="distResult"></div>
            <div class="dist-note">1 diagonal step = one tile edge on both x and y. Only the tile edge is shared 1:1 with DQ9AT; its diagonal 1.5, no corner cutting and tile centres are a separate rule set, shown for reference only.</div>
            <div class="dist-row dist-tables">
                <table class="dist-table" id="distTable"></table>
                <div>
                    <table class="dist-table" id="distPosTable"></table>
                    <div class="dist-note">In-tile position: bottom-left (0, 0), centre (0.5, 0.5)</div>
                </div>
            </div>
        `;
        document.querySelector(".panel").after(panel);

        document.getElementById("distFrom").addEventListener("change", e => { sel.from = e.target.value; render(); });
        document.getElementById("distTo").addEventListener("change", e => { sel.to = e.target.value; render(); });
        document.getElementById("distTable").addEventListener("click", e => {
            const td = e.target.closest("td.pick");
            if (!td) return;
            sel = { from: td.dataset.from, to: td.dataset.to };
            render();
        });
    }

    function update() {
        recompute();
        render();
    }

    buildPanel();
    // Registered after the main script's listeners, so run() has already rebuilt the map
    document.getElementById('mapSeed').addEventListener('input', update);
    document.getElementById('floor').addEventListener('input', update);
    update();

    window.DQ9Distance = { getState: () => state, segmentClear: walk.segmentClear, octile: walk.octile, dq9atStepCost,
                           isFree: walk.isFree, reflexWallDir: walk.reflexWallDir, size: walk.size };
})();
