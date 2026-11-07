(() => {
  'use strict';

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
  const MAC_HEX = '0d910d9f26d4d3139f5862aaea4c6623d01fe4e3dbc653b14d4f6c99f36a5b6e';
  const CIPHER_HEX =
    '4864832dfaea51e4f770cfe1d9a235a785970cca7e5e0ee149b1790be43798aead3b9a9a4341a521083b9ce2aa4728d3' +
    '8bc132601f6b22a2e57b3f446544f1d3a6d27a8a1f33bd03197d4e1b7dd9c81f2dc79fc2a1ad868629779c791f4e554f' +
    '097c527c15526ccd91b99f63e7755246fa6b44ab910c9bdc062994ae48988dfd3a5b8f2ed07ebe91805d551ba5a700e3' +
    '56e87ba79ad1249c632ef9cfb442c2e8bf40a10e2371d3b5878c2cbd58a9dacecdf8f25b04c48fa85698b74dafa9735f' +
    '12187d7ae2e221162b31639b548ed30006fea7246e69e00b79157c9eca069d58b4851c2cc2e988d3931728fba4abe1ce' +
    '76b3ffb406f4a761129b34ea3f525759cd35820c156c19525fd3d64592ac2b230437937c6c19bb56e70f3c377a61d52b' +
    'a625560349a39f08533ea65eeb7d5924358c48367f0d9b7e51b1aedf2c47557839958162656705e30f400bcaba588812' +
    '8bad31c62fabe2cfcdc3eea5538aa00a4eca5b17527273c5362285b615b4f666d5737e9040717edb7f82eb3b27d2abf7' +
    '5d8c4610f68e40542f576e5bc01315c89da189e1e01c3ff57b9101fb94ea9fbbf11116d755c4351cd48919273be40c81' +
    '144c966f8ddc3edf83c0854ad81f227acf8191dbbcc21749058999d624618643eecafcfe18c7df6d986381c8624d5095' +
    '115b35886522222790095f2c305975c14ff20df3aa62a11e60d1ba75801298d44624912aeed307acebfe77a6a5656fa7' +
    '6ad463b7c28d87ffe907df99bfafec5edd6c1c41a85c557910f2e9a895ef8570555065ea5ac59e159c77516f1d5bd6da' +
    'fd4ed9058ab2a28284005653acf6cb4a98f99f5a35f1612c59c3acd50428db271345662937bf61cfa557ee6ab01770ae' +
    '9b99b2ea53911b3d6a62c9ca79b573dae831f0b1bfb7ff47c69a523c4d5ddb543d398bfb23ee7d12b684537fd86497bb' +
    '8016ee47909f4d053c0dce08cf70512539d9a609b9fbba2696f3d93449cb53ca88d40599be7afa29a7051f1d1f697f18' +
    '7eb592def948a178cb0b1d57b0c90ba62034687fb9c621606dfb7733312511ce978d7c13ca12daf78820b34d26b8dfba' +
    'e33eb790e47bb6def02afcc3df539ebc70e3ede273cd0475fc22805d93f0a1741d599a7222cbec07b672301797d22543' +
    'f4847fdd1be24e11046515616a420fc44beac7c5f814775b3a1b152a6c429834cded8e0c94c5b486b21d7cadb805344e' +
    'dd854b868fc39412a1a6651d23a370f657a15ff99de6f11a03fd0bf3d0d0272d59deaa4bb40fadef57643b5ed0de2607' +
    '3906eca1035c6a3fa0a5af29ebeb4ccbb9b73497d48d19f980eb5e9e5da0780632483a68acf7c436c3d08d5052b9feac' +
    '1484b807f34a4ae552d6f2830a86f9f0bc5a2e078223ebc59e197e2de35539978e8430697686d480389ce26d4436c37e' +
    'b19cb9e8d924be7d7d79b2b8dc0c03f7498011cdb8517b5af306b10144d8fc99ae6d1c60ca0c26a7c107477163154fd4' +
    '1b84186851b26c4c86e880b92bd7c2d550439f271be34715f71bba3793014a7cd2292602e089980bd0f6a2afb61232b2' +
    'df270acc7edd795ace67feae1fd603112895f4402d6e9048e852f082931b7052df3499dcba1efdcbec1ddb5c720c4560' +
    '237d0c1b7540bfeff569c0573324b35866ba0bc7d8ba057e5daf01f083c20d486a9022f1f41e6be3f5cd797a6e01d9f6' +
    '86288842db992c28b9be9654dba719ff746a6af50c09062b090854a025b6a082affe3766b0757dce414c143b781e9679' +
    'b9d689d2994ae6a1e782d92e17b82e942f0331f9864e8947226798e7a2a04066210ed3bc5a1142869ed87935810298bf' +
    'e903d17156424274beccc100960d27f378c3ea2984f63ecdc8fadf0e1e14c8c34c8fcef293940b9656de87bed342fc5a' +
    'af31739cc120aa7cadb9c345de7b2ddd0e81551397317beaccedcccec4386e79bd931b0cb422c83e6f8be2f543007735' +
    '99b129acc692e0185e866875aabce8958e4ae89c91fd22ee2470bacebd79f80d5c53f995e7b35fa91557b12da3bfd0fd' +
    '0ae6d284adb0825a74b4f0bb4999e741c6a484493d20025f068b7a58967239577e953e5204aa6bfc6364e48eb9534038' +
    '8b88d70936086be09885000efac71e0c4e60674a16c11a24947a1336b31329f760eb77a66778f728d4d02660dd499630' +
    'b1edb69a4206f7a32a16d9e1ba9ca474e2266413403f484fe7565113cea9b166ca3c3ada60062a4a0d1b4805a2b03a5e' +
    '6db7b7c7dccd5d3204a5e924bf5728eface68535a4bd4eb49d013b716cb30f4065886673191c370fba0232814e3f58f6' +
    '5127b2df80c3dc5b69422a4c3d8619df16c293c8ebb10dd6cde7fd7419403debc4d076879d0a3dc08c1ef2749e3103f7' +
    'acba33ab209ed1a08cf395308cad100a1d6821b9cfc7f707cb8638455815e237ca600fbc10a9c3cc0c0348077abfb12a' +
    '7e246b75088aff345f25a1501b327faccf3183bfc369b4c7ea3e65cc77df4fc208f495e77fdf0c2beb1afa8fda75167f' +
    'ebf6137c20c913df9da48caf35ff9fb292316475fbedc551f631dfb95d45bdf9f77182badbee2d55f7ddda5422b8942a' +
    'cc30c765bc2296816f1134a5b186efeb142de8eee9b0022ac5641cc202bc8fba762c22e065272dcb61a8d9f195fe6920' +
    'e67d2c51d405d3308eaa4383e750c401aace9dfdae327990f358e363f0cf17afcf2307fd5882c53c973f423aaf6c9104' +
    '35236c07c9b4a8af2398236d795ca16b9e3f2c05ae15284b021bd86c45165a3335f2423d4f28f5db94c0084a1e82fbee' +
    'eab0692630914bd8e024bc54a62884fa661a38cc723b8393e0fc8360665f98e01391f4539072877bd878540b359b4368' +
    '8f47da7fc58c5f7835ab717d34484a0251e3523341b7825c31bbee05ce03353eda5307cb65e06d2c17870b1c8e53b457' +
    'b38dcd69f748eb566bb7d6c829d136f22811af08109c074e03fe0b7afad24ed91f68d6385149ac233a07cee3e3072c47' +
    'aebd7772793fc43c11b98c5d87184751c24137b5ba4f73988d24f5c39b9a0a0ea6371b0cfa5643ea63bdf9dc0c89edb4' +
    '4d8350913e535e1d484ec15fa1ae5f8c3e09edd2b204cd952e276ca257af5d89be51988c6d83c94cb61846667595af03' +
    '34dbc6f0216cf0080c8f2cc3b36f8331eb8135e31f8361aca389b3446562f076a0fc40f03ba63973187aee9d9acf8dde' +
    '71f1321266192df0128899ab52f1a8fc73662f4a8b89e154efd5287dc9d4f7d4ca26042d1932efa70066824aa39b7c94' +
    '31d98d6caca777edc6cb547ab72a7092806c7e7f4798eaad02f507d4152f94f99c53436eb2e2b1362ee078e3baba7fcb' +
    'e7a6a8edb4b7e6a392351c4237f117ad37e787b10dd50f616603773d51cb968746bdd9a81288e4fb2acee9be6d4c6483' +
    '56a329e2d5adb2aaebca32342b01c3adf72af77f79ec9f663fe428f5a0519c48ffa736a94f7959b536708624af82b44d' +
    'be349f97e62504784590fa8201db210305580218cb85b18453fe78cd131ec4b3e44d9a3b0005291085a90c914786b00e' +
    'a075a356ff9d68fa78642c0d67bec0a7965133368d1afbe89ce09d99d33b1d77c2a702f2d52c4609cbb668ad8fe895aa' +
    '136f7ba59e61c2735f119408b391c704654ada991a19d9779c39fde0aefc94d279513bdce6e6a0a3fce59b40eb6508fe' +
    'eb791977df996d6e1e03c13eec28712f70fe0d82e73bcd4e64bad9e78a659e271fd74332bde53c1613bf37888e0ba6d3' +
    '716599e6aeeee572caa2c9696fd2410a23fd8c518b34a80ece1ce3f11efed7724ae339951f2bc82ecb67ac2f2800f43d' +
    '583e40cc1f4d45d28d050ecb56558877ba01a9a9fffdd0dd81b61935637c6aed9ede26f5293f8d6577fd0635829ce593' +
    '54cb3567aee4b73a11fdadb4fb79f3c9a19ce1cfdd88615c3ecda15c1b3673fa19e8809c108472ea9eabd97b82838e1d' +
    '673ac7387fb527c30a958fc1ae29bb76a84be9bf96a52f5b37dc1318642ff4768046dd65c563341e1795f725a79bd54d' +
    '0e53b45da5249322c6f587fc996500719362aee6553bd7f90837201176bbc680c790fe00917a9ad473fc3de09148a784' +
    '1363525e3ed627cc54bb89683030b5ddf8bbc8e19a7be41fcee021c368a834dd18627606107c8d147db924b050fa203b' +
    'f50e39394f88258f4054a46ab92791c5fb0229900060f8116c4e51b545ae8a5ce585f3ddc5c13a73ba24c1b1b67ccb84' +
    '67a2cef54c145f62b6309fa491c89db2e2f3ba87c1b3fc69ea7350b16f48616a1c5e5ed248206e1cf1d16f5cd629a81f' +
    'd9bb9273508cf769894dbb206d482386f34b7cdce73a82011b6bd37082575a51b9528f5d7985e9b4158e8d4ae2b59543' +
    '3b889b2e5b0d91918b356f9ad47dcf1665bf898351dd7c0d2f465dbdc7a386d0734e887de183c332c1adb093eeda5918' +
    'f95574ce7685a50bf3f8ad69eb4493f8aa7842d12636a0f161d8fdc042988382fa7ae622f096ffefa7d3c87de8e69aa4' +
    'b1d22e9448bc56d7c2c7a1196ae88ce1184ee239adc5f25f8b8fb0d1d494c4d195361134d16b5a14a29db44118f0bd76' +
    '1d65b036915e46d327940ee59cfcfa051baa558a0544ca47a7fbba24605572b3c63d0292a8cf436896aadc39e822e83e' +
    'e2d47c9e47879e64778b5326460742db574c5af189b03a6a7e94f719df5a2ee5aa2ec339df3c6a4656e3f5813af44ca7' +
    'c6eee12c028c3b230aa79e51cdc0c0542c1efdebf89e94714128fcc059252029865cdf505fec6d9da698f44c775d28d0' +
    'ce4ea3da3dbdb0de2761fb33b0240493a72f9994acc5864aa7c9567c7dc78f418393905d5cb004a017ef8f0ec0147249' +
    '22d232f9f7cbef2e3fec1c3b8ccd9319d515f77f7d1d5075d518667f111086a7d86211edd2b14408dbe35acb36214191' +
    'bab96a8ac0a9486ca6852965ed3a21d3c31b84d5646880a4312629b1fe5cfef47d2e9d44b0decd5d1848c90c4f399b3e' +
    'd1f47ad162c4f8f98cb9627cf6ebd56ca389406c38326d1b5d63a87e6dfe6070fc4bad8df5f38f5d297b0eb00b49a239' +
    '76cbacf68980eb9ef4a1289101af18670b3d6d385e3a40fb6936de156df2c3082f66ea78e2f302a31b39ea771c5d39f4' +
    '36141e2667696ef7107c6e007deb59b1729e8acb9a320ad26a6e51ff7fecdafb829ad6fff3bff10f63bb57d98fa26c31' +
    '69f1eebb267fd3916e40147d4ab32823f3be13b3aa09676b23ae3523652951fbe0755b9afe8f9b327880735c58579c6f' +
    '102819947f41929ca72a74adff6629753bbaa95a5799bcd57fa9f3bc56291f5c1d998d1b6605b3567d3b3395a4ed7bca' +
    '5237e7ed6cb43c5801e38343223d2a1abd307569cab1786ee9a663ae0ddb04a27737866d8f73b60c108a523e3241fc7d' +
    '7716bb2020c57798d220543b75441f88287804a2ee5158c59d2810a12881bbe05e3a6c678c6476413cd1da6d65d8fb33' +
    'e15ec2b74394e902aaff9680114dd09cb177edae780db81296fffa9c1ee5a3a8faf24aaa91e24274d04d9ea20722f271' +
    'ea17ce706cda92881404a0cb130bb10cda75a773f328f26fdd0e634d78722ddc65adc2670ef53d2fbf5465c1ee0d0c27' +
    'd20d2b4ff93fa8f6046093e4249fb2684867463a64c51103df225e02c574f73df556b0d4371e6952afd3328c7a1f54aa' +
    '98dae4996b5c24c623f85624daa85326f063d0df81f810c82fd331db44d3d6cfb0cc036782c13ab242e6903c201ac8d4' +
    '8379772275ac6908e15c36be0f7eec333ad3995d100dd5d59dbf46485c40000ffc05824708cf7ddbe95d0cc628fb4e3e' +
    'b8f7313fb3ecc3066a9f7bea37730820e0a20a5d81b7be83354d6e352cd312d81ef495a8c621e792e156fb1539c28859' +
    '21615bd14a3fa63cf93b327c5b82911db6082a4ef313015f5768e861912df6745261c707be811022654861d1deb4d7f4' +
    'f3c8260b9ea133986979d28a5c2367e9e82ba12cd804dced7e2a098627955c7a7c6e6d6faaef3d561368f89cc991b9b7' +
    '66e31f82c387af9f45e492ab45817fad067545051f804477c8b4a1c90d9dd0a285c518d15ae5f2c8040a02328fbe46dc' +
    'd992144ad77377216624acd1dc083ff3cbdc65cbea417a595a56bb60ab2445fde9c990b5c25517cbbbb93e48d99c7f89' +
    '8a960018880bd832789b9ec5426422d7d86ed324d9400bc410512276abed6c81bcc9ffff94be9fc39561e3bbae1a4dfb' +
    '824fe41d2d65e76a2ff3c2a2cee9e6b06490ffd49578beabbe77ebc6a3b056017425a04da48ee6701010be067832073b' +
    '1e1838cb43d4a692f2c69e7b59b6ce36fae6bfd0bc4f215e235b326f8373e9b352fb4dc8e691252ca516e5df172f1a11' +
    '130e3bbdf253f7aeb61645b2e3ae1b97e0083c9ab30151d0d53884c59cd0efb7f45431f6ead3e3aabfe035210dae6ff7' +
    '91befbf13ee376b2c70f62235e0d5b8f4ad2003610d32a1d45b6f733af16e0583bb8866aa9f5c2441c549339012613d0' +
    'ede71a6a0177673dc8d9c5bada2c4c6e3aabc45c730ddc48442490d28ad812173aefd49d6187102da1cdd512405bfd28' +
    '9ed93e45ff61fb204d0fc3441601979288c2bca09162d24226d5cc48b252608eaa7bad1c777c43274ff881dcedcaae3a' +
    '56243443ae4bc01db246330d1789f2cb30f4aaadab11bd40b1e30594731305b2bd5f9e8b29b6dbd8cc92dfcb3f601ebb' +
    '2f235293738b55780763e52a49e8e389ef7ecaee8985515f710855c2028b290da743c7a26c11631a22c3990e0cb9bcf4' +
    '4c4f3f6f46ae19a27fd508b7f69e067df34a13ed3b795937851b68c7caec19e3cc328afb9555dd9fc650a64f57e0577c' +
    '611b49c7972c4ef5de8e5fae82b8af199fae6c884720d21a438f61fc350c1888e0a48ae0fe304170f882f1ecf970d874' +
    'c26cb5326777d782ac57a47419b6cd7e6e7f882ba38e76461f7e817fa373b1c4f4616bfa4cc74d9d7b42e1dae0567bc5' +
    '7d423328cb2da99ad3009827399d6a6d4777951043858d93a46ef28450923cdae4fdec9c7f7b44b5233ccea01cce9c7b' +
    'bb5fb576d5ec81b4859cd53b632363670a0734b163ec981b64d9e32af0e61e3a30f8c09e5253d9ace10713aa1de2c3cd' +
    '5dc6be84266f9c3592f7705a03e86c6b77796d4793e469f4ba55d192843ca1616664af55e457dea6d2a02732a14d8a6d' +
    'bed5d7a1377b624e992a17fbfcd31d394cc8c91e5e8de1435dfadb0d3c147c7e6d851bf90c7044510c5f20b3d985cbf0' +
    'a0d73ac06fc6cc4b895feb5f47ace3ab4ba0e8a8039c51660b3afcbdaedd5453c38d62930ce61efac14290939023d3dd' +
    '9b81f9b02c7c4dad23f6fd0b638ded95065cfafafddd316d07114899d8227f58c4dc68d7b89a58d24781e2fb7b841f69' +
    'dbefd44e8081839ae136780593f43fba99f3ea4c490e1b507ad0286132a0d9e4e1b405073950de4e0de1daa21620188f' +
    'bb46b3ab90ee1bce9ec179d3896b883ba61a11eefb7f0da967eed61147b1e48216dc60d5eadef90f5f2004acb977b72a' +
    '0aa3e87db3c8a723d9748ac8604b93e141b39852d7e2a6462b3234dcd22859dc52b8f6b81b13868ee20f2dc6ee057a22' +
    '7dabfff17ba58fb305512b5e74e311bb555c1acd43f4c537985a9f8ff497a2012aa2bd0eb1a10d6993daf33fb7dbef56' +
    '9d4fdca4f508cb170ef7046fc3ab817ccd308d4d0d077722b607d46668b7961d9b72ce4c7ab13b3fa45abc2207ef18cc' +
    '4314220301a8a3a95b981ced081a034f2c24d0950ad21353427690a1166b78765af2fc17f68f0fa9a87ba4c1f624fdb6' +
    'f5edbfa86760306c0055de1ef8d523c4c5a3cec46950e13a55f7486c579aea659f3fcff5ca906ad4f6b192455c4ef137' +
    'ce8c91eb6bf8f7165dfc06e9d00ee5f21a8902f6809839ae2cd276359f1eb7f3d1f9dc8b1d19cd4bab592d8b39c5eb14' +
    '46b08c7a40379fe205714e560cd025adaadbbea9258ad42ca2a034ad1eb63cb018c802c21ade22d4d0387d77b08bb40c' +
    '339c7e4c3d7729beb3fe4bbe9dc8818ac14d18dfba448d815037cc450d26aae29824eccada811329f6ee304a872a6862' +
    '765c19709acdef2c7a62dc0e90825c507fb4752b3d96954b50dd8c8f2cd5368dd1a2379e34581508cb098dcb25b4e690' +
    '6a7b3b0195003322f53c117f3fe45dea6558d90ce92478a2d9ef823cd732252f26fef2d42a84780080b50231cff85212' +
    '29e802ef1b00105791aef48b2ca475c859d9af048d7fdcc5c6857802cf512767e993a129cdcad555a6971875ac7042c6' +
    '6d60567fd19d1f04a909cd929d0335b014dcdd9b91ee55a848e9d3a82e720b55c0f1b14e6bb745afb41a40fcaa376fd9' +
    '9be88d43fba802856a60fb68b88648df1a453db89dd61fb4cb8824a2df34f7e521412ae304a864200f5abc4ed47097c8' +
    '72c1b83412262d72708b2ae3d1ba970ddfe7977e676968e2efa3bd52f7e4641c9022f013fa5691c74cd7a3c3b7c245ac' +
    '09367510da06428e6543bd5dc218ca0a4ef093a6cd1dafc2a6f74ca5b76591fd0c5ea504f98db72c41cfa4debdf1861c' +
    'ac8c385bd8e7739da283bcf2efe29211dda9485c7eff00c1272d9214b5d09320a1e0aeaca3c92f17ded8a2f55eb0744b' +
    'ff69e9fb017738add712df57a8e454ca6d0d308b6007cec17d8d9886b6939b5d34aea32dcf574a996aee4dbcbc29ffd1' +
    '836e778cd8e5a32df311692933c7fc5bb30134af1b22fadc093b9d8e0d76c775586f3e8eb889b45d47a6e74e31be18e3' +
    '828e826323cb19482b2062e5c0458b401253fa2f33094be1e6d44321d4548485fedffb7badc7348d1955dfb730ef23c6' +
    'e1a0876e74e9616bc35965355706a402a697e8e21ef52b993a20fbe4f8a298ed40be04ca241e7759221c26456f1bbeb9' +
    '2ed33cd2c59de1539113cea4acc28d35acbbee898665933892eebca813f0ccf20a0267d4f79ad3e98713581a63bc5932' +
    '8cfca7f3abd7a52f0a25e5d9c818fc6db96592e3155c2a92d60a63183673f1730f70fd80d95332ba6f55cb2e2e0de3df' +
    'f09fc79b187e1ed1fc4bdb170183bb32a5b6f6bfaa4118e4b15d29ab4832ac82d9b86fd6527eda46ebf2f98aa4bcf773' +
    '78337d772e06c1c22945b978c2e246f7f532a2d2227ef260823131eaa130b14723fdd98be53664fb865cd023428e392f' +
    '41687c7c382190e1be7c8780efdcbdb29d8baf6ca0d29f4bd249e91d1d085d388b25f222549b05c83d4cb3ec218b0988' +
    'adf0dd97c0490a1db8ea457f133ab4299d691072d92b9e933db869090fae65ddf90fd04a08cc0f51aeeb51043d983352' +
    '3bd72619d627619daefe649b867af934b5de7a9075810daffc404e5f914add198f6edc618dc399b4c537b590ffb2ff1e' +
    '76d9d0f6a0a076752b020208bc4a3ed5953d3023ce0943cab48cb3b475e80ddf1035c1bf3c29b11536e42a1717369793' +
    '2fba7d97efb71002f3c6ce89e9d3b65cb21f07fe44898c730a2cb24cdcb076a14bfa7ac55515e5340092059aa1a9d59d' +
    '32327b9974a96b6cb13a812e3d3efa468318c3452a7b11c3c807570363b530b374b9541a2570ba1490193cfd1af5bf66' +
    '495bf80af4046d1738bf185b8bd86c4c65a41bfe79be9f725d3d0b8fe9f1ce5f61795d4ae01931aba590febfe6b1526c' +
    'f0382b433a96cb58e5f05cbef3e4758a4425cf2cd2d52ccb1e9729454a3d0aac4df3af3f8f806d396f8d38acb3ec9b8b' +
    '9099196e2786b9619776248fed6d1bb49308ab5a236f6cca21ac420e9ca4737890dbdd0dad19702b2176c65badecd1ee' +
    '794e418b4552487246a54531b5735c71e807c61d3b38c4553ff6aa25918944c9db022cab734f350c05333a9dec14df31' +
    '23d8aafb16c3bbc7f4583622d8c25209a663dd753976cf3e0cbeabfd8aeff98534eda894554d056fdc284f313de48966' +
    '755a0cb3b77ca911015f576fdbe32eaa63035f9057949882f2139c4f9b02af8bcb507074e4532bf50606bb667cc9ba49' +
    'f8da04fe438d0a66f68fc670cb6a4d93b393e3adbec6c3c536504603a8aa590bcb2408bdee8db08c4404fba2ef7130d3' +
    '006fcb35bf58ee002a32faf2d579c17e43e66d42015a60f279c54c6d8139e5d905fd7f72493bb161756d18230cf0fdb7' +
    '616b4181293f9116c0ce536825fbd546613cf7fee9ac361d17e1789f5ed00c9ea039ac5ff282fd3b37e0f79f813f3518' +
    'c98496488bbbf1adc7d7780a4ac97b120f77d905cd3647c837d27508cc56c3c8b42ecb90b09c326c8158585fc625d7c1' +
    '798ca1f1b6300452875888f9ab46997dc182699eec830f11ee883ebeb5229635a9e1bb1f8333c6496d15de18a7128fd0' +
    '3120f2596749d8f63977f3e3ad5e6793e9c691ab7b962694769d34329e3be1213260d3ebef5832e3436ce5bfbae0b3ba' +
    '6d161caf751c12abb0b4ad45109f3f53c78fc783bd69c5ed50a21266efe3d3aafa5c74bea17777969bc490bbf74c8e61' +
    'b0415ecf1b1f5c7eeb4c6d3f8f782f8647755da47bc924351893636d60812897eae8f2e9784e7b3a530090d22e3994a8' +
    'b3e26ae86e7df4b4b905c79599fc393dda3fdbd47fb88fcd4e7fa6f61c900e43d65da8d395935b352eae9479db24e2f3' +
    '233dc06a467bea28f6a2c4df483556ed83faf7b810aed288fe4dafcf58c87fdadb1873974abfefaabe76515bc86c912b' +
    'a0d2db5f2827a8e8fb324f5930ac801b01cc61d21e637fdd532102faf9474bbeb3a2db504639e232733813c256e678db' +
    'dd281f78f2aeab4a9c907945c7744dfb593307376fc6a4e8c8169e857c6a148c9491e5ca976ad6ba7e9bfd0da0b5317e' +
    'e588d765fb239e56af805a21c7a128bc01002e794ab0f3636c3d3365fccc22d99f6548abe9149d52427e4f7716c32bc6' +
    'fa750f87475336b62a13ceb4e1542c7c94b21d416ed79d2289bd15899df25b836a429a95992e4502fc07dd3cbbc19e97' +
    '3fdb9a00e59c624830686a2f44ae6e8998408938b90608e7bb2aabf8892ec14ebdd978313d74e6686a188cb8cc009670' +
    'dd488c239ecd6f9a2632d13499b7444d066b1451ac232f3d06baf3088d428c8648198a6e64d6327a792bef5b364b93dd' +
    '2e6eab3aed8356d9222f20a708785a71341a07607222cffa47d5dbb0b410312df44b93235ac5dfa0e81b7442f932361d' +
    '8c46baefaeacfd283ae5c5409e1385359289b828c28041621bd1a571bd9b77360a899d71b13fe9273f736bb87b32f786' +
    '53be9bd9847a85817d3c172b6facb587891db001b06f2444d75f3d8e99bd00e4c3e23102ee79163523d5270da6d3e5e1' +
    '0922f6bffd6b8baabaad8cbaa70047350b23095cb51cb8bc29aa53325e6555afad79ca43ce00bf6f730130fb020c2038' +
    '9655086615974df35bda858c734766a6859825da8d275061621a60d72fce69cee43c1b8ddba365b03b88ebed4c14db51' +
    '433d08fa8f2adcd3227ed24ae842f3e3800c8df257277154543b5a9bb90bcc2835e58640a036a46b3a3a461cc431e5b8' +
    'afdcc2f6d5ef3e590abae887da6e718b6e4062c11617a49f8dfbc97916b554406efc2687c7e02d163cbbb484053d5173' +
    'a28f5c157a8331e6d6f6647bdf454d4f3c9b954f42e4d3955302c80ab4a771d7b5b6ffd7fd0117087bfd712c35eda8d7' +
    'ea6b65f91b67a59de6a7c87afcad08e3c2c1a0fc0a515fad4593cdb5d667ef27be4670497143a4cfb7a0f92a57283234' +
    'a582e6ede75f5d49e161e01e92350c92d01f04fa26102b1870ef89d840e5c3af739fba4c2565b670a50e091ff59e4aca' +
    '3d150ab1f9420260de2e43ffc718a283d67decadc4ae0b6a23f1bcbbb1e4f16f7064b29bc4f978851f4789f39146c287' +
    '3711ad5bf205cc36a6c8d599d5286c64a2760d2a394bcf64b0f957c5da0a1dc22609cae95d6faf77d98a22ddcb23e5d7' +
    'c6f7a2552c333fa79ceb24de21825e7bbd4ee948b97c5860cb8fac456742f1669cbfd06da5878fd803158bda47f197c3' +
    '6d59f163d9eb2faaef291a14537f2ab80a2524cd5de8d9f0b58bd750b314f7f5b20c62003b2823d05bee46df2de95630' +
    '84827e81f47c242d34fe0eedf23a0f9db3ca24a14593e7f7f64ef60daf104d41797c02e07e27b0090d82931c673b38f0' +
    '7d8af2a4d6b19fb3fdcf7023713fa58a715590d65b15dcd2d5a3f508cacaa1055c6aabfe7cacbd95cdb5ea4b15f1dda6' +
    '81e25cf69f066c8ff7e123be3179cae360b023fcd3aa4f9c19156c6db23fb71bf32ef90f64228de8032abdf6c7f2cc5d' +
    'a42d925f40b3f35e792f0185ba368b46fccd09ec1a6b7b871dd568962f565d1367c995f6e6441f72ca980a346a7cef87' +
    '099c1c2a2ab8955f3ae425859115b59cfda13fa4d716d4fac7134ae2493e41651bfebfc9f57222910652bbb5328a7800' +
    'ade26099909ed6f4727995c70b1a1259a2304660376edd95c70c120e9bf348cea49e99ffd37ef7cd15d9714093118ebd' +
    '33508ccbf848c8c477475b2c61eec995cb71a0f50d2e729ff5109ea79d4b65f9e9abb81fc26e1de2e4d4554d55d85594' +
    '2e69eb29405bc6905b06f30db9e4f4ca87d2a2aaed17e3ef71cdbf47e31c5bff17d0dfa5aad621d6c3e905a9af5b1476' +
    'd52834128a550177b7ac00abfd7b06f83056428e4894f99e7ecbef69b0a4334a0ba7571807cd97778c37f408a750d288' +
    '52b2f8cd1199eb5ec954651922446c78832b13512022ffa0cfdd327746ee4ed72207f79525b22aa4d712e9d592f856ab' +
    'e4e29402d1bd743bf31bc37335b78af675204fa01abb4a0b4122b4b7478e7403fa051d18eaae8d1279b735fc5314b3ea' +
    'eea700a027a169009343e70df824dabf5848f89dd84ab9c77df16023850acaf98304611bb07485615c094126c9704316' +
    '0e36f048381a744e58b6e81dfbf835d16fe7a70dc5664ea497e5aab012fc56f75ce7a5aa98c507c8b02b7eb0f23a87dc' +
    'f5da24d9e8271dbb6ec0bbbd2a3e7c373e02a658488ef0a17fd1b422fbfc75d11c0690fe18e36c9e0005d1756bcf8062' +
    '28ae11afa61733c8c5242da844d50d541e54b6305fb4df2ede13222278cf3eeffd3102a16a4c73f4bc0ddd228cb1468b' +
    'b735a860a13ad8936d188bc2474cb985008d8fd28d124e15f225e205dbe6cb9853673e247abd0f1849a38bec448eecf4' +
    '8162751c75ba639a075d1385e5a17c2d1cee3808e3e5a4e7f2526caed37e107bf7654fe10f879045c4a3bcb026f9d57a' +
    'c8bc67d5564d4d15adc36c2294e25614e92103c1a3969dc8611efac25f960d3ab0f68ed7ad731ccbf049d8ad36cd607e' +
    '71626a181d06df21e47771ff26ac8d057c194d260eab9c5c083aa85d5dda1174aa5e6dd3f5b77bbac2fe41257bc508cd' +
    '6e721374fd05189bc627d8c8d1952f7ef55f317b5565de1e8936033dcbc04f5e5c9f30fdf4234989dfcdcb6e3bdb5d98' +
    'bd5de47cd674a987ebe1ef8f1913593bf2e80eb80cdbb7edaf7ddf620a07aa0b60943436609694f0922ea7fe59dfeb4c' +
    'bee2547f7c4a552db3fea9524a46990c8e8753c86b25b8f3b8636b7c07df282557810ba98304ebc1b706e8506249c766' +
    '0fb5c532ec0ddfca24cb8bf6181bd1f9f8dff933f803986c3a8f0f38a7ee8328a23a60475846fab3faadf670f4a9bac5' +
    '093c1d08d4eec8ba6765eabcd8e613ae73205cd6d7273d4516f8c1b4847fa621c0f1b4ce53aabb692c79f03906af6520' +
    'f5dca562abba2c0fc5920e5d305cb043a2baf8c4263bb58b1b92087586bd1b94840c71c516301ebaac066ac9c763b2b9' +
    'dea0ec58cf3e531234c0c2e4fd37811c9bc1ba57af67d640389bc5ab85f478b2eced8c708eb93cbdda4fb995fc68cc72' +
    'becc0e0cec62f821b54f46cb20ae9d55eb76c3dda00ea140753550d8d70bae0729a66f3971d74a16316ec23464fe5507' +
    '75cbb8223049d3c2b68e3e318a535f3b76f9c365367eff79ad1695e4565abd0a9f38c843dcefc9d8c32095706ed9f421' +
    '778a2d04a0153868f8bea05e8bafa42cd525da06b2272843a00b40f1614497f81827a5d76901aaa781e04fe5657ab6a1' +
    'fbce2e04e9f81cc32cf86a7b535c527e52c0f8df7e9805b44e887c422dd8a6fb6e83d883efec68a14814d7a703286002' +
    'efc2cf459a7cff8b146a23933e15';

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
  let hasCastCelebrate = false;
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
      hasCastCelebrate = true;
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
    btnSnitch.addEventListener('click', handleCatchSnitch);
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

  window.addEventListener('resize', () => {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
    if (fxCanvas) {
      fxCanvas.width = cw;
      fxCanvas.height = ch;
    }
  });

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
