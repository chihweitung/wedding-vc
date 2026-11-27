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
  const MAC_HEX = '685af6080b779ced54859edcd3a0afb8297f32630e3aaf3cdc0edf2f47443e91';
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
    'e81201a90b38db289792b7a34ffcf3b9d1eb017c080cb51cb3c7d480bf9412426301a30244dcfd8268151df0cf390ba7c50f' +
    '63b4091de0d01b87186f4096a926877a4917df96533fa80638c9cf61aea0ef1571cd4f94a69e52daf646455b9ad64c88d59b' +
    '8bd6bf330bb9a614cc5baef57265ee94d541ac81e5457183eaf27d89a91bf0ccc33f6657f32292951bccff1441e84bbe8c4f' +
    'c2deff2e8cd18289e6dcf562f55bfa579cc6609c1e018cb39b787bbac7aab7520a5a699029c4f8d715e865ca6b796ccb6d36' +
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
    'b109674c5e704f5e2c0e2d3e3d5d35ca17ac24e486ae1ad63d576a127efa09dfd5accdb3c2ab1081f1f929fce9bf4d4e6485' +
    '528b20e1f6b87bc0e08429535c18c9a7cb0dfa6a592815d7e86caaf8916259b22b20c0428a3651c125df8720bc828265b21c' +
    'b39bd1280a524990c6b301ed01002141030df543dd801acb16b417709886484cb039000d3019a3b4018a7a86842d6507b336' +
    'b1a908661c08286a1ea980e892396837ec42e34489fab7d09a107f5db3dc35cbd0304f08cf8d68bc85eab3b813664962f47a' +
    'ac4312688b2ca6bfe658f127b59997c44ccd48b156ea97dc95fd445219d3e7d984a3fad29960f96419d92c13021cdad9157e' +
    '7c5ac276be0a235d7590798054e641f407f45e2c5b24c4775d5dba9acbb872d949a17028ea76b1d47b42a1f39cec93eba6ef' +
    'cb0638e52a6604a8dd4bf85eb9698b16888d37a9885625a22cf95d288c60fbf3b93d0161b513293332b00d5647d6fa0202d2' +
    '67519b628b03a5fdcafa85ce4ce9185a0a76d9273215ad33edbf5a97cc38c2a45646223ce9c709630558506a9d141c3301fb' +
    '620c545538125a6c8b562dc2a64a1f3b5efb1aeaba5976873df9dad0ef7646134dd294c64addfa31cf4b99496f064edf318a' +
    '6987a6a2e5d6201a9669cb8cd9e753f747f76a656193cead1ea5ee33aeb9a2c573da6bcd65f917c897acabacc7615b32b33a' +
    'f4e50d53e69ea9f0aafbecafe1af94e4c768dc65f091559ca18aff4af7f61b0d1c4e8f76d233da7f6da05720c3f79eddfebc' +
    'e540b442d7937bff2ee41bb27e750e750e16e51218e22fdbe46febc90683cac9cf62da0288b8ebed048e2f602afbe83ef0a9' +
    '59bc9ce38c55ec6a7bf51e32d7d15acf3e42b72eeabe967f02d455c7d99836270839904bf8853bc693e2f9feba8fc893d165' +
    'fc6d5ae47750a591cae89624e3f09ad43307d49f1c4029e4bc73ef4a98d7db01c072cc7e462750a2b83f41bba602de5f371b' +
    '985228595401a25f8f5570a9d3a9138dca52fa72da5f4b98c17f4f969f829a345ba6da7eec1158ad869542153910e60778d4' +
    'b981fa8a4821ec4982fffa5fa6a2f3fbd09c122797137ca4ed2262dd0c73758969a662655a938564a23583fb62fbe2cc5b90' +
    '8f86f87bf02ff1aaf2e4a3d2c86fefe1a18fb7c72b905ea05fc6fbcca63f66ccb9ed237be405b8c5e26486879fd3c3a0c4f0' +
    'a43e193dd147681aa4b8b86c16fea6551d60993caf6145d426963bcd91d9c0042e9057ba1f4cec42ade58d2f57797d82eb33' +
    '1cbaa4e64664b6bdd537f620d322e2cb539755b49e757f85433b45386fdb6b5a55e480be0a61718ae51ee94426e7ac20d80e' +
    'd332574543f4f6bc17fb47b4c6e5d3211b993a000aa9b440c2f7db541602f8d9e89dad564137d30fb1c6a89dc107db2e32df' +
    '0af7b6c8b970302d23999847da8124c9feee4e01f745e5297ad0a167f7a3eeaa8a34c5ed23255f97d850e4ee9428339a6ac5' +
    '30a5db27a547662875cf5c523642238633e63639bdc69131ea17d9457e036a79d21567570411bdafd44608e4dda8462ff6ee' +
    '76fe3b2e569db08367b6d8af7756a98b2666d43023e6cf188bf66a4598a43a1929b5c452f9f77c0a8446a9d8cf643344c31c' +
    '49319c33c8fa7bed76caf4fe8c8f4d7dd3dad77985846d6c39197c1b747dac707af9587efe699e8df8c384582e7a1bad0a70' +
    'b23663c3a0efb58ed6a1f58107913ca016601d337b24550852fb6816df0546fdd9242142d47cf4d6018d1334ed78106539f4' +
    '1a3b1c116f686ee412596d004fea50bc439c8bc79b041cd378565be96eefcee58e80e1fdd4a0fd3a52b968e681bd593e57cb' +
    'e29c127cf1816c70127663812518cdbf21b6ac1270681f933522652957f4e1735798e588982e6c845f4a594aac6f3f111cb4' +
    '414c9299a7004daede742b6e35bbb74e569382d44db6f99057293e401caea3165b0ebf4066391291afc469c35a00e6da4db8' +
    '245500d79f413b3d2b0f9e3b404fc5bd4961c08562810fd7338d7a34916fb860b90e24887c393c41e5795b1fb32016c442bd' +
    'd2226d3678691d861477029aee6f49cf8e221cb6388686de5e305769bd63796110ddcc7f65d8fb33e34ac1ba7594e902aaff' +
    '9680114dd09cb177edae780db81296fffa9c1ee5a3a8faf24aaa91e2486eed853a01d1b547b571b90dffd68eedd65d68f6a7' +
    '5c5fde45b130361cc282fe128f8fa681f3b3da53af171ff951811a425bb1be4e7ad4b0b90690818b66ae7e75b5ba0359ed33' +
    '3da0e9ca8c96ed0080b615a1f4b819de3cb379821770ec8ed686334ffa28d9c9e43253436642f4eaee57c476bcc4506481ac' +
    '14c3c8d14611e248f334bc3b895435061509f2a107522f8253950c564f3f81b7b101050f24c94d6eb07448ec1f08b7046989' +
    '862d642fbc9ea7e6007b3c1b0d8c378d48cbc629fe0d39c3e720bc3da6ff0257505cdcd3e52c2ea151e6163c2b04f1853330' +
    'e9d178cb338b002f50a20a8575ffccfafc72b495900dd4656fd6f72b281811f82979a84d679e32231c85861bb02e206fef54' +
    '590fdb9f46bc16f3996d7043a901cc8b2a012c7b45a26a6e26550f5c011903a1358c636be78e5310a0657eaf6bc246e13066' +
    '98c88d499b8d52a89098923d273ff9d1d4b0330b7f948aae68c6184b00742710e52c7d4009c43eab49e2a5f98e57b4fd036c' +
    '6663a790f08b46a0224190512c42c5e6a8e2661f810d5922bc481a8493a9a2d22d1a720f20cfcbdc65cbea41bdc2cadd7097' +
    '3ac58cb181849dbf9016775d49597fc1024cf87c5c518baf8233f7fa338df0be453c78d316ef06c751bfddce035e2560b9ee' +
    '5580b1cef6f2b59c9fc2beac7318ea5900ec884dd0302d7fce2979bde491ecc18baa0237061235a8471e12b05a30780381f5' +
    'b1de6ff1475c4ca7d9b146c2b05437f3582d9d02ea0d207d114650b2d07033be457d7a0e6ae7dc9c23ddca1d9a55c1dd27fb' +
    '46e8c6a91308c80481a47548676c7c7246ca8d514770f2959d52485cdb1e0b8ae020c5657ba98413e0aba380b1a3840d3802' +
    '7824342c6374fd641069bc3519236c37cc27f042318fe9b289bbdb44e07dc998911ebab3df4c3db16ed64491c33052f37c6b' +
    'a7222827cb226e4a209cbcca6d3e31bbfac236592016db29456c3d8dc755790fd372480383d0bbff12073befe2aa659b2527' +
    '9ff2d824695aca0990fe134adc50f0244b00c54718318593aceab187a065d2472bfaf54c9e4f6db18776ac2578496b2c4be9' +
    '86e2e7cb991a542b1840965acb1dba4c0d321695f6c531f6aaa3ab1ab94bbcfb0e9a5a3e0e8ea95387872fb9f3d2dd89decc' +
    '0e6432a8281e51935ab954510263e53c4cc9e786e277c8f2bf8b4e56702150c822b7290ca44dd4a26538571f23cf982528b7' +
    '84fb497c2b6e6da21fa777d933a3f7ac0c7df34a1ed105756010841560c9cfca1ae8d3319cf49472df93cb46a44645ec7a7b' +
    '6a1c61c19c3444ddca8477ac8a98a81b80a06ca87322f02042a778fc012d14aeeba7a1fcf130407af3a5f2d5df7ceb47cd54' +
    '8e334e66dab0af57a777198dda7d567f8220878f65721244a272b64ab8cbed635bcb4dc06a937775eee6e85547e4716f3e27' +
    'f912a8a9d007b73533b76065677097036689b38fa45be1894fb730d7c9fdd7b47e6451b8372dcca315c28d75bc67a276ffdb' +
    '83a3b69ddd336e1c4d6c27353082502b529fae2d1aec7316d8f2fc701946dcb2032e5fa2d969fd697f629520570fcaa41ea0' +
    'c5a4e88489209de2af93f9fd4465b01239bf6b387bc1258eb6f32200b6f20d250f58a7f070c514d199fb7169a89ae6b07281' +
    'e206563ef6b9bc7c148818dce50028fd78c6a1dff592ae06c400899d85cbf8dbf8112feba68684ff05cf3b914791c5f87e45' +
    '2d043448ed4217d90ffb6b51343ddb80dee27069f8a651916688b83e33ea72759023d3d38981c6af026b5bb039b8a20ba930' +
    '84afa9fb0a3d3a7eb7e6dcf3cf6210a2ad845702e10e1ae022cf68441625f05af3ad4e5b55ac580c74596aaaf5cfe7f54734' +
    '41733bb6d8e0b00639d207733897d4f4b2863e1c2158994015a64a5dd3b1cd7a2aa5726e0443ba664a48a12803b54fab03c4' +
    '8023182f01df79e0d56267f6cb8e42fc6290bc8bfb005c7722baa533555f9d6620af3a0658aa05df182ecbd0470884654cd9' +
    '103334d7f7bcec2758c5ac1be80b3c75de538fcbb40626c6ee5c15376fbfe8d63cf1aeb9480570263bd95eef186d0eca46bb' +
    '80473b89d9b3ef82f04b6386ef32bcb411258f88b06c81d0f81ed8789389fa1bc7011ee945d91de4bf638c2b85021b0f3472' +
    '04d1933823b590538858df0277be3a33ad16f220b122db4fa6b3286d42abaafe1bd752bd496c1559317289df0ef7266b611b' +
    'f8ce753ed3ab11103f5885a92d8f8e47a4e5df128eb0ddc4fb824f6030522c6df125f9d12fa5fe84f1f1466af17c15b00623' +
    '18b2f6469518d5bbbbc42142097f924d5f4fba758bc0263124c8d41958d552f39d148471f24c4a9addde67e83ede24238d54' +
    'fe9d87e490d84b982394e57829ca68c76fe4e942c4580f199ae91a24784c478864a0fcfdb1a8168bd461e7a93fba6cef549c' +
    '1fd20a9125df6bf9c5253839f9c5ae05329c3d02505131aba8c250bc93d5d96a4c4fbf2559a1c2ab5a7bdc4f43498cfed103' +
    'eac188a7067cd2ee250726d8386c780d046c8cdaee15636b8a5dffa4561e3cb63e6a78d0cb0c479392923bde139dcefa7eba' +
    '28441213d7589bc964aaf6c3343b7749d21f3f3eef6f1265299058e8240b8b29c5185495adc9b379b8356b010edcd5e32a14' +
    'ba4eb1897271fdc4313502cf47d932642076b69af4de6f9759e770a99423e34af692e6e4066ff0736c3fa88b9432dacedd12' +
    'f2c10f70b17f4cc4232d2273909d1409a935ca99d2363bae0999e4d2b6e354fc44f3d2dd6b2a1949cda5854e4df36daff549' +
    '12c0a7202afad4f08143b5c93f886a71f674b8b05cdf1c536cb4cbca1fbadd8418edc67ea8e7164f29a73cb8662e48f07f4e' +
    '42a6deec76d8b8a2e3926e5b77812ca091e486da7153c748713226a7a3f031a517a742368961c150a904b3c100515839b7c5' +
    '4aac0d307412b54554887e43f1fa3759855c1ee289cc52f75317a6e35cd4e922d6ad4e1ee504eb90b7215e9cdf93ede6c846' +
    'ebcf61399eab2f134c7f312f0b7e0f9a1946a5d9993247c358618f12b7dbd826b5fba0a7b2cbd6a2b981eeef53bc2060e44d' +
    'fdf855dcc2e4f8518a1dfba50a86260fa17b9d53e3c6448c9d9cb8a88f567225459bd53e0b8676ee0debfe6cb25a739324b6' +
    'cfebd718f55a236e17ae508c74753297521dd9956656f8b72f2466aa154f1eb9b2a79e7020d8e55a1b943bd8adbdd72962fc' +
    '3f71001d028bda0aac232f72da1a314100f5a7df4f3c9952859cdadaea63adc56fc3211acecd79f032d1f7b0ce526af3336d' +
    'd10a2a174d49c922af83e1e652b66fee2732ffb6ddecb8eb50a01c8f563a6c552b122a1e741cffbb29f43c9f94d7ac738a1b' +
    '8a466f8aa066b6b0ee93963151e467bd8dff4ea0e8f549899c2ea3f8e4ee851f451ae84cbe71b0f0b2b69b96ad2b4f38ad5e' +
    '76eeb34dac638fa6131826c4dd0e301c3b64d07a0672f6d6c25123be7357862b290fe397fe849579ff3b32d0fc4dc652788f' +
    'ac3beaf7bcbffa004fe6e91738f95a34a4b5c9a226f658318d0bc0a7c58ca8b4f7c1ae605a612804c08b7dc8079f8ac855fd' +
    'bd36a2d32439a6ea798573d6a720a00e6bbad698e779eb457308be325dcb4d394d7c7d7c76a42f57b20a9599fad5b8dcc4c4' +
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
    '5bacc6daf584f4114c7d23ec69d6be9ee1cb98e7c2f1bd1ef2b07ea1e010f4b73738ffde5d80478f41aadae93f00d0ad28f9' +
    '0506202d63b6a14f73216039f00d8d4302febe480043d8604e6258773ed764dae33429844314ae5daec449401bd3d0905b44' +
    'fd1575ccd30793b51cccdcd94acd41448dd900dff8926af035b25424515cd59a881bab803755763f782a4ea3659cd1418038' +
    'e94455a4f273eef6ce64c1d64d238efef194368390ef8cbad00ddb70c243cd2bdfd7639363029e3692f8730c3a631655e234' +
    '3d2614a3bc1587423276ade01793ab20322a256ba01e260dcaddbe8b5c7ff09a138a202123e347615d320a544332712cd6ef' +
    '50d7dbb012e0cb8136bf5a6cdc652bece4516745f9762e10bb50aaeab4e3eb666ce7e466a876a916a2a3ec0ae3bc7d0c33fc' +
    '8d14ee2da1642de1ac3ec319c50f0a09c077a8309fe1699bd0dea441a39747752e0949dbcee949b10e3af944304ddc2b358e' +
    'd5ac4abbc151c2f832f38e5883026f38a6d1e8e70b6785bef23f9caaffdebcb7a60052793c225f6dbb1db8f8d13d350f5864' +
    '55baba75c05e9a3dbf6c732a27a82b5e04258001286102dc02b409d28c817b025ba094ca389dd3287b7d2b182b9120c06fd4' +
    'b02a1cdfd6ed65aa369dfba243569f10142615e88d3bc29a3871971ef04cf5f78b17c9f4052a674b5e3f5a96b95ecc6d3be9' +
    '8152ff36299ed4595e08da38a0bfb399c7f691e9321714fffecbde736d9668423103e5efe5c1cafd807e1ba9596065b92c9c' +
    'ccf36a423e8c9fae2f12791692c7762e08af17cef8d8442922d38f9be9feff6874d3b6b16f2ee968b4975ce1def5defbd320' +
    '3d327bd3510c04c08186e62f7bf91c68ac8a92b9d562f1e047b5a1c8f2f1165d59bb459f82b29877a736f6763e537a49e8df' +
    'a3efc3654e2577d662c3c0e6ea126a42f624e60b953311daf10995119231370a72e395c642a68fb163dbbf00264db16aa341' +
    '4c4abbb341847c5200b8f95c4a29dd2416fbc002b69ecb7ae4e39ce60f6a27e0b9adace6ff216521a596dbf8768205478ee4' +
    '8d5e9fc21059b146e2579f2faec8d5d0d59e8395c16e1132354bd462b0ab5a84d60b1dd9261583e65720b376cfd860cfcd2b' +
    'bb92dabeb21c3a3234b2d9f13e9a368b5f2cb352b053a26a167dcd81ff116c4fb07b9fbdc721a40a6965427f92cc54b48dcf' +
    '6945a463dee63cefe27605164c6529fd49292bce58eecbbcf394df54b9930541ac1165483732219548ee46c829fe453bcf82' +
    '6b87f57c362438b013a3ea731685b3d161a15993e7e8f11ce70ab71b47152a7a06ed6335bb001b133fa86a7e35ef738ce1ea' +
    'd0b194e7bfc13c313025a89f23128aca501e9286daaab00fc898ad01557ea2bb32aca79883b3ea5911ed94bf83a65aed9e0e' +
    '218ee6eb25a56930c0ee28bb2fe1dfa418a105183e7bfc23b403bd25fd43103a89a61330e9ff89f9824cec20d34250f6f056' +
    '31310788e92a8e50fcc00eaf212b3a9b12c93a9d6601f8c83b9af9ece14e487f93df0c207676eb881dc80d306feb914b39f8' +
    '3fcb9953e195b8ed39abc017def2d6060fe20c27422bd4084cf1e87a67f3044afc8b3984346cb7f5629c909edfbd677e95ec' +
    '0b0b004af026502d656fd6d28a0d0806cee75a87abcad4f5c966fad009d37047d64284aa66478dddf30c9dd963474a7868e4' +
    'd6d0da2fe5f5592a21dab14682a7974824fec5aebc57d47f5eaae643a5be1bcb0dcf737aa17702129dd51a42ec01ebb2a3c6' +
    'd7c2e8f2b49c0d157383ef5ae5154ce71bfeddeda88960ffc0ec4baffd43086cd9282e0fc551113bbdb518abf9731efa6310' +
    '4c920cc0e5933b99e96ea1a93b4a13a91e0e1dc29a368d25b13ceb41c78958b3b9cd49287504817779152f44693d8129174d' +
    '6422ffb4d2db602441f357df7b1df58768a427b38451e8c9dde257ada8e38650d5f576f551f5fe7f34fbadda606f6bad37ef' +
    '68400d6520ca548f7429eb402557d9b185132d8775a95e51bbdfeaa910a169f46d00dd20ee4ce223deb9190fa6dad80faad4' +
    '6af74d378506ccb692543a5e9e5ea65833250415f45660517e16837d0e31436e58043e4edbde19e74f93f033f44a2a8bb0d4' +
    'efc03ec676c77acd87a8d68b15c3b82a37e4d03680d6ba90675501de2ef27fd1f2b524684d783e5bf30c6889f7a769c7b429' +
    'f5e377dc1911d1ef0bf5249c4d41d7797d8a0e87f6e54de5a00a618ba5182a8544dc0656741735dcaf479b088b432f5d46cf' +
    '02f3c72647ae6e6065e5f341e7209db3488db43f837aa857eb933b1684d189e2228972c8c29bd0571201fe44af4e88a584cf' +
    '1a704c673be0464d5a8b8aff2bd3b2b5cf3c204222a86f9844014fcd93ec3e5851b06648aea4bdacac14e25736373836a320' +
    '23fd11c282448ba2bab126e0c729c8b664d45d190c04a3c36c2286e20457f2391fc3fdc188d3620fbfdf74d91c20bcbcd59b' +
    '9d4439a8cf08fb8717ac095a4c113e3e273de91c855e34ce1f9db6695d39640b38d8cfead6768a1858d316399c527ccbb9bb' +
    '35fb96c548607ad413c827707b24ee0b13918a802c84ea89271ca71156341947d81ed9246767949d5e2c1ed86cfff0535e94' +
    'cedbc92b03c110b4a61eb33cf260f4c0b5e3eaca160e523997e10aaf0dd1ecefd02af244242fc53135b4150a0dd1b6d0a218' +
    '82c471f6b2ae6fb068571f6c781cb3ca8d786a63b227c7a277f9180198c99761267e1fd424205b9b2fe6940ca097f0c848a0' +
    '5c47dc7a0aa28266d912c1ca7683aba30502dbf2bd9eb63db907806076824030b4ab9260b1337a4b490b715d00af38d20b92' +
    'a2d96b0a1c3890d5c5f77d0bc0a5cdfb1f1f96de0ed2cd634d530de2d1ab8568f721c2705b227e80a0740d36f83351e767ac' +
    '1c17e740bca46512c59a41140644e344a9b0bcf76914af9617db4c07cbf81dd7d4395adf1d5a5fb7ae002bfdc333ecb5704f' +
    '1f1fa33a011f22c1c2e7fa20c51fd692bd5ca523d001379dc6b897bd6fb6ecfd936185f063bfd049bd84b97ba16ea3d4174b' +
    'a460ec12807e66851192ef79cc57adfae825d47e450774e6d7398b26149e460a1ffc796565c4107d54a71a236f8aab2d3a41' +
    'c9d274288a148643171179b7d3613a61b67ca00eda50841ec916976e8b0db4f8c8decb65c22b248ab06b2fd56416ea56732b' +
    'aabbad5f94ea8979d023cd40ed6b455cac1d5df27d169fb54c23a09a2030b6a78fa34ca07d63abb8a89d2c13e3fe0bd679e0' +
    '69221c4a457f1f94e4d23bca0fb2489830512edda7b678cbd889e4bb6ee30b0fc0b201617a0daa839c53956bf49b9398a5d7' +
    '2a067bf785d99cad417eab92db7a099a1c07c76c745d655958b8672943f15b54816f29a974edff9ca9cba9d2db32ab41145b' +
    '27972c37828459a697e164059f63f3c857171de20d646516fed672b38093068c22774de399a15f09f0d4cc630876471d93d1' +
    'fc4101bf56243f80744aff826c8b7302f973511deb8874ca7e66a17280d99213eb8846a64b371a95b4ef41d989838219488a' +
    'd3668725013ce20cd24e7dcd8a4bb8f78ec0a9b7d181731a238b2eb88abc8445b08f746f6b35d76777bffa38893fa09d7070' +
    '0139e32426b5a57175aa5c5c4c236099cb26503986ca5e2f42d2f8836438716a91ad102fa22bd7a39c85119d7281f4317ead' +
    '3755dec96c3f969a84cf62f9002390d12c6ca890a479585fdb35993a3a25a18a0552d42f8725a7bbc6af9d0c46b9941af1fa' +
    '69d3bbced96e5719fb83928b37e722800077b917e25bcad8255acccf88b69367be9b95c5d89f5460de5a8220c45502788202' +
    '3b70e2ad286e3fdb7e47dbf14d6ac358f3ea2d5326dd0873c67aa040acb7cd4b04450cdac3093370b00f87d0781a8bfdaa9f' +
    '6a1354327c01c4cf7c736c3ab9cedb39aa3fb128373e9ad1f49a03ab75cd9d0eae0517a1a7ee233a7ab12df53e24337dca4f' +
    '5daa054c8484f8271abeb88dbcb9fef411f96c9e7cb960e0fa3043ef8cb8b570502f2fe90ef3dd56aca60d7f7eeef6af3a84' +
    'af3e8fecc8c881d3bbf6424845fd102bd2ad08b5dda115632805fd49a8c1d70eeeb089709619e3e3f9bd1e67fd17ae7917f8' +
    '2d534d475d3ecccd233c1176180043799f8ea55c95be65d5040d88be29aa749f76f74ed34ad997d32608f85ec1b5d3960ec1' +
    'fc39e5a6cbdc84d063dcc5aa6295678355fa3a3a2152c97ccd20282dcb1068bb8dc29f8c5e49e1b9596882365977d7d4b8c8' +
    'a2c3e17c15ca4e179ef1fa22e66f608d6808898ebbe99ebc8274ad60dddbc126f9b820337eddea2a7e78822b7cfc3e2a8d5b' +
    'da7da5420b5083ce974765759ff8d8a1043fa0d416d4daf294f9c604037ceb8b2b5e548e8236bafa0e145b51c4d21cfa11c9' +
    '6f78474fd306e8b65605d84023c8082bf785fe9c0d65e4f91bdad8';

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
  const btnRiddleLumos = document.getElementById('hp-riddle-lumos-btn');
  const linkDecreeReturn = document.getElementById('hp-decree-return-link');
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
      if (btnRiddleLumos) btnRiddleLumos.classList.add('hidden');
    } else {
      elRiddleModalLumos.textContent = '';
      elRiddleModalLumos.classList.add('hidden');
      if (btnRiddleLumos) {
        btnRiddleLumos.textContent =
          currentLang === 'en'
            ? '✨ Cast Lumos (Reveal Hidden Clue)'
            : '✨ 施展路摸思（照亮暗記提示）';
        btnRiddleLumos.classList.remove('hidden');
      }
    }
  }

  if (btnRiddleLumos) {
    btnRiddleLumos.addEventListener('click', () => {
      toggleLumos(true);
      const rect = btnRiddleLumos.getBoundingClientRect();
      spawnSpellBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        ['#fffbeb', '#fde047', '#facc15'],
        42
      );
    });
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

  const elSecretDecree = document.querySelector('.hp-secret-decree');
  let isDecreeRevealed = false;
  let elDecreeSealedHint = null;
  if (elSecretDecree) {
    elSecretDecree.classList.add('is-sealed');
    elDecreeSealedHint = document.createElement('p');
    elDecreeSealedHint.className = 'hp-decree-sealed-hint';
    elSecretDecree.insertBefore(elDecreeSealedHint, elSecretDecree.querySelector('.hp-decree-code'));
  }

  function syncDecreeSealedUi() {
    if (!elSecretDecree) return;
    elSecretDecree.classList.toggle('is-sealed', !isDecreeRevealed);
    elSecretDecree.classList.toggle('is-revealed', isDecreeRevealed);
    if (elDecreeSealedHint) {
      elDecreeSealedHint.textContent =
        currentLang === 'en'
          ? '🕯️ Sealed in invisible ink — cast Lumos or Marauder’s Map above to reveal'
          : '🕯️ 密語已由隱形墨水封存 — 施展上方「螢光閃爍」或「活點地圖」即可顯影';
      elDecreeSealedHint.classList.toggle('hidden', isDecreeRevealed);
    }
  }

  function pulseInvisibleInk() {
    if (elInvisibleInk) {
      elInvisibleInk.classList.add('is-revealed');
      elInvisibleInk.classList.remove('is-flashing');
      void elInvisibleInk.offsetWidth;
      elInvisibleInk.classList.add('is-flashing');
    }
    if (elSecretDecree) {
      const wasSealed = !isDecreeRevealed;
      isDecreeRevealed = true;
      syncDecreeSealedUi();
      if (wasSealed) {
        elSecretDecree.classList.remove('is-flashing');
        void elSecretDecree.offsetWidth;
        elSecretDecree.classList.add('is-flashing');
      }
    }
  }

  function formatEggButtonLabel(raw, lang) {
    const text = String(raw || '').trim();
    if (!text) return '';
    if (lang === 'zh') {
      // 中文模式下統一按鈕為純中文，移除夾雜的英文咒語或括號英文，避免有的中英混排、有的純中文
      const cleaned = text
        .replace(/[（(]\s*[A-Za-z0-9\s!'.:-]+\s*[）)]/g, '')
        .replace(/\s*[·•|/／-]+\s*[A-Za-z][A-Za-z0-9\s!'.:-]*/g, '')
        .replace(/[A-Za-z][A-Za-z0-9\s!'.:-]*/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return cleaned || text;
    }
    return text;
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
      btnLumosHeader.textContent = formatEggButtonLabel(
        lumosActive ? dict.lumosOnBtn : dict.lumosOffBtn,
        currentLang
      );
    }
    if (elBackBtn) elBackBtn.textContent = formatEggButtonLabel(dict.backBtn, currentLang);
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
    if (elParchmentBody) {
      elParchmentBody.textContent = String(dict.parchmentBody || '').replace(
        /亦封存了一句專屬於今日喜宴的密語——願與知音共飲此杯，同賀良辰。/,
        '亦於下方封存了一組專屬於今日喜宴的通關密語。願與知音共飲此杯，同賀良辰！'
      );
    }
    if (elVowSignature) elVowSignature.textContent = dict.vowSignature || '';
    if (btnSpellLumos) {
      btnSpellLumos.textContent = formatEggButtonLabel(
        lumosActive ? dict.lumosOnBtn : dict.spellLumos,
        currentLang
      );
    }
    if (btnSpellMarauder) {
      btnSpellMarauder.textContent = formatEggButtonLabel(dict.spellMarauder, currentLang);
    }
    if (btnSpellCelebrate) {
      btnSpellCelebrate.textContent = formatEggButtonLabel(dict.spellCelebrate, currentLang);
    }
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
    if (btnRiddleClose) btnRiddleClose.textContent = formatEggButtonLabel(dict.riddleCloseBtn, currentLang);
    if (elDecreeEyebrow) elDecreeEyebrow.textContent = dict.decreeEyebrow;
    if (elSecretCodeText) elSecretCodeText.textContent = dict.secretCode;
    syncDecreeSealedUi();
    if (btnCopySpell) btnCopySpell.textContent = formatEggButtonLabel(dict.copyBtnIdle, currentLang);
    if (linkDecreeReturn) {
      linkDecreeReturn.textContent =
        currentLang === 'en' ? 'Return to Register Passcode ↗' : '回主頁登記密語 ↗';
    }
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
      btnLumosHeader.textContent = formatEggButtonLabel(
        lumosActive ? dict.lumosOnBtn : dict.lumosOffBtn,
        currentLang
      );
    }
    if (btnSpellLumos) {
      btnSpellLumos.classList.toggle('is-active', lumosActive);
      btnSpellLumos.textContent = formatEggButtonLabel(
        lumosActive ? dict.lumosOnBtn : dict.spellLumos,
        currentLang
      );
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
        if (linkDecreeReturn) linkDecreeReturn.classList.add('is-highlighted');
        const rect = btnCopySpell.getBoundingClientRect();
        spawnSpellBurst(rect.left + rect.width / 2, rect.top, ['#ffd700', '#fef08a', '#34d399'], 48);
        setTimeout(() => {
          btnCopySpell.textContent = formatEggButtonLabel(HP_I18N[currentLang].copyBtnIdle, currentLang);
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
