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
  const MAC_HEX = '5873cb48b3fd1cd3fdfc401418e64d59321975b33b768a50a77fdac26236eff5';
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
    '63855277a5b1e398b456e7839cfd0df92b40a0c9b95ffc0d555dc38be6a169a61d7dbf3b98b2fdd405c3d68dbc98807c7ebe' +
    'c3bd49a0f14cdb908b4f2c2d1c5b00894b933bcead92bd1fc4ae957dbe68dbda23dcad10d17cd5a7ab7119720ed2f7cc0575' +
    'a8cabfecd562584f1ec20548ac76042cfc482939de30278f7e79d53a86fc327cd156d5e52f87c28bcd05ecb02b0dd8ed8783' +
    'a455c5e91a2d42f7d59c738d8b992e6d26b61ab1fe07a5b3b698beae819a7f5376f88270353e3249b5e7c3035d2e9542e0be' +
    '8eaec027dfd77a11548dc4e7814f43c1b7c44e78181e2b03fd5e303cb0fbbdb1792ae390caccdc582d6d2a4137ad09d6960d' +
    '54404a2acb82fc96916e6a0b0fa3a9c510dfae86f9575d942b9c1be4e57b6762b854c53724315268fc45b21e1a01236b33b6' +
    'ccf6ff03d08c3768731ae93ec4771dbf188bc3c620c6b3c0f0676bed84ecf5a9cb0c930a304abb337239c96670c10e5b3dee' +
    '502d66f59844af1ee932e5333a5a73e30c26c416f98acc741b562222cdec54c6769585d6e89944afaaf6d6233020f6919859' +
    '9064cdda047a3130509e0172076ada8a7a0930dce95738cc2830d1652ad87f742d95e07c1a71206fd0dc6e1c47628b77a06d' +
    '71ac05f6335cfff965896c6578cd05e2d4abe0c2124ec0144f50a265ee40dca827f0c334b40ffeabba626494901616b16382' +
    '0746da5a55d2de70ba7c01ab102a6c08f1398d6d89430a1d93d5a0f759a84b256c04ca7afb5d2e46d2247706366c814d347b' +
    '7c6669c6086a4d72a2eaf365938ddd5a780e07328ac09f78ac9b6dc772d51f8e4385567342d93b698de7b2d7ec0d4f3ae4d9' +
    '6b2636d24b8909940bfbc3f4bd548de8659dda7fc54df3d7b5568bfed782cfd5b76f85f9ce685cdc873f2349dd683cbadc5e' +
    '3cc844e961262a8736298d7fbc56bfab04a313dd2586e762310de900bb13cd56e7c5ca7881aaec76f49c4e1b9655fca26bda' +
    '8fc354d3bace543058436667d2eb533f0906b64304fdeb6ada7d720b90615ed883231c92c143d5b8f3a67a57ae694d28ae1e' +
    '4c8e2586aea338e09fb61bf754f792fb9ad2b2ce128f29579c39e3e86e397ab41d57a4c18e2186238024f021b1a2a0176405' +
    '30c5bdeba3502ce6b4087e1187a222a7ca788d5e6cc25bf94340e64dda37419b178488786b51fe779af241d939a614541845' +
    'f99d87c1487cd77ef5e6d7cbe762e34318459972605f6b68eea3690a2e9b6a0bc1ec6b69319cd5573196190fe9a40f4b805d' +
    'b2976eb830cea06bb8b375d3f00e264c7ed9ae3465afdf93b85e125fa820d16587ee380f74fbb892105b25f3f72ffc0b5325' +
    '82326a757e7c62452d32283f074a36f230ad0acf8a9c39d723546a017cf816f1d7bcedb1e08411aaeaf921f5eaa35c4c76a1' +
    '56bc01e4ed8474c1ca8522505c02efaac017f7414c2406e8ea6889f6a54754841b23fa7a890d49c205c78721a4838676bd16' +
    '9b9ac608054d5a9fc2b001f0040e3b600138c540ef9313eb01be267d99b14540b63c0d1e2b1a96b703a84d8abe226815963b' +
    '80a90f7b1c0021641c80aae9b41d6f0de745d94f88c596d0a6097f6986dd00cad214470ae989698b88eb87a411487163f95b' +
    'a2402b678a1fa596d95af413b5aabfc772eb48b056e193db92e9795e09e9e5ccaba2c3e99a4ceb6619c92d311b1cc9ff164f' +
    '535bf554bc25385e6caf75934ce157efbd26b40b5027dd735e5abed8f1b225609a5f7d14f776b1d47c5d82f3aecb92ffbded' +
    'fb0631d02d6c3d95d159df52907f8b16848e249788671fa32af55222a46edbebba00366189212f0201b00d59867a5549409b' +
    '5a5a8842bd15b8dac7fbd3970628a2f40071c4283b26ae10dfbf5881c13ce9a94a59221ec4cd2074a3c49753d8354c371bfb' +
    '77101101131b155c82d6e22ea64a0c3059eb18c6955a77be3dc1f2d1f84946124cd990c04dead33cd8469b61420659c033a6' +
    '578789a7e9e0121a817dcaabd5e963cc48e254acb67283d997405833b09fa1fb5b1f86202bd501c3117342a7c3605a2c9637' +
    'eed80d6ec19fa9d1a6fdc5aede9e96caf56be55af1bb519a8a9afc71c7fa0918157a9275c614d96067ae483ec1ed8bdce282' +
    'eb6c8440db8b7bf432ea288a7c460f74183ae2261ee60acb21e54654d3664d2527058f4598a3e0fe4ad1484c01cadf10cbce' +
    '27be8ae58d5fe36f7dfd7b515d343569c88f13d8599a80d703cb76c7fd84361d3837977ef7be3c0224786c30460c087ea720' +
    'aa7356a2291e266b3b7977f6265f08da1c01d89e2f877ee3741ace2dfce06825d6dec079422879b5b80267b7b92bdd7c3815' +
    'a876e2d2d59772b003959bc291ff138b8c0cb4f22cb2da551bb4ee0f928090355d98da73c41659a884b65e142829e0126ed5' +
    'b587fdb1782bc55f8cf2c8599babf9fbc59026029b3c4ba9d43062d61c7967a16ab476697c818f578834b4ed6de5cccc5685' +
    '8da3fa78c303fc82dfe4a2d4cb48f9e6b790bcc3399556bd56d7d9cb9d0a60f3a2ee347ee33e9ec5e24f8b9bb2dad193c4ca' +
    'be310b33d06e7a18a5beb67a3bf1a6521c7dbb3ab1454aed069738e09beae8061dad54983b4ef962adca922358527384e130' +
    '2790a5c77464b082d51ce62ec110e3e8469e5baa9c6571845e074e3c63d947425af7b9bc05407fb5c310d4772fec8120de06' +
    'd2395c4c67d8f8b829fa57bac5d4e923308a3a2e13a4ae49c1f8e7550921f3eaf99fb1584031f5cc652b2100af5ddd439b00' +
    '82173ec7a05b30321496aa61d5993cc9c9de4337f442ea367bd4b36af79ce4919b3ae7fe24106196e063e4fcae21069d68f6' +
    '19abf939a479442946f35e6e0a4335a730e107388ed39235f516e47e7f336c78cf016b493313afadd9531febf5bb4437c1e2' +
    '7eed3515499dbf876093cba57f48aa9d2961e42525dfd01aa8c4666fa8a737162882e153c5cd7e22934587f1c05e0448d02e' +
    '4c109b3df5cb7ac545c0e2fc8cb57b72e2ecd97893857e50372c43194741a2767ef5437fff74bc8ecbf18e5c387b0fb1076e' +
    'a2317ec3acd4b180eeb4f99c379e36ba196003305e255b2648fb5311d12b42f3e7182f5dfc76c3ee03b82136dd75167e23f5' +
    '2b201d276c694df6114d630179d152b5779dbbd4971e1bdc7a5f5fc577e3d4f88f95defaefb4fd1b63b468ef83ab693d67c7' +
    'e2aa1d7ff2986f61067b5abf2934d1be13b8a73b4f67298b3527632e69fee05d689bc9b4993d4380454356569c630e351994' +
    '704c95b1a61072afe44c24540fb7836a56ae9ed454abf2944d2b167b1fba861c733abf5b7d3b36b5a2f94fc97234e5c96eb8' +
    '2b4009c58b400b042736a6367a69ca9f796eceb36da417db1a9a7b03b46ead45b41c02877c283373dc7d4030bb203602d419' +
    '44f19dba8d99b975e0f6fd5924c2e4c9a128a872954508668d99d0a31bc2bfda971545faa17b5ffb6c82483cdd437bbd6f5b' +
    '3a55a4d5173433ab61027610b652a3f5addc4893e6e9beaf18a88bf38dc7705881bf6874f271ec16ce7278d683881817b8cb' +
    '1302b20cdf7975c72264ed619c573105253b529521afcb69da5997e736eba1517fb9f2b8198f809d6abf616aa6af0f5bed3a' +
    '29b9e5ca8c93ee70dfb115a3f3d25bdc3cb16e931b72f493d1813f5df628a996338bf2526652b4a1a611da7a95c95823f6e7' +
    '957a69171b01910fea57c434cf0d3a4e4d0988ea3a0c76a134ee1f322b35c8c4887643157a927409e45f36b51674db2e3dd0' +
    '815c372fd8ed94bd6c4d545627c47db30091fe5a963a4a8df647da161b30a0a71b149acde90b26a247c03827364389d3bb98' +
    '621515f264f93d753ab25bdb639c9fef892988dfc025b9164ea7bd3653531a91705e2e8ef973756c4c84863dbb2e2758f946' +
    '194796ab2bcb79ff98006f43a86cbe94241f5f684bb57c0daba66a995532c6ea17f7097bb6c96849e05b2def56b521dc4114' +
    'ababca65ed05e0a8cfdf822a2139dfcaf3ba75547f4d28c10fef62cec93b1e5fae2c1e1522d833a70a601ca0f250e5a11234' +
    '264ecaefc4e519a14ce33151630fd6f09aef4a228b28586ce348c516f7fc8eaf68261d43049a8dce0aa3da3608720d11990f' +
    'e919daf3e7889caacb6e21d19190314197c43c087d121adfdd2596842dd5a4b93f7743b3f2378e3cad390ea9f8b2a7b55b62' +
    '95e9e5ed87abbcdcd8e6c0e9517c4dd0ca2d71d215f37b3daa2b7aa1ffb2fbc4eff14cb3cff8bf56d2c2bcd115031b70a0aa' +
    'd8f80da167243c88bbfb6dbdf26e568d7c7512b920cfc8fac69e00d39d6228be13222a0757d2ebbc21a3a70b855dc7dc549f' +
    '47efc5b10307d6049bb86f507e61701c56d68a38c98b933c6d82fcfbb44fb3cdb23dbd0772d3f30f8ad4acd1f2aef4543154' +
    '0f096d584525581740d056bfcdb76ad53e72ca443fcaefa0fcfc8303b229c798980ea0bf9c1477e73b9124c6dc3645b52a2c' +
    '02d6cbad0697bce166f98baa3c1555772048e6bfaa8abfeb9ae5d34347c8206ece242737f388a1ba42326593ecd129a47a4c' +
    '959bab292020df43c4ce6e3ed50db23d2f5bea365906edcabca5e3b9de01e92b5fc38a07862b38bacc02bb4d1e71394a5087' +
    'e2d78798b87a0b344b1bbd14b219d03d38645e9992a22697ce8bf657ba26c2c762e95e4362b8d80fb5ef76a3b281f4e183f2' +
    '450c37d6702f3ac575ec11417531d74e2efb82e1dc3c91f3c7ed5708350530bc05dd580dcf24cacb3f210b4520a7ea034fc4' +
    'a9a02a7d43264dc8699f15bc1fdcb2997012ce2357f87c29457cec341fa1f49154c6a37c87accf4283d7ee38e166118e583c' +
    '032d0a8b9c5c30c5aed45fddeda2cb41adce0485364ed265079a2fa63d447bb2bec69095803b231edac6a8d8bb16c30ba651' +
    'd078691580afca17a5186ba3bf036503cd1dece24638596fe21cb13bd5ed9a066aae2bcf35e96729b9c080325aa03d5a7f6d' +
    'd651d083ac5f8c4642ab1c0a7c1ec41605d898f2f96891f561f843ce8caceeea1f7d24fd2b4c9a815b909d36c948d028e1b3' +
    'dc94ddc5e9571e2c2019154941be23526cd3fe3c68876f7a89dfb527332f94a15d635dd28d729422400ec3062e7acbe84498' +
    'b5d0dcfbed1cfd868ce882f12735a86f768412516dba73b8e69b3872e3fc66731736c1fb31a00c76504997ea7855774eb70c' +
    '0ff092885dbbb05e148c11176087a91a94636a0a4073789a1de506061b0b9fedae763962a888c4fa0fe01f936f8cfdf42813' +
    '6ac19edeef573312bc66ecb9fd980161660696f62556d103f749df2462ba693b0aa41700710a2f558091b43ff863229724fa' +
    'f78dcebc1f677a7ef081f95e0bc8f523744ad1c73988ce03b314a68394acf071c7ae765153a0470d6f61679cc5c1c5ec482a' +
    '607f1bb4ddc8b90639d2137b2294dce6af821e002751de580dc5c0b0192d3fc60d9df66c357bb7435d4aac3d028c6fad3ac5' +
    '830e2be59849e93e3dd7b7074d67b16f886a760f69634d2c61a6b831ad939ff3de7fbaffa13ad031dc9d626b94e941c6dd74' +
    'd0e9bb050d7a9706901e5f9c02f8bdbf4e229195f90f24c4f20764226daae8f675c6aabd075d37007476c9e968441ad049b7' +
    '970ad9073b5eb9cfa04b6b9ca823aba8322881cdfa6ee8977fd410ea254db056881317fa117dc5b6825b8827974f53404407' +
    '873bf75b5394d1042da48bae8cff0b1382668d5675ca37fa63754d04409480bf3ce17883686b50076513fbb408fa2b6d7e76' +
    '86a139727c7a429de63aa2824ce7e9f11813be0fb289b8adf9a17c2d0c712647db34ad992ddc942f3b162a74dd3356e1487a' +
    '57bfe46a9018d5bbbbc42142134992415154f379ddc3732823debb3d5ff957e8da5a84bf4c8f1cb3c6c75cf2689e6363d615' +
    'd7a6d3c9c08b0409ca6ae57929c7678b7ee7a051c4490f7ddbd41f306f540cc32eb1aa5a68fc1587cc6eede660b85af95490' +
    '18c947b12fd239dfd06b1f3dfdc4a50728ca3106037727beb3da55bed99bdbe7950391605eabc3a24d3ecc00146f8def9935' +
    'fc8edab51b26f0f42019689d2b20300f007880cae2136a7cdb47aa83575221f3366a66dcdc1b46d7c58f27d85bb9d3b537a8' +
    '2f4a5333c645d29a25a9f39a632f775ed20c366ce8270c7e66c35fff280e9761cf0c1187e2caa83eb456760c0ecdd8ff5e2f' +
    'bb4cb1d8683edfd17823079c56d77e27356abc81f4d9648016cc73e59f20ad1cca8bfcb24925a23f2969b88da92fcdcaf154' +
    'a4866e26fa484f8177056d7c958c1941da2fcb88911974a60c92e99796ad49e055f486982f281e4fc1f185476af36dafbb1a' +
    '57fcbb65c80a9bc88456fb9d03c66064e17ff0f4159a4e032fb4cfd61efc8acf52bedc7fb9a41d6129a035ff306568f7670a' +
    'e57fdeeb79c1ecb5e4924e5b76852cf4990d00cf6a42820c22536bfef2e67fea438742109163c800ea06a4c1055b4924b5ba' +
    '06b6173a68519e695483625e814ae51fc71509e88bc352ee4417e8e52ff9e83fc3a4022ffd51dc97aa6fe978df93ede6c846' +
    'ebcf61399eab2f135164306b58240d881023e6978e3940976867ab13b8c79136a1e8a1a6bec92f17bbddb8ef14f77821e169' +
    'e6fd52c1fdf4c812d71de1af6ced44648141a67ea0e14fd9bca996b2b910d6fb1dfca15f63b74cc9618df2199a7759b31985' +
    '9db4a33add2e5c021ba94ae5746232813e1ebd990967de8c0f6cc9785b7e04938e8ab5065fbe91627e9b16ff8788926b62ec' +
    '004e373a37b6ae7d970f5d68f825760c4ee0a28d583c9117aa86eddafb61bcc707941b109da43cbc22d1f3b7855575f7633e' +
    '872d652d05e45e579591edf75bba2b2ccdcebadeefebb5e15dbb484d9adb22723d426a556e4e7c46d6801d97c1cdda468c06' +
    'cfedf8487681ff8aec929374da58dfbfbaff54a4e1f92b0a66dde698bbbeb017455d67bb44368dfda4f8ef35737b6823e4df' +
    '835aca78bf6edff0491a3bc98d4d6f4a2373f3780950e69a91101ffd2712ae372901f39abf28029b037a1fcae647d81c46ce' +
    '3cc15ee4c1f0bf5b15aaa25d2de61bb551649c872efa5560de5cebb58b075545f74d7c372e54201dd587340a7b953ea360f3' +
    'bc35aecf6872a478866330f0a531ba1347b2da80a8632b8c8e5c9877418e7c36046961702566c8ace77e8780e5c4a59b8cc6' +
    'b477e7c8fcc72d88ac3f1c45603ec50de07a4a99128d7b3eb4ff2a8f04dc8cbec2d68745580fbaec417e3b35b266c85a1c74' +
    '9378d243d647ba95975226fdf315d90b16893144afaa4540088fbfa1cbc1703a99257080b3e573cf932aba7be6c16a8e39b6' +
    '1fa6f55459139c4a9e518df42cbe7b8db1a49635be8bf5a7ac7365d2d0fda8b77a7d0c071f03ac053bd7927c326ecc1c43cc' +
    'a28ba6f769c11cd61628e9f16e72e084c9236e90752a4f8b23ac2ec0c7f61a0af7d48a4b086ef167b20210fe43968462122d' +
    'b05688e470a244ea2ec95f15e73f08d71380a5fdd49b38783cdb768a7e67ae3fa82d3571e401d45553a0ac322e96d70d5246' +
    '4fb82dbe38fa58faf4358d15841d3efa76c9bc621838bc1fa65b238bea52fb1a1c3c957028e618fe65859f685d210edafee4' +
    'd3c98d894902d95824f3134eb08af6ae4465f97c430e79c0de49e5e44dfdbcad4b9b5328d60bd2cb6b934e06c2b7d2e890c1' +
    'f1b70feeafd37d3e6a8d33e292f4d59980991c3cc545f15397371fc9e5725ee3cf0ab9506665618b25a8611f134b9d171c79' +
    '730fb7196c2e387bc4413b4c25f83c7753db06464e7041ba5978b8664135f607dc113d3cd511fc5412279899538dd10a2ba4' +
    '5b48663f08342c92ab5898e1ca395bfb872b4ee7f04e273991ce5a5d8422c57d3b648531c01c1affa4e5fb9637febf8c390c' +
    '4548c0125a323fb8c2f690b12daea4ed09e040c8b99893f222ef221a5ade479094c5ea06ce5f9c09be80d1033d73e85f32ac' +
    '4f01bc292fd8b340bdcd50fe569e1a28b9c48d3ad9210adbf394e5a388cdc6c23178721fa5b05e05dc6210a52efdb350cb98' +
    '2c41aa5a31d00d3fca2bb44def002c3fede3945c847b0ea77656014366a174c2056f8876ec5aeb0138f5ad4d1181766a5d67' +
    '37e6eab37f6b089e266bad0482c1592607f1ca44245febfeeea764641eee6cd256c90a86ad36a71af18cf37f3bebf8b5853d' +
    '3a30d2d5cf0212410321dda5dfc485cd5737293ffd25e65958f079e1573bed366d0d6d2cb4c6b8803f5196450c79cf2cc5c7' +
    '7a95f0ebfba4e1bcb8558cf3ab53823895a16dd1f793140bec833e8ab93196356b08564ceb33cf4a6d29d313ad5d8e9f1920' +
    'be092a4b4e0cfa80b1efab41158ee5c7dd806dac1fdb5098363fd264a6157dff383e11cddd02d8e8044facf0f2a9771b52a5' +
    '3c0903acb4f1bf0d18de2757d29383c5369b22b911ed0d63abebd3b0ae4d69f334c8bc660a2c7c2636e3cf79bf0a7fc2094d' +
    '592a3ba797d68f6324c5103518f93887773e1c926122258de8620c6c0203394b7d3a1e49c1a22518b3959fda48a04c58860b' +
    '68cb2829435b5c7a65f12cd80ab4a8ed67578397ae43ccca708d785b492ea2e069da906fcb40beb973789c3e0f2ce8a5101e' +
    'f1d9462a1ae5c4e1eaf6875d3b2473a66b0db4396ada9e0632975bf1f6ebb47c4d539b70c40de1eec5583362a0edba62130d' +
    '24d6cf0a40489b58edfc962afea5f20f0a134cbde1eace485370c7366f2340c44da85194f1281068f6fcea16c19c2d1f9266' +
    '3598fdf9b0e1ee19427632e17e8abeabeadcd7c0ff84c51282f23ae8f80db8b93439abcf479647ae64defcbd1b1cdbad21f4' +
    '14546c6856a2b6456e720e6fa848d41d45fdb6494f4fd3700b524e253dd82a85b7212c8d4605a309fdc34d4703d8c6de146c' +
    'b21660cbd90589bd1f8b9dd55c82764697c149c4a79276e83dbb02351e0fc4939e54a6817e576370616b43a66e8ad44a9438' +
    'e4501a88f475fdbbd27986cd4a2f85feea9536b997fcc9b4c001c4239f14c1688c8935c926933ecdd4ac454d27611a50ac3c' +
    '3b3c5598f2189b071d72bae71694ee047d6f3067e84d785bdc94322ba03eea91138d2d3220b64f7c0f73335601347c289de3' +
    '5dced0e425e6d2de36b65566983636e3b64a265ff2763917a45af16f5c5ea82622aefe659933bc0d84a3f11fe9ba2c167070' +
    '69a8d4798f663baff830975ade0a0a07619b5a61d6e3e2752faa8656bba04c727a394f9080a8c311c116ba79255c9259318c' +
    '90b94ebb85288ed128f8ca9a44e42010a49dd8ed0867b9a2bb098dabbbe8f991a10b4f3a0b674865b315fde8837853145364' +
    '589fba73cc589a0abf7421312ce91b484d358a450c6d4cd40fb509c489816c524abad19e229d9775787c31182fd5268f78c3' +
    'a83c0a8dc6a231b7379fe7eb545ddb5f163c5cec9c2cdddf3f6dd249e549e2ed861f8df3492d715458261dc334fe232a74ae' +
    '9a4dfe722a8ee3004c0bda3ab2eefd9be5dda6c81a35369bbce4f35251b14f665ca445b070cdbcc7ac3a2d807f604c8807a1' +
    'eda40c3d4f92f1ae2f10671682c7782714b518cb99b8237b8900cba3c4efb64e5df5d1db1924ce54fbbd70d1f9b0add1f652' +
    '0c0e3ebe452c22e4acc8af6929c41761a5cf0467815afca75dc587c3e5ee0c5d55b900fb88a7d323822aa5573552660aa898' +
    'b5a6f36e4f251e7aa191fbacb5107149b520b619903d0c929503805adb123a0c6ff28ed00ea68da22accaf0d3170b377bf49' +
    '4e04f1955ac3750646b7ea40517ad73116ebc103b1d7d27ae5e98ae68ccac8d7b7aab4eeb63b6a64a39b94ef74ca080299b6' +
    '834383d30b1cba09e440dc30a2d291899c0c6b6cf0210c37350fc564f5bb5adddb0059803709caf4192caf7fc7c825ce9769' +
    '2b7733be9b00392e71b491fc39d2729a5969f154bb55a17d5967858bed5f6b4bb465ddbed977e6838c8a42428ecb48fb8cd3' +
    '2c4aa821d8eb3cb5e4284c1a516e67a9422d65c35ae098e9e597d817a69e1241ab196343302a30db5dee52db22f24c3686d1' +
    'e8690530272d2bf914aaa13c0d99a59f20f55797aef6e44ee30db61a4c0f2a6b0be66b2bf30c049dca516f7535ed738ce1ea' +
    'cbb79dbee8c578333822a1cb711086c3440f95c9d3e6b10bd6d3ea4d6d63aaa039eda0858cbaae5e59dcdba5c6b557f09849' +
    '6e92e6a828b4733d8fe26db723fcd0aa509c1e5d2e7fbf3bec42bb28fd43223c8ae1012beeb7dafa835ea031925841a4fc5a' +
    '373f4998a127c753bdc50abf6a687cd31a9a769e680af1c9289ba0bffe44497684d20e3a686def835a85183f63a880467eee' +
    '2d8c97d74160f1f52fecc616ccf6d65f4df408234e2b9e5e57f5f83764b20045efc2298c3424abe16089067b6bbb752dc7e0' +
    '11130118a334502f6367dbd9cf0a4c438fa15787a2d680e8c964f5921ed96847931188ad341597d8f2069dde7b47096a66f5' +
    'dfddcc62a1b8592726d9f953cca8955660f2cde2aa05c87352abb25fb6ba59cb1cc47e35ae76175782d90f4ee052e4b3b09f' +
    '968df9f2ed820a1c3492bd54e41c1fe71af896b2fc8962fa8ff24da1ae400d7d91673b41fa4a096fb4ad06e6ae23b2233e10' +
    '61950385b19a7edee87baaac3b0b17b5120f49dd8b63863af802e000c78752e1b7850285a543c257750d6a0b6e3d04dbea77' +
    '682abe85c9c732535ae802f76b02fe84aa50d2f6c546a0f3ddeb49afb6f2865c9afb3337bc1cd87a24a99c95786f51bc2bbb' +
    '415b126f315bf4613139ea05035bdbe6910f3d912ba95e5de898e9a110b33de9274d9f22fd05f122d3a83203a4d7d95df88f' +
    '3a76a5c6bc068bbac6126d15c217f90c33675258b30e22046d5b964701660a384f4c730f848e56a30a80ab69b01426dcf590' +
    'd68e608336813f92ccb094c7549eff6a37f19d64bfd7e4cc310a448a7efe2c9bf2f36d2d0460600eb1543ccfc2a62f98a77a' +
    'aca03494425f90bb5daa2f89504f942435dd52bedbbf11bef14e6f80ab6363c1008a4447104f6a9ce01acd31df5077311f9c' +
    '71acb47602d12b0c2ca6e75e94328ca0798a25cc7736e35cc5946c5edd85e8b975877dcaa3d78f5b4046bd00ed1288ecd7dc' +
    '452e112e64a04a0f08a181ec618df7a49765714e63ed3ccc08574393c1f577051eea3504f6e3abe5b811e95708727c75ea22' +
    '16f91297845ec4b3b1b076ecc629d6be6fd8504d5f03abd9652293e1031ae4340890afdd95877a02fa9076980b25f1f698d7' +
    '9b4839ecd30cdf8e0bf34c794b5f686c6a03eb11d51a05c3068be40a5c2d664273aad9eaca6888185fd04317965663dafca0' +
    '72f9ce8f49257dc704c64c2b3264ee0d00d7dcc72ca7c8b70d10f32d3b41762ced3afa577040b9ab5eadc58d5a9a9b537eb4' +
    '9bfee24f33e77eb0ee3d921bc44194acdee3a28d0619542eb7ec2ca21bdbb9f7c8ea31973e0bf9177c883d65149e8bb1d76b' +
    '84fe5bdaf109f8f11b7a3d4e4d21ffe4e859584f8e4086864fd9397333074d61267e0fde372b7c9b02c09405e78fe8088b53' +
    '7b578f4106af9723f95dfc8b23d08db90f0e9abbbf9cf925a13584675e940e30e0f4c2a24cf32e695e47fab3f4e235d0389c' +
    'a1d34a111614d4facfa52e4ce7e891a05c2383c43ec3d7057c5e12f3d3a78a2fef2fac7c5a352ab2a67f3a2ab6221bb8653e' +
    'e1c2b464b6ad695ccd970f423305e458eabcb7e23075ecc418d1475182a833d7d0347789493e7a89832105beec5e84da7565' +
    '3f2bae04263400e7a3deb211ac3bfead827e8403e072763d1eeeb0e43b8ab8ff8e7d95b527e99600f2a2b96dcc42b6ce1c05' +
    'fb2ec127a9490967e2fde95be832c5898d1eef5977371599c75ff45c6ce32479689a0014376fc3397abb76057684aa636904' +
    'ecc9396bc43290075b336cbcc5217f48aa75a1199fb2474bef17896eca5f90eec3d1dd6c8e6034def42a73c43e4cb6543c68' +
    'b6b6a55e94e6b12cce24df06b83e7b1fe10c52f67e5f9db31827f2c56c10adad83b209e66078beb3a99d2708e5f51adc75ac' +
    '702b534217641ad1b0c92e8302b606933a1436dcb2e22bcfdc8aeea279ae590281a1197a7b04e381d045d961fcdf146a19e5' +
    '2b0d3cd09880d0934e79ffb2cb2c198e5f8b67853c592b4e08a6612510ee580686273fb420e9ba9aecc2a8dddd27ee020f44' +
    '2195206ece03f955a5a9e3f66617fdc2022752f5585e6f1cace93bb69196440a828c02f0d7871011f3919f430c635111c4f4' +
    'e14744f25622348a206affd66b8368407ec9ecdf2a6000ca7e67e42589c48312e7c647a34c720b87faf859ddc781ce1e4a9d' +
    'd357982b187bb17cdf4073848a66f1ea8280ffb3cdc503383f9833347f5bc24db287746f6b35d76470aaf7798527a4973b73' +
    '4037e87769a1ad6173fe4d414c3e758fd1694d3286ca5e2f0bd0b99f6035fc8e60ea868f4c6ef3bacfcd15cf2193f8317faa' +
    '3b02cfc56d769b9ccac962f9533695de2629fc91a1745314c47c90207128e88f4144d3638629a1f3ffa0c90a41b2c11ab4ed' +
    '62d9b6ccde670211f0c0898b3ef26bc44170b919f34184d9694cd4de9ba1c128b9978f86df940734d7518f7293530f7712e6' +
    'dc39f7f97b7f32d32d15cafa4d3ad158eae12d5a2add10348633a21ce7b0c94335110df587047621ef4eafdc785299eaecd7' +
    '211f547f4e14d9ec737d7136f7dd8b76e41cf830363ec89bb1dc05a976bd8606a33917bbebff6965789224e2226a597edf4b' +
    '4da9074cd1c5c72f57f1f9bcb1a5fef845be049874ab7fe2af6314d290beb070032704ee0bbdcd57a3e73a7f64bafeb474d9' +
    'e5778dfccac6b4c2baec48720ced193d9bb904cb9ef844646f2fca47aeeddd05abb4930aa511f8abdaa3493fba55a47139e3' +
    '277a030a0621cddd526f544210005e6e888eb35cb6b57fe4111fd128f7fe509b3aa94cea489886920f19ae16d0b3c6d95d86' +
    'cc70f3a885fe84cc70d18baa0cd0749552f9783b6868c639d2206969ec0a2ba897';

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
      const code = elSecretCodeText.textContent.trim();
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
