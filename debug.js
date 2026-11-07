(() => {
  'use strict';

  const REAL_TARGET_TIMESTAMP = new Date('2026-11-29T12:30:00+08:00').getTime();
  const realDateNow = Date.now.bind(Date);

  // 未通過帳密驗證前，預設為 0（不啟動任何模擬時間偏移）
  let offsetMs = 0;
  let isAuthenticated = false;

  Date.now = () => (isAuthenticated ? realDateNow() + offsetMs : realDateNow());

  // ============================================================================
  // PBKDF2-HMAC-SHA256 (12,000 Iterations) + Encrypt-then-MAC 加密載荷
  // 原始碼完全不含明文帳號、密碼、彩蛋網址或 Debug 控制列結構
  // ============================================================================
  const PBKDF2_ITERATIONS = 12000;
  const AUTH_SALT_HEX = 'a74f92c81e53b06d4821f9e3c7058a14';
  const AUTH_RECORDS = [
    {
      macHex: '52e72c079f43befc4b27015fd11f3621ba138de79e2364d7e1b183b6591548f2',
      cipherHex:
        '71848d109e9a34b34ee748bc3a4e7991f14640fa6bff68eb2ccecd2d7c19ccaba8af117e21765b12' +
        'aad9aeeab10e4b11db777ec03c861cd9053c8a9a07c47c5398beee8fc98b4ccb3fd64bf14b33a71f' +
        '99274b76a25cd38eb47df06d7f9ee63fb9e49d615e3d27772e99b4055ac4852033b432444e74edd0' +
        'c1782c84318a0735509c4f781cca495b71c69cf81f73a74be09f98d5d040484fe459c3757f83a091' +
        'f028a02532b3e8a851bdc3c4f0994b8faf26d41baf7c4e7721b378ff7987ef7ca6cb54a5e2397eb3' +
        '88c9976a082f6a8fa57c0f60bc85547864abd3c729930cd97531da6a6c1bdb291bf296e40fe26fbb' +
        '436f430eac393c36e28dace7bc16f3641b4a7501b0a155f5614646220ba3bb5e8913b35471a27109' +
        'afec9b9e2eaebacd637026b8c52b2242de9e0500e828c83ba2b820c6b51b918e18c34f7068039e72' +
        '3da77d94d29594aa8a0d3770ac36db762288db211ad9bf653f46177d65170905e07b8016aec252ae' +
        'c7a67c01ab6a62293608b9f342c103fa850bb0e1d8b140b2eb92a1f6ba62c52c46f33490a3323319' +
        'c1427386a131cac8758b61600b4f7dd0d8663e1ea80986523358de0e9078fddc5a34c60091b7a656' +
        '41d56203f38cf22ef8e88abcc26bfc1a8fd0622f7e9a48536453ef437aa89c095368e7b57c624391' +
        'c0ae3f67ececff827ea843f0ba2aecaabb96f3b3d3b2f7d389f6802a6764c006555a7c4f1f80a84b' +
        'f1772c1279a3aca99997f153759205c5c20c9216562a1ba570fb90e183726e3fa47d7ed6ee6c42d0' +
        '29a52598001622173d221e447ac94abbca3b4f403899f9ce624af530bb79a0d70c80dfa4ff3f95cf' +
        '75652a4a49795ee38eb6ddee83cc1eb03007748cb4a73b9c37f10137d66511f6e9da4ab6ca1bc3d2' +
        'bbf96297e273a52569f3c7b6c45769fedada5c899039cd59fd133c1972bb1457bba9d36139b9b291' +
        '72a692b2aa49b99f34a3f52cc26d4525444734b05fd3e4e49edc00f6c3c06e0eb752d679ce5c9f2d' +
        '4ca95c3f9d06c07beb94ea2626a2b054a3f8c9deb44d1209381c9b86519251b091d580c8afb5cf13' +
        'ef49f9b0622a9c49a37faf19b5980aff8c415ac419f58b6f29c8754704e7873490a5077bcb4f7656' +
        '5e5160e6ff4590e04b8bc79c2d8ad41cc2d2a0160eb91dcf4ba9fbae2bd0cde4c2ff85562248022d' +
        'dbb86ae90848ea354e43540d66e175464a0e8dfe45e7914f8115c6274ed5a234115c9f16b0b26bf2' +
        '7d722bbfd15d12f24903caf2ee27265adc4558c26db77ae7f0720da8ebeaf0a47657b6ceea163b9b' +
        '22811c594e9f9218c3c621c3553c3c822fc200336ca810220cfca8329ca1362a629f963ac235a484' +
        'b3c1b7c89bdf12e1f29f6a528e30cef5af6fb1857a3aef78b7f904119b9cac52c91f68db72319f17' +
        '0228dd6951b5b38837d7c18ad427f731ee5344f15d775f9ee81a1e3dad7e307f43f0be900c28cd1a' +
        '7702af41d76a9c0af4',
    },
    {
      macHex: '884af32ccd4947bdd539b647ebc69ddc9e368e93fd7c32d38d643e37fa241318',
      cipherHex:
        'c0ebff2e7bd75029503f8a6a9e34a71a14acae945579236a4d0c8e9d2fb5768119fe9bb14a8ffc50' +
        '3b62fd29ca70b02b5a8548b933cb1e294bd5a4b55b96b199de16de044ec561151b25aa31ebf206fb' +
        '096c7e7f4f11cdcfc3fb46613e00447237522cd5ab9d8049afaf6be9c0c9688f4b04f3ae8a2b9003' +
        'dde1d9d96d831c2f3e80b2bf9dc3e435d1a939e6abe95152812a139d7759cc3c1802c4de1102e2ba' +
        '4ae618b58fdb35cb18b952c79b677bc52be183e6bc5141f86f1a55db6a8b984dbec7334f468bf21d' +
        'b774dee2cf0d01e836ed41c6ebbac7e85579132a3e9bc60a423fd47cfcf4d4a501f34f2b1be41cdb' +
        '937bd3263c98aa327c4988608ecfb436faa09282b5b5c8fd51abc06c2ac7235856654b47b55b7b62' +
        '2ad6680c8fbc6065ac0f2353831362ff32f12096b3383dc149259387cdf9c7c6d4a99b1b7570be6a' +
        '06c7fa86e5856ec88a827775e14fefdf7e730a282745175f7905ed8ab83a0d1a557a62c8008cf22a' +
        '1ff2a9bde4db6d33681e3364751464e31e801a7bb09b1bf4e6497c416851c0592d2fe9e13139cd30' +
        'ddd5aab16b2939a0907a3353bb32c89ba5d70025a4dad12a00ca47eb9b16b82f68cd3da0df5bf822' +
        '1b4557b01e366f6c21655e8d11980c00020682d38e284e60c9ff6c76a25a3e2c63d7852bbd275c03' +
        '350e0c5503bb16710ca8929fe4b58e93f2971606a477df9c6e7ed7a2232ec9432ab68310685c31c4' +
        '7da2b683463403b361b60cd41de53c2c4b10a6d0d15aeb527c8a6d9677ad06dd4b60f5597983b0ab' +
        '48449741a35042c3bdf10f55ea1ee15f5189a67d6abcf5777fcaf1eaf3b8ce4e3c353bff7f5f5ffa' +
        'bf7ef3b499037f5eac3f5491417019970fc2370f62520b648b8a4fa70355fed1d40fdd9637d42a94' +
        'e8e6372140e3856c4959b81d241c2561240e964aad32dd357b94c51c1e24753108d2e50739038059' +
        '805662d12932aa5bb5c3ad0960beb873d35fe74f48255753baf19a1206705272d546f80362898475' +
        'd32a59ca5ed27e2a171c0dac22f0075bfa73a6a12825f8f9fdf3d63d152ba4f4d6703a60077c62e4' +
        'e20cb0c3874ada4bfcdbc0fe4bf660551ac65656d715c09a4bde4a96048e499105f28fcb5800f31e' +
        'db8f233b39619612b47324ced27aabdd5eb06f91d1a048ae5c20e6254ac17f8cc4b082a1f8efea61' +
        'd910d1aa21638bc06b847dc0a75e5e07ca052c229a4ef88faeaabed41918c70a138db43461fa091e' +
        'de718a81d03c72f63763c43ad773cf519da5879de2db817494b2af902fe361b2c5b22f6d124af1fa' +
        '9e5981f0a365cde5ed5063ad0d08388374444a8cab00db60237492ec31828acf5512b8e9d53f6dce' +
        '7dacf1e3648d24eed4301c4f1a32a1d43c77fea1421e1bbaa7b3d79dba7ec73b74b74b2cbe6f80e4' +
        '7a5c1e03a9e305f493498d017a0595d4e96109879ddf34e439bea5d44495f19506dba75c50472791' +
        '37f839b9c43387fa0a',
    },
  ];

  const SESSION_KEY_STORAGE = 'wedding_20261129_dbg_dk_v3';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30000;
  let failedAttempts = 0;
  let lockoutUntil = 0;

  // ============================================================================
  // 獨立實作之 FIPS 180-4 SHA-256、HMAC-SHA256 與 PBKDF2-HMAC-SHA256
  // ============================================================================
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

  function hmacSha256(keyBytes, dataBytes) {
    let k = keyBytes;
    if (k.length > 64) k = sha256Bytes(k);
    const ipad = new Uint8Array(64 + dataBytes.length);
    const opad = new Uint8Array(64 + 32);
    for (let i = 0; i < 64; i++) {
      const kb = i < k.length ? k[i] : 0;
      ipad[i] = kb ^ 0x36;
      opad[i] = kb ^ 0x5c;
    }
    ipad.set(dataBytes, 64);
    const innerHash = sha256Bytes(ipad);
    opad.set(innerHash, 64);
    return sha256Bytes(opad);
  }

  function pbkdf2HmacSha256(passwordBytes, saltBytes, iterations, dkLen) {
    let k = passwordBytes;
    if (k.length > 64) k = sha256Bytes(k);
    const baseIpad = new Uint8Array(64);
    const baseOpad = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const kb = i < k.length ? k[i] : 0;
      baseIpad[i] = kb ^ 0x36;
      baseOpad[i] = kb ^ 0x5c;
    }

    const blocksNeeded = Math.ceil(dkLen / 32);
    const derived = new Uint8Array(blocksNeeded * 32);
    const innerSaltBuf = new Uint8Array(64 + saltBytes.length + 4);
    innerSaltBuf.set(baseIpad, 0);
    innerSaltBuf.set(saltBytes, 64);

    const innerLoopBuf = new Uint8Array(96);
    innerLoopBuf.set(baseIpad, 0);
    const outerLoopBuf = new Uint8Array(96);
    outerLoopBuf.set(baseOpad, 0);

    for (let blockNum = 1; blockNum <= blocksNeeded; blockNum++) {
      const idx = 64 + saltBytes.length;
      innerSaltBuf[idx] = (blockNum >>> 24) & 0xff;
      innerSaltBuf[idx + 1] = (blockNum >>> 16) & 0xff;
      innerSaltBuf[idx + 2] = (blockNum >>> 8) & 0xff;
      innerSaltBuf[idx + 3] = blockNum & 0xff;

      outerLoopBuf.set(sha256Bytes(innerSaltBuf), 64);
      let u = sha256Bytes(outerLoopBuf);
      const t = new Uint8Array(u);

      for (let iter = 1; iter < iterations; iter++) {
        innerLoopBuf.set(u, 64);
        outerLoopBuf.set(sha256Bytes(innerLoopBuf), 64);
        u = sha256Bytes(outerLoopBuf);
        for (let j = 0; j < 32; j++) {
          t[j] ^= u[j];
        }
      }
      derived.set(t, (blockNum - 1) * 32);
    }

    return derived.slice(0, dkLen);
  }

  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
  }

  function encodeUtf8(str) {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str);
    }
    const utf8 = unescape(encodeURIComponent(str));
    const arr = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
      arr[i] = utf8.charCodeAt(i);
    }
    return arr;
  }

  function decodeUtf8(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return decodeURIComponent(escape(bin));
  }

  function constantTimeEqual(aBytes, bBytes) {
    if (aBytes.length !== bBytes.length) return false;
    let diff = 0;
    for (let i = 0; i < aBytes.length; i++) {
      diff |= aBytes[i] ^ bBytes[i];
    }
    return diff === 0;
  }

  function tryDecryptDebugConfig(dkBytes) {
    if (!dkBytes || dkBytes.length !== 64) return null;
    const encKey = dkBytes.slice(0, 32);
    const macKey = dkBytes.slice(32, 64);
    const saltBytes = hexToBytes(AUTH_SALT_HEX);

    for (const rec of AUTH_RECORDS) {
      const cipherBytes = hexToBytes(rec.cipherHex);
      const expectedMacBytes = hexToBytes(rec.macHex);

      const macInput = new Uint8Array(saltBytes.length + cipherBytes.length);
      macInput.set(saltBytes, 0);
      macInput.set(cipherBytes, saltBytes.length);

      const actualMacBytes = hmacSha256(macKey, macInput);
      if (!constantTimeEqual(actualMacBytes, expectedMacBytes)) {
        continue;
      }

      const plainBytes = new Uint8Array(cipherBytes.length);
      const totalBlocks = Math.ceil(cipherBytes.length / 32);
      for (let blk = 0; blk < totalBlocks; blk++) {
        const ctrInput = new Uint8Array(saltBytes.length + 4);
        ctrInput.set(saltBytes, 0);
        ctrInput[saltBytes.length] = (blk >>> 24) & 0xff;
        ctrInput[saltBytes.length + 1] = (blk >>> 16) & 0xff;
        ctrInput[saltBytes.length + 2] = (blk >>> 8) & 0xff;
        ctrInput[saltBytes.length + 3] = blk & 0xff;

        const keystream = hmacSha256(encKey, ctrInput);
        const start = blk * 32;
        const end = Math.min(cipherBytes.length, start + 32);
        for (let i = start; i < end; i++) {
          plainBytes[i] = cipherBytes[i] ^ keystream[i - start];
        }
      }

      try {
        const jsonText = decodeUtf8(plainBytes);
        return JSON.parse(jsonText);
      } catch (_err) {
        return null;
      }
    }
    return null;
  }

  // ============================================================================
  // 驗證通過後動態建構 Debug 控制列與綁定模擬行為（100% 無 innerHTML / eval）
  // ============================================================================
  function mountDebugToolbar(config) {
    const toolbar = document.getElementById('debug-toolbar');
    const authGate = document.getElementById('debug-auth-gate');
    if (!toolbar) return;

    isAuthenticated = true;
    offsetMs = (REAL_TARGET_TIMESTAMP + (config.simInitOffset || -5500)) - realDateNow();
    document.body.classList.remove('debug-locked');
    if (authGate) {
      authGate.classList.add('hidden');
      authGate.style.display = 'none';
    }
    toolbar.classList.remove('hidden');
    toolbar.style.display = '';

    const inner = document.createElement('div');
    inner.className = 'debug-toolbar-inner';

    const headerRow = document.createElement('div');
    headerRow.className = 'debug-header-row';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'debug-title-group';

    const tag = document.createElement('span');
    tag.className = 'debug-tag';
    tag.textContent = 'DEBUG MODE';

    const viewportInfo = document.createElement('span');
    viewportInfo.className = 'debug-desc';
    viewportInfo.id = 'debug-viewport-info';

    function updateViewportLabel() {
      viewportInfo.textContent = `畫面 ${window.innerWidth}×${window.innerHeight}px`;
    }
    window.addEventListener('resize', updateViewportLabel);
    updateViewportLabel();

    titleGroup.append(tag, viewportInfo);

    const btnCollapse = document.createElement('button');
    btnCollapse.type = 'button';
    btnCollapse.className = 'debug-collapse-btn';
    btnCollapse.id = 'dbg-collapse-btn';
    btnCollapse.textContent = '🔼 收合面板';
    btnCollapse.addEventListener('click', () => {
      const collapsed = toolbar.classList.toggle('is-collapsed');
      btnCollapse.textContent = collapsed ? '🔽 展開測試列' : '🔼 收合面板';
    });

    headerRow.append(titleGroup, btnCollapse);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'debug-btn-group';
    btnGroup.id = 'debug-btn-group';

    (config.buttons || []).forEach((btnDef) => {
      if (btnDef.isLink) {
        const link = document.createElement('a');
        link.href = config.secretHref || 'index.html';
        link.className = btnDef.cls;
        link.id = btnDef.id;
        link.textContent = '⚡ 直達 Secret 彩蛋頁 ↗';
        btnGroup.appendChild(link);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = btnDef.cls;
      btn.id = btnDef.id;
      btn.textContent = btnDef.text;
      btnGroup.appendChild(btn);
    });

    inner.append(headerRow, btnGroup);
    toolbar.replaceChildren(inner);

    // 綁定各個模擬按鈕事件
    const btnDbg5s = document.getElementById('dbg-5s-btn');
    const btnDbgZero = document.getElementById('dbg-zero-btn');
    const btnDbgVideo = document.getElementById('dbg-video-btn');
    const btnDbgQuiz = document.getElementById('dbg-quiz-btn');
    const btnDbgCpp = document.getElementById('dbg-cpp-btn');
    const btnDbgShare = document.getElementById('dbg-share-btn');
    const btnDbgGallery = document.getElementById('dbg-gallery-btn');
    const btnDbgFootprints = document.getElementById('dbg-footprints-btn');
    const btnDbgEgg = document.getElementById('dbg-egg-btn');
    const btnDbgReal = document.getElementById('dbg-real-btn');
    const btnDbgLogout = document.getElementById('dbg-logout-btn');

    if (btnDbg5s) {
      btnDbg5s.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP - 5000) - realDateNow();
      });
    }

    if (btnDbgZero) {
      btnDbgZero.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const backBtn = document.getElementById('tab-back-hub');
          if (backBtn) backBtn.click();
        }, 50);
      });
    }

    if (btnDbgVideo) {
      btnDbgVideo.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const videoCard = document.getElementById('choose-video-card');
          const videoTab = document.getElementById('tab-video-btn');
          if (videoCard && !videoCard.closest('.hidden')) {
            videoCard.click();
          } else if (videoTab) {
            videoTab.click();
          }
        }, 50);
      });
    }

    if (btnDbgQuiz) {
      btnDbgQuiz.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const quizCard = document.getElementById('choose-quiz-card');
          if (quizCard) quizCard.click();
        }, 50);
      });
    }

    if (btnDbgCpp) {
      btnDbgCpp.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const quizCard = document.getElementById('choose-quiz-card');
          if (quizCard) quizCard.click();
          for (let i = 0; i < 11; i++) {
            const codeBlock = document.getElementById('quiz-code-block');
            if (codeBlock && !codeBlock.classList.contains('hidden')) break;
            const firstOpt = document.querySelector('#quiz-options-list .quiz-option-btn');
            if (firstOpt) firstOpt.click();
            const nextBtn = document.getElementById('quiz-next-btn');
            if (nextBtn) nextBtn.click();
          }
        }, 50);
      });
    }

    if (btnDbgShare) {
      btnDbgShare.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const card = document.getElementById('choose-share-photos-card');
          const tab = document.getElementById('tab-share-photos-btn');
          if (card && !card.closest('.hidden')) card.click();
          else if (tab) tab.click();
        }, 50);
      });
    }

    if (btnDbgGallery) {
      btnDbgGallery.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const card = document.getElementById('choose-gallery-card');
          const tab = document.getElementById('tab-gallery-btn');
          if (card && !card.closest('.hidden')) card.click();
          else if (tab) tab.click();
        }, 50);
      });
    }

    if (btnDbgFootprints) {
      btnDbgFootprints.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          const card = document.getElementById('choose-footprints-card');
          const tab = document.getElementById('tab-footprints-btn');
          if (card && !card.closest('.hidden')) card.click();
          else if (tab) tab.click();
        }, 50);
      });
    }

    if (btnDbgEgg) {
      btnDbgEgg.addEventListener('click', () => {
        offsetMs = (REAL_TARGET_TIMESTAMP + 1000) - realDateNow();
        setTimeout(() => {
          window.__DBG_FORCE_WATERMARK = true;
          const quizCard = document.getElementById('choose-quiz-card');
          if (quizCard) quizCard.click();
          for (let i = 0; i < 11; i++) {
            const firstOpt = document.querySelector('#quiz-options-list .quiz-option-btn');
            if (firstOpt) firstOpt.click();
            const nextBtn = document.getElementById('quiz-next-btn');
            if (nextBtn) nextBtn.click();
          }
        }, 50);
      });
    }

    if (btnDbgReal) {
      btnDbgReal.addEventListener('click', () => {
        offsetMs = 0;
      });
    }

    if (btnDbgLogout) {
      btnDbgLogout.addEventListener('click', () => {
        try {
          sessionStorage.removeItem(SESSION_KEY_STORAGE);
        } catch (_e) {
          // ignore storage errors
        }
        isAuthenticated = false;
        offsetMs = 0;
        toolbar.replaceChildren();
        toolbar.classList.add('hidden');
        ['dbg-secret-choice-card', 'dbg-secret-tab-link', 'dbg-secret-summary-link'].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
        document.body.classList.add('debug-locked');
        if (authGate) {
          authGate.classList.remove('hidden');
          authGate.style.display = '';
        }
      });
    }
  }

  function initDebugAuth() {
    const userInput = document.getElementById('debug-user-input');
    const passInput = document.getElementById('debug-pass-input');
    const errorEl = document.getElementById('debug-auth-error');
    const submitBtn = document.getElementById('debug-auth-submit');

    // 若同一個瀏覽器分頁 Session 已驗證過，自動使用暫存衍生金鑰解密
    try {
      const savedDkHex = sessionStorage.getItem(SESSION_KEY_STORAGE);
      if (savedDkHex && savedDkHex.length === 128) {
        const config = tryDecryptDebugConfig(hexToBytes(savedDkHex));
        if (config) {
          mountDebugToolbar(config);
          return;
        }
        sessionStorage.removeItem(SESSION_KEY_STORAGE);
      }
    } catch (_e) {
      // ignore sessionStorage error
    }

    function handleUnlockAttempt(e) {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      const now = realDateNow();
      if (now < lockoutUntil) {
        const waitSec = Math.ceil((lockoutUntil - now) / 1000);
        if (errorEl) {
          errorEl.textContent = `嘗試次數過多，請稍候 ${waitSec} 秒再試。`;
          errorEl.classList.remove('hidden');
        }
        return;
      }

      const rawUser = userInput ? userInput.value : '';
      const username = rawUser.replace(/\s+/g, '').toLowerCase();
      const password = (passInput ? passInput.value : '').trim();

      if (!username || !password) {
        if (errorEl) {
          errorEl.textContent = '請輸入帳號與密碼。';
          errorEl.classList.remove('hidden');
        }
        return;
      }

      if (passInput) passInput.value = '';

      const credBytes = encodeUtf8(`${username}:${password}`);
      const saltBytes = hexToBytes(AUTH_SALT_HEX);
      const dkBytes = pbkdf2HmacSha256(credBytes, saltBytes, PBKDF2_ITERATIONS, 64);
      const config = tryDecryptDebugConfig(dkBytes);

      if (!config) {
        failedAttempts += 1;
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          lockoutUntil = realDateNow() + LOCKOUT_DURATION_MS;
          failedAttempts = 0;
        }
        if (errorEl) {
          errorEl.textContent =
            lockoutUntil > realDateNow()
              ? '錯誤次數過多，已啟動 30 秒安全鎖定保護。'
              : `帳號或密碼錯誤（剩餘嘗試次數：${MAX_FAILED_ATTEMPTS - failedAttempts}）`;
          errorEl.classList.remove('hidden');
        }
        return;
      }

      failedAttempts = 0;
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
      try {
        sessionStorage.setItem(SESSION_KEY_STORAGE, bytesToHex(dkBytes));
      } catch (_e) {
        // ignore storage errors
      }
      mountDebugToolbar(config);
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', handleUnlockAttempt);
    }

    [userInput, passInput].forEach((inp) => {
      if (!inp) return;
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleUnlockAttempt(e);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initDebugAuth);
  } else {
    initDebugAuth();
  }
})();
