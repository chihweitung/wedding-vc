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

  const params = new URLSearchParams(window.location.search);
  const kParam = (params.get('k') || '').trim();
  if (!kParam) {
    window.location.replace('index.html');
    return;
  }

  // ============================================================================
  // FIPS 180-4 SHA-256 + HMAC-SHA256 + PBKDF2-HMAC-SHA256 (12,000 Iterations)
  // 原始碼完全不含明文通關密語、儲思盆文案或解鎖金鑰
  // ============================================================================
  const PBKDF2_ITERATIONS = 12000;
  const SALT_HEX = 'd93c48e1a05f7b26c84e19f03a726d5b';
  const MAC_HEX = '21f74bb92acfcf1a794f6b387d4abccde874917a52c5fcb09883c071bc146e31';
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
    '44f19dba8d99b975e0f6fd5924c2e4c9a128d42f8a5a02619784d1a319c2bfda971543f3be655de775ea06ec71fc6ea9611b' +
    '7f02e099524a76fc730e78c401fb1b231518d80722483e7089174f7f1011f3ef4232b8ff55f233a67ca5d7425b1bb9d12a61' +
    'd98818c751eea178ebe562c14bdbbbc183988731a06852eb02c3322db44a6aeccb033514d63c36896aac3f30e2eb430d8267' +
    '72f3acbbd4cffe169364b321216fc40b8434a73fbfa66f380202b18066931d4744eee4eeafdf402d6cd159a351821023a8a0' +
    '13939796e6f31cce39d023ba129ee6e5bff5220b98b185629c5ae09bf9f86d1074dac3562b000879ca237fbe4a1eee5e72d8' +
    'ea1d157497e2f2da720524606c8256cf4cbc49913acdc9471bc12ed75678e7f748521d2100afef5014f1153e784793b4287c' +
    'ba90fb6165f435790f8259c9449ebbc5892981d4ff3c7ea1f2217dc0cfbfca1085b360c7f92d32ea8e6006d55aa3e1ad7e92' +
    '869434728d11a85579a6d5a67903b2e606237c5246855769067f2f5ef98cc1d805306372e18f4a13a0745fa06adb49e51566' +
    'a5dc8a5f8de81be78a939820adf733510c59f49edb9fa0bc6ae62083f68da58c422e141704c22db72b7152010a826c7ac7b2' +
    'e8d1155da4a12ec93ad45affc6c90d150c00b1b34ae7d4aa188c69b3f7e198a261391d443e500251854c2fabfa9ca5d16b93' +
    '2ca5c2fd81b9b299fd0c11f087b21661fbad3ea4b4fa6b6f2bda5046d9645c609b928a1f04d94b6c88f655953a304d71d393' +
    '5ae0c1fb8db3acd6cbeccfd37b7e59eac70a56da30ccbca83c68d766a6a4e0c789b6009ad8f7b55e95d8ac098cbedcd42662' +
    '6648cb35cfb0c3553a388e192d9ddf68d9aa9dc749e5aaacf2cbab505bbdc23edbcb1d3f56cffcb6237102e5309b2976c96a' +
    'ee0a3910dfdc608f760aa5b7cebba3db9e2731cd092f41dccf7a0a33ca6d748dbd57e60c388ffd49e0cbd6a8fedab370550f' +
    '16551b5e3940514f25ea0ddaffe5feac6dea15cfec6c2e1a3d6e79dd34e14e4928b173131ec0fc52e5298c0235e7c955ccad' +
    'f6294e7ee05d3a566bc085aa0d2b52420349e194a29aa24a520552a19001497a8b7f3a7996b9f6f1516616919fa13aef1d4d' +
    'ccc2bc537e3f8e37fea41315986b9e7167669944465e82f7d8e3d5ccb80c8b63548fdb30fd4306d0a41ec4061e15785e1cde' +
    'eebac0a4ea3e1e582808d37999749e296a1d43d4c9a24cfacad7af7edb40d5ab0fd70e0651d48f22d68d4ad3dfb48893b897' +
    '2b167185404a5dd8328815393c18bf153aaccee7a948958fbfd5324e194651867799655da00eaaaf164f6f6841cee56235da' +
    'f5fd2c152a1f298b6bce549477a9b2fc2929a855668710173f28c753448a9dc16aa1de58f6d9f72addf58357cb225b9d1367' +
    '1c79548af4283b91f3e73b82c8cb9871c6bd33ef425a9f1a25cb559c4c1571d7d4e6fec9835c7e03aa8692bcf80a8f5ea91f' +
    '9476184db6dfbf36c6437dfec914346bfe7a87ef024d6d20be39f277fb9bf80719f310be5fc2097d8caed01621c53e2f1669' +
    '5c946f40228875d5bf7e90ee9ed9499f07f087f1f155544ccf7dbe272a60035ff596b439d1cd0b2e9cc0a56abf6f9fb34675' +
    '065e5f2909d1f2ceaef1e6c4f40be72b40b8af2332ed4539dbe4de772d4ddd932b2e7396d27ef86a5440983b600cfe931fac' +
    'c6a3d3a98a3aacefbbbaf6f14769a40c3a847e326cd6ee2f2174e8fa0316fbb9d6802829bf45886e5e8d6f26f0969fc571cc' +
    '843b3f5af7dbc65e6ddb0a9ea520469b51a33c483269769427e2064a405d0d0f7fb3b3ebcbc891f911fe6f3db9d54c02eb9a' +
    'a273404581143570cc6585d3dcce475b3a68a08f7771a05bd42db93618e57c6e9072dd938b82b4f918307fb82ab19340e77e' +
    '04281c30c1edb2d1352137094983f42139d807921999fb18ab11b781fded64840027d7eb967c8689b38bfb34014f101fcdff' +
    'b9b65c8e1b30574561960a6638e78c437fc14657395592056df0c28b1936298aed10f46d1261b4784a8c399494698536e026' +
    '14e6ce6855892db5806142d0f1a979db5dd5a7736761f2b763909350c5ade9a3ef598cf88909f974b1e1606cabc12dacae11' +
    '83a7912e210c14fde21409d152f8a1a60102bd89d41726c6ee05d5dba8f8c3ed2da7eefe064a3f1d27fb18af7a5c158615fa' +
    '07fb5f1eb595f68cf10526d0ad00bcad3c3d8d8aac6e30330b4cff6dd0a1b20ec5430ff3003be8a5817e983a974f4540713d' +
    'a301c54068ad9d58cd20892e42ff1b24a859bb6d3bba35c85e5066240cb2a1f71b911bef774c11532939d4952a9ba5880703' +
    'cfef36687c7011a6e75899991cfd9876e7c7fb35fdb2f2e0b6af6c32412e4b52c814ad9e7b8ad3ef9d924556c42719f90338' +
    '11afe06ddb2dc8a1fa9666d3b9f9c56a4a56ea3dda80733d25dfbb085ff942f8cd4bd4e04e9d02b988d76df875826e249e52' +
    'f1ff87e2d7c22814c66da0543c89519275eeba16c15c567b8ee918347c5445d02eacf9b8acbf308dcc61a2e463b858f903ac' +
    '4f97459124d83fd9cc1f3521f0cce55878ab714d136965beb58e5aba8fc291888f078d6072adc1a25a3588730d6f8def9971' +
    'ad8ed8b11c35e5e52c2320d12f6c6e0d23718b8ec00e636acd09fdb8561b31f53d2372d5d70a46c0c58f27cf148ddabe7eb9' +
    '295b5302d245d38560a8fb842b2e39ef004d0e2dec6f116266d35df9240adb698b5b04c1adcdaf6fb156294014d7d2e3692e' +
    '804eb79f7026befa7e2c08d94c980d2a3d6abc81f4ee6d9051e368a939f2e317a8d0a5e66222f66e606bedc38333c7d4d95c' +
    'ba9a6c4cb775499024602e3282871e15ea29ef899e053d921f99ec9b9daf07aa60f49f9b22664a74cab892456cb742aba214' +
    '58e0ef869d9f97be9648b29d0f8e4e70f968f19954d55d0c3db497894ff98a901ea4c675a58a004233aa03a86c2146e02954' +
    'a2318ecc6481bafaaedf64546a9130f2c09bd688634995714b554dd8d5d106ec2c820a34a645ed31b3e4438e297b7e1fd6d8' +
    '70803d734b77b26068a15117f718c336f8286593e7d01dd16320c98930b5ad69d0ad500ff449de91aa1b439b91daedaf847b' +
    'f08c421d85a3291f782d07390b7444d448219ddd92777c8d786a870ab1d7d811bcebe78ea8887c50f5d9ecce48bb3170ae2c' +
    'aae053d4ece6c81cdd1de1af75cb670d10a2d473e1c7799c98c833656e105c3f54d78c745ed6e003b0e9902bad5f74947720' +
    '2306a337f70f39183b8e6ea04e018250e672cbd44267da974e28867e547924969fa4b14002f9e7377c891eff84979e6125cc' +
    '18462b738172ae688d091e56b60f721f46a5f59e0c65db04c9c4acc7ec6eab8c10941b1c8de332a474e6e7ba87627fba83b3' +
    '85326b2f4d558002af97a465a0472b803c2eeefff2e5b3e358ee8a31906f4951375875557500f9f8a03ec7d2f888f907b117' +
    'c3f4bdc3c8f7414aadaf8278c31f9abff5bc57b1ffff010667d4f7f8eef8905411185dbb5e39defea0f3a1d7a1224f22adc5' +
    '870fb36abd658bb71f5e2a92d60a63293962fb7e0c61b3a68d1d1fac3d4784342206b09dfa84d0da3c7350d6fd4b8d02409c' +
    'bd37a7a1e1ebe50f2badb15d25e51b23a799cfec3cf64f7cdb45a5a0ce96bfa2f76239106b6e321dc094380af46ec7ec46eb' +
    'f523b9c9277ee97d953127efad38a20228a4db98f87963b4925a9e3253cb783b56636b667634d4a2fe3387dcaad1bd918681' +
    'e068eb9cd5892fc1ba340b17573f8b1ff63e599f0a8f356eb7e937890acc817c362a8f04514ebfea09613f32b52dc86c5567' +
    '9770cf10825bbc81d2552deaee59c144008d3b10b5e404033d86b4b0d0c57236d6263bcff0b5799f9034b95ab3c3708f3bf8' +
    '4a2105841c72904290508dd322b3608eb5fd74e3fdabffa2ba327b97f8ffaee67a7f1e1b1501a7682dcc8761766a9e4d1c8d' +
    '327274f753c50ad30a22eba3fc930a848a016b85b7686cc610b078d2c3ba482df1c89b181d2be678f15d41ad479c8f6b2520' +
    'b941cae27eb240b13482d3a9227a29db0291ace0d892761b7f99359e6b66e29153780b6af651881ec359283e4085df074504' +
    '63ba3e9b20f6174b0c7bfd4ad02f3ef832ecbb6e5260be01b35b3b948750fb12042b9f6c2abf5b729d4fda49553407dbba63' +
    '21bf2d7f4f50b4513db7b59cfef8c3bd4f77fc39730436c2c24aa0e756b6fde25d994564d326c3c82e875502c1fcdefc900f' +
    '4f774ac6a2c27f3568a420afb0e6f49e81de423ee5724d4e8c2e8f2f1120d9417708ab5d6621748b28a74103194c9a780134' +
    '2f598516716a3673c0426f0526e9362354930014546953a74521fb694636f2169e5a7676c7547bb0e46694876ccccb023aa4' +
    '5b5464554fb8df67870e8eaed03341b5983a07f9ea4e343891d35c489f22fa343f7e8b6a9e1e42b2e2eef1d232f0b38397f9' +
    'b50751dda87469f58f34744410b5bd61fd5d104b4d64c0a629e56c1b5ec24499ddd7f21d800caa0ea482d2197376fa5438e2' +
    '074de46469c9be41ffdf47f46985106bbfc48f348f350a15516ecdaf9fcccfc83f533320a5ab5b07cb240b654ce00f4a9f8a' +
    '314ba6453a9c1673d62fa243f0537838faf2c67dc17b07a76255014361e43ade467a8875e49818f9797b5ef958817225146d' +
    '35b5f1bc727a0883286da059808e142e14f1dc41201cf5dce8ad20511ad565d350c40690a175f31995cfbe6d2dfaf9a7977e' +
    '371cdfc3c84a1a4a01238aee4e2771e95b226a3af52ee11e70f53762b0caa976afe5996883d7b7d22d5789450c76da30c2d1' +
    '6781a3aae3b3efabbe43cdf6ff12857084e97a94e7951610e98070d9b835892d6a430e1da234ca692827d915ba5fd9d23b00' +
    'de784f2c7e2cbfa79bdc87640ea4cde691278fe232fa13a61d19a21bc51853d2000845fee226daa24742a7ff86ad610b36ad' +
    '331b15a8a9b6e30f973fd570c7998ac5b53bc5f01eaa096fefe0c1b2ae5563ea258da33f0a3d77206fa2cd7cb112698c2e0c' +
    '512e7ebadfdac1317396447140b03188233f599665756281be6405623e0e3d5d383c5416c3b9013988afb3f963e72f4ab126' +
    '54e34b04681fbeb92dd542b61caebf9f6778afbf826aec9808e26e1a1763b8fd22b7d9268f34fbb47b619f274862af35e3a2' +
    'd8cd09344ee596feeaff88457e6679a57048bd323ee09400668d50f8eaaab83f5e528c23a63cf2ebdc537662bdf4ff3c5559' +
    '30898a0d5253900bbafc866fa9b0f30c0a154db6f4ead8525925eb3f746b46de18ae59d9ce6d0675b7a8e31d85df2b1e9a35' +
    '14b589cff1cae4124e6b77eb6a84c78be7c9d5dae2c38f56d2ac2aa7fd449ab92f39b2c8509747f33bd2affb4a5c81e4a41c' +
    'f4547a6202a6b6416c722f75ae1ce81d40e7b245044fdf784e307d38269d64c1f63b3fc8431de641efc8481418dec7910e6d' +
    'fa4160c9d1408fbc14ccd0d85b83774096db1a91b5dc7aa723aa4333020fc494db17aa9e7214f29f92690ce56980d37b8260' +
    'ff6554b8e178f2f48135033ebe07cb91f59e78d799fe8cadca019640c1429e2d9e5b876b2636d13590bd444d076a1248ef3b' +
    '6e1d10aeee1f9d422e7cade01b9dab3628385a2eee4836788e923366e80beb98139637600db141704a321a4f4f2977289def' +
    '5fd2dab030e7d98d64b25f2fda372be1af196544e8242e01a84dbbada8acee6b79e7f160a976b311bebee80ef8f27a4437b2' +
    '9955ee2aa3793aa4f8338616c5154f534dd74777d0a66983deaaae4ca5e45e7d2807448a80ebdc54f617b0652708d0673189' +
    '86b14cb9c0f02e0a63ba8cc86af22b13acf8f5e70735b9a7b971dd9791de9c95982062792d0f7b4794389ed0ae3db1d11654' +
    '3db8e848ea70ff3984481c0b75cc2c7f2661b6642e4629e1419c68fdb4a9530003ea83832e9cdb604d6636172593798d59ce' +
    'b63c13c4d1a174e53d9aa2f64a5ddb650d3d19fa913bd49a18769f5ba0ef31a4bc10c8b1772d6142413c138db85efa6d2be7' +
    'c869e365328ed4000b458a27aca8a3d5d5da9bf9291651e5beeed5207fdf604971920d52a88bc8e6876e0aac484c73b262ce' +
    'c2a43b0c7daba591033d5273a28f5a133d882da7d8e66e7a9301dcefd8d4aa4811fd9a8f5f5d86c4144f5adde0b9e99ee41a' +
    '1d143ebe722771f8a8d0ea6c67ff0c64a59de6a3c46de6a709b781c9f0f61d461abf49db89b1d623ad36af4c3e443f5cecd3' +
    'b4eff462422d3571a7dcb56c0faf186de032e25f88341a94994c9212d75c2d0b6feb94d00eaacea264dbb7093024b972b84d' +
    '0515ebda58cd691a09a1ec0f4329d03053f7d413efd7de7defadc4ae0b6a3dfab3ffadfaf9212275b99b94fd7098120f80f3' +
    '8c59ccd10217a15aff40cca04732dd8f940a6a67e5210b303d12806bf5bf5ecdda1a1dc72c0dc7e2576fa072cfcb2d9cc124' +
    'a582c3f7bf143e333fa7d9ed3f9b72995468b55ea75bec7c536ac098f8586049f17298abde30a5bc819d1050c7cc54f597c3' +
    '7f0bdc2cc7ae2ea6f56c4c14516f67b54b26218a56eed0f5fb9c965fbb855703ba1b7a0c782f3cc609a84dd42bfe4d2dc3d1' +
    '6686e6303b6c29e508a3e83d04d5a8d724f54197a0fde34eeb04fa1f090d6f6b02ed6e27a11c4882da4a637579ef758ef3a7' +
    'daff95fff8c97f363d6cb58a64140726a01288d59da5ba18c0cae40f5c6abdbb32aaf38585b1ea4b18e1dabcc6b157e89806' +
    '7499f7fc25f5723f8ff267aa24f694f948900e092d7db035b34ef320ae0f2d328cf20a30f3f084f48345b868c14f55a4b246' +
    '293707ccbd2a8203bacd1da922627b97579a7b956b4ffe8d2f85a0f6e3461f7198901738776ceb8511c4593d69a38e4330fa' +
    '6c9c9f41a9d4ebef33bbdc59d5e4c85f58f807365465981047bde97f67f31a5ffe8337c52f24ade77191173e24b2335dd9ee' +
    '101b0a4abd640c8ea92898f9c31205438fa15c9ca4d090ebc179e6da0e967747c60692a52852c2dcf50d9dc97b50466260e4' +
    'd6d0da23aaf259a4c8218d5a89eebb4070bcfdaaa757eb7549bda2d4554c558a0d875e35a06f110581c35706a844aab1b294' +
    'db97fceded94431f2a92e950f81150e601bdc5a4f99966f9cce005bdb350046a916034128a441a7eb3b61cb1ac3652ef7954' +
    '49900da3f88b36dce838feeab4eaf8e144515a96cc3ad373bd5fa70093dc1bf2ecde5cdbfb06951bf2fed746243f94321247' +
    '6c2ad3aec29c282673eb4e9b6306f49526b46fbfd712f3d2dee950bae4f59406dfb33078a349de7f34fb9dc06a3b50a078a0' +
    '42091e6e2740b57c202dfb401d59d9a3974d79952aa9425cf4cdecbb55b62ce46d0ac120e20df22fdced021ebdd3d00fa9d9' +
    '6df9473f921b98ff9a062f51961bac4d612c4f56aa1d7c5f3a13cf7e2c3949791d362b538a8754c84fd6f77ad44a639ef9e1' +
    'e695368f2de676d795fadac700c2f31a73a5dc3786cbfec22a190cde29a078cd97aa287c5a372400ba5a4eb4d38553fab418' +
    'd5c34898203ee3c82dc95afb41a112304aab21b0f0d81dda803c07f8c91763a36cfc3b256d38018de00a8c08d2113e7668c5' +
    '39f8ba7f00138ba357fea001d16ec7b3718baa6ccc348a0bd9946b5f918185b870d537818ec2c31e5751a055e210dce0d6dd' +
    'd4c7e06926f6091319aea6b869abe1e8862f2e4c52f73fc14461069fd5b0664b2de32719e1e9aba0ea5cac51142e2556ed6c' +
    '26fe1387c10cc635487326ced164d2b161de124d7c16b1c66a6d84e85634e9211386eb96d7856d05efc9508d1708beb8d897' +
    '884236aa854bd08d0ae7044b4d543925683ce611854a30d81c9bab2d55786200348ed9becb75c65b44cf1a76d21568d7f6a6' +
    '3ea9afc2593471975b814d001645d34233bab4a826adcba962108631255b7a419d2fe0507a43b1af302b27fe291d6f217999' +
    '9bfad36a05c25990a60bfe78b740b886b982efc111105230bbff07b95f7c2cedbe67dc2b4f42cf0a7b8f392060c3d6a3c765' +
    'f0ba1b81ab4ef4b2497b385a512ddfe8a5535d08c642aa8f56d92526a2a7bc227e391e9d67174b8105ea9549f6d8a044bb1c' +
    '6c5cce7106aa902ae1048c8c22cc83f61f03ddb7fe9ef831b4129c606edb133da3aa8f37a3792e5a5a5ae3b4f3ea3491488e' +
    'bec5471a1703d4dfc9bb204cf1ead1eb582487d10597cc33725c5ee5daa1c17ea5648e76143d61e2a072282db63a16ba2020' +
    'e4d0b57ef9aa640ec39b09573a40b058acff3a12d503a8835efc475cc78d16d7840c71dd1678123942ff6affc675f6e05449' +
    '0208eb38005a26db96fbb224c508d28fba53af67c64c3f93ccf4d27f9b4598f6996299f229f2c354f29ea9648e64a5d3581a' +
    'ea23c624e15b46d7759fd25bee3ec3f9a90ce41c341e5cc59241e21333b62a0839d95e572672c22f36f6531e3b9fb1247372' +
    'd3c73067de2f8c49563e389adf643168ac7ee81f9efb4757f217d3604fad6cade7c38868876b34cfe9377a976604a71c3a29' +
    'bbb3a75f94eae56ad12dd307f73a7852b31340a6625f98b11827f2c56919b5ac94e079e17d64b6b8aece6b00ecf94ec464e9' +
    '253e524f5f711cc0f5de7e9a0db4438f7c522ec1a7e26ed19982fba973ef441581b6196d7d18aa8dcb4e1b8e0e9682caf6d4' +
    '26056fb296d983a14564ba8a822d198e1700897f3c5a294f5ba2602204be4906806b31fd38e8ff88eccda4d7cd2ee5020b40' +
    '3c912c3ace9511acd195f4e4675eefc4183b13f70d706510b0ff68a0c5844f18c78440f498a90a13fd9dcc720a65181d85cf' +
    'e94055b718247a8d6c43ecc76dc66d07e82a199a183441cc7f35b33b9cd79505b8c652bf09260083b4ee50db8297d6164896' +
    'd3408d39013eec7291053a83cd6a93ed85a5edbadac7697b118328326f5ac000fe8133764124995172a8e6718534e3c93959' +
    '4824e5613be5ed3665ed456300307cbed63d4e398484141a0ec3e0d0502e646691ed958f192bcebedd8254a93e83ef2620fe' +
    '5310ced66078d288caff66f94d20dc980b60e98db3705f14ed719c27382fefc2070d9f21962d85fae3bd8c2a40a38d0cf3a1' +
    '25e7facfc26e573be09a928f37f467c2005fb111e808acd23c5bdd9b80a1df67aa87d9c995871b63e5568c3c854e006405a0' +
    '953bd7e12c6a23c52da518b9602bcb55a5e6631e27cf157e843df458b7bddb491f4514dd8d0c7f6ab20481952a1a8bf9a09f' +
    '660f5a7c6b40c5d97e70652cbbc7d4';

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
    return new TextEncoder().encode(str);
  }

  function decodeUtf8(bytes) {
    return new TextDecoder().decode(bytes);
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

  const HP_I18N = tryDecryptPayload(kParam);
  if (!HP_I18N) {
    window.location.replace('index.html');
    return;
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
  let riddleBusGain = null;
  let chamberNoiseBuffer = null;
  let isChamberBgmPlaying = false;
  let userExplicitlyMutedBgm = false;
  let chamberMusicMode = 'hedwig'; // 'hedwig' | 'riddle'
  let isRiddleModalOpen = false;
  let chamberSchedulerTimer = null;
  let chamberWatchdogTimer = null;
  let chamberWakeRetryTimers = [];
  let chamberNextBarTime = 0;
  let chamberBarIndex = 0;
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
    if (!chamberAudioCtx || !hedwigBusGain || !riddleBusGain) return;
    const now = chamberAudioCtx.currentTime;
    const wantRiddle = chamberMusicMode === 'riddle';
    const targetHedwig = wantRiddle ? 0.0001 : 1.0;
    const targetRiddle = wantRiddle ? 1.0 : 0.0001;
    try {
      hedwigBusGain.gain.cancelScheduledValues(now);
      riddleBusGain.gain.cancelScheduledValues(now);
      if (immediate) {
        hedwigBusGain.gain.setValueAtTime(targetHedwig, now);
        riddleBusGain.gain.setValueAtTime(targetRiddle, now);
      } else if (typeof hedwigBusGain.gain.setTargetAtTime === 'function') {
        hedwigBusGain.gain.setTargetAtTime(targetHedwig, now, 0.07);
        riddleBusGain.gain.setTargetAtTime(targetRiddle, now, 0.07);
      } else {
        hedwigBusGain.gain.setValueAtTime(targetHedwig, now);
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
    riddleBusGain = chamberAudioCtx.createGain();
    syncModeBusGains(true);
    hedwigBusGain.connect(chamberFilterNode);
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
      pickSrc.start(startTime);
      pickSrc.stop(startTime + 0.028);
    }

    oscString.connect(stringFilter);
    oscWood.connect(woodGain);
    woodGain.connect(stringFilter);
    stringFilter.connect(env);
    env.connect(hedwigBusGain || chamberFilterNode);

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
      breathSrc.start(startTime);
      breathSrc.stop(startTime + durationSec + 0.07);
    }

    oscBore.connect(env);
    oscOct.connect(octGain);
    octGain.connect(env);
    env.connect(hedwigBusGain || chamberFilterNode);

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
      breathSrc.start(startTime);
      breathSrc.stop(startTime + durationSec + 0.1);
    }

    osc.connect(env);
    env.connect(targetBus);

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

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + tail + 0.04);
    osc2.stop(startTime + tail + 0.04);
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
      const now = chamberAudioCtx.currentTime;
      if (!chamberSchedulerTimer) {
        if (playIntroPickup && chamberBarIndex === 0) {
          const pickupStart = now + 0.08;
          scheduleGuzhengNote(493.88, pickupStart, CHAMBER_BEAT_SEC * 0.98, true, false);
          scheduleJadeFanYin(493.88, pickupStart, CHAMBER_BEAT_SEC * 0.85);
          chamberNextBarTime = pickupStart + CHAMBER_BEAT_SEC;
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
    isChamberBgmPlaying = true;
    syncChamberBgmUi();
    const shouldPlayHedwigPickup = chamberMusicMode === 'hedwig';
    if (chamberWasStandby || chamberNeedsRebuild || (chamberAudioCtx && chamberAudioCtx.state !== 'running')) {
      rebuildAndWakeChamberOnGesture(shouldPlayHedwigPickup);
    } else {
      const ctxAudio = ensureChamberAudio();
      if (!ctxAudio) return;
      primeChamberSilentUnlock(ctxAudio);
      wakeChamberBgm(shouldPlayHedwigPickup);
    }
  }

  function enterRiddleSuspenseMusic() {
    isRiddleModalOpen = true;
    chamberMusicMode = 'riddle';
    riddleBarIndex = 0;

    // Respect explicit user mute if they turned 琴簫 off intentionally
    if (userExplicitlyMutedBgm) {
      syncModeBusGains(true);
      return;
    }

    const ctxAudio = ensureChamberAudio();
    if (!ctxAudio) return;
    syncModeBusGains(false);

    if (!isChamberBgmPlaying) {
      isChamberBgmPlaying = true;
      syncChamberBgmUi();
    }

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
    chamberMusicMode = 'hedwig';
    syncModeBusGains(false);

    if (isChamberBgmPlaying) {
      if (chamberAudioCtx && chamberAudioCtx.state === 'running') {
        const now = chamberAudioCtx.currentTime;
        if (chamberBarIndex === 0) {
          scheduleGuzhengNote(493.88, now + 0.12, CHAMBER_BEAT_SEC * 0.98, true, false);
          scheduleJadeFanYin(493.88, now + 0.12, CHAMBER_BEAT_SEC * 0.85);
          chamberNextBarTime = now + 0.12 + CHAMBER_BEAT_SEC;
        } else {
          chamberNextBarTime = now + 0.16;
        }
        scheduleChamberBars();
      } else {
        wakeChamberBgm(chamberBarIndex === 0);
      }
    }
  }

  if (btnHpBgm) {
    btnHpBgm.addEventListener('click', toggleChamberBgm);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isChamberBgmPlaying) suspendChamberBgmForStandby();
    } else if (isChamberBgmPlaying) {
      scheduleStaggeredChamberWake();
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
    syncRiddleLumosVisibility();
    if (elRiddleModal) {
      elRiddleModal.classList.remove('hidden');
    }
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
    if (elRiddleModalCipher) elRiddleModalCipher.textContent = dict.riddleCipher;
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
        setTimeout(openRiddleModal, 360);
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

  function renderMagicScene(nowTs = performance.now()) {
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

    requestAnimationFrame(renderMagicScene);
  }

  requestAnimationFrame(renderMagicScene);
})();
