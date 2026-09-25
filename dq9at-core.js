function DQ9AT_CORE(overrides) {
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

const MAP_RANK=[0x02,0x38,0x3D,0x4C,0x51,0x65,0x79,0x8D,0xA1,0xB5,0xC9,0xDD];
const CHEST_RANK={10:'S',9:'A',8:'B',7:'C',6:'D',5:'E',4:'F',3:'G',2:'H',1:'I'};
const ENV_OPTS=[['Caves','洞窟'],['Ruins','遺跡'],['Ice','氷'],['Water','水'],['Fire','火山']];
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

function lcg(seed) {const r = new tkg.LCG(seed);r.next();return r.seed;}
function atFromRng(rng) {return (rng >>> 16) & 0x7FFF;}

function row4(t,rows,v,dft) {
  for (let i=0;i<rows;i++) {const b=i*4;if (v>=t[b]&&v<=t[b+1]) return[t[b+2],t[b+3]];}
  return dft;
}
const NO_ROW=[1,0];

function selectChestItem(rank, roll) {
  const start = D_O[rank-1], end = D_O[rank];
  let weight = 0;
  for (let i = start; i < end; i++) {
    weight += D_P[i];
    if (roll < weight) return D_R[D_Q[i]];
  }
  return null;
}

function tkgFloor(seed, index1) {
  const fd = overrides.floor(seed, index1);
  if (!fd.layout) {
    const ctx = fd.context, {grid, width, height} = fd.info;
    const spots = (ctx.field_0._chestCoords || []).slice(0, ctx.field_0.chestCount).map(c => ({x: c.x, y: c.y}));
    fd.layout = {index: index1, width, height, grid, up: ctx.upStairs, down: ctx.downStairs, spots, cache: {}};
  }
  return fd.layout;
}

const randomFrom = seed => new tkg.LCG(seed >>> 0);
const rollBetween = (r, lo, hi) => lo + r.next() % (hi - lo + 1);
function rollInRow(r, table, rows, key) {
  const range = row4(table, rows, key, null);
  return range ? rollBetween(r, range[0], range[1]) : 0;
}
const rollScaled = (r, n) => (Math.fround(r.next() - 1) * n / 32767) >>> 0;

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

function rollChestRank(r, floorMR) {
  const lo = D_F[(floorMR - 1) * 4 + 1], hi = D_F[(floorMR - 1) * 4 + 2];
  return lo + (Math.fround((hi - lo + 1) * Math.fround(r.next() - 1) / 32767) >>> 0);
}

class TreasureMap {
  constructor(seed, rank) {
    Object.assign(this, {seed, rank, env: 0, floorCount: 0, smr: 0, boss: 0, prefix: 0, suffix: 0, lv: 0, locale: 0});
    this.floors = null;
    if (rank < 2 || rank > 248) return;
    const r = randomFrom(seed);
    for (let i = 0; i < 13; i++) r.next();
    this.env = tkg.envIndices[tkg.getEnvironment(seed.toString(16))] + 1;
    this.floorCount = rollInRow(r, D_B, 9, rank);
    this.smr = rollInRow(r, D_C, 8, rank);
    this.boss = rollBoss(r, rank);
    for (let i = 0; i < 12; i++) r.next();
    this.prefix = rollInRow(r, D_H, 5, this.smr);
    this.suffix = rollInRow(r, D_I, 4, this.boss);
    const area = rollInRow(r, D_G, 8, this.floorCount);
    this.lv = Math.max(1, Math.min(99, (this.boss + this.floorCount + this.smr - 4) * 3 + (r.next() % 11 - 5)));
    this.locale = LOCALE_INDEX[(area - 1) * 5 + this.env - 1];
  }

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

const MONSTER_DB = {
  "008":{en:"Lost Soul",jp:"さまようたましい",g:20},
  "00B":{en:"Mushroom Mage",jp:"マージマタンゴ",g:16},
  "00E":{en:"Purrestidigitator",jp:"ベンガルクーン",g:16},
  "012":{en:"Sootheslime",jp:"ベホイムスライム",g:20},
  "013":{en:"Cureslime",jp:"ベホマスライム",g:16},
  "015":{en:"Robo-robin",jp:"アイアンクック",g:16},
  "01B":{en:"Liquid Metal Slime",jp:"はぐれメタル",g:16},
  "022":{en:"Dread Admiral",jp:"しびれあげは",g:16},
  "026":{en:"Cannibox",jp:"ひとくいばこ",g:16},
  "027":{en:"Mimic",jp:"ミミック",g:12},
  "028":{en:"Pandora's Box",jp:"パンドラボックス",g:20},
  "02A":{en:"Raving Lunatick",jp:"メーダロード",g:16},
  "02C":{en:"Goodybag",jp:"おどるほうせき",g:16},
  "02E":{en:"Hell Niño",jp:"ヒートギズモ",g:16},
  "02F":{en:"Freezing Fog",jp:"フロストギズモ",g:16},
  "031":{en:"Grim Grinner",jp:"ダークホビット",g:16},
  "034":{en:"Sluggernaut",jp:"スーパーテンツク",g:20},
  "035":{en:"Sluggerslaught",jp:"ラストテンツク",g:16},
  "036":{en:"Pink Sanguini",jp:"ピンクモーモン",g:16},
  "037":{en:"Genie Sanguini",jp:"マポレーナ",g:12},
  "03B":{en:"Scourgette",jp:"ブラックベジター",g:20},
  "03D":{en:"Salamarauder",jp:"かいぞくウーパー",g:20},
  "03E":{en:"Axolhotl",jp:"ウパパロン",g:12},
  "040":{en:"Bagma",jp:"ようがんピロー",g:16},
  "04C":{en:"Metal Medley",jp:"メタルブラザーズ",g:20},
  "04D":{en:"Gem Jamboree",jp:"ゴールデントーテム",g:20},
  "051":{en:"Giddy Gastropog",jp:"メダパニつむり",g:16},
  "052":{en:"Gloomy Gastropog",jp:"ダークデンデン",g:16},
  "053":{en:"Earthenwarrior",jp:"はにわナイト",g:16},
  "056":{en:"Skeleton Soldier",jp:"死霊の騎士",g:32},
  "057":{en:"Dark Skeleton",jp:"影の騎士",g:24},
  "059":{en:"Diethon",jp:"ヘルバイパー",g:16},
  "05A":{en:"Sail Serpent",jp:"オーシャンナーガ",g:20},
  "05D":{en:"Belisha Beakon",jp:"アカイライ",g:12},
  "05E":{en:"Lesionnaire",jp:"がいこつ兵",g:20},
  "05F":{en:"Deadcurion",jp:"しにがみ兵",g:20},
  "060":{en:"Stenchurion",jp:"ゾンビナイト",g:16},
  "062":{en:"Teaky Mask",jp:"トーテムキラー",g:16},
  "063":{en:"Bewarewolf",jp:"リカント",g:12},
  "065":{en:"Scarewolf",jp:"リカントマムル",g:16},
  "067":{en:"Toxic Zombie",jp:"どくどくゾンビ",g:16},
  "068":{en:"Ghoul",jp:"グール",g:8},
  "06A":{en:"Spinchilla",jp:"うずしおキング",g:16},
  "06B":{en:"Whirly Girly",jp:"レッドサイクロン",g:20},
  "06D":{en:"Mummy",jp:"マミー",g:8},
  "06E":{en:"Blood Mummy",jp:"ブラッドマミー",g:16},
  "070":{en:"Wyrtoise",jp:"ガメゴンロード",g:16},
  "072":{en:"Rampage",jp:"ゴートドン",g:12},
  "074":{en:"Rockbomb",jp:"ばくだん岩",g:20},
  "076":{en:"Bomboulder",jp:"メガザルロック",g:16},
  "077":{en:"Restless Armour",jp:"さまようよろい",g:16},
  "078":{en:"Infernal Armour",jp:"じごくのよろい",g:16},
  "079":{en:"Lethal Armour",jp:"キラーアーマー",g:16},
  "07B":{en:"Metal Slime Knight",jp:"メタルライダー",g:16},
  "07C":{en:"Swinoceros",jp:"突げきホーン",g:20},
  "07D":{en:"Splatterhorn",jp:"ライノキング",g:16},
  "07F":{en:"Admirer",jp:"ジェリーマン",g:16},
  "080":{en:"Live Lava",jp:"マグマロン",g:12},
  "082":{en:"Big Badboon",jp:"バブーン",g:12},
  "083":{en:"Brainy Badboon",jp:"ヒババンゴ",g:12},
  "084":{en:"Magus",jp:"まじゅつし",g:12},
  "086":{en:"Sorcerer",jp:"ようじゅつし",g:16},
  "087":{en:"Mandrake Major",jp:"リザードマン",g:16},
  "088":{en:"Mandrake Marauder",jp:"りゅう兵士",g:20},
  "089":{en:"Mandrake Marshal",jp:"シュプリンガー",g:16},
  "08B":{en:"Treevil",jp:"ウドラー",g:12},
  "08C":{en:"Chimaera",jp:"キメラ",g:8},
  "08D":{en:"Hocus Chimaera",jp:"メイジキメラ",g:16},
  "08F":{en:"Raving Reaper",jp:"アサシンドール",g:16},
  "092":{en:"Badja",jp:"ブラックタヌー",g:16},
  "094":{en:"Corrupt Carter",jp:"エビルチャリオット",g:20},
  "095":{en:"Mortoad",jp:"ガマキャノン",g:16},
  "096":{en:"Expload",jp:"デザートタンク",g:16},
  "097":{en:"Blastoad",jp:"キャノンキング",g:16},
  "099":{en:"Peckerel",jp:"アサシンエミュー",g:20},
  "09D":{en:"Knocktopus",jp:"ニードルオクト",g:16},
  "09E":{en:"Shocktopus",jp:"オクトスパイカー",g:20},
  "09F":{en:"Manguini",jp:"アーゴンデビル",g:16},
  "0A0":{en:"Bloody Manguini",jp:"ブラッドアーゴン",g:20},
  "0A2":{en:"Great Gruffon",jp:"ビッグボック",g:16},
  "0A3":{en:"Gramarye Gruffon",jp:"アロダイタス",g:16},
  "0A4":{en:"Trigertaur",jp:"タイガーランス",g:16},
  "0A5":{en:"White Trigertaur",jp:"ホワイトランサー",g:20},
  "0A6":{en:"Sick Trigertaur",jp:"キマライガー",g:16},
  "0A7":{en:"Moosifer",jp:"アンクルホーン",g:16},
  "0A8":{en:"Barbatos",jp:"ヘルバトラー",g:16},
  "0A9":{en:"Green Dragon",jp:"グリーンドラゴン",g:20},
  "0AA":{en:"Red Dragon",jp:"レッドドラゴン",g:16},
  "0AB":{en:"Rashaverak",jp:"アンドレアル",g:16},
  "0AC":{en:"Living Statue",jp:"うごくせきぞう",g:16},
  "0AE":{en:"Drakularge",jp:"ギガントヒルズ",g:16},
  "0AF":{en:"Drakulard",jp:"ギガントドラゴン",g:20},
  "0B0":{en:"Drakulord",jp:"ドラゴン・ウー",g:16},
  "0B1":{en:"Hunter Mech",jp:"メタルハンター",g:16},
  "0B2":{en:"Killing Machine",jp:"キラーマシン",g:16},
  "0B3":{en:"King Slime",jp:"キングスライム",g:16},
  "0B4":{en:"King Cureslime",jp:"スライムベホマズン",g:20},
  "0B5":{en:"Metal King Slime",jp:"メタルキング",g:16},
  "0B6":{en:"Cumulus Rex",jp:"くもの大王",g:28},
  "0B7":{en:"Cumulus Vex",jp:"ヘルクラウダー",g:16},
  "0B8":{en:"Darkonium Slime",jp:"スライムマデュラ",g:20},
  "0B9":{en:"Gem Slime",jp:"ゴールデンスライム",g:20},
  "0BA":{en:"Stone Golem",jp:"ストーンマン",g:16},
  "0BB":{en:"Gold Golem",jp:"ゴールドマン",g:16},
  "0BC":{en:"Golem",jp:"ゴーレム",g:12},
  "0BD":{en:"Drackal",jp:"ストロングアニマル",g:20},
  "0BE":{en:"Drastic Drackal",jp:"ヘルジャッカル",g:16},
  "0C0":{en:"Harmour",jp:"デビルアーマー",g:16},
  "0C1":{en:"Bad Karmour",jp:"てっこうまじん",g:16},
  "0C2":{en:"Alarmour",jp:"サタンメイル",g:16},
  "0C3":{en:"Fright Knight",jp:"ナイトリッチ",g:16},
  "0C4":{en:"Night Knight",jp:"ナイトキング",g:16},
  "0C5":{en:"Terrorhawk",jp:"マッドファルコン",g:20},
  "0C6":{en:"Prism Peacock",jp:"にじくじゃく",g:16},
  "0C7":{en:"Bird of Terrordise",jp:"れんごくまちょう",g:20},
  "0C8":{en:"Mad Moai",jp:"ビッグモアイ",g:16},
  "0C9":{en:"Mega Moai",jp:"ゴードンヘッド",g:16},
  "0CA":{en:"Sculptrice",jp:"ヘルビースト",g:16},
  "0CB":{en:"Sculpture Vulture",jp:"リビングスタチュー",g:20},
  "0CC":{en:"Aggrosculpture",jp:"ウィングデビル",g:16},
  "0CD":{en:"Wight Priest",jp:"デスプリースト",g:16},
  "0CE":{en:"Wight King",jp:"ワイトキング",g:16},
  "0CF":{en:"Claw Hammer",jp:"ヘルマリーン",g:16},
  "0D0":{en:"Power Hammer",jp:"サンドシャーク",g:16},
  "0D4":{en:"Python Priest",jp:"スネークロード",g:16},
  "0D5":{en:"Cobra Cardinal",jp:"じごくのメンドーサ",g:20},
  "0D6":{en:"Tantamount",jp:"れんごく天馬",g:24},
  "0D7":{en:"Godsteed",jp:"レジェンドホース",g:20},
  "0D9":{en:"Cyclops",jp:"サイクロプス",g:16},
  "0DA":{en:"Gigantes",jp:"ギガンテス",g:12},
  "0DC":{en:"Troll",jp:"トロル",g:8},
  "0DD":{en:"Boss Troll",jp:"ボストロール",g:16},
  "0DE":{en:"Great Troll",jp:"トロルキング",g:16},
  "0DF":{en:"Magmalice",jp:"ようがんまじん",g:16},
  "0E0":{en:"Firn Fiend",jp:"ひょうがまじん",g:16},
  "0E2":{en:"Slionheart",jp:"ゴッドライダー",g:16},
  "0E4":{en:"AU-1000",jp:"ゴールドマジンガ",g:20},
  "0E5":{en:"Void Droid",jp:"ファイナルウェポン",g:20},
  "0E6":{en:"Alphyn",jp:"キマイラロード",g:16},
  "0E7":{en:"Vermil Lion",jp:"じごくのヌエ",g:16},
  "0E8":{en:"Shivery Shrubbery",jp:"デビルスノー",g:16},
  "0E9":{en:"Apeckalypse",jp:"ランドンクイナ",g:16},
  "0EB":{en:"Wonder Wyrtle",jp:"ガメゴンレジェンド",g:20},
  "0EC":{en:"Geothaum",jp:"あんこくまじん",g:16},
  "0ED":{en:"Cosmic Chimaera",jp:"スターキメラ",g:16},
  "0EE":{en:"Master Moosifer",jp:"デスカイザー",g:16},
  "0EF":{en:"Freaky Tiki",jp:"まおうのかめん",g:16},
  "0F0":{en:"Mandrake Monarch",jp:"まかいファイター",g:20},
  "0F1":{en:"Cumulus Hex",jp:"ヘルミラージュ",g:16},
  "0F2":{en:"Platinum King Jewel",jp:"プラチナキング",g:16},
  "0F3":{en:"Charmour",jp:"マジックアーマー",g:20},
  "0F4":{en:"Blight Knight",jp:"ヴァルハラー",g:16},
  "0F5":{en:"Moai Minstrel",jp:"クラウンヘッド",g:16},
  "0F6":{en:"Grrrgoyle",jp:"ホラービースト",g:16},
  "0F7":{en:"Wight Emperor",jp:"ロードコープス",g:16},
  "0F8":{en:"Boogie Manguini",jp:"イエローサタン",g:16},
  "0F9":{en:"Barriearthenwarrior",jp:"ちていのばんにん",g:20},
  "0FA":{en:"Grim Reaper",jp:"メフィストフェレス",g:20},
  "0FB":{en:"Bling Badger",jp:"ゴールドタヌ",g:16},
  "0FC":{en:"Flamin' Drayman",jp:"じごくぐるま",g:16},
  "0FD":{en:"Hammer Horror",jp:"ダークマリーン",g:16},
  "0FE":{en:"Boa Bishop",jp:"ビュアール",g:12},
  "0FF":{en:"Handsome Crab",jp:"ガニラス",g:12},
  "101":{en:"Crabber Dabber Doo",jp:"じごくのハサミ",g:16},
  "102":{en:"King Crab",jp:"キラークラブ",g:16},
  "103":{en:"Icikiller",jp:"アイスビックル",g:16},
  "104":{en:"Riptide",jp:"オーシャンクロー",g:20},
  "105":{en:"Claws",jp:"クローハンズ",g:16},
  "106":{en:"Seasaur",jp:"ギャオース",g:12},
  "107":{en:"Abyss Diver",jp:"ヘルダイバー",g:16},
  "108":{en:"Seavern",jp:"シーバーン",g:12},
  "109":{en:"Terror Troll",jp:"ダークトロル",g:16},
  "10C":{en:"Prime Slime",jp:"デンガー",g:12},
  "141":{en:"Octagoon",jp:"アイアンブルドー",g:20},
  "143":{en:"Cannibelle",jp:"ヘルヴィーナス",g:16},
  "144":{en:"Scarlet Fever",jp:"エビルフレイム",g:16},
  "145":{en:"Uncommon Cold",jp:"マッドブリザード",g:20},
  "147":{en:"Stale Whale",jp:"だいおうクジラ",g:16},
  "148":{en:"Pale Whale",jp:"オーシャンボーン",g:20},
  "149":{en:"Widow's Pique",jp:"デスタランチュラ",g:20},
  "14A":{en:"Cyber Spider",jp:"ボーンスパイダ",g:16},
  "14B":{en:"Slugly Betsy",jp:"うみうしひめ",g:16},
  "14D":{en:"Hell's Gatekeeper",jp:"ヘルガーディアン",g:20},
  "14E":{en:"Wishmaster",jp:"ギリメカラ",g:12},
  "025":{en:"Jinkster",jp:"ひとつめピエロ"},
  "032":{en:"Gum Shield",jp:"ビッグフェイス"},
  "04B":{en:"Slime Stack",jp:"スライムタワー"},
  "054":{en:"Brrearthenwarrior",jp:"ふゆしょうぐん"},
  "05C":{en:"Weaken Beakon",jp:"デッドペッカー"},
  "064":{en:"Tearwolf",jp:"キラーリカント"},
  "08A":{en:"Treeface",jp:"じんめんじゅ"},
  "0AD":{en:"Stone Guardian",jp:"だいまじん"},
  "100":{en:"Crabid",jp:"ぐんたいガニ"},
};

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

function floorMRAt(baseMR,f) {return Math.min(12,baseMR+(f>>2));}

function getSpawnList(envType,floorMR) {return (SPAWN_DB[envType] && SPAWN_DB[envType][floorMR]) || [];}

function getMonsterDisplayName(hx) {
  const m = MONSTER_DB[hx];
  return m ?(m.en) : hx;
}

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

  const C = 4128-(W*16+X*8);
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

  const floor = map.floors[f];
  const {A,B,D} = floor.cache.elist ||(floor.cache.elist = elistTileStats(floor));

  const isIce10_12 =(envType === 3 && floorMR >= 10 && floorMR <= 12);
  const isRuins3 =(envType === 2 && floorMR === 3);
  const isIce1 =(envType === 3 && floorMR === 1);

  const F = (isIce10_12 || isRuins3 || isIce1) ? 7 : 8;
  const ElistOfs = A+4+(B*8)+(D*4)+(F*20)+(F*8)+G;

  const val = ElistOfs;
  let state = null;

  if (val<=0x2B30) {
    if (D !== 0) state = EL_P;
  } else if (val>=0x2B34) {
    const isExc1 = isIce10_12 || isRuins3;
    const isExc2 = (envType===2&&floorMR===7)||(envType===5&&(floorMR===3||floorMR===4))||(envType===3&&floorMR===2)||(envType===4&&floorMR===4);
    const isExc4 = isIce1;
    const isExc5 =(envType===1&&floorMR===1);
    const EL_diff = Math.floor((val-0x2B34)/20);
    switch (EL_diff) {
      case 0: state = (isExc1||isExc4) ? (D!== 0?EL_P:null) : EL_4;break;
      case 1: state = EL_3;break;
      case 2: state = isExc5 ? EL_3+EL_NP : EL_2;break;
      case 3: state = isExc5 ? EL_3+EL_NM : `${onlyMon}${strOnly}`;break;
      case 4: state = isExc5 ? EL_3+EL_NC : (isExc4||isExc2?`${onlyMon}${strOnly}${EL_NP}`:EL_0);break;
      case 5: state = isExc5 ? EL_2+EL_NC : (isExc4||isExc2?`${onlyMon}${strOnly}${EL_NM}`:EL_0+EL_NP);break;
      case 6: state = (isExc4||isExc2||isExc5) ? `${onlyMon}${strOnly}${EL_NC}` : EL_0+EL_NM;break;
      default: state = EL_0+EL_NC;break;
    }
  }
  if(state!==null)state=String(state);
  return{hex:ElistOfs.toString(16).toUpperCase(),state:state,dValue:D};
}

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

const calcPointWalkCost = overrides && overrides.calcPointWalkCost;

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

function walkUpToFloor(eng,upTo){
  const parts=[];
  for(let f=0;f<upTo;f++){const fl=eng.floors[f];parts.push(pointWalk(eng,f,fl.up.x,fl.up.y,fl.down.x,fl.down.y));}
  return joinWalks(NO_WALK,...parts);
}

const listVisitOrders=(n)=>n===2?[[0,1],[1,0]]:[Array.from({length:n},(_,i)=>i)];

function calcSameFloorChestChainCost(eng,floor,boxes){
  const sum=walkUpToFloor(eng,floor);
  if(sum===null)return reportWalk(null);
  const fl=eng.floors[floor];
  const n=boxes.length;
  const px=[fl.up.x],py=[fl.up.y];
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

function crossFloorWalk(eng,f,x,y,g,gx,gy){
  if(f===g)return pointWalk(eng,f,x,y,gx,gy);
  const ff=eng.floors[f],fg=eng.floors[g];
  if(g===f+1)return joinWalks(pointWalk(eng,f,x,y,ff.down.x,ff.down.y),pointWalk(eng,g,fg.up.x,fg.up.y,gx,gy));
  return joinWalks(pointWalk(eng,f,x,y,ff.up.x,ff.up.y),pointWalk(eng,g,fg.down.x,fg.down.y,gx,gy));
}

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

const BQ_MIN = 2, BQ_MAX = 248;
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

function hex2(n) {return n.toString(16).toUpperCase().padStart(2,'0');}

function buildOnlyMonExpectedStr(conds) {
  if (!((conds!==null&&conds!==void 0)&&conds.onlyMon))return'';
  return (conds.onlyMon) + EL_ONLY;
}

function resolveRankKey(rStr,rankNum) {
  return RANKS[rStr] ? rStr : (RANKS["0x"+rStr]?"0x"+rStr:((rankNum!==undefined&&RANKS[rankNum])?rankNum:null));
}

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

function isCombinedOnlyHit(envType,floorMR,onlyMonNameStr) {
  if (!getSpawnList(envType,floorMR).length) return false;
  return matchesOnlyMonFloor(envType,floorMR,onlyMonNameStr);
}

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

  if (conds && hasConditionValue(conds.bq)) {
    const bounds = getFinalQualityBounds(conds.bq);
    if (!bounds) return null;
    const {minFinalQ, maxFinalQ} = bounds;
    const rankInfo = RANKS[rStr];
    if (rankInfo &&(maxFinalQ < rankInfo.fqMin || minFinalQ > rankInfo.fqMax)) return null;
  }

  const [minSMR, maxSMR] = row4(D_C, 8, rank, [1, 9]);

  if ((conds!==null&&conds!==void 0)&&conds.monster){
    let targetSMR = parseInt(conds.monster);
    if (targetSMR < minSMR || targetSMR > maxSMR) return null;
  }

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

  const [minBoss, maxBoss] = row4(D_D, 9, rank, [1, 12]);
  if ((conds!==null&&conds!==void 0)&&conds.boss){
    let b = parseInt(conds.boss);
    if (b < minBoss || b > maxBoss) return null;
  }

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

function chestCondsMatch(engine,conds){
  if (!conds.hasBoxCond) return true;
  for (let r=10;r>=1;r--) if (conds.reqBox[r]>0 && engine.chestRankCounts[r-1] !== conds.reqBox[r]) return false;
  return true;
}

const fmtStep = v => Number.isInteger(v) ? '' + v : v.toFixed(1);
const fmtStepD = v => v == null ? '—' : fmtStep(v);
const minAstar = arr => {const m = Math.min(...arr.map(v => v == null ? Infinity : v));return m === Infinity ? null : m;};

const CHEST_TIMER_OFFSET = 5;

const meetsQuickloadBasicReq = (eng, p, conds) => eng.floorCount >=(p.isB9F ? 9 : 3) && filterMapRanksBySMRAndChest([eng.rank], conds, [p.chestRanks], p.isB9F ? 2 : 0).length > 0;

const ITEM_BASIC_REQS = {
  quickload: meetsQuickloadBasicReq,
  quickload9: meetsQuickloadBasicReq,
  third: (eng, p, conds) => eng.floorCount >=(p.isS3 ? 14 : 4) && filterMapRanksBySMRAndChest([eng.rank], conds, [p.chestRanks], p.isS3 ? 3 : 0).length > 0,
  jfire: eng => eng.smr === 9 && eng.floorCount >= 9,
  tk: eng => eng.floorCount >= 3,
};

const QL_MARK_5 = {sec: 0, mk: '⑤', mkColor: '#7fd4ff'}, QL_MARK_9 = {sec: 4, mk: '⑨', mkColor: '#b19cd9'};
const getQuickloadMark = (p) => (p.qlSec === 0 ? QL_MARK_5 : QL_MARK_9);
const QL_SOLO = {sec: 1, mk: STR_SOLO, mkColor: '#f9b'}, QL_PARTY = {sec: 2, mk: STR_PARTY, mkColor: '#ffd700'};

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

function scanQuickloadFloors(eng, p, modeA, modeB) {
  const checkSet = new Set(p.checkItems);
  let hitTypes = [];
  let firstHitFloor = -1;
  let astarBoxes = null, astarFloor = -1;
  const useB10 = !!(p.checkB10 && p.isB9F);
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

  quickload: (eng, p) => scanQuickloadFloors(eng, p, QL_SOLO, QL_PARTY),

  quickload9: (eng, p) => scanQuickloadFloors(eng, p, getQuickloadMark(p)),

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

    if (p.isMonsterBox) {
      if (!checkWp(2)) return {isHit:false};

      let c1Met = false, matDet = "", b3Rank;
      if (eng.floorCount > 2 && eng.floors[2].chests.length >= 3) {
        b3Rank = CHEST_RANK[eng.floors[2].chests[2].rank] || '?';
        let foundSec = -1;

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

    if (!checkWp(2)) checkWp(3);
    if (!wpMet) return {isHit:false};

    let c1Met = false, c2Met = false, matDet = "";

    let currentB3Targets = p.isMillionaire ?(wpFloor === 2 ? p.strictMatTargets : p.broadMatTargets) : p.strictMatTargets;
    let currentB4Targets = p.isMillionaire ?(wpFloor === 3 ? p.strictMatTargets : p.broadMatTargets) : p.strictMatTargets;

    let checkSec = (p.isMillionaire ? 2 : 8) + shift;
    let labelText = p.isMillionaire ? "" : `(${checkSec + CHEST_TIMER_OFFSET}s)`;

    const {valid:b3V, item:pB3, rank:b3Rank} = checkTKThirdChest(eng, 2, checkSec, 20+shift,
      currentB3Targets, p.isMillionaire ? p.strictMatTargets : currentB3Targets);

    const {valid:b4V, item:pB4, rank:b4Rank} = checkTKThirdChest(eng, 3, checkSec, 20+shift,
      currentB4Targets, p.isMillionaire ? p.strictMatTargets : currentB4Targets);

    if (b3V && b4V) {c2Met = true; matDet = `B3F ${b3Rank}3 ${labelText}: ${pB3}<br>B4F ${b4Rank}3 ${labelText}: ${pB4}`;}
    else if (b3V) {c1Met = true; matDet = `B3F ${b3Rank}3 ${labelText}: ${pB3}`;}
    else if (b4V) {c1Met = true; matDet = `B4F ${b4Rank}3 ${labelText}: ${pB4}`;}

    if (c1Met || c2Met) {
      let html = `${wpHits.join('<br>')}<br><span style="color:#11F514;font-size:11px">${matDet}</span>`;
      const res = {isHit: true, jumpFloor: wpFloor, displayHtml: html, specialStyle: c2Met ? "1px solid #fa0" : ""};
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
