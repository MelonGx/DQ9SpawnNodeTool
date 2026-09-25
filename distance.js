// Shortest walking distance between the stairs and chests of the current floor.
//
// Movement is limited to 8 directions (horizontal, vertical, 45 degrees), so walking a straight
// displacement (dx, dy) costs the octile length max + (sqrt2 - 1) * min, and any straight segment
// can be walked as one diagonal leg plus one straight leg of that same total length.
// The walkable area is measured on TKG's rendered map: every tile sprite is 16x16 pixels, and a
// pixel is floor or wall according to the terrain's wall line (see buildFloor). Objects sit at their
// exact in-tile positions (fx32, before the >> 12 used for display). Every obstacle edge is an
// axis-aligned pixel edge, so a shortest path only bends at reflex wall corners: Dijkstra over the
// visibility graph of those corners plus the objects gives the exact distance.
// Distances are in tiles (one tile edge = 1).
(function () {
    const TILE = 8 * 0x1000;        // one tile in fx32 (8 fine units of 0x1000)
    const PX = 16;                  // sprite pixels per tile edge
    const CELL = TILE / PX;         // one sprite pixel in fx32
    const PX_PER_TILE = 64;
    const DIAG_EXTRA = Math.SQRT2 - 1;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PATH_COLOR = "#ff00ff";

    let free = null;                // free[y * freeW + x]: floor pixel
    let freeW = 0, freeH = 0;
    let state = null;               // { points, dist, straight, diag, dq9at, paths }
    let sel = { from: 'up', to: 'down' };

    function isFree(cx, cy) {
        return cx >= 0 && cy >= 0 && cx < freeW && cy < freeH && free[cy * freeW + cx] === 1;
    }

    function isWalkableTile(tx, ty) {
        return tx >= 0 && ty >= 0 && tx < mapWidth && ty < mapHeight &&
               mapGrid[ty][tx] !== TILE_WALL && mapGrid[ty][tx] !== TILE_DIVIDER;
    }

    // Pixel corner (k, m) whose only two floor neighbours touch diagonally: zero-width, not passable
    function isPinch(k, m) {
        const nw = isFree(k - 1, m - 1), ne = isFree(k, m - 1);
        const sw = isFree(k - 1, m),     se = isFree(k, m);
        return (nw && se && !ne && !sw) || (ne && sw && !nw && !se);
    }

    // Pixel corner with exactly one wall pixel around it: the only places a shortest path bends.
    // Returns the direction (sx, sy) of that wall pixel, or null.
    function reflexWallDir(k, m) {
        const nw = !isFree(k - 1, m - 1), ne = !isFree(k, m - 1);
        const sw = !isFree(k - 1, m),     se = !isFree(k, m);
        if (nw + ne + sw + se !== 1) return null;
        return nw ? [-1, -1] : ne ? [1, -1] : sw ? [-1, 1] : [1, 1];
    }

    // A shortest path can only bend at a reflex corner by wrapping around its wall pixel, so the
    // line through the corner must not cut into that pixel's quadrant or the opposite one.
    function tangentAt(node, dx, dy) {
        if (!node.q) return true;
        const a = dx * node.q[0], b = dy * node.q[1];
        return !((a > 0 && b > 0) || (a < 0 && b < 0));
    }

    function octile(dx, dy) {
        dx = Math.abs(dx); dy = Math.abs(dy);
        return (Math.max(dx, dy) + DIAG_EXTRA * Math.min(dx, dy)) / TILE;
    }

    // Segment lying on a pixel edge (x = line * CELL if vertical, else y = line * CELL), from a to b.
    // Hugging a wall is fine, so a floor pixel on either side of each stretch is enough.
    function edgeRunClear(line, a, b, vertical) {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        for (let c = Math.floor(lo / CELL); c * CELL < hi; c++) {
            const ok = vertical ? (isFree(line - 1, c) || isFree(line, c))
                                : (isFree(c, line - 1) || isFree(c, line));
            if (!ok) return false;
        }
        for (let c = Math.floor(lo / CELL) + 1; c * CELL < hi; c++) {
            if (vertical ? isPinch(line, c) : isPinch(c, line)) return false;
        }
        return true;
    }

    // Does the straight segment a -> b (integer fx32 coords) stay inside the walkable area?
    function segmentClear(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx === 0 && dy === 0) return true;

        if (dx === 0 && a.x % CELL === 0) return edgeRunClear(a.x / CELL, a.y, b.y, true);
        if (dy === 0 && a.y % CELL === 0) return edgeRunClear(a.y / CELL, a.x, b.x, false);

        // Walk the pixels the segment passes through (grid traversal). Which pixel edge comes next
        // is decided exactly with integer cross-multiplication; passing through a pixel corner
        // steps diagonally and must not squeeze through a pinch.
        const sx = Math.sign(dx), sy = Math.sign(dy), adx = Math.abs(dx), ady = Math.abs(dy);
        const startCell = (v, d) => (d < 0 && v % CELL === 0) ? v / CELL - 1 : Math.floor(v / CELL);
        const endCell = (v, d) => (d > 0 && v % CELL === 0) ? v / CELL - 1 : Math.floor(v / CELL);
        let cx = startCell(a.x, dx), cy = startCell(a.y, dy);
        const ex = endCell(b.x, dx), ey = endCell(b.y, dy);
        if (!isFree(cx, cy)) return false;
        while (cx !== ex || cy !== ey) {
            const nx = sx > 0 ? (cx + 1) * CELL : cx * CELL;     // next vertical pixel edge
            const ny = sy > 0 ? (cy + 1) * CELL : cy * CELL;     // next horizontal pixel edge
            // compare (nx - a.x) / dx with (ny - a.y) / dy
            const tx = sx ? (nx - a.x) * sx * ady : Infinity;
            const ty = sy ? (ny - a.y) * sy * adx : Infinity;
            if (tx < ty) cx += sx;
            else if (ty < tx) cy += sy;
            else {
                if (isPinch(nx / CELL, ny / CELL)) return false;
                cx += sx; cy += sy;
            }
            if (!isFree(cx, cy)) return false;
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
        add('up', 'U', '上樓梯', '#00ff00', sc.up, mapContext.upStairs);
        add('down', 'D', '下樓梯', '#ff4040', sc.down, mapContext.downStairs);
        const chestTiles = (mapContext.field_0 && mapContext.field_0._chestCoords) || [];
        (mapContext.chestCoords || []).forEach((c, i) =>
            add('c' + i, String(i + 1), '寶箱' + (i + 1), '#ffff00', c, chestTiles[i]));
        return pts;
    }

    // Sprite pixel classes per terrain (see TERRAIN): 0 transparent, 1 wall-line colour, 2 other
    const terrainCache = {};
    function spriteClasses(mask, env) {
        const key = mask + env;
        if (!terrainCache[key]) {
            const data = TERRAIN[mask], out = new Uint8Array(PX * PX);
            if (data) {
                for (let i = 0; i < PX * PX / 2; i++) {
                    const d = parseInt(data[env][i], 9);
                    out[2 * i] = (d / 3) | 0;
                    out[2 * i + 1] = d % 3;
                }
            }
            terrainCache[key] = out;
        }
        return terrainCache[key];
    }

    // Floor pixels of TKG's rendered map. Wall = everything reachable from transparent pixels
    // without crossing the terrain's wall line, plus the wall-line pixels touching it (the line
    // itself is the wall's edge). Floor = the rest, as far as it connects to an open tile side;
    // wall-line colours left inside the floor are just floor decoration.
    function buildFloor() {
        const env = envIndices[getEnvironment(mapContext.field_0.mapseed)];
        const W = mapWidth * PX, H = mapHeight * PX;
        const cls = new Uint8Array(W * H), masks = [];
        for (let ty = 0; ty < mapHeight; ty++) {
            for (let tx = 0; tx < mapWidth; tx++) {
                const mask = bitfieldGrid[ty][tx];
                masks.push(mask);
                const sc = spriteClasses(mask.toString(16).toUpperCase().padStart(2, '0'), env);
                for (let y = 0; y < PX; y++) {
                    for (let x = 0; x < PX; x++) cls[(ty * PX + y) * W + tx * PX + x] = sc[y * PX + x];
                }
            }
        }

        const wall = new Uint8Array(W * H), stack = [];
        const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
        const pushOuter = (x, y) => {
            const i = y * W + x;
            if (!inside(x, y) || wall[i] || cls[i] === 1) return;
            wall[i] = 1; stack.push(i);
        };
        for (let i = 0; i < W * H; i++) if (cls[i] === 0) pushOuter(i % W, (i / W) | 0);
        while (stack.length) {
            const i = stack.pop(), x = i % W, y = (i / W) | 0;
            pushOuter(x + 1, y); pushOuter(x - 1, y); pushOuter(x, y + 1); pushOuter(x, y - 1);
        }
        // Wall-line pixels 8-connected to the outer wall, and the rest of their line
        for (let i = 0; i < W * H; i++) {
            if (cls[i] !== 1 || wall[i]) continue;
            const x = i % W, y = (i / W) | 0;
            let touch = false;
            for (let dy = -1; dy <= 1 && !touch; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (inside(x + dx, y + dy) && wall[(y + dy) * W + x + dx] === 1) { touch = true; break; }
                }
            }
            if (touch) { wall[i] = 2; stack.push(i); }
        }
        while (stack.length) {
            const i = stack.pop(), x = i % W, y = (i / W) | 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const j = (y + dy) * W + x + dx;
                    if (inside(x + dx, y + dy) && !wall[j] && cls[j] === 1) { wall[j] = 2; stack.push(j); }
                }
            }
        }

        // Floor continues into walkable neighbours, so grow it from the open sides of walkable tiles
        const floor = new Uint8Array(W * H);
        const pushFloor = (x, y) => {
            const i = y * W + x;
            if (!inside(x, y) || floor[i] || wall[i]) return;
            floor[i] = 1; stack.push(i);
        };
        for (let ty = 0; ty < mapHeight; ty++) {
            for (let tx = 0; tx < mapWidth; tx++) {
                if (!isWalkableTile(tx, ty)) continue;
                const v = masks[ty * mapWidth + tx], x0 = tx * PX, y0 = ty * PX;
                for (let k = 0; k < PX; k++) {
                    if (!(v & 0x40)) pushFloor(x0 + k, y0);
                    if (!(v & 0x04)) pushFloor(x0 + k, y0 + PX - 1);
                    if (!(v & 0x01)) pushFloor(x0, y0 + k);
                    if (!(v & 0x10)) pushFloor(x0 + PX - 1, y0 + k);
                }
            }
        }
        while (stack.length) {
            const i = stack.pop(), x = i % W, y = (i / W) | 0;
            pushFloor(x + 1, y); pushFloor(x - 1, y); pushFloor(x, y + 1); pushFloor(x, y - 1);
        }
        free = floor; freeW = W; freeH = H;
    }

    function recompute() {
        if (!mapContext) { state = null; return; }
        buildFloor();

        const points = collectPoints();
        const nodes = points.map(p => ({ x: p.x, y: p.y, q: null }));
        for (let m = 0; m <= freeH; m++) {
            for (let k = 0; k <= freeW; k++) {
                const q = reflexWallDir(k, m);
                if (q) nodes.push({ x: k * CELL, y: m * CELL, q });
            }
        }

        const adj = nodes.map(() => []);
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
                if (!tangentAt(nodes[i], dx, dy) || !tangentAt(nodes[j], dx, dy)) continue;
                if (!segmentClear(nodes[i], nodes[j])) continue;
                const w = octile(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
                adj[i].push([j, w]);
                adj[j].push([i, w]);
            }
        }

        // straight / diag: tiles walked orthogonally / diagonal steps (1 tile on both axes) on that path
        const dist = {}, straight = {}, diag = {}, dq9at = {}, paths = {};
        points.forEach((a, i) => {
            const res = dijkstra(nodes, adj, i);
            points.forEach((b, j) => {
                const id = a.key + '>' + b.key;
                dist[id] = res.dist[j];
                dq9at[id] = dq9atStepCost(a.tx, a.ty, b.tx, b.ty);

                const chain = [];
                for (let v = j; v >= 0 && res.dist[j] < Infinity; v = res.prev[v]) chain.unshift(nodes[v]);
                straight[id] = diag[id] = 0;
                for (let s = 1; s < chain.length; s++) {
                    const dx = Math.abs(chain[s].x - chain[s - 1].x), dy = Math.abs(chain[s].y - chain[s - 1].y);
                    straight[id] += (Math.max(dx, dy) - Math.min(dx, dy)) / TILE;
                    diag[id] += Math.min(dx, dy) / TILE;
                }
                const walk = chain.length ? [chain[0]] : [];
                for (let s = 1; s < chain.length; s++) walk.push(...octileLegs(chain[s - 1], chain[s], 6));
                paths[id] = walk;
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

    const fmt = (v, digits) => v === Infinity ? '無法到達' : v.toFixed(digits);

    function render() {
        const fromSel = document.getElementById("distFrom");
        const toSel = document.getElementById("distTo");
        const result = document.getElementById("distResult");
        const posTable = document.getElementById("distPosTable");
        const table = document.getElementById("distTable");

        if (!state || state.points.length < 2) {
            fromSel.innerHTML = toSel.innerHTML = table.innerHTML = posTable.innerHTML = "";
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
        const d = state.dist[id];
        if (d === Infinity) {
            result.innerHTML = `距離：<b>無法到達</b>`;
        } else {
            const a = state.straight[id], b = state.diag[id];
            result.innerHTML =
                `<div>距離：<b>${fmt(d, 3)}</b> 格 ＝ 直走 ${a.toFixed(3)} 格 ＋ 斜走 ${b.toFixed(3)} 步 × √2</div>` +
                `<div class="dist-muted">DQ9AT A*（方格中心、禁切角）：${fmt(state.dq9at[id], 1)}</div>`;
        }

        // In-tile position: bottom-left of the tile is (0, 0), centre is (0.5, 0.5)
        const posRows = pts.map(p => {
            const inX = p.x / TILE - p.tx, inY = 1 - (p.y / TILE - p.ty);
            return `<tr><th style="color:${p.color}">${p.label}</th><td class="dist-name">${p.name}</td>` +
                   `<td>(${p.tx}, ${p.ty})</td><td>${inX.toFixed(3)}</td><td>${inY.toFixed(3)}</td></tr>`;
        }).join("");
        posTable.innerHTML = `<tr><th></th><th>名稱</th><th>方格</th><th>格內 X</th><th>格內 Y</th></tr>${posRows}`;

        const head = pts.map(p => `<th style="color:${p.color}">${p.label}</th>`).join("");
        const rows = pts.map(a => {
            const cells = pts.map(b => {
                const cid = a.key + '>' + b.key;
                if (a.key === b.key) return `<td class="dist-self">–</td>`;
                const cls = cid === id ? 'pick sel' : 'pick';
                const tip = `直走 ${state.straight[cid].toFixed(3)} ＋ 斜走 ${state.diag[cid].toFixed(3)} 步｜DQ9AT A*：${fmt(state.dq9at[cid], 1)}`;
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
                <b>最短距離</b><span class="dist-note">只准水平／垂直／45° 行走，單位＝方格邊長</span>
            </div>
            <div class="dist-row">
                <label for="distFrom">起點</label><select id="distFrom"></select>
                <label for="distTo">終點</label><select id="distTo"></select>
            </div>
            <div id="distResult"></div>
            <div class="dist-note">1 斜走步＝x、y 各走 1 格邊長。兩工具只有方格邊長 1:1 對齊；DQ9AT 的斜走 1.5、禁切角、方格中心是另一套規則，僅並列參考。</div>
            <div class="dist-row dist-tables">
                <table class="dist-table" id="distTable"></table>
                <div>
                    <table class="dist-table" id="distPosTable"></table>
                    <div class="dist-note">格內位置：左下角 (0, 0)，正中心 (0.5, 0.5)</div>
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

    // TKG mapSprites.png as pixel classes, per tile shape (bitfield) and terrain
    // [caves, ruins, ice, water, fire]: two pixels per base-9 digit (3 * first + second), row-major,
    // 0 = transparent, 1 = the terrain's wall-line colour, 2 = anything else. Wall-line colours:
    //   caves 784010 885818 906820 a07028 b87038      ruins 784010 885818 906820 a07028 b87038 a08028 b08830
    //   ice   784010 885818 906820                    water 784010 885818 906820 a07028
    //   fire  f0c068 e0a840
    // Shapes without data (FF: solid wall) are fully transparent.
    var TERRAIN = {
            '00': ['88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888'],
            '02': ['88888888888888888888888888888888888888888888888888888888888888888888888888888888745888884578888848788888887888888748888887588888', '88888888888888888888888888888888888888888888888888888888888888885888888845888888545888884748888844488888444588888455888824448888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888875888884578888858788888884888888758888888588888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888845888884478888848488888884888888758888887588888', '88888888888888888888888888888888888888888888888888888888888888888888888888888888845888884548888888788888887888888858888828588888'],
            '08': ['88888888888888888888888888888888888888888888888888888888888888888888888888888888888887458888844488888484888884888888845888888758', '88888888888888888888888888888888888888888888888888888888888888888888888488888875888887478888845488888444888874448888774588884446', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888887488888857488888587888884888888875888888788', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888887488888857488888584888884888888875888888788', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888887488888847488888588888884888888878888888786'],
            '0A': ['88888888888888888888888888888888888888888888888888888888888888888888888888888888888887484488854444588474845884588858875888588788', '88888888888888888888888888888888888888888888888888888888788888884458874454488745445884444448847484488775745887788448874874588748', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888888884488887454588745875887588758878887588788', '88888888888888888888888888888888888888888888888888888888888888888888888888888888888888884488884484588748875887588858875887588788', '88888858888888888888888888888888888888888888888888888888888888888888888888888888888888884888887485888848878887588858878828588786'],
            '0E': ['88888888888888888888888888888888888888888888888888844888888448888874458888757488884884584458844484888844888888888888888822222222', '88888888888888888888888888888888888888888888888888888888788888884458874455488445444444444754745487444478784788878888888866666666', '88888888888888888888888888888888888888888888888888888888888888888888888888744588874574584458874484888848888888888888888822222222', '88888888888888888888888888888888888888888888888888888888888888888888888888788588884884884484474445888884888888888888888822222222', '88888888888888888888888888888888888888888888888888888888888888888888888888874888888455884585858787448445888888888888888811111111'],
            '20': ['88888788888884888888848888888585888885748888874588888888888888888888888888888888888888888888888888888888888888888888888888888888', '88884446888877458888754488888444888884448888874788888874888888878888888888888888888888888888888888888888888888888888888888888888', '88888758888887888888848888888585888885748888874888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88888758888887588888848888888585888885748888874888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88888788888887888888848888888588888885748888874888888888888888888888888888888888888888888888888888888888888888888888888888888888'],
            '22': ['88888788888887888888878888888744888888748888888888888888888888888888888888888888845888884478888875488888874888888758888887588888', '88884446888877458888754488888444888884448888874788888874888888875888888845888888548888884488888844488888447588887455888824448888', '88888788888887888888875888888748888888748888888888888888888888888888888888888888888888884458888858488888884888888758888888588888', '88888788888887888888875888888745888888448888888888888888888888888888888888888888888888884488888844588888875888888758888887588888', '88888786888887888888878888888858888888748888888888888888888888888888888888888888888888884588888887888888885888888858888828588888'],
            '28': ['88888758888887588888845888888475888885448888844888888888888888888888888888888888888888888888884488888748888887488888875888888758', '88884488888854588888444488884454888844448888785888888888888888888888888888888888888888858888444488884477888744448887544888885488', '88888788888887888888878888888848888888748888888888888888888888888888888888888888888888888888884488888758888887888888875888888788', '88888788888887888888875888888745888888448888888888888888888888888888888888888888888888888888884488888747888887588888875888888788', '88888786888887888888878888888858888888748888888888888888888888888888888888888888888888888888888488888878888888588888878888888786'],
            '2A': ['88888788888887888888875888888845888888748888888888888888888888888888888888888888888888884588887454888747845887488748875887588788', '88874488888744588888444488884554888844448888878888888888888888884458888844588888445887844558874474588744845887448558844484588745', '88888788888887588888875888888845888888748888888888888888888888888888888888888888888888884588887444888744875887588758875887588788', '88888788888887588888874888888745888888448888888888888888888888888888888888888888888888884488884444588744875887588758875887588788', '88888786888887888888875888888848888888748888888888888888888888888888888888888888888888884588888487888878885888588858878828588786'],
            '2E': ['88888758888887588888848888888585888884448888844888888888888888888888888888888888888444884444574474458888888888888888888822222222', '88884488888844588888444488884445888844448888888888888888758888884458888855588888455888854544444475744548844444448878847828888888', '88888788888887888888878888888745888888448888888888888888888888888888888888888888888888884444444487488888888888888888888822222222', '88888788888887888888858888888588888887448888888888888888888888888888888888748888874445884448744445888888888888888888888822222222', '88888786888887888888885888888875888888848888888888888888888888888888888888888888888888884588744484444888888888888888888811111111'],
            '38': ['88888788888887868888875888888456888874888888448688844888888458868884588888844886888845888888848688888758888887568888875888888786', '88884476888854588888455688884478888847568888445888888556888884488888845688888458888844468888448888884586888844788888544688885488', '88888788888887868888875888888456888884888888758688887588888878868888788888887586888875888888848688888458888887568888878888888786', '88888758888887568888878888888786888884888888758688888788888887868888878888888786888875888888858688888788888887568888875888888756', '88888787888887868888878788888856888888578888885688888487888878868888788788887886888884878888885688888857888888568888885788888786'],
            '3A': ['88888756888887588888875688888788888887868888878888888486888884888888848688888488888884864488848884588756875887588858875687588788', '88884486888754588887444888884848888844488888874588888748888887484458874844588748445887454458877574588748845887458458847885588778', '88888756888887588888875688888758888887868888878888888786888884888888848688888488888887864488878844588786875887588758875687588758', '88888786888887888888878688888788888887868888878888888786888884888888858688888588888885864588878874888786845887888758878688588788', '88888787888887868888875788888856888888578888885688888857888888568888885788888756888887874888878675888787878887868858878728588786'],
            '3E': ['88888456888874588888745688887488888874868888748888887586888845828887488688745882874588664458882048888666888882208886666022222000', '88874482887445668844452087475660844482007445660044482000445660004482000045660000482000005660000082000000660000002000000060000000', '88888786888887888888848688888588888875868888788888887586888848888887588688448882848888864578888058888866888888208888866022222000', '88888756888887588888875688888458888884868888758288887586888878828888586688748882874888664488882088888666888822208866666022222000', '88888786888887878888878688888587888885868888858788844883888488818887887388885870888488334448871088888330888871008873330011110000'],
            '80': ['88588888884888888848888858788888454888887458888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '24448888745588884475888844488888444888885458888845888888588888888888888888888888888888888888888888888888888888888888888888888888', '88588888875888888848888858788888457888888458888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '87588888875888888848888848488888447888888458888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '28588888885888888878888888788888484888888458888888888888888888888888888888888888888888888888888888888888888888888888888888888888'],
            '82': ['87588888875888888458888884588888448888888888888888888888888888888888888888888888845888884478888875488888874888888758888887588888', '88748888874458884444888874445888444488888787888888888888888888888888888888888888785588884444888854748888444488885744588888745888', '87588888875888888758888874588888448888888888888888888888888888888888888888888888888888884588888854888888875888888858888887588888', '88588888875888888758888854588888448888888888888888888888888888888888888888888888888888884488888874588888875888888858888888588888', '28588888885888888788888885888888488888888888888888888888888888888888888888888888888888884588888884888888875888888858888828588888'],
            '83': ['88588888275888888758888828588888884888882874888888844888288748888887488828844888887488882875888888488888284888888748888827588888', '85448888247458888844888824445888874488882744888887458888274588888745888827488888874488882554888884475888277488888544888827445888', '88588888285888888758888827488888884888882875888888758888288588888885888828758888887588882848888887488888275888888858888828588888', '87588888275888888858888828588888884888882875888888588888285888888858888828588888887588882878888888588888275888888758888827588888', '58588888285888885858888827888888578888882788888857488888287588885885888828758888574888882788888857888888278888885788888827588888'],
            '88': ['88588888875888888748888845488888447888888458888888888888888888888888888888888888888888888888884488888747888887588888875888888788', '24448888745488884445888844488888475888885488888845888888588888888888888788888874888887478888845488888444888874448888774588884446', '88588888875888888848888858488888445888888888888888888888888888888888888888888888888888888888884488888857888887888888875888888788', '88588888885888888758888874588888448888888888888888888888888888888888888888888888888888888888884488888744888887588888875888888758', '28588888885888888758888887888888458888888888888888888888888888888888888888888888888888888888887488888848888887588888878888888786'],
            '8A': ['88588888875888888758888844888888458888888888888888888888888888888888888888888888888888884488884457588747875887588748875887588788', '88448888874488884444888844448888444488888578888888888888888888888888874488888745788884444458847455588775445884484448847874488778', '87588888875888888758888844888888458888888888888888888888888888888888888888888888888888884488884447588747875887588758875887588788', '87588888875888888758888844588888448888888888888888888888888888888888888888888888888888884488884474588745875887488758875887588788', '28588888885888858758888884888888458888888888888888888888888888888888888888888888888888884888887475888845878887588858878828588786'],
            '8B': ['28588888875888882758888887588888275888888758888827588888884888882848888888788888287884488848847428588484885884882858845888588788', '28448888874758888444588885878888854488887458888884588888845888888458874484588744745887447558874484588745745887488548874885588778', '28588888885888882858888887588888275888888758888828588888885888882858888888588888285888888858884428588747885887582858875888588788', '27588888875888882758888888488888284888888845888828758888887588882878888888488888284888488858878428588788885887882858878888588788', '58588888285888885858888827888888578888882788888857888888278888885788888828588888585888882858888458588875285888585858875828588787'],
            '8E': ['88588888885888888758888854588888448888888888888888888888888888888888888888888888884448884444444474888874888888888888888866666666', '88448888874488884444888874448888444488888888888888888888888888888888884488888844775788444444444455444445444444455888888888888886', '87588888875888888758888844588888448888888888888888888888888888888888888888888888888458884444444445888844888888888888888866666666', '88588888875888888458888874888888458888888888888888888888888888888888888888888888888448884448744488888888888888888888888822222222', '28588888875888888788888875888888488888888888888888888888888888888888888888888888888888884445888488844444888888888888888811111111'],
            '8F': ['27588888875888882858888888488888284888888875888828758888688488882884588868874445228844440688844422288874066888880222288800066666', '68445888227445880674448802275458006844480022744500068444000227440000684400002274000006840000022700000068000000220000000600000002', '27588888885888882848888888788888287588888855888828858888888488882887588888884488288877480888887422888888068888880222888800066666', '27588888875888882758888888488888284888886875888828758888688588882287888868884588228884580688884422288888066688880222228800066666', '28588888585888882858888858788888287888884878888818844888388878881888588805878888118848880358844401188888003488880011188800003333'],
            'A0': ['88588788875887888748875855488745447888448448888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '85588745855887458548844884588748544887744458874444488744445887444858885888888888888888888888888888888888888888888888888888888888', '87588788875887888758875844588745448888448888888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '88588758875887888758875884588745448888448888888888888888888888888888888888888888888888888888888888888888888888888888888888888888', '28588786885887888858885887888878458888848888888888888888888888888888888888888888888888888888888888888888888888888888888888888888'],
            'A2': ['88588788875884888758848874888848458888748888888888888888888888888888888888888888888888884588888857888888875888888748888887588888', '84588748544887784458874844588745445887744858874488888744888887448888888888888888885888884444888847748888444488888744588888445888', '87588788875887888758875844888848458888748888888888888888888888888888888888888888888888884588888844888888875888888758888887588888', '87588788875887588758874874588745448888448888888888888888888888888888888888888888888888884488888844588888875888888758888887588888', '28588786875887888788875875888848488888748888888888888888888888888888888888888888888888884588888884888888885888888858888848588888'],
            'A3': ['88588758275887888758875827588748884888442848888888488888284888888848888828488888885888882858888888588888275888888758888827588888', '74588778844887487458874874488745745887447458874484588744745887448458888884588888845888888458888884448888844488888444588828448888', '87588788275887888758875828588845885888742858888888488888284888888848888828588888885888882858888887588888275888888758888827588888', '88588788285887588858874828588844885888742878888888788888287888888848888828588888885888882858888888588888285888888858888828588888', '58588786285887885858885828588878585888842758888857588888278888885788888827888888578888882788888857888888275888885858888828588888'],
            'A8': ['88588788875887888758874874588845445888748888888888888888888888888888888888888888888888888888887488888747888887888888875888888788', '85588445854884448448874445588477454887444448885574588888445888888888888888888888888885788888444488884444888844448888445888884588', '87588788875887888758875874588845448888748888888888888888888888888888888888888888888888888888887488888757888887888888875888888788', '87588788875887588758875844588745448888448888888888888888888888888888888888888888888888888888884488888744888887588888875888888788', '28588786885887888858885887888878458888848888888888888888888888888888888888888888888888888888887488888858888887888888878888888786'],
            'AA': ['88588788875887888758875844588845448888448888888888888888888888888888888888888888888888884488884457588747875887588748875887588788', '84588748545887774458874444588744448887448888884888888888888888888888888888888888888888884488884454588745445887448458877784588778', '87588788875887888758878844588845448888748888888888888888888888888888888888888888888888884488884447588747875887588858875887588788', '87588758875887588758875845588745448888448888888888888888888888888888888888888888888888884488884444588747875887588758875887588788', '28588786885887888858875887888848458888748888888888888888888888888888888888888888888888884588888484888875875888588858878828588786'],
            'AB': ['27588758885887582858875887588758284887448848884428488888887588882875888888758888287588888845884427488748885887582758875887588788', '84588748844887747458874444488744448887444788885774888888748888887488888844888888745888887758874444588745745884445448877584488778', '88588758285887888858878828588785885887442848884888788888287888888878888828488888884888882858887488588848275887588758875827588788', '87588758275887888758875827588745884888442848884887888888278888888788888827888888884888882748887487588844275887888758875828588758', '28588786275887885788878827888858578888742788888857588888285888885878888818488888487888881878887458488858285887885858878828588786'],
            'AE': ['88588788884887588848874844788745444888448888888888888888888888888888888888874488884444584444874457888854888888888888888822222222', '84588748444887744458874444488744445887445888885888888888888888888888888888888888888888884488884454444445444474448444444588888888', '88588788875887888848875858488845445888748888888888888888888888888888888888888888887445884448744488888874888888888888888866666666', '88588758875887588748875854488854448888748888888888888888888888888888888888888888884884884448844444844745888888888888888866666666', '28588786885887888858878887888858458888748888888888888888888888888888888888888888888844584884584484488888888888888888718833333333'],
            'AF': ['88588758275887888758875824588745848888442488888887588888274888888845888828478888884544582874444488845844288888886888888822222222', '84588748844887777458874444588744748887444788874874888888748888887488888844888888745888887758884444444445744474447444445827458888', '87588788275887888758875828588745885888742858888887588888275888888758888828488888884588882874444488888887288888886888888822222222', '27588788875887882758878887588745285888448758888827588888875888882758888888488888284588882874444408878884228888880688888800066666', '58588788285887885858878828588858585888742858888858588888287888881878888808858888058758880188744403588888011888880001888800001111'],
            'B8': ['88588788874887868848878848488786454884887448858688888588888884868888848888888756888887588888875688888758888887568888875888888786', '85588778845884787458874544588748445887754458874544588748445887488888874888888748888887458888447888885878888744488887545888884486', '87588788875887868758878844588786448887888888878688888788888887868888878888888786888887588888875688888758888887868888878888888786', '88588788885887868858878888588786485887888488848688888488888885868888758888887586888874888888848688888488888887568888875888888756', '58588787875887868788878775888786488887878888878688888787888888568888885788888856888888578888885688888857888887868888878788888786'],
            'BA': ['88588758875887568758878884588456448874888888758688887588888875868888758888888486745884884558848687588758875887868758878887588756', '74588748445887784458874844588745445888545858884488888845888888458888884588888845885887444488884554588748445887454458877874488778', '88588756875887588758875684888788458887868888848888888486888885888888858688888588848884864458878878588786885887888858878687588788', '87588756845887588858875644888758458884568888848888888856888888588888885688888858848884864488848874588756875887588858875687588758', '28588786885887578758885684888857458888568888885788888756888887878888848688888487888885834588858484888486875887878858878628588787'],
            'BB': ['88588758275887868758878827888786874887882758875688488758284888568878885828788856884887582848875688488758275887868758878827588756', '84588748745887757458874574888845748888554788874574888845748888457488884544888845745887447758884544888845745887457448877884488778', '87588788275887568758875824888846848888482488884687588848275887468758875828588786875887882858875687588788275887868758875827588786', '87588748285887568858874828588846885888782858887687588848245887468458874824888756858887882588878684888788245887568758875824588756', '58588787285887865858878727888486578885872788858657888487275887865858878728588776584888572878885658488857285888565858878728588786'],
            'BE': ['87588786885887588758875674588748448888468888884888888746888884488888745688885488874474864444458844874886888888828888886622222220', '84588748544887784458874544488744444888545858884488888845888888458888884588888845778887444488884554444445444474458744444587788886', '87588786875887888758878654588758458887568888875888888786888887588888875688888458888874864444458847788886888888828888886622222220', '87588786875887888758878644588788448887868888875888888756888887588888875688888488888874864444458647455880788888668888882022222000', '88588787885887868858878787888786458887878888878688888787888885868888858388887880888758704445886088888710888883308888300033330000'],
            'BF': ['88588786275887888748878627488758875887562758875887888856275888588758875628488458884574862874458888888886288888826888886622222220', '84588748544887777458874444888844748888544788884474888845748888457488884544888845745887447758884544444445744474457444444524788886', '87588786275887888758878628588758885887862858878887588756275887888758878628588788884884862845748888744586288888826888886622222220', '27588758875887562758875887588756275887588788885627888858878888562788885887588786284884888874458628875888688888862288888206666666', '58588786285887875858878628488487587885862848858758588586285887875858878628588787385887861848848138744583128888710358873301111110'],
            'E0': ['22222222888888888888888874888845444887448448848888457588887445888884488888844888888888888888888888888888888888888888888888888888', '22222222888888887858878558744588474444844444444444487444445587444558888888888888888888888888888888888888888888888888888888888888', '66666666888888888888888884888848445887448745745888744588888888888888888888888888888888888888888888888888888888888888888888888888', '66666666888888888888888848888874445448448848848888788588888888888888888888888888888888888888888888888888888888888888888888888888', '33333333888888888888888884458745458475878884758888874888888888888888888888888888888888888888888888888888588888888888888888888888'],
            'E2': ['66666666888888888888888888887445445744448844588888888888888888888888888888888888744888884448888878788888884888888748888887588888', '88888886854885884444444884744575444444747888877488888777888887448888887588888888888888884444888874448888444488888744888888448888', '66666666888888888888888888888458444444448888888888888888888888888888888888888888888888884488888847588888875888888758888887588888', '66666666888888888888888888888874444584448874445888884588888888888888888888888888888888884458888888788888887888888858888888588888', '33333363888888888888888888874458444588748888888888888888888888888888888888888888888888884888888885888888878888888858888828588888'],
            'E3': ['00066666022228880668888822288884068887442288745868874588288458886874888828758888884588882845888888458888274588888745888827488888', '00000002000000060000002200000068000002270000067400002274000068440002274400068475002274450068444802274458068444882274458868444888', '00066666022888880688888822888887088885742888874868884488288758888884888828758888888588882875888888788888284888888858888828588888', '00066666022222880666888822288874068887442288745868884588228788886885888828858888687588882878888888488888285888888858888828588888', '00003333001118880034888801188888035884441188488805878888188858883888788818844888587888882878888858788888285888885858888828588888'],
            'E8': ['22222222888888888888888845888844444444448884448888888888888888888888888888888888888888888888884488888747888887588888878888888788', '28888888887884788444444474444547454444444558888554588888445888887588888888888888888888888888444488884445888844448888445888884488', '22222222888888888888888844888874444444448887488888888888888888888888888888888888888888888888884488888747888887588888878888888788', '22222222888888888888888888888888444487448887458888888888888888888888888888888888888888888888887488888845888887488888875888888788', '11111111888888888888888884444888488874448888888888888888888888888888888888888888888888888888888488888875888888488888875888888786'],
            'EA': ['66666666888888888888888848888857445844448744448888445888888888888888888888888888888888884488874474588444875884888858848888588788', '85887858544444574454444444444444445487445558885888888888888888888888888888888888888887884458884454488745445887444458877474588778', '22222222888888888888888845888888444584448874458888888888888888888888888888888888888888884588874474888487875884888858875888588788', '22222222888888888888888874544844444884448848848888888888888888888888888888888888888888884588884447888444875884588758875887588788', '11111111884888888888888888887445448748848744888888888888888888888888888888888888888888884588887484888848875887588858878828588786'],
            'EB': ['06666666228888886888845828884445887448442844588887478888275588888748888828488888884888882848884487488747275887588758875827588788', '28887858744444577454444444444444748488444758887774888888745888887488888844888888748888887758884444588745745884448448877784488778', '06666666228888886888888828784445887444442848888887588888275888888758888828588888875888882858887487588847275887588758875827588788', '00066666068888882288888808874444287444442845888888488888275888888758888827588888875888882758884487588744275887588758875827588758', '00001111000188880118888803588888018744440587588808858888187888882848888858588888285888885858887428588858585887882858878858588788'],
            'EE': ['66666666888888888888888858744557444584448888888888888888888888888888888888888888885444584544874474488874888888888888888866666666', '85887858444444444454444444444444458888745888888888888888888888888888888888888888788888884588884454444445444474444444444884458888', '66666666888888888744888874445785458744448888888888888888888888888888888888888888888888884584444444445544874888888888888866666666', '22222222888888885444588844844887458744448888888888888888888888888888888888888888888888884444587445844844888744478888888822222222', '11111111888888888888888888887445448448848745888888888888888888888888888888888888888884584587454484448888888888888888888811111111'],
            'EF': ['22222222688888882888888888874455287454448845884828488888885888882858888888488888284588888874844428844457688888882288888806666666', '15887858444444447454444444444444745888444788888874888888748888887488888844888888745888887758884444444445744474447444444524788888', '22222222688888882888888888888785287444448848888827588888875888882758888888588888284888888874444428888887688888882288888806666666', '06666666228888886888888828844444887587442848888888588888275888888758888828588888884888882875874488874455288888886888888822222222', '01111111033888881288888838888888184455445758745827888888578888882788888857888888275884583844454412888888038888880122888800333336'],
            'F8': ['22222000888666608888822058888666484888204444886674445882888748868888488288887586888875888888848688888488888887868888875888888756', '60000000200000006600000082000000566000004820000045660000448200004456600044482000744566008444820087475660884445208874456688874482', '22222000888866608888882088888866458888808455888688448888888758868888488888887886888877888888758688888588888884868888878888888756', '22222000886666608888222045888666445888208745886688748882888858668888788288887886888875828888858688888488888887868888878888888786', '11110000887333008888410088888330444887108884883388885870888788838885888188844883888885878888858688888587888884868888878788888786'],
            'FA': ['66666666888888228748888674448882448445868887448888885456888877588888845688888488888884864488848854588456875887588758875888588756', '88887856574444454454444544444445448888555888874588888845888888458888884588888845888887444458884554588745445887458458877584488778', '66666666888888228888886645788882444448868888758888888486888887888888878688888788888887864488875847588786875887888758875887588786', '66666600888882208888886644478880444445868888758288888486888887588888878688888758888887564488875847588786875887588758875887588756', '33330000888830008888833088888710444558308887587088887880888884838888858688888787888887864588878787888786885887878858878688588787'],
            'FB': ['06666666228888826888888628888888887445862845448887488486275887588758885627888858875888562758875887588456285884888858875627588788', '25887853444444447454444444444444745887544788884474888845748888457488884544888845745887447758884544488745745887457458847584488778', '06666666228888826888888628744888884574862848845887588786275887888758878628588788875887862858875887588786275887888758875627588788', '06666666228888826888888628874888887445862848848887588786278888588788885627888858878888562758875887588756275887588758875627588788', '00333330012887100388886312744581384884832858878138588786285887875858878628588487584884862878858758488486285887875858878628588788'],
            'FE': ['22222220888888668888888257444886444845888888748688888488888887868888878888888486848874884447458647448888888888868888888266666666', '85887856544444444454444444444444458888544588874488888845888888458888884588888845788887444588884554444445444474458444444584788886', '22222220888888668888888245788886444445888888748688888488888887868888878888888786888884884444458678588888888888868888888266666666', '22222220888888668888888244444886445875888888848688888788888887568888875888888786888884884458758677445888888888868888888266666666', '11111110888866308888881088888863448444818745875688888857888888568888885788888856874887574474448388888881888888638888811033333330'],
    };

    buildPanel();
    // Registered after the main script's listeners, so run() has already rebuilt the map
    document.getElementById('mapSeed').addEventListener('input', update);
    document.getElementById('floor').addEventListener('input', update);
    update();

    window.DQ9Distance = { getState: () => state, segmentClear, octile, dq9atStepCost, isFree, reflexWallDir, size: () => [freeW, freeH] };
})();
