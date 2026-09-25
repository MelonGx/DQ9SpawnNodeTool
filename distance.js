// Shortest walking distance between the stairs and chests of the current floor.
//
// Movement is limited to 8 directions (horizontal, vertical, 45 degrees), so walking a straight
// displacement (dx, dy) costs the octile length max + (sqrt2 - 1) * min, and any straight segment
// can be walked as one diagonal leg plus one straight leg of that same total length.
// The walkable area is the union of all non-wall tiles, and objects sit at their exact in-tile
// positions (fx32, before the >> 12 used for display). Because every obstacle edge is axis-aligned,
// a shortest path only bends at reflex wall corners: Dijkstra over the visibility graph of those
// corners plus the objects gives the exact distance. Distances are in tiles (one tile edge = 1).
(function () {
    const TILE = 8 * 0x1000;        // one tile in fx32 (8 fine units of 0x1000)
    const PX_PER_TILE = 64;
    const DIAG_EXTRA = Math.SQRT2 - 1;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PATH_COLOR = "#ff00ff";

    let free = [];                  // free[y][x]: walkable tile
    let state = null;               // { points, dist, oldDist, paths }
    let sel = { from: 'up', to: 'down' };

    function isFree(cx, cy) {
        return cy >= 0 && cy < free.length && cx >= 0 && cx < free[cy].length && free[cy][cx];
    }

    // Tile corner (k, m) whose only two walkable neighbours touch diagonally: zero-width, not passable
    function isPinch(k, m) {
        const nw = isFree(k - 1, m - 1), ne = isFree(k, m - 1);
        const sw = isFree(k - 1, m),     se = isFree(k, m);
        return (nw && se && !ne && !sw) || (ne && sw && !nw && !se);
    }

    // Tile corner with exactly one wall tile around it: the only places a shortest path bends
    function isReflexCorner(k, m) {
        let walls = 0;
        if (!isFree(k - 1, m - 1)) walls++;
        if (!isFree(k, m - 1)) walls++;
        if (!isFree(k - 1, m)) walls++;
        if (!isFree(k, m)) walls++;
        return walls === 1;
    }

    function octile(dx, dy) {
        dx = Math.abs(dx); dy = Math.abs(dy);
        return (Math.max(dx, dy) + DIAG_EXTRA * Math.min(dx, dy)) / TILE;
    }

    // Segment lying on a tile edge (x = line * TILE if vertical, else y = line * TILE), from a to b.
    // Hugging a wall is fine, so a walkable tile on either side of each stretch is enough.
    function edgeRunClear(line, a, b, vertical) {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        for (let c = Math.floor(lo / TILE); c * TILE < hi; c++) {
            const ok = vertical ? (isFree(line - 1, c) || isFree(line, c))
                                : (isFree(c, line - 1) || isFree(c, line));
            if (!ok) return false;
        }
        for (let c = Math.floor(lo / TILE) + 1; c * TILE < hi; c++) {
            if (vertical ? isPinch(line, c) : isPinch(c, line)) return false;
        }
        return true;
    }

    // Does the straight segment a -> b (integer fx32 coords) stay inside the walkable area?
    function segmentClear(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx === 0 && dy === 0) return true;

        if (dx === 0 && a.x % TILE === 0) return edgeRunClear(a.x / TILE, a.y, b.y, true);
        if (dy === 0 && a.y % TILE === 0) return edgeRunClear(a.y / TILE, a.x, b.x, false);

        // Split the segment where it crosses tile edges, then check the tile under each piece.
        // Crossings through a tile corner are detected exactly (integer maths) and counted once.
        const ts = [0, 1];
        if (dx !== 0) {
            const k0 = Math.floor(Math.min(a.x, b.x) / TILE) + 1;
            const k1 = Math.ceil(Math.max(a.x, b.x) / TILE) - 1;
            for (let k = k0; k <= k1; k++) {
                const num = k * TILE - a.x;
                const yNum = a.y * dx + num * dy;   // y * dx at the crossing
                if (yNum % (TILE * dx) === 0 && isPinch(k, yNum / (TILE * dx))) return false;
                ts.push(num / dx);
            }
        }
        if (dy !== 0) {
            const m0 = Math.floor(Math.min(a.y, b.y) / TILE) + 1;
            const m1 = Math.ceil(Math.max(a.y, b.y) / TILE) - 1;
            for (let m = m0; m <= m1; m++) {
                const num = m * TILE - a.y;
                if (dx !== 0 && (a.x * dy + num * dx) % (TILE * dy) === 0) continue; // corner, already counted
                ts.push(num / dy);
            }
        }
        ts.sort((p, q) => p - q);
        for (let i = 1; i < ts.length; i++) {
            const t = (ts[i - 1] + ts[i]) / 2;
            if (!isFree(Math.floor((a.x + dx * t) / TILE), Math.floor((a.y + dy * t) / TILE))) return false;
        }
        return true;
    }

    function dijkstra(nodes, adj, src) {
        const n = nodes.length;
        const dist = new Float64Array(n).fill(Infinity);
        const prev = new Int32Array(n).fill(-1);
        const done = new Uint8Array(n);
        dist[src] = 0;
        for (;;) {
            let u = -1;
            for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
            if (u < 0) break;
            done[u] = 1;
            for (const [v, w] of adj[u]) {
                if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
            }
        }
        return { dist, prev };
    }

    // Split one straight run into walkable 8-direction legs (diagonal + straight, either order)
    function octileLegs(p, q, depth) {
        const dx = q.x - p.x, dy = q.y - p.y;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        if (adx === 0 || ady === 0 || adx === ady) return [q];

        const d = Math.min(adx, ady), sx = Math.sign(dx), sy = Math.sign(dy);
        const diagFirst = { x: p.x + sx * d, y: p.y + sy * d };
        const straightFirst = { x: q.x - sx * d, y: q.y - sy * d };
        for (const m of [diagFirst, straightFirst]) {
            if (segmentClear(p, m) && segmentClear(m, q)) return [m, q];
        }
        if (depth <= 0) return [q];
        const mid = { x: Math.round((p.x + q.x) / 2), y: Math.round((p.y + q.y) / 2) };
        return octileLegs(p, mid, depth - 1).concat(octileLegs(mid, q, depth - 1));
    }

    // Old method for comparison: A* over tiles, objects at tile centres, 8-way moves (1 / sqrt 2).
    // Diagonal steps may brush a wall corner but not squeeze between two diagonal walls.
    function tileCenterDist(sx, sy, tx, ty) {
        const w = mapWidth, h = mapHeight;
        const g = new Float64Array(w * h).fill(Infinity);
        const closed = new Uint8Array(w * h);
        const hScore = (x, y) => octile((x - tx) * TILE, (y - ty) * TILE);
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
                    if (!isFree(nx, ny)) continue;
                    if (ox && oy && !isFree(cx + ox, cy) && !isFree(cx, cy + oy)) continue;
                    const ng = g[cur] + (ox && oy ? Math.SQRT2 : 1);
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
        add('up', 'U', '上樓梯', '#00ff00', sc.up, mapContext.upStairs);
        add('down', 'D', '下樓梯', '#ff4040', sc.down, mapContext.downStairs);
        const chestTiles = (mapContext.field_0 && mapContext.field_0._chestCoords) || [];
        (mapContext.chestCoords || []).forEach((c, i) =>
            add('c' + i, String(i + 1), '寶箱' + (i + 1), '#ffff00', c, chestTiles[i]));
        return pts;
    }

    function recompute() {
        if (!mapContext) { state = null; return; }
        free = mapGrid.map(row => row.map(t => t !== TILE_WALL && t !== TILE_DIVIDER));

        const points = collectPoints();
        const nodes = points.map(p => ({ x: p.x, y: p.y }));
        for (let m = 0; m <= mapHeight; m++) {
            for (let k = 0; k <= mapWidth; k++) {
                if (isReflexCorner(k, m)) nodes.push({ x: k * TILE, y: m * TILE });
            }
        }

        const adj = nodes.map(() => []);
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (!segmentClear(nodes[i], nodes[j])) continue;
                const w = octile(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
                adj[i].push([j, w]);
                adj[j].push([i, w]);
            }
        }

        const dist = {}, oldDist = {}, paths = {};
        points.forEach((a, i) => {
            const res = dijkstra(nodes, adj, i);
            points.forEach((b, j) => {
                const id = a.key + '>' + b.key;
                dist[id] = res.dist[j];
                oldDist[id] = tileCenterDist(a.tx, a.ty, b.tx, b.ty);

                const chain = [];
                for (let v = j; v >= 0 && res.dist[j] < Infinity; v = res.prev[v]) chain.unshift(nodes[v]);
                const walk = chain.length ? [chain[0]] : [];
                for (let s = 1; s < chain.length; s++) walk.push(...octileLegs(chain[s - 1], chain[s], 6));
                paths[id] = walk;
            });
        });

        state = { points, dist, oldDist, paths };
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

    const fmt = (v, digits) => v === Infinity ? '無法到達' : v.toFixed(digits);

    function render() {
        const fromSel = document.getElementById("distFrom");
        const toSel = document.getElementById("distTo");
        const result = document.getElementById("distResult");
        const coords = document.getElementById("distCoords");
        const table = document.getElementById("distTable");

        if (!state || state.points.length < 2) {
            fromSel.innerHTML = toSel.innerHTML = table.innerHTML = coords.innerHTML = "";
            result.textContent = "這層沒有可計算的目標。";
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
        const d = state.dist[id], od = state.oldDist[id];
        const diff = (d === Infinity || od === Infinity) ? '' : `，差 ${d - od >= 0 ? '+' : ''}${(d - od).toFixed(3)}`;
        result.innerHTML = `距離：<b>${fmt(d, 3)}</b> 格　<span class="dist-muted">（方格中心 A*：${fmt(od, 3)} 格${diff}）</span>`;

        coords.innerHTML = '座標（格）：' + pts.map(p =>
            `<span style="color:${p.color}">${p.label}</span> (${(p.x / TILE).toFixed(3)}, ${(p.y / TILE).toFixed(3)})`
        ).join('　');

        const head = pts.map(p => `<th style="color:${p.color}">${p.label}</th>`).join("");
        const rows = pts.map(a => {
            const cells = pts.map(b => {
                const cid = a.key + '>' + b.key;
                if (a.key === b.key) return `<td class="dist-self">–</td>`;
                const cls = cid === id ? 'pick sel' : 'pick';
                const tip = `方格中心 A*：${fmt(state.oldDist[cid], 3)}`;
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
        `;
        document.head.appendChild(style);

        const panel = document.createElement("div");
        panel.className = "panel dist-panel";
        panel.innerHTML = `
            <div class="dist-row">
                <b>最短距離</b><span class="dist-note">只准水平／垂直／45° 行走，單位＝方格邊長</span>
            </div>
            <div class="dist-row">
                <label for="distFrom">起點</label><select id="distFrom"></select>
                <label for="distTo">終點</label><select id="distTo"></select>
            </div>
            <div class="dist-row" id="distResult"></div>
            <div class="dist-row dist-note" id="distCoords"></div>
            <table class="dist-table" id="distTable"></table>
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

    window.DQ9Distance = { getState: () => state, segmentClear, octile };
})();
