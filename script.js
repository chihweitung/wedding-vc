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

  // ============================================================================
  // 1. 基本設定：目標時間、新人影片網址、雙語介面字典、以及「暖身題 + 10 題問答」題目庫
  // ============================================================================
  const REAL_TARGET_ISO = '2026-11-29T12:30:00+08:00';
  const REAL_TARGET_TIMESTAMP = new Date(REAL_TARGET_ISO).getTime();

  // 新人影片網址（當您提供正式的 YouTube 或 Instagram 連結時，直接替換此處即可）
  const WEDDING_VIDEO_URL = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';

  // Google Photos 婚禮現場共享相簿連結（賓客上傳與瀏覽當日照片）
  const GOOGLE_PHOTOS_SHARE_URL = 'https://photos.google.com/';

  // Google Photos 新人過去回憶相簿連結（2014–2026 歲月寫真完整相簿）
  const GOOGLE_PHOTOS_MEMORIES_URL = 'https://photos.google.com/';

  /**
   * 過去照片（9 張回憶卡片）的 Google Photos 連結設定：
   * - 可直接填入 Google Photos 圖片網址（在 Google 相簿照片上按右鍵「複製圖片位址」，開頭為 https://lh3.googleusercontent.com/...）即可直接嵌入照片顯示！
   * - 也可填入 Google Photos 分享連結（https://photos.app.goo.gl/... 或 https://photos.google.com/...），或同時填入 { imageUrl: '...', googlePhotosUrl: '...' }
   */
  const PAST_PHOTOS_GOOGLE_LINKS = [
    { imageUrl: '', googlePhotosUrl: '' }, // 1. 2014 · Dcard 上的初次相遇
    { imageUrl: '', googlePhotosUrl: '' }, // 2. 2015–2016 · 關渡與北藝大鷺鷥草原散步
    { imageUrl: '', googlePhotosUrl: '' }, // 3. 2017 · 學生時代的畢業與小旅行
    { imageUrl: '', googlePhotosUrl: '' }, // 4. 2018–2020 · 德國柏林工作 ＆ 英國諾丁漢留學
    { imageUrl: '', googlePhotosUrl: '' }, // 5. 2020–2021 · 重聚台灣與日常小確幸
    { imageUrl: '', googlePhotosUrl: '' }, // 6. 2022–2024 · Google BMC Team 與世界旅行
    { imageUrl: '', googlePhotosUrl: '' }, // 7. 2025 · 求婚成功 · 邁向人生下一站
    { imageUrl: '', googlePhotosUrl: '' }, // 8. 2026.09 · 奧地利浪漫蜜月之旅
    { imageUrl: '', googlePhotosUrl: '' }, // 9. 2026.11.29 · 我們結婚了！
  ];

  // 婚宴座位表與菜單的 Google Photos / 圖片連結（若填入圖片網址會直接顯示於頁面頂部，填入分享連結會顯示開啟按鈕）
  const SEATING_CHART_IMAGE_URL = 'seating-chart.jpg?v=20261109a';
  const SEATING_CHART_LINK_URL = 'seating-chart.jpg?v=20261109a';
  const WEDDING_MENU_IMAGE_URL = '';
  const WEDDING_MENU_LINK_URL = '';

  // 雙語介面文字設定 (繁體中文 / English · 清新溫柔喜帖第一人稱口吻)
  const I18N = {
    zh: {
      pageTitle: 'Tom & Eunice · 2026.11.29 婚禮邀請',
      langBtnLabel: 'EN',
      langBtnTitle: '切換為英文 / Switch to English',
      themeBtnTitle: '切換日夜色調',
      fullscreenBtnTitle: '全螢幕檢視',
      bgmPlayTitle: '播放 33⅓ 黑膠圓舞曲 ·《藍色多瑙河》',
      bgmPauseTitle: '暫停 33⅓ 黑膠圓舞曲 ·《藍色多瑙河》',
      eyebrowCountdown: '2014 — 2026 · 婚禮邀請',
      eyebrowTimeUp: '2026.11.29 · 謝謝今天來見我們的你',
      eventTitle: '走過十二年四季，想邀請你來參與我們最重要的一天',
      targetSubtitle: '2026 年 11 月 29 日（日）中午 12:30 · 陽明山美軍俱樂部 Brick Yard 33 1/3',
      labelDays: '天',
      labelHours: '時',
      labelMinutes: '分',
      labelSeconds: '秒',
      loveNoteParts: {
        prefix: '從 2014.02.28 的台北走到今天，我們已經並肩走過 ',
        mid: ' 個日子、跨越最遠 ',
        km: '13,877',
        suffix: ' 公里的時差——這一次，想在陽明山的紅磚與微風裡，和最重要的你好好聚一聚。',
      },
      loveSignature: 'With love, Tom & Eunice · 33⅓ RPM',
      videoCardEyebrow: 'Our Wedding Film',
      videoCardTitle: '我們的影片',
      videoCardDesc: '把十二年來的日常、旅行與笑聲剪進這支影片裡，想和你一起看。',
      videoCardCta: '播放我們的影片',
      quizCardEyebrow: '11 Little Stories',
      quizCardTitle: '關於我們的小默契',
      quizCardDesc: '十一個藏在生活裡的小故事，猜猜看你對新郎還是新娘比較熟？',
      quizCardCta: '來玩小默契問答',
      shareCardEyebrow: 'Through Your Lens',
      shareCardTitle: '幫我們留下今天',
      shareCardDesc: '如果你今天拍到了喜歡的照片或可愛瞬間，歡迎傳進相簿和我們一起收藏。',
      shareCardCta: '打開共享相簿',
      galleryCardEyebrow: '2014 — 2026',
      galleryCardTitle: '我們的舊照片',
      galleryCardDesc: '從校園草原散步、跨洲遠距到決定成家，翻翻這些年留下的合照。',
      galleryCardCta: '翻閱舊照片',
      footprintsCardEyebrow: 'Across the Miles',
      footprintsCardTitle: '十二年足跡地圖',
      footprintsCardDesc: '把我們住過的城市與 9,100 公里的思念，畫成一張會動的地圖。',
      footprintsCardCta: '看看我們的地圖',
      seatingCardEyebrow: 'Table & Floor Plan',
      seatingCardTitle: '婚宴座位表',
      seatingCardDesc: '輸入你的名字或親友群組，看看今天坐在美軍俱樂部的哪一區。',
      seatingCardCta: '查詢桌次與座位圖',
      menuCardEyebrow: 'Banquet & Cocktails',
      menuCardTitle: '婚宴佳餚與調酒',
      menuCardDesc: '先偷看一下今天的現切爐烤牛排、百匯料理，還有 Bartender 現調特調。',
      menuCardCta: '看看今天的菜單',
      tabBackHub: '← 返回主選單',
      tabBackCountdown: '← 返回喜帖首頁',
      tabVideo: '我們的影片',
      tabQuiz: '小默契問答',
      tabSeating: '座位表',
      tabMenu: '婚宴菜單',
      tabShare: '分享照片',
      tabGallery: '舊照片',
      tabFootprints: '十二年足跡',
      seatingPanelEyebrow: 'Brick Yard 33 1/3 · Floor Plan',
      seatingPanelTitle: '美軍俱樂部 · 婚宴座位表',
      seatingExternalBtn: '開啟完整座位圖 ↗',
      seatingSearchPlaceholder: '輸入名字或親友分類（例如：北藝、交大、謀智、瑪黑、Google、親戚）...',
      menuPanelEyebrow: 'Brick Yard 33 1/3 · Banquet & Bar',
      menuPanelTitle: '美軍俱樂部 · 百匯佳餚與特調菜單',
      menuExternalBtn: '開啟完整菜單相片 ↗',
      menuNoteText: '迎賓小提醒：戶外備有「雞尾酒點心吧」，吧台也為每位賓客準備了一杯「Bartender 現調調酒」；自助百匯區提供現切爐烤曼哈頓牛排、海陸熱饌與法式甜點（皆已標註素食／蛋奶素／含酒精），請慢慢享用！',
      viewGooglePhotoBtn: '在 Google Photos 查看相片 ↗',
      sharePanelEyebrow: 'Shared Wedding Album',
      sharePanelTitle: '你鏡頭下的 Tom & Eunice',
      sharePanelDesc: '今天在現場拍下的照片或小短片，都很歡迎傳進這本 Google Photos 相簿，讓我們也能看見你眼裡的這一天。',
      shareStep1: '1. 點選下方按鈕打開 Google Photos 共享相簿',
      shareStep2: '2. 按一下「新增相片」就能直接上傳分享',
      shareLinkBtn: '打開婚禮 Google Photos 相簿 ↗',
      galleryPanelEyebrow: '2014 — 2026 · Through the Years',
      galleryPanelTitle: '我們的舊照片',
      galleryAlbumLinkBtn: '打開完整 Google 相簿 ↗',
      eraAll: '全部年份 (2014–2026)',
      era2014: '2014–2017 初識與校園',
      era2018: '2018–2021 跨洲遠距離',
      era2022: '2022–2026 回到同一座城市',
      footprintsPanelEyebrow: '2014 — 2026 · Across the Miles',
      footprintsPanelTitle: '十二年相戀足跡',
      footprintStatsText: '🤵‍♂️ Tom（藍線）· 👰‍♀️ Eunice（粉線）· 最遠相隔 13,877 km（奧蘭多 ↔ 高雄）· 跨洲遠距 9,100 km（柏林 ↔ 高雄）',
      footprintTrackTom: '🤵‍♂️ Tom Tung · 台北 ➔ 新竹 ➔ 柏林 ➔ 板橋 ➔ 台北',
      footprintTrackEunice: '👰‍♀️ Eunice Hsiao · 高雄 ➔ 諾丁漢 ➔ 高雄 ➔ 板橋 ➔ 台北',
      yearAll: '全部足跡',
      openMapBtn: '在 Google Maps 查看地點 ↗',
      timelinePlayBtn: '▶ 播放足跡動畫',
      timelinePauseBtn: '⏸ 暫停播放',
      timelinePrevBtn: '⏮ 上一站',
      timelineNextBtn: '⏭ 下一站',
      timelinePrevTitle: '上一站',
      timelineNextTitle: '下一站',
      timelineSpeedTitle: '調整播放速度',
      timelineReplayBtn: '↺ 重播',
      timelineExportBtn: '下載紀念影片',
      timelineExportingBtn: '正在錄製影片中...',
      mediaBadgeYoutube: 'Our Wedding Film · 我們的影片',
      mediaBadgeShorts: 'YouTube Shorts · 我們的影片',
      mediaBadgeIgReel: 'Instagram Reel · 我們的影片',
      mediaBadgeIg: 'Instagram · 我們的影片',
      scoreBadge: (score, total) => `目前默契：${score} / ${total}`,
      correctHeadline: (label, text) => `答對了 · 正確答案是 (${label}) ${text}`,
      wrongHeadline: (label, text) => `差一點點 · 正確答案是 (${label}) ${text}`,
      nextBtn: '下一題 →',
      finishBtn: '看看最後結果',
      quizCompletedEyebrow: 'Thank You for Playing',
      quizSummaryTitle: '謝謝你陪我們玩到最後！',
      restartBtn: '再玩一次',
      toVideoBtn: '去看我們的影片',
      clockCaption: '陽明山美軍俱樂部 · 台灣時間',
      celebrateBtn: '🌸 輕灑花瓣祝福',
    },
    en: {
      pageTitle: 'Tom & Eunice · Nov 29, 2026 Wedding Invitation',
      langBtnLabel: '中文',
      langBtnTitle: 'Switch to Traditional Chinese / 切換中文',
      themeBtnTitle: 'Toggle Light / Dark Palette',
      fullscreenBtnTitle: 'Toggle Fullscreen',
      bgmPlayTitle: 'Play 33⅓ RPM Vinyl Waltz · The Blue Danube',
      bgmPauseTitle: 'Pause 33⅓ RPM Vinyl Waltz · The Blue Danube',
      eyebrowCountdown: '2014 — 2026 · Wedding Invitation',
      eyebrowTimeUp: 'Nov 29, 2026 · So Happy You Are Here With Us',
      eventTitle: 'Twelve years of seasons together — we’d love for you to celebrate this day with us',
      targetSubtitle: 'Sunday, November 29, 2026 · 12:30 PM · Brick Yard 33 1/3, Yangmingshan, Taipei',
      labelDays: 'Days',
      labelHours: 'Hours',
      labelMinutes: 'Mins',
      labelSeconds: 'Secs',
      loveNoteParts: {
        prefix: 'Since February 28, 2014 in Taipei, we have walked through ',
        mid: ' days side by side and bridged ',
        km: '13,877',
        suffix: ' km across time zones — now, we can’t wait to gather with you among the red bricks and mountain breeze of Yangmingshan.',
      },
      loveSignature: 'With love, Tom & Eunice · 33⅓ RPM',
      videoCardEyebrow: 'Our Wedding Film',
      videoCardTitle: 'Our Film',
      videoCardDesc: 'Twelve years of everyday moments, travels, and laughter gathered into one film for you.',
      videoCardCta: 'Watch Our Film',
      quizCardEyebrow: '11 Little Stories',
      quizCardTitle: 'How Well Do You Know Us?',
      quizCardDesc: 'Eleven little stories from our life together — see whose side you know best.',
      quizCardCta: 'Play the Quiz',
      shareCardEyebrow: 'Through Your Lens',
      shareCardTitle: 'Capture Today With Us',
      shareCardDesc: 'Snapped a favorite photo or candid moment today? Drop it into our shared album so we can treasure it too.',
      shareCardCta: 'Open Shared Album',
      galleryCardEyebrow: '2014 — 2026',
      galleryCardTitle: 'Our Old Photos',
      galleryCardDesc: 'From campus walks and long-distance flights to coming home to the same city.',
      galleryCardCta: 'Browse Photos',
      footprintsCardEyebrow: 'Across the Miles',
      footprintsCardTitle: 'Twelve Years on the Map',
      footprintsCardDesc: 'Every city we lived in and every flight that closed the 9,100 km between us.',
      footprintsCardCta: 'Explore Our Map',
      seatingCardEyebrow: 'Table & Floor Plan',
      seatingCardTitle: 'Seating Chart',
      seatingCardDesc: 'Look up your name or group to find your table zone at Brick Yard 33 1/3.',
      seatingCardCta: 'Find Your Seat',
      menuCardEyebrow: 'Banquet & Cocktails',
      menuCardTitle: 'Menu & Cocktails',
      menuCardDesc: 'A peek at today’s carved roast steak, buffet stations, and Bartender cocktails.',
      menuCardCta: 'View Buffet Menu',
      tabBackHub: '← Back to Menu',
      tabBackCountdown: '← Back to Invitation',
      tabVideo: 'Our Film',
      tabQuiz: 'Couple Quiz',
      tabSeating: 'Seating',
      tabMenu: 'Menu',
      tabShare: 'Share Photos',
      tabGallery: 'Old Photos',
      tabFootprints: 'Our Map',
      seatingPanelEyebrow: 'Brick Yard 33 1/3 · Floor Plan',
      seatingPanelTitle: 'Brick Yard 33 1/3 · Seating Chart',
      seatingExternalBtn: 'Open Full Floor Plan ↗',
      seatingSearchPlaceholder: 'Search your name or group (e.g., TNUA, NCTU, Mozilla, Marais, Google)...',
      menuPanelEyebrow: 'Brick Yard 33 1/3 · Banquet & Bar',
      menuPanelTitle: 'Brick Yard 33 1/3 · Banquet & Cocktail Menu',
      menuExternalBtn: 'Open Full Menu Photo ↗',
      menuNoteText: 'Welcome Treats: Enjoy our Outdoor Cocktail & Canapé Bar plus one handcrafted Bartender cocktail per guest, alongside carved Manhattan steak, hot entrées & French patisserie (vegetarian, ovo-lacto vegetarian & alcohol-containing dishes are labeled).',
      viewGooglePhotoBtn: 'View on Google Photos ↗',
      sharePanelEyebrow: 'Shared Wedding Album',
      sharePanelTitle: 'Tom & Eunice Through Your Lens',
      sharePanelDesc: 'We would love to see today through your eyes — feel free to upload any photos or clips you captured to our shared Google Photos album.',
      shareStep1: '1. Tap the button below to open our Google Photos album',
      shareStep2: '2. Select "Add photos" to share your favorite shots',
      shareLinkBtn: 'Open Shared Google Photos Album ↗',
      galleryPanelEyebrow: '2014 — 2026 · Through the Years',
      galleryPanelTitle: 'Our Old Photos',
      galleryAlbumLinkBtn: 'Open Full Google Photos Album ↗',
      eraAll: 'All Years (2014–2026)',
      era2014: '2014–2017 Campus Days',
      era2018: '2018–2021 Across Time Zones',
      era2022: '2022–2026 Same City Again',
      footprintsPanelEyebrow: '2014 — 2026 · Across the Miles',
      footprintsPanelTitle: 'Twelve Years on the Map',
      footprintStatsText: '🤵‍♂️ Tom (Blue) · 👰‍♀️ Eunice (Rose) · Furthest Apart: 13,877 km (Orlando ↔ Kaohsiung) · Long-Distance Home: 9,100 km (Berlin ↔ Kaohsiung)',
      footprintTrackTom: '🤵‍♂️ Tom Tung · Taipei ➔ Hsinchu ➔ Berlin ➔ Banqiao ➔ Taipei',
      footprintTrackEunice: '👰‍♀️ Eunice Hsiao · Kaohsiung ➔ Nottingham ➔ Kaohsiung ➔ Banqiao ➔ Taipei',
      yearAll: 'All Stops',
      openMapBtn: 'View on Google Maps ↗',
      timelinePlayBtn: '▶ Play Journey',
      timelinePauseBtn: '⏸ Pause',
      timelinePrevBtn: '⏮ Prev',
      timelineNextBtn: '⏭ Next',
      timelinePrevTitle: 'Previous Stop',
      timelineNextTitle: 'Next Stop',
      timelineSpeedTitle: 'Playback Speed',
      timelineReplayBtn: '↺ Replay',
      timelineExportBtn: 'Save Keepsake Video',
      timelineExportingBtn: 'Recording Video...',
      mediaBadgeYoutube: 'Our Wedding Film',
      mediaBadgeShorts: 'YouTube Shorts · Our Film',
      mediaBadgeIgReel: 'Instagram Reel · Our Film',
      mediaBadgeIg: 'Instagram · Our Film',
      scoreBadge: (score, total) => `Score: ${score} / ${total}`,
      correctHeadline: (label, text) => `Spot on · The answer is (${label}) ${text}`,
      wrongHeadline: (label, text) => `So close · The answer is (${label}) ${text}`,
      nextBtn: 'Next Story →',
      finishBtn: 'See Final Result',
      quizCompletedEyebrow: 'Thank You for Playing',
      quizSummaryTitle: 'Thank You for Playing Along!',
      restartBtn: 'Play Again',
      toVideoBtn: 'Watch Our Film',
      clockCaption: 'Brick Yard 33 1/3 · Taipei Time',
      celebrateBtn: '🌸 Shower With Petals',
    },
  };

  /**
   * 「了解新人」題目庫：包含 1 題暖身題 + 10 題正式題（中英雙語）
   * 題目已穿插排列（共同 / 新娘 / 新郎 交錯），且每次開始測驗時選項順序皆會隨機洗牌！
   */
  const QUIZ_QUESTIONS = [
    {
      category: 'both',
      badge: {
        zh: 'WARM-UP · 暖身題',
        en: 'WARM-UP QUESTION',
      },
      question: {
        zh: '【暖身題】請問 Tom 加 Eunice 兩人中文名字的「總筆畫數」加起來總共是幾畫？',
        en: '[Warm-up] What is the combined total stroke count of Tom and Eunice’s Chinese names?',
      },
      optionIcons: ['stroke-72', 'stroke-77', 'stroke-68', 'stroke-82'],
      options: {
        zh: ['72 畫', '77 畫', '68 畫', '82 畫'],
        en: ['72 strokes', '77 strokes', '68 strokes', '82 strokes'],
      },
      answerIndex: 1,
      optionExplanations: {
        zh: [
          '差一點點！少了 5 畫，是不是把草字頭或玉字旁算少筆畫啦？其實 Tom「董智瑋」（13+12+13=38 畫）加上 Eunice「蕭睦宸」（16+13+10=39 畫），兩人合起來總共是「77 畫」（幸運雙七／Lucky Double Seven）喔！',
          '算數大師是你！連這麼多筆畫都算得一字不差！Tom「董智瑋」：董(13)+智(12)+瑋(13)=38 畫；Eunice「蕭睦宸」：蕭(16)+睦(13)+宸(10)=39 畫，兩人合起來剛好是超幸運的「77 畫」喔！',
          '68 畫太省筆墨啦！「董」跟「蕭」兩個大姓氏光草字頭筆畫就超豐富！實際上 Tom「董智瑋」（38 畫）加上 Eunice「蕭睦宸」（39 畫），兩人合起來總共是「77 畫」喔！',
          '82 畫超過啦！看來手寫的時候多幫我們加了幾筆愛心！實際上 Tom「董智瑋」（13+12+13=38 畫）加上 Eunice「蕭睦宸」（16+13+10=39 畫），合起來總共是「77 畫」喔！',
        ],
        en: [
          'So close—just 5 strokes short! Did the grass or jade radicals trip you up? Tom (董智瑋: 13+12+13 = 38) + Eunice (蕭睦宸: 16+13+10 = 39) actually add up to a lucky 77 strokes!',
          'Spot on! You actually counted every stroke right! Tom (董智瑋: 13+12+13 = 38 strokes) + Eunice (蕭睦宸: 16+13+10 = 39 strokes) = a lucky 77 strokes in total!',
          '68 strokes is a bit too thrifty with the ink! Both "董" and "蕭" are stroke-heavy characters—Tom (38 strokes) + Eunice (39 strokes) actually total 77 strokes!',
          '82 strokes is a little generous—did you draw extra hearts on top? Tom (董智瑋: 38 strokes) + Eunice (蕭睦宸: 39 strokes) actually add up to 77 strokes in total!',
        ],
      },
    },
    {
      category: 'both',
      badge: {
        zh: 'QUESTION 01 / 10',
        en: 'QUESTION 01 / 10',
      },
      question: {
        zh: 'Q1. 請問我們是在哪邊認識的？',
        en: 'Q1. Where did Tom and Eunice first meet each other?',
      },
      optionIcons: ['ptt', 'threads', 'dcard', 'club'],
      options: {
        zh: ['PTT', 'Threads', 'Dcard', '社團活動'],
        en: ['PTT', 'Threads', 'Dcard', 'Club Activity'],
      },
      answerIndex: 2,
      optionExplanations: {
        zh: [
          '「請問有沒有 Tom 跟 Eunice 在哪裡認識的八卦？」不是在批踢踢 O2 聯誼板啦！我們其實是在大學生最熟悉的「Dcard」上認識彼此，進而牽起這段一輩子的緣分喔！',
          '那時候祖克柏還沒發明 Threads（脆）呢！我們早在 2014 年就相遇了，當時是在「Dcard」上認識彼此，一路走過 12 年直到今天步入禮堂喔！',
          '沒錯！就是午夜十二點抽卡的「Dcard」！沒想到當年從 Dcard 牽起的奇妙緣分，讓我們一路相伴走過 12 個年頭，成為彼此一輩子的伴侶！',
          '聽起來很像青春校園偶像劇的社團邂逅，不過我們連大學都不同校啦！我們其實是在「Dcard」上認識彼此的，沒想到一聊就是一輩子！',
        ],
        en: [
          '"Any gossip on how Tom & Eunice met?" Not on PTT BBS! We actually met on "Dcard" back in our college days, sparking a lifelong bond!',
          'Zuckerberg hadn’t even invented Threads back when we met in 2014! We actually met on "Dcard" and have been together for 12 wonderful years!',
          'Bingo! It was "Dcard"! Who knew a serendipitous match on Dcard would blossom into 12 years of love and a lifetime together!',
          'That sounds like a classic campus rom-com, but we went to different universities! We actually met on "Dcard"—and ended up chatting for a lifetime!',
        ],
      },
    },
    {
      category: 'bride',
      badge: {
        zh: 'QUESTION 02 / 10',
        en: 'QUESTION 02 / 10',
      },
      question: {
        zh: 'Q2. 請問新娘 Eunice 高中的吉祥物是什麼？',
        en: 'Q2. What was the mascot of the bride (Eunice)’s high school?',
      },
      optionIcons: ['animal-pikachu', 'animal-capybara', 'animal-giraffe', 'animal-zebra'],
      options: {
        zh: ['皮卡丘', '水豚', '長頸鹿', '斑馬'],
        en: ['Pikachu (皮卡丘)', 'Capybara (水豚)', 'Giraffe (長頸鹿)', 'Zebra (斑馬)'],
      },
      answerIndex: 3,
      optionExplanations: {
        zh: [
          '皮卡皮卡⚡！雖然新娘本人跟皮卡丘一樣可愛，但高中制服不是鮮黃色的啦！Eunice 高中讀的是「高雄女中（雄女）」，經典的黑白配色制服讓雄女最有名的代表吉祥物就是「斑馬」喔！',
          '卡皮巴拉～頂著橘子泡溫泉的水豚君雖然超療癒，但不是高中吉祥物啦！Eunice 高中讀的是「高雄女中（雄女）」，因為黑白制服配色的關係，雄女的代表吉祥物是「斑馬」喔！',
          '脖子伸得長長的～難道是在偷看隔壁班「帥姐」嗎？（畢竟雄女隔壁班只有帥姐沒有帥哥啦！）不是長頸鹿喔！Eunice 高中讀的是「高雄女中（雄女）」，經典的黑白配色制服讓雄女最有名的代表吉祥物就是「斑馬」喔！',
          '內行人一秒答對！因為 Eunice 高中讀的是「高雄女中（雄女）」，白衣黑裙的經典黑白配色制服，讓雄女人最引以為傲的代表吉祥物就是「斑馬」喔！',
        ],
        en: [
          'Pika Pika ⚡! As cute as Pikachu is, Eunice’s high school uniform wasn’t bright yellow! She graduated from Kaohsiung Girls’ Senior High School (高雄女中), whose black-and-white uniform earned the mascot "Zebra (斑馬)"!',
          'Capybaras soaking in hot springs are adorable, but not her high school mascot! Eunice graduated from Kaohsiung Girls’ Senior High School (高雄女中), famously represented by the "Zebra (斑馬)" for its black-and-white uniform!',
          'Stretching your neck like a giraffe to peek at the cool senpais next door? (Since it’s an all-girls school, there were only handsome girls next door, no guys!) Eunice graduated from Kaohsiung Girls’ Senior High School (高雄女中), whose black-and-white uniform earned the mascot "Zebra (斑馬)"!',
          'Spot on! Because Eunice graduated from Kaohsiung Girls’ Senior High School (KGHS / 高雄女中), its iconic black-and-white uniform made the "Zebra (斑馬)" its most famous mascot!',
        ],
      },
    },
    {
      category: 'groom',
      badge: {
        zh: 'QUESTION 03 / 10',
        en: 'QUESTION 03 / 10',
      },
      question: {
        zh: 'Q3. 請問新郎 Tom 任職公司的正式台灣登記名稱是哪一個？',
        en: 'Q3. What is the official registered Taiwan entity name of the company where the groom (Tom) works?',
      },
      optionIcons: ['corp-guge', 'corp-kegao-infra', 'corp-guge-infra', 'corp-kegao'],
      options: {
        zh: [
          '台灣谷歌有限公司',
          '台灣科高基礎建設有限公司',
          '台灣谷歌基礎建設有限公司',
          '台灣科高有限公司',
        ],
        en: [
          '台灣谷歌有限公司 (Taiwan Gu-Ge Co., Ltd.)',
          '台灣科高基礎建設有限公司 (Taiwan Ke-Gao Infrastructure Co., Ltd.)',
          '台灣谷歌基礎建設有限公司 (Taiwan Gu-Ge Infrastructure Co., Ltd.)',
          '台灣科高有限公司 (Taiwan Ke-Gao Co., Ltd.)',
        ],
      },
      answerIndex: 1,
      optionExplanations: {
        zh: [
          '大家平常都叫它「谷歌」，但經濟部商業司登記的名字裡其實沒有「谷歌」兩個字喔！Tom 任職實體的正式台灣登記名稱是「台灣科高基礎建設有限公司」！',
          '太專業了吧！連統編等級的冷知識都難不倒你！沒錯，Tom 在台灣任職公司的正式登記名稱正是「台灣科高基礎建設有限公司」喔！',
          '「基礎建設」四個字抓對了，但前面不是「谷歌」喔！Google 在台灣的音譯登記是「科高」，所以 Tom 任職的正式公司名稱是「台灣科高基礎建設有限公司」！',
          '超接近！已經知道「科高」這個內行關鍵字了！不過因為新郎屬於硬體與基礎架構相關體系，正式登記名稱還多了四個字，叫做「台灣科高基礎建設有限公司」喔！',
        ],
        en: [
          'Everyone calls it "Gu-Ge (谷歌)" in daily life, but its official Taiwan corporate registration doesn’t actually use "谷歌"! Tom’s registered company entity is "台灣科高基礎建設有限公司"!',
          'Impressive! You even know the official corporate registration trivia! Indeed, Tom’s exact registered company name in Taiwan is "台灣科高基礎建設有限公司"!',
          'You got the "基礎建設 (Infrastructure)" part right, but Google is transliterated as "科高 (Ke-Gao)" in Taiwan’s registry—so the official name is "台灣科高基礎建設有限公司"!',
          'So close! You knew the insider keyword "科高 (Ke-Gao)"! Since Tom works in hardware & infrastructure, the exact entity includes four more characters: "台灣科高基礎建設有限公司"!',
        ],
      },
    },
    {
      category: 'bride',
      badge: {
        zh: 'QUESTION 04 / 10',
        en: 'QUESTION 04 / 10',
      },
      question: {
        zh: 'Q4. 請問下面哪一個「不是」新娘 Eunice 大學校園裡校牛的名字？',
        en: 'Q4. Which of the following is NOT the name of an iconic campus cow at the bride (Eunice)’s university?',
      },
      optionIcons: ['cow-mecha', 'cow-cannon', 'cow-xiaoli', 'cow-ben'],
      options: {
        zh: ['奧米加咆哮獸', '阿姆斯特朗迴旋加速噴氣式阿姆斯特朗砲', '小麗', '犇爺'],
        en: [
          'OmniShoutmon (奧米加咆哮獸)',
          'Neo Armstrong Cyclone Jet Armstrong Cannon (阿姆斯特朗迴旋加速噴氣式阿姆斯特朗砲)',
          'Xiaoli (小麗)',
          'Master Ben (犇爺)',
        ],
      },
      answerIndex: 1,
      optionExplanations: {
        zh: [
          '你一定覺得「奧米加咆哮獸」聽起來太中二、絕對是瞎掰的對吧？結果它真的是北藝大校牛的名字（不愧是藝術大學的命名美學）！真正「不是」校牛名字的是《銀魂》裡的「阿姆斯特朗迴旋加速噴氣式阿姆斯特朗砲」啦！',
          '「這不是阿姆斯特朗迴旋加速噴氣式阿姆斯特朗砲嗎？還原度真高啊！」恭喜答對！這尊是《銀魂》裡的名產，不是校牛啦！Eunice 就讀的「北藝大」草原上真正的校牛叫做「小麗」、「奧米加咆哮獸」與「犇爺」喔！',
          '「小麗」可是北藝大鷺鷥草原上最溫柔的元老級大明星校牛喔！反而是聽起來超中二的「奧米加咆哮獸」跟「犇爺」也都是真牛真名，只有「阿姆斯特朗迴旋加速噴氣式阿姆斯特朗砲」不是校牛啦！',
          '「犇爺」（三個牛！）真的是北藝大校牛家族裡小牛的霸氣真名喔！北藝大草原上的校牛有「小麗」、「奧米加咆哮獸」和「犇爺」，只有「阿姆斯特朗迴旋加速噴氣式阿姆斯特朗砲」不是校牛名字啦！',
        ],
        en: [
          'You probably thought "OmniShoutmon (奧米加咆哮獸)" sounded way too anime to be a real cow’s name—but art school students really named a campus cow that! The fake one is Gintama’s "Neo Armstrong Cyclone Jet Armstrong Cannon"!',
          '"Isn’t that the Neo Armstrong Cyclone Jet Armstrong Cannon? Look how authentic it is!" Bingo! That’s from Gintama, not a cow! TNUA (北藝大)’s real campus cows are "小麗", "奧米加咆哮獸", and "犇爺"!',
          '"Xiaoli (小麗)" is actually the most famous veteran cow on TNUA’s lawn! Even "奧米加咆哮獸" and "犇爺" are real TNUA cows—only the "Neo Armstrong Cyclone Jet Armstrong Cannon" is NOT a campus cow!',
          '"Master Ben (犇爺)"—written with three cow characters (牛牛牛)—is genuinely the name of a calf at TNUA! Only the "Neo Armstrong Cyclone Jet Armstrong Cannon" is NOT one of Eunice’s campus cows!',
        ],
      },
    },
    {
      category: 'groom',
      isMultiCorrectCpp: true,
      badge: {
        zh: 'QUESTION 05 / 10',
        en: 'QUESTION 05 / 10',
      },
      question: {
        zh: 'Q5. 請看下方這段 C++ 程式碼，請問上面的程式有哪些問題？',
        en: 'Q5. Look at the C++ snippet below. What issues exist in the code above?',
      },
      code: [
        'class Wedding {',
        'public:',
        '    char* title;',
        '    Wedding(const char* src) {',
        '        title = new char[strlen(src)];',
        '        strcpy(title, src);',
        '    }',
        '    ~Wedding() { delete title; }',
        '};',
        '',
        'const int& getTableCount() {',
        '    int tables = 30;',
        '    return tables;',
        '}',
      ].join('\n'),
      optionIcons: ['cpp-overflow', 'cpp-compile', 'cpp-delete', 'cpp-dangling'],
      options: {
        zh: [
          'new char[strlen(src)] 少配置了 1 byte 給結尾字元 \'\\0\'，strcpy 會造成 Buffer Overflow',
          'C++ 的 class 內不能同時定義建構子與解構子，否則會導致 Compile Error（編譯錯誤）',
          '解構子使用 delete title; 而非 delete[] title;，與 new[] 不匹配會導致 Undefined Behavior',
          'getTableCount() 回傳了區域變數 tables 的 Reference，會造成 Dangling Reference（懸空參照）',
        ],
        en: [
          'new char[strlen(src)] forgets +1 byte for the null terminator \'\\0\', causing a buffer overflow in strcpy',
          'A C++ class cannot define both a constructor and a destructor at the same time (Compile Error)',
          '~Wedding() uses delete title; instead of delete[] title;, causing Undefined Behavior',
          'getTableCount() returns a reference to local variable tables, causing a dangling reference',
        ],
      },
      answerIndexes: [0, 2, 3],
      optionExplanations: {
        zh: [
          '資深 C++ 老司機！一眼就抓出 strlen(src) 不含結尾 \'\\0\'、需要 new char[strlen(src) + 1] 的經典 Heap Buffer Overflow！而且這段程式其實還藏了 delete 未加 [] 與回傳區域變數 Reference 共三個 Bug，只要沒選到「不能同時定義建構子與解構子」都算答對得分！',
          '抓到囉！如果 C++ class 不能同時有建構子跟解構子，全世界 C++ 工程師（包含新郎 Tom）都要原地失業啦！其實另外三個選項（少配 \'\\0\'、delete 沒加 []、回傳區域變數 Reference）全部都是真正存在的 C++ Bug 喔！',
          '火眼金睛！馬上抓到 new[] 必須配對 delete[]，只寫 delete title; 可是會觸發 Undefined Behavior 的！其實這段程式還同時藏了 strlen 少 +1 與 Dangling Reference 共三個經典 Bug，只要沒選到建構子與解構子那個陷阱題都算答對得分！',
          '太敏銳了！函數結束時 stack 上的區域變數 tables 就會被銷毀，回傳 const int& 直接變成 Dangling Reference（懸空參照）！而且這段程式裡另外兩個記憶體錯誤也都是真 Bug，只要沒選到「不能同時定義建構子與解構子」都算答對得分！',
        ],
        en: [
          'Sharp C++ eyes! You immediately spotted that strlen(src) omits the null terminator \'\\0\', causing a heap buffer overflow in strcpy! In fact, all three memory/lifetime bugs in the options are real—any choice except the constructor/destructor trap scores a point!',
          'Gotcha! If a C++ class couldn’t have both a constructor and a destructor, every C++ engineer (including Tom!) would be out of a job! The other three options (missing +1 for \'\\0\', mismatched delete, and dangling reference) are all real C++ bugs!',
          'Great catch! Pairing new[] with scalar delete instead of delete[] is classic Undefined Behavior! Along with the missing +1 byte for \'\\0\' and the dangling reference, all three bugs exist in this code—any choice except the constructor/destructor trap scores!',
          'Eagle-eyed! Returning a reference to stack-local variable tables creates an instant dangling reference once getTableCount() returns! Along with the two memory bugs in Wedding, all three are real issues—any choice except the trap option scores!',
        ],
      },
    },
    {
      category: 'both',
      badge: {
        zh: 'QUESTION 06 / 10',
        en: 'QUESTION 06 / 10',
      },
      question: {
        zh: 'Q6. 在 Tom & Eunice 交往期間，兩人「長時間最遠距離（不含出差）」是哪兩個城市之間的距離？',
        en: 'Q6. During Tom & Eunice’s relationship, what was the farthest long-term distance apart between them (excluding business trips)?',
      },
      optionIcons: ['dist-berlin', 'dist-taipei', 'dist-ny', 'dist-tokyo'],
      options: {
        zh: [
          '約 9,100 公里（柏林 ↔ 高雄）',
          '約 350 公里（台北 ↔ 高雄）',
          '約 12,500 公里（紐約 ↔ 台北）',
          '約 2,100 公里（東京 ↔ 台北）',
        ],
        en: [
          '~9,100 km (Berlin ↔ Kaohsiung)',
          '~350 km (Taipei ↔ Kaohsiung)',
          '~12,500 km (New York ↔ Taipei)',
          '~2,100 km (Tokyo ↔ Taipei)',
        ],
      },
      answerIndex: 0,
      optionExplanations: {
        zh: [
          '完全正確！若不含短期出差，我們交往期間長時間相隔最遠的時候，一個住在德國「柏林」、一個住在台灣「高雄」，橫跨歐亞大陸超過 9,100 公里與 6～7 小時時差，依然緊緊牽著彼此的心走到今天！',
          '台北到高雄搭高鐵只要一個半小時，對我們來說只能算是「新手村」等級的微遠距啦！不含出差的話，我們長時間相隔最遠是橫跨歐亞大陸，一個住在德國「柏林」、一個在台灣「高雄」，相隔約 9,100 公里喔！',
          '雖然 Tom 曾短期出差到美國（奧蘭多 ↔ 高雄達 13,877 km），但若不含出差，我們沒有在美洲長時間定居遠距啦！長時間相隔最遠的紀錄是歐洲的「柏林 ↔ 高雄」（約 9,100 公里）喔！',
          '東京 ↔ 台北是我們超愛去旅遊充電的航線，但還不是最遠的紀錄喔！不含短期出差的話，我們交往期間長時間相隔最遠的時候，一個住在德國「柏林」、一個在台灣「高雄」，距離超過 9,100 公里！',
        ],
        en: [
          'Spot on! Excluding short business trips, our farthest long-term distance apart was when Tom lived in Berlin, Germany and Eunice lived in Kaohsiung, Taiwan—over 9,100 km and 6–7 time zones apart, yet our hearts stayed right next to each other!',
          'Taipei to Kaohsiung is just a 90-minute High Speed Rail ride—"tutorial level" long distance for us! Excluding business trips, our true long-term record was across Eurasia: Berlin, Germany ↔ Kaohsiung, Taiwan (~9,100 km)!',
          'While Tom took short business trips to the US (Orlando ↔ Kaohsiung reached 13,877 km), excluding business trips we never lived long-term in the Americas! Our real long-term farthest distance was Berlin ↔ Kaohsiung (~9,100 km)!',
          'Tokyo ↔ Taipei is one of our favorite vacation routes, but not our farthest long-term distance apart! Excluding business trips, one of us lived in Berlin and the other in Kaohsiung—about 9,100 km apart!',
        ],
      },
    },
    {
      category: 'bride',
      badge: {
        zh: 'QUESTION 07 / 10',
        en: 'QUESTION 07 / 10',
      },
      question: {
        zh: 'Q7. 請問新娘 Eunice 在英國留學讀書時，所在城市最著名的代表故事人物是誰？',
        en: 'Q7. Which famous story or historical figure is associated with the UK city where the bride (Eunice) studied?',
      },
      optionIcons: ['fig-xuzhimo', 'fig-holmes', 'fig-robinhood', 'fig-joan'],
      options: {
        zh: [
          '徐志摩 (Xu Zhimo)',
          '福爾摩斯 (Sherlock Holmes)',
          '羅賓漢 (Robin Hood)',
          '聖女貞德 (Joan of Arc)',
        ],
        en: [
          'Xu Zhimo (徐志摩)',
          'Sherlock Holmes (福爾摩斯)',
          'Robin Hood (羅賓漢)',
          'Joan of Arc (聖女貞德)',
        ],
      },
      answerIndex: 2,
      optionExplanations: {
        zh: [
          '「輕輕的我走了，正如我輕輕的來，我揮一揮衣袖，不帶走一片雲彩…」等等，那是劍橋（康橋）的徐志摩啦！Eunice 留學的城市是英國的「諾丁漢（Nottingham）」，最著名的代表人物是劫富濟貧的「羅賓漢（Robin Hood）」喔！',
          '「真相永遠只有一個（誤）！」福爾摩斯住在倫敦貝克街 221B 號喔！Eunice 在英國留學的城市是「諾丁漢（Nottingham）」，最著名的代表傳奇人物是雪伍德森林裡的「羅賓漢（Robin Hood）」！',
          '完全正確！Eunice 在英國留學的城市正是「諾丁漢（Nottingham）」，這座城市最著名的傳奇代表人物就是劫富濟貧、百步穿楊的「羅賓漢（Robin Hood）」！',
          '哎呀！聖女貞德已經跨過英吉利海峽跑到法國奧爾良去啦（而且當年她還是跟英軍作戰呢）！Eunice 是在英國的「諾丁漢（Nottingham）」留學，代表故事人物是「羅賓漢（Robin Hood）」喔！',
        ],
        en: [
          '"Very quietly I take my leave, as quietly as I came here; gently I flick my sleeves, not even a wisp of cloud will I bring away…" Hold on, that’s Xu Zhimo at Cambridge! Eunice studied in Nottingham, home of the legendary Robin Hood!',
          '"Elementary, my dear Watson!" Sherlock Holmes lives at 221B Baker Street in London! Eunice studied in Nottingham, UK—the legendary home of Robin Hood!',
          'Bullseye! Eunice studied in Nottingham, UK, whose most famous legendary figure is none other than the heroic outlaw Robin Hood!',
          'Oops! Joan of Arc crossed the English Channel all the way to France (and famously fought against the English)! Eunice studied in Nottingham, UK, the legendary home of Robin Hood!',
        ],
      },
    },
    {
      category: 'groom',
      badge: {
        zh: 'QUESTION 08 / 10',
        en: 'QUESTION 08 / 10',
      },
      question: {
        zh: 'Q8. 新郎 Tom 在公司所屬的團隊是「BMC Team」，請問 BMC 是做什麼的？',
        en: 'Q8. The groom (Tom) is on the "BMC Team". What does BMC actually stand for and do?',
      },
      optionIcons: ['bmc-mood', 'bmc-magic', 'bmc-cash', 'bmc-chip'],
      options: {
        zh: [
          'Bride Mood Controller（新娘心情控制器：全天候偵測新娘情緒波動，並自動觸發安撫與投餵美食機制）',
          'Bilibili（逼哩逼哩）Mero-mero（咩嚕咩嚕）Chuchu（啾啾）',
          'Bring Much Cash（帶超多現金：負責準備滿滿紅包、薪水上繳與全天候鈔能力支援）',
          'Baseboard Management Controller（基板管理控制器：負責伺服器遠端管理、硬體狀態監控與散熱電源控制）',
        ],
        en: [
          'Bride Mood Controller (24/7 real-time monitoring of Eunice’s mood with automatic snack-delivery triggers)',
          'Bilibili (逼哩逼哩) Mero-mero (咩嚕咩嚕) Chuchu (啾啾)',
          'Bring Much Cash (Bringing loads of cash, red envelopes, and full financial support for the bride)',
          'Baseboard Management Controller (Out-of-band server management, hardware health monitoring, thermal & power control)',
        ],
      },
      answerIndex: 3,
      optionExplanations: {
        zh: [
          '求生慾滿分！「Bride Mood Controller（新娘心情控制器）」確實是 Tom 下班後在家最重要的終身職責！不過在公司裡，BMC 其實是「Baseboard Management Controller（基板管理控制器）」，負責伺服器硬體監控與遠端管理喔！',
          '逼哩逼哩～咩嚕咩嚕～啾啾💖！這個魔法咒語太洗腦啦，但寫進履歷可能會被 HR 關心喔！在工程界裡，Tom 團隊的 BMC 其實是「Baseboard Management Controller（基板管理控制器）」，負責伺服器遠端管理與硬體監控！',
          '「Bring Much Cash（帶超多現金）」絕對是新娘 Eunice 最滿意的翻譯沒有之一！不過在伺服器領域，Tom 負責的 BMC 全名是「Baseboard Management Controller（基板管理控制器）」，掌管資料中心伺服器的硬體監控與電源散熱控制喔！',
          '專業硬體／韌體內行人！沒錯，BMC 正是「Baseboard Management Controller（基板管理控制器）」，負責伺服器遠端管理與硬體監控！（當然回到家之後，Tom 也會自動切換成 Bride Mood Controller 兼 Bring Much Cash 模式！）',
        ],
        en: [
          'A+ survival instinct! "Bride Mood Controller" is definitely Tom’s most important lifelong duty at home! At work, though, BMC stands for "Baseboard Management Controller"—managing server hardware, thermals, and power remotely!',
          'Bilibili~ Mero-mero~ Chuchu 💖! That magical chant is dangerously catchy, though it might confuse tech recruiters! At work, Tom’s BMC actually stands for "Baseboard Management Controller" for server hardware management!',
          '"Bring Much Cash" is hands-down the bride’s favorite interpretation! In the server world, however, BMC stands for "Baseboard Management Controller"—monitoring server health, fan speeds, and power out-of-band!',
          'True tech insider! Indeed, BMC stands for "Baseboard Management Controller", an embedded processor that monitors and manages server hardware remotely! (And at home, Tom dual-boots as Bride Mood Controller & Bring Much Cash!)',
        ],
      },
    },
    {
      category: 'both',
      badge: {
        zh: 'QUESTION 09 / 10',
        en: 'QUESTION 09 / 10',
      },
      question: {
        zh: 'Q9. 請問 Tom & Eunice 最討厭的食物是什麼？',
        en: 'Q9. What is Tom & Eunice’s most hated food?',
      },
      optionIcons: ['food-cilantro', 'food-bittermelon', 'food-eggplant', 'food-pepper'],
      options: {
        zh: [
          '香菜',
          '苦瓜',
          '茄子',
          '青椒',
        ],
        en: [
          'Cilantro / Coriander (香菜)',
          'Bitter Melon (苦瓜)',
          'Eggplant (茄子)',
          'Green Peppers (青椒)',
        ],
      },
      answerIndex: 0,
      optionExplanations: {
        zh: [
          '完全命中！不過請容我們鄭重更正：什麼「香」菜，它明明就是「"臭"菜」！這可是 Tom & Eunice 兩個人共同的最大餐桌天敵，看到必挑、點餐必備註「絕對不要加"臭"菜」！',
          '吃得苦中苦，方為人上人！苦瓜鹹蛋或苦瓜雞湯我們還頂得住，真正讓 Tom & Eunice 聞之色變、連碰都不敢碰的最大天敵，其實是俗稱香菜的「"臭"菜」啦（哪裡香了，根本是"臭"菜）！',
          '紫色的茄子雖然也是很多人的便當惡夢，但還排不上我們的第一名！Tom & Eunice 兩人最有默契、絕對不讓它出現在碗裡的最大天敵，其實是被世人誤稱為香菜的「"臭"菜」喔！',
          '蠟筆小新最討厭青椒，但我們不是小新啦！比起青椒，Tom & Eunice 真正深惡痛絕、連一點點碎末都不能接受的最大天敵，其實是號稱香菜但根本是「"臭"菜」的那個東西！',
        ],
        en: [
          'Direct hit! Though let us officially correct the name: why do people call it "fragrant greens (香菜)" when it is clearly "STINKY greens ("臭"菜)"?! It is Tom & Eunice’s #1 shared culinary nemesis!',
          'Bitter melon is tough, but we can survive it! The true arch-nemesis that neither Tom nor Eunice can touch is cilantro—or as we insist on calling it, "臭"菜 (STINKY greens, not fragrant greens)!',
          'Purple eggplant haunts many lunchboxes, but it’s not our #1 villain! The ultimate food nemesis that unites Tom & Eunice in instant rejection is cilantro—which we strictly call "臭"菜 ("Stinky" Greens)!',
          'Crayon Shin-chan hates green peppers the most, but we aren’t Shin-chan! For Tom & Eunice, the undisputed #1 most hated food is cilantro—what kind of "香菜" is that, it’s clearly "臭"菜 ("Stinky" Greens)!',
        ],
      },
    },
    {
      category: 'both',
      badge: {
        zh: 'QUESTION 10 / 10',
        en: 'QUESTION 10 / 10',
      },
      question: {
        zh: 'Q10. 請問 Tom & Eunice 蜜月去哪裡？',
        en: 'Q10. Where did Tom & Eunice go for their honeymoon?',
      },
      optionIcons: ['flag-ch', 'flag-at', 'flag-is', 'flag-it'],
      options: {
        zh: [
          '瑞士',
          '奧地利',
          '冰島',
          '義大利',
        ],
        en: [
          'Switzerland (瑞士)',
          'Austria (奧地利)',
          'Iceland (冰島)',
          'Italy (義大利)',
        ],
      },
      answerIndex: 1,
      optionExplanations: {
        zh: [
          '已經猜到阿爾卑斯山脈附近囉！只差隔壁一個國界！我們蜜月去的是緊鄰瑞士東邊、同樣擁有絕美阿爾卑斯山湖區與維也納音樂之都的「奧地利」喔！也謝謝今天在場的每一位親友見證我們的幸福！',
          '完全正確！我們蜜月去的地方正是「奧地利」！從音樂之都維也納、薩爾斯堡到絕美的哈修塔特與阿爾卑斯山湖區，留下了我們最浪漫難忘的蜜月回憶！也謝謝今天在場的每一位親友見證我們的幸福！',
          '追極光、看冰川聽起來超酷，不過我們蜜月沒有往北極圈飛啦！我們去的是充滿音樂、藝術與阿爾卑斯山湖光山色的中歐國度「奧地利」喔！謝謝今天在場的每一位親友見證我們的幸福！',
          '浪漫的南歐義大利也在附近，不過再往北跨過阿爾卑斯山就對囉！我們蜜月去的是結合維也納音樂藝術與湖區仙境的「奧地利」！也謝謝今天在場的每一位親友見證我們的幸福！',
        ],
        en: [
          'You’re right in the Alps—just one border away! Our honeymoon was right next door to Switzerland in beautiful "Austria (奧地利)", from Vienna to the Alpine lakes! Thank you for celebrating with us today!',
          'Spot on! Our honeymoon destination was "Austria (奧地利)"! From musical Vienna and Salzburg to Hallstatt and the breathtaking Alpine lakes, it gave us the most unforgettable memories! Thank you for celebrating with us today!',
          'Chasing the Northern Lights in Iceland sounds epic, but we didn’t fly to the Arctic Circle! We went to Central Europe’s musical and Alpine wonderland—"Austria (奧地利)"! Thank you for celebrating with us today!',
          'Romantic Italy is just south of the border—head right across the Alps and you’re there! Our honeymoon was in "Austria (奧地利)", filled with music, art, and Alpine lakes! Thank you for celebrating with us today!',
        ],
      },
    },
  ];

  /**
   * 新人過去照片資料 (2014–2026 歲月寫真)
   * 若放入實際照片檔案（例如 photos/2014.jpg）或圖片連結於 imageUrl 欄位，即會自動顯示照片
   */
  const PAST_PHOTOS_DATA = [
    {
      era: '2014-2017',
      yearLabel: '2014 · FIRST MET',
      emoji: '💌',
      imageUrl: '',
      title: {
        zh: 'Dcard 午夜抽卡的相遇',
        en: 'Midnight Match on Dcard',
      },
      caption: {
        zh: '2014 年的一封站內信、情人節在台北的第一次見面，沒想到一聊就走過了十二個四季。',
        en: 'One message in 2014 and our very first Valentine’s Day meet-up in Taipei — somehow that conversation lasted twelve years.',
      },
    },
    {
      era: '2014-2017',
      yearLabel: '2015–2016 · CAMPUS DAYS',
      emoji: '🐮',
      imageUrl: '',
      title: {
        zh: '關渡與北藝大鷺鷥草原的午後',
        en: 'Afternoons on the TNUA Campus Lawn',
      },
      caption: {
        zh: '在北藝大草原上看著校牛「小麗」、「奧米加咆哮獸」與「犇爺」慢慢吃草，是學生時代最柔軟的記憶。',
        en: 'Slow sunny afternoons watching TNUA’s campus cows — Xiaoli, OmniShoutmon, and Master Ben — graze across the hillside.',
      },
    },
    {
      era: '2014-2017',
      yearLabel: '2017 · GRADUATION & TRIPS',
      emoji: '🎓',
      imageUrl: '',
      title: {
        zh: '畢業季與南北往返的車票',
        en: 'Graduation & Train Tickets North and South',
      },
      caption: {
        zh: '一張張往返台北、新竹與高雄的車票，載著我們走過北海岸、台中與好多看海的週末。',
        en: 'Stacks of train tickets between Taipei, Hsinchu, and Kaohsiung, plus coastal drives whenever we could steal a weekend together.',
      },
    },
    {
      era: '2018-2021',
      yearLabel: '2018–2020 · BERLIN & NOTTINGHAM',
      emoji: '🇬🇧',
      imageUrl: '',
      title: {
        zh: '柏林工作 ＆ 諾丁漢留學的時差歲月',
        en: 'Berlin & Nottingham Across Time Zones',
      },
      caption: {
        zh: '從柏林與高雄相隔 9,100 公里的視訊日常，到 Eunice 飛往英國諾丁漢讀書，我們終於能在巴黎與布拉格的冬天見面。',
        en: 'From 9,100 km apart between Berlin and Kaohsiung to Eunice studying in Robin Hood’s Nottingham — meeting halfway in Paris and snowy Prague.',
      },
    },
    {
      era: '2018-2021',
      yearLabel: '2020–2021 · BACK IN ONE TIME ZONE',
      emoji: '🏡',
      imageUrl: '',
      title: {
        zh: '回到同一個時區的板橋日常',
        en: 'Finally in the Same Time Zone Again',
      },
      caption: {
        zh: '結束遠距離搬進板橋的小家，每天最開心的事就是一起覓食——當然，絕對不加「臭菜」（香菜）！',
        en: 'Ending long distance and settling into our home in Banqiao, hunting for good food together — strictly free of cilantro (“stinky greens”)!',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2022–2024 · GOOGLE BMC & TRAVELS',
      emoji: '✈️',
      imageUrl: '',
      title: {
        zh: 'Google BMC Team 與一起看過的世界',
        en: 'Google BMC Team & Journeys Together',
      },
      caption: {
        zh: '搬到台北忠孝復興後，平日各自在工作裡忙碌打拚，休假就收起行李，一起去陌生的城市散步。',
        en: 'Life around Zhongxiao Fuxing with Tom in the Google BMC Team and Eunice at work — trading busy weekdays for quiet getaways abroad.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2025 · SHE SAID YES',
      emoji: '💍',
      imageUrl: '',
      title: {
        zh: '說好要一起走下半輩子',
        en: 'She Said Yes',
      },
      caption: {
        zh: '把十二年的默契收進戒指裡，換上白紗與西裝，拍下屬於我們兩個人的紀念。',
        en: 'Twelve years of quiet understanding slipped onto one ring, dressed up for our pre-wedding portraits.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2026.09 · AUSTRIA HONEYMOON',
      emoji: '🏔️',
      imageUrl: '',
      title: {
        zh: '2026 年秋初 · 奧地利湖區與維也納蜜月',
        en: 'Sep 2026 · Honeymoon in Vienna & the Austrian Lakes',
      },
      caption: {
        zh: '在維也納的琴聲與阿爾卑斯山湖區的晨霧裡散步，把最安靜浪漫的風景留給彼此。',
        en: 'Morning mist over Hallstatt’s Alpine lakes and evening music in Vienna on our autumn honeymoon.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2026.11.29 · BRICK YARD 33 1/3',
      emoji: '🥂',
      imageUrl: '',
      title: {
        zh: '2026.11.29 · 陽明山與你相見',
        en: '2026.11.29 · Celebrating With You in Yangmingshan',
      },
      caption: {
        zh: '謝謝你今天特地來到陽明山，陪我們把這十二年的故事寫下最溫暖的一頁。',
        en: 'Thank you for coming up the mountain today to share a meal, a toast, and this chapter with us.',
      },
    },
  ];

  /**
   * 婚宴座位表資料（依據 BY33 美軍俱樂部平面圖 12 大座位區與參加人名單配置，支援分類或賓客姓名即時搜尋高亮）
   */
  const SEATING_TABLES_DATA = [
    {
      id: 'table-main',
      box: { x: 890, y: 890, w: 359, h: 315 },
      mapLabel: {
        cx: 1070,
        cy: 1045,
        bw: 138,
        bh: 64,
        fontSize: 40,
        lineStep: 44,
        zh: ['主桌'],
        en: ['Main'],
      },
      color: '#d97706',
      fillColor: 'rgba(245, 158, 11, 0.22)',
      debugStats: { headcount: 14, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '主桌 · 新人與雙方主婚人區', en: 'Main Table · Newlyweds, Parents & Family Elders' },
      zone: { zh: '主廳中央 · 主桌', en: 'Main Hall Center · Main Table' },
      guests: [
        { zh: '董智瑋 Tom (新郎)', en: 'Tom Tung (Groom)' },
        { zh: '蕭睦宸 Eunice (新娘)', en: 'Eunice Hsiao (Bride)' },
        { zh: '董煥新&徐淑明等二人', en: '董煥新 & 徐淑明 (2)' },
        { zh: '蕭能駿&傅郁淳等二人', en: '蕭能駿 & 傅郁淳 (2)' },
        { zh: '婆婆', en: 'Grandmother (婆婆)' },
        { zh: '董素娟等二人', en: '董素娟 (2)' },
        { zh: '傅昭雄等二人', en: '傅昭雄 (2)' },
        { zh: '傅楷凌', en: '傅楷凌' },
        { zh: '傅昭凱', en: '傅昭凱' },
        { zh: '董庭瑜', en: '董庭瑜' },
      ],
    },
    {
      id: 'zone-bride-relatives',
      box: { x: 712, y: 890, w: 156, h: 316 },
      mapLabel: {
        cx: 790,
        cy: 1047,
        bw: 68,
        bh: 192,
        fontSize: 36,
        lineStep: 44,
        enFontSize: 28,
        enLineStep: 33,
        zh: ['新', '娘', '親', '戚'],
        en: ['B', 'R', 'I', 'D', 'E'],
      },
      color: '#e11d48',
      fillColor: 'rgba(225, 29, 72, 0.22)',
      debugStats: { headcount: 11, veg: 0, stroller: 0, childSeat: 2 },
      name: { zh: '新娘親戚區', en: "Bride's Relatives" },
      zone: { zh: '主廳中左側 · 新娘親戚（主桌左側）', en: "Main Hall Center-Left · Bride's Relatives" },
      guests: [
        { zh: '傅宥錡', en: '傅宥錡' },
        { zh: '傅裕耀等三人', en: '傅裕耀 (3)' },
        { zh: '傅詩晴等四人', en: '傅詩晴 (4)' },
        { zh: '蔡沐桓等三人', en: '蔡沐桓 (3)' },
      ],
    },
    {
      id: 'zone-groom-parents-friends',
      box: { x: 640, y: 288, w: 1113, h: 290 },
      mapLabel: {
        cx: 1195,
        cy: 423,
        bw: 344,
        bh: 68,
        fontSize: 40,
        lineStep: 44,
        zh: ['新郎爸媽朋友'],
        en: ["Parents' Friends"],
      },
      color: '#65a30d',
      fillColor: 'rgba(101, 163, 13, 0.20)',
      debugStats: { headcount: 74, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎爸媽朋友區', en: "Groom's Parents' Friends" },
      zone: { zh: '主廳上方 · 新郎爸媽朋友（共 6 長桌）', en: "Main Hall North · Groom's Parents' Friends (6 Long Tables)" },
      guests: [
        { zh: '吳淑芸', en: '吳淑芸' },
        { zh: '楊文', en: '楊文' },
        { zh: '張愛卿', en: '張愛卿' },
        { zh: '許家彰', en: '許家彰' },
        { zh: '林鳳姿', en: '林鳳姿' },
        { zh: '李素幸', en: '李素幸' },
        { zh: '李旻貞', en: '李旻貞' },
        { zh: '陳溍源等二人', en: '陳溍源 (2)' },
        { zh: '許惠珍', en: '許惠珍' },
        { zh: '蕭培元', en: '蕭培元' },
        { zh: '鄭瑋玲', en: '鄭瑋玲' },
        { zh: '劉子經等二人', en: '劉子經 (2)' },
        { zh: '呂淑貞', en: '呂淑貞' },
        { zh: '廖惠生 & 林碧華等二人', en: '廖惠生 & 林碧華 (2)' },
        { zh: '陳裕珍', en: '陳裕珍' },
        { zh: '龔紹興等二人', en: '龔紹興 (2)' },
        { zh: '林本芬', en: '林本芬' },
        { zh: '夏智弘', en: '夏智弘' },
        { zh: '夏正德', en: '夏正德' },
        { zh: '劉東皋', en: '劉東皋' },
        { zh: '高栢鈴等二人', en: '高栢鈴 (2)' },
        { zh: '黃寶瑛', en: '黃寶瑛' },
        { zh: '王仲瑛等二人', en: '王仲瑛 (2)' },
        { zh: '蕭文瑜', en: '蕭文瑜' },
        { zh: '林緯謙等二人', en: '林緯謙 (2)' },
        { zh: '陳兆伸', en: '陳兆伸' },
        { zh: '吳逸楓', en: '吳逸楓' },
        { zh: '廖美鸞', en: '廖美鸞' },
        { zh: '梁光華&韋雪華等二人', en: '梁光華 & 韋雪華 (2)' },
        { zh: '嚴惠英', en: '嚴惠英' },
        { zh: '林光男', en: '林光男' },
        { zh: '曾智聰等二人', en: '曾智聰 (2)' },
        { zh: '林澔儒', en: '林澔儒' },
        { zh: '何毅夫等二人', en: '何毅夫 (2)' },
        { zh: '鄭能達&汪美雲等二人', en: '鄭能達 & 汪美雲 (2)' },
        { zh: '劉聰明&陳秋娥等二人', en: '劉聰明 & 陳秋娥 (2)' },
        { zh: '楊哲彰等二人', en: '楊哲彰 (2)' },
        { zh: '楊恕銘等二人', en: '楊恕銘 (2)' },
        { zh: '楊演松等二人', en: '楊演松 (2)' },
        { zh: '陳晉輝等二人', en: '陳晉輝 (2)' },
        { zh: '許天和等二人', en: '許天和 (2)' },
        { zh: '邱文德等二人', en: '邱文德 (2)' },
        { zh: '洪世昌等二人', en: '洪世昌 (2)' },
        { zh: '黃棟樑等二人', en: '黃棟樑 (2)' },
        { zh: '許少荃等二人', en: '許少荃 (2)' },
        { zh: '劉園德等二人', en: '劉園德 (2)' },
        { zh: '梁志遠等二人', en: '梁志遠 (2)' },
        { zh: '康裕傑等二人', en: '康裕傑 (2)' },
        { zh: '高增堯&張淑貞等二人', en: '高增堯 & 張淑貞 (2)' },
      ],
    },
    {
      id: 'zone-groom-dad-relatives',
      box: { x: 534, y: 890, w: 156, h: 316 },
      mapLabel: {
        cx: 611,
        cy: 1047,
        bw: 68,
        bh: 192,
        fontSize: 36,
        lineStep: 44,
        enFontSize: 32,
        enLineStep: 40,
        zh: ['董', '家', '親', '戚'],
        en: ['T', 'U', 'N', 'G'],
      },
      color: '#92400e',
      fillColor: 'rgba(146, 64, 14, 0.22)',
      debugStats: { headcount: 11, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎爸爸親戚區（董家親戚）', en: "Groom's Father's Relatives (Tung Family)" },
      zone: { zh: '主廳左側 · 董家親戚（鄰近左側取餐區）', en: 'Main Hall Left · Tung Family Relatives' },
      guests: [
        { zh: '陳怡玲', en: '陳怡玲' },
        { zh: '陳振揚', en: '陳振揚' },
        { zh: '陳思樺等二人', en: '陳思樺 (2)' },
        { zh: '董素芬等二人', en: '董素芬 (2)' },
        { zh: '董素真等二人', en: '董素真 (2)' },
        { zh: '洪瑞隆等二人', en: '洪瑞隆 (2)' },
        { zh: '洪鶴祐', en: '洪鶴祐' },
      ],
    },
    {
      id: 'zone-groom-mom-relatives',
      box: { x: 1384, y: 741, w: 352, h: 554 },
      mapLabel: {
        cx: 1560,
        cy: 1017,
        bw: 68,
        bh: 192,
        fontSize: 36,
        lineStep: 44,
        enFontSize: 34,
        enLineStep: 46,
        zh: ['徐', '家', '親', '戚'],
        en: ['H', 'S', 'U'],
      },
      color: '#059669',
      fillColor: 'rgba(5, 150, 105, 0.22)',
      debugStats: { headcount: 34, veg: 1, stroller: 0, childSeat: 1, detail: '徐玲明：素食1、兒童椅1' },
      name: { zh: '新郎媽媽親戚區（徐家親戚）', en: "Groom's Mother's Relatives (Hsu Family)" },
      zone: { zh: '主廳右側 · 徐家親戚', en: 'Main Hall Right · Hsu Family Relatives' },
      guests: [
        { zh: '徐玲明等六人', en: '徐玲明 (6)' },
        { zh: '徐和志、許嵐音等二人', en: '徐和志 & 許嵐音 (2)' },
        { zh: '徐平志', en: '徐平志' },
        { zh: '林哲正等二人', en: '林哲正 (2)' },
        { zh: '徐慧明', en: '徐慧明' },
        { zh: '徐宇光等二人', en: '徐宇光 (2)' },
        { zh: '徐明志等五人', en: '徐明志 (5)' },
        { zh: '陳啟武等二人', en: '陳啟武 (2)' },
        { zh: '徐宇志等三人', en: '徐宇志 (3)' },
        { zh: '徐雪櫻等二人', en: '徐雪櫻 (2)' },
        { zh: '徐紫櫻 王展浩等二人', en: '徐紫櫻 王展浩 (2)' },
        { zh: '徐芳明', en: '徐芳明' },
        { zh: 'Roxy', en: 'Roxy' },
        { zh: '董智翔&陳哲雅等二人', en: '董智翔 & 陳哲雅 (2)' },
        { zh: '房滋寧&韓治瀾等二人', en: '房滋寧 & 韓治瀾 (2)' },
      ],
    },
    {
      id: 'zone-groom-moz',
      box: { x: 1103, y: 1666, w: 156, h: 164 },
      mapLabel: {
        cx: 1181,
        cy: 1751,
        bw: 126,
        bh: 62,
        fontSize: 38,
        lineStep: 42,
        zh: ['謀智'],
        en: ['Mozilla'],
      },
      color: '#0891b2',
      fillColor: 'rgba(8, 145, 178, 0.22)',
      debugStats: { headcount: 6, veg: 0, stroller: 0, childSeat: 1, detail: '曾祥信：兒童椅1' },
      name: { zh: '新郎 MOZ 區（謀智）', en: 'Groom · MOZ (Mozilla)' },
      zone: { zh: '外廳左列第 1 區 · 謀智', en: 'Lower Hall Left Col · Section 1 (MOZ)' },
      guests: [
        { zh: 'Ethan Tseng 曾祥信等三人', en: 'Ethan Tseng 曾祥信 (3)' },
        { zh: 'Shawn Huang等二人', en: 'Shawn Huang (2)' },
        { zh: '陳亮亨 Gary Chen', en: '陳亮亨 Gary Chen' },
      ],
    },
    {
      id: 'zone-bride-highschool',
      box: { x: 1103, y: 1831, w: 156, h: 149 },
      mapLabel: {
        cx: 1181,
        cy: 1906,
        bw: 126,
        bh: 62,
        fontSize: 38,
        lineStep: 42,
        zh: ['雄女'],
        en: ['KGHS'],
      },
      color: '#2563eb',
      fillColor: 'rgba(37, 99, 235, 0.22)',
      debugStats: { headcount: 5, veg: 1, stroller: 0, childSeat: 0, detail: '王淑菁：素食1' },
      name: { zh: '新娘高中區（雄女）', en: "Bride's High School (KGHS)" },
      zone: { zh: '外廳左列第 2 區 · 雄女', en: 'Lower Hall Left Col · Section 2 (KGHS)' },
      guests: [
        { zh: '張恬恬', en: '張恬恬' },
        { zh: '林佳儒等二人', en: '林佳儒 (2)' },
        { zh: '張辰', en: '張辰' },
        { zh: '王淑菁', en: '王淑菁' },
      ],
    },
    {
      id: 'zone-bride-college',
      box: { x: 1103, y: 1981, w: 156, h: 154 },
      mapLabel: {
        cx: 1182,
        cy: 2061,
        bw: 126,
        bh: 62,
        fontSize: 38,
        lineStep: 42,
        zh: ['北藝'],
        en: ['TNUA'],
      },
      color: '#db2777',
      fillColor: 'rgba(219, 39, 119, 0.22)',
      debugStats: { headcount: 6, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新娘大學區（北藝）', en: "Bride's College (TNUA)" },
      zone: { zh: '外廳左列第 3 區 · 北藝', en: 'Lower Hall Left Col · Section 3 (TNUA)' },
      guests: [
        { zh: '陳品心', en: '陳品心' },
        { zh: '雷廷萱', en: '雷廷萱' },
        { zh: '戴嘉謙', en: '戴嘉謙' },
        { zh: '黃采逸等二人', en: '黃采逸 (2)' },
        { zh: 'Yalan Chang', en: 'Yalan Chang' },
      ],
    },
    {
      id: 'zone-bride-colleagues',
      box: { x: 1103, y: 2136, w: 156, h: 215 },
      mapLabel: {
        cx: 1181,
        cy: 2237,
        bw: 126,
        bh: 62,
        fontSize: 38,
        lineStep: 42,
        zh: ['瑪黑'],
        en: ['Marais'],
      },
      color: '#7c3aed',
      fillColor: 'rgba(124, 58, 237, 0.22)',
      debugStats: { headcount: 8, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新娘同事區（瑪黑）', en: "Bride's Colleagues (Marais)" },
      zone: { zh: '外廳左列第 4 區 · 瑪黑', en: 'Lower Hall Left Col · Section 4 (Marais)' },
      guests: [
        { zh: '吳宥蓁', en: '吳宥蓁' },
        { zh: '余汶杰', en: '余汶杰' },
        { zh: '陳泰元', en: '陳泰元' },
        { zh: '金耘瑞等二人', en: '金耘瑞 (2)' },
        { zh: '張世瑤 Anny', en: '張世瑤 Anny' },
        { zh: '蔡青樺 Iris', en: '蔡青樺 Iris' },
        { zh: '沈育琪', en: '沈育琪' },
      ],
    },
    {
      id: 'zone-groom-colleagues',
      box: { x: 1340, y: 1608, w: 200, h: 756 },
      basePatch: {
        mask: { x: 1402, y: 1861, w: 88, h: 248, fill: '#bdbb9e' },
        tables: [
          { x: 1413, y: 1839, w: 65, h: 101, fill: '#cacdb2', stroke: '#46492e', strokeWidth: 4 },
          { x: 1413, y: 2027, w: 65, h: 102, fill: '#cacdb2', stroke: '#46492e', strokeWidth: 4 },
        ],
      },
      mapLabel: {
        cx: 1444,
        cy: 1984,
        bw: 158,
        bh: 62,
        fontSize: 35,
        lineStep: 40,
        zh: ['Google'],
        en: ['Google'],
      },
      color: '#ea580c',
      fillColor: 'rgba(234, 88, 12, 0.22)',
      debugStats: { headcount: 23, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎同事區（Google）', en: "Groom's Colleagues (Google)" },
      zone: { zh: '外廳中列長桌區 · Google', en: 'Lower Hall Center Col · Google' },
      guests: [
        { zh: 'Rock Tsai', en: 'Rock Tsai' },
        { zh: '查忠敏 (Jasmine Cha)等四人', en: '查忠敏 (Jasmine Cha) (4)' },
        { zh: 'Mark Chu', en: 'Mark Chu' },
        { zh: 'Andy Sun (孫銘鴻)等四人', en: 'Andy Sun (孫銘鴻) (4)' },
        { zh: 'Harry Lu', en: 'Harry Lu' },
        { zh: 'Medicine Yeh', en: 'Medicine Yeh' },
        { zh: '賴豊彰', en: '賴豊彰' },
        { zh: '張均銘等二人', en: '張均銘 (2)' },
        { zh: '王廷睿 (Terry Wang)', en: '王廷睿 (Terry Wang)' },
        { zh: 'Ray Li', en: 'Ray Li' },
        { zh: 'ANH PHAN等二人', en: 'ANH PHAN (2)' },
        { zh: '葛家聿', en: '葛家聿' },
        { zh: '沈昊平(Michael Shen/gpgpgp)等二人', en: '沈昊平(Michael Shen/gpgpgp) (2)' },
        { zh: 'Leo Tu', en: 'Leo Tu' },
      ],
    },
    {
      id: 'zone-groom-nctu',
      box: { x: 1589, y: 1608, w: 161, h: 343 },
      mapLabel: {
        cx: 1667,
        cy: 1784,
        bw: 66,
        bh: 122,
        fontSize: 36,
        lineStep: 46,
        enFontSize: 24,
        enLineStep: 26,
        zh: ['交', '大'],
        en: ['N', 'C', 'T', 'U'],
      },
      color: '#ca8a04',
      fillColor: 'rgba(234, 179, 8, 0.24)',
      debugStats: { headcount: 11, veg: 0, stroller: 1, childSeat: 1, detail: '林煜峯：嬰兒車1、兒童椅1' },
      name: { zh: '新郎交大區（交大）', en: "Groom's College (NCTU)" },
      zone: { zh: '外廳右列上方區 · 交大', en: 'Lower Hall Right Col · Upper (NCTU)' },
      guests: [
        { zh: 'Allan Sun', en: 'Allan Sun' },
        { zh: '葉峻宇', en: '葉峻宇' },
        { zh: '林煜峯等四人', en: '林煜峯 (4)' },
        { zh: 'KJ Liu 等二人', en: 'KJ Liu (2)' },
        { zh: '張家瑋', en: '張家瑋' },
        { zh: '褚祐任等二人', en: '褚祐任 (2)' },
      ],
    },
    {
      id: 'zone-groom-highschool',
      box: { x: 1586, y: 2000, w: 160, h: 364 },
      mapLabel: {
        cx: 1667,
        cy: 2188,
        bw: 66,
        bh: 122,
        fontSize: 36,
        lineStep: 46,
        enFontSize: 24,
        enLineStep: 26,
        zh: ['大', '直'],
        en: ['D', 'Z', 'H', 'S'],
      },
      color: '#b91c1c',
      fillColor: 'rgba(185, 28, 28, 0.22)',
      debugStats: { headcount: 13, veg: 0, stroller: 0, childSeat: 1, detail: '施傑耀：兒童椅1' },
      name: { zh: '新郎高中區（大直）', en: "Groom's High School (Dazhi)" },
      zone: { zh: '外廳右列下方區 · 大直', en: 'Lower Hall Right Col · Lower (Dazhi HS)' },
      guests: [
        { zh: '施傑耀等三人', en: '施傑耀 (3)' },
        { zh: '洪維辰', en: '洪維辰' },
        { zh: '蔡聖傑', en: '蔡聖傑' },
        { zh: '鄭兆珍', en: '鄭兆珍' },
        { zh: '朱鎧', en: '朱鎧' },
        { zh: '林品賢等二人', en: '林品賢 (2)' },
        { zh: '陳怡瑋等二人', en: '陳怡瑋 (2)' },
        { zh: '何弋柏', en: '何弋柏' },
        { zh: '周駿逸', en: '周駿逸' },
      ],
    },
  ];

  /**
   * 婚宴餐點菜單（美軍俱樂部 Brick Yard 33 1/3 百匯自助餐完整菜單）
   */
  const WEDDING_MENU_COURSES = [
    {
      courseNo: 'STATION 01 · SALAD & COLD PLATTER',
      title: { zh: '🥗 鮮翠沙拉 ＆ 煙燻冷盤區', en: '🥗 Fresh Salads & Smoked Cold Platter' },
      desc: {
        zh: '• 匈牙利凱薩雞肉沙拉\n• 季節鮮果沙拉\n• 煙燻鮭魚拼盤',
        en: '• Hungarian Chicken Caesar Salad\n• Seasonal Fresh Fruit Salad\n• Smoked Salmon Platter',
      },
      tag: { zh: '沙拉冷盤 (3 品)', en: 'Salads (3 Items)' },
    },
    {
      courseNo: 'STATION 02 · PASTA, RISOTTO & RICE',
      title: { zh: '🍝 經典主食 · 義大利麵、燉飯與蒲燒油飯', en: '🍝 Signature Mains: Pasta, Risotto & Sticky Rice' },
      desc: {
        zh: '• 匈牙利松阪豬肉醬義大利麵\n• 羅勒松子雞肉義大利麵\n• 蒲燒鯛魚油飯\n• 普羅旺斯海鮮燉飯\n• 托斯卡尼松露蕈菇燉飯（蛋奶素）',
        en: '• Hungarian Pork Jowl Pasta\n• Basil Pine Nut Chicken Pasta\n• Kabayaki Sea Bream Savory Sticky Rice (Taiwanese Youfan)\n• Provence Seafood Risotto\n• Tuscan Truffle Mushroom Risotto (Ovo-Lacto Veg)',
      },
      tag: { zh: '主食精選 (5 品)', en: 'Pasta & Rice (5 Items)' },
    },
    {
      courseNo: 'STATION 03 · CARVING & HOT ENTRÉES',
      title: { zh: '🥩 主廚現切爐烤牛排 ＆ 海陸熱饌主菜', en: "🥩 Chef's Carving Station & Land/Sea Entrées" },
      desc: {
        zh: '• 主廚現切爐烤曼哈頓牛排\n• 義式香料骰子牛 ／ 曼非斯碳烤豬肋排 ／ 煙燻德式豬腳\n• 瑞典紅酒起司燉雞肉球 ／ 招牌美軍炸物拼盤\n• 義式西西里烤貽貝 ／ 希臘燉烤檸檬魚 ／ 荷葉白灼鮮蝦\n• 四季鮮炒時蔬（素） ／ 芥末籽炒香料野菇（素）',
        en: "• Chef's Carved Manhattan Steak\n• Italian Herb Diced Beef / Memphis BBQ Pork Ribs / Smoked German Pork Knuckle\n• Swedish Red Wine Cheese Chicken Meatballs / Brick Yard Fried Platter\n• Sicilian Baked Mussels / Greek Lemon Fish / Poached Prawns\n• Seasonal Stir-Fried Greens (Veg) / Mustard Herb Wild Mushrooms (Veg)",
      },
      tag: { zh: '海陸主菜 (11 品)', en: 'Hot Entrées (11 Items)' },
    },
    {
      courseNo: 'STATION 04 · WARM ARTISANAL SOUPS',
      title: { zh: '🍲 暖心煲湯品', en: '🍲 Warm Artisanal Soups' },
      desc: {
        zh: '• 胡椒豬肚雞湯\n• 法式洋蔥湯',
        en: '• White Pepper Pork Tripe & Chicken Soup\n• Classic French Onion Soup',
      },
      tag: { zh: '湯品 (2 品)', en: 'Soups (2 Items)' },
    },
    {
      courseNo: 'STATION 05 · SAVORY BITES & ARTISANAL PIZZA',
      title: { zh: '🍕 歐陸派對鹹點 ＆ 手工披薩', en: '🍕 Savory Party Bites & Handcrafted Pizza' },
      desc: {
        zh: '• 手工義大利香腸披薩 ／ 愛爾蘭牧羊人派\n• 莫札瑞拉起司牛肉串 ／ 巴薩米克起司鮮蝦\n• 水牛城辣雞蛋堡（微辣） ／ 蘆筍起司火腿捲\n• 軟法菇菇時蔬堡（蛋奶素）',
        en: "• Handcrafted Italian Sausage Pizza / Irish Shepherd's Pie\n• Mozzarella Beef Skewers / Balsamic Cheese Prawns\n• Buffalo Spicy Chicken Slider (Mildly Spicy) / Asparagus Cheese Ham Rolls\n• Soft Baguette Mushroom Veggie Slider (Ovo-Lacto Veg)",
      },
      tag: { zh: '精緻鹹點 (7 品)', en: 'Savory Bites (7 Items)' },
    },
    {
      courseNo: 'STATION 06 · PATISSERIE & DESSERTS',
      title: { zh: '🍰 法式精緻甜點百匯', en: '🍰 French Patisserie & Dessert Bar' },
      desc: {
        zh: '• 黑玫瑰馬卡龍（蛋奶素）\n• 法式經典千層派（蛋奶素）\n• 脆酷力巧克力披薩（蛋奶素）\n• 手工餅乾拼盤（蛋奶素）\n• 威士忌義式巧克力蛋糕（含酒精）',
        en: '• Black Rose Macarons (Ovo-Lacto Veg)\n• Classic French Mille-Feuille (Ovo-Lacto Veg)\n• Crunchy Chocolate Pizza (Ovo-Lacto Veg)\n• Artisanal Cookie Platter (Ovo-Lacto Veg)\n• Whiskey Italian Chocolate Cake (Contains Alcohol)',
      },
      tag: { zh: '法式甜點 (5 品)', en: 'Desserts (5 Items)' },
    },
    {
      courseNo: 'STATION 07 · BARTENDER COCKTAILS & DRINKS',
      title: { zh: '🍸 Bartender 現調調酒、飲品吧 ＆ 戶外雞尾酒點心吧', en: '🍸 Bartender Cocktails, Drinks & Outdoor Canapé Bar' },
      desc: {
        zh: '• 🍸 Bartender 現調調酒（每人一杯）\n• 🥂 戶外雞尾酒點心吧（迎賓免費享）\n• ☕ 伯爵紅茶 ／ 美式咖啡 ／ 蔓越莓汁 ／ 檸檬水',
        en: '• 🍸 Bartender Handcrafted Cocktail (1 Glass per Guest)\n• 🥂 Complimentary Outdoor Cocktail & Canapé Bar\n• ☕ Earl Grey Tea / Americano / Cranberry Juice / Lemon Water',
      },
      tag: { zh: '特調與飲品', en: 'Cocktails & Drinks' },
    },
  ];

  /**
   * 新人雙人交往軌跡 (2014–2026 Tom & Eunice 雙軸同步紀錄)
   * 每個時間節點同時記錄 Tom (🤵‍♂️ 藍色軌跡) 與 Eunice (👰‍♀️ 粉色軌跡) 的精準座標與兩人距離
   */
  const LOVE_FOOTPRINTS_DATA = [
    {
      year: '2014',
      dateTag: '2014.01–02',
      tom: { lat: 24.787, lng: 120.997, city: { zh: '新竹交大／彰化屏東', en: 'Hsinchu NCTU' } },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '台北北藝大／高雄過年', en: 'Taipei / Kaohsiung' } },
      lat: 24.787,
      lng: 120.997,
      place: {
        zh: '2014.01–02 · 新竹交大 ↔ 台北北藝大（過年彰化屏東 ＆ 高雄）',
        en: 'Jan–Feb 2014 · Hsinchu NCTU ↔ Taipei TNUA (Lunar New Year in Changhua/Pingtung & Kaohsiung)',
      },
      distanceLabel: { zh: '245 km · 過年南北兩端聊著天', en: '245 km · Chatting Across Lunar New Year' },
      desc: {
        zh: '還沒見面的那個冬天，Tom 在新竹交大與南部走春，Eunice 回高雄過年，手機訊息已經悄悄連起兩端。',
        en: 'Before meeting in person, messages traveled back and forth while Tom spent Lunar New Year down south and Eunice was home in Kaohsiung.',
      },
      mapQuery: 'Taipei,Taiwan',
    },
    {
      year: '2014',
      dateTag: '2014.02.14 & 02.28',
      tom: { lat: 25.047, lng: 121.517, city: { zh: '台北 Taipei', en: 'Taipei' } },
      eunice: { lat: 25.047, lng: 121.517, city: { zh: '台北 Taipei', en: 'Taipei' } },
      lat: 25.047,
      lng: 121.517,
      place: {
        zh: '2014.02.14 第一次見面 ＆ 2014.02.28 正式在一起（台北）',
        en: 'Feb 14, 2014 First Meet & Feb 28, 2014 Officially Together (Taipei)',
      },
      distanceLabel: { zh: '0 km · 我們的故事起點 💕', en: '0 km · Where Our Story Began 💕' },
      desc: {
        zh: '2/14 情人節在台北第一次見面，兩週後的 2/28 決定牽起彼此的手——距離第一次變成零。',
        en: 'Met for the first time in Taipei on Valentine’s Day (2/14) and officially became us on 2/28 — distance dropped to zero for the first time.',
      },
      mapQuery: 'Taipei,Taiwan',
    },
    {
      year: '2014',
      dateTag: '2014.04',
      tom: { lat: 25.291, lng: 121.568, city: { zh: '北海岸 North Coast', en: 'North Coast' } },
      eunice: { lat: 25.291, lng: 121.568, city: { zh: '北海岸 North Coast', en: 'North Coast' } },
      lat: 25.291,
      lng: 121.568,
      place: {
        zh: '2014.04 · 新北北海岸看海吹風',
        en: 'Apr 2014 · Watching the Sea Along Taiwan’s North Coast',
      },
      distanceLabel: { zh: '0 km · 北海岸看海 💕', en: '0 km · Coastal Breeze Together 💕' },
      desc: {
        zh: '剛交往的春天，兩個人一起跑到北海岸聽浪吹風，把整個下午都浪費在海邊。',
        en: 'Our first spring together, spending a slow afternoon by the ocean along Taiwan’s North Coast.',
      },
      mapQuery: 'Baishawan+North+Coast+Taiwan',
    },
    {
      year: '2014',
      dateTag: '2014.06',
      tom: { lat: 24.787, lng: 120.997, city: { zh: '新竹交大 Hsinchu', en: 'Hsinchu' } },
      eunice: { lat: 43.061, lng: 141.354, city: { zh: '北海道 Hokkaido', en: 'Hokkaido, JP' } },
      lat: 43.061,
      lng: 141.354,
      place: {
        zh: '2014.06 · Eunice 大學畢業 ＆ 初夏北海道之旅',
        en: 'Jun 2014 · Eunice’s Graduation & Early-Summer Hokkaido Trip',
      },
      distanceLabel: { zh: '2,680 km · 新竹 ↔ 北海道', en: '2,680 km · Hsinchu ↔ Hokkaido' },
      desc: {
        zh: 'Eunice 畢業搬回高雄、6 月底飛往北海道旅行；Tom 在新竹交大收著從北國寄回來的風景。',
        en: 'Eunice graduated, moved back to Kaohsiung, and flew to Hokkaido in late June, sending northern summer snapshots back to Tom in Hsinchu.',
      },
      mapQuery: 'Sapporo,Hokkaido,Japan',
    },
    {
      year: '2014',
      dateTag: '2014.07',
      tom: { lat: 24.147, lng: 120.673, city: { zh: '新竹 ➔ 台中', en: 'Hsinchu & Taichung' } },
      eunice: { lat: 24.147, lng: 120.673, city: { zh: '新竹 ➔ 台中', en: 'Hsinchu & Taichung' } },
      lat: 24.147,
      lng: 120.673,
      place: {
        zh: '2014.07 · 新竹重逢 ＆ 盛夏台中小旅行',
        en: 'Jul 2014 · Hsinchu Reunion & Summer Trip to Taichung',
      },
      distanceLabel: { zh: '0 km · 新竹＆台中相聚 💕', en: '0 km · Together in Hsinchu & Taichung 💕' },
      desc: {
        zh: '盛夏 Eunice 北上新竹找 Tom，兩個人再一起搭車去台中散步覓食。',
        en: 'Eunice came up from Kaohsiung to visit Tom in Hsinchu, followed by a sunny summer trip together to Taichung.',
      },
      mapQuery: 'Taichung,Taiwan',
    },
    {
      year: '2015',
      dateTag: '2015.02',
      tom: { lat: 25.033, lng: 121.565, city: { zh: '台北（過年彰化屏東）', en: 'Taipei' } },
      eunice: { lat: 35.676, lng: 139.65, city: { zh: '日本東京 Tokyo', en: 'Tokyo, JP' } },
      lat: 35.676,
      lng: 139.65,
      place: {
        zh: '2015.02 · Tom 回台北工作 · Eunice 冬日東京行',
        en: 'Feb 2015 · Tom Working in Taipei · Eunice’s Winter Trip to Tokyo',
      },
      distanceLabel: { zh: '2,100 km · 台北 ↔ 東京', en: '2,100 km · Taipei ↔ Tokyo' },
      desc: {
        zh: 'Tom 回到台北展開職場生活，Eunice 在二月飛往東京旅行，隔海分享街頭的冬日空氣。',
        en: 'Tom began working in Taipei while Eunice traveled to Tokyo in February, sharing winter street scenes from afar.',
      },
      mapQuery: 'Tokyo,Japan',
    },
    {
      year: '2015',
      dateTag: '2015.10',
      tom: { lat: 24.147, lng: 120.673, city: { zh: '台中 Taichung', en: 'Taichung' } },
      eunice: { lat: 24.147, lng: 120.673, city: { zh: '台中 Taichung', en: 'Taichung' } },
      lat: 24.147,
      lng: 120.673,
      place: {
        zh: '2015.10 · Tom 新訓結訓，在台中好好見上一面',
        en: 'Oct 2015 · Reunion in Taichung After Basic Training',
      },
      distanceLabel: { zh: '0 km · 台中結訓重逢 💕', en: '0 km · Taichung Reunion 💕' },
      desc: {
        zh: '十月 Tom 剛結束新訓，Eunice 特地趕到台中會合，吃一頓好久不見的大餐。',
        en: 'As soon as Tom finished basic training in October, Eunice met him halfway in Taichung to celebrate.',
      },
      mapQuery: 'Taichung,Taiwan',
    },
    {
      year: '2015',
      dateTag: '2015.11',
      tom: { lat: 37.422, lng: 237.916, city: { zh: '美國加州 MTV', en: 'Mountain View, US' } },
      eunice: { lat: 35.676, lng: 139.65, city: { zh: '日本東京 Tokyo', en: 'Tokyo, JP' } },
      lat: 37.422,
      lng: 237.916,
      place: {
        zh: '2015.11 · 太平洋兩端：加州 Mountain View ↔ 日本東京',
        en: 'Nov 2015 · Across the Pacific: Mountain View ↔ Tokyo',
      },
      distanceLabel: { zh: '8,321 km · 飛越太平洋兩端', en: '8,321 km · Opposite Sides of the Pacific' },
      desc: {
        zh: '十一月一個飛往美國矽谷出差、一個在東京旅行，隔著整片太平洋互道早安與晚安。',
        en: 'One in Silicon Valley on business, the other strolling through autumn Tokyo — trading good mornings and goodnights across the Pacific.',
      },
      mapQuery: 'Mountain+View,CA,USA',
    },
    {
      year: '2015',
      dateTag: '2015.12',
      tom: {
        lat: 28.385,
        lng: 278.437,
        from: { lat: 25.033, lng: 121.565 },
        via: { lat: 37.62, lng: 237.62 },
        city: { zh: '經美西 ➔ 奧蘭多迪士尼', en: 'Via US West ➔ Orlando' },
      },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '高雄 Kaohsiung', en: 'Kaohsiung' } },
      lat: 28.385,
      lng: 278.437,
      place: {
        zh: '2015.12 · 奧蘭多 ↔ 高雄（十二年來最遠的 13,877 公里）',
        en: 'Dec 2015 · Orlando ↔ Kaohsiung (Our Furthest 13,877 km Apart)',
      },
      distanceLabel: { zh: '13,877 km · 十二年最遠距離 🌍', en: '13,877 km · Furthest Distance Apart 🌍' },
      desc: {
        zh: '十二月 Tom 飛越太平洋與北美大陸到佛州奧蘭多出差，和高雄的 Eunice 隔了整整半顆地球。',
        en: 'Tom flew via the US West Coast all the way to Orlando, Florida — 13,877 km from Eunice in Kaohsiung, half a world apart.',
      },
      mapQuery: 'Walt+Disney+World+Orlando,FL',
    },
    {
      year: '2016',
      dateTag: '2016.02 & 02.28',
      tom: {
        lat: 22.627,
        lng: 120.301,
        via: { lat: 37.62, lng: 237.62 },
        city: { zh: '高雄 Kaohsiung (228)', en: 'Kaohsiung' },
      },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '仙台 ➔ 高雄相聚', en: 'Sendai ➔ Kaohsiung' } },
      lat: 22.627,
      lng: 120.301,
      place: {
        zh: '2016.02 · 仙台冬雪歸來 ＆ 228 兩週年高雄約會',
        en: 'Feb 2016 · Back From Sendai & Two-Year Anniversary in Kaohsiung',
      },
      distanceLabel: { zh: '0 km · 兩週年高雄約會 💕', en: '0 km · 2nd Anniversary in Kaohsiung 💕' },
      desc: {
        zh: 'Eunice 二月從日本仙台看雪回來，2/28 兩週年那天 Tom 特地南下高雄一起慶祝。',
        en: 'Right after Eunice returned from snowy Sendai, Tom headed south to Kaohsiung to celebrate our 2/28 anniversary.',
      },
      mapQuery: 'Kaohsiung,Taiwan',
    },
    {
      year: '2016',
      dateTag: '2016.06',
      tom: {
        lat: 51.507,
        lng: -0.127,
        via: { lat: 25.204, lng: 55.27 },
        city: { zh: '經杜拜 ➔ 英國倫敦', en: 'Via Dubai ➔ London' },
      },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '高雄 Kaohsiung', en: 'Kaohsiung' } },
      lat: 51.507,
      lng: -0.127,
      place: {
        zh: '2016.06 · Tom 經杜拜飛往倫敦出差 ↔ Eunice 在高雄',
        en: 'Jun 2016 · Tom in London via Dubai ↔ Eunice in Kaohsiung',
      },
      distanceLabel: { zh: '9,820 km · 倫敦 ↔ 高雄', en: '9,820 km · London ↔ Kaohsiung' },
      desc: {
        zh: '六月 Tom 經杜拜飛往倫敦出差，七小時的時差裡，習慣了睡前與醒來的留言。',
        en: 'Tom flew via Dubai to London in June — seven hours apart, leaving voice notes for each other’s mornings.',
      },
      mapQuery: 'London,UK',
    },
    {
      year: '2016',
      dateTag: '2016.07',
      tom: {
        lat: 43.653,
        lng: 280.617,
        from: { lat: 25.033, lng: 121.565 },
        via: { lat: 37.62, lng: 237.62 },
        city: { zh: '經美西 ➔ 多倫多＆尼加拉瀑布', en: 'Via US West ➔ Toronto' },
      },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '高雄 Kaohsiung', en: 'Kaohsiung' } },
      lat: 43.653,
      lng: 280.617,
      place: {
        zh: '2016.07 · 加拿大多倫多出差 ＆ 尼加拉大瀑布',
        en: 'Jul 2016 · Toronto & Niagara Falls ↔ Kaohsiung',
      },
      distanceLabel: { zh: '12,376 km · 多倫多 ↔ 高雄', en: '12,376 km · Toronto ↔ Kaohsiung' },
      desc: {
        zh: '七月 Tom 飛往加拿大多倫多出差，在尼加拉瀑布的水霧前拍下照片傳回台灣。',
        en: 'Tom traveled via the US West Coast to Toronto in July, sending mist-soaked photos of Niagara Falls back to Kaohsiung.',
      },
      mapQuery: 'Niagara+Falls,Ontario,Canada',
    },
    {
      year: '2016',
      dateTag: '2016.09',
      tom: {
        lat: 25.033,
        lng: 121.565,
        via: { lat: 37.62, lng: 237.62 },
        city: { zh: '台北 Taipei', en: 'Taipei' },
      },
      eunice: { lat: 47.606, lng: 237.668, city: { zh: '美國西雅圖 Seattle', en: 'Seattle, US' } },
      lat: 47.606,
      lng: 237.668,
      place: {
        zh: '2016.09 · Eunice 的西雅圖初秋旅行 ↔ Tom 在台北',
        en: 'Sep 2016 · Eunice in Autumn Seattle ↔ Tom in Taipei',
      },
      distanceLabel: { zh: '9,770 km · 西雅圖 ↔ 台北', en: '9,770 km · Seattle ↔ Taipei' },
      desc: {
        zh: '換成 Eunice 飛越太平洋去西雅圖聞咖啡香，和台北的 Tom 交換日夜顛倒的風景。',
        en: 'Eunice crossed the Pacific to Seattle in September, trading coffee-scented street corners across inverted time zones.',
      },
      mapQuery: 'Seattle,WA,USA',
    },
    {
      year: '2016',
      dateTag: '2016.10–11',
      tom: {
        lat: 40.44,
        lng: 280.005,
        via: { lat: 37.774, lng: 237.581 },
        city: { zh: '經美西 ➔ 匹茲堡＆11月舊金山 SFO', en: 'Via US West ➔ Pittsburgh & SFO' },
      },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '高雄 Kaohsiung', en: 'Kaohsiung' } },
      lat: 40.44,
      lng: 280.005,
      place: {
        zh: '2016.10–11 · 美東匹茲堡出差 ＆ 舊金山灣區秋日',
        en: 'Oct–Nov 2016 · Pittsburgh Business Trip & San Francisco',
      },
      distanceLabel: { zh: '12,730 km · 匹茲堡 ↔ 高雄', en: '12,730 km · Pittsburgh ↔ Kaohsiung' },
      desc: {
        zh: '十月飛美東匹茲堡、十一月再訪舊金山灣區，飛行哩程越存越多，最想回的還是同一個地方。',
        en: 'October in Pittsburgh and November by the Golden Gate in San Francisco — counting down the miles until flying home.',
      },
      mapQuery: 'Pittsburgh,PA,USA',
    },
    {
      year: '2016',
      dateTag: '2016.12',
      tom: {
        lat: 25.033,
        lng: 121.565,
        via: { lat: 37.774, lng: 237.581 },
        city: { zh: '台北約會（成田/夏威夷）', en: 'Taipei (Narita/Hawaii)' },
      },
      eunice: { lat: 25.033, lng: 121.565, city: { zh: '台北約會 Taipei 💕', en: 'Taipei Date 💕' } },
      lat: 25.033,
      lng: 121.565,
      place: {
        zh: '2016.12 · 歲末台北約會（Tom 成田與夏威夷出差返台）',
        en: 'Dec 2016 · Year-End Taipei Date Around Tom’s Hawaii Trip',
      },
      distanceLabel: { zh: '0 km · 歲末台北相聚 💕', en: '0 km · Winter Date in Taipei 💕' },
      desc: {
        zh: '趁著十二月 Tom 從成田與夏威夷出差回台灣，Eunice 北上台北一起過暖暖的年末。',
        en: 'As soon as Tom landed back from Narita and Hawaii in December, Eunice came up to Taipei for a cozy year-end date.',
      },
      mapQuery: 'Taipei,Taiwan',
    },
    {
      year: '2017',
      dateTag: '2017.06',
      tom: { lat: 37.774, lng: 237.581, city: { zh: '舊金山 SFO 出差', en: 'San Francisco, US' } },
      eunice: { lat: 35.011, lng: 135.768, city: { zh: '日本京都 Kyoto', en: 'Kyoto, JP' } },
      lat: 35.011,
      lng: 135.768,
      place: {
        zh: '2017.06 · 舊金山灣區出差 ↔ 京都古都散步',
        en: 'Jun 2017 · San Francisco (SFO) ↔ Kyoto, Japan',
      },
      distanceLabel: { zh: '8,602 km · 舊金山 ↔ 京都', en: '8,602 km · San Francisco ↔ Kyoto' },
      desc: {
        zh: '六月 Tom 在舊金山灣區出差，Eunice 在京都的古寺與鴨川散步，隔著太平洋分享初夏照片。',
        en: 'June found Tom in San Francisco and Eunice strolling along Kyoto’s Kamo River, swapping early-summer photos across the ocean.',
      },
      mapQuery: 'Kyoto,Japan',
    },
    {
      year: '2017',
      dateTag: '2017.09–10',
      tom: { lat: 25.033, lng: 121.565, city: { zh: '關西 ➔ 台北相聚', en: 'Kansai ➔ Taipei' } },
      eunice: { lat: 25.033, lng: 121.565, city: { zh: '台北相聚 ➔ 10月北海道', en: 'Taipei ➔ Hokkaido' } },
      lat: 25.033,
      lng: 121.565,
      place: {
        zh: '2017.09–10 · 九月台北相聚（關西與北海道的秋日旅行）',
        en: 'Sep–Oct 2017 · Taipei Reunion Between Kansai & Hokkaido Trips',
      },
      distanceLabel: { zh: '0 km · 九月台北相聚 💕', en: '0 km · Autumn Reunion in Taipei 💕' },
      desc: {
        zh: '九月在台北好好重逢相聚，前後各自走訪關西與入秋的北海道。',
        en: 'Reunited in Taipei in September, tucked between autumn travels to Kansai and Hokkaido.',
      },
      mapQuery: 'Taipei,Taiwan',
    },
    {
      year: '2017',
      dateTag: '2017.11–12',
      tom: { lat: 25.033, lng: 121.565, city: { zh: '台北約會（12月初奧斯汀）', en: 'Taipei (Austin Trip)' } },
      eunice: { lat: 25.033, lng: 121.565, city: { zh: '11月＆12月台北約會 💕', en: 'Taipei Dates 💕' } },
      lat: 25.033,
      lng: 121.565,
      place: {
        zh: '2017.11–12 · 連續兩個月的台北秋冬約會',
        en: 'Nov–Dec 2017 · Cozy Winter Dates in Taipei',
      },
      distanceLabel: { zh: '0 km · 台北秋冬約會 💕', en: '0 km · Cozy Taipei Dates 💕' },
      desc: {
        zh: '十一月與十二月 Eunice 連續北上台北約會，趁著 Tom 飛德州奧斯汀出差前後把相處時間補滿。',
        en: 'Eunice came up to Taipei in both November and December, making the most of weekends around Tom’s Austin trip.',
      },
      mapQuery: 'Taipei,Taiwan',
    },
    {
      year: '2018',
      dateTag: '2018.02',
      tom: { lat: 25.033, lng: 121.565, city: { zh: '台北 Taipei', en: 'Taipei' } },
      eunice: { lat: 34.693, lng: 135.502, city: { zh: '日本關西 Kansai', en: 'Kansai, JP' } },
      lat: 34.693,
      lng: 135.502,
      place: {
        zh: '2018.02 · Eunice 冬日關西小旅行 ↔ Tom 在台北',
        en: 'Feb 2018 · Eunice in Kansai ↔ Tom in Taipei',
      },
      distanceLabel: { zh: '1,720 km · 台北 ↔ 關西', en: '1,720 km · Taipei ↔ Kansai' },
      desc: {
        zh: '出國長住前的那個冬天，Eunice 走訪日本關西，Tom 在台北準備迎接即將到來的歐洲新篇章。',
        en: 'In February 2018, Eunice explored Kansai while Tom prepared in Taipei for his upcoming move to Europe.',
      },
      mapQuery: 'Osaka,Japan',
    },
    {
      year: '2018',
      dateTag: '2018.06–07',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '東京 ➔ 德國柏林 Berlin', en: 'Tokyo ➔ Berlin' } },
      eunice: { lat: 52.52, lng: 13.405, city: { zh: '東京 ➔ 德國柏林 Berlin', en: 'Tokyo ➔ Berlin' } },
      lat: 52.52,
      lng: 13.405,
      place: {
        zh: '2018.06–07 · 一起飛往東京與德國柏林，安頓新生活',
        en: 'Jun–Jul 2018 · Together to Tokyo & Settling Into Berlin',
      },
      distanceLabel: { zh: '0 km · 東京＆柏林同行 💕', en: '0 km · Side by Side in Berlin 💕' },
      desc: {
        zh: '盛夏 Eunice 陪著 Tom 一起走過東京、再飛抵德國柏林安頓新家，把陌生的歐洲街角先走熟一遍。',
        en: 'Traveled together through Tokyo and on to Berlin in summer 2018 so Eunice could help Tom settle into his new city.',
      },
      mapQuery: 'Berlin,Germany',
    },
    {
      year: '2018',
      dateTag: '2018.11–12',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林（12月奧蘭多）', en: 'Berlin (Dec Orlando)' } },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '台灣高雄 Kaohsiung', en: 'Kaohsiung, TW' } },
      lat: 52.52,
      lng: 13.405,
      place: {
        zh: '2018.11–12 · 柏林 ↔ 高雄 9,100 公里的跨洲日常',
        en: 'Nov–Dec 2018 · 9,100 km Long Distance: Berlin ↔ Kaohsiung',
      },
      distanceLabel: { zh: '9,100 km · 柏林 ↔ 高雄', en: '9,100 km · Berlin ↔ Kaohsiung' },
      desc: {
        zh: '正式展開柏林與高雄六、七個小時時差的遠距離生活；十一月 Tom 飛回台灣見面，十二月再飛奧蘭多後返德。',
        en: 'Living 9,100 km and seven time zones apart between Berlin and Kaohsiung, anchored by a sweet November reunion in Taiwan.',
      },
      mapQuery: 'Berlin,Germany',
    },
    {
      year: '2019',
      dateTag: '2019.01–02',
      tom: { lat: 52.367, lng: 4.904, city: { zh: '阿姆斯特丹/波蘭/住柏林', en: 'Amsterdam/Poland/Berlin' } },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '台灣高雄 Kaohsiung', en: 'Kaohsiung, TW' } },
      lat: 52.367,
      lng: 4.904,
      place: {
        zh: '2019.01–02 · 阿姆斯特丹與波蘭冬雪 ↔ 高雄暖陽',
        en: 'Jan–Feb 2019 · Winter in Amsterdam & Poland ↔ Sunny Kaohsiung',
      },
      distanceLabel: { zh: '9,606 km · 阿姆斯特丹 ↔ 高雄', en: '9,606 km · Amsterdam ↔ Kaohsiung' },
      desc: {
        zh: '歐洲冷冽的一、二月，Tom 走訪阿姆斯特丹運河與波蘭返回柏林，每天隔著螢幕和高雄的 Eunice 分享生活。',
        en: 'Winter canals in Amsterdam and snow in Poland while staying connected every single day with Eunice in warm Kaohsiung.',
      },
      mapQuery: 'Amsterdam,Netherlands',
    },
    {
      year: '2019',
      dateTag: '2019.06',
      tom: { lat: 50.116, lng: 237.043, city: { zh: '溫哥華 ＆ Whistler', en: 'Whistler & Vancouver' } },
      eunice: { lat: 50.116, lng: 237.043, city: { zh: '溫哥華 ＆ Whistler', en: 'Whistler & Vancouver' } },
      lat: 50.116,
      lng: 237.043,
      place: {
        zh: '2019.06 · 各飛半顆地球，在加拿大溫哥華與惠斯勒重逢',
        en: 'Jun 2019 · Meeting Halfway Across the World in Whistler & Vancouver',
      },
      distanceLabel: { zh: '0 km · 加拿大重逢同遊 💕', en: '0 km · Reunited in Canada 💕' },
      desc: {
        zh: '六月一個從柏林飛越大西洋、一個從台灣飛越太平洋，約在加拿大溫哥華與惠斯勒山間重逢擁抱。',
        en: 'One flew across the Atlantic from Berlin, the other across the Pacific from Taiwan — meeting in the mountains of Whistler and Vancouver.',
      },
      mapQuery: 'Whistler,BC,Canada',
    },
    {
      year: '2019',
      dateTag: '2019.08–09',
      tom: {
        lat: 52.955,
        lng: -1.158,
        from: { lat: 25.033, lng: 121.565 },
        city: { zh: '倫敦＆諾丁漢 ➔ 住柏林', en: 'London/Nottingham ➔ Berlin' },
      },
      eunice: {
        lat: 52.955,
        lng: -1.158,
        from: { lat: 22.627, lng: 120.301 },
        city: { zh: '英國諾丁漢留學 🇬🇧', en: 'Nottingham, UK 🇬🇧' },
      },
      lat: 52.955,
      lng: -1.158,
      place: {
        zh: '2019.08–09 · Eunice 赴英國諾丁漢留學 · 終於住進同一片歐洲天空下',
        en: 'Aug–Sep 2019 · Eunice Began Studying in Nottingham — Both in Europe at Last',
      },
      distanceLabel: { zh: '0 km ➔ 920 km · 同在歐洲！', en: '0 km ➔ 920 km · Same Continent at Last!' },
      desc: {
        zh: '九月 Eunice 前往英國諾丁漢讀書，Tom 特地飛往倫敦與諾丁漢相伴——9,100 公里的距離，終於縮短成一張歐洲短程機票。',
        en: 'Eunice moved to Nottingham for grad school and Tom visited in September — shrinking 9,100 km into a short hop across Europe.',
      },
      mapQuery: 'Nottingham,UK',
    },
    {
      year: '2019',
      dateTag: '2019.11',
      tom: { lat: 48.856, lng: 2.352, city: { zh: '法國巴黎 Paris', en: 'Paris, FR' } },
      eunice: { lat: 48.856, lng: 2.352, city: { zh: '法國巴黎 Paris', en: 'Paris, FR' } },
      lat: 48.856,
      lng: 2.352,
      place: {
        zh: '2019.11 · 從柏林與諾丁漢出發，在巴黎街頭會合',
        en: 'Nov 2019 · Rendezvous in Paris From Berlin & Nottingham',
      },
      distanceLabel: { zh: '0 km · 巴黎深秋約會 💕', en: '0 km · Autumn Rendezvous in Paris 💕' },
      desc: {
        zh: '十一月各自從德國與英國飛往法國巴黎，在塞納河畔度過深秋的週末。',
        en: 'Flying in from Berlin and Nottingham to spend a crisp November weekend together along the Seine in Paris.',
      },
      mapQuery: 'Paris,France',
    },
    {
      year: '2019',
      dateTag: '2019.12',
      tom: { lat: 50.075, lng: 14.437, city: { zh: '柏林 ➔ 捷克布拉格', en: 'Berlin ➔ Prague' } },
      eunice: { lat: 50.075, lng: 14.437, city: { zh: '柏林 ➔ 捷克布拉格', en: 'Berlin ➔ Prague' } },
      lat: 50.075,
      lng: 14.437,
      place: {
        zh: '2019.12 · 柏林相聚 ＆ 捷克布拉格的聖誕市集',
        en: 'Dec 2019 · Berlin Together & Christmas Markets in Prague',
      },
      distanceLabel: { zh: '0 km · 柏林＆布拉格聖誕月 💕', en: '0 km · December in Berlin & Prague 💕' },
      desc: {
        zh: '十二月 Eunice 飛來柏林，兩個人再一起搭車去捷克布拉格逛聖誕市集、喝熱紅酒。',
        en: 'Eunice flew to Berlin in December and together we wandered through fairytale Christmas lights in Prague.',
      },
      mapQuery: 'Prague,Czechia',
    },
    {
      year: '2020',
      dateTag: '2020.02',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林 Berlin', en: 'Berlin, DE' } },
      eunice: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林 Berlin', en: 'Berlin, DE' } },
      lat: 52.52,
      lng: 13.405,
      place: {
        zh: '2020.02 · 柏林冬末的相聚時光',
        en: 'Feb 2020 · Late-Winter Days Together in Berlin',
      },
      distanceLabel: { zh: '0 km · 柏林冬日相聚 💕', en: '0 km · Winter Days in Berlin 💕' },
      desc: {
        zh: '2020 年二月 Eunice 從英國飛到柏林相聚，誰也沒想到那是疫情封城前最後一次歐洲重逢。',
        en: 'Eunice flew from the UK to Berlin in February 2020 — our last quiet European reunion just before the world locked down.',
      },
      mapQuery: 'Berlin,Germany',
    },
    {
      year: '2020',
      dateTag: '2020.03–04',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林 Berlin', en: 'Berlin, DE' } },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '英國封城 ➔ 4月返高雄', en: 'UK Lockdown ➔ Kaohsiung' } },
      lat: 22.627,
      lng: 120.301,
      place: {
        zh: '2020.03–04 · 歐洲封城時刻 · Eunice 平安飛回高雄',
        en: 'Mar–Apr 2020 · UK Lockdown & Safe Return to Kaohsiung',
      },
      distanceLabel: { zh: '9,100 km · 疫情裡的跨洲牽掛', en: '9,100 km · Holding Close Through Lockdown' },
      desc: {
        zh: '三月遇上疫情封城，四月 Eunice 平安飛回台灣高雄，與留在柏林的 Tom 隔海彼此牽掛守候。',
        en: 'When COVID lockdowns hit Europe in March, Eunice flew safely home to Kaohsiung in April while Tom remained in Berlin.',
      },
      mapQuery: 'Kaohsiung,Taiwan',
    },
    {
      year: '2020',
      dateTag: '2020.10',
      tom: { lat: 23.859, lng: 120.915, city: { zh: '日月潭／台中／嘉義', en: 'Sun Moon Lake & Taichung' } },
      eunice: { lat: 23.859, lng: 120.915, city: { zh: '日月潭／台中／高雄', en: 'Sun Moon Lake & Taichung' } },
      lat: 23.859,
      lng: 120.915,
      place: {
        zh: '2020.10 · 久違返台重逢 · 日月潭與台中秋日散心',
        en: 'Oct 2020 · Long-Awaited Reunion at Sun Moon Lake & Taichung',
      },
      distanceLabel: { zh: '0 km · 台灣重逢小旅行 💕', en: '0 km · Home Again in Taiwan 💕' },
      desc: {
        zh: '十月 Tom 回台灣休假，隔離出關後一起去日月潭、台中與嘉義走走，珍惜久違的面對面時光。',
        en: 'Tom returned to Taiwan in October, and after quarantine we headed straight to Sun Moon Lake and Taichung together.',
      },
      mapQuery: 'Sun+Moon+Lake,Nantou,Taiwan',
    },
    {
      year: '2021',
      dateTag: '2020.11 – 2021.04',
      tom: { lat: 25.009, lng: 121.459, city: { zh: '新北板橋 Banqiao', en: 'Banqiao, New Taipei' } },
      eunice: { lat: 25.009, lng: 121.459, city: { zh: '新北板橋 Banqiao', en: 'Banqiao, New Taipei' } },
      lat: 25.009,
      lng: 121.459,
      place: {
        zh: '2020.11 & 2021.04 · 遠距離正式畫下句點 · 一起定居板橋',
        en: 'Nov 2020 & Apr 2021 · Long Distance Ended — Home Together in Banqiao',
      },
      distanceLabel: { zh: '0 km · 板橋小家日常 💕', en: '0 km · Everyday Life in Banqiao 💕' },
      desc: {
        zh: 'Eunice 先在十一月搬來板橋，隔年四月 Tom 正式返台定居——多年跨洲與南北奔波，終於變成每天一起吃晚餐。',
        en: 'Eunice moved to Banqiao in Nov 2020 and Tom returned for good in Apr 2021 — turning airport farewells into everyday dinners.',
      },
      mapQuery: 'Banqiao,New+Taipei,Taiwan',
    },
    {
      year: '2024',
      dateTag: '2024',
      tom: { lat: 25.041, lng: 121.544, city: { zh: '台北忠孝復興', en: 'Zhongxiao Fuxing, Taipei' } },
      eunice: { lat: 25.041, lng: 121.544, city: { zh: '台北忠孝復興', en: 'Zhongxiao Fuxing, Taipei' } },
      lat: 25.041,
      lng: 121.544,
      place: {
        zh: '2024 · 一起搬進台北忠孝復興的新生活',
        en: '2024 · Our New Home Around Zhongxiao Fuxing, Taipei',
      },
      distanceLabel: { zh: '0 km · 忠孝復興新家 💕', en: '0 km · Home in Taipei 💕' },
      desc: {
        zh: '2024 年一起搬到台北忠孝復興，把日子過得踏實而溫暖。',
        en: 'Moved together to Zhongxiao Fuxing in central Taipei in 2024, building a cozy rhythm side by side.',
      },
      mapQuery: 'MRT+Zhongxiao+Fuxing+Station,Taipei',
    },
    {
      year: '2026',
      dateTag: '2026.09',
      tom: { lat: 47.562, lng: 13.649, city: { zh: '奧地利蜜月 Austria', en: 'Austria Honeymoon' } },
      eunice: { lat: 47.562, lng: 13.649, city: { zh: '奧地利蜜月 Austria', en: 'Austria Honeymoon' } },
      lat: 47.562,
      lng: 13.649,
      place: {
        zh: '2026.09 · 奧地利維也納與湖區蜜月之旅',
        en: 'Sep 2026 · Honeymoon in Vienna & Hallstatt, Austria',
      },
      distanceLabel: { zh: '0 km · 奧地利蜜月同行 💕', en: '0 km · Austria Honeymoon Together 💕' },
      desc: {
        zh: '九月牽手飛往奧地利維也納與哈修塔特湖區，在阿爾卑斯山的晨霧裡慢下腳步。',
        en: 'Wandering hand in hand through musical Vienna and the misty Alpine lakes of Hallstatt on our September honeymoon.',
      },
      mapQuery: 'Hallstatt,Austria',
    },
    {
      year: '2026',
      dateTag: '2026.11.29',
      tom: { lat: 25.047, lng: 121.532, city: { zh: '陽明山美軍俱樂部', en: 'Brick Yard 33 1/3' } },
      eunice: { lat: 25.047, lng: 121.532, city: { zh: '陽明山美軍俱樂部', en: 'Brick Yard 33 1/3' } },
      lat: 25.047,
      lng: 121.532,
      place: {
        zh: '2026.11.29 · 陽明山美軍俱樂部，我們結婚了 💍🥂',
        en: '2026.11.29 · Married at Brick Yard 33 1/3, Yangmingshan 💍🥂',
      },
      distanceLabel: { zh: '0 km · 往後餘生都在一起 ∞ 💕', en: '0 km · Side by Side for Life ∞ 💕' },
      desc: {
        zh: '從 2014 到 2026，繞過半顆地球的時差與飛行，今天在陽明山與最珍惜的你們相見！',
        en: 'From 2014 to 2026 — after every flight, ocean, and time zone, celebrating our wedding day here with you!',
      },
      mapQuery: 'Taipei,Taiwan',
    },
  ];

  const MAX_URL_LENGTH = 300;
  const STORAGE_KEY_THEME = 'wedding_20261129_theme';
  const STORAGE_KEY_MS = 'wedding_20261129_show_ms';
  const STORAGE_KEY_LANG = 'wedding_20261129_lang';

  // DOM Elements
  const elDays = document.getElementById('val-days');
  const elHours = document.getElementById('val-hours');
  const elMinutes = document.getElementById('val-minutes');
  const elSeconds = document.getElementById('val-seconds');
  const elMs = document.getElementById('val-ms');

  const elLabelDays = document.getElementById('label-days');
  const elLabelHours = document.getElementById('label-hours');
  const elLabelMinutes = document.getElementById('label-minutes');
  const elLabelSeconds = document.getElementById('label-seconds');

  const COUPLE_START_TIMESTAMP = new Date('2014-02-28T00:00:00+08:00').getTime();
  const elLoveStoryBodyCountdown = document.getElementById('love-story-body-countdown');
  const elLoveStoryBodyHub = document.getElementById('love-story-body-hub');
  const elLoveSignatureCountdown = document.getElementById('love-signature-countdown');
  const elLoveSignatureHub = document.getElementById('love-signature-hub');

  const elCurrentTwTime = document.getElementById('current-tw-time');
  const elClockCaption = document.getElementById('clock-caption');
  const elStateLabel = document.getElementById('countdown-state-label');
  const elEventTitle = document.getElementById('event-title');
  const elTargetSubtitle = document.getElementById('target-subtitle');

  const btnBgm = document.getElementById('bgm-btn');
  const btnLang = document.getElementById('lang-btn');
  const elLangBtnLabel = document.getElementById('lang-btn-label');
  const btnToggleMs = document.getElementById('toggle-ms-btn');
  const btnTheme = document.getElementById('theme-btn');
  const btnFullscreen = document.getElementById('fullscreen-btn');
  const btnCelebrate = document.getElementById('celebrate-btn');
  let bgmPlaying = false;
  let lastRenderedTogetherDays = null;

  // Time-Up Hub & Pre-Countdown Quick Access Elements
  const elCountdownStageWrap = document.getElementById('countdown-stage-wrap');
  const btnCountdownSeating = document.getElementById('countdown-seating-btn');
  const btnCountdownMenu = document.getElementById('countdown-menu-btn');
  const elCountdownSeatingTitle = document.getElementById('countdown-seating-title');
  const elCountdownSeatingSub = document.getElementById('countdown-seating-sub');
  const elCountdownMenuTitle = document.getElementById('countdown-menu-title');
  const elCountdownMenuSub = document.getElementById('countdown-menu-sub');

  const elTimeupHub = document.getElementById('timeup-hub');
  const elChoiceCardsGrid = document.getElementById('choice-cards-grid');
  const btnChooseVideoCard = document.getElementById('choose-video-card');
  const btnChooseQuizCard = document.getElementById('choose-quiz-card');
  const btnChooseSharePhotosCard = document.getElementById('choose-share-photos-card');
  const btnChooseGalleryCard = document.getElementById('choose-gallery-card');
  const btnChooseFootprintsCard = document.getElementById('choose-footprints-card');
  const btnChooseSeatingCard = document.getElementById('choose-seating-card');
  const btnChooseMenuCard = document.getElementById('choose-menu-card');

  const elVideoCardEyebrow = document.getElementById('video-card-eyebrow');
  const elVideoCardTitle = document.getElementById('video-card-title');
  const elVideoCardDesc = document.getElementById('video-card-desc');
  const elVideoCardCta = document.getElementById('video-card-cta');
  const elQuizCardEyebrow = document.getElementById('quiz-card-eyebrow');
  const elQuizCardTitle = document.getElementById('quiz-card-title');
  const elQuizCardDesc = document.getElementById('quiz-card-desc');
  const elQuizCardCta = document.getElementById('quiz-card-cta');
  const elShareCardEyebrow = document.getElementById('share-photos-card-eyebrow');
  const elShareCardTitle = document.getElementById('share-photos-card-title');
  const elShareCardDesc = document.getElementById('share-photos-card-desc');
  const elShareCardCta = document.getElementById('share-photos-card-cta');
  const elGalleryCardEyebrow = document.getElementById('gallery-card-eyebrow');
  const elGalleryCardTitle = document.getElementById('gallery-card-title');
  const elGalleryCardDesc = document.getElementById('gallery-card-desc');
  const elGalleryCardCta = document.getElementById('gallery-card-cta');
  const elFootprintsCardEyebrow = document.getElementById('footprints-card-eyebrow');
  const elFootprintsCardTitle = document.getElementById('footprints-card-title');
  const elFootprintsCardDesc = document.getElementById('footprints-card-desc');
  const elFootprintsCardCta = document.getElementById('footprints-card-cta');
  const elSeatingCardEyebrow = document.getElementById('seating-card-eyebrow');
  const elSeatingCardTitle = document.getElementById('seating-card-title');
  const elSeatingCardDesc = document.getElementById('seating-card-desc');
  const elSeatingCardCta = document.getElementById('seating-card-cta');
  const elMenuCardEyebrow = document.getElementById('menu-card-eyebrow');
  const elMenuCardTitle = document.getElementById('menu-card-title');
  const elMenuCardDesc = document.getElementById('menu-card-desc');
  const elMenuCardCta = document.getElementById('menu-card-cta');

  const elHubNavBar = document.getElementById('hub-nav-bar');
  const btnTabBackHub = document.getElementById('tab-back-hub');
  const btnTabVideo = document.getElementById('tab-video-btn');
  const btnTabQuiz = document.getElementById('tab-quiz-btn');
  const btnTabSharePhotos = document.getElementById('tab-share-photos-btn');
  const btnTabGallery = document.getElementById('tab-gallery-btn');
  const btnTabFootprints = document.getElementById('tab-footprints-btn');
  const btnTabSeating = document.getElementById('tab-seating-btn');
  const btnTabMenu = document.getElementById('tab-menu-btn');

  // Share Photos, Gallery, Footprints, Seating & Banquet Menu Panels
  const elSharePhotosSection = document.getElementById('share-photos-section');
  const elSharePanelEyebrow = document.getElementById('share-panel-eyebrow');
  const elSharePanelTitle = document.getElementById('share-panel-title');
  const elSharePanelDesc = document.getElementById('share-panel-desc');
  const elShareStep1 = document.getElementById('share-step-1');
  const elShareStep2 = document.getElementById('share-step-2');
  const elGooglePhotosShareLink = document.getElementById('google-photos-share-link');

  const elGallerySection = document.getElementById('gallery-section');
  const elGalleryPanelEyebrow = document.getElementById('gallery-panel-eyebrow');
  const elGalleryPanelTitle = document.getElementById('gallery-panel-title');
  const elGooglePhotosMemoriesLink = document.getElementById('google-photos-memories-link');
  const elGalleryEraBar = document.getElementById('gallery-era-bar');
  const elMemoryGalleryGrid = document.getElementById('memory-gallery-grid');

  const elFootprintsSection = document.getElementById('footprints-section');
  const elFootprintsPanelEyebrow = document.getElementById('footprints-panel-eyebrow');
  const elFootprintsPanelTitle = document.getElementById('footprints-panel-title');
  const elFootprintStats = document.getElementById('footprint-stats');
  const elFootprintTrackTom = document.getElementById('footprint-track-tom');
  const elFootprintTrackEunice = document.getElementById('footprint-track-eunice');
  const elFootprintYearBar = document.getElementById('footprint-year-bar');
  const elFootprintTimelineList = document.getElementById('footprint-timeline-list');
  const elTimelineVideoCanvas = document.getElementById('timeline-video-canvas');
  const btnTimelinePlay = document.getElementById('timeline-play-btn');
  const btnTimelinePrev = document.getElementById('timeline-prev-btn');
  const btnTimelineNext = document.getElementById('timeline-next-btn');
  const btnTimelineSpeed = document.getElementById('timeline-speed-btn');
  const btnTimelineReplay = document.getElementById('timeline-replay-btn');
  const btnTimelineExport = document.getElementById('timeline-export-btn');
  const elTimelineScrubberFill = document.getElementById('timeline-scrubber-fill');

  const elSeatingSection = document.getElementById('seating-section');
  const elSeatingPanelEyebrow = document.getElementById('seating-panel-eyebrow');
  const elSeatingPanelTitle = document.getElementById('seating-panel-title');
  const elSeatingExternalLink = document.getElementById('seating-external-link');
  const elSeatingSearchInput = document.getElementById('seating-search-input');
  const elSeatingPhotoStage = document.getElementById('seating-photo-stage');
  const elSeatingTablesGrid = document.getElementById('seating-tables-grid');

  const elBanquetMenuSection = document.getElementById('banquet-menu-section');
  const elMenuPanelEyebrow = document.getElementById('menu-panel-eyebrow');
  const elMenuPanelTitle = document.getElementById('menu-panel-title');
  const elMenuExternalLink = document.getElementById('menu-external-link');
  const elBanquetMenuNote = document.getElementById('banquet-menu-note');
  const elMenuPhotoStage = document.getElementById('menu-photo-stage');
  const elBanquetCoursesList = document.getElementById('banquet-courses-list');

  // Media Embed Elements
  const elMediaSection = document.getElementById('media-section');
  const elMediaCard = document.getElementById('media-card');
  const elMediaBadge = document.getElementById('media-badge');
  const elMediaFrameWrap = document.getElementById('media-frame-wrap');

  // Quiz Elements
  const elQuizSection = document.getElementById('quiz-section');
  const elQuizQuestionView = document.getElementById('quiz-question-view');
  const elQuizSummaryView = document.getElementById('quiz-summary-view');
  const elQuizProgressText = document.getElementById('quiz-progress-text');
  const elQuizScoreBadge = document.getElementById('quiz-score-badge');
  const elQuizProgressFill = document.getElementById('quiz-progress-fill');
  const elQuizQuestionTitle = document.getElementById('quiz-question-title');
  const elQuizCodeBlock = document.getElementById('quiz-code-block');
  const elQuizCodeContent = document.getElementById('quiz-code-content');
  const elQuizOptionsList = document.getElementById('quiz-options-list');
  const elQuizExplanationBox = document.getElementById('quiz-explanation-box');
  const elQuizResultHeadline = document.getElementById('quiz-result-headline');
  const elQuizExplanationText = document.getElementById('quiz-explanation-text');
  const btnQuizNext = document.getElementById('quiz-next-btn');
  const elQuizCompletedEyebrow = document.getElementById('quiz-completed-eyebrow');
  const elQuizSummaryTitle = document.getElementById('quiz-summary-title');
  const elQuizFinalScore = document.getElementById('quiz-final-score');
  const elQuizFamiliarityBadge = document.getElementById('quiz-familiarity-badge');
  const elQuizSummaryRank = document.getElementById('quiz-summary-rank');
  const btnQuizRestart = document.getElementById('quiz-restart-btn');
  const btnQuizToVideo = document.getElementById('quiz-to-video-btn');

  const elSummarySealHint = document.getElementById('easter-watermark-hint');
  const elSummarySealCode = document.getElementById('easter-base64-code');

  const SUMMARY_HINT_VECTORS = [
    73, 127, 216, 37, 1, 146, 15, 146, 182, 89, 178, 39, 253, 96, 27, 131,
    171, 84, 209, 20, 65, 95, 170, 183, 139, 209, 255, 31, 193,
  ];

  const SUMMARY_SEAL_VECTORS = [
    239, 78, 69, 230, 229, 58, 131, 162, 185, 187, 230, 99, 8, 226, 181, 123,
    118, 216, 220, 140, 254, 34, 69, 203, 213, 220, 205, 108, 235, 202, 125, 47, 42,
  ];

  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_e) {
      // ignore storage quota or private mode security error
    }
  }

  function sanitizeSafeUrl(rawUrl, allowDataImage = false) {
    if (typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.length > MAX_URL_LENGTH) return '';
    if (allowDataImage && /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(trimmed)) {
      return trimmed;
    }
    if (/^[a-zA-Z0-9._/-]+\.(jpe?g|png|webp|gif|avif|svg)(\?[a-zA-Z0-9=&_.-]+)?$/.test(trimmed) && !trimmed.startsWith('//')) {
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.username || parsed.password) return '';
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.href;
      }
    } catch (_e) {
      return '';
    }
    return '';
  }

  let currentLang = safeGetStorage(STORAGE_KEY_LANG) === 'en' ? 'en' : 'zh';
  let showMs = safeGetStorage(STORAGE_KEY_MS) === 'true';
  let isTimeUp = false;
  let renderedMediaKey = '';

  // Quiz State
  let quizStarted = false;
  let quizIndex = 0;
  let quizScore = 0;
  let groomScore = 0;
  let brideScore = 0;
  let quizAnswered = false;
  let lastSelectedOption = null;
  let selectedGalleryEra = 'all';
  let selectedFootprintYear = 'all';
  let timelinePlaying = false;
  let timelineRecording = false;
  let timelineProgress = 0; // 預設從 2014 起點聚焦兩人距離，點播放或拖曳進度條可瀏覽 2014–2026 全程
  let timelineAnimId = null;
  let timelineLastTs = 0;
  let timelineSpeedMultiplier = 1.0; // 支援 0.5x / 1.0x / 1.5x / 2.0x 調整播放速度
  const TIMELINE_DURATION_MS = 88000; // 88 秒從容播放 2014–2026 雙人軌跡與每站停留聚焦 (每站約 2.85 秒)

  // Formatters
  const twFormatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const numberFormatter = new Intl.NumberFormat('en-US');

  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function t() {
    return I18N[currentLang];
  }

  function computeDaysTogether(nowMs) {
    const elapsed = Math.max(0, nowMs - COUPLE_START_TIMESTAMP);
    return Math.floor(elapsed / 86400000) + 1;
  }

  function renderLoveStoryNote(force = false) {
    const days = computeDaysTogether(Date.now());
    if (!force && days === lastRenderedTogetherDays) return;
    lastRenderedTogetherDays = days;

    const dict = t();
    const parts = dict.loveNoteParts;
    const daysText = numberFormatter.format(days);

    [elLoveStoryBodyCountdown, elLoveStoryBodyHub].forEach((container) => {
      if (!container || !parts) return;
      const daysStrong = document.createElement('strong');
      daysStrong.className = 'love-days-num';
      daysStrong.textContent = daysText;

      const kmStrong = document.createElement('strong');
      kmStrong.textContent = parts.km;

      container.replaceChildren(
        document.createTextNode(parts.prefix),
        daysStrong,
        document.createTextNode(parts.mid),
        kmStrong,
        document.createTextNode(parts.suffix)
      );
    });

    if (elLoveSignatureCountdown) elLoveSignatureCountdown.textContent = dict.loveSignature;
    if (elLoveSignatureHub) elLoveSignatureHub.textContent = dict.loveSignature;
  }

  function syncBgmButtonA11y() {
    if (!btnBgm) return;
    const dict = t();
    const titleStr = bgmPlaying ? dict.bgmPauseTitle : dict.bgmPlayTitle;
    btnBgm.setAttribute('aria-pressed', String(bgmPlaying));
    btnBgm.setAttribute('title', titleStr);
    btnBgm.setAttribute('aria-label', titleStr);
  }

  function applyLanguage() {
    const dict = t();
    document.documentElement.setAttribute('data-lang', currentLang);
    document.documentElement.setAttribute('lang', currentLang === 'en' ? 'en' : 'zh-Hant-TW');
    document.title = dict.pageTitle;

    elLangBtnLabel.textContent = dict.langBtnLabel;
    if (btnLang) {
      btnLang.setAttribute('title', dict.langBtnTitle);
      btnLang.setAttribute('aria-label', dict.langBtnTitle);
    }
    if (btnTheme) {
      btnTheme.setAttribute('title', dict.themeBtnTitle);
      btnTheme.setAttribute('aria-label', dict.themeBtnTitle);
    }
    if (btnFullscreen) {
      btnFullscreen.setAttribute('title', dict.fullscreenBtnTitle);
      btnFullscreen.setAttribute('aria-label', dict.fullscreenBtnTitle);
    }
    syncBgmButtonA11y();

    elStateLabel.textContent = isTimeUp ? dict.eyebrowTimeUp : dict.eyebrowCountdown;
    elEventTitle.textContent = dict.eventTitle;
    elTargetSubtitle.textContent = dict.targetSubtitle;

    elLabelDays.textContent = dict.labelDays;
    elLabelHours.textContent = dict.labelHours;
    elLabelMinutes.textContent = dict.labelMinutes;
    elLabelSeconds.textContent = dict.labelSeconds;

    renderLoveStoryNote(true);

    elVideoCardEyebrow.textContent = dict.videoCardEyebrow;
    elVideoCardTitle.textContent = dict.videoCardTitle;
    elVideoCardDesc.textContent = dict.videoCardDesc;
    elVideoCardCta.textContent = dict.videoCardCta;

    elQuizCardEyebrow.textContent = dict.quizCardEyebrow;
    elQuizCardTitle.textContent = dict.quizCardTitle;
    elQuizCardDesc.textContent = dict.quizCardDesc;
    elQuizCardCta.textContent = dict.quizCardCta;

    if (elShareCardEyebrow) elShareCardEyebrow.textContent = dict.shareCardEyebrow;
    if (elShareCardTitle) elShareCardTitle.textContent = dict.shareCardTitle;
    if (elShareCardDesc) elShareCardDesc.textContent = dict.shareCardDesc;
    if (elShareCardCta) elShareCardCta.textContent = dict.shareCardCta;

    if (elGalleryCardEyebrow) elGalleryCardEyebrow.textContent = dict.galleryCardEyebrow;
    if (elGalleryCardTitle) elGalleryCardTitle.textContent = dict.galleryCardTitle;
    if (elGalleryCardDesc) elGalleryCardDesc.textContent = dict.galleryCardDesc;
    if (elGalleryCardCta) elGalleryCardCta.textContent = dict.galleryCardCta;

    if (elFootprintsCardEyebrow) elFootprintsCardEyebrow.textContent = dict.footprintsCardEyebrow;
    if (elFootprintsCardTitle) elFootprintsCardTitle.textContent = dict.footprintsCardTitle;
    if (elFootprintsCardDesc) elFootprintsCardDesc.textContent = dict.footprintsCardDesc;
    if (elFootprintsCardCta) elFootprintsCardCta.textContent = dict.footprintsCardCta;

    if (elSeatingCardEyebrow) elSeatingCardEyebrow.textContent = dict.seatingCardEyebrow;
    if (elSeatingCardTitle) elSeatingCardTitle.textContent = dict.seatingCardTitle;
    if (elSeatingCardDesc) elSeatingCardDesc.textContent = dict.seatingCardDesc;
    if (elSeatingCardCta) elSeatingCardCta.textContent = dict.seatingCardCta;

    if (elMenuCardEyebrow) elMenuCardEyebrow.textContent = dict.menuCardEyebrow;
    if (elMenuCardTitle) elMenuCardTitle.textContent = dict.menuCardTitle;
    if (elMenuCardDesc) elMenuCardDesc.textContent = dict.menuCardDesc;
    if (elMenuCardCta) elMenuCardCta.textContent = dict.menuCardCta;

    if (elCountdownSeatingTitle) elCountdownSeatingTitle.textContent = dict.seatingCardTitle;
    if (elCountdownSeatingSub) elCountdownSeatingSub.textContent = dict.seatingCardCta;
    if (elCountdownMenuTitle) elCountdownMenuTitle.textContent = dict.menuCardTitle;
    if (elCountdownMenuSub) elCountdownMenuSub.textContent = dict.menuCardCta;

    btnTabBackHub.textContent = isTimeUp ? dict.tabBackHub : dict.tabBackCountdown;
    btnTabVideo.textContent = dict.tabVideo;
    btnTabQuiz.textContent = dict.tabQuiz;
    if (btnTabSharePhotos) btnTabSharePhotos.textContent = dict.tabShare;
    if (btnTabGallery) btnTabGallery.textContent = dict.tabGallery;
    if (btnTabFootprints) btnTabFootprints.textContent = dict.tabFootprints;
    if (btnTabSeating) btnTabSeating.textContent = dict.tabSeating;
    if (btnTabMenu) btnTabMenu.textContent = dict.tabMenu;

    if (elSharePanelEyebrow) elSharePanelEyebrow.textContent = dict.sharePanelEyebrow;
    if (elSharePanelTitle) elSharePanelTitle.textContent = dict.sharePanelTitle;
    if (elSharePanelDesc) elSharePanelDesc.textContent = dict.sharePanelDesc;
    if (elShareStep1) elShareStep1.textContent = dict.shareStep1;
    if (elShareStep2) elShareStep2.textContent = dict.shareStep2;
    if (elGooglePhotosShareLink) {
      elGooglePhotosShareLink.textContent = dict.shareLinkBtn;
      elGooglePhotosShareLink.href = GOOGLE_PHOTOS_SHARE_URL;
    }

    if (elGalleryPanelEyebrow) elGalleryPanelEyebrow.textContent = dict.galleryPanelEyebrow;
    if (elGalleryPanelTitle) elGalleryPanelTitle.textContent = dict.galleryPanelTitle;
    if (elGooglePhotosMemoriesLink) {
      elGooglePhotosMemoriesLink.textContent = dict.galleryAlbumLinkBtn;
      elGooglePhotosMemoriesLink.href = GOOGLE_PHOTOS_MEMORIES_URL;
    }

    if (elFootprintsPanelEyebrow) elFootprintsPanelEyebrow.textContent = dict.footprintsPanelEyebrow;
    if (elFootprintsPanelTitle) elFootprintsPanelTitle.textContent = dict.footprintsPanelTitle;
    if (elFootprintStats) elFootprintStats.textContent = dict.footprintStatsText;
    if (elFootprintTrackTom) elFootprintTrackTom.textContent = dict.footprintTrackTom;
    if (elFootprintTrackEunice) elFootprintTrackEunice.textContent = dict.footprintTrackEunice;
    if (btnTimelinePlay) {
      btnTimelinePlay.textContent = timelinePlaying ? dict.timelinePauseBtn : dict.timelinePlayBtn;
    }
    if (btnTimelinePrev) {
      btnTimelinePrev.textContent = dict.timelinePrevBtn;
      btnTimelinePrev.setAttribute('title', dict.timelinePrevTitle);
      btnTimelinePrev.setAttribute('aria-label', dict.timelinePrevTitle);
    }
    if (btnTimelineNext) {
      btnTimelineNext.textContent = dict.timelineNextBtn;
      btnTimelineNext.setAttribute('title', dict.timelineNextTitle);
      btnTimelineNext.setAttribute('aria-label', dict.timelineNextTitle);
    }
    if (btnTimelineSpeed) {
      btnTimelineSpeed.setAttribute('title', dict.timelineSpeedTitle);
      btnTimelineSpeed.setAttribute('aria-label', dict.timelineSpeedTitle);
    }
    if (btnTimelineReplay) btnTimelineReplay.textContent = dict.timelineReplayBtn;
    if (btnTimelineExport && !timelineRecording) {
      btnTimelineExport.textContent = dict.timelineExportBtn;
    }

    if (elSeatingPanelEyebrow) elSeatingPanelEyebrow.textContent = dict.seatingPanelEyebrow;
    if (elSeatingPanelTitle) elSeatingPanelTitle.textContent = dict.seatingPanelTitle;
    if (elSeatingSearchInput) elSeatingSearchInput.placeholder = dict.seatingSearchPlaceholder;
    if (elSeatingExternalLink) {
      elSeatingExternalLink.textContent = dict.seatingExternalBtn;
    }

    if (elMenuPanelEyebrow) elMenuPanelEyebrow.textContent = dict.menuPanelEyebrow;
    if (elMenuPanelTitle) elMenuPanelTitle.textContent = dict.menuPanelTitle;
    if (elBanquetMenuNote) elBanquetMenuNote.textContent = dict.menuNoteText;
    if (elMenuExternalLink) {
      elMenuExternalLink.textContent = dict.menuExternalBtn;
    }

    elQuizCompletedEyebrow.textContent = dict.quizCompletedEyebrow;
    elQuizSummaryTitle.textContent = dict.quizSummaryTitle;
    btnQuizRestart.textContent = dict.restartBtn;
    btnQuizToVideo.textContent = dict.toVideoBtn;

    elClockCaption.textContent = dict.clockCaption;
    btnCelebrate.textContent = dict.celebrateBtn;

    // 若正在進行問答或結算畫面，同步更新題目或結算語言
    if (!elQuizSection.classList.contains('hidden')) {
      if (!elQuizSummaryView.classList.contains('hidden')) {
        showQuizSummary(false);
      } else {
        refreshQuizLanguage();
      }
    }
    if (elGallerySection && !elGallerySection.classList.contains('hidden')) {
      renderGallerySection();
    }
    if (elFootprintsSection && !elFootprintsSection.classList.contains('hidden')) {
      renderFootprintsSection();
    }
    if (elSeatingSection && !elSeatingSection.classList.contains('hidden')) {
      renderSeatingSection();
    }
    if (elBanquetMenuSection && !elBanquetMenuSection.classList.contains('hidden')) {
      renderBanquetMenuSection();
    }
  }

  /**
   * 嚴格白名單驗證並解析 YouTube 或 Instagram 公開連結
   */
  function parseMediaUrl(rawUrl, autoplay) {
    if (typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

    let urlObj;
    try {
      urlObj = new URL(trimmed);
    } catch {
      return null;
    }

    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return null;
    }

    const host = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    const path = urlObj.pathname;
    const dict = t();

    // 1. YouTube 白名單網域
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      let videoId = null;
      let isVertical = false;

      if (host === 'youtu.be') {
        videoId = path.split('/').filter(Boolean)[0];
      } else if (path === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (path.startsWith('/shorts/')) {
        videoId = path.split('/')[2];
        isVertical = true;
      } else if (path.startsWith('/live/') || path.startsWith('/embed/')) {
        videoId = path.split('/')[2];
      }

      if (videoId && /^[a-zA-Z0-9_-]{6,15}$/.test(videoId)) {
        const safeId = encodeURIComponent(videoId);
        const autoParams = autoplay ? '&autoplay=1&playsinline=1' : '&playsinline=1';
        return {
          provider: isVertical ? dict.mediaBadgeShorts : dict.mediaBadgeYoutube,
          embedUrl: `https://www.youtube-nocookie.com/embed/${safeId}?rel=0${autoParams}`,
          aspectClass: isVertical ? 'ratio-9-16' : 'ratio-16-9',
          isVertical,
        };
      }
    }

    // 2. Instagram 白名單網域
    if (host === 'instagram.com' || host === 'instagr.am') {
      const match = path.match(/^\/(?:[a-zA-Z0-9._]{1,30}\/)?(p|reel|reels|tv)\/([a-zA-Z0-9_-]{5,35})\/?$/);
      if (match) {
        const type = match[1] === 'reels' ? 'reel' : match[1];
        const shortcode = encodeURIComponent(match[2]);
        return {
          provider: type === 'reel' ? dict.mediaBadgeIgReel : dict.mediaBadgeIg,
          embedUrl: `https://www.instagram.com/${type}/${shortcode}/embed/captioned/`,
          aspectClass: 'ratio-ig',
          isVertical: true,
        };
      }
    }

    return null;
  }

  function renderVideoIframe() {
    const info = parseMediaUrl(WEDDING_VIDEO_URL, true);
    if (!info) return;

    elMediaBadge.textContent = info.provider;
    elMediaCard.classList.toggle('is-vertical', info.isVertical);
    elMediaFrameWrap.className = `media-frame-wrap ${info.aspectClass}`;

    if (renderedMediaKey !== info.embedUrl) {
      renderedMediaKey = info.embedUrl;
      const iframe = document.createElement('iframe');
      iframe.src = info.embedUrl;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.sandbox = 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      elMediaFrameWrap.replaceChildren(iframe);
    }
  }

  function clearVideoIframe() {
    elMediaFrameWrap.replaceChildren();
    renderedMediaKey = '';
  }

  function syncHubNavPermissions() {
    const dict = t();
    btnTabBackHub.textContent = isTimeUp ? dict.tabBackHub : dict.tabBackCountdown;
    // 倒數結束前：僅開放「座位表」與「婚宴餐點」，其餘 5 個慶祝介面鎖定隱藏
    btnTabVideo.classList.toggle('hidden', !isTimeUp);
    btnTabQuiz.classList.toggle('hidden', !isTimeUp);
    if (btnTabSharePhotos) btnTabSharePhotos.classList.toggle('hidden', !isTimeUp);
    if (btnTabGallery) btnTabGallery.classList.toggle('hidden', !isTimeUp);
    if (btnTabFootprints) btnTabFootprints.classList.toggle('hidden', !isTimeUp);
  }

  function showHubView(mode) {
    if (mode !== 'footprints' && timelinePlaying && !timelineRecording) {
      timelinePlaying = false;
      if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
      if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
    }

    syncHubNavPermissions();

    // 若倒數尚未結束，嚴格限制只能查看「座位表 (seating)」或「婚宴餐點 (banquet-menu)」，其餘一律返回倒數畫面
    if (!isTimeUp) {
      if (mode !== 'seating' && mode !== 'banquet-menu') {
        if (elCountdownStageWrap) elCountdownStageWrap.classList.remove('hidden');
        elTimeupHub.classList.add('hidden');
        elChoiceCardsGrid.classList.add('hidden');
        elHubNavBar.classList.add('hidden');
        elMediaSection.classList.add('hidden');
        elQuizSection.classList.add('hidden');
        if (elSharePhotosSection) elSharePhotosSection.classList.add('hidden');
        if (elGallerySection) elGallerySection.classList.add('hidden');
        if (elFootprintsSection) elFootprintsSection.classList.add('hidden');
        if (elSeatingSection) elSeatingSection.classList.add('hidden');
        if (elBanquetMenuSection) elBanquetMenuSection.classList.add('hidden');
        clearVideoIframe();
        return;
      }
      if (elCountdownStageWrap) elCountdownStageWrap.classList.add('hidden');
      elTimeupHub.classList.remove('hidden');
    }

    if (mode === 'menu') {
      elChoiceCardsGrid.classList.remove('hidden');
      elHubNavBar.classList.add('hidden');
      elMediaSection.classList.add('hidden');
      elQuizSection.classList.add('hidden');
      if (elSharePhotosSection) elSharePhotosSection.classList.add('hidden');
      if (elGallerySection) elGallerySection.classList.add('hidden');
      if (elFootprintsSection) elFootprintsSection.classList.add('hidden');
      if (elSeatingSection) elSeatingSection.classList.add('hidden');
      if (elBanquetMenuSection) elBanquetMenuSection.classList.add('hidden');
      clearVideoIframe();
      return;
    }

    elChoiceCardsGrid.classList.add('hidden');
    elHubNavBar.classList.remove('hidden');

    btnTabVideo.classList.toggle('active', mode === 'video');
    btnTabQuiz.classList.toggle('active', mode === 'quiz');
    if (btnTabSharePhotos) btnTabSharePhotos.classList.toggle('active', mode === 'share');
    if (btnTabGallery) btnTabGallery.classList.toggle('active', mode === 'gallery');
    if (btnTabFootprints) btnTabFootprints.classList.toggle('active', mode === 'footprints');
    if (btnTabSeating) btnTabSeating.classList.toggle('active', mode === 'seating');
    if (btnTabMenu) btnTabMenu.classList.toggle('active', mode === 'banquet-menu');

    elMediaSection.classList.toggle('hidden', mode !== 'video');
    elQuizSection.classList.toggle('hidden', mode !== 'quiz');
    if (elSharePhotosSection) elSharePhotosSection.classList.toggle('hidden', mode !== 'share');
    if (elGallerySection) elGallerySection.classList.toggle('hidden', mode !== 'gallery');
    if (elFootprintsSection) elFootprintsSection.classList.toggle('hidden', mode !== 'footprints');
    if (elSeatingSection) elSeatingSection.classList.toggle('hidden', mode !== 'seating');
    if (elBanquetMenuSection) elBanquetMenuSection.classList.toggle('hidden', mode !== 'banquet-menu');

    if (mode === 'video') {
      pauseVinylBgm();
      renderVideoIframe();
    } else {
      clearVideoIframe();
      if (mode === 'quiz') {
        if (!quizStarted) {
          startQuiz();
        } else if (quizIndex >= QUIZ_QUESTIONS.length) {
          showQuizSummary(false);
        } else {
          refreshQuizLanguage();
        }
      } else if (mode === 'gallery') {
        renderGallerySection();
      } else if (mode === 'footprints') {
        renderFootprintsSection();
      } else if (mode === 'seating') {
        renderSeatingSection();
      } else if (mode === 'banquet-menu') {
        renderBanquetMenuSection();
      }
    }
  }

  /**
   * 解析並判斷是否為可直接嵌入 `<img>` 的相片網址（例如 Google Photos CDN `lh3.googleusercontent.com` 或圖片副檔名）
   * 若是 `photos.app.goo.gl` 等相簿分享網頁連結，則同時提供點擊開啟相片按鈕與備援預覽
   */
  function resolveGooglePhotoConfig(item, index) {
    const rawConfig = Array.isArray(PAST_PHOTOS_GOOGLE_LINKS) ? PAST_PHOTOS_GOOGLE_LINKS[index] : '';
    let directImageUrl = item.imageUrl || '';
    let shareLinkUrl = item.googlePhotosUrl || '';

    if (typeof rawConfig === 'string' && rawConfig.trim()) {
      const trimmed = rawConfig.trim();
      if (
        /^https?:\/\/([a-z0-9-]+\.)*googleusercontent\.com\//i.test(trimmed) ||
        /\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(trimmed) ||
        trimmed.startsWith('data:image/')
      ) {
        directImageUrl = trimmed;
        if (!shareLinkUrl) shareLinkUrl = trimmed;
      } else {
        shareLinkUrl = trimmed;
        if (!directImageUrl && /^https?:\/\//i.test(trimmed)) {
          directImageUrl = trimmed;
        }
      }
    } else if (rawConfig && typeof rawConfig === 'object') {
      if (typeof rawConfig.imageUrl === 'string' && rawConfig.imageUrl.trim()) {
        directImageUrl = rawConfig.imageUrl.trim();
      }
      if (typeof rawConfig.googlePhotosUrl === 'string' && rawConfig.googlePhotosUrl.trim()) {
        shareLinkUrl = rawConfig.googlePhotosUrl.trim();
      }
    }

    return {
      directImageUrl: sanitizeSafeUrl(directImageUrl, true),
      shareLinkUrl: sanitizeSafeUrl(shareLinkUrl, false),
    };
  }

  // ============================================================================
  // 2A. 「過去照片 (2014–2026)」、「座位表」、「婚宴餐點」與「交往軌跡」渲染邏輯
  // ============================================================================
  function renderGallerySection() {
    if (!elGalleryEraBar || !elMemoryGalleryGrid) return;
    const dict = t();
    const eras = [
      { id: 'all', label: dict.eraAll },
      { id: '2014-2017', label: dict.era2014 },
      { id: '2018-2021', label: dict.era2018 },
      { id: '2022-2026', label: dict.era2022 },
    ];

    const eraButtons = eras.map((eraObj) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `era-pill${selectedGalleryEra === eraObj.id ? ' active' : ''}`;
      btn.textContent = eraObj.label;
      btn.addEventListener('click', () => {
        selectedGalleryEra = eraObj.id;
        renderGallerySection();
      });
      return btn;
    });
    elGalleryEraBar.replaceChildren(...eraButtons);

    const indexedPhotos = PAST_PHOTOS_DATA.map((item, idx) => ({ item, idx })).filter(
      ({ item }) => selectedGalleryEra === 'all' || item.era === selectedGalleryEra
    );

    const photoCards = indexedPhotos.map(({ item, idx }) => {
      const card = document.createElement('article');
      card.className = 'memory-photo-card';

      const { directImageUrl, shareLinkUrl } = resolveGooglePhotoConfig(item, idx);

      const visual = document.createElement('div');
      visual.className = 'memory-photo-visual';

      const renderFallbackVisual = () => {
        visual.replaceChildren();
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'memory-visual-emoji';
        emojiSpan.textContent = item.emoji || '🌿';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'memory-visual-date';
        dateSpan.textContent = item.yearLabel;
        visual.append(emojiSpan, dateSpan);
      };

      if (directImageUrl) {
        const img = document.createElement('img');
        img.src = directImageUrl;
        img.alt = item.title[currentLang];
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', renderFallbackVisual);
        visual.append(img);
      } else {
        renderFallbackVisual();
      }

      const body = document.createElement('div');
      body.className = 'memory-photo-body';

      const yearTag = document.createElement('span');
      yearTag.className = 'memory-year-tag';
      yearTag.textContent = item.yearLabel;

      const titleEl = document.createElement('h4');
      titleEl.className = 'memory-photo-title';
      titleEl.textContent = item.title[currentLang];

      const captionEl = document.createElement('p');
      captionEl.className = 'memory-photo-caption';
      captionEl.textContent = item.caption[currentLang];

      body.append(yearTag, titleEl, captionEl);

      if (shareLinkUrl) {
        visual.classList.add('memory-photo-visual-link');
        visual.addEventListener('click', () => {
          window.open(shareLinkUrl, '_blank', 'noopener,noreferrer');
        });
        const linkBtn = document.createElement('a');
        linkBtn.className = 'memory-photo-link';
        linkBtn.href = shareLinkUrl;
        linkBtn.target = '_blank';
        linkBtn.rel = 'noopener noreferrer';
        linkBtn.textContent = dict.viewGooglePhotoBtn;
        body.append(linkBtn);
      }

      card.append(visual, body);
      return card;
    });

    elMemoryGalleryGrid.replaceChildren(...photoCards);
  }

  function renderEmbeddedPhotoStage(stageEl, externalLinkEl, imageUrl, linkUrl, altText) {
    const safeImg = sanitizeSafeUrl(imageUrl, true);
    const safeLink = sanitizeSafeUrl(linkUrl, false) || safeImg;

    if (externalLinkEl) {
      if (safeLink) {
        externalLinkEl.href = safeLink;
        externalLinkEl.classList.remove('hidden');
      } else {
        externalLinkEl.classList.add('hidden');
      }
    }

    if (!stageEl) return;
    if (!safeImg) {
      stageEl.classList.add('hidden');
      stageEl.replaceChildren();
      return;
    }

    const img = document.createElement('img');
    img.src = safeImg;
    img.alt = altText;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      stageEl.classList.add('hidden');
    });
    stageEl.replaceChildren(img);
    stageEl.classList.remove('hidden');
  }

  let selectedSeatingZoneId = null;
  const RESTROOM_ZONE_ID = 'facility-restroom';
  const RESTROOM_ZONE_META = {
    id: RESTROOM_ZONE_ID,
    box: { x: 332, y: 1320, w: 386, h: 432 },
    color: '#0284c7',
    fillColor: 'rgba(2, 132, 199, 0.22)',
    name: { zh: '🚻 廁所 / 洗手間區域', en: '🚻 Restrooms (Men & Women)' },
    zone: { zh: '場地左側中段（上：男廁 A08 ／ 下：女廁與無障礙 A07）', en: 'Mid-Left Hallway (Upper: Men A08 / Lower: Women A07)' },
  };
  const BAR_ZONE_ID = 'facility-bar';
  const BAR_ZONE_META = {
    id: BAR_ZONE_ID,
    box: { x: 586, y: 1766, w: 204, h: 730 },
    color: '#be185d',
    fillColor: 'rgba(190, 24, 93, 0.22)',
    name: { zh: '🍹 吧台區 (A02)', en: '🍹 Bar Counter (A02)' },
    zone: { zh: '外廳左側中段（鄰近大廳入口與新娘座位區）', en: 'Lower Hall Left (Near Entrance & Bride Zones)' },
  };
  const BUFFET_ZONE_ID = 'facility-buffet';
  const BUFFET_ZONE_META = {
    id: BUFFET_ZONE_ID,
    boxes: [
      { x: 335, y: 286, w: 96, h: 666 },
      { x: 1356, y: 1328, w: 414, h: 68 },
    ],
    color: '#0d9488',
    fillColor: 'rgba(13, 148, 136, 0.26)',
    name: { zh: '🍽️ 百匯餐點取餐區（共 2 處）', en: '🍽️ Buffet Stations (2 Locations)' },
    zone: { zh: '主廳左側長吧檯 ＆ 主廳右下方長吧檯（取餐區）', en: 'Main Hall Left Counter & Mid-Right Counter' },
  };
  const RECEPTION_ZONE_ID = 'facility-reception';
  const RECEPTION_ZONE_META = {
    id: RECEPTION_ZONE_ID,
    box: { x: 1055, y: 2520, w: 80, h: 286 },
    color: '#0369a1',
    fillColor: 'rgba(3, 105, 161, 0.26)',
    name: { zh: '📋 接待桌（迎賓簽到 ＆ 收禮處）', en: '📋 Reception & Check-In Desk' },
    zone: { zh: '一樓大廳入口右側（A01 大廳迎賓處）', en: 'Main Entrance Lobby Right (A01)' },
  };
  const KITCHEN_ZONE_ID = 'facility-kitchen';
  const KITCHEN_ZONE_META = {
    id: KITCHEN_ZONE_ID,
    box: { x: 332, y: 1766, w: 240, h: 730 },
    color: '#4f46e5',
    fillColor: 'rgba(99, 102, 241, 0.22)',
    name: { zh: '👨‍🍳 廚房（後場備餐作業區）', en: '👨‍🍳 Kitchen (Culinary Prep Area)' },
    zone: { zh: '場地左下方專區（吧台區左側、洗手間下方）', en: 'Lower-Left Wing (Left of Bar Counter)' },
  };

  function renderSeatingFloorPlan(highlightedIds) {
    if (!elSeatingPhotoStage) return;
    const dict = t();
    const isDebugPage = Boolean(
      document.getElementById('debug-toolbar') || document.getElementById('debug-auth-gate')
    );
    const safeImg = sanitizeSafeUrl(SEATING_CHART_IMAGE_URL, true);
    const safeLink = sanitizeSafeUrl(SEATING_CHART_LINK_URL, false) || safeImg;

    if (elSeatingExternalLink) {
      if (safeLink) {
        elSeatingExternalLink.href = safeLink;
        elSeatingExternalLink.classList.remove('hidden');
      } else {
        elSeatingExternalLink.classList.add('hidden');
      }
    }

    if (!safeImg) {
      elSeatingPhotoStage.classList.add('hidden');
      elSeatingPhotoStage.replaceChildren();
      return;
    }

    const stageChildren = [];

    if (isDebugPage) {
      let totalHeadcount = 0;
      let totalVeg = 0;
      let totalStroller = 0;
      let totalChildSeat = 0;
      SEATING_TABLES_DATA.forEach((tItem) => {
        if (tItem.debugStats) {
          totalHeadcount += tItem.debugStats.headcount || 0;
          totalVeg += tItem.debugStats.veg || 0;
          totalStroller += tItem.debugStats.stroller || 0;
          totalChildSeat += tItem.debugStats.childSeat || 0;
        }
      });
      const debugBanner = document.createElement('div');
      debugBanner.className = 'seating-debug-banner';
      debugBanner.textContent =
        currentLang === 'en'
          ? `🔧 [Debug Totals] Guests: ${totalHeadcount} ｜ 🥗 Vegetarian: ${totalVeg} ｜ 🚼 Strollers: ${totalStroller} (🪑 High Chairs: ${totalChildSeat})`
          : `🔧 [Debug 全場統計] 總人數：${totalHeadcount} 人 ｜ 🥗 素食人數：${totalVeg} 人 ｜ 🚼 嬰兒車人數：${totalStroller} 人（🪑 兒童椅：${totalChildSeat} 張）`;
      stageChildren.push(debugBanner);
    }

    const hintBar = document.createElement('div');
    hintBar.className = 'seating-map-hint-bar';

    const hintText = document.createElement('span');
    hintText.className = 'seating-map-hint-text';
    const activeTable =
      selectedSeatingZoneId === RESTROOM_ZONE_ID
        ? RESTROOM_ZONE_META
        : selectedSeatingZoneId === BAR_ZONE_ID
          ? BAR_ZONE_META
          : selectedSeatingZoneId === BUFFET_ZONE_ID
            ? BUFFET_ZONE_META
            : selectedSeatingZoneId === RECEPTION_ZONE_ID
              ? RECEPTION_ZONE_META
              : selectedSeatingZoneId === KITCHEN_ZONE_ID
                ? KITCHEN_ZONE_META
                : selectedSeatingZoneId
                  ? SEATING_TABLES_DATA.find((item) => item.id === selectedSeatingZoneId)
                  : null;

    if (activeTable) {
      const activeName = activeTable.name[currentLang] || activeTable.name.zh;
      const activeZone = activeTable.zone[currentLang] || activeTable.zone.zh;
      hintText.textContent =
        currentLang === 'en'
          ? `📍 Highlighted: ${activeName} (${activeZone})`
          : `📍 目前標示區域：${activeName}（${activeZone}）`;
    } else {
      hintText.textContent =
        currentLang === 'en'
          ? '💡 Tap any colored zone (or 📋 Reception / 🍽️ Buffet / 🚻 Restrooms / 🍹 Bar) on the floor plan or any table card below to highlight'
          : '💡 點擊平面圖上的座位區域（或 📋 接待桌 ／ 🍽️ 餐點區 ／ 🚻 廁所 ／ 🍹 吧台）與下方卡片，即可雙向高亮標示位置';
    }
    hintBar.append(hintText);

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'seating-map-actions';

    const receptionBtn = document.createElement('button');
    receptionBtn.type = 'button';
    receptionBtn.className = `seating-map-reception-btn${highlightedIds.has(RECEPTION_ZONE_ID) ? ' is-active' : ''}`;
    receptionBtn.textContent = currentLang === 'en' ? '📋 Highlight Reception' : '📋 標示接待桌';
    receptionBtn.addEventListener('click', () => {
      selectedSeatingZoneId = selectedSeatingZoneId === RECEPTION_ZONE_ID ? null : RECEPTION_ZONE_ID;
      renderSeatingSection();
    });
    actionsWrap.append(receptionBtn);

    const buffetBtn = document.createElement('button');
    buffetBtn.type = 'button';
    buffetBtn.className = `seating-map-buffet-btn${highlightedIds.has(BUFFET_ZONE_ID) ? ' is-active' : ''}`;
    buffetBtn.textContent = currentLang === 'en' ? '🍽️ Highlight Buffet' : '🍽️ 標示餐點區';
    buffetBtn.addEventListener('click', () => {
      selectedSeatingZoneId = selectedSeatingZoneId === BUFFET_ZONE_ID ? null : BUFFET_ZONE_ID;
      renderSeatingSection();
    });
    actionsWrap.append(buffetBtn);

    const restroomBtn = document.createElement('button');
    restroomBtn.type = 'button';
    restroomBtn.className = `seating-map-restroom-btn${highlightedIds.has(RESTROOM_ZONE_ID) ? ' is-active' : ''}`;
    restroomBtn.textContent = currentLang === 'en' ? '🚻 Highlight Restrooms' : '🚻 標示廁所位置';
    restroomBtn.addEventListener('click', () => {
      selectedSeatingZoneId = selectedSeatingZoneId === RESTROOM_ZONE_ID ? null : RESTROOM_ZONE_ID;
      renderSeatingSection();
    });
    actionsWrap.append(restroomBtn);

    const barBtn = document.createElement('button');
    barBtn.type = 'button';
    barBtn.className = `seating-map-bar-btn${highlightedIds.has(BAR_ZONE_ID) ? ' is-active' : ''}`;
    barBtn.textContent = currentLang === 'en' ? '🍹 Highlight Bar' : '🍹 標示吧台位置';
    barBtn.addEventListener('click', () => {
      selectedSeatingZoneId = selectedSeatingZoneId === BAR_ZONE_ID ? null : BAR_ZONE_ID;
      renderSeatingSection();
    });
    actionsWrap.append(barBtn);

    if (selectedSeatingZoneId) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'seating-map-clear-btn';
      clearBtn.textContent = currentLang === 'en' ? '✕ Clear Highlight' : '✕ 取消高亮';
      clearBtn.addEventListener('click', () => {
        selectedSeatingZoneId = null;
        renderSeatingSection();
      });
      actionsWrap.append(clearBtn);
    }

    hintBar.append(actionsWrap);
    stageChildren.push(hintBar);

    const mapWrap = document.createElement('div');
    const hasAnyHighlight = highlightedIds.size > 0;
    mapWrap.className = `seating-map-interactive${hasAnyHighlight ? ' has-active-zone' : ''}`;

    const img = document.createElement('img');
    img.src = safeImg;
    img.alt = dict.seatingPanelTitle;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      elSeatingPhotoStage.classList.add('hidden');
    });

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 2090 3153');
    svg.setAttribute('class', 'seating-map-svg');
    svg.setAttribute('aria-label', dict.seatingPanelTitle);

    const handleZoneSelect = (zoneId, e) => {
      e.stopPropagation();
      selectedSeatingZoneId = selectedSeatingZoneId === zoneId ? null : zoneId;
      renderSeatingSection();
      if (selectedSeatingZoneId) {
        const targetCard = elSeatingTablesGrid.querySelector(
          `[data-zone-id="${selectedSeatingZoneId}"]`
        );
        if (targetCard && typeof targetCard.scrollIntoView === 'function') {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };

    // 0. 若底圖原標籤為直排且已改為橫向，先無縫還原底圖桌面與底色（避免原直排標籤上下露邊）
    SEATING_TABLES_DATA.forEach((table) => {
      if (!table.basePatch) return;
      const patchGroup = document.createElementNS(svgNS, 'g');
      patchGroup.setAttribute('class', 'seating-map-base-patch');
      patchGroup.setAttribute('aria-hidden', 'true');
      const m = table.basePatch.mask;
      if (m) {
        const maskRect = document.createElementNS(svgNS, 'rect');
        maskRect.setAttribute('x', String(m.x));
        maskRect.setAttribute('y', String(m.y));
        maskRect.setAttribute('width', String(m.w));
        maskRect.setAttribute('height', String(m.h));
        maskRect.setAttribute('fill', m.fill);
        patchGroup.append(maskRect);
      }
      if (Array.isArray(table.basePatch.tables)) {
        table.basePatch.tables.forEach((tb) => {
          const tbRect = document.createElementNS(svgNS, 'rect');
          tbRect.setAttribute('x', String(tb.x));
          tbRect.setAttribute('y', String(tb.y));
          tbRect.setAttribute('width', String(tb.w));
          tbRect.setAttribute('height', String(tb.h));
          tbRect.setAttribute('fill', tb.fill);
          tbRect.setAttribute('stroke', tb.stroke);
          tbRect.setAttribute('stroke-width', String(tb.strokeWidth || 4));
          patchGroup.append(tbRect);
        });
      }
      svg.append(patchGroup);
    });

    // 1. 先繪製所有座位區域色塊
    SEATING_TABLES_DATA.forEach((table) => {
      if (!table.box) return;
      const isHighlighted = highlightedIds.has(table.id);
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', String(table.box.x));
      rect.setAttribute('y', String(table.box.y));
      rect.setAttribute('width', String(table.box.w));
      rect.setAttribute('height', String(table.box.h));
      rect.setAttribute('rx', '18');
      rect.setAttribute('ry', '18');
      if (table.color) {
        rect.style.setProperty('--zone-color', table.color);
      }
      if (table.fillColor) {
        rect.style.setProperty('--zone-fill', table.fillColor);
      }
      rect.setAttribute(
        'class',
        `seating-zone-hotspot${isHighlighted ? ' is-highlighted' : ''}`
      );

      const titleTag = document.createElementNS(svgNS, 'title');
      titleTag.textContent = `${table.name[currentLang] || table.name.zh} · ${table.zone[currentLang] || table.zone.zh}`;
      rect.append(titleTag);

      rect.addEventListener('click', (e) => handleZoneSelect(table.id, e));
      svg.append(rect);
    });

    // 2. 繪製高對比清晰座位區文字標籤（若該區有設定自訂覆蓋標籤）
    SEATING_TABLES_DATA.forEach((table) => {
      if (!table.mapLabel) return;
      const isHighlighted = highlightedIds.has(table.id);
      const ml = table.mapLabel;
      const lines = (currentLang === 'en' ? ml.en : ml.zh) || ml.zh;
      const labelGroup = document.createElementNS(svgNS, 'g');
      labelGroup.setAttribute(
        'class',
        `seating-zone-label-group${isHighlighted ? ' is-highlighted' : ''}`
      );
      if (table.color) {
        labelGroup.style.setProperty('--zone-color', table.color);
      }

      const bgRect = document.createElementNS(svgNS, 'rect');
      bgRect.setAttribute('x', String(Math.round(ml.cx - ml.bw / 2)));
      bgRect.setAttribute('y', String(Math.round(ml.cy - ml.bh / 2)));
      bgRect.setAttribute('width', String(ml.bw));
      bgRect.setAttribute('height', String(ml.bh));
      bgRect.setAttribute('rx', '16');
      bgRect.setAttribute('ry', '16');
      bgRect.setAttribute('class', 'seating-zone-label-bg');

      const fSize = (currentLang === 'en' && ml.enFontSize) ? ml.enFontSize : (ml.fontSize || 42);
      const step = (currentLang === 'en' && ml.enLineStep) ? ml.enLineStep : (ml.lineStep || 46);

      const textEl = document.createElementNS(svgNS, 'text');
      textEl.setAttribute('x', String(ml.cx));
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('class', 'seating-zone-label-text');
      textEl.style.fontSize = `${fSize}px`;

      const firstY = ml.cy - ((lines.length - 1) * step) / 2 + fSize * 0.34;
      lines.forEach((lineStr, idx) => {
        const tspan = document.createElementNS(svgNS, 'tspan');
        tspan.setAttribute('x', String(ml.cx));
        tspan.setAttribute('y', String(Math.round(firstY + idx * step)));
        tspan.textContent = lineStr;
        textEl.append(tspan);
      });

      const titleTag = document.createElementNS(svgNS, 'title');
      titleTag.textContent = `${table.name[currentLang] || table.name.zh} · ${table.zone[currentLang] || table.zone.zh}`;
      labelGroup.append(titleTag, bgRect, textEl);
      labelGroup.addEventListener('click', (e) => handleZoneSelect(table.id, e));
      svg.append(labelGroup);
    });

    // 3. 繪製大廳入口標籤、接待桌標示與可互動餐點區標示（取餐區 × 2）
    const entranceBadge = {
      cx: 941,
      cy: 2805,
      bw: 256,
      bh: 76,
      fontSize: 36,
      lineStep: 40,
      color: '#475569',
      lines: currentLang === 'en' ? ['🚪 Entrance'] : ['🚪 大廳入口'],
    };
    const eGroup = document.createElementNS(svgNS, 'g');
    eGroup.setAttribute('class', 'seating-facility-badge');
    eGroup.style.setProperty('--facility-color', entranceBadge.color);

    const eBg = document.createElementNS(svgNS, 'rect');
    eBg.setAttribute('x', String(Math.round(entranceBadge.cx - entranceBadge.bw / 2)));
    eBg.setAttribute('y', String(Math.round(entranceBadge.cy - entranceBadge.bh / 2)));
    eBg.setAttribute('width', String(entranceBadge.bw));
    eBg.setAttribute('height', String(entranceBadge.bh));
    eBg.setAttribute('rx', '16');
    eBg.setAttribute('ry', '16');
    eBg.setAttribute('class', 'seating-facility-badge-bg');

    const eText = document.createElementNS(svgNS, 'text');
    eText.setAttribute('x', String(entranceBadge.cx));
    eText.setAttribute('text-anchor', 'middle');
    eText.setAttribute('class', 'seating-facility-badge-text');
    eText.style.fontSize = `${entranceBadge.fontSize}px`;

    const eFirstY =
      entranceBadge.cy -
      ((entranceBadge.lines.length - 1) * entranceBadge.lineStep) / 2 +
      entranceBadge.fontSize * 0.34;
    entranceBadge.lines.forEach((lineStr, idx) => {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', String(entranceBadge.cx));
      tspan.setAttribute('y', String(Math.round(eFirstY + idx * entranceBadge.lineStep)));
      tspan.textContent = lineStr;
      eText.append(tspan);
    });
    eGroup.append(eBg, eText);
    svg.append(eGroup);

    // 接待桌標示（一樓大廳入口右側迎賓簽到收禮桌）
    const isReceptionHighlighted = highlightedIds.has(RECEPTION_ZONE_ID);
    const receptionGroup = document.createElementNS(svgNS, 'g');
    receptionGroup.setAttribute(
      'class',
      `seating-reception-group${isReceptionHighlighted ? ' is-highlighted' : ''}`
    );
    receptionGroup.style.setProperty('--zone-color', RECEPTION_ZONE_META.color);
    receptionGroup.style.setProperty('--zone-fill', RECEPTION_ZONE_META.fillColor);

    const receptionTitle = document.createElementNS(svgNS, 'title');
    receptionTitle.textContent = `${RECEPTION_ZONE_META.name[currentLang]} · ${RECEPTION_ZONE_META.zone[currentLang]}`;
    receptionGroup.append(receptionTitle);

    const rRect = document.createElementNS(svgNS, 'rect');
    rRect.setAttribute('x', String(RECEPTION_ZONE_META.box.x));
    rRect.setAttribute('y', String(RECEPTION_ZONE_META.box.y));
    rRect.setAttribute('width', String(RECEPTION_ZONE_META.box.w));
    rRect.setAttribute('height', String(RECEPTION_ZONE_META.box.h));
    rRect.setAttribute('rx', '14');
    rRect.setAttribute('ry', '14');
    rRect.setAttribute(
      'class',
      `seating-zone-hotspot seating-reception-hotspot${isReceptionHighlighted ? ' is-highlighted' : ''}`
    );
    receptionGroup.append(rRect);

    const receptionBadge = {
      cx: 1095,
      cy: 2663,
      bw: 72,
      bh: 236,
      fontSize: 34,
      lineStep: 45,
      lines: currentLang === 'en' ? ['📋', 'D', 'E', 'S', 'K'] : ['📋', '接', '待', '桌'],
    };
    const recBg = document.createElementNS(svgNS, 'rect');
    recBg.setAttribute('x', String(Math.round(receptionBadge.cx - receptionBadge.bw / 2)));
    recBg.setAttribute('y', String(Math.round(receptionBadge.cy - receptionBadge.bh / 2)));
    recBg.setAttribute('width', String(receptionBadge.bw));
    recBg.setAttribute('height', String(receptionBadge.bh));
    recBg.setAttribute('rx', '16');
    recBg.setAttribute('ry', '16');
    recBg.setAttribute('class', 'seating-reception-badge-bg');

    const recText = document.createElementNS(svgNS, 'text');
    recText.setAttribute('x', String(receptionBadge.cx));
    recText.setAttribute('text-anchor', 'middle');
    recText.setAttribute('class', 'seating-reception-badge-text');
    recText.style.fontSize = `${receptionBadge.fontSize}px`;

    const recFirstY =
      receptionBadge.cy -
      ((receptionBadge.lines.length - 1) * receptionBadge.lineStep) / 2 +
      receptionBadge.fontSize * 0.34;
    receptionBadge.lines.forEach((lineStr, idx) => {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', String(receptionBadge.cx));
      tspan.setAttribute('y', String(Math.round(recFirstY + idx * receptionBadge.lineStep)));
      tspan.textContent = lineStr;
      recText.append(tspan);
    });

    receptionGroup.append(recBg, recText);
    receptionGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSeatingZoneId = selectedSeatingZoneId === RECEPTION_ZONE_ID ? null : RECEPTION_ZONE_ID;
      renderSeatingSection();
    });
    svg.append(receptionGroup);

    // 餐點區標示（主廳左側 & 主廳右中側共 2 處百匯取餐區）
    const isBuffetHighlighted = highlightedIds.has(BUFFET_ZONE_ID);
    const buffetGroup = document.createElementNS(svgNS, 'g');
    buffetGroup.setAttribute(
      'class',
      `seating-buffet-group${isBuffetHighlighted ? ' is-highlighted' : ''}`
    );
    buffetGroup.style.setProperty('--zone-color', BUFFET_ZONE_META.color);
    buffetGroup.style.setProperty('--zone-fill', BUFFET_ZONE_META.fillColor);

    const buffetTitle = document.createElementNS(svgNS, 'title');
    buffetTitle.textContent = `${BUFFET_ZONE_META.name[currentLang]} · ${BUFFET_ZONE_META.zone[currentLang]}`;
    buffetGroup.append(buffetTitle);

    BUFFET_ZONE_META.boxes.forEach((bBox) => {
      const bRect = document.createElementNS(svgNS, 'rect');
      bRect.setAttribute('x', String(bBox.x));
      bRect.setAttribute('y', String(bBox.y));
      bRect.setAttribute('width', String(bBox.w));
      bRect.setAttribute('height', String(bBox.h));
      bRect.setAttribute('rx', '14');
      bRect.setAttribute('ry', '14');
      bRect.setAttribute(
        'class',
        `seating-zone-hotspot seating-buffet-hotspot${isBuffetHighlighted ? ' is-highlighted' : ''}`
      );
      buffetGroup.append(bRect);
    });

    const buffetBadges = [
      {
        cx: 383,
        cy: 619,
        bw: 82,
        bh: currentLang === 'en' ? 276 : 248,
        fontSize: currentLang === 'en' ? 32 : 36,
        lineStep: currentLang === 'en' ? 43 : 48,
        lines: currentLang === 'en' ? ['🍽️', 'F', 'O', 'O', 'D'] : ['🍽️', '取', '餐', '區'],
      },
      {
        cx: 1563,
        cy: 1362,
        bw: 268,
        bh: 58,
        fontSize: 34,
        lineStep: 38,
        lines: currentLang === 'en' ? ['🍽️ Buffet'] : ['🍽️ 取餐區'],
      },
    ];
    buffetBadges.forEach((bb) => {
      const bBg = document.createElementNS(svgNS, 'rect');
      bBg.setAttribute('x', String(Math.round(bb.cx - bb.bw / 2)));
      bBg.setAttribute('y', String(Math.round(bb.cy - bb.bh / 2)));
      bBg.setAttribute('width', String(bb.bw));
      bBg.setAttribute('height', String(bb.bh));
      bBg.setAttribute('rx', '16');
      bBg.setAttribute('ry', '16');
      bBg.setAttribute('class', 'seating-buffet-badge-bg');

      const bText = document.createElementNS(svgNS, 'text');
      bText.setAttribute('x', String(bb.cx));
      bText.setAttribute('text-anchor', 'middle');
      bText.setAttribute('class', 'seating-buffet-badge-text');
      bText.style.fontSize = `${bb.fontSize}px`;

      const firstY = bb.cy - ((bb.lines.length - 1) * bb.lineStep) / 2 + bb.fontSize * 0.34;
      bb.lines.forEach((lineStr, idx) => {
        const tspan = document.createElementNS(svgNS, 'tspan');
        tspan.setAttribute('x', String(bb.cx));
        tspan.setAttribute('y', String(Math.round(firstY + idx * bb.lineStep)));
        tspan.textContent = lineStr;
        bText.append(tspan);
      });

      buffetGroup.append(bBg, bText);
    });

    buffetGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSeatingZoneId = selectedSeatingZoneId === BUFFET_ZONE_ID ? null : BUFFET_ZONE_ID;
      renderSeatingSection();
    });

    svg.append(buffetGroup);

    // 4. 廁所 / 洗手間區域標示 (A08 男廁 & A07 女廁)
    const isRestroomHighlighted = highlightedIds.has(RESTROOM_ZONE_ID);
    const restroomGroup = document.createElementNS(svgNS, 'g');
    restroomGroup.setAttribute(
      'class',
      `seating-restroom-group${isRestroomHighlighted ? ' is-highlighted' : ''}`
    );
    restroomGroup.style.setProperty('--zone-color', RESTROOM_ZONE_META.color);
    restroomGroup.style.setProperty('--zone-fill', RESTROOM_ZONE_META.fillColor);

    const restroomRect = document.createElementNS(svgNS, 'rect');
    restroomRect.setAttribute('x', String(RESTROOM_ZONE_META.box.x));
    restroomRect.setAttribute('y', String(RESTROOM_ZONE_META.box.y));
    restroomRect.setAttribute('width', String(RESTROOM_ZONE_META.box.w));
    restroomRect.setAttribute('height', String(RESTROOM_ZONE_META.box.h));
    restroomRect.setAttribute('rx', '20');
    restroomRect.setAttribute('ry', '20');
    restroomRect.setAttribute(
      'class',
      `seating-zone-hotspot seating-restroom-hotspot${isRestroomHighlighted ? ' is-highlighted' : ''}`
    );

    const restroomBadgeBg = document.createElementNS(svgNS, 'rect');
    restroomBadgeBg.setAttribute('x', '345');
    restroomBadgeBg.setAttribute('y', '1466');
    restroomBadgeBg.setAttribute('width', '360');
    restroomBadgeBg.setAttribute('height', '140');
    restroomBadgeBg.setAttribute('rx', '24');
    restroomBadgeBg.setAttribute('ry', '24');
    restroomBadgeBg.setAttribute('class', 'seating-restroom-badge-bg');

    const restroomLabelMain = document.createElementNS(svgNS, 'text');
    restroomLabelMain.setAttribute('x', '525');
    restroomLabelMain.setAttribute('y', '1526');
    restroomLabelMain.setAttribute('text-anchor', 'middle');
    restroomLabelMain.setAttribute('class', 'seating-restroom-label-main');
    restroomLabelMain.textContent = currentLang === 'en' ? '🚻 RESTROOMS' : '🚻 廁所 / 洗手間';

    const restroomLabelSub = document.createElementNS(svgNS, 'text');
    restroomLabelSub.setAttribute('x', '525');
    restroomLabelSub.setAttribute('y', '1574');
    restroomLabelSub.setAttribute('text-anchor', 'middle');
    restroomLabelSub.setAttribute('class', 'seating-restroom-label-sub');
    restroomLabelSub.textContent =
      currentLang === 'en' ? '▲ Men (A08) · ▼ Women (A07)' : '▲ 男廁 (A08) · ▼ 女廁 (A07)';

    const restroomTitle = document.createElementNS(svgNS, 'title');
    restroomTitle.textContent = `${RESTROOM_ZONE_META.name[currentLang]} · ${RESTROOM_ZONE_META.zone[currentLang]}`;
    restroomGroup.append(
      restroomTitle,
      restroomRect,
      restroomBadgeBg,
      restroomLabelMain,
      restroomLabelSub
    );

    restroomGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSeatingZoneId = selectedSeatingZoneId === RESTROOM_ZONE_ID ? null : RESTROOM_ZONE_ID;
      renderSeatingSection();
    });

    svg.append(restroomGroup);

    // 5. 廚房區域變色標示 (後場備餐作業區)
    const isKitchenHighlighted = highlightedIds.has(KITCHEN_ZONE_ID);
    const kitchenGroup = document.createElementNS(svgNS, 'g');
    kitchenGroup.setAttribute(
      'class',
      `seating-kitchen-group${isKitchenHighlighted ? ' is-highlighted' : ''}`
    );
    kitchenGroup.style.setProperty('--zone-color', KITCHEN_ZONE_META.color);
    kitchenGroup.style.setProperty('--zone-fill', KITCHEN_ZONE_META.fillColor);

    const kitchenRect = document.createElementNS(svgNS, 'rect');
    kitchenRect.setAttribute('x', String(KITCHEN_ZONE_META.box.x));
    kitchenRect.setAttribute('y', String(KITCHEN_ZONE_META.box.y));
    kitchenRect.setAttribute('width', String(KITCHEN_ZONE_META.box.w));
    kitchenRect.setAttribute('height', String(KITCHEN_ZONE_META.box.h));
    kitchenRect.setAttribute('rx', '20');
    kitchenRect.setAttribute('ry', '20');
    kitchenRect.setAttribute(
      'class',
      `seating-zone-hotspot seating-kitchen-hotspot${isKitchenHighlighted ? ' is-highlighted' : ''}`
    );

    const kitchenBadgeBg = document.createElementNS(svgNS, 'rect');
    kitchenBadgeBg.setAttribute('x', '344');
    kitchenBadgeBg.setAttribute('y', '2060');
    kitchenBadgeBg.setAttribute('width', '216');
    kitchenBadgeBg.setAttribute('height', '140');
    kitchenBadgeBg.setAttribute('rx', '24');
    kitchenBadgeBg.setAttribute('ry', '24');
    kitchenBadgeBg.setAttribute('class', 'seating-kitchen-badge-bg');

    const kitchenLabelMain = document.createElementNS(svgNS, 'text');
    kitchenLabelMain.setAttribute('x', '452');
    kitchenLabelMain.setAttribute('y', '2120');
    kitchenLabelMain.setAttribute('text-anchor', 'middle');
    kitchenLabelMain.setAttribute('class', 'seating-kitchen-label-main');
    kitchenLabelMain.textContent = currentLang === 'en' ? '👨‍🍳 KITCHEN' : '👨‍🍳 廚房';

    const kitchenLabelSub = document.createElementNS(svgNS, 'text');
    kitchenLabelSub.setAttribute('x', '452');
    kitchenLabelSub.setAttribute('y', '2168');
    kitchenLabelSub.setAttribute('text-anchor', 'middle');
    kitchenLabelSub.setAttribute('class', 'seating-kitchen-label-sub');
    kitchenLabelSub.textContent = currentLang === 'en' ? 'Prep & Galley' : '備餐作業區';

    const kitchenTitle = document.createElementNS(svgNS, 'title');
    kitchenTitle.textContent = `${KITCHEN_ZONE_META.name[currentLang]} · ${KITCHEN_ZONE_META.zone[currentLang]}`;
    kitchenGroup.append(
      kitchenTitle,
      kitchenRect,
      kitchenBadgeBg,
      kitchenLabelMain,
      kitchenLabelSub
    );

    kitchenGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSeatingZoneId = selectedSeatingZoneId === KITCHEN_ZONE_ID ? null : KITCHEN_ZONE_ID;
      renderSeatingSection();
    });

    svg.append(kitchenGroup);

    // 6. 吧台區域標示 (A02 吧檯)
    const isBarHighlighted = highlightedIds.has(BAR_ZONE_ID);
    const barGroup = document.createElementNS(svgNS, 'g');
    barGroup.setAttribute(
      'class',
      `seating-bar-group${isBarHighlighted ? ' is-highlighted' : ''}`
    );
    barGroup.style.setProperty('--zone-color', BAR_ZONE_META.color);
    barGroup.style.setProperty('--zone-fill', BAR_ZONE_META.fillColor);

    const barRect = document.createElementNS(svgNS, 'rect');
    barRect.setAttribute('x', String(BAR_ZONE_META.box.x));
    barRect.setAttribute('y', String(BAR_ZONE_META.box.y));
    barRect.setAttribute('width', String(BAR_ZONE_META.box.w));
    barRect.setAttribute('height', String(BAR_ZONE_META.box.h));
    barRect.setAttribute('rx', '20');
    barRect.setAttribute('ry', '20');
    barRect.setAttribute(
      'class',
      `seating-zone-hotspot seating-bar-hotspot${isBarHighlighted ? ' is-highlighted' : ''}`
    );

    const barBadgeBg = document.createElementNS(svgNS, 'rect');
    barBadgeBg.setAttribute('x', '594');
    barBadgeBg.setAttribute('y', '2060');
    barBadgeBg.setAttribute('width', '188');
    barBadgeBg.setAttribute('height', '140');
    barBadgeBg.setAttribute('rx', '24');
    barBadgeBg.setAttribute('ry', '24');
    barBadgeBg.setAttribute('class', 'seating-bar-badge-bg');

    const barLabelMain = document.createElementNS(svgNS, 'text');
    barLabelMain.setAttribute('x', '688');
    barLabelMain.setAttribute('y', '2120');
    barLabelMain.setAttribute('text-anchor', 'middle');
    barLabelMain.setAttribute('class', 'seating-bar-label-main');
    barLabelMain.textContent = currentLang === 'en' ? '🍹 BAR' : '🍹 吧台';

    const barLabelSub = document.createElementNS(svgNS, 'text');
    barLabelSub.setAttribute('x', '688');
    barLabelSub.setAttribute('y', '2168');
    barLabelSub.setAttribute('text-anchor', 'middle');
    barLabelSub.setAttribute('class', 'seating-bar-label-sub');
    barLabelSub.textContent = currentLang === 'en' ? 'Counter (A02)' : '吧檯區 (A02)';

    const barTitle = document.createElementNS(svgNS, 'title');
    barTitle.textContent = `${BAR_ZONE_META.name[currentLang]} · ${BAR_ZONE_META.zone[currentLang]}`;
    barGroup.append(barTitle, barRect, barBadgeBg, barLabelMain, barLabelSub);

    barGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSeatingZoneId = selectedSeatingZoneId === BAR_ZONE_ID ? null : BAR_ZONE_ID;
      renderSeatingSection();
    });

    svg.append(barGroup);

    mapWrap.addEventListener('click', () => {
      if (selectedSeatingZoneId) {
        selectedSeatingZoneId = null;
        renderSeatingSection();
      }
    });

    mapWrap.append(img, svg);
    stageChildren.push(mapWrap);
    elSeatingPhotoStage.replaceChildren(...stageChildren);
    elSeatingPhotoStage.classList.remove('hidden');
  }

  function renderSeatingSection() {
    if (!elSeatingTablesGrid) return;

    const isDebugPage = Boolean(
      document.getElementById('debug-toolbar') || document.getElementById('debug-auth-gate')
    );
    const query = elSeatingSearchInput ? elSeatingSearchInput.value.trim().toLowerCase() : '';
    const highlightedIds = new Set();
    if (selectedSeatingZoneId) {
      highlightedIds.add(selectedSeatingZoneId);
    }

    const matchesFacility = (keywords, exactSingleChars = []) => {
      if (!query) return false;
      if (exactSingleChars.includes(query)) return true;
      return keywords.some(
        (kw) =>
          query.includes(kw) ||
          (query.length >= 3 && kw.startsWith(query)) ||
          (query.length >= 2 && /[\u4e00-\u9fff]/.test(kw) && kw.includes(query))
      );
    };

    if (
      matchesFacility(
        ['廁所', '洗手間', '化妝室', '男廁', '女廁', 'restroom', 'toilet', 'wc'],
        ['廁']
      )
    ) {
      highlightedIds.add(RESTROOM_ZONE_ID);
    }

    if (matchesFacility(['吧台', '吧檯', '飲料', '調酒', '酒水', 'bar'], ['吧', '酒'])) {
      highlightedIds.add(BAR_ZONE_ID);
    }

    if (matchesFacility(['餐點', '餐點區', '取餐', '自助餐', 'buffet', 'food'])) {
      highlightedIds.add(BUFFET_ZONE_ID);
    }

    if (
      matchesFacility(['接待桌', '接待', '簽到', '收禮', '迎賓', '禮金', 'reception', 'checkin', 'desk'])
    ) {
      highlightedIds.add(RECEPTION_ZONE_ID);
    }

    if (matchesFacility(['廚房', '備餐', 'kitchen'], ['廚'])) {
      highlightedIds.add(KITCHEN_ZONE_ID);
    }

    const tableCards = [];
    SEATING_TABLES_DATA.forEach((table) => {
      const tName = table.name[currentLang] || table.name.zh;
      const tZone = table.zone[currentLang] || table.zone.zh;
      const matchesTableTitle =
        !query ||
        tName.toLowerCase().includes(query) ||
        tZone.toLowerCase().includes(query) ||
        (table.name.zh && table.name.zh.toLowerCase().includes(query)) ||
        (table.name.en && table.name.en.toLowerCase().includes(query));

      const hasMatchingGuest = table.guests.some(
        (g) =>
          (g.zh && g.zh.toLowerCase().includes(query)) ||
          (g.en && g.en.toLowerCase().includes(query))
      );

      if (query && (matchesTableTitle || hasMatchingGuest)) {
        highlightedIds.add(table.id);
      }

      if (query && !matchesTableTitle && !hasMatchingGuest) {
        return;
      }

      const isZoneActive = highlightedIds.has(table.id);
      const card = document.createElement('article');
      card.className = `seating-table-card${table.id === 'table-main' ? ' is-main-table' : ''}${isZoneActive ? ' is-zone-highlighted' : ''}`;
      card.setAttribute('data-zone-id', table.id);
      if (table.color) {
        card.style.setProperty('--zone-color', table.color);
      }
      if (table.fillColor) {
        card.style.setProperty('--zone-fill', table.fillColor);
      }
      card.addEventListener('click', () => {
        selectedSeatingZoneId = selectedSeatingZoneId === table.id ? null : table.id;
        renderSeatingSection();
        if (selectedSeatingZoneId && elSeatingPhotoStage && typeof elSeatingPhotoStage.scrollIntoView === 'function') {
          elSeatingPhotoStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      const head = document.createElement('div');
      head.className = 'seating-table-head';

      const nameEl = document.createElement('h4');
      nameEl.className = 'seating-table-name';

      const swatchDot = document.createElement('span');
      swatchDot.className = 'seating-zone-swatch';
      swatchDot.setAttribute('aria-hidden', 'true');

      const nameText = document.createElement('span');
      nameText.textContent = tName;
      nameEl.append(swatchDot, nameText);

      const zoneBadge = document.createElement('span');
      zoneBadge.className = 'seating-table-badge';
      zoneBadge.textContent = tZone;

      head.append(nameEl, zoneBadge);
      card.append(head);

      // 僅在 Debug 版本顯示每區「人數、素食人數、嬰兒車人數」（正常版 index.html 不顯示）
      if (isDebugPage && table.debugStats) {
        const statsBar = document.createElement('div');
        statsBar.className = 'seating-debug-stats';

        const pillHeadcount = document.createElement('span');
        pillHeadcount.className = 'seating-debug-pill';
        pillHeadcount.textContent =
          currentLang === 'en'
            ? `👥 Guests: ${table.debugStats.headcount}`
            : `👥 人數：${table.debugStats.headcount} 人`;

        const pillVeg = document.createElement('span');
        pillVeg.className = `seating-debug-pill${table.debugStats.veg > 0 ? ' has-value' : ''}`;
        pillVeg.textContent =
          currentLang === 'en'
            ? `🥗 Veg: ${table.debugStats.veg}`
            : `🥗 素食人數：${table.debugStats.veg} 人`;

        const pillStroller = document.createElement('span');
        pillStroller.className = `seating-debug-pill${table.debugStats.stroller > 0 ? ' has-value' : ''}`;
        pillStroller.textContent =
          currentLang === 'en'
            ? `🚼 Stroller: ${table.debugStats.stroller}`
            : `🚼 嬰兒車人數：${table.debugStats.stroller} 人`;

        statsBar.append(pillHeadcount, pillVeg, pillStroller);

        if (table.debugStats.childSeat > 0) {
          const pillChair = document.createElement('span');
          pillChair.className = 'seating-debug-pill has-value';
          pillChair.textContent =
            currentLang === 'en'
              ? `🪑 High Chair: ${table.debugStats.childSeat}`
              : `🪑 兒童椅：${table.debugStats.childSeat} 張`;
          statsBar.append(pillChair);
        }

        card.append(statsBar);
      }

      const guestsWrap = document.createElement('div');
      guestsWrap.className = 'seating-guests-list';

      table.guests.forEach((guest) => {
        const pill = document.createElement('span');
        const gLabel = guest[currentLang] || guest.zh;
        const isGuestHit =
          Boolean(query) &&
          ((guest.zh && guest.zh.toLowerCase().includes(query)) ||
            (guest.en && guest.en.toLowerCase().includes(query)));
        pill.className = `seating-guest-pill${isGuestHit ? ' is-match' : ''}`;
        pill.textContent = gLabel;
        guestsWrap.append(pill);
      });

      card.append(guestsWrap);
      tableCards.push(card);
    });

    renderSeatingFloorPlan(highlightedIds);
    if (query && tableCards.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'seating-empty-state';
      const rawInput = elSeatingSearchInput ? elSeatingSearchInput.value.trim() : query;
      if (highlightedIds.size > 0) {
        emptyBox.textContent =
          currentLang === 'en'
            ? '📍 Facility location highlighted on the floor plan above.'
            : '📍 已於上方平面圖為您標示設施位置。';
      } else {
        emptyBox.textContent =
          currentLang === 'en'
            ? `No guest or table found matching "${rawInput}". Please check the spelling or ask our reception staff.`
            : `找不到符合「${rawInput}」的賓客或桌次，請確認姓名拼寫或洽詢現場接待人員。`;
      }
      elSeatingTablesGrid.replaceChildren(emptyBox);
      return;
    }
    elSeatingTablesGrid.replaceChildren(...tableCards);
  }

  function renderBanquetMenuSection() {
    if (!elBanquetCoursesList) return;
    const dict = t();

    renderEmbeddedPhotoStage(
      elMenuPhotoStage,
      elMenuExternalLink,
      WEDDING_MENU_IMAGE_URL,
      WEDDING_MENU_LINK_URL,
      dict.menuPanelTitle
    );

    const courseCards = WEDDING_MENU_COURSES.map((course) => {
      const card = document.createElement('article');
      card.className = 'banquet-course-card';

      const left = document.createElement('div');
      const numEl = document.createElement('div');
      numEl.className = 'banquet-course-num';
      numEl.textContent = course.courseNo;

      const titleEl = document.createElement('h4');
      titleEl.className = 'banquet-course-title';
      titleEl.textContent = course.title[currentLang] || course.title.zh;

      const descEl = document.createElement('p');
      descEl.className = 'banquet-course-desc';
      descEl.textContent = course.desc[currentLang] || course.desc.zh;

      left.append(numEl, titleEl, descEl);

      const tagEl = document.createElement('span');
      tagEl.className = 'banquet-course-tag';
      tagEl.textContent = course.tag[currentLang] || course.tag.zh;

      card.append(left, tagEl);
      return card;
    });

    elBanquetCoursesList.replaceChildren(...courseCards);
  }

  function renderFootprintsSection() {
    if (!elFootprintYearBar || !elFootprintTimelineList) return;
    const dict = t();
    const uniqueYears = Array.from(new Set(LOVE_FOOTPRINTS_DATA.map((d) => d.year)));
    const yearOptions = [{ id: 'all', label: dict.yearAll }].concat(
      uniqueYears.map((yr) => ({ id: yr, label: yr }))
    );

    const yearButtons = yearOptions.map((yrObj) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `era-pill${selectedFootprintYear === yrObj.id ? ' active' : ''}`;
      btn.textContent = yrObj.label;
      btn.addEventListener('click', () => {
        selectedFootprintYear = yrObj.id;
        if (yrObj.id !== 'all') {
          const firstIdx = LOVE_FOOTPRINTS_DATA.findIndex((d) => d.year === yrObj.id);
          if (firstIdx >= 0 && LOVE_FOOTPRINTS_DATA.length > 1) {
            timelinePlaying = false;
            if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
            if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
            timelineProgress = firstIdx / (LOVE_FOOTPRINTS_DATA.length - 1);
          }
        }
        renderFootprintsSection();
      });
      return btn;
    });
    elFootprintYearBar.replaceChildren(...yearButtons);

    const filteredFootprints = LOVE_FOOTPRINTS_DATA.map((item, globalIdx) => ({
      item,
      globalIdx,
    })).filter(({ item }) => selectedFootprintYear === 'all' || item.year === selectedFootprintYear);

    const timelineNodes = filteredFootprints.map(({ item, globalIdx }) => {
      const node = document.createElement('div');
      node.className = 'timeline-item';
      node.style.cursor = 'pointer';
      node.title = currentLang === 'zh' ? '點擊在上方地圖聚焦此時間點' : 'Click to focus this moment on the map';
      node.addEventListener('click', (ev) => {
        if (ev.target && ev.target.closest('a')) return;
        if (LOVE_FOOTPRINTS_DATA.length > 1) {
          timelinePlaying = false;
          if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
          if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
          timelineProgress = globalIdx / (LOVE_FOOTPRINTS_DATA.length - 1);
          drawTimelineVideoFrame(timelineProgress);
          if (elTimelineVideoCanvas) {
            elTimelineVideoCanvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });

      const header = document.createElement('div');
      header.className = 'timeline-header';

      const yearBadge = document.createElement('span');
      yearBadge.className = 'timeline-year-badge';
      yearBadge.textContent = item.dateTag || item.year;

      const distBadge = document.createElement('span');
      distBadge.className = 'timeline-distance-badge';
      distBadge.textContent =
        item.distanceLabel && typeof item.distanceLabel === 'object'
          ? item.distanceLabel[currentLang]
          : item.distanceLabel;

      header.append(yearBadge, distBadge);

      if (item.tom && item.eunice) {
        const pairRow = document.createElement('div');
        pairRow.className = 'footprint-pair-row';

        const tomTag = document.createElement('span');
        tomTag.className = 'footprint-role-pill is-tom';
        tomTag.textContent = `🤵‍♂️ Tom · ${item.tom.city[currentLang]}`;

        const euniceTag = document.createElement('span');
        euniceTag.className = 'footprint-role-pill is-eunice';
        euniceTag.textContent = `👰‍♀️ Eunice · ${item.eunice.city[currentLang]}`;

        pairRow.append(tomTag, euniceTag);
        node.append(header, pairRow);
      } else {
        node.append(header);
      }

      const titleEl = document.createElement('h4');
      titleEl.className = 'timeline-place-title';
      titleEl.textContent = item.place[currentLang];

      const descEl = document.createElement('p');
      descEl.className = 'timeline-place-desc';
      descEl.textContent = item.desc[currentLang];

      const mapLink = document.createElement('a');
      mapLink.className = 'timeline-map-link';
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`;
      mapLink.target = '_blank';
      mapLink.rel = 'noopener noreferrer';
      mapLink.textContent = dict.openMapBtn;

      node.append(titleEl, descEl, mapLink);
      return node;
    });

    elFootprintTimelineList.replaceChildren(...timelineNodes);
    drawTimelineVideoFrame(timelineProgress);
  }

  // ============================================================================
  // 2B. 2014–2026 交往軌跡 Timeline 動態影片繪製與錄製匯出引擎（內建高精度世界地圖向量輪廓）
  // ============================================================================
  const WORLD_MAP_POLYGONS = [
    // 北美洲與中美洲 (North & Central America: Alaska, Canada, US West/East Coast, Florida, Mexico, Panama)
    {
      name: 'NorthAmerica',
      coords: [
        [70.2, -161.0], [71.3, -156.5], [69.6, -141.0], [69.5, -133.0], [68.5, -121.0],
        [68.8, -106.0], [66.0, -96.0], [64.2, -90.0], [62.5, -78.0], [58.8, -68.0],
        [60.3, -64.5], [53.5, -55.8], [47.5, -59.5], [46.8, -64.5], [44.6, -63.6],
        [43.5, -65.6], [44.8, -67.0], [42.0, -70.2], [40.6, -74.0], [38.9, -75.0],
        [35.2, -75.5], [32.1, -80.8], [28.5, -80.6], [25.2, -80.4], [25.8, -81.7],
        [28.9, -82.8], [30.1, -85.5], [29.2, -89.6], [29.5, -94.8], [26.0, -97.2],
        [22.2, -97.8], [19.2, -96.1], [18.2, -94.0], [18.5, -90.5], [21.2, -89.6],
        [21.5, -87.1], [18.0, -88.2], [15.8, -88.5], [16.0, -86.0], [15.0, -83.2],
        [11.0, -83.8], [8.5, -77.5], [7.8, -78.2], [8.5, -83.0], [10.8, -85.8],
        [13.5, -87.8], [14.5, -92.2], [16.2, -95.2], [16.8, -99.9], [19.0, -104.3],
        [21.5, -105.3], [23.2, -106.4], [28.0, -111.0], [31.3, -113.5], [30.0, -114.5],
        [23.0, -109.9], [24.8, -112.2], [28.0, -114.2], [32.5, -117.1], [34.4, -120.4],
        [37.8, -122.5], [40.4, -124.4], [46.2, -124.0], [48.4, -124.7], [51.0, -127.8],
        [54.5, -130.5], [58.3, -136.6], [59.8, -141.0], [60.0, -149.5], [55.0, -162.8],
        [58.5, -161.8], [60.5, -165.4], [63.5, -161.5], [65.6, -168.1], [68.5, -166.0],
      ],
    },
    // 南美洲 (South America)
    {
      name: 'SouthAmerica',
      coords: [
        [11.2, -74.2], [12.2, -71.2], [10.6, -66.9], [10.5, -62.0], [6.8, -58.1],
        [4.9, -52.3], [1.5, -50.0], [-1.4, -48.5], [-2.5, -44.3], [-3.7, -38.5],
        [-5.8, -35.2], [-8.0, -34.9], [-13.0, -38.5], [-18.0, -39.5], [-23.0, -43.2],
        [-25.5, -48.5], [-30.0, -50.2], [-34.5, -54.0], [-38.0, -57.5], [-42.8, -64.0],
        [-47.5, -65.8], [-52.4, -68.5], [-54.8, -66.0], [-53.5, -72.5], [-46.5, -75.0],
        [-39.8, -73.5], [-33.0, -71.6], [-23.6, -70.4], [-18.5, -70.3], [-14.0, -76.2],
        [-8.0, -79.2], [-4.7, -81.3], [-1.0, -80.8], [2.0, -78.8], [5.5, -77.4],
        [8.5, -77.6],
      ],
    },
    // 格陵蘭 (Greenland)
    {
      name: 'Greenland',
      coords: [
        [60.0, -43.5], [63.5, -40.8], [66.0, -35.5], [69.5, -24.0], [72.0, -22.0],
        [72.0, -55.0], [68.5, -53.5], [64.2, -51.7], [60.8, -48.0],
      ],
    },
    // 冰島 (Iceland)
    {
      name: 'Iceland',
      coords: [
        [63.5, -19.5], [64.4, -14.5], [66.2, -15.0], [66.4, -22.5], [64.1, -22.0],
      ],
    },
    // 加勒比海 · 古巴 (Cuba)
    {
      name: 'Cuba',
      coords: [
        [21.9, -84.9], [23.1, -82.3], [22.5, -79.0], [20.0, -74.2], [19.9, -77.6], [21.5, -81.0],
      ],
    },
    // 夏威夷群島 (Hawaii Archipelago)
    {
      name: 'Hawaii_BigIsland',
      coords: [
        [20.25, -155.85], [19.72, -155.05], [18.92, -155.68], [19.65, -156.05],
      ],
    },
    {
      name: 'Hawaii_OahuMaui',
      coords: [
        [21.7, -158.0], [21.3, -157.65], [20.6, -156.1], [20.8, -156.6], [21.45, -158.25],
      ],
    },
    // 英國大不列顛島 (Great Britain)
    {
      name: 'GreatBritain',
      coords: [
        [50.1, -5.2], [50.7, -1.8], [51.1, 1.3], [51.8, 1.4], [52.7, 1.7],
        [53.6, 0.1], [55.0, -1.4], [56.0, -2.6], [57.5, -1.8], [58.6, -3.1],
        [58.5, -5.0], [56.8, -5.8], [55.2, -5.1], [54.0, -3.0], [53.3, -4.5],
        [51.7, -5.1], [51.4, -3.2],
      ],
    },
    // 愛爾蘭島 (Ireland)
    {
      name: 'Ireland',
      coords: [
        [51.5, -9.8], [52.2, -6.4], [53.4, -6.1], [54.6, -5.5], [55.3, -7.4],
        [54.2, -10.0], [52.6, -9.9],
      ],
    },
    // 歐洲與亞洲大陸 (Eurasia: Iberia, France, Germany, Denmark, Scandinavia, Russia, Korea, China, SE Asia, India, Arabia, Mediterranean, Italy, Greece)
    {
      name: 'Eurasia',
      coords: [
        [36.1, -5.6], [37.0, -8.9], [38.8, -9.4], [41.2, -8.7], [43.4, -8.4],
        [43.4, -1.8], [44.8, -1.2], [47.3, -2.5], [48.4, -4.7], [48.9, -1.8],
        [49.6, -1.6], [50.9, 1.6], [51.9, 4.1], [53.2, 5.1], [53.5, 8.5],
        [55.5, 8.1], [57.7, 10.6], [55.4, 10.8], [54.0, 10.9], [54.4, 13.6],
        [53.9, 14.8], [54.7, 18.6], [55.8, 21.1], [57.8, 22.6], [59.4, 24.7],
        [59.9, 30.2], [60.6, 27.8], [60.4, 22.2], [61.5, 21.5], [63.8, 22.8],
        [65.8, 24.2], [65.5, 22.1], [62.5, 17.5], [59.3, 18.1], [56.1, 15.6],
        [55.4, 13.0], [57.7, 11.9], [59.9, 10.7], [58.1, 8.0], [58.9, 5.7],
        [62.1, 5.1], [64.8, 11.0], [68.2, 14.5], [70.7, 23.7], [71.1, 28.0],
        [69.0, 33.1], [66.8, 40.5], [68.5, 43.5], [69.5, 60.0], [71.5, 72.0],
        [72.0, 85.0], [72.0, 105.0], [71.5, 130.0], [70.0, 155.0], [66.5, 172.0],
        [60.5, 166.0], [59.0, 163.0], [52.0, 158.0], [55.0, 155.5], [59.5, 150.8],
        [54.5, 137.0], [48.5, 140.2], [43.1, 131.9], [40.0, 127.9], [37.5, 129.2],
        [35.1, 129.0], [34.8, 126.4], [37.5, 126.6], [39.8, 124.2], [38.9, 121.6],
        [40.6, 120.8], [38.8, 117.7], [37.5, 121.4], [36.1, 120.4], [34.5, 119.5],
        [31.2, 121.5], [29.9, 122.0], [27.5, 120.6], [25.5, 119.8], [23.4, 116.7],
        [22.3, 114.2], [21.5, 111.0], [20.2, 110.0], [21.5, 108.6], [20.8, 106.7],
        [18.0, 106.5], [16.0, 108.2], [12.2, 109.2], [10.3, 107.1], [8.6, 104.8],
        [10.5, 103.5], [13.5, 100.6], [9.2, 99.3], [7.0, 100.6], [3.1, 103.4],
        [1.35, 103.8], [3.1, 101.4], [5.4, 100.3], [8.0, 98.3], [13.5, 98.1],
        [16.8, 96.2], [16.0, 94.3], [20.1, 92.9], [22.3, 91.8], [21.8, 88.5],
        [19.8, 85.8], [17.7, 83.3], [13.1, 80.3], [8.1, 77.5], [9.9, 76.3],
        [15.4, 73.8], [19.1, 72.9], [21.6, 69.6], [23.0, 68.8], [24.9, 67.0],
        [25.2, 62.3], [25.6, 57.2], [27.2, 56.3], [29.9, 48.8], [26.2, 50.2],
        [24.5, 54.4], [25.3, 55.3], [22.5, 59.8], [17.0, 54.1], [14.5, 49.1],
        [12.8, 45.0], [15.5, 42.7], [21.5, 39.2], [27.8, 34.5], [29.9, 32.5],
        [31.5, 34.4], [33.9, 35.5], [36.8, 36.2], [36.8, 30.7], [37.0, 27.4],
        [38.4, 27.1], [40.2, 26.4], [41.0, 29.0], [42.0, 35.1], [41.0, 39.7],
        [42.0, 41.6], [44.6, 37.8], [45.3, 36.5], [46.5, 30.7], [44.2, 28.6],
        [42.5, 27.5], [40.6, 22.9], [38.0, 23.7], [36.8, 21.9], [39.6, 19.9],
        [41.3, 19.4], [42.6, 18.1], [45.3, 14.4], [45.6, 13.8], [45.4, 12.3],
        [44.4, 12.3], [42.5, 14.2], [40.1, 18.5], [39.8, 18.3], [40.4, 17.2],
        [38.9, 16.6], [38.0, 15.6], [40.8, 14.3], [41.8, 12.3], [43.7, 10.3],
        [44.4, 8.9], [43.7, 7.3], [43.3, 5.4], [43.0, 3.1], [41.4, 2.2],
        [39.5, -0.3], [37.6, -1.0], [36.7, -4.4],
      ],
    },
    // 非洲大陸 (Africa)
    {
      name: 'Africa',
      coords: [
        [35.8, -5.8], [33.6, -7.6], [30.4, -9.6], [27.0, -13.4], [21.0, -17.0],
        [14.7, -17.5], [11.8, -15.6], [8.5, -13.2], [4.4, -7.7], [5.3, -4.0],
        [6.4, 3.4], [4.0, 9.7], [0.4, 9.4], [-4.3, 11.8], [-8.8, 13.2],
        [-12.6, 13.4], [-17.3, 11.8], [-22.9, 14.5], [-28.6, 16.5], [-34.0, 18.4],
        [-34.8, 20.0], [-33.9, 25.6], [-29.9, 31.0], [-25.9, 32.6], [-19.8, 34.9],
        [-15.0, 40.7], [-10.3, 40.2], [-6.8, 39.3], [-4.0, 39.7], [-0.4, 42.5],
        [4.5, 48.0], [11.8, 51.3], [11.5, 43.2], [15.6, 39.5], [19.6, 37.2],
        [24.0, 35.5], [27.2, 33.8], [29.9, 32.5], [31.5, 32.3], [31.2, 29.9],
        [32.1, 20.1], [32.9, 13.2], [34.7, 10.8], [37.1, 10.2], [36.8, 3.1],
        [35.7, -0.6],
      ],
    },
    // 馬達加斯加 (Madagascar)
    {
      name: 'Madagascar',
      coords: [
        [-12.3, 49.3], [-15.8, 50.2], [-21.0, 48.3], [-25.0, 47.0], [-25.2, 44.5],
        [-20.3, 44.3], [-15.7, 46.3],
      ],
    },
    // 斯里蘭卡 (Sri Lanka)
    {
      name: 'SriLanka',
      coords: [
        [9.7, 80.2], [8.5, 81.2], [6.0, 80.5], [7.2, 79.8],
      ],
    },
    // 台灣寶島與澎湖群島 (Taiwan & Penghu — 高精度島嶼輪廓，Zoom-In 時清晰呈現南北城市相對位置)
    {
      name: 'Taiwan',
      isHighlight: true,
      coords: [
        [25.30, 121.56], [25.13, 121.75], [25.01, 122.00], [24.83, 121.83],
        [24.58, 121.87], [24.25, 121.68], [23.98, 121.62], [23.48, 121.50],
        [23.10, 121.40], [22.76, 121.15], [22.35, 120.90], [21.90, 120.85],
        [21.93, 120.72], [22.25, 120.65], [22.62, 120.27], [22.98, 120.15],
        [23.15, 120.06], [23.55, 120.13], [23.85, 120.23], [24.16, 120.43],
        [24.48, 120.65], [24.78, 120.92], [25.05, 121.08], [25.18, 121.26],
        [25.28, 121.42],
      ],
    },
    {
      name: 'Penghu',
      isHighlight: true,
      coords: [
        [23.68, 119.58], [23.62, 119.68], [23.50, 119.62], [23.54, 119.50],
      ],
    },
    // 海南島 (Hainan)
    {
      name: 'Hainan',
      coords: [
        [20.0, 110.3], [19.2, 110.6], [18.2, 109.5], [18.5, 108.7], [19.7, 109.2],
      ],
    },
    // 日本 · 北海道 (Hokkaido)
    {
      name: 'Japan_Hokkaido',
      coords: [
        [45.5, 141.9], [44.0, 145.1], [43.0, 144.4], [42.0, 143.2],
        [42.3, 140.9], [41.5, 140.1], [43.2, 140.4],
      ],
    },
    // 日本 · 本州與四國 (Honshu & Shikoku)
    {
      name: 'Japan_Honshu',
      coords: [
        [41.5, 140.9], [39.6, 142.0], [38.3, 141.0], [35.7, 140.8],
        [35.4, 139.7], [34.6, 138.2], [34.7, 136.9], [33.5, 135.8],
        [34.6, 135.4], [34.0, 133.5], [34.0, 130.9], [35.5, 133.2],
        [35.7, 136.0], [37.5, 137.3], [37.9, 139.0], [39.7, 140.0],
      ],
    },
    // 日本 · 九州 (Kyushu)
    {
      name: 'Japan_Kyushu',
      coords: [
        [33.9, 130.9], [32.9, 131.9], [31.2, 130.7], [32.7, 129.8], [33.6, 130.3],
      ],
    },
    // 菲律賓 · 呂宋與民答那峨 (Philippines)
    {
      name: 'Philippines_Luzon',
      coords: [
        [18.5, 120.8], [18.2, 122.2], [15.5, 121.6], [13.0, 123.8],
        [13.8, 121.0], [14.6, 120.5], [16.2, 119.9],
      ],
    },
    {
      name: 'Philippines_Mindanao',
      coords: [
        [9.8, 125.5], [7.1, 126.5], [6.0, 125.2], [7.0, 122.1], [8.6, 123.3],
      ],
    },
    // 印尼 · 蘇門答臘 (Sumatra)
    {
      name: 'Sumatra',
      coords: [
        [5.5, 95.3], [3.6, 98.7], [0.5, 103.2], [-3.0, 106.0],
        [-5.9, 105.8], [-5.2, 103.8], [-1.0, 100.3], [2.5, 97.5],
      ],
    },
    // 印尼 · 爪哇 (Java)
    {
      name: 'Java',
      coords: [
        [-6.0, 105.9], [-6.9, 110.4], [-7.3, 112.8], [-8.4, 114.4],
        [-8.2, 111.0], [-7.5, 107.5],
      ],
    },
    // 婆羅洲 (Borneo)
    {
      name: 'Borneo',
      coords: [
        [7.0, 116.8], [5.0, 119.2], [1.2, 118.8], [-3.5, 116.2],
        [-3.2, 111.8], [-1.5, 109.4], [1.8, 109.6], [4.9, 114.9],
      ],
    },
    // 蘇拉威西 (Sulawesi)
    {
      name: 'Sulawesi',
      coords: [
        [1.5, 125.0], [0.5, 120.0], [-2.5, 119.0], [-5.5, 120.3],
        [-4.0, 122.5], [-1.5, 121.5], [0.5, 123.5],
      ],
    },
    // 新幾內亞 (New Guinea)
    {
      name: 'NewGuinea',
      coords: [
        [-0.8, 131.2], [-2.5, 140.7], [-5.5, 145.8], [-9.5, 147.2],
        [-10.5, 150.8], [-8.5, 143.5], [-8.2, 138.0], [-4.5, 135.5], [-2.5, 132.0],
      ],
    },
    // 澳洲大陸與塔斯馬尼亞 (Australia & Tasmania)
    {
      name: 'Australia',
      coords: [
        [-12.4, 130.8], [-12.0, 136.8], [-16.5, 139.2], [-10.7, 142.5],
        [-16.9, 145.8], [-20.0, 148.7], [-23.8, 151.3], [-27.5, 153.0],
        [-33.9, 151.2], [-37.8, 149.5], [-38.3, 144.9], [-35.0, 138.6],
        [-34.7, 135.9], [-31.7, 131.5], [-33.9, 121.9], [-35.0, 117.9],
        [-32.0, 115.8], [-25.9, 113.5], [-21.8, 114.1], [-18.0, 122.2],
        [-14.5, 125.8],
      ],
    },
    {
      name: 'Tasmania',
      coords: [
        [-40.8, 144.7], [-41.2, 148.3], [-43.6, 146.9], [-42.2, 145.2],
      ],
    },
    // 紐西蘭南北島 (New Zealand)
    {
      name: 'NewZealand_North',
      coords: [
        [-34.4, 172.7], [-36.8, 174.8], [-37.7, 178.5], [-39.6, 176.9],
        [-41.3, 174.8], [-39.3, 173.8], [-37.0, 174.2],
      ],
    },
    {
      name: 'NewZealand_South',
      coords: [
        [-40.6, 172.7], [-41.5, 174.0], [-43.5, 172.7], [-46.0, 170.5],
        [-46.6, 168.3], [-45.0, 167.0], [-42.5, 171.2],
      ],
    },
  ];

  /**
   * 計算兩組經緯度之間的地球表面大圓距離 (Haversine 公式，單位 km)
   */
  function calcDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  }

  /**
   * 嚴格鎖定地圖長寬經緯比例 (CAMERA_ASPECT = 2.28)
   * 確保無論 Zoom-In 到台灣或 Zoom-Out 到全球，spanLng / spanLat 永遠恆定，陸地與航線絕不拉伸扭曲！
   */
  const CAMERA_ASPECT = 2.28;

  /**
   * 每站「停留閱讀 + 平滑飛行」節奏曲線 (Dwell-and-Glide Cadence)
   * - 前 44% 時間 (0.00 ~ 0.44)：停留在該站點 (moveT = 0)，讓雙眼從容看清兩人位置、距離與故事字幕
   * - 後 56% 時間 (0.44 ~ 1.00)：以 Smoothstep 緩動平滑飛往下一站
   */
  function getDwellGlideFrac(rawFrac) {
    const dwellRatio = 0.44;
    if (rawFrac <= dwellRatio) return 0;
    const t = Math.max(0, Math.min(1, (rawFrac - dwellRatio) / (1 - dwellRatio)));
    return t * t * (3 - 2 * t);
  }

  /**
   * 依據單一時間節點中 Tom 與 Eunice 的座標，計算無變形等比例攝影機 (Zoom-In Camera)
   */
  function getRawCameraForStep(stepItem) {
    const tPos = stepItem.tom || { lat: stepItem.lat, lng: stepItem.lng };
    const ePos = stepItem.eunice || { lat: stepItem.lat, lng: stepItem.lng };
    const dLat = Math.abs(tPos.lat - ePos.lat);
    const dLng = Math.abs(tPos.lng - ePos.lng);

    let centerLat = (tPos.lat + ePos.lat) / 2;
    let centerLng = (tPos.lng + ePos.lng) / 2;
    let spanLng;

    const bothInTaiwan =
      tPos.lat >= 21.5 && tPos.lat <= 25.8 && tPos.lng >= 119.5 && tPos.lng <= 122.5 &&
      ePos.lat >= 21.5 && ePos.lat <= 25.8 && ePos.lng >= 119.5 && ePos.lng <= 122.5;

    const bothInEurope =
      tPos.lat >= 44.0 && tPos.lat <= 58.0 && tPos.lng >= -8.0 && tPos.lng <= 22.0 &&
      ePos.lat >= 44.0 && ePos.lat <= 58.0 && ePos.lng >= -8.0 && ePos.lng <= 22.0;

    if (bothInTaiwan) {
      // 聚焦台灣全島與周圍海域 (spanLng = 15.0°, spanLat = 6.58°，台灣全島清晰且比例自然)
      centerLat = centerLat * 0.5 + 23.75 * 0.5;
      centerLng = centerLng * 0.5 + 120.95 * 0.5;
      spanLng = 15.0;
    } else if (bothInEurope) {
      // 聚焦歐洲（英國諾丁漢、倫敦、巴黎、柏林、布拉格、奧地利）
      centerLat = centerLat * 0.75 + 50.5 * 0.25;
      centerLng = centerLng * 0.75 + 7.5 * 0.25;
      const neededLng = Math.max(dLng * 1.9 + 16, (dLat * 2.1 + 10) * CAMERA_ASPECT);
      spanLng = Math.max(28.0, Math.min(65.0, neededLng));
    } else if (dLng < 30 && dLat < 26) {
      // 東亞區域（台灣 ↔ 東京／仙台／京都／關西／北海道）或美西局部（西雅圖 ↔ 舊金山）
      const neededLng = Math.max(dLng * 1.75 + 16, (dLat * 1.9 + 10) * CAMERA_ASPECT);
      spanLng = Math.max(34.0, Math.min(78.0, neededLng));
    } else {
      // 跨洲遠距離（台灣 ↔ 美國／加拿大／英國／德國／杜拜）
      // 嚴格保持 spanLng <= 280°，確保 spanLat = spanLng / CAMERA_ASPECT 絕不觸頂變形
      const neededLng = Math.max(dLng * 1.28 + 38, (dLat * 1.85 + 24) * CAMERA_ASPECT);
      spanLng = Math.max(75.0, Math.min(280.0, neededLng));
    }

    const spanLat = spanLng / CAMERA_ASPECT;
    // 限制南北緯度邊界，避免視窗超出極區
    centerLat = Math.max(-52 + spanLat / 2, Math.min(74 - spanLat / 2, centerLat));
    return { centerLat, centerLng, spanLat, spanLng };
  }

  /**
   * 根據連續時間軸 exactStep 進行「等比例無變形」平滑對數縮放與尺度加權位移插值
   */
  function getInterpolatedCamera(exactStep) {
    const n = LOVE_FOOTPRINTS_DATA.length;
    if (n === 0) return { centerLat: 23.8, centerLng: 121.0, spanLat: 15 / CAMERA_ASPECT, spanLng: 15 };
    const i = Math.max(0, Math.min(n - 1, Math.floor(exactStep)));
    const nextIdx = Math.min(n - 1, i + 1);
    const rawFrac = Math.max(0, Math.min(1, exactStep - i));
    const moveT = getDwellGlideFrac(rawFrac);

    const camA = getRawCameraForStep(LOVE_FOOTPRINTS_DATA[i]);
    const camB = getRawCameraForStep(LOVE_FOOTPRINTS_DATA[nextIdx]);

    // 對數縮放插值，完全移除會造成中間晃動扭曲的 midFlightBoost
    const logSpanLng = Math.log(camA.spanLng) * (1 - moveT) + Math.log(camB.spanLng) * moveT;
    const spanLng = Math.max(15.0, Math.min(280.0, Math.exp(logSpanLng)));
    // 嚴格保持長寬比，杜絕任何縱橫拉伸變形
    const spanLat = spanLng / CAMERA_ASPECT;

    // 尺度加權中心插值 (Scale-Weighted Center Interpolation)：
    // 當從小範圍(台灣)切換到大範圍(跨洲)時，先拉遠再平移；從大範圍切回小範圍時，先對準中心再放大！
    const denom = (1 - moveT) * camB.spanLng + moveT * camA.spanLng;
    const weightB = denom > 1e-6 ? (moveT * camA.spanLng) / denom : moveT;

    let centerLat = camA.centerLat + (camB.centerLat - camA.centerLat) * weightB;
    const targetLngB = unwrapNear(camB.centerLng, camA.centerLng);
    const centerLng = camA.centerLng + (targetLngB - camA.centerLng) * weightB;
    centerLat = Math.max(-52 + spanLat / 2, Math.min(74 - spanLat / 2, centerLat));

    return { centerLat, centerLng, spanLat, spanLng };
  }

  /**
   * 將經緯度投影至當前動態攝影機視窗 (等比例無變形投影)
   */
  function projectWithCamera(lat, lng, cam, width, height) {
    const padX = width * 0.045;
    const padY = height * 0.105;
    const usableW = width - padX * 2;
    const usableH = height * 0.635;

    const minLng = cam.centerLng - cam.spanLng / 2;
    const maxLat = cam.centerLat + cam.spanLat / 2;

    const normX = (lng - minLng) / cam.spanLng;
    const normY = (maxLat - lat) / cam.spanLat;

    return {
      x: padX + normX * usableW,
      y: padY + normY * usableH,
    };
  }

  /**
   * 將經度 lng 展開至最接近參考經度 refLng 的等價週期 (|lng - refLng| <= 180°)
   * 確保台灣 (121°E) 與美西 (237.6°E = 122.4°W) 永遠走太平洋最短航線，絕不繞越歐亞大陸！
   */
  function unwrapNear(lng, refLng) {
    let d = ((lng - refLng + 540) % 360) - 180;
    if (d === -180 && lng > refLng) d = 180;
    return refLng + d;
  }

  /**
   * 在「地理經緯度空間 (Lat/Lng Space)」計算航線弧線控制點，再投影至畫面
   * 確保鏡頭在縮放與平移時，地球上的航線弧度永遠固定在地理座標上，絕不發生螢幕空間扭曲！
   */
  function getGeoArcControl(latA, lngA, latB, lngB, liftSign) {
    const dLat = latB - latA;
    const dLng = lngB - lngA;
    const geoDist = Math.hypot(dLat, dLng);
    // 依地理跨度決定北向拱起緯度，兩人同行時以 liftSign 微幅錯開南北弧度讓藍粉雙線並排清晰可見
    const archLat = Math.min(14.0, geoDist * 0.14) + liftSign * Math.min(1.6, Math.max(0.09, geoDist * 0.035));
    return {
      midLat: Math.min(72, Math.max(-48, (latA + latB) / 2 + archLat)),
      midLng: (lngA + lngB) / 2,
    };
  }

  /**
   * 繪製單人專屬角色標記 (Tom 🤵‍♂️ 星空藍新郎標記 / Eunice 👰‍♀️ 玫瑰粉新娘標記 + 專屬城市名牌)
   */
  function drawPersonMarker(ctx2d, role, x, y, cityText, mapBounds) {
    const isTom = role === 'tom';
    const primaryColor = isTom ? '#38bdf8' : '#f472b6';
    const darkBg = isTom ? 'rgba(10, 32, 52, 0.94)' : 'rgba(54, 14, 38, 0.94)';
    const glowColor = isTom ? 'rgba(56, 189, 248, 0.55)' : 'rgba(244, 114, 182, 0.55)';
    const iconEmoji = isTom ? '🤵‍♂️' : '👰‍♀️';
    const nameLabel = isTom ? 'Tom' : 'Eunice';

    ctx2d.save();

    // 1. 外圈呼吸柔光環
    ctx2d.beginPath();
    ctx2d.arc(x, y, 22, 0, Math.PI * 2);
    ctx2d.fillStyle = isTom ? 'rgba(56, 189, 248, 0.18)' : 'rgba(244, 114, 182, 0.18)';
    ctx2d.fill();
    ctx2d.lineWidth = 1.6;
    ctx2d.strokeStyle = glowColor;
    ctx2d.stroke();

    // 2. 圓形頭像徽章底座
    ctx2d.beginPath();
    ctx2d.arc(x, y, 15, 0, Math.PI * 2);
    ctx2d.fillStyle = darkBg;
    ctx2d.shadowColor = primaryColor;
    ctx2d.shadowBlur = 14;
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    ctx2d.lineWidth = 2.6;
    ctx2d.strokeStyle = primaryColor;
    ctx2d.stroke();

    // 3. 角色專屬 Icon
    ctx2d.font = '16px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(iconEmoji, x, y + 1);

    // 4. 專屬膠囊名牌 (顯示角色名稱與當前所在城市)
    const badgeText = `${iconEmoji} ${nameLabel} · ${cityText}`;
    ctx2d.font = '700 13.5px "Noto Sans TC", sans-serif';
    const pillW = ctx2d.measureText(badgeText).width + 20;
    const pillH = 25;

    let pillX = isTom ? x - pillW * 0.35 : x + pillW * 0.35;
    let pillY = isTom ? y - 33 : y + 33;

    if (pillY - pillH / 2 < mapBounds.top + 8) pillY = y + 33;
    if (pillY + pillH / 2 > mapBounds.bottom - 8) pillY = y - 33;
    pillX = Math.max(mapBounds.left + pillW / 2 + 8, Math.min(mapBounds.right - pillW / 2 - 8, pillX));

    ctx2d.fillStyle = darkBg;
    ctx2d.strokeStyle = primaryColor;
    ctx2d.lineWidth = 1.6;
    ctx2d.beginPath();
    ctx2d.roundRect(pillX - pillW / 2, pillY - pillH / 2, pillW, pillH, 999);
    ctx2d.fill();
    ctx2d.stroke();

    ctx2d.fillStyle = '#fcfaf4';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(badgeText, pillX, pillY + 0.5);

    ctx2d.restore();
  }

  function drawTimelineVideoFrame(progress) {
    if (!elTimelineVideoCanvas) return;
    const ctx2d = elTimelineVideoCanvas.getContext('2d');
    const w = elTimelineVideoCanvas.width;
    const h = elTimelineVideoCanvas.height;

    const totalSegs = Math.max(1, LOVE_FOOTPRINTS_DATA.length - 1);
    const exactStep = Math.max(0, Math.min(totalSegs, progress * totalSegs));
    const segIdx = Math.min(totalSegs - 1, Math.floor(exactStep));
    const rawSegFrac = exactStep - segIdx;
    // 套用每站停留 44% 再平滑飛行的節奏，讓畫面從容不匆忙
    const segFrac = getDwellGlideFrac(rawSegFrac);
    const activeIdx = segFrac < 0.5 ? segIdx : Math.min(LOVE_FOOTPRINTS_DATA.length - 1, segIdx + 1);

    // 計算當前無變形等比例動態攝影機 (專注於 Tom & Eunice 的位置與距離)
    const cam = getInterpolatedCamera(exactStep);

    const mapLeft = w * 0.045;
    const mapRight = w * 0.955;
    const mapTop = h * 0.105;
    const mapBottom = h * 0.74;
    const mapW = mapRight - mapLeft;
    const mapH = mapBottom - mapTop;
    const mapBounds = { left: mapLeft, right: mapRight, top: mapTop, bottom: mapBottom };

    // 1. 深邃森林海洋漸層背景
    const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0d1b15');
    bgGrad.addColorStop(0.55, '#13281e');
    bgGrad.addColorStop(1, '#0b1611');
    ctx2d.fillStyle = bgGrad;
    ctx2d.fillRect(0, 0, w, h);

    // 地圖視窗外框與裁切區
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.roundRect(mapLeft, mapTop, mapW, mapH, 16);
    ctx2d.fillStyle = 'rgba(11, 25, 19, 0.75)';
    ctx2d.fill();
    ctx2d.clip();

    // 2. 動態經緯度網格
    const gridStep = cam.spanLng <= 18 ? 2 : cam.spanLng <= 48 ? 5 : cam.spanLng <= 115 ? 15 : 30;
    ctx2d.strokeStyle = 'rgba(167, 206, 178, 0.08)';
    ctx2d.lineWidth = 1;

    const startLon = Math.floor((cam.centerLng - cam.spanLng) / gridStep) * gridStep;
    const endLon = Math.ceil((cam.centerLng + cam.spanLng) / gridStep) * gridStep;
    for (let lon = startLon; lon <= endLon; lon += gridStep) {
      const p = projectWithCamera(cam.centerLat, lon, cam, w, h);
      ctx2d.beginPath();
      ctx2d.moveTo(p.x, mapTop);
      ctx2d.lineTo(p.x, mapBottom);
      ctx2d.stroke();
    }

    const startLat = Math.max(-75, Math.floor((cam.centerLat - cam.spanLat) / gridStep) * gridStep);
    const endLat = Math.min(80, Math.ceil((cam.centerLat + cam.spanLat) / gridStep) * gridStep);
    for (let lat = startLat; lat <= endLat; lat += gridStep) {
      const p = projectWithCamera(lat, cam.centerLng, cam, w, h);
      ctx2d.beginPath();
      ctx2d.moveTo(mapLeft, p.y);
      ctx2d.lineTo(mapRight, p.y);
      ctx2d.stroke();
    }

    // 北回歸線 (23.5°N)
    const tropicP = projectWithCamera(23.5, cam.centerLng, cam, w, h);
    if (tropicP.y >= mapTop && tropicP.y <= mapBottom) {
      ctx2d.save();
      ctx2d.strokeStyle = 'rgba(255, 209, 102, 0.18)';
      ctx2d.setLineDash([6, 6]);
      ctx2d.beginPath();
      ctx2d.moveTo(mapLeft, tropicP.y);
      ctx2d.lineTo(mapRight, tropicP.y);
      ctx2d.stroke();
      ctx2d.restore();
    }

    // 3. 繪製世界地圖各大洲與台灣高精度島嶼輪廓 (WORLD_MAP_POLYGONS，支援跨國際換日線 ±360° 太平洋無縫拼接)
    const worldOffsets = [-360, 0, 360];
    worldOffsets.forEach((lngOffset) => {
      WORLD_MAP_POLYGONS.forEach((poly) => {
        if (!poly.coords || poly.coords.length < 3) return;
        ctx2d.beginPath();
        poly.coords.forEach(([lat, lng], idx) => {
          const pt = projectWithCamera(lat, lng + lngOffset, cam, w, h);
          if (idx === 0) ctx2d.moveTo(pt.x, pt.y);
          else ctx2d.lineTo(pt.x, pt.y);
        });
        ctx2d.closePath();

        if (poly.isHighlight) {
          ctx2d.fillStyle = 'rgba(116, 198, 157, 0.42)';
          ctx2d.strokeStyle = 'rgba(232, 223, 201, 0.92)';
          ctx2d.lineWidth = cam.spanLng <= 20 ? 2.6 : 1.8;
        } else {
          ctx2d.fillStyle = 'rgba(82, 138, 102, 0.28)';
          ctx2d.strokeStyle = 'rgba(164, 216, 180, 0.50)';
          ctx2d.lineWidth = cam.spanLng <= 40 ? 1.8 : 1.3;
        }
        ctx2d.fill();
        ctx2d.stroke();
      });
    });

    // 若鏡頭特寫台灣 (spanLng <= 20)，標註台灣主要地標暗紋供方位參考
    if (cam.spanLng <= 20) {
      const twRefCities = [
        { name: currentLang === 'zh' ? '台北' : 'Taipei', lat: 25.047, lng: 121.517 },
        { name: currentLang === 'zh' ? '新竹' : 'Hsinchu', lat: 24.787, lng: 120.997 },
        { name: currentLang === 'zh' ? '台中' : 'Taichung', lat: 24.147, lng: 120.673 },
        { name: currentLang === 'zh' ? '彰化' : 'Changhua', lat: 24.051, lng: 120.516 },
        { name: currentLang === 'zh' ? '日月潭' : 'Sun Moon Lake', lat: 23.863, lng: 120.916 },
        { name: currentLang === 'zh' ? '高雄' : 'Kaohsiung', lat: 22.627, lng: 120.301 },
        { name: currentLang === 'zh' ? '屏東' : 'Pingtung', lat: 22.551, lng: 120.548 },
      ];
      ctx2d.save();
      ctx2d.font = '500 12px "Noto Sans TC", sans-serif';
      twRefCities.forEach((rc) => {
        const rp = projectWithCamera(rc.lat, unwrapNear(rc.lng, cam.centerLng), cam, w, h);
        ctx2d.fillStyle = 'rgba(232, 223, 201, 0.45)';
        ctx2d.beginPath();
        ctx2d.arc(rp.x, rp.y, 2.5, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.fillStyle = 'rgba(232, 223, 201, 0.55)';
        ctx2d.textAlign = 'left';
        ctx2d.fillText(rc.name, rp.x + 6, rp.y + 4);
      });
      ctx2d.restore();
    }

    // 4. 繪製雙人專屬顏色軌跡線（支援經美西/杜拜轉機 via 節點，台灣↔美西必走太平洋航線）：Tom (星空藍 #38bdf8) vs Eunice (玫瑰粉 #f472b6)
    const sampleRolePathLatLng = (sA, sB, t, liftSign) => {
      const startNode = sB.from || sA;
      if (sB.via) {
        // 兩段式航線：先從起點飛往轉機點 (如台灣 ➔ 太平洋 ➔ 美西)，再從轉機點飛往目的地 (如美西 ➔ 美東)
        const endLng = sB.lng;
        const viaLng = unwrapNear(sB.via.lng, endLng);
        const startLng = unwrapNear(startNode.lng, viaLng);
        if (t <= 0.55) {
          const u = t / 0.55;
          const { midLat, midLng } = getGeoArcControl(startNode.lat, startLng, sB.via.lat, viaLng, liftSign);
          return {
            lat: (1 - u) * (1 - u) * startNode.lat + 2 * (1 - u) * u * midLat + u * u * sB.via.lat,
            lng: (1 - u) * (1 - u) * startLng + 2 * (1 - u) * u * midLng + u * u * viaLng,
          };
        }
        const u = (t - 0.55) / 0.45;
        const { midLat, midLng } = getGeoArcControl(sB.via.lat, viaLng, sB.lat, endLng, liftSign);
        return {
          lat: (1 - u) * (1 - u) * sB.via.lat + 2 * (1 - u) * u * midLat + u * u * sB.lat,
          lng: (1 - u) * (1 - u) * viaLng + 2 * (1 - u) * u * midLng + u * u * endLng,
        };
      }
      const endLng = sB.lng;
      const startLng = unwrapNear(startNode.lng, endLng);
      const { midLat, midLng } = getGeoArcControl(startNode.lat, startLng, sB.lat, endLng, liftSign);
      return {
        lat: (1 - t) * (1 - t) * startNode.lat + 2 * (1 - t) * t * midLat + t * t * sB.lat,
        lng: (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * midLng + t * t * endLng,
      };
    };

    const drawRoleTrajectory = (roleKey, strokeActive, strokeRecent, strokePast, shadowCol, liftSign) => {
      for (let i = 0; i < totalSegs; i++) {
        const sA = LOVE_FOOTPRINTS_DATA[i][roleKey];
        const sB = LOVE_FOOTPRINTS_DATA[i + 1][roleKey];
        if (!sA || !sB) continue;

        const startNode = sB.from || sA;
        const dLngShort = Math.abs(unwrapNear(startNode.lng, sB.lng) - sB.lng);
        const geoDist = Math.hypot(sB.lat - startNode.lat, dLngShort);
        if (geoDist < 0.015 && !sB.via && i !== segIdx) continue;

        const steps = 32;
        const midSample = sampleRolePathLatLng(sA, sB, 0.5, liftSign);
        const shiftLng = unwrapNear(midSample.lng, cam.centerLng) - midSample.lng;

        // 未來航段淡虛線預覽
        ctx2d.save();
        ctx2d.strokeStyle = roleKey === 'tom' ? 'rgba(56, 189, 248, 0.13)' : 'rgba(244, 114, 182, 0.13)';
        ctx2d.lineWidth = 1.3;
        ctx2d.setLineDash([4, 6]);
        ctx2d.beginPath();
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const g = sampleRolePathLatLng(sA, sB, t, liftSign);
          const pt = projectWithCamera(g.lat, g.lng + shiftLng, cam, w, h);
          if (s === 0) ctx2d.moveTo(pt.x, pt.y);
          else ctx2d.lineTo(pt.x, pt.y);
        }
        ctx2d.stroke();
        ctx2d.restore();

        // 已走過的軌跡實線
        if (i < segIdx || (i === segIdx && segFrac > 0.001)) {
          const isCurrentLeg = i === segIdx && exactStep < totalSegs;
          const isRecentLeg = segIdx - i <= 3 || progress >= 0.99;
          const tMax = i < segIdx ? 1 : segFrac;

          ctx2d.save();
          ctx2d.strokeStyle = isCurrentLeg ? strokeActive : isRecentLeg ? strokeRecent : strokePast;
          ctx2d.lineWidth = isCurrentLeg ? 3.8 : isRecentLeg ? 2.5 : 1.7;
          if (isCurrentLeg) {
            ctx2d.shadowColor = shadowCol;
            ctx2d.shadowBlur = 12;
          }
          ctx2d.beginPath();
          for (let s = 0; s <= steps; s++) {
            const t = (s / steps) * tMax;
            const g = sampleRolePathLatLng(sA, sB, t, liftSign);
            const pt = projectWithCamera(g.lat, g.lng + shiftLng, cam, w, h);
            if (s === 0) ctx2d.moveTo(pt.x, pt.y);
            else ctx2d.lineTo(pt.x, pt.y);
          }
          ctx2d.stroke();

          // 若有美西/杜拜轉機節點且已飛過轉機點，標示一個小轉機圓點
          if (sB.via && tMax >= 0.55) {
            const vPt = projectWithCamera(sB.via.lat, unwrapNear(sB.via.lng, cam.centerLng), cam, w, h);
            ctx2d.fillStyle = strokeActive;
            ctx2d.beginPath();
            ctx2d.arc(vPt.x, vPt.y, 3.5, 0, Math.PI * 2);
            ctx2d.fill();
          }
          ctx2d.restore();
        }
      }
    };

    // 先畫兩人的歷史足跡節點小圓點
    LOVE_FOOTPRINTS_DATA.forEach((item, idx) => {
      if (idx > segIdx + (segFrac > 0.85 ? 1 : 0)) return;
      const tPt = projectWithCamera(item.tom.lat, unwrapNear(item.tom.lng, cam.centerLng), cam, w, h);
      const ePt = projectWithCamera(item.eunice.lat, unwrapNear(item.eunice.lng, cam.centerLng), cam, w, h);

      ctx2d.save();
      ctx2d.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx2d.beginPath();
      ctx2d.arc(tPt.x, tPt.y, 4, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.fillStyle = 'rgba(244, 114, 182, 0.65)';
      ctx2d.beginPath();
      ctx2d.arc(ePt.x, ePt.y, 4, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();
    });

    // 繪製 Tom (星空藍) 與 Eunice (玫瑰粉) 的軌跡弧線
    drawRoleTrajectory(
      'tom',
      '#38bdf8',
      'rgba(56, 189, 248, 0.78)',
      'rgba(56, 189, 248, 0.34)',
      'rgba(56, 189, 248, 0.75)',
      1
    );
    drawRoleTrajectory(
      'eunice',
      '#f472b6',
      'rgba(244, 114, 182, 0.78)',
      'rgba(244, 114, 182, 0.34)',
      'rgba(244, 114, 182, 0.75)',
      -1
    );

    // 5. 計算 Tom 與 Eunice 的即時地理內插座標與兩人距離
    const stepA = LOVE_FOOTPRINTS_DATA[segIdx];
    const stepB = LOVE_FOOTPRINTS_DATA[Math.min(totalSegs, segIdx + 1)];

    const interpRolePos = (roleKey, liftSign) => {
      const rA = stepA[roleKey];
      const rB = stepB[roleKey];
      const t = segFrac;
      const startNode = rB.from || rA;
      const dLngShort = Math.abs(unwrapNear(startNode.lng, rB.lng) - rB.lng);
      const geoDist = Math.hypot(rB.lat - startNode.lat, dLngShort);
      let curLat;
      let curLng;
      if (t <= 0.001) {
        curLat = rA.lat;
        curLng = rA.lng;
      } else if (geoDist < 0.015 && !rB.via) {
        curLat = startNode.lat + (rB.lat - startNode.lat) * t;
        const sLng = unwrapNear(startNode.lng, rB.lng);
        curLng = sLng + (rB.lng - sLng) * t;
      } else {
        const g = sampleRolePathLatLng(rA, rB, t, liftSign);
        curLat = g.lat;
        curLng = g.lng;
      }
      const projLng = unwrapNear(curLng, cam.centerLng);
      const p = projectWithCamera(curLat, projLng, cam, w, h);
      const activeCity = (t < 0.5 ? rA : rB).city[currentLang];
      return { lat: curLat, lng: projLng, x: p.x, y: p.y, city: activeCity };
    };

    const tomCur = interpRolePos('tom', 1);
    const euniceCur = interpRolePos('eunice', -1);
    const liveDistanceKm = Math.round(calcDistanceKm(tomCur.lat, tomCur.lng, euniceCur.lat, euniceCur.lng));
    const isTogether = liveDistanceKm <= 15;

    // 6. 繪製兩人之間的「金色距離牽絆線 (Distance Tether Line)」與即時距離膠囊
    const screenDist = Math.hypot(tomCur.x - euniceCur.x, tomCur.y - euniceCur.y);
    let tomDrawX = tomCur.x;
    let tomDrawY = tomCur.y;
    let euniceDrawX = euniceCur.x;
    let euniceDrawY = euniceCur.y;

    if (screenDist < 34) {
      const midX = (tomCur.x + euniceCur.x) / 2;
      const midY = (tomCur.y + euniceCur.y) / 2;
      tomDrawX = midX - 19;
      tomDrawY = midY;
      euniceDrawX = midX + 19;
      euniceDrawY = midY;
    } else {
      ctx2d.save();
      ctx2d.strokeStyle = '#ffd166';
      ctx2d.lineWidth = 2.6;
      ctx2d.setLineDash([7, 6]);
      ctx2d.shadowColor = 'rgba(255, 209, 102, 0.75)';
      ctx2d.shadowBlur = 10;
      ctx2d.beginPath();
      ctx2d.moveTo(tomDrawX, tomDrawY);
      ctx2d.lineTo(euniceDrawX, euniceDrawY);
      ctx2d.stroke();
      ctx2d.restore();
    }

    // 7. 繪製 Tom (🤵‍♂️ 星空藍) 與 Eunice (👰‍♀️ 玫瑰粉) 的專屬角色頭像與城市標籤
    drawPersonMarker(ctx2d, 'tom', tomDrawX, tomDrawY, tomCur.city, mapBounds);
    drawPersonMarker(ctx2d, 'eunice', euniceDrawX, euniceDrawY, euniceCur.city, mapBounds);

    // 8. 在兩人連線中央（或相聚點上方）繪製即時距離膠囊標籤
    const tetherMidX = (tomDrawX + euniceDrawX) / 2;
    const tetherMidY = isTogether ? Math.max(mapTop + 26, tomDrawY - 62) : (tomDrawY + euniceDrawY) / 2;
    const distBadgeText = isTogether
      ? currentLang === 'zh'
        ? '💕 距離 0 km · 甜蜜同在'
        : '💕 0 km · Together!'
      : currentLang === 'zh'
        ? `📏 兩人相距 ${numberFormatter.format(liveDistanceKm)} km`
        : `📏 Distance: ${numberFormatter.format(liveDistanceKm)} km`;

    ctx2d.save();
    ctx2d.font = '700 14px "JetBrains Mono", "Noto Sans TC", sans-serif';
    const dBadgeW = ctx2d.measureText(distBadgeText).width + 24;
    const dBadgeH = 28;
    const clampedBadgeX = Math.max(mapLeft + dBadgeW / 2 + 10, Math.min(mapRight - dBadgeW / 2 - 10, tetherMidX));
    const clampedBadgeY = Math.max(mapTop + dBadgeH / 2 + 10, Math.min(mapBottom - dBadgeH / 2 - 10, tetherMidY));

    ctx2d.fillStyle = isTogether ? 'rgba(42, 22, 34, 0.94)' : 'rgba(28, 36, 22, 0.94)';
    ctx2d.strokeStyle = '#ffd166';
    ctx2d.lineWidth = 1.8;
    ctx2d.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx2d.shadowBlur = 8;
    ctx2d.beginPath();
    ctx2d.roundRect(clampedBadgeX - dBadgeW / 2, clampedBadgeY - dBadgeH / 2, dBadgeW, dBadgeH, 999);
    ctx2d.fill();
    ctx2d.shadowBlur = 0;
    ctx2d.stroke();

    ctx2d.fillStyle = '#ffd166';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(distBadgeText, clampedBadgeX, clampedBadgeY + 0.5);
    ctx2d.restore();

    // 結束地圖裁切區並畫上精緻邊框
    ctx2d.restore();
    ctx2d.save();
    ctx2d.strokeStyle = 'rgba(232, 223, 201, 0.24)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.roundRect(mapLeft, mapTop, mapW, mapH, 16);
    ctx2d.stroke();
    ctx2d.restore();

    // 9. 頂部標題列與雙人圖例 (Tom 藍線 🤵‍♂️ / Eunice 粉線 👰‍♀️ / 縮放視野指示)
    ctx2d.save();
    ctx2d.fillStyle = '#e8dfc9';
    ctx2d.font = '700 21px "Cormorant Garamond", "Noto Serif TC", serif';
    ctx2d.textAlign = 'left';
    ctx2d.fillText('TOM & EUNICE · LOVE FOOTPRINTS & DISTANCE TRACKER', 48, 42);

    const legendY = 36;
    ctx2d.font = '600 13.5px "Noto Sans TC", sans-serif';
    ctx2d.textAlign = 'right';

    const stepCountStr = `${activeIdx + 1} / ${LOVE_FOOTPRINTS_DATA.length}`;
    ctx2d.fillStyle = 'rgba(232, 223, 201, 0.75)';
    ctx2d.fillText(stepCountStr, w - 48, legendY + 5);

    const euniceLegendX = w - 125;
    ctx2d.fillStyle = '#f472b6';
    ctx2d.fillText('━━ 👰‍♀️ Eunice', euniceLegendX, legendY + 5);

    const tomLegendX = euniceLegendX - 135;
    ctx2d.fillStyle = '#38bdf8';
    ctx2d.fillText('━━ 🤵‍♂️ Tom', tomLegendX, legendY + 5);
    ctx2d.restore();

    // 10. 底部象牙柔米白故事字幕卡 (Cinematic Subtitle Bar — 同步顯示兩人所在地與故事)
    const currentItem = LOVE_FOOTPRINTS_DATA[activeIdx];
    const cardX = 48;
    const cardY = h - 168;
    const cardW = w - 96;
    const cardH = 134;

    ctx2d.save();
    ctx2d.fillStyle = 'rgba(252, 250, 244, 0.96)';
    ctx2d.beginPath();
    ctx2d.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx2d.fill();

    ctx2d.fillStyle = '#3d6b4c';
    ctx2d.font = '700 17px "JetBrains Mono", "Noto Sans TC", monospace';
    ctx2d.textAlign = 'left';
    const distText =
      currentItem.distanceLabel && typeof currentItem.distanceLabel === 'object'
        ? currentItem.distanceLabel[currentLang]
        : currentItem.distanceLabel;
    const headerLeftText = `${currentItem.dateTag || currentItem.year}  ·  ${distText}`;
    ctx2d.fillText(headerLeftText, cardX + 26, cardY + 34);

    ctx2d.font = '700 15.5px "Noto Sans TC", sans-serif';
    ctx2d.textAlign = 'right';
    const eCityStr = `👰‍♀️ Eunice: ${currentItem.eunice.city[currentLang]}`;
    const tCityStr = `🤵‍♂️ Tom: ${currentItem.tom.city[currentLang]}   `;
    const eCityW = ctx2d.measureText(eCityStr).width;
    ctx2d.fillStyle = '#be185d';
    ctx2d.fillText(eCityStr, cardX + cardW - 26, cardY + 34);
    ctx2d.fillStyle = '#0369a1';
    ctx2d.fillText(tCityStr, cardX + cardW - 26 - eCityW, cardY + 34);

    ctx2d.textAlign = 'left';
    ctx2d.fillStyle = '#1f3024';
    ctx2d.font = '700 23px "Noto Serif TC", serif';
    ctx2d.fillText(currentItem.place[currentLang], cardX + 26, cardY + 72, cardW - 52);

    ctx2d.fillStyle = '#4e6353';
    ctx2d.font = '500 17px "Noto Sans TC", sans-serif';
    ctx2d.fillText(currentItem.desc[currentLang], cardX + 26, cardY + 106, cardW - 52);
    ctx2d.restore();

    if (elTimelineScrubberFill) {
      elTimelineScrubberFill.style.width = `${Math.round(progress * 100)}%`;
    }
  }

  function stepTimelineAnimation(ts) {
    if (!timelinePlaying) return;
    if (!timelineLastTs) timelineLastTs = ts;
    const dt = ts - timelineLastTs;
    timelineLastTs = ts;

    timelineProgress += (dt * timelineSpeedMultiplier) / TIMELINE_DURATION_MS;
    if (timelineProgress >= 1) {
      timelineProgress = 1;
      timelinePlaying = false;
      if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
      drawTimelineVideoFrame(1);
      return;
    }

    drawTimelineVideoFrame(timelineProgress);
    timelineAnimId = requestAnimationFrame(stepTimelineAnimation);
  }

  function togglePlayTimeline() {
    const dict = t();
    if (timelinePlaying) {
      timelinePlaying = false;
      if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
      if (btnTimelinePlay) btnTimelinePlay.textContent = dict.timelinePlayBtn;
      return;
    }
    if (timelineProgress >= 0.99) {
      timelineProgress = 0;
    }
    timelinePlaying = true;
    timelineLastTs = 0;
    if (btnTimelinePlay) btnTimelinePlay.textContent = dict.timelinePauseBtn;
    timelineAnimId = requestAnimationFrame(stepTimelineAnimation);
  }

  function stepTimelineMilestone(delta) {
    const totalSegs = Math.max(1, LOVE_FOOTPRINTS_DATA.length - 1);
    const curIdx = Math.round(timelineProgress * totalSegs);
    const targetIdx = Math.max(0, Math.min(totalSegs, curIdx + delta));
    timelinePlaying = false;
    if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
    if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
    timelineProgress = targetIdx / totalSegs;
    drawTimelineVideoFrame(timelineProgress);
  }

  function cycleTimelineSpeed() {
    const speeds = [1.0, 0.5, 0.75, 1.5, 2.0];
    const idx = speeds.indexOf(timelineSpeedMultiplier);
    timelineSpeedMultiplier = speeds[(idx + 1) % speeds.length];
    if (btnTimelineSpeed) {
      btnTimelineSpeed.textContent = `⏱️ ${timelineSpeedMultiplier.toFixed(timelineSpeedMultiplier === 0.75 ? 2 : 1)}x`;
    }
  }

  function replayTimeline() {
    timelineProgress = 0;
    timelinePlaying = false;
    if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
    togglePlayTimeline();
  }

  function exportTimelineVideo() {
    if (!elTimelineVideoCanvas || timelineRecording) return;
    if (typeof elTimelineVideoCanvas.captureStream !== 'function' || typeof window.MediaRecorder === 'undefined') {
      replayTimeline();
      return;
    }

    const dict = t();
    timelineRecording = true;
    if (btnTimelineExport) {
      btnTimelineExport.disabled = true;
      btnTimelineExport.textContent = dict.timelineExportingBtn;
    }

    const resetExportState = () => {
      timelineRecording = false;
      if (btnTimelineExport) {
        btnTimelineExport.disabled = false;
        btnTimelineExport.textContent = t().timelineExportBtn;
      }
    };

    let recorder;
    let selectedMime = '';
    try {
      const stream = elTimelineVideoCanvas.captureStream(60);
      const mimeCandidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        selectedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      }
      const recOptions = selectedMime
        ? { mimeType: selectedMime, videoBitsPerSecond: 6000000 }
        : { videoBitsPerSecond: 6000000 };
      recorder = new MediaRecorder(stream, recOptions);
    } catch (_err) {
      resetExportState();
      replayTimeline();
      return;
    }

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = () => {
      resetExportState();
    };

    recorder.onstop = () => {
      const actualType = recorder.mimeType || selectedMime || 'video/webm';
      const ext = actualType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: actualType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tom-Eunice-Timeline-2014-2026.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resetExportState();
    };

    try {
      recorder.start();
    } catch (_err) {
      resetExportState();
      replayTimeline();
      return;
    }
    replayTimeline();

    const checkFinished = setInterval(() => {
      if (!timelinePlaying || timelineProgress >= 1) {
        clearInterval(checkFinished);
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, 600);
      }
    }, 200);
  }

  if (btnTimelinePlay) btnTimelinePlay.addEventListener('click', togglePlayTimeline);
  if (btnTimelinePrev) btnTimelinePrev.addEventListener('click', () => stepTimelineMilestone(-1));
  if (btnTimelineNext) btnTimelineNext.addEventListener('click', () => stepTimelineMilestone(1));
  if (btnTimelineSpeed) btnTimelineSpeed.addEventListener('click', cycleTimelineSpeed);
  if (btnTimelineReplay) btnTimelineReplay.addEventListener('click', replayTimeline);
  if (btnTimelineExport) btnTimelineExport.addEventListener('click', exportTimelineVideo);
  if (elTimelineVideoCanvas) {
    elTimelineVideoCanvas.style.cursor = 'pointer';
    elTimelineVideoCanvas.addEventListener('click', togglePlayTimeline);
  }
  const elScrubberWrap = elTimelineScrubberFill ? elTimelineScrubberFill.parentElement : null;
  if (elScrubberWrap) {
    elScrubberWrap.style.cursor = 'pointer';
    const seekFromPointer = (ev) => {
      const rect = elScrubberWrap.getBoundingClientRect();
      if (!rect.width) return;
      const clientX = ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      timelineProgress = ratio;
      drawTimelineVideoFrame(timelineProgress);
    };
    let isScrubbing = false;
    elScrubberWrap.addEventListener('pointerdown', (ev) => {
      isScrubbing = true;
      timelinePlaying = false;
      if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
      if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
      seekFromPointer(ev);
    });
    window.addEventListener('pointermove', (ev) => {
      if (!isScrubbing) return;
      seekFromPointer(ev);
    });
    window.addEventListener('pointerup', () => {
      isScrubbing = false;
    });
    window.addEventListener('pointercancel', () => {
      isScrubbing = false;
    });
  }

  // ============================================================================
  // 2. 「了解新人」暖身題 + 10 題問答邏輯（含隨機選項洗牌 ＆ 新郎/新娘熟悉度分析）
  // ============================================================================
  function shuffleQuestionOptions() {
    QUIZ_QUESTIONS.forEach((q) => {
      const count = q.options.zh.length;
      const order = Array.from({ length: count }, (_, i) => i);
      for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }

      const oldZh = q.options.zh.slice();
      const oldEn = q.options.en.slice();
      const oldIcons = Array.isArray(q.optionIcons) ? q.optionIcons.slice() : null;
      const oldExpZh = q.optionExplanations && Array.isArray(q.optionExplanations.zh)
        ? q.optionExplanations.zh.slice()
        : null;
      const oldExpEn = q.optionExplanations && Array.isArray(q.optionExplanations.en)
        ? q.optionExplanations.en.slice()
        : null;

      q.options.zh = order.map((origIdx) => oldZh[origIdx]);
      q.options.en = order.map((origIdx) => oldEn[origIdx]);
      if (oldIcons) {
        q.optionIcons = order.map((origIdx) => oldIcons[origIdx]);
      }
      if (oldExpZh && oldExpEn) {
        q.optionExplanations = {
          zh: order.map((origIdx) => oldExpZh[origIdx]),
          en: order.map((origIdx) => oldExpEn[origIdx]),
        };
      }

      if (Array.isArray(q.answerIndexes)) {
        const oldSet = new Set(q.answerIndexes);
        const newAns = [];
        order.forEach((origIdx, newIdx) => {
          if (oldSet.has(origIdx)) newAns.push(newIdx);
        });
        q.answerIndexes = newAns;
      } else if (typeof q.answerIndex === 'number') {
        q.answerIndex = order.indexOf(q.answerIndex);
      }
    });
  }

  function startQuiz() {
    shuffleQuestionOptions();
    quizStarted = true;
    quizIndex = 0;
    quizScore = 0;
    groomScore = 0;
    brideScore = 0;
    quizAnswered = false;
    lastSelectedOption = null;
    elQuizSummaryView.classList.add('hidden');
    elQuizQuestionView.classList.remove('hidden');
    renderCurrentQuizQuestion();
  }

  function createSvgNode(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  function createOptionIconElement(iconType) {
    const wrap = document.createElement('span');
    wrap.className = `quiz-option-icon icon-${iconType}`;
    wrap.setAttribute('aria-hidden', 'true');

    const svg = createSvgNode('svg', {
      viewBox: '0 0 24 24',
      width: '20',
      height: '20',
      fill: 'none',
    });

    if (iconType === 'dcard') {
      // Dcard 標誌性白底對話卡與 "D" 字樣
      svg.append(
        createSvgNode('path', {
          d: 'M6 4.5h6.2c3.8 0 6.3 2.5 6.3 6.2 0 3.7-2.5 6.3-6.3 6.3H9.5l-3.5 2.5V4.5z',
          fill: 'currentColor',
        }),
        createSvgNode('path', {
          d: 'M9.5 8v6h2.4c1.9 0 3.1-1.2 3.1-3s-1.2-3-3.1-3H9.5z',
          fill: '#006aa6',
        })
      );
    } else if (iconType === 'threads') {
      // Threads @ 螺旋曲線圖示
      svg.append(
        createSvgNode('path', {
          d: 'M15.8 11.4c-.2-2.2-1.6-3.4-3.7-3.4-1.5 0-2.7.7-3.2 1.8m6.9 1.6c.4 2.4-.9 4.2-3.2 4.2-1.8 0-3.1-1.1-3.1-2.6 0-1.5 1.3-2.5 3.3-2.5 1.4 0 2.6.4 3.8 1.2 1.1.7 1.9 1.9 1.9 3.4 0 3.1-2.7 5.2-6.4 5.2-4.5 0-7.6-3.1-7.6-7.8S7.6 4.5 12.2 4.5c3.9 0 6.7 2.2 7.3 5.7',
          stroke: 'currentColor',
          'stroke-width': '1.9',
          'stroke-linecap': 'round',
        })
      );
    } else if (iconType === 'ptt') {
      // PTT 經典 BBS 終端機圖示
      const text = createSvgNode('text', {
        x: '12',
        y: '14.8',
        'text-anchor': 'middle',
        fill: '#facc15',
        'font-size': '7.8',
        'font-family': 'monospace',
        'font-weight': '700',
      });
      text.textContent = 'PTT';
      svg.append(
        createSvgNode('rect', {
          x: '2.5',
          y: '4',
          width: '19',
          height: '16',
          rx: '3',
          stroke: '#4ade80',
          'stroke-width': '1.6',
        }),
        text
      );
    } else if (iconType === 'club') {
      // 社團活動：雙人與社團星芒圖示
      svg.append(
        createSvgNode('path', {
          d: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19',
          stroke: 'currentColor',
          'stroke-width': '1.9',
          'stroke-linecap': 'round',
        }),
        createSvgNode('circle', {
          cx: '10',
          cy: '8.5',
          r: '3',
          stroke: 'currentColor',
          'stroke-width': '1.9',
        }),
        createSvgNode('path', {
          d: 'M18 5l.9 1.9L21 7.8l-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.9L18 5z',
          fill: 'currentColor',
        })
      );
    } else if (iconType === 'food-cilantro') {
      // 香菜：翠綠鋸齒三葉與嫩莖
      svg.append(
        createSvgNode('path', {
          d: 'M12 21v-8M12 15l-4-3M12 14l4-2.5',
          stroke: '#bbf7d0',
          'stroke-width': '1.8',
          'stroke-linecap': 'round',
        }),
        createSvgNode('path', {
          d: 'M12 4.5c-2.2 0-3.5 1.6-3 3.6.3 1.2 1.6 2.2 3 2.2s2.7-1 3-2.2c.5-2-.8-3.6-3-3.6z',
          fill: '#4ade80',
        }),
        createSvgNode('path', {
          d: 'M6.8 8.5c-1.9.5-2.6 2.3-1.6 3.9.7 1.1 2.1 1.5 3.3 1.1 1.2-.4 1.8-1.7 1.5-2.9-.4-1.6-1.7-2.5-3.2-2.1z',
          fill: '#86efac',
        }),
        createSvgNode('path', {
          d: 'M17.2 8.5c1.9.5 2.6 2.3 1.6 3.9-.7 1.1-2.1 1.5-3.3 1.1-1.2-.4-1.8-1.7-1.5-2.9.4-1.6 1.7-2.5 3.2-2.1z',
          fill: '#86efac',
        })
      );
    } else if (iconType === 'food-bittermelon') {
      // 苦瓜：翠綠顆粒條紋苦瓜
      svg.append(
        createSvgNode('path', {
          d: 'M16.5 4.5c1.5 0 2.5 1.2 2 3.2-.8 3.6-3.2 7.2-6.8 9.8-2.6 1.8-5.2 2-6.4.6-1.2-1.4-.6-4 1.4-6.4 2.8-3.4 6.4-5.8 9.8-7.2z',
          fill: '#bef264',
        }),
        createSvgNode('path', {
          d: 'M9 11.5c1.5-1.5 3.5-2.8 5.5-3.5M8 15c2-1.2 4.2-2.8 5.8-4.5',
          stroke: '#3f6212',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
          'stroke-dasharray': '1.5 2.2',
        }),
        createSvgNode('path', {
          d: 'M17.5 4.5c.8-1.2 2-1.5 2.8-1',
          stroke: '#ecfccb',
          'stroke-width': '1.6',
          'stroke-linecap': 'round',
        })
      );
    } else if (iconType === 'food-eggplant') {
      // 茄子：飽滿紫茄與綠色蒂頭
      svg.append(
        createSvgNode('path', {
          d: 'M15.5 6.5c2 1.2 2.6 4.2 1.2 7.4-1.6 3.5-5.2 6.1-8.5 5.5-2.6-.5-3.5-3.2-2-5.6 1.2-2 3.4-3.2 5-5.2 1.2-1.5 2.5-3.1 4.3-2.1z',
          fill: '#e9d5ff',
        }),
        createSvgNode('path', {
          d: 'M13.5 5.2l2.2-.8 1.5 1.8-.8 2.2-1.8-.9-1.8.6.7-2.9z',
          fill: '#4ade80',
        }),
        createSvgNode('path', {
          d: 'M16.5 3.5c.6.8.8 1.6.4 2.4',
          stroke: '#4ade80',
          'stroke-width': '1.7',
          'stroke-linecap': 'round',
        })
      );
    } else if (iconType === 'food-pepper') {
      // 青椒：飽滿三瓣燈籠椒
      svg.append(
        createSvgNode('path', {
          d: 'M12 4c.4-1.2 1.5-1.8 2.5-1.5',
          stroke: '#bbf7d0',
          'stroke-width': '1.8',
          'stroke-linecap': 'round',
        }),
        createSvgNode('path', {
          d: 'M8.5 6.5C6 6.5 4.8 8.8 5.2 12c.4 3.4 1.8 6.8 4 6.8 1 0 1.8-.5 2.8-.5s1.8.5 2.8.5c2.2 0 3.6-3.4 4-6.8.4-3.2-.8-5.5-3.3-5.5-1.1 0-2 .5-3.5.5s-2.4-.5-3.5-.5z',
          fill: '#86efac',
        }),
        createSvgNode('path', {
          d: 'M10 8v9M14 8v9',
          stroke: '#15803d',
          'stroke-width': '1.4',
          'stroke-linecap': 'round',
        })
      );
    } else if (iconType === 'flag-ch') {
      // 瑞士國旗：紅底白十字
      svg.append(
        createSvgNode('rect', { x: '3', y: '3', width: '18', height: '18', rx: '4', fill: '#d52b1e' }),
        createSvgNode('rect', { x: '10.2', y: '6.5', width: '3.6', height: '11', rx: '0.8', fill: '#ffffff' }),
        createSvgNode('rect', { x: '6.5', y: '10.2', width: '11', height: '3.6', rx: '0.8', fill: '#ffffff' })
      );
    } else if (iconType === 'flag-at') {
      // 奧地利國旗：紅白紅橫條
      svg.append(
        createSvgNode('rect', { x: '2.5', y: '4.5', width: '19', height: '5', fill: '#ed2939' }),
        createSvgNode('rect', { x: '2.5', y: '9.5', width: '19', height: '5', fill: '#ffffff' }),
        createSvgNode('rect', { x: '2.5', y: '14.5', width: '19', height: '5', fill: '#ed2939' }),
        createSvgNode('rect', {
          x: '2.5',
          y: '4.5',
          width: '19',
          height: '15',
          rx: '2.5',
          stroke: 'rgba(255,255,255,0.35)',
          'stroke-width': '1',
        })
      );
    } else if (iconType === 'flag-is') {
      // 冰島國旗：藍底白邊紅十字
      svg.append(
        createSvgNode('rect', { x: '2.5', y: '4.5', width: '19', height: '15', rx: '2.5', fill: '#02529c' }),
        createSvgNode('rect', { x: '7.5', y: '4.5', width: '4.2', height: '15', fill: '#ffffff' }),
        createSvgNode('rect', { x: '2.5', y: '9.9', width: '19', height: '4.2', fill: '#ffffff' }),
        createSvgNode('rect', { x: '8.5', y: '4.5', width: '2.2', height: '15', fill: '#dc1e35' }),
        createSvgNode('rect', { x: '2.5', y: '10.9', width: '19', height: '2.2', fill: '#dc1e35' })
      );
    } else if (iconType === 'flag-it') {
      // 義大利國旗：綠白紅直條
      svg.append(
        createSvgNode('rect', { x: '2.5', y: '4.5', width: '6.34', height: '15', fill: '#009246' }),
        createSvgNode('rect', { x: '8.83', y: '4.5', width: '6.34', height: '15', fill: '#ffffff' }),
        createSvgNode('rect', { x: '15.16', y: '4.5', width: '6.34', height: '15', fill: '#ce2b37' }),
        createSvgNode('rect', {
          x: '2.5',
          y: '4.5',
          width: '19',
          height: '15',
          rx: '2.5',
          stroke: 'rgba(255,255,255,0.35)',
          'stroke-width': '1',
        })
      );
    } else {
      // 其他題目的趣味主題圖示（動物吉祥物、歷史人物、航線、工程梗、筆畫）
      const emojiMap = {
        'stroke-72': '🖌️',
        'stroke-77': '🖋️',
        'stroke-68': '📜',
        'stroke-82': '✒️',
        'animal-pikachu': '⚡',
        'animal-capybara': '🍊',
        'animal-giraffe': '🦒',
        'animal-zebra': '🦓',
        'corp-guge': '🏢',
        'corp-kegao-infra': '🏗️',
        'corp-guge-infra': '🌐',
        'corp-kegao': '💼',
        'cow-mecha': '🦖',
        'cow-cannon': '🚀',
        'cow-xiaoli': '🐮',
        'cow-ben': '🐂',
        'cpp-overflow': '💥',
        'cpp-compile': '⚙️',
        'cpp-delete': '🧹',
        'cpp-dangling': '🪝',
        'dist-berlin': '🇩🇪',
        'dist-taipei': '🚄',
        'dist-ny': '🗽',
        'dist-tokyo': '🗼',
        'fig-xuzhimo': '☁️',
        'fig-holmes': '🔍',
        'fig-robinhood': '🏹',
        'fig-joan': '⚔️',
        'bmc-mood': '💝',
        'bmc-magic': '🪄',
        'bmc-cash': '🧧',
        'bmc-chip': '🖥️',
      };
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'quiz-option-emoji';
      emojiSpan.textContent = emojiMap[iconType] || '✨';
      wrap.append(emojiSpan);
      return wrap;
    }

    wrap.append(svg);
    return wrap;
  }

  function renderCurrentQuizQuestion() {
    if (quizIndex >= QUIZ_QUESTIONS.length) {
      showQuizSummary(true);
      return;
    }

    quizAnswered = false;
    lastSelectedOption = null;
    elQuizExplanationBox.classList.add('hidden');
    refreshQuizLanguage();
  }

  function isOptionCorrect(q, idx) {
    if (Array.isArray(q.answerIndexes)) {
      return q.answerIndexes.includes(idx);
    }
    return idx === q.answerIndex;
  }

  function renderHighlightedCppCode(codeStr) {
    const keywords = new Set(['class', 'public', 'private', 'protected', 'const', 'new', 'delete', 'return']);
    const types = new Set(['char', 'int', 'void', 'bool', 'size_t']);
    const classes = new Set(['Wedding']);
    const funcs = new Set(['strlen', 'strcpy', 'getTableCount']);
    const tokenRegex = /([A-Za-z_]\w*|\d+|[~*&(){}[\];,=:]|\s+)/g;

    const lines = codeStr.split('\n');
    return lines.map((lineText, idx) => {
      const lineSpan = document.createElement('span');
      lineSpan.className = 'code-line';

      const numSpan = document.createElement('span');
      numSpan.className = 'code-line-num';
      numSpan.textContent = String(idx + 1).padStart(2, ' ');
      lineSpan.append(numSpan);

      const tokens = lineText.match(tokenRegex) || [];
      tokens.forEach((tok) => {
        if (/^\s+$/.test(tok)) {
          lineSpan.append(document.createTextNode(tok));
          return;
        }
        const span = document.createElement('span');
        if (keywords.has(tok)) {
          span.className = 'tok-kw';
        } else if (types.has(tok)) {
          span.className = 'tok-type';
        } else if (classes.has(tok)) {
          span.className = 'tok-class';
        } else if (funcs.has(tok)) {
          span.className = 'tok-fn';
        } else if (/^\d+$/.test(tok)) {
          span.className = 'tok-num';
        } else if (/^[~*&(){}[\];,:]$/.test(tok)) {
          span.className = 'tok-op';
        } else {
          span.className = 'tok-var';
        }
        span.textContent = tok;
        lineSpan.append(span);
      });

      return lineSpan;
    });
  }

  function refreshQuizLanguage() {
    if (quizIndex >= QUIZ_QUESTIONS.length) return;
    const q = QUIZ_QUESTIONS[quizIndex];
    const dict = t();
    const total = QUIZ_QUESTIONS.length;

    elQuizProgressText.textContent = q.badge[currentLang];
    elQuizScoreBadge.textContent = dict.scoreBadge(quizScore, total);
    elQuizProgressFill.style.width = `${Math.round(((quizIndex + 1) / total) * 100)}%`;
    elQuizQuestionTitle.textContent = q.question[currentLang];

    if (elQuizCodeBlock && elQuizCodeContent) {
      if (q.code) {
        elQuizCodeContent.replaceChildren(...renderHighlightedCppCode(q.code));
        elQuizCodeBlock.classList.remove('hidden');
      } else {
        elQuizCodeContent.replaceChildren();
        elQuizCodeBlock.classList.add('hidden');
      }
    }

    const labels = ['A', 'B', 'C', 'D'];
    const opts = q.options[currentLang];

    const optionButtons = opts.map((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option-btn';

      if (quizAnswered) {
        btn.disabled = true;
        if (isOptionCorrect(q, idx)) {
          btn.classList.add('is-correct');
        } else if (idx === lastSelectedOption) {
          btn.classList.add('is-wrong');
        }
      }

      const prefix = document.createElement('span');
      prefix.className = 'quiz-option-prefix';
      prefix.textContent = labels[idx] || String(idx + 1);

      const textSpan = document.createElement('span');
      textSpan.textContent = optText;

      if (Array.isArray(q.optionIcons) && q.optionIcons[idx]) {
        const iconEl = createOptionIconElement(q.optionIcons[idx]);
        btn.append(prefix, iconEl, textSpan);
      } else {
        btn.append(prefix, textSpan);
      }
      btn.addEventListener('click', () => handleSelectOption(idx));
      return btn;
    });

    elQuizOptionsList.replaceChildren(...optionButtons);

    if (quizAnswered) {
      const isCorrect = isOptionCorrect(q, lastSelectedOption);
      if (q.isMultiCorrectCpp) {
        const sep = currentLang === 'en' ? ', ' : '、';
        const correctLabels = q.answerIndexes.map((idx) => `(${labels[idx]})`).join(sep);
        const wrongIdx = [0, 1, 2, 3].find((idx) => !q.answerIndexes.includes(idx));
        const wrongLabel = labels[wrongIdx] || 'D';
        if (currentLang === 'en') {
          elQuizResultHeadline.textContent = isCorrect
            ? `Spot on · ${correctLabels} are all real C++ bugs in this code (any choice except (${wrongLabel}) scores)!`
            : `It’s a trap · ${correctLabels} are all real bugs — only (${wrongLabel}) is false!`;
        } else {
          elQuizResultHeadline.textContent = isCorrect
            ? `答對了 · ${correctLabels} 三個都是這段 C++ 程式真正存在的 Bug（只要不選 (${wrongLabel}) 都得分）！`
            : `踩到陷阱啦 · ${correctLabels} 三個問題都真的存在，只有 (${wrongLabel}) 是錯的喔！`;
        }
      } else {
        const correctLabel = labels[q.answerIndex] || '';
        const correctText = opts[q.answerIndex] || '';
        elQuizResultHeadline.textContent = isCorrect
          ? dict.correctHeadline(correctLabel, correctText)
          : dict.wrongHeadline(correctLabel, correctText);
      }
      elQuizExplanationText.textContent =
        (q.optionExplanations &&
          q.optionExplanations[currentLang] &&
          lastSelectedOption !== null &&
          q.optionExplanations[currentLang][lastSelectedOption]) ||
        '';
      btnQuizNext.textContent = quizIndex + 1 < total ? dict.nextBtn : dict.finishBtn;
      elQuizExplanationBox.classList.remove('hidden');
    }
  }

  function handleSelectOption(selectedIndex) {
    if (quizAnswered) return;
    quizAnswered = true;
    lastSelectedOption = selectedIndex;

    const q = QUIZ_QUESTIONS[quizIndex];
    if (isOptionCorrect(q, selectedIndex)) {
      quizScore += 1;
      if (q.category === 'groom') groomScore += 1;
      if (q.category === 'bride') brideScore += 1;
    }

    refreshQuizLanguage();
  }

  function decodeSealBytes(vectors, prefix = '') {
    const seedStr = `${prefix}${QUIZ_QUESTIONS.map((q) => q.category).join(':')}|${REAL_TARGET_ISO}`;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return vectors
      .map((b) => {
        h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
        const mask = (h >>> 16) & 0xff;
        return String.fromCharCode(b ^ mask);
      })
      .join('');
  }

  function formatSummarySeal() {
    const relPath = decodeSealBytes(SUMMARY_SEAL_VECTORS, '');
    const fullUrl = new URL(relPath, 'https://chihweitung.github.io/wedding-vc/').toString();
    return window.btoa(fullUrl);
  }

  function getFamiliarityEvaluation() {
    if (currentLang === 'en') {
      if (groomScore > brideScore) {
        return {
          badge: `🤵 Team Groom · You Know Tom Best! (Groom ${groomScore}/3 · Bride ${brideScore}/3)`,
          comment: `You clearly know the groom Tom inside and out—from C++ bugs and BMC servers to Google Taiwan’s legal entity name! Make sure to chat more with the lovely bride Eunice today too!`,
        };
      }
      if (brideScore > groomScore) {
        return {
          badge: `👰 Team Bride · You Know Eunice Best! (Bride ${brideScore}/3 · Groom ${groomScore}/3)`,
          comment: `Certified bestie of the bride Eunice! From her high school Zebra mascot and TNUA campus cows to Robin Hood’s Nottingham, you know all her stories by heart!`,
        };
      }
      if (quizScore >= 8) {
        return {
          badge: `💑 Soulmate Bestie · Equally Familiar with Both Tom & Eunice!`,
          comment: `Incredible! You know both the groom Tom (${groomScore}/3) and the bride Eunice (${brideScore}/3) equally well—from engineering memes to art school & study-abroad memories. True inner-circle VIP!`,
        };
      }
      return {
        badge: `🥂 Balanced Friend · Equally Familiar with Both Groom & Bride!`,
        comment: `Your familiarity with Tom (${groomScore}/3) and Eunice (${brideScore}/3) is perfectly balanced! Thank you for celebrating with us today—now you’ve unlocked all our favorite stories!`,
      };
    }

    // 繁體中文評語
    if (groomScore > brideScore) {
      return {
        badge: `🤵 鑑定結果：您對「新郎 Tom」比較熟悉喔！（新郎題 ${groomScore}/3 · 新娘題 ${brideScore}/3）`,
        comment: `看來您是新郎 Tom 的鐵桿好麻吉！連台灣科高基礎建設有限公司、BMC Team 跟 C++ Bug 都難不倒您！今天婚宴現場也請多多認識美麗的新娘 Eunice 喔！`,
      };
    }
    if (brideScore > groomScore) {
      return {
        badge: `👰 鑑定結果：您對「新娘 Eunice」比較熟悉喔！（新娘題 ${brideScore}/3 · 新郎題 ${groomScore}/3）`,
        comment: `認證是新娘 Eunice 的貼心摯友！無論是高中吉祥物斑馬、北藝大校牛還是英國諾丁漢的羅賓漢都瞭若指掌！今天也別忘了跟新郎 Tom 多乾幾杯喔！`,
      };
    }
    if (quizScore >= 8) {
      return {
        badge: `💑 鑑定結果：您對「新郎 Tom ＆ 新娘 Eunice」都超熟悉！（新郎題 ${groomScore}/3 · 新娘題 ${brideScore}/3）`,
        comment: `太神啦！您對新郎與新娘兩人都瞭若指掌、完全不偏心！無論是硬核工程師梗、北藝大與英國留學回憶，還是兩人的共同小秘密全都難不倒您，絕對是我們的核心靈魂摯友！`,
      };
    }
    return {
      badge: `🥂 鑑定結果：您對「新郎 Tom ＆ 新娘 Eunice」一樣熟悉！（新郎題 ${groomScore}/3 · 新娘題 ${brideScore}/3）`,
      comment: `您對新郎與新娘的熟悉度完美平衡、毫不偏心！非常感謝您今天來參加我們的婚宴，透過這 10 道題目，相信您又更認識 Tom & Eunice 的故事囉！`,
    };
  }

  let forcedSealWatermarkActive = false;

  function showQuizSummary(triggerConfetti) {
    elQuizQuestionView.classList.add('hidden');
    elQuizSummaryView.classList.remove('hidden');

    const total = QUIZ_QUESTIONS.length;
    elQuizFinalScore.textContent = `${quizScore} / ${total}`;

    const evalResult = getFamiliarityEvaluation();
    if (elQuizFamiliarityBadge) {
      elQuizFamiliarityBadge.textContent = evalResult.badge;
    }
    elQuizSummaryRank.textContent = evalResult.comment;

    if (window.__DBG_FORCE_WATERMARK) {
      forcedSealWatermarkActive = true;
      window.__DBG_FORCE_WATERMARK = false;
    } else if (triggerConfetti && quizScore < 6) {
      forcedSealWatermarkActive = false;
    }
    const showSealWatermark = quizScore >= 6 || forcedSealWatermarkActive;
    const autoRevealSealHint = quizScore >= 10;
    const sealWrap = elSummarySealCode ? elSummarySealCode.closest('.easter-watermark-wrap') : null;
    if (sealWrap) sealWrap.classList.remove('hidden');
    if (showSealWatermark) {
      if (elSummarySealHint) {
        elSummarySealHint.classList.toggle('is-auto-revealed', autoRevealSealHint);
        elSummarySealHint.classList.toggle('is-selected', autoRevealSealHint);
        elSummarySealHint.textContent = decodeSealBytes(SUMMARY_HINT_VECTORS, 'HINT|');
      }
      if (elSummarySealCode) {
        elSummarySealCode.textContent = formatSummarySeal();
      }
    } else {
      if (elSummarySealHint) {
        elSummarySealHint.classList.remove('is-auto-revealed', 'is-selected');
        elSummarySealHint.textContent =
          currentLang === 'en'
            ? 'MUGGLE-REPELLING CHARM ACTIVE'
            : '麻瓜驅逐咒生效中 · MUGGLE-REPELLING CHARM';
      }
      if (elSummarySealCode) {
        elSummarySealCode.textContent =
          currentLang === 'en'
            ? '🪄 Muggles cannot view the secret Easter Egg · Score 6+ to lift the charm!'
            : '🪄 麻瓜不能看彩蛋喔！（需答對 6 題以上才能解除麻瓜驅逐咒）';
      }
    }

    if (triggerConfetti) {
      launchConfetti();
    }
  }

  btnQuizNext.addEventListener('click', () => {
    quizIndex += 1;
    renderCurrentQuizQuestion();
  });

  btnQuizRestart.addEventListener('click', startQuiz);
  btnQuizToVideo.addEventListener('click', () => showHubView('video'));

  // 支援手機版 (iOS Safari / Android) 與電腦版反白選取顯影：
  // iOS WebKit 對透明字體的 ::selection 不會重繪文字顏色，因此同步監聽 selectionchange 與觸控選取
  function syncWatermarkHintSelection() {
    if (!elSummarySealHint || !elSummarySealHint.textContent) return;
    if (elSummarySealHint.classList.contains('is-auto-revealed')) {
      elSummarySealHint.classList.add('is-selected');
      return;
    }
    const sel = typeof window.getSelection === 'function' ? window.getSelection() : null;
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      elSummarySealHint.classList.remove('is-selected');
      return;
    }
    const wrap = elSummarySealHint.closest('.easter-watermark-wrap') || elSummarySealHint;
    let hitsHint = false;
    try {
      hitsHint =
        sel.containsNode(elSummarySealHint, true) ||
        sel.containsNode(wrap, true);
    } catch (_e) {
      hitsHint = false;
    }
    elSummarySealHint.classList.toggle('is-selected', hitsHint);
  }

  document.addEventListener('selectionchange', syncWatermarkHintSelection);

  if (elSummarySealHint) {
    elSummarySealHint.addEventListener('click', () => {
      if (!elSummarySealHint.textContent) return;
      if (elSummarySealHint.classList.contains('is-auto-revealed')) return;
      elSummarySealHint.classList.toggle('is-selected');
    });
  }

  // Hub Navigation Listeners
  btnChooseVideoCard.addEventListener('click', () => showHubView('video'));
  btnChooseQuizCard.addEventListener('click', () => {
    startQuiz();
    showHubView('quiz');
  });
  if (btnChooseSharePhotosCard) {
    btnChooseSharePhotosCard.addEventListener('click', () => showHubView('share'));
  }
  if (btnChooseGalleryCard) {
    btnChooseGalleryCard.addEventListener('click', () => showHubView('gallery'));
  }
  if (btnChooseFootprintsCard) {
    btnChooseFootprintsCard.addEventListener('click', () => showHubView('footprints'));
  }
  if (btnChooseSeatingCard) {
    btnChooseSeatingCard.addEventListener('click', () => showHubView('seating'));
  }
  if (btnChooseMenuCard) {
    btnChooseMenuCard.addEventListener('click', () => showHubView('banquet-menu'));
  }
  if (btnCountdownSeating) {
    btnCountdownSeating.addEventListener('click', () => showHubView('seating'));
  }
  if (btnCountdownMenu) {
    btnCountdownMenu.addEventListener('click', () => showHubView('banquet-menu'));
  }
  btnTabBackHub.addEventListener('click', () => showHubView(isTimeUp ? 'menu' : 'countdown'));
  btnTabVideo.addEventListener('click', () => showHubView('video'));
  btnTabQuiz.addEventListener('click', () => showHubView('quiz'));
  if (btnTabSharePhotos) {
    btnTabSharePhotos.addEventListener('click', () => showHubView('share'));
  }
  if (btnTabGallery) {
    btnTabGallery.addEventListener('click', () => showHubView('gallery'));
  }
  if (btnTabFootprints) {
    btnTabFootprints.addEventListener('click', () => showHubView('footprints'));
  }
  if (btnTabSeating) {
    btnTabSeating.addEventListener('click', () => showHubView('seating'));
  }
  if (btnTabMenu) {
    btnTabMenu.addEventListener('click', () => showHubView('banquet-menu'));
  }
  if (elSeatingSearchInput) {
    elSeatingSearchInput.addEventListener('input', () => renderSeatingSection());
  }

  // ============================================================================
  // 3. 偏好設定與倒數計時核心邏輯
  // ============================================================================
  function initPreferences() {
    const savedTheme = safeGetStorage(STORAGE_KEY_THEME);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    if (btnFullscreen && !document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
      btnFullscreen.classList.add('hidden');
    }

    updateMsVisibility();
    applyLanguage();
  }

  function updateMsVisibility() {
    if (!btnToggleMs || !elMs) return;
    btnToggleMs.setAttribute('aria-pressed', String(showMs));
    if (showMs) {
      elMs.classList.remove('hidden');
    } else {
      elMs.classList.add('hidden');
    }
  }

  function enterTimeUpState() {
    if (isTimeUp) return;
    const activelyViewingPreUnlockedPanel =
      (elSeatingSection && !elSeatingSection.classList.contains('hidden')) ||
      (elBanquetMenuSection && !elBanquetMenuSection.classList.contains('hidden'));
    isTimeUp = true;
    document.body.classList.add('is-time-up');
    if (elCountdownStageWrap) elCountdownStageWrap.classList.remove('hidden');
    elTimeupHub.classList.remove('hidden');
    elStateLabel.textContent = t().eyebrowTimeUp;
    syncHubNavPermissions();
    if (!activelyViewingPreUnlockedPanel) {
      showHubView('menu');
    }
    launchConfetti();
  }

  function exitTimeUpState() {
    if (!isTimeUp) return;
    isTimeUp = false;
    document.body.classList.remove('is-time-up');
    elStateLabel.textContent = t().eyebrowCountdown;
    showHubView('countdown');
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = REAL_TARGET_TIMESTAMP - now;

    elCurrentTwTime.textContent = twFormatter.format(new Date(now));
    renderLoveStoryNote(false);

    if (diff <= 0) {
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';
      if (elMs) elMs.textContent = '.00';

      enterTimeUpState();
      return;
    }

    if (isTimeUp) {
      exitTimeUpState();
    }

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((diff % 1000) / 10);

    elDays.textContent = pad2(days);
    elHours.textContent = pad2(hours);
    elMinutes.textContent = pad2(minutes);
    elSeconds.textContent = pad2(seconds);
    if (showMs && elMs) {
      elMs.textContent = `.${pad2(centiseconds)}`;
    }
  }

  function tick() {
    updateCountdown();
    requestAnimationFrame(tick);
  }

  // Gentle 33⅓ RPM Vinyl Felt-Piano & Music-Box Waltz — Johann Strauss II "The Blue Danube" (Op. 314)
  let bgmAudioCtx = null;
  let bgmMasterGain = null;
  let bgmNoteTarget = null;
  let bgmLoopTimer = null;
  let bgmWatchdogTimer = null;
  let bgmWakeRetryTimers = [];
  let bgmBarIndex = 0;
  let bgmWasStandby = false;
  let bgmNeedsRebuild = false;
  let bgmLastCtxTime = -1;
  let bgmFrozenTicks = 0;

  // 32-bar intimate 3/4 Viennese Waltz in D Major (honoring Tom & Eunice's Vienna honeymoon)
  // Each bar: { bass, chord: [n1, n2], notes: [[beat, midi, durBeats, gain, isChime?], ...] }
  const BLUE_DANUBE_BARS = [
    // Waltz 1A — Phrase 1 (D major rising arpeggio + crystalline answer)
    { bass: 50, chord: [57, 66], notes: [[0, 62, 1.1, 0.052], [1, 66, 1.1, 0.054], [2, 69, 2.2, 0.058]] },
    { bass: 50, chord: [57, 66], notes: [[1, 81, 0.85, 0.036, true], [2, 81, 0.95, 0.034, true]] },
    { bass: 54, chord: [57, 62], notes: [[1, 78, 0.85, 0.036, true], [2, 78, 0.95, 0.034, true]] },
    { bass: 50, chord: [57, 66], notes: [[0, 62, 2.1, 0.05], [2, 62, 0.95, 0.046]] },

    // Phrase 2 (D -> A7)
    { bass: 50, chord: [57, 66], notes: [[0, 62, 1.1, 0.052], [1, 66, 1.1, 0.054], [2, 69, 2.2, 0.058]] },
    { bass: 52, chord: [57, 61], notes: [[1, 81, 0.85, 0.036, true], [2, 81, 0.95, 0.034, true]] },
    { bass: 45, chord: [55, 61], notes: [[1, 79, 0.85, 0.036, true], [2, 79, 0.95, 0.034, true]] },
    { bass: 52, chord: [55, 61], notes: [[0, 61, 2.1, 0.048], [2, 61, 0.95, 0.045]] },

    // Phrase 3 (A7 soaring to B)
    { bass: 45, chord: [55, 61], notes: [[0, 61, 1.1, 0.05], [1, 64, 1.1, 0.053], [2, 71, 2.2, 0.058]] },
    { bass: 52, chord: [55, 61], notes: [[1, 83, 0.85, 0.036, true], [2, 83, 0.95, 0.034, true]] },
    { bass: 45, chord: [55, 61], notes: [[1, 79, 0.85, 0.036, true], [2, 79, 0.95, 0.034, true]] },
    { bass: 52, chord: [55, 61], notes: [[0, 64, 2.1, 0.048], [2, 61, 0.95, 0.045]] },

    // Phrase 4 (A7 resolving warmly to D)
    { bass: 45, chord: [55, 61], notes: [[0, 61, 1.1, 0.05], [1, 64, 1.1, 0.053], [2, 71, 1.15, 0.056]] },
    { bass: 50, chord: [57, 66], notes: [[0, 69, 2.3, 0.058], [1, 81, 0.85, 0.035, true], [2, 81, 0.95, 0.033, true]] },
    { bass: 45, chord: [57, 62], notes: [[1, 78, 0.85, 0.035, true], [2, 78, 0.95, 0.033, true]] },
    { bass: 50, chord: [57, 66], notes: [[0, 62, 2.0, 0.052], [2, 74, 1.0, 0.048]] },

    // Waltz 1B — Lyrical Viennese melody
    { bass: 50, chord: [57, 66], notes: [[0, 74, 2.1, 0.056], [2, 76, 1.0, 0.05]] },
    { bass: 49, chord: [57, 66], notes: [[0, 78, 2.1, 0.058], [2, 81, 1.05, 0.054]] },
    { bass: 43, chord: [55, 59], notes: [[0, 81, 2.9, 0.06], [1, 74, 1.5, 0.028, true]] },
    { bass: 43, chord: [55, 59], notes: [[0, 79, 2.0, 0.055], [2, 76, 1.0, 0.05]] },
    { bass: 42, chord: [57, 62], notes: [[0, 78, 2.8, 0.058]] },
    { bass: 50, chord: [57, 62], notes: [[0, 74, 2.0, 0.054], [2, 71, 1.0, 0.048]] },
    { bass: 40, chord: [55, 59], notes: [[0, 69, 2.0, 0.052], [2, 67, 1.0, 0.048]] },
    { bass: 45, chord: [55, 61], notes: [[0, 64, 2.0, 0.05], [2, 69, 1.0, 0.048]] },

    { bass: 50, chord: [57, 66], notes: [[0, 74, 2.1, 0.056], [2, 76, 1.0, 0.05]] },
    { bass: 48, chord: [57, 66], notes: [[0, 78, 2.1, 0.058], [2, 81, 1.05, 0.055]] },
    { bass: 47, chord: [55, 59], notes: [[0, 83, 2.1, 0.06], [2, 79, 1.0, 0.052]] },
    { bass: 40, chord: [55, 59], notes: [[0, 76, 2.8, 0.056]] },
    { bass: 45, chord: [57, 62], notes: [[0, 74, 1.05, 0.054], [1, 78, 1.05, 0.056], [2, 76, 1.05, 0.052]] },
    { bass: 45, chord: [55, 61], notes: [[0, 74, 2.0, 0.054], [2, 73, 1.0, 0.05]] },
    { bass: 50, chord: [57, 66], notes: [[0, 74, 2.9, 0.06], [1, 86, 1.6, 0.026, true]] },
    { bass: 50, chord: [57, 66], notes: [[1, 69, 1.1, 0.04], [2, 62, 1.0, 0.044]] },
  ];

  function midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function setIosVinylPlaybackSession() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
        navigator.audioSession.type = 'playback';
      }
    } catch (_e) {
      // ignore unsupported audioSession API
    }
  }

  function primeVinylSilentUnlock(ctx) {
    if (!ctx) return;
    setIosVinylPlaybackSession();
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

  function destroyBgmAudioGraph() {
    if (bgmLoopTimer) {
      clearTimeout(bgmLoopTimer);
      bgmLoopTimer = null;
    }
    const oldCtx = bgmAudioCtx;
    bgmAudioCtx = null;
    bgmMasterGain = null;
    bgmNoteTarget = null;
    bgmLastCtxTime = -1;
    bgmFrozenTicks = 0;
    if (oldCtx && typeof oldCtx.close === 'function') {
      try {
        const p = oldCtx.close();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_e) {
        // ignore close errors
      }
    }
  }

  function ensureBgmAudioGraph() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (bgmAudioCtx && (bgmAudioCtx.state === 'closed' || bgmNeedsRebuild)) {
      destroyBgmAudioGraph();
      bgmNeedsRebuild = false;
    }
    if (!bgmAudioCtx) {
      setIosVinylPlaybackSession();
      bgmAudioCtx = new AudioCtx();
      bgmLastCtxTime = bgmAudioCtx.currentTime;
      bgmFrozenTicks = 0;

      const master = bgmAudioCtx.createGain();
      master.gain.setValueAtTime(0.62, bgmAudioCtx.currentTime);
      master.connect(bgmAudioCtx.destination);

      const toneFilter = bgmAudioCtx.createBiquadFilter();
      toneFilter.type = 'lowpass';
      toneFilter.frequency.setValueAtTime(1480, bgmAudioCtx.currentTime);
      toneFilter.Q.setValueAtTime(0.55, bgmAudioCtx.currentTime);
      toneFilter.connect(master);

      // Warm Viennese salon echo so felt-piano & music-box notes bloom gently
      const delay = bgmAudioCtx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.29, bgmAudioCtx.currentTime);
      const echoFilter = bgmAudioCtx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(920, bgmAudioCtx.currentTime);
      const feedback = bgmAudioCtx.createGain();
      feedback.gain.setValueAtTime(0.19, bgmAudioCtx.currentTime);
      const wet = bgmAudioCtx.createGain();
      wet.gain.setValueAtTime(0.24, bgmAudioCtx.currentTime);

      toneFilter.connect(delay);
      delay.connect(echoFilter);
      echoFilter.connect(wet);
      wet.connect(master);
      echoFilter.connect(feedback);
      feedback.connect(delay);

      bgmMasterGain = master;
      bgmNoteTarget = toneFilter;

      const boundCtx = bgmAudioCtx;
      if (typeof boundCtx.addEventListener === 'function') {
        boundCtx.addEventListener('statechange', () => {
          if (bgmAudioCtx !== boundCtx) return;
          if (boundCtx.state !== 'running') {
            if (bgmLoopTimer) {
              clearTimeout(bgmLoopTimer);
              bgmLoopTimer = null;
            }
          } else if (bgmPlaying && !document.hidden) {
            wakeVinylBgm();
          }
        });
      }
    }
    return bgmAudioCtx;
  }

  function scheduleFeltPianoNote(ctx, midi, startTime, durationSec, peakGain, isChime = false) {
    if (!bgmNoteTarget) return;
    const freq = midiToHz(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + (isChime ? 0.012 : 0.024));
    env.gain.exponentialRampToValueAtTime(peakGain * 0.34, startTime + (isChime ? 0.28 : 0.38));
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
    env.connect(bgmNoteTarget);

    const oscMain = ctx.createOscillator();
    oscMain.type = 'sine';
    oscMain.frequency.setValueAtTime(freq, startTime);

    const oscWarm = ctx.createOscillator();
    oscWarm.type = isChime ? 'sine' : 'triangle';
    oscWarm.frequency.setValueAtTime(freq * (isChime ? 3 : 2), startTime);
    const warmGain = ctx.createGain();
    warmGain.gain.setValueAtTime(isChime ? 0.08 : 0.13, startTime);
    warmGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.32);

    oscMain.connect(env);
    oscWarm.connect(warmGain);
    warmGain.connect(env);

    oscMain.start(startTime);
    oscWarm.start(startTime);
    oscMain.stop(startTime + durationSec + 0.05);
    oscWarm.stop(startTime + durationSec + 0.05);
  }

  function scheduleNextBgmBar() {
    if (!bgmPlaying || !bgmAudioCtx || document.hidden || bgmAudioCtx.state !== 'running') {
      bgmLoopTimer = null;
      return;
    }
    if (bgmWasStandby && bgmLastCtxTime >= 0 && bgmAudioCtx.currentTime > bgmLastCtxTime + 0.03) {
      bgmWasStandby = false;
      bgmNeedsRebuild = false;
      bgmFrozenTicks = 0;
    }
    bgmLastCtxTime = bgmAudioCtx.currentTime;
    const beatSec = 0.43; // Unhurried, tender Viennese 3/4 waltz (~140 quarter BPM = ~46 bars/min)
    const barStart = bgmAudioCtx.currentTime + 0.05;
    const bar = BLUE_DANUBE_BARS[bgmBarIndex % BLUE_DANUBE_BARS.length];
    bgmBarIndex = (bgmBarIndex + 1) % BLUE_DANUBE_BARS.length;

    // Soft waltz accompaniment: warm bass on beat 1, feather-light brushed dyads on beats 2 & 3
    // (subtle -12ms Viennese lilt on beat 2 so it sways gently rather than marching mechanically)
    scheduleFeltPianoNote(bgmAudioCtx, bar.bass, barStart, beatSec * 2.5, 0.036, false);
    if (bar.chord && bar.chord.length) {
      bar.chord.forEach((cMidi, idx) => {
        const strum = idx * 0.012;
        scheduleFeltPianoNote(bgmAudioCtx, cMidi, barStart + beatSec - 0.012 + strum, beatSec * 0.82, 0.018, false);
        scheduleFeltPianoNote(bgmAudioCtx, cMidi, barStart + beatSec * 2 + strum, beatSec * 0.78, 0.015, false);
      });
    }

    // Expressive melody & music-box upper echoes
    bar.notes.forEach((n) => {
      const [beatOffset, midi, durBeats, gain, isChime] = n;
      const rubato = (Math.random() - 0.5) * 0.012;
      const tStart = Math.max(bgmAudioCtx.currentTime + 0.02, barStart + beatOffset * beatSec + rubato);
      scheduleFeltPianoNote(bgmAudioCtx, midi, tStart, Math.max(0.35, durBeats * beatSec), gain, Boolean(isChime));
    });

    bgmLoopTimer = window.setTimeout(scheduleNextBgmBar, Math.round(beatSec * 3 * 1000));
  }

  function clearBgmWakeRetries() {
    while (bgmWakeRetryTimers.length > 0) {
      clearTimeout(bgmWakeRetryTimers.pop());
    }
  }

  function ensureBgmMasterAudible() {
    if (!bgmAudioCtx || !bgmMasterGain) return;
    try {
      const now = bgmAudioCtx.currentTime;
      bgmMasterGain.gain.cancelScheduledValues(now);
      if (typeof bgmMasterGain.gain.setTargetAtTime === 'function') {
        bgmMasterGain.gain.setTargetAtTime(0.62, now, 0.08);
      } else {
        bgmMasterGain.gain.setValueAtTime(0.62, now);
      }
    } catch (_e) {
      // ignore gain transition errors
    }
  }

  // Never call bgmAudioCtx.suspend() on standby so iOS/macOS Safari can auto-resume AVAudioSession on wake!
  function suspendVinylBgmForStandby() {
    bgmWasStandby = true;
    clearBgmWakeRetries();
    if (bgmLoopTimer) {
      clearTimeout(bgmLoopTimer);
      bgmLoopTimer = null;
    }
  }

  function startBgmWatchdog() {
    if (bgmWatchdogTimer) return;
    bgmWatchdogTimer = setInterval(() => {
      if (!bgmPlaying || document.hidden) return;
      if (!bgmAudioCtx || bgmAudioCtx.state === 'closed') {
        wakeVinylBgm();
        return;
      }
      if (bgmAudioCtx.state !== 'running') {
        if (typeof bgmAudioCtx.resume === 'function') {
          bgmAudioCtx.resume().then(wakeVinylBgm).catch(() => {});
        }
        return;
      }
      const curT = bgmAudioCtx.currentTime;
      if (bgmLastCtxTime >= 0 && curT <= bgmLastCtxTime + 0.01) {
        bgmFrozenTicks += 1;
        if (bgmFrozenTicks >= 2) {
          bgmNeedsRebuild = true;
          destroyBgmAudioGraph();
          wakeVinylBgm();
        }
      } else {
        bgmLastCtxTime = curT;
        bgmFrozenTicks = 0;
        bgmWasStandby = false;
        bgmNeedsRebuild = false;
        ensureBgmMasterAudible();
        if (!bgmLoopTimer) {
          scheduleNextBgmBar();
        }
      }
    }, 900);
  }

  function stopBgmWatchdog() {
    if (bgmWatchdogTimer) {
      clearInterval(bgmWatchdogTimer);
      bgmWatchdogTimer = null;
    }
  }

  function wakeVinylBgm() {
    if (!bgmPlaying || document.hidden) return;
    const ctx = ensureBgmAudioGraph();
    if (!ctx) return;
    startBgmWatchdog();

    const startRunningLoop = () => {
      if (!bgmPlaying || document.hidden || !bgmAudioCtx || bgmAudioCtx.state !== 'running') {
        return;
      }
      ensureBgmMasterAudible();
      if (!bgmLoopTimer) {
        scheduleNextBgmBar();
      }
    };

    if (ctx.state === 'running') {
      startRunningLoop();
    } else if (typeof ctx.resume === 'function') {
      ctx.resume().then(startRunningLoop).catch(() => {});
    }
  }

  function scheduleStaggeredBgmWake() {
    if (!bgmPlaying || document.hidden) return;
    clearBgmWakeRetries();
    wakeVinylBgm();
    [260, 750, 1500].forEach((ms) => {
      bgmWakeRetryTimers.push(
        setTimeout(() => {
          if (bgmPlaying && !document.hidden) wakeVinylBgm();
        }, ms)
      );
    });
  }

  function isVinylAudioHealthy() {
    return Boolean(
      bgmAudioCtx &&
        bgmAudioCtx.state === 'running' &&
        !bgmNeedsRebuild &&
        bgmFrozenTicks === 0 &&
        !bgmWasStandby
    );
  }

  function rebuildAndWakeVinylOnGesture() {
    if (!bgmPlaying || document.hidden) return;
    if (
      !bgmAudioCtx ||
      bgmAudioCtx.state !== 'running' ||
      bgmNeedsRebuild ||
      bgmFrozenTicks > 0 ||
      bgmWasStandby
    ) {
      destroyBgmAudioGraph();
      bgmNeedsRebuild = false;
      bgmWasStandby = false;
      const freshCtx = ensureBgmAudioGraph();
      if (freshCtx) primeVinylSilentUnlock(freshCtx);
    }
    wakeVinylBgm();
  }

  function pauseVinylBgm() {
    if (!bgmPlaying) return;
    bgmPlaying = false;
    bgmWasStandby = false;
    clearBgmWakeRetries();
    stopBgmWatchdog();
    if (bgmLoopTimer) {
      clearTimeout(bgmLoopTimer);
      bgmLoopTimer = null;
    }
    if (bgmAudioCtx && bgmMasterGain) {
      try {
        bgmMasterGain.gain.cancelScheduledValues(bgmAudioCtx.currentTime);
        bgmMasterGain.gain.setTargetAtTime(0.0001, bgmAudioCtx.currentTime, 0.08);
      } catch (_e) {
        // ignore audio context transition errors
      }
    }
    syncBgmButtonA11y();
  }

  function toggleVinylBgm() {
    if (bgmPlaying) {
      if (!isVinylAudioHealthy()) {
        rebuildAndWakeVinylOnGesture();
        return;
      }
      pauseVinylBgm();
      return;
    }
    bgmPlaying = true;
    syncBgmButtonA11y();
    if (bgmWasStandby || bgmNeedsRebuild || (bgmAudioCtx && bgmAudioCtx.state !== 'running')) {
      rebuildAndWakeVinylOnGesture();
    } else {
      const ctx = ensureBgmAudioGraph();
      if (!ctx) return;
      primeVinylSilentUnlock(ctx);
      wakeVinylBgm();
    }
  }

  // Event Listeners
  if (btnBgm) {
    btnBgm.addEventListener('click', toggleVinylBgm);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (bgmPlaying) suspendVinylBgmForStandby();
    } else if (bgmPlaying) {
      scheduleStaggeredBgmWake();
    }
  });

  window.addEventListener('pageshow', () => {
    if (!document.hidden && bgmPlaying) scheduleStaggeredBgmWake();
  });

  window.addEventListener('focus', () => {
    if (!document.hidden && bgmPlaying) scheduleStaggeredBgmWake();
  });

  const unlockBgmAfterStandby = (e) => {
    if (!bgmPlaying || document.hidden || isVinylAudioHealthy()) return;
    if (btnBgm && e && e.target && typeof e.target.closest === 'function' && e.target.closest('#bgm-toggle-btn')) {
      return;
    }
    rebuildAndWakeVinylOnGesture();
  };
  window.addEventListener('touchend', unlockBgmAfterStandby, { passive: true });
  window.addEventListener('click', unlockBgmAfterStandby, { passive: true });
  window.addEventListener('mouseup', unlockBgmAfterStandby, { passive: true });
  window.addEventListener('keydown', unlockBgmAfterStandby, { passive: true });

  btnLang.addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    safeSetStorage(STORAGE_KEY_LANG, currentLang);
    applyLanguage();
  });

  if (btnToggleMs) {
    btnToggleMs.addEventListener('click', () => {
      showMs = !showMs;
      safeSetStorage(STORAGE_KEY_MS, String(showMs));
      updateMsVisibility();
    });
  }

  btnTheme.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    safeSetStorage(STORAGE_KEY_THEME, next);
  });

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
        if (req) req.call(document.documentElement).catch(() => {});
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document).catch(() => {});
      }
    });
  }

  // Wedding Botanical Rose-Petal & Sage-Leaf Flutter Effect
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  const PETAL_COLORS = ['#d89aa3', '#e5b8bf', '#efcdd2', '#fff8f0', '#ead6be'];
  const LEAF_COLORS = ['#7fa389', '#9ab8a1', '#b6cbb9'];

  let particles = [];
  let ambientPetals = [];
  let animatingConfetti = false;

  function createAmbientPetal(initialRandomY) {
    const isLeaf = Math.random() < 0.24;
    const palette = isLeaf ? LEAF_COLORS : PETAL_COLORS;
    return {
      kind: isLeaf ? 'leaf' : 'petal',
      x: Math.random() * (canvas.width || window.innerWidth),
      y: initialRandomY ? Math.random() * (canvas.height || window.innerHeight) : -24 - Math.random() * 40,
      vx: (Math.random() - 0.35) * 0.35,
      vy: 0.32 + Math.random() * 0.38,
      size: 6.5 + Math.random() * 4.5,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.016,
      tilt: Math.random() * Math.PI * 2,
      vTilt: 0.014 + Math.random() * 0.016,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.012 + Math.random() * 0.012,
      alpha: 0.2 + Math.random() * 0.16,
    };
  }

  function syncAmbientPetals() {
    if (reducedMotionQuery.matches) {
      ambientPetals = [];
      return;
    }
    const targetCount = window.innerWidth < 640 ? 5 : 7;
    while (ambientPetals.length < targetCount) {
      ambientPetals.push(createAmbientPetal(true));
    }
    if (ambientPetals.length > targetCount) {
      ambientPetals.length = targetCount;
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    syncAmbientPetals();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawBotanicalShape(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    const flipScale = 0.42 + 0.58 * Math.abs(Math.cos(p.tilt));
    ctx.scale(1, flipScale);
    ctx.fillStyle = p.color;

    const s = p.size;
    ctx.beginPath();
    if (p.kind === 'leaf') {
      // Slender eucalyptus / sage leaf
      ctx.moveTo(-s * 0.95, 0);
      ctx.quadraticCurveTo(0, -s * 0.48, s * 0.95, 0);
      ctx.quadraticCurveTo(0, s * 0.48, -s * 0.95, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      // Soft heart-notched rose petal
      ctx.moveTo(0, s * 0.78);
      ctx.bezierCurveTo(-s * 0.82, s * 0.35, -s * 0.88, -s * 0.58, -s * 0.24, -s * 0.78);
      ctx.quadraticCurveTo(0, -s * 0.52, s * 0.24, -s * 0.78);
      ctx.bezierCurveTo(s * 0.88, -s * 0.58, s * 0.82, s * 0.35, 0, s * 0.78);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function ensureConfettiLoop() {
    if (!animatingConfetti && !document.hidden) {
      animatingConfetti = true;
      requestAnimationFrame(renderConfetti);
    }
  }

  function launchConfetti() {
    const count = reducedMotionQuery.matches ? 32 : 78;
    for (let i = 0; i < count; i++) {
      const isLeaf = Math.random() < 0.22;
      const palette = isLeaf ? LEAF_COLORS : PETAL_COLORS;
      particles.push({
        kind: isLeaf ? 'leaf' : 'petal',
        x: window.innerWidth / 2 + (Math.random() - 0.5) * Math.min(340, window.innerWidth * 0.65),
        y: window.innerHeight * 0.44 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 9.5,
        vy: -Math.random() * 9.5 - 2.4,
        size: Math.random() * 6.5 + 6.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.09,
        tilt: Math.random() * Math.PI * 2,
        vTilt: 0.04 + Math.random() * 0.05,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.04 + Math.random() * 0.03,
        alpha: 0.96,
      });
    }
    ensureConfettiLoop();
  }

  function renderConfetti() {
    if (document.hidden) {
      animatingConfetti = false;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle ambient petals drifting gently (skipped when prefers-reduced-motion or HP secret theme)
    const allowAmbient =
      !reducedMotionQuery.matches && !document.body.classList.contains('hp-secret-theme');
    if (allowAmbient) {
      ambientPetals.forEach((p) => {
        p.swayPhase += p.swaySpeed;
        p.x += p.vx + Math.sin(p.swayPhase) * 0.32;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.tilt += p.vTilt;

        if (p.y > canvas.height + 28) {
          p.y = -24;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -30) p.x = canvas.width + 25;
        if (p.x > canvas.width + 30) p.x = -25;

        drawBotanicalShape(p);
      });
    }

    particles.forEach((p) => {
      p.swayPhase += p.swaySpeed;
      p.x += p.vx + Math.sin(p.swayPhase) * 0.55;
      p.y += p.vy;
      p.vy = Math.min(p.vy + 0.16, 2.6); // Soft terminal velocity so petals float down gently
      p.vx *= 0.985;
      p.rotation += p.vRot;
      p.tilt += p.vTilt;
      p.alpha -= 0.0052;

      drawBotanicalShape(p);
    });

    particles = particles.filter((p) => p.alpha > 0 && p.y < canvas.height + 40);
    if (particles.length > 0 || allowAmbient) {
      requestAnimationFrame(renderConfetti);
    } else {
      animatingConfetti = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (particles.length > 0 || !reducedMotionQuery.matches)) {
      ensureConfettiLoop();
    }
  });

  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener('change', () => {
      syncAmbientPetals();
      ensureConfettiLoop();
    });
  }

  btnCelebrate.addEventListener('click', launchConfetti);

  // Initialize
  initPreferences();
  ensureConfettiLoop();
  requestAnimationFrame(tick);

  // Register Offline Service Worker (Network-First + Zero Easter Egg Spoiler)
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || window.location.protocol === 'http:') &&
    !document.getElementById('debug-auth-gate')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=20261111g').catch(() => {});
    });
  }
})();
