// DQ9AT's search part, from MelonGx/DQ9AT DQ9AT.html @ bd4675a (<script id="dq9-core">): the game's
// tables, ElistOfs, and the search conditions and checkers. The treasure map itself (TreasureMap: details
// from Seed and Rank, chest Ranks, chest contents) is this tool's own code on those tables.
// Everything TKG's generator already does is TKG's: the floors (layout, stairs, chests), the random
// number generator (LCG), the Type (getEnvironment) and the tile types.
// English text only; no Multibug, Anomaly, Base Quality count, AT / Free searches or result HTML.
// Wrapped in a function so its globals do not clash with TKG's, and so search.js can hand the same
// source to Web Workers.
// overrides: { tkg } TKG's generator (TKG_GEN in search.js); { floor(seed, index1) } a TKG floor
// ({ info: { grid, width, height }, context }); { calcPointWalkCost } the walking cost between two
// points; { onRoute } receives every chest route a checker evaluates ({ cost, legs } or null).
function DQ9AT_CORE(overrides) {
// TKG's generator (TKG_GEN in search.js): LCG, getEnvironment / envIndices
const tkg = overrides && overrides.tkg;
const STR_SOLO='Solo';
const STR_PARTY='Party';
const STR_BOTH='Solo+Party';
const EL_P='Partially No-enemy';
const EL_4='4-enemy';
const EL_3='3-enemy';
const EL_2='2-enemy';
const EL_0='No-enemy';
const EL_NP=" (No Pandora's Box)";
const EL_NM=" (No Mimic)";
const EL_NC=" (No Cannibox)";
const EL_ONLY=' only';

const b3fThreeItems=["Mini medal","Sage's elixir","Iron nails","Hephaestus' flame"];

// ===============================
// DATA TABLES - from TreasureMapDataTable.cs
// ===============================
const MAP_RANK=[0x02,0x38,0x3D,0x4C,0x51,0x65,0x79,0x8D,0xA1,0xB5,0xC9,0xDD];
const CHEST_RANK={10:'S',9:'A',8:'B',7:'C',6:'D',5:'E',4:'F',3:'G',2:'H',1:'I'};
const ENV_OPTS=[['Caves','洞窟'],['Ruins','遺跡'],['Ice','氷'],['Water','水'],['Fire','火山']];   // [en, jp]
const ENV_NAMES=Object.fromEntries(ENV_OPTS.map((o,i)=>[i+1,o]));
const BOSS_NAMES={
1:['Equinox','馬','黒竜丸'],2:['Nemean','爪','ハヌマーン'],3:['Shogum','髭','スライムジェネラル'],4:['Trauminator','機','Sキラーマシン'],
5:['Elusid','教','イデアラゴン'],6:['Sir Sanguinus','血','ブラッドナイト'],7:['Atlas','巨','アトラス'],8:['Hammibal','猪','怪力軍曹イボイノス'],
9:['Fowleye','鳥','邪眼皇帝アウルート'],10:['Excalipurr','猫','魔剣神レパルド'],11:['Tyrannosaurus Wrecks','滅','破壊神フォロボス'],12:['Greygnarl','竜','グレイナル']
};
const PREFIX_NAMES={
1:['Clay','はかなき'],2:['Rock','ちいさな'],3:['Granite','うす暗き'],4:['Basalt','ゆらめく'],
5:['Graphite','ざわめく'],6:['Iron','ねむれる'],7:['Copper','怒れる'],8:['Bronze','呪われし'],
9:['Steel','放たれし'],10:['Silver','けだかき'],11:['Gold','わななく'],12:['Platinum','残された'],
13:['Ruby','見えざる'],14:['Emerald','あらぶる'],15:['Sapphire','とどろく'],16:['Diamond','大いなる']
};
const SUFFIX_NAMES={
1:['Joy','花'],2:['Bliss','岩'],3:['Glee','風'],4:['Doubt','空'],
5:['Woe','獣'],6:['Dolour','夢'],7:['Regret','影'],8:['Bane','大地'],
9:['Fear','運命'],10:['Dread','魂'],11:['Hurt','闇'],12:['Gloom','光'],
13:['Doom','魔神'],14:['Evil','星々'],15:['Ruin','悪霊'],16:['Death','神々']
};
const LOCALE_NAMES={
1:['Cave','洞くつ'],2:['Tunnel','地下道'],3:['Mine','坑道'],4:['Crevasse','雪道'],
5:['Marsh','沼地'],6:['Lair','アジト'],7:['Icepit','氷穴'],8:['Lake','地底湖'],
9:['Crater','火口'],10:['Path','道'],11:['Snowhall','雪原'],12:['Moor','湿原'],
13:['Dungeon','牢ごく'],14:['Crypt','墓場'],15:['Nest','巣'],16:['Ruins','遺跡'],
17:['Tundra','凍土'],18:['Waterway','水脈'],19:['World','世界'],20:['Abyss','奈落'],
21:['Maze','迷宮'],22:['Glacier','氷河'],23:['Chasm','眠る地'],24:['Void','じごく']
};
const LOCALE_INDEX=new Uint8Array([1,2,1,1,1,3,3,4,5,3,6,6,7,8,9,10,10,11,12,13,14,14,14,14,14,15,16,17,18,15,19,19,19,19,19,20,21,22,23,24]);
const D_B=new Uint8Array([2,55,2,4,56,75,4,6,76,100,6,10,101,120,8,12,121,140,10,14,141,180,10,16,181,200,11,16,201,220,12,16,221,248,14,16]);
const D_C=new Uint8Array([2,55,1,3,56,75,2,4,76,100,3,5,101,140,4,6,141,180,5,7,181,200,6,9,201,220,8,9,221,248,9,9]);
const D_D=new Uint8Array([2,60,1,3,61,80,2,5,81,100,3,7,101,120,4,7,121,140,5,9,141,160,6,9,161,180,7,10,181,200,8,12,201,248,1,12]);
const D_E=new Uint8Array([1,100,2,100,3,75,4,75,5,50,6,50,7,30,8,20,9,20,10,20,11,10,12,10]);
const D_F=new Uint8Array([1,1,2,0,2,1,2,0,3,1,3,0,4,1,4,0,5,2,5,0,6,2,6,0,7,3,7,0,8,3,8,0,9,4,9,0,10,5,9,0,11,1,10,0,12,4,10,0]);
const D_G=new Uint8Array([2,3,1,2,4,5,1,3,6,7,1,4,8,9,2,5,10,11,2,6,12,13,3,7,14,15,4,8,16,16,6,8]);
const D_H=new Uint8Array([1,2,1,5,3,4,4,8,5,6,7,12,7,8,7,16,9,9,12,16]);
const D_I=new Uint8Array([1,3,1,6,4,6,4,9,7,9,7,12,10,12,10,16]);
const D_O=new Uint8Array([0,14,28,41,55,71,88,108,125,141,162]);
const D_P=new Uint8Array([10,10,5,10,10,8,5,8,10,10,2,8,2,2,8,8,10,2,10,10,10,10,8,8,10,2,2,2,10,10,10,10,10,10,10,1,10,10,5,2,2,5,15,15,12,10,15,12,2,5,5,1,1,1,1,5,15,10,15,1,1,1,1,1,1,10,10,1,12,1,15,10,15,15,15,10,6,1,1,10,1,10,1,1,1,1,1,1,10,10,10,10,10,15,6,2,2,15,1,1,1,1,1,1,1,1,1,1,5,13,13,10,15,15,15,5,1,1,1,1,1,1,1,1,1,10,10,10,10,10,15,10,10,8,1,1,1,1,1,1,1,15,10,10,10,15,10,8,5,5,1,1,1,1,1,1,1,1,1,1,1,1]);
const D_Q=new Uint8Array([12,14,16,15,7,18,28,23,27,0,29,13,30,31,32,33,34,35,36,22,19,1,7,46,37,38,39,40,140,41,11,42,7,2,43,44,45,49,8,50,51,139,52,53,11,8,16,3,54,47,48,76,55,56,57,139,24,58,16,59,60,61,62,63,64,65,66,67,11,68,20,139,21,69,8,70,71,72,73,74,75,11,77,78,79,80,81,82,139,83,84,85,17,4,25,86,87,11,88,89,90,91,92,93,94,95,96,97,98,99,100,17,5,11,9,10,101,102,103,104,105,106,107,108,109,110,111,112,6,17,11,9,113,114,115,116,117,118,119,120,121,122,123,9,124,17,125,26,10,126,127,128,129,130,131,132,133,134,135,136,137,138]);
const D_R=[
["125G","125G"], ["268G","268G"], ["450G","450G"], ["670G","670G"], ["880G","880G"], ["1500G","1500G"], ["3000G","3000G"],
["Gleeban groat","グビアナどうか"], ["Gleeban guinea","グビアナぎんか"], ["Gleeban gold piece","グビアナきんか"], ["Gold bar","きんかい"],
["Mini medal","ちいさなメダル"], ["Medicinal herb","やくそう"], ["Strong medicine","上やくそう"], ["Evac-u-bell","おもいでのすず"],
["Holy water","せいすい"], ["Magic water","まほうのせいすい"], ["Sage's elixir","けんじゃのせいすい"], ["Antidotal herb","どくけしそう"],
["Strong antidote","上どくけしそう"], ["Narspicious","あやかしそう"], ["Mystifying mixture","おかしなくすり"], ["Superior medicine","いやしそう"],
["Moonwort bulb","まんげつそう"], ["Panacea","ばんのうくすり"], ["Perfect panacea","超ばんのうくすり"], ["Yggdrasil leaf","せかいじゅのは"],
["Chimaera wing","キメラのつばさ"], ["Oaken club","こんぼう"], ["Pop socks","ニーソックス"], ["Silver bracelets","ぎんのリスト"],
["Bunny tail","うさぎのおまもり"], ["Royal soil","まりょくの土"], ["Lava lump","ようがんのカケラ"], ["Angel bell","天使のすず"],
["Silver platter","シルバートレイ"], ["Fisticup","げんこつダケ"], ["Iron nails","てつのクギ"], ["Gold ring","きんのゆびわ"],
["Gold bracer","きんのプレスレット"], ["Iron mask","てっかめん"], ["Toad oil","ガマのあぶら"], ["Fisticup","げんこつダケ"],
["Iron ore","てっこうせき"], ["Slime shield","スライムトレイ"], ["Corundum","ルビーのげんせき"], ["Rockbomb shard","ばくだん石"],
["Flintstone","つけもの石"], ["Mirrorstone","かがみ石"], ["Resurrock","命の石"], ["Strength ring","ちからのゆびわ"],
["Agility ring","はやてのリング"], ["Manky mud","どくどくヘドロ"], ["Nectar","花のみつ"], ["Sorcerer's stone","ひらめきのジュエル"],
["Glombolero","ふしぎなボレロ"], ["Saint's ashes","せいじゃのはい"], ["Malicite","うらみのほうじゅ"], ["Hephaestus' flame","ヘパイトスのひだね"],
["Muscle belt","あらくれベルト"], ["Maid outfit","メイド服"], ["Thug boots","あらくれブーツ"], ["Thug's mug","あらくれマスク"],
["Maid's mop","ヘッドドレス"], ["Toughie trousers","あらくれズボン"], ["Finessence","ぶどうエキス"], ["Aggressence","とうこんエキス"],
["Dangerous bustier","あぶないビスチェ"], ["Brouhaha boomstick","まてきの杖"], ["Hephaestus' flame","ヘパイトスのひだね"], ["Astral plume","天使のはね"],
["Densinium","ヘビーメタル"], ["Riotous wristbands","ぶしんのリスト"], ["Fingerless gloves","オープンフィンガー"], ["Mythril ore","ミスリルこうせき"],
["Veteran's gloves","古強者のグローブ"], ["Fuddle bow","ゆうわくの弓"], ["Oh-no bow","じごくの弓"], ["Blessed boots","しんかんのブーツ"],
["Skull ring","ドクロのゆびわ"], ["Hela's hammer","まじんのかなづち"], ["Hades' helm","サタンヘルム"], ["Demon whip","あくまのムチ"],
["Saint's ashes","せいじゃのはい"], ["Densinium","ヘビーメタル"], ["Lucida shard","ほしのカケラ"], ["Depressing shoes","しわよせのくつ"],
["Unhappy hat","しわよせのぼうし"], ["Veteran's armour","古強者のよろい"], ["Spellspadrilles","だいまどうシューズ"], ["Veteran's boots","古強者のブーツ"],
["Combat boots","ぶしんのブーツ"], ["She-mage shoes","まじょのブーツ"], ["Trinity tights","しんかんのタイツ"], ["Ruinous shield","はめつの盾"],
["Divine dress","さとりのワンピース"], ["Skull helm","ドクロのかぶと"], ["Matador's gloves","マタドールグラブ"], ["Pandora's box","パンドラボックス"],
["Enchanted stone","せいれいせき"], ["Mythril ore","ミスリルこうせき"], ["Hero spear","えいゆうのやり"], ["Pruning knife","こがらしのダガー"],
["Wyrmwand","ドラゴンの杖"], ["Wizardly whip","カルベロビュート"], ["Beast claws","まじゅうのツメ"], ["Attribeauty","風林火山"],
["Heavy hatchet","ふんさいのおおなた"], ["Megaton hammer","メガトンハンマー"], ["Pentarang","ペンタグラム"], ["Pandora's box","パンドラボックス"],
["Astral plume","天使のはね"], ["Ethereal stone","げんませき"], ["Reckless necklace","しにがみの首かざり"], ["Orichalcum","オリハルコン"],
["Metal slime sword","メタスラの剣"], ["Metal slime spear","メタスラのやり"], ["Metal slime shield","メタスラの盾"], ["Metal slime armour","メタスラよろい"],
["Metal slime helm","メタスラヘルム"], ["Metal slime gauntlets","メタスラのこて"], ["Metal slime sollerets","メタスラブーツ"], ["Pandora's box","パンドラボックス"],
["Reset stone","リサイクルストーン"], ["Evac-u-bell","おもいでのすず"], ["Sainted soma","天使のソーマ"], ["Orichalcum","オリハルコン"],
["Stardust sword","ほしくずのつるぎ"], ["Poker","きしんのまそう"], ["Deft dagger","サウザンドダガー"], ["Bright staff","ひかりの杖"],
["Gringham whip","グリンガムのムチ"], ["Knockout rod","しゅらのこん"], ["Dragonlord claws","竜王のツメ"], ["Critical fan","ひっさつのおうぎ"],
["Bad axe","グレートアックス"], ["Groundbreaker","大地くだき"], ["Meteorang","メテオエッジ"], ["Angel's bow","天使の弓"],
["Mimic","ミミック"], ["Cannibox","ひとくいばこ"]
];

// One step of TKG's LCG, as its full 32-bit state
function lcg(seed) {const r = new tkg.LCG(seed);r.next();return r.seed;}
function atFromRng(rng) {return (rng >>> 16) & 0x7FFF;}

// 四元組表 [inLo,inHi,outLo,outHi] 査列：找 v 落在哪一列，回傳該列的 [outLo,outHi]；無命中回傳 dft
// 共用者：TreasureMap (rollInRow / rollBoss)、getRankSMRInfo (D_C/D_B/D_D)、sharedRankFilter (D_H/D_I)、jfire
function row4(t,rows,v,dft) {
  for (let i=0;i<rows;i++) {const b=i*4;if (v>=t[b]&&v<=t[b+1]) return[t[b+2],t[b+3]];}
  return dft;
}
const NO_ROW=[1,0]; // row4 査無此列時的空範圍 (lo>hi，任何値都落不進去)

// Item in a chest of a Rank for a roll 0..99 (D_O / D_P / D_Q / D_R), [name, ...] or null
function selectChestItem(rank, roll) {
  const start = D_O[rank-1], end = D_O[rank];
  let weight = 0;
  for (let i = start; i < end; i++) {
    weight += D_P[i];
    if (roll < weight) return D_R[D_Q[i]];
  }
  return null;
}

// ---- A treasure map: Seed + Rank ----
// Floors (layout, stairs, chest spots) are TKG's (tkgFloor). What depends on the Rank is worked out here
// from the game's tables: the map's details, the Rank of each chest and what a chest holds when opened
// at a given second. Random numbers are TKG's LCG.

// TKG's floor index1 (1-based) of a map seed, shared by every Rank of the seed:
// { index, width, height, grid (TKG tile rows), up, down, spots: chest positions, cache }
function tkgFloor(seed, index1) {
  const fd = overrides.floor(seed, index1);
  if (!fd.layout) {
    const ctx = fd.context, {grid, width, height} = fd.info;
    const spots = (ctx.field_0._chestCoords || []).slice(0, ctx.field_0.chestCount).map(c => ({x: c.x, y: c.y}));
    // cache: values that depend on the layout alone (ElistOfs tile counts)
    fd.layout = {index: index1, width, height, grid, up: ctx.upStairs, down: ctx.downStairs, spots, cache: {}};
  }
  return fd.layout;
}

const randomFrom = seed => new tkg.LCG(seed >>> 0);
// A value in [lo, hi]
const rollBetween = (r, lo, hi) => lo + r.next() % (hi - lo + 1);
// A value in the range a table gives for key (0, drawing nothing, if the table has no row for it)
function rollInRow(r, table, rows, key) {
  const range = row4(table, rows, key, null);
  return range ? rollBetween(r, range[0], range[1]) : 0;
}
// 0..n-1 from a 15-bit draw, in the game's float arithmetic
const rollScaled = (r, n) => (Math.fround(r.next() - 1) * n / 32767) >>> 0;

// Boss of a Rank: the Rank's range of bosses, each weighted by D_E
function rollBoss(r, rank) {
  const range = row4(D_D, 9, rank, null);
  if (!range) return 0;
  const weight = boss => D_E[(boss - 1) * 2 + 1];
  let total = 0;
  for (let boss = range[0]; boss <= range[1]; boss++) total += weight(boss);
  let x = r.next() % total;
  for (let boss = range[0]; boss <= range[1]; boss++) {
    if (x < weight(boss)) return boss;
    x -= weight(boss);
  }
  return 0;
}

// Rank of one chest (1 = I .. 10 = S) for a floor monster rank: within D_F's range for it
function rollChestRank(r, floorMR) {
  const lo = D_F[(floorMR - 1) * 4 + 1], hi = D_F[(floorMR - 1) * 4 + 2];
  return lo + (Math.fround((hi - lo + 1) * Math.fround(r.next() - 1) / 32767) >>> 0);
}

class TreasureMap {
  // Details, in the order the game draws them from the seed
  constructor(seed, rank) {
    Object.assign(this, {seed, rank, env: 0, floorCount: 0, smr: 0, boss: 0, prefix: 0, suffix: 0, lv: 0, locale: 0});
    this.floors = null;
    if (rank < 2 || rank > 248) return;
    const r = randomFrom(seed);
    for (let i = 0; i < 13; i++) r.next();    // the 13th draw is the Type (TKG's getEnvironment)
    this.env = tkg.envIndices[tkg.getEnvironment(seed.toString(16))] + 1;
    this.floorCount = rollInRow(r, D_B, 9, rank);
    this.smr = rollInRow(r, D_C, 8, rank);
    this.boss = rollBoss(r, rank);
    for (let i = 0; i < 12; i++) r.next();    // drawn by the game here, not used
    this.prefix = rollInRow(r, D_H, 5, this.smr);
    this.suffix = rollInRow(r, D_I, 4, this.boss);
    const area = rollInRow(r, D_G, 8, this.floorCount);
    this.lv = Math.max(1, Math.min(99, (this.boss + this.floorCount + this.smr - 4) * 3 + (r.next() % 11 - 5)));
    this.locale = LOCALE_INDEX[(area - 1) * 5 + this.env - 1];
  }

  // Floors with their chests' Ranks; chestRankCounts[rank - 1]: chests of each Rank on the whole map
  loadFloors() {
    this.chestRankCounts = new Array(10).fill(0);
    this.floors = [];
    for (let f = 0; f < this.floorCount; f++) {
      const layout = tkgFloor(this.seed, f + 1);
      const floor = Object.assign({}, layout, {chests: layout.spots.map(s => ({x: s.x, y: s.y, rank: 0}))});
      if (f >= 2) {
        const r = randomFrom(this.seed + f + 1);
        for (let i = 0; i < floor.chests.length * 2; i++) r.next();
        for (const chest of floor.chests) {
          chest.rank = rollChestRank(r, this.smr + (f >> 2));
          this.chestRankCounts[chest.rank - 1]++;
        }
      }
      this.floors.push(floor);
    }
  }

  // What each chest of floor f holds when the floor is entered at second sec (item name or null)
  chestItems(f, sec) {
    const floor = this.floors[f], r = randomFrom(floor.index + this.seed + sec);
    return floor.chests.map(chest => {
      const item = selectChestItem(chest.rank, rollScaled(r, 100));
      return item === null ? null : item[0];
    });
  }
  chestItem(f, i, sec) {return this.chestItems(f, sec)[i];}

  get bossName() {return BOSS_NAMES[this.boss] ? BOSS_NAMES[this.boss][0] : "Unknown";}
  get mapName() {
    if (!this.floorCount) return "Unknown";
    return `${PREFIX_NAMES[this.prefix][0]} ${LOCALE_NAMES[this.locale][0]} of ${SUFFIX_NAMES[this.suffix][0]} Lv.${this.lv}`;
  }
}

// ========
// Monster DB
// ========
// t:(0=Slime,1=Dragon,2=Beast,3=Bird,4=Plant,5=Bug,6=Machine,7=Zombie,8=Demon,9=Elemental,10=Aquatic,11=Material,12=Humanoid)
// s:[HP,Atk,Def,Evade,Block,Fire,Ice,Wind,Lightning,Earth,Dark,Light,Death,Lv,Agi]
// d:[commonItem,commonRate,rareItem,rareRate]
// item: number=D_R index, string=name (not in D_R), 0=none
// rate: 1=Always, N=1/N, 0=none
// G 値實際由 G_VALUES 供値;g 刻意保留,供將來砍掉 G_VALUES 時以「Σ MONSTER_DB[hex].g over SPAWN_DB[env][mr] 全部條目(含寶箱怪)」等價替代

const MONSTER_DB = {
  "008":{t:9,en:"Lost Soul",jp:"さまようたましい",g:20,s:[62,32,32,0,0,100,100,100,100,100,100,200,50,12,70],d:[15,8,34,64]},
  "00B":{t:4,en:"Mushroom Mage",jp:"マージマタンゴ",g:16,s:[67,50,56,0,0,125,100,100,100,100,100,125,100,13,56],d:["Belle cap",8,36,8]},
  "00E":{t:2,en:"Purrestidigitator",jp:"ベンガルクーン",g:16,s:[96,84,110,0,0,100,125,100,100,125,100,100,50,23,102],d:["Kitty litter",8,"Stolos' staff",256]},
  "012":{t:0,en:"Sootheslime",jp:"ベホイムスライム",g:20,s:[138,113,125,2,0,100,100,100,100,100,200,75,100,30,105],d:[12,8,"Slimedrop",8]},
  "013":{t:0,en:"Cureslime",jp:"ベホマスライム",g:16,s:[165,158,172,0,0,100,100,100,100,100,150,75,50,38,143],d:["Slimedrop",16,24,64]},
  "015":{t:6,en:"Robo-robin",jp:"アイアンクック",g:16,s:[75,100,210,2,0,75,75,100,150,100,100,100,0,24,113],d:[43,16,"Handrills",128]},
  "01B":{t:0,en:"Liquid Metal Slime",jp:"はぐれメタル",g:16,s:[8,100,256,4,0,100,100,100,100,100,100,100,0,29,179],d:[51,32,86,128]},
  "022":{t:5,en:"Dread Admiral",jp:"しびれあげは",g:16,s:[76,75,76,2,0,100,100,75,100,100,200,100,100,15,80],d:["Butterfly wing",8,"Coagulant",64]},
  "026":{t:11,en:"Cannibox",jp:"ひとくいばこ",g:16,s:[187,140,108,0,0,125,100,125,100,100,100,125,0,15,140],d:[11,16,39,128]},
  "027":{t:11,en:"Mimic",jp:"ミミック",g:12,s:[627,256,218,0,0,100,100,125,100,100,100,100,0,27,173],d:[11,16,"Gold rosary",64]},
  "028":{t:11,en:"Pandora's Box",jp:"パンドラボックス",g:20,s:[868,623,623,2,0,100,50,150,100,100,50,150,0,80,407],d:[11,8,10,128]},
  "02A":{t:5,en:"Raving Lunatick",jp:"メーダロード",g:16,s:[85,86,100,2,0,100,100,100,75,100,75,150,100,19,90],d:["Thorn whip",32,19,64]},
  "02C":{t:11,en:"Goodybag",jp:"おどるほうせき",g:16,s:[126,115,130,8,0,100,100,125,100,100,125,125,75,30,146],d:["Brighten rock",16,"Pink pearl",64]},
  "02E":{t:9,en:"Hell Niño",jp:"ヒートギズモ",g:16,s:[125,115,145,2,0,50,150,100,100,75,100,200,50,33,117],d:["Coagulant",32,"Flame shield",128]},
  "02F":{t:9,en:"Freezing Fog",jp:"フロストギズモ",g:16,s:[126,126,156,2,0,150,50,100,100,100,50,200,25,35,162],d:["Ice crystal",16,17,64]},
  "031":{t:12,en:"Grim Grinner",jp:"ダークホビット",g:16,s:[110,115,176,0,8,100,75,150,100,100,75,150,75,29,110],d:["Cautery sword",64,"Magic shield",64]},
  "034":{t:5,en:"Sluggernaut",jp:"スーパーテンツク",g:20,s:[118,96,123,2,0,75,125,75,100,100,150,100,75,29,124],d:["Cloak of evasion",32,"Starlet sandals",128]},
  "035":{t:5,en:"Sluggerslaught",jp:"ラストテンツク",g:16,s:[468,324,324,2,0,100,100,100,125,50,100,125,50,66,246],d:["Heavy handwear",64,"Bardic boots",128]},
  "036":{t:8,en:"Pink Sanguini",jp:"ピンクモーモン",g:16,s:[85,85,92,4,0,125,100,100,100,100,125,125,100,18,104],d:[23,16,53,32]},
  "037":{t:8,en:"Genie Sanguini",jp:"マポレーナ",g:12,s:[155,89,155,2,0,100,100,100,100,100,200,50,25,33,162],d:["Prayer ring",64,56,128]},
  "03B":{t:4,en:"Scourgette",jp:"ブラックベジター",g:20,s:[96,90,98,0,0,150,100,100,100,100,75,150,50,23,81],d:[46,32,"Long spear",128]},
  "03D":{t:10,en:"Salamarauder",jp:"かいぞくウーパー",g:20,s:[80,75,67,0,4,125,100,100,100,100,125,125,75,15,70],d:["Emerald moss",16,"Iron shield",64]},
  "03E":{t:10,en:"Axolhotl",jp:"ウパパロン",g:12,s:[92,90,100,0,8,75,125,100,100,100,125,125,75,21,83],d:["Iron helmet",32,"Cautery sword",64]},
  "040":{t:11,en:"Bagma",jp:"ようがんピロー",g:16,s:[120,120,120,0,0,50,200,100,100,100,100,150,50,32,120],d:[33,16,"Softwort",64]},
  "04C":{t:0,en:"Metal Medley",jp:"メタルブラザーズ",g:20,s:[6,70,256,4,0,100,100,100,100,100,100,100,0,29,135],d:["Slimedrop",8,74,128]},
  "04D":{t:0,en:"Gem Jamboree",jp:"ゴールデントーテム",g:20,s:[5,208,512,2,0,100,100,100,100,100,100,100,0,55,296],d:[9,16,10,256]},
  "051":{t:5,en:"Giddy Gastropog",jp:"メダパニつむり",g:16,s:[90,104,140,0,0,100,125,100,100,100,100,100,100,24,50],d:[41,8,30,64]},
  "052":{t:5,en:"Gloomy Gastropog",jp:"ダークデンデン",g:16,s:[144,133,210,0,0,100,50,100,100,100,50,200,50,34,144],d:[41,8,"Spiked armour",256]},
  "053":{t:11,en:"Earthenwarrior",jp:"はにわナイト",g:16,s:[55,58,65,0,4,100,100,200,100,75,125,125,100,12,48],d:["Scale shield",32,"Soldier's sword",64]},
  "056":{t:7,en:"Skeleton Soldier",jp:"死霊の騎士",g:32,s:[146,136,160,0,0,125,75,100,100,125,100,150,50,30,126],d:["Chain mail",32,"Platinum sword",64]},
  "057":{t:7,en:"Dark Skeleton",jp:"影の騎士",g:24,s:[186,153,194,0,0,125,50,100,100,100,50,200,50,35,155],d:["Evencloth",32,"Smart suit",128]},
  "059":{t:1,en:"Diethon",jp:"ヘルバイパー",g:16,s:[109,104,108,0,0,100,125,100,100,125,100,100,75,23,102],d:["Snakeskin",8,"Wing of bat",16]},
  "05A":{t:1,en:"Sail Serpent",jp:"オーシャンナーガ",g:20,s:[148,144,143,0,0,100,150,100,100,100,125,100,100,32,125],d:["Snakeskin",8,"Snakeskin whip",128]},
  "05D":{t:3,en:"Belisha Beakon",jp:"アカイライ",g:12,s:[136,146,143,0,0,150,50,50,100,100,100,150,50,37,167],d:["Crimson coral",32,"Red tights",128]},
  "05E":{t:7,en:"Lesionnaire",jp:"がいこつ兵",g:20,s:[99,106,115,0,0,125,75,100,100,100,75,200,50,22,99],d:["Gold rosary",16,"Iron cuirass",64]},
  "05F":{t:7,en:"Deadcurion",jp:"しにがみ兵",g:20,s:[112,115,117,0,0,200,50,100,100,100,50,200,0,26,98],d:[40,64,"Battle fork",128]},
  "060":{t:7,en:"Stenchurion",jp:"ゾンビナイト",g:16,s:[160,148,175,0,0,150,50,100,100,100,50,200,0,34,136],d:[52,8,"Partisan",128]},
  "062":{t:11,en:"Teaky Mask",jp:"トーテムキラー",g:16,s:[98,111,131,0,0,150,75,150,100,75,100,100,50,28,114],d:["Hardwood headwear",16,"Ice shield",256]},
  "063":{t:2,en:"Bewarewolf",jp:"リカント",g:12,s:[87,83,89,0,0,100,100,100,125,100,100,100,75,16,77],d:["Magic beast hide",16,"Iron claws",64]},
  "065":{t:2,en:"Scarewolf",jp:"リカントマムル",g:16,s:[102,94,105,0,0,100,75,100,125,100,100,100,75,19,87],d:["Magic beast hide",8,"Sacred claws",64]},
  "067":{t:7,en:"Toxic Zombie",jp:"どくどくゾンビ",g:16,s:[150,82,35,0,0,150,50,100,100,100,100,200,50,17,32],d:[52,16,"Boomer briefs",64]},
  "068":{t:7,en:"Ghoul",jp:"グール",g:8,s:[162,112,65,0,0,150,50,125,100,100,75,200,75,26,90],d:[52,16,"Tough guy tattoo",64]},
  "06A":{t:10,en:"Spinchilla",jp:"うずしおキング",g:16,s:[126,88,78,8,0,125,75,100,100,100,125,125,50,17,96],d:["Seashell",16,"Crimson coral",32]},
  "06B":{t:9,en:"Whirly Girly",jp:"レッドサイクロン",g:20,s:[144,120,150,8,0,100,125,50,100,100,150,100,50,30,131],d:[51,32,"Pretty betsy",256]},
  "06D":{t:7,en:"Mummy",jp:"マミー",g:8,s:[138,112,80,0,0,125,75,100,100,100,75,200,50,23,66],d:["Grubby bandage",8,57,256]},
  "06E":{t:7,en:"Blood Mummy",jp:"ブラッドマミー",g:16,s:[166,138,135,0,0,150,75,75,100,100,75,150,50,31,67],d:["Grubby bandage",8,57,128]},
  "070":{t:1,en:"Wyrtoise",jp:"ガメゴンロード",g:16,s:[215,171,240,0,0,50,150,100,50,100,100,100,75,37,103],d:["Tortoiseshell",8,"Dragon scale",32]},
  "072":{t:2,en:"Rampage",jp:"ゴートドン",g:12,s:[100,80,80,0,0,125,75,100,100,125,100,100,75,16,60],d:["Lambswool",8,"Magic beast horn",64]},
  "074":{t:11,en:"Rockbomb",jp:"ばくだん岩",g:20,s:[100,100,156,0,0,100,100,125,100,75,100,125,50,25,76],d:[46,8,58,128]},
  "076":{t:11,en:"Bomboulder",jp:"メガザルロック",g:16,s:[146,78,180,0,0,75,100,150,100,75,100,150,50,32,100],d:[46,16,"Yggdrasil dew",128]},
  "077":{t:11,en:"Restless Armour",jp:"さまようよろい",g:16,s:[100,95,97,0,8,100,100,125,100,100,100,100,50,17,63],d:["Iron broadsword",64,"Iron armour",128]},
  "078":{t:11,en:"Infernal Armour",jp:"じごくのよろい",g:16,s:[125,135,130,0,8,75,125,100,100,100,75,125,50,27,102],d:["Cautery sword",64,"Silver mail",128]},
  "079":{t:11,en:"Lethal Armour",jp:"キラーアーマー",g:16,s:[194,158,210,0,8,75,75,150,100,100,75,150,50,35,117],d:["Magic armour",128,"Seed of defence",256]},
  "07B":{t:0,en:"Metal Slime Knight",jp:"メタルライダー",g:16,s:[46,82,140,0,4,50,50,50,50,100,200,100,50,18,80],d:["Light shield",64,"Iron helmet",128]},
  "07C":{t:2,en:"Swinoceros",jp:"突げきホーン",g:20,s:[120,105,121,0,0,100,75,100,75,100,200,100,75,24,91],d:["Magic beast horn",8,"Cowpat",32]},
  "07D":{t:2,en:"Splatterhorn",jp:"ライノキング",g:16,s:[134,120,164,0,0,50,125,100,75,100,150,100,50,29,118],d:["Magic beast horn",16,"Magic beast hide",32]},
  "07F":{t:9,en:"Admirer",jp:"ジェリーマン",g:16,s:[120,102,85,0,0,125,125,100,100,75,100,100,50,22,75],d:[33,32,45,64]},
  "080":{t:9,en:"Live Lava",jp:"マグマロン",g:12,s:[165,140,186,0,0,50,150,100,100,100,100,100,50,33,124],d:[33,16,"Magma staff",128]},
  "082":{t:2,en:"Big Badboon",jp:"バブーン",g:12,s:[147,106,74,0,0,100,125,100,100,100,100,100,75,19,62],d:["Magic beast hide",8,50,128]},
  "083":{t:2,en:"Brainy Badboon",jp:"ヒババンゴ",g:12,s:[150,120,99,0,0,75,125,100,100,100,200,100,50,26,95],d:["Magic beast hide",32,"Raging ruby",32]},
  "084":{t:12,en:"Magus",jp:"まじゅつし",g:12,s:[58,48,38,0,0,100,100,100,100,100,100,150,50,12,70],d:["Wizard's staff",64,16,128]},
  "086":{t:12,en:"Sorcerer",jp:"ようじゅつし",g:16,s:[99,94,114,0,0,100,75,125,100,125,100,150,50,26,114],d:["Magical robes",32,"Seed of magic",256]},
  "087":{t:1,en:"Mandrake Major",jp:"リザードマン",g:16,s:[107,98,107,0,4,100,125,100,100,100,100,100,100,23,87],d:["Dragon scale",16,"Heavy armour",128]},
  "088":{t:1,en:"Mandrake Marauder",jp:"りゅう兵士",g:20,s:[172,132,198,0,4,75,100,100,150,150,100,100,50,34,144],d:["Dragon scale",16,"Bandit blade",128]},
  "089":{t:1,en:"Mandrake Marshal",jp:"シュプリンガー",g:16,s:[222,163,212,2,4,100,50,100,50,150,150,100,100,36,152],d:["Dragon scale",64,"Dragonsbane",128]},
  "08B":{t:4,en:"Treevil",jp:"ウドラー",g:12,s:[111,101,101,2,0,150,100,75,100,75,100,100,50,24,99],d:[22,16,"Coagulant",64]},
  "08C":{t:3,en:"Chimaera",jp:"キメラ",g:8,s:[75,70,72,2,0,75,125,100,100,100,100,125,75,14,86],d:[27,8,"Flurry feather",32]},
  "08D":{t:3,en:"Hocus Chimaera",jp:"メイジキメラ",g:16,s:[80,80,80,2,0,75,125,100,100,100,100,100,75,18,86],d:[27,16,"Prayer ring",128]},
  "08F":{t:11,en:"Raving Reaper",jp:"アサシンドール",g:16,s:[134,135,134,0,0,125,100,100,100,50,50,150,0,28,119],d:["Thief's turban",64,"Assassin's dagger",128]},
  "092":{t:2,en:"Badja",jp:"ブラックタヌー",g:16,s:[105,98,101,2,4,100,100,100,100,150,100,150,100,23,104],d:["Magic beast hide",8,"Special medicine",64]},
  "094":{t:12,en:"Corrupt Carter",jp:"エビルチャリオット",g:20,s:[155,138,200,0,0,100,100,100,150,100,100,150,50,33,147],d:[43,32,"Handrills",64]},
  "095":{t:10,en:"Mortoad",jp:"ガマキャノン",g:16,s:[140,80,70,0,0,75,125,100,100,100,125,125,100,16,48],d:[41,8,52,32]},
  "096":{t:2,en:"Expload",jp:"デザートタンク",g:16,s:[142,102,116,0,0,75,100,100,150,100,100,100,75,22,64],d:[41,8,"Bow tie",64]},
  "097":{t:2,en:"Blastoad",jp:"キャノンキング",g:16,s:[356,163,160,0,0,50,100,100,150,100,100,100,50,35,101],d:[41,8,24,64]},
  "099":{t:3,en:"Peckerel",jp:"アサシンエミュー",g:20,s:[107,107,107,2,0,100,125,75,100,100,100,100,50,25,107],d:[19,16,"Poison needle",64]},
  "09D":{t:10,en:"Knocktopus",jp:"ニードルオクト",g:16,s:[75,68,60,0,0,125,75,100,100,100,125,125,100,14,51],d:["Magic beast horn",16,"Crimson coral",32]},
  "09E":{t:6,en:"Shocktopus",jp:"オクトスパイカー",g:20,s:[75,85,156,0,0,75,75,100,150,100,100,100,150,21,90],d:["Magic beast horn",16,37,32]},
  "09F":{t:8,en:"Manguini",jp:"アーゴンデビル",g:16,s:[108,112,114,4,0,100,100,100,125,100,75,150,50,23,117],d:["Wing of bat",8,"Terrible tattoo",32]},
  "0A0":{t:8,en:"Bloody Manguini",jp:"ブラッドアーゴン",g:20,s:[154,133,148,2,0,75,100,150,100,100,75,150,0,12,139],d:["Wing of bat",8,"Terrible tattoo",16]},
  "0A2":{t:8,en:"Great Gruffon",jp:"ビッグボック",g:16,s:[150,120,120,0,0,125,50,100,150,100,75,125,50,28,70],d:["Wing of bat",8,"Fur poncho",64]},
  "0A3":{t:8,en:"Gramarye Gruffon",jp:"アロダイタス",g:16,s:[215,150,125,0,0,100,100,100,150,100,50,100,50,30,76],d:["Wing of bat",16,"Safety shoes",64]},
  "0A4":{t:2,en:"Trigertaur",jp:"タイガーランス",g:16,s:[100,98,100,2,0,100,125,100,100,100,100,100,50,20,85],d:["Magic beast hide",8,"Holy lance",128]},
  "0A5":{t:2,en:"White Trigertaur",jp:"ホワイトランサー",g:20,s:[128,130,135,2,0,125,75,75,100,100,100,100,0,2,116],d:["Horse manure",16,"Seed of deftness",256]},
  "0A6":{t:2,en:"Sick Trigertaur",jp:"キマライガー",g:16,s:[480,208,222,2,0,100,50,150,50,100,50,150,0,40,156],d:["Horse manure",16,"Partisan",128]},
  "0A7":{t:8,en:"Moosifer",jp:"アンクルホーン",g:16,s:[156,140,155,0,0,50,100,150,100,100,50,150,50,31,133],d:["Magic beast hide",16,"Seed of life",256]},
  "0A8":{t:8,en:"Barbatos",jp:"ヘルバトラー",g:16,s:[355,199,255,0,0,50,150,100,100,100,100,100,50,40,178],d:["Terrible tattoo",16,"Raging bull helm",128]},
  "0A9":{t:1,en:"Green Dragon",jp:"グリーンドラゴン",g:20,s:[245,178,208,0,0,100,100,100,100,150,100,150,50,34,109],d:["Emerald moss",16,"Dragon scale",16]},
  "0AA":{t:1,en:"Red Dragon",jp:"レッドドラゴン",g:16,s:[325,198,230,0,0,50,50,100,100,100,100,200,0,38,121],d:["Dragon scale",16,"Dragon claws",128]},
  "0AB":{t:1,en:"Rashaverak",jp:"アンドレアル",g:16,s:[1124,707,604,0,0,50,100,150,100,100,100,100,0,98,98],d:["Dragon scale",8,"Brighten rock",64]},
  "0AC":{t:11,en:"Living Statue",jp:"うごくせきぞう",g:16,s:[236,155,200,0,0,100,100,125,100,75,100,100,50,31,99],d:[47,16,49,128]},
  "0AE":{t:1,en:"Drakularge",jp:"ギガントヒルズ",g:16,s:[286,160,175,0,0,100,100,100,150,100,100,100,50,32,106],d:["Dragon scale",16,10,256]},
  "0AF":{t:1,en:"Drakulard",jp:"ギガントドラゴン",g:20,s:[520,203,203,0,0,100,150,50,100,50,100,150,50,40,112],d:["Dragon scale",16,71,128]},
  "0B0":{t:1,en:"Drakulord",jp:"ドラゴン・ウー",g:16,s:[1414,725,404,0,0,50,150,100,100,50,100,150,0,40,286],d:["Dragon scale",8,"Dragon claws",64]},
  "0B1":{t:6,en:"Hunter Mech",jp:"メタルハンター",g:16,s:[95,95,110,2,0,75,75,100,200,100,100,100,0,20,100],d:[43,32,"Hunter's bow",64]},
  "0B2":{t:6,en:"Killing Machine",jp:"キラーマシン",g:16,s:[182,155,216,2,0,75,100,100,125,100,100,150,0,35,164],d:[37,16,"Seed of agility",256]},
  "0B3":{t:0,en:"King Slime",jp:"キングスライム",g:16,s:[245,136,95,0,0,100,100,100,100,100,200,50,50,22,75],d:["Slimedrop",8,"Slime crown",256]},
  "0B4":{t:0,en:"King Cureslime",jp:"スライムベホマズン",g:20,s:[256,216,235,0,0,100,100,100,100,100,150,50,0,56,101],d:["Slimedrop",64,"Slime crown",128]},
  "0B5":{t:0,en:"Metal King Slime",jp:"メタルキング",g:16,s:[16,318,512,4,0,100,100,100,100,100,100,100,0,29,349],d:["Slime crown",128,114,256]},
  "0B6":{t:9,en:"Cumulus Rex",jp:"くもの大王",g:28,s:[252,140,151,4,0,150,100,50,50,100,100,150,50,33,134],d:["Thunderball",16,"Lightning staff",128]},
  "0B7":{t:9,en:"Cumulus Vex",jp:"ヘルクラウダー",g:16,s:[268,169,246,4,0,100,100,50,50,50,100,200,0,37,161],d:["Thunderball",16,"Seed of sorcery",256]},
  "0B8":{t:0,en:"Darkonium Slime",jp:"スライムマデュラ",g:20,s:[420,400,500,2,0,0,0,0,0,0,0,0,0,22,403],d:["Slimedrop",32,"Thinking cap",128]},
  "0B9":{t:0,en:"Gem Slime",jp:"ゴールデンスライム",g:20,s:[20,455,512,4,0,100,100,100,100,100,100,100,0,40,456],d:[10,128,114,256]},
  "0BA":{t:11,en:"Stone Golem",jp:"ストーンマン",g:16,s:[156,104,130,0,0,100,100,200,100,75,100,100,50,19,55],d:[47,16,49,128]},
  "0BB":{t:11,en:"Gold Golem",jp:"ゴールドマン",g:16,s:[250,136,130,0,0,100,75,125,100,100,125,100,50,24,77],d:[38,32,9,256]},
  "0BC":{t:11,en:"Golem",jp:"ゴーレム",g:12,s:[300,175,210,0,0,75,50,150,100,100,100,150,0,33,99],d:[47,16,74,128]},
  "0BD":{t:2,en:"Drackal",jp:"ストロングアニマル",g:20,s:[230,148,123,0,0,100,125,100,100,100,150,100,50,27,87],d:["Lambswool",16,"Platinum ore",128]},
  "0BE":{t:2,en:"Drastic Drackal",jp:"ヘルジャッカル",g:16,s:[225,165,164,0,0,150,50,100,100,100,50,150,75,12,124],d:[32,16,"Raging ruby",64]},
  "0C0":{t:11,en:"Harmour",jp:"デビルアーマー",g:16,s:[145,135,180,0,4,100,100,100,50,150,100,150,50,31,108],d:["Silver mail",64,40,128]},
  "0C1":{t:11,en:"Bad Karmour",jp:"てっこうまじん",g:16,s:[188,161,262,0,4,50,100,50,50,150,100,150,50,37,98],d:[43,16,81,128]},
  "0C2":{t:11,en:"Alarmour",jp:"サタンメイル",g:16,s:[454,454,612,0,4,100,100,50,50,150,50,150,50,77,109],d:[40,64,94,256]},
  "0C3":{t:7,en:"Fright Knight",jp:"ナイトリッチ",g:16,s:[226,161,206,0,25,125,50,100,100,100,50,200,0,36,130],d:["Sword breaker",64,"Dark shield",256]},
  "0C4":{t:7,en:"Night Knight",jp:"ナイトキング",g:16,s:[256,186,225,0,25,150,50,100,100,100,50,200,0,39,169],d:["Dark shield",64,96,256]},
  "0C5":{t:3,en:"Terrorhawk",jp:"マッドファルコン",g:20,s:[146,128,160,2,0,100,150,100,100,100,150,100,50,32,140],d:[33,32,"Fowl fan",64]},
  "0C6":{t:3,en:"Prism Peacock",jp:"にじくじゃく",g:16,s:[246,171,234,2,0,50,125,100,100,100,150,50,0,39,177],d:["Lunaria",32,"Tint-tastic tutu",256]},
  "0C7":{t:3,en:"Bird of Terrordise",jp:"れんごくまちょう",g:20,s:[648,514,528,2,0,50,150,100,100,100,100,100,50,52,285],d:["Fowl fan",64,"Flame shield",128]},
  "0C8":{t:11,en:"Mad Moai",jp:"ビッグモアイ",g:16,s:[125,100,125,0,0,100,100,200,100,75,100,100,0,6,9],d:[32,16,47,128]},
  "0C9":{t:11,en:"Mega Moai",jp:"ゴードンヘッド",g:16,s:[180,162,235,0,0,75,100,150,100,100,100,150,0,10,88],d:[48,32,"Tough guy tattoo",128]},
  "0CA":{t:8,en:"Sculptrice",jp:"ヘルビースト",g:16,s:[145,145,144,0,0,100,100,125,100,75,100,200,50,29,89],d:["Galvanised geta",64,56,128]},
  "0CB":{t:11,en:"Sculpture Vulture",jp:"リビングスタチュー",g:20,s:[153,140,190,0,0,50,150,150,100,100,100,100,50,31,110],d:[20,32,49,128]},
  "0CC":{t:8,en:"Aggrosculpture",jp:"ウィングデビル",g:16,s:[220,150,220,2,0,100,100,100,100,100,100,100,50,37,153],d:[38,32,79,256]},
  "0CD":{t:7,en:"Wight Priest",jp:"デスプリースト",g:16,s:[126,108,136,0,0,150,50,100,100,150,100,200,0,28,125],d:["Gold rosary",32,"Ascetic robe",128]},
  "0CE":{t:7,en:"Wight King",jp:"ワイトキング",g:16,s:[186,143,196,0,0,150,50,100,100,100,50,200,0,36,149],d:["Priestess's pinafore",128,"Seed of therapeusis",256]},
  "0CF":{t:10,en:"Claw Hammer",jp:"ヘルマリーン",g:16,s:[98,108,90,0,0,125,50,100,200,100,100,100,75,20,90],d:["Magic beast horn",16,"Tough guy tattoo",128]},
  "0D0":{t:10,en:"Power Hammer",jp:"サンドシャーク",g:16,s:[110,85,105,0,0,100,125,100,100,100,100,100,75,22,100],d:["Glass frit",32,"Kitty litter",64]},
  "0D4":{t:8,en:"Python Priest",jp:"スネークロード",g:16,s:[136,120,160,0,0,100,100,100,150,100,50,150,50,32,130],d:["Watermaul wand",64,"Fizzle-retardant suit",128]},
  "0D5":{t:8,en:"Cobra Cardinal",jp:"じごくのメンドーサ",g:20,s:[236,163,198,0,0,100,100,100,150,50,50,200,0,39,160],d:["Fizzle-retardant blouse",128,"Elfin elixir",256]},
  "0D6":{t:2,en:"Tantamount",jp:"れんごく天馬",g:24,s:[1056,358,388,2,0,50,150,100,75,100,100,100,0,66,338],d:["Horse manure",16,"Friendly fan",256]},
  "0D7":{t:2,en:"Godsteed",jp:"レジェンドホース",g:20,s:[686,575,566,2,0,100,100,100,100,100,150,50,50,10,415],d:["Horse manure",8,"Friendly fan",256]},
  "0D9":{t:8,en:"Cyclops",jp:"サイクロプス",g:16,s:[355,170,150,0,0,100,50,100,150,100,100,150,50,32,75],d:[28,16,"Fur vest",128]},
  "0DA":{t:8,en:"Gigantes",jp:"ギガンテス",g:12,s:[640,212,190,0,0,100,50,100,150,100,100,100,1,30,115],d:[50,64,"Ace of clubs",128]},
  "0DC":{t:8,en:"Troll",jp:"トロル",g:8,s:[413,158,70,0,0,100,100,100,125,75,100,150,50,32,60],d:[28,8,"Seed of strength",256]},
  "0DD":{t:8,en:"Boss Troll",jp:"ボストロール",g:16,s:[496,186,86,0,0,100,100,100,100,100,50,150,50,36,95],d:[28,16,"Boomer briefs",64]},
  "0DE":{t:8,en:"Great Troll",jp:"トロルキング",g:16,s:[768,220,132,0,0,100,100,100,100,50,50,200,50,40,107],d:["Special medicine",32,"Marauder's maul",128]},
  "0DF":{t:9,en:"Magmalice",jp:"ようがんまじん",g:16,s:[200,158,225,0,0,50,150,100,100,75,100,150,0,34,105],d:[33,16,58,128]},
  "0E0":{t:9,en:"Firn Fiend",jp:"ひょうがまじん",g:16,s:[365,195,268,0,0,200,50,100,100,50,100,150,0,40,104],d:["Ice crystal",16,123,256]},
  "0E2":{t:0,en:"Slionheart",jp:"ゴッドライダー",g:16,s:[825,506,512,0,4,100,100,100,75,100,150,100,0,98,336],d:["Falcon blade",128,"Pallium Regale",256]},
  "0E4":{t:6,en:"AU-1000",jp:"ゴールドマジンガ",g:20,s:[996,567,798,4,0,100,100,100,100,100,200,75,0,99,124],d:[10,128,107,256]},
  "0E5":{t:6,en:"Void Droid",jp:"ファイナルウェポン",g:20,s:[1325,575,625,2,0,75,75,75,200,75,100,100,0,99,348],d:[74,32,"Brawling byrnie",128]},
  "0E6":{t:2,en:"Alphyn",jp:"キマイラロード",g:16,s:[1246,525,556,0,0,75,75,150,75,100,150,100,0,98,436],d:[48,32,82,64]},
  "0E7":{t:2,en:"Vermil Lion",jp:"じごくのヌエ",g:16,s:[1378,564,626,2,0,50,100,100,100,100,50,150,0,99,455],d:[105,128,95,128]},
  "0E8":{t:9,en:"Shivery Shrubbery",jp:"デビルスノー",g:16,s:[81,96,99,25,0,150,50,100,100,100,75,150,75,8,102],d:["Ice crystal",32,20,64]},
  "0E9":{t:3,en:"Apeckalypse",jp:"ランドンクイナ",g:16,s:[130,118,118,2,0,125,75,100,100,100,100,100,75,27,121],d:[52,32,"Assassin's dagger",128]},
  "0EB":{t:1,en:"Wonder Wyrtle",jp:"ガメゴンレジェンド",g:20,s:[1040,606,720,0,0,50,150,100,50,100,150,100,0,42,52],d:["Tortoiseshell",8,"Dragon shield",64]},
  "0EC":{t:9,en:"Geothaum",jp:"あんこくまじん",g:16,s:[708,708,668,0,0,100,100,100,100,50,50,200,0,98,72],d:[47,16,"Evencloth",32]},
  "0ED":{t:3,en:"Cosmic Chimaera",jp:"スターキメラ",g:16,s:[516,378,396,4,0,100,100,100,100,100,200,50,50,77,275],d:["Brighten rock",8,85,128]},
  "0EE":{t:8,en:"Master Moosifer",jp:"デスカイザー",g:16,s:[1056,684,648,0,0,50,125,100,100,100,75,150,0,99,308],d:["Magic beast hide",8,"Raging ruby",128]},
  "0EF":{t:11,en:"Freaky Tiki",jp:"まおうのかめん",g:16,s:[596,442,498,8,0,75,75,150,75,75,75,150,75,77,245],d:["Terrible tattoo",32,"Boss shield",128]},
  "0F0":{t:1,en:"Mandrake Monarch",jp:"まかいファイター",g:20,s:[735,486,496,0,4,75,75,150,100,100,75,125,50,77,250],d:["Dragon scale",16,"Veteran's helm",128]},
  "0F1":{t:9,en:"Cumulus Hex",jp:"ヘルミラージュ",g:16,s:[796,462,472,2,0,150,100,50,50,50,100,150,0,88,282],d:["Mistick",32,"Flowing dress",64]},
  "0F2":{t:0,en:"Platinum King Jewel",jp:"プラチナキング",g:16,s:[20,356,546,2,0,100,100,100,100,100,100,100,0,29,505],d:["Platinum ore",8,"Seed of skill",256]},
  "0F3":{t:11,en:"Charmour",jp:"マジックアーマー",g:20,s:[220,171,270,0,0,75,75,50,50,200,75,100,50,38,134],d:["Magic armour",32,"Halberd",128]},
  "0F4":{t:7,en:"Blight Knight",jp:"ヴァルハラー",g:16,s:[965,695,598,0,25,150,50,100,100,100,50,150,0,99,298],d:[96,64,"Veteran's helm",128]},
  "0F5":{t:11,en:"Moai Minstrel",jp:"クラウンヘッド",g:16,s:[518,368,567,0,0,100,100,125,100,75,100,100,0,66,206],d:[20,32,"Witch's hat",64]},
  "0F6":{t:2,en:"Grrrgoyle",jp:"ホラービースト",g:16,s:[636,538,598,0,0,100,100,150,100,50,100,100,50,88,255],d:[49,32,57,256]},
  "0F7":{t:7,en:"Wight Emperor",jp:"ロードコープス",g:16,s:[488,465,455,0,0,150,50,100,100,100,50,200,0,77,242],d:["Mitre",64,"Surplice",128]},
  "0F8":{t:8,en:"Boogie Manguini",jp:"イエローサタン",g:16,s:[488,402,478,4,0,100,100,100,75,125,75,125,50,77,393],d:["Wing of bat",8,"Lunaria",64]},
  "0F9":{t:11,en:"Barriearthenwarrior",jp:"ちていのばんにん",g:20,s:[512,432,596,0,4,100,100,150,100,50,100,100,0,77,239],d:[32,16,"Warrior's sword",128]},
  "0FA":{t:11,en:"Grim Reaper",jp:"メフィストフェレス",g:20,s:[596,476,448,2,0,100,50,100,100,100,50,200,0,77,383],d:["Minister's mittens",64,78,128]},
  "0FB":{t:2,en:"Bling Badger",jp:"ゴールドタヌ",g:16,s:[445,394,495,0,0,100,100,100,75,150,150,50,50,88,315],d:["Magic beast hide",8,26,128]},
  "0FC":{t:12,en:"Flamin' Drayman",jp:"じごくぐるま",g:16,s:[480,416,452,0,0,50,150,100,100,100,100,150,50,66,229],d:[46,32,58,64]},
  "0FD":{t:10,en:"Hammer Horror",jp:"ダークマリーン",g:16,s:[874,586,586,2,0,100,100,100,150,100,50,150,0,10,375],d:["Heavy handwear",32,"Cobra claws",128]},
  "0FE":{t:8,en:"Boa Bishop",jp:"ビュアール",g:12,s:[633,309,296,0,0,125,75,100,125,100,75,75,50,40,264],d:["Wizard's hat",64,"Wizard's robe",256]},
  "0FF":{t:10,en:"Handsome Crab",jp:"ガニラス",g:12,s:[121,68,195,0,0,150,50,100,100,100,100,100,100,33,56],d:[49,32,"Deadly nightblade",128]},
  "101":{t:10,en:"Crabber Dabber Doo",jp:"じごくのハサミ",g:16,s:[112,115,121,0,0,125,100,125,100,50,100,100,100,24,78],d:["Seashell",16,"Poison moth knife",64]},
  "102":{t:10,en:"King Crab",jp:"キラークラブ",g:16,s:[270,181,235,0,0,100,75,100,125,50,100,100,75,38,158],d:["Sleeping hibiscus",16,"Poison moth knife",128]},
  "103":{t:12,en:"Icikiller",jp:"アイスビックル",g:16,s:[140,140,144,4,0,150,50,100,100,100,100,100,50,32,136],d:["Scale armour",16,"Crow's claws",64]},
  "104":{t:10,en:"Riptide",jp:"オーシャンクロー",g:20,s:[102,102,105,2,0,100,100,100,100,125,100,125,0,5,105],d:["Dragon scale",32,"Razor claws",64]},
  "105":{t:12,en:"Claws",jp:"クローハンズ",g:16,s:[206,153,198,4,0,100,50,50,100,125,100,150,0,7,178],d:["Sacred claws",64,"Dragon mail",128]},
  "106":{t:10,en:"Seasaur",jp:"ギャオース",g:12,s:[304,180,192,0,0,50,50,100,125,100,100,150,50,34,101],d:["Dragon scale",16,"Magic beast horn",64]},
  "107":{t:10,en:"Abyss Diver",jp:"ヘルダイバー",g:16,s:[600,200,220,0,0,50,50,100,150,100,100,150,75,38,126],d:["Dragon scale",32,"Watermaul wand",128]},
  "108":{t:10,en:"Seavern",jp:"シーバーン",g:12,s:[1127,686,546,0,0,50,50,100,150,100,100,150,50,60,126],d:[56,32,"Cobra fan",64]},
  "109":{t:8,en:"Terror Troll",jp:"ダークトロル",g:16,s:[1176,454,263,0,0,100,100,100,100,50,50,200,50,66,84],d:[32,16,"Roguess's robes",128]},
  "10C":{t:0,en:"Prime Slime",jp:"デンガー",g:12,s:[914,445,375,0,4,100,100,100,50,100,150,100,50,88,432],d:["Valkyrie sword",64,"Falcon blade",128]},
  "141":{t:2,en:"Octagoon",jp:"アイアンブルドー",g:20,s:[522,420,516,0,0,75,75,75,75,75,200,100,0,66,129],d:["Magic beast hide",8,"Platinum ore",32]},
  "143":{t:8,en:"Cannibelle",jp:"ヘルヴィーナス",g:16,s:[468,396,396,0,0,100,50,100,150,100,50,150,0,66,228],d:["Spangled dress",32,"Fencing frock",128]},
  "144":{t:9,en:"Scarlet Fever",jp:"エビルフレイム",g:16,s:[743,429,478,4,0,50,150,100,100,100,100,150,0,88,319],d:[33,16,"Fire blade",128]},
  "145":{t:9,en:"Uncommon Cold",jp:"マッドブリザード",g:20,s:[907,528,487,4,0,150,50,100,100,100,100,150,0,42,356],d:["Ice crystal",32,"Icicle dirk",128]},
  "147":{t:10,en:"Stale Whale",jp:"だいおうクジラ",g:16,s:[1244,584,496,0,0,100,100,100,150,100,100,100,50,88,106],d:["Glass frit",16,"Trident",64]},
  "148":{t:10,en:"Pale Whale",jp:"オーシャンボーン",g:20,s:[1456,748,586,2,0,100,100,100,100,100,150,50,0,20,79],d:[22,16,"Wizard's hat",128]},
  "149":{t:5,en:"Widow's Pique",jp:"デスタランチュラ",g:20,s:[955,595,625,0,0,50,100,150,100,100,100,150,50,99,302],d:["Tangleweb",8,"Rogue's robes",128]},
  "14A":{t:5,en:"Cyber Spider",jp:"ボーンスパイダ",g:16,s:[596,478,488,0,0,125,125,125,125,75,125,125,50,88,255],d:["Tangleweb",8,"Handrills",128]},
  "14B":{t:8,en:"Slugly Betsy",jp:"うみうしひめ",g:16,s:[1477,404,236,0,0,150,50,100,100,50,150,100,0,60,170],d:["Watermaul wand",64,"Nomadic deel",128]},
  "14D":{t:2,en:"Hell's Gatekeeper",jp:"ヘルガーディアン",g:20,s:[996,535,645,0,4,100,100,100,150,100,75,150,50,98,115],d:[81,64,80,128]},
  "14E":{t:2,en:"Wishmaster",jp:"ギリメカラ",g:12,s:[663,513,563,0,0,100,150,100,100,50,50,150,50,77,96],d:[71,32,"Holy femail",128]},
  // Support monsters - no G value
  "025":{t:8,en:"Jinkster",jp:"ひとつめピエロ",s:[60,50,60,2,0,100,100,100,100,100,100,125,100,14,78],d:[17,32,"Pointy hat",64]},
  "032":{t:12,en:"Gum Shield",jp:"ビッグフェイス",s:[80,80,101,0,4,100,100,100,100,100,100,125,75,18,81],d:["Light shield",64,"Iron broadsword",128]},
  "04B":{t:0,en:"Slime Stack",jp:"スライムタワー",s:[177,93,68,0,0,100,100,100,125,100,200,100,50,14,102],d:["Slimedrop",8,"Slime earrings",32]},
  "054":{t:11,en:"Brrearthenwarrior",jp:"ふゆしょうぐん",s:[125,125,135,0,4,150,50,100,100,75,100,100,50,27,105],d:["Ice crystal",32,"Ice shield",256]},
  "05C":{t:3,en:"Weaken Beakon",jp:"デッドペッカー",s:[78,72,90,0,0,100,150,75,100,125,100,100,75,19,88],d:["Flurry feather",16,"Crow's claws",128]},
  "064":{t:2,en:"Tearwolf",jp:"キラーリカント",s:[136,121,125,0,0,100,75,100,125,100,100,100,50,27,112],d:["Magic beast hide",8,"Cloak of evasion",64]},
  "08A":{t:4,en:"Treeface",jp:"じんめんじゅ",s:[95,83,78,2,0,125,100,100,100,100,100,100,100,18,63],d:[14,32,20,64]},
  "0AD":{t:11,en:"Stone Guardian",jp:"だいまじん",s:[255,160,255,0,0,75,75,150,100,100,75,100,0,11,102],d:[49,64,123,256]},
  "100":{t:5,en:"Crabid",jp:"ぐんたいガニ",s:[72,72,83,0,0,100,100,100,100,100,150,150,100,16,15],d:["Tortoiseshell",16,"Crimson coral",64]},
};

// envType: 1=Caves, 2=Ruins, 3=Ice, 4=Water, 5=Fire
const G_VALUES = {
  1: [0,116,132,128,128,144,132,140,124,128,124,132,140],
  2: [0,124,120,116,132,136,128,136,140,136,128,128,136],
  3: [0,108,132,116,148,128,128,128,128,136,120,120,116],
  4: [0,140,132,132,128,140,144,124,128,136,128,124,124],
  5: [0,128,128,112,128,128,132,128,136,140,136,140,136]
};
const ONLY_MONSTERS = {
  1: ["","00B","036","034","076","052","02F","04D","037","035","0B5","035","0D7"],
  2: ["","053","02A","040","034","062","097","01B","035","035","04D","0B9","0E4"],
  3: ["","008","012","068","056","031","0B2","02F","05D","0B8","0B9","0EC","0EC"],
  4: ["","03D","051","059","013","057","057","037","0B5","0F0","0F0","0B0","0B0"],
  5: ["","03E","086","015","01B","080","02E","0AA","0C3","0B5","0C7","0AB","0AB"]
};

function matchesOnlyMonFloor(env,floorMR,name){return MONSTER_DB[ONLY_MONSTERS[env][floorMR]].en===name;}

// Spawn DB: [id, atmin, atmax] for normal monsters, [id] for chest monsters (no AT range)
// atmax = next larger atmin - 1, or 32767 if largest
const SPAWN_DB = {
  1:{
    1: [["00B",6555,13107],["00E",13108,19661],["022",0,6554],["026"],["027"],["028"],["082",26215,32767],["08C",19662,26214]],
    2: [["026"],["027"],["028"],["036",6555,13107],["03B",19662,26214],["063",0,6554],["087",26215,32767],["0BD",13108,19661]],
    3: [["026"],["027"],["028"],["034",13108,19661],["083",6555,13107],["08B",26215,32767],["099",0,6554],["101",19662,26214]],
    4: [["026"],["027"],["028"],["076",0,6554],["07C",13108,19661],["080",19662,26214],["0AE",26215,32767],["0D9",6555,13107]],
    5: [["026"],["027"],["028"],["052",13108,19661],["07D",6555,13107],["0B6",19662,26214],["0C5",0,6554],["0DD",26215,32767]],
    6: [["026"],["027"],["028"],["02F",26215,32767],["089",0,6554],["097",6555,13107],["0A9",19662,26214],["105",13108,19661]],
    7: [["026"],["027"],["028"],["04D",16385,18724],["089",25747,32767],["0B4",0,8192],["0B7",18725,25746],["0D5",8193,16384]],
    8: [["026"],["027"],["028"],["037",0,5958],["0C6",25818,32767],["0F5",5959,11916],["102",18867,25817],["109",11917,18866]],
    9: [["026"],["027"],["028"],["035",13903,20852],["0AF",26811,32767],["0ED",0,6951],["109",20853,26810],["14E",6952,13902]],
    10: [["026"],["027"],["028"],["0B5",31555,32767],["0ED",16992,24272],["0F1",0,8496],["147",8497,16991],["14E",24273,31554]],
    11: [["026"],["027"],["028"],["035",21846,26214],["0D7",7647,15292],["0E2",0,7646],["0ED",26215,32767],["147",15293,21845]],
    12: [["026"],["027"],["028"],["0D7",20481,26624],["0E2",14337,20480],["0EB",0,7168],["0F1",26625,32767],["149",7169,14336]],
  },
  2:{
    1: [["026"],["027"],["028"],["053",19662,26214],["077",0,6554],["084",13108,19661],["096",26215,32767],["0BA",6555,13107]],
    2: [["026"],["027"],["028"],["02A",6555,13107],["09F",26215,32767],["0A4",19662,26214],["0C8",13108,19661],["0DC",0,6554]],
    3: [["026"],["027"],["028"],["040",11917,22342],["04C",10427,11916],["0A3",22343,32767],["0B1",0,10426]],
    4: [["026"],["027"],["028"],["034",13108,19661],["062",6555,13107],["086",26215,32767],["08F",19662,26214],["0AC",0,6554]],
    5: [["026"],["027"],["028"],["062",13108,19661],["094",19662,26214],["0B2",6555,13107],["0CB",0,6554],["0DD",26215,32767]],
    6: [["026"],["027"],["028"],["097",13108,19661],["0A6",26215,32767],["0BC",0,6554],["0D5",19662,26214],["105",6555,13107]],
    7: [["01B",0,1425],["026"],["027"],["028"],["0B8",5700,12822],["0DE",12823,22795],["105",22796,32767],["141",1426,5699]],
    8: [["026"],["027"],["028"],["035",18725,23405],["04D",29648,32767],["0A8",23406,29647],["0B8",0,10923],["141",10924,18724]],
    9: [["026"],["027"],["028"],["035",28836,32767],["0B8",15730,19661],["0C2",6555,15729],["0EF",0,6554],["141",19662,28835]],
    10: [["026"],["027"],["028"],["04D",31555,32767],["0C2",24273,31554],["0EF",16992,24272],["0FE",0,8496],["14A",8497,16991]],
    11: [["026"],["027"],["028"],["0B9",4856,7282],["0E6",0,4855],["0EF",24273,32767],["0FE",7283,15777],["14A",15778,24272]],
    12: [["026"],["027"],["028"],["0E4",0,7282],["0E5",7283,14564],["0E6",14565,20025],["0F2",20026,21845],["14A",21846,32767]],
  },
  3:{
    1: [["008",0,8192],["026"],["027"],["028"],["067",16385,24576],["06A",24577,32767],["06D",8193,16384]],
    2: [["012",26215,32767],["026"],["027"],["028"],["05F",0,6554],["065",6555,13107],["072",13108,19661],["0CA",19662,26214]],
    3: [["026"],["027"],["028"],["068",13108,19661],["06D",6555,13107],["0A5",0,6554],["0E8",26215,32767],["0E9",19662,26214]],
    4: [["026"],["027"],["028"],["056",19662,26214],["079",13108,19661],["0A2",6555,13107],["0A5",0,6554],["0D9",26215,32767]],
    5: [["026"],["027"],["028"],["031",13108,19661],["0BE",0,6554],["0CC",26215,32767],["0D9",19662,26214],["103",6555,13107]],
    6: [["026"],["027"],["028"],["0B2",19662,26214],["0B7",26215,32767],["0C1",6555,13107],["0CC",13108,19661],["103",0,6554]],
    7: [["026"],["027"],["028"],["02F",26215,32767],["0B7",19662,26214],["0C1",6555,13107],["0CE",0,6554],["0DE",13108,19661]],
    8: [["026"],["027"],["028"],["05D",26811,32767],["0C4",13903,20852],["0E0",20853,26810],["0F3",0,6951],["143",6952,13902]],
    9: [["026"],["027"],["028"],["0B8",13903,20852],["0E0",26811,32767],["0F7",6952,13902],["0FA",0,6951],["143",20853,26810]],
    10: [["026"],["027"],["028"],["0B9",31130,32767],["0F6",0,11469],["0F7",21300,31129],["0FA",11470,21299]],
    11: [["026"],["027"],["028"],["0EC",8823,17644],["0F6",17645,25206],["0FA",25207,32767],["145",0,8822]],
    12: [["026"],["027"],["028"],["0EC",17040,24903],["0F4",0,9175],["0F8",24904,32767],["145",9176,17039]],
  },
  4:{
    1: [["026"],["027"],["028"],["03D",19662,26214],["05E",0,6554],["09D",6555,13107],["0CF",26215,32767],["104",13108,19661]],
    2: [["026"],["027"],["028"],["051",26215,32767],["095",19662,26214],["09E",13108,19661],["0B3",6555,13107],["0D4",0,6554]],
    3: [["026"],["027"],["028"],["059",19662,26214],["06E",6555,13107],["0A2",13108,19661],["0CD",0,6554],["104",26215,32767]],
    4: [["013",6555,13107],["026"],["027"],["028"],["05A",0,6554],["0A0",13108,19661],["0FF",26215,32767],["106",19662,26214]],
    5: [["026"],["027"],["028"],["057",26215,32767],["060",6555,13107],["070",19662,26214],["0B4",13108,19661],["107",0,6554]],
    6: [["026"],["027"],["028"],["057",6555,13107],["0A8",26215,32767],["0A9",0,6554],["0B4",19662,26214],["102",13108,19661]],
    7: [["026"],["027"],["028"],["037",26215,32767],["0A8",19662,26214],["0AF",0,6554],["0DA",13108,19661],["102",6555,13107]],
    8: [["026"],["027"],["028"],["0B5",16385,18724],["0DA",25747,32767],["0F3",18725,25746],["0F5",8193,16384],["14B",0,8192]],
    9: [["026"],["027"],["028"],["0F0",6952,13902],["0F3",26811,32767],["0F5",20853,26810],["0F8",0,6951],["14B",13903,20852]],
    10: [["026"],["027"],["028"],["0F0",20481,26624],["0F8",14337,20480],["0FB",0,7168],["10C",7169,14336],["14B",26625,32767]],
    11: [["026"],["027"],["028"],["0B0",7169,14336],["0F8",26625,32767],["0FB",14337,20480],["0FD",0,7168],["10C",20481,26624]],
    12: [["026"],["027"],["028"],["0B0",18725,25746],["0FD",11704,18724],["108",3512,11703],["10C",25747,32767],["148",0,3511]],
  },
  5:{
    1: [["026"],["027"],["028"],["03E",6555,13107],["074",26215,32767],["07B",0,6554],["07F",13108,19661],["0C8",19662,26214]],
    2: [["026"],["027"],["028"],["086",19662,26214],["087",26215,32767],["08D",0,6554],["0BB",6555,13107],["0D0",13108,19661]],
    3: [["015",6555,13107],["026"],["027"],["028"],["02C",19662,26214],["078",26215,32767],["08C",0,6554],["0DC",13108,19661]],
    4: [["01B",15820,16949],["026"],["027"],["028"],["040",0,7910],["078",7911,15819],["0A7",24859,32767],["0B1",16950,24858]],
    5: [["026"],["027"],["028"],["080",0,6554],["088",19662,26214],["092",26215,32767],["0A7",6555,13107],["0C9",13108,19661]],
    6: [["026"],["027"],["028"],["02E",19662,26214],["06B",6555,13107],["0B2",0,6554],["0C0",26215,32767],["0DF",13108,19661]],
    7: [["026"],["027"],["028"],["0AA",19662,26214],["0C0",13108,19661],["0C3",0,6554],["0C6",6555,13107],["0DF",26215,32767]],
    8: [["026"],["027"],["028"],["0C3",13903,20852],["0D5",26811,32767],["0D6",6952,13902],["0DA",20853,26810],["0FC",0,6951]],
    9: [["026"],["027"],["028"],["0B5",30428,32767],["0D6",23406,30427],["0F9",0,8192],["0FC",16385,23405],["109",8193,16384]],
    10: [["026"],["027"],["028"],["0C7",0,7910],["0F9",15820,22598],["0FC",29379,32767],["109",22599,29378],["144",7911,15819]],
    11: [["026"],["027"],["028"],["0AB",7169,14336],["0C7",14337,20480],["0F9",26625,32767],["144",20481,26624],["14D",0,7168]],
    12: [["026"],["027"],["028"],["0AB",18725,25746],["0C7",25747,32767],["0E7",8193,11703],["0EE",0,8192],["14D",11704,18724]],
  },
};

const _elistWtL = new Uint8Array(256);
const _elistWtU = new Uint8Array(256);

// FloorMR=SMR+int[(Floor-1)/4] - Shared by getFloorElistInfo / checkElistAndD
function floorMRAt(baseMR,f) {return Math.min(12,baseMR+(f>>2));}

// (envType,floorMR) → 該層的 SPAWN_DB 條目；査無回空陣列
function getSpawnList(envType,floorMR) {return (SPAWN_DB[envType] && SPAWN_DB[envType][floorMR]) || [];}

function getMonsterDisplayName(hx) {
  const m = MONSTER_DB[hx];
  return m ?(m.en) : hx;
}

// ElistOfs 中只由地形決定的部分 (A/B/D)：牆＝TKG 的 TILE_WALL / TILE_DIVIDER，嵌牆寶箱會改變它，所以取放完寶箱後的格子。
function elistTileStats(floor) {
  const open = (x, y) => floor.grid[y][x] !== tkg.TILE_WALL && floor.grid[y][x] !== tkg.TILE_DIVIDER;
  let W = 0, X = 0;
  let wtCount = 0;

  for (let y=0;y<floor.height;y++) {
    for (let x=0;x<floor.width;x++) {
      if (open(x, y)) {
        W++;
        const L = (x>0 && open(x-1, y)) ? 1 : 0;
        const U = (y>0 && open(x, y-1)) ? 1 : 0;
        X +=(L+U);
        _elistWtL[wtCount] = L;
        _elistWtU[wtCount] = U;
        wtCount++;
      }
    }
  }

  const C = 4128-(W*16+X*8); // C = boundary, hardcoded in DQ9 game
  let A,B,D;

  if (C >= 0) {
    A = 4896+(W*16)+(X*8);
    B = X;
    D = 0;
  } else {
    A = 9016;
    B = (9016-4896-(W*16))>>3;
    D = 0;
    let B_pool = B;

    for (let i=0;i<wtCount;i++) {
      if (B_pool<=0) {
        D++;
      } else {
        if (_elistWtL[i]) B_pool--;
        if (_elistWtU[i] && B_pool>0) B_pool--;
      }
    }
  }
  return {A,B,D};
}

function getFloorElistInfo(map,f) {
  const envType = map.env;
  const baseMR = map.smr;
  let floorMR = floorMRAt(baseMR,f);

  const gArr = G_VALUES[envType];
  const G = gArr ? gArr[floorMR] : 0;
  const omArr = ONLY_MONSTERS[envType];
  const onlyMonId = omArr ? omArr[floorMR] : "";
  const onlyMon = onlyMonId && MONSTER_DB[onlyMonId] ? getMonsterDisplayName(onlyMonId) : "Unknown";
  const strOnly = EL_ONLY;

  // 格數統計只由樓層決定，同一樓層算一次共用
  const floor = map.floors[f];
  const {A,B,D} = floor.cache.elist ||(floor.cache.elist = elistTileStats(floor));

  const isIce10_12 =(envType === 3 && floorMR >= 10 && floorMR <= 12);
  const isRuins3 =(envType === 2 && floorMR === 3);
  const isIce1 =(envType === 3 && floorMR === 1);

  const F = (isIce10_12 || isRuins3 || isIce1) ? 7 : 8;
  const ElistOfs = A+4+(B*8)+(D*4)+(F*20)+(F*8)+G;

  const val = ElistOfs;
  let state = null;

  // ======================================================================
  // DQ9TMAP101.exe wrongly put 2 Mimics on Ruins floorMR 3 because:
  // (1) If 2-Mimic is true, then Multibugged B7F (Ruins floorMR=3) of 02 0AA0 should be ElistOfs 2B84 (敵無).
  // (2) But it is proved that Multibugged B7F (Ruins floorMR=3) of 02 0AA0 is Bagma + Metal Medley (敵減 2 種).
  // So 2-Mimic is false.
  // ======================================================================
  // Maybe on Ice floorMR 1, DQ9TMAP101.exe wrongly put 2 Canniboxes either.
  // But it's unable to verify it since Multibug cannot access any bugged floor's MR <=2.
  // Anyway, This tool's author already changed Ice floorMR 1 into 1-Cannibox state:
  // (1) 7 Monsters: Lost Soul - Cannibox - Mimic - Pandora's Box - 2ndMon - 3rdMon - 4thMon
  // (2) Since no double Canniboxes, G value of Ice1 decreased 16 to 108
  // ======================================================================
  if (val<=0x2B30) {
    if (D !== 0) state = EL_P; // 2B30 以下: 有D値時 部分敵無，其他 非特殊
  } else if (val>=0x2B34) {
    const isExc1 = isIce10_12 || isRuins3;
    const isExc2 = (envType===2&&floorMR===7)||(envType===5&&(floorMR===3||floorMR===4))||(envType===3&&floorMR===2)||(envType===4&&floorMR===4);
    const isExc4 = isIce1;
    const isExc5 =(envType===1&&floorMR===1);
    const EL_diff = Math.floor((val-0x2B34)/20);
    switch (EL_diff) {
      case 0: state = (isExc1||isExc4) ? (D!== 0?EL_P:null) : EL_4;break; // 2B34~2B44: F=7時 非特殊/部分敵無，其他 4種
      case 1: state = EL_3;break; // 2B48~2B58: 3種
      case 2: state = isExc5 ? EL_3+EL_NP : EL_2;break; // 2B5C~2B6C: 洞1 3種+潘多拉消失，其他 2種
      case 3: state = isExc5 ? EL_3+EL_NM : `${onlyMon}${strOnly}`;break; // 2B70~2B80: 洞1 3種+咪咪消失，其他 ONLY
      case 4: state = isExc5 ? EL_3+EL_NC : (isExc4||isExc2?`${onlyMon}${strOnly}${EL_NP}`:EL_0);break; // 2B84~2B94: 洞1 3種+食人箱消失，exc2/4 ONLY+潘多拉消失，其他 敵無
      case 5: state = isExc5 ? EL_2+EL_NC : (isExc4||isExc2?`${onlyMon}${strOnly}${EL_NM}`:EL_0+EL_NP);break; // 2B98~2BA8: 洞1 2種+食人箱消失，exc2/4 ONLY+咪咪消失，其他 敵無+潘多拉消失
      case 6: state = (isExc4||isExc2||isExc5) ? `${onlyMon}${strOnly}${EL_NC}` : EL_0+EL_NM;break; // 2BAC~2BBC: 洞1/exc2/4 ONLY+食人箱消失，其他 敵無+咪咪消失
      default: state = EL_0+EL_NC;break; // 2BC0 以上: 敵無+食人箱消失
    }
  }
  if(state!==null)state=String(state);
  return{hex:ElistOfs.toString(16).toUpperCase(),state:state,dValue:D};
}

// 解析 ElistOfs state 字串 → 類別 (evalElistFloorHit 用)
// 註：getFloorElistInfo 產生的各 state 類別互斥 (敵無/ONLY/敵減/部分敵無 不會同時出現在同一字串)
function classifyElistState(st) {
  st = ''+st;
  if (st.includes(''+EL_0) && !st.includes(''+EL_P)) return {kind:'none'};
  if (st.includes(EL_ONLY)) return {kind:'only'};
  if (st.includes(''+EL_4)) return {kind:'reduced',count:4};
  if (st.includes(''+EL_3)) return {kind:'reduced',count:3};
  if (st.includes(''+EL_2)) return {kind:'reduced',count:2};
  if (st.includes(''+EL_P)) return {kind:'partial'};
  return {kind:'normal'};
}

// 1. 步行成本

// 兩點間的步行成本：由呼叫端提供 (overrides.calcPointWalkCost)，不可達回 null
const calcPointWalkCost = overrides && overrides.calcPointWalkCost;

// 路線 = {cost, legs:[{f, from:[x,y], to:[x,y]}]}，不可達為 null。
// 每條評估過的完整路線交給 overrides.onRoute (呼叫端藉此知道結果走的是哪條)，checker 只拿到成本。
function pointWalk(eng,f,x,y,gx,gy){
  const c=calcPointWalkCost(eng,f,x,y,gx,gy);
  return c===null?null:{cost:c,legs:[{f,from:[x,y],to:[gx,gy]}]};
}
const joinWalks=(...ws)=>ws.some(w=>w===null)?null:{cost:ws.reduce((a,w)=>a+w.cost,0),legs:[].concat(...ws.map(w=>w.legs))};
const NO_WALK={cost:0,legs:[]};
function reportWalk(w){
  if(overrides&&overrides.onRoute)overrides.onRoute(w);
  return w===null?null:w.cost;
}

// 第 0 層到第 (upTo-1) 層的「上樓梯→下樓梯」;任一層不可達回 null
function walkUpToFloor(eng,upTo){
  const parts=[];
  for(let f=0;f<upTo;f++){const fl=eng.floors[f];parts.push(pointWalk(eng,f,fl.up.x,fl.up.y,fl.down.x,fl.down.y));}
  return joinWalks(NO_WALK,...parts);
}

// 2. 寶箱巡迴與跨層路線

// 造訪順序候選:2 個目標試兩序,其餘照原序(呼叫端目前最多 2 個)
const listVisitOrders=(n)=>n===2?[[0,1],[1,0]]:[Array.from({length:n},(_,i)=>i)];

// D/5D/9D 模式 A*：目標樓層前各層(梯到梯)之和 + 目標層 上樓梯→開遍所有目標寶箱
// 訪問順序取全排列最小——如 DD/1341 B3F:A3 緊鄰上樓梯,先開 A3 再原路掉頭開 A2(1+7=8)短於箱序(6+7=13)
// 目標寶箱不可達(乳首)回 null
function calcSameFloorChestChainCost(eng,floor,boxes){
  const sum=walkUpToFloor(eng,floor);
  if(sum===null)return reportWalk(null);
  const fl=eng.floors[floor];
  const n=boxes.length;
  const px=[fl.up.x],py=[fl.up.y]; // 節點 0=上樓梯, 1..n=目標寶箱
  for(const b of boxes){px.push(fl.chests[b].x);py.push(fl.chests[b].y);}
  const dist=[];
  for(let i=0;i<=n;i++){
    dist[i]=[];
    for(let j=1;j<=n;j++) dist[i][j]=(i===j)?0:calcPointWalkCost(eng,floor,px[i],py[i],px[j],py[j]);
  }
  let best=null,bestOrder=null;
  const walk=(rest,cur,cost,order)=>{
    if(best!==null&&cost>=best)return;
    if(rest.length===0){best=cost;bestOrder=order;return;}
    for(let k=0;k<rest.length;k++){
      const leg=dist[cur][rest[k]];
      if(leg===null)continue;
      walk(rest.slice(0,k).concat(rest.slice(k+1)),rest[k],cost+leg,order.concat(rest[k]));
    }
  };
  walk(boxes.map((_,i)=>i+1),0,0,[]);
  if(best===null)return reportWalk(null);
  const legs=[];
  let cur=0;
  for(const i of bestOrder){legs.push({f:floor,from:[px[cur],py[cur]],to:[px[i],py[i]]});cur=i;}
  return reportWalk({cost:sum.cost+best,legs:sum.legs.concat(legs)});
}

// 體感 A* 跨層段:從 (f,x,y) 到 (g,gx,gy);同層直走,下一層=本層→下樓梯+下層上樓梯→目標,上一層=本層→上樓梯+上層下樓梯→目標
function crossFloorWalk(eng,f,x,y,g,gx,gy){
  if(f===g)return pointWalk(eng,f,x,y,gx,gy);
  const ff=eng.floors[f],fg=eng.floors[g];
  if(g===f+1)return joinWalks(pointWalk(eng,f,x,y,ff.down.x,ff.down.y),pointWalk(eng,g,fg.up.x,fg.up.y,gx,gy));
  return joinWalks(pointWalk(eng,f,x,y,ff.up.x,ff.up.y),pointWalk(eng,g,fg.down.x,fg.down.y,gx,gy));
}

// 體感 A*(D/5D/9D):wp層前各層梯到梯之和 + wp層上樓梯→wp命中箱 + wp末箱→整列箱(可跨層)
// 「先取wp」:wp 段先取最短序(同長時取後段較短者),再從 wp 末箱到整列箱取最短(targets 兩顆時試兩序)
function calcCrossFloorChestRouteCost(eng,wpFloor,wpIdx,targets){
  const prefix=walkUpToFloor(eng,wpFloor);
  if(prefix===null)return reportWalk(null);
  const fl=eng.floors[wpFloor];
  const wpPts=wpIdx.map(b=>[fl.chests[b].x,fl.chests[b].y]);
  let best=null;
  for(const ord of listVisitOrders(wpPts.length)){
    let cx=fl.up.x,cy=fl.up.y,wp=NO_WALK;
    for(const oi of ord){
      wp=joinWalks(wp,pointWalk(eng,wpFloor,cx,cy,wpPts[oi][0],wpPts[oi][1]));
      if(wp===null)break;
      cx=wpPts[oi][0];cy=wpPts[oi][1];
    }
    if(wp===null)continue;
    let segBest=null;
    for(const tOrd of listVisitOrders(targets.length)){
      let f=wpFloor,x=cx,y=cy,seg=NO_WALK;
      for(const ti of tOrd){
        const t=targets[ti];
        seg=joinWalks(seg,crossFloorWalk(eng,f,x,y,t.g,t.gx,t.gy));
        if(seg===null)break;
        f=t.g;x=t.gx;y=t.gy;
      }
      if(seg!==null&&(segBest===null||seg.cost<segBest.cost))segBest=seg;
    }
    if(segBest===null)continue;
    const total=wp.cost+segBest.cost;
    if(best===null||wp.cost<best.wp||(wp.cost===best.wp&&total<best.total))best={wp:wp.cost,total,legs:wp.legs.concat(segBest.legs)};
  }
  return reportWalk(best===null?null:{cost:prefix.cost+best.total,legs:prefix.legs.concat(best.legs)});
}

// ================
// Location & Base Quality
// ================
const RANKS = {
  "02":{fqMin:2,fqMax:55},
  "38":{fqMin:56,fqMax:60},
  "3D":{fqMin:61,fqMax:75},
  "4C":{fqMin:76,fqMax:80},
  "51":{fqMin:81,fqMax:100},
  "65":{fqMin:101,fqMax:120},
  "79":{fqMin:121,fqMax:140},
  "8D":{fqMin:141,fqMax:160},
  "A1":{fqMin:161,fqMax:180},
  "B5":{fqMin:181,fqMax:200},
  "C9":{fqMin:201,fqMax:220},
  "DD":{fqMin:221,fqMax:248}
};

const BQ_MIN = 2, BQ_MAX = 248; // For BQ's D/D' options: Search maps that only available on BQ 245-248
const LOCATION_SEED_MAX = 0x7FFF;

const LOCATION_FQ_BANDS = [
  {fqMin:2,fqMax:50,locationMax:47},
  {fqMin:51,fqMax:80,locationMax:131},
  {fqMin:81,fqMax:248,locationMax:150}
];

const QUEST015 = "Quest 015";
const QUEST015_EXC = {seed:0x0032,fq:0x02,loc:5,bqFill:2};
const isQuest015InFQRange = (seed,fqMin,fqMax) => seed === QUEST015_EXC.seed && QUEST015_EXC.fq >= fqMin && QUEST015_EXC.fq <= fqMax;

const BQ_MODULO = new Int32Array(256);
const BQ_TENTH = new Float64Array(256);
const BQ_FQ_LO = new Int32Array(256);
const BQ_FQ_HI = new Int32Array(256);

// --- 驗證與解析函數 ---
function hasConditionValue(raw) {
  return raw !== null && raw !== undefined && String(raw).trim() !== "";
}

function isValidBaseQuality(value) {
  return Number.isInteger(value) && value >= BQ_MIN && value <= BQ_MAX;
}

function parseBaseQuality(raw) {
  if (!hasConditionValue(raw)) return null;
  const value = Number(String(raw).trim());
  return isValidBaseQuality(value) ? value : NaN;
}

function parseLocationCode(raw) {
  if (!hasConditionValue(raw)) return null;
  const text = String(raw).trim();
  if (!/^[0-9A-Fa-f]{1,2}$/.test(text)) return NaN;
  const value = parseInt(text,16);
  return value >= 0x01 && value <= 0x96 ? value : NaN;
}

function getLocationBQFilters(conds) {
  const location = parseLocationCode(conds && conds.location);
  const baseQ = parseBaseQuality(conds && conds.bq);
  return {location, baseQ, valid: !Number.isNaN(location) && !Number.isNaN(baseQ)};
}

function getLocationMax(finalQuality) {
  for (const band of LOCATION_FQ_BANDS) if (finalQuality <= band.fqMax) return band.locationMax;
  return LOCATION_FQ_BANDS[LOCATION_FQ_BANDS.length - 1].locationMax;
}

function locationFromR3(r3,finalQuality) {return (r3 % getLocationMax(finalQuality)) + 1;}

function calcFinalQuality(baseQ,r1) {
  const final = baseQ + Math.trunc(r1 % BQ_MODULO[baseQ] - BQ_TENTH[baseQ]);
  return final < BQ_MIN ? BQ_MIN : final > BQ_MAX ? BQ_MAX : final;
}

function getFinalQualityBounds(rawBaseQ) {
  const baseQ = parseBaseQuality(rawBaseQ);
  if (!isValidBaseQuality(baseQ)) return null;
  return {baseQ,minFinalQ:BQ_FQ_LO[baseQ],maxFinalQ:BQ_FQ_HI[baseQ]};
}

// --- 預計算資料表初始化 ---
for (let b = BQ_MIN; b <= BQ_MAX; b++) {
  const m = Math.floor(b/10)*2+1;
  BQ_MODULO[b] = m;
  BQ_TENTH[b] = b/10;
  let lo = BQ_MAX, hi = BQ_MIN;
  for (let r = 0; r < m; r++) {
    const f = calcFinalQuality(b, r);
    if (f < lo) lo = f;
    if (f > hi) hi = f;
  }
  BQ_FQ_LO[b] = lo;
  BQ_FQ_HI[b] = hi;
}

// --- 快取與下拉搜尋功能 ---
const bqScanRangeCache = {};
function getBaseQScanRange(fqMin,fqMax) {
  const key = fqMin + ':' + fqMax;
  let r = bqScanRangeCache[key];
  if (r) return r;
  let lo = BQ_MIN, hi = BQ_MAX;
  while (lo <= BQ_MAX && BQ_FQ_HI[lo] < fqMin) lo++;
  while (hi >= BQ_MIN && BQ_FQ_LO[hi] > fqMax) hi--;
  r = bqScanRangeCache[key] = Object.freeze({lo,hi});
  return r;
}

// --- Seed & Timer Calculation ---
let SEED_TO_TIMERS_CACHE = null;

function ensureSeedTimerCache() {
  if (SEED_TO_TIMERS_CACHE) return;
  SEED_TO_TIMERS_CACHE = {};
  for (let t = 0; t < 65536; t++) {var _SEED_TO_TIMERS_CACHE,_SEED_TO_TIMERS_CACHE2;
    const x1 = lcg(t);
    const x2 = lcg(x1);
    const s = atFromRng(x2);
    ((_SEED_TO_TIMERS_CACHE2=(_SEED_TO_TIMERS_CACHE=SEED_TO_TIMERS_CACHE)[s])!==null&&_SEED_TO_TIMERS_CACHE2!==void 0?_SEED_TO_TIMERS_CACHE2:_SEED_TO_TIMERS_CACHE[s]=[]).push(t);
  }
}

function timerToR1R3(timer) {
  const x1 = lcg(timer);
  const x2 = lcg(x1);
  const x3 = lcg(x2);
  return {r1:atFromRng(x1),r3:atFromRng(x3)};
}

function calcLocations(seed,rStr) {
  const {fqMin,fqMax} = RANKS[rStr] || {fqMin:BQ_MIN,fqMax:BQ_MAX};
  const seenLocations = {};
  const outputOrder = [];

  ensureSeedTimerCache();
  const timers = SEED_TO_TIMERS_CACHE[seed] || [];

  const addLoc = (timer,loc,bqs) => {
    if (!seenLocations[loc]) {
      const minBq = Math.min(...bqs);
      seenLocations[loc] = new Set();
      outputOrder.push({timer,location:loc,minBq});
    }
    for (const bq of bqs) seenLocations[loc].add(bq);
  };

  const scan = getBaseQScanRange(fqMin,fqMax);

  for (const timer of timers) {
    const {r1,r3} = timerToR1R3(timer);
    const locToBq = {};
    for (let baseQ = scan.lo; baseQ <= scan.hi; baseQ++) {var _locToBq$calcLoc;
      const finalQ = calcFinalQuality(baseQ,r1);
      if (finalQ < fqMin || finalQ > fqMax) continue;
      const calcLoc = locationFromR3(r3,finalQ);
      ((_locToBq$calcLoc=locToBq[calcLoc])!==null&&_locToBq$calcLoc!==void 0?_locToBq$calcLoc:locToBq[calcLoc]=[]).push(baseQ);
    }
    for (const loc in locToBq) addLoc(timer,+loc,locToBq[loc]);
  }

  // Quest 015 exception
  const q15 = QUEST015_EXC;
  if (isQuest015InFQRange(seed,fqMin,fqMax)) addLoc(QUEST015,q15.loc,[q15.bqFill]);

  outputOrder.sort((a, b) => {
    if (a.timer === QUEST015) return 1;
    if (b.timer === QUEST015) return -1;
    if (a.timer !== b.timer) return a.timer - b.timer;
    return a.minBq - b.minBq;
  });

  return {outputOrder, seenLocations};
}

// Location Cache
let _cachedLocData = null;
let _cachedLocSeed = null;
let _cachedLocRankKey = null;

function resetLocationCache() {
  _cachedLocData = null;
  _cachedLocSeed = null;
  _cachedLocRankKey = null;
}

function getLocDataCached(seed,targetRankKey) {
  if (!Number.isInteger(seed) || seed < 0 || seed > LOCATION_SEED_MAX || targetRankKey == null) return null;
  if (!_cachedLocData || _cachedLocSeed !== seed || _cachedLocRankKey !== targetRankKey) {
    _cachedLocData = calcLocations(seed, targetRankKey);
    _cachedLocSeed = seed;
    _cachedLocRankKey = targetRankKey;
  }
  return _cachedLocData;
}

function matchesLocationBQ(locData,locNum,targetLocNum,targetBqNum) {
  const bqs = locData && locData.seenLocations[locNum];
  return !!bqs
    &&(targetLocNum === null || locNum === targetLocNum)
    &&(targetBqNum === null || bqs.has(targetBqNum));
}

// ===============
// Ultimate Search Filters
// ===============

// 1. Basic functions and helpers

function hex2(n) {return n.toString(16).toUpperCase().padStart(2,'0');}

function buildOnlyMonExpectedStr(conds) {
  if (!((conds!==null&&conds!==void 0)&&conds.onlyMon))return'';
  return (conds.onlyMon) + EL_ONLY;
}

// rank 鍵防禦式解析：RANKS 以兩位大寫 hex 字串為鍵
function resolveRankKey(rStr,rankNum) {
  return RANKS[rStr] ? rStr : (RANKS["0x"+rStr]?"0x"+rStr:((rankNum!==undefined&&RANKS[rankNum])?rankNum:null));
}

// 2. Basic Map Conditions

function checkBasicConds(searchEngine,conds) {
  if (conds.prefix && searchEngine.prefix != conds.prefix) return false;
  if (conds.suffix && searchEngine.suffix != conds.suffix) return false;
  if (conds.locale && searchEngine.locale != conds.locale) return false;
  if (conds.lv && searchEngine.lv != conds.lv) return false;
  if (conds.env && searchEngine.env != conds.env) return false;
  if (conds.monster && searchEngine.smr != conds.monster) return false;
  if (conds.depth && searchEngine.floorCount != conds.depth) return false;
  if (conds.boss && searchEngine.boss != conds.boss) return false;
  return true;
}

function isCombinedElistMonsterSearch(conds) {
  return !!((conds!==null&&conds!==void 0)&&conds.onlyMon)&&['2','3','4','PARTIAL_NONE'].includes(conds.elist);
}

function checkOnlyMonPossible(searchEngine,conds) {
  if (!((conds!==null&&conds!==void 0)&&conds.onlyMon))return true;
  let baseMR = searchEngine.smr;
  let maxFloorMR = floorMRAt(baseMR, searchEngine.floorCount-1);
  for (let fMR = baseMR; fMR <= maxFloorMR; fMR++) {
    if (matchesOnlyMonFloor(searchEngine.env,fMR,conds.onlyMon)) return true;
  }
  return false;
}

// 3. Location & BQ Search Filters

// 所有地圖條件搜尋共用。
function checkLocationBQ(seed,conds,searchFilterLoc,targetRankKey) {
  const filters = getLocationBQFilters(conds);
  if (!filters.valid) return {match: false};

  const targetLocNum = filters.location;
  const targetBqNum = filters.baseQ;
  if (targetLocNum === null && targetBqNum === null && !searchFilterLoc) return {match: true};
  if (seed > LOCATION_SEED_MAX || targetRankKey == null) return {match: false};

  const locData = getLocDataCached(seed, targetRankKey);
  if (!locData || locData.outputOrder.length === 0) return {match: false};

  if (targetLocNum !== null || targetBqNum !== null) {
    let targetFound = false;
    for (const locObj of locData.outputOrder) {
      if (matchesLocationBQ(locData, locObj.location, targetLocNum, targetBqNum)) {
        targetFound = true;
        break;
      }
    }
    if (!targetFound) return {match: false};
  }

  return {match:true};
}

function checkUltimateCondsMatch(engine,seed,targetRankKey,conds,searchFilterLoc) {
  resetLocationCache();
  if (!checkBasicConds(engine,conds)) return false;
  if (!checkLocationBQ(seed,conds,searchFilterLoc,targetRankKey).match) return false;
  return true;
}

// 4. ElistOfs & D-Value (Flag0) Filters

// 組合模式 (ElistOfs + ONLY 怪物)：該層 floorMR 的 ONLY 怪物是否為指定怪物
function isCombinedOnlyHit(envType,floorMR,onlyMonNameStr) {
  if (!getSpawnList(envType,floorMR).length) return false;
  return matchesOnlyMonFloor(envType,floorMR,onlyMonNameStr);
}

// 每層 elist 命中判定
function evalElistFloorHit(searchEngine,f,info,elistCond) {
  const {kind, count} = classifyElistState(info.state);
  const targetCount = kind === 'reduced' ? count : 0;
  let isElistHit = false;

  if (targetCount > 0 && elistCond === String(targetCount)) isElistHit = true;

  if (!isElistHit && elistCond) {
    if (elistCond === 'PARTIAL_NONE' && kind === 'partial') isElistHit = true;
    else if (elistCond === 'ONLY' && kind === 'only') isElistHit = true;
    else if (elistCond === 'NONE' && kind === 'none') isElistHit = true;
    else if (elistCond === 'SIZE_15' && searchEngine.floors[f].width === 15) isElistHit = true;
  }
  return isElistHit;
}

function checkElistAndD(searchEngine, conds, searchOnlyWithD, _onlyMonExpectedStr) {
  let result = {match:true, jumpToFloor:-1, hasMatchedD:false};
  if (!(conds.elist || conds.onlyMon || searchOnlyWithD)) return result;

  const isCombinedSearch = isCombinedElistMonsterSearch(conds);
  let hasAnyD = false;
  let elistMatched = !conds.elist;
  let onlyMatched = !conds.onlyMon;

  if (isCombinedSearch) {
    elistMatched = false;
    onlyMatched = false;
  }

  let specialFloorCount = 0;
  const currentMapSpecials = [];
  const envType = searchEngine.env;
  const baseMR = searchEngine.smr;

  for (let f = 0; f < searchEngine.floorCount; f++) {
    let info = getFloorElistInfo(searchEngine, f);
    if (!info.state) continue;
    if (info.dValue > 0) hasAnyD = true;

    const isElistHit = evalElistFloorHit(searchEngine, f, info, conds.elist);

    const isCombinedMatchedThisFloor = isCombinedSearch && isElistHit &&
      isCombinedOnlyHit(envType,floorMRAt(baseMR,f),conds.onlyMon);

    specialFloorCount++;
    currentMapSpecials.push({f, dValue:info.dValue});

    if (isCombinedSearch) {
      if (isCombinedMatchedThisFloor) {
        if (info.dValue > 0) result.hasMatchedD = true;
        if (!elistMatched) {
          elistMatched = true;
          onlyMatched = true;
          if (result.jumpToFloor === -1) result.jumpToFloor = f;
        }
      }
    } else {
      if (conds.elist && conds.elist !== 'MULTI_SPECIAL' && isElistHit) {
        if (info.dValue > 0) result.hasMatchedD = true;
        if (!elistMatched) {
          elistMatched = true;
          if (result.jumpToFloor === -1) result.jumpToFloor = f;
        }
      }
      if (conds.onlyMon && info.state.includes(_onlyMonExpectedStr)) {
        if (info.dValue > 0) result.hasMatchedD = true;
        if (!onlyMatched) {
          onlyMatched = true;
          if (result.jumpToFloor === -1) result.jumpToFloor = f;
        }
      }
    }
  }

  if (conds.elist === 'MULTI_SPECIAL') {
    if (specialFloorCount >= 2) {
      elistMatched = true;
      currentMapSpecials.forEach(s => {
        if (s.dValue > 0) result.hasMatchedD = true;
      });
      if (result.jumpToFloor === -1 && currentMapSpecials.length > 0) result.jumpToFloor = currentMapSpecials[0].f;
    } else {elistMatched = false;}
  }

  if (searchOnlyWithD && !hasAnyD) result.match = false;
  if (!elistMatched || !onlyMatched) result.match = false;
  if (searchOnlyWithD && result.match) {
    if ((conds.elist || conds.onlyMon) && conds.elist !== 'MULTI_SPECIAL') {
      if (!result.hasMatchedD) result.match = false;
    }
  }
  return result;
}

// 6. Rank Filtering & SMR Bounds

function rankCanDropInMRRange(r, numMin, numMax) {
  for (let num = numMin; num <= numMax; num++) {
    const cMin = D_F[(num - 1) * 4 + 1];
    const cMax = D_F[(num - 1) * 4 + 2];
    if (r >= cMin && r <= cMax) return true;
  }
  return false;
}

function getRankSMRInfo(rank, conds) {
  let rStr = hex2(rank);

  // 1. BQ Check
  if (conds && hasConditionValue(conds.bq)) {
    const bounds = getFinalQualityBounds(conds.bq);
    if (!bounds) return null;
    const {minFinalQ, maxFinalQ} = bounds;
    const rankInfo = RANKS[rStr];
    if (rankInfo &&(maxFinalQ < rankInfo.fqMin || minFinalQ > rankInfo.fqMax)) return null;
  }

  // 2. SMR range (D_C)
  const [minSMR, maxSMR] = row4(D_C, 8, rank, [1, 9]);

  // 3. Monster condition
  if ((conds!==null&&conds!==void 0)&&conds.monster){
    let targetSMR = parseInt(conds.monster);
    if (targetSMR < minSMR || targetSMR > maxSMR) return null;
  }

  // 4. Floor range (D_B)
  const [floorLo, floorHi] = row4(D_B, 9, rank, [2, 16]);
  let maxFloorCount = floorHi;
  if ((conds!==null&&conds!==void 0)&&conds.depth){
    let d = parseInt(conds.depth);
    if (d < floorLo || d > floorHi) return null;
    maxFloorCount = d;
  }
  if ((conds!==null&&conds!==void 0)&&conds.depth2){
    let d2 = parseInt(conds.depth2);
    if (d2 > floorHi) return null;
  }

  // 5. Boss range (D_D)
  const [minBoss, maxBoss] = row4(D_D, 9, rank, [1, 12]);
  if ((conds!==null&&conds!==void 0)&&conds.boss){
    let b = parseInt(conds.boss);
    if (b < minBoss || b > maxBoss) return null;
  }

  // 6. Lv Check
  if ((conds!==null&&conds!==void 0)&&conds.lv){
    const clampLv = v => v < 1 ? 1 : v > 99 ? 99 : v;
    let dLo = conds.depth ? parseInt(conds.depth) : floorLo;
    let dHi = conds.depth ? parseInt(conds.depth) : floorHi;
    let sLo = conds.monster ? parseInt(conds.monster) : minSMR;
    let sHi = conds.monster ? parseInt(conds.monster) : maxSMR;
    let bLo = conds.boss ? parseInt(conds.boss) : minBoss;
    let bHi = conds.boss ? parseInt(conds.boss) : maxBoss;
    let lvLo = clampLv((bLo + dLo + sLo - 4) * 3 - 5);
    let lvHi = clampLv((bHi + dHi + sHi - 4) * 3 + 5);
    let L = parseInt(conds.lv);
    if (L < lvLo || L > lvHi) return null;
  }

  return {minSMR, maxSMR, maxFloorCount, minBoss, maxBoss};
}

// 共用通用 Rank 篩選器 (Ultimate Search 專用)
function sharedRankFilter(ranksToSearch, conds) {
  if (!getLocationBQFilters(conds).valid) return [];

  if (!conds.onlyMon && !conds.monster && !hasConditionValue(conds.bq) && !conds.hasBoxCond && !conds.prefix && !conds.suffix && !conds.lv && !conds.depth && !conds.depth2 && !conds.boss) {
    return ranksToSearch;
  }

  return ranksToSearch.filter(rank => {
    const info = getRankSMRInfo(rank, conds);
    if (!info) return false;
    const {minSMR, maxSMR, maxFloorCount, minBoss, maxBoss} = info;

    if (conds.prefix) {
      const p = parseInt(conds.prefix);
      let ok = false;
      for (let smr = minSMR; smr <= maxSMR && !ok; smr++) {
        const [pLo, pHi] = row4(D_H, 5, smr, NO_ROW);
        if (p >= pLo && p <= pHi) ok = true;
      }
      if (!ok) return false;
    }

    if (conds.suffix) {
      const sf = parseInt(conds.suffix);
      let ok = false;
      for (let b = minBoss; b <= maxBoss && !ok; b++) {
        const [sLo, sHi] = row4(D_I, 4, b, NO_ROW);
        if (sf >= sLo && sf <= sHi) ok = true;
      }
      if (!ok) return false;
    }

    let maxFloor = maxFloorCount - 1;

    if (conds.hasBoxCond) {
      let maxPossibleNum = floorMRAt(maxSMR, maxFloor);
      for (let r = 10; r >= 1; r--) if (conds.reqBox[r] > 0 && !rankCanDropInMRRange(r, minSMR, maxPossibleNum)) return false;
    }

    if (conds.onlyMon) {
      let targetEnv = conds.env ? parseInt(conds.env) : 0;
      let isPossible = false;

      for (let env = 1; env <= 5; env++) {
        if (targetEnv && env !== targetEnv) continue;
        for (let fMR = 1; fMR <= 12; fMR++) {
          if (matchesOnlyMonFloor(env,fMR,conds.onlyMon)) {
            let smrStart = conds.monster ? parseInt(conds.monster) : minSMR;
            let smrEnd = conds.monster ? parseInt(conds.monster) : maxSMR;
            for (let smr = smrStart; smr <= smrEnd; smr++) {
              if (fMR >= smr && fMR <= floorMRAt(smr, maxFloor)) {
                isPossible = true;
                break;
              }
            }
          }
          if (isPossible) break;
        }
        if (isPossible) break;
      }
      if (!isPossible) return false;
    }
    return true;
  });
}

// ========
// Item Search
// ========

const ITEMS_MILLIONAIRE = ["Hero spear","Pruning knife","Wyrmwand","Wizardly whip","Beast claws","Attribeauty","Heavy hatchet","Megaton hammer","Pentarang","Metal slime sword","Metal slime spear"];
const ITEMS_MILLIONAIRE_BOX3 = ITEMS_MILLIONAIRE.slice(0, 7);
const ITEMS_S_WEAPONS = ["Stardust sword","Poker","Deft dagger","Bright staff","Gringham whip","Knockout rod","Dragonlord claws","Critical fan","Bad axe","Groundbreaker","Meteorang","Angel's bow"];
const ITEMS_METAL_SLIME = ["Metal slime sword","Metal slime spear","Metal slime shield","Metal slime armour","Metal slime helm","Metal slime gauntlets","Metal slime sollerets"];
const ITEM_GROUPS = new Map([['Millionaire', ITEMS_MILLIONAIRE], ['S weapon', ITEMS_S_WEAPONS], ['Metasla', ITEMS_METAL_SLIME]]);
function expandItemGroup(v) {return ITEM_GROUPS.get(v) || [v];}

function getChestRanksForItems(itemNames){
  const ranks=[];
  for(let r=1;r<=10;r++){
    let startIdx=D_O[r-1],endIdx=D_O[r];
    for(let i=startIdx;i<endIdx;i++){
      if(itemNames.includes(D_R[D_Q[i]][0])&&!ranks.includes(r))ranks.push(r);
    }
  }
  return ranks;
}

// 特定 SMR + 寶箱組合 與 指定樓層 Offset 的 Rank 篩選器
function filterMapRanksBySMRAndChest(ranksToSearch, conds, chestRankGroups, targetFloorOffset) {
  return ranksToSearch.filter(rank => {
    const info = getRankSMRInfo(rank, conds);
    if (!info) return false;
    const {minSMR, maxSMR, maxFloorCount} = info;

    if (!chestRankGroups || chestRankGroups.length === 0) return true;

    let minFloor = 0;
    let maxFloor = maxFloorCount - 1;

    if (targetFloorOffset != null) {
      minFloor = maxFloor = targetFloorOffset * 4;
      if (maxFloorCount <= minFloor) return false;
    }

    let minPossibleNum = floorMRAt(minSMR, minFloor);
    let maxPossibleNum = floorMRAt(maxSMR, maxFloor);

    return chestRankGroups.every(group =>
      group.some(r => rankCanDropInMRRange(r, minPossibleNum, maxPossibleNum))
    );
  });
}

// Chest counts：counts[r-1] 逐 Rank 比對 reqBox，全符合回傳「S1 A2」字串，否則 null
// 寶箱數條件：每個指定 Rank 的寶箱數都要相符
function chestCondsMatch(engine,conds){
  if (!conds.hasBoxCond) return true;
  for (let r=10;r>=1;r--) if (conds.reqBox[r]>0 && engine.chestRankCounts[r-1] !== conds.reqBox[r]) return false;
  return true;
}

// A*
// 共用者：third / jfire / tk 三個 checker 的 astarText
const fmtStep = v => Number.isInteger(v) ? '' + v : v.toFixed(1);
const fmtStepD = v => v == null ? '—' : fmtStep(v);
const minAstar = arr => {const m = Math.min(...arr.map(v => v == null ? Infinity : v));return m === Infinity ? null : m;};

// 3. Item Search

const CHEST_TIMER_OFFSET = 5;

// QL 系 (quickload / quickload9) 地圖基本門檻
const meetsQuickloadBasicReq = (eng, p, conds) => eng.floorCount >=(p.isB9F ? 9 : 3) && filterMapRanksBySMRAndChest([eng.rank], conds, [p.chestRanks], p.isB9F ? 2 : 0).length > 0;

// 物品搜尋：各模式的地圖基本門檻 (checkBasicReq)
const ITEM_BASIC_REQS = {
  quickload: meetsQuickloadBasicReq,
  quickload9: meetsQuickloadBasicReq,
  third: (eng, p, conds) => eng.floorCount >=(p.isS3 ? 14 : 4) && filterMapRanksBySMRAndChest([eng.rank], conds, [p.chestRanks], p.isS3 ? 3 : 0).length > 0,
  jfire: eng => eng.smr === 9 && eng.floorCount >= 9,
  tk: eng => eng.floorCount >= 3,
};

// ⑨/⑤ 標記：內部秒數取自 p.qlSec (缺省 4s=⑨、0s=⑤)
const QL_MARK_5 = {sec: 0, mk: '⑤', mkColor: '#7fd4ff'}, QL_MARK_9 = {sec: 4, mk: '⑨', mkColor: '#b19cd9'};
const getQuickloadMark = (p) => (p.qlSec === 0 ? QL_MARK_5 : QL_MARK_9);
const QL_SOLO = {sec: 1, mk: STR_SOLO, mkColor: '#f9b'}, QL_PARTY = {sec: 2, mk: STR_PARTY, mkColor: '#ffd700'};

// QL 系 checker 的收尾
const buildQuickloadResult = (eng, p, st) => {
  if (st.useB10) return st.multi.length > 0 ? {isHit: true, multi: st.multi} : {isHit:false};
  if (st.hitTypes.length === 0) return {isHit:false};
  const res = {isHit: true, jumpFloor: st.firstHitFloor, displayHtml: st.hitTypes.join('<br>')};
  if (st.astarBoxes) {
    res.astar = calcSameFloorChestChainCost(eng, st.astarFloor, st.astarBoxes);
    if (st.astarBoxes.length > p.reqCount) res.astarX3 = true;
  }
  return res;
};

// quickload／quickload9 共用：逐層以 modeA（、modeB）的秒數計數，同層第一個達標的 mode 決定 A* 用的箱子
function scanQuickloadFloors(eng, p, modeA, modeB) {
  const checkSet = new Set(p.checkItems);
  let hitTypes = [];
  let firstHitFloor = -1;
  let astarBoxes = null, astarFloor = -1;
  const useB10 = !!(p.checkB10 && p.isB9F); // 5D/9D 模式 B9F 搜尋:同條件追査 B10F
  const floors = useB10 ? [8, 9] : p.targetFloors;
  const multi = [];

  for (let f of floors) {
    if (f >= eng.floorCount) continue;
    let prefixStr = (p.isB9F && !useB10) ? 'B9F ' : `B${f + 1}F `;
    let boxes = null, fHtml = '';
    for (let i = 0; i < 2; i++) {
      const mode = i === 0 ? modeA : modeB;
      if (!mode) break;
      const names = eng.chestItems(f, mode.sec);
      let cnt = 0;
      const hitIdx = [];
      for (let b = 0; b < names.length; b++) {
        if (checkSet.has(names[b])) {cnt++; hitIdx.push(b);}
      }
      if (cnt < p.reqCount) continue;
      const line = `<span style="color:${mode.mkColor};font-size:11px">${prefixStr}${mode.mk} x${cnt}</span>`;
      hitTypes.push(line);
      fHtml = fHtml ? fHtml + '<br>' + line : line;
      if (boxes === null) boxes = hitIdx;
    }
    if (boxes === null) continue;
    if (firstHitFloor === -1) {
      firstHitFloor = f;
      if (p.wantAstar) {astarFloor = f; astarBoxes = boxes;}
    }
    if (useB10) multi.push({floor: f, displayHtml: fHtml, astar: calcSameFloorChestChainCost(eng, f, boxes), isB10: f === 9, isX3: boxes.length > p.reqCount});
  }
  return buildQuickloadResult(eng, p, {useB10, multi, hitTypes, firstHitFloor, astarFloor, astarBoxes});
}

// jfire／tk 共用：掃 wp 層前兩箱，命中寫進 hits／soloIdx／partyIdx；soloColor 是非即開命中的顏色
function scanWpFirstTwo(eng, p, fIdx, uniSec, wpSet, soloColor, hits, soloIdx, partyIdx) {
  const soloNames = eng.chestItems(fIdx, uniSec == null ? 1 : uniSec);
  const partyNames = uniSec == null ? eng.chestItems(fIdx, 2) : soloNames;
  let found = false;
  const limit = Math.min(2, soloNames.length);
  for (let b = 0; b < limit; b++) {
    const s = soloNames[b], pp = partyNames[b];
    const sHit = wpSet.has(s), pHit = wpSet.has(pp);
    if (!sHit && !pHit) continue;
    let t = uniSec != null ? `${uniSec + CHEST_TIMER_OFFSET}s` : (sHit && pHit) ? STR_BOTH : (pHit ? STR_PARTY : STR_SOLO);
    let color = soloColor;
    if (uniSec != null) color = getQuickloadMark(p).mkColor;
    else if (t === STR_PARTY) color = "#ffd700";
    let rName = CHEST_RANK[eng.floors[fIdx].chests[b].rank] || '?';
    hits.push(`<span style="color:${color};font-size:11px">B${fIdx + 1}F ${rName}${b + 1}: ${pHit ? pp : s} (${t})</span>`);
    if (sHit) soloIdx.push(b);
    if (pHit) partyIdx.push(b);
    found = true;
  }
  return found;
}
const JFIRE_WP_SET = new Set(["Sainted soma"]);

function getWpChestCases(uniSec, wpPartyIdx, wpSoloIdx) {
  if (uniSec != null) return wpPartyIdx.length ? [wpPartyIdx] :(wpSoloIdx.length ? [wpSoloIdx] : []);
  const same = wpPartyIdx.length === wpSoloIdx.length && wpPartyIdx.every((v, i) => v === wpSoloIdx[i]);
  if (same) return wpPartyIdx.length ? [wpPartyIdx] : [];
  const cs = [];
  if (wpPartyIdx.length) cs.push(wpPartyIdx);
  if (wpSoloIdx.length) cs.push(wpSoloIdx);
  return cs;
}

function checkTKThirdChest(eng, floor, checkSec, laterSec, targets, laterTargets) {
  let valid = false, item = "", rank = "";
  if (eng.floorCount > floor && eng.floors[floor].chests.length >= 3) {
    item = eng.chestItem(floor, 2, checkSec);
    rank = CHEST_RANK[eng.floors[floor].chests[2].rank] || '?';
    if (targets.includes(item)) {
      const laterItem = eng.chestItem(floor, 2, laterSec);
      if (!laterTargets.includes(laterItem)) valid = true;
    }
  }
  return {valid, item, rank};
}

const DUNGEON_CHECKERS = {

  // 1. Quickload item x2~3 (B3/B4/B9)
  quickload: (eng, p) => scanQuickloadFloors(eng, p, QL_SOLO, QL_PARTY),

  // 1b. ⑨/⑤
  quickload9: (eng, p) => scanQuickloadFloors(eng, p, getQuickloadMark(p)),

  // 2. 3rd Chest
  third: (eng, p) => {
    let f1 = p.targetFloors[0], f2 = p.targetFloors[1];
    if (eng.floors[f1].chests.length >= 3 && eng.floors[f2].chests.length >= 3) {
      if (p.isS3 &&(eng.floors[f1].chests[2].rank !== 10 || eng.floors[f2].chests[2].rank !== 10)) {
        return {isHit:false};
      }
      let p1 = eng.chestItem(f1, 2, 2);
      let p2 = eng.chestItem(f2, 2, 2);
      let r1 = CHEST_RANK[eng.floors[f1].chests[2].rank] || '?';
      let r2 = CHEST_RANK[eng.floors[f2].chests[2].rank] || '?';

      if (p.checkItems.includes(p1) && p.checkItems.includes(p2)) {
        const res = {
          isHit: true, jumpFloor: f1,
          displayHtml: `B${f1 + 1}F ${r1}3: ${p1}<br>B${f2 + 1}F ${r2}3: ${p2}`
        };
        // D/5D/9D 整列箱 A*:完整顯示「順走 / 逆走」兩條路線；不代選路線，僅以較小値排序。
        // 順走=入口到 f1 S3，再下樓到 f2 S3；逆走=入口直下 f2 S3，再回樓上開 f1 S3。
        if (p.wantAstar) {
          const up1 = eng.floors[f1].up, c1 = eng.floors[f1].chests[2], c2 = eng.floors[f2].chests[2];
          const prefix = walkUpToFloor(eng, f1);
          const forward = reportWalk(joinWalks(
            prefix,
            pointWalk(eng, f1, up1.x, up1.y, c1.x, c1.y),
            crossFloorWalk(eng, f1, c1.x, c1.y, f2, c2.x, c2.y)
          ));
          const reverse = reportWalk(joinWalks(
            prefix,
            crossFloorWalk(eng, f1, up1.x, up1.y, f2, c2.x, c2.y),
            crossFloorWalk(eng, f2, c2.x, c2.y, f1, c1.x, c1.y)
          ));
          const vals = [forward, reverse];
          res.astar = minAstar(vals);
          res.astarText = vals.map(fmtStepD).join(' / ');
        }
        return res;
      }
    }
    return {isHit:false};
  },

  // 3a. JFire
  jfire: (eng, p) => {
    const uniSec = (p.qlSec == null) ? null : p.qlSec;
    const shift = uniSec == null ? 0 : uniSec - 2;
    const SOMA = "Sainted soma", ELIXIR = "Sage's elixir";

    const scanWp = (wpFloor, thirdFloors, chooseShortest) => {
      if (wpFloor >= eng.floorCount) return null;
      const wpBoxCount = eng.floors[wpFloor].chests.length;
      const wpHits = [], wpSoloIdx = [], wpPartyIdx = [];
      const wpMet = scanWpFirstTwo(eng, p, wpFloor, uniSec, JFIRE_WP_SET, "#f9d", wpHits, wpSoloIdx, wpPartyIdx);

      if (!wpMet ||(wpBoxCount >= 3 && eng.chestItem(wpFloor, 2, 2 + shift) === SOMA)) return null;

      const targets = [];
      for (const fIdx of thirdFloors) {
        if (fIdx >= eng.floorCount || eng.floors[fIdx].chests.length < 3 || eng.floors[fIdx].chests[2].rank !== 10) continue;
        const pItem = eng.chestItem(fIdx, 2, 2 + shift);
        if (pItem !== SOMA && pItem !== ELIXIR) continue;
        const target = {floor: fIdx, det: `B${fIdx + 1}F S3: ${pItem}`};
        if (p.wantAstar) {
          const c3 = eng.floors[fIdx].chests[2];
          const tgt = [{g:fIdx, gx:c3.x, gy:c3.y}];
          const vals = getWpChestCases(uniSec, wpPartyIdx, wpSoloIdx).map(bx => calcCrossFloorChestRouteCost(eng, wpFloor, bx, tgt));
          target.astar = minAstar(vals);
          if (vals.length === 2) target.astarText = `${fmtStepD(vals[0])} / ${fmtStepD(vals[1])}`;
        }
        targets.push(target);
      }
      if (targets.length === 0) return null;

      let best = targets[0];
      if (chooseShortest && p.wantAstar) {
        for (let i = 1; i < targets.length; i++) {
          const a = targets[i].astar == null ? Infinity : targets[i].astar;
          const b = best.astar == null ? Infinity : best.astar;
          if (a < b) best = targets[i];
        }
      }
      const html = `${wpHits.join('<br>')}<br><span style="color:#11F514;font-size:11px">${best.det}</span>`;
      const res = {isHit: true, jumpFloor: wpFloor, displayHtml: html};
      if (p.wantAstar) {
        res.astar = best.astar;
        if (best.astarText !== undefined) res.astarText = best.astarText;
      }
      return res;
    };

    const main = scanWp(8, [8, 9], false);
    if (!p.wantAstar) return main || {isHit:false};

    const extra = scanWp(9, [8, 9, 10], true);
    const multi = [];
    if (main) multi.push(Object.assign({floor: 8, isJfireB10: false}, main));
    if (extra) multi.push(Object.assign({floor: 9, isJfireB10: true}, extra));
    return multi.length > 0 ? {isHit: true, multi} : {isHit:false};
  },

  // 3b. TK (B3/B4)
  tk: (eng, p) => {
    let wpSet = new Set(p.wpTargets);
    let wpMet = false, wpFloor = 2;
    let wpHits = [];
    let wpSoloIdx = [], wpPartyIdx = [];
    const uniSec = (p.qlSec == null) ? null : p.qlSec;
    const shift = uniSec == null ? 0 : uniSec - 2;

    let checkWp = (fIdx) => {
      if (fIdx >= eng.floorCount) return false;
      if (!scanWpFirstTwo(eng, p, fIdx, uniSec, wpSet, "#f9b", wpHits, wpSoloIdx, wpPartyIdx)) return false;
      wpMet = true;
      wpFloor = fIdx;
      return true;
    };

    // 寶箱怪的邏輯
    if (p.isMonsterBox) {
      if (!checkWp(2)) return {isHit:false};

      let c1Met = false, matDet = "", b3Rank;
      if (eng.floorCount > 2 && eng.floors[2].chests.length >= 3) {
        b3Rank = CHEST_RANK[eng.floors[2].chests[2].rank] || '?';
        let foundSec = -1;

        // 在指定的秒數範圍內跑迴圈，找到任何一秒出寶箱怪即達標 (區間隨模式平移)
        for (let s = p.minSec + shift; s <= p.maxSec + shift; s++) {
          if (eng.chestItem(2, 2, s) === p.targetItem) {foundSec = s; break;}
        }
        if (foundSec !== -1) {
          c1Met = true;
          matDet = `B3F ${b3Rank}3 (${foundSec + CHEST_TIMER_OFFSET}s): ${p.targetItem}`;
        }
      }

      if (c1Met) {
        let html = `${wpHits.join('<br>')}<br><span style="color:#f66;font-size:11px;font-weight:bold;">${matDet}</span>`;
        const res = {isHit: true, jumpFloor: 2, displayHtml: html, specialStyle: "1px solid #f66"};
        // D 模式:B3F 上樓梯→wp命中箱→第3箱(同層);即開/一人旅命中組不同時各算各的,顯示「即開時格子數 / 一人旅時格子數」
        if (p.wantAstar) {
          const c3 = eng.floors[2].chests[2];
          const tgt = [{g:2, gx:c3.x, gy:c3.y}];
          const vals = getWpChestCases(uniSec, wpPartyIdx, wpSoloIdx).map(bx => calcCrossFloorChestRouteCost(eng, 2, bx, tgt));
          res.astar = minAstar(vals);
          if (vals.length === 2) res.astarText = `${fmtStepD(vals[0])} / ${fmtStepD(vals[1])}`;
        }
        return res;
      }
      return {isHit:false};
    }

    // 一般物品與大富豪的邏輯
    if (!checkWp(2)) checkWp(3);
    if (!wpMet) return {isHit:false};

    let c1Met = false, c2Met = false, matDet = "";

    let currentB3Targets = p.isMillionaire ?(wpFloor === 2 ? p.strictMatTargets : p.broadMatTargets) : p.strictMatTargets;
    let currentB4Targets = p.isMillionaire ?(wpFloor === 3 ? p.strictMatTargets : p.broadMatTargets) : p.strictMatTargets;

    let checkSec = (p.isMillionaire ? 2 : 8) + shift;
    let labelText = p.isMillionaire ? "" : `(${checkSec + CHEST_TIMER_OFFSET}s)`;

    // 檢査 B3F 第 3 箱
    const {valid:b3V, item:pB3, rank:b3Rank} = checkTKThirdChest(eng, 2, checkSec, 20+shift,
      currentB3Targets, p.isMillionaire ? p.strictMatTargets : currentB3Targets);

    // 檢査 B4F 第 3 箱
    const {valid:b4V, item:pB4, rank:b4Rank} = checkTKThirdChest(eng, 3, checkSec, 20+shift,
      currentB4Targets, p.isMillionaire ? p.strictMatTargets : currentB4Targets);

    // 結算命中狀態，並動態加上對應的標籤
    if (b3V && b4V) {c2Met = true; matDet = `B3F ${b3Rank}3 ${labelText}: ${pB3}<br>B4F ${b4Rank}3 ${labelText}: ${pB4}`;}
    else if (b3V) {c1Met = true; matDet = `B3F ${b3Rank}3 ${labelText}: ${pB3}`;}
    else if (b4V) {c1Met = true; matDet = `B4F ${b4Rank}3 ${labelText}: ${pB4}`;}

    if (c1Met || c2Met) {
      let html = `${wpHits.join('<br>')}<br><span style="color:#11F514;font-size:11px">${matDet}</span>`;
      const res = {isHit: true, jumpFloor: wpFloor, displayHtml: html, specialStyle: c2Met ? "1px solid #fa0" : ""};
      // D 模式體感 A*:wp層前各層梯到梯之和 + 上樓梯→wp命中箱 + wp末箱→整列箱(跨層經樓梯段)
      // wp 即開/一人旅命中組不同時不可混走一條鏈 → 各算各的,顯示兩數「即開時格子數 / 一人旅時格子數」(雙整列時各取三選項最小)
      // 單案例且雙整列(c2Met)列三數「只取B3F整列 / 只取B4F整列 / 兩顆都取」;排序鍵一律取所列最小
      if (p.wantAstar) {
        const t3 = b3V ? {g: 2, gx: eng.floors[2].chests[2].x, gy: eng.floors[2].chests[2].y} : null;
        const t4 = b4V ? {g: 3, gx: eng.floors[3].chests[2].x, gy: eng.floors[3].chests[2].y} : null;
        const cases = getWpChestCases(uniSec, wpPartyIdx, wpSoloIdx);
        if (cases.length === 1) {
          if (c2Met) {
            const a3 = calcCrossFloorChestRouteCost(eng, wpFloor, cases[0], [t3]);
            const a4 = calcCrossFloorChestRouteCost(eng, wpFloor, cases[0], [t4]);
            const ab = calcCrossFloorChestRouteCost(eng, wpFloor, cases[0], [t3, t4]);
            res.astar = minAstar([a3, a4, ab]);
            res.astarText = `${fmtStepD(a3)} / ${fmtStepD(a4)} / ${fmtStepD(ab)}`;
          } else {
            res.astar = calcCrossFloorChestRouteCost(eng, wpFloor, cases[0], [b3V ? t3 : t4]);
          }
        } else if (cases.length === 2) {
          const vals = cases.map(bx => c2Met
            ? minAstar([calcCrossFloorChestRouteCost(eng, wpFloor, bx, [t3]), calcCrossFloorChestRouteCost(eng, wpFloor, bx, [t4]), calcCrossFloorChestRouteCost(eng, wpFloor, bx, [t3, t4])])
            : calcCrossFloorChestRouteCost(eng, wpFloor, bx, [b3V ? t3 : t4]));
          res.astar = minAstar(vals);
          res.astarText = `${fmtStepD(vals[0])} / ${fmtStepD(vals[1])}`;
        }
      }
      return res;
    }
    return {isHit:false};
  }
};


return {
    TreasureMap, MAP_RANK, CHEST_RANK, hex2, resolveRankKey, resetLocationCache,
    checkUltimateCondsMatch, checkOnlyMonPossible, checkElistAndD, chestCondsMatch,
    sharedRankFilter, buildOnlyMonExpectedStr,
    ITEM_BASIC_REQS, DUNGEON_CHECKERS, filterMapRanksBySMRAndChest, getChestRanksForItems,
    expandItemGroup, b3fThreeItems, ITEMS_MILLIONAIRE, ITEMS_MILLIONAIRE_BOX3, row4, D_C, NO_ROW,
    PREFIX_NAMES, SUFFIX_NAMES, LOCALE_NAMES, ENV_NAMES, BOSS_NAMES, MONSTER_DB, ONLY_MONSTERS,
    LOCATION_SEED_MAX, hasConditionValue, isCombinedElistMonsterSearch, parseLocationCode, parseBaseQuality,
    listVisitOrders,
};
}
