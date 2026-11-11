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
  const MAC_HEX = 'aaecc93aa5a281ae0952492fffbf3227dacba3f996b31730f486861b9d6cb7c5';
  const CIPHER_HEX =
    '4864832dfaea51e4f770cfe1d9a235a5eefe7fd67d5706e24ba40078e0259cbddf4f86935635cc486937f197af375cc8e4' +
    'af330f786322a98377df892d817f2d6325b60be2f831d3e9fdc3a7ba00105021c19dfdbce1d5c537752eaf58c29dab9bb0' +
    '8bb6a0dda6154c3d25f42fa7a8cd3c8ec425f79beb56ffc21765a61219411f6200e75d943a72503f711988b204e948a761' +
    'bc1d21249c617cf9cfae43efeebc58a514323fcbadf7e228a73ccaa8a19dad519142694ae5eb6142df2d2fbbf2edbcb09c' +
    '4324cabeb4a3499efea5fe910ad0b5277d69e01f52d2d83a42ca7bd37f4394f23e62255991250057dd3a968371c09f9066' +
    '87b6d07ed86cea7f055643d3159f010764791c11d30efbc413690c9a3aa1586c1eac9029fd6459232c9834f1641b1267a6' +
    '9208533ea65ee9bd3d28b3441f153570942f0d8ad46cfcd68081ad2221606b2701f6016c0bf0f116c4554b1183004f8593' +
    'b6febba69726eba3572ec8026b4e2efb7af9bc6c26f84b658729e2a27886f3d31f1f818b791d99c9e0dda869aff89d519c' +
    '526ea73ddf5778d2fad5bc88a525729f63d268f1d698a6d48221539c6d977c22bfdc02b4ff51f011d9be1ab5459b30c583' +
    'fe955bdf0425388aeec494f05eafc6b47a625cf0b407826d0f233b992c07eb41d7417eb5d8a57f91b7b089501c2f1a950f' +
    '6225396454c24fd703f2bf62a7266ccdae7ba03f96f06eec44c47527a67d4fa91e82dc3957c82fe81dc7c3d4d3f64ccd6b' +
    '5a346f02da2ea7928140deedc7d481c5dfe5fc2dbaf8e7f009ba587aec2e9087e6d5e903465ee403ef0f49081061f09099' +
    '4a7d0690107b61d3e800e5c3d508166490dc36baf7bcc9c3f93fee65680edfd27aabf83b786521048931f8c0e9ce510ff6' +
    'ccd489b99fbbef8cc18a608cdf5f680b65ba0b1773f7e7558c4868df8f0934eae99f52060336dbe0ff6c94f8ac799d2c90' +
    '056e7aa7fd5afc3c08824f4e7a924b5eb533193df2305d8c78862fccba694e553b6e41c2f0d0912a9d26ac305a1c864721' +
    'bcbdf1eef6656fa36d6dfa7e3e2fe1847a0c62a78135e1b7a9d561ea3db1553ff1b73cafc17a8d4d3bb881043a4cb77c27' +
    '92146214f31289c73956a5992c403597c6c47e8b8930229672af79b022ca2b8c6a7f3a9643a35532187d02606a5e079218' +
    '99904c22f5245b2c1917bc8aad03eb2c4f47e1c280c59ebd157ca6ee4d6d389c07e13a4232547ec4d5132213ed56c3039e' +
    '67eab5c2f3e294ffaf170a7fc7ece20422e26eaf090588cbd1e1f7c6800b1137efbf2e53733fa0bcb42bc0f58985997f68' +
    '8a6845801006058a128e73f3e2eec4f9bd2e4e61f2b0ef1b5c9a3c2d24f06c35e532c08512dc0700018f243f44d33837b0' +
    '8219dbcb9518730ffa55038b82910f605c8ed6bf0f9eca638f8552ee7c5d3f2026a35bd8a2ec4d320987b212ab0eb09c2d' +
    '5dbef737915cf50f6e0d60acb1aaf279c8f2a7e12ef3b40a3a25be1233da145b06aa3ca0bfce8c9c15bedfe485e5274d98' +
    '5ca237a90c7414e48ef53bfc678419789ad47db6d8ac91102ca2cf72458e3b9f2e218fe42745d557aed77ebdaf0e3709f6' +
    '517b5e1041c19dadb772fa7a5166ca39594cb12d9afef9bca5c5ba47563a42092ab4e3008aafd15e1be106a5c71254cef4' +
    '8c4d826ce355cf3f552822c1e8d712f9410f0f45f003f7c78518bd42db992c28b59abe58ccb41b31c88e2b61f9d18ec2f0' +
    '5cf451d5ef67373dfd3a5c77cfc10ab38589e4919571bf292c6b5363ed35015f82c30316bc3f5d8891f5a88c3bef604912' +
    '9eb9e3b13b0c05668a87195359c4efc919699155c995b444fd0c3c43361fb185923ce86d0f990dfb834fa29663fbaebec1' +
    '5b6d0f9d9662f5abe4caf033f613ededd6f80c8f59d74152e3b709c613a6f2a460a21316ac5d8e15488453ea374b273f10' +
    '789f625b8d91133abb22ee3e6584e0fd550d5919908d35a2dd8de01367867a75ad97eb958e6aeba481fd0fe72750b8cf81' +
    '4bfb026451d29beb9842a71464b21fa1b1efc009f6f88ebf88817b55b8ffab45a7e141c7968b6c1d27227f01895d58b674' +
    '366a5f943747098f62fe7c51e89d83505c308495e20f1d186bdf92851910fdf230c6dcf2f7baf18f5a48c3640c20fd4547' +
    '60912c24c82835bab9683b67f0038b114eb583deb00441c9fe712764caac130dbc3ea6abba2f721255fa521f53a3eab077' +
    'da3433e5234e69cff6e980c8201f38597bba70b9ca8326197ddce37cec785678cfb8047efc92142807c5e5a4ec6ec6eaa1' +
    '4be49ed55f6f4aba4b6014bdf99fb3702ba3ce89dedc1f732f69c0c0475c5d7adfff93f4f563ecb4acfb15747e91cffb60' +
    'd452674b798b8f1db75d9d3e01fb85ab7ce873f3d9e7d3b515cd47e6b9c8c2e1c44b445458c469e37d66116ee56a924e77' +
    'df3cf89ce76d96b39dab5c25beb6a294b1837b8a524979f96879767dd9bd1be7dbdd3ed7ce905e76af27f722bd19a0e8ef' +
    '1f862d598a27b9eaf0206a4eab8b153d51f355908afce89976aaadfd11b2a1ea2c611bab70ea123dadb1f2baa65881b99d' +
    'b66c147f1123d1e6753ec921f46be86cf37568ac740ef5d784b08e315f8cc380e5187c9c7471b216fc1378fcea6f856d41' +
    '77e730e3dbabeef01e44d8044a58b1a077f51b7ecf711fdb33eb22037eade3657b90e41ebb22b147da425bcae37ca15801' +
    'ab11265900fc04a46c8c7c0421bcd385c659b854276820c076fa5c196fd12e7704344982642c7d4b5962e7336f4258a5c6' +
    'deae38235d92b88fd4f60d1176f7437be338ab5aa40987fe581a15eb7531bc9ed8f98e655651a5c91eabec5e8f58885cc1' +
    '7a6c0733866dad2cd917a521cb173832ad7f543f5a4a0175ef477213fec5d9930d2a76f0690e82dc590cc848cd6f191b42' +
    'ccf2189e50d85e7bcd69ff55e95967b65f54e553d81ea9ec54002db6027225f2335efbc449d70479d1086f49b81c3a27c1' +
    'efd80d237596bf416b7826db3e31a8826cb1187e57c84d3ab789757782a1e16d7a5154f78d44e39fd823edad03e1472c6c' +
    'd264675a96098832265f5e9d808e408c652ba37cbef7385d57d0457ae0a0ba5bd607e04dc65eefa316d9c6f8b6117b6671' +
    'a7af351edbfcec2576f50618a12ee5976d8732eba03ae428a56ab69f86b84f6a56ce75bfda4cd51fa716591762df94bdf6' +
    '487cd535f2e3e8e6fa77c3430c06d63e362d14045e6aa0b4ec11cdf91f40a5a79668109268badc53d9f3667bf836bef40e' +
    'ac76a9b527ec97098df65db4e1b7585cb2b8715e5176fcc28e2ecf39f91747f18d3a9283c3716a79aecb6d93303b7a8b6a' +
    '195b2c216c264b29555a0b2b58f948c40e8cde985a8b19153f2432be3abc869e82eee2c9438789851482be8923097ecf06' +
    'b2449cd5e122fb9bd034233d2e90f7fc42a8470e6735bf9554ee86880c1aa0744ec329d52d23831db5d61bcccd9304e227' +
    'f8e8d2425d5530c0ccca4deb7f50191a66219b3efff26fe372c00d19f78d2124a7584e1c4647b8c3599034e681613e20d9' +
    '5a9fc0584d7670120e65a2cf96ac5d1b1b8221d52ef4e0f3a9bf4d1b49d5a335ae98242170eeee31bde1838bc14f7d0439' +
    'e71bea4849148246fba8bf3dec47c292d28179a910853ab0a9b5e1fd110c2dbb81f3c4fee2a8f875913b15a146086243d3' +
    '9d6d4e1505c13cd42b730051fd068f20937995cb27dac6b0a01ea7d8855a5d1a7ae18f7ecc2a239128bda8366cf2aeba9a' +
    'daf6ca9ddd696fd4403b1cfeae588932a50dd625e1e435fcce7e49fc3d951f2bcf3ac31232d2f0e165c9abd1dc36ad8d0a' +
    '8d37d7e55bb3a001964c88533e4c3f3710d7817e5f681ef44d5932f977eacc10afa476d1cd0759754feaa05271c8908fb6' +
    '1eca88b7f858f3d58096fbfcd69f639bbd6b6b9febb4b11484094cd2896fbb3f4c0e76df412b4bd4afdb44d8fd31fe739b' +
    '526c0946e831b27f87939ce3fc3bba37a1534f3c21a4338e008c2015bfcfe28b489769b1e6fbf70f41a45e9c35913be4f5' +
    '89fc9b553570a358a7cc693adfd2cdffe79be2cebe87e897f1299643b9d25de0f4879e36e79945104a2f9d1d72f652b5cc' +
    'ae4839c2fbaadeed9b23be7ec9286cf8a03180778d1435353a40259f4618b346d755a64e018b5f25433c9e4ae770231306' +
    'c31b8bddce3642c3300a892a3b1355fc2ab2dd39caf5b2e792b00e2bc5199fe3881150cb1db9d2f1601f5856b034bab454' +
    '42302f37163d6b29d4a92caa7356a2291e267a2b6879e16b12080692bb685dcb25aa1fd9df7087383607a928bd6483ec02' +
    '7d06b61c65bbb232dc47341a9471e2e2f99550830c9e8d07115543cec84aaafe01b8c24220ffa041121d29f0c0cb9d709a' +
    '7353c6f5bf3d7c2053832ac2f19830fd895c2adf568dc5d5529fbbfde1cd9f210b9a1a7ba4ed226fd514bee525ac7f94e8' +
    'bc7b05a26aa76d1da65d680b3c9ce8dacc2bb632a2e8d189ffe6a50ee99df2b2d49d2ee436aa1382f1bec603129c93927a' +
    '5d8750af83b458fdc894ac88b0a790ad7d4901bd25616bcfa5dd291589c87d7f1c9575f5712b8c30db44e1c7b2dd6a4688' +
    '35ea3f35927ec5a1ad570f6415f1d94a66b8c096782ec48b9960db51b239ac9d4bf40c87c60976e7010d1e656a9b345936' +
    'b4a6f55a4439e4d65e8b5163bdb94ab62bb65470293ccebfdc3fb733ae94a8f14e52b7565a26e9ef6485bfcf33503699b0' +
    'fceaf94a1877eabd022d64559011947437b179d5f78b8a1f6e3b78c9902f85935198fe8b2c199220cb4a21f9d60ee7f88a' +
    'b4f145e287493e3be2f01ba4e1c6600ef933c75ff1ff68e378266f6797395b471904e671d59c896a2b547ccf52ba7d106c' +
    '61358d3d052a144acf94b3032f91889c2f48cc863cc55f4179e6d5bd37d3cbd01e45c2ff220f800e69b6d14bd5f50839a5' +
    'c4692a65dddc13b8c322739c35eeffa01c3727a8052a54b84d8cf222af6ca586c5e6fd6d1ca2e4b407bdf80358455f654d' +
    '3571cd1671960569ad3295fca7f2ff023927538a6337aa5526f7c390bcd9aaa195d834d8488f741e2b4704383b5d5dae21' +
    '3497517f9abc2a4b15f60d9dc166dd156a8566511935847a357f41471733c95d236b6625e22ce947f0c2e1c37e17b62e4f' +
    '2f814faba9eeeacffc8a89adac7075e028f8eef964722ec5bae42d0ab69e241626272cbe637dd1de7fbbce7645134ea759' +
    '7f75560cfa800d6af49587f46559ef3a4801249a3b443061fd6813f485fb6f7fcba17f663306d4eb6327d1b4a8049894ca' +
    '766a577d6ff39e7e2a18e531515c66b1f484758f02318eb667dc646a5d9dbf2f523449508e57127095dc522e96ab08e639' +
    'b46291125d9436fd78fe5109dc0d325101d10f3f26c27b0bb81f97be774552047359f828337dbfbe1d5292c7387df40ff7' +
    'd5ee37515c01c2632d1f2bb4986d0ba0d74fb17480e760e6a83dc38daed46150b0ee8918b7a1e2c601ce102704d25786e8' +
    'aafbf35ce4ce83c8843408dfac0e3ae3be5babc27060c98a881406a8d40c1aa100dd7977cb4d26ef7d835327ca949a4299' +
    '21ad8a2c8f0acaae4ab6e94075c5be6eae275013cd66eef86e1f838f7094f93f781c0f2333903d67ad3f2f65e90b8b3aa7' +
    '13baa76a3b03048a8865a0107345e4c3fcaecc7a2055fa519b794796af2568e40741664404fd4ae220b718aa9e898ad0ca' +
    '0421dc8faf6ebd15c3bfe8df407d0abfc17216910b64e52045bc441dd45c65f6ea0c297c8cf2f3e57c0928626c8256c248' +
    '868401919c80044bc03ff74b79e7900b159cd3e33f68f71487391c152cfcbf7d409cbcd361d22cd8cff579f829d9b99c6d' +
    '83039cd2d105bb026ea7b204515820996b4fe52241fe8793db4e659068d56706b6134818d79a01f277dfb2451f36c7037d' +
    '44e9aba9b624a5564049376a39b6c04a27c630615ced8c651aa06077ad5ed44efa2960b7c347cf258d1de59384b33b2c02' +
    'ded2d5f72b117f92baa36ace1d83f09ca2937ee5b8af8e3ac12bc683d4edf5cc2c3884b2ec83563d3864e14fc1069e496f' +
    '0f57034cb6ede15787aabd63db6adcb6cbe7e9785b67756ccea634864e29b1f68107029608ff0b1d704303594457a9f057' +
    '7769b09834dc32cac3d7554a13d5047cd6517940b5b2a73073b04b8cd77d39c82a602c50bcef428cbff2d1f29fbf9fcab6' +
    'a5591e2dd8b56743ba41d1e433a46837b7e99ffbcfdbdd4fabd9f6fe07d0dada6bffcbbdc55303063ca05ca3918a7f0b1a' +
    'ba0019bd904fb2c4f662842a01563070023d0824a065e2a0dfe7de3e3f359b0660eb4bf3381f934bbc5a1967a3cc34c34c' +
    '53c4b89f00ff8b22cbb11ca5e1f2375cb9c6b813d8a11a348e74b1ee1b59964e601316245b7f8cd1d6d3c8e7a6a9e2e786' +
    '85a069d491bdddff00fd7a92d705750cfcfc8303b229c7422f96711600c0e464e404b90c37cac47ae5aeca154359eb521a' +
    '7b60c489a7112c5b532a44e3afa291884153075d9ab40e446e815f0872beadf8e07c6b1c9d9ab40eee1f6bc6febb517307' +
    '8314f3a6382b9c719b7f53509a7c575e82fbd5c0eaca9d0a8954478df917f6470ed79c19c4120b156c5d17dae2b9ee85ec' +
    '223f5a110bdc5fb9798a27670041d9f0b144ced6db937edb6cfca61fe9003e5edabc32d0bb46d2e3be889ebd94353b7db9' +
    '4d4a7ffa3d9e0533110db10723aaebe1aa7eba8d9df2386e1a4255aa76934d5d8f32a0980f4b4e744aeedc622efcf9c91b' +
    '15030629b24cc34ebc79bc95fa2f1ea947778713353232db504fb490f37ca3ce5df8d5f02beee3896dcd2274aa1c572175' +
    '4eb6fa0a3990efeb39a1ddc2bf45c88804ef5a649e2f02c54ebf4d2664d0dbd7fbfc825f5a1eab9792bdd20d8547b2109b' +
    '7d146e92d39509c56d6cf3d11f385dc679b3cd03696d209f17fc44da9cc0051bca21b27fe10a7e92a3de1a2bd40f292f44' +
    '9a00e0cdf969d03467d0681d136cfc5b7ce9d7aec11bf9c50aaa4caed08288a01f1f67ce5016a5f21384d060dd3aa4158e' +
    'eae9dca2f58c31187c4b0c6f3d40d6716c0c9ee35f0d892d2287afdc28407ab0cf0c6d21bd971cf229c1c75da1a98d224e' +
    '8d7b19243c774eb53b28e29daa8e5f3228aaff0393b6811fb86d537aeeee3a19e9e889f463bb418b4dc4c88f4d20373b23' +
    '029c0f0ec5dcd30608499e9f59980f6c872ed876c881dbf6878606d0178690a4ceffd03a533ee9632f5a7fe10aa86fba1d' +
    '211ab9f0ab0a3b47ec412712bc6a2b1a795dcd89e3de7065e2ad62da28c63a8cbd2de03826b917276c0b06778a8dbcfb61' +
    'f4e55ffc653263417cf4f6aa837623485c05abfb337863c392885aba8f58cf260c3e6aaf608ac27c220aa3066f70063aa0' +
    'a496ee94160c231e19dfa3ffd39aa5d2183875e5d0efe3d94a0e77449d054ad0c5b314316edcef0882e6c7ec74ce88db7b' +
    'df8760c480316935fffb7f41947baff1527cfec98316af30a6fbd2ab24442000abb77ef58dcfa37daffffba42fc83291d5' +
    '2d1fc246dfc2d11187ebb3080f1821dffc2c49981cb6eeeb4c954a4a70f5cfc6f807153762b9f9e43af7af880f4726506e' +
    '945c9974692fe2608aa847c0fc47c05954a2744fb19d248be62e08b0fbd70b9795d42a9d5fe38fde36f9435dbb2653e392' +
    'ae43bf06c1414940783eab00c25b6f9b8553cd208b4ed943fe768f5bb02079ba54c5455965322fbda0dd1bdf1ff5041a92' +
    'bde370ff8833d4141d0b7488e134647a5745bcaa42f6ce8c5b5b33c6d4fd2afd85f5a1afa56c6021630750c813add523c6' +
    '94a8d1d5644cfc374dfe0f744ffda74b827ae2a7f09370cffbf9f1625e53f43cc5c534343f9bbd5f6de347efd347c1fb1a' +
    'caa86188e46df77f9d6b24cc43faffbcffc0c23a1fc676a04e68ea6b8676e9ac448e110f7988f20925744c09c164ffaaba' +
    '90b22e9b8066ebe561ea4bf254a804cf048a2fc2679ad3222634eecdb44e7a897340507524a4becb4bbe89d2d9df9300c8' +
    '2450a1c4b6573eda4507268de49470cecc99ab1732e5a6161f2ad8396e394e0e399bc0f4046e628813b5824b5236f5276c' +
    '7ad899064593939438ce59d49df42da3284a1009e742c38560e6a8c361197544d4067a38f36f066c32d354ad330a9e61e7' +
    '055d95e8d3fb4ff61d71010f9899bb2a64bc4ebd8e3174d5d97d254e86029a0a2c313e9886b8c9698b16d872e08f26ab1c' +
    'fd84fba54f3ea3696d39a496a7338ed6d055e8802d72bc7042883e256a64d12bc041dd20d2dc861e74a10c88e99ac5a516' +
    'b912abd38f337b430588f1c4556afe75a9bf3c5ef7aa67309d99db8a4abf8c02c6506bfc68fbbc1df21e4378fccb82af62' +
    '88c841f8823685a8005d22e376fd492f46ee6a02f268dee878c1f6a2ff90211a21912ae9cdacdfa2341fc355526961ede8' +
    'fb7df643e66d168b66c11cb3759ac718565577d4f751a211273cf161060dcf3444bf51f41ac6205ebedded70eb4450bce5' +
    '5eb7a96082e0024eef4ad28bbd27679a91cba6c6d349f9c57156d1e7795a6c792760402a0d825668a4dc8e235b9a5f6e81' +
    '44ee93da289dc08e9c92b94c15d4ebecd17c921d40acc23fb464fbccc5dd3de47a9fad76e14e699b5bb307a68e4ab6a7ad' +
    '9fbab464341f7eeba05067d42ebd06b9b33cbc5b709f39b6e9fbf715f75a236c78b371e56c480eaa0037fb957867d68c05' +
    '70d73d62623fdaaf88a34104f0a0697ea417f4c3bb996c2bda1e53650136abeb59dd4c5d1fe224720e49d1a9c00e6ed415' +
    'bf87e3935cb8e8b33488051087a6f200c283daa7876f79f2342447e79e6067439b1ba89ea465a0472b80362dbac2fdebab' +
    'e75cee8a31906f5651314063552242befa21c12086da88cc468111cfa6e28aca4cbeb0ea968a7fd4099bfcb7bee567adde' +
    '1b0261d1a3e3e0ee8d5618092ae30562dcb9e5b4bb85a5384114f8d28119f63bf72add860f546385db4f81df774af3740a' +
    '66fa8196145a3d83a4cb0c281ce496f18dddda253b923c010ee6134e86ad36bfaae8bf29b1e8e48b503bab6f36a680d9a5' +
    '6f77a387977de4bbdb80a2f3fb233b306f72221cc887335edb64cefa16a8f5679ccf3e36a66382743db8ad2db11425a4d1' +
    '8caa2a79b4935c95330a9f713d044d76763f23dfb7b20c819eefc3f1898790a571a28ad8c72b80bd3948115a2e8b18f228' +
    '5e9e098d7b6af8ba138311c08df096ca8a0c5b4ebbec5b7c3237e63a8d7e0173db709c33c741a08fd25720aff11cd84416' +
    '956256aee54940379fa3f2d6d36333cf2d3894b9f678cf9f37a064a8cb66dc78a11aacea511c4c804e934edeb263aa658c' +
    'baba9623b48df2f4be7364d2d2e3a0b0762a080f1404a5426cce8767616c830b434d507abfb667840fd75f34efb86d76b3' +
    '968a2b6694e4d9fb922db26bc3cab31a4beac88b0a106eff65f31206b2529b9166122cba4a86b233e607e07ec55d59c82f' +
    '09dd02d0fea99f16caf03ebb21946171e21e85203173f6032cc0916e6f640782d642680869fb79f777e8085d2f79921180' +
    '192af233f2f0331a367cf0701e0286d552fc1f0c2a128293af1a5198539fe78b733dcaece4c0472d56554de04a20b6a18a' +
    'b2f4b3fa5274f030692273d8c85ff2f54abab2b518c9d4d81c68face7d92540ed3b4d09fd34d0c764ac7e662a976509c34' +
    'b0b9fcc99dc5d0583e6197b46481370ec4c07556ae9067b117392121bd27ad49061743862c52362c48940b2229267bce5a' +
    '200268fe386d449700584e7a5aa117ba5b930f3eef1090103330c55470f4d662999f48c8cf066fb65151661c05333296ab' +
    '5c8ee1d53858b4d4354eefea057b64938b140b8d67d6703c72c874a24b5bb2b1cff89477a5fcc597f9b469dc25ded480a2' +
    '0294840d17a9b92ffe1c0e4e5565d4ee3eaa71025dc446928e82e0138d47d306a491d0506979ec1c2af8471dba3f2fc2b2' +
    '42f5ca0abd08cc416eb2c88e30cc6c43bab080e1b388cad5836015318f44597340dd2f46e2a1134360cb983448ae457fc8' +
    '1c7ecd7c980cfc4d7822fcb7c07a84740ca764494e53eb01878dc7887339fccf04bc7c7e5ead509b75250d622afdedf272' +
    '704698226da21282d746271fb4e1422f18f3e7efae37551eee2a9d13874f93a032ad59b2c3ba5437fdffbf8d3b375f8186' +
    '8e88fbb8286a94e4552d7ce61e092b39f527e51d3473971d100dfd76fdeb997e8292bb9e364b974f4168832cc0d16790e6' +
    'aaf0f2e5bdf04485f2ab41926a8ea564d1f7950708f3cf778daf70932820414d51a83f814c2234d85eea51c3d20d20f54f' +
    '64084b02cd8db7eaa44f1289edccd28e5da6518e13d115349f2af72777e03f6d03c9c9149cae0445adb4bfa16a1c1aa130' +
    '1c40a9bcfab84a10db69d43562c784f473dffd14a80b2abbe0dbbbae547fed258da36659396e3524a6c07dfe006e8c0e05' +
    '5d7e69b69cd6df6528c91b6508f52482767855c1286a69ca826e03632f147a15386a6c36ada12913b699facf45d2405e9d' +
    '076ac74ba7b15bdf8365e52cba0dbfabf463548493cc59c6bd04ee0f5b0c62a0da67f68153da62baaa7e79d2700d3428c7' +
    '0cc4c5c444675ba497fbedff8c547e6b6bbd2741bd286acb8954618150eba2aab66d504f9b23b038e9f7d0547a2ba7a3a8' +
    '6012083cda890d5559de0ff5e5856faabefa0d1b0f41aab3bed245161bed3868385ad856a116eece2f007bb7bde51c85c8' +
    '3112d708388ffc8cd5cae717457d32f62284df89fbc1cbc0ac9dd00f83f22aa3fa08bbbb3c28bad846c508a7228dfba808' +
    '02dea32ee840166b7955b0b64e201c2f74a855d3144af4ba040e40d9346975593b38df6889e3223e845c16e65aebc75f5b' +
    '02c595911d2ae5006fc1d81292ba16ccdfc5419864498b951cc2f4da71ea35fe562e515bd89edb17b79a7a497f712f2841' +
    'a96482dd5cc777ed1663b0fb7cf7bfd57092d64320cbb1ebdb58988eefc1bbc71696319401cd7a8e8b31dfe4f12a7980b7' +
    '0a1e3165171ce3263c6e20a3fe088c031778b9e91fd1983d65343c2fe142721f95937c63a931e0d54791372f3aa440344e' +
    '7e331a5528716dd0e147d5caf12de1cf8d77b95f22cb3123f0b7197244bd353515ac113d0d41e1a62a22aefe659933bc0d' +
    '84a3f11fe9ba2c1672b00bb40110e0592ea4b671820e8a16074202b4597dc0a620173b1ee17eb8a84d79344a72979dbfc8' +
    '59b220bc68324dc62b069f83bd43b2847694b707ffc0de23d13d10a6d0acd60a2af6bfe96bbdb0b6e9bcf4911048300d22' +
    '0969b718b9bc9f751646446511d0aa68c650d149b36e263721f1085e0961914e0975159500bf4d93968076515fad83ca3e' +
    '90d225696e310823de27ca3ac4a13f12da92b97ee52099e1e74b4e9e100c3b0ebb8a3fc2d7296a861ef748e2e08116cab1' +
    '4724675442211485f79c3e957aa0c806e87f228fca1c6c10cd37b7a3b09b8ab3d7d8152a369ed0e2ff205db7546a5ea826' +
    '3e82cd2a38c94e37801c77599f0bbef7cd07363c9d94ae2173661695b570327aad18c9eed54d2bcc448dbdc8dfbb5654c4' +
    '9a955702841cb4f15adae7bae3d7f31e1d4634f8303639e4edf1a47e6cf11469a4cf92bfcc6bb400cab7b6c8e5be2a5159' +
    'b250cb84bbd6238b36a548706d665bf0dfb5b6b5260362257db187f8ebc65c4c55fa63ac5fde1511dad44c8016d30f2659' +
    '69e0c7d60efed8aa7ed6b4026f24be3ea25a0f02ed9646ca7a5212bcf75a4561c66255e0c105b092cc33f2e2c5b44e273d' +
    'fabce5f86816d3416ea492d0ad6582141588b68048ccde060de848f94acb2aa2d49199901f716cf62107372103c578f5b1' +
    '56c0d00b53802104dae8572be76ac2c3339ccb20a89accfba34a6bb8d15dd9d3228d26ce4564b459e51cb8665329c69ae5' +
    '5c7c48bf369eb9db7ae98d9ad804598edc4bf18b877b42fc2bc5fb2defe0240e095a6f3db8066824c450abccf4f0d8df59' +
    'b9d60211b4163154302275c548bc47d221fe512ac3d46b87f82f2a292e72fa59ed360283b5d126f55e98abe1b00fa404bb' +
    '1747152a6b08ef6e23bd450f9dda5d6b3b3df57697eba3d1be8cf7f1c73c233929e69c661181cf5a1cdcd4d8a5b01ed1d1' +
    'ab03196faaa137e3f3a585b1b84859fbc0a988a64da4a4066cdcf4e134bd3d36c1e528b72bfcd0aa5a900514227afc38a9' +
    '11f323ef002f79c4ee0d2abdf1c0f88b4cbe3b925f58b9e55f20781d99bb2c8e4dbb821ba42f276a921cdf69db6009bfcc' +
    '6985bcf8e84f5b7298865826616ee788579e16347fa6840a33fc2b829554add4ebe03bad47f92efad00c0ff206274237d9' +
    '1c46fcef7e6cb4495ff3877a833925aae0258e1b7223bb6668c1fb015d0a5ef0365a39796298c6da1c03178fe2578bb692' +
    'd4e78066fbd814c26a5add05c6ae29599688ee0bdcd83357596367a7ceddcc23a3fb0b2320d8b856c0ee98416dbccbe2ae' +
    '1bde7551bfe654a7be1a860ad37f39ac34501296d8144fae46aaabae92dec2fdf0a2821a523c96f115fd1151f401bdd7af' +
    'eccc77ffcaa556bcb8550c38c6603412de4a0d3bbda454dbe27b04fb7f4240dc51222fd57ef5f371a1e8374a03b316130d' +
    'c39e659626e34cf454c68b4ea8ba8a509ea34f8158780c250a617e8a3e05036f29be252622466c57a760d47b54cc8827f0' +
    '03bfd257e45932111eafb0a6bd1fdde43765a51a863739becfd86c3d51b02abc04485b6d3d5ba0772621f0151e18cda395' +
    '143c9a3aec1641f5dceea155ba20f23d0dc165ee18fd7c9de15148a6d6d84bb6d05bfd5532851a9aacd404b9b96f1bfb00' +
    '207f5258b70f22057e57832843661e3954456f119c9d9403b791ab7aa2506389bdceefad3acb278e3381a1e4d8c715dfbc' +
    '2c75a0913c9099a4896a5e06cf6aa17cdeb7f32b715a78274ae5587f8eedbc70d1b425fcac60d61317d1f51ae37a9e1102' +
    'c2756ac24283c6ac49e5aa0d24d9a734268450dc1a56491721c6af088c19d80f372258c628f0fa2050822b566eb7a701dd' +
    '20c4f2578fe96ec634ed0cde996c56d4a3c9bf62c0059c8c99d95b037fb710f356fcedcd8f1604113e6ff4422e0ca391be' +
    '69c2f1ebc34e7c0f7cfa2aca4d104fdc85b177080fe7312ffbe3adb7a707ac085b7c1f5bd44f2ddf5db0ac79a9f7849455' +
    'daf746ff9a2873844d7f3281e74c56c0da3333c21834a4aff6b7e25d39d6fe55db556efda7d1969b4429cbd00df9c05ea0' +
    '0bd9bfad1d3f3b20e71ac21a05c402d8e269752d6d0b389d9cff9f7287485bd60f2dde5278ddebf23abd96c85f61fc35fc' +
    '8125727565f3120eb7928b268ce99f6064f35d37614b759d28cc67416a89ce2e0e01de6ab0bc6419cc9b8bc46407d77283' +
    'a03bb130f230e7c2bb231209553b5231bbf606a25e9ecbac997bd2640d07aa3c7a96332024d3cab1d328aefb4cf1e6029e' +
    'f1577e3e5f5e23b1a7e81e62459207ca9049d93821f1f3b8262a2c0dc23431518b09a9910beddbb70abc532b4dc0621aee' +
    'c966af1bc38524c69c9b041fccf8bfc5b6779c25b14a55db241a9083a9059e062e606e64c288dcc034a421a99bec653f3c' +
    '35a1ea8017f009c1b39dd14b2d81d115d0d1373d145ec3d7a0c14eb463847f513e6ea5bc6e699b217627b2286ea6918272' +
    'b7a06f198cc75006600ba106e4ede1b06577e29417da4c4982960bd5cb333a91533e73b4af0724eadb31baf648450354ae' +
    '0f061438d187b3e6309701c4c1a94dab24d0472393c5b7d2fb69b6a1be887999f22cfcd842be95b0609821a4c8190df135' +
    'db6ce14948d525b4d353a573c3daa40eef54712015cd9e03a5172ff2662236d0585a3c26d22d79b01a04738ef932234fcf' +
    'c37461cc66974f562638b5d26a3a63bb7aba03daf15b4cf217932dc148d1e2c0974a807e4d7cdda607719d6a73bb1b7f45' +
    'b1a4ac5fd46d45919d2dd006f73e605ab20856f47d1684bd4c2ef2d72012a6a792ac4ca07a7bb0babe876b8302013ad869' +
    'ff607b5a43426252dae5d73c8f1ea0068f28552cd0f3f064d199afe4a376e30b2bc0a514243426e38cd90cd96ff49bd6a9' +
    'edd031097fe6928bd0ec4f78ff8aca3f5cbe0108837168512a4449bd290f0bf75311866268b830e8ee92a3cbe49d4bcb16' +
    '023d5d68912026ce9616bb95b2aaa5775ffe8d14341cff41562d1fb2fb76a0c5845a0fd0811ea29bac141bb8dc9f600468' +
    '42589698d84855ac192d2f9d2047f4c63f92720bbc2c1f9c03754ed67e71e42287d18212eb805fbe5d260d94b4f345dd89' +
    'c7cd11078c9b4181384a7fb53251a98c88de27a2fc8e81faf6dec5203c2898392e2a5f8748b88a3a7c23329b646dbaf676' +
    '8c73b5816e6f5870e16d2cb4e17c6eee4c5602717283cb214b3286ca5e2f42f6eb9173326a679bed93c31f48febed28807' +
    '8a7285fe357fb03603c5cd7c7290db99ca69fd0c659dc72060fc8aba7f0a57c47083362360f6825142d5268260b4f5f2ee' +
    '9e1753b6930da2bb66c3bbced96e570ef0839f9a2dfa288a0063bd03ec06c4906b0398998fa3de4aba90b281db94562e96' +
    '1da6378855116f42ae8f3bf4ea36492ed85d0bcee04124c213bfaf2f6e23cf0273c67aa21ce5f0cc491a350fdd9a3c7a77' +
    'b909d78f2c18acf4af82232e47737e0cdec83f5f6d33fcc9dd2de660b11e372fd2dcefde2aab77828e1ef8415eede5fd26' +
    '0f3bb73be60f236a67c00112e7423c9690ec2316ddb19bb0b2efef5fd329917fb86fa7a43016f097ac8e7c44612ff31fa1' +
    'cf1dece75d5a61b9f6a269d005ec8fd6ccc58083a6f10d4e04f7117499f74ee990f850696f1fde53a2e4da05e3e69374ec' +
    '07f6e5f8aa4e22b112e96630ed2f6e5204592a';

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
  // Secret Chamber BGM — Celesta (鋼片琴) × Guqin/Harp Harmonics (古琴泛音)
  // 《星夜紅燭引 · Starlit Crimson Candlelight》 (Web Audio Synthesizer)
  // =========================================================================
  let chamberAudioCtx = null;
  let chamberMasterGain = null;
  let chamberFilterNode = null;
  let isChamberBgmPlaying = false;
  let chamberSchedulerTimer = null;
  let chamberNextBarTime = 0;
  let chamberBarIndex = 0;

  const CHAMBER_BEAT_SEC = 0.56;
  const CHAMBER_BARS = [
    // Part A: 星夜密室 (E Dorian — 神秘巫師星輝)
    {
      pluck: [164.81, 246.94, 369.99],
      chimes: [
        [0, 493.88, 1.35],
        [1, 659.25, 0.95],
        [1.5, 783.99, 0.95],
        [2, 739.99, 1.4],
      ],
    },
    {
      pluck: [146.83, 220.0, 369.99],
      chimes: [
        [0, 587.33, 1.55],
        [1.5, 493.88, 0.9],
        [2, 587.33, 1.35],
      ],
    },
    {
      pluck: [130.81, 196.0, 329.63],
      chimes: [
        [0, 659.25, 1.3],
        [1, 739.99, 0.95],
        [1.5, 783.99, 0.95],
        [2, 987.77, 1.45],
      ],
    },
    {
      pluck: [123.47, 185.0, 293.66],
      chimes: [
        [0, 880.0, 1.35],
        [1, 739.99, 1.2],
        [2, 659.25, 1.45],
      ],
    },
    {
      pluck: [164.81, 246.94, 392.0],
      chimes: [
        [0, 493.88, 1.3],
        [1, 659.25, 0.95],
        [1.5, 783.99, 0.95],
        [2, 880.0, 1.4],
      ],
    },
    {
      pluck: [110.0, 164.81, 277.18],
      chimes: [
        [0, 987.77, 1.35],
        [1, 880.0, 0.95],
        [1.5, 739.99, 0.95],
        [2, 659.25, 1.4],
      ],
    },
    {
      pluck: [130.81, 196.0, 293.66],
      chimes: [
        [0, 783.99, 1.35],
        [1, 739.99, 1.15],
        [2, 587.33, 1.4],
      ],
    },
    {
      pluck: [146.83, 220.0, 329.63],
      chimes: [
        [0, 659.25, 1.3],
        [1, 739.99, 1.2],
        [2, 880.0, 1.5],
      ],
    },
    // Part B: 洞房紅燭・江湖良緣 (G / D Major Pentatonic 宮商角徵羽 — 溫潤幸福)
    {
      pluck: [98.0, 146.83, 246.94, 293.66],
      chimes: [
        [0, 987.77, 1.4],
        [1, 880.0, 0.95],
        [1.5, 783.99, 0.95],
        [2, 587.33, 1.45],
      ],
    },
    {
      pluck: [164.81, 246.94, 392.0],
      chimes: [
        [0, 659.25, 1.35],
        [1, 783.99, 1.2],
        [2, 880.0, 1.45],
      ],
    },
    {
      pluck: [130.81, 196.0, 329.63],
      chimes: [
        [0, 783.99, 1.35],
        [1, 659.25, 0.95],
        [1.5, 587.33, 0.95],
        [2, 493.88, 1.45],
      ],
    },
    {
      pluck: [146.83, 220.0, 369.99],
      chimes: [
        [0, 587.33, 1.35],
        [1, 659.25, 1.2],
        [2, 739.99, 1.5],
      ],
    },
    {
      pluck: [123.47, 185.0, 293.66],
      chimes: [
        [0, 783.99, 1.3],
        [1, 880.0, 0.95],
        [1.5, 987.77, 0.95],
        [2, 1174.66, 1.5],
      ],
    },
    {
      pluck: [164.81, 246.94, 369.99],
      chimes: [
        [0, 987.77, 1.35],
        [1, 880.0, 0.95],
        [1.5, 783.99, 0.95],
        [2, 659.25, 1.45],
      ],
    },
    {
      pluck: [130.81, 196.0, 329.63],
      chimes: [
        [0, 783.99, 1.35],
        [1, 739.99, 1.2],
        [2, 659.25, 1.45],
      ],
    },
    {
      pluck: [123.47, 185.0, 329.63],
      chimes: [
        [0, 739.99, 1.5],
        [1.5, 659.25, 0.95],
        [2, 587.33, 1.5],
      ],
    },
  ];

  function ensureChamberAudio() {
    if (chamberAudioCtx) return chamberAudioCtx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    chamberAudioCtx = new AudioCtx();

    chamberMasterGain = chamberAudioCtx.createGain();
    chamberMasterGain.gain.setValueAtTime(0.0001, chamberAudioCtx.currentTime);

    chamberFilterNode = chamberAudioCtx.createBiquadFilter();
    chamberFilterNode.type = 'lowpass';
    chamberFilterNode.frequency.setValueAtTime(2400, chamberAudioCtx.currentTime);
    chamberFilterNode.Q.setValueAtTime(0.65, chamberAudioCtx.currentTime);

    // Gentle stone-hall & mountain-pavilion echo
    const delayNode = chamberAudioCtx.createDelay(1.0);
    delayNode.delayTime.setValueAtTime(0.36, chamberAudioCtx.currentTime);
    const feedbackGain = chamberAudioCtx.createGain();
    feedbackGain.gain.setValueAtTime(0.24, chamberAudioCtx.currentTime);
    const wetGain = chamberAudioCtx.createGain();
    wetGain.gain.setValueAtTime(0.28, chamberAudioCtx.currentTime);

    chamberFilterNode.connect(chamberMasterGain);
    chamberFilterNode.connect(delayNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(chamberMasterGain);
    chamberMasterGain.connect(chamberAudioCtx.destination);
    return chamberAudioCtx;
  }

  function scheduleSilkPluck(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const oscBody = chamberAudioCtx.createOscillator();
    const oscHarm = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const harmGain = chamberAudioCtx.createGain();

    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(freq, startTime);
    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(freq * 2, startTime);
    harmGain.gain.setValueAtTime(0.18, startTime);

    const peak = 0.052;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.022);
    env.gain.exponentialRampToValueAtTime(peak * 0.35, startTime + 0.32);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    oscBody.connect(env);
    oscHarm.connect(harmGain);
    harmGain.connect(env);
    env.connect(chamberFilterNode);

    oscBody.start(startTime);
    oscHarm.start(startTime);
    oscBody.stop(startTime + durationSec + 0.04);
    oscHarm.stop(startTime + durationSec + 0.04);
  }

  function scheduleCelestaChime(freq, startTime, durationSec) {
    if (!chamberAudioCtx || !chamberFilterNode) return;
    const oscFund = chamberAudioCtx.createOscillator();
    const oscFanYin = chamberAudioCtx.createOscillator();
    const oscBell = chamberAudioCtx.createOscillator();
    const env = chamberAudioCtx.createGain();
    const fanYinGain = chamberAudioCtx.createGain();
    const bellGain = chamberAudioCtx.createGain();

    oscFund.type = 'sine';
    oscFund.frequency.setValueAtTime(freq, startTime);
    oscFanYin.type = 'sine';
    oscFanYin.frequency.setValueAtTime(freq * 2, startTime);
    fanYinGain.gain.setValueAtTime(0.14, startTime);

    oscBell.type = 'sine';
    oscBell.frequency.setValueAtTime(freq * 4, startTime);
    bellGain.gain.setValueAtTime(0.045, startTime);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.24);

    const peak = 0.068;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.014);
    env.gain.exponentialRampToValueAtTime(peak * 0.42, startTime + 0.26);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    oscFund.connect(env);
    oscFanYin.connect(fanYinGain);
    fanYinGain.connect(env);
    oscBell.connect(bellGain);
    bellGain.connect(env);
    env.connect(chamberFilterNode);

    oscFund.start(startTime);
    oscFanYin.start(startTime);
    oscBell.start(startTime);
    oscFund.stop(startTime + durationSec + 0.04);
    oscFanYin.stop(startTime + durationSec + 0.04);
    oscBell.stop(startTime + durationSec + 0.04);
  }

  function scheduleChamberBars() {
    if (!isChamberBgmPlaying || !chamberAudioCtx) return;
    const barDuration = CHAMBER_BEAT_SEC * 3;
    while (chamberNextBarTime < chamberAudioCtx.currentTime + 0.9) {
      const bar = CHAMBER_BARS[chamberBarIndex % CHAMBER_BARS.length];
      const barStart = chamberNextBarTime;
      bar.pluck.forEach((freq, idx) => {
        scheduleSilkPluck(freq, barStart + idx * 0.14, barDuration * 1.15);
      });
      bar.chimes.forEach(([beatOffset, freq, durBeats]) => {
        scheduleCelestaChime(
          freq,
          barStart + beatOffset * CHAMBER_BEAT_SEC,
          durBeats * CHAMBER_BEAT_SEC
        );
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
        ? dict.bgmBtnPlaying || '琴音'
        : dict.bgmBtnIdle || '琴音';
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

  function pauseChamberBgm() {
    isChamberBgmPlaying = false;
    if (chamberSchedulerTimer) {
      clearInterval(chamberSchedulerTimer);
      chamberSchedulerTimer = null;
    }
    if (chamberAudioCtx && chamberMasterGain) {
      const now = chamberAudioCtx.currentTime;
      chamberMasterGain.gain.cancelScheduledValues(now);
      chamberMasterGain.gain.setValueAtTime(Math.max(0.0001, chamberMasterGain.gain.value), now);
      chamberMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    }
    syncChamberBgmUi();
  }

  function toggleChamberBgm() {
    if (isChamberBgmPlaying) {
      pauseChamberBgm();
      return;
    }
    const ctxAudio = ensureChamberAudio();
    if (!ctxAudio) return;
    if (ctxAudio.state === 'suspended') {
      ctxAudio.resume().catch(() => {});
    }
    isChamberBgmPlaying = true;
    const now = ctxAudio.currentTime;
    chamberMasterGain.gain.cancelScheduledValues(now);
    chamberMasterGain.gain.setValueAtTime(0.0001, now);
    chamberMasterGain.gain.linearRampToValueAtTime(0.78, now + 0.5);

    chamberNextBarTime = now + 0.08;
    scheduleChamberBars();
    if (chamberSchedulerTimer) clearInterval(chamberSchedulerTimer);
    chamberSchedulerTimer = setInterval(scheduleChamberBars, 260);
    syncChamberBgmUi();
  }

  if (btnHpBgm) {
    btnHpBgm.addEventListener('click', toggleChamberBgm);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isChamberBgmPlaying) {
      pauseChamberBgm();
    }
  });

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
