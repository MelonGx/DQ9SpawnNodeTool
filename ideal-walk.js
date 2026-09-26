function createIdealWalk(px = 16, tkg) {
    const TILE = 8 * 0x1000;
    const PX = px;
    const GRID = px;
    const CELL = TILE / GRID;
    const FOOT = px > 1 ? 2 : 1;
    const DIAG_EXTRA = Math.SQRT2 - 1;

    let free = null;
    let freeW = 0, freeH = 0;

    function isFree(cx, cy) {
        return cx >= 0 && cy >= 0 && cx < freeW && cy < freeH && free[cy * freeW + cx] === 1;
    }

    const isWalkableTile = (grid, tx, ty) => grid[ty][tx] !== tkg.TILE_WALL && grid[ty][tx] !== tkg.TILE_DIVIDER;

    function octileSteps(dx, dy) {
        dx = Math.abs(dx); dy = Math.abs(dy);
        return Math.max(dx, dy) + DIAG_EXTRA * Math.min(dx, dy);
    }
    const octile = (dx, dy) => octileSteps(dx, dy) / TILE;

    function makeHeap(less) {
        const heap = [];
        return {
            get size() { return heap.length; },
            push(e) {
                heap.push(e);
                for (let i = heap.length - 1; i > 0;) {
                    const p = (i - 1) >> 1;
                    if (!less(heap[i], heap[p])) break;
                    [heap[p], heap[i]] = [heap[i], heap[p]];
                    i = p;
                }
            },
            pop() {
                const top = heap[0], last = heap.pop();
                if (heap.length) {
                    heap[0] = last;
                    for (let i = 0; ;) {
                        const l = 2 * i + 1, r = l + 1;
                        let m = i;
                        if (l < heap.length && less(heap[l], heap[m])) m = l;
                        if (r < heap.length && less(heap[r], heap[m])) m = r;
                        if (m === i) break;
                        [heap[m], heap[i]] = [heap[i], heap[m]];
                        i = m;
                    }
                }
                return top;
            },
            drain() { return heap.splice(0); },
        };
    }
    const byKey = (a, b) => a[0] < b[0];

    function isPinch(k, m) {
        const nw = isFree(k - 1, m - 1), ne = isFree(k, m - 1);
        const sw = isFree(k - 1, m),     se = isFree(k, m);
        return (nw && se && !ne && !sw) || (ne && sw && !nw && !se);
    }

    function reflexWallDir(k, m) {
        const nw = !isFree(k - 1, m - 1), ne = !isFree(k, m - 1);
        const sw = !isFree(k - 1, m),     se = !isFree(k, m);
        if (nw + ne + sw + se !== 1) return null;
        return nw ? [-1, -1] : ne ? [1, -1] : sw ? [-1, 1] : [1, 1];
    }

    function tangentAt(node, dx, dy) {
        if (!node.q) return true;
        const a = dx * node.q[0], b = dy * node.q[1];
        return !((a > 0 && b > 0) || (a < 0 && b < 0));
    }

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

    function segmentClear(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx === 0 && dy === 0) return true;

        if (dx === 0 && a.x % CELL === 0) return edgeRunClear(a.x / CELL, a.y, b.y, true);
        if (dy === 0 && a.y % CELL === 0) return edgeRunClear(a.y / CELL, a.x, b.x, false);

        const sx = Math.sign(dx), sy = Math.sign(dy), adx = Math.abs(dx), ady = Math.abs(dy);
        const startCell = (v, d) => (d < 0 && v % CELL === 0) ? v / CELL - 1 : Math.floor(v / CELL);
        const endCell = (v, d) => (d > 0 && v % CELL === 0) ? v / CELL - 1 : Math.floor(v / CELL);
        let cx = startCell(a.x, dx), cy = startCell(a.y, dy);
        const ex = endCell(b.x, dx), ey = endCell(b.y, dy);
        if (!isFree(cx, cy)) return false;
        while (cx !== ex || cy !== ey) {
            const nx = sx > 0 ? (cx + 1) * CELL : cx * CELL;
            const ny = sy > 0 ? (cy + 1) * CELL : cy * CELL;
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

    const OUTER_LEG = [6, 8, 6, 6, 6];
    const INNER_CUT = [18, 8, 18, 18, 14];
    function isWallPx(m, env, x, y) {
        const P = PX, B = PX / 4, k = P / 16, cx = x + 0.5, cy = y + 0.5;
        if ((m & 0x01 && cx < B) || (m & 0x10 && cx > P - B) || (m & 0x40 && cy < B) || (m & 0x04 && cy > P - B)) return true;
        const leg = OUTER_LEG[env] * k, cut = INNER_CUT[env] * k;
        if ((m & 0x08 && !(m & 0x14) && (P - cx) + (P - cy) < leg) || (m & 0x20 && !(m & 0x50) && (P - cx) + cy < leg)
            || (m & 0x02 && !(m & 0x05) && cx + (P - cy) < leg) || (m & 0x80 && !(m & 0x41) && cx + cy < leg)) return true;
        return (m === 0x3E && cx + cy > cut) || (m === 0xE3 && (P - cx) + (P - cy) > cut)
            || (m === 0x8F && (P - cx) + cy > cut) || (m === 0xF8 && cx + (P - cy) > cut);
    }

    function setFloor(map) {
        const { grid, width: mapWidth, height: mapHeight, bitfield: bitfieldGrid, env } = map;
        const W = mapWidth * PX;
        const floor = new Uint8Array(W * mapHeight * PX);
        for (let ty = 0; ty < mapHeight; ty++) {
            for (let tx = 0; tx < mapWidth; tx++) {
                if (!isWalkableTile(grid, tx, ty)) continue;
                const m = bitfieldGrid[ty][tx];
                for (let y = 0; y < PX; y++) {
                    for (let x = 0; x < PX; x++) if (!isWallPx(m, env, x, y)) floor[(ty * PX + y) * W + tx * PX + x] = 1;
                }
            }
        }
        const GW = mapWidth * GRID, GH = mapHeight * GRID;
        free = new Uint8Array(GW * GH);
        for (let gy = 0; gy + FOOT <= GH; gy++) {
            for (let gx = 0; gx + FOOT <= GW; gx++) {
                let all = 1;
                for (let y = gy; y < gy + FOOT && all; y++) for (let x = gx; x < gx + FOOT; x++) if (!floor[y * W + x]) { all = 0; break; }
                free[gy * GW + gx] = all;
            }
        }
        freeW = GW; freeH = GH;
        corners = null;
    }

    function setFloorTiles(map) {
        const { grid, width, height } = map;
        free = new Uint8Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) free[y * width + x] = isWalkableTile(grid, x, y) ? 1 : 0;
        }
        freeW = width; freeH = height;
        corners = null;
    }

    let corners = null;
    function floorCorners() {
        if (!corners) {
            corners = [];
            for (let m = 0; m <= freeH; m++) {
                for (let k = 0; k <= freeW; k++) {
                    const q = reflexWallDir(k, m);
                    if (q) corners.push({ x: k * CELL, y: m * CELL, q });
                }
            }
        }
        return corners;
    }

    function shortest(points, src, targets) {
        const nodes = points.map(p => ({ x: p.x, y: p.y, q: null })).concat(floorCorners());
        const n = nodes.length;
        const g = new Float64Array(n).fill(Infinity), closed = new Uint8Array(n);
        const left = new Set(targets.filter(t => t !== src));
        const h = v => {
            let best = Infinity;
            for (const t of left) best = Math.min(best, octile(nodes[t].x - nodes[v].x, nodes[t].y - nodes[v].y));
            return best === Infinity ? 0 : best;
        };
        const heap = makeHeap(byKey);
        g[src] = 0;
        heap.push([h(src), src]);
        while (heap.size && left.size) {
            const u = heap.pop()[1];
            if (closed[u]) continue;
            closed[u] = 1;
            if (left.delete(u)) {
                for (const [, v] of heap.drain()) if (!closed[v]) heap.push([g[v] + h(v), v]);
                continue;
            }
            const a = nodes[u];
            for (let v = 0; v < n; v++) {
                if (closed[v]) continue;
                const b = nodes[v], dx = b.x - a.x, dy = b.y - a.y;
                if (!tangentAt(a, dx, dy) || !tangentAt(b, dx, dy)) continue;
                const gv = g[u] + octile(dx, dy);
                if (gv >= g[v]) continue;
                if (!segmentClear(a, b)) continue;
                g[v] = gv;
                heap.push([gv + h(v), v]);
            }
        }
        return g;
    }

    const pxOf = v => Math.floor(v / CELL);

    function stairsShape(fine, tile, grid) {
        const solid = (x, y) => { const t = grid[y] && grid[y][x]; return t === undefined || t === tkg.TILE_WALL || t === tkg.TILE_DIVIDER; };
        const [dx, dy] = !solid(tile.x, tile.y + 1) ? [0, 1] : !solid(tile.x + 1, tile.y) ? [1, 0]
            : !solid(tile.x - 1, tile.y) ? [-1, 0] : !solid(tile.x, tile.y - 1) ? [0, -1] : [0, 1];
        const d = dx || dy, front = d > 0 ? 0 : -1;
        const ux = fine.x * 2, uz = fine.z * 2;
        const at = (a, c) => dx ? [ux + a, uz + c] : [ux + c, uz + a];
        const across = [-1, 0];
        return {
            front: across.map(c => at(front, c)),
            body: [1, 2, 3, 4].flatMap(k => across.map(c => at(front - k * d, c))),
        };
    }

    const posIndex = (x, y) => (x >= 0 && y >= 0 && x < freeW && y < freeH) ? y * freeW + x : -1;
    const covers = (i, [x, y]) => { const px = i % freeW, py = (i / freeW) | 0; return x >= px && x < px + FOOT && y >= py && y < py + FOOT; };
    const footprintsOver = pixels => {
        const out = new Set();
        for (const [x, y] of pixels) for (let oy = 1 - FOOT; oy <= 0; oy++) for (let ox = 1 - FOOT; ox <= 0; ox++) {
            const i = posIndex(x + ox, y + oy);
            if (i >= 0) out.add(i);
        }
        return [...out];
    };

    const isStairs = (stairs, j) => (stairs || []).some(s => s.k === j);
    const overlap1 = (a, c, r = 1) => Math.max(0, Math.min(a + FOOT, c + r) - Math.max(a, c - r));
    const DOWN_HALF = 4 / 3;

    function legSetup(points, stairs, src, dst) {
        const N = freeW * freeH, hard = new Uint8Array(N), chest = new Float64Array(N);
        const boxes = points.flatMap((p, j) => p && !isStairs(stairs, j) ? [[p.x / CELL, p.y / CELL]] : []);
        for (const [cx, cy] of boxes) {
            for (let y = Math.ceil(cy - 1 - FOOT); y < cy + 1; y++) for (let x = Math.ceil(cx - 1 - FOOT); x < cx + 1; x++) {
                const i = posIndex(x, y);
                if (i >= 0) chest[i] += overlap1(x, cx) * overlap1(y, cy);
            }
        }
        let starts = null;
        for (const s of stairs || []) {
            if (s.k === dst || (s.k === src && !s.up)) continue;
            if (!s.up) {
                const cx = points[s.k].x / CELL, cy = points[s.k].y / CELL;
                for (let y = Math.ceil(cy - DOWN_HALF - FOOT); y < cy + DOWN_HALF; y++) for (let x = Math.ceil(cx - DOWN_HALF - FOOT); x < cx + DOWN_HALF; x++) {
                    const i = posIndex(x, y);
                    if (i >= 0 && overlap1(x, cx, DOWN_HALF) * overlap1(y, cy, DOWN_HALF) > 0) hard[i] = 1;
                }
                continue;
            }
            for (const i of footprintsOver(s.shape.body)) hard[i] = 1;
            if (s.k === src) starts = footprintsOver(s.shape.front).filter(i => free[i] === 1 && !s.shape.body.some(b => covers(i, b)));
        }
        const pass = (u, v) => v >= 0 && free[v] === 1 && !hard[v] && (!chest[v] || chest[v] < chest[u]);
        const step = (u, ox, oy) => {
            const cx = u % freeW, cy = (u / freeW) | 0, v = posIndex(cx + ox, cy + oy);
            if (!pass(u, v)) return -1;
            if (ox && oy && (!pass(u, posIndex(cx + ox, cy)) || !pass(u, posIndex(cx, cy + oy)))) return -1;
            return v;
        };
        const standing = i => i >= 0 && free[i] === 1 && !hard[i] && !chest[i];
        const goals = j => {
            const p = points[j];
            if (isStairs(stairs, j)) return footprintsOver([[pxOf(p.x), pxOf(p.y)]]).filter(standing);
            const cx = p.x / CELL, cy = p.y / CELL, out = [];
            const lo = c => Math.floor(c - 1 - FOOT) + 1, hi = c => Math.ceil(c + 1) - 1;
            for (let k = lo(cy); k <= hi(cy); k++) out.push(posIndex(Math.floor(cx - 1 - FOOT), k), posIndex(Math.ceil(cx + 1), k));
            for (let k = lo(cx); k <= hi(cx); k++) out.push(posIndex(k, Math.floor(cy - 1 - FOOT)), posIndex(k, Math.ceil(cy + 1)));
            return [...new Set(out)].filter(standing);
        };
        if (!starts) starts = goals(src);
        return { step, starts, goals };
    }

    const MOVES = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

    function gridShortest(targets, step, starts, goals) {
        const W = freeW, H = freeH;
        const g = new Float64Array(W * H).fill(Infinity), closed = new Uint8Array(W * H);
        const res = targets.map(() => Infinity), goalOf = new Map();
        targets.forEach((t, k) => { for (const c of goals(t)) { if (!goalOf.has(c)) goalOf.set(c, []); goalOf.get(c).push(k); } });
        const left = new Set(goalOf.keys());
        const h = c => {
            let best = Infinity;
            const cx = c % W, cy = (c / W) | 0;
            for (const t of left) best = Math.min(best, octileSteps(t % W - cx, ((t / W) | 0) - cy));
            return best === Infinity ? 0 : best;
        };
        const heap = makeHeap(byKey);
        for (const start of starts) { g[start] = 0; heap.push([h(start), start]); }
        while (heap.size && left.size) {
            const u = heap.pop()[1];
            if (closed[u]) continue;
            closed[u] = 1;
            if (left.has(u)) {
                for (const k of goalOf.get(u)) if (res[k] === Infinity) res[k] = g[u] / GRID;
                for (const [c, ks] of goalOf) if (left.has(c) && ks.every(k => res[k] < Infinity)) left.delete(c);
                for (const [, v] of heap.drain()) if (!closed[v]) heap.push([g[v] + h(v), v]);
                if (!left.size) break;
            }
            for (const [ox, oy] of MOVES) {
                const v = step(u, ox, oy);
                if (v < 0) continue;
                const gv = g[u] + (ox && oy ? Math.SQRT2 : 1);
                if (gv < g[v]) { g[v] = gv; heap.push([gv + h(v), v]); }
            }
        }
        return res;
    }

    function gridFrom(points, src, stairs) {
        const dist = points.map(() => Infinity);
        const groups = new Map();
        points.forEach((p, j) => {
            if (!p) return;
            const key = isStairs(stairs, j) ? j : -1;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(j);
        });
        for (const targets of groups.values()) {
            const { step, starts, goals } = legSetup(points, stairs, src, targets[0]);
            const d = gridShortest(targets, step, starts, goals);
            targets.forEach((j, k) => { dist[j] = d[k]; });
        }
        return dist;
    }

    function gridPath(points, src, dst, stairs) {
        const W = freeW, N = W * freeH;
        const { step, starts: firsts, goals } = legSetup(points, stairs, src, dst);
        const nearWall = c => {
            const x = c % W, y = (c / W) | 0;
            for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if ((ox || oy) && !isFree(x + ox, y + oy)) return 1;
            return 0;
        };
        const ends = new Set(goals(dst));
        const S = N * 9;
        const sa = new Int32Array(S).fill(-1), sb = new Int32Array(S), st = new Int32Array(S), sw = new Int32Array(S);
        const prev = new Int32Array(S).fill(-1), done = new Uint8Array(S);
        const less = (a1, b1, t1, w1, i) => {
            if (sa[i] < 0) return true;
            if (a1 === sa[i] && b1 === sb[i]) return t1 < st[i] || (t1 === st[i] && w1 < sw[i]);
            return a1 + b1 * Math.SQRT2 < sa[i] + sb[i] * Math.SQRT2;
        };
        const h = c => { let m = Infinity; for (const e of ends) m = Math.min(m, octileSteps(c % W - e % W, ((c / W) | 0) - ((e / W) | 0))); return m; };
        const heap = makeHeap((x, y) => Math.abs(x[0] - y[0]) > 1e-9 ? x[0] < y[0] : (x[1] - y[1] || x[2] - y[2]) < 0);
        if (!firsts.length || !ends.size) return [];
        for (const start of firsts) {
            const s0 = start * 9 + 8;
            sa[s0] = 0; heap.push([h(start), 0, 0, 0, 0, s0]);
        }
        let end = -1;
        while (heap.size) {
            const [, t, w, a, b, u] = heap.pop();
            if (done[u] || a !== sa[u] || b !== sb[u] || t !== st[u] || w !== sw[u]) continue;
            done[u] = 1;
            const c = (u / 9) | 0, hd = u % 9;
            if (ends.has(c)) { end = u; break; }
            for (let d = 0; d < 8; d++) {
                const [ox, oy] = MOVES[d], n = step(c, ox, oy);
                if (n < 0) continue;
                const a1 = a + (ox && oy ? 0 : 1), b1 = b + (ox && oy ? 1 : 0);
                const t1 = t + (hd !== 8 && hd !== d ? 1 : 0), w1 = w + nearWall(n);
                const v = n * 9 + d;
                if (done[v] || !less(a1, b1, t1, w1, v)) continue;
                sa[v] = a1; sb[v] = b1; st[v] = t1; sw[v] = w1; prev[v] = u;
                heap.push([a1 + b1 * Math.SQRT2 + h(n), t1, w1, a1, b1, v]);
            }
        }
        if (end < 0) return [];
        const cells = [];
        for (let u = end; u >= 0; u = prev[u]) cells.unshift((u / 9) | 0);
        const pts = cells.map(c => ({ x: (c % W + FOOT / 2) * CELL, y: (((c / W) | 0) + FOOT / 2) * CELL }));
        return pts.filter((p, i) => {
            if (i === 0 || i === pts.length - 1) return true;
            const a = pts[i - 1], b = pts[i + 1];
            return (p.x - a.x) !== (b.x - p.x) || (p.y - a.y) !== (b.y - p.y);
        });
    }

    function exactCoord(fine, tile, offsets) {
        const base = tile * 8 + 4, off = offsets.find(v => (v >> 12) === fine - base);
        return off === undefined ? null : base * 0x1000 + off;
    }

    return { TILE, setFloor, setFloorTiles, gridFrom, gridPath, shortest, exactCoord, stairsShape };
}
