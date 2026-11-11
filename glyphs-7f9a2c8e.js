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
  const MAC_HEX = '48cda127d8279e05530b77c2fe83c9b297be5badb3d499ce32d0bc120b18823b';
  const CIPHER_HEX =
    '4864832dfaea51e4f770cfe1d9a235a5eefe7fd67d5706e24ba40078e0259cbddf4f86935635cc486937f197af375cc8' +
    'e4af330f786322a98375311e2f1ca38abe8260cf0a06b3122171184d3aaf9d522fb5d0eaf4e5cfa0393937ad5a870b75' +
    'cf3572197c5d38a9acffed5ebd0b4712bd7a2ee09aaa2e1ec37da2ad5b81cbab8a888d3b30acfdd3c73d4d1487a120f2' +
    '548620e7baf3248a617cd0e0e2088db8a278a502313c9bfa83a5159d3cdca8a1bd8d71b162496ac59f3df8152fd72cf0' +
    '546c7c2ea5d7707c3b72079239eef05451c2c07978089f3521a0df5a3afb15b877e85e4e94ebdf84de94f81979ff6747' +
    'f27658cf7fee9761b45ff22d96fbddba0f7abf2c0b287706139d990a0d40cec1429d50bda8b22392970db6ff2fe40df7' +
    '6298cc87a85dd406523deb17ebb3ff96770594c9d8e26bb5d12a6bae3633cd066194e8dbd7acda2e8dbde37a6bba03e2' +
    '25b53f00855f71360b511768ce6268c1f3679e68660b3cca7178a4f474a1bc3ac71b2984182159ae1789827812a5c8cd' +
    'e8ab41bdf49b6c5a176e627ecf1014e254ffb327a60d76926bf764c9cf95abf68f027e9e739d733794dd14b7fe5cce1c' +
    'e1b71ab4675cb2414e31611b874d73279aae8adda6d75e4b68c6c9f635739c5db1c48cd213cede7bc063f08740524b9a' +
    '1f4439409fceaeec76899796f0f88856b6008c02226c83036df6ac7d9c3c96f844e145d77b34997e438b1d88de396cfa' +
    '2fed2a010703481bfd1fdd0f5e627c8616d1d8a122aff0ac8e9a701a535e7cf8b1b1e00f87456de81fdbc9aa922282f8' +
    '9a9e3297644f647b658cf18525140dca5b492388ddc663301b89a0831f2392141f414b2835fa109beec63d9877a9f668' +
    '347f3b0e951bf4e5e8800e0dee0571fdef8bff968bb7e158c8b47b3d6b40d962323bbcefeaab5bd4d19d2834dbce5633' +
    '2acb7feb91af66cb84a505fc30ffabe4b43b584af4f2b131564cb33aef04f9764d7ce9115a9b7ecc5a82fbe9dbddfddf' +
    '23baf2e4584b8450c71820579bf204862ffdc4df6a78a36048ed773331e290540d7ab7810fd47f2f5974f12c61ed9936' +
    '139a620e95c61578f2bf1f3f4cbd4418821e7f05815acc83b59935459ff02285fbabd9fce22b67fe6dd6dee25366a549' +
    'e59c743ca0e2115f4f62186053540bfd57d5c6cad3146b5b3a191720584c5caa682210fed880e288b33e60b2b81e1e6f' +
    'da8400c48fb4fd7ec810b9c9953fb65fcb6d3c92f487bcb1dab4912a364fc0d9d77f388d0ac20d0a86d1c6936c51efa4' +
    '9cee484bf2f9d055f22cdc63d9a31ad3e7dc27c96a21d222797f9469d56a9097e384aba9713364bccefea3971cb0b8c8' +
    '35e7e6307582d164c5121e07c5737a084febeae409dc4d1918957e07ea90669bc8d50d0d2f8695c130dab263f8fd4692' +
    '256b5d6620dc34c5c3bd40795981ea67904cd4b7a49e225aa6468e73d3914021aea9fea24cc4f4d34cf4f16ba5a8945d' +
    'e8336cffa1416c68a77880ba0c12acdce481e43c8be05d32329c217410ecaa3051f4c880197b9ad36c921dc69082e50e' +
    '7a31c663dbd3aeec5e65ccb7d541aed7f445619cc3e25181ae19b7d4db5a31c905ce4795eb4bedc7e0699f1c295600a7' +
    'd5808dc19784c2e93328e92659171554a406eb955172d0df90408e2f44c0d5f6dcf5be34059495479d5c8e8f21c78df1' +
    '434db4fad09c3c28beafb291bf9b8537ee9bed3bcd4189d0f35cff64d926193cadfa285f7505779826686ca71b6680f1' +
    'b8e1b4d296582d0d5d4928c18161c0d97b5c655268b913e594ae00bac49e3918356fb4a31e487bcbfbea196b9a57ff80' +
    'ba6af0003269372880401998210726ed74ffea29bcc93fcbdbfbdd3a1e3fd3c35bbbc1cead9627a05af3b2b2f472fe4a' +
    'ae3065a7cf37b778b79acb4dcb7715cc0197721d8706be341d7b066718be3112a3f14838d26ac0701eb997807f7f3a15' +
    'fcea32eba1bf915e45f51540eaccfdf5148e6f67652e965f26659acf8268f7205552f494ebbb7ca92846b918aabef8fc' +
    '04c3c58d858a8e765eb5c5b74ab8ec41e881845c07202659058954568c6a3778699b3f6d079959f35178e7b887594d18' +
    '86b3e8052e1e6be684880424f2f421cbc2f6f1b8c044f7f606a2daa30799efaf46a4cd6ef7a510be4531ae982ecd6043' +
    'e8cad8c5477e89a74db46828394031ac3fa594ef0f7c191ead131f9d1f60e34bca3530db627169c2fbe19305a6b7f20c' +
    '48fac1e4a6a85c6b40969a71b80b7cd12f2304b8304295fadd6e297368aa076672c63931498ddcfd22d7a8fef170567d' +
    'fbd55d59741a5ca1dfe7fd91b456dd5258d1fca1d632c54b737107969082f2682025fb49755c74c0d05bb5e063fae4bc' +
    'ada62da73bb8dae4969c16c245ea90d940323fe2a9d78659d7ef5a75125dff69a4707de63c3e0a69a745611773b2a369' +
    '580966710a9853daf0f03df31003436ab710d9d8cf31d4ff985a6da528da09b212a9e6f80d85257b8a2d952f0be7e096' +
    '714ceff5cf2f9616e6c287f66cc9c4f6a7781c5ea285e42a970296d1692128673c816c3a2a13a38a10742b8bab4b46ab' +
    '319414ddfd558d9fa75c1bf1d1a6b7b91751aac180e5187d9b7f739e3afc13753b78e1428eadf42eea642e7c441decce' +
    '0fd7cfbe11b87bf7c98726855b5ce53aafd8a23a3385fc751ad42abc7621d1282bed52d7528804863820612cfc2ebd6d' +
    '8856040ab5d9bcc358b74d256a07cc51eb51376bd42942c3bdd44686c6fbafb6e104ccc0a3be2c231622cd8d811f3f9a' +
    'fac453446a9eff1b8522f13bac51fdce305200b31e20d9fcdabaf254091c91be478a9d33a90dd4688b2d6e5d64b70a08' +
    'b71c907ea22afcb9d343f699c209cce3b76dbacccc4257df8f172443e26504bfd15b0cc47cf06106048a29038d7b8e54' +
    '8caf048531dc0780ed6e31ca48907af52a11af85cd7e8f83e764f49f75179413aae71c447c22b1983c2afaecf9042f7f' +
    'abbf7c5e7b0ad33f3d8e4ba6558db0874498dd7249a4fa6344a625b5cfb37168ad686236ae1f788f0a84a1b50eed93a2' +
    '18c154f985dd9bfeb4cc24962756af3bf3ca6e086cb73747aef88b208d078031e029b9ba6a93de8ad818103970ddce19' +
    '70a4eca4726d94633fc174ff0da629946b6cc065fd76e047650868aee1b436fe6d1bca3bf32581cdd0cf91e494d885e8' +
    '7a37733b304628b741b1dccd76aff7fdd0ac8e82015f35d40436ab877b0c55b0b7323ee54338b5f2131dc459ccd24bc2' +
    '43caea138bd90ad39765122b3ee5d06b61c38e87e5371907f33b77a1155fb8c1b25a6a4a92a5ef367dae31474056a5af' +
    '67447b7e585e2302363f067f38f32eac04fb849208135b47aff59e53f21d75422374156abb7f3c46b038494c8fe89f63' +
    'f5298e274f6ffc312009c0b0f0f61e233eca66e3ddec8fb58e5cef85af0c27887963f72bf9182f81167091218df63808' +
    'db0bfbcadc40566e33ddfdca5fc97f4f311c5e085d55debd7f8705c3211ec0b0211a9290d79293cb19c05c86fc2a65e5' +
    'f2f31f2e8fb76bfa7775190f5799ccb4a8503b368314ca21ccd2f3829a402571d6833b6bc6336165979d04debc812acc' +
    '637a0922e511f956462d884af584775dd92abda6b5001dcd1dec418ec3fbc3b14d3747e4a354d0dbe9e18d47f32551db' +
    '4430657bd29e4f711423c63fc62571275b3b61b540a00de3d530ccc1aefe8ffeb7b6ff83b1e63506d5cd17049713bda7' +
    '0459f184b19be5facb91dd6a7ee386731e95b83ef213e855e24fb1e97c8dd22f31ed964f858a16a6aefee890b3b52444' +
    '563b9061b4fb836d7d4b9c26a4a70cae579d531b3bb2405fe5ee205d0478ea25043aad11d2bd55a5c309eba4584c200f' +
    'f9c01f78a4d09f3a08e596d6854484e9c1eae9e81537bbd7f3392c97eebe871d995d49d3973237ebefd7d6708087e71f' +
    '4124c9023aac27b010949e828567ee25ef81868feedc1bd3fe69b2ccdca320ea3e9d7ef4dd6b2c6857ab907fa6e0d1e6' +
    '0e6fb198fb0fde10888fa8ce5fc4f7b454a22d1ec5b320575c0b2a5c15273657175b9131e9068493eb412d342ff07023' +
    '8db4c3e6ee0cc531d26063b85f3db64dff92dfe6ad4fec28ffea3dfb6b852dd01160750418708920b955c03be6b3561f' +
    'da052e2848be21885245a47cae22eba3d44d05e79ca968f2b6c8bb3a52bca909b9929884e3a76e74d072c5d4d2534c9c' +
    '799dab8368593764d36b94cf255d5640117e4977415903e4229f1f36d2e1dfcfcda79f7cb8e9cfb1017cb2bc7fed59b6' +
    '220cb67fcf82f3588447902f4d4bead6c12e6bb19d09d55a3d10b45128595651b9528f5d7985f8a404809a07afb55ffc' +
    '8c723ac5916c3b7a57f0a16561a731b7a76d252f174a9e52b0200a80bcf6b4be3b62c12dfcebbf2d9fd6bde3aed53583' +
    '5e9dfa323dcde315ffc8a071e268dfb6f8359074917cf0ca0b47ae8741c6e688940bef41989e858c9f7fec505fe6a280' +
    'b0c827957fa15dd3d2c3bb1165ef85e03e7eef00bfc8f1574c0d34171f7645116fbce4d642b2aadf1a39732b0195c440' +
    '4e108168fb502b8e15fa48f5e7b9d86d45bd24ea12019f6fd2a0b3560f640efde5596ca3ee99541ec58caa60cb41b22d' +
    'ae964ef30c9ced0e6ce000083e696db8366215b5bdd15b5c32e8f645876f42be8f4fb13da457762e3ddc81d60c92399f' +
    'bcafc9495380715703ebe26cb2b3e91b591397bcd5c4f8762277f690002c625a9d309c4f16b369dbf78dba13511179e8' +
    'a4268ebe5091d58531269f25fd4010c2db37f4f691a9f27fea887b383aefe91894f9ca5829f816f851f0fe69c6512776' +
    '6e9b055546302de773c6586585a1cc239b45fd122c2a051afb7e045e6d4aabc2bc727583f7db3b0da28e7491423139d1' +
    'a7d12b82a4f2792afc837822ec5867f2a77cb1983e59c1e505bd9855069ab7ce39709e2befd3801f2426aa2b1659a254' +
    '81c400ac45af87f4e8fb4a16a2dbae0699de006c4d5360733f68c61a46b20971ad369ce3a3feec031536518d4b34ac65' +
    '27c4dc9f87e0a9ad9bd903f7458c681e326507113b5e79912120b055659fbc26521be20a91d556d12b568a787f1b2fa6' +
    '703d6c4a641830f64c20556424e33de946f1cec6c3761fbe2e6d17814a81a4d3f5c0cb9f88aaa47d46fd2de4e6f95e55' +
    '21fb95e5091ab6a53218073a2da55972e6dc7598d47758274da6527f56570dcb8d0c6ece9e83f16668f03764102a8a0a' +
    '4a0a69f26610f98af36a63c0ad6b663c39e2e76a22ddba9e0889afca5763565c7df58e722b0fc73151576b83dc887faa' +
    '023588b15fd964426e9c8814503b7250b8481c7195d04c3396ab07eb3e9963ab145f8f1cf059ca5c23ec0c057300fa0d' +
    '3e0ed979029f1db4b570506d087e59f82d137bab8a1e7291c51c7ff818efddc83f527538cf4f361924b498430aa0f05a' +
    'bf7e9ae77edea409f18e8ce26340a2e3a70eb693c2c636e810271215f4052e603f72ac304e541912c0e44527aaf57dd1' +
    '3f9a6cabcd485734b5df3e7ed68119c844f3ac62e9ee66cd4bdfb5ccb190892381696dfd0cf50824bb45af4e6fc7eee2' +
    '51d8d8ce05e73d31e3fd0d52e129fe0045d9938def1482ae08a0ebd757cd30b162800372f493d59a274f399b78dafc2b' +
    '5d022314a2a4a738df7bfa9a1c23295eeb054a784b29d844db13b329b7581a1b1717efaa046f2fb97e9231444c3096b6' +
    '901e052605c65f76b1796aef2604bf075e88b1046304bf9d9ffb0f461d1524b9369473c5e539fe1733c7e92678b8193e' +
    'f0bc161492c4cf2425be51e70e3d7a5b93d3ad8d406fbea708dc6d1705d028da10f7afaad10fe783dd5ee00538fd8655' +
    '2d635bd14a32a20634ab992d12c1c11ca728374ff3744218d69a0bf1168af6027e43aa6cd18a451e436449d1696c3a42' +
    '1d3391ea03861430636cc98c721aa24a74ad6ee846e3366490d68c639f46e916065277a7e8d5989290f762543e056f56' +
    'cc0ce10e76216a12208cb4d2c2307d9a06681c614bab7576cfb2e6d3c8e6f2ef1c944ac60196dfa55a236b7588dbc74d' +
    '1c22e5058f4d50386103a1d290c5b9520c837cb0dcff774a6f56bc5aaa2a6c39767e1a5a28c5c2233050d9cc1f603cc6' +
    'c19659551aee3266fe747a42b2f1fe7b7368f7061f33059359417739849e12a2de8ccbaad5abe5400004aaf4a11b4be0' +
    'ced215f3bcbe0ea0bf4f63473d420d17c87c10bbf01dd29bf149c7ca868b512d381d8b788ea9880b7e7609c9f0d058b0' +
    '70792a992ee7c6f6dda9c46906e1e8578fedc6acae217a7e947121c83fbf39b158fb2adbe797322cf769ba99556e091a' +
    '1d1e46cd9f32cae7963d7b9ae69e38abb36453f60bd59e784bfb25187a781a7355ace8e0bf7f3de93f485a432cf601da' +
    'e3e6f6936fe017cccf4b2e1a3d6053e7f18e508afc53fbb18b051ca06cda6b818e6d11e370677f9288f04c97aae3ad0a' +
    '6c2be6eed8b2fac13049670c138c060a34c59c7f2060cb27191ff9899c1980ede4691c146a80372fa4d3d50a765ad01d' +
    '90db1348d048f81c7102e44f1921ba998cceb1bc966bc36b2bd7f748b9786b8fa87496387871572d6fca8af4f9c4bf17' +
    '5b2e3846bb7fc11f944c0f0a1584cac613f9a8869515a745bfd733974b0205b2b152bdb42f93dddafb81dde9186b1ab3' +
    '281b5593679e556c0468e1264ac6c28ff35fc8d78a8a777f7c1c5bcf1f892434b44bf3be602d631a0eea941e32b784fb' +
    '427c2f6970a2189e75d505b2f5802b71cf4713cf19764f278f367dc9d8f51fc6ca31bcd49777fa95e653a24b7be15d54' +
    '613475cda0354ad4c2857f9782a38915ab996ca15e20eb3d4e9549f2202b1e8ed7a598f1fe33637de29ef2e7c77dea62' +
    'c07cb03c6b70d6b1ba5d9e721999fa715e4284319f8054441e628d7d8066b8e3c06f5ecd4cdf739c4e65efc1c35748d0' +
    '7a4d022dfe2caabece01892738b76d675e6c9a1f4889aeb7a844cd877e8331c2eff1daa47c4f66b4073cce8132c0af5a' +
    'bc67b774ecdd8d94a69fd6256e2d6f6d1b3632884e2a5d9aa90001ef5f2bdbd6ce773245ddbb3c2d7bbdd471d768567e' +
    '993b5d0fe08a11bfceafec9e8a22b8efbb88fbf74465b70b3ab17d386dce2a8f8af31301b4c32c231a71a2dd52c715ef' +
    '99e64268a59ceb995a8ae3335232d97e5dc6d31edf5b6e9feb06db517f03754b709718ee431e010b2c1277b1afe9cfd1' +
    '88f10be86f3db9d5e1f23b086e91d08f2aa1d99851bc7d161a17ce83eceb6330537f16e330cb2bc8e87faffe8bcd4f93' +
    'c2ccb4af027c689b39ba8b48f1770d281c32b766675cf597f55e0bcab534757bc4d4259ff73ea200b78394ae34bb200a' +
    'a38bf97daecaf82c31348090513ae0dd9cd7cc6d68407e7c45a2204706e7e6c482b12f217564b0237bc2e395357660c6' +
    'ed46a3e4c5bf1d808fda7b94de25c6b219c5f9abd46255df23af805d7bfcca9c79ef76b7eadffb7b1022b35c7c97b7a4' +
    'c8eed06bfd87e86cde359dcc024b95a65bc0dfd32317f2340d2e20c3de6d5f9250d9a1ac091d97c7c10c3a88b0051b67' +
    '2cbdfbe73bf196b51e5337506e945c80187b14c84ab58b0b801eaa97fe82f0075e9aae15ff8f5e088e88c33cf2c1f44c' +
    'f363938dfd15ce43b92c454ccfa88c60803ac31906426023a34fe27162ab9449cf59c30d56bd3d24e016e42277e903cb' +
    '445d7e2d05f9fcbf4dfc58bc574a030f651ddc9230c24b1f703bd8ee216678791df2d819b28a01b2bf33a295ce33b29f' +
    'fdf2fbbd7b251067075587569a986181c4acd3c56659dc3756fc19761ab3a56d9e39c8a5f19b71c9fbbe92775852b818' +
    'c7cf3a3925cfbb2d4bf943ee9f06e4f21d8f5ce281922ab73cd0752f8543f6b7a7e3c68e0c589f24e77924c0608c3bff' +
    'a616cf5c5b3893a71f39781822cb2aa1eff6ff8f2c8bd46eeaaa27b40eb407b104cf048a03d527df86717c77dbc6ab06' +
    '3f863d771e6b31a9b28e7fb782c897cfdbad5f6076aec4a5547bdc4f434598f89238af8ad1f3476cb1f630196d9f666e' +
    '765c19709acdef2e616dcd45e7cb1a82da19d32351dbd50d46ddc5a821d40f9bd5f61dac34591b15920b9cd830f4b2ab' +
    '2c2f6a48973d3525f23b162c649c1caf340c9235c3027c84e1c9b24cea11630b1f9b81b728b650af52da1573f0d9742e' +
    '4cef4cd12a273c3e9c88a1ca649116488babd765e14ff78ce1a54200f6717122868aa47994829a10e0c86e30f83e548a' +
    '3e366178bc9c1b15e012d79a94182ce057dca8d295f94ea106b9dfdf65650349cda292547dc360adf54910b6820c44f4' +
    'e8c8b77ffba62ac64e44d255dbf4ff065f6250c492f12896faa624ede55389833c6000e376fd4b046cdd5b3ac15fbdfd' +
    '37fbdb84c3fe41182fc266f0d8bdd4872c16d948567270e7e4a165ec41904559936ac152db499ac11e544f2eb7c14db1' +
    '1a3b3c5d840476866c56a35ca02ec6020b96cce754f24817f4a018b7f523c5ec6302ff4dde91aa6f789a93dabcb78a0f' +
    'bdd87b1588ac0f15712f6e69405242cd1b55bfdb9a77eb542b5b870fa4d69145361053ef8e987c5bf8c5b9bcdf4bc023' +
    'ce65faf848dbaf6f02e79071befa01f06b44a2709d0762309dd9a589b88b9f5936601d9b8c7d58826ef866a8b629ba11' +
    '27da7532221d3359a0482b7a74d62feb1518408c003bfcde0b4ede8c0824972e153b7fc9dace379aeb747e80ba6fce77' +
    '4b781e8cea96520b657137b7ef4994250853ff35764f18a5e4e8593a9d548ec8c6c0f76ea7c79756553e8fe978ed3fd6' +
    'fcb3cee3840e614aca0d7e294b418116acd06619aaf340af3c32e9ffe9ecbca2d750fc8f4a2a75100c516f4c6507be3a' +
    'dc3473a6d784fe428c5486a4fada8967bcb6e09e8d65f11597e4fba407f2cef3070c70dbf7cfedfd9d1f445479f30a1f' +
    '91e1e5f9a19bbd7b4e38e99c9115e639ae6592b3165f7e839e0e2f047730a33b1360f6878c1a15b16e1084246707e58d' +
    'bfa7c0dc2f771582b30efa1b5b8fac3bea87e0eabb4319e4944025f11777b69fc9ec2ef94e7c975af5bddf91aeb5f777' +
    '71252e732417d787290adb6ad9e602a6f504a5c5233be87cc74326f6ad27f40e6baedd8be33b6cbfc74984775e837c78' +
    '46636c61392b91acf47e8098ef90a19f9a85a872e786c9886ea9ac230d455e22ce1bb335488444b87070a5f3219c0088' +
    '89fbdbd1901c080fa6eb0967363ee63b8d6e07658f31ff0ccf42bc8897732ae0f159c54a179f355faeee041437caa2ba' +
    'c3d6637fce216185fce3628ad53aa77fa2cb3fda39a51aacf64f1c5f910f8b4bc8be34ae6d87bdb3d175ffd5baf6ac23' +
    '72dbddddb0a9392e4f51504f29b9e49eaa617f609f4f6bcea887bfb63e8c2ad70923efbd3e5afd9c836e26d5b5d9ab83' +
    '2eb943d6d0b71d0ffbd5cd51496c669444cb8c66b8d9b1621020b44888dd7eb444e66ac543d704c31792379dabfdcd86' +
    '3f386a8476d52e20b1238134345df24f8b15c35d7e7740d99a40d1f9a85d759a3ce81b502a70b950bf1931f731e5b629' +
    '1252f71eb3492095cc40a0594578d2646fb95e7e9840d469493e00dcd5ef83112d32d8be3c19b6534db5e5b5fcab0149' +
    'f4246c0c77954fbd1db469befeeb1898462bce24dec066851c0ed1bc99a6d7474d7041c7e6d4763323803ca6bbf0d5d8' +
    'b799166f6e97a765c33b08c2e37242e18a5bff476677668b2aa6494b5c08ce7a143e2c49821961211867ce463c232efb' +
    '7b3900d995abab8c1237b7c49568577078e22d580d35cf553ea7f668838048cad1176fa546522f010a2f3688a64b99ef' +
    '9e7a0cf9922642eeff4a3621fcc646489e66d6667c298b3d1ea1a1672d3811d2b71f40ae550a474bd630523864a29363' +
    '754c11e1a867e8094063196ddea63ffa221954904d93ddc5ed1d8ace73f2ea073fe43d5ce84e38f9420abaa48f35a805' +
    'd0df54bf42830c7ca7df833cd97c0885b484e5a780cac3807819334fa2a05f04cc2149ec81145c7a8382264bed0d7f9e' +
    '848037daf1ce1dbc153efff4dc7cc17c43ca624840506ce53b4fa595c751e7df1cfd6a635ef905d8496a08703bb5f8bb' +
    '637a5f813574b657cec3432612fcdd47611ef0eaa1bd2c585ff06acd5ccf0090ab23e956b6cdbe6b27aef5a4c42d341c' +
    'd7c3c84a1a43046a89a61f6839a258212f33f621e31247f873e45c3bdc79e3e2936782d6fbc8791a14bfb9b44cfb3994' +
    '5397ecbfe4a0eda0a443cde5ee4494798dac6cd1e59e0244ed866d9ab4399f206b0c4351aa3dc445afc62904a018c3a2' +
    '0e26f55b72004707bfb0b2eca44f67b3eeced4c57bab03dc56817333912da43265f127280bcdc950daa24509a0fab980' +
    '7c1e16ad27585ae4ff6446b9db9f1973fba5aea0825e96d435802a5896afe49bd87c47d214acf333597a703a2497cb76' +
    'aa257fca1b18542a39e9df914d91ddf11d2002b02381327a3280656b74c8bf6505270d0f2a436baabceac3ba093188fc' +
    '89ef65ef607cf41e43e01904268b016bd6900f9d2bda9ed747368695b85aa9af48a546170069b9aef211539d4f9b4964' +
    'f08d64395977b833f9ecd08b4f3555e9c4e6ebfdc0473b7665f16144aa2f6a8e94037ec452faf6bfb06d1fcc77a56dbb' +
    '1c0e5a85d562a6edba14405d629ecf9cbeae7258f3fdc07deee0a9444f144bb9e1a3d44716b210dfeff3bc8d59a544db' +
    'd83e5254f8a8ff11cbdb31169a668b442e00603b07d9db87d83d2084dc8ffbc2d1ddac5463b91a32954f39944b46e270' +
    'ffcb5b8147f82ecfbff95a05dae429fa40077a6c50b9ba47682660f043b03191be3d35a4fb4fc9344771582371dc25c2' +
    'fe3b3cc84506b409dbc84e4609d7de9f1966f74157caca400b4bdb684d28bc60f3be6d2349deb29276e620ae4b2f145c' +
    'c3db941ae5bd784c75726d2e52e732d7940fd528b9001a210a8c093903981121b0dcca3c056634dbd8a8c5b7c930d37b' +
    'd97e8321cada6fdd3c519cbb7444c8f1fc24321cc3232b2055ace85a9d0a193998e91582ab72e287b6fa70b399b9c6dd' +
    '1a62a63ba4b241962a2d6f9747790fe2c09e94a294c05f17b054061f64e0ce8d54a55266dd6507f7aa50654ebda6c5e9' +
    '79dd5f003e5a0ae5b848b06fb976ab0ca5edef0eeeb6674235b2865abd6bf02468efe960cd4893429fb8b564daaa3c33' +
    '9f6729aaa057b3e45a6c3f0b4ad980a3ce11d11cb4662f4692593b9598f852bf9261d9f833f28e4a9c05d38f561708a2' +
    '0722babfec6b8badffffbcb7b10c503c4e204667be51b1e98876534016661a8fbc6fc1569a994f8cd3a7c92048ceeddc' +
    'c70d4d361edc05b545d6a4917a405da786c870d89550575c073a0cf4078f59ee961c33e4f18154e5904ba2d66a7ddb62' +
    '260d39cba917fff46c5db76dcb0dd5c1ab2ae8c505054369640936c0fa5e9c7a31e88c48ff422f9fca1c0b5388773553' +
    '52165f2b7aad181101b0f2ced86c7bdf694330950d17e7b886fc8c7b13a0580548b3238b8346ff5848b1b4dd38365636' +
    'a6935c0934c01de2c8ff21449917dbaad3c2fd1611b281885f03ca43ddbd6dc0faf7b79eb23b16463abe762e30f2a584' +
    'a56b29f91678b586b2b9ce60b8e21cb791d4e1ec0c5853b9479f99bcd776a83ba2033352705bf7dfb4efee6556327779' +
    'bc8df0b4afd0b8bbd62ee313987c0b92d01e835ad0196e0063f2c7de0ee5d9ab6fcdfb1f2667ad7ba50e0d19e9924ad6' +
    '3d1a0fb0fc4a4c29d0274ffdc012e383d77af8add3ae0f2736f1aae0f96816d2224ba48dc0ad65821409c1b696458987' +
    '000ba144e44ad162a4c7df8e99197029e46d0d3d3a0ed22aa2b04bccdb1b49802241c1f55c2abd7b868a21d2cc68bd9f' +
    'cbbeb81b217a24b096f7778a3a8b117cb045aa54a16b587d859eed5f6654b9738e3a358ae98d888e0b5b809f4ffa95de' +
    '2c4aa825cbe737bba16303175b6f29fd4d2420cb59abd1f0f98ddb5ebc970308b51f3154302275c24caa40d322fc1f2c' +
    '86c16f99e5352d227df41fbeea7d43a1b4da33b01185b3f9fe0af7428e1144417d6513eb2a29bd004899de52623b36fc' +
    '728be8ae9fb791edbfc27d343a60e6836a06c5c05d159bc3cfb5f51dc9d7b301402bbba72ea3ba9f8af4be451ca8c4a9' +
    '81a74da49f0f219da3e425b27837cbe17aa66ae1d1fc5d9b400b2372a93da542be20e90a273488a61738faf64b167840' +
    'b83b924f5ba0f741793a0c8dbb2b8944fcd607a96a617b9a15ce3a886603f7c23c8cadebe8015075ca8d17206a7ca295' +
    '0a8d1a2c6ba88d4f2db16c8ad659a893f0f532a5cb1e97f1cb135bb11a324637d90b53f2f33776bb0c0bfd8d28803029' +
    'a5f029dd13702ff4722dd3e31d140b5ff0264723786bcbc1c31a0b4fcee45886aad79ae1807dfbcb1496775ddc1592ec' +
    '29428e88ea01d3cd600248626da7ceddcc23b6e01c27259dae5a85bd8d436cbcc5a4e827cb7d4bbea944b8f14c29c789' +
    '3616ae73155794901c54a14feeb1a695c287fcbebe8116162a88f352aa0c57f652fedeb3e7826af4c3e056e8b25241fa' +
    '31940909cf062a74abe223e3e13a3cf46655491ee87db19a2a99d275a3bf371810b25b5d01cbdf7b9731fc19f553938e' +
    '17acad9e048fb943ce4e635e3901796883351546203af0a3c3cc326c5bf402d97011fa9420ea6dfa8410f2d2d6e852ab' +
    '87ef8518dfe1742df14b4897cdfbdc992a770fe969ff081a5b20641bf8216c7bb3515d148ae606e1c4d675a91446f2dc' +
    'efbf109f20e53f559322ce00f966debf1e1fbadb9c46a9956bfd493f8e1c98e595503e199554ba0c672f0454f44a7d42' +
    '32128374097543641b1c3e53dcd812a35ad2e03ff30e2a8caa82fe883cda62dc33c785edc482068dbe387cadd27590cd' +
    'be8c6a1b1bd73fbf7fcda0a06d774678274ae558699aeca33296b86ab8fe6cdc1413d5d802e96ddb2317cb3223ce4012' +
    '2a1fa1ad8e1d26c1a7042b8853992b1a511366879e4d8b18c30d7b76448a1ef5f9284094791622bbf34bdc65c3e14081' +
    '82358f76bd11c0df321a93a3ea9d5cea09c8b0f4ac3601649326d021e7d7e0dcf4f05d184f9738393df7b38943a6ccca' +
    'a42d442f42cb0cf7207741d087f7610e1ef0311ec1e9aba0ea4aae1099dec043f0710af81385c3628bbaf4f326ccc167' +
    'd2bc6d91524d4416b2c5606e99ad1301e3235a82e9c09ed52f881f2d30d5596cbcbbc48cab5533c1db05f9c05ea00bcb' +
    'a0a2d6760b27fe0d856934c81d9db069603970113897d8fb9d36c61a48d0132dbc4360fcf6bc3ef9d88d0fa2821d41e4' +
    '6c3f3e68f50d56d5b6841c9be695263bf33c1b7e5269d95bdd6b134c91870e0d1dcc7bbbfa2d1bc2d8c6d77235da5eb1' +
    'af13b23cf671b6c0a3e1ac4de9d41710bdf608e00fccfebe9928c5630c42fa1e6695392a2494c6f09324b7ee15c7fd4c' +
    'bbff4b6b7e121d6af5f2a7484b58b10f9394549e7172f3c3820249134cf5080073a629c7a349ccf89c7b9d7d460efb5b' +
    '3785a90acc33e8bf03832c614b25dde1f88db601b1149b657fdb017591a28525a03c60491b6ee1bcfae27ad0aa4af2f4' +
    '46135257d4fcd5bb2e4ae6ea8fb20d7add8c4d998b7a3f1e5eb3c0ad8569b968ac66593d74e0ee3a6b14f93b16b3313d' +
    'a0dda673bcbb205ce9800e5d3540b043bfadb6e16930b2871ddb4e508bb60798c23277c6536856bee2012bf0cc7db3fb' +
    '5554510be62b171526c1ceb3e624951fde8fa91fab67c64d3391cdab80bd7db0a2f99963dcbe26fade52be89fc7c9c6e' +
    'b9800c01fb62db30a8534c853abb9d40ed739789a40ee6557a3654d98e4da11a2fbd642232d449162a6087bf96426e18' +
    '7ecb9b2e2a06f6ce3b2ee62f9542537efa592a2d3e63bb3bbf1293e1435bef0ada39c45999adc797cf658c6d78dda636' +
    '738d2641e954bd894486a15e8beae56ad239cc42b93c6551a40a40a67d4292ba5c66b4d9725581a689ab05a05977beb3' +
    'f79d0708ecf842906de2617b7f44566213d7e4df2cca44ba48dc285c279487e46ac7d099e2a373ae475be2aa18667119' +
    'efc2d944907af39098c3ab53c3f53cd383d998a15436a891d03e0fc6531d8f7d3c5b24444cbd6c6c05f25c1990273bad' +
    '35f3f188ecc9a4d8cc6bea020f40248f2026ceb118bd83aee8f07017fac3137506f348136817bdf27aab91924e4ed28b' +
    '0ae784e51912edc9cb761f245b4d81d6a8464ffe022b3f877206f5d571049afaf53d518c0e714dd13b74e42183d59504' +
    'bfc644ae4d360188f3bc57d48294d116499fd3509a3f0669e230da4c6bc1c26eb5fd8e82a9a1d6913b3025ca28326f08' +
    'b65ebd873d6f6a3f996072e9dc70823da4807e235235fb6127eab77b6bff45564c22648dde65023dd1df5f3e0bccfed0' +
    '74377b7891f1d2d8567ff5bfd99e548e3c92bb3473a47a07ced2297e81db9ec36bbc52209fd5317de18cba384e51db7e' +
    'db7d7f62fc96';

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
      const houseColors = ['#ffd700', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#fef08a', '#ec4899'];
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

      const glowRadius = 26 + Math.sin(c.flickerPhase) * 4;
      const grad = ctx.createRadialGradient(cx, cy - 8, 1, cx, cy - 8, glowRadius);
      grad.addColorStop(0, 'rgba(255, 214, 102, 0.36)');
      grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(250, 243, 224, 0.72)';
      ctx.beginPath();
      ctx.roundRect(cx - c.width / 2, cy, c.width, c.height, 2);
      ctx.fill();

      const flameTilt = Math.sin(c.flickerPhase * 0.9) * 1.5;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, cy - 2);
      ctx.quadraticCurveTo(cx + flameTilt, cy - 13, cx + 2.5, cy - 2);
      ctx.closePath();
      ctx.fill();
    });

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
