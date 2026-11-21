(() => {
  'use strict';

  // Polyfill CanvasRenderingContext2D.prototype.roundRect for older iPadOS / iOS Safari (< 15.4)
  if (
    typeof CanvasRenderingContext2D !== 'undefined' &&
    typeof CanvasRenderingContext2D.prototype.roundRect !== 'function'
  ) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
      const rawR = Array.isArray(radii) ? Number(radii[0]) || 0 : Number(radii) || 0;
      const r = Math.max(0, Math.min(rawR, Math.min(w, h) / 2));
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  const SEAL_TIME_BUCKET_MS = 12 * 60 * 60 * 1000;
  const EGG_SESSION_KEY = 'te_egg_session_k';

  function getDeviceBindingString() {
    const storageKey = 'te_device_seal_id';
    let devId = '';
    try {
      devId = window.localStorage.getItem(storageKey) || '';
    } catch (_e) {
      devId = 'no-ls';
    }
    if (!devId) devId = 'no-ls';
    let tz = '';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (_e) {
      tz = '';
    }
    const scr = window.screen
      ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
      : '';
    return [
      devId,
      navigator.userAgent || '',
      navigator.language || '',
      tz,
      scr,
      String(navigator.hardwareConcurrency || ''),
    ].join('|');
  }

  function deriveDeviceMaskBytes(seedStr, length) {
    let h1 = 2166136261 >>> 0;
    let h2 = 3735928559 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      const ch = seedStr.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ (ch + i), 2246822519) >>> 0;
    }
    const mask = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      h1 = (Math.imul(h1, 1664525) + 1013904223) >>> 0;
      h2 ^= h2 << 13;
      h2 ^= h2 >>> 17;
      h2 ^= h2 << 5;
      h2 = h2 >>> 0;
      mask[i] = ((h1 >>> 16) ^ (h2 >>> 8)) & 0xff;
    }
    return mask;
  }

  function unbindDeviceKey(boundHex, tStr) {
    if (!boundHex || !tStr) return '';
    if (!/^[0-9a-f]+$/i.test(boundHex) || boundHex.length % 2 !== 0) return '';
    const tNum = Number(tStr);
    if (!Number.isInteger(tNum)) return '';
    const currentBucket = Math.floor(Date.now() / SEAL_TIME_BUCKET_MS);
    if (Math.abs(currentBucket - tNum) > 1) return '';
    const bytes = new Uint8Array(boundHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(boundHex.slice(i * 2, i * 2 + 2), 16);
    }
    const seedStr = `${getDeviceBindingString()}|${tNum}`;
    const mask = deriveDeviceMaskBytes(seedStr, bytes.length);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ mask[i];
    }
    try {
      return new TextDecoder().decode(out);
    } catch (_e) {
      return '';
    }
  }

  const params = new URLSearchParams(window.location.search);
  const kParam = (params.get('k') || '').trim();
  const tParam = (params.get('t') || '').trim();
  let sessionSavedKey = '';
  try {
    sessionSavedKey = window.sessionStorage.getItem(EGG_SESSION_KEY) || '';
  } catch (_e) {
    sessionSavedKey = '';
  }

  const candidateKey =
    kParam && tParam ? unbindDeviceKey(kParam, tParam) : !kParam ? sessionSavedKey : '';

  if (!candidateKey) {
    window.location.replace('index.html');
    return;
  }

  // ============================================================================
  // FIPS 180-4 SHA-256 + HMAC-SHA256 + PBKDF2-HMAC-SHA256 (12,000 Iterations)
  // 原始碼完全不含明文通關密語、儲思盆文案或解鎖金鑰
  // ============================================================================
  const PBKDF2_ITERATIONS = 12000;
  const SALT_HEX = 'd93c48e1a05f7b26c84e19f03a726d5b';
  const MAC_HEX = 'e855c45a936486d8b13744d55d4438f011a66104343a2e1d574c6ce461b79f66';
  const CIPHER_HEX =
    '4864832dfaea51e4f770cfe1d9a235a785970cca7e5e0ee149b1790be43798aead3b9a9a4341a521083b9ce2aa4728d38bc1' +
    '32601f6b22a2e795aa1eead24e4f030ffd75e58270eb90b7eac4d23a855e2f9bd7a5eeb8cd952d303b9a56d3a5a7cde6ccc0' +
    'f590a467031570bc6681b883975a81e3adb32e14fbba4644dd7200215763488f45328f93866b471a9bab42bff87463a9fdf3' +
    '67de261ce1c08c45cfffbe36fe54121dcbbbf5b001886a80e7f18095559d502402aaef487bff495ac99d9dc9337625a92fd3' +
    '702316c551efac2a758ca04416588e6071beb6202e967f87e708c54e5036350f087152d8bd6eb7f4ea7a5853950f6732139a' +
    '0ebc7d52010e42c657639ba1e5c3b47a0af1cd13cfc85cfd08f1e6fd6edf14dd7a1d4d78d47abe2b96fd8ee01cfd88b615dc' +
    '2f1f429459119acde9b429b5896b2a27f2d783cce422efc6d965882afecbe40036ba78920723f4af19dfa7e747096164cc6b' +
    '63979d2ec8e28bb8e3743e2a8cb71a88f74be07056824c77431d3a822e783795c7c7f3a649bff5a6445927726263d91e18ea' +
    '9082a4e3fe1630e0509017f895e7a1b6c91816d67703b79a4840fa717eb213915402ddfe7516fa79286a408d43c0feb16068' +
    '1b39655296fdb4706c5cca8408b06703332c99313ceb6dd04854bed9a9429eaba8864107231c920f632f30515fcc4ee103e0' +
    '9561ad3c63dbb875bb2098d171e255fd753eb67e5dab1dabdb3957d120f401c6dfe6dde45cc26b6af3eaba4edb510156ac6d' +
    '1e375e7e700c5195b4083e5609815eb9ff09f31e5a3556699481c8885ff6443314650bfff2fd440b49a1543c61a4b3398366' +
    '54c3f3991e32d13b3949432879e0611c0023b87ef46e77d8f0a1f68177c47b18090bec8232bdccfdfb8dfea39eb7ce600ffb' +
    '7ef4046daa043766f7f25f8f617d180e9de37d749f7539a5f7455935b84277558f13ee77462373acea8f6b6b6697f48bdb00' +
    '80aa4abce3fc7fd2a3cfdf1335093534107e7f155ba29bd3e74bb556ca130d578afcc320ac21736e697e87a7c95febe1d973' +
    '5e84a9967913c02ae5e7823da23f6eff5c6429fa1e20f3698bb1575d97d89a3b81c5d7b19c4efd0ada8bb5957417f2a7be6e' +
    '1d60907e4d84a29c63b7725199ca74c2217837977ab5510b0442036f415e1b92189b924616fbe0c5891b19ed89ad19e13776' +
    '40f4e288f1c9e1515897823e1e4eeebb49f3ebae901dafbc726fb8341f59da78f80d414c5270516d63bbc986b47b277de508' +
    'b66bffdd281e25258bc745723446beb55c216f71deb417e26f35c8346d37e24a98d56fe095f558d40ae7fef5d201a9a47d3d' +
    '53bbced89d9537a9b4e816e9cb0fb03475a12ad685fb1efaa0c6de1c2878ed3e8a9493522e2bbb2002d5eaafb9aae87d4344' +
    'e81201a90b38db289792b7a34ffcf3bac8eb035b260cb51cb3c7d799bf96356c6301a30244dcfd8268151df0cf390ba7c50f' +
    '63b4091de0d01b87186f4096a926877a4917df96533fa80638c9cf61aea0ef1571cd4f94a69e52daf646455b9ad64c88d59b' +
    '8bd6bf330bb9a614cc5baef57265ee94d541ac81e5457183eaf27d89a91bf0ccc33f6657f32292951bccff1865c047a99f4f' +
    'c2deff2e8dd1a484c5d9333cc9ef3821a3586d8f070eab959b787bbac7aab7520a5a699029c4f8d715e865ca6b796ccb6d36' +
    '02d67c0a5462d67c1e5e42c8750a193acdb9ee39f888fded83c49d29c468652431fd1049b2614dc77f6813205a11825ab9d4' +
    '82d0af5fe88fea8ed704168f1f51a4a7f893af3af0434b0186b8fe9035233d6fa08c14447bc8f4f21e539554d1a1b667dd0f' +
    '27513b058988b93ee766369b17ee834d879662d4afafdc5b4a179e9f75f8aed3c0dd25f60ddceef6fd0c8767d84c59eea22c' +
    'c61baaf0bf77af360fae61b412488151e10e482e281d5d806f4c9f93182fb800f93d4984e2d67d0e4b1792b622a3d1aeed2d' +
    '63855277a5b1e3949b4ae6be9efa22eb216aaac29853f6054653fdb6e7b65da40769bf0799b1d5c10afdcb84adb083715db9' +
    'ccb144b9d24cd6a0804601e78ec99079acdd7ba0ab8fb7008ad8c2f24dbdd908b691d7274972e295a4410e7133fe3eaf1db0' +
    '590ef2411162595b0bc41b09c33b5e36e14c6779b122258b6771fd29d6a765fa2882d73a87ceb9b67105faab290ad228d984' +
    '612dec693c24d4f5c7997282989622672488017a738a314c6dd6fecf97867f5d68da9379726662ca5d24c1dffc6ded595cbd' +
    '8788c134cfd4780691e1ff2144b61060688d66774b302204f95f7515f3b9feb0792ba5de89c9d2713c622451138f5e81db97' +
    'b6ba8e8d7f8eefac9276750a0ba3a4f52ed4a8a4f6566f9c10bd1ac0f67a7b7cba7dd8382911596dfb49a03f133d32692c82' +
    'cdece60dd1bb38657816de18c96f37bf02aec1fe2cc4b3dbf1656cedbcfbf19cc3099c12f0e63fb797fa8f2833c400722ce1' +
    '5e3d42df8b0bfa4f45d40ff9abc675e60b28f9073c4128ea6e798f8e220055c66f9082efefa461a091ced5080327f6889b71' +
    'bc6ef4df0769273343ab01472069e8aa7f112d1b61e9bd29cf769f262fd657713d95f67332627034875b8be283d03871bc49' +
    '718930fa2b59f0d34c87717479e01beaf19beee01046c90d4c68be66e358df9f1df1de04b40cc6ad9f5260908b1716a86992' +
    '3f4ddd425befd77c8c5503bc1129412ef31595628c7d0a13a1d988fb508c49255211c04bc05f067ad204570426468d410c79' +
    '446a6fdb26afeeee2b331723ddced8545003163081c2b777fdc2274d973fdb37c0826b6341d01d689ef7b1d5fbc8acdf7132' +
    '936f1edd18a700930ffa86dd33866d6c8074d35bdb49f2f1b572bffcf280cedfa76cb5eec6626bdf9c252978e66811b6d164' +
    '2ac851f36f130f85052d827ab55796a508941fde058ee15232ca48923ef62a10a986cf76b6a7ea73fb92491c9e5ef3ac5bd0' +
    'c196155e720f93bbdf435c60dec0473a1e25b95a14fad677d9745409a56d59d290271496cb7ccfb2c0a17449a8685e16af25' +
    '408f12a4afa204ef86bd1bc573f5abcd95e185cc11b8274a993be9c36c3b5eb71657a6cbb9288f0c45876ca76348ca5e2708' +
    '3bdcd7b4e0640cdac57b191787cc32a6dd6186376cc64c96cfbe85e41ba565acaa86974c6558cc77b6d741f80ea72541d2c1' +
    '43126f1c3e358d63dfe8e5cfea7ad30444060f9e9895d6e0e999690129b66a09cdea7075309de15725bd193acaa408668c51' +
    '879d5aa93df68261b4be78c8eb03204773c08f3a6692dcb38650157ba61af86482c4373461f5bf8a197c11f3ce33fb026826' +
    'b1096b6b51714347220f213f3a6238ec26a016c787b019d62e55680d50f819ffd78ee2b2e9b01089f8fa35edebad694a53a4' +
    '57901ceef7927acbe38433755113d3aae018f679662a11f4e6588ff5a7525a881323fb5a891649c124c78624af8d884db30b' +
    '9394ce3b05564a90dbb60ff720021471003fe64afd9710fa1bb5207d94804d41a3220338331b81830db0758b96086836b331' +
    'aca9006f120a01401f8fa4efa8326f0de743dc6589c6aed0ae257e68b2de11c3d2164b09f880698899e89d80126b686cf743' +
    'a342216ba213a4bad258c20fb6a7b1c44dcd43b551ed83e199ed7e500cfce6e0bfa0d6c09b60e9653bc02c00241febf61449' +
    '5e58ed6dbd131c5166887e964f5c931e20ff5d355f27c3731f67b0cd726b8cd475bc7028ea71aef77b7086f288f791dba6e6' +
    'fe0132dc176a168fd162ee5eb9658805b68d0693895029ad26d153089463c6c4b9013367842029333d71a1f90c94b33f09c1' +
    '47678d7fac0ea4ab93b04474e2e31f47057fea241127ad31fbb25ebcc124dda4746b2815fe6195a43c1d713a990e1c261dbe' +
    '36275d1a081bdaa367562dd1ad4d0f3972d419eb83594eaf3ceee5d0ee774d174bd5a3ef47caf733e766995e700462e131a5' +
    '6c8b9090e5c1341bb165c5bce2e846c98e208b28151a2b1b1ebbc830909167289e9447db6e7fc8219ca8aaadd94456288e3a' +
    'c9c20c53c792afd9abc4ddadcf9d97ddf865d97df787479589b0fd66caf42b171f468f74f523d54f63af5a2bc2d6a5ddfebc' +
    'e66d9741f1ac75c70aeb36a87e761c7d1418e92e14238374b42aaddf0382ebdccf45d1089de8beb873fa5e7025e4e83b9caf' +
    '55ce90e59759ee66187bec32fdd9f4cf325fb93cf1b1975a03e377c9d5af371b28399b5b3d059196d6a4effbbbbfcd82e969' +
    'aa3b1d20e3eaa6b2e5ea8e23ece4b4d53e1d1dd12f4003ec1273e35796c5c403d974cf5c4826568cb60448b7b82ad24a32d1' +
    '18fe781c1217a75ea2576192d2ff5bc00dd75b72da6947bccf7e69a49386983974bedc54f3187eb688887f141720e83873dc' +
    '938af6b65e2bf76682e5ca5fa7a8ffd4cf9c1305960453a5f03f68c5167b629a678f796957b186778d3583d861e5fbcd60a8' +
    '8e90f576f537fdb8e1e693cfc15bfee1a191bbfb3995738e51ecf2c19e0366c989e72551ee0689c8fb52888fabd0e8b8c6c1' +
    '863e2a15d144641482b1b94914f0b87c14459634ad6745f002942ec791dbd3051bad5498114ed46ea0f0842e7c567287e73c' +
    '13aba4ea646b9e9ed401c52fee27e5ce7b9d7d97924548885f23463858da644c55e480b13a517087e619df5a20dab920d80e' +
    'dc2b6e445ef3f9a827f67fb9c6e2fd2c0aa33a0c17a7a65bcdf6fe5e362dffe4ec91b65b89c53742c541771dcf3cf02f36fc' +
    '0ad195c984473e041199945ad4933bcad6ef4434f64dfc3b75fc8d6af98ce2aa9a32feec28267d9af249ebf2a82836966bfe' +
    '1ea5db27a54f742a41e15f782b403a8433e63c38a0d19111cc17d4727f336f74f1106956061f8abfdb5809e7ec8e4608c2e3' +
    '5bf3362b6b9abda067b6d8ab6c7aaaa01f67dd3a23e7ce15a9cd646bada60132249ce05fc3ef7f37914794e2c1772e4ecc3c' +
    '43109032cee57adc67caf9c68282527dd2ebd86697854670351e4e185e57af4663f8596fff6da487f9fe8e493577159b0a72' +
    '9f3754dcafe2928cf1a9f7a1329e3b8318620a3c500a541a6cfb7f02d03e50fcea0e257dd07bcdca00bb0634f96b107624f5' +
    '2b361c106d6a4ae5114a550371e751a16592b2eb9b221fd94b605de646e2e7c4829dfcfcc1adfd324bba63c2818e683d59d1' +
    'e2a2207cd0bd6156227748912827e3b81cb7a926476a13a33524682a73f6e17d649adc969e03488f5740585ea6600320129b' +
    '524c9184a8167baef165286336b8a840569892dc5db2f3a37828094e1d82b6165b0ebc4857372786a8d17bc96926ebf36cb6' +
    '2c4603f4b0400e002702bf347152c48c5160fa9561b631d604a87a16a362a256b72f14874d293666e57d6724b0262ac442af' +
    'de016c397b78138621760fa4e35740c28b3a1ba02a8cbfe45d226069b1567b4610d1e15c69f3f830ec5ac3aa7698da05a5fc' +
    'ae811f5bd8bb85ba7d162848fe0493fedd990bceafaab0ad1a6131714963d3880208dcb05fb267bd961c219fedd56754fda7' +
    '5a65e45201e9ccd3212a36ec0780a393f2b9f852bd3517f96232c8f82beabc4e7dd6b0be159c94986abd7875b7a31748e12b' +
    '2eacfec88c90e80080b165fef4c846da21ae7f871772e882c5962043eb2fccd4e3274d42685ce4baab11d273bded5565eeff' +
    '520469684732f244e81ebc08845b14351607dca0176125915d9f2475422ab0b9ab270a341dc65f76b07448ed122ab5304783' +
    'b1346f2f8c928cd50f68121b2383398a72c4d828ff3028c2c03bb914bb3eaef700199ac5e02d09a15bd61f112c0f91cb7ff4' +
    '594278ca318b1f2a5fba388b4ee1ccf9c47abcbf970ec8684bdcf71f301810da236b8580f735746a5d93861d87322048e45e' +
    '4c5f8eca27c979fd996e1d5ea86ed3e4350d5f7847be7d6849d3fd5c2638bfa10da4614aed8c7c1aa26054af69c444e92e6b' +
    '9dd047cf27dc1be99198850c2d2fdf9c8af7f2b1d190afbfaf37ea06743d6a75b6625156028dba57d7e085f38e4bbdfd3659' +
    '6c4fae9ccc87870c8d00d303366fc1f1a3f26433c75b1ee536eb1a998aa4abcd2d1d48022cf4c6d97d016cfdfc8198c75d93' +
    '2dc397b1a0c9c9f850b0f39f3048edc22343fb5b745c9ebd8234cdf702a2fa905f94a13638e402c1d06a3bce035b2f73b3e3' +
    '5098bce1cdff92af98dca961e3bbab1a52f6a549c734387de42a74b2edd2b588413bab36382e3ab1791c26b3581e4b00b8ca' +
    'bcdb77ff7b454f9cc9bc4fd2b0530d39d7b2d941a71f2a60284c568bd0267df3231519097786db9c51d4cc0a994fa4dd2195' +
    '59e8c9b5661dcc709ca16d406564686f225d695162735795ae7a4943d61e0bb5e31cc66f63b98c3fd8aba2abb3b7aa0f240d' +
    '7a043ee91877fdf2c824c87c54463f79e031fb0b60dafbb697b8dc44e375c5868a4efff5c9493c9977de67978c650338c7c7' +
    'ab1d312afc1a627a0a97b9c3c7f7d397ecc97fd2c29cd429426e0791c45f7901fd564531b5d294ea101813ede58c6dbb1120' +
    'b0d0d61a6254db399fe53d42c767f8225101f3561b21aa9e98dab193b165ff5920ebee469c6061b3af7598157a455b2c4de4' +
    '85c6e5cb972956120646bb7ecd1f844c2a0614aaf5c430caa4bc9916854bb0ff119a5a3e028abc52b0ae258ad6d8dfabdcde' +
    '316723b724226d925a98526c0b6fd92a49e4cf85d448cbfc9c855b6b771d59c327b8242ea142da9c602d6e1503cf971011b2' +
    '91c2425d26654caf198a61d827abfca91f76f15b1fd51778790384004fc7d7e119cbfc33adf99663f293eb62a44459ea7556' +
    '6a1c6ecab43944dddc8363b68385ac148185628f732dfd3c438449f0341d158adba491faf9044a73cea4fcdff77ccd55c34a' +
    'ac3c7773d6bfa65bb47d1590cc776166841ea88f6479126a9e7da84bbbddff6065f44dc06a9c4c4ce0c2c85b61ed704a3c2a' +
    'f52dafa2d107b73536ab7f66457d9a3d79859681a85cde8970be30f0d3f3fe93717f4ab50801ccac15c38d48bf4ab876f0d3' +
    '8081b19ce33a62375363393433866d2674a0a20506ec7230d3f6dd78307cdcbb2a2154b2d762fb6740779806630dfa991dad' +
    'c6a5ff94842585ed9f89fadd5467941c36b66d3861e829ae94f30a14bccb022c1e77a4e356c53ad098d67868859beaa16d8e' +
    'ef1c552ee9bb94481a951fd6cc242cc242c493d3f5af920bcd2f83a487cbf8db38bdababedc9a4ec06c42b936bd793bfbbef' +
    'bb04145728de9e9944b44b42372fc38ff7e77f77b3f21454cc1eb81e2c2feefcd0689ce1828def970a6663bc6feee5cc369d' +
    '889599f71a26385f9ce9fafbc15e09a3a9b15332c0082dc122c068471f11f052faa87476509a540f7f596782c5cfdff84a3f' +
    '44751eb2194c1946729d357520b4d0d5a8970610770ede84b52f4946e4b1c34228845961224bb45a5349a51d0d8069a42ecb' +
    '44a7b87b428a5ce6c55f6fe5d09d53ab2ad7dfddae2049736301613372770a6612883b1243a835df111bccda7e35895549d7' +
    '141834dffeb2dd3656d5b415ce24f6b642539789b45933c6a44650225ab1f9ee30a7f8fe3e503f5272943bbc564118c10f1a' +
    '5247aa4a9892f78af6075991bd0eb3aa5e6fc3fbf32fa0d0ef4cfe64d2a7f01fd843b92c454bc6a59b69822d8e4d50a0aa69' +
    'ea4ddd756fbeb3498156ca0e5eb37a6ce3d070afb30cf18b1c167a2d01afa0f01ddc69aa5c4c521b6700ffbc0afd286d6a74' +
    '9341eb27d3a21181cd3b84a93afd9b52d7e6df0698d1d5c7fb9e59052f4e3a019b569abf46b0f781f5e928148a324cff0525' +
    '3ab3c77d95789bf77b62a580dbb6ca211c15f42cc4c320132dddd90b50b51cbf5db200b3229f07b9db9124b97e93652aae43' +
    'fbfdc9a85064f95ae765a65168dd6cc76fe3ac16ee5c412a8ee21f73311a00d223abfeccb6a82e878237a0c97cb86de41db2' +
    '1ed409c209d025dec82e303cfbc1b3427cc84e50117029a3bdc64dfb3916d9ff9e038b2f58a78db2507be7551126aae99222' +
    'ead6da811a3dfce421186691683d214d03709ac2e243352ce709b19218192cf8317173d0991e4ac786932ace57d8cabf24ac' +
    '335a004d934ad98d25b3f38d273f6b48c51e7a3bf420456923d355fd2f078924c44a4599e89d9a72fb1d600c1399e9e26423' +
    'bc00b99b2b3ce9d362250dd002cc362d273eac8aa6c2608916e47aa98d2ab44fbbc9b7b54424f77e6d1fa297ac3e8c989a73' +
    'a48a2f77f86848c43423767399c90309ec61e5939e1531ac4dafe49b91ee55a905b7d18c29611e44cc98824a61b53be8831b' +
    '55b4882a66d9def2c575b58018856b25f17df6b758c25f4277e6d0d70abd889718a89275aca9114222af39ba62330f5abc4e' +
    'd4708e9863c7b8b5edc66e5223ca6fb18cff979f35009e1e2e3977e5e8f73ca42caa491cc5388635fc4a90cb02156e39fee2' +
    '47ad59107d47914c55cfd480f113b14c9e4d63bddcf758a20652c5ad15e1e027d2b5023cf34dd58bad6d06cd8ed1a6e1c547' +
    'd2d965008297291f7a642c6b58246acf5765afdbdd04478a7f6c8e4697d28d02bcfae70c51c93917e8c3a5e85ebd1976e074' +
    'e1d948d1adb7be539814f9a103d76444a6769c6af5c27d90a29db79d934836761f999f6858df20b106a4bb20b64069882e96' +
    'dcf5a143b035500213b44a977e012f88521fdef262549f3cdb24e153764211b4aea3940432d98149179e38b1c5dab44014fa' +
    '3e660b076396cd78b02c311fba74630c50e6aec0493a8063829ce2d6bc35eab33ac13e1c80e262fb3283c1a4877373ee3224' +
    'f211656070489a12a09ce1e31ea763ab731bf4f5f5e7b5f6159c1dc1613c201c7a44745d6305cab72f8269d0e282e30727c1' +
    '8ad0b9c39870b6fe6f657731fb099af3baf652f06f02fd4b40dff1d6e8f2c994b5ae2a9c4f26dec1a4ffbf92ad7bc8cf199c' +
    'bc1bfa69a863ddef58596b95ca03262a3665f57e402fb1ad991d1db2745e8c312f09fedf5d5d95f93a7213c9b577cc0045ce' +
    'ed6ceaf5a0ace9035eb0b7542fe07e22a199dfa96daf1f56c247ecb1cec50966f748782f66732801cb857dc8079f8acd5be6' +
    'a12ca5c1223feb28058fc7b88335bb0f76b4cb97ed79eb457308be325dcb4d394d7c7d7c76a42f57b20a9599fad5b8dcc4c4' +
    'b07ef08bd5c42b8fbd1307014b69914ac433499e4483707bb8ba219300dbc4e7d9cbc2165801bcfb4c777e2fae2dc84c1b63' +
    '9274d217827da688d25265f8f30fd045448e275eb9eb5008789eb9b782d4672dda207888b2e324cfa231a17eafc03f8871ab' +
    '1be3ea414e518943df51c8ed37b82982f48dd33aae90ffa2ba737ad2dcfeb7bd763b1f041d4da4503e9e926377639a0a0bd6' +
    'b58fa0f774cb0dc01123f7f17f70e198d93f2a87f2cbb78b31f92ed6ceb9060cbed0861f016ef72ba01400ac528dc3700321' +
    'b14dc6f73fb644e07dc35e51e1b8e4261c93bda9ca9176247f9e279c2e63e23488392b6db7578110d448627710c3ce0d4507' +
    '7bf93cb975f81d542677ad11861130f878a2fe2b4964fb00ba723a8ac840ab414bba6ca42a904f7196509f685d2b06c2fba1' +
    '639c2d425f54f15838f39897fbfabffa5274f030692c77c6cc48e4f14cfdaaadda779064f729c5c67b955915545269a1926e' +
    '0c610f6171804c33758d34aeffd3d497938f0c797781f32cc1251dcae06c78a48f4dbd47627566c87ce1cff6d804a3310138' +
    '2144851e2207357cc24e2a08685fee23738f0446417440b01574f9614a34fe00d11b3118d45c71a7c969d5d603fad80d2bac' +
    '57412e1b4d373a9eba5ddda2ce3f41a89b2d07e9fc453126d4cb5d4e837693f6de878b709b4c16b5abe4fa973bbf8c821b0a' +
    '4142c5381c2272f5c06778440eacb97dfa5d09444d6393f023ef7543159e01d0dfc4e7178a4e920ca1a9ca1d7262c65a3fae' +
    '1c4d2ac693e2b45d7f3eb9bfc66cf728a3c58f72da6e4693bd9be7ae988fd4ce3c417603b7e55801cd2b0aeea20940399f83' +
    '260dbc433ece06669932b84bf5547675a0b5d270c17e01e6604d6c567be06fc9407ac523aa5aeb0051375eb65d906c6b117a' +
    '7ee6e9b7706d089a2f7eb157eb82572551e1c8033510bee0eee9235210e4e93fa2878f755177bd4cbc80b5702dfafdb9907e' +
    '211ccfcedf4a184b0b7582f55a2139f54e2b2477cd21ee1e78f879e74336e879aeafdc2e81d7bc963b59874b6172d020dedd' +
    '709ea1f1b63004529d599ef4e35b947ec184699fe5970300a10d9e64fc038e2739074b4dae7ac34d2235ce1fa50ec39f1d20' +
    'e24363084c49fe97f3faa04f6794e2d1de8954e200d1529f207b992af7737bfe276d0ac6ce14d8e30a59acbaf0e43b1917ad' +
    '311801a7b6c6b04911d32c63db9a8886bf7ed2bb4aef2365a0fbc5aaeb4975be3789b57a1d78783a2be3c367ad0272c51f0b' +
    '18337abd9ed4ca756144f5d14cf177813e3e1d84642373cea76e426a33152c4a6a311c1294930b338eaffaed79a07b78b164' +
    '54e70800760ff7a22b90069d2c91cb9d0e34a1b88747ec8b42a75d5b5f2e9bcb4cddbc52e941fb9c5a5fbf0464558602b040' +
    '008b68091ad1aad0d1dda17a1f465094277b970b3c82d91d7c8f6afafabf917a595d9d6f907bbaa557bdc604bbecf770421c' +
    '6393810b4d59de17edffc023bba5e90d1d4757bdfdbe9a415522e324736b67cc51b653dd8b241c3aa5ecba4c899c3f168323' +
    '5bacc6daf584f4114c7d23ec69d6be9ee1cb98f8edcb944ddab764afb33eb1b42b3dffcb5b8147b56a9baf87393ae2e403f2' +
    '071d606847a7fd004131326faf4f9d4a0ea4e7144f45d478447d4e2334c33789f8337b9b5e12b445e7c144404cd4d08a0c6f' +
    'f70f21ebd2148fbd1f8bd5d643cd624f9b952bd4a6de77e97cfe56361443c69edb07a09264557e6c2f2446e7778fd64b826a' +
    'e2585df1f769f5a3dc7f959e573dcbb6ea9673d78ce58cadca019660df44803bd1d7279c671fda3591ab0a023224225de234' +
    '23271baaef12880c5c76b5a5349eb8377f7a7935a01e2f13dccf6c39fe7f6675a7d9312f6fb04d754332304f53604123dffc' +
    '57dad5f126e3d98d40b84c2e982d23eca0196f45bd3e3b16ad1fabe5aeacff6d68e7f162a176b011b2edf504ffbc7a4d3bfc' +
    '9a14fc37a4362db5b923905ade0d4f444d9a503c51439dd797a8a857bc904c642e394f9080a8c313a8513b8bdc619244249f' +
    '9bf843aac166c6f261d5c2d570f36f9d4929acc50a2bb2b5f56bacacb6f9babcf436433a1c225d288814abf98a7116020c20' +
    '3394a67e8f74c806bf6c73113ae549431f61a7530470099524a447da828d3f4342a195ca3e90d2256b6a265622c32acc7186' +
    'a73c08dfc6b470b736dcf6ed46598210022018bb8a36d9c93c7c801ef445e3a49819dee246276642112a1f8eb9099e7c37ac' +
    '9a41f9732f9dc359461cda75b2adb5d4d5e081ad2c1c17bbf5c9dc207c93635663880b15e60f6812cb365db7554178b02bab' +
    'dae12a0a73aef3c748067b0093a679231ec01acfe9db4f40a328eaef630cff6e79d5d3b37e24e376c09a56fcb591c8eddb52' +
    '2b2318cc551671cc8cea9f4c45b2542eb286a2b4cd6bc0ab09fb8782babc3b5c48b84ed68eb8dd23a035f65738453f7deac9' +
    'a2aefb6f4760037bb886b44c38126c4ff061c41a9f390f8edc03885af6193d1226cb9ecc14efdfba2893f91e2a60bb72b467' +
    '0004eb950d9e3f3b08f4f90f4465d3315eb2c110e39ed167fee4c4af012478b4b9ffabfef73d766db890d3ad65821e128afe' +
    '960d8fd50c0abb4ce405c62db2d491879c126733a2e3e4c21204d566b1f94bccd11c5880210483fe5c3be77fc4c534d4cd3a' +
    'e984cbfda3103e7a32a989f1328c72865868b552a71cae6b4f66cb8cac45674ea2369eb0d473e78d9bc743d7672200de8cd4' +
    '780bfc2bcfe075eff56c095b5c782eb059272b8a57ead6f8f99dc517b49a1e02b01d63002f2e21dd46bb509a2dbb5d2c86c7' +
    '708cbd7c232239b00ea5e4730a9bb79f34a55e98e7ecf80ba412bb0c4a09676909f72a30b20b0182d75975f9d40d7687e7bc' +
    'd6b19fbef0ce702e712de68d621c8bd2141c93cad9a3bb4ec2d4a10c542ba6be30b8be9883b5be4417ef94bc8ea71ef3950d' +
    '6595edef60a7783acaf07cb625fc94ee5d8606536c4ab435b207f332fa022a3197a63036f0b7deff9841ec27dc4914bef35d' +
    '3d780b89a12b8947fcca06bf6a657b9010963a93661cbfcb2087befaff521f6086900f397d38f693088610366deb95423bbd' +
    '3c8a9150b2d4f7e77cad8515dff4c1114bf01b2807369c0846f3b0616dbf1c46fec237843f25a7f569dd017f2cb5f18d21e6' +
    '100e455bbf32503e3764ddd4d8100e04cef5538be5d895efce7eb2cc15da6c5cc6079fb823158dcebd1ad2df7d46097f79e2' +
    'd9c1c860a9f10a6a68dcf95e85a9915b67f5c4a5e515c8704bf8b555b4a3559e09c8787ab370155793df0943a844ebb8ebc6' +
    'd78ceabeacd5051e2a88f352aa1a4dfc1df0c5b5e18f68bb8fe046a0b25d0f7f917f3415c2061b75bdb50dabe16d1cbd6759' +
    '439b1bc0f0953a99ee72a1e8251e01a01a5d1ec69665962ff44ce84693bf5ba0a08b1f98a60a98f9ae506a286176837b1703' +
    '673dffa9c2d3737746e2509b7100ee8431b921b18446e8de92ef56bcabe89c13d6f62537be0f8af5d147bbdd7c6f7eaa21ef' +
    '734114200841a27730aa1ffd4d59cae6ac0e3e8338fb4247b798e3b655b528fb781c9375ff03fb66deed060fb5cbd44aa8d0' +
    '7cb4553b920bd0fb91482f199549a94b7e220f00a65d6b572c1ecd7c4f34066c19103a5988cd17f059d0e83ee5027d84adca' +
    'aa863ad960947eca93fbdd89138db1357aaada26cf99b683655405cb2bbc74cdb6f32f67083e3a54e5586082edbc79c6fd25' +
    'efff25db1f10c2ff07e87fca04109f3235cc108bd1e851e8861133d9e22261db02f101124013288f9c498c1ed20c3f67118a' +
    '29c2f5207d9f545c65c8b636dd7280bb7ac4fa6c877dbc0dde936f13ed8e96fc24946bdad197d65b0114e159b04384b488c4' +
    '16675d7826e35b5058e3c8fd34beebb7cf3c235f3da97b94570243dc87e63e5a49bb7859aeb4fde7e452fc5b1f3a3071d46b' +
    '06b347c0a25a88f7b5a769fcda6d9bb67b9140044012acc1297181fb1357e03e08c3fbdc9e877c1fecc47e9c5921b9f4d19b' +
    '8a493ce6cb0cf8c214e14e5e4c1d6a373b68fa1cca4f36c34f9ca12c403d71423699dbf7dc3a954c42d30f748d5b7bd5fbb7' +
    '29a8c2c443606add04836d33256db2405bd7948c0b8ce99f0132bc0c114c4f629f418b4f566a8dce2a071bde299cb4745ec0' +
    '93fbc27f02dc5ed7ba10fe1dff73b080fcb3a78d595e5339b1ea0aa83ac7feaf9867c6295340c93058ab150b60a3a9debc6b' +
    '91ca66e0d1239cd51bd0eb1e6e0dd0cf8d680e7db924a3a975fb6b109dc2831043122b936b704d8a0ffb951dc1c2b64fea06' +
    '29cc2f8e34a5962ee413cbca04cc83f64d4bfde2f396f530f816d0617b8b103caeb7c025a6307c0e5a4ce7b8efacf670f5df' +
    'fe824a110208b6cdce9c2345e6e887a07c2383c45ce4dc206f570ab1e2a5927eb6628476167e25a1bb6a301be23837b22b2b' +
    'a28be5e5456f2c3bc998095a3f4ab1179abeabe12a38a4835efd47558ebf1a9a88627bc403657cafac242bf2c473b7f45702' +
    '4b5ac2251d1d7cc290f6e136c51bdf84ee4fab34c642399bccee93ff74afa9be887edcb120edcf04fed2ba668375b2d23506' +
    'ea36c762fb1f6df7149ef214c15db1e4812ecf63341c60e5a638833f7d86431f18f460770b42f20e361c8d505992f9122747' +
    'd3ca3d69c232c30117007dbd974e3e63bb77ad1693f55b4abdbb4d6ef9429cad8097ed758c7077dda6772ed67c0ae245713b' +
    'e1f0e5198ae6a168d129f217ba267b11fb5a7ee963539da04b66bed77410b1e5c6855cee6075bcf6afc8390ff1bd09c26def' +
    '603d49405b6952d2e2d533ca18bb43dc3f552cd0bff367cacdcdf8a47cab440cd2ee517c751afa8bd247d96fba8c9a8febd5' +
    '261a3cf49e9797a15436b397c53208860a4992687356655e40b4293f13f75311d5682efd20e9fb8fecc9a8d4cc25ef430e50' +
    '689a2d26818f10aa9da4a6ea6517792deb011afe0d716200fecd73aac5bb4318c78e416077585f1ff6d99f64056d474d81ca' +
    'fb0956b7022b7a8f2041ffcc6b8a7f4eef2418930e2e00409b89903a83c58241ad8946b9093c1d8bf6f947cbc794d61e499c' +
    'd34287384a52ad33d80538b1cb60b4b5cba0e0b8dac97338258e7c19624990ce5c7732726f3cd77576acbf7e8225a4d3796f' +
    '403ee67769aeaf3468f84c561e7171859f3b472fd2d1442f42d6f195372b7f7d87e09dcb5a25745721cd359b729efe313aa9' +
    '7407ced2253f81938f8b6dfd4e2190d5616fe482b97d0a47d87487382260ed824e449d22d133bcf7e0ab9b5e79b6951bbef5' +
    '72c4bbdbdf6f5708fd85da8f37f02f854e73bd14a7588bd92c5c98dd81b1c77cab8cdb8ac7941a34d951cb268c5f1c6440ed' +
    'd877740dcf622e967e02caf45b6ad159e0af6b5739cb5b77c16ef359abb58e5e1e0000d990487c65f50dd5c669598efdbadb' +
    '74185776650ed09c6f7d7b2cfad5cd29e632e33132229ad5f49b47a672898e02b44d09a6f3f222317ab620e67b397b7dc04d' +
    '05b10f008288fa6645ffbe9bf1f0ebea1ef738947ebb36e6e47542e38afbaa7c576c26e219f3cb51b2e7087277afe5bf69d0' +
    'a62f8feac5cec4d1aafc485611f01a3699e743e894a3192f6d449d5fa1e5f116e5dbd73ea952ada9c6a64823ba07eb3877ee' +
    '246e63524a07cecb786f5d4b534e094684d8e11b85fb24a70a0b9cba2cbf61ae3db900e60482cca30d1cfb16e3aecede4d8f' +
    'c370a2e9b3f389ca37ff93ff5e9539d474f8793e6861866a80116060ec1c29fda0c38bc27c45fded7563856b12349b9ffd89' +
    'd0c0f36220ff521097c0b16ca85a23c2393dc8bcbdf6d69e9969e52393e48861b6c00f3e6489c96666698b6475e07069cb54' +
    '9726d45d0349b1d3855b6123d0a8fcef497c98cb417714a1fc5a1f406b74ebcf635654cac677a0f6505b5a5ede9d1efc178d' +
    '74704e43cb4fa9fe5544900431db0f21f5d7e5970b29fbef58cbc8ff848c01';

  const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
  }

  function sha256Bytes(msgBytes) {
    const ml = msgBytes.length;
    const bitLenHi = Math.floor((ml * 8) / 0x100000000);
    const bitLenLo = (ml * 8) >>> 0;
    const padLen = (ml + 9 + 63) & ~63;
    const buf = new Uint8Array(padLen);
    buf.set(msgBytes);
    buf[ml] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(padLen - 8, bitLenHi, false);
    view.setUint32(padLen - 4, bitLenLo, false);

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const w = new Uint32Array(64);

    for (let offset = 0; offset < padLen; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = view.getUint32(offset + i * 4, false);
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f = h5;
      let g = h6;
      let h = h7;

      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
      h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0;
      h7 = (h7 + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
  }

  function hmacSha256(keyBytes, msgBytes) {
    let k = keyBytes;
    if (k.length > 64) {
      k = sha256Bytes(k);
    }
    const ipad = new Uint8Array(64);
    const opad = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const b = i < k.length ? k[i] : 0;
      ipad[i] = b ^ 0x36;
      opad[i] = b ^ 0x5c;
    }
    const innerInput = new Uint8Array(64 + msgBytes.length);
    innerInput.set(ipad, 0);
    innerInput.set(msgBytes, 64);
    const innerHash = sha256Bytes(innerInput);

    const outerInput = new Uint8Array(64 + 32);
    outerInput.set(opad, 0);
    outerInput.set(innerHash, 64);
    return sha256Bytes(outerInput);
  }

  function pbkdf2HmacSha256(passwordBytes, saltBytes, iterations, dkLen) {
    const blocks = Math.ceil(dkLen / 32);
    const out = new Uint8Array(blocks * 32);

    for (let blockIdx = 1; blockIdx <= blocks; blockIdx++) {
      const saltAndBlock = new Uint8Array(saltBytes.length + 4);
      saltAndBlock.set(saltBytes, 0);
      saltAndBlock[saltBytes.length] = (blockIdx >>> 24) & 0xff;
      saltAndBlock[saltBytes.length + 1] = (blockIdx >>> 16) & 0xff;
      saltAndBlock[saltBytes.length + 2] = (blockIdx >>> 8) & 0xff;
      saltAndBlock[saltBytes.length + 3] = blockIdx & 0xff;

      let u = hmacSha256(passwordBytes, saltAndBlock);
      const t = new Uint8Array(u);

      for (let iter = 2; iter <= iterations; iter++) {
        u = hmacSha256(passwordBytes, u);
        for (let j = 0; j < 32; j++) {
          t[j] ^= u[j];
        }
      }
      out.set(t, (blockIdx - 1) * 32);
    }
    return out.subarray(0, dkLen);
  }

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  function encodeUtf8(str) {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str);
    }
    const utf8 = unescape(encodeURIComponent(str));
    const arr = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i += 1) {
      arr[i] = utf8.charCodeAt(i);
    }
    return arr;
  }

  function decodeUtf8(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) {
      bin += String.fromCharCode(bytes[i]);
    }
    return decodeURIComponent(escape(bin));
  }

  function constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }

  function tryDecryptPayload(tokenStr) {
    const dk = pbkdf2HmacSha256(
      encodeUtf8(tokenStr),
      hexToBytes(SALT_HEX),
      PBKDF2_ITERATIONS,
      64
    );
    const encKey = dk.subarray(0, 32);
    const macKey = dk.subarray(32, 64);
    const cipherBytes = hexToBytes(CIPHER_HEX);
    const expectedMac = hexToBytes(MAC_HEX);
    const actualMac = hmacSha256(macKey, cipherBytes);

    if (!constantTimeEqual(actualMac, expectedMac)) {
      return null;
    }

    const plainBytes = new Uint8Array(cipherBytes.length);
    const totalBlocks = Math.ceil(cipherBytes.length / 32);
    for (let b = 0; b < totalBlocks; b++) {
      const ctr = new Uint8Array(4);
      ctr[0] = (b >>> 24) & 0xff;
      ctr[1] = (b >>> 16) & 0xff;
      ctr[2] = (b >>> 8) & 0xff;
      ctr[3] = b & 0xff;
      const ks = hmacSha256(encKey, ctr);
      const start = b * 32;
      const end = Math.min(start + 32, cipherBytes.length);
      for (let i = start; i < end; i++) {
        plainBytes[i] = cipherBytes[i] ^ ks[i - start];
      }
    }

    try {
      return JSON.parse(decodeUtf8(plainBytes));
    } catch (_e) {
      return null;
    }
  }

  const HP_I18N = tryDecryptPayload(candidateKey);
  if (!HP_I18N) {
    try {
      window.sessionStorage.removeItem(EGG_SESSION_KEY);
    } catch (_e) {
      // ignore storage errors
    }
    window.location.replace('index.html');
    return;
  }

  try {
    window.sessionStorage.setItem(EGG_SESSION_KEY, candidateKey);
  } catch (_e) {
    // ignore storage errors
  }

  if (
    (kParam || tParam) &&
    window.history &&
    typeof window.history.replaceState === 'function'
  ) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  const shell = document.getElementById('egg-shell');
  if (shell) {
    shell.classList.remove('hidden');
  }

  // DOM Elements
  const canvas = document.getElementById('hp-magic-canvas');
  const fxCanvas = document.getElementById('hp-spell-fx-canvas');
  const lumosOverlay = document.getElementById('hp-lumos-overlay');
  const btnLang = document.getElementById('hp-lang-btn');
  const elPlatformText = document.getElementById('hp-platform-text');
  const btnHpBgm = document.getElementById('hp-bgm-btn');
  const elHpBgmLabel = document.getElementById('hp-bgm-label');
  const btnLumosHeader = document.getElementById('hp-lumos-toggle-btn');
  const elBackBtn = document.getElementById('hp-back-btn');
  const elOathEyebrow = document.getElementById('hp-oath-eyebrow');
  const elEventTitle = document.getElementById('hp-event-title');
  const elSubtitle = document.getElementById('hp-subtitle');
  const btnSpellLumos = document.getElementById('spell-lumos-btn');
  const btnSpellMarauder = document.getElementById('spell-marauder-btn');
  const btnSpellCelebrate = document.getElementById('spell-celebrate-btn');
  const elSpellFeedback = document.getElementById('hp-spell-feedback');
  const elSnitchScoreboard = document.getElementById('hp-snitch-scoreboard');
  const btnSnitch = document.getElementById('hp-snitch-btn');
  const elSnitchLabel = document.getElementById('hp-snitch-label');

  // 金探子自由飛行狀態：未滿 5 次時平穩游移；之後每滿 5 次 (5, 10, 15, 20...) 階梯式提升速度、變向頻率與閃避難度
  const snitchState = {
    x: Math.max(24, Math.min(window.innerWidth - 116, window.innerWidth * 0.72)),
    y: Math.max(76, Math.min(window.innerHeight - 110, window.innerHeight * 0.22)),
    vx: -1.65,
    vy: 1.15,
    ax: 0,
    ay: 0,
    targetVx: -1.65,
    targetVy: 1.15,
    accelRate: 0.045,
    accelPhase: 0,
    bobPhase: 0,
    nextTurnAt: performance.now() + 1800,
    lastCatchTs: 0,
  };

  function pickNewSnitchVelocity(boost = 1) {
    const angle = Math.random() * Math.PI * 2;
    const tier = Math.floor(snitchCaughtCount / 5);
    if (tier >= 1) {
      // 每滿 5 次提升一階難度：速度倍率、加速度反應提升，且變向間隔縮短
      const tierMult = Math.min(2.85, 1 + (tier - 1) * 0.34);
      const delayScale = Math.max(0.28, Math.pow(0.78, tier - 1));
      const dashChance = Math.min(0.72, 0.46 + (tier - 1) * 0.06);
      const modeRoll = Math.random();
      let baseSpeed;
      let turnDelay;
      if (modeRoll < dashChance) {
        // 急加速衝刺 (Dash burst)
        baseSpeed = (2.85 + Math.random() * 1.65) * boost * tierMult;
        snitchState.accelRate = (0.11 + Math.random() * 0.05) * tierMult;
        turnDelay = (500 + Math.random() * 640) * delayScale;
      } else if (modeRoll < 0.8) {
        // 急減速懸停假動作，隨即在短時間後再次加速竄出 (Brake feint)
        baseSpeed = (0.48 + Math.random() * 0.68) * boost * tierMult;
        snitchState.accelRate = (0.095 + Math.random() * 0.045) * tierMult;
        turnDelay = (320 + Math.random() * 420) * delayScale;
      } else {
        // 中高速弧線折返巡航 (Agile cruise)
        baseSpeed = (1.85 + Math.random() * 1.55) * boost * tierMult;
        snitchState.accelRate = 0.085 * tierMult;
        turnDelay = (620 + Math.random() * 720) * delayScale;
      }
      snitchState.targetVx = Math.cos(angle) * baseSpeed;
      snitchState.targetVy = Math.sin(angle) * baseSpeed * 0.92;
      snitchState.nextTurnAt = performance.now() + turnDelay;
    } else {
      const baseSpeed = (1.15 + Math.random() * 1.35) * boost; // 1.15 ~ 2.5 px/frame，平穩好點擊
      snitchState.accelRate = 0.045;
      snitchState.targetVx = Math.cos(angle) * baseSpeed;
      snitchState.targetVy = Math.sin(angle) * baseSpeed * 0.85;
      snitchState.nextTurnAt = performance.now() + 1400 + Math.random() * 1600;
    }
  }

  function stepGoldenSnitch(nowTs) {
    if (!btnSnitch) return;
    if (nowTs >= snitchState.nextTurnAt) {
      pickNewSnitchVelocity(1);
    }

    const tier = Math.floor(snitchCaughtCount / 5);

    if (tier >= 1) {
      // 動態加速度變化：每增加一階 (每 5 次)，切線脈衝、法線弧線甩尾與最高極速皆同步遞增
      const tierMult = Math.min(2.85, 1 + (tier - 1) * 0.34);
      snitchState.accelPhase += 0.085 + Math.min(0.14, (tier - 1) * 0.028);
      const speed = Math.hypot(snitchState.vx, snitchState.vy) || 1;
      const ux = snitchState.vx / speed;
      const uy = snitchState.vy / speed;
      const nx = -uy;
      const ny = ux;

      const tangentialPulse = Math.sin(snitchState.accelPhase * 1.35) * (0.11 * tierMult);
      const normalCurve = Math.cos(snitchState.accelPhase * 0.92) * (0.085 * tierMult);

      snitchState.ax =
        (snitchState.targetVx - snitchState.vx) * snitchState.accelRate +
        ux * tangentialPulse +
        nx * normalCurve;
      snitchState.ay =
        (snitchState.targetVy - snitchState.vy) * snitchState.accelRate +
        uy * tangentialPulse +
        ny * normalCurve;

      snitchState.vx += snitchState.ax;
      snitchState.vy += snitchState.ay;

      // 每滿 5 次提升極速上限
      const maxSpeed = Math.min(14.5, 4.9 + (tier - 1) * 1.85);
      const newSpeed = Math.hypot(snitchState.vx, snitchState.vy);
      if (newSpeed > maxSpeed) {
        snitchState.vx = (snitchState.vx / newSpeed) * maxSpeed;
        snitchState.vy = (snitchState.vy / newSpeed) * maxSpeed;
      }
    } else {
      snitchState.ax = (snitchState.targetVx - snitchState.vx) * 0.045;
      snitchState.ay = (snitchState.targetVy - snitchState.vy) * 0.045;
      snitchState.vx += snitchState.ax;
      snitchState.vy += snitchState.ay;
    }

    snitchState.bobPhase += tier >= 1 ? Math.min(0.24, 0.1 + tier * 0.025) : 0.07;

    snitchState.x += snitchState.vx;
    snitchState.y +=
      snitchState.vy +
      Math.sin(snitchState.bobPhase) * (tier >= 1 ? Math.min(1.5, 0.65 + tier * 0.18) : 0.45);

    const minX = 16;
    const maxX = Math.max(minX + 40, cw - 108);
    const minY = 68;
    const maxY = Math.max(minY + 40, ch - 90);

    if (snitchState.x <= minX) {
      snitchState.x = minX;
      snitchState.vx = Math.abs(snitchState.vx);
      snitchState.targetVx = Math.abs(snitchState.targetVx);
    } else if (snitchState.x >= maxX) {
      snitchState.x = maxX;
      snitchState.vx = -Math.abs(snitchState.vx);
      snitchState.targetVx = -Math.abs(snitchState.targetVx);
    }

    if (snitchState.y <= minY) {
      snitchState.y = minY;
      snitchState.vy = Math.abs(snitchState.vy);
      snitchState.targetVy = Math.abs(snitchState.targetVy);
    } else if (snitchState.y >= maxY) {
      snitchState.y = maxY;
      snitchState.vy = -Math.abs(snitchState.vy);
      snitchState.targetVy = -Math.abs(snitchState.targetVy);
    }

    const tiltLimit = tier >= 1 ? Math.min(38, 22 + tier * 3.5) : 18;
    const tilt = Math.max(-tiltLimit, Math.min(tiltLimit, snitchState.vx * 5.8));
    const snitchScale = tier >= 1 ? Math.max(0.72, 1 - tier * 0.04) : 1;
    btnSnitch.style.transform = `translate3d(${snitchState.x.toFixed(1)}px, ${snitchState.y.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg) scale(${snitchScale.toFixed(3)})`;

    const sparkChance = tier >= 1 ? Math.min(0.85, 0.42 + tier * 0.1) : 0.28;
    if (Math.random() < sparkChance && sparks.length < 160) {
      sparks.push({
        x: snitchState.x + 46 + (Math.random() - 0.5) * 10,
        y: snitchState.y + 27 + (Math.random() - 0.5) * 8,
        vx: -snitchState.vx * 0.3 + (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.7 + 0.7,
        alpha: 0.72,
        decay: 0.035,
        color: '#fde047',
      });
    }
  }
  const elParchmentCard = document.getElementById('hp-parchment-card');
  const elMinistryTag = document.getElementById('hp-ministry-tag');
  const elParchmentTitle = document.getElementById('hp-parchment-title');
  const elMarauderRibbon = document.getElementById('hp-marauder-ribbon');
  const elTrackTom = document.getElementById('hp-track-tom');
  const elCastleBadge = document.getElementById('hp-castle-badge');
  const elTrackEunice = document.getElementById('hp-track-eunice');
  const elParchmentBody = document.getElementById('hp-parchment-body');
  const elVowSignature = document.getElementById('hp-vow-signature');
  const elInvisibleInk = document.getElementById('hp-invisible-ink');
  const elInkHeader = document.getElementById('hp-ink-header');
  const elInkText = document.getElementById('hp-ink-text');
  const elRiddleModal = document.getElementById('hp-riddle-modal');
  const elRiddleModalEyebrow = document.getElementById('hp-riddle-modal-eyebrow');
  const elRiddleModalTitle = document.getElementById('hp-riddle-modal-title');
  const elRiddleModalIntro = document.getElementById('hp-riddle-modal-intro');
  const elRiddleModalCipher = document.getElementById('hp-riddle-modal-cipher');
  const elRiddleModalMid = document.getElementById('hp-riddle-modal-mid');
  const elRiddleModalLumos = document.getElementById('hp-riddle-modal-lumos');
  const btnRiddleClose = document.getElementById('hp-riddle-close-btn');
  const btnRiddleTopClose = document.getElementById('hp-riddle-top-close-btn');
  const elDecreeEyebrow = document.getElementById('hp-decree-eyebrow');
  const btnCopySpell = document.getElementById('hp-copy-spell-btn');
  const elSecretCodeText = document.getElementById('hp-secret-code-text');
  const elFooterMottoText = document.getElementById('hp-footer-motto-text');

  const STORAGE_KEY_LANG = 'wedding_20261129_lang';
  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }
  function safeSetStorage(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (_e) {
      // ignore storage error
    }
  }

  const urlLang = params.get('lang');
  let currentLang =
    urlLang === 'en' || urlLang === 'zh'
      ? urlLang
      : safeGetStorage(STORAGE_KEY_LANG) === 'en'
        ? 'en'
        : 'zh';

  let lumosActive = false;
  let snitchCaughtCount = 0;
  let hasCastMarauder = false;
  let lastFeedbackKey = null;
  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.38;

  // =========================================================================
  // Secret Chamber BGM — 國樂絲竹合奏：古箏 (Guzheng) × 洞簫 (Xiao) × 古琴泛音 (Fan-Yin)
  // 《巫師江湖・海德薇變奏 · Hedwig's Theme (Jianghu Silk & Bamboo Edition)》
  // =========================================================================
  let chamberAudioCtx = null;
  let chamberMasterGain = null;
  let chamberFilterNode = null;
  let hedwigBusGain = null;
  let lumosBusGain = null;
  let riddleBusGain = null;
  let chamberNoiseBuffer = null;
  let isChamberBgmPlaying = false;
  let userExplicitlyMutedBgm = false;
  let chamberMusicMode = 'hedwig'; // 'hedwig' | 'lumos' | 'riddle'
  let isRiddleModalOpen = false;
  let chamberSchedulerTimer = null;
  let chamberWatchdogTimer = null;
  let chamberWakeRetryTimers = [];
  let chamberNextBarTime = 0;
  let chamberBarIndex = 0;
  let lumosBarIndex = 0;
  let riddleBarIndex = 0;
  let chamberWasStandby = false;
  let chamberNeedsRebuild = false;
  let chamberLastCtxTime = -1;
  let chamberFrozenTicks = 0;

  // 3/8 (3-beat) mysterious waltz lilt (~140 eighth-notes/min)
  const CHAMBER_BEAT_SEC = 0.43;

  // Voice tags:
  // 'z'  = 古箏清撥 (Guzheng crisp pluck)
  // 'zv' = 古箏吟揉按音 (Guzheng pluck + left-hand pitch vibrato 吟猱)
  // 'zx' = 琴簫合奏 (Guzheng + airy Bamboo Xiao flute 洞簫滑音與氣震音)
  // 'zf' = 古箏 + 古琴泛音玉磬 (Guzheng + crystalline Guqin harmonic chime)
  // 'f'  = 純古琴泛音過門 (Delicate Guqin harmonic ornament)
  const CHAMBER_BARS = [
    // --- Section A1: 古箏主奏 × 泛音點綴（星夜密室・初入霍格華茲江湖） ---
    {
      // Bar 1 (Em): E5. G5 F#5
      pluck: [164.81, 246.94, 329.63],
      notes: [
        [0, 659.25, 1.5, 'zf'],
        [1.5, 783.99, 0.5, 'z'],
        [2.0, 739.99, 1.0, 'z'],
      ],
    },
    {
      // Bar 2 (Em): E5(2) B5(1)
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0, 659.25, 2.0, 'zv'],
        [2.0, 987.77, 1.0, 'zf'],
      ],
    },
    {
      // Bar 3 (Am/E): A5(3) — 古箏左手指法吟揉 + 洞簫輕嘆
      pluck: [164.81, 220.0, 329.63],
      notes: [[0, 880.0, 3.0, 'zx']],
    },
    {
      // Bar 4 (B7/E): F#5(3) — 餘韻吟猱
      pluck: [164.81, 246.94, 369.99],
      notes: [[0, 739.99, 3.0, 'zx']],
    },
    {
      // Bar 5 (Em): E5. G5 F#5
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0, 659.25, 1.5, 'zf'],
        [1.5, 783.99, 0.5, 'z'],
        [2.0, 739.99, 1.0, 'z'],
      ],
    },
    {
      // Bar 6 (B7/F#dim): D#5(2) F5(1) — 經典半音神秘轉折
      pluck: [123.47, 185.0, 311.13],
      notes: [
        [0, 622.25, 2.0, 'zv'],
        [2.0, 698.46, 1.0, 'z'],
      ],
    },
    {
      // Bar 7 (Em): B4(3) + 古箏五聲流水刮奏伴奏
      pluck: [164.81, 196.0, 246.94, 329.63, 392.0],
      notes: [[0, 493.88, 3.2, 'zx']],
    },
    {
      // Bar 8 (Em turnaround): 古琴泛音過門 + 弱起拍 B4
      pluck: [196.0, 246.94, 329.63],
      notes: [
        [0.5, 659.25, 0.85, 'f'],
        [2.02, 493.88, 0.98, 'z'],
      ],
    },

    // --- Section A2: 琴簫合奏推進（御風飛越星河與竹林） ---
    {
      // Bar 9 (Em): E5. G5 F#5
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0, 659.25, 1.5, 'zx'],
        [1.5, 783.99, 0.5, 'zx'],
        [2.0, 739.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 10 (Em/D): E5(2) B5(1)
      pluck: [146.83, 246.94, 392.0],
      notes: [
        [0, 659.25, 2.0, 'zx'],
        [2.0, 987.77, 1.0, 'zf'],
      ],
    },
    {
      // Bar 11 (Gm/Bb -> A7): D6(2) C#6(1)
      pluck: [116.54, 233.08, 349.23],
      notes: [
        [0, 1174.66, 2.0, 'zx'],
        [2.0, 1108.73, 1.0, 'zx'],
      ],
    },
    {
      // Bar 12 (Ab/C7): C6(2) G#5(1)
      pluck: [130.81, 207.65, 329.63],
      notes: [
        [0, 1046.5, 2.0, 'zx'],
        [2.0, 830.61, 1.0, 'zx'],
      ],
    },
    {
      // Bar 13 (Cmaj7 -> F#7): C6. B5 A#5
      pluck: [130.81, 196.0, 329.63],
      notes: [
        [0, 1046.5, 1.5, 'zx'],
        [1.5, 987.77, 0.5, 'z'],
        [2.0, 932.33, 1.0, 'zv'],
      ],
    },
    {
      // Bar 14 (B7): A#4(2) G5(1)
      pluck: [123.47, 185.0, 293.66],
      notes: [
        [0, 466.16, 2.0, 'zv'],
        [2.0, 783.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 15 (Em): E5(3) + 古箏掃弦琶音
      pluck: [164.81, 196.0, 246.94, 329.63, 392.0],
      notes: [[0, 659.25, 3.2, 'zx']],
    },
    {
      // Bar 16 (Em -> B段弱起 G5)
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0.5, 493.88, 0.85, 'f'],
        [2.02, 783.99, 0.98, 'zx'],
      ],
    },

    // --- Section B1: 洞簫高亢領奏 × 古箏輪指琶音（俠侶同心・奇幻翱翔） ---
    {
      // Bar 17 (Em): B5(2) G5(1)
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0, 987.77, 2.0, 'zx'],
        [2.0, 783.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 18 (Em/D): B5(2) G5(1)
      pluck: [146.83, 246.94, 392.0],
      notes: [
        [0, 987.77, 2.0, 'zx'],
        [2.0, 783.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 19 (Cmaj7): C6(2) B5(1)
      pluck: [130.81, 196.0, 329.63],
      notes: [
        [0, 1046.5, 2.0, 'zx'],
        [2.0, 987.77, 1.0, 'zx'],
      ],
    },
    {
      // Bar 20 (B7): A#5(2) F#5(1)
      pluck: [123.47, 246.94, 369.99],
      notes: [
        [0, 932.33, 2.0, 'zv'],
        [2.0, 739.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 21 (Cmaj7 -> F#7): G5. B5 A#5
      pluck: [130.81, 196.0, 392.0],
      notes: [
        [0, 783.99, 1.5, 'zx'],
        [1.5, 987.77, 0.5, 'z'],
        [2.0, 932.33, 1.0, 'zv'],
      ],
    },
    {
      // Bar 22 (B7): A#4(2) B4(1)
      pluck: [123.47, 185.0, 293.66],
      notes: [
        [0, 466.16, 2.0, 'zv'],
        [2.0, 493.88, 1.0, 'z'],
      ],
    },
    {
      // Bar 23 (Em): B5(3) 高八度清亮泛音與洞簫齊鳴
      pluck: [164.81, 196.0, 246.94, 329.63, 392.0],
      notes: [
        [0, 987.77, 3.2, 'zx'],
        [0, 987.77, 1.4, 'f'],
      ],
    },
    {
      // Bar 24 (Em -> B2 弱起 G5)
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0.5, 659.25, 0.85, 'f'],
        [2.02, 783.99, 0.98, 'zx'],
      ],
    },

    // --- Section B2: 絲竹紅燭收束（宮商五聲流轉・歸於星辰誓約） ---
    {
      // Bar 25 (Em): B5(2) G5(1)
      pluck: [164.81, 246.94, 392.0],
      notes: [
        [0, 987.77, 2.0, 'zx'],
        [2.0, 783.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 26 (Em/D): B5(2) G5(1)
      pluck: [146.83, 246.94, 392.0],
      notes: [
        [0, 987.77, 2.0, 'zx'],
        [2.0, 783.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 27 (Gm/Bb -> A7): D6(2) C#6(1)
      pluck: [116.54, 233.08, 349.23],
      notes: [
        [0, 1174.66, 2.0, 'zx'],
        [2.0, 1108.73, 1.0, 'zx'],
      ],
    },
    {
      // Bar 28 (Ab/C7): C6(2) G#5(1)
      pluck: [130.81, 207.65, 329.63],
      notes: [
        [0, 1046.5, 2.0, 'zx'],
        [2.0, 830.61, 1.0, 'zx'],
      ],
    },
    {
      // Bar 29 (Cmaj7 -> F#7): C6. B5 A#5
      pluck: [130.81, 196.0, 329.63],
      notes: [
        [0, 1046.5, 1.5, 'zx'],
        [1.5, 987.77, 0.5, 'z'],
        [2.0, 932.33, 1.0, 'zv'],
      ],
    },
    {
      // Bar 30 (B7): A#4(2) G5(1)
      pluck: [123.47, 185.0, 293.66],
      notes: [
        [0, 466.16, 2.0, 'zv'],
        [2.0, 783.99, 1.0, 'zx'],
      ],
    },
    {
      // Bar 31 (Em): E5(3) + 東方五聲羽調古箏瀑布刮奏 (E-G-A-B-E-G)
      pluck: [164.81, 196.0, 220.0, 246.94, 329.63, 392.0],
      notes: [
        [0, 659.25, 3.2, 'zx'],
        [0, 659.25, 1.4, 'f'],
      ],
    },
    {
      // Bar 32 (Turnaround back to Bar 1): 玉磬泛音 + 弱起拍 B4
      pluck: [164.81, 246.94, 329.63],
      notes: [
        [0.5, 987.77, 0.85, 'f'],
        [2.02, 493.88, 0.98, 'z'],
      ],
    },
  ];

  // =========================================================================
  // Forbidden Scroll Suspense BGM — 《禁書殘卷・夜探藏經閣》
  // Played exclusively while #hp-riddle-modal (《殘卷異聞錄》) is open!
  // 4/4 creeping night-infiltration pulse: 古琴沉按暗撥 + 琵琶寒弦半音 + 幽咽洞簫 + 寒玉三全音泛音
  // =========================================================================
  const RIDDLE_BEAT_SEC = 0.5;
  const RIDDLE_BARS = [
    {
      // Bar 1 (Cm(maj7) creeping minor-2nd shadow): C5 - Db5 - C5 - B4
      pulses: [
        [0, 65.41, 1.3],
        [1.5, 98.0, 0.9],
        [2.5, 103.83, 0.9],
        [3.5, 98.0, 0.8],
      ],
      pipa: [
        [0.5, 523.25, 0.65],
        [1.0, 554.37, 0.65],
        [2.0, 523.25, 0.85],
        [3.0, 493.88, 0.95],
      ],
      chimes: [[0.5, 523.25, 1.2]],
    },
    {
      // Bar 2 (Cm/F# tritone dread + 洞簫半音幽咽 G4 -> Ab4)
      pulses: [
        [0, 65.41, 1.4],
        [1.5, 92.5, 1.1],
        [3.0, 98.0, 0.95],
      ],
      xiao: [[0.25, 392.0, 415.3, 2.5]],
      chimes: [[3.0, 739.99, 1.4]],
    },
    {
      // Bar 3 (Abm6/C chromatic descent): Eb5 - D5 - Db5 - C5
      pulses: [
        [0, 65.41, 1.3],
        [1.5, 103.83, 0.9],
        [2.5, 123.47, 0.9],
        [3.5, 98.0, 0.8],
      ],
      pipa: [
        [0, 622.25, 0.75],
        [1.0, 587.33, 0.65],
        [1.75, 554.37, 0.65],
        [2.75, 523.25, 1.1],
      ],
      chimes: [[2.75, 1046.5, 1.2]],
    },
    {
      // Bar 4 (G7b9 unresolved cliffhanger + 洞簫低嘆 F#4 -> G4)
      pulses: [
        [0, 98.0, 1.4],
        [1.5, 138.59, 1.0],
        [3.0, 87.31, 0.95],
      ],
      xiao: [[0.2, 369.99, 392.0, 2.4]],
      chimes: [[2.5, 830.61, 1.5]],
    },
    {
      // Bar 5 (Dbmaj7#11/C — deeper into the book cipher): G5 - Ab5 - F#5 - E5
      pulses: [
        [0, 65.41, 1.3],
        [1.5, 69.3, 1.0],
        [2.5, 103.83, 0.9],
        [3.5, 92.5, 0.8],
      ],
      pipa: [
        [0.25, 783.99, 0.65],
        [1.0, 830.61, 0.65],
        [1.75, 739.99, 0.75],
        [2.75, 659.25, 1.1],
      ],
      chimes: [[1.0, 830.61, 1.3]],
    },
    {
      // Bar 6 (Edim7/C ancient mechanism): 洞簫下行滑音 Eb5 -> D5
      pulses: [
        [0, 65.41, 1.4],
        [1.5, 77.78, 0.9],
        [2.5, 92.5, 0.9],
        [3.5, 110.0, 0.8],
      ],
      xiao: [[0, 622.25, 587.33, 2.7]],
      chimes: [[3.0, 987.77, 1.3]],
    },
    {
      // Bar 7 (Fm(maj7)/C — flickering candlelight over secret numbers)
      pulses: [
        [0, 65.41, 1.3],
        [1.5, 87.31, 0.9],
        [2.5, 103.83, 0.9],
        [3.5, 164.81, 0.8],
      ],
      pipa: [
        [0, 698.46, 0.8],
        [1.0, 622.25, 0.8],
        [2.0, 554.37, 0.8],
        [3.0, 523.25, 0.95],
      ],
      chimes: [[0, 698.46, 1.2]],
    },
    {
      // Bar 8 (G7alt dark turnaround back to Bar 1)
      pulses: [
        [0, 49.0, 1.5],
        [1.5, 73.42, 0.95],
        [2.5, 103.83, 0.9],
        [3.5, 123.47, 0.8],
      ],
      xiao: [[0.2, 246.94, 261.63, 2.2]],
      chimes: [
        [2.5, 739.99, 0.9],
        [3.25, 783.99, 0.9],
      ],
    },
  ];

  // =========================================================================
  // 「路摸思 (Lumos)」專屬星輝空靈配樂 — 《星輝引路・夜明珠泛音》
  // 調式：G Lydian × 宮調五聲星輝 (G - A - B - C# - D - E - F#)，4/4 飄逸微光律動
  // 編制：古琴清亮泛音 (Harmonic Qin) + 玉磬星鈴 (Jade Star-Bell) + 清風暖竹笛 (Warm Dizi) + 夜明珠暖韻
  // =========================================================================
  const LUMOS_BEAT_SEC = 0.52;
  const LUMOS_BARS = [
    {
      // Bar 1 (Gmaj7 — 夜明珠初亮・星輝灑落羊皮紙): B5 -> D6 -> A5
      pad: [196.0, 293.66],
      harmonics: [
        [0, 392.0, 1.4],
        [0.5, 493.88, 1.3],
        [1.0, 587.33, 1.3],
        [1.5, 739.99, 1.4],
        [2.0, 880.0, 1.4],
        [2.5, 739.99, 1.2],
        [3.0, 587.33, 1.2],
        [3.5, 493.88, 1.1],
      ],
      dizi: [
        [0.5, 987.77, 1.4],
        [2.0, 1174.66, 1.0],
        [3.0, 880.0, 1.0],
      ],
      bells: [
        [0, 1479.98, 1.6],
        [2.5, 1174.66, 1.4],
      ],
    },
    {
      // Bar 2 (Cmaj7#11/G — Lydian 奇幻微光升騰): F#5 -> G5 -> B5
      pad: [196.0, 261.63],
      harmonics: [
        [0, 261.63, 1.4],
        [0.5, 392.0, 1.3],
        [1.0, 493.88, 1.3],
        [1.5, 587.33, 1.3],
        [2.0, 739.99, 1.5],
        [2.5, 783.99, 1.3],
        [3.0, 739.99, 1.2],
        [3.5, 587.33, 1.1],
      ],
      dizi: [
        [0.25, 739.99, 1.2],
        [1.5, 783.99, 1.0],
        [2.5, 987.77, 1.4],
      ],
      bells: [
        [1.0, 1479.98, 1.5],
        [3.0, 1567.98, 1.4],
      ],
    },
    {
      // Bar 3 (Em9 — 月華映照藏寶密語): E5 -> F#5 -> G5 -> A5
      pad: [164.81, 246.94],
      harmonics: [
        [0, 329.63, 1.4],
        [0.5, 493.88, 1.3],
        [1.0, 587.33, 1.3],
        [1.5, 739.99, 1.3],
        [2.0, 783.99, 1.4],
        [2.5, 987.77, 1.3],
        [3.0, 783.99, 1.2],
        [3.5, 739.99, 1.1],
      ],
      dizi: [
        [0, 659.25, 1.0],
        [1.0, 739.99, 1.0],
        [2.0, 783.99, 1.0],
        [3.0, 880.0, 1.0],
      ],
      bells: [[2.0, 1975.53, 1.6]],
    },
    {
      // Bar 4 (D6/9 — 溫潤金芒凝定): F#5 悠長餘韻 + 星鈴雙音
      pad: [146.83, 220.0],
      harmonics: [
        [0, 293.66, 1.5],
        [0.5, 440.0, 1.3],
        [1.0, 493.88, 1.3],
        [1.5, 659.25, 1.3],
        [2.0, 739.99, 1.5],
        [2.5, 880.0, 1.3],
        [3.0, 739.99, 1.2],
        [3.5, 659.25, 1.1],
      ],
      dizi: [[0, 739.99, 2.8]],
      bells: [
        [2.0, 1760.0, 1.4],
        [3.0, 1479.98, 1.5],
      ],
    },
    {
      // Bar 5 (Bm9 — 星塵穿堂・C#5 仙氣點睛): D6 -> C#6 -> B5 -> A5
      pad: [123.47, 185.0],
      harmonics: [
        [0, 246.94, 1.4],
        [0.5, 369.99, 1.3],
        [1.0, 440.0, 1.3],
        [1.5, 554.37, 1.4],
        [2.0, 587.33, 1.4],
        [2.5, 739.99, 1.3],
        [3.0, 587.33, 1.2],
        [3.5, 440.0, 1.1],
      ],
      dizi: [
        [0, 1174.66, 1.0],
        [1.0, 1108.73, 1.0],
        [2.0, 987.77, 1.0],
        [3.0, 880.0, 1.0],
      ],
      bells: [
        [0, 1174.66, 1.4],
        [1.5, 1108.73, 1.5],
      ],
    },
    {
      // Bar 6 (Cmaj7#11 — 隱形墨水浮現微光): G5 -> F#5 -> D5 -> E5
      pad: [130.81, 196.0],
      harmonics: [
        [0, 261.63, 1.4],
        [0.5, 392.0, 1.3],
        [1.0, 493.88, 1.3],
        [1.5, 587.33, 1.3],
        [2.0, 739.99, 1.4],
        [2.5, 880.0, 1.3],
        [3.0, 783.99, 1.2],
        [3.5, 587.33, 1.1],
      ],
      dizi: [
        [0, 783.99, 1.2],
        [1.25, 739.99, 0.9],
        [2.25, 587.33, 0.8],
        [3.0, 659.25, 1.0],
      ],
      bells: [[2.0, 1479.98, 1.6]],
    },
    {
      // Bar 7 (Am9 — 清風拂過星圖): E5 -> G5 -> B5
      pad: [110.0, 164.81],
      harmonics: [
        [0, 220.0, 1.4],
        [0.5, 329.63, 1.3],
        [1.0, 392.0, 1.3],
        [1.5, 493.88, 1.3],
        [2.0, 523.25, 1.4],
        [2.5, 659.25, 1.3],
        [3.0, 783.99, 1.2],
        [3.5, 987.77, 1.2],
      ],
      dizi: [
        [0.25, 659.25, 1.2],
        [1.5, 783.99, 1.1],
        [2.75, 987.77, 1.2],
      ],
      bells: [
        [0, 1318.51, 1.4],
        [3.0, 1975.53, 1.4],
      ],
    },
    {
      // Bar 8 (Dmaj9sus4 — 幸福星河迴旋重返 Gmaj7): A5 長音 + 星鈴上行琶音
      pad: [146.83, 220.0],
      harmonics: [
        [0, 293.66, 1.5],
        [0.5, 440.0, 1.3],
        [1.0, 587.33, 1.3],
        [1.5, 659.25, 1.3],
        [2.0, 739.99, 1.4],
        [2.5, 783.99, 1.3],
        [3.0, 880.0, 1.3],
        [3.5, 987.77, 1.3],
      ],
      dizi: [[0, 880.0, 3.0]],
      bells: [
        [1.5, 1174.66, 1.2],
        [2.5, 1479.98, 1.3],
        [3.25, 1760.0, 1.5],
      ],
    },
  ];

  function resolveChamberMusicMode() {
    if (isRiddleModalOpen) return 'riddle';
    if (lumosActive) return 'lumos';
    return 'hedwig';
  }

  function setIosPlaybackSession() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
        navigator.audioSession.type = 'playback';
      }
    } catch (_e) {
      // ignore unsupported audioSession API
    }
  }

  function primeChamberSilentUnlock(ctx) {
    if (!ctx) return;
    setIosPlaybackSession();
    try {
      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
        const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate || 22050);
        const src = ctx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (_e) {
      // ignore unlock buffer errors
    }
  }

  function destroyChamberAudio() {
    if (chamberSchedulerTimer) {
      clearInterval(chamberSchedulerTimer);
      chamberSchedulerTimer = null;
    }
    const oldCtx = chamberAudioCtx;
    chamberAudioCtx = null;
    chamberMasterGain = null;
    chamberFilterNode = null;
    hedwigBusGain = null;
    lumosBusGain = null;
    riddleBusGain = null;
    chamberNoiseBuffer = null;
    chamberLastCtxTime = -1;
    chamberFrozenTicks = 0;
    if (oldCtx && typeof oldCtx.close === 'function') {
      try {
        const p = oldCtx.close();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_e) {
        // ignore close errors
      }
    }
  }

  function syncModeBusGains(immediate = false) {
    if (!chamberAudioCtx || !hedwigBusGain || !lumosBusGain || !riddleBusGain) return;
    const now = chamberAudioCtx.currentTime;
    const targetHedwig = chamberMusicMode === 'hedwig' ? 1.0 : 0.0001;
    const targetLumos = chamberMusicMode === 'lumos' ? 1.0 : 0.0001;
    const targetRiddle = chamberMusicMode === 'riddle' ? 1.0 : 0.0001;
    try {
      hedwigBusGain.gain.cancelScheduledValues(now);
      lumosBusGain.gain.cancelScheduledValues(now);
      riddleBusGain.gain.cancelScheduledValues(now);
      if (immediate) {
        hedwigBusGain.gain.setValueAtTime(targetHedwig, now);
        lumosBusGain.gain.setValueAtTime(targetLumos, now);
        riddleBusGain.gain.setValueAtTime(targetRiddle, now);
      } else if (typeof hedwigBusGain.gain.setTargetAtTime === 'function') {
        hedwigBusGain.gain.setTargetAtTime(targetHedwig, now, 0.08);
        lumosBusGain.gain.setTargetAtTime(targetLumos, now, 0.08);
        riddleBusGain.gain.setTargetAtTime(targetRiddle, now, 0.08);
      } else {
        hedwigBusGain.gain.setValueAtTime(targetHedwig, now);
        lumosBusGain.gain.setValueAtTime(targetLumos, now);
        riddleBusGain.gain.setValueAtTime(targetRiddle, now);
      }
    } catch (_e) {
      // ignore bus crossfade errors
    }
  }

  function ensureChamberAudio() {
    if (chamberAudioCtx && (chamberAudioCtx.state === 'closed' || chamberNeedsRebuild)) {
      destroyChamberAudio();
      chamberNeedsRebuild = false;
    }
    if (chamberAudioCtx) return chamberAudioCtx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    setIosPlaybackSession();
    chamberAudioCtx = new AudioCtx();
    chamberLastCtxTime = chamberAudioCtx.currentTime;
    chamberFrozenTicks = 0;

    chamberMasterGain = chamberAudioCtx.createGain();
    chamberMasterGain.gain.setValueAtTime(0.82, chamberAudioCtx.currentTime);

    chamberFilterNode = chamberAudioCtx.createBiquadFilter();
    chamberFilterNode.type = 'lowpass';
    chamberFilterNode.frequency.setValueAtTime(3400, chamberAudioCtx.currentTime);
    chamberFilterNode.Q.setValueAtTime(0.6, chamberAudioCtx.currentTime);

    hedwigBusGain = chamberAudioCtx.createGain();
    lumosBusGain = chamberAudioCtx.createGain();
    riddleBusGain = chamberAudioCtx.createGain();
    syncModeBusGains(true);
    hedwigBusGain.connect(chamberFilterNode);
    lumosBusGain.connect(chamberFilterNode);
    riddleBusGain.connect(chamberFilterNode);

    // Pre-build soft bamboo-breath & nail-pluck noise buffer
    if (
      typeof chamberAudioCtx.createBuffer === 'function' &&
      typeof chamberAudioCtx.sampleRate === 'number'
    ) {
      const sr = chamberAudioCtx.sampleRate || 44100;
      const len = Math.floor(sr * 1.2);
      chamberNoiseBuffer = chamberAudioCtx.createBuffer(1, len, sr);
      const data = chamberNoiseBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.12 * white) / 1.12;
        data[i] = last * 1.8;
      }
    }

    // Misty Wuxia mountain-pavilion & stone-hall echo
    const delayNode = chamberAudioCtx.createDelay(1.0);
    delayNode.delayTime.setValueAtTime(0.32, chamberAudioCtx.currentTime);
    const echoTone = chamberAudioCtx.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.setValueAtTime(1950, chamberAudioCtx.currentTime);
    const feedbackGain = chamberAudioCtx.createGain();
    feedbackGain.gain.setValueAtTime(0.27, chamberAudioCtx.currentTime);
    const wetGain = chamberAudioCtx.createGain();
    wetGain.gain.setValueAtTime(0.32, chamberAudioCtx.currentTime);

    chamberFilterNode.connect(chamberMasterGain);
    chamberFilterNode.connect(delayNode);
    delayNode.connect(echoTone);
    echoTone.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    echoTone.connect(wetGain);
    wetGain.connect(chamberMasterGain);
    chamberMasterGain.connect(chamberAudioCtx.destination);

    const boundCtx = chamberAudioCtx;
    if (typeof boundCtx.addEventListener === 'function') {
      boundCtx.addEventListener('statechange', () => {
        if (chamberAudioCtx !== boundCtx) return;
        if (boundCtx.state !== 'running') {
          if (chamberSchedulerTimer) {
            clearInterval(chamberSchedulerTimer);
            chamberSchedulerTimer = null;
          }
        } else if (isChamberBgmPlaying && !document.hidden) {
          wakeChamberBgm(false);
        }
      });
    }
    return chamberAudioCtx;
  }

  function disconnectNodesOnEnd(sourceNode, nodes) {
    if (!sourceNode) return;
    sourceNode.onended = () => {
      for (let i = 0; i < nodes.length; i += 1) {
        try {
          if (nodes[i]) nodes[i].disconnect();
        } catch (_e) {
          // ignore audio node cleanup errors
        }
      }
    };
  }

  // 古箏 (Guzheng): 玳瑁義甲撥弦瞬態 + 絲弦桐木共鳴箱動態濾波 + 左手吟揉按音
  function scheduleGuzhengNote(freq, startTime, durationSec, isLead = true, withVibrato = false) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const oscString = chamberAudioCtx.createOscillator();
    const oscWood = chamberAudioCtx.createOscillator();
    const stringFilter = chamberAudioCtx.createBiquadFilter();
    const env = chamberAudioCtx.createGain();
    const woodGain = chamberAudioCtx.createGain();

    // 絲弦富含泛音 (sawtooth) + 桐木共鳴箱基音 (triangle)
    oscString.type = 'sawtooth';
    oscWood.type = 'triangle';

    // 撥弦瞬間張力微降 (String pluck pitch snap)
    oscString.frequency.setValueAtTime(freq * 1.008, startTime);
    if (typeof oscString.frequency.exponentialRampToValueAtTime === 'function') {
      oscString.frequency.exponentialRampToValueAtTime(freq, startTime + 0.024);
    }
    oscWood.frequency.setValueAtTime(freq, startTime);
    woodGain.gain.setValueAtTime(0.65, startTime);

    // 左手吟揉 (Left-hand pitch vibrato 吟猱 after pluck settles)
    if (withVibrato && durationSec >= 0.45) {
      const lfo = chamberAudioCtx.createOscillator();
      const lfoGain = chamberAudioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.2, startTime);
      lfoGain.gain.setValueAtTime(0.0001, startTime);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.009, startTime + 0.22);
      lfoGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
      lfo.connect(lfoGain);
      lfoGain.connect(oscString.frequency);
      lfoGain.connect(oscWood.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + durationSec + 0.04);
    }

    // 古箏撥弦瞬間清脆明亮，隨即收斂為溫潤木質共鳴
    stringFilter.type = 'lowpass';
    const brightCutoff = Math.min(5200, freq * (isLead ? 6.2 : 4.4));
    const warmCutoff = Math.max(380, freq * 1.85);
    stringFilter.frequency.setValueAtTime(brightCutoff, startTime);
    if (typeof stringFilter.frequency.exponentialRampToValueAtTime === 'function') {
      stringFilter.frequency.exponentialRampToValueAtTime(warmCutoff, startTime + 0.34);
    }
    stringFilter.Q.setValueAtTime(isLead ? 1.35 : 0.85, startTime);

    const peak = isLead ? 0.068 : 0.036;
    const ringTail = Math.max(durationSec * 1.25, isLead ? 0.72 : 0.95);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.009);
    env.gain.exponentialRampToValueAtTime(peak * 0.44, startTime + 0.22);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + ringTail);

    // 義甲撥弦細微擦弦聲 (Tortoiseshell pick transient)
    if (isLead && chamberNoiseBuffer && typeof chamberAudioCtx.createBufferSource === 'function') {
      const pickSrc = chamberAudioCtx.createBufferSource();
      const pickFilter = chamberAudioCtx.createBiquadFilter();
      const pickGain = chamberAudioCtx.createGain();
      pickSrc.buffer = chamberNoiseBuffer;
      pickFilter.type = 'bandpass';
      pickFilter.frequency.setValueAtTime(Math.min(3600, freq * 3.6), startTime);
      pickFilter.Q.setValueAtTime(2.6, startTime);
      pickGain.gain.setValueAtTime(0.022, startTime);
      pickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.022);
      pickSrc.connect(pickFilter);
      pickFilter.connect(pickGain);
      pickGain.connect(hedwigBusGain || chamberFilterNode);
      disconnectNodesOnEnd(pickSrc, [pickFilter, pickGain]);
      pickSrc.start(startTime);
      pickSrc.stop(startTime + 0.028);
    }

    oscString.connect(stringFilter);
    oscWood.connect(woodGain);
    woodGain.connect(stringFilter);
    stringFilter.connect(env);
    env.connect(hedwigBusGain || chamberFilterNode);
    disconnectNodesOnEnd(oscString, [woodGain, stringFilter, env]);

    oscString.start(startTime);
    oscWood.start(startTime);
    oscString.stop(startTime + ringTail + 0.04);
    oscWood.stop(startTime + ringTail + 0.04);
  }

  // 洞簫／竹笛 (Xiao / Dizi): 起音指法微滑音 + 竹管偶次泛音 + 氣震音與吹口氣聲
  function scheduleXiaoFlute(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const oscBore = chamberAudioCtx.createOscillator();
    const oscOct = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const octGain = chamberAudioCtx.createGain();

    oscBore.type = 'triangle';
    oscOct.type = 'sine';

    // 竹笛／洞簫指法倚音上滑 (Grace-note upward slide)
    oscBore.frequency.setValueAtTime(freq * 0.974, startTime);
    oscOct.frequency.setValueAtTime(freq * 2 * 0.974, startTime);
    if (typeof oscBore.frequency.exponentialRampToValueAtTime === 'function') {
      oscBore.frequency.exponentialRampToValueAtTime(freq, startTime + 0.052);
      oscOct.frequency.exponentialRampToValueAtTime(freq * 2, startTime + 0.052);
    }
    octGain.gain.setValueAtTime(0.22, startTime);

    // 氣震音 (Diaphragmatic bamboo flute vibrato)
    if (durationSec >= 0.35) {
      const vib = chamberAudioCtx.createOscillator();
      const vibGain = chamberAudioCtx.createGain();
      vib.type = 'sine';
      vib.frequency.setValueAtTime(4.8, startTime);
      vibGain.gain.setValueAtTime(0.0001, startTime);
      vibGain.gain.linearRampToValueAtTime(freq * 0.006, startTime + 0.16);
      vib.connect(vibGain);
      vibGain.connect(oscBore.frequency);
      vib.start(startTime);
      vib.stop(startTime + durationSec + 0.06);
    }

    const attack = Math.min(0.085, durationSec * 0.32);
    const peak = 0.042;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + attack);
    env.gain.setValueAtTime(peak * 0.88, Math.max(startTime + attack, startTime + durationSec * 0.72));
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.08);

    // 竹口吹氣聲 (Airy bamboo breath whisper)
    if (chamberNoiseBuffer && typeof chamberAudioCtx.createBufferSource === 'function') {
      const breathSrc = chamberAudioCtx.createBufferSource();
      const breathFilter = chamberAudioCtx.createBiquadFilter();
      const breathGain = chamberAudioCtx.createGain();
      breathSrc.buffer = chamberNoiseBuffer;
      breathSrc.loop = true;
      breathFilter.type = 'bandpass';
      breathFilter.frequency.setValueAtTime(Math.min(3800, freq * 2), startTime);
      breathFilter.Q.setValueAtTime(5.5, startTime);
      breathGain.gain.setValueAtTime(0.0001, startTime);
      breathGain.gain.linearRampToValueAtTime(0.014, startTime + attack);
      breathGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.05);
      breathSrc.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(hedwigBusGain || chamberFilterNode);
      disconnectNodesOnEnd(breathSrc, [breathFilter, breathGain]);
      breathSrc.start(startTime);
      breathSrc.stop(startTime + durationSec + 0.07);
    }

    oscBore.connect(env);
    oscOct.connect(octGain);
    octGain.connect(env);
    env.connect(hedwigBusGain || chamberFilterNode);
    disconnectNodesOnEnd(oscBore, [octGain, env]);

    oscBore.start(startTime);
    oscOct.start(startTime);
    oscBore.stop(startTime + durationSec + 0.1);
    oscOct.stop(startTime + durationSec + 0.1);
  }

  // 古琴泛音／玉磬清音 (Guqin Harmonic Fan-Yin & Jade Chime)
  function scheduleJadeFanYin(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const oscHarm = chamberAudioCtx.createOscillator();
    const oscJade = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const jadeGain = chamberAudioCtx.createGain();

    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(freq * 2, startTime);
    oscJade.type = 'sine';
    oscJade.frequency.setValueAtTime(freq * 2.756, startTime);
    jadeGain.gain.setValueAtTime(0.032, startTime);
    jadeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.19);

    const tail = Math.max(durationSec * 1.35, 0.78);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.034, startTime + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + tail);

    oscHarm.connect(env);
    oscJade.connect(jadeGain);
    jadeGain.connect(env);
    env.connect(hedwigBusGain || chamberFilterNode);
    disconnectNodesOnEnd(oscHarm, [jadeGain, env]);

    oscHarm.start(startTime);
    oscJade.start(startTime);
    oscHarm.stop(startTime + tail + 0.04);
    oscJade.stop(startTime + tail + 0.04);
  }

  // --- 《殘卷異聞錄》專屬懸疑音色組 (Forbidden Scroll Suspense Voices) ---

  // 開啟殘卷瞬間：藏經閣青銅暗磬與古琴低頻沉鳴
  function scheduleScrollOpenGong(startTime) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = riddleBusGain || chamberFilterNode;
    const freqs = [65.41, 98.0, 103.83, 207.65];
    const gains = [0.09, 0.055, 0.038, 0.022];
    freqs.forEach((f, idx) => {
      const osc = chamberAudioCtx.createOscillator();
      const env = chamberAudioCtx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, startTime);
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(gains[idx], startTime + 0.05);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.3);
      osc.connect(env);
      env.connect(targetBus);
      disconnectNodesOnEnd(osc, [env]);
      osc.start(startTime);
      osc.stop(startTime + 2.35);
    });
  }

  // 古琴沉按暗撥 (Creeping night-stalking muted bass pizzicato)
  function scheduleSuspensePulse(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = riddleBusGain || chamberFilterNode;
    const oscSub = chamberAudioCtx.createOscillator();
    const oscStr = chamberAudioCtx.createOscillator();
    const lp = chamberAudioCtx.createBiquadFilter();
    const env = chamberAudioCtx.createGain();

    oscSub.type = 'triangle';
    oscStr.type = 'sawtooth';
    oscSub.frequency.setValueAtTime(freq, startTime);
    oscStr.frequency.setValueAtTime(freq * 2, startTime);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(460, startTime);
    if (typeof lp.frequency.exponentialRampToValueAtTime === 'function') {
      lp.frequency.exponentialRampToValueAtTime(160, startTime + 0.28);
    }
    lp.Q.setValueAtTime(2.1, startTime);

    const strGain = chamberAudioCtx.createGain();
    strGain.gain.setValueAtTime(0.28, startTime);

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.085, startTime + 0.014);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.32, durationSec));

    oscSub.connect(lp);
    oscStr.connect(strGain);
    strGain.connect(lp);
    lp.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(oscSub, [strGain, lp, env]);

    oscSub.start(startTime);
    oscStr.start(startTime);
    oscSub.stop(startTime + durationSec + 0.06);
    oscStr.stop(startTime + durationSec + 0.06);
  }

  // 琵琶／古箏寒弦冷撥 (Sharp metallic chromatic mystery pluck)
  function scheduleSuspensePipa(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = riddleBusGain || chamberFilterNode;
    const osc = chamberAudioCtx.createOscillator();
    const bp = chamberAudioCtx.createBiquadFilter();
    const env = chamberAudioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.012, startTime);
    if (typeof osc.frequency.exponentialRampToValueAtTime === 'function') {
      osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.018);
    }

    bp.type = 'lowpass';
    bp.frequency.setValueAtTime(Math.min(4200, freq * 5.2), startTime);
    if (typeof bp.frequency.exponentialRampToValueAtTime === 'function') {
      bp.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.3), startTime + 0.19);
    }
    bp.Q.setValueAtTime(1.8, startTime);

    const tail = Math.max(durationSec * 1.15, 0.48);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.056, startTime + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + tail);

    osc.connect(bp);
    bp.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(osc, [bp, env]);

    osc.start(startTime);
    osc.stop(startTime + tail + 0.04);
  }

  // 幽咽洞簫半音滑音 (Eerie ghostly bamboo flute half-step bend)
  function scheduleSuspenseGhostXiao(freqFrom, freqTo, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = riddleBusGain || chamberFilterNode;
    const osc = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freqFrom, startTime);
    if (typeof osc.frequency.exponentialRampToValueAtTime === 'function') {
      osc.frequency.exponentialRampToValueAtTime(freqTo, startTime + durationSec * 0.65);
    }

    const vib = chamberAudioCtx.createOscillator();
    const vibGain = chamberAudioCtx.createGain();
    vib.type = 'sine';
    vib.frequency.setValueAtTime(3.7, startTime);
    vibGain.gain.setValueAtTime(0.0001, startTime);
    vibGain.gain.linearRampToValueAtTime(freqTo * 0.008, startTime + 0.25);
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.044, startTime + 0.18);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.12);

    if (chamberNoiseBuffer && typeof chamberAudioCtx.createBufferSource === 'function') {
      const breathSrc = chamberAudioCtx.createBufferSource();
      const breathBp = chamberAudioCtx.createBiquadFilter();
      const breathGain = chamberAudioCtx.createGain();
      breathSrc.buffer = chamberNoiseBuffer;
      breathSrc.loop = true;
      breathBp.type = 'bandpass';
      breathBp.frequency.setValueAtTime(freqTo * 2.2, startTime);
      breathBp.Q.setValueAtTime(4.5, startTime);
      breathGain.gain.setValueAtTime(0.0001, startTime);
      breathGain.gain.linearRampToValueAtTime(0.018, startTime + 0.16);
      breathGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.08);
      breathSrc.connect(breathBp);
      breathBp.connect(breathGain);
      breathGain.connect(targetBus);
      disconnectNodesOnEnd(breathSrc, [breathBp, breathGain]);
      breathSrc.start(startTime);
      breathSrc.stop(startTime + durationSec + 0.1);
    }

    osc.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(osc, [vibGain, env]);

    osc.start(startTime);
    vib.start(startTime);
    osc.stop(startTime + durationSec + 0.14);
    vib.stop(startTime + durationSec + 0.14);
  }

  // 寒玉三全音編磬 (Icy tritone & minor-9th crystal glint)
  function scheduleSuspenseColdChime(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = riddleBusGain || chamberFilterNode;
    const osc1 = chamberAudioCtx.createOscillator();
    const osc2 = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const g2 = chamberAudioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.756, startTime);
    g2.gain.setValueAtTime(0.18, startTime);

    const tail = Math.max(durationSec * 1.3, 0.85);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.036, startTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + tail);

    osc1.connect(env);
    osc2.connect(g2);
    g2.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(osc1, [g2, env]);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + tail + 0.04);
    osc2.stop(startTime + tail + 0.04);
  }

  // --- 「路摸思 (Lumos)」專屬星輝音色組 (Starlight Pearl & Ethereal Harmonics Voices) ---

  // 點亮魔杖／夜明珠瞬間：星輝泛音上行流光
  function scheduleLumosWandSparkle(startTime) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = lumosBusGain || chamberFilterNode;
    const sparkleNotes = [587.33, 739.99, 987.77, 1174.66, 1479.98];
    sparkleNotes.forEach((f, idx) => {
      const t = startTime + idx * 0.048;
      const osc = chamberAudioCtx.createOscillator();
      const oscShimmer = chamberAudioCtx.createOscillator();
      const env = chamberAudioCtx.createGain();
      const shimGain = chamberAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      oscShimmer.type = 'sine';
      oscShimmer.frequency.setValueAtTime(f * 2, t);
      shimGain.gain.setValueAtTime(0.22, t);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.032 - idx * 0.003, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      osc.connect(env);
      oscShimmer.connect(shimGain);
      shimGain.connect(env);
      env.connect(targetBus);
      disconnectNodesOnEnd(osc, [shimGain, env]);
      osc.start(t);
      oscShimmer.start(t);
      osc.stop(t + 1.1);
      oscShimmer.stop(t + 1.1);
    });
  }

  // 夜明珠暖韻 (Warm Silk & Sheng-like fifth halo)
  function scheduleLumosWarmPad(freqs, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode || !Array.isArray(freqs)) return;
    const targetBus = lumosBusGain || chamberFilterNode;
    freqs.forEach((f, idx) => {
      const osc = chamberAudioCtx.createOscillator();
      const env = chamberAudioCtx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, startTime);
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(idx === 0 ? 0.034 : 0.02, startTime + 0.36);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.25);
      osc.connect(env);
      env.connect(targetBus);
      disconnectNodesOnEnd(osc, [env]);
      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.3);
    });
  }

  // 古琴清亮泛音 (Crystalline Guqin 7th/9th-hui harmonic pluck)
  function scheduleLumosHarmonicQin(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = lumosBusGain || chamberFilterNode;
    const oscFund = chamberAudioCtx.createOscillator();
    const oscHarm = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const harmGain = chamberAudioCtx.createGain();

    oscFund.type = 'sine';
    oscFund.frequency.setValueAtTime(freq, startTime);
    oscHarm.type = 'triangle';
    oscHarm.frequency.setValueAtTime(freq * 2, startTime);
    harmGain.gain.setValueAtTime(0.28, startTime);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.32);

    const tail = Math.max(durationSec * 1.25, 0.72);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.044, startTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + tail);

    oscFund.connect(env);
    oscHarm.connect(harmGain);
    harmGain.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(oscFund, [harmGain, env]);

    oscFund.start(startTime);
    oscHarm.start(startTime);
    oscFund.stop(startTime + tail + 0.05);
    oscHarm.stop(startTime + tail + 0.05);
  }

  // 玉磬星鈴 (Sparkling high-register Jade Star-Chime)
  function scheduleLumosStarBell(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = lumosBusGain || chamberFilterNode;
    const osc1 = chamberAudioCtx.createOscillator();
    const osc2 = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const g2 = chamberAudioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.998, startTime);
    g2.gain.setValueAtTime(0.14, startTime);

    const tail = Math.max(durationSec * 1.35, 0.9);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.028, startTime + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + tail);

    osc1.connect(env);
    osc2.connect(g2);
    g2.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(osc1, [g2, env]);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + tail + 0.05);
    osc2.stop(startTime + tail + 0.05);
  }

  // 清風暖竹笛 (Warm lyrical Bamboo Dizi melody)
  function scheduleLumosBambooDizi(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const targetBus = lumosBusGain || chamberFilterNode;
    const oscMain = chamberAudioCtx.createOscillator();
    const oscSoftOct = chamberAudioCtx.createOscillator();
    const lp = chamberAudioCtx.createBiquadFilter();
    const env = chamberAudioCtx.createGain();
    const octGain = chamberAudioCtx.createGain();

    oscMain.type = 'triangle';
    oscSoftOct.type = 'sine';
    oscMain.frequency.setValueAtTime(freq * 0.994, startTime);
    if (typeof oscMain.frequency.exponentialRampToValueAtTime === 'function') {
      oscMain.frequency.exponentialRampToValueAtTime(freq, startTime + 0.045);
    }
    oscSoftOct.frequency.setValueAtTime(freq * 2, startTime);
    octGain.gain.setValueAtTime(0.18, startTime);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(3600, freq * 3.1), startTime);
    lp.Q.setValueAtTime(0.9, startTime);

    if (durationSec >= 0.48) {
      const vib = chamberAudioCtx.createOscillator();
      const vibGain = chamberAudioCtx.createGain();
      vib.type = 'sine';
      vib.frequency.setValueAtTime(4.9, startTime);
      vibGain.gain.setValueAtTime(0.0001, startTime);
      vibGain.gain.linearRampToValueAtTime(freq * 0.0065, startTime + 0.22);
      vib.connect(vibGain);
      vibGain.connect(oscMain.frequency);
      vibGain.connect(oscSoftOct.frequency);
      vib.start(startTime);
      vib.stop(startTime + durationSec + 0.12);
    }

    const attack = Math.min(0.11, durationSec * 0.25);
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.046, startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.12);

    if (chamberNoiseBuffer && typeof chamberAudioCtx.createBufferSource === 'function') {
      const breathSrc = chamberAudioCtx.createBufferSource();
      const breathBp = chamberAudioCtx.createBiquadFilter();
      const breathGain = chamberAudioCtx.createGain();
      breathSrc.buffer = chamberNoiseBuffer;
      breathSrc.loop = true;
      breathBp.type = 'bandpass';
      breathBp.frequency.setValueAtTime(Math.min(3400, freq * 1.9), startTime);
      breathBp.Q.setValueAtTime(6.0, startTime);
      breathGain.gain.setValueAtTime(0.0001, startTime);
      breathGain.gain.linearRampToValueAtTime(0.009, startTime + attack);
      breathGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.06);
      breathSrc.connect(breathBp);
      breathBp.connect(breathGain);
      breathGain.connect(targetBus);
      disconnectNodesOnEnd(breathSrc, [breathBp, breathGain]);
      breathSrc.start(startTime);
      breathSrc.stop(startTime + durationSec + 0.08);
    }

    oscMain.connect(lp);
    oscSoftOct.connect(octGain);
    octGain.connect(lp);
    lp.connect(env);
    env.connect(targetBus);
    disconnectNodesOnEnd(oscMain, [octGain, lp, env]);

    oscMain.start(startTime);
    oscSoftOct.start(startTime);
    oscMain.stop(startTime + durationSec + 0.14);
    oscSoftOct.stop(startTime + durationSec + 0.14);
  }

  function scheduleChamberBars() {
    if (
      !isChamberBgmPlaying ||
      !chamberAudioCtx ||
      document.hidden ||
      chamberAudioCtx.state !== 'running'
    ) {
      return;
    }
    if (chamberWasStandby && chamberLastCtxTime >= 0 && chamberAudioCtx.currentTime > chamberLastCtxTime + 0.03) {
      chamberWasStandby = false;
      chamberNeedsRebuild = false;
      chamberFrozenTicks = 0;
    }
    chamberLastCtxTime = chamberAudioCtx.currentTime;
    // Prevent stale past timestamps from scheduling multiple bars at once after standby wake
    if (chamberNextBarTime < chamberAudioCtx.currentTime + 0.02) {
      chamberNextBarTime = chamberAudioCtx.currentTime + 0.08;
    }

    if (chamberMusicMode === 'riddle') {
      const riddleBarDuration = RIDDLE_BEAT_SEC * 4;
      while (chamberNextBarTime < chamberAudioCtx.currentTime + 0.9) {
        const bar = RIDDLE_BARS[riddleBarIndex % RIDDLE_BARS.length];
        const barStart = chamberNextBarTime;
        (bar.pulses || []).forEach(([beatOffset, freq, durBeats]) => {
          scheduleSuspensePulse(
            freq,
            barStart + beatOffset * RIDDLE_BEAT_SEC,
            durBeats * RIDDLE_BEAT_SEC
          );
        });
        (bar.pipa || []).forEach(([beatOffset, freq, durBeats]) => {
          scheduleSuspensePipa(
            freq,
            barStart + beatOffset * RIDDLE_BEAT_SEC,
            durBeats * RIDDLE_BEAT_SEC
          );
        });
        (bar.xiao || []).forEach(([beatOffset, freqFrom, freqTo, durBeats]) => {
          scheduleSuspenseGhostXiao(
            freqFrom,
            freqTo,
            barStart + beatOffset * RIDDLE_BEAT_SEC,
            durBeats * RIDDLE_BEAT_SEC
          );
        });
        (bar.chimes || []).forEach(([beatOffset, freq, durBeats]) => {
          scheduleSuspenseColdChime(
            freq,
            barStart + beatOffset * RIDDLE_BEAT_SEC,
            durBeats * RIDDLE_BEAT_SEC
          );
        });
        chamberNextBarTime += riddleBarDuration;
        riddleBarIndex = (riddleBarIndex + 1) % RIDDLE_BARS.length;
      }
      return;
    }

    if (chamberMusicMode === 'lumos') {
      const lumosBarDuration = LUMOS_BEAT_SEC * 4;
      while (chamberNextBarTime < chamberAudioCtx.currentTime + 0.9) {
        const bar = LUMOS_BARS[lumosBarIndex % LUMOS_BARS.length];
        const barStart = chamberNextBarTime;
        if (bar.pad && bar.pad.length) {
          scheduleLumosWarmPad(bar.pad, barStart, lumosBarDuration * 0.96);
        }
        (bar.harmonics || []).forEach(([beatOffset, freq, durBeats]) => {
          scheduleLumosHarmonicQin(
            freq,
            barStart + beatOffset * LUMOS_BEAT_SEC,
            durBeats * LUMOS_BEAT_SEC
          );
        });
        (bar.dizi || []).forEach(([beatOffset, freq, durBeats]) => {
          scheduleLumosBambooDizi(
            freq,
            barStart + beatOffset * LUMOS_BEAT_SEC,
            durBeats * LUMOS_BEAT_SEC
          );
        });
        (bar.bells || []).forEach(([beatOffset, freq, durBeats]) => {
          scheduleLumosStarBell(
            freq,
            barStart + beatOffset * LUMOS_BEAT_SEC,
            durBeats * LUMOS_BEAT_SEC
          );
        });
        chamberNextBarTime += lumosBarDuration;
        lumosBarIndex = (lumosBarIndex + 1) % LUMOS_BARS.length;
      }
      return;
    }

    const barDuration = CHAMBER_BEAT_SEC * 3;
    while (chamberNextBarTime < chamberAudioCtx.currentTime + 0.9) {
      const bar = CHAMBER_BARS[chamberBarIndex % CHAMBER_BARS.length];
      const barStart = chamberNextBarTime;
      const arpeggioStep = bar.pluck.length >= 5 ? 0.044 : 0.062;
      bar.pluck.forEach((freq, idx) => {
        scheduleGuzhengNote(freq, barStart + idx * arpeggioStep, barDuration * 1.15, false, false);
      });
      bar.notes.forEach(([beatOffset, freq, durBeats, voice]) => {
        const t = barStart + beatOffset * CHAMBER_BEAT_SEC;
        const d = durBeats * CHAMBER_BEAT_SEC;
        if (voice === 'f') {
          scheduleJadeFanYin(freq, t, d);
        } else if (voice === 'zf') {
          scheduleGuzhengNote(freq, t, d, true, durBeats >= 1.5);
          scheduleJadeFanYin(freq, t, d);
        } else if (voice === 'zx') {
          scheduleGuzhengNote(freq, t, d, true, true);
          scheduleXiaoFlute(freq, t, d);
        } else if (voice === 'zv') {
          scheduleGuzhengNote(freq, t, d, true, true);
        } else {
          scheduleGuzhengNote(freq, t, d, true, false);
        }
      });
      chamberNextBarTime += barDuration;
      chamberBarIndex = (chamberBarIndex + 1) % CHAMBER_BARS.length;
    }
  }

  function syncChamberBgmUi() {
    const dict = HP_I18N[currentLang];
    if (!dict) return;
    if (elHpBgmLabel) {
      elHpBgmLabel.textContent = isChamberBgmPlaying
        ? dict.bgmBtnPlaying || '琴簫'
        : dict.bgmBtnIdle || '琴簫';
    }
    if (btnHpBgm) {
      btnHpBgm.classList.toggle('is-playing', isChamberBgmPlaying);
      btnHpBgm.setAttribute('aria-pressed', String(isChamberBgmPlaying));
      const titleText = isChamberBgmPlaying
        ? dict.bgmPauseTitle || ''
        : dict.bgmPlayTitle || '';
      if (titleText) {
        btnHpBgm.setAttribute('title', titleText);
        btnHpBgm.setAttribute('aria-label', titleText);
      }
    }
  }

  function clearChamberWakeRetries() {
    while (chamberWakeRetryTimers.length > 0) {
      clearTimeout(chamberWakeRetryTimers.pop());
    }
  }

  function ensureChamberMasterAudible() {
    if (!chamberAudioCtx || !chamberMasterGain) return;
    try {
      const now = chamberAudioCtx.currentTime;
      chamberMasterGain.gain.cancelScheduledValues(now);
      if (typeof chamberMasterGain.gain.setTargetAtTime === 'function') {
        chamberMasterGain.gain.setTargetAtTime(0.82, now, 0.08);
      } else {
        chamberMasterGain.gain.setValueAtTime(0.82, now);
      }
    } catch (_e) {
      // ignore audio param transition errors
    }
  }

  // IMPORTANT: Never call chamberAudioCtx.suspend() on standby!
  // Calling suspend() from JS sets WebKit's script-suspended flag, which blocks iOS/macOS Safari
  // from auto-resuming AVAudioSession when unlocking the screen. Stopping only the bar scheduler
  // lets existing notes decay naturally in <0.5s while allowing instant hands-free OS wake!
  function suspendChamberBgmForStandby() {
    chamberWasStandby = true;
    clearChamberWakeRetries();
    if (chamberSchedulerTimer) {
      clearInterval(chamberSchedulerTimer);
      chamberSchedulerTimer = null;
    }
  }

  function startChamberWatchdog() {
    if (chamberWatchdogTimer) return;
    chamberWatchdogTimer = setInterval(() => {
      if (!isChamberBgmPlaying || document.hidden) return;
      if (!chamberAudioCtx || chamberAudioCtx.state === 'closed') {
        wakeChamberBgm(false);
        return;
      }
      if (chamberAudioCtx.state !== 'running') {
        if (typeof chamberAudioCtx.resume === 'function') {
          chamberAudioCtx.resume().then(() => wakeChamberBgm(false)).catch(() => {});
        }
        return;
      }
      const curT = chamberAudioCtx.currentTime;
      if (chamberLastCtxTime >= 0 && curT <= chamberLastCtxTime + 0.01) {
        chamberFrozenTicks += 1;
        // Detect WebKit Zombie AudioContext (reports 'running' after standby, but currentTime is frozen)
        if (chamberFrozenTicks >= 2) {
          chamberNeedsRebuild = true;
          destroyChamberAudio();
          wakeChamberBgm(false);
        }
      } else {
        chamberLastCtxTime = curT;
        chamberFrozenTicks = 0;
        chamberWasStandby = false;
        chamberNeedsRebuild = false;
        ensureChamberMasterAudible();
        if (!chamberSchedulerTimer) {
          chamberNextBarTime = curT + 0.08;
          scheduleChamberBars();
          chamberSchedulerTimer = setInterval(scheduleChamberBars, 240);
        }
      }
    }, 900);
  }

  function stopChamberWatchdog() {
    if (chamberWatchdogTimer) {
      clearInterval(chamberWatchdogTimer);
      chamberWatchdogTimer = null;
    }
  }

  function wakeChamberBgm(playIntroPickup = false) {
    if (!isChamberBgmPlaying || document.hidden) return;
    const ctxAudio = ensureChamberAudio();
    if (!ctxAudio) return;
    startChamberWatchdog();

    const startRunningChamber = () => {
      if (
        !isChamberBgmPlaying ||
        document.hidden ||
        !chamberAudioCtx ||
        chamberAudioCtx.state !== 'running'
      ) {
        return;
      }
      ensureChamberMasterAudible();
      syncModeBusGains(false);
      const now = chamberAudioCtx.currentTime;
      if (!chamberSchedulerTimer) {
        if (playIntroPickup && chamberMusicMode === 'hedwig' && chamberBarIndex === 0) {
          const pickupStart = now + 0.08;
          scheduleGuzhengNote(493.88, pickupStart, CHAMBER_BEAT_SEC * 0.98, true, false);
          scheduleJadeFanYin(493.88, pickupStart, CHAMBER_BEAT_SEC * 0.85);
          chamberNextBarTime = pickupStart + CHAMBER_BEAT_SEC;
        } else if (playIntroPickup && chamberMusicMode === 'lumos') {
          scheduleLumosWandSparkle(now + 0.03);
          chamberNextBarTime = now + 0.16;
        } else {
          chamberNextBarTime = now + 0.08;
        }
        scheduleChamberBars();
        chamberSchedulerTimer = setInterval(scheduleChamberBars, 240);
      } else {
        scheduleChamberBars();
      }
    };

    if (ctxAudio.state === 'running') {
      startRunningChamber();
    } else if (typeof ctxAudio.resume === 'function') {
      ctxAudio.resume().then(startRunningChamber).catch(() => {});
    }
  }

  function scheduleStaggeredChamberWake() {
    if (!isChamberBgmPlaying || document.hidden) return;
    clearChamberWakeRetries();
    wakeChamberBgm(false);
    // Cover iOS FaceID / Lock Screen animation delay (AVAudioSession releases 250–1200ms after visibilitychange)
    [260, 750, 1500].forEach((ms) => {
      chamberWakeRetryTimers.push(
        setTimeout(() => {
          if (isChamberBgmPlaying && !document.hidden) {
            wakeChamberBgm(false);
          }
        }, ms)
      );
    });
  }

  function isChamberAudioHealthy() {
    return Boolean(
      chamberAudioCtx &&
        chamberAudioCtx.state === 'running' &&
        !chamberNeedsRebuild &&
        chamberFrozenTicks === 0 &&
        !chamberWasStandby
    );
  }

  function rebuildAndWakeChamberOnGesture(playIntroPickup = false) {
    if (!isChamberBgmPlaying || document.hidden) return;
    if (
      !chamberAudioCtx ||
      chamberAudioCtx.state !== 'running' ||
      chamberNeedsRebuild ||
      chamberFrozenTicks > 0 ||
      chamberWasStandby
    ) {
      // Fresh AudioContext + 1-frame silent buffer inside a real user gesture guarantees audio on all iOS versions
      destroyChamberAudio();
      chamberNeedsRebuild = false;
      chamberWasStandby = false;
      const freshCtx = ensureChamberAudio();
      if (freshCtx) {
        primeChamberSilentUnlock(freshCtx);
      }
    }
    wakeChamberBgm(playIntroPickup);
  }

  function pauseChamberBgm() {
    isChamberBgmPlaying = false;
    chamberWasStandby = false;
    clearChamberWakeRetries();
    stopChamberWatchdog();
    if (chamberSchedulerTimer) {
      clearInterval(chamberSchedulerTimer);
      chamberSchedulerTimer = null;
    }
    if (chamberAudioCtx && chamberMasterGain) {
      try {
        const now = chamberAudioCtx.currentTime;
        chamberMasterGain.gain.cancelScheduledValues(now);
        chamberMasterGain.gain.setValueAtTime(Math.max(0.0001, chamberMasterGain.gain.value), now);
        chamberMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      } catch (_e) {
        // ignore audio context transition errors
      }
    }
    syncChamberBgmUi();
  }

  function toggleChamberBgm() {
    if (isChamberBgmPlaying) {
      // If standby left AudioContext interrupted or zombie-frozen, tapping 琴簫 rebuilds & plays right away!
      if (!isChamberAudioHealthy()) {
        rebuildAndWakeChamberOnGesture(false);
        return;
      }
      userExplicitlyMutedBgm = true;
      pauseChamberBgm();
      return;
    }
    userExplicitlyMutedBgm = false;
    chamberMusicMode = resolveChamberMusicMode();
    isChamberBgmPlaying = true;
    syncChamberBgmUi();
    const shouldPlayPickup = chamberMusicMode === 'hedwig' || chamberMusicMode === 'lumos';
    if (chamberWasStandby || chamberNeedsRebuild || (chamberAudioCtx && chamberAudioCtx.state !== 'running')) {
      rebuildAndWakeChamberOnGesture(shouldPlayPickup);
    } else {
      const ctxAudio = ensureChamberAudio();
      if (!ctxAudio) return;
      primeChamberSilentUnlock(ctxAudio);
      wakeChamberBgm(shouldPlayPickup);
    }
  }

  function syncLumosChamberMusic() {
    // 《殘卷異聞錄》開啟期間維持懸疑配樂優先，完全不受路摸思開關影響
    if (isRiddleModalOpen) {
      return;
    }

    chamberMusicMode = resolveChamberMusicMode();
    if (lumosActive) {
      lumosBarIndex = 0;
    }

    // 僅在使用者已主動開啟「琴簫」按鈕時才切換配樂，絕不自動起音
    if (!isChamberBgmPlaying || userExplicitlyMutedBgm) {
      syncModeBusGains(true);
      return;
    }

    if (lumosActive) {
      const ctxAudio = ensureChamberAudio();
      if (!ctxAudio) return;
      primeChamberSilentUnlock(ctxAudio);
      syncModeBusGains(false);

      const triggerLumosStart = () => {
        if (
          isRiddleModalOpen ||
          !lumosActive ||
          !isChamberBgmPlaying ||
          !chamberAudioCtx ||
          chamberAudioCtx.state !== 'running'
        ) {
          return;
        }
        ensureChamberMasterAudible();
        syncModeBusGains(false);
        const now = chamberAudioCtx.currentTime;
        scheduleLumosWandSparkle(now + 0.02);
        chamberNextBarTime = now + 0.15;
        scheduleChamberBars();
        if (!chamberSchedulerTimer) {
          chamberSchedulerTimer = setInterval(scheduleChamberBars, 240);
        }
        startChamberWatchdog();
      };

      if (ctxAudio.state === 'running') {
        triggerLumosStart();
      } else if (typeof ctxAudio.resume === 'function') {
        ctxAudio.resume().then(triggerLumosStart).catch(() => {});
      }
      return;
    }

    // 關閉路摸思（且殘卷未開）→ 平滑淡回《巫師江湖・海德薇變奏》
    syncModeBusGains(false);
    if (isChamberBgmPlaying) {
      if (chamberAudioCtx && chamberAudioCtx.state === 'running') {
        const now = chamberAudioCtx.currentTime;
        if (chamberBarIndex === 0) {
          scheduleGuzhengNote(493.88, now + 0.1, CHAMBER_BEAT_SEC * 0.98, true, false);
          scheduleJadeFanYin(493.88, now + 0.1, CHAMBER_BEAT_SEC * 0.85);
          chamberNextBarTime = now + 0.1 + CHAMBER_BEAT_SEC;
        } else {
          chamberNextBarTime = now + 0.14;
        }
        scheduleChamberBars();
      } else {
        wakeChamberBgm(chamberBarIndex === 0);
      }
    }
  }

  function enterRiddleSuspenseMusic() {
    isRiddleModalOpen = true;
    chamberMusicMode = 'riddle';
    riddleBarIndex = 0;

    // 僅在使用者已主動開啟「琴簫」按鈕時才切換懸疑配樂，絕不自動起音
    if (!isChamberBgmPlaying || userExplicitlyMutedBgm) {
      syncModeBusGains(true);
      return;
    }

    const ctxAudio = ensureChamberAudio();
    if (!ctxAudio) return;
    syncModeBusGains(false);

    const triggerSuspenseStart = () => {
      if (!isRiddleModalOpen || !isChamberBgmPlaying || !chamberAudioCtx || chamberAudioCtx.state !== 'running') {
        return;
      }
      ensureChamberMasterAudible();
      syncModeBusGains(false);
      const now = chamberAudioCtx.currentTime;
      scheduleScrollOpenGong(now + 0.02);
      chamberNextBarTime = now + 0.14;
      scheduleChamberBars();
      if (!chamberSchedulerTimer) {
        chamberSchedulerTimer = setInterval(scheduleChamberBars, 240);
      }
      startChamberWatchdog();
    };

    if (ctxAudio.state === 'running') {
      triggerSuspenseStart();
    } else if (typeof ctxAudio.resume === 'function') {
      ctxAudio.resume().then(triggerSuspenseStart).catch(() => {});
    }
  }

  function exitRiddleSuspenseMusic() {
    if (!isRiddleModalOpen) return;
    isRiddleModalOpen = false;
    chamberMusicMode = resolveChamberMusicMode();
    syncModeBusGains(false);

    if (isChamberBgmPlaying) {
      if (chamberAudioCtx && chamberAudioCtx.state === 'running') {
        const now = chamberAudioCtx.currentTime;
        if (chamberMusicMode === 'lumos') {
          scheduleLumosWandSparkle(now + 0.03);
          chamberNextBarTime = now + 0.16;
        } else if (chamberBarIndex === 0) {
          scheduleGuzhengNote(493.88, now + 0.12, CHAMBER_BEAT_SEC * 0.98, true, false);
          scheduleJadeFanYin(493.88, now + 0.12, CHAMBER_BEAT_SEC * 0.85);
          chamberNextBarTime = now + 0.12 + CHAMBER_BEAT_SEC;
        } else {
          chamberNextBarTime = now + 0.16;
        }
        scheduleChamberBars();
      } else {
        wakeChamberBgm(chamberMusicMode === 'lumos' || chamberBarIndex === 0);
      }
    }
  }

  if (btnHpBgm) {
    btnHpBgm.addEventListener('click', toggleChamberBgm);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isChamberBgmPlaying) suspendChamberBgmForStandby();
      clearRiddleCipherTimers();
    } else {
      if (isChamberBgmPlaying) scheduleStaggeredChamberWake();
      if (elRiddleModal && !elRiddleModal.classList.contains('hidden')) {
        renderRiddleCipherSequence(true);
      }
      ensureMagicSceneLoop();
    }
  });

  window.addEventListener('pageshow', () => {
    if (!document.hidden && isChamberBgmPlaying) scheduleStaggeredChamberWake();
  });

  window.addEventListener('focus', () => {
    if (!document.hidden && isChamberBgmPlaying) scheduleStaggeredChamberWake();
  });

  // True WebKit user-activation events ('touchend', 'click', 'mouseup', 'keydown'):
  // If iOS blocked background resume after deep lock-screen standby, first touch rebuilds a fresh AudioContext!
  const unlockChamberAfterStandby = (e) => {
    if (!isChamberBgmPlaying || document.hidden || isChamberAudioHealthy()) {
      return;
    }
    if (
      btnHpBgm &&
      e &&
      e.target &&
      typeof e.target.closest === 'function' &&
      e.target.closest('#hp-bgm-btn')
    ) {
      return;
    }
    rebuildAndWakeChamberOnGesture(false);
  };
  window.addEventListener('touchend', unlockChamberAfterStandby, { passive: true });
  window.addEventListener('click', unlockChamberAfterStandby, { passive: true });
  window.addEventListener('mouseup', unlockChamberAfterStandby, { passive: true });
  window.addEventListener('keydown', unlockChamberAfterStandby, { passive: true });

  let riddleCipherTimers = [];
  let riddleOpenDelayTimer = null;

  function clearRiddleCipherTimers() {
    while (riddleCipherTimers.length > 0) {
      clearTimeout(riddleCipherTimers.pop());
    }
  }

  function clearRiddleOpenDelayTimer() {
    if (riddleOpenDelayTimer !== null) {
      clearTimeout(riddleOpenDelayTimer);
      riddleOpenDelayTimer = null;
    }
  }

  function renderRiddleCipherSequence(animate = false) {
    if (!elRiddleModalCipher) return;
    clearRiddleCipherTimers();
    const dict = HP_I18N[currentLang];
    const rawCipher = String((dict && dict.riddleCipher) || '');
    elRiddleModalCipher.replaceChildren();
    if (!rawCipher) return;

    const prefersReduced = Boolean(
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    const shouldAnimate = Boolean(animate && !prefersReduced && !document.hidden);

    const numGroups = rawCipher.match(/\d+/g) || [];
    const tokenRegex =
      numGroups.length === 1 && numGroups[0].length >= 4
        ? /\d|[^\d\s]+|\s+/g
        : /\d+|[^\d\s]+|\s+/g;
    const rawTokens = rawCipher.match(tokenRegex) || [rawCipher];

    const stepBuckets = [];
    let pendingSeps = [];

    rawTokens.forEach((tok) => {
      if (/^\s+$/.test(tok)) {
        elRiddleModalCipher.appendChild(document.createTextNode(tok));
        return;
      }
      const isNum = /^\d+$/.test(tok);
      const span = document.createElement('span');
      span.className = `hp-cipher-token ${isNum ? 'is-num' : 'is-sep'}${shouldAnimate ? '' : ' is-visible'}`;
      span.textContent = tok;
      elRiddleModalCipher.appendChild(span);

      if (shouldAnimate) {
        if (isNum) {
          stepBuckets.push({ seps: pendingSeps, numEl: span });
          pendingSeps = [];
        } else {
          pendingSeps.push(span);
        }
      }
    });

    if (shouldAnimate) {
      if (pendingSeps.length > 0) {
        if (stepBuckets.length > 0) {
          stepBuckets[stepBuckets.length - 1].trailingSeps = pendingSeps;
        } else {
          pendingSeps.forEach((el) => el.classList.add('is-visible'));
        }
      }
      if (stepBuckets.length === 0) return;

      const stepInMs = 200;
      const holdVisibleMs = 1550;
      const stepOutMs = 135;
      const cyclePauseMs = 420;

      const scheduleCipherCycle = (initialDelayMs) => {
        clearRiddleCipherTimers();
        if (!elRiddleModal || elRiddleModal.classList.contains('hidden') || document.hidden) {
          return;
        }

        // Phase 1: Pop numbers in one by one
        stepBuckets.forEach((bucket, idx) => {
          const inTimer = window.setTimeout(() => {
            bucket.seps.forEach((sepEl) => sepEl.classList.add('is-visible'));
            bucket.numEl.classList.remove('is-popping-out', 'is-popping-in');
            void bucket.numEl.offsetWidth;
            bucket.numEl.classList.add('is-visible', 'is-popping-in');
            if (bucket.trailingSeps) {
              bucket.trailingSeps.forEach((sepEl) => sepEl.classList.add('is-visible'));
            }
          }, initialDelayMs + idx * stepInMs);
          riddleCipherTimers.push(inTimer);
        });

        // Phase 2: Hold all numbers visible for reading, then pop numbers out one by one
        const popOutStartMs = initialDelayMs + (stepBuckets.length - 1) * stepInMs + 460 + holdVisibleMs;
        stepBuckets.forEach((bucket, idx) => {
          const outTimer = window.setTimeout(() => {
            bucket.seps.forEach((sepEl) => sepEl.classList.remove('is-visible'));
            bucket.numEl.classList.remove('is-visible', 'is-popping-in', 'is-popping-out');
            void bucket.numEl.offsetWidth;
            bucket.numEl.classList.add('is-popping-out');
            if (bucket.trailingSeps) {
              bucket.trailingSeps.forEach((sepEl) => sepEl.classList.remove('is-visible'));
            }
          }, popOutStartMs + idx * stepOutMs);
          riddleCipherTimers.push(outTimer);
        });

        // Phase 3: Loop seamlessly while modal remains open
        const nextCycleDelayMs =
          popOutStartMs + (stepBuckets.length - 1) * stepOutMs + 380 + cyclePauseMs;
        const loopTimer = window.setTimeout(() => {
          if (elRiddleModal && !elRiddleModal.classList.contains('hidden') && !document.hidden) {
            scheduleCipherCycle(120);
          }
        }, nextCycleDelayMs);
        riddleCipherTimers.push(loopTimer);
      };

      scheduleCipherCycle(320);
    }
  }

  function syncRiddleLumosVisibility() {
    if (!elRiddleModalLumos) return;
    const dict = HP_I18N[currentLang];
    if (lumosActive && dict && dict.riddleLumos) {
      elRiddleModalLumos.textContent = dict.riddleLumos;
      elRiddleModalLumos.classList.remove('hidden');
    } else {
      elRiddleModalLumos.textContent = '';
      elRiddleModalLumos.classList.add('hidden');
    }
  }

  function openRiddleModal() {
    clearRiddleOpenDelayTimer();
    if (elRiddleModal) {
      elRiddleModal.classList.remove('hidden');
    }
    syncRiddleLumosVisibility();
    renderRiddleCipherSequence(true);
    enterRiddleSuspenseMusic();
    showSpellFeedback('feedbackRiddleUnlocked');
    spawnSpellBurst(
      window.innerWidth * 0.5,
      window.innerHeight * 0.35,
      ['#fde047', '#f59e0b', '#fef08a', '#d97706'],
      70
    );
  }

  function closeRiddleModal() {
    clearRiddleOpenDelayTimer();
    clearRiddleCipherTimers();
    if (elRiddleModal) {
      elRiddleModal.classList.add('hidden');
    }
    exitRiddleSuspenseMusic();
    if (elSpellFeedback) {
      elSpellFeedback.classList.add('hidden');
      elSpellFeedback.classList.remove('is-popping');
    }
    if (btnSpellCelebrate) {
      btnSpellCelebrate.classList.remove('is-active');
    }
    lastFeedbackKey = null;
  }

  if (btnRiddleClose) {
    btnRiddleClose.addEventListener('click', closeRiddleModal);
  }
  if (btnRiddleTopClose) {
    btnRiddleTopClose.addEventListener('click', closeRiddleModal);
  }
  if (elRiddleModal) {
    elRiddleModal.addEventListener('click', (e) => {
      if (e.target === elRiddleModal) {
        closeRiddleModal();
      }
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elRiddleModal && !elRiddleModal.classList.contains('hidden')) {
      closeRiddleModal();
    }
  });

  function showSpellFeedback(key) {
    lastFeedbackKey = key;
    if (!elSpellFeedback) return;
    const dict = HP_I18N[currentLang];
    const msg = dict[key];
    if (!msg) return;
    elSpellFeedback.textContent = msg;
    elSpellFeedback.classList.remove('hidden', 'is-popping');
    void elSpellFeedback.offsetWidth;
    elSpellFeedback.classList.add('is-popping');
  }

  function pulseInvisibleInk() {
    if (!elInvisibleInk) return;
    elInvisibleInk.classList.add('is-revealed');
    elInvisibleInk.classList.remove('is-flashing');
    void elInvisibleInk.offsetWidth;
    elInvisibleInk.classList.add('is-flashing');
  }

  function applyEggLanguage() {
    const dict = HP_I18N[currentLang];
    document.documentElement.setAttribute('data-lang', currentLang);
    document.documentElement.setAttribute('lang', currentLang === 'en' ? 'en' : 'zh-Hant-TW');
    document.title = dict.pageTitle;

    if (elOathEyebrow && HP_I18N.oathEyebrow) {
      elOathEyebrow.textContent = HP_I18N.oathEyebrow;
    }
    if (btnLang) btnLang.textContent = dict.langBtnLabel;
    if (elPlatformText) elPlatformText.textContent = dict.platformText;
    syncChamberBgmUi();
    if (btnLumosHeader) {
      btnLumosHeader.textContent = lumosActive ? dict.lumosOnBtn : dict.lumosOffBtn;
    }
    if (elBackBtn) elBackBtn.textContent = dict.backBtn;
    if (elEventTitle) elEventTitle.textContent = dict.eventTitle;
    if (elSubtitle) elSubtitle.textContent = dict.subtitle;
    if (btnSnitch) btnSnitch.setAttribute('title', dict.snitchTitle);
    if (elSnitchLabel) {
      if (snitchCaughtCount === 0) {
        elSnitchLabel.textContent = dict.snitchIdle;
      } else if (snitchCaughtCount === 1) {
        elSnitchLabel.textContent = dict.snitchOnce;
      } else {
        const currentTier = Math.floor(snitchCaughtCount / 5);
        const tierBadge = currentTier >= 1 ? ` · Lv.${currentTier}` : '';
        elSnitchLabel.textContent = `${dict.snitchMultiPrefix}${snitchCaughtCount}${dict.snitchMultiMid}${snitchCaughtCount * 150}${dict.snitchMultiSuffix}${tierBadge}`;
      }
    }
    if (elMinistryTag) elMinistryTag.textContent = dict.ministryTag;
    if (elParchmentTitle) elParchmentTitle.textContent = dict.parchmentTitle;
    if (elTrackTom) elTrackTom.textContent = dict.trackTom;
    if (elCastleBadge) elCastleBadge.textContent = dict.castleBadge;
    if (elTrackEunice) elTrackEunice.textContent = dict.trackEunice;
    if (elParchmentBody) elParchmentBody.textContent = dict.parchmentBody;
    if (elVowSignature) elVowSignature.textContent = dict.vowSignature || '';
    if (btnSpellLumos) {
      btnSpellLumos.textContent = lumosActive ? dict.lumosOnBtn : dict.spellLumos;
    }
    if (btnSpellMarauder) btnSpellMarauder.textContent = dict.spellMarauder;
    if (btnSpellCelebrate) btnSpellCelebrate.textContent = dict.spellCelebrate;
    if (lastFeedbackKey && elSpellFeedback && !elSpellFeedback.classList.contains('hidden')) {
      elSpellFeedback.textContent = dict[lastFeedbackKey] || '';
    }
    if (elInkHeader) elInkHeader.textContent = dict.inkHeader;
    if (elInkText) {
      elInkText.textContent = snitchCaughtCount >= 2 ? dict.inkTextSnitch : dict.inkTextDefault;
    }
    if (elRiddleModalEyebrow) elRiddleModalEyebrow.textContent = dict.riddleEyebrow;
    if (elRiddleModalTitle) elRiddleModalTitle.textContent = dict.riddleTitle;
    if (elRiddleModalIntro) elRiddleModalIntro.textContent = dict.riddleIntro;
    renderRiddleCipherSequence(Boolean(elRiddleModal && !elRiddleModal.classList.contains('hidden')));
    if (elRiddleModalMid) elRiddleModalMid.textContent = dict.riddleMid;
    syncRiddleLumosVisibility();
    if (btnRiddleClose) btnRiddleClose.textContent = dict.riddleCloseBtn;
    if (elDecreeEyebrow) elDecreeEyebrow.textContent = dict.decreeEyebrow;
    if (elSecretCodeText) elSecretCodeText.textContent = dict.secretCode;
    if (btnCopySpell) btnCopySpell.textContent = dict.copyBtnIdle;
    if (elFooterMottoText) elFooterMottoText.textContent = dict.footerMotto;
  }

  if (btnLang) {
    btnLang.addEventListener('click', () => {
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      safeSetStorage(STORAGE_KEY_LANG, currentLang);
      applyEggLanguage();
    });
  }

  function updateLumosPosition(x, y) {
    pointerX = x;
    pointerY = y;
    if (lumosOverlay) {
      lumosOverlay.style.setProperty('--lumos-x', `${Math.round(x)}px`);
      lumosOverlay.style.setProperty('--lumos-y', `${Math.round(y)}px`);
    }
  }

  updateLumosPosition(pointerX, pointerY);
  applyEggLanguage();

  function toggleLumos(forceState) {
    lumosActive = typeof forceState === 'boolean' ? forceState : !lumosActive;
    document.body.classList.toggle('hp-lumos-on', lumosActive);
    const dict = HP_I18N[currentLang];
    if (btnLumosHeader) {
      btnLumosHeader.setAttribute('aria-pressed', String(lumosActive));
      btnLumosHeader.textContent = lumosActive ? dict.lumosOnBtn : dict.lumosOffBtn;
    }
    if (btnSpellLumos) {
      btnSpellLumos.classList.toggle('is-active', lumosActive);
      btnSpellLumos.textContent = lumosActive ? dict.lumosOnBtn : dict.spellLumos;
    }
    syncRiddleLumosVisibility();
    syncLumosChamberMusic();
    if (lumosActive) {
      pulseInvisibleInk();
      showSpellFeedback('feedbackLumosOn');
      spawnSpellBurst(pointerX, pointerY, ['#fff6cc', '#ffd166', '#f59e0b', '#fef08a'], 55);
    } else {
      if (elInvisibleInk && !hasCastMarauder) {
        elInvisibleInk.classList.remove('is-revealed', 'is-flashing');
      }
      showSpellFeedback('feedbackLumosOff');
      spawnSpellBurst(pointerX, pointerY, ['#94a3b8', '#cbd5e1', '#ffd166'], 24);
    }
  }

  if (btnLumosHeader) {
    btnLumosHeader.addEventListener('click', () => toggleLumos());
  }

  if (btnSpellLumos) {
    btnSpellLumos.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      updateLumosPosition(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (btnSpellCelebrate) btnSpellCelebrate.classList.remove('is-active');
      toggleLumos();
    });
  }

  if (btnSpellMarauder) {
    btnSpellMarauder.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      hasCastMarauder = true;
      if (elMarauderRibbon) {
        elMarauderRibbon.classList.add('is-marching');
      }
      if (elParchmentCard) {
        elParchmentCard.classList.add('is-enchanted');
      }
      btnSpellMarauder.classList.add('is-active');
      if (btnSpellCelebrate) btnSpellCelebrate.classList.remove('is-active');
      pulseInvisibleInk();
      showSpellFeedback('feedbackMarauder');
      spawnSpellBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        ['#eab308', '#d97706', '#991b1b', '#fef3c7'],
        60
      );
    });
  }

  if (btnSpellCelebrate) {
    btnSpellCelebrate.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const houseColors = ['#ffd700', '#e11d48', '#fda4af', '#f59e0b', '#fef08a', '#34d399', '#fb7185'];
      spawnSpellBurst(rect.left + rect.width / 2, rect.top, houseColors, 85);
      spawnSpellBurst(window.innerWidth * 0.22, window.innerHeight * 0.28, houseColors, 60);
      spawnSpellBurst(window.innerWidth * 0.78, window.innerHeight * 0.28, houseColors, 60);
      setTimeout(() => {
        spawnSpellBurst(window.innerWidth * 0.35, window.innerHeight * 0.2, houseColors, 65);
        spawnSpellBurst(window.innerWidth * 0.65, window.innerHeight * 0.2, houseColors, 65);
      }, 220);
      setTimeout(() => {
        spawnSpellBurst(window.innerWidth * 0.5, window.innerHeight * 0.16, houseColors, 90);
      }, 450);

      if (elMarauderRibbon) {
        elMarauderRibbon.classList.remove('is-marching');
      }
      if (elParchmentCard) {
        elParchmentCard.classList.remove('is-enchanted');
      }
      if (!lumosActive && elInvisibleInk) {
        elInvisibleInk.classList.remove('is-revealed', 'is-flashing');
      }
      if (btnSpellMarauder) btnSpellMarauder.classList.remove('is-active');
      btnSpellCelebrate.classList.add('is-active');
      showSpellFeedback('feedbackMischief');

      if (hasCastMarauder) {
        hasCastMarauder = false;
        // Synchronously unlock AudioContext inside this click gesture so iOS Safari allows
        // the suspenseful scroll music to start smoothly 360ms later in openRiddleModal()!
        const ctxPrewarm = ensureChamberAudio();
        if (ctxPrewarm) {
          primeChamberSilentUnlock(ctxPrewarm);
          if (ctxPrewarm.state !== 'running' && typeof ctxPrewarm.resume === 'function') {
            ctxPrewarm.resume().catch(() => {});
          }
        }
        clearRiddleOpenDelayTimer();
        riddleOpenDelayTimer = window.setTimeout(() => {
          riddleOpenDelayTimer = null;
          openRiddleModal();
        }, 360);
      }
    });
  }

  if (btnSnitch) {
    const handleCatchSnitch = (e) => {
      const now = performance.now();
      if (now - snitchState.lastCatchTs < 180) return;
      snitchState.lastCatchTs = now;
      if (e && typeof e.preventDefault === 'function' && e.type === 'pointerdown') {
        e.preventDefault();
      }

      snitchCaughtCount += 1;
      const dict = HP_I18N[currentLang];
      const rect = btnSnitch.getBoundingClientRect();
      spawnSpellBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        ['#fff8dc', '#ffd700', '#f59e0b', '#fef08a'],
        65
      );
      if (elSnitchLabel) {
        const currentTier = Math.floor(snitchCaughtCount / 5);
        const tierBadge = currentTier >= 1 ? ` · Lv.${currentTier}` : '';
        elSnitchLabel.textContent =
          snitchCaughtCount === 1
            ? dict.snitchOnce
            : `${dict.snitchMultiPrefix}${snitchCaughtCount}${dict.snitchMultiMid}${snitchCaughtCount * 150}${dict.snitchMultiSuffix}${tierBadge}`;
      }
      if (elSnitchScoreboard) {
        elSnitchScoreboard.classList.remove('is-scoring');
        void elSnitchScoreboard.offsetWidth;
        elSnitchScoreboard.classList.add('is-scoring');
        setTimeout(() => {
          elSnitchScoreboard.classList.remove('is-scoring');
        }, 420);
      }
      pulseInvisibleInk();
      if (elInkText && snitchCaughtCount >= 2) {
        elInkText.textContent = dict.inkTextSnitch;
      }

      // 被捕獲後輕巧變換方向與速度繼續飛翔
      pickNewSnitchVelocity(1.25);
      snitchState.vx = snitchState.targetVx;
      snitchState.vy = snitchState.targetVy;
    };

    btnSnitch.addEventListener('pointerdown', handleCatchSnitch);
    btnSnitch.addEventListener('click', (e) => {
      // 避免平板／手機長按 (>180ms) 在 pointerdown 與放開時 click 重複計算兩次；僅保留鍵盤觸發 (e.detail === 0) 或無 PointerEvent 環境
      if (typeof window.PointerEvent !== 'undefined' && e.detail !== 0) return;
      handleCatchSnitch(e);
    });
  }

  if (btnCopySpell && elSecretCodeText) {
    btnCopySpell.addEventListener('click', async () => {
      const dict = HP_I18N[currentLang];
      const code = elSecretCodeText.textContent
        .trim()
        .replace(/^[「『“"'\s]+|[」』”"'\s]+$/g, '');
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code);
        }
        btnCopySpell.textContent = dict.copyBtnDone;
        const rect = btnCopySpell.getBoundingClientRect();
        spawnSpellBurst(rect.left + rect.width / 2, rect.top, ['#ffd700', '#fef08a', '#34d399'], 48);
        setTimeout(() => {
          btnCopySpell.textContent = HP_I18N[currentLang].copyBtnIdle;
        }, 2800);
      } catch (_err) {
        btnCopySpell.textContent = dict.copyBtnFallback;
      }
    });
  }

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : ctx;
  let cw = (canvas.width = window.innerWidth);
  let ch = (canvas.height = window.innerHeight);
  if (fxCanvas) {
    fxCanvas.width = cw;
    fxCanvas.height = ch;
  }

  const stars = Array.from({ length: 75 }, () => ({
    x: Math.random() * cw,
    y: Math.random() * ch,
    r: Math.random() * 1.6 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.025 + 0.008,
  }));

  const candleCount = Math.min(22, Math.max(12, Math.floor(cw / 75)));
  const candles = Array.from({ length: candleCount }, (_, idx) => ({
    x: ((idx + 0.5) / candleCount) * cw + (Math.random() - 0.5) * 40,
    y: Math.random() * (ch * 0.65) + 30,
    height: Math.random() * 26 + 22,
    width: Math.random() * 3 + 5,
    bobPhase: Math.random() * Math.PI * 2,
    bobSpeed: Math.random() * 0.02 + 0.012,
    flickerPhase: Math.random() * Math.PI * 2,
    isCrimson: idx % 3 !== 0,
  }));

  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  const petalPalette = [
    'rgba(253, 164, 175, 0.52)',
    'rgba(251, 113, 133, 0.44)',
    'rgba(254, 205, 211, 0.55)',
    'rgba(253, 230, 138, 0.42)',
  ];
  const blossomCount = Math.min(16, Math.max(9, Math.floor(cw / 95)));
  const blossomPetals = Array.from({ length: blossomCount }, () => ({
    x: Math.random() * cw,
    y: Math.random() * ch,
    rx: Math.random() * 3.2 + 3.6,
    ry: Math.random() * 1.8 + 2.0,
    vy: Math.random() * 0.36 + 0.22,
    vx: (Math.random() - 0.5) * 0.28,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.018 + 0.009,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.018,
    color: petalPalette[Math.floor(Math.random() * petalPalette.length)],
  }));

  window.addEventListener('resize', () => {
    const prevW = cw || window.innerWidth || 1;
    const prevH = ch || window.innerHeight || 1;
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
    if (fxCanvas) {
      fxCanvas.width = cw;
      fxCanvas.height = ch;
    }
    const scaleX = cw / prevW;
    const scaleY = ch / prevH;
    stars.forEach((s) => {
      s.x = Math.max(0, Math.min(cw, s.x * scaleX));
      s.y = Math.max(0, Math.min(ch, s.y * scaleY));
    });
    candles.forEach((c) => {
      c.x = Math.max(12, Math.min(cw - 12, c.x * scaleX));
      c.y = Math.max(24, Math.min(ch * 0.72, c.y * scaleY));
    });
    blossomPetals.forEach((p) => {
      p.x = Math.max(0, Math.min(cw, p.x * scaleX));
      p.y = Math.max(0, Math.min(ch, p.y * scaleY));
    });
    snitchState.x = Math.max(16, Math.min(Math.max(56, cw - 108), snitchState.x * scaleX));
    snitchState.y = Math.max(68, Math.min(Math.max(108, ch - 90), snitchState.y * scaleY));
  });

  const sparks = [];

  function spawnSpellBurst(x, y, palette, count = 32) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.2 + 1.2;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        r: Math.random() * 2.8 + 1.2,
        alpha: 1,
        decay: Math.random() * 0.018 + 0.012,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  }

  function addWandTrail(x, y) {
    updateLumosPosition(x, y);
    if (sparks.length > 180) return;
    for (let i = 0; i < 2; i++) {
      sparks.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.8) * 1.2,
        r: Math.random() * 2.1 + 0.8,
        alpha: 0.9,
        decay: 0.028,
        color: Math.random() > 0.35 ? '#ffd166' : '#fff6cc',
      });
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      addWandTrail(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches[0]) {
        addWandTrail(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  let magicSceneRafId = 0;

  function ensureMagicSceneLoop() {
    if (!document.hidden && !magicSceneRafId) {
      magicSceneRafId = requestAnimationFrame(renderMagicScene);
    }
  }

  function renderMagicScene(nowTs = performance.now()) {
    if (document.hidden) {
      magicSceneRafId = 0;
      return;
    }
    stepGoldenSnitch(nowTs);
    ctx.clearRect(0, 0, cw, ch);
    if (fxCtx !== ctx) {
      fxCtx.clearRect(0, 0, cw, ch);
    }

    stars.forEach((s) => {
      s.phase += s.speed;
      const alpha = 0.25 + 0.55 * Math.abs(Math.sin(s.phase));
      ctx.fillStyle = `rgba(255, 244, 204, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    candles.forEach((c) => {
      c.bobPhase += c.bobSpeed;
      c.flickerPhase += 0.14;
      const cy = c.y + Math.sin(c.bobPhase) * 8;
      const cx = c.x;

      const glowRadius = (c.isCrimson ? 30 : 26) + Math.sin(c.flickerPhase) * 4;
      const grad = ctx.createRadialGradient(cx, cy - 8, 1, cx, cy - 8, glowRadius);
      if (c.isCrimson) {
        grad.addColorStop(0, 'rgba(255, 214, 120, 0.4)');
        grad.addColorStop(0.45, 'rgba(225, 29, 72, 0.16)');
        grad.addColorStop(1, 'rgba(185, 28, 28, 0)');
      } else {
        grad.addColorStop(0, 'rgba(255, 214, 102, 0.36)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = c.isCrimson
        ? 'rgba(176, 28, 46, 0.84)'
        : 'rgba(250, 243, 224, 0.74)';
      ctx.beginPath();
      ctx.roundRect(cx - c.width / 2, cy, c.width, c.height, 2);
      ctx.fill();

      if (c.isCrimson) {
        // 洞房喜燭金紋環飾
        ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
        ctx.fillRect(cx - c.width / 2, cy + 3, c.width, 1.5);
      }

      const flameTilt = Math.sin(c.flickerPhase * 0.9) * 1.5;
      ctx.fillStyle = c.isCrimson ? '#fde68a' : '#fde047';
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, cy - 2);
      ctx.quadraticCurveTo(cx + flameTilt, cy - 13.5, cx + 2.5, cy - 2);
      ctx.closePath();
      ctx.fill();
    });

    if (!reducedMotionQuery.matches) {
      blossomPetals.forEach((p) => {
        p.swayPhase += p.swaySpeed;
        p.rot += p.rotSpeed;
        p.x += p.vx + Math.sin(p.swayPhase) * 0.32;
        p.y += p.vy;

        if (p.y > ch + 14) {
          p.y = -12;
          p.x = Math.random() * cw;
        }
        if (p.x < -14) p.x = cw + 12;
        if (p.x > cw + 14) p.x = -12;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.03;
      sp.alpha -= sp.decay;

      if (sp.alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, sp.alpha);
      fxCtx.fillStyle = sp.color;
      fxCtx.shadowColor = sp.color;
      fxCtx.shadowBlur = 10;
      fxCtx.beginPath();
      fxCtx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      fxCtx.fill();
      fxCtx.restore();
    }

    magicSceneRafId = requestAnimationFrame(renderMagicScene);
  }

  ensureMagicSceneLoop();
})();
