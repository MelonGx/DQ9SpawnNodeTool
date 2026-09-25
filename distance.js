(function () {
    const walk = createIdealWalk(16, { TILE_WALL, TILE_DIVIDER, tileMap });
    const TILE = walk.TILE;
    const PX_PER_TILE = 64;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PATH_COLOR = "#ff00ff";

    let state = null;
    let sel = { from: 'up', to: 'down' };
    let route = null;

    const isWalkableTile = (tx, ty) => ![TILE_WALL, TILE_DIVIDER, -1].includes(FUN_02092934(mapContext, tx, ty));

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
        const offsets = [...new Set(modifiers.concat(Object.values(exceptions)).map(m => m.x))];
        const add = (key, label, name, color, c, tile) => {
            if (!c || !tile) return;
            const x = walk.exactCoord(c.x, tile.x, offsets), y = walk.exactCoord(c.z, tile.y, offsets);
            if (x !== null && y !== null) pts.push({ key, label, name, color, x, y, tx: tile.x, ty: tile.y });
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
        const stairs = points.map((p, k) => (p.key === 'up' || p.key === 'down') ? k : -1).filter(k => k >= 0);
        const up = points.findIndex(p => p.key === 'up');
        const starts = up >= 0 ? { [up]: walk.upStairsStart(mapContext.stairsCoords.up, mapContext.upStairs, mapGrid) } : null;

        const dist = {}, dq9at = {};
        points.forEach((a, i) => {
            const d = walk.gridFrom(points, i, stairs, starts);
            points.forEach((b, j) => {
                const id = a.key + '>' + b.key;
                dist[id] = d[j];
                dq9at[id] = dq9atStepCost(a.tx, a.ty, b.tx, b.ty);
            });
        });

        const paths = {};
        const path = id => {
            if (!(id in paths)) {
                const [f, t] = id.split('>'), i = points.findIndex(p => p.key === f), j = points.findIndex(p => p.key === t);
                paths[id] = (i < 0 || j < 0 || i === j) ? [] : walk.gridPath(points, i, j, stairs, starts);
            }
            return paths[id];
        };

        state = { points, dist, dq9at, path };
    }

    function split(len) {
        const steps = len * 16;
        for (let b = 0; b * Math.SQRT2 <= steps + 1e-9; b++) {
            const a = steps - b * Math.SQRT2;
            if (Math.abs(a - Math.round(a)) < 1e-6) return [Math.round(a) / 16, b / 16];
        }
        return [NaN, NaN];
    }
    const splitText = len => {
        const [a, b] = len < Infinity ? split(len) : [0, 0];
        return `straight ${a.toFixed(3)} + diagonal ${b.toFixed(3)} steps`;
    };

    function drawPath(walks) {
        const topOverlay = document.getElementById("topOverlay");
        const old = document.getElementById("distPath");
        if (old) old.remove();
        walks = (walks || []).filter(w => w && w.length >= 2);
        if (!walks.length) return;

        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("id", "distPath");
        [["#000000", 6], [PATH_COLOR, 3]].forEach(([color, width]) => {
            for (const walkPts of walks) {
                const line = document.createElementNS(SVG_NS, "polyline");
                line.setAttribute("points", walkPts.map(p => `${p.x / TILE * PX_PER_TILE},${p.y / TILE * PX_PER_TILE}`).join(" "));
                line.setAttribute("fill", "none");
                line.setAttribute("stroke", color);
                line.setAttribute("stroke-width", width);
                line.setAttribute("stroke-linejoin", "round");
                line.setAttribute("stroke-linecap", "round");
                g.appendChild(line);
            }
        });
        topOverlay.insertBefore(g, topOverlay.firstChild);
    }

    function activeRoute() {
        const m = mapContext && mapContext.field_0;
        return route && m && m.mapseed === route.seed && Number(m.floor) === route.floor ? route : null;
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
            drawPath([]);
            return;
        }

        const pts = state.points;
        const keys = pts.map(p => p.key);
        if (sel.from && !keys.includes(sel.from)) sel.from = 'up';
        if (sel.to && !keys.includes(sel.to)) sel.to = 'down';

        const options = `<option value="">None</option>` + pts.map(p => `<option value="${p.key}">${p.label} ${p.name}</option>`).join("");
        fromSel.innerHTML = toSel.innerHTML = options;
        fromSel.value = sel.from;
        toSel.value = sel.to;

        const id = (sel.from && sel.to) ? sel.from + '>' + sel.to : '';
        const d = state.dist[id];
        if (!id) {
            result.innerHTML = '';
        } else if (d === Infinity) {
            result.innerHTML = `Distance: <b>unreachable</b>`;
        } else {
            result.innerHTML =
                `<div>Distance: <b>${fmt(d, 3)}</b> tiles = ${splitText(d)} × √2</div>` +
                `<div class="dist-muted">A* (tile centres, no corner cutting): ${fmt(state.dq9at[id], 1)} <span class="tip" tabindex="0" data-tip="Tile centres, diagonal 1.5, no corner cutting. Only the tile edge is shared 1:1 with the ideal walk; shown for reference only.">ⓘ</span></div>`;
        }

        const posRows = pts.map(p => {
            const inX = p.x / TILE - p.tx, inY = 1 - (p.y / TILE - p.ty);
            return `<tr><th style="color:${p.color}">${p.label}</th><td class="dist-name">${p.name}</td>` +
                   `<td>(${p.tx}, ${p.ty})</td><td>${inX.toFixed(3)}</td><td>${inY.toFixed(3)}</td></tr>`;
        }).join("");
        posTable.innerHTML = `<tr><th><span class="tip" tabindex="0" data-tip="In-tile position: bottom-left (0, 0), centre (0.5, 0.5)">ⓘ</span></th><th>Name</th><th>Tile</th><th>In-tile X</th><th>In-tile Y</th></tr>${posRows}`;

        const head = pts.map(p => `<th style="color:${p.color}">${p.label}</th>`).join("");
        const rows = pts.map(a => {
            const cells = pts.map(b => {
                const cid = a.key + '>' + b.key;
                if (a.key === b.key) return `<td class="pick dist-self" data-from="" data-to="" title="No route">–</td>`;
                const cls = cid === id ? 'pick sel' : 'pick';
                const tip = `${splitText(state.dist[cid])} | A*: ${fmt(state.dq9at[cid], 1)}`;
                return `<td class="${cls}" data-from="${a.key}" data-to="${b.key}" title="${tip}">${fmt(state.dist[cid], 2)}</td>`;
            }).join("");
            return `<tr><th style="color:${a.color}">${a.label}</th>${cells}</tr>`;
        }).join("");
        table.innerHTML = `<tr><th></th>${head}</tr>${rows}`;

        const r = activeRoute();
        if (r) {
            const name = k => (pts.find(p => p.key === k) || { label: '?' }).label;
            const c = r.legs.reduce((s, [f, t]) => s + state.dist[f + '>' + t], 0);
            const stops = [r.legs[0][0]].concat(r.legs.map(l => l[1])).map(name).join(' → ');
            result.innerHTML = `<div>Search route: <b>${stops}</b> = <b>${fmt(c, 3)}</b> tiles = ${splitText(c)} × √2</div>`;
            drawPath(r.legs.map(([f, t]) => state.path(f + '>' + t)));
        } else {
            drawPath(id ? [state.path(id)] : []);
        }
    }

    function buildPanel() {
        const style = document.createElement("style");
        style.textContent = `
            .dist-panel { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; max-width: 100%; box-sizing: border-box; }
            .dist-panel .dist-row { display: flex; gap: 8px 12px; align-items: center; flex-wrap: wrap; }
            .dist-panel select { background: #1e1e1e; border: 1px solid #555; color: #fff; padding: 6px 8px; font-family: monospace; font-size: 16px; }
            .dist-panel .dist-muted { color: #999; }
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
                <b>Ideal Walk</b><span class="tip" tabindex="0" data-tip="Horizontal / vertical / 45° steps between 1/16-tile cells, no diagonal past a wall cell, never stepping on the up or down stairs. Unit = one tile edge; 1 diagonal step = one tile edge on both x and y. From / To or a table cell picks the pair to draw; None or a – cell hides it. A search route stays until a single pair is picked.">ⓘ</span>
            </div>
            <div class="dist-row">
                <label for="distFrom">From</label><select id="distFrom"></select>
                <label for="distTo">To</label><select id="distTo"></select>
            </div>
            <div id="distResult"></div>
            <div class="dist-row dist-tables">
                <table class="dist-table" id="distTable"></table>
                <table class="dist-table" id="distPosTable"></table>
            </div>
        `;
        document.querySelector(".panel").after(panel);

        document.getElementById("distFrom").addEventListener("change", e => { sel.from = e.target.value; route = null; render(); });
        document.getElementById("distTo").addEventListener("change", e => { sel.to = e.target.value; route = null; render(); });
        document.getElementById("distTable").addEventListener("click", e => {
            const td = e.target.closest("td.pick");
            if (!td) return;
            sel = { from: td.dataset.from, to: td.dataset.to };
            route = null;
            render();
        });
    }

    function update() {
        recompute();
        render();
    }

    buildPanel();
    document.getElementById('mapSeed').addEventListener('input', update);
    document.getElementById('floor').addEventListener('input', update);
    update();

    function showRoute(seedHex, floor1, legs) {
        route = { seed: seedHex.toUpperCase().padStart(4, '0'), floor: floor1, legs };
        document.getElementById('mapSeed').value = route.seed;
        document.getElementById('floor').value = floor1;
        document.getElementById('floor').dispatchEvent(new Event('input'));
    }

    window.DQ9Distance = { showRoute };
})();
