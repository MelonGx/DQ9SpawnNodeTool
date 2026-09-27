function createIdealWalk(px = 16, tkg) {
    const TILE = 8 * 0x1000;
    const PX = px;
    const SUB = px > 1 ? 2 : 1;
    const GRID = px * SUB;
    const CELL = TILE / GRID;
    const CORRIDOR = 6;
    const CHAR = CORRIDOR / 4, DOWN_HALF = CORRIDOR / 3 / 2, CHEST_HALF = CHAR / 2, UP_WIDTH = CHAR, UP_DEPTH = 2 * CHAR;
    const SIZES = { corridor: CORRIDOR, char: CHAR, down: 2 * DOWN_HALF, chest: 2 * CHEST_HALF, upWidth: UP_WIDTH, upDepth: UP_DEPTH, step: 1 / SUB };
    const toPx = v => v * PX / TILE, fromPx = v => v * TILE / PX;
    const FOOT = px > 1 ? CHAR * SUB : 1;
    const DIAG_EXTRA = Math.SQRT2 - 1;
    const FRONT = 1;
    const reach = (a, b) => (Math.max(a, b) + DIAG_EXTRA * Math.min(a, b)) / PX;
    const SLACK_UP_START = reach(UP_WIDTH / 2, FRONT / 2), SLACK_UP_GOAL = reach(CHAR / 2, CHAR / 2);
    const SLACK_DOWN = reach(DOWN_HALF + CHAR / 2, DOWN_HALF + CHAR / 2), SLACK_CHEST = Math.SQRT2 * (CHEST_HALF + CHAR + 1 / SUB) / PX;
    const lbSlack = (i, j) => (i === 0 ? SLACK_UP_START : i === 1 ? SLACK_DOWN : SLACK_CHEST) + (j === 0 ? SLACK_UP_GOAL : j === 1 ? SLACK_DOWN : SLACK_CHEST);

    let free = null;
    let freeW = 0, freeH = 0;

    function isFree(cx, cy) {
        return cx >= 0 && cy >= 0 && cx < freeW && cy < freeH && free[cy * freeW + cx] === 1;
    }

    const isOpenTile = (grid, tx, ty) => { const t = grid[ty] && grid[ty][tx]; return t !== undefined && t !== tkg.TILE_WALL && t !== tkg.TILE_DIVIDER; };

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
    function makeKeyHeap() {
        let key = new Float64Array(1024), val = new Int32Array(1024), n = 0;
        return {
            get size() { return n; },
            push(k, v) {
                if (n === key.length) {
                    const k2 = new Float64Array(2 * n), v2 = new Int32Array(2 * n);
                    k2.set(key); v2.set(val); key = k2; val = v2;
                }
                let i = n++;
                while (i > 0) {
                    const p = (i - 1) >> 1;
                    if (key[p] <= k) break;
                    key[i] = key[p]; val[i] = val[p]; i = p;
                }
                key[i] = k; val[i] = v;
            },
            pop() {
                const top = val[0], k = key[--n], v = val[n];
                let i = 0;
                for (;;) {
                    let c = 2 * i + 1;
                    if (c >= n) break;
                    if (c + 1 < n && key[c + 1] < key[c]) c++;
                    if (key[c] >= k) break;
                    key[i] = key[c]; val[i] = val[c]; i = c;
                }
                key[i] = k; val[i] = v;
                return top;
            },
            drain() { const out = val.slice(0, n); n = 0; return out; },
            clear() { n = 0; },
        };
    }
    const keyHeap = makeKeyHeap();

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

    const MARGIN = (PX - CORRIDOR) / 2;
    const SIDES = [[0x40, 0, -1], [0x04, 0, 1], [0x01, -1, 0], [0x10, 1, 0]];
    const CORNERS = [[0x80, -1, -1], [0x20, 1, -1], [0x08, 1, 1], [0x02, -1, 1]];

    function setFloor(map) {
        const { grid, width: mapWidth, height: mapHeight, bitfield: bitfieldGrid } = map;
        const W = mapWidth * PX, H = mapHeight * PX;
        const floor = new Uint8Array(W * H);
        const band = d => d < 0 ? [0, MARGIN] : d > 0 ? [PX - MARGIN, PX] : [MARGIN, PX - MARGIN];
        const fill = (tx, ty, dx, dy) => {
            const [x0, x1] = band(dx), [y0, y1] = band(dy);
            for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) floor[(ty * PX + y) * W + tx * PX + x] = 1;
        };
        for (let ty = 0; ty < mapHeight; ty++) {
            for (let tx = 0; tx < mapWidth; tx++) {
                if (!isOpenTile(grid, tx, ty)) continue;
                const mask = bitfieldGrid[ty][tx];
                fill(tx, ty, 0, 0);
                for (const [bit, dx, dy] of SIDES.concat(CORNERS)) if (!(mask & bit)) fill(tx, ty, dx, dy);
            }
        }
        const GW = mapWidth * GRID, GH = mapHeight * GRID;
        const span = Math.floor((FOOT - 1) / SUB) + 1, lo = new Int32Array(Math.max(GW, GH));
        for (let g = 0; g < lo.length; g++) lo[g] = Math.floor(g / SUB);
        const block = new Uint8Array(W * H);
        for (let y = 0; y + span <= H; y++) {
            for (let x = 0; x + span <= W; x++) {
                let f = 1;
                for (let j = y * W + x, dy = 0; dy < span; dy++, j += W) for (let dx = 0; dx < span; dx++) f &= floor[j + dx];
                block[y * W + x] = f;
            }
        }
        free = new Uint8Array(GW * GH);
        for (let gy = 0; gy + FOOT <= GH; gy++) {
            const by = lo[gy] * W;
            for (let gx = 0; gx + FOOT <= GW; gx++) free[gy * GW + gx] = block[by + lo[gx]];
        }
        freeW = GW; freeH = GH;
        corners = null;
    }

    function setFloorTiles(map) {
        const { grid, width, height } = map;
        free = new Uint8Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) free[y * width + x] = isOpenTile(grid, x, y) ? 1 : 0;
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
        const heap = keyHeap;
        heap.clear();
        g[src] = 0;
        heap.push(h(src), src);
        while (heap.size && left.size) {
            const u = heap.pop();
            if (closed[u]) continue;
            closed[u] = 1;
            if (left.delete(u)) {
                for (const v of heap.drain()) if (!closed[v]) heap.push(g[v] + h(v), v);
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
                heap.push(gv + h(v), v);
            }
        }
        return g;
    }

    function stairsShape(fine, tile, grid) {
        const solid = (x, y) => !isOpenTile(grid, x, y);
        const [dx, dy] = !solid(tile.x, tile.y + 1) ? [0, 1] : !solid(tile.x + 1, tile.y) ? [1, 0]
            : !solid(tile.x - 1, tile.y) ? [-1, 0] : !solid(tile.x, tile.y - 1) ? [0, -1] : [0, 1];
        const d = dx || dy, ux = toPx(fine.x * 0x1000), uz = toPx(fine.z * 0x1000);
        const box = (a0, a1) => {
            const [lo, hi] = a0 < a1 ? [a0, a1] : [a1, a0];
            return dx ? { x0: ux + lo, x1: ux + hi, y0: uz - UP_WIDTH / 2, y1: uz + UP_WIDTH / 2 }
                      : { x0: ux - UP_WIDTH / 2, x1: ux + UP_WIDTH / 2, y0: uz + lo, y1: uz + hi };
        };
        return { front: box(0, FRONT * d), body: box(0, -UP_DEPTH * d) };
    }

    const posIndex = (x, y) => (x >= 0 && y >= 0 && x < freeW && y < freeH) ? y * freeW + x : -1;
    const span = (g, a, b) => Math.max(0, Math.min(g + FOOT, b * SUB) - Math.max(g, a * SUB));
    const overlap = (i, b) => span(i % freeW, b.x0, b.x1) * span((i / freeW) | 0, b.y0, b.y1);
    function positionsOver(b) {
        const out = [];
        for (let y = Math.floor(b.y0 * SUB - FOOT) + 1; y < b.y1 * SUB; y++) {
            for (let x = Math.floor(b.x0 * SUB - FOOT) + 1; x < b.x1 * SUB; x++) {
                const i = posIndex(x, y);
                if (i >= 0 && overlap(i, b) > 0) out.push(i);
            }
        }
        return out;
    }
    const centreIn = (i, b) => { const x = (i % freeW + FOOT / 2) / SUB, y = (((i / freeW) | 0) + FOOT / 2) / SUB; return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1; };
    const around = (p, h) => { const x = toPx(p.x), y = toPx(p.y); return { x0: x - h, x1: x + h, y0: y - h, y1: y + h }; };
    const isStairs = (stairs, j) => (stairs || []).some(s => s.k === j);

    function legSetup(points, stairs, src, dst) {
        const N = freeW * freeH, hard = new Uint8Array(N), chest = new Float64Array(N);
        points.forEach((p, j) => {
            if (!p || isStairs(stairs, j)) return;
            const b = around(p, CHEST_HALF);
            for (const i of positionsOver(b)) chest[i] += overlap(i, b);
        });
        let starts = null;
        for (const s of stairs || []) {
            if (s.k === dst || (s.k === src && !s.up)) continue;
            const body = s.up ? s.shape.body : around(points[s.k], DOWN_HALF);
            for (const i of positionsOver(body)) hard[i] = 1;
            if (s.k === src) starts = positionsOver(s.shape.front).filter(i => free[i] === 1 && !overlap(i, body) && centreIn(i, s.shape.front));
        }
        const pass = (u, v) => free[v] === 1 && !hard[v] && (!chest[v] || chest[v] < chest[u]);
        const step = (u, ox, oy) => {
            const cx = u % freeW + ox, cy = ((u / freeW) | 0) + oy;
            if (cx < 0 || cy < 0 || cx >= freeW || cy >= freeH) return -1;
            const v = u + oy * freeW + ox;
            if (!pass(u, v)) return -1;
            if (!ox || !oy) return v;
            const a = u + ox, b = u + oy * freeW;
            return pass(u, a) && pass(u, b) ? v : -1;
        };
        const standing = i => i >= 0 && free[i] === 1 && !hard[i] && !chest[i];
        const goals = j => {
            const p = points[j];
            if (stairs.some(s => s.k === j && !s.up)) return positionsOver(around(p, DOWN_HALF)).filter(standing);
            if (isStairs(stairs, j)) {
                const x = p.x / CELL, y = p.y / CELL, out = [];
                for (let gy = Math.floor(y - FOOT) + 1; gy <= Math.floor(y); gy++) for (let gx = Math.floor(x - FOOT) + 1; gx <= Math.floor(x); gx++) out.push(posIndex(gx, gy));
                return out.filter(standing);
            }
            const b = around(p, CHEST_HALF), out = [];
            const x0 = b.x0 * SUB, x1 = b.x1 * SUB, y0 = b.y0 * SUB, y1 = b.y1 * SUB;
            for (let k = Math.floor(y0 - FOOT) + 1; k < y1; k++) out.push(posIndex(Math.floor(x0 - FOOT), k), posIndex(Math.ceil(x1), k));
            for (let k = Math.floor(x0 - FOOT) + 1; k < x1; k++) out.push(posIndex(k, Math.floor(y0 - FOOT)), posIndex(k, Math.ceil(y1)));
            return [...new Set(out)].filter(standing);
        };
        if (!starts) starts = goals(src);
        return { step, starts, goals };
    }

    const MOVES = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

    function gridShortest(targets, step, starts, goals) {
        const W = freeW, H = freeH;
        const g = new Float64Array(W * H).fill(Infinity), closed = new Uint8Array(W * H);
        const res = targets.map(() => Infinity), goalOf = new Map(), boxes = [];
        targets.forEach((t, k) => {
            const b = { k, x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
            for (const c of goals(t)) {
                if (!goalOf.has(c)) goalOf.set(c, []);
                goalOf.get(c).push(k);
                const x = c % W, y = (c / W) | 0;
                b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
            }
            if (b.x0 <= b.x1) boxes.push(b);
        });
        const left = new Set(goalOf.keys());
        let aim = boxes;
        const h = c => {
            let best = Infinity;
            const cx = c % W, cy = (c / W) | 0;
            for (const b of aim) best = Math.min(best, octileSteps(Math.max(0, b.x0 - cx, cx - b.x1), Math.max(0, b.y0 - cy, cy - b.y1)));
            return best === Infinity ? 0 : best;
        };
        const heap = keyHeap;
        heap.clear();
        for (const start of starts) { g[start] = 0; heap.push(h(start), start); }
        while (heap.size && left.size) {
            const u = heap.pop();
            if (closed[u]) continue;
            closed[u] = 1;
            if (left.has(u)) {
                for (const k of goalOf.get(u)) if (res[k] === Infinity) res[k] = g[u] / GRID;
                for (const [c, ks] of goalOf) if (left.has(c) && ks.every(k => res[k] < Infinity)) left.delete(c);
                aim = boxes.filter(b => res[b.k] === Infinity);
                for (const v of heap.drain()) if (!closed[v]) heap.push(g[v] + h(v), v);
                if (!left.size) break;
            }
            for (const [ox, oy] of MOVES) {
                const v = step(u, ox, oy);
                if (v < 0) continue;
                const gv = g[u] + (ox && oy ? Math.SQRT2 : 1);
                if (gv < g[v]) { g[v] = gv; heap.push(gv + h(v), v); }
            }
        }
        return res;
    }

    function gridFrom(points, src, stairs, want) {
        const dist = points.map(() => want === undefined ? Infinity : undefined);
        const groups = new Map();
        points.forEach((p, j) => {
            if (!p) return;
            const key = isStairs(stairs, j) ? j : -1;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(j);
        });
        for (const targets of groups.values()) {
            if (want !== undefined && !targets.includes(want)) continue;
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


    function floorModel(f) {
        const at = (c, tile) => c && tile ? { x: c.x * 0x1000, y: c.z * 0x1000 } : null;
        const points = [at(f.up, f.upTile), at(f.down, f.downTile)].concat(f.chests.map((c, i) => at(c, f.chestTiles[i])));
        const stairs = [];
        if (points[0]) stairs.push({ k: 0, up: true, shape: stairsShape(f.up, f.upTile, f.grid) });
        if (points[1]) stairs.push({ k: 1, up: false });
        const front = points[0] && stairs[0].shape.front;
        return {
            info: { grid: f.grid, width: f.width, height: f.height, bitfield: f.bitfield },
            points, stairs,
            tiles: [f.upTile, f.downTile].concat(f.chestTiles),
            upFront: front ? { x: fromPx((front.x0 + front.x1) / 2), y: fromPx((front.y0 + front.y1) / 2) } : null,
        };
    }

    return { TILE, GRID, SIZES, lbSlack, isOpenTile, setFloor, setFloorTiles, gridFrom, gridPath, shortest, floorModel };
}
