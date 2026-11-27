(() => {
  'use strict';

  // 在公開版 index.html 上立即鎖死 __TE_DEBUG_AUTH__ 與 __TE_STAFF_AUTH__ 為唯讀 false，
  // 防止賓客透過 DevTools Console 手動設為 true 窺探工作人員座位詳情、小巴名單或後台排行榜面板
  if (typeof window !== 'undefined') {
    if (!Object.prototype.hasOwnProperty.call(window, '__TE_DEBUG_AUTH__')) {
      Object.defineProperty(window, '__TE_DEBUG_AUTH__', {
        value: false,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    }
    if (!Object.prototype.hasOwnProperty.call(window, '__TE_STAFF_AUTH__')) {
      Object.defineProperty(window, '__TE_STAFF_AUTH__', {
        value: false,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    }
  }

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
  const REAL_TARGET_ISO = '2026-11-29T12:20:00+08:00';
  const REAL_TARGET_TIMESTAMP = new Date(REAL_TARGET_ISO).getTime();

  // 新人影片清單（兩支獨立嵌入，播完第 1 支自動接續第 2 支，同時提供一鍵切換按鈕，不公開影片也 100% 穩定播放）
  const WEDDING_VIDEOS = [
    {
      type: 'local-video',
      url: 'video/wedding-video-1.mp4',
      poster: 'video/wedding-video-1-poster.jpg',
      label: { zh: '🎬 影片 1：婚禮影片', en: '🎬 Video 1: Wedding Film' },
    },
    {
      type: 'embed',
      url: 'https://youtu.be/cXCqbNGfTww',
      label: { zh: '💍 影片 2：登記側錄', en: '💍 Video 2: Registration Film' },
    },
  ];
  const WEDDING_VIDEO_URL = WEDDING_VIDEOS[0].url;

  // Google Photos 婚禮現場共享相簿連結（賓客上傳與瀏覽當日照片）
  const GOOGLE_PHOTOS_SHARE_URL = 'https://photos.app.goo.gl/zXY7gwRZHhWqndkr8';

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
  const SEATING_CHART_IMAGE_URL = 'seating-chart.jpg?v=20261127r';
  const SEATING_CHART_LINK_URL = 'seating-chart.jpg?v=20261127r';
  const WEDDING_MENU_IMAGE_URL = '';
  const WEDDING_MENU_LINK_URL = '';

  // 問答排行榜 & 密語後端網址（將 leaderboard-apps-script.gs 部署為 Google Apps Script 網頁應用程式後貼到此處）
  const LEADERBOARD_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycby3Cs85ileMgZgMa0lWTHGyWDnoA_sxsldpeHrLMGPiFJznafbMfLuAovAuU4hN4OUcBA/exec';
  const LEADERBOARD_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1v0_PPieFd2kcAO74o0QhEvkEuG4nOVuYuq_BVD7JFB8/edit';
  const STORAGE_KEY_PLAYER_NAME = 'te_wedding_player_name_v1';
  const SECRET_PASSCODE_SHA256_SET = new Set([
    '721c2ce0de061fe5f0fb29ca1dc8125cab83bbe60043e334b4cfe29ed470c4bb',
    '8350d70b29920e5bfc8ad2efbae71b53dfc8500a9cba1771bf745c083384777e',
    'e505abe903e47c2e1c4ce67140c96fdf78ab8c4d4d099f7b726076f7071bbc26',
  ]);

  // 雙語介面文字設定 (繁體中文 / English · 清新溫柔喜帖第一人稱口吻)
  const I18N = {
    zh: {
      pageTitle: 'Tom & Eunice · 2026.11.29 婚禮邀請',
      langBtnLabel: 'EN',
      langBtnTitle: '切換為英文 / Switch to English',
      themeBtnTitle: '切換日夜色調',
      bgmPlayTitle: '播放 33⅓ 日間圓舞曲 · 史特勞斯《藍色多瑙河》',
      bgmPauseTitle: '暫停 33⅓ 日間圓舞曲 · 史特勞斯《藍色多瑙河》',
      bgmPlayTitleDark: '播放 33⅓ 夜色慢板 · 莫札特《第 21 號鋼琴協奏曲 Andante》',
      bgmPauseTitleDark: '暫停 33⅓ 夜色慢板 · 莫札特《第 21 號鋼琴協奏曲 Andante》',
      eyebrowCountdown: '2014 — 2026 · 婚禮邀請',
      eyebrowTimeUp: '2026.11.29 · 謝謝今天來見我們的你',
      eventTitle: '走過十二年四季，想邀請你來參與我們最重要的一天',
      targetSubtitle: '2026 年 11 月 29 日（日）中午 12:30 · 陽明山美軍俱樂部 Brick\u00A0Yard\u00A033\u00A01/3',
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
      loveSignature: 'With love, Tom & Eunice · 33⅓\u00A0RPM',
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
      crewEyebrow: 'WEDDING CREW · WITH GRATITUDE',
      crewTitle: '婚禮工作團隊',
      crewRoles: {
        host: '主持人',
        stylist: '新秘',
        regPhoto: '登記紀錄-平面',
        regVideo: '登記紀錄-錄像',
        banquetPhoto: '婚宴紀錄-平面',
        banquetVideo: '婚宴紀錄-錄像',
        floral: '花藝',
        audio: '音響',
      },
      galleryCardEyebrow: 'Wedding & Registration',
      galleryCardTitle: '婚紗與登記寫真',
      galleryCardDesc: '精選 Tom & Eunice 婚紗攝影與登記結婚紀念照，一起欣賞我們的幸福瞬間。',
      galleryCardCta: '欣賞精選寫真',
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
      tabGallery: '💍 婚紗＆登記',
      tabFootprints: '十二年足跡',
      seatingPanelEyebrow: 'Brick Yard 33 1/3 · Floor Plan',
      seatingPanelTitle: '美軍俱樂部 · 婚宴座位表',
      seatingExternalBtn: '開啟完整座位圖 ↗',
      seatingSearchPlaceholder: '輸入姓名或桌名搜尋...',
      menuPanelEyebrow: 'Brick Yard 33 1/3 · Banquet & Bar',
      menuPanelTitle: '美軍俱樂部 · 百匯佳餚與特調菜單',
      menuExternalBtn: '開啟完整菜單相片 ↗',
      menuNoteText: '迎賓小提醒：戶外備有「雞尾酒點心吧」，吧台也為每位賓客準備了一杯「Bartender 現調調酒」；自助百匯區提供現切爐烤曼哈頓牛排、海陸熱饌與法式甜點（皆已標註素食／蛋奶素／含酒精），請慢慢享用！',
      sharePanelEyebrow: 'Shared Wedding Album',
      sharePanelTitle: '你鏡頭下的 Tom & Eunice',
      sharePanelDesc: '今天在現場拍下的照片或小短片，都很歡迎傳進這本 Google Photos 相簿，讓我們也能看見你眼裡的這一天。',
      shareStep1: '1. 點選下方按鈕打開 Google Photos 共享相簿',
      shareStep2: '2. 按一下「新增相片」就能直接上傳分享',
      shareLinkBtn: '打開婚禮 Google Photos 相簿 ↗',
      galleryPanelEyebrow: 'Wedding & Registration · Tom & Eunice',
      galleryPanelTitle: '精選婚紗與登記寫真',
      eraAll: '全部年份 (2014–2026)',
      era2014: '2014–2017 初識與校園',
      era2018: '2018–2021 跨洲遠距離',
      era2022: '2022–2026 回到同一座城市',
      footprintsPanelEyebrow: '2014 — 2026 · Across the Miles',
      footprintsPanelTitle: '十二年相戀足跡',
      footprintStatsText: '✈️ 最遠相隔 13,877 km（奧蘭多 ↔ 高雄）· 跨洲遠距 9,100 km（柏林 ↔ 高雄）',
      footprintTrackTom: '🤵‍♂️ Tom Tung · 新竹 ➔ 台北 ➔ 柏林 ➔ 新北 ➔ 台北',
      footprintTrackEunice: '👰‍♀️ Eunice Hsiao · 台北 ➔ 高雄 ➔ 諾丁漢 ➔ 新北 ➔ 台北',
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
      bgmPlayTitle: 'Play 33⅓ Day Waltz · Strauss “The Blue Danube”',
      bgmPauseTitle: 'Pause 33⅓ Day Waltz · Strauss “The Blue Danube”',
      bgmPlayTitleDark: 'Play 33⅓ Night Andante · Mozart Piano Concerto No. 21',
      bgmPauseTitleDark: 'Pause 33⅓ Night Andante · Mozart Piano Concerto No. 21',
      eyebrowCountdown: '2014 — 2026 · Wedding Invitation',
      eyebrowTimeUp: 'Nov 29, 2026 · So Happy You Are Here With Us',
      eventTitle: "Twelve years of seasons together — we'd love for you to celebrate this day with us",
      targetSubtitle: 'Sunday, November 29, 2026 · 12:30 PM · Brick\u00A0Yard\u00A033\u00A01/3, Yangmingshan, Taipei',
      labelDays: 'Days',
      labelHours: 'Hours',
      labelMinutes: 'Mins',
      labelSeconds: 'Secs',
      loveNoteParts: {
        prefix: 'Since February 28, 2014 in Taipei, we have walked through ',
        mid: ' days side by side and bridged ',
        km: '13,877',
        suffix: " km across time zones — now, we can't wait to gather with you among the red bricks and mountain breeze of Yangmingshan.",
      },
      loveSignature: 'With love, Tom & Eunice · 33⅓\u00A0RPM',
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
      crewEyebrow: 'WEDDING CREW · WITH GRATITUDE',
      crewTitle: 'Wedding Creative Team',
      crewRoles: {
        host: 'Host / MC',
        stylist: 'Bridal Stylist',
        regPhoto: 'Registration Photography',
        regVideo: 'Registration Videography',
        banquetPhoto: 'Banquet Photography',
        banquetVideo: 'Banquet Videography',
        floral: 'Floral Design',
        audio: 'Audio & Sound',
      },
      galleryCardEyebrow: 'Wedding & Registration',
      galleryCardTitle: 'Wedding & Registration Photos',
      galleryCardDesc: "Browse a curated carousel of Tom & Eunice's pre-wedding and registration portraits.",
      galleryCardCta: 'View Wedding Photos',
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
      tabGallery: '💍 Portraits',
      tabFootprints: 'Our Map',
      seatingPanelEyebrow: 'Brick Yard 33 1/3 · Floor Plan',
      seatingPanelTitle: 'Brick Yard 33 1/3 · Seating Chart',
      seatingExternalBtn: 'Open Full Floor Plan ↗',
      seatingSearchPlaceholder: 'Search name or table...',
      menuPanelEyebrow: 'Brick Yard 33 1/3 · Banquet & Bar',
      menuPanelTitle: 'Brick Yard 33 1/3 · Banquet & Cocktail Menu',
      menuExternalBtn: 'Open Full Menu Photo ↗',
      menuNoteText: 'Welcome Treats: Enjoy our Outdoor Cocktail & Canapé Bar plus one handcrafted Bartender cocktail per guest, alongside carved Manhattan steak, hot entrées & French patisserie (vegetarian, ovo-lacto vegetarian & alcohol-containing dishes are labeled).',
      sharePanelEyebrow: 'Shared Wedding Album',
      sharePanelTitle: 'Tom & Eunice Through Your Lens',
      sharePanelDesc: 'We would love to see today through your eyes — feel free to upload any photos or clips you captured to our shared Google Photos album.',
      shareStep1: '1. Tap the button below to open our Google Photos album',
      shareStep2: '2. Select "Add photos" to share your favorite shots',
      shareLinkBtn: 'Open Shared Google Photos Album ↗',
      galleryPanelEyebrow: 'Wedding & Registration · Tom & Eunice',
      galleryPanelTitle: 'Wedding & Registration Portraits',
      eraAll: 'All Years (2014–2026)',
      era2014: '2014–2017 Campus Days',
      era2018: '2018–2021 Across Time Zones',
      era2022: '2022–2026 Same City Again',
      footprintsPanelEyebrow: '2014 — 2026 · Across the Miles',
      footprintsPanelTitle: 'Twelve Years on the Map',
      footprintStatsText: '✈️ Furthest Apart: 13,877 km (Orlando ↔ Kaohsiung) · Long-Distance: 9,100 km (Berlin ↔ Kaohsiung)',
      footprintTrackTom: '🤵‍♂️ Tom Tung · Hsinchu ➔ Taipei ➔ Berlin ➔ New Taipei ➔ Taipei',
      footprintTrackEunice: '👰‍♀️ Eunice Hsiao · Taipei ➔ Kaohsiung ➔ Nottingham ➔ New Taipei ➔ Taipei',
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
  /**
   * 精選婚紗照片輪播資料（來自 Google Drive prewed 資料夾，共 61 張最佳化實拍）
   */
  const PAST_PHOTOS_DATA = Array.from({ length: 61 }, (_unused, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return {
      yearLabel: `Pre-Wedding · ${num} / 61`,
      emoji: '💍',
      imageUrl: `photos/wedding-${num}.jpg`,
      title: {
        zh: `Tom & Eunice 幸福寫真 #${num}`,
        en: `Tom & Eunice Portrait #${num}`,
      },
      caption: {
        zh: '十二年的默契與笑容，定格在屬於我們的婚紗與登記時刻。',
        en: 'Twelve years of laughter and love captured in our pre-wedding portraits.',
      },
    };
  });

  /**
   * 婚宴座位表資料（依據 BY33 美軍俱樂部平面圖 12 大座位區與參加人名單配置，支援分類或賓客姓名即時搜尋高亮）
   */
  // 小巴接駁名單（11:00 劍潭站發車，僅於 staff.html / debug.html 顯示，不與座位綁定）
  const SHUTTLE_PASSENGERS = [
    // 新郎爸媽朋友（21 組／29 人）
    { name: '楊文', count: 1, group: '新郎爸媽朋友' },
    { name: '林鳳姿', count: 1, group: '新郎爸媽朋友' },
    { name: '李素幸', count: 1, group: '新郎爸媽朋友' },
    { name: '李旻貞', count: 1, group: '新郎爸媽朋友' },
    { name: '許惠珍', count: 1, group: '新郎爸媽朋友' },
    { name: '鄭瑋玲', count: 1, group: '新郎爸媽朋友' },
    { name: '劉子經', count: 2, group: '新郎爸媽朋友' },
    { name: '呂淑貞', count: 1, group: '新郎爸媽朋友' },
    { name: '龔紹興', count: 2, group: '新郎爸媽朋友' },
    { name: '林本芬', count: 1, group: '新郎爸媽朋友' },
    { name: '劉東皋', count: 1, group: '新郎爸媽朋友' },
    { name: '高栢鈴', count: 2, group: '新郎爸媽朋友' },
    { name: '王仲瑛', count: 2, group: '新郎爸媽朋友' },
    { name: '陳兆伸', count: 1, group: '新郎爸媽朋友' },
    { name: '吳逸楓', count: 1, group: '新郎爸媽朋友' },
    { name: '廖美鸞', count: 1, group: '新郎爸媽朋友' },
    { name: '曾智聰', count: 1, group: '新郎爸媽朋友' },
    { name: '何毅夫/何夫人', count: 2, group: '新郎爸媽朋友' },
    { name: '楊哲彰/余鳳琴', count: 2, group: '新郎爸媽朋友' },
    { name: '劉園德/張金鳳', count: 2, group: '新郎爸媽朋友' },
    { name: '高增堯/張淑貞', count: 2, group: '新郎爸媽朋友' },
    // 新郎媽媽親戚（7 組／13 人）
    { name: '徐和志、許嵐音', count: 2, group: '新郎媽媽親戚' },
    { name: '徐平志', count: 1, group: '新郎媽媽親戚' },
    { name: '徐慧明', count: 1, group: '新郎媽媽親戚' },
    { name: '徐宇志', count: 3, group: '新郎媽媽親戚' },
    { name: '徐雪櫻', count: 2, group: '新郎媽媽親戚' },
    { name: '王欣凱 Michael', count: 2, group: '新郎媽媽親戚' },
    { name: '房滋寧/韓治瀾', count: 2, group: '新郎媽媽親戚' },
    // 新郎爸爸親戚（2 組／4 人）
    { name: '陳思樺', count: 2, group: '新郎爸爸親戚' },
    { name: '董素芬', count: 2, group: '新郎爸爸親戚' },
    // 新郎同學＆老師（5 組／5 人）
    { name: '鄭兆珍', count: 1, group: '新郎同學＆老師' },
    { name: '何弋柏', count: 1, group: '新郎同學＆老師' },
    { name: '周駿逸', count: 1, group: '新郎同學＆老師' },
    { name: 'Allan Sun', count: 1, group: '新郎同學＆老師' },
    { name: '張家瑋', count: 1, group: '新郎同學＆老師' },
    // 新郎同事（4 組／6 人）
    { name: 'Harry Lu', count: 1, group: '新郎同事' },
    { name: '張均銘', count: 2, group: '新郎同事' },
    { name: 'ANH PHAN', count: 2, group: '新郎同事' },
    { name: '葛家聿', count: 1, group: '新郎同事' },
    // 新娘同學（7 組／8 人）
    { name: '陳品心', count: 1, group: '新娘同學' },
    { name: '雷廷萱', count: 1, group: '新娘同學' },
    { name: '戴嘉謙', count: 1, group: '新娘同學' },
    { name: '張恬恬', count: 1, group: '新娘同學' },
    { name: '林佳儒', count: 2, group: '新娘同學' },
    { name: '張辰', count: 1, group: '新娘同學' },
    { name: '王淑菁', count: 1, group: '新娘同學' },
  ];

  const SEATING_TABLES_DATA = [
    {
      id: 'table-main',
      box: { x: 908, y: 812, w: 366, h: 322 },
      color: '#d97706',
      fillColor: 'rgba(245, 158, 11, 0.12)',
      darkColor: '#fbbf24',
      darkFillColor: 'rgba(251, 191, 36, 0.16)',
      debugStats: { headcount: 14, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '主桌 · 新人與雙方主婚人區（M 桌）', en: 'Main Table · Newlyweds, Parents & Family Elders (Table M)' },
      zone: { zh: '主廳中央 · 主桌', en: 'Main Hall Center · Main Table' },
      guests: [
        { zh: '董智瑋 Tom (新郎)', en: 'Tom Tung (Groom)' },
        { zh: '蕭睦宸 Eunice (新娘)', en: 'Eunice Hsiao (Bride)' },
        { zh: '董煥新&徐淑明等二人', en: '董煥新 & 徐淑明 (2)' },
        { zh: '蕭能駿&傅郁淳等二人', en: '蕭能駿 & 傅郁淳 (2)' },
        { zh: '賴翠香', en: '賴翠香 (Grandmother)' },
        { zh: '董素娟等二人', en: '董素娟 (2)' },
        { zh: '傅昭雄等二人', en: '傅昭雄 (2)' },
        { zh: '傅楷凌', en: '傅楷凌' },
        { zh: '傅昭凱', en: '傅昭凱' },
        { zh: '董庭瑜', en: '董庭瑜' },
      ],
      seatPlan: {
        sweetheartTitle: {
          zh: '💑 右上方新人小桌（並排雙人席）',
          en: '💑 Top-Right Newlyweds Sweetheart Table',
        },
        sweetheartSeats: [
          {
            key: 'tom',
            side: 'left',
            cx: 1194,
            cy: 839,
            pinText: '♥',
            zh: '董智瑋 Tom',
            en: 'Tom Tung',
            match: '董智瑋 tom tung 新郎 groom',
          },
          {
            key: 'eunice',
            side: 'right',
            cx: 1236,
            cy: 839,
            pinText: '♥',
            zh: '蕭睦宸 Eunice',
            en: 'Eunice Hsiao',
            match: '蕭睦宸 eunice hsiao 新娘 bride',
          },
        ],
        leftX: 932,
        rightX: 1046,
        rowYs: [844, 896, 946, 998, 1052, 1104],
        rows: [
          [
            { key: '蕭能駿_傅郁淳', zh: '蕭能駿', en: '蕭能駿', match: '蕭能駿 傅郁淳' },
            { key: '董煥新_徐淑明', zh: '董煥新', en: '董煥新', match: '董煥新 徐淑明' },
          ],
          [
            { key: '蕭能駿_傅郁淳', zh: '傅郁淳', en: '傅郁淳', match: '蕭能駿 傅郁淳' },
            { key: '董煥新_徐淑明', zh: '徐淑明', en: '徐淑明', match: '董煥新 徐淑明' },
          ],
          [
            { key: '傅昭雄', zh: '傅昭雄', en: '傅昭雄', match: '傅昭雄' },
            { key: '賴翠香', zh: '賴翠香', en: '賴翠香 (Grandmother)', match: '賴翠香 婆婆 grandmother' },
          ],
          [
            { key: '傅昭雄', zh: '傅昭雄', en: '傅昭雄', match: '傅昭雄' },
            { key: '董庭瑜', zh: '董庭瑜', en: '董庭瑜', match: '董庭瑜' },
          ],
          [
            { key: '傅楷凌', zh: '傅楷凌', en: '傅楷凌', match: '傅楷凌' },
            { key: '董素娟', zh: '董素娟', en: '董素娟', match: '董素娟' },
          ],
          [
            { key: '傅昭凱', zh: '傅昭凱', en: '傅昭凱', match: '傅昭凱' },
            { key: '董素娟', zh: '董素娟', en: '董素娟', match: '董素娟' },
          ],
        ],
      },
    },
    {
      id: 'zone-bride-relatives',
      box: { x: 718, y: 812, w: 162, h: 322 },
      color: '#e11d48',
      fillColor: 'rgba(225, 29, 72, 0.12)',
      darkColor: '#fb7185',
      darkFillColor: 'rgba(251, 113, 133, 0.16)',
      debugStats: { headcount: 11, veg: 0, stroller: 0, childSeat: 2 },
      name: { zh: '新娘親戚區（第 8 桌）', en: "Bride's Relatives (Table 8)" },
      zone: { zh: '主廳中左側 · 新娘親戚（主桌左側）', en: "Main Hall Center-Left · Bride's Relatives" },
      guests: [
        { zh: '傅宥錡', en: '傅宥錡' },
        { zh: '傅裕耀', en: '傅裕耀' },
        { zh: '徐佩祺', en: '徐佩祺' },
        { zh: '傅煦幃', en: '傅煦幃' },
        { zh: '傅詩晴', en: '傅詩晴' },
        { zh: '張朝翔', en: '張朝翔' },
        { zh: '張耘睿', en: '張耘睿' },
        { zh: '張耘嫣', en: '張耘嫣' },
        { zh: '蔡沐桓', en: '蔡沐桓' },
        { zh: '蔡依宸', en: '蔡依宸' },
        { zh: '魏子皓', en: '魏子皓' },
      ],
    },
    {
      id: 'zone-groom-parents-friends',
      box: { x: 675, y: 192, w: 1116, h: 288 },
      color: '#4d7c0f',
      fillColor: 'rgba(101, 163, 13, 0.11)',
      darkColor: '#a3e635',
      darkFillColor: 'rgba(163, 230, 53, 0.15)',
      debugStats: { headcount: 73, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎爸媽朋友區（第 1–6 桌）', en: "Groom's Parents' Friends (Tables 1–6)" },
      zone: { zh: '主廳上方 · 新郎爸媽朋友', en: "Main Hall North · Groom's Parents' Friends" },
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
        { zh: '林緯謙等二人', en: '林緯謙 (2)' },
        { zh: '陳兆伸', en: '陳兆伸' },
        { zh: '吳逸楓', en: '吳逸楓' },
        { zh: '廖美鸞', en: '廖美鸞' },
        { zh: '梁光華&韋雪華等二人', en: '梁光華 & 韋雪華 (2)' },
        { zh: '嚴惠英', en: '嚴惠英' },
        { zh: '林光男', en: '林光男' },
        { zh: '曾智聰', en: '曾智聰' },
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
        { zh: '張榮欽', en: '張榮欽' },
      ],
      seatPlan: {
        subTables: [
          {
            title: { zh: '第 1 桌（最左）', en: 'Table 1 (Far Left)' },
            leftX: 699,
            rightX: 811,
            rowYs: [224, 267, 310, 363, 406, 449, 490],
            rows: [
              [
                { key: '梁光華_韋雪華', zh: '梁光華', en: '梁光華', match: '梁光華 韋雪華' },
                { key: '嚴惠英', zh: '嚴惠英', en: '嚴惠英', match: '嚴惠英' },
              ],
              [
                { key: '林光男', zh: '林光男', en: '林光男', match: '林光男' },
                { key: '梁光華_韋雪華', zh: '韋雪華', en: '韋雪華', match: '梁光華 韋雪華' },
              ],
              [
                { key: '吳淑芸', zh: '吳淑芸', en: '吳淑芸', match: '吳淑芸' },
                { key: '林本芬', zh: '林本芬', en: '林本芬', match: '林本芬' },
              ],
              [
                { key: '楊文', zh: '楊文', en: '楊文', match: '楊文' },
                { key: '劉東皋', zh: '劉東皋', en: '劉東皋', match: '劉東皋' },
              ],
              [
                { key: '曾智聰', zh: '曾智聰', en: '曾智聰', match: '曾智聰' },
                { key: '廖惠生_林碧華', zh: '廖惠生', en: '廖惠生', match: '廖惠生 林碧華 碧華' },
              ],
              [
                { key: '夏正德', zh: '夏正德', en: '夏正德', match: '夏正德' },
                { key: '廖惠生_林碧華', zh: '林碧華', en: '林碧華', match: '廖惠生 林碧華 碧華' },
              ],
              [
                { key: '張榮欽', zh: '張榮欽', en: '張榮欽', match: '張榮欽' },
                null,
              ],
            ],
          },
          {
            title: { zh: '第 2 桌', en: 'Table 2' },
            leftX: 890,
            rightX: 1001,
            rowYs: [224, 267, 310, 363, 406, 449],
            rows: [
              [
                { key: '龔紹興_嬉吟', zh: '龔紹興', en: '龔紹興', match: '龔紹興 嬉吟' },
                { key: '龔紹興_嬉吟', zh: '嬉吟', en: '嬉吟', match: '龔紹興 嬉吟' },
              ],
              [
                { key: '陳溍源_倪琦懿', zh: '陳溍源', en: '陳溍源', match: '陳溍源 倪琦懿' },
                { key: '陳溍源_倪琦懿', zh: '倪琦懿', en: '倪琦懿', match: '陳溍源 倪琦懿' },
              ],
              [
                { key: '鄭瑋玲', zh: '鄭瑋玲', en: '鄭瑋玲', match: '鄭瑋玲' },
                { key: '林澔儒', zh: '林澔儒', en: '林澔儒', match: '林澔儒' },
              ],
              [
                { key: '陳裕珍', zh: '陳裕珍', en: '陳裕珍', match: '陳裕珍' },
                { key: '林鳳姿', zh: '林鳳姿', en: '林鳳姿', match: '林鳳姿' },
              ],
              [
                { key: '許惠珍', zh: '許惠珍', en: '許惠珍', match: '許惠珍' },
                { key: '張愛卿', zh: '張愛卿', en: '張愛卿', match: '張愛卿' },
              ],
              [
                { key: '李旻貞', zh: '李旻貞', en: '李旻貞', match: '李旻貞' },
                { key: '許家彰', zh: '許家彰', en: '許家彰', match: '許家彰' },
              ],
            ],
          },
          {
            title: { zh: '第 3 桌', en: 'Table 3' },
            leftX: 1084,
            rightX: 1194,
            rowYs: [224, 267, 310, 363, 406, 449],
            rows: [
              [
                { key: '王仲瑛_蘇超瑋', zh: '蘇超瑋', en: '蘇超瑋', match: '王仲瑛 蘇超瑋' },
                { key: '王仲瑛_蘇超瑋', zh: '王仲瑛', en: '王仲瑛', match: '王仲瑛 蘇超瑋' },
              ],
              [
                { key: '李素幸', zh: '李素幸', en: '李素幸', match: '李素幸' },
                { key: '呂淑貞', zh: '呂淑貞', en: '呂淑貞', match: '呂淑貞' },
              ],
              [
                { key: '廖美鸞', zh: '廖美鸞', en: '廖美鸞', match: '廖美鸞' },
                { key: '黃寶瑛', zh: '黃寶瑛', en: '黃寶瑛', match: '黃寶瑛' },
              ],
              [
                { key: '高栢鈴_邱慧文', zh: '高栢鈴', en: '高栢鈴', match: '高栢鈴 邱慧文' },
                { key: '高栢鈴_邱慧文', zh: '邱慧文', en: '邱慧文', match: '高栢鈴 邱慧文' },
              ],
              [
                { key: '鄭能達_汪美雲', zh: '鄭能達', en: '鄭能達', match: '鄭能達 汪美雲' },
                { key: '鄭能達_汪美雲', zh: '汪美雲', en: '汪美雲', match: '鄭能達 汪美雲' },
              ],
              [
                { key: '劉聰明_陳秋娥', zh: '劉聰明', en: '劉聰明', match: '劉聰明 陳秋娥' },
                { key: '劉聰明_陳秋娥', zh: '陳秋娥', en: '陳秋娥', match: '劉聰明 陳秋娥' },
              ],
            ],
          },
          {
            title: { zh: '第 4 桌', en: 'Table 4' },
            leftX: 1267,
            rightX: 1384,
            rowYs: [224, 267, 310, 363, 406, 449],
            rows: [
              [
                { key: '吳逸楓', zh: '吳逸楓', en: '吳逸楓', match: '吳逸楓' },
                { key: '蕭培元', zh: '蕭培元', en: '蕭培元', match: '蕭培元' },
              ],
              [
                { key: '高增堯_張淑貞', zh: '高增堯', en: '高增堯', match: '高增堯 張淑貞' },
                { key: '高增堯_張淑貞', zh: '張淑貞', en: '張淑貞', match: '高增堯 張淑貞' },
              ],
              [
                { key: '劉子經_林貞吟', zh: '劉子經', en: '劉子經', match: '劉子經 林貞吟' },
                { key: '劉子經_林貞吟', zh: '林貞吟', en: '林貞吟', match: '劉子經 林貞吟' },
              ],
              [
                { key: '林緯謙_林學濬', zh: '林瑋謙', en: '林瑋謙', match: '林瑋謙 林緯謙 林學濬' },
                { key: '林緯謙_林學濬', zh: '林學濬', en: '林學濬', match: '林瑋謙 林緯謙 林學濬' },
              ],
              [
                { key: '陳兆伸', zh: '陳兆伸', en: '陳兆伸', match: '陳兆伸' },
                { key: '夏智弘', zh: '夏智弘', en: '夏智弘', match: '夏智弘' },
              ],
              [
                { key: '何義夫', zh: '何義夫', en: '何義夫', match: '何義夫 何毅夫' },
                { key: '何義夫', zh: '何義夫', en: '何義夫', match: '何義夫 何毅夫' },
              ],
            ],
          },
          {
            title: { zh: '第 5 桌', en: 'Table 5' },
            leftX: 1463,
            rightX: 1574,
            rowYs: [224, 267, 310, 363, 406, 449],
            rows: [
              [
                { key: '楊哲彰_余鳳琴', zh: '楊哲彰', en: '楊哲彰', match: '楊哲彰 余鳳琴' },
                { key: '楊演松_何麗郁', zh: '楊演松', en: '楊演松', match: '楊演松 何麗郁' },
              ],
              [
                { key: '楊哲彰_余鳳琴', zh: '余鳳琴', en: '余鳳琴', match: '楊哲彰 余鳳琴' },
                { key: '楊演松_何麗郁', zh: '何麗郁', en: '何麗郁', match: '楊演松 何麗郁' },
              ],
              [
                { key: '楊恕銘_林明珠', zh: '楊恕銘', en: '楊恕銘', match: '楊恕銘 林明珠' },
                { key: '陳晉輝_葛蘭芳', zh: '陳晉輝', en: '陳晉輝', match: '陳晉輝 葛蘭芳' },
              ],
              [
                { key: '楊恕銘_林明珠', zh: '林明珠', en: '林明珠', match: '楊恕銘 林明珠' },
                { key: '陳晉輝_葛蘭芳', zh: '葛蘭芳', en: '葛蘭芳', match: '陳晉輝 葛蘭芳' },
              ],
              [
                { key: '許少荃_陳紫雲', zh: '許少荃', en: '許少荃', match: '許少荃 陳紫雲' },
                { key: '劉園德_張金鳳', zh: '劉園德', en: '劉園德', match: '劉園德 張金鳳' },
              ],
              [
                { key: '許少荃_陳紫雲', zh: '陳紫雲', en: '陳紫雲', match: '許少荃 陳紫雲' },
                { key: '劉園德_張金鳳', zh: '張金鳳', en: '張金鳳', match: '劉園德 張金鳳' },
              ],
            ],
          },
          {
            title: { zh: '第 6 桌（最右）', en: 'Table 6 (Far Right)' },
            leftX: 1655,
            rightX: 1766,
            rowYs: [224, 267, 310, 363, 406, 449],
            rows: [
              [
                { key: '許天和_陳聞禮', zh: '許天和', en: '許天和', match: '許天和 陳聞禮' },
                { key: '黃棟樑_龔淑惠', zh: '黃棟樑', en: '黃棟樑', match: '黃棟樑 龔淑惠' },
              ],
              [
                { key: '許天和_陳聞禮', zh: '陳聞禮', en: '陳聞禮', match: '許天和 陳聞禮' },
                { key: '黃棟樑_龔淑惠', zh: '龔淑惠', en: '龔淑惠', match: '黃棟樑 龔淑惠' },
              ],
              [
                { key: '邱文德_蔡瑞娥', zh: '邱文德', en: '邱文德', match: '邱文德 蔡瑞娥' },
                { key: '洪世昌_連瑞怜', zh: '洪世昌', en: '洪世昌', match: '洪世昌 連瑞怜' },
              ],
              [
                { key: '邱文德_蔡瑞娥', zh: '蔡瑞娥', en: '蔡瑞娥', match: '邱文德 蔡瑞娥' },
                { key: '洪世昌_連瑞怜', zh: '連瑞怜', en: '連瑞怜', match: '洪世昌 連瑞怜' },
              ],
              [
                { key: '梁志遠_丘梅琪', zh: '梁志遠', en: '梁志遠', match: '梁志遠 丘梅琪' },
                { key: '康裕傑_邱美森', zh: '康裕傑', en: '康裕傑', match: '康裕傑 邱美森' },
              ],
              [
                { key: '梁志遠_丘梅琪', zh: '丘梅琪', en: '丘梅琪', match: '梁志遠 丘梅琪' },
                { key: '康裕傑_邱美森', zh: '邱美森', en: '邱美森', match: '康裕傑 邱美森' },
              ],
            ],
          },
        ],
      },
    },
    {
      id: 'zone-groom-dad-relatives',
      box: { x: 533, y: 812, w: 162, h: 322 },
      color: '#b45309',
      fillColor: 'rgba(180, 83, 9, 0.12)',
      darkColor: '#f59e0b',
      darkFillColor: 'rgba(245, 158, 11, 0.16)',
      debugStats: { headcount: 11, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎爸爸親戚區 · 董家（第 7 桌）', en: "Groom's Father's Relatives · Tung (Table 7)" },
      zone: { zh: '主廳左側 · 董家親戚（鄰近左側取餐區）', en: 'Main Hall Left · Tung Family Relatives' },
      guests: [
        { zh: '董素芬', en: '董素芬' },
        { zh: '董素真', en: '董素真' },
        { zh: '陳建和', en: '陳建和' },
        { zh: '洪連統', en: '洪連統' },
        { zh: '洪瑞隆等二人', en: '洪瑞隆 (2)' },
        { zh: '陳思樺等二人', en: '陳思樺 (2)' },
        { zh: '洪鶴祐', en: '洪鶴祐' },
        { zh: '陳怡玲', en: '陳怡玲' },
        { zh: '陳振揚', en: '陳振揚' },
      ],
      seatPlan: {
        leftX: 557,
        rightX: 671,
        rowYs: [844, 896, 946, 998, 1052, 1104],
        rows: [
          [
            { key: '董素芬_陳建和', zh: '董素芬', en: '董素芬', match: '董素芬 陳建和' },
            { key: '董素真_洪連統', zh: '董素真', en: '董素真', match: '董素真 洪連統' },
          ],
          [
            { key: '董素芬_陳建和', zh: '陳建和', en: '陳建和', match: '董素芬 陳建和' },
            { key: '董素真_洪連統', zh: '洪連統', en: '洪連統', match: '董素真 洪連統' },
          ],
          [
            { key: '洪鶴祐', zh: '洪鶴祐', en: '洪鶴祐', match: '洪鶴祐' },
            { key: '洪瑞隆', zh: '洪瑞隆', en: '洪瑞隆', match: '洪瑞隆' },
          ],
          [
            { key: '陳思樺', zh: '陳思樺', en: '陳思樺', match: '陳思樺' },
            { key: '洪瑞隆', zh: '洪瑞隆', en: '洪瑞隆', match: '洪瑞隆' },
          ],
          [
            { key: '陳思樺', zh: '陳思樺', en: '陳思樺', match: '陳思樺' },
            { key: '陳怡玲', zh: '陳怡玲', en: '陳怡玲', match: '陳怡玲' },
          ],
          [
            { key: '陳振揚', zh: '陳振揚', en: '陳振揚', match: '陳振揚' },
            null,
          ],
        ],
      },
    },
    {
      id: 'zone-groom-mom-relatives',
      box: { x: 1422, y: 696, w: 368, h: 516 },
      color: '#059669',
      fillColor: 'rgba(5, 150, 105, 0.12)',
      darkColor: '#34d399',
      darkFillColor: 'rgba(52, 211, 153, 0.16)',
      debugStats: { headcount: 31, veg: 1, stroller: 0, childSeat: 1, detail: '徐玲明：素食1；卓鈞恩：兒童椅1' },
      name: { zh: '新郎媽媽親戚區 · 徐家（第 9–10 桌）', en: "Groom's Mother's Relatives · Hsu (Tables 9–10)" },
      zone: { zh: '主廳右側 · 徐家親戚', en: 'Main Hall Right · Hsu Family Relatives' },
      guests: [
        { zh: '徐玲明等五人', en: '徐玲明 (5)' },
        { zh: '徐和志、許嵐音等二人', en: '徐和志 & 許嵐音 (2)' },
        { zh: '徐平志', en: '徐平志' },
        { zh: '林哲正', en: '林哲正' },
        { zh: '徐慧明', en: '徐慧明' },
        { zh: '徐宇光等二人', en: '徐宇光 (2)' },
        { zh: '徐明志等五人', en: '徐明志 (5)' },
        { zh: '陳啟武等二人', en: '陳啟武 (2)' },
        { zh: '徐宇志等三人', en: '徐宇志 (3)' },
        { zh: '徐雪櫻等二人', en: '徐雪櫻 (2)' },
        { zh: '王欣凱 Michael等二人', en: '王欣凱 & Michael (2)' },
        { zh: 'Roxy', en: 'Roxy' },
        { zh: '董智翔&陳哲雅等二人', en: '董智翔 & 陳哲雅 (2)' },
        { zh: '房滋寧&韓治瀾等二人', en: '房滋寧 & 韓治瀾 (2)' },
      ],
      seatPlan: {
        freeSeating: true,
        hideSeatGrid: true,
        subTables: [
          {
            freeSeating: true,
            title: { zh: '第 9 桌 · 徐家左桌', en: 'Table 9 · Hsu Left' },
            groupMatch: [
              '徐明志',
              '陳凱英',
              '徐平志',
              '徐慧明',
              '徐宇志',
              '羅芸',
              '徐和志',
              '許嵐音',
              '韓治瀾',
              '房滋寧',
              '徐宇光',
              '鍾燕玲',
              '徐若謙',
              '徐晨泰',
              '徐天泰',
              '睦哲',
              '徐乙芹',
            ],
            freeSeatingNote: {
              zh: '✨ 第 9 桌（徐家左桌）自由入座（共 16 席）',
              en: '✨ Open seating at Table 9 · Hsu Left (16 seats)',
            },
            leftX: 1446,
            rightX: 1558,
            rowYs: [725, 769, 811, 868, 910, 954, 1006, 1050],
            rows: [
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
              [{ zh: '徐家左桌', en: 'Hsu Left' }, { zh: '徐家左桌', en: 'Hsu Left' }],
            ],
          },
          {
            freeSeating: true,
            title: { zh: '第 10 桌 · 徐家右桌', en: 'Table 10 · Hsu Right' },
            groupMatch: [
              '徐玲明',
              '卓鈞恩',
              '卓辰陽',
              '如鴈',
              'Roxy',
              '卓恆毅',
              '林哲正',
              '王欣凱',
              '徐雪櫻',
              'Michael',
              '高瑞宏',
              '陳啟武',
              '杜文圓',
              '董智翔',
              '陳哲雅',
            ],
            freeSeatingNote: {
              zh: '✨ 第 10 桌（徐家右桌）自由入座（共 15 席）',
              en: '✨ Open seating at Table 10 · Hsu Right (15 seats)',
            },
            leftX: 1655,
            rightX: 1766,
            rowYs: [815, 857, 900, 957, 999, 1043, 1095, 1138, 1181],
            rows: [
              [{ zh: '徐家右桌', en: 'Hsu Right' }, null],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, null],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, null],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, { zh: '徐家右桌', en: 'Hsu Right' }],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, { zh: '徐家右桌', en: 'Hsu Right' }],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, { zh: '徐家右桌', en: 'Hsu Right' }],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, { zh: '徐家右桌', en: 'Hsu Right' }],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, { zh: '徐家右桌', en: 'Hsu Right' }],
              [{ zh: '徐家右桌', en: 'Hsu Right' }, { zh: '徐家右桌', en: 'Hsu Right' }],
            ],
          },
        ],
      },
    },
    {
      id: 'zone-groom-highschool',
      box: { x: 1126, y: 1584, w: 165, h: 473 },
      svgPath: 'M 1140 1584 H 1277 Q 1291 1584 1291 1598 V 1991 Q 1291 2005 1277 2005 H 1213 Q 1205 2005 1205 2013 V 2043 Q 1205 2057 1191 2057 H 1140 Q 1126 2057 1126 2043 V 1598 Q 1126 1584 1140 1584 Z',
      color: '#dc2626',
      fillColor: 'rgba(220, 38, 38, 0.12)',
      darkColor: '#f87171',
      darkFillColor: 'rgba(248, 113, 113, 0.16)',
      debugStats: { headcount: 17, veg: 0, stroller: 0, childSeat: 1, detail: '施傑耀：兒童椅1（大直區自由入座共 17 席：第 1–9 排，不需坐桌頭）' },
      name: { zh: '新郎高中區 · 大直（第 11 桌）', en: "Groom's High School · Dazhi (Table 11)" },
      zone: { zh: '外廳左列上方區 · 大直', en: 'Lower Hall Left Col · Upper (Dazhi HS)' },
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
        { zh: '林伯翰', en: '林伯翰' },
        { zh: '蔡宜達', en: '蔡宜達' },
        { zh: '何秉霖等二人', en: '何秉霖 (2)' },
      ],
      seatPlan: {
        freeSeating: true,
        freeSeatingNote: {
          zh: '✨ 大直區自由入座（共 17 席：第 1–8 排左右兩側＋第 9 排左側，不需坐桌頭）',
          en: '✨ Open seating in Dazhi zone (17 seats: Rows 1–8 both sides + Row 9 Left)',
        },
        leftX: 1150,
        rightX: 1267,
        rowYs: [1614, 1666, 1718, 1770, 1824, 1877, 1930, 1982, 2034],
        rows: [
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, { zh: '大直可入座', en: 'Available' }],
          [{ zh: '大直可入座', en: 'Available' }, null],
        ],
      },
    },
    {
      id: 'zone-groom-moz',
      box: { x: 1126, y: 2011, w: 165, h: 98 },
      svgPath: 'M 1226 2011 H 1277 Q 1291 2011 1291 2025 V 2095 Q 1291 2109 1277 2109 H 1140 Q 1126 2109 1126 2095 V 2077 Q 1126 2063 1140 2063 H 1204 Q 1212 2063 1212 2055 V 2025 Q 1212 2011 1226 2011 Z',
      color: '#0891b2',
      fillColor: 'rgba(8, 145, 178, 0.12)',
      darkColor: '#22d3ee',
      darkFillColor: 'rgba(34, 211, 238, 0.16)',
      debugStats: { headcount: 2, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎 MOZ 區 · 謀智（第 14 桌 · 上段）', en: 'Groom · MOZ / Mozilla (Table 14 · Upper)' },
      zone: { zh: '外廳左列中段區 · 謀智', en: 'Lower Hall Left Col · Middle (MOZ)' },
      guests: [
        { zh: 'Shawn Huang等二人', en: 'Shawn Huang (2)' },
      ],
      seatPlan: {
        freeSeating: true,
        freeSeatingNote: {
          zh: '✨ MOZ 區自由入座（2 位貴賓，第 9 排右側＋第 10 排共 3 席可任選並肩）',
          en: '✨ Open seating in MOZ zone (2 guests; 3 seats across Row 9 Right & Row 10)',
        },
        leftX: 1150,
        rightX: 1267,
        rowYs: [2034, 2086],
        rows: [
          [null, { zh: 'MOZ 可入座', en: 'Available' }],
          [{ zh: 'MOZ 可入座', en: 'Available' }, { zh: 'MOZ 可入座', en: 'Available' }],
        ],
      },
    },
    {
      id: 'zone-bride-colleagues',
      box: { x: 1126, y: 2115, w: 165, h: 211 },
      color: '#7c3aed',
      fillColor: 'rgba(124, 58, 237, 0.12)',
      darkColor: '#c084fc',
      darkFillColor: 'rgba(192, 132, 252, 0.16)',
      debugStats: { headcount: 7, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新娘同事區 · 瑪黑（第 14 桌 · 下段）', en: "Bride's Colleagues · Marais (Table 14 · Lower)" },
      zone: { zh: '外廳左列下方區 · 瑪黑', en: 'Lower Hall Left Col · Lower (Marais)' },
      guests: [
        { zh: '吳宥蓁', en: '吳宥蓁' },
        { zh: '余汶杰', en: '余汶杰' },
        { zh: '陳泰元', en: '陳泰元' },
        { zh: '金耘瑞等二人', en: '金耘瑞 (2)' },
        { zh: '張世瑤 Anny', en: '張世瑤 Anny' },
        { zh: '沈堉綺', en: '沈堉綺' },
      ],
      seatPlan: {
        freeSeating: true,
        freeSeatingNote: {
          zh: '✨ 瑪黑區自由入座（共 7 席）',
          en: '✨ Open seating in Marais zone (7 seats)',
        },
        leftX: 1150,
        rightX: 1267,
        rowYs: [2138, 2190, 2242, 2294],
        rows: [
          [{ zh: '瑪黑可入座', en: 'Available' }, { zh: '瑪黑可入座', en: 'Available' }],
          [{ zh: '瑪黑可入座', en: 'Available' }, { zh: '瑪黑可入座', en: 'Available' }],
          [{ zh: '瑪黑可入座', en: 'Available' }, { zh: '瑪黑可入座', en: 'Available' }],
          [{ zh: '瑪黑可入座', en: 'Available' }, null],
        ],
      },
    },
    {
      id: 'zone-groom-colleagues',
      box: { x: 1404, y: 1608, w: 162, h: 716 },
      color: '#ea580c',
      fillColor: 'rgba(234, 88, 12, 0.12)',
      darkColor: '#fb923c',
      darkFillColor: 'rgba(251, 146, 60, 0.16)',
      debugStats: { headcount: 23, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新郎同事區 · Google（第 12、15 桌）', en: "Groom's Colleagues · Google (Tables 12 & 15)" },
      zone: { zh: '外廳中列長桌區 · Google', en: 'Lower Hall Center Col · Google' },
      guests: [
        { zh: 'Rock Tsai', en: 'Rock Tsai' },
        { zh: '查忠敏 (Jasmine Cha)等四人', en: '查忠敏 (Jasmine Cha) (4)' },
        { zh: 'Mark Chu', en: 'Mark Chu' },
        { zh: 'Andy Sun (孫銘鴻)等四人', en: 'Andy Sun (孫銘鴻) (4)' },
        { zh: 'Harry Lu', en: 'Harry Lu' },
        { zh: 'Medicine Yeh', en: 'Medicine Yeh' },
        { zh: '賴豊彰 (Alex Lai)', en: '賴豊彰 (Alex Lai)' },
        { zh: '張均銘 (Jimmy Chang)等二人', en: '張均銘 (Jimmy Chang) (2)' },
        { zh: '王廷睿 (Terry Wang)', en: '王廷睿 (Terry Wang)' },
        { zh: 'Ray Li', en: 'Ray Li' },
        { zh: 'ANH PHAN等二人', en: 'ANH PHAN (2)' },
        { zh: '葛家聿', en: '葛家聿' },
        { zh: '沈昊平(Michael Shen/gpgpgp)等二人', en: '沈昊平(Michael Shen/gpgpgp) (2)' },
        { zh: 'Leo Tu', en: 'Leo Tu' },
      ],
      seatPlan: {
        freeSeating: true,
        hideSeatGrid: true,
        subTables: [
          {
            freeSeating: true,
            title: { zh: '第 12 桌 · Google 上桌', en: 'Table 12 · Google Upper' },
            groupMatch: ['查忠敏', 'jasmine', 'andy', '孫銘鴻', '賴豊彰', 'alex lai', 'harry', 'leo', '王廷睿', 'terry'],
            freeSeatingNote: {
              zh: '✨ Google 上桌自由入座（共 12 席）',
              en: '✨ Open seating at Google Upper Table (12 seats)',
            },
            leftX: 1428,
            rightX: 1541,
            rowYs: [1636, 1689, 1741, 1795, 1846, 1898],
            rows: [
              [{ zh: 'Google 上桌', en: 'Upper Table' }, { zh: 'Google 上桌', en: 'Upper Table' }],
              [{ zh: 'Google 上桌', en: 'Upper Table' }, { zh: 'Google 上桌', en: 'Upper Table' }],
              [{ zh: 'Google 上桌', en: 'Upper Table' }, { zh: 'Google 上桌', en: 'Upper Table' }],
              [{ zh: 'Google 上桌', en: 'Upper Table' }, { zh: 'Google 上桌', en: 'Upper Table' }],
              [{ zh: 'Google 上桌', en: 'Upper Table' }, { zh: 'Google 上桌', en: 'Upper Table' }],
              [{ zh: 'Google 上桌', en: 'Upper Table' }, { zh: 'Google 上桌', en: 'Upper Table' }],
            ],
          },
          {
            freeSeating: true,
            title: { zh: '第 15 桌 · Google 下桌', en: 'Table 15 · Google Lower' },
            groupMatch: ['rock', 'anh', '張均銘', 'jimmy chang', '沈昊平', 'michael', 'gpgpgp', 'medicine', 'ray', 'mark', '葛家聿'],
            freeSeatingNote: {
              zh: '✨ Google 下桌自由入座（共 11 席）',
              en: '✨ Open seating at Google Lower Table (11 seats)',
            },
            leftX: 1428,
            rightX: 1541,
            rowYs: [2032, 2084, 2137, 2190, 2242, 2294],
            rows: [
              [{ zh: 'Google 下桌', en: 'Lower Table' }, { zh: 'Google 下桌', en: 'Lower Table' }],
              [{ zh: 'Google 下桌', en: 'Lower Table' }, { zh: 'Google 下桌', en: 'Lower Table' }],
              [{ zh: 'Google 下桌', en: 'Lower Table' }, { zh: 'Google 下桌', en: 'Lower Table' }],
              [{ zh: 'Google 下桌', en: 'Lower Table' }, { zh: 'Google 下桌', en: 'Lower Table' }],
              [{ zh: 'Google 下桌', en: 'Lower Table' }, { zh: 'Google 下桌', en: 'Lower Table' }],
              [null, { zh: 'Google 下桌', en: 'Lower Table' }],
            ],
          },
        ],
      },
    },
    {
      id: 'zone-groom-nctu',
      box: { x: 1630, y: 1608, w: 162, h: 320 },
      color: '#ca8a04',
      fillColor: 'rgba(234, 179, 8, 0.13)',
      darkColor: '#fde047',
      darkFillColor: 'rgba(253, 224, 71, 0.16)',
      debugStats: { headcount: 12, veg: 0, stroller: 1, childSeat: 1, detail: '林煜峯：嬰兒車1、兒童椅1' },
      name: { zh: '新郎交大區 · 交大（第 13 桌）', en: "Groom's College · NCTU (Table 13)" },
      zone: { zh: '外廳右列上方區 · 交大', en: 'Lower Hall Right Col · Upper (NCTU)' },
      guests: [
        { zh: 'Allan Sun', en: 'Allan Sun' },
        { zh: '葉峻宇', en: '葉峻宇' },
        { zh: '林煜峯等四人', en: '林煜峯 (4)' },
        { zh: 'KJ Liu (劉凱傑)等二人', en: 'KJ Liu (劉凱傑) (2)' },
        { zh: '張家瑋', en: '張家瑋' },
        { zh: '褚祐任等二人', en: '褚祐任 (2)' },
        { zh: '黃柏翰', en: '黃柏翰' },
      ],
    },
    {
      id: 'zone-bride-highschool',
      box: { x: 1630, y: 1966, w: 162, h: 160 },
      color: '#2563eb',
      fillColor: 'rgba(37, 99, 235, 0.12)',
      darkColor: '#60a5fa',
      darkFillColor: 'rgba(96, 165, 250, 0.16)',
      debugStats: { headcount: 5, veg: 1, stroller: 0, childSeat: 0, detail: '王淑菁：素食1' },
      name: { zh: '新娘高中區 · 雄女（第 16 桌）', en: "Bride's High School · KGHS (Table 16)" },
      zone: { zh: '外廳右列中段區 · 雄女', en: 'Lower Hall Right Col · Middle (KGHS)' },
      guests: [
        { zh: '張恬恬', en: '張恬恬' },
        { zh: '林佳儒等二人', en: '林佳儒 (2)' },
        { zh: '張辰', en: '張辰' },
        { zh: '王淑菁', en: '王淑菁' },
      ],
    },
    {
      id: 'zone-bride-college',
      box: { x: 1630, y: 2164, w: 162, h: 160 },
      color: '#db2777',
      fillColor: 'rgba(219, 39, 119, 0.12)',
      darkColor: '#f472b6',
      darkFillColor: 'rgba(244, 114, 182, 0.16)',
      debugStats: { headcount: 6, veg: 0, stroller: 0, childSeat: 0 },
      name: { zh: '新娘大學區 · 北藝（第 17 桌）', en: "Bride's College · TNUA (Table 17)" },
      zone: { zh: '外廳右列下方區 · 北藝', en: 'Lower Hall Right Col · Lower (TNUA)' },
      guests: [
        { zh: '陳品心', en: '陳品心' },
        { zh: '雷廷萱', en: '雷廷萱' },
        { zh: '戴嘉謙', en: '戴嘉謙' },
        { zh: '黃采逸等二人', en: '黃采逸 (2)' },
        { zh: 'Yalan Chang', en: 'Yalan Chang' },
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
      tom: { lat: 24.787, lng: 120.997, city: { zh: '新竹交大／台北', en: 'Hsinchu NCTU / Taipei' } },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '台北北藝大／高雄', en: 'Taipei TNUA / Kaohsiung' } },
      lat: 24.787,
      lng: 120.997,
      place: {
        zh: '2014.01–02 · 新竹交大 ↔ 台北北藝大',
        en: 'Jan–Feb 2014 · Hsinchu NCTU ↔ Taipei TNUA',
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
      tom: { lat: 25.033, lng: 121.565, city: { zh: '台北', en: 'Taipei' } },
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
      dateTag: '2016.06–07',
      tom: {
        lat: 25.033,
        lng: 121.565,
        via: { lat: 25.204, lng: 55.27 },
        city: { zh: '經杜拜 ➔ 返抵台北', en: 'Via Dubai ➔ Back in Taipei' },
      },
      eunice: { lat: 22.627, lng: 120.301, city: { zh: '高雄 Kaohsiung', en: 'Kaohsiung' } },
      lat: 25.033,
      lng: 121.565,
      place: {
        zh: '2016.06–07 · 倫敦出差返台：台北 ↔ 高雄',
        en: 'Jun–Jul 2016 · Back From London: Taipei ↔ Kaohsiung',
      },
      distanceLabel: { zh: '300 km · 台北 ↔ 高雄', en: '300 km · Taipei ↔ Kaohsiung' },
      desc: {
        zh: '結束倫敦出差經杜拜飛回台北短暫歇腳，整理好行李很快又準備再出發。',
        en: 'Returned via Dubai to Taipei for a brief breather before packing up for the next trip across the Pacific.',
      },
      mapQuery: 'Taipei,Taiwan',
    },
    {
      year: '2016',
      dateTag: '2016.07',
      tom: {
        lat: 43.653,
        lng: 280.617,
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
        city: { zh: '倫敦＆諾丁漢 ➔ 住柏林', en: 'London/Nottingham ➔ Berlin' },
      },
      eunice: {
        lat: 52.955,
        lng: -1.158,
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
      tom: {
        lat: 50.075,
        lng: 14.437,
        via: { lat: 52.52, lng: 13.405 },
        city: { zh: '柏林 ➔ 捷克布拉格', en: 'Berlin ➔ Prague' },
      },
      eunice: {
        lat: 50.075,
        lng: 14.437,
        via: { lat: 52.955, lng: -1.158 },
        city: { zh: '諾丁漢 ➔ 柏林＆布拉格', en: 'Nottingham ➔ Berlin & Prague' },
      },
      lat: 50.075,
      lng: 14.437,
      place: {
        zh: '2019.12 · 先回諾丁漢再飛柏林 · 捷克布拉格聖誕市集',
        en: 'Dec 2019 · Back to Nottingham, Then Berlin & Prague Christmas Markets',
      },
      distanceLabel: { zh: '0 km · 柏林＆布拉格聖誕月 💕', en: '0 km · December in Berlin & Prague 💕' },
      desc: {
        zh: '十二月 Eunice 先回諾丁漢再飛來柏林，兩個人一起搭車去捷克布拉格逛聖誕市集、喝熱紅酒。',
        en: 'After returning to Nottingham, Eunice flew to Berlin in December and together we wandered through fairytale Christmas lights in Prague.',
      },
      mapQuery: 'Prague,Czechia',
    },
    {
      year: '2020',
      dateTag: '2020.02',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林 Berlin', en: 'Berlin, DE' } },
      eunice: {
        lat: 52.52,
        lng: 13.405,
        via: { lat: 52.955, lng: -1.158 },
        city: { zh: '諾丁漢 ➔ 柏林相聚', en: 'Nottingham ➔ Berlin' },
      },
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
      dateTag: '2020.03',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林 Berlin', en: 'Berlin, DE' } },
      eunice: { lat: 52.955, lng: -1.158, city: { zh: '英國諾丁漢 Nottingham', en: 'Nottingham, UK' } },
      lat: 52.955,
      lng: -1.158,
      place: {
        zh: '2020.03 · 歐洲疫情封城 · 柏林 ↔ 諾丁漢',
        en: 'Mar 2020 · European Lockdown · Berlin ↔ Nottingham',
      },
      distanceLabel: { zh: '920 km · 柏林 ↔ 諾丁漢', en: '920 km · Berlin ↔ Nottingham' },
      desc: {
        zh: '三月歐洲遇上疫情封城，各自守在柏林與諾丁漢，每天視訊確認彼此一切平安。',
        en: 'As lockdowns swept Europe in March, we stayed safe in Berlin and Nottingham, checking in on video calls every day.',
      },
      mapQuery: 'Nottingham,UK',
    },
    {
      year: '2020',
      dateTag: '2020.03–04',
      tom: { lat: 52.52, lng: 13.405, city: { zh: '德國柏林 Berlin', en: 'Berlin, DE' } },
      eunice: {
        lat: 22.627,
        lng: 120.301,
        via: { lat: 51.507, lng: -0.127 },
        city: { zh: '諾丁漢 ➔ 經倫敦返高雄', en: 'Nottingham ➔ Via London ➔ Kaohsiung' },
      },
      lat: 22.627,
      lng: 120.301,
      place: {
        zh: '2020.03–04 · 歐洲封城時刻 · Eunice 從諾丁漢經倫敦飛回高雄',
        en: 'Mar–Apr 2020 · Eunice Flew From Nottingham via London to Kaohsiung',
      },
      distanceLabel: { zh: '9,100 km · 疫情裡的跨洲牽掛', en: '9,100 km · Holding Close Through Lockdown' },
      desc: {
        zh: '四月 Eunice 從諾丁漢搭車到倫敦平安飛回台灣高雄，與留在柏林的 Tom 隔海彼此牽掛守候。',
        en: 'In April, Eunice traveled from Nottingham via London safely home to Kaohsiung while Tom remained in Berlin.',
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
  const STORAGE_KEY_LANG = 'wedding_20261129_lang';

  // DOM Elements
  const elDays = document.getElementById('val-days');
  const elHours = document.getElementById('val-hours');
  const elMinutes = document.getElementById('val-minutes');
  const elSeconds = document.getElementById('val-seconds');

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
  const btnTheme = document.getElementById('theme-btn');
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
  const elCountdownShuttleNotice = document.getElementById('countdown-shuttle-notice');
  const elCountdownShuttleMapLink = document.getElementById('countdown-shuttle-map-link');
  const elCountdownVenueNotice = document.getElementById('countdown-venue-notice');
  const elCountdownVenueMapLink = document.getElementById('countdown-venue-map-link');

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
  const elFootprintMapStage = document.getElementById('footprint-map-stage');
  const elTimelineVideoCanvas = document.getElementById('timeline-video-canvas');
  const btnTimelinePlay = document.getElementById('timeline-play-btn');
  const btnTimelinePrev = document.getElementById('timeline-prev-btn');
  const btnTimelineNext = document.getElementById('timeline-next-btn');
  const btnTimelineSpeed = document.getElementById('timeline-speed-btn');
  const btnTimelineReplay = document.getElementById('timeline-replay-btn');
  const btnTimelineBgm = document.getElementById('timeline-bgm-btn');
  const btnTimelineFullscreen = document.getElementById('timeline-fullscreen-btn');
  const elTimelineScrubberFill = document.getElementById('timeline-scrubber-fill');

  const FOOTPRINT_AVATAR_SRCS = {
    tom: 'photos/avatar-tom.jpg',
    eunice: 'photos/avatar-eunice.jpg',
  };
  const footprintAvatarImgs = {};
  Object.keys(FOOTPRINT_AVATAR_SRCS).forEach((role) => {
    const img = new Image();
    img.onload = () => {
      if (typeof drawTimelineVideoFrame === 'function' && typeof timelineProgress === 'number') {
        drawTimelineVideoFrame(timelineProgress);
      }
    };
    img.src = FOOTPRINT_AVATAR_SRCS[role];
    footprintAvatarImgs[role] = img;
  });

  function setFootprintStatsContent(el, text) {
    if (!el) return;
    el.textContent = '';
    const parts = String(text || '').split(/(🤵‍♂️|👰‍♀️)/gu);
    parts.forEach((part) => {
      if (part === '🤵‍♂️' || part === '👰‍♀️') {
        const isTom = part === '🤵‍♂️';
        const avatar = document.createElement('img');
        avatar.className = `footprint-avatar-icon ${isTom ? 'is-tom-inline' : 'is-eunice-inline'}`;
        avatar.src = FOOTPRINT_AVATAR_SRCS[isTom ? 'tom' : 'eunice'];
        avatar.alt = isTom ? 'Tom' : 'Eunice';
        el.append(avatar);
      } else if (part) {
        el.append(document.createTextNode(part));
      }
    });
  }

  function setFootprintRolePillContent(el, role, text) {
    if (!el) return;
    const isTom = role === 'tom';
    const cleanText = String(text || '').replace(/^(🤵‍♂️|👰‍♀️)\s*/u, '');
    el.textContent = '';
    const avatar = document.createElement('img');
    avatar.className = 'footprint-avatar-icon';
    avatar.src = FOOTPRINT_AVATAR_SRCS[role];
    avatar.alt = isTom ? 'Tom' : 'Eunice';
    el.append(avatar, document.createTextNode(cleanText));
  }

  const elSeatingSection = document.getElementById('seating-section');
  const elSeatingPanelEyebrow = document.getElementById('seating-panel-eyebrow');
  const elSeatingPanelTitle = document.getElementById('seating-panel-title');
  const elSeatingExternalLink = document.getElementById('seating-external-link');
  const elSeatingSideLabel = document.getElementById('seating-side-label');
  const elSeatingSideSelect = document.getElementById('seating-side-select');
  const elSeatingGroupLabel = document.getElementById('seating-group-label');
  const elSeatingGroupSelect = document.getElementById('seating-group-select');
  const elSeatingSearchInput = document.getElementById('seating-search-input');
  const elSeatingAutocompleteList = document.getElementById('seating-autocomplete-list');
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
  const elMediaSoundNotice = document.getElementById('media-sound-notice');
  const elMediaFrameWrap = document.getElementById('media-frame-wrap');

  // Quiz Elements
  const elQuizSection = document.getElementById('quiz-section');
  const elQuizIntroView = document.getElementById('quiz-intro-view');
  const elQuizHighscoreForm = document.getElementById('quiz-highscore-form');
  const elQuizPlayerNameLabel = document.getElementById('quiz-player-name-label');
  const elQuizPlayerNameInput = document.getElementById('quiz-player-name-input');
  const btnQuizHighscoreSubmit = document.getElementById('quiz-highscore-submit-btn');
  const elQuizPlayerNameError = document.getElementById('quiz-player-name-error');
  const elQuizSubmitStatus = document.getElementById('quiz-submit-status');
  const elPasscodeRedeemCard = document.getElementById('passcode-redeem-card');
  const elPasscodeCardEyebrow = document.getElementById('passcode-card-eyebrow');
  const elPasscodeCardTitle = document.getElementById('passcode-card-title');
  const elPasscodeCardDesc = document.getElementById('passcode-card-desc');
  const elPasscodeRedeemForm = document.getElementById('passcode-redeem-form');
  const elPasscodeNameInput = document.getElementById('passcode-name-input');
  const elPasscodeCodeInput = document.getElementById('passcode-code-input');
  const btnPasscodeVerify = document.getElementById('passcode-verify-btn');
  const elPasscodeFeedback = document.getElementById('passcode-feedback');
  const elQuizIntroEyebrow = document.getElementById('quiz-intro-eyebrow');
  const elQuizIntroTitle = document.getElementById('quiz-intro-title');
  const elQuizIntroDesc = document.getElementById('quiz-intro-desc');
  const elQuizIntroTiers = document.getElementById('quiz-intro-tiers');
  const btnQuizStart = document.getElementById('quiz-start-btn');
  const elQuizQuestionView = document.getElementById('quiz-question-view');
  const elQuizSummaryView = document.getElementById('quiz-summary-view');
  const elQuizProgressText = document.getElementById('quiz-progress-text');
  const elQuizScoreBadge = document.getElementById('quiz-score-badge');
  const elQuizProgressFill = document.getElementById('quiz-progress-fill');
  const elQuizQuestionTitle = document.getElementById('quiz-question-title');
  const elQuizCodeBlock = document.getElementById('quiz-code-block');
  const elQuizCodeContent = document.getElementById('quiz-code-content');
  const elQuizOptionsList = document.getElementById('quiz-options-list');
  const elQuizSubmitWrap = document.getElementById('quiz-submit-wrap');
  const btnQuizSubmit = document.getElementById('quiz-submit-btn');
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
  const elHpCipherSpellBtn = document.getElementById('hp-cipher-spell-btn');
  const elHpCipherClue = document.getElementById('hp-cipher-clue');

  const SUMMARY_HINT_VECTORS = [
    161, 92, 131, 203, 134, 164, 198, 239, 13, 230, 176, 151, 158, 132, 214, 246,
    202, 150, 45, 176, 70, 74, 90, 190, 85, 97, 5, 65, 10,
  ];

  const SUMMARY_SEAL_VECTORS = [
    7, 194, 53, 81, 191, 0, 41, 3, 188, 74, 18, 92, 127, 202, 98, 124, 11, 127, 162, 251, 64, 107, 170, 92, 228, 212, 115, 89, 24, 182, 105, 247, 142,
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
  let isTimeUp = false;
  let renderedMediaKey = '';

  function isDebugUnlocked() {
    return Boolean(window.__TE_DEBUG_AUTH__ === true || window.__TE_STAFF_AUTH__ === true);
  }
  let seatingNeedsFilter = 'all';
  let seatingSideFilter = 'all';
  let seatingGroupFilter = 'all';
  let seatingAutocompleteItems = [];
  let seatingAutocompleteIndex = -1;

  const SEATING_ZONE_META = {
    'table-main': { sides: ['groom', 'bride'], groups: ['parents', 'dad', 'mom', 'bride-family'] },
    'zone-bride-relatives': { sides: ['bride'], groups: ['parents', 'bride-family'] },
    'zone-groom-parents-friends': { sides: ['groom'], groups: ['parents', 'parents-friends'] },
    'zone-groom-dad-relatives': { sides: ['groom'], groups: ['parents', 'dad'] },
    'zone-groom-mom-relatives': { sides: ['groom'], groups: ['parents', 'mom'] },
    'zone-groom-highschool': { sides: ['groom'], groups: ['friends'] },
    'zone-bride-highschool': { sides: ['bride'], groups: ['friends'] },
    'zone-bride-colleagues': { sides: ['bride'], groups: ['friends'] },
    'zone-groom-colleagues': { sides: ['groom'], groups: ['friends'] },
    'zone-groom-nctu': { sides: ['groom'], groups: ['friends'] },
    'zone-groom-moz': { sides: ['groom'], groups: ['friends'] },
    'zone-bride-college': { sides: ['bride'], groups: ['friends'] },
  };

  function matchesSeatingSideAndGroup(tableId) {
    const meta = SEATING_ZONE_META[tableId];
    if (!meta) return true;
    if (seatingSideFilter !== 'all' && !meta.sides.includes(seatingSideFilter)) {
      return false;
    }
    if (seatingGroupFilter !== 'all' && !meta.groups.includes(seatingGroupFilter)) {
      return false;
    }
    return true;
  }

  function syncSeatingFilterSelects() {
    if (elSeatingSideLabel) {
      elSeatingSideLabel.textContent = currentLang === 'en' ? "Groom's / Bride's Side" : '男方 / 女方';
    }
    if (elSeatingGroupLabel) {
      elSeatingGroupLabel.textContent = currentLang === 'en' ? 'Parents / Group' : '父母 / 親友分類';
    }
    if (elSeatingSideSelect) {
      const sideOpts =
        currentLang === 'en'
          ? [
              { value: 'all', label: 'All (Groom & Bride)' },
              { value: 'groom', label: "Groom's Side (Tom)" },
              { value: 'bride', label: "Bride's Side (Eunice)" },
            ]
          : [
              { value: 'all', label: '全部（男方＆女方）' },
              { value: 'groom', label: '男方（新郎 Tom）' },
              { value: 'bride', label: '女方（新娘 Eunice）' },
            ];
      elSeatingSideSelect.replaceChildren();
      sideOpts.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        elSeatingSideSelect.append(o);
      });
      elSeatingSideSelect.value = seatingSideFilter;
    }
    if (elSeatingGroupSelect) {
      let groupOpts;
      if (seatingSideFilter === 'groom') {
        groupOpts =
          currentLang === 'en'
            ? [
                { value: 'all', label: "All Groom's Guests" },
                { value: 'parents', label: 'Parents & All Relatives' },
                { value: 'parents-friends', label: "Parents' Friends" },
                { value: 'dad', label: "Father's Relatives (Tung)" },
                { value: 'mom', label: "Mother's Relatives (Hsu)" },
                { value: 'friends', label: "Groom's Friends & Colleagues" },
              ]
            : [
                { value: 'all', label: '全部男方賓客' },
                { value: 'parents', label: '父母親友（全部長輩＆親戚）' },
                { value: 'parents-friends', label: '爸媽朋友' },
                { value: 'dad', label: '爸爸親戚（董家）' },
                { value: 'mom', label: '媽媽親戚（徐家）' },
                { value: 'friends', label: '新郎朋友（大直／交大／Google／MOZ）' },
              ];
      } else if (seatingSideFilter === 'bride') {
        groupOpts =
          currentLang === 'en'
            ? [
                { value: 'all', label: "All Bride's Guests" },
                { value: 'parents', label: "Parents & Bride's Relatives" },
                { value: 'friends', label: "Bride's Friends & Colleagues" },
              ]
            : [
                { value: 'all', label: '全部女方賓客' },
                { value: 'parents', label: '父母親友（女方親戚）' },
                { value: 'friends', label: '新娘朋友（雄女／北藝／瑪黑）' },
              ];
      } else {
        groupOpts =
          currentLang === 'en'
            ? [
                { value: 'all', label: 'All Groups' },
                { value: 'parents', label: 'Parents & Relatives' },
                { value: 'friends', label: 'Friends & Colleagues' },
              ]
            : [
                { value: 'all', label: '全部親友' },
                { value: 'parents', label: '父母親友（長輩＆親戚）' },
                { value: 'friends', label: '新人朋友（同學＆同事）' },
              ];
      }
      const validValues = new Set(groupOpts.map((g) => g.value));
      if (!validValues.has(seatingGroupFilter)) {
        seatingGroupFilter = 'all';
      }
      elSeatingGroupSelect.replaceChildren();
      groupOpts.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        elSeatingGroupSelect.append(o);
      });
      elSeatingGroupSelect.value = seatingGroupFilter;
    }
  }

  function closeSeatingAutocomplete() {
    seatingAutocompleteItems = [];
    seatingAutocompleteIndex = -1;
    if (elSeatingAutocompleteList) {
      elSeatingAutocompleteList.classList.add('hidden');
      elSeatingAutocompleteList.replaceChildren();
    }
    if (elSeatingSearchInput) {
      elSeatingSearchInput.setAttribute('aria-expanded', 'false');
    }
  }

  function getSeatingAutocompleteCandidates(rawQuery) {
    const q = String(rawQuery || '').trim().toLowerCase();
    if (!q) return [];
    const results = [];
    const seen = new Set();

    const addCandidate = (displayName, insertValue, searchText, zoneLabel, tableId) => {
      const cleanDisplay = String(displayName || '').trim();
      const cleanInsert = String(insertValue || cleanDisplay).trim();
      if (!cleanDisplay) return;
      const dedupeKey = `${tableId}::${cleanInsert.toLowerCase()}`;
      if (seen.has(dedupeKey)) return;
      const hay = `${cleanDisplay} ${cleanInsert} ${searchText || ''}`.toLowerCase();
      if (!hay.includes(q)) return;
      seen.add(dedupeKey);
      const lowerName = cleanDisplay.toLowerCase();
      const score = lowerName.startsWith(q) ? 0 : lowerName.includes(q) ? 1 : 2;
      results.push({
        displayName: cleanDisplay,
        insertValue: cleanInsert,
        zoneLabel,
        tableId,
        score,
      });
    };

    SEATING_TABLES_DATA.forEach((table) => {
      if (!matchesSeatingSideAndGroup(table.id)) return;
      const zoneTitle = (table.name[currentLang] || table.name.zh || '').replace(/[（(].*?[）)]/g, '').trim() || table.name.zh;
      const sp = table.seatPlan;
      if (sp && !sp.freeSeating) {
        const plans = Array.isArray(sp.subTables) ? sp.subTables : [sp];
        plans.forEach((plan) => {
          const subTitle = plan && plan.title ? (plan.title[currentLang] || plan.title.zh) : '';
          const fullZone = subTitle ? `${zoneTitle} · ${subTitle}` : zoneTitle;
          const collectSeat = (s) => {
            if (!s || s.isOtherZone) return;
            const sName = (currentLang === 'en' ? s.en : s.zh) || s.zh || '';
            const cleanInsert = sName.replace(/[（(].*?[）)]/g, '').trim() || sName;
            addCandidate(sName, cleanInsert, s.match || '', fullZone, table.id);
          };
          (plan.sweetheartSeats || []).forEach(collectSeat);
          (plan.rows || []).forEach((pair) => {
            if (Array.isArray(pair)) pair.forEach(collectSeat);
          });
          (plan.extraSeats || []).forEach(collectSeat);
        });
      } else {
        if (sp && sp.freeSeating && Array.isArray(sp.subTables)) {
          sp.subTables.forEach((sub) => {
            if (!sub || !Array.isArray(sub.groupMatch)) return;
            const subTitle = sub.title ? (sub.title[currentLang] || sub.title.zh) : '';
            const fullZone = subTitle ? `${zoneTitle} · ${subTitle}` : zoneTitle;
            sub.groupMatch.forEach((kw) => {
              const s = String(kw || '').trim();
              if (s.length >= 2 && !/^[a-z\s]+$/.test(s)) {
                addCandidate(s, s, s, fullZone, table.id);
              }
            });
          });
        }
        (table.guests || []).forEach((g) => {
          const raw = (currentLang === 'en' ? g.en : g.zh) || g.zh || '';
          const clean = raw
            .replace(/等[一二三四五六七八九十\d]+人/g, '')
            .replace(/[（(]\d+[)）]/g, '')
            .trim();
          addCandidate(clean || raw, clean || raw, `${g.zh || ''} ${g.en || ''}`, zoneTitle, table.id);
        });
      }
    });

    results.sort((a, b) => a.score - b.score || a.displayName.localeCompare(b.displayName, 'zh-Hant'));
    return results.slice(0, 12);
  }

  function selectSeatingAutocompleteItem(item) {
    if (!item || !elSeatingSearchInput) return;
    elSeatingSearchInput.value = item.insertValue;
    const clearBtnEl = document.getElementById('seating-search-clear-btn');
    if (clearBtnEl) clearBtnEl.classList.toggle('hidden', !elSeatingSearchInput.value.trim());
    selectedSeatingZoneId = null;
    if (seatingNeedsFilter !== 'all') {
      seatingNeedsFilter = 'all';
    }
    closeSeatingAutocomplete();
    elSeatingSearchInput.blur();
    renderSeatingSection();
    if (elSeatingPhotoStage && typeof elSeatingPhotoStage.scrollIntoView === 'function') {
      elSeatingPhotoStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderSeatingAutocomplete() {
    if (!elSeatingAutocompleteList || !elSeatingSearchInput) return;
    const rawQuery = elSeatingSearchInput.value.trim();
    if (!rawQuery) {
      closeSeatingAutocomplete();
      return;
    }
    const items = getSeatingAutocompleteCandidates(rawQuery);
    if (items.length === 0) {
      closeSeatingAutocomplete();
      return;
    }
    seatingAutocompleteItems = items;
    if (seatingAutocompleteIndex >= items.length) {
      seatingAutocompleteIndex = -1;
    }

    const qLower = rawQuery.toLowerCase();
    elSeatingAutocompleteList.replaceChildren();
    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = `seating-autocomplete-item${idx === seatingAutocompleteIndex ? ' is-active' : ''}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', idx === seatingAutocompleteIndex ? 'true' : 'false');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'seating-autocomplete-name';
      const matchPos = item.displayName.toLowerCase().indexOf(qLower);
      if (matchPos >= 0) {
        if (matchPos > 0) {
          nameSpan.append(document.createTextNode(item.displayName.slice(0, matchPos)));
        }
        const mark = document.createElement('mark');
        mark.textContent = item.displayName.slice(matchPos, matchPos + rawQuery.length);
        nameSpan.append(mark);
        if (matchPos + rawQuery.length < item.displayName.length) {
          nameSpan.append(document.createTextNode(item.displayName.slice(matchPos + rawQuery.length)));
        }
      } else {
        nameSpan.textContent = item.displayName;
      }

      const zoneSpan = document.createElement('span');
      zoneSpan.className = 'seating-autocomplete-zone';
      zoneSpan.textContent = item.zoneLabel;

      li.append(nameSpan, zoneSpan);
      li.addEventListener('mousedown', (e) => {
        // 桌機滑鼠點擊時防止 input 先觸發 blur 關閉清單；手機觸控不攔截以便順暢滑動捲動
        e.preventDefault();
      });
      li.addEventListener('click', () => {
        selectSeatingAutocompleteItem(item);
      });
      elSeatingAutocompleteList.append(li);
    });

    elSeatingAutocompleteList.classList.remove('hidden');
    elSeatingSearchInput.setAttribute('aria-expanded', 'true');
  }

  // Quiz State
  let quizStarted = false;
  let quizIndex = 0;
  let quizScore = 0;
  let groomScore = 0;
  let brideScore = 0;
  let quizAnswered = false;
  let pendingSelectedOption = null;
  let lastSelectedOption = null;
  let currentPlayerName = safeGetStorage(STORAGE_KEY_PLAYER_NAME) || '';
  if (currentPlayerName === '測試賓客' || currentPlayerName === 'Debug Tester') {
    currentPlayerName = '';
    safeSetStorage(STORAGE_KEY_PLAYER_NAME, '');
  }
  let quizStartedAtMs = 0;
  let currentQuizStartToken = '';
  let quizStartTokenReqId = 0;
  let quizStartTokenInFlight = false;

  function fetchWithAbortTimeout(url, options, timeoutMs = 12000) {
    if (typeof AbortController !== 'function') {
      return fetch(url, options);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const merged = Object.assign({}, options || {}, { signal: controller.signal });
    return fetch(url, merged).finally(() => window.clearTimeout(timer));
  }

  function getMonotonicNowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  function requestQuizStartToken(attempt = 0, existingReqId = null) {
    if (!LEADERBOARD_ENDPOINT_URL) return;
    const reqId = existingReqId === null ? ++quizStartTokenReqId : existingReqId;
    if (existingReqId === null) {
      currentQuizStartToken = '';
    }
    quizStartTokenInFlight = true;
    const sep = LEADERBOARD_ENDPOINT_URL.includes('?') ? '&' : '?';
    fetchWithAbortTimeout(`${LEADERBOARD_ENDPOINT_URL}${sep}action=start`, {}, 8000)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (reqId !== quizStartTokenReqId) return;
        if (data && data.ok && typeof data.startToken === 'string') {
          currentQuizStartToken = data.startToken;
          quizStartTokenInFlight = false;
          return;
        }
        throw new Error('bad_start_token');
      })
      .catch(() => {
        if (reqId !== quizStartTokenReqId) return;
        if (attempt < 2) {
          window.setTimeout(() => {
            if (reqId === quizStartTokenReqId && !currentQuizStartToken) {
              requestQuizStartToken(attempt + 1, reqId);
            }
          }, (attempt + 1) * 1200);
        } else {
          quizStartTokenInFlight = false;
        }
      });
  }

  function ensureQuizStartToken() {
    if (!currentQuizStartToken && !quizStartTokenInFlight) {
      requestQuizStartToken(0);
    }
  }
  let lastQuizDurationSec = null;
  let hasSubmittedCurrentQuiz = false;
  let selectedGalleryEra = 'all';
  let selectedFootprintYear = 'all';
  let timelinePlaying = false;
  let timelineProgress = 0; // 預設從 2014 起點聚焦兩人距離，點播放或拖曳進度條可瀏覽 2014–2026 全程
  let timelineAnimId = null;
  let timelineLastTs = 0;
  let timelineSpeedMultiplier = 1.0; // 支援 0.5x / 1.0x / 1.5x / 2.0x 調整播放速度
  const TIMELINE_DURATION_MS = 72000; // 72 秒流暢播放 2014–2026 雙人軌跡與每站停留聚焦 (每站約 2.18 秒)

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
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const titleStr = isDarkTheme
      ? bgmPlaying
        ? dict.bgmPauseTitleDark
        : dict.bgmPlayTitleDark
      : bgmPlaying
        ? dict.bgmPauseTitle
        : dict.bgmPlayTitle;
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
    if (elMediaSoundNotice) {
      elMediaSoundNotice.textContent =
        currentLang === 'en'
          ? '🎧 Friendly reminder: This video has sound — please lower your volume or wear headphones!'
          : '🎧 溫馨提醒：影片含有聲音，建議調小音量或佩戴耳機觀看喔！';
    }
    if (document.getElementById('media-playlist-tabs')) {
      renderWeddingVideoTabs();
    }
    if (btnLang) {
      btnLang.setAttribute('title', dict.langBtnTitle);
      btnLang.setAttribute('aria-label', dict.langBtnTitle);
    }
    if (btnTheme) {
      btnTheme.setAttribute('title', dict.themeBtnTitle);
      btnTheme.setAttribute('aria-label', dict.themeBtnTitle);
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

    const elCrewEyebrow = document.getElementById('wedding-crew-eyebrow');
    const elCrewTitle = document.getElementById('wedding-crew-title');
    if (elCrewEyebrow && dict.crewEyebrow) elCrewEyebrow.textContent = dict.crewEyebrow;
    if (elCrewTitle && dict.crewTitle) elCrewTitle.textContent = dict.crewTitle;
    if (dict.crewRoles) {
      document.querySelectorAll('[data-crew-role]').forEach((el) => {
        const key = el.getAttribute('data-crew-role');
        if (key && dict.crewRoles[key]) {
          el.textContent = dict.crewRoles[key];
        }
      });
    }

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
    if (elCountdownShuttleNotice) {
      elCountdownShuttleNotice.textContent =
        currentLang === 'en'
          ? '🚌 Pre-reserved shuttle bus only: departs promptly at 11:00 AM from MRT Jiantan Station Exit 2 (Jihe Rd.).'
          : '🚌 若您有事前預約接駁小巴：11:00 準時從捷運劍潭站 2 號出口（基河路）發車';
    }
    if (typeof syncBoutiqueExtrasUi === 'function') {
      syncBoutiqueExtrasUi();
    }
    if (elCountdownShuttleMapLink) {
      elCountdownShuttleMapLink.textContent =
        currentLang === 'en'
          ? '📍 Shuttle Pickup: MRT Jiantan Exit 2 (Jihe Rd.) ↗'
          : '📍 小巴上車點：劍潭站 2 號出口 ↗';
    }
    if (elCountdownVenueNotice) {
      elCountdownVenueNotice.textContent =
        currentLang === 'en'
          ? '🚗 Heading directly to the wedding venue (No. 49, Kaixuan Rd., Shilin Dist., Taipei)'
          : '🚗 自行前往婚宴會場\n（台北市士林區凱旋路 49 號）';
    }
    if (elCountdownVenueMapLink) {
      elCountdownVenueMapLink.textContent =
        currentLang === 'en'
          ? '📍 Wedding Venue: Brick Yard 33 1/3 ↗'
          : '📍 婚宴會場：陽明山美軍俱樂部 ↗';
    }

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

    if (elFootprintsPanelEyebrow) elFootprintsPanelEyebrow.textContent = dict.footprintsPanelEyebrow;
    if (elFootprintsPanelTitle) elFootprintsPanelTitle.textContent = dict.footprintsPanelTitle;
    setFootprintStatsContent(elFootprintStats, dict.footprintStatsText);
    setFootprintRolePillContent(elFootprintTrackTom, 'tom', dict.footprintTrackTom);
    setFootprintRolePillContent(elFootprintTrackEunice, 'eunice', dict.footprintTrackEunice);
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
    if (typeof syncFootprintBgmUi === 'function') syncFootprintBgmUi();
    if (btnTimelineFullscreen) {
      const isFs =
        document.fullscreenElement === elFootprintMapStage ||
        document.webkitFullscreenElement === elFootprintMapStage ||
        (elFootprintMapStage && elFootprintMapStage.classList.contains('is-css-fullscreen'));
      btnTimelineFullscreen.textContent = isFs
        ? currentLang === 'en'
          ? '✕ Exit'
          : '✕ 退出全螢幕'
        : currentLang === 'en'
          ? '⛶ Fullscreen'
          : '⛶ 全螢幕';
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
    renderQuizIntroLanguage();

    elClockCaption.textContent = dict.clockCaption;
    btnCelebrate.textContent = dict.celebrateBtn;

    // 若正在進行問答或結算畫面，同步更新題目或結算語言
    if (!elQuizSection.classList.contains('hidden')) {
      if (!elQuizSummaryView.classList.contains('hidden')) {
        showQuizSummary(false);
      } else if (quizStarted) {
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
      const listId = urlObj.searchParams.get('list');
      if (
        (path === '/playlist' || path === '/embed/videoseries') &&
        listId &&
        /^[a-zA-Z0-9_-]{8,64}$/.test(listId)
      ) {
        const safeList = encodeURIComponent(listId);
        const autoParams = autoplay ? '&autoplay=1&playsinline=1' : '&playsinline=1';
        return {
          provider: dict.mediaBadgeYoutube,
          embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${safeList}&rel=0&cc_load_policy=0${autoParams}`,
          aspectClass: 'ratio-16-9',
          isVertical: false,
        };
      }

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
        const originParam =
          typeof window !== 'undefined' &&
          window.location &&
          /^https?:\/\//.test(window.location.origin)
            ? `&origin=${encodeURIComponent(window.location.origin)}`
            : '';
        return {
          provider: isVertical ? dict.mediaBadgeShorts : dict.mediaBadgeYoutube,
          embedUrl: `https://www.youtube-nocookie.com/embed/${safeId}?rel=0&cc_load_policy=0&enablejsapi=1${originParam}${autoParams}`,
          aspectClass: isVertical ? 'ratio-9-16' : 'ratio-16-9',
          isVertical,
        };
      }
    }

    // 2. Google Drive 白名單網域（影片預覽嵌入）
    if (host === 'drive.google.com') {
      const m = path.match(/^\/file\/d\/([a-zA-Z0-9_-]{10,80})(?:\/(?:view|preview))?\/?$/);
      if (m) {
        const safeFileId = encodeURIComponent(m[1]);
        return {
          provider: currentLang === 'en' ? 'OUR WEDDING FILM' : 'OUR WEDDING FILM · 新人影片',
          embedUrl: `https://drive.google.com/file/d/${safeFileId}/preview`,
          aspectClass: 'ratio-16-9',
          isVertical: false,
        };
      }
    }

    // 3. Instagram 白名單網域
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

  let currentWeddingVideoIndex = 0;
  let activeMediaIframe = null;
  let ytPostMessageBound = false;

  function renderWeddingVideoTabs() {
    if (!elMediaCard || !elMediaFrameWrap || WEDDING_VIDEOS.length <= 1) return;
    let tabsEl = document.getElementById('media-playlist-tabs');
    if (!tabsEl) {
      tabsEl = document.createElement('div');
      tabsEl.id = 'media-playlist-tabs';
      tabsEl.className = 'media-playlist-tabs';
      elMediaCard.insertBefore(tabsEl, elMediaFrameWrap);
    }
    tabsEl.replaceChildren();
    WEDDING_VIDEOS.forEach((vid, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `media-playlist-tab${idx === currentWeddingVideoIndex ? ' is-active' : ''}`;
      btn.textContent = currentLang === 'en' ? vid.label.en : vid.label.zh;
      btn.setAttribute('aria-pressed', idx === currentWeddingVideoIndex ? 'true' : 'false');
      btn.addEventListener('click', () => {
        if (currentWeddingVideoIndex === idx) return;
        currentWeddingVideoIndex = idx;
        renderVideoIframe(true);
      });
      tabsEl.append(btn);
    });

    let hintEl = document.getElementById('media-playlist-hint');
    if (!hintEl) {
      hintEl = document.createElement('p');
      hintEl.id = 'media-playlist-hint';
      hintEl.className = 'media-playlist-hint';
      elMediaCard.insertBefore(hintEl, elMediaFrameWrap);
    }
    hintEl.textContent =
      currentLang === 'en'
        ? '✨ Video 2 will play automatically after Video 1 finishes'
        : '✨ 播完影片 1 將自動接續播放影片 2';
  }

  function bindYoutubeAutoAdvanceListener() {
    if (ytPostMessageBound) return;
    ytPostMessageBound = true;
    window.addEventListener('message', (ev) => {
      if (
        ev.origin !== 'https://www.youtube-nocookie.com' &&
        ev.origin !== 'https://www.youtube.com'
      ) {
        return;
      }
      if (!activeMediaIframe || ev.source !== activeMediaIframe.contentWindow) return;
      let msg = ev.data;
      if (typeof msg === 'string') {
        try {
          msg = JSON.parse(msg);
        } catch (_e) {
          return;
        }
      }
      if (!msg || typeof msg !== 'object') return;
      const state =
        msg.event === 'onStateChange'
          ? msg.info
          : msg.event === 'infoDelivery' && msg.info && typeof msg.info.playerState === 'number'
            ? msg.info.playerState
            : null;
      // YouTube playerState === 0 代表播畢：自動接續下一支影片
      if (state === 0 && currentWeddingVideoIndex < WEDDING_VIDEOS.length - 1) {
        currentWeddingVideoIndex += 1;
        renderVideoIframe(true);
      }
    });
  }

  function renderVideoIframe(forceAutoplay = false) {
    const activeVideo = WEDDING_VIDEOS[currentWeddingVideoIndex] || WEDDING_VIDEOS[0];

    if (elMediaSoundNotice) {
      elMediaSoundNotice.textContent =
        currentLang === 'en'
          ? '🎧 Friendly reminder: This video has sound — please lower your volume or wear headphones!'
          : '🎧 溫馨提醒：影片含有聲音，建議調小音量或佩戴耳機觀看喔！';
    }
    renderWeddingVideoTabs();
    bindYoutubeAutoAdvanceListener();

    if (activeVideo && activeVideo.type === 'local-video') {
      elMediaBadge.textContent =
        currentLang === 'en' ? 'OUR WEDDING FILM' : 'OUR WEDDING FILM · 新人影片';
      elMediaCard.classList.toggle('is-vertical', false);
      elMediaFrameWrap.className = 'media-frame-wrap ratio-16-9';
      const mediaKey = `local:${activeVideo.url}`;
      if (renderedMediaKey !== mediaKey) {
        renderedMediaKey = mediaKey;
        activeMediaIframe = null;
        const video = document.createElement('video');
        video.src = activeVideo.url;
        if (activeVideo.poster) {
          video.poster = activeVideo.poster;
        }
        video.controls = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('controlsList', 'nodownload');
        video.preload = 'metadata';
        video.addEventListener('ended', () => {
          if (currentWeddingVideoIndex < WEDDING_VIDEOS.length - 1) {
            currentWeddingVideoIndex += 1;
            renderVideoIframe(true);
          }
        });
        elMediaFrameWrap.replaceChildren(video);
        if (forceAutoplay) {
          const p = video.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      }
      return;
    }

    const info = parseMediaUrl(activeVideo ? activeVideo.url : WEDDING_VIDEO_URL, forceAutoplay);
    if (!info) return;

    elMediaBadge.textContent = info.provider;
    elMediaCard.classList.toggle('is-vertical', info.isVertical);
    elMediaFrameWrap.className = `media-frame-wrap ${info.aspectClass}`;

    if (renderedMediaKey !== info.embedUrl) {
      renderedMediaKey = info.embedUrl;
      const iframe = document.createElement('iframe');
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.src = info.embedUrl;
      iframe.addEventListener('load', () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
              'https://www.youtube-nocookie.com'
            );
          }
        } catch (_e) {}
      });
      activeMediaIframe = iframe;
      elMediaFrameWrap.replaceChildren(iframe);
    }
  }

  function clearVideoIframe() {
    const existingVideo = elMediaFrameWrap ? elMediaFrameWrap.querySelector('video') : null;
    if (existingVideo) {
      try {
        existingVideo.pause();
        existingVideo.removeAttribute('src');
        existingVideo.load();
      } catch (_e) {}
    }
    elMediaFrameWrap.replaceChildren();
    activeMediaIframe = null;
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

  function scrollPageToTop() {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  function showHubView(mode) {
    if (mode !== 'footprints' && timelinePlaying) {
      timelinePlaying = false;
      if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
      if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
    }
    if (mode !== 'footprints' && typeof stopFootprintGhibliBgm === 'function') {
      stopFootprintGhibliBgm();
    }

    syncHubNavPermissions();

    // 若倒數尚未結束，嚴格限制只能查看「座位表 (seating)」或「婚宴餐點 (banquet-menu)」，其餘一律返回倒數畫面
    if (!isTimeUp) {
      if (mode !== 'seating' && mode !== 'banquet-menu') {
        document.body.classList.remove('is-subview-active');
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
        scrollPageToTop();
        return;
      }
      if (elCountdownStageWrap) elCountdownStageWrap.classList.add('hidden');
      elTimeupHub.classList.remove('hidden');
    }

    if (mode === 'menu') {
      document.body.classList.remove('is-subview-active');
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
      scrollPageToTop();
      return;
    }

    document.body.classList.add('is-subview-active');
    elChoiceCardsGrid.classList.add('hidden');
    elHubNavBar.classList.remove('hidden');

    btnTabVideo.classList.toggle('active', mode === 'video');
    btnTabQuiz.classList.toggle('active', mode === 'quiz');
    if (btnTabSharePhotos) btnTabSharePhotos.classList.toggle('active', mode === 'share');
    if (btnTabGallery) btnTabGallery.classList.toggle('active', mode === 'gallery');
    if (btnTabFootprints) btnTabFootprints.classList.toggle('active', mode === 'footprints');
    if (btnTabSeating) btnTabSeating.classList.toggle('active', mode === 'seating');
    if (btnTabMenu) btnTabMenu.classList.toggle('active', mode === 'banquet-menu');

    const activeTabMap = {
      video: btnTabVideo,
      quiz: btnTabQuiz,
      share: btnTabSharePhotos,
      gallery: btnTabGallery,
      footprints: btnTabFootprints,
      seating: btnTabSeating,
      'banquet-menu': btnTabMenu,
    };
    const activeTabEl = activeTabMap[mode];
    if (activeTabEl && typeof activeTabEl.scrollIntoView === 'function') {
      requestAnimationFrame(() => {
        try {
          activeTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (_e) {}
      });
    }

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
          showQuizIntro();
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
    scrollPageToTop();
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
  let weddingCarouselIndex = 0;
  let weddingCarouselAutoplay = true;
  let weddingCarouselTimer = null;
  let weddingCarouselFullscreenCleanup = null;

  function stopWeddingCarouselTimer() {
    if (weddingCarouselTimer !== null) {
      clearInterval(weddingCarouselTimer);
      weddingCarouselTimer = null;
    }
  }

  function renderGallerySection() {
    if (weddingCarouselFullscreenCleanup) {
      weddingCarouselFullscreenCleanup();
      weddingCarouselFullscreenCleanup = null;
    }
    if (!elMemoryGalleryGrid) return;
    if (elGalleryEraBar) {
      elGalleryEraBar.classList.add('hidden');
      elGalleryEraBar.replaceChildren();
    }
    const dict = t();
    const total = PAST_PHOTOS_DATA.length;
    if (total === 0) {
      elMemoryGalleryGrid.replaceChildren();
      return;
    }
    weddingCarouselIndex = ((weddingCarouselIndex % total) + total) % total;

    const carousel = document.createElement('div');
    carousel.className = 'wedding-carousel';

    const stage = document.createElement('div');
    stage.className = 'wedding-carousel-stage';

    const slideWrap = document.createElement('div');
    slideWrap.className = 'wedding-carousel-slide';

    const topBar = document.createElement('div');
    topBar.className = 'wedding-carousel-topbar';

    const counterBadge = document.createElement('span');
    counterBadge.className = 'wedding-carousel-counter';

    const autoplayBtn = document.createElement('button');
    autoplayBtn.type = 'button';
    autoplayBtn.className = 'wedding-carousel-autoplay-btn';

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.type = 'button';
    fullscreenBtn.className = 'wedding-carousel-fullscreen-btn';

    topBar.append(counterBadge, autoplayBtn, fullscreenBtn);

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'wedding-carousel-nav is-prev';
    prevBtn.setAttribute('aria-label', currentLang === 'en' ? 'Previous photo' : '上一張照片');
    prevBtn.textContent = '‹';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'wedding-carousel-nav is-next';
    nextBtn.setAttribute('aria-label', currentLang === 'en' ? 'Next photo' : '下一張照片');
    nextBtn.textContent = '›';

    stage.append(slideWrap, topBar, prevBtn, nextBtn);

    const captionBar = document.createElement('div');
    captionBar.className = 'wedding-carousel-caption-bar';

    const yearTag = document.createElement('span');
    yearTag.className = 'memory-year-tag';

    const captionEl = document.createElement('p');
    captionEl.className = 'memory-photo-caption';

    captionBar.append(yearTag, captionEl);

    function syncAutoplayUi() {
      autoplayBtn.textContent = weddingCarouselAutoplay
        ? currentLang === 'en'
          ? '⏸ Auto'
          : '⏸ 自動輪播'
        : currentLang === 'en'
          ? '▶ Play'
          : '▶ 繼續輪播';
    }

    const stageAnchor = document.createComment('wedding-carousel-stage-anchor');
    carousel.append(stageAnchor);

    function mountStageToBody() {
      if (stage.parentNode !== document.body) {
        document.body.append(stage);
      }
    }

    function restoreStageToCarousel() {
      if (stageAnchor.parentNode && stage.parentNode !== carousel) {
        stageAnchor.parentNode.insertBefore(stage, stageAnchor);
      }
    }

    function isCarouselFullscreen() {
      return (
        document.fullscreenElement === stage ||
        document.webkitFullscreenElement === stage ||
        stage.classList.contains('is-css-fullscreen')
      );
    }

    function syncFullscreenUi() {
      const active = isCarouselFullscreen();
      if (!stage.classList.contains('is-css-fullscreen')) {
        restoreStageToCarousel();
      }
      fullscreenBtn.textContent = active
        ? currentLang === 'en'
          ? '✕ Exit'
          : '✕ 退出全螢幕'
        : currentLang === 'en'
          ? '⛶ Fullscreen'
          : '⛶ 全螢幕';
      fullscreenBtn.setAttribute(
        'aria-label',
        active
          ? currentLang === 'en'
            ? 'Exit fullscreen'
            : '退出全螢幕'
          : currentLang === 'en'
            ? 'View fullscreen'
            : '全螢幕瀏覽'
      );
      document.documentElement.classList.toggle('carousel-fullscreen-open', active);
      document.body.classList.toggle('carousel-fullscreen-open', active);
      if (active && weddingCarouselAutoplay) {
        restartTimer();
      }
    }

    async function toggleCarouselFullscreen() {
      if (isCarouselFullscreen()) {
        stage.classList.remove('is-css-fullscreen');
        restoreStageToCarousel();
        if (document.fullscreenElement === stage && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement === stage && document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        syncFullscreenUi();
        return;
      }
      const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const canNativeFs = !isCoarsePointer && document.fullscreenEnabled !== false;
      if (canNativeFs && stage.requestFullscreen) {
        try {
          await stage.requestFullscreen();
          if (document.fullscreenElement === stage) {
            syncFullscreenUi();
            return;
          }
        } catch (_err) {
          // Fallback to CSS fullscreen below
        }
      }
      mountStageToBody();
      stage.classList.add('is-css-fullscreen');
      syncFullscreenUi();
      restartTimer();
    }

    const handleKeydown = (e) => {
      if (!isCarouselFullscreen()) return;
      if (e.key === 'Escape' && stage.classList.contains('is-css-fullscreen')) {
        stage.classList.remove('is-css-fullscreen');
        syncFullscreenUi();
      } else if (e.key === 'ArrowLeft') {
        stepSlide(-1);
      } else if (e.key === 'ArrowRight') {
        stepSlide(1);
      }
    };
    fullscreenBtn.addEventListener('click', toggleCarouselFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenUi);
    document.addEventListener('webkitfullscreenchange', syncFullscreenUi);
    document.addEventListener('keydown', handleKeydown);
    weddingCarouselFullscreenCleanup = () => {
      document.removeEventListener('fullscreenchange', syncFullscreenUi);
      document.removeEventListener('webkitfullscreenchange', syncFullscreenUi);
      document.removeEventListener('keydown', handleKeydown);
      stage.classList.remove('is-css-fullscreen');
      if (stage.parentNode === document.body) {
        stage.remove();
      }
      document.documentElement.classList.remove('carousel-fullscreen-open');
      document.body.classList.remove('carousel-fullscreen-open');
    };
    syncFullscreenUi();

    function updateSlideView() {
      const idx = weddingCarouselIndex;
      const item = PAST_PHOTOS_DATA[idx];
      const { directImageUrl } = resolveGooglePhotoConfig(item, idx);

      slideWrap.replaceChildren();
      const renderFallbackPlaceholder = () => {
        slideWrap.replaceChildren();
        const placeholder = document.createElement('div');
        placeholder.className = 'wedding-carousel-placeholder';

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'wedding-carousel-placeholder-emoji';
        emojiSpan.textContent = item.emoji || '💍';

        const tagSpan = document.createElement('span');
        tagSpan.className = 'wedding-carousel-placeholder-tag';
        tagSpan.textContent = item.yearLabel;

        const pTitle = document.createElement('strong');
        pTitle.className = 'wedding-carousel-placeholder-title';
        pTitle.textContent = item.title[currentLang];

        placeholder.append(emojiSpan, tagSpan, pTitle);
        slideWrap.append(placeholder);
      };

      if (directImageUrl) {
        const img = document.createElement('img');
        img.src = directImageUrl;
        img.alt = item.title[currentLang];
        img.loading = 'eager';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', renderFallbackPlaceholder);
        slideWrap.append(img);
      } else {
        renderFallbackPlaceholder();
      }

      if (total > 1) {
        const nextIdx = (idx + 1) % total;
        const nextItem = PAST_PHOTOS_DATA[nextIdx];
        const { directImageUrl: nextImageUrl } = resolveGooglePhotoConfig(nextItem, nextIdx);
        if (nextImageUrl) {
          const preloadImg = new Image();
          preloadImg.referrerPolicy = 'no-referrer';
          preloadImg.src = nextImageUrl;
        }
      }

      counterBadge.textContent = `${idx + 1} / ${total}`;
      yearTag.textContent = item.yearLabel;
      captionEl.textContent =
        currentLang === 'en'
          ? 'Swipe, use arrows, or tap Fullscreen to enjoy all 61 portraits.'
          : '可左右切換、觸控滑動，或點右上角「全螢幕」完整欣賞 61 張精選寫真。';
    }

    function stepSlide(delta) {
      weddingCarouselIndex = (weddingCarouselIndex + delta + total) % total;
      updateSlideView();
    }

    prevBtn.addEventListener('click', () => stepSlide(-1));
    nextBtn.addEventListener('click', () => stepSlide(1));

    let touchStartX = 0;
    let touchStartY = 0;
    stage.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );
    stage.addEventListener(
      'touchend',
      (e) => {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          stepSlide(dx < 0 ? 1 : -1);
        }
      },
      { passive: true }
    );

    autoplayBtn.addEventListener('click', () => {
      weddingCarouselAutoplay = !weddingCarouselAutoplay;
      syncAutoplayUi();
      restartTimer();
    });

    function restartTimer() {
      stopWeddingCarouselTimer();
      if (!weddingCarouselAutoplay) return;
      weddingCarouselTimer = setInterval(() => {
        if (
          document.hidden ||
          !elGallerySection ||
          elGallerySection.classList.contains('hidden')
        ) {
          return;
        }
        stepSlide(1);
      }, 4500);
    }

    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('mouseenter', () => {
        if (!isCarouselFullscreen()) {
          stopWeddingCarouselTimer();
        }
      });
      stage.addEventListener('mouseleave', restartTimer);
    }

    syncAutoplayUi();
    updateSlideView();
    restartTimer();

    carousel.append(stage, captionBar);
    elMemoryGalleryGrid.replaceChildren(carousel);
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
    box: { x: 330, y: 1260, w: 390, h: 435 },
    color: '#0284c7',
    fillColor: 'rgba(2, 132, 199, 0.22)',
    name: { zh: '🚻 廁所 / 洗手間區域', en: '🚻 Restrooms (Men & Women)' },
    zone: { zh: '場地左側中段（上：男廁 A08 ／ 下：女廁與無障礙 A07）', en: 'Mid-Left Hallway (Upper: Men A08 / Lower: Women A07)' },
  };
  const BAR_ZONE_ID = 'facility-bar';
  const BAR_ZONE_META = {
    id: BAR_ZONE_ID,
    box: { x: 588, y: 1740, w: 210, h: 744 },
    color: '#be185d',
    fillColor: 'rgba(190, 24, 93, 0.22)',
    name: { zh: '🍹 吧台區 (A02)', en: '🍹 Bar Counter (A02)' },
    zone: { zh: '外廳左側中段（鄰近大廳入口與新娘座位區）', en: 'Lower Hall Left (Near Entrance & Bride Zones)' },
  };
  const BUFFET_ZONE_ID = 'facility-buffet';
  const BUFFET_ZONE_META = {
    id: BUFFET_ZONE_ID,
    boxes: [
      { x: 328, y: 190, w: 73, h: 655 },
      { x: 1387, y: 1273, w: 439, h: 70 },
    ],
    color: '#0d9488',
    fillColor: 'rgba(13, 148, 136, 0.26)',
    name: { zh: '🍽️ 百匯餐點取餐區（共 2 處）', en: '🍽️ Buffet Stations (2 Locations)' },
    zone: { zh: '主廳左側長吧檯 ＆ 主廳右下方長吧檯（取餐區）', en: 'Main Hall Left Counter & Mid-Right Counter' },
  };
  const RECEPTION_ZONE_ID = 'facility-reception';
  const RECEPTION_ZONE_META = {
    id: RECEPTION_ZONE_ID,
    box: { x: 1080, y: 2522, w: 75, h: 292 },
    color: '#0369a1',
    fillColor: 'rgba(3, 105, 161, 0.26)',
    name: { zh: '📋 接待桌（迎賓簽到 ＆ 收禮處）', en: '📋 Reception & Check-In Desk' },
    zone: { zh: '一樓大廳入口右側（A01 大廳迎賓處）', en: 'Main Entrance Lobby Right (A01)' },
  };
  const KITCHEN_ZONE_ID = 'facility-kitchen';
  const KITCHEN_ZONE_META = {
    id: KITCHEN_ZONE_ID,
    box: { x: 330, y: 1740, w: 240, h: 744 },
    color: '#4f46e5',
    fillColor: 'rgba(99, 102, 241, 0.22)',
    name: { zh: '👨‍🍳 廚房（後場備餐作業區）', en: '👨‍🍳 Kitchen (Culinary Prep Area)' },
    zone: { zh: '場地左下方專區（吧台區左側、洗手間下方）', en: 'Lower-Left Wing (Left of Bar Counter)' },
  };

  const FACILITY_META_BY_ID = {
    [RESTROOM_ZONE_ID]: RESTROOM_ZONE_META,
    [BAR_ZONE_ID]: BAR_ZONE_META,
    [BUFFET_ZONE_ID]: BUFFET_ZONE_META,
    [RECEPTION_ZONE_ID]: RECEPTION_ZONE_META,
    [KITCHEN_ZONE_ID]: KITCHEN_ZONE_META,
  };

  function findMatchingFreeSeatingSubIndices(table, query, isDebugPage) {
    if (!table || !table.seatPlan || !table.seatPlan.freeSeating || !Array.isArray(table.seatPlan.subTables) || !query) {
      return [];
    }
    if (!isDebugPage && query.length < 2) return [];
    const q = query.toLowerCase();
    const indices = [];
    table.seatPlan.subTables.forEach((sub, idx) => {
      if (!sub || !Array.isArray(sub.groupMatch)) return;
      const hit = sub.groupMatch.some((m) => {
        const kw = String(m || '').toLowerCase();
        return kw && (kw.includes(q) || q.includes(kw));
      });
      if (hit) indices.push(idx);
    });
    return indices;
  }

  function findMatchingSeatSlots(table, query, isDebugPage) {
    const empty = { slots: [], uniqueKeys: new Set() };
    if (!table || !table.seatPlan || table.seatPlan.freeSeating || !query) return empty;
    if (!isDebugPage && query.length < 2) return empty;

    const sp = table.seatPlan;
    const slots = [];
    const uniqueKeys = new Set();

    const scanPlan = (plan, subTableIndex) => {
      if (!plan) return;
      const prefix = subTableIndex !== null ? `t${subTableIndex}:` : '';
      if (Array.isArray(plan.sweetheartSeats)) {
        plan.sweetheartSeats.forEach((s, idx) => {
          if (!s) return;
          const hay = `${s.match || ''} ${s.zh || ''} ${s.en || ''}`.toLowerCase();
          if (hay.includes(query)) {
            const side = s.side || (idx === 0 ? 'left' : 'right');
            const slotKey = `${prefix}sweet:${side}`;
            slots.push({
              isSweetheart: true,
              subTableIndex,
              subTableTitle: plan.title || null,
              rowIndex: -1,
              side,
              slotKey,
              cx: s.cx,
              cy: s.cy,
              pinText: s.pinText || '♥',
              seat: s,
            });
            uniqueKeys.add(s.key || s.zh || slotKey);
          }
        });
      }

      if (Array.isArray(plan.rows)) {
        plan.rows.forEach((pair, rIdx) => {
          if (!Array.isArray(pair)) return;
          ['left', 'right'].forEach((side, sIdx) => {
            const seat = pair[sIdx];
            if (!seat || seat.isOtherZone) return;
            const hay = `${seat.match || ''} ${seat.zh || ''} ${seat.en || ''}`.toLowerCase();
            if (hay.includes(query)) {
              const slotKey = `${prefix}${rIdx}:${side}`;
              slots.push({
                subTableIndex,
                subTableTitle: plan.title || null,
                rowIndex: rIdx,
                side,
                slotKey,
                cx: side === 'left' ? plan.leftX : plan.rightX,
                cy: plan.rowYs[rIdx],
                seat,
              });
              uniqueKeys.add(seat.key || seat.zh || slotKey);
            }
          });
        });
      }

      if (Array.isArray(plan.extraSeats)) {
        plan.extraSeats.forEach((s, eIdx) => {
          if (!s) return;
          const hay = `${s.match || ''} ${s.zh || ''} ${s.en || ''}`.toLowerCase();
          if (hay.includes(query)) {
            const slotKey = `${prefix}extra:${eIdx}`;
            slots.push({
              isExtraSeat: true,
              subTableIndex,
              subTableTitle: plan.title || null,
              rowIndex: -1,
              side: s.side || 'center',
              slotKey,
              cx: s.cx,
              cy: s.cy,
              pinText: s.pinText || '加',
              seat: s,
            });
            uniqueKeys.add(s.key || s.zh || slotKey);
          }
        });
      }
    };

    if (Array.isArray(sp.subTables)) {
      sp.subTables.forEach((sub, idx) => scanPlan(sub, idx));
    } else {
      scanPlan(sp, null);
    }

    return { slots, uniqueKeys };
  }

  function formatSeatSlotsSummary(slots, lang) {
    if (!Array.isArray(slots) || slots.length === 0) return '';
    const sweetSlots = slots.filter((s) => s.isSweetheart);
    const extraSlots = slots.filter((s) => s.isExtraSeat);
    const rowSlots = slots.filter((s) => !s.isSweetheart && !s.isExtraSeat);
    const summaries = [];

    if (sweetSlots.length > 0) {
      if (lang === 'en') {
        if (sweetSlots.length === 1) {
          summaries.push(
            `Top-Right Sweetheart Table · ${sweetSlots[0].side === 'left' ? 'Left seat' : 'Right seat'}`
          );
        } else {
          summaries.push('Top-Right Sweetheart Table (2 seats)');
        }
      } else if (sweetSlots.length === 1) {
        summaries.push(
          `右上方新人小桌 · ${sweetSlots[0].side === 'left' ? '左側席' : '右側席'}`
        );
      } else {
        summaries.push('右上方新人小桌（並排雙人席）');
      }
    }

    if (rowSlots.length > 0) {
      const tableTitle = rowSlots[0].subTableTitle
        ? (rowSlots[0].subTableTitle[lang] || rowSlots[0].subTableTitle.zh)
        : '';
      const tablePrefix = tableTitle ? `${tableTitle} · ` : '';
      const sides = new Set(rowSlots.map((s) => s.side));
      const rows = rowSlots.map((s) => s.rowIndex + 1).sort((a, b) => a - b);
      const isContiguous = rows.every((r, idx) => idx === 0 || r === rows[idx - 1] + 1);

      if (sides.size === 1) {
        const onlySide = rowSlots[0].side;
        if (lang === 'en') {
          const sideLabel = onlySide === 'left' ? 'Left side' : 'Right side';
          if (rows.length === 1) {
            summaries.push(`${tablePrefix}${sideLabel} · Row ${rows[0]} (counted from top / Main Hall)`);
          } else {
            const rowDesc = isContiguous
              ? `Rows ${rows[0]}–${rows[rows.length - 1]}`
              : `Rows ${rows.join(', ')}`;
            summaries.push(`${tablePrefix}${sideLabel} · ${rowDesc} (${rows.length} seats, from top)`);
          }
        } else {
          const sideLabel = onlySide === 'left' ? '長桌左側' : '長桌右側';
          if (rows.length === 1) {
            summaries.push(`${tablePrefix}${sideLabel} · 第 ${rows[0]} 排（上方朝主廳方向算起）`);
          } else {
            const rowDesc = isContiguous
              ? `第 ${rows[0]}–${rows[rows.length - 1]} 排`
              : `第 ${rows.join('、')} 排`;
            summaries.push(`${tablePrefix}${sideLabel} · ${rowDesc}（共 ${rows.length} 席，上方朝主廳）`);
          }
        }
      } else if (lang === 'en') {
        const parts = rowSlots.map(
          (s) => `R${s.rowIndex + 1} ${s.side === 'left' ? 'Left' : 'Right'}`
        );
        summaries.push(`${tablePrefix}${parts.join(', ')} (from top)`);
      } else {
        const parts = rowSlots.map(
          (s) => `第 ${s.rowIndex + 1} 排${s.side === 'left' ? '左' : '右'}`
        );
        summaries.push(`${tablePrefix}${parts.join('、')}（上方朝主廳）`);
      }
    }

    if (extraSlots.length > 0) {
      extraSlots.forEach((s) => {
        const tableTitle = s.subTableTitle ? (s.subTableTitle[lang] || s.subTableTitle.zh) : '';
        const tablePrefix = tableTitle ? `${tableTitle} · ` : '';
        summaries.push(
          lang === 'en' ? `${tablePrefix}Bottom End Seat` : `${tablePrefix}桌尾加開席`
        );
      });
    }

    return lang === 'en'
      ? `🪑 Table Position: ${summaries.join(' ｜ ')}`
      : `🪑 桌內相對位置：${summaries.join(' ｜ ')}`;
  }

  function buildSingleSeatTableBlock(plan, subTableIndex, matchedSlotSet, isDebugPage) {
    const prefix = subTableIndex !== null ? `t${subTableIndex}:` : '';
    const block = document.createElement('div');
    block.className = 'seating-seatmap-block';

    if (plan.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'seating-seatmap-subhead';
      titleEl.textContent = plan.title[currentLang] || plan.title.zh;
      block.append(titleEl);
    }

    if (Array.isArray(plan.sweetheartSeats) && plan.sweetheartSeats.length === 2) {
      const sweetTitle = document.createElement('div');
      sweetTitle.className = 'seating-seatmap-subhead';
      sweetTitle.textContent =
        (plan.sweetheartTitle && (plan.sweetheartTitle[currentLang] || plan.sweetheartTitle.zh)) ||
        (currentLang === 'en' ? '💑 Sweetheart Table' : '💑 新人小桌');
      block.append(sweetTitle);

      const sweetRow = document.createElement('div');
      sweetRow.className = 'seating-seatmap-row';
      const buildSweetCell = (s, fallbackSide) => {
        const side = (s && s.side) || fallbackSide;
        const cell = document.createElement('div');
        const isHit = matchedSlotSet.has(`${prefix}sweet:${side}`);
        if (isDebugPage) {
          cell.className = `seating-seatmap-cell is-${side}${isHit ? ' is-seat-match' : ''}`;
          cell.textContent = s ? (currentLang === 'en' ? s.en : s.zh) || s.zh : '—';
        } else if (isHit) {
          cell.className = `seating-seatmap-cell is-${side} is-seat-match`;
          cell.textContent = currentLang === 'en' ? '📍 Your Seat' : '📍 您的座位';
        } else {
          cell.className = `seating-seatmap-cell is-${side} is-anon`;
          cell.textContent = '○';
        }
        return cell;
      };
      const sweetSpine = document.createElement('div');
      sweetSpine.className = 'seating-seatmap-spine';
      sweetSpine.textContent = '♥';
      sweetRow.append(
        buildSweetCell(plan.sweetheartSeats[0], 'left'),
        sweetSpine,
        buildSweetCell(plan.sweetheartSeats[1], 'right')
      );
      block.append(sweetRow);

      const mainSub = document.createElement('div');
      mainSub.className = 'seating-seatmap-subhead';
      mainSub.textContent =
        currentLang === 'en' ? '🪑 Left Main Long Table (6 Rows)' : '🪑 左側主婚人與長輩長桌（共 6 排）';
      block.append(mainSub);
    }

    const colHead = document.createElement('div');
    colHead.className = 'seating-seatmap-colhead';
    const headLeft = document.createElement('span');
    headLeft.textContent = currentLang === 'en' ? 'Left Side' : '左側座位';
    const headMid = document.createElement('span');
    headMid.textContent = currentLang === 'en' ? 'Row' : '排';
    const headRight = document.createElement('span');
    headRight.textContent = currentLang === 'en' ? 'Right Side' : '右側座位';
    colHead.append(headLeft, headMid, headRight);
    block.append(colHead);

    const rowsBox = document.createElement('div');
    rowsBox.className = 'seating-seatmap-rows';

    if (plan.headSeat) {
      const headEl = document.createElement('div');
      headEl.className = `seating-seatmap-cell seating-seatmap-extra${plan.freeSeating ? ' is-free-seat' : ''}`;
      if (isDebugPage) {
        headEl.textContent = (currentLang === 'en' ? plan.headSeat.en : plan.headSeat.zh) || plan.headSeat.zh;
      } else if (plan.freeSeating) {
        headEl.textContent = currentLang === 'en' ? '🪑 Head Seat · ✓ Available' : '🪑 桌頭席 · ✓ 可入座';
      } else {
        headEl.textContent = '○';
      }
      rowsBox.append(headEl);
    }

    (plan.rows || []).forEach((pair, rIdx) => {
      if (plan.aisleAfterRow && plan.aisleAfterRow === rIdx) {
        const aisle = document.createElement('div');
        aisle.className = 'seating-seatmap-aisle';
        aisle.textContent =
          currentLang === 'en'
            ? '┈┈ Mid-Table Walkway (Upper 6 / Lower 6) ┈┈'
            : '┈┈ 中段走道（上段 6 排 ／ 下段 6 排） ┈┈';
        rowsBox.append(aisle);
      }

      const rowEl = document.createElement('div');
      rowEl.className = 'seating-seatmap-row';

      const makeCell = (seat, side) => {
        const cell = document.createElement('div');
        const slotKey = `${prefix}${rIdx}:${side}`;
        const isHit = matchedSlotSet.has(slotKey);
        if (isDebugPage) {
          if (!seat) {
            cell.className = `seating-seatmap-cell is-${side} is-empty`;
            cell.textContent = currentLang === 'en' ? 'Empty' : '（空位）';
          } else if (seat.isOtherZone) {
            cell.className = `seating-seatmap-cell is-${side} is-empty`;
            cell.textContent = (currentLang === 'en' ? seat.en : seat.zh) || seat.zh;
          } else if (plan.freeSeating) {
            cell.className = `seating-seatmap-cell is-${side} is-free-seat`;
            cell.textContent = (currentLang === 'en' ? seat.en : seat.zh) || seat.zh;
          } else {
            cell.className = `seating-seatmap-cell is-${side}${isHit ? ' is-seat-match' : ''}`;
            cell.textContent = (currentLang === 'en' ? seat.en : seat.zh) || seat.zh;
          }
        } else if (isHit) {
          cell.className = `seating-seatmap-cell is-${side} is-seat-match`;
          cell.textContent = currentLang === 'en' ? '📍 Your Seat' : '📍 您的座位';
        } else if (!seat || seat.isOtherZone) {
          cell.className = `seating-seatmap-cell is-${side} is-empty is-anon`;
          cell.textContent = seat && seat.isOtherZone ? ((currentLang === 'en' ? seat.en : seat.zh) || '—') : '—';
        } else if (plan.freeSeating) {
          cell.className = `seating-seatmap-cell is-${side} is-free-seat`;
          cell.textContent = currentLang === 'en' ? '✓ Available' : '✓ 可入座';
        } else {
          cell.className = `seating-seatmap-cell is-${side} is-anon`;
          cell.textContent = '○';
        }
        return cell;
      };

      const spine = document.createElement('div');
      spine.className = 'seating-seatmap-spine';
      spine.textContent = String(rIdx + 1);

      rowEl.append(makeCell(pair[0], 'left'), spine, makeCell(pair[1], 'right'));
      rowsBox.append(rowEl);
    });

    if (Array.isArray(plan.extraSeats)) {
      plan.extraSeats.forEach((s, eIdx) => {
        if (!s) return;
        const slotKey = `${prefix}extra:${eIdx}`;
        const isHit = matchedSlotSet.has(slotKey);
        const extraEl = document.createElement('div');
        extraEl.className = `seating-seatmap-cell seating-seatmap-extra${isHit ? ' is-seat-match' : isDebugPage ? '' : ' is-anon'}`;
        if (isDebugPage) {
          extraEl.textContent = (currentLang === 'en' ? s.en : s.zh) || s.zh;
        } else if (isHit) {
          extraEl.textContent = currentLang === 'en' ? '📍 Your Seat (End Seat)' : '📍 您的座位（桌尾席）';
        } else {
          extraEl.textContent = '○';
        }
        rowsBox.append(extraEl);
      });
    }

    block.append(rowsBox);
    return block;
  }

  function buildSeatMapElement(table, matchedSlotSet, isDebugPage, matchedSubIndices = []) {
    const sp = table.seatPlan;
    if (!sp || sp.hideSeatGrid) return null;

    const wrap = document.createElement('div');
    wrap.className = `seating-seatmap${isDebugPage ? ' is-debug-seatmap' : ' is-public-seatmap'}`;

    const orient = document.createElement('div');
    orient.className = 'seating-seatmap-orient';
    orient.textContent =
      currentLang === 'en'
        ? '▲ Toward Top of Floor Plan · Relative Table Seats'
        : '▲ 朝向平面圖上方 · 桌內左右相對位置';
    wrap.append(orient);

    if (Array.isArray(sp.subTables)) {
      const grid = document.createElement('div');
      grid.className = 'seating-seatmap-subgrid';
      let renderedCount = 0;
      const subIdxSet = new Set(matchedSubIndices);
      sp.subTables.forEach((sub, idx) => {
        const prefix = `t${idx}:`;
        const hasHitInSub =
          subIdxSet.has(idx) ||
          Array.from(matchedSlotSet).some((k) => k.startsWith(prefix));
        if (!isDebugPage && !hasHitInSub) return;
        grid.append(buildSingleSeatTableBlock(sub, idx, matchedSlotSet, isDebugPage));
        renderedCount += 1;
      });
      if (renderedCount === 0) return null;
      wrap.append(grid);
      return wrap;
    }

    if (!Array.isArray(sp.rows)) return null;
    wrap.append(buildSingleSeatTableBlock(sp, null, matchedSlotSet, isDebugPage));
    return wrap;
  }

  function renderSeatingFloorPlan(highlightedIds, seatMarkersByZone = new Map()) {
    if (!elSeatingPhotoStage) return;
    const dict = t();
    const isDebugPage = isDebugUnlocked();
    const safeImg = sanitizeSafeUrl(SEATING_CHART_IMAGE_URL, true);
    const safeLink = sanitizeSafeUrl(SEATING_CHART_LINK_URL, false) || safeImg;

    if (elSeatingExternalLink) {
      // 已有「放大檢視座位圖」燈箱功能，隱藏原本另開原圖連結避免按鈕重複
      elSeatingExternalLink.classList.add('hidden');
      if (elSeatingExternalLink.parentNode) {
        const oldVenueMapLink = document.getElementById('seating-venue-map-link');
        if (oldVenueMapLink) oldVenueMapLink.remove();

        let zoomBtn = document.getElementById('seating-zoom-map-btn');
        const seatingTopRow = elSeatingExternalLink.closest('.section-top-row') || elSeatingExternalLink.parentNode;
        let actionsGroup = document.getElementById('seating-top-actions');
        if (!actionsGroup && seatingTopRow) {
          actionsGroup = document.createElement('div');
          actionsGroup.id = 'seating-top-actions';
          actionsGroup.className = 'section-top-actions';
          seatingTopRow.appendChild(actionsGroup);
        }
        if (!zoomBtn && safeImg) {
          zoomBtn = document.createElement('button');
          zoomBtn.type = 'button';
          zoomBtn.id = 'seating-zoom-map-btn';
          zoomBtn.className = elSeatingExternalLink.className.replace(/\bhidden\b/g, '').trim();
          zoomBtn.addEventListener('click', () => openSeatingZoomLightbox(safeImg));
        }
        if (zoomBtn && actionsGroup) {
          if (zoomBtn.parentNode !== actionsGroup) {
            actionsGroup.insertBefore(zoomBtn, actionsGroup.firstChild);
          }
          const shareBtn = document.getElementById('seating-share-link-btn');
          if (shareBtn && shareBtn.parentNode !== actionsGroup) {
            actionsGroup.appendChild(shareBtn);
          }
        }
        if (zoomBtn) {
          zoomBtn.textContent =
            currentLang === 'en' ? '🔍 Zoom Seating Map' : '🔍 放大檢視座位圖';
        }
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
      const isStaffOnly = window.__TE_STAFF_AUTH__ === true && window.__TE_DEBUG_AUTH__ !== true;
      const bannerPrefixEn = isStaffOnly ? '📋 [Staff Totals]' : '🔧 [Debug Totals]';
      const bannerPrefixZh = isStaffOnly ? '📋 [接待人員全場統計]' : '🔧 [Debug 全場統計]';
      debugBanner.textContent =
        currentLang === 'en'
          ? `${bannerPrefixEn} Guests: ${totalHeadcount} ｜ 🥗 Vegetarian: ${totalVeg} ｜ 🚼 Strollers: ${totalStroller} (🪑 High Chairs: ${totalChildSeat})`
          : `${bannerPrefixZh} 總人數：${totalHeadcount} 人 ｜ 🥗 素食人數：${totalVeg} 人 ｜ 🚼 嬰兒車人數：${totalStroller} 人（🪑 兒童椅：${totalChildSeat} 張）`;
      stageChildren.push(debugBanner);
    }

    const hintBar = document.createElement('div');
    hintBar.className = 'seating-map-hint-bar';

    const hintText = document.createElement('span');
    hintText.className = 'seating-map-hint-text';
    const activeQuery = elSeatingSearchInput ? elSeatingSearchInput.value.trim() : '';
    const primaryHighlightId =
      selectedSeatingZoneId || (highlightedIds.size === 1 ? Array.from(highlightedIds)[0] : null);
    const activeTable = primaryHighlightId
      ? FACILITY_META_BY_ID[primaryHighlightId] ||
        SEATING_TABLES_DATA.find((item) => item.id === primaryHighlightId)
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

    const toggleFacilityZone = (facilityId, e) => {
      if (e) e.stopPropagation();
      const wasOnlyHighlightedBySearch =
        !selectedSeatingZoneId && highlightedIds.size === 1 && highlightedIds.has(facilityId);
      if (elSeatingSearchInput && elSeatingSearchInput.value.trim()) {
        elSeatingSearchInput.value = '';
      }
      seatingNeedsFilter = 'all';
      selectedSeatingZoneId =
        wasOnlyHighlightedBySearch || selectedSeatingZoneId === facilityId ? null : facilityId;
      renderSeatingSection();
    };

    const facilityButtonDefs = [
      {
        id: RECEPTION_ZONE_ID,
        cls: 'seating-map-reception-btn',
        zh: '📋 標示接待桌',
        en: '📋 Reception',
      },
      {
        id: BUFFET_ZONE_ID,
        cls: 'seating-map-buffet-btn',
        zh: '🍽️ 標示餐點區',
        en: '🍽️ Buffet',
      },
      {
        id: RESTROOM_ZONE_ID,
        cls: 'seating-map-restroom-btn',
        zh: '🚻 標示廁所',
        en: '🚻 Restrooms',
      },
      {
        id: BAR_ZONE_ID,
        cls: 'seating-map-bar-btn',
        zh: '🍹 標示吧台',
        en: '🍹 Bar',
      },
    ];
    facilityButtonDefs.forEach((fDef) => {
      const fBtn = document.createElement('button');
      fBtn.type = 'button';
      fBtn.className = `${fDef.cls}${highlightedIds.has(fDef.id) ? ' is-active' : ''}`;
      fBtn.textContent = currentLang === 'en' ? fDef.en : fDef.zh;
      fBtn.addEventListener('click', () => toggleFacilityZone(fDef.id));
      actionsWrap.append(fBtn);
    });

    if (selectedSeatingZoneId || activeQuery) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'seating-map-clear-btn';
      clearBtn.textContent = currentLang === 'en' ? '✕ Clear Highlight' : '✕ 取消高亮';
      clearBtn.addEventListener('click', () => {
        selectedSeatingZoneId = null;
        if (elSeatingSearchInput) elSeatingSearchInput.value = '';
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
    svg.setAttribute('viewBox', '0 0 2184 3072');
    svg.setAttribute('class', 'seating-map-svg');
    svg.setAttribute('aria-label', dict.seatingPanelTitle);

    const handleZoneSelect = (zoneId, e) => {
      e.stopPropagation();
      const wasOnlyHighlightedBySearch =
        !selectedSeatingZoneId && highlightedIds.size === 1 && highlightedIds.has(zoneId);
      if (elSeatingSearchInput && elSeatingSearchInput.value.trim()) {
        elSeatingSearchInput.value = '';
      }
      if (wasOnlyHighlightedBySearch) {
        selectedSeatingZoneId = null;
      } else {
        selectedSeatingZoneId = selectedSeatingZoneId === zoneId ? null : zoneId;
      }
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

    // 1. 繪製所有座位區域顏色框框（使用底圖原生文字標籤，支援矩形或 L 型精準多邊形外框）
    SEATING_TABLES_DATA.forEach((table) => {
      if (!table.box && !table.svgPath) return;
      const isHighlighted = highlightedIds.has(table.id);
      let shapeEl;
      if (table.svgPath) {
        shapeEl = document.createElementNS(svgNS, 'path');
        shapeEl.setAttribute('d', table.svgPath);
      } else {
        shapeEl = document.createElementNS(svgNS, 'rect');
        shapeEl.setAttribute('x', String(table.box.x));
        shapeEl.setAttribute('y', String(table.box.y));
        shapeEl.setAttribute('width', String(table.box.w));
        shapeEl.setAttribute('height', String(table.box.h));
        shapeEl.setAttribute('rx', '18');
        shapeEl.setAttribute('ry', '18');
      }
      if (table.color) {
        shapeEl.style.setProperty('--zone-color', table.color);
      }
      if (table.fillColor) {
        shapeEl.style.setProperty('--zone-fill', table.fillColor);
      }
      if (table.darkColor) {
        shapeEl.style.setProperty('--zone-dark-color', table.darkColor);
      }
      if (table.darkFillColor) {
        shapeEl.style.setProperty('--zone-dark-fill', table.darkFillColor);
      }
      shapeEl.setAttribute(
        'class',
        `seating-zone-hotspot${isHighlighted ? ' is-highlighted' : ''}`
      );

      const titleTag = document.createElementNS(svgNS, 'title');
      titleTag.textContent = `${table.name[currentLang] || table.name.zh} · ${table.zone[currentLang] || table.zone.zh}`;
      shapeEl.append(titleTag);

      shapeEl.addEventListener('click', (e) => handleZoneSelect(table.id, e));
      svg.append(shapeEl);
    });

    // 2. 繪製桌內相對座位精準標點（搜尋命中時先匡起桌子，再以放大鏡放大座位位置；Debug 點選該區時顯示全區座位點）
    const focusLoupeSlots = [];
    let freeSeatingLoupeTarget = null;
    const computePlanFocusBox = (plan, fallbackBox) => {
      if (!plan) return fallbackBox || null;
      const xs = [];
      const ys = [];
      if (typeof plan.leftX === 'number') xs.push(plan.leftX);
      if (typeof plan.rightX === 'number') xs.push(plan.rightX);
      if (Array.isArray(plan.rowYs)) ys.push(...plan.rowYs);
      if (Array.isArray(plan.sweetheartSeats)) {
        plan.sweetheartSeats.forEach((s) => {
          if (s && typeof s.cx === 'number' && typeof s.cy === 'number') {
            xs.push(s.cx);
            ys.push(s.cy);
          }
        });
      }
      if (Array.isArray(plan.extraSeats)) {
        plan.extraSeats.forEach((s) => {
          if (s && typeof s.cx === 'number' && typeof s.cy === 'number') {
            xs.push(s.cx);
            ys.push(s.cy);
          }
        });
      }
      if (xs.length === 0 || ys.length === 0) return fallbackBox || null;
      const minX = Math.min(...xs) - 56;
      const maxX = Math.max(...xs) + 56;
      const minY = Math.min(...ys) - 56;
      const maxY = Math.max(...ys) + 56;
      return {
        x: Math.max(8, Math.round(minX)),
        y: Math.max(8, Math.round(minY)),
        w: Math.round(maxX - minX),
        h: Math.round(maxY - minY),
      };
    };

    const appendFocusFrameAndBadge = (layer, fb, label) => {
      if (!fb) return;
      const focusRect = document.createElementNS(svgNS, 'rect');
      focusRect.setAttribute('x', String(fb.x));
      focusRect.setAttribute('y', String(fb.y));
      focusRect.setAttribute('width', String(fb.w));
      focusRect.setAttribute('height', String(fb.h));
      focusRect.setAttribute('rx', '22');
      focusRect.setAttribute('ry', '22');
      focusRect.setAttribute('class', 'seating-table-focus-frame');
      layer.append(focusRect);

      if (!label) return;
      const badgeTextStr = `📍 ${label}`;
      const badgeW = Math.max(150, Math.min(420, badgeTextStr.length * 30 + 44));
      const badgeH = 54;
      const badgeCx = Math.max(
        badgeW / 2 + 18,
        Math.min(2184 - badgeW / 2 - 18, Math.round(fb.x + fb.w / 2))
      );
      const badgeCy = fb.y < 86 ? fb.y + fb.h + 36 : fb.y - 34;

      const badgeGroup = document.createElementNS(svgNS, 'g');
      badgeGroup.setAttribute('class', 'seating-table-focus-badge');
      const badgeBg = document.createElementNS(svgNS, 'rect');
      badgeBg.setAttribute('x', String(Math.round(badgeCx - badgeW / 2)));
      badgeBg.setAttribute('y', String(Math.round(badgeCy - badgeH / 2)));
      badgeBg.setAttribute('width', String(badgeW));
      badgeBg.setAttribute('height', String(badgeH));
      badgeBg.setAttribute('rx', '27');
      badgeBg.setAttribute('ry', '27');
      badgeBg.setAttribute('class', 'seating-table-focus-badge-bg');
      const badgeText = document.createElementNS(svgNS, 'text');
      badgeText.setAttribute('x', String(badgeCx));
      badgeText.setAttribute('y', String(Math.round(badgeCy + 11)));
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('class', 'seating-table-focus-badge-text');
      badgeText.textContent = badgeTextStr;
      badgeGroup.append(badgeBg, badgeText);
      layer.append(badgeGroup);
    };

    SEATING_TABLES_DATA.forEach((table) => {
      if (!table.seatPlan) return;
      const sp = table.seatPlan;
      const matchedSlots = seatMarkersByZone ? seatMarkersByZone.get(table.id) : null;
      const showFreeSeatingSeats = Boolean(
        seatingNeedsFilter === 'all' && sp.freeSeating && highlightedIds.has(table.id)
      );
      const showAllDebugSeats =
        showFreeSeatingSeats ||
        (isDebugPage && selectedSeatingZoneId === table.id && (!matchedSlots || matchedSlots.length === 0));

      if ((!matchedSlots || matchedSlots.length === 0) && !showAllDebugSeats) return;

      const pinLayer = document.createElementNS(svgNS, 'g');
      pinLayer.setAttribute('class', 'seating-seat-pins-layer');
      if (table.color) pinLayer.style.setProperty('--zone-color', table.color);
      if (table.darkColor) pinLayer.style.setProperty('--zone-dark-color', table.darkColor);

      if (showAllDebugSeats) {
        if (showFreeSeatingSeats && sp.freeSeatingLoupe) {
          freeSeatingLoupeTarget = {
            table,
            plan: sp,
            loupe: sp.freeSeatingLoupe,
            focusBox: computePlanFocusBox(sp, table.box),
          };
        }
        const renderDebugDotsForPlan = (plan) => {
          if (!plan) return;
          const tPrefix = plan.title ? `${plan.title[currentLang] || plan.title.zh} · ` : '';
          if (Array.isArray(plan.sweetheartSeats)) {
            plan.sweetheartSeats.forEach((s, idx) => {
              if (!s) return;
              const side = s.side || (idx === 0 ? 'left' : 'right');
              const g = document.createElementNS(svgNS, 'g');
              g.setAttribute('class', 'seating-seat-debug-dot');

              const c = document.createElementNS(svgNS, 'circle');
              c.setAttribute('cx', String(s.cx));
              c.setAttribute('cy', String(s.cy));
              c.setAttribute('r', '15');
              c.setAttribute('class', 'seating-seat-debug-circle');

              const t = document.createElementNS(svgNS, 'text');
              t.setAttribute('x', String(s.cx));
              t.setAttribute('y', String(Math.round(s.cy + 6)));
              t.setAttribute('text-anchor', 'middle');
              t.setAttribute('class', 'seating-seat-debug-num');
              t.textContent = s.pinText || '♥';

              const tip = document.createElementNS(svgNS, 'title');
              const seatLabel = (currentLang === 'en' ? s.en : s.zh) || s.zh;
              tip.textContent =
                currentLang === 'en'
                  ? `Sweetheart Table (${side === 'left' ? 'Left' : 'Right'}): ${seatLabel}`
                  : `新人小桌（${side === 'left' ? '左席' : '右席'}）：${seatLabel}`;

              g.append(tip, c, t);
              g.addEventListener('click', (e) => handleZoneSelect(table.id, e));
              pinLayer.append(g);
            });
          }

          (plan.rows || []).forEach((pair, rIdx) => {
            ['left', 'right'].forEach((side, sIdx) => {
              const seat = pair[sIdx];
              if (seat && seat.isOtherZone) return;
              const cx = side === 'left' ? plan.leftX : plan.rightX;
              const cy = plan.rowYs[rIdx];
              const g = document.createElementNS(svgNS, 'g');
              g.setAttribute('class', `seating-seat-debug-dot${seat ? '' : ' is-empty'}`);

              const c = document.createElementNS(svgNS, 'circle');
              c.setAttribute('cx', String(cx));
              c.setAttribute('cy', String(cy));
              c.setAttribute('r', '15');
              c.setAttribute('class', 'seating-seat-debug-circle');

              const t = document.createElementNS(svgNS, 'text');
              t.setAttribute('x', String(cx));
              t.setAttribute('y', String(Math.round(cy + 6)));
              t.setAttribute('text-anchor', 'middle');
              t.setAttribute('class', 'seating-seat-debug-num');
              t.textContent = seat ? String(rIdx + 1) : '–';

              const tip = document.createElementNS(svgNS, 'title');
              const sideText =
                currentLang === 'en'
                  ? side === 'left'
                    ? 'Left'
                    : 'Right'
                  : side === 'left'
                    ? '左'
                    : '右';
              const seatLabel = seat
                ? (currentLang === 'en' ? seat.en : seat.zh) || seat.zh
                : currentLang === 'en'
                  ? 'Empty'
                  : '空位';
              tip.textContent =
                currentLang === 'en'
                  ? `${tPrefix}Row ${rIdx + 1} (${sideText}): ${seatLabel}`
                  : `${tPrefix}第 ${rIdx + 1} 排${sideText}：${seatLabel}`;

              g.append(tip, c, t);
              g.addEventListener('click', (e) => handleZoneSelect(table.id, e));
              pinLayer.append(g);
            });
          });

          if (Array.isArray(plan.extraSeats)) {
            plan.extraSeats.forEach((s) => {
              if (!s) return;
              const g = document.createElementNS(svgNS, 'g');
              g.setAttribute('class', 'seating-seat-debug-dot');

              const c = document.createElementNS(svgNS, 'circle');
              c.setAttribute('cx', String(s.cx));
              c.setAttribute('cy', String(s.cy));
              c.setAttribute('r', '15');
              c.setAttribute('class', 'seating-seat-debug-circle');

              const t = document.createElementNS(svgNS, 'text');
              t.setAttribute('x', String(s.cx));
              t.setAttribute('y', String(Math.round(s.cy + 6)));
              t.setAttribute('text-anchor', 'middle');
              t.setAttribute('class', 'seating-seat-debug-num');
              t.textContent = s.pinText || '加';

              const tip = document.createElementNS(svgNS, 'title');
              const seatLabel = (currentLang === 'en' ? s.en : s.zh) || s.zh;
              tip.textContent = `${tPrefix}${seatLabel}`;

              g.append(tip, c, t);
              g.addEventListener('click', (e) => handleZoneSelect(table.id, e));
              pinLayer.append(g);
            });
          }
        };

        if (Array.isArray(sp.subTables)) {
          const matchedFreeSubs =
            showFreeSeatingSeats && activeQuery
              ? findMatchingFreeSeatingSubIndices(table, activeQuery.toLowerCase(), isDebugPage)
              : [];
          if (matchedFreeSubs.length > 0) {
            matchedFreeSubs.forEach((sIdx) => {
              const subPlan = sp.subTables[sIdx];
              if (!sp.hideSeatGrid) {
                renderDebugDotsForPlan(subPlan);
              }
              const fb = computePlanFocusBox(subPlan, table.box);
              const subLabel =
                subPlan && subPlan.title ? (subPlan.title[currentLang] || subPlan.title.zh) : '';
              appendFocusFrameAndBadge(pinLayer, fb, subLabel);
            });
          } else if (!sp.hideSeatGrid) {
            sp.subTables.forEach((sub) => renderDebugDotsForPlan(sub));
          }
        } else {
          renderDebugDotsForPlan(sp);
        }
      } else if (matchedSlots && matchedSlots.length > 0) {
        matchedSlots.forEach((slot) => {
          const g = document.createElementNS(svgNS, 'g');
          g.setAttribute('class', 'seating-seat-pin-group');

          const halo = document.createElementNS(svgNS, 'circle');
          halo.setAttribute('cx', String(slot.cx));
          halo.setAttribute('cy', String(slot.cy));
          halo.setAttribute('r', '25');
          halo.setAttribute('class', 'seating-seat-pin-halo');

          const dot = document.createElementNS(svgNS, 'circle');
          dot.setAttribute('cx', String(slot.cx));
          dot.setAttribute('cy', String(slot.cy));
          dot.setAttribute('r', '16');
          dot.setAttribute('class', 'seating-seat-pin-dot');

          const num = document.createElementNS(svgNS, 'text');
          num.setAttribute('x', String(slot.cx));
          num.setAttribute('y', String(Math.round(slot.cy + 6)));
          num.setAttribute('text-anchor', 'middle');
          num.setAttribute('class', 'seating-seat-pin-num');
          num.textContent =
            slot.isSweetheart || slot.isExtraSeat
              ? slot.pinText || '♥'
              : String(slot.rowIndex + 1);

          const tip = document.createElementNS(svgNS, 'title');
          const tPrefix = slot.subTableTitle
            ? `${slot.subTableTitle[currentLang] || slot.subTableTitle.zh} · `
            : '';
          const sideText =
            currentLang === 'en'
              ? slot.side === 'left'
                ? 'Left'
                : 'Right'
              : slot.side === 'left'
                ? '左側'
                : '右側';
          if (slot.isSweetheart) {
            if (isDebugPage) {
              const seatName = (currentLang === 'en' ? slot.seat.en : slot.seat.zh) || slot.seat.zh;
              tip.textContent =
                currentLang === 'en'
                  ? `Sweetheart Table (${sideText}): ${seatName}`
                  : `新人小桌${sideText}：${seatName}`;
            } else {
              tip.textContent =
                currentLang === 'en'
                  ? `Your Seat: Sweetheart Table (${sideText})`
                  : `您的座位：新人小桌${sideText}`;
            }
          } else if (slot.isExtraSeat) {
            if (isDebugPage) {
              const seatName = (currentLang === 'en' ? slot.seat.en : slot.seat.zh) || slot.seat.zh;
              tip.textContent = `${tPrefix}${seatName}`;
            } else {
              tip.textContent =
                currentLang === 'en'
                  ? `${tPrefix}Your Seat (Bottom End Seat)`
                  : `${tPrefix}您的座位（桌尾席）`;
            }
          } else if (isDebugPage) {
            const seatName = (currentLang === 'en' ? slot.seat.en : slot.seat.zh) || slot.seat.zh;
            tip.textContent =
              currentLang === 'en'
                ? `${tPrefix}Row ${slot.rowIndex + 1} (${sideText}): ${seatName}`
                : `${tPrefix}第 ${slot.rowIndex + 1} 排${sideText}：${seatName}`;
          } else {
            tip.textContent =
              currentLang === 'en'
                ? `${tPrefix}Your Seat: Row ${slot.rowIndex + 1} (${sideText})`
                : `${tPrefix}您的座位：第 ${slot.rowIndex + 1} 排${sideText}`;
          }

          g.append(tip, halo, dot, num);
          g.addEventListener('click', (e) => handleZoneSelect(table.id, e));
          pinLayer.append(g);
        });

        // 步驟一：先用醒目外框匡起命中座位所在的桌子，並附上清楚的桌號／區名標籤
        const focusBoxes = [];
        const focusBoxBySubKey = new Map();
        const getShortZoneTitle = () => {
          const raw = table.name[currentLang] || table.name.zh || '';
          return raw.replace(/[（(].*?[）)]/g, '').trim() || raw;
        };
        if (Array.isArray(sp.subTables)) {
          const seenSubIdx = new Set();
          matchedSlots.forEach((slot) => {
            if (typeof slot.subTableIndex === 'number' && !seenSubIdx.has(slot.subTableIndex)) {
              seenSubIdx.add(slot.subTableIndex);
              const subPlan = sp.subTables[slot.subTableIndex];
              const box = computePlanFocusBox(subPlan, table.box);
              if (box) {
                const subLabel = subPlan && subPlan.title
                  ? (subPlan.title[currentLang] || subPlan.title.zh)
                  : getShortZoneTitle();
                const entry = { box, label: subLabel, plan: subPlan };
                focusBoxes.push(entry);
                focusBoxBySubKey.set(slot.subTableIndex, entry);
              }
            }
          });
        } else {
          const box = computePlanFocusBox(sp, table.box);
          if (box) {
            const entry = { box, label: getShortZoneTitle(), plan: sp };
            focusBoxes.push(entry);
            focusBoxBySubKey.set('single', entry);
          }
        }
        focusBoxes.forEach(({ box: fb, label }) => {
          appendFocusFrameAndBadge(pinLayer, fb, label);
        });

        matchedSlots.forEach((slot) => {
          const matchedEntry =
            typeof slot.subTableIndex === 'number'
              ? focusBoxBySubKey.get(slot.subTableIndex)
              : focusBoxBySubKey.get('single');
          focusLoupeSlots.push({
            slot,
            table,
            plan: matchedEntry ? matchedEntry.plan : sp,
            focusBox: matchedEntry ? matchedEntry.box : table.box,
            tableLabel: matchedEntry ? matchedEntry.label : getShortZoneTitle(),
            color: table.color || '#d97706',
            darkColor: table.darkColor || '#fbbf24',
          });
        });
      }

      svg.append(pinLayer);
    });

    if (isDebugPage && seatingNeedsFilter !== 'all') {
      SEATING_TABLES_DATA.forEach((table) => {
        const ds = table.debugStats;
        if (!ds || !table.box) return;
        let count = 0;
        let badgeLabel = '';
        if (seatingNeedsFilter === 'childSeat') {
          count = ds.childSeat || 0;
          badgeLabel = currentLang === 'en' ? `🪑 ${count}` : `🪑 ${count} 張`;
        } else if (seatingNeedsFilter === 'stroller') {
          count = ds.stroller || 0;
          badgeLabel = currentLang === 'en' ? `🚼 ${count}` : `🚼 ${count} 台`;
        } else if (seatingNeedsFilter === 'veg') {
          count = ds.veg || 0;
          badgeLabel = currentLang === 'en' ? `🥗 ${count}` : `🥗 ${count} 人`;
        }
        if (count <= 0 || !badgeLabel) return;

        const badgeCx = Math.round(table.box.x + table.box.w / 2);
        const badgeCy = Math.round(table.box.y + table.box.h / 2);
        const badgeW = Math.max(136, badgeLabel.length * 26 + 44);
        const badgeH = 56;

        const badgeGroup = document.createElementNS(svgNS, 'g');
        badgeGroup.setAttribute('class', 'seating-table-focus-badge');
        if (table.color) badgeGroup.style.setProperty('--zone-color', table.color);
        if (table.darkColor) badgeGroup.style.setProperty('--zone-dark-color', table.darkColor);

        const badgeBg = document.createElementNS(svgNS, 'rect');
        badgeBg.setAttribute('x', String(Math.round(badgeCx - badgeW / 2)));
        badgeBg.setAttribute('y', String(Math.round(badgeCy - badgeH / 2)));
        badgeBg.setAttribute('width', String(badgeW));
        badgeBg.setAttribute('height', String(badgeH));
        badgeBg.setAttribute('rx', '28');
        badgeBg.setAttribute('ry', '28');
        badgeBg.setAttribute('class', 'seating-table-focus-badge-bg');

        const badgeText = document.createElementNS(svgNS, 'text');
        badgeText.setAttribute('x', String(badgeCx));
        badgeText.setAttribute('y', String(Math.round(badgeCy + 11)));
        badgeText.setAttribute('text-anchor', 'middle');
        badgeText.setAttribute('class', 'seating-table-focus-badge-text');
        badgeText.textContent = badgeLabel;

        badgeGroup.append(badgeBg, badgeText);
        svg.append(badgeGroup);
      });
    }

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
    receptionGroup.addEventListener('click', (e) => toggleFacilityZone(RECEPTION_ZONE_ID, e));
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

    buffetGroup.addEventListener('click', (e) => toggleFacilityZone(BUFFET_ZONE_ID, e));

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

    restroomGroup.addEventListener('click', (e) => toggleFacilityZone(RESTROOM_ZONE_ID, e));

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

    kitchenGroup.addEventListener('click', (e) => toggleFacilityZone(KITCHEN_ZONE_ID, e));

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

    barGroup.addEventListener('click', (e) => toggleFacilityZone(BAR_ZONE_ID, e));

    svg.append(barGroup);

    mapWrap.addEventListener('click', () => {
      if (selectedSeatingZoneId || (elSeatingSearchInput && elSeatingSearchInput.value.trim())) {
        selectedSeatingZoneId = null;
        if (elSeatingSearchInput) elSeatingSearchInput.value = '';
        renderSeatingSection();
      }
    });

    // 7. 步驟二：延遲在旁彈出放大鏡（單人／同組座位 1–4 席，或大直／雄女交界自由入座）
    const appendMagnifierLoupe = ({
      cx,
      cy,
      zoomScale,
      focusBox,
      captionStr,
      zoneColor,
      darkColor,
      preferLeft = false,
      anchorRadius = 28,
      populateOverlay,
    }) => {
      const loupeR = 215;
      const fb = focusBox || { x: cx - 120, y: cy - 160, w: 240, h: 320 };
      const minLx = loupeR + 30;
      const maxLx = 2184 - loupeR - 115;
      const minLy = loupeR + 40;
      const maxLy = 3072 - loupeR - 130;
      const clampX = (v) => Math.max(minLx, Math.min(maxLx, Math.round(v)));
      const clampY = (v) => Math.max(minLy, Math.min(maxLy, Math.round(v)));

      const rightPos = { x: fb.x + fb.w + loupeR + 68, y: cy };
      const leftPos = { x: fb.x - loupeR - 68, y: cy };
      const candidates = preferLeft
        ? [leftPos, rightPos, { x: cx, y: fb.y + fb.h + loupeR + 78 }, { x: cx, y: fb.y - loupeR - 78 }]
        : [rightPos, leftPos, { x: cx, y: fb.y + fb.h + loupeR + 78 }, { x: cx, y: fb.y - loupeR - 78 }];
      const fitsInside = (p) => p.x >= minLx && p.x <= maxLx && p.y >= minLy && p.y <= maxLy;
      const chosen = candidates.find(fitsInside) || (cx < 1045 && !preferLeft ? rightPos : leftPos);
      const lx = clampX(chosen.x);
      const ly = clampY(chosen.y);

      const defs = document.createElementNS(svgNS, 'defs');
      const clip = document.createElementNS(svgNS, 'clipPath');
      clip.setAttribute('id', 'seating-loupe-clip');
      const clipCircle = document.createElementNS(svgNS, 'circle');
      clipCircle.setAttribute('cx', String(lx));
      clipCircle.setAttribute('cy', String(ly));
      clipCircle.setAttribute('r', String(loupeR));
      clip.append(clipCircle);
      defs.append(clip);
      svg.append(defs);

      const loupeGroup = document.createElementNS(svgNS, 'g');
      loupeGroup.setAttribute('class', 'seating-loupe-group');
      loupeGroup.style.transformOrigin = `${lx}px ${ly}px`;
      loupeGroup.style.setProperty('--zone-color', zoneColor || '#d97706');
      loupeGroup.style.setProperty('--zone-dark-color', darkColor || '#fbbf24');

      const leaderLine = document.createElementNS(svgNS, 'line');
      leaderLine.setAttribute('x1', String(cx));
      leaderLine.setAttribute('y1', String(cy));
      leaderLine.setAttribute('x2', String(lx));
      leaderLine.setAttribute('y2', String(ly));
      leaderLine.setAttribute('class', 'seating-loupe-leader');

      const anchorRing = document.createElementNS(svgNS, 'circle');
      anchorRing.setAttribute('cx', String(cx));
      anchorRing.setAttribute('cy', String(cy));
      anchorRing.setAttribute('r', String(anchorRadius));
      anchorRing.setAttribute('class', 'seating-loupe-anchor');

      const cos45 = 0.7071;
      const handleStart = loupeR - 2;
      const handleEnd = loupeR + 115;
      const handleShadow = document.createElementNS(svgNS, 'line');
      handleShadow.setAttribute('x1', String(Math.round(lx + handleStart * cos45)));
      handleShadow.setAttribute('y1', String(Math.round(ly + handleStart * cos45)));
      handleShadow.setAttribute('x2', String(Math.round(lx + handleEnd * cos45)));
      handleShadow.setAttribute('y2', String(Math.round(ly + handleEnd * cos45)));
      handleShadow.setAttribute('class', 'seating-loupe-handle-outer');

      const handleGrip = document.createElementNS(svgNS, 'line');
      handleGrip.setAttribute('x1', String(Math.round(lx + (handleStart + 18) * cos45)));
      handleGrip.setAttribute('y1', String(Math.round(ly + (handleStart + 18) * cos45)));
      handleGrip.setAttribute('x2', String(Math.round(lx + handleEnd * cos45)));
      handleGrip.setAttribute('y2', String(Math.round(ly + handleEnd * cos45)));
      handleGrip.setAttribute('class', 'seating-loupe-handle-inner');

      const lensBackdrop = document.createElementNS(svgNS, 'circle');
      lensBackdrop.setAttribute('cx', String(lx));
      lensBackdrop.setAttribute('cy', String(ly));
      lensBackdrop.setAttribute('r', String(loupeR));
      lensBackdrop.setAttribute('class', 'seating-loupe-backdrop');

      const clippedContent = document.createElementNS(svgNS, 'g');
      clippedContent.setAttribute('clip-path', 'url(#seating-loupe-clip)');
      const zoomTransform = `translate(${lx}, ${ly}) scale(${zoomScale}) translate(${-cx}, ${-cy})`;

      const zoomedImg = document.createElementNS(svgNS, 'image');
      zoomedImg.setAttribute('href', safeImg);
      zoomedImg.setAttribute('x', '0');
      zoomedImg.setAttribute('y', '0');
      zoomedImg.setAttribute('width', '2184');
      zoomedImg.setAttribute('height', '3072');
      zoomedImg.setAttribute('transform', zoomTransform);
      clippedContent.append(zoomedImg);

      const zoomedOverlay = document.createElementNS(svgNS, 'g');
      zoomedOverlay.setAttribute('transform', zoomTransform);
      if (typeof populateOverlay === 'function') {
        populateOverlay(zoomedOverlay);
      }
      clippedContent.append(zoomedOverlay);

      const sheen = document.createElementNS(svgNS, 'path');
      const sx1 = Math.round(lx - loupeR * 0.62);
      const sy1 = Math.round(ly - loupeR * 0.36);
      const sx2 = Math.round(lx - loupeR * 0.16);
      const sy2 = Math.round(ly - loupeR * 0.76);
      sheen.setAttribute(
        'd',
        `M ${sx1} ${sy1} A ${Math.round(loupeR * 0.82)} ${Math.round(loupeR * 0.82)} 0 0 1 ${sx2} ${sy2}`
      );
      sheen.setAttribute('class', 'seating-loupe-sheen');

      const rim = document.createElementNS(svgNS, 'circle');
      rim.setAttribute('cx', String(lx));
      rim.setAttribute('cy', String(ly));
      rim.setAttribute('r', String(loupeR));
      rim.setAttribute('class', 'seating-loupe-rim');

      const capW = Math.max(260, Math.min(680, captionStr.length * 26 + 52));
      const capH = 58;
      const capX = Math.max(capW / 2 + 18, Math.min(2184 - capW / 2 - 18, lx));
      const capY = ly + loupeR + 44 <= 3115 ? ly + loupeR + 44 : ly - loupeR - 44;

      const capBg = document.createElementNS(svgNS, 'rect');
      capBg.setAttribute('x', String(Math.round(capX - capW / 2)));
      capBg.setAttribute('y', String(Math.round(capY - capH / 2)));
      capBg.setAttribute('width', String(capW));
      capBg.setAttribute('height', String(capH));
      capBg.setAttribute('rx', '29');
      capBg.setAttribute('ry', '29');
      capBg.setAttribute('class', 'seating-loupe-caption-bg');

      const capText = document.createElementNS(svgNS, 'text');
      capText.setAttribute('x', String(capX));
      capText.setAttribute('y', String(Math.round(capY + 11)));
      capText.setAttribute('text-anchor', 'middle');
      capText.setAttribute('class', 'seating-loupe-caption-text');
      capText.textContent = captionStr;

      loupeGroup.append(
        leaderLine,
        anchorRing,
        handleShadow,
        handleGrip,
        lensBackdrop,
        clippedContent,
        sheen,
        rim,
        capBg,
        capText
      );
      svg.append(loupeGroup);
    };

    if (seatingNeedsFilter === 'all' && focusLoupeSlots.length > 0 && focusLoupeSlots.length <= 4) {
      const firstItem = focusLoupeSlots[0];
      const firstSlot = firstItem.slot;
      const nearbySlots = focusLoupeSlots.filter(({ slot }) => {
        const dx = slot.cx - firstSlot.cx;
        const dy = slot.cy - firstSlot.cy;
        return Math.hypot(dx, dy) <= 280;
      });
      const targetSlots = nearbySlots.length > 0 ? nearbySlots : [firstItem];
      const cx = Math.round(
        targetSlots.reduce((sum, item) => sum + item.slot.cx, 0) / targetSlots.length
      );
      const cy = Math.round(
        targetSlots.reduce((sum, item) => sum + item.slot.cy, 0) / targetSlots.length
      );

      const slotList = targetSlots.map((item) => item.slot);
      const tableTitle = firstItem.tableLabel || '';
      let posLabel = '';
      if (slotList.every((s) => s.isSweetheart)) {
        posLabel = currentLang === 'en'
          ? slotList.length === 1
            ? `Sweetheart Table · ${slotList[0].side === 'left' ? 'Left' : 'Right'}`
            : 'Sweetheart Table (2 seats)'
          : slotList.length === 1
            ? `新人小桌 · ${slotList[0].side === 'left' ? '左側席' : '右側席'}`
            : '新人小桌 · 雙人席';
      } else if (slotList.every((s) => s.isExtraSeat)) {
        posLabel = currentLang === 'en' ? 'Bottom End Seat' : '桌尾加開席';
      } else {
        const rowSlots = slotList.filter((s) => !s.isSweetheart && !s.isExtraSeat);
        const sides = new Set(rowSlots.map((s) => s.side));
        const rows = rowSlots.map((s) => s.rowIndex + 1).sort((a, b) => a - b);
        const rowText = rows.length === 1
          ? currentLang === 'en' ? `Row ${rows[0]} from top` : `由上第 ${rows[0]} 排`
          : currentLang === 'en' ? `Rows ${rows[0]}–${rows[rows.length - 1]} from top` : `由上第 ${rows[0]}–${rows[rows.length - 1]} 排`;
        const sideText = sides.size === 1
          ? currentLang === 'en'
            ? rowSlots[0].side === 'left' ? 'Left side' : 'Right side'
            : rowSlots[0].side === 'left' ? '長桌左側' : '長桌右側'
          : '';
        posLabel = sideText ? `${sideText} · ${rowText}` : rowText;
      }

      appendMagnifierLoupe({
        cx,
        cy,
        zoomScale: 1.9,
        focusBox: firstItem.focusBox,
        captionStr: tableTitle ? `${tableTitle} ｜ ${posLabel}` : posLabel,
        zoneColor: firstItem.color,
        darkColor: firstItem.darkColor,
        populateOverlay: (zoomedPins) => {
          const targetSlotKeys = new Set(targetSlots.map((item) => item.slot.slotKey));
          const refPlan = firstItem.plan;
          if (refPlan) {
            const prefix =
              typeof firstSlot.subTableIndex === 'number' ? `t${firstSlot.subTableIndex}:` : '';
            const appendContextDot = (rx, ry, labelText, isEmptySeat) => {
              const cg = document.createElementNS(svgNS, 'g');
              cg.setAttribute('class', `seating-loupe-ctx-dot${isEmptySeat ? ' is-empty' : ''}`);
              const cc = document.createElementNS(svgNS, 'circle');
              cc.setAttribute('cx', String(rx));
              cc.setAttribute('cy', String(ry));
              cc.setAttribute('r', '11');
              cc.setAttribute('class', 'seating-loupe-ctx-circle');
              const ct = document.createElementNS(svgNS, 'text');
              ct.setAttribute('x', String(rx));
              ct.setAttribute('y', String(Math.round(ry + 4)));
              ct.setAttribute('text-anchor', 'middle');
              ct.setAttribute('class', 'seating-loupe-ctx-num');
              ct.textContent = labelText;
              cg.append(cc, ct);
              zoomedPins.append(cg);
            };
            if (Array.isArray(refPlan.rows)) {
              refPlan.rows.forEach((pair, rIdx) => {
                ['left', 'right'].forEach((side, sIdx) => {
                  const seat = pair[sIdx];
                  if (seat && seat.isOtherZone) return;
                  const slotKey = `${prefix}${rIdx}:${side}`;
                  if (targetSlotKeys.has(slotKey)) return;
                  const rx = side === 'left' ? refPlan.leftX : refPlan.rightX;
                  const ry = refPlan.rowYs[rIdx];
                  appendContextDot(rx, ry, seat ? String(rIdx + 1) : '–', !seat);
                });
              });
            }
            if (Array.isArray(refPlan.sweetheartSeats)) {
              refPlan.sweetheartSeats.forEach((s, idx) => {
                if (!s) return;
                const side = s.side || (idx === 0 ? 'left' : 'right');
                if (targetSlotKeys.has(`${prefix}sweet:${side}`)) return;
                appendContextDot(s.cx, s.cy, s.pinText || '♥', false);
              });
            }
            if (Array.isArray(refPlan.extraSeats)) {
              refPlan.extraSeats.forEach((s, eIdx) => {
                if (!s || targetSlotKeys.has(`${prefix}extra:${eIdx}`)) return;
                appendContextDot(s.cx, s.cy, s.pinText || '加', false);
              });
            }
          }

          targetSlots.forEach(({ slot, color, darkColor }) => {
            const pg = document.createElementNS(svgNS, 'g');
            pg.style.setProperty('--zone-color', color);
            pg.style.setProperty('--zone-dark-color', darkColor);

            const pHalo = document.createElementNS(svgNS, 'circle');
            pHalo.setAttribute('cx', String(slot.cx));
            pHalo.setAttribute('cy', String(slot.cy));
            pHalo.setAttribute('r', '22');
            pHalo.setAttribute('class', 'seating-seat-pin-halo');

            const pDot = document.createElementNS(svgNS, 'circle');
            pDot.setAttribute('cx', String(slot.cx));
            pDot.setAttribute('cy', String(slot.cy));
            pDot.setAttribute('r', '14');
            pDot.setAttribute('class', 'seating-seat-pin-dot');

            const pNum = document.createElementNS(svgNS, 'text');
            pNum.setAttribute('x', String(slot.cx));
            pNum.setAttribute('y', String(Math.round(slot.cy + 5)));
            pNum.setAttribute('text-anchor', 'middle');
            pNum.setAttribute('class', 'seating-seat-pin-num');
            pNum.style.fontSize = '15px';
            pNum.textContent =
              slot.isSweetheart || slot.isExtraSeat
                ? slot.pinText || '♥'
                : String(slot.rowIndex + 1);

            pg.append(pHalo, pDot, pNum);
            zoomedPins.append(pg);
          });
        },
      });
    } else if (seatingNeedsFilter === 'all' && highlightedIds.size === 1 && freeSeatingLoupeTarget) {
      const { table: fTable, plan: fPlan, loupe: fLoupe, focusBox: fBox } = freeSeatingLoupeTarget;
      appendMagnifierLoupe({
        cx: fLoupe.cx,
        cy: fLoupe.cy,
        zoomScale: fLoupe.zoomScale || 1.75,
        focusBox: fBox,
        captionStr: fLoupe.caption[currentLang] || fLoupe.caption.zh,
        zoneColor: fTable.color || '#dc2626',
        darkColor: fTable.darkColor || '#f87171',
        preferLeft: true,
        anchorRadius: 34,
        populateOverlay: (zoomedOverlay) => {
          (fLoupe.dimNeighborIds || []).forEach((nId) => {
            const neighbor = SEATING_TABLES_DATA.find((t) => t.id === nId);
            if (!neighbor || !neighbor.svgPath) return;
            const dimPath = document.createElementNS(svgNS, 'path');
            dimPath.setAttribute('d', neighbor.svgPath);
            dimPath.setAttribute('class', 'seating-loupe-dim-neighbor');
            zoomedOverlay.append(dimPath);
          });

          if (fTable.svgPath) {
            const zPath = document.createElementNS(svgNS, 'path');
            zPath.setAttribute('d', fTable.svgPath);
            zPath.setAttribute('fill', fTable.fillColor || 'transparent');
            zPath.setAttribute('stroke', fTable.color || '#dc2626');
            zPath.setAttribute('stroke-width', '6');
            zoomedOverlay.append(zPath);
          }

          if (Array.isArray(fPlan.rows)) {
            fPlan.rows.forEach((pair, rIdx) => {
              ['left', 'right'].forEach((side, sIdx) => {
                const seat = pair[sIdx];
                if (!seat || seat.isOtherZone) return;
                const rx = side === 'left' ? fPlan.leftX : fPlan.rightX;
                const ry = fPlan.rowYs[rIdx];
                const pg = document.createElementNS(svgNS, 'g');
                pg.style.setProperty('--zone-color', fTable.color || '#dc2626');
                pg.style.setProperty('--zone-dark-color', fTable.darkColor || '#f87171');
                const pDot = document.createElementNS(svgNS, 'circle');
                pDot.setAttribute('cx', String(rx));
                pDot.setAttribute('cy', String(ry));
                pDot.setAttribute('r', '13');
                pDot.setAttribute('class', 'seating-seat-pin-dot');
                const pNum = document.createElementNS(svgNS, 'text');
                pNum.setAttribute('x', String(rx));
                pNum.setAttribute('y', String(Math.round(ry + 5)));
                pNum.setAttribute('text-anchor', 'middle');
                pNum.setAttribute('class', 'seating-seat-pin-num');
                pNum.style.fontSize = '14px';
                pNum.textContent = String(rIdx + 1);
                pg.append(pDot, pNum);
                zoomedOverlay.append(pg);
              });
            });
          }
        },
      });
    }
    mapWrap.append(img, svg);
    stageChildren.push(mapWrap);
    elSeatingPhotoStage.replaceChildren(...stageChildren);
    elSeatingPhotoStage.classList.remove('hidden');
  }

  function renderSeatingNeedsFilterBar(isDebugPage) {
    if (!elSeatingPhotoStage || !elSeatingPhotoStage.parentNode) return;
    let bar = document.getElementById('seating-needs-filter-bar');
    if (!isDebugPage) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'seating-needs-filter-bar';
      bar.className = 'seating-needs-filter-bar';
      elSeatingPhotoStage.parentNode.insertBefore(bar, elSeatingPhotoStage);
    }

    let totalChildSeat = 0;
    let totalStroller = 0;
    let totalVeg = 0;
    const totalShuttle = SHUTTLE_PASSENGERS.reduce((sum, item) => sum + item.count, 0);
    SEATING_TABLES_DATA.forEach((tItem) => {
      if (tItem.debugStats) {
        totalChildSeat += tItem.debugStats.childSeat || 0;
        totalStroller += tItem.debugStats.stroller || 0;
        totalVeg += tItem.debugStats.veg || 0;
      }
    });

    const options = [
      {
        id: 'all',
        label: currentLang === 'en' ? 'All Tables' : '全部座位',
      },
      {
        id: 'shuttle',
        label:
          currentLang === 'en'
            ? `🚌 Shuttle Bus (${totalShuttle})`
            : `🚌 小巴接駁名單 (${totalShuttle})`,
      },
      {
        id: 'childSeat',
        label:
          currentLang === 'en'
            ? `🪑 Needs High Chair (${totalChildSeat})`
            : `🪑 找兒童椅位置 (${totalChildSeat})`,
      },
      {
        id: 'stroller',
        label:
          currentLang === 'en'
            ? `🚼 Needs Stroller (${totalStroller})`
            : `🚼 找嬰兒車位置 (${totalStroller})`,
      },
      {
        id: 'veg',
        label:
          currentLang === 'en'
            ? `🥗 Needs Vegetarian (${totalVeg})`
            : `🥗 找素食位置 (${totalVeg})`,
      },
    ];

    bar.replaceChildren();
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `seating-needs-pill${seatingNeedsFilter === opt.id ? ' is-active' : ''}`;
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        seatingNeedsFilter = opt.id;
        selectedSeatingZoneId = null;
        renderSeatingSection();
      });
      bar.append(btn);
    });

    if (LEADERBOARD_SHEET_URL) {
      const sheetLink = document.createElement('a');
      sheetLink.href = LEADERBOARD_SHEET_URL;
      sheetLink.target = '_blank';
      sheetLink.rel = 'noopener noreferrer';
      sheetLink.className = 'seating-needs-pill';
      sheetLink.style.textDecoration = 'none';
      sheetLink.textContent =
        currentLang === 'en' ? '📊 Leaderboard Sheet ↗' : '📊 排行榜試算表 ↗';
      bar.append(sheetLink);
    }
  }

  const SHUTTLE_BOARDED_STORAGE_KEY = 'te_staff_shuttle_boarded_v1';

  function loadShuttleBoardedSet() {
    try {
      const raw = window.localStorage.getItem(SHUTTLE_BOARDED_STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_e) {
      return new Set();
    }
  }

  function saveShuttleBoardedSet(setObj) {
    try {
      window.localStorage.setItem(SHUTTLE_BOARDED_STORAGE_KEY, JSON.stringify(Array.from(setObj)));
    } catch (_e) {
      // Ignore storage error
    }
  }

  function renderShuttleRosterCard(isDebugPage) {
    let card = document.getElementById('seating-shuttle-roster-card');
    const shouldShow = Boolean(isDebugPage && seatingNeedsFilter === 'shuttle');
    if (elSeatingPhotoStage) {
      elSeatingPhotoStage.classList.toggle('hidden', shouldShow);
    }
    if (elSeatingTablesGrid) {
      elSeatingTablesGrid.classList.toggle('hidden', shouldShow);
    }
    const filterSelectsWrap = elSeatingSideSelect ? elSeatingSideSelect.closest('.seating-filter-selects') : null;
    if (filterSelectsWrap) {
      filterSelectsWrap.classList.toggle('hidden', shouldShow);
    }
    if (!shouldShow) {
      if (card) card.remove();
      return false;
    }
    if (!elSeatingPhotoStage || !elSeatingPhotoStage.parentNode) return false;
    if (!card) {
      card = document.createElement('section');
      card.id = 'seating-shuttle-roster-card';
      card.className = 'shuttle-roster-card';
      elSeatingPhotoStage.parentNode.insertBefore(card, elSeatingPhotoStage);
    }

    const query = elSeatingSearchInput ? elSeatingSearchInput.value.trim().toLowerCase() : '';
    const boardedSet = loadShuttleBoardedSet();
    const totalPassengers = SHUTTLE_PASSENGERS.reduce((sum, p) => sum + p.count, 0);
    const boardedCount = SHUTTLE_PASSENGERS.reduce(
      (sum, p) => sum + (boardedSet.has(p.name) ? p.count : 0),
      0
    );

    card.replaceChildren();
    const header = document.createElement('div');
    header.className = 'shuttle-roster-header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h4');
    title.className = 'shuttle-roster-title';
    title.textContent =
      currentLang === 'en'
        ? `🚌 Shuttle Bus Roster (11:00 AM Jiantan · ${SHUTTLE_PASSENGERS.length} groups / ${totalPassengers} guests)`
        : `🚌 小巴接駁名單（11:00 劍潭站發車 · 共 ${SHUTTLE_PASSENGERS.length} 組／${totalPassengers} 人）`;
    const sub = document.createElement('p');
    sub.className = 'shuttle-roster-sub';
    sub.textContent =
      currentLang === 'en'
        ? `Tap a name to check off boarding (${boardedCount} / ${totalPassengers} boarded on this device).`
        : `點擊人名可勾選已上車點名（本機已點名：${boardedCount} / ${totalPassengers} 人，可直接用上方搜尋欄找人）。`;
    titleWrap.append(title, sub);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'secondary-btn shuttle-roster-reset-btn';
    resetBtn.textContent = currentLang === 'en' ? 'Reset Check-ins' : '重設點名';
    resetBtn.addEventListener('click', () => {
      if (boardedSet.size === 0) return;
      if (!window.confirm('確定要清除本機全部小巴點名紀錄嗎？')) return;
      saveShuttleBoardedSet(new Set());
      renderShuttleRosterCard(isDebugPage);
    });
    header.append(titleWrap, resetBtn);
    card.append(header);

    const filtered = SHUTTLE_PASSENGERS.filter(
      (p) => !query || p.name.toLowerCase().includes(query) || p.group.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'shuttle-roster-sub';
      empty.textContent = currentLang === 'en' ? 'No matching shuttle passenger.' : '查無符合的小巴接駁賓客。';
      card.append(empty);
      return true;
    }

    const groupsMap = new Map();
    filtered.forEach((p) => {
      if (!groupsMap.has(p.group)) groupsMap.set(p.group, []);
      groupsMap.get(p.group).push(p);
    });

    groupsMap.forEach((items, groupName) => {
      const groupTotal = items.reduce((sum, p) => sum + p.count, 0);
      const groupBoarded = items.reduce((sum, p) => sum + (boardedSet.has(p.name) ? p.count : 0), 0);

      const section = document.createElement('div');
      section.className = 'shuttle-roster-group';

      const groupTitle = document.createElement('h5');
      groupTitle.className = 'shuttle-group-title';
      groupTitle.textContent = `${groupName}（${groupBoarded} / ${groupTotal} 人）`;
      section.append(groupTitle);

      const grid = document.createElement('div');
      grid.className = 'shuttle-roster-grid';
      items.forEach((p) => {
        const isBoarded = boardedSet.has(p.name);
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `shuttle-roster-chip${isBoarded ? ' is-boarded' : ''}`;
        chip.setAttribute('aria-pressed', String(isBoarded));

        const nameSpan = document.createElement('span');
        nameSpan.className = 'shuttle-chip-name';
        nameSpan.textContent = `${isBoarded ? '✅ ' : ''}${p.name}`;

        const metaSpan = document.createElement('span');
        metaSpan.className = 'shuttle-chip-meta';
        metaSpan.textContent = `${p.count} 人`;

        chip.append(nameSpan, metaSpan);
        chip.addEventListener('click', () => {
          const next = loadShuttleBoardedSet();
          if (next.has(p.name)) {
            next.delete(p.name);
          } else {
            next.add(p.name);
          }
          saveShuttleBoardedSet(next);
          renderShuttleRosterCard(isDebugPage);
        });
        grid.append(chip);
      });
      section.append(grid);
      card.append(section);
    });
    return true;
  }

  function renderSeatingSection() {
    if (!elSeatingTablesGrid) return;

    const isDebugPage = isDebugUnlocked();
    syncSeatingFilterSelects();
    renderSeatingNeedsFilterBar(isDebugPage);
    if (renderShuttleRosterCard(isDebugPage)) {
      return;
    }
    const query = elSeatingSearchInput ? elSeatingSearchInput.value.trim().toLowerCase() : '';
    const highlightedIds = new Set();
    if (selectedSeatingZoneId) {
      highlightedIds.add(selectedSeatingZoneId);
    }

    const matchesFacility = (keywords, exactSingleChars = []) => {
      if (selectedSeatingZoneId || !query) return false;
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

    const stripPublicGuestMeta = (text) =>
      String(text || '')
        .replace(/等[一二三四五六七八九十\d]+人/g, '')
        .replace(/[（(]\d+[)）]/g, '')
        .trim()
        .toLowerCase();

    const seatMarkersByZone = new Map();
    const tableCards = [];
    const hasSideOrGroupFilter = seatingSideFilter !== 'all' || seatingGroupFilter !== 'all';
    SEATING_TABLES_DATA.forEach((table) => {
      if (!matchesSeatingSideAndGroup(table.id)) {
        return;
      }
      const tName = table.name[currentLang] || table.name.zh;
      const tZone = table.zone[currentLang] || table.zone.zh;
      const matchesTableTitle =
        !query ||
        tName.toLowerCase().includes(query) ||
        tZone.toLowerCase().includes(query) ||
        (table.name.zh && table.name.zh.toLowerCase().includes(query)) ||
        (table.name.en && table.name.en.toLowerCase().includes(query));

      const seatMatch = findMatchingSeatSlots(table, query, isDebugPage);
      const freeSubMatches = findMatchingFreeSeatingSubIndices(table, query, isDebugPage);
      const canMatchGuestByQuery = isDebugPage ? Boolean(query) : query.length >= 2;
      const hasMatchingGuest =
        canMatchGuestByQuery &&
        (seatMatch.slots.length > 0 ||
          freeSubMatches.length > 0 ||
          table.guests.some((g) =>
            isDebugPage
              ? (g.zh && g.zh.toLowerCase().includes(query)) ||
                (g.en && g.en.toLowerCase().includes(query))
              : (g.zh && stripPublicGuestMeta(g.zh).includes(query)) ||
                (g.en && stripPublicGuestMeta(g.en).includes(query))
          ));

      if (seatMatch.slots.length > 0 && (isDebugPage || seatMatch.uniqueKeys.size === 1)) {
        seatMarkersByZone.set(table.id, seatMatch.slots);
      }

      if (!selectedSeatingZoneId && query && (matchesTableTitle || hasMatchingGuest)) {
        highlightedIds.add(table.id);
      }

      if (query && !matchesTableTitle && !hasMatchingGuest) {
        return;
      }

      const matchesNeeds =
        !isDebugPage ||
        seatingNeedsFilter === 'all' ||
        (seatingNeedsFilter === 'shuttle' && table.debugStats && table.debugStats.shuttle > 0) ||
        (seatingNeedsFilter === 'childSeat' && table.debugStats && table.debugStats.childSeat > 0) ||
        (seatingNeedsFilter === 'stroller' && table.debugStats && table.debugStats.stroller > 0) ||
        (seatingNeedsFilter === 'veg' && table.debugStats && table.debugStats.veg > 0);

      if (!matchesNeeds) {
        return;
      }
      if (!selectedSeatingZoneId && isDebugPage && seatingNeedsFilter !== 'all') {
        highlightedIds.add(table.id);
      }

      if (!selectedSeatingZoneId && !query && hasSideOrGroupFilter && seatingNeedsFilter === 'all') {
        highlightedIds.add(table.id);
      }

      const matchedSlotSet = new Set(
        seatMatch.slots.map((s) => s.slotKey || `${s.rowIndex}:${s.side}`)
      );

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
      if (table.darkColor) {
        card.style.setProperty('--zone-dark-color', table.darkColor);
      }
      if (table.darkFillColor) {
        card.style.setProperty('--zone-dark-fill', table.darkFillColor);
      }
      card.addEventListener('click', () => {
        const wasOnlyHighlightedBySearch =
          !selectedSeatingZoneId && highlightedIds.size === 1 && highlightedIds.has(table.id);
        if (wasOnlyHighlightedBySearch) {
          if (elSeatingSearchInput) elSeatingSearchInput.value = '';
          selectedSeatingZoneId = null;
        } else {
          selectedSeatingZoneId = selectedSeatingZoneId === table.id ? null : table.id;
        }
        renderSeatingSection();
        if (
          (selectedSeatingZoneId || (elSeatingSearchInput && elSeatingSearchInput.value.trim())) &&
          elSeatingPhotoStage &&
          typeof elSeatingPhotoStage.scrollIntoView === 'function'
        ) {
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

      // 僅在 Debug 版本顯示每區「人數、素食人數、嬰兒車人數」與賓客姓名清單（公開版 index.html 隱藏姓名保護隱私）
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
        if (table.debugStats.detail) {
          const detailNote = document.createElement('div');
          detailNote.className = 'seating-debug-detail';
          detailNote.textContent = `📌 ${table.debugStats.detail}`;
          card.append(detailNote);
        }
      }

      if (isDebugPage) {
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

        if (table.seatPlan) {
          const matchedFreeSubs = findMatchingFreeSeatingSubIndices(table, query, true);
          if (table.seatPlan.freeSeating) {
            const subPlan =
              matchedFreeSubs.length === 1 && Array.isArray(table.seatPlan.subTables)
                ? table.seatPlan.subTables[matchedFreeSubs[0]]
                : null;
            const noteObj = (subPlan && subPlan.freeSeatingNote) || table.seatPlan.freeSeatingNote;
            if (noteObj) {
              const seatPosNote = document.createElement('p');
              seatPosNote.className = 'seating-public-seat-pos';
              seatPosNote.textContent = noteObj[currentLang] || noteObj.zh;
              card.append(seatPosNote);
            }
          } else if (seatMatch.slots.length > 0) {
            const seatPosNote = document.createElement('p');
            seatPosNote.className = 'seating-public-seat-pos';
            seatPosNote.textContent = formatSeatSlotsSummary(seatMatch.slots, currentLang);
            card.append(seatPosNote);
          }
          const seatMapEl = buildSeatMapElement(table, matchedSlotSet, true, matchedFreeSubs);
          if (seatMapEl) card.append(seatMapEl);
        }
      } else if (query && (hasMatchingGuest || matchesTableTitle)) {
        const matchNote = document.createElement('p');
        matchNote.className = 'seating-public-match-note';
        matchNote.textContent =
          currentLang === 'en'
            ? '📍 Your seating zone is highlighted on the floor plan above.'
            : '📍 已為您標示入座區域，請對照上方平面圖高亮位置。';
        card.append(matchNote);

        if (table.seatPlan && table.seatPlan.freeSeating) {
          const matchedFreeSubs = findMatchingFreeSeatingSubIndices(table, query, false);
          const subPlan =
            matchedFreeSubs.length === 1 && Array.isArray(table.seatPlan.subTables)
              ? table.seatPlan.subTables[matchedFreeSubs[0]]
              : null;
          const noteObj = (subPlan && subPlan.freeSeatingNote) || table.seatPlan.freeSeatingNote;
          if (noteObj) {
            const seatPosNote = document.createElement('p');
            seatPosNote.className = 'seating-public-seat-pos';
            seatPosNote.textContent = noteObj[currentLang] || noteObj.zh;
            card.append(seatPosNote);
          }
          const seatMapEl = buildSeatMapElement(table, matchedSlotSet, false, matchedFreeSubs);
          if (seatMapEl) card.append(seatMapEl);
        } else if (seatMatch.slots.length > 0) {
          if (seatMatch.uniqueKeys.size === 1) {
            const seatPosNote = document.createElement('p');
            seatPosNote.className = 'seating-public-seat-pos';
            seatPosNote.textContent = formatSeatSlotsSummary(seatMatch.slots, currentLang);
            card.append(seatPosNote);

            const seatMapEl = buildSeatMapElement(table, matchedSlotSet, false);
            if (seatMapEl) card.append(seatMapEl);
          } else {
            const hintNote = document.createElement('p');
            hintNote.className = 'seating-public-seat-pos is-hint';
            hintNote.textContent =
              currentLang === 'en'
                ? '💡 Enter your full name to pinpoint your exact seat at the table.'
                : '💡 請輸入完整姓名，即可進一步標示桌內的精準相對座位。';
            card.append(hintNote);
          }
        }
      }

      tableCards.push(card);
    });

    renderSeatingFloorPlan(highlightedIds, seatMarkersByZone);
    if (query && tableCards.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'seating-empty-state';
      const rawInput = elSeatingSearchInput ? elSeatingSearchInput.value.trim() : query;
      if (highlightedIds.size > 0) {
        emptyBox.textContent =
          currentLang === 'en'
            ? '📍 Facility location highlighted on the floor plan above.'
            : '📍 已於上方平面圖為您標示設施位置。';
      } else if (!isDebugPage && query.length < 2) {
        emptyBox.textContent =
          currentLang === 'en'
            ? '🔎 Please enter at least 2 characters of your name or group to look up your seating zone.'
            : '🔎 請輸入至少 2 個字的姓名或親友分類（例如：全名、北藝、瑪黑、Google）以查詢座位區域。';
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

  window.__TE_ON_STAFF_UNLOCK__ = () => {
    renderSeatingSection();
    renderAdminLeaderboardPanel();
    showHubView('seating');
  };

  let selectedMenuFilter = 'all';

  function getDishIcon(dishText, stationNum) {
    const s = String(dishText || '');
    // 優先以主要食材／肉類直覺標示（方便不吃牛、不吃豬或素食賓客一眼辨識）
    if (/牛排|骰子牛|牛肉|Steak|Beef/i.test(s)) return '🐮';
    if (/豬肚|松阪豬|豬肋排|豬腳|火腿|香腸|Pork|Ham|Sausage/i.test(s)) return '🐷';
    if (/雞肉|辣雞|雞湯|Chicken/i.test(s)) return '🐔';
    if (/牧羊人派|Shepherd/i.test(s)) return '🐑';
    if (/貽貝|Mussels/i.test(s)) return '🦪';
    if (/鮮蝦|海鮮|Prawns|Seafood/i.test(s)) return '🦐';
    if (/鮭魚|鯛魚|檸檬魚|Salmon|Sea Bream|Lemon Fish/i.test(s)) return '🐟';
    if (/洋蔥湯|Onion Soup/i.test(s)) return '🧅';
    if (/蕈菇|野菇|菇菇|Mushroom/i.test(s)) return '🍄';
    if (/時蔬|Greens/i.test(s)) return '🥬';
    if (/鮮果|Fruit Salad/i.test(s)) return '🍓';
    if (/炸物|Fried Platter/i.test(s)) return '🍟';
    if (/巧克力披薩|Chocolate Pizza/i.test(s)) return '🍫';
    if (/馬卡龍|Macaron/i.test(s)) return '🧁';
    if (/千層派|Mille-Feuille/i.test(s)) return '🍰';
    if (/餅乾|Cookie/i.test(s)) return '🍪';
    if (/蛋糕|Cake/i.test(s)) return '🎂';
    if (/現調調酒|Handcrafted Cocktail/i.test(s)) return '🍸';
    if (/雞尾酒|Outdoor Cocktail/i.test(s)) return '🥂';
    if (/紅茶|Tea/i.test(s)) return '🫖';
    if (/咖啡|Americano/i.test(s)) return '☕';
    if (/蔓越莓|Cranberry/i.test(s)) return '🧃';
    if (/檸檬水|Lemon Water/i.test(s)) return '🍋';
    const fallbackByStation = ['🥗', '🍝', '🍽️', '🍲', '🍕', '🍰', '🍸'];
    return fallbackByStation[(stationNum || 1) - 1] || '🍽️';
  }

  function parseMenuDishItem(rawText, lang, stationNum) {
    let text = String(rawText || '')
      .replace(/^[•·\-\s]+/, '')
      .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\s]+/u, '')
      .trim();
    const badges = [];
    let isVeg = false;

    const rules = [
      {
        re: /[（(]蛋奶素[）)]|\(Ovo-Lacto Veg\)/gi,
        badge: { type: 'veg', label: lang === 'en' ? '🌿 Ovo-Lacto Veg' : '🌿 蛋奶素' },
        veg: true,
      },
      {
        re: /[（(]素[）)]|\(Veg\)/gi,
        badge: { type: 'veg', label: lang === 'en' ? '🌿 Veg' : '🌿 素食' },
        veg: true,
      },
      {
        re: /[（(]微辣[）)]|\(Mildly Spicy\)/gi,
        badge: { type: 'spicy', label: lang === 'en' ? '🌶️ Mildly Spicy' : '🌶️ 微辣' },
      },
      {
        re: /[（(]含酒精[）)]|\(Contains Alcohol\)/gi,
        badge: { type: 'alcohol', label: lang === 'en' ? '🥃 Alcohol' : '🥃 含酒精' },
      },
    ];

    rules.forEach((rule) => {
      if (rule.re.test(text)) {
        text = text.replace(rule.re, '').trim();
        badges.push(rule.badge);
        if (rule.veg) isVeg = true;
      }
    });

    const isSignature =
      /曼哈頓牛排|Manhattan Steak|Bartender 現調調酒|Bartender Handcrafted Cocktail/i.test(text);
    if (isSignature) {
      badges.unshift({
        type: 'signature',
        label: lang === 'en' ? '★ Signature' : '★ 主廚招牌',
      });
    }

    return { icon: getDishIcon(text, stationNum), text, badges, isVeg, isSignature };
  }

  function renderBanquetMenuSection() {
    if (!elBanquetCoursesList) return;
    const dict = t();
    const isEn = currentLang === 'en';

    renderEmbeddedPhotoStage(
      elMenuPhotoStage,
      elMenuExternalLink,
      WEDDING_MENU_IMAGE_URL,
      WEDDING_MENU_LINK_URL,
      dict.menuPanelTitle
    );

    const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const JUMP_LABELS = isEn
      ? ['Salads', 'Pasta & Rice', 'Carving & Entrées', 'Soups', 'Savory Bites', 'Desserts', 'Cocktails & Bar']
      : ['沙拉冷盤', '經典主食', '海陸主菜', '暖心湯品', '派對鹹點', '法式甜點', '現調調酒'];

    const FILTERS = [
      { id: 'all', label: isEn ? '✦ Full Menu' : '✦ 全部佳餚' },
      { id: 'veg', label: isEn ? '🌿 Vegetarian Friendly' : '🌿 素食友善' },
      { id: 'savory', label: isEn ? '🥩 Entrées & Bites' : '🥩 主菜＆鹹點' },
      { id: 'sweets', label: isEn ? '🍸 Sweets & Cocktails' : '🍸 甜點＆調酒' },
    ];

    // Top editorial controls (filter pills + quick station jump bar)
    const controlsWrap = document.createElement('div');
    controlsWrap.className = 'banquet-controls-wrap';

    const filterBar = document.createElement('div');
    filterBar.className = 'banquet-filter-bar';
    filterBar.setAttribute('role', 'tablist');
    FILTERS.forEach((f) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `banquet-filter-pill${selectedMenuFilter === f.id ? ' is-active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(selectedMenuFilter === f.id));
      btn.textContent = f.label;
      btn.addEventListener('click', () => {
        selectedMenuFilter = f.id;
        renderBanquetMenuSection();
      });
      filterBar.append(btn);
    });
    controlsWrap.append(filterBar);

    if (selectedMenuFilter === 'all') {
      const jumpBar = document.createElement('nav');
      jumpBar.className = 'banquet-jump-bar';
      jumpBar.setAttribute('aria-label', isEn ? 'Jump to station' : '快速跳轉餐檯');
      WEDDING_MENU_COURSES.forEach((_course, idx) => {
        const jBtn = document.createElement('button');
        jBtn.type = 'button';
        jBtn.className = 'banquet-jump-pill';
        jBtn.textContent = `${ROMAN[idx] || idx + 1} · ${JUMP_LABELS[idx] || ''}`;
        jBtn.addEventListener('click', () => {
          const targetEl = document.getElementById(`banquet-station-${idx + 1}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        jumpBar.append(jBtn);
      });
      controlsWrap.append(jumpBar);
    }

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'banquet-courses-grid';

    let visibleCount = 0;

    WEDDING_MENU_COURSES.forEach((course, idx) => {
      const stationNum = idx + 1;
      const isHero = stationNum === 3;
      const isBar = stationNum === 7;

      if (selectedMenuFilter === 'savory' && stationNum > 5) return;
      if (selectedMenuFilter === 'sweets' && stationNum < 6) return;

      const rawDesc = course.desc[currentLang] || course.desc.zh;
      const parsedDishes = rawDesc
        .split('\n')
        .flatMap((line) => line.split(/\s*[／/]\s*/))
        .map((part) => parseMenuDishItem(part, currentLang, stationNum))
        .filter((d) => d.text.length > 0);

      // For veg filter: keep veg dishes + Station 1 fruit salad & Station 7 drinks
      let displayDishes = parsedDishes;
      if (selectedMenuFilter === 'veg') {
        if (isBar) {
          displayDishes = parsedDishes;
        } else {
          displayDishes = parsedDishes.filter(
            (d) => d.isVeg || /鮮果沙拉|Fruit Salad/i.test(d.text)
          );
        }
        if (displayDishes.length === 0) return;
      }

      visibleCount += 1;

      const card = document.createElement('article');
      card.id = `banquet-station-${stationNum}`;
      card.className = 'banquet-course-card';
      if (isHero) card.classList.add('is-hero-station');
      if (isBar) card.classList.add('is-bar-station');

      const headerRow = document.createElement('div');
      headerRow.className = 'banquet-card-header';

      const headerLeft = document.createElement('div');
      headerLeft.className = 'banquet-card-header-left';

      const romanEl = document.createElement('span');
      romanEl.className = 'banquet-roman-num';
      romanEl.textContent = ROMAN[idx] || String(stationNum);

      const numEl = document.createElement('div');
      numEl.className = 'banquet-course-num';
      numEl.textContent = course.courseNo;

      headerLeft.append(romanEl, numEl);

      const tagEl = document.createElement('span');
      tagEl.className = 'banquet-course-tag';
      tagEl.textContent =
        selectedMenuFilter === 'veg' && !isBar
          ? isEn
            ? `🌿 ${displayDishes.length} Veg Options`
            : `🌿 素食可享 (${displayDishes.length} 品)`
          : course.tag[currentLang] || course.tag.zh;

      headerRow.append(headerLeft, tagEl);

      const titleEl = document.createElement('h4');
      titleEl.className = 'banquet-course-title';
      titleEl.textContent = course.title[currentLang] || course.title.zh;

      const divider = document.createElement('div');
      divider.className = 'banquet-editorial-divider';
      divider.setAttribute('aria-hidden', 'true');

      const ul = document.createElement('ul');
      ul.className = `banquet-dish-list${isHero && displayDishes.length >= 6 ? ' is-two-col' : ''}`;

      displayDishes.forEach((dish) => {
        const li = document.createElement('li');
        li.className = `banquet-dish-item${dish.isSignature ? ' is-signature' : ''}`;

        const mainSpan = document.createElement('span');
        mainSpan.className = 'banquet-dish-main';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'banquet-dish-icon';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.textContent = dish.icon;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'banquet-dish-name';
        nameSpan.textContent = dish.text;

        mainSpan.append(iconSpan, nameSpan);
        li.append(mainSpan);

        if (dish.badges.length > 0) {
          const badgeWrap = document.createElement('span');
          badgeWrap.className = 'banquet-dish-badges';
          dish.badges.forEach((b) => {
            const bEl = document.createElement('span');
            bEl.className = `banquet-diet-badge is-${b.type}`;
            bEl.textContent = b.label;
            badgeWrap.append(bEl);
          });
          li.append(badgeWrap);
        }

        ul.append(li);
      });

      card.append(headerRow, titleEl, divider, ul);
      cardsGrid.append(card);
    });

    const footerOrnament = document.createElement('p');
    footerOrnament.className = 'banquet-editorial-footer';
    footerOrnament.textContent = isEn
      ? '❦  BON APPÉTIT · BRICK YARD 33 1/3 · 2026.11.29  ❦'
      : '❦  BON APPÉTIT · 陽明山美軍俱樂部 33⅓ · 敬祝用餐愉快  ❦';

    elBanquetCoursesList.replaceChildren(controlsWrap, cardsGrid, footerOrnament);
    observeEditorialReveal(cardsGrid, '.banquet-course-card');
  }

  let timelineLastActiveIdx = -1;

  function isMilestoneFootprint(item, idx, total) {
    if (idx === 0 || idx === total - 1) return true;
    const text = `${item.dateTag || ''} ${item.place && item.place.zh ? item.place.zh : ''} ${
      item.distanceLabel && item.distanceLabel.zh ? item.distanceLabel.zh : ''
    } ${item.desc && item.desc.zh ? item.desc.zh : ''}`;
    return /02\.14|最遠距離|柏林|諾丁漢|買房|新家|求婚|登記|婚禮|美軍俱樂部/i.test(text);
  }

  function getFootprintDistanceMood(labelText) {
    const s = String(labelText || '');
    if (/^0\s*km\b/i.test(s)) return 'reunion';
    const m = s.match(/([\d,]+)\s*km/i);
    if (m) {
      const km = Number(m[1].replace(/,/g, ''));
      if (Number.isFinite(km) && km >= 1000) return 'long-distance';
    }
    return 'local';
  }

  function syncActiveTimelineCard(activeIdx) {
    if (!elFootprintTimelineList) return;
    if (activeIdx === timelineLastActiveIdx) return;
    timelineLastActiveIdx = activeIdx;
    const cards = elFootprintTimelineList.querySelectorAll('.timeline-item[data-stop-idx]');
    cards.forEach((card) => {
      const idx = Number(card.dataset.stopIdx);
      card.classList.toggle('is-current', idx === activeIdx);
    });
  }

  function renderFootprintsSection() {
    if (!elFootprintYearBar || !elFootprintTimelineList) return;
    const dict = t();
    const isEn = currentLang === 'en';
    const uniqueYears = Array.from(new Set(LOVE_FOOTPRINTS_DATA.map((d) => d.year)));
    const yearOptions = [
      { id: 'all', label: dict.yearAll },
      { id: 'milestones', label: isEn ? '✨ Milestones' : '✨ 精選里程碑' },
    ].concat(uniqueYears.map((yr) => ({ id: yr, label: yr })));

    const yearButtons = yearOptions.map((yrObj) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `era-pill${selectedFootprintYear === yrObj.id ? ' active' : ''}`;
      btn.textContent = yrObj.label;
      btn.addEventListener('click', () => {
        selectedFootprintYear = yrObj.id;
        if (yrObj.id !== 'all' && yrObj.id !== 'milestones') {
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

    const totalStops = LOVE_FOOTPRINTS_DATA.length;
    const filteredFootprints = LOVE_FOOTPRINTS_DATA.map((item, globalIdx) => ({
      item,
      globalIdx,
    })).filter(({ item, globalIdx }) => {
      if (selectedFootprintYear === 'all') return true;
      if (selectedFootprintYear === 'milestones') {
        return isMilestoneFootprint(item, globalIdx, totalStops);
      }
      return item.year === selectedFootprintYear;
    });

    const YEAR_SUBTITLES = {
      2014: { zh: '故事起點', en: 'Where It Began' },
      2015: { zh: '跨越太平洋', en: 'Across the Pacific' },
      2016: { zh: '思念與重逢', en: 'Miles & Reunions' },
      2017: { zh: '四季同行', en: 'Through the Seasons' },
      2018: { zh: '世界探索', en: 'Exploring Together' },
      2019: { zh: '雙城與遠行', en: 'Journeys Afar' },
      2020: { zh: '相守日常', en: 'Side by Side' },
      2021: { zh: '並肩前行', en: 'Growing Closer' },
      2022: { zh: '新的篇章', en: 'New Horizons' },
      2023: { zh: '築夢時刻', en: 'Building Dreams' },
      2024: { zh: '十週年記憶', en: 'A Decade Together' },
      2025: { zh: '攜手成家', en: 'Forever Begins' },
      2026: { zh: '步入禮堂', en: 'The Wedding Day' },
    };

    const renderedNodes = [];
    let lastRenderedYear = '';

    filteredFootprints.forEach(({ item, globalIdx }) => {
      if (item.year && item.year !== lastRenderedYear) {
        lastRenderedYear = item.year;
        const chapter = document.createElement('div');
        chapter.className = 'timeline-chapter-divider';
        const yrText = document.createElement('span');
        yrText.className = 'timeline-chapter-year';
        const sub = YEAR_SUBTITLES[item.year];
        yrText.textContent = sub
          ? `${item.year} · ${isEn ? sub.en : sub.zh}`
          : String(item.year);
        chapter.append(yrText);
        renderedNodes.push(chapter);
      }

      const node = document.createElement('div');
      node.className = 'timeline-item';
      node.dataset.stopIdx = String(globalIdx);
      node.style.cursor = 'pointer';
      node.title = isEn ? 'Click to focus this moment on the map' : '點擊在上方地圖聚焦此時間點';
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

      const headerLeft = document.createElement('div');
      headerLeft.className = 'timeline-header-left';

      const yearBadge = document.createElement('span');
      yearBadge.className = 'timeline-year-badge';
      yearBadge.textContent = item.dateTag || item.year;

      const stopTag = document.createElement('span');
      stopTag.className = 'timeline-stop-num';
      stopTag.textContent = `#${globalIdx + 1}/${totalStops}`;

      headerLeft.append(yearBadge, stopTag);

      const distText =
        item.distanceLabel && typeof item.distanceLabel === 'object'
          ? item.distanceLabel[currentLang]
          : item.distanceLabel;
      const distMood = getFootprintDistanceMood(distText);
      const distBadge = document.createElement('span');
      distBadge.className = `timeline-distance-badge is-${distMood}`;
      distBadge.textContent =
        distMood === 'long-distance'
          ? `✈️ ${distText}`
          : distMood === 'reunion'
            ? `♥ ${distText}`
            : `📍 ${distText}`;

      header.append(headerLeft, distBadge);

      if (item.tom && item.eunice) {
        const pairRow = document.createElement('div');
        pairRow.className = 'footprint-pair-row';

        const tomTag = document.createElement('span');
        tomTag.className = 'footprint-role-pill is-tom';
        setFootprintRolePillContent(tomTag, 'tom', `Tom · ${item.tom.city[currentLang]}`);

        const euniceTag = document.createElement('span');
        euniceTag.className = 'footprint-role-pill is-eunice';
        setFootprintRolePillContent(euniceTag, 'eunice', `Eunice · ${item.eunice.city[currentLang]}`);

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

      node.append(titleEl, descEl);
      renderedNodes.push(node);
    });

    elFootprintTimelineList.replaceChildren(...renderedNodes);
    observeEditorialReveal(elFootprintTimelineList, '.timeline-item');
    timelineLastActiveIdx = -1;
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

    // 對數縮放插值 + 跨城／跨洲柔順拉遠運鏡 (sin² 曲線，平滑無晃動、嚴格維持長寬比)
    const targetLngB = unwrapNear(camB.centerLng, camA.centerLng);
    const hopDist = Math.hypot(camB.centerLat - camA.centerLat, targetLngB - camA.centerLng);
    const arcLiftFactor = hopDist > 10 ? Math.min(0.18, (hopDist - 10) / 260) * Math.pow(Math.sin(Math.PI * moveT), 2) : 0;
    const logSpanLng = Math.log(camA.spanLng) * (1 - moveT) + Math.log(camB.spanLng) * moveT + arcLiftFactor;
    const spanLng = Math.max(15.0, Math.min(270.0, Math.exp(logSpanLng)));
    // 嚴格保持長寬比，杜絕任何縱橫拉伸變形
    const spanLat = spanLng / CAMERA_ASPECT;

    // 尺度加權中心插值 (Scale-Weighted Center Interpolation)：
    // 當從小範圍(台灣)切換到大範圍(跨洲)時，先拉遠再平移；從大範圍切回小範圍時，先對準中心再放大！
    const denom = (1 - moveT) * camB.spanLng + moveT * camA.spanLng;
    const weightB = denom > 1e-6 ? (moveT * camA.spanLng) / denom : moveT;

    let centerLat = camA.centerLat + (camB.centerLat - camA.centerLat) * weightB;
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

  function drawAvatarCircle(ctx2d, role, cx, cy, radius, borderColor, bgFill) {
    const img = footprintAvatarImgs[role];
    const hasPhoto = img && img.complete && img.naturalWidth > 0;
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx2d.fillStyle = bgFill || '#141c17';
    ctx2d.fill();
    if (hasPhoto) {
      ctx2d.save();
      ctx2d.beginPath();
      ctx2d.arc(cx, cy, Math.max(1, radius - 1.2), 0, Math.PI * 2);
      ctx2d.clip();
      ctx2d.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx2d.restore();
    } else {
      ctx2d.font = `${Math.round(radius)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText(role === 'tom' ? '🤵‍♂️' : '👰‍♀️', cx, cy + 1);
    }
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx2d.lineWidth = Math.max(1.5, radius * 0.13);
    ctx2d.strokeStyle = borderColor;
    ctx2d.stroke();
    ctx2d.restore();
  }

  /**
   * 繪製單人專屬角色標記 (Tom 星空藍新郎頭像 / Eunice 玫瑰粉新娘頭像 + 專屬城市名牌)
   */
  function drawPersonMarker(ctx2d, role, x, y, cityText, mapBounds) {
    const isTom = role === 'tom';
    const primaryColor = isTom ? '#38bdf8' : '#f472b6';
    const darkBg = isTom ? 'rgba(10, 32, 52, 0.94)' : 'rgba(54, 14, 38, 0.94)';
    const glowColor = isTom ? 'rgba(56, 189, 248, 0.55)' : 'rgba(244, 114, 182, 0.55)';
    const nameLabel = isTom ? 'Tom' : 'Eunice';

    ctx2d.save();

    // 1. 外圈呼吸柔光環
    ctx2d.beginPath();
    ctx2d.arc(x, y, 27, 0, Math.PI * 2);
    ctx2d.fillStyle = isTom ? 'rgba(56, 189, 248, 0.18)' : 'rgba(244, 114, 182, 0.18)';
    ctx2d.fill();
    ctx2d.lineWidth = 1.6;
    ctx2d.strokeStyle = glowColor;
    ctx2d.stroke();

    // 2. 圓形婚紗頭像徽章（零 shadowBlur 高速繪製，避免手機端高斯模糊掉幀）
    drawAvatarCircle(ctx2d, role, x, y, 20, primaryColor, darkBg);

    // 3. 專屬膠囊名牌 (顯示角色名稱與當前所在城市)
    const badgeText = `${nameLabel} · ${cityText}`;
    ctx2d.font = '700 13.5px "Noto Sans TC", sans-serif';
    const pillW = ctx2d.measureText(badgeText).width + 22;
    const pillH = 25;

    let pillX = isTom ? x - pillW * 0.35 : x + pillW * 0.35;
    let pillY = isTom ? y - 38 : y + 38;

    if (pillY - pillH / 2 < mapBounds.top + 8) pillY = y + 38;
    if (pillY + pillH / 2 > mapBounds.bottom - 8) pillY = y - 38;
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

  function drawGhibliCloud(ctx2d, cx, cy, scale, alpha) {
    ctx2d.save();
    ctx2d.translate(cx, cy);
    ctx2d.scale(scale, scale);
    ctx2d.globalAlpha = alpha;
    ctx2d.fillStyle = '#fdf7e7';
    ctx2d.beginPath();
    ctx2d.arc(-34, 8, 20, 0, Math.PI * 2);
    ctx2d.arc(-10, -4, 28, 0, Math.PI * 2);
    ctx2d.arc(20, -1, 24, 0, Math.PI * 2);
    ctx2d.arc(42, 10, 17, 0, Math.PI * 2);
    ctx2d.roundRect(-48, 8, 104, 18, 9);
    ctx2d.fill();
    ctx2d.restore();
  }

  function drawGhibliSootSprite(ctx2d, cx, cy, radius, phase) {
    ctx2d.save();
    ctx2d.translate(cx, cy);
    // Fuzzy spikes
    ctx2d.fillStyle = 'rgba(18, 20, 24, 0.86)';
    ctx2d.beginPath();
    const spikes = 14;
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (i * Math.PI) / spikes + phase * 0.4;
      const r = i % 2 === 0 ? radius * 1.24 : radius * 0.88;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) ctx2d.moveTo(px, py);
      else ctx2d.lineTo(px, py);
    }
    ctx2d.closePath();
    ctx2d.fill();
    // Wide curious eyes
    const eyeR = Math.max(1.8, radius * 0.25);
    const eyeOffX = radius * 0.34;
    const eyeOffY = -radius * 0.08;
    ctx2d.fillStyle = '#fffdf7';
    ctx2d.beginPath();
    ctx2d.arc(-eyeOffX, eyeOffY, eyeR, 0, Math.PI * 2);
    ctx2d.arc(eyeOffX, eyeOffY, eyeR, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#111827';
    ctx2d.beginPath();
    ctx2d.arc(-eyeOffX + 0.5, eyeOffY, eyeR * 0.45, 0, Math.PI * 2);
    ctx2d.arc(eyeOffX + 0.5, eyeOffY, eyeR * 0.45, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.restore();
  }

  function drawGhibliCompassRose(ctx2d, cx, cy, r) {
    ctx2d.save();
    ctx2d.translate(cx, cy);
    ctx2d.strokeStyle = 'rgba(248, 224, 158, 0.36)';
    ctx2d.fillStyle = 'rgba(248, 224, 158, 0.28)';
    ctx2d.lineWidth = 1.2;
    ctx2d.beginPath();
    ctx2d.arc(0, 0, r, 0, Math.PI * 2);
    ctx2d.stroke();
    ctx2d.beginPath();
    ctx2d.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx2d.stroke();
    for (let i = 0; i < 4; i++) {
      ctx2d.save();
      ctx2d.rotate((i * Math.PI) / 2);
      ctx2d.beginPath();
      ctx2d.moveTo(0, -r * 0.92);
      ctx2d.lineTo(r * 0.16, -r * 0.18);
      ctx2d.lineTo(0, 0);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.restore();
    }
    ctx2d.font = '700 9px "Cormorant Garamond", serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillStyle = 'rgba(248, 224, 158, 0.55)';
    ctx2d.fillText('N', 0, -r - 7);
    ctx2d.restore();
  }

  let timelineGradientsCache = null;

  function ensurePolygonBboxes() {
    if (WORLD_MAP_POLYGONS.length && WORLD_MAP_POLYGONS[0].bbox) return;
    WORLD_MAP_POLYGONS.forEach((poly) => {
      if (!poly.coords || !poly.coords.length) return;
      let minLat = 90;
      let maxLat = -90;
      let minLng = 180;
      let maxLng = -180;
      poly.coords.forEach(([lat, lng]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });
      poly.bbox = { minLat, maxLat, minLng, maxLng };
    });
  }

  function getTimelineGradients(ctx2d, w, h, mapLeft, mapTop, mapRight, mapBottom, mapW, mapH) {
    const key = `${w}x${h}`;
    if (timelineGradientsCache && timelineGradientsCache.key === key) {
      return timelineGradientsCache;
    }
    // Quiet Luxury 精品墨綠金配色：與全站象牙白／墨森林綠／香檳金視覺統一
    const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#121e18');
    bgGrad.addColorStop(0.55, '#192a21');
    bgGrad.addColorStop(1, '#0f1914');

    const sunGlow = ctx2d.createRadialGradient(w * 0.16, h * 0.14, 10, w * 0.16, h * 0.14, w * 0.55);
    sunGlow.addColorStop(0, 'rgba(232, 204, 148, 0.12)');
    sunGlow.addColorStop(1, 'rgba(232, 204, 148, 0)');

    const seaGrad = ctx2d.createLinearGradient(mapLeft, mapTop, mapRight, mapBottom);
    seaGrad.addColorStop(0, '#132722');
    seaGrad.addColorStop(0.5, '#1b352e');
    seaGrad.addColorStop(1, '#10211d');

    const seaSheen = ctx2d.createRadialGradient(
      mapLeft + mapW * 0.35,
      mapTop + mapH * 0.25,
      20,
      mapLeft + mapW * 0.35,
      mapTop + mapH * 0.25,
      mapW * 0.65
    );
    seaSheen.addColorStop(0, 'rgba(238, 214, 162, 0.09)');
    seaSheen.addColorStop(1, 'rgba(238, 214, 162, 0)');

    const landGrad = ctx2d.createLinearGradient(mapLeft, mapTop, mapLeft, mapBottom);
    landGrad.addColorStop(0, 'rgba(92, 126, 104, 0.72)');
    landGrad.addColorStop(0.55, 'rgba(72, 104, 84, 0.70)');
    landGrad.addColorStop(1, 'rgba(56, 84, 68, 0.68)');

    const taiwanGrad = ctx2d.createLinearGradient(mapLeft, mapTop, mapLeft, mapBottom);
    taiwanGrad.addColorStop(0, 'rgba(154, 194, 152, 0.88)');
    taiwanGrad.addColorStop(1, 'rgba(106, 150, 118, 0.84)');

    timelineGradientsCache = { key, bgGrad, sunGlow, seaGrad, seaSheen, landGrad, taiwanGrad };
    return timelineGradientsCache;
  }

  let timelineCtx2d = null;
  let timelineLastDrawTs = 0;
  let timelineLastScrubberPct = -1;
  let timelineDistWidthCache = { text: '', width: 0 };
  let timelineCityWidthCache = { key: '', eCityW: 0, tCityW: 0 };
  let timelineTrajectoryCache = null;

  function isMobileFootprintPerf() {
    if (typeof window === 'undefined') return false;
    return (
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      window.innerWidth <= 900
    );
  }

  function sampleRolePathLatLng(sA, sB, t, liftSign) {
    const startNode = sB.from || sA;
    if (sB.via) {
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
  }

  function getTimelineTrajectoryCache(totalSegs) {
    if (timelineTrajectoryCache && timelineTrajectoryCache.totalSegs === totalSegs) {
      return timelineTrajectoryCache;
    }
    const steps = 16;
    const buildRole = (roleKey, liftSign) => {
      const segs = [];
      for (let i = 0; i < totalSegs; i++) {
        const sA = LOVE_FOOTPRINTS_DATA[i][roleKey];
        const sB = LOVE_FOOTPRINTS_DATA[i + 1][roleKey];
        if (!sA || !sB) {
          segs.push(null);
          continue;
        }
        const startNode = sB.from || sA;
        const dLngShort = Math.abs(unwrapNear(startNode.lng, sB.lng) - sB.lng);
        const geoDist = Math.hypot(sB.lat - startNode.lat, dLngShort);
        const isStatic = geoDist < 0.015 && !sB.via;
        const points = [];
        for (let s = 0; s <= steps; s++) {
          points.push(sampleRolePathLatLng(sA, sB, s / steps, liftSign));
        }
        const midSample = points[steps >> 1];
        segs.push({ sA, sB, isStatic, points, midLng: midSample.lng });
      }
      return segs;
    };
    timelineTrajectoryCache = {
      totalSegs,
      steps,
      tom: buildRole('tom', 1),
      eunice: buildRole('eunice', -1),
    };
    return timelineTrajectoryCache;
  }

  function drawTimelineVideoFrame(progress) {
    if (!elTimelineVideoCanvas) return;
    const isMobile = isMobileFootprintPerf();
    const renderScale = isMobile ? 0.7 : 1;
    const w = 1280;
    const h = 720;
    const targetW = Math.round(w * renderScale);
    const targetH = Math.round(h * renderScale);
    if (elTimelineVideoCanvas.width !== targetW || elTimelineVideoCanvas.height !== targetH) {
      elTimelineVideoCanvas.width = targetW;
      elTimelineVideoCanvas.height = targetH;
      timelineCtx2d = null;
    }
    if (!timelineCtx2d) {
      timelineCtx2d = elTimelineVideoCanvas.getContext('2d', { alpha: false }) || elTimelineVideoCanvas.getContext('2d');
    }
    const ctx2d = timelineCtx2d;
    if (!ctx2d) return;
    ctx2d.setTransform(renderScale, 0, 0, renderScale, 0, 0);

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

    ensurePolygonBboxes();
    const grads = getTimelineGradients(ctx2d, w, h, mapLeft, mapTop, mapRight, mapBottom, mapW, mapH);

    // 1. 宮崎駿手繪故事書：溫潤森綠海洋與晨光漸層背景（使用快取漸層）
    ctx2d.fillStyle = grads.bgGrad;
    ctx2d.fillRect(0, 0, w, h);

    // 柔金色晨光暈染
    ctx2d.fillStyle = grads.sunGlow;
    ctx2d.fillRect(0, 0, w, h);

    // 地圖視窗外框與裁切區
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.roundRect(mapLeft, mapTop, mapW, mapH, 16);
    ctx2d.fillStyle = grads.seaGrad;
    ctx2d.fill();
    ctx2d.clip();

    // 海面陽光水彩暈染
    ctx2d.fillStyle = grads.seaSheen;
    ctx2d.fillRect(mapLeft, mapTop, mapW, mapH);

    // 手繪海面波紋
    ctx2d.save();
    ctx2d.strokeStyle = 'rgba(248, 238, 210, 0.055)';
    ctx2d.lineWidth = 1.2;
    for (let row = 0; row < 7; row++) {
      const wy = mapTop + 38 + row * (mapH / 7);
      const wxShift = ((progress * 180 + row * 73) % 140) - 70;
      for (let col = 0; col < 5; col++) {
        const wx = mapLeft + 75 + col * (mapW / 4.8) + wxShift;
        ctx2d.beginPath();
        ctx2d.arc(wx, wy, 18, Math.PI * 0.15, Math.PI * 0.85);
        ctx2d.stroke();
      }
    }
    ctx2d.restore();

    // 2. 動態經緯度網格（香檳金細線）
    const gridStep = cam.spanLng <= 18 ? 2 : cam.spanLng <= 48 ? 5 : cam.spanLng <= 115 ? 15 : 30;
    ctx2d.strokeStyle = 'rgba(226, 204, 160, 0.075)';
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

    // 3. 繪製世界地圖各大洲與台灣高精度島嶼輪廓 (視錐裁切 + 零 shadowBlur 高速繪製)
    const cullPad = 28;
    const worldOffsets = [-360, 0, 360];
    ctx2d.lineJoin = 'round';
    worldOffsets.forEach((lngOffset) => {
      WORLD_MAP_POLYGONS.forEach((poly) => {
        if (!poly.coords || poly.coords.length < 3) return;
        if (poly.bbox) {
          const nw = projectWithCamera(poly.bbox.maxLat, poly.bbox.minLng + lngOffset, cam, w, h);
          const se = projectWithCamera(poly.bbox.minLat, poly.bbox.maxLng + lngOffset, cam, w, h);
          if (
            se.x < mapLeft - cullPad ||
            nw.x > mapRight + cullPad ||
            se.y < mapTop - cullPad ||
            nw.y > mapBottom + cullPad
          ) {
            return;
          }
        }
        ctx2d.beginPath();
        poly.coords.forEach(([lat, lng], idx) => {
          const pt = projectWithCamera(lat, lng + lngOffset, cam, w, h);
          if (idx === 0) ctx2d.moveTo(pt.x, pt.y);
          else ctx2d.lineTo(pt.x, pt.y);
        });
        ctx2d.closePath();

        // 淺海海岸線柔光暈（手機端僅保留台灣亮點光暈，減少全地圖雙倍 stroke 負擔）
        if (!isMobile || poly.isHighlight) {
          ctx2d.strokeStyle = poly.isHighlight ? 'rgba(242, 214, 156, 0.26)' : 'rgba(168, 202, 184, 0.10)';
          ctx2d.lineWidth = poly.isHighlight ? 11 : 8;
          ctx2d.stroke();
        }

        if (poly.isHighlight) {
          ctx2d.fillStyle = grads.taiwanGrad;
          ctx2d.strokeStyle = 'rgba(248, 232, 192, 0.96)';
          ctx2d.lineWidth = cam.spanLng <= 20 ? 2.6 : 1.9;
        } else {
          ctx2d.fillStyle = grads.landGrad;
          ctx2d.strokeStyle = 'rgba(232, 216, 182, 0.62)';
          ctx2d.lineWidth = cam.spanLng <= 40 ? 1.8 : 1.3;
        }
        ctx2d.fill();
        ctx2d.stroke();
      });
    });

    // 古典航海圖洋流與大洋／大陸優雅字標
    if (cam.spanLng > 22) {
      const seaLabels = [
        { text: 'PACIFIC OCEAN', lat: 24, lng: -158 },
        { text: 'PACIFIC OCEAN', lat: 20, lng: 165 },
        { text: 'ATLANTIC OCEAN', lat: 34, lng: -40 },
        { text: 'INDIAN OCEAN', lat: -8, lng: 78 },
        { text: 'EURASIA', lat: 54, lng: 75 },
        { text: 'NORTH AMERICA', lat: 46, lng: -102 },
      ];
      ctx2d.save();
      ctx2d.font = 'italic 600 13px "Cormorant Garamond", serif';
      ctx2d.fillStyle = 'rgba(248, 238, 210, 0.22)';
      ctx2d.textAlign = 'center';
      seaLabels.forEach((lbl) => {
        const lp = projectWithCamera(lbl.lat, unwrapNear(lbl.lng, cam.centerLng), cam, w, h);
        if (lp.x > mapLeft + 40 && lp.x < mapRight - 40 && lp.y > mapTop + 25 && lp.y < mapBottom - 25) {
          ctx2d.fillText(lbl.text, lp.x, lp.y);
        }
      });

      const worldRefCities = [
        { name: currentLang === 'zh' ? '東京' : 'Tokyo', lat: 35.68, lng: 139.69 },
        { name: currentLang === 'zh' ? '柏林' : 'Berlin', lat: 52.52, lng: 13.4 },
        { name: currentLang === 'zh' ? '倫敦' : 'London', lat: 51.51, lng: -0.13 },
        { name: currentLang === 'zh' ? '巴黎' : 'Paris', lat: 48.85, lng: 2.35 },
        { name: currentLang === 'zh' ? '舊金山' : 'San Francisco', lat: 37.77, lng: -122.42 },
        { name: currentLang === 'zh' ? '紐約' : 'New York', lat: 40.71, lng: -74.01 },
      ];
      ctx2d.font = '500 11px "Noto Sans TC", sans-serif';
      worldRefCities.forEach((wc) => {
        const wp = projectWithCamera(wc.lat, unwrapNear(wc.lng, cam.centerLng), cam, w, h);
        if (wp.x > mapLeft + 24 && wp.x < mapRight - 24 && wp.y > mapTop + 20 && wp.y < mapBottom - 20) {
          ctx2d.fillStyle = 'rgba(248, 238, 210, 0.34)';
          ctx2d.beginPath();
          ctx2d.arc(wp.x, wp.y, 2, 0, Math.PI * 2);
          ctx2d.fill();
          ctx2d.textAlign = 'left';
          ctx2d.fillText(wc.name, wp.x + 5, wp.y + 3.5);
        }
      });
      ctx2d.restore();
    }

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

    // 4. 繪製雙人專屬顏色軌跡線（使用預先取樣快取，避免每幀重算貝茲曲線與頻繁 save/restore）
    const trajCache = getTimelineTrajectoryCache(totalSegs);

    const drawRoleTrajectory = (roleKey, strokeActive, strokeRecent, strokePast, liftSign) => {
      const segs = trajCache[roleKey];
      const steps = trajCache.steps;

      // 未來航段淡虛線預覽（合併設定 lineDash）
      ctx2d.strokeStyle = roleKey === 'tom' ? 'rgba(56, 189, 248, 0.13)' : 'rgba(244, 114, 182, 0.13)';
      ctx2d.lineWidth = 1.3;
      ctx2d.setLineDash([4, 6]);
      for (let i = 0; i < totalSegs; i++) {
        const seg = segs[i];
        if (!seg || (seg.isStatic && i !== segIdx)) continue;
        const shiftLng = unwrapNear(seg.midLng, cam.centerLng) - seg.midLng;
        ctx2d.beginPath();
        for (let s = 0; s <= steps; s++) {
          const g = seg.points[s];
          const pt = projectWithCamera(g.lat, g.lng + shiftLng, cam, w, h);
          if (s === 0) ctx2d.moveTo(pt.x, pt.y);
          else ctx2d.lineTo(pt.x, pt.y);
        }
        ctx2d.stroke();
      }
      ctx2d.setLineDash([]);

      // 已走過的軌跡實線
      for (let i = 0; i < totalSegs; i++) {
        const seg = segs[i];
        if (!seg || (seg.isStatic && i !== segIdx)) continue;
        if (!(i < segIdx || (i === segIdx && segFrac > 0.001))) continue;

        const shiftLng = unwrapNear(seg.midLng, cam.centerLng) - seg.midLng;
        const isCurrentLeg = i === segIdx && exactStep < totalSegs;
        const isRecentLeg = segIdx - i <= 3 || progress >= 0.99;
        const tMax = i < segIdx ? 1 : segFrac;

        ctx2d.strokeStyle = isCurrentLeg ? strokeActive : isRecentLeg ? strokeRecent : strokePast;
        ctx2d.lineWidth = isCurrentLeg ? 3.8 : isRecentLeg ? 2.5 : 1.7;
        ctx2d.beginPath();
        if (i < segIdx) {
          for (let s = 0; s <= steps; s++) {
            const g = seg.points[s];
            const pt = projectWithCamera(g.lat, g.lng + shiftLng, cam, w, h);
            if (s === 0) ctx2d.moveTo(pt.x, pt.y);
            else ctx2d.lineTo(pt.x, pt.y);
          }
        } else {
          for (let s = 0; s <= steps; s++) {
            const t = (s / steps) * tMax;
            const g = sampleRolePathLatLng(seg.sA, seg.sB, t, liftSign);
            const pt = projectWithCamera(g.lat, g.lng + shiftLng, cam, w, h);
            if (s === 0) ctx2d.moveTo(pt.x, pt.y);
            else ctx2d.lineTo(pt.x, pt.y);
          }
        }
        ctx2d.stroke();

        // Flighty 風格流光飛行尾跡 (Comet Trail) 與飛行方向箭頭
        if (isCurrentLeg && segFrac > 0.03 && segFrac < 0.99 && !seg.isStatic) {
          const trailSteps = 6;
          const trailSpan = 0.16;
          ctx2d.save();
          ctx2d.lineCap = 'round';
          let prevPt = null;
          let lastAngle = 0;
          for (let k = 0; k <= trailSteps; k++) {
            const frac = k / trailSteps;
            const tt = Math.max(0, segFrac - trailSpan * (1 - frac));
            const gg = sampleRolePathLatLng(seg.sA, seg.sB, tt, liftSign);
            const pt = projectWithCamera(gg.lat, gg.lng + shiftLng, cam, w, h);
            if (prevPt) {
              ctx2d.strokeStyle =
                roleKey === 'tom'
                  ? `rgba(186, 230, 253, ${(0.18 + frac * 0.78).toFixed(2)})`
                  : `rgba(251, 207, 232, ${(0.18 + frac * 0.78).toFixed(2)})`;
              ctx2d.lineWidth = 1.6 + frac * 4.4;
              ctx2d.beginPath();
              ctx2d.moveTo(prevPt.x, prevPt.y);
              ctx2d.lineTo(pt.x, pt.y);
              ctx2d.stroke();
              const dx = pt.x - prevPt.x;
              const dy = pt.y - prevPt.y;
              if (Math.hypot(dx, dy) > 0.8) {
                lastAngle = Math.atan2(dy, dx);
              }
            }
            prevPt = pt;
          }
          // 飛行方向小紙飛機／星芒箭頭
          if (prevPt) {
            ctx2d.translate(prevPt.x, prevPt.y);
            ctx2d.rotate(lastAngle);
            ctx2d.fillStyle = '#fef3c7';
            ctx2d.beginPath();
            ctx2d.moveTo(10, 0);
            ctx2d.lineTo(-5, -4.5);
            ctx2d.lineTo(-2.5, 0);
            ctx2d.lineTo(-5, 4.5);
            ctx2d.closePath();
            ctx2d.fill();
          }
          ctx2d.restore();
        }

        // 若有美西/杜拜轉機節點且已飛過轉機點，標示一個小轉機圓點
        if (seg.sB.via && tMax >= 0.55) {
          const vPt = projectWithCamera(seg.sB.via.lat, unwrapNear(seg.sB.via.lng, cam.centerLng), cam, w, h);
          ctx2d.fillStyle = strokeActive;
          ctx2d.beginPath();
          ctx2d.arc(vPt.x, vPt.y, 3.5, 0, Math.PI * 2);
          ctx2d.fill();
        }
      }
    };

    // 先畫兩人的歷史足跡節點小圓點
    LOVE_FOOTPRINTS_DATA.forEach((item, idx) => {
      if (idx > segIdx + (segFrac > 0.85 ? 1 : 0)) return;
      const tPt = projectWithCamera(item.tom.lat, unwrapNear(item.tom.lng, cam.centerLng), cam, w, h);
      const ePt = projectWithCamera(item.eunice.lat, unwrapNear(item.eunice.lng, cam.centerLng), cam, w, h);

      ctx2d.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx2d.beginPath();
      ctx2d.arc(tPt.x, tPt.y, 4, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.fillStyle = 'rgba(244, 114, 182, 0.65)';
      ctx2d.beginPath();
      ctx2d.arc(ePt.x, ePt.y, 4, 0, Math.PI * 2);
      ctx2d.fill();
    });

    // 繪製 Tom (星空藍) 與 Eunice (玫瑰粉) 的軌跡弧線
    drawRoleTrajectory(
      'tom',
      '#38bdf8',
      'rgba(56, 189, 248, 0.78)',
      'rgba(56, 189, 248, 0.34)',
      1
    );
    drawRoleTrajectory(
      'eunice',
      '#f472b6',
      'rgba(244, 114, 182, 0.78)',
      'rgba(244, 114, 182, 0.34)',
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

      // Polarsteps 風格：重逢／求婚／婚禮暖香檳金微光綻放 (Reunion Bloom)
      const prevStepDistKm = calcDistanceKm(stepA.tom.lat, stepA.tom.lng, stepA.eunice.lat, stepA.eunice.lng);
      const isReunionOrFinale = prevStepDistKm > 80 || activeIdx >= LOVE_FOOTPRINTS_DATA.length - 2;
      const pulsePhase = (progress * 18) % 1;
      ctx2d.save();
      const bloomR = isReunionOrFinale ? 36 + Math.sin(progress * Math.PI * 10) * 6 : 26;
      const bloomGrad = ctx2d.createRadialGradient(midX, midY, 4, midX, midY, bloomR);
      bloomGrad.addColorStop(0, isReunionOrFinale ? 'rgba(255, 224, 140, 0.42)' : 'rgba(255, 224, 140, 0.22)');
      bloomGrad.addColorStop(1, 'rgba(255, 224, 140, 0)');
      ctx2d.fillStyle = bloomGrad;
      ctx2d.beginPath();
      ctx2d.arc(midX, midY, bloomR, 0, Math.PI * 2);
      ctx2d.fill();

      // 柔和擴散光環漣漪 (Arrival / Reunion Ripple)
      ctx2d.strokeStyle = `rgba(255, 224, 140, ${((1 - pulsePhase) * (isReunionOrFinale ? 0.58 : 0.32)).toFixed(2)})`;
      ctx2d.lineWidth = isReunionOrFinale ? 2 : 1.4;
      ctx2d.beginPath();
      ctx2d.arc(midX, midY, 18 + pulsePhase * (isReunionOrFinale ? 34 : 20), 0, Math.PI * 2);
      ctx2d.stroke();
      ctx2d.restore();
    } else {
      // 遠距離飛行抵達光暈漣漪 (Arrival Ripple)
      if (segFrac >= 0.85 || rawSegFrac <= 0.25) {
        const rip = segFrac >= 0.85 ? (segFrac - 0.85) / 0.15 : rawSegFrac / 0.25;
        ctx2d.save();
        [
          { x: tomDrawX, y: tomDrawY, col: `rgba(125, 211, 252, ${((1 - rip) * 0.48).toFixed(2)})` },
          { x: euniceDrawX, y: euniceDrawY, col: `rgba(249, 168, 212, ${((1 - rip) * 0.48).toFixed(2)})` },
        ].forEach((pt) => {
          ctx2d.strokeStyle = pt.col;
          ctx2d.lineWidth = 1.6;
          ctx2d.beginPath();
          ctx2d.arc(pt.x, pt.y, 14 + rip * 22, 0, Math.PI * 2);
          ctx2d.stroke();
        });
        ctx2d.restore();
      }
      ctx2d.save();
      ctx2d.strokeStyle = '#ffd166';
      ctx2d.lineWidth = 2.6;
      ctx2d.setLineDash([7, 6]);
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
    if (timelineDistWidthCache.text !== distBadgeText) {
      timelineDistWidthCache = {
        text: distBadgeText,
        width: ctx2d.measureText(distBadgeText).width,
      };
    }
    const dBadgeW = timelineDistWidthCache.width + 24;
    const dBadgeH = 28;
    const clampedBadgeX = Math.max(mapLeft + dBadgeW / 2 + 10, Math.min(mapRight - dBadgeW / 2 - 10, tetherMidX));
    const clampedBadgeY = Math.max(mapTop + dBadgeH / 2 + 10, Math.min(mapBottom - dBadgeH / 2 - 10, tetherMidY));

    ctx2d.fillStyle = isTogether ? 'rgba(42, 22, 34, 0.94)' : 'rgba(28, 36, 22, 0.94)';
    ctx2d.strokeStyle = '#ffd166';
    ctx2d.lineWidth = 1.8;
    ctx2d.beginPath();
    ctx2d.roundRect(clampedBadgeX - dBadgeW / 2, clampedBadgeY - dBadgeH / 2, dBadgeW, dBadgeH, 999);
    ctx2d.fill();
    ctx2d.stroke();

    ctx2d.fillStyle = '#ffd166';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(distBadgeText, clampedBadgeX, clampedBadgeY + 0.5);
    ctx2d.restore();

    // 宮崎駿天空積雲、森林螢火微光、煤炭球與飛行羅盤裝飾
    const cloudDrift = progress * 260;
    drawGhibliCloud(ctx2d, mapLeft + ((140 + cloudDrift) % (mapW + 140)) - 70, mapTop + 46, 0.72, 0.14);
    drawGhibliCloud(ctx2d, mapLeft + ((680 + cloudDrift * 0.7) % (mapW + 160)) - 80, mapTop + 62, 0.56, 0.12);
    drawGhibliCloud(ctx2d, mapLeft + ((1020 - cloudDrift * 0.5 + 1200) % (mapW + 140)) - 70, mapBottom - 44, 0.5, 0.11);

    // 森林微光粒子 (木靈 / 螢火)
    ctx2d.save();
    for (let i = 0; i < 14; i++) {
      const fx = mapLeft + ((i * 97 + progress * 45) % mapW);
      const fy = mapTop + ((i * 61 + Math.sin(progress * Math.PI * 4 + i) * 16 + mapH) % mapH);
      ctx2d.fillStyle = i % 2 === 0 ? 'rgba(255, 226, 138, 0.32)' : 'rgba(176, 242, 182, 0.26)';
      ctx2d.beginPath();
      ctx2d.arc(fx, fy, i % 3 === 0 ? 2.4 : 1.6, 0, Math.PI * 2);
      ctx2d.fill();
    }
    ctx2d.restore();

    // 角落小煤炭球 & 飛行羅盤
    drawGhibliSootSprite(ctx2d, mapRight - 34, mapTop + 32 + Math.sin(progress * Math.PI * 6) * 4, 8.5, progress * 6);
    drawGhibliSootSprite(ctx2d, mapRight - 56, mapTop + 44 + Math.cos(progress * Math.PI * 6) * 3, 6.2, progress * 5 + 1);
    drawGhibliCompassRose(ctx2d, mapLeft + 44, mapBottom - 44, 22);

    // Polarsteps 風格：右下角即時累計飛行里程儀表 (Cumulative Journey Distance HUD)
    let cumKm = 0;
    for (let i = 0; i < totalSegs; i++) {
      if (i > segIdx) break;
      const frac = i < segIdx ? 1 : segFrac;
      const a = LOVE_FOOTPRINTS_DATA[i];
      const b = LOVE_FOOTPRINTS_DATA[i + 1];
      const dTom = calcDistanceKm((b.tom.from || a.tom).lat, (b.tom.from || a.tom).lng, b.tom.lat, b.tom.lng);
      const dEun = calcDistanceKm((b.eunice.from || a.eunice).lat, (b.eunice.from || a.eunice).lng, b.eunice.lat, b.eunice.lng);
      cumKm += (dTom + dEun) * frac;
    }
    const cumKmRounded = Math.round(cumKm);
    const hudText =
      currentLang === 'zh'
        ? `✈ 累計里程 ${numberFormatter.format(cumKmRounded)} km`
        : `✈ ${numberFormatter.format(cumKmRounded)} km Traveled`;
    ctx2d.save();
    ctx2d.font = '600 12.5px "JetBrains Mono", "Noto Sans TC", sans-serif';
    const hudW = ctx2d.measureText(hudText).width + 22;
    const hudH = 26;
    const hudX = mapRight - hudW - 14;
    const hudY = mapBottom - hudH - 14;
    ctx2d.fillStyle = 'rgba(18, 30, 24, 0.84)';
    ctx2d.strokeStyle = 'rgba(232, 206, 152, 0.36)';
    ctx2d.lineWidth = 1.2;
    ctx2d.beginPath();
    ctx2d.roundRect(hudX, hudY, hudW, hudH, 999);
    ctx2d.fill();
    ctx2d.stroke();
    ctx2d.fillStyle = '#f0dec0';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(hudText, hudX + hudW / 2, hudY + hudH / 2 + 0.5);
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
    ctx2d.font = '700 16px "Noto Sans TC", sans-serif';
    ctx2d.textAlign = 'right';

    const stepCountStr = `${activeIdx + 1} / ${LOVE_FOOTPRINTS_DATA.length}`;
    ctx2d.fillStyle = 'rgba(232, 223, 201, 0.82)';
    ctx2d.fillText(stepCountStr, w - 42, legendY + 6);

    const drawLegendRole = (role, label, color, bgFill, rightX) => {
      ctx2d.fillStyle = color;
      ctx2d.textAlign = 'right';
      ctx2d.fillText(label, rightX, legendY + 6);
      const labelW = ctx2d.measureText(label).width;
      const lineEndX = rightX - labelW - 10;
      const lineStartX = lineEndX - 32;
      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = 4.5;
      ctx2d.lineCap = 'round';
      ctx2d.beginPath();
      ctx2d.moveTo(lineStartX, legendY);
      ctx2d.lineTo(lineEndX, legendY);
      ctx2d.stroke();
      drawAvatarCircle(ctx2d, role, lineStartX - 18, legendY, 11.5, color, bgFill);
      return lineStartX - 44;
    };

    const tomRightX = drawLegendRole('eunice', 'Eunice', '#f472b6', '#360e26', w - 118);
    drawLegendRole('tom', 'Tom', '#38bdf8', '#0a2034', tomRightX);
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
    const eCityStr = `Eunice: ${currentItem.eunice.city[currentLang]}`;
    const tCityStr = `Tom: ${currentItem.tom.city[currentLang]}`;
    const cityCacheKey = `${currentLang}:${activeIdx}`;
    if (timelineCityWidthCache.key !== cityCacheKey) {
      timelineCityWidthCache = {
        key: cityCacheKey,
        eCityW: ctx2d.measureText(eCityStr).width,
        tCityW: ctx2d.measureText(tCityStr).width,
      };
    }
    const eCityW = timelineCityWidthCache.eCityW;
    const tCityW = timelineCityWidthCache.tCityW;
    const rightEdge = cardX + cardW - 26;
    ctx2d.fillStyle = '#be185d';
    ctx2d.fillText(eCityStr, rightEdge, cardY + 34);
    drawAvatarCircle(ctx2d, 'eunice', rightEdge - eCityW - 14, cardY + 29, 9, '#f472b6', '#360e26');

    const tomRightEdge = rightEdge - eCityW - 38;
    ctx2d.fillStyle = '#0369a1';
    ctx2d.fillText(tCityStr, tomRightEdge, cardY + 34);
    drawAvatarCircle(ctx2d, 'tom', tomRightEdge - tCityW - 14, cardY + 29, 9, '#38bdf8', '#0a2034');

    ctx2d.textAlign = 'left';
    ctx2d.fillStyle = '#1f3024';
    ctx2d.font = '700 23px "Noto Serif TC", serif';
    ctx2d.fillText(currentItem.place[currentLang], cardX + 26, cardY + 72, cardW - 52);

    ctx2d.fillStyle = '#4e6353';
    ctx2d.font = '500 17px "Noto Sans TC", sans-serif';
    ctx2d.fillText(currentItem.desc[currentLang], cardX + 26, cardY + 106, cardW - 52);
    ctx2d.restore();

    if (elTimelineScrubberFill) {
      const pct = Math.round(progress * 100);
      if (pct !== timelineLastScrubberPct) {
        timelineLastScrubberPct = pct;
        elTimelineScrubberFill.style.width = `${pct}%`;
      }
    }

    if (LOVE_FOOTPRINTS_DATA.length > 1) {
      const activeIdx = Math.max(
        0,
        Math.min(
          LOVE_FOOTPRINTS_DATA.length - 1,
          Math.round(progress * (LOVE_FOOTPRINTS_DATA.length - 1))
        )
      );
      syncActiveTimelineCard(activeIdx);
    }
  }

  const FOOTPRINT_BGM_SRC = 'audio/music.m4a';
  let footprintGhibliEnabled = false;
  let footprintGhibliPlaying = false;
  let footprintAudioEl = null;

  function syncFootprintBgmUi() {
    if (!btnTimelineBgm) return;
    if (!footprintGhibliEnabled) {
      btnTimelineBgm.textContent = currentLang === 'en' ? '🔇 Music: Off' : '🔇 配樂：關';
      btnTimelineBgm.setAttribute('aria-pressed', 'false');
    } else if (footprintGhibliPlaying) {
      btnTimelineBgm.textContent = currentLang === 'en' ? '🎵 Music: On' : '🎵 配樂播放中';
      btnTimelineBgm.setAttribute('aria-pressed', 'true');
    } else {
      btnTimelineBgm.textContent = currentLang === 'en' ? '🎵 Music: Ready' : '🎵 配樂：開';
      btnTimelineBgm.setAttribute('aria-pressed', 'false');
    }
  }

  function startFootprintGhibliBgm() {
    if (!footprintGhibliEnabled || footprintGhibliPlaying) return;
    if (bgmPlaying && typeof toggleBgm === 'function') {
      toggleBgm();
    }
    if (!footprintAudioEl) {
      const audio = new Audio(FOOTPRINT_BGM_SRC);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.7;
      footprintAudioEl = audio;
    }
    const playPromise = footprintAudioEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        footprintGhibliPlaying = false;
        syncFootprintBgmUi();
      });
    }
    footprintGhibliPlaying = true;
    syncFootprintBgmUi();
  }

  function stopFootprintGhibliBgm() {
    footprintGhibliPlaying = false;
    if (footprintAudioEl) {
      footprintAudioEl.pause();
    }
    syncFootprintBgmUi();
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
      stopFootprintGhibliBgm();
      if (btnTimelinePlay) btnTimelinePlay.textContent = t().timelinePlayBtn;
      drawTimelineVideoFrame(1);
      if (typeof syncTimelineFullscreenControls === 'function') syncTimelineFullscreenControls(0);
      return;
    }

    const minFrameMs = isMobileFootprintPerf() ? 33 : 0;
    if (!timelineLastDrawTs || ts - timelineLastDrawTs >= minFrameMs) {
      timelineLastDrawTs = ts;
      drawTimelineVideoFrame(timelineProgress);
    }
    timelineAnimId = requestAnimationFrame(stepTimelineAnimation);
  }

  function togglePlayTimeline() {
    const dict = t();
    if (timelinePlaying) {
      timelinePlaying = false;
      stopFootprintGhibliBgm();
      if (timelineAnimId) cancelAnimationFrame(timelineAnimId);
      if (btnTimelinePlay) btnTimelinePlay.textContent = dict.timelinePlayBtn;
      if (typeof syncTimelineFullscreenControls === 'function') syncTimelineFullscreenControls(0);
      return;
    }
    if (timelineProgress >= 0.99) {
      timelineProgress = 0;
    }
    timelinePlaying = true;
    timelineLastTs = 0;
    timelineLastDrawTs = 0;
    startFootprintGhibliBgm();
    if (btnTimelinePlay) btnTimelinePlay.textContent = dict.timelinePauseBtn;
    timelineAnimId = requestAnimationFrame(stepTimelineAnimation);
    if (typeof syncTimelineFullscreenControls === 'function') syncTimelineFullscreenControls(1400);
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

  if (btnTimelinePlay) btnTimelinePlay.addEventListener('click', togglePlayTimeline);
  if (btnTimelinePrev) btnTimelinePrev.addEventListener('click', () => stepTimelineMilestone(-1));
  if (btnTimelineNext) btnTimelineNext.addEventListener('click', () => stepTimelineMilestone(1));
  if (btnTimelineSpeed) btnTimelineSpeed.addEventListener('click', cycleTimelineSpeed);
  if (btnTimelineReplay) btnTimelineReplay.addEventListener('click', replayTimeline);
  if (btnTimelineBgm) {
    btnTimelineBgm.addEventListener('click', () => {
      footprintGhibliEnabled = !footprintGhibliEnabled;
      if (!footprintGhibliEnabled) {
        stopFootprintGhibliBgm();
      } else {
        startFootprintGhibliBgm();
      }
      syncFootprintBgmUi();
    });
    syncFootprintBgmUi();
  }

  let syncTimelineFullscreenControls = null;
  if (btnTimelineFullscreen && elFootprintMapStage) {
    const mapStageAnchor = document.createComment('footprint-map-stage-anchor');
    if (elFootprintMapStage.parentNode) {
      elFootprintMapStage.parentNode.insertBefore(mapStageAnchor, elFootprintMapStage.nextSibling);
    }

    const isMapStageFullscreen = () =>
      document.fullscreenElement === elFootprintMapStage ||
      document.webkitFullscreenElement === elFootprintMapStage ||
      elFootprintMapStage.classList.contains('is-css-fullscreen');

    let controlsAutoHideTimer = null;
    const controlsEl = elFootprintMapStage.querySelector('.timeline-video-controls');
    const setControlsHidden = (hidden) => {
      elFootprintMapStage.classList.toggle('is-controls-hidden', hidden);
      if (controlsEl) {
        controlsEl.classList.toggle('is-hidden', hidden);
      }
    };
    syncTimelineFullscreenControls = (autoHideDelayMs = 3000) => {
      if (controlsAutoHideTimer) {
        clearTimeout(controlsAutoHideTimer);
        controlsAutoHideTimer = null;
      }
      if (!isMapStageFullscreen() || !timelinePlaying) {
        setControlsHidden(false);
        return;
      }
      if (autoHideDelayMs === 0) {
        setControlsHidden(true);
        return;
      }
      setControlsHidden(false);
      controlsAutoHideTimer = setTimeout(() => {
        if (isMapStageFullscreen() && timelinePlaying) {
          setControlsHidden(true);
        }
      }, autoHideDelayMs);
    };

    if (controlsEl) {
      controlsEl.addEventListener(
        'pointerdown',
        () => {
          if (isMapStageFullscreen() && timelinePlaying) {
            syncTimelineFullscreenControls(3200);
          }
        },
        { passive: true }
      );
    }

    const restoreMapStage = () => {
      if (mapStageAnchor.parentNode && elFootprintMapStage.parentNode !== mapStageAnchor.parentNode) {
        mapStageAnchor.parentNode.insertBefore(elFootprintMapStage, mapStageAnchor);
      }
    };

    const syncMapFullscreenViewport = () => {
      if (!isMapStageFullscreen()) {
        elFootprintMapStage.style.removeProperty('--fs-vh');
        return;
      }
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      if (vh > 0) {
        elFootprintMapStage.style.setProperty('--fs-vh', `${Math.round(vh)}px`);
      }
      requestAnimationFrame(() => {
        if (typeof drawTimelineVideoFrame === 'function') {
          drawTimelineVideoFrame(timelineProgress);
        }
      });
    };

    const syncMapFullscreenUi = () => {
      const active = isMapStageFullscreen();
      if (!elFootprintMapStage.classList.contains('is-css-fullscreen')) {
        restoreMapStage();
      }
      btnTimelineFullscreen.textContent = active
        ? currentLang === 'en'
          ? '✕ Exit'
          : '✕ 退出全螢幕'
        : currentLang === 'en'
          ? '⛶ Fullscreen'
          : '⛶ 全螢幕';
      document.documentElement.classList.toggle('carousel-fullscreen-open', active);
      document.body.classList.toggle('carousel-fullscreen-open', active);
      syncMapFullscreenViewport();
      syncTimelineFullscreenControls(active && timelinePlaying ? 1800 : 0);
    };

    let orientationSettleTimer = null;
    const handleMapOrientationOrResize = () => {
      if (!isMapStageFullscreen()) return;
      syncMapFullscreenViewport();
      if (orientationSettleTimer) clearTimeout(orientationSettleTimer);
      orientationSettleTimer = setTimeout(syncMapFullscreenViewport, 140);
    };
    window.addEventListener('orientationchange', handleMapOrientationOrResize, { passive: true });
    window.addEventListener('resize', handleMapOrientationOrResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleMapOrientationOrResize, { passive: true });
    }

    const toggleMapFullscreen = async () => {
      if (isMapStageFullscreen()) {
        elFootprintMapStage.classList.remove('is-css-fullscreen');
        restoreMapStage();
        if (document.fullscreenElement === elFootprintMapStage && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement === elFootprintMapStage && document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        syncMapFullscreenUi();
        return;
      }
      const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const canNativeFs = !isCoarsePointer && document.fullscreenEnabled !== false;
      if (canNativeFs && elFootprintMapStage.requestFullscreen) {
        try {
          await elFootprintMapStage.requestFullscreen();
          if (document.fullscreenElement === elFootprintMapStage) {
            syncMapFullscreenUi();
            return;
          }
        } catch (_err) {
          // Fallback to CSS fullscreen below
        }
      }
      if (elFootprintMapStage.parentNode !== document.body) {
        document.body.append(elFootprintMapStage);
      }
      elFootprintMapStage.classList.add('is-css-fullscreen');
      syncMapFullscreenUi();
    };

    btnTimelineFullscreen.addEventListener('click', toggleMapFullscreen);
    document.addEventListener('fullscreenchange', syncMapFullscreenUi);
    document.addEventListener('webkitfullscreenchange', syncMapFullscreenUi);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elFootprintMapStage.classList.contains('is-css-fullscreen')) {
        elFootprintMapStage.classList.remove('is-css-fullscreen');
        syncMapFullscreenUi();
      }
    });
    syncMapFullscreenUi();
  }
  if (elTimelineVideoCanvas) {
    elTimelineVideoCanvas.style.cursor = 'pointer';
    elTimelineVideoCanvas.addEventListener('click', () => {
      const inFs =
        elFootprintMapStage &&
        (document.fullscreenElement === elFootprintMapStage ||
          document.webkitFullscreenElement === elFootprintMapStage ||
          elFootprintMapStage.classList.contains('is-css-fullscreen'));
      if (inFs && timelinePlaying && typeof syncTimelineFullscreenControls === 'function') {
        if (elFootprintMapStage.classList.contains('is-controls-hidden')) {
          syncTimelineFullscreenControls(3200);
        } else {
          syncTimelineFullscreenControls(0);
        }
        return;
      }
      togglePlayTimeline();
    });
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

  function renderQuizIntroLanguage() {
    const isEn = currentLang === 'en';
    if (elQuizIntroEyebrow) {
      elQuizIntroEyebrow.textContent = 'COUPLE TRIVIA · WARM-UP + 10 Qs';
    }
    if (elQuizIntroTitle) {
      elQuizIntroTitle.textContent = isEn
        ? 'Tom & Eunice Couple Trivia'
        : 'Tom & Eunice 小默契問答';
    }
    if (elQuizIntroDesc) {
      elQuizIntroDesc.textContent = isEn
        ? 'Take on 1 warm-up + 10 trivia questions (11 total) to test how well you know the groom and bride!'
        : '挑戰 1 道暖身題與 10 道關於新人的趣味問答（共 11 題），看看你對新郎還是新娘最熟悉！';
    }
    if (btnQuizStart) {
      btnQuizStart.textContent = isEn ? 'Start the Quiz →' : '開始挑戰問答 →';
    }
    if (elQuizIntroTiers) {
      const tiers = isEn
        ? [
            {
              score: '✨ Little Surprise',
              desc: 'Rumor has it a high score unlocks an unexpected surprise at the end...',
              hi: true,
            },
          ]
        : [
            {
              score: '✨ 神秘小驚喜',
              desc: '聽說高分通關，結算時會出現意想不到的小驚喜喔…',
              hi: true,
            },
          ];
      const nodes = tiers.map((tier) => {
        const row = document.createElement('div');
        row.className = `quiz-intro-tier${tier.hi ? ' is-highlight' : ''}`;
        const s = document.createElement('span');
        s.className = 'quiz-intro-tier-score';
        s.textContent = tier.score;
        const d = document.createElement('span');
        d.className = 'quiz-intro-tier-desc';
        d.textContent = tier.desc;
        row.append(s, d);
        return row;
      });
      elQuizIntroTiers.replaceChildren(...nodes);
    }
  }

  const STORAGE_KEY_QUIZ_BEST_SCORE = 'te_wedding_quiz_best_score_v1';

  function getBestQuizScore() {
    const raw = Number(safeGetStorage(STORAGE_KEY_QUIZ_BEST_SCORE) || 0);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  function recordBestQuizScore(score) {
    const num = Number(score);
    if (!Number.isFinite(num) || num <= getBestQuizScore()) return;
    safeSetStorage(STORAGE_KEY_QUIZ_BEST_SCORE, String(Math.floor(num)));
  }

  function showQuizIntro() {
    quizStarted = false;
    quizIndex = 0;
    quizScore = 0;
    groomScore = 0;
    brideScore = 0;
    quizAnswered = false;
    pendingSelectedOption = null;
    lastSelectedOption = null;
    cipherClueRevealed = false;
    renderQuizIntroLanguage();
    syncPlayerNameAndPasscodeUi();
    if (elQuizIntroView) elQuizIntroView.classList.remove('hidden');
    elQuizQuestionView.classList.add('hidden');
    elQuizSummaryView.classList.add('hidden');
    if (elPasscodeRedeemCard) {
      elPasscodeRedeemCard.classList.toggle('hidden', getBestQuizScore() <= 6);
    }
    renderAdminLeaderboardPanel();
  }

  function startQuiz() {
    shuffleQuestionOptions();
    quizStarted = true;
    quizStartedAtMs = getMonotonicNowMs();
    requestQuizStartToken();
    lastQuizDurationSec = null;
    hasSubmittedCurrentQuiz = false;
    quizIndex = 0;
    quizScore = 0;
    groomScore = 0;
    brideScore = 0;
    quizAnswered = false;
    pendingSelectedOption = null;
    lastSelectedOption = null;
    cipherClueRevealed = false;
    if (elQuizIntroView) elQuizIntroView.classList.add('hidden');
    elQuizSummaryView.classList.add('hidden');
    if (elQuizHighscoreForm) elQuizHighscoreForm.classList.add('hidden');
    if (elQuizSubmitStatus) elQuizSubmitStatus.classList.add('hidden');
    if (elPasscodeRedeemCard) elPasscodeRedeemCard.classList.add('hidden');
    elQuizQuestionView.classList.remove('hidden');
    renderCurrentQuizQuestion();
  }

  function sanitizeGuestNameInput(raw) {
    return String(raw || '')
      .replace(/[\u0000-\u001f\u007f<>`"'\\;{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[=+\-@]+/, '')
      .trim()
      .slice(0, 40);
  }

  function setPlayerName(name) {
    currentPlayerName = sanitizeGuestNameInput(name);
    safeSetStorage(STORAGE_KEY_PLAYER_NAME, currentPlayerName);
    if (elQuizPlayerNameInput && elQuizPlayerNameInput.value !== currentPlayerName) {
      elQuizPlayerNameInput.value = currentPlayerName;
    }
    if (elPasscodeNameInput && elPasscodeNameInput.value !== currentPlayerName) {
      elPasscodeNameInput.value = currentPlayerName;
    }
  }

  function syncPlayerNameAndPasscodeUi() {
    if (currentPlayerName) {
      if (elQuizPlayerNameInput && !elQuizPlayerNameInput.value) {
        elQuizPlayerNameInput.value = currentPlayerName;
      }
      if (elPasscodeNameInput && !elPasscodeNameInput.value) {
        elPasscodeNameInput.value = currentPlayerName;
      }
    }
    if (elQuizPlayerNameLabel) {
      elQuizPlayerNameLabel.textContent =
        currentLang === 'en'
          ? '🏆 10+ Correct! Enter your name for the Leaderboard'
          : '🏆 答對 10 題以上！輸入您的大名登上高分榜';
    }
    if (btnQuizHighscoreSubmit) {
      btnQuizHighscoreSubmit.textContent = currentLang === 'en' ? 'Submit Score' : '登記成績';
    }
    if (elQuizPlayerNameInput) {
      elQuizPlayerNameInput.placeholder =
        currentLang === 'en' ? 'Your Name (e.g. Alex Chen)' : '您的大名（例如：王小明）';
    }
    if (elPasscodeCardEyebrow) {
      elPasscodeCardEyebrow.textContent =
        currentLang === 'en'
          ? 'SECRET PASSCODE · OPTIONAL REGISTRATION'
          : 'SECRET PASSCODE · 選填通關登記處';
    }
    if (elPasscodeCardTitle) {
      elPasscodeCardTitle.textContent =
        currentLang === 'en'
          ? '🗝️ Found the Secret Chamber Passcode?'
          : '🗝️ 已找到隱藏彩蛋的密語？';
    }
    if (elPasscodeCardDesc) {
      elPasscodeCardDesc.textContent =
        currentLang === 'en'
          ? 'Enter your name and the secret passcode to register on the hall of fame!'
          : '輸入您的大名與神秘密語，驗證成功後將為您登記通關紀錄！';
    }
    if (elPasscodeNameInput) {
      elPasscodeNameInput.placeholder =
        currentLang === 'en' ? 'Your Name (e.g. Alex Chen)' : '您的大名（例如：王小明）';
    }
    if (elPasscodeCodeInput) {
      elPasscodeCodeInput.placeholder =
        currentLang === 'en' ? 'Paste or type the secret passcode...' : '請貼上或輸入密語...';
    }
    if (btnPasscodeVerify) {
      btnPasscodeVerify.textContent =
        currentLang === 'en' ? '🗝️ Verify & Register' : '🗝️ 驗證並登記通關';
    }
  }

  async function sha256HexForPasscode(str) {
    if (!window.crypto || !window.crypto.subtle) return '';
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function getLeaderboardDeviceId() {
    const storageKey = 'te_device_seal_id';
    let devId = safeGetStorage(storageKey);
    if (!devId) {
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const arr = new Uint8Array(12);
        window.crypto.getRandomValues(arr);
        devId = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
      } else {
        devId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      }
      safeSetStorage(storageKey, devId);
    }
    return devId;
  }

  const ADMIN_LB_KEY_SESSION = 'te_admin_lb_key';

  function getAdminLbKey() {
    try {
      return window.sessionStorage.getItem(ADMIN_LB_KEY_SESSION) || '';
    } catch (_e) {
      return '';
    }
  }

  function setAdminLbKey(val) {
    try {
      const cleaned = String(val || '').trim().slice(0, 128);
      if (cleaned) {
        window.sessionStorage.setItem(ADMIN_LB_KEY_SESSION, cleaned);
      } else {
        window.sessionStorage.removeItem(ADMIN_LB_KEY_SESSION);
      }
    } catch (_e) {
      // Ignore storage error
    }
  }

  async function postLeaderboardEvent(payload) {
    if (!LEADERBOARD_ENDPOINT_URL) {
      return { sent: false, reason: 'unconfigured' };
    }
    try {
      const enriched = Object.assign({}, payload, { deviceId: getLeaderboardDeviceId() });
      if (isAdminOnlyUnlocked()) {
        const adminKey = getAdminLbKey();
        if (adminKey) {
          enriched.adminKey = adminKey;
          if (enriched.action === 'quiz' || enriched.action === 'passcode') {
            enriched.isTest = true;
          }
        }
      }
      const res = await fetchWithAbortTimeout(
        LEADERBOARD_ENDPOINT_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(enriched),
        },
        12000
      );
      if (!res.ok) return { sent: true, ok: false };
      const data = await res.json().catch(() => ({ ok: true }));
      if (data && data.name) {
        setPlayerName(data.name);
      }
      return {
        sent: true,
        ok: Boolean(data && data.ok !== false),
        error: (data && data.error) || '',
        deletedCount: typeof data.deletedCount === 'number' ? data.deletedCount : 0,
        canonicalName: (data && data.name) || payload.name || '',
        mergedByDevice: Boolean(data && data.mergedByDevice),
      };
    } catch (_err) {
      return { sent: true, ok: false };
    }
  }

  function isAdminOnlyUnlocked() {
    return Boolean(window.__TE_DEBUG_AUTH__ === true);
  }

  function isStaffOrDebugUnlocked() {
    return Boolean(window.__TE_DEBUG_AUTH__ === true || window.__TE_STAFF_AUTH__ === true);
  }

  function renderAdminLeaderboardPanel() {
    if (!elQuizSection) return;
    let panel = document.getElementById('admin-leaderboard-card');
    if (!isStaffOrDebugUnlocked()) {
      if (panel) panel.remove();
      return;
    }
    const isDebugAdmin = isAdminOnlyUnlocked();
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'admin-leaderboard-card';
      panel.className = 'quiz-card admin-leaderboard-card';
      elQuizSection.append(panel);
    }

    panel.replaceChildren();
    const header = document.createElement('div');
    header.className = 'admin-lb-header';
    const title = document.createElement('h3');
    title.className = 'passcode-card-title';
    title.textContent = '🏆 後台即時排行榜（問答前幾名＆通關先鋒）';
    const headerActions = document.createElement('div');
    headerActions.style.display = 'flex';
    headerActions.style.flexWrap = 'wrap';
    headerActions.style.gap = '8px';
    headerActions.style.alignItems = 'center';

    if (LEADERBOARD_SHEET_URL) {
      const sheetBtn = document.createElement('a');
      sheetBtn.href = LEADERBOARD_SHEET_URL;
      sheetBtn.target = '_blank';
      sheetBtn.rel = 'noopener noreferrer';
      sheetBtn.className = 'secondary-btn admin-lb-refresh-btn';
      sheetBtn.style.textDecoration = 'none';
      sheetBtn.textContent = '📊 開啟試算表 ↗';
      headerActions.append(sheetBtn);
    }

    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'secondary-btn admin-lb-refresh-btn';
    refreshBtn.textContent = '🔄 重新整理排行';
    headerActions.append(refreshBtn);
    header.append(title, headerActions);

    // 後台測試工具列（僅存在於 debug.html，金鑰僅存於本次分頁 sessionStorage）
    const testBar = document.createElement('div');
    testBar.className = 'admin-lb-test-bar';
    const keyInput = document.createElement('input');
    keyInput.type = 'password';
    keyInput.className = 'quiz-player-name-input admin-lb-key-input';
    keyInput.placeholder = '🔑 輸入測試管理金鑰（啟用提前送出＆刪除測試資料）';
    keyInput.autocomplete = 'off';
    keyInput.value = getAdminLbKey();

    const saveKeyBtn = document.createElement('button');
    saveKeyBtn.type = 'button';
    saveKeyBtn.className = 'secondary-btn admin-lb-action-btn';
    saveKeyBtn.textContent = '🔓 啟用測試';

    const clearTestsBtn = document.createElement('button');
    clearTestsBtn.type = 'button';
    clearTestsBtn.className = 'secondary-btn admin-lb-action-btn admin-lb-danger-btn';
    clearTestsBtn.textContent = '🧹 清除全部測試資料';

    const testStatus = document.createElement('p');
    testStatus.className = 'admin-lb-test-status';
    const syncTestStatus = (customMsg) => {
      if (customMsg) {
        testStatus.textContent = customMsg;
        return;
      }
      testStatus.textContent = getAdminLbKey()
        ? '✅ 測試模式已啟用：在此頁送出的問答／密語將標記為測試資料（test_），不受開榜時間限制，並可隨時清除。'
        : 'ℹ️ 輸入測試管理金鑰後，即可在 2026/11/29 前從 debug.html 送出測試資料或刪除測試紀錄。';
    };
    syncTestStatus();

    saveKeyBtn.addEventListener('click', () => {
      setAdminLbKey(keyInput.value);
      syncTestStatus(
        getAdminLbKey()
          ? '✅ 測試金鑰已啟用（僅存於此分頁），正在載入排行榜並可送出測試資料！'
          : '已清除測試金鑰。'
      );
      loadData();
    });

    const body = document.createElement('div');
    body.className = 'admin-lb-body';
    if (isDebugAdmin) {
      testBar.append(keyInput, saveKeyBtn, clearTestsBtn);
      panel.append(header, testBar, testStatus, body);
    } else {
      panel.append(header, body);
    }

    const loadData = async () => {
      if (!LEADERBOARD_ENDPOINT_URL) {
        const note = document.createElement('p');
        note.className = 'passcode-card-desc';
        note.textContent =
          '尚未設定 Google Apps Script 網址。請先將 leaderboard-apps-script.gs 部署至 Google 試算表，並將網址填入 script.js 的 LEADERBOARD_ENDPOINT_URL 即可即時查看前幾名。';
        body.replaceChildren(note);
        return;
      }
      refreshBtn.disabled = true;
      const loadingP = document.createElement('p');
      loadingP.className = 'passcode-card-desc';
      loadingP.textContent = '載入排行榜中...';
      body.replaceChildren(loadingP);
      try {
        const res = await fetchWithAbortTimeout(
          LEADERBOARD_ENDPOINT_URL,
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'leaderboard' }),
          },
          12000
        );
        const json = await res.json();
        if (!json || !json.ok) {
          throw new Error((json && json.error) || 'bad_response');
        }

        const cols = document.createElement('div');
        cols.className = 'admin-lb-columns';

        const makeList = (headingText, items, formatter, allowDelete = false) => {
          const box = document.createElement('div');
          box.className = 'admin-lb-col';
          const h4 = document.createElement('h4');
          h4.className = 'admin-lb-col-title';
          h4.textContent = headingText;
          box.append(h4);
          if (!items || items.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'passcode-card-desc';
            empty.textContent = '目前尚無紀錄';
            box.append(empty);
          } else {
            const ol = document.createElement('ol');
            ol.className = 'admin-lb-list';
            items.forEach((item, idx) => {
              const li = document.createElement('li');
              li.className = 'admin-lb-item';
              const rank = document.createElement('span');
              rank.className = 'admin-lb-rank';
              rank.textContent = `#${idx + 1}`;
              const nameEl = document.createElement('span');
              nameEl.className = 'admin-lb-name';
              nameEl.textContent = item.isTest ? `🧪 ${item.name}` : item.name;
              const meta = document.createElement('span');
              meta.className = 'admin-lb-meta';
              meta.textContent = formatter(item);
              li.append(rank, nameEl, meta);
              if (allowDelete) {
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'admin-lb-del-btn';
                delBtn.title = `刪除「${item.name}」`;
                delBtn.textContent = '✕';
                delBtn.addEventListener('click', async () => {
                  if (!getAdminLbKey()) {
                    syncTestStatus('⚠️ 請先在上方輸入測試管理金鑰再執行刪除。');
                    keyInput.focus();
                    return;
                  }
                  if (!window.confirm(`確定要從試算表刪除「${item.name}」這筆紀錄嗎？`)) return;
                  delBtn.disabled = true;
                  const delRes = await postLeaderboardEvent({
                    action: 'delete_entry',
                    name: item.name,
                  });
                  if (delRes.ok) {
                    syncTestStatus(`🗑️ 已刪除「${item.name}」（共 ${delRes.deletedCount} 筆）。`);
                    loadData();
                  } else {
                    delBtn.disabled = false;
                    syncTestStatus(
                      delRes.error === 'unauthorized'
                        ? '❌ 測試管理金鑰不正確，刪除遭拒絕。'
                        : '❌ 刪除失敗，請稍後再試。'
                    );
                  }
                });
                li.append(delBtn);
              }
              ol.append(li);
            });
            box.append(ol);
          }
          return box;
        };

        const formatTime = (isoStr) => {
          if (!isoStr) return '';
          const s = String(isoStr).trim();
          if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
            return s.slice(11, 19);
          }
          const d = new Date(s);
          return Number.isNaN(d.getTime())
            ? ''
            : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        };

        const overallList = Array.isArray(json.topOverall) ? json.topOverall.slice(0, 5) : [];
        const overallBox = makeList(
          `🏆 綜合總排行榜 Top 5（👑 終極密語 ＞ 🗝️ 祝福密語 ＞ 🎯 10+ 答題｜共 ${json.totalPlayers || 0} 人）`,
          overallList,
          (it) => {
            const parts = [it.tierLabel || (it.passcodeTier >= 2 ? '👑 終極密語' : it.passcodeTier === 1 ? '🗝️ 祝福密語' : '🎯 10+ 答題')];
            if (it.score !== null && it.score !== undefined) {
              const sec = it.durationSec !== null && it.durationSec !== undefined ? `/${it.durationSec}s` : '';
              parts.push(`${it.score}/${it.total || 11}${sec}`);
            }
            const t = formatTime(it.unlockTime || it.firstTime);
            if (t) parts.push(t);
            return parts.join(' · ');
          },
          isDebugAdmin
        );
        overallBox.style.gridColumn = '1 / -1';

        cols.append(
          overallBox,
          makeList(
            '🗝️ 密語先鋒榜 Top 5（終極＞祝福）',
            Array.isArray(json.topSecret) ? json.topSecret.slice(0, 5) : [],
            (it) => {
              const badge = it.passcodeTier >= 2 ? '👑 終極密語' : '🗝️ 祝福密語';
              const t = formatTime(it.unlockTime);
              return t ? `${badge} · ${t}` : badge;
            }
          ),
          makeList(
            '🎯 問答高分榜 Top 5（10+ 題）',
            Array.isArray(json.topQuiz) ? json.topQuiz.slice(0, 5) : [],
            (it) => {
              const sec = it.durationSec !== null ? ` · ${it.durationSec}s` : '';
              const egg = it.passcodeTier >= 2 ? ' · 👑' : it.unlockedSecret ? ' · 🗝️' : '';
              return `${it.score}/${it.total}${sec}${egg}`;
            }
          )
        );
        body.replaceChildren(cols);
      } catch (err) {
        const errP = document.createElement('p');
        errP.className = 'passcode-feedback is-error';
        errP.textContent =
          err && err.message === 'unauthorized'
            ? '❌ 測試管理金鑰不正確，無法讀取排行榜。'
            : '無法讀取排行榜，請確認 Apps Script 已部署為「所有人可存取」。';
        body.replaceChildren(errP);
      } finally {
        refreshBtn.disabled = false;
      }
    };

    clearTestsBtn.addEventListener('click', async () => {
      if (!getAdminLbKey()) {
        syncTestStatus('⚠️ 請先輸入測試管理金鑰再清除測試資料。');
        keyInput.focus();
        return;
      }
      if (!window.confirm('確定要一鍵清除所有標記為測試資料（test_）的紀錄嗎？（不會影響真實賓客資料）')) return;
      clearTestsBtn.disabled = true;
      const res = await postLeaderboardEvent({ action: 'delete_test' });
      clearTestsBtn.disabled = false;
      if (res.ok) {
        syncTestStatus(`🧹 已清除 ${res.deletedCount} 筆測試資料！`);
        loadData();
      } else {
        syncTestStatus(
          res.error === 'unauthorized'
            ? '❌ 測試管理金鑰不正確，清除遭拒絕。'
            : '❌ 清除失敗，請稍後再試。'
        );
      }
    });

    refreshBtn.addEventListener('click', loadData);
    loadData();
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
    } else if (iconType === 'animal-pikachu') {
      // 皮卡丘向量可愛大頭圖示（尖耳朵黑耳尖 + 黃色圓臉 + 紅臉頰 + 微笑）
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.append(
        createSvgNode('path', { d: 'M5.2 10.2 L2.6 2.6 L8.8 6.4 Z', fill: '#facc15', stroke: '#ca8a04', 'stroke-width': '0.8', 'stroke-linejoin': 'round' }),
        createSvgNode('path', { d: 'M3.5 5.3 L2.6 2.6 L5.4 4.3 Z', fill: '#1f2937' }),
        createSvgNode('path', { d: 'M18.8 10.2 L21.4 2.6 L15.2 6.4 Z', fill: '#facc15', stroke: '#ca8a04', 'stroke-width': '0.8', 'stroke-linejoin': 'round' }),
        createSvgNode('path', { d: 'M20.5 5.3 L21.4 2.6 L18.6 4.3 Z', fill: '#1f2937' }),
        createSvgNode('ellipse', { cx: '12', cy: '14', rx: '7.8', ry: '6.6', fill: '#facc15', stroke: '#ca8a04', 'stroke-width': '0.85' }),
        createSvgNode('circle', { cx: '8.9', cy: '12.6', r: '1.3', fill: '#1f2937' }),
        createSvgNode('circle', { cx: '9.3', cy: '12.1', r: '0.45', fill: '#ffffff' }),
        createSvgNode('circle', { cx: '15.1', cy: '12.6', r: '1.3', fill: '#1f2937' }),
        createSvgNode('circle', { cx: '15.5', cy: '12.1', r: '0.45', fill: '#ffffff' }),
        createSvgNode('ellipse', { cx: '12', cy: '14.3', rx: '0.7', ry: '0.45', fill: '#1f2937' }),
        createSvgNode('circle', { cx: '6.5', cy: '15.4', r: '1.65', fill: '#ef4444' }),
        createSvgNode('circle', { cx: '17.5', cy: '15.4', r: '1.65', fill: '#ef4444' }),
        createSvgNode('path', {
          d: 'M9.8 15.9 Q10.9 17.0 12 15.9 Q13.1 17.0 14.2 15.9',
          fill: 'none',
          stroke: '#1f2937',
          'stroke-width': '1.05',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        })
      );
    } else if (iconType === 'animal-capybara') {
      // 卡皮巴拉（水豚）向量可愛大頭圖示（頭頂小橘子 + 淡定瞇瞇眼 + 圓耳朵）
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.append(
        createSvgNode('circle', { cx: '7.2', cy: '8.4', r: '2.1', fill: '#8b5a2b', stroke: '#6b4423', 'stroke-width': '0.75' }),
        createSvgNode('circle', { cx: '16.8', cy: '8.4', r: '2.1', fill: '#8b5a2b', stroke: '#6b4423', 'stroke-width': '0.75' }),
        createSvgNode('ellipse', { cx: '12', cy: '13.8', rx: '7.6', ry: '6.2', fill: '#a67346', stroke: '#6b4423', 'stroke-width': '0.8' }),
        createSvgNode('ellipse', { cx: '12', cy: '15.8', rx: '4.4', ry: '2.8', fill: '#c79568' }),
        createSvgNode('circle', { cx: '10.4', cy: '15.1', r: '0.55', fill: '#4a2e16' }),
        createSvgNode('circle', { cx: '13.6', cy: '15.1', r: '0.55', fill: '#4a2e16' }),
        createSvgNode('path', {
          d: 'M12 15.6 L12 16.9 M10.7 17.2 Q12 17.9 13.3 17.2',
          fill: 'none',
          stroke: '#4a2e16',
          'stroke-width': '0.9',
          'stroke-linecap': 'round',
        }),
        createSvgNode('path', {
          d: 'M7.6 12.2 Q8.8 11.7 10.0 12.2',
          fill: 'none',
          stroke: '#3b2310',
          'stroke-width': '1.2',
          'stroke-linecap': 'round',
        }),
        createSvgNode('path', {
          d: 'M14.0 12.2 Q15.2 11.7 16.4 12.2',
          fill: 'none',
          stroke: '#3b2310',
          'stroke-width': '1.2',
          'stroke-linecap': 'round',
        }),
        createSvgNode('circle', { cx: '12', cy: '6.6', r: '2.3', fill: '#f97316', stroke: '#ea580c', 'stroke-width': '0.7' }),
        createSvgNode('ellipse', { cx: '13.1', cy: '4.4', rx: '1.1', ry: '0.6', transform: 'rotate(-22 13.1 4.4)', fill: '#22c55e' })
      );
    } else if (iconType === 'bmc-magic') {
      // 小魔女 DoReMi 向量可愛圖示（粉紅尖頂魔女帽 + 雙丸子頭 + 魔法星星）
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.append(
        createSvgNode('circle', { cx: '5.8', cy: '12.4', r: '2.5', fill: '#ec4899', stroke: '#be185d', 'stroke-width': '0.65' }),
        createSvgNode('circle', { cx: '18.2', cy: '12.4', r: '2.5', fill: '#ec4899', stroke: '#be185d', 'stroke-width': '0.65' }),
        createSvgNode('circle', { cx: '12', cy: '14.6', r: '5.0', fill: '#ffe4d6', stroke: '#e5b8a3', 'stroke-width': '0.6' }),
        createSvgNode('path', {
          d: 'M7.2 13.2 Q9.5 10.9 12 12.4 Q14.5 10.9 16.8 13.2 L16.2 11.1 L7.8 11.1 Z',
          fill: '#ec4899',
        }),
        createSvgNode('circle', { cx: '10.0', cy: '14.7', r: '1.1', fill: '#db2777' }),
        createSvgNode('circle', { cx: '10.3', cy: '14.3', r: '0.38', fill: '#ffffff' }),
        createSvgNode('circle', { cx: '14.0', cy: '14.7', r: '1.1', fill: '#db2777' }),
        createSvgNode('circle', { cx: '14.3', cy: '14.3', r: '0.38', fill: '#ffffff' }),
        createSvgNode('ellipse', { cx: '8.5', cy: '16.2', rx: '0.9', ry: '0.5', fill: '#fda4af' }),
        createSvgNode('ellipse', { cx: '15.5', cy: '16.2', rx: '0.9', ry: '0.5', fill: '#fda4af' }),
        createSvgNode('path', {
          d: 'M10.8 16.8 Q12 17.9 13.2 16.8',
          fill: 'none',
          stroke: '#9d174d',
          'stroke-width': '0.9',
          'stroke-linecap': 'round',
        }),
        createSvgNode('ellipse', { cx: '12', cy: '9.6', rx: '8.4', ry: '1.9', fill: '#f472b6', stroke: '#be185d', 'stroke-width': '0.65' }),
        createSvgNode('path', {
          d: 'M12 2.2 L6.7 9.3 L17.3 9.3 Z',
          fill: '#ec4899',
          stroke: '#be185d',
          'stroke-width': '0.65',
          'stroke-linejoin': 'round',
        }),
        createSvgNode('rect', { x: '7.1', y: '7.8', width: '9.8', height: '1.45', rx: '0.6', fill: '#fbbf24' }),
        createSvgNode('path', {
          d: 'M19.5 3.6 L20.0 4.8 L21.2 5.3 L20.0 5.8 L19.5 7.0 L19.0 5.8 L17.8 5.3 L19.0 4.8 Z',
          fill: '#fbbf24',
        })
      );
    } else {
      // 其他題目的趣味主題圖示（動物吉祥物、歷史人物、航線、工程梗、筆畫）
      const emojiMap = {
        'stroke-72': '🖌️',
        'stroke-77': '🖋️',
        'stroke-68': '📜',
        'stroke-82': '✒️',
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
    pendingSelectedOption = null;
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
      } else if (idx === pendingSelectedOption) {
        btn.classList.add('is-selected');
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

    if (elQuizSubmitWrap && btnQuizSubmit) {
      elQuizSubmitWrap.classList.toggle('hidden', quizAnswered);
      btnQuizSubmit.disabled = quizAnswered || pendingSelectedOption === null;
      btnQuizSubmit.textContent = currentLang === 'en' ? 'Submit Answer' : '確認送出答案';
    }

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
    pendingSelectedOption = selectedIndex;
    refreshQuizLanguage();
  }

  function handleSubmitQuizOption() {
    if (quizAnswered || pendingSelectedOption === null) return;
    const selectedIndex = pendingSelectedOption;
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

  const SEAL_TIME_BUCKET_MS = 12 * 60 * 60 * 1000;

  function getDeviceBindingString() {
    const storageKey = 'te_device_seal_id';
    let devId = '';
    try {
      devId = window.localStorage.getItem(storageKey) || '';
      if (!devId) {
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
          const arr = new Uint8Array(12);
          window.crypto.getRandomValues(arr);
          devId = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
        } else {
          devId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        }
        window.localStorage.setItem(storageKey, devId);
      }
    } catch (_e) {
      devId = 'no-ls';
    }
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

  function formatSummarySeal() {
    const relPath = decodeSealBytes(SUMMARY_SEAL_VECTORS, '');
    const isLocalHost =
      window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const baseUrl = isLocalHost
      ? window.location.href
      : 'https://chihweitung.github.io/wedding-vc/';
    const parsed = new URL(relPath, baseUrl);
    const masterKey = parsed.searchParams.get('k') || '';
    if (masterKey) {
      const realNowMs =
        typeof window.__TE_REAL_DATE_NOW__ === 'function'
          ? window.__TE_REAL_DATE_NOW__()
          : Date.now();
      const timeBucket = Math.floor(realNowMs / SEAL_TIME_BUCKET_MS);
      const seedStr = `${getDeviceBindingString()}|${timeBucket}`;
      const rawBytes = new TextEncoder().encode(masterKey);
      const mask = deriveDeviceMaskBytes(seedStr, rawBytes.length);
      const boundHex = Array.from(rawBytes, (b, idx) =>
        (b ^ mask[idx]).toString(16).padStart(2, '0')
      ).join('');
      parsed.searchParams.set('k', boundHex);
      parsed.searchParams.set('t', String(timeBucket));
    }
    return window.btoa(parsed.toString());
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
  let cipherClueRevealed = false;

  function updateCipherClueUi(showSealWatermark, autoRevealSealHint) {
    if (elHpCipherSpellBtn) {
      elHpCipherSpellBtn.textContent =
        currentLang === 'en'
          ? '🪄 Tap to cast Aparecium & reveal the cipher clue'
          : '🪄 輕觸施展顯形咒（Aparecium）窺見解碼線索';
    }
    if (elHpCipherClue) {
      elHpCipherClue.textContent =
        currentLang === 'en'
          ? '🔮 Wizarding Trivia: The day right after our Nov 29 wedding is International Computer Security Day (Nov 30)! Cryptography is the art of hiding plain truth inside scrambled runes—only those who reverse the encoding can awaken Platform 9¾.'
          : '🔮 魔法冷知識：我們的婚禮 11/29 隔天正是「國際電腦安全日（11/30）」！自古以來，密碼學就是把真話藏進看似亂碼的神秘卷軸裡，唯有懂得還原編碼的人，才能喚醒隱藏的九又四分之三月台。';
    }
    if (!showSealWatermark) {
      if (elHpCipherSpellBtn) elHpCipherSpellBtn.classList.add('hidden');
      if (elHpCipherClue) elHpCipherClue.classList.add('hidden');
      return;
    }
    const shouldReveal = autoRevealSealHint || cipherClueRevealed;
    if (elHpCipherSpellBtn) elHpCipherSpellBtn.classList.toggle('hidden', shouldReveal);
    if (elHpCipherClue) elHpCipherClue.classList.toggle('hidden', !shouldReveal);
  }

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

    if (
      typeof window.__CONSUME_DBG_FORCE_WATERMARK__ === 'function' &&
      window.__CONSUME_DBG_FORCE_WATERMARK__()
    ) {
      forcedSealWatermarkActive = true;
    } else if (triggerConfetti && quizScore < 6) {
      forcedSealWatermarkActive = false;
    }
    const showSealWatermark = quizScore >= 6 || forcedSealWatermarkActive;
    const autoRevealSealHint = quizScore >= 10;
    const sealWrap = elSummarySealCode ? elSummarySealCode.closest('.easter-watermark-wrap') : null;
    if (sealWrap) sealWrap.classList.remove('hidden');
    updateCipherClueUi(showSealWatermark, autoRevealSealHint);
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
            ? '🪄 Muggles cannot view the secret Easter Egg!'
            : '🪄 麻瓜不能看彩蛋喔！';
      }
    }

    if (triggerConfetti && quizScore > 6) {
      recordBestQuizScore(quizScore);
    }
    if (elPasscodeRedeemCard) {
      elPasscodeRedeemCard.classList.toggle('hidden', quizScore <= 6);
    }
    syncPlayerNameAndPasscodeUi();
    renderAdminLeaderboardPanel();

    if (triggerConfetti) {
      launchConfetti();
      lastQuizDurationSec = quizStartedAtMs
        ? Math.max(1, Math.round((getMonotonicNowMs() - quizStartedAtMs) / 1000))
        : null;
    }

    const qualifiesForLeaderboard = quizScore >= 10;
    if (elQuizHighscoreForm) {
      elQuizHighscoreForm.classList.toggle('hidden', !qualifiesForLeaderboard || hasSubmittedCurrentQuiz);
    }
    if (!qualifiesForLeaderboard && elQuizSubmitStatus) {
      elQuizSubmitStatus.classList.add('hidden');
    }
  }

  if (elQuizHighscoreForm) {
    elQuizHighscoreForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (quizScore < 10) return;
      const typedName = sanitizeGuestNameInput(elQuizPlayerNameInput ? elQuizPlayerNameInput.value : '');
      if (!typedName) {
        if (elQuizPlayerNameError) {
          elQuizPlayerNameError.textContent =
            currentLang === 'en' ? 'Please enter a valid name.' : '請先輸入有效的大名喔！';
          elQuizPlayerNameError.classList.remove('hidden');
        }
        if (elQuizPlayerNameInput) elQuizPlayerNameInput.focus();
        return;
      }
      if (elQuizPlayerNameError) elQuizPlayerNameError.classList.add('hidden');
      setPlayerName(typedName);
      if (btnQuizHighscoreSubmit) btnQuizHighscoreSubmit.disabled = true;

      if (elQuizSubmitStatus) {
        elQuizSubmitStatus.textContent =
          currentLang === 'en'
            ? `Saving ${typedName}'s score...`
            : `正在登記 ${typedName} 的高分紀錄...`;
        elQuizSubmitStatus.classList.remove('hidden');
      }

      const res = await postLeaderboardEvent({
        action: 'quiz',
        name: typedName,
        score: quizScore,
        total: QUIZ_QUESTIONS.length,
        durationSec: lastQuizDurationSec,
        startToken: currentQuizStartToken,
      });

      if (btnQuizHighscoreSubmit) btnQuizHighscoreSubmit.disabled = false;

      if (res.sent && res.ok) {
        hasSubmittedCurrentQuiz = true;
        if (elQuizHighscoreForm) elQuizHighscoreForm.classList.add('hidden');
        if (elQuizSubmitStatus) {
          elQuizSubmitStatus.textContent =
            currentLang === 'en'
              ? `✅ Recorded ${typedName}'s score (${quizScore} / ${QUIZ_QUESTIONS.length}) on the Leaderboard!`
              : `✅ 已成功登記「${typedName}」的高分成績（${quizScore} / ${QUIZ_QUESTIONS.length}）！`;
        }
        if (isAdminOnlyUnlocked()) renderAdminLeaderboardPanel();
      } else if (res.error === 'event_not_open_yet') {
        if (elQuizSubmitStatus) {
          elQuizSubmitStatus.textContent =
            currentLang === 'en'
              ? '⏳ Leaderboard opens at 2026/11/29 12:20 (GMT+8). See you at the wedding!'
              : '⏳ 排行榜將於 2026/11/29 12:20（台灣時間）婚禮正式開席後開放登記喔！';
        }
      } else if (res.error === 'event_closed') {
        if (elQuizHighscoreForm) elQuizHighscoreForm.classList.add('hidden');
        if (elQuizSubmitStatus) {
          elQuizSubmitStatus.textContent =
            currentLang === 'en'
              ? '💐 Live leaderboard registration has wrapped up—thank you for playing and celebrating with us!'
              : '💐 婚禮現場排行榜登記已圓滿截止，感謝您的參與與祝福！';
        }
      } else if (res.error === 'invalid_start_token') {
        if (elQuizSubmitStatus) {
          elQuizSubmitStatus.textContent =
            currentLang === 'en'
              ? '⚠️ Session token missed or expired (weak signal). Please tap "Play Again" to start a fresh round!'
              : '⚠️ 剛才開局時網路訊號不穩未取得驗證憑證，請點「再玩一次」重新挑戰即可登記喔！';
        }
      } else if (res.error === 'token_already_used') {
        hasSubmittedCurrentQuiz = true;
        if (elQuizHighscoreForm) elQuizHighscoreForm.classList.add('hidden');
        if (elQuizSubmitStatus) {
          elQuizSubmitStatus.textContent =
            currentLang === 'en'
              ? '✅ This round has already been submitted!'
              : '✅ 這一局的成績已經登記過囉！';
        }
      } else {
        if (elQuizSubmitStatus) {
          elQuizSubmitStatus.textContent =
            currentLang === 'en'
              ? '⚠️ Network busy — please tap Submit Score again to retry.'
              : '⚠️ 網路忙碌中，尚未寫入排行榜，請再按一次「登記成績」重試喔！';
        }
      }
    });
  }

  let passcodeWrongAttempts = 0;

  function triggerPasscodeShake(el) {
    if (!el) return;
    el.classList.remove('passcode-shake');
    void el.offsetWidth;
    el.classList.add('passcode-shake');
    if (navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (_e) {}
    }
  }

  function getPlayfulWrongPasscodeReply(normCode, attemptNum, lang) {
    const isEn = lang === 'en';
    const compactCode = normCode.replace(/[-－—_~～]/g, '');
    // 1. 趣味彩蛋關鍵字互動（不洩漏真實答案與彩蛋機制）
    if (
      /^(BILIBILIMEROMEROCHUCHU|逼哩逼哩咩嚕咩嚕啾啾|嗶哩嗶哩咩嚕咩嚕啾啾)$/.test(
        compactCode
      )
    ) {
      return isEn
        ? '😂 Great answer — please never answer that again!'
        : '😂 答的很好，下次不要再答了！';
    }
    if (compactCode === 'TOMEUNICE4EVER') {
      return isEn
        ? "😆 I know you're in a hurry, but don't rush!"
        : '😆 我知道你很急，但不要急！';
    }
    if (compactCode === 'TOMANDEUNICE4EVER' || compactCode === 'TOM&EUNICE4EVER') {
      return isEn
        ? '🙅‍♂️ Wakanda Forever! ...Wait, wrong cinematic universe—try again!'
        : '🙅‍♂️ 瓦干達 Forever！…欸不對，這不是正確密語喔，再猜猜看！';
    }
    if (compactCode === 'HOWDOYOUTURNTHISON') {
      return isEn
        ? '🚗 Vroom! A Cobra Car just spawned at Brick Yard 33 1/3—still not the wedding passcode though, 11!'
        : '🚗 轟隆隆——一台藍色眼鏡蛇跑車開進美軍俱樂部了！但這不是婚禮密語喔，11！';
    }
    if (compactCode === 'WOLOLO') {
      return isEn
        ? '🧙‍♂️ Wololo! Your outfit just turned from blue to red... but the lock resisted conversion!'
        : '🧙‍♂️ Wololo！你的衣服從藍色變成紅色了…但鎖頭還沒被招降喔，再試試看！';
    }
    if (
      /^(ROBINHOOD|LUMBERJACK|ROCKON|CHEESESTEAKJIMMYS|MARCO|POLO|AEGIS|IRWINNER|BLACKDEATH|FURIOUSTHEMONKEYBOY|TOSMITHEREENS|WHOSYOURDADDY|GREEDISGOOD|SHOWMETHEMONEY|POWEROVERWHELMING)$/.test(
        compactCode
      )
    ) {
      return isEn
        ? '⚔️ Classic gamer spotted! Cheat codes are disabled at this wedding—try the real passcode, 11!'
        : '⚔️ 世紀帝國／暴雪老玩家現身！婚禮現場禁止開外掛加資源喔，請用真正的密語破關，11！';
    }
    if (compactCode.startsWith('AHR0CHM6') || compactCode.startsWith('AHR0CDOV')) {
      return isEn
        ? "😏 Nice try—pasting raw encoded gibberish straight in won't work! Decode it first~"
        : '😏 喂～這串編碼直接複製貼上可不行喔！先解碼看看裡面藏了什麼吧～';
    }
    if (/^HTTPS?:\/\//.test(normCode)) {
      return isEn
        ? '🙈 Oops! You pasted a URL into the passcode box—open it in your browser instead!'
        : '🙈 欸！你把網址直接貼進密語框了啦～那個要用瀏覽器「打開」喔！';
    }
    if (/^(ALOHOMORA|阿囉哈姆拉|阿咯哈姆拉|開鎖咒)$/.test(compactCode)) {
      return isEn
        ? "🔓 Alohomora! The lock clicked... nice try, it's charmed against unlocking spells!"
        : '🔓 阿囉哈姆拉！鎖頭「喀噠」一聲差點開了…可惜這道鎖施了防開鎖咒喔！';
    }
    if (/^(AVADAKEDAVRA|阿瓦達索命|索命咒)$/.test(compactCode)) {
      return isEn
        ? '💚 Hey!! Unforgivable Curses are strictly banned at this wedding—Aurors are on their way!'
        : '💚 喂！！婚禮現場禁止使用不赦咒啦！魔法部正氣師已在趕往美軍俱樂部的路上！';
    }
    if (/^(CRUCIO|IMPERIO|酷刑咒|蠻橫咒|鑽心剜骨|奪魂咒)$/.test(compactCode)) {
      return isEn
        ? "🚨 Unforgivable Curse detected! Keep that up and you're dining in Azkaban—try the real passcode!"
        : '🚨 不赦咒警告！再亂唸就要送去阿茲卡班吃喜酒囉～請輸入真正的密語！';
    }
    if (/^(EXPECTOPATRONUM|疾疾護法現身|護法咒)$/.test(compactCode)) {
      return isEn
        ? '🦌 A silver Patronus leaps from the screen! Beautiful memory, still not the secret passcode~'
        : '🦌 銀白色的守護神躍出了螢幕！現場充滿了幸福的回憶，不過這不是正確密語喔～';
    }
    if (/^(EXPELLIARMUS|去去武器走|繳械咒)$/.test(compactCode)) {
      return isEn
        ? '⚡ Expelliarmus! Careful—your phone nearly flew out of your hand! Still locked though.'
        : '⚡ 去去武器走！你的手機差點飛出去了（請抓好），這道鎖還是沒打開喔！';
    }
    if (/^(WINGARDIUMLEVIOSA|LEVIOSA|溫咖癲啦唯啊薩|飄浮咒)$/.test(compactCode)) {
      return isEn
        ? '🪶 Hermione says: "It\'s Levi-O-sa, not Levio-SA!" (Still won\'t unlock this though!)'
        : '🪶 妙麗提醒你：是 Levi-O-sa，不是 Levio-SA～（但唸對了還是打不開這道鎖喔！）';
    }
    if (/^(OBLIVIATE|空空遺忘|遺忘咒)$/.test(compactCode)) {
      return isEn
        ? '💨 Obliviate! ...Wait, did you just wipe the real passcode from your own memory?'
        : '💨 空空遺忘！…等等，你剛剛是不是把自己找到的密語也忘掉了？';
    }
    if (/^(ACCIO|ACCIOPASSCODE|ACCIOSECRET|速速前|召喚咒)/.test(compactCode)) {
      return isEn
        ? "🧲 Accio Passcode! Nice try, summoning charms don't work on wedding secrets~"
        : '🧲 速速前！召喚術對婚禮密語無效喔，得自己找到它才行～';
    }
    if (
      /^(ISOLEMNLYSWEARTHATIAMUPTONOGOOD|MISCHIEFMANAGED|我莊嚴發誓我沒幹好事|我莊嚴宣誓我沒幹好事|惡作劇完成)$/.test(
        compactCode
      )
    ) {
      return isEn
        ? "🗺️ The Marauder's Map flickers! Sadly Moony, Wormtail, Padfoot & Prongs are busy at the buffet~"
        : '🗺️ 劫盜地圖微微亮了一下！可惜月影、蟲尾、獸足與鹿角正在取餐區排隊，沒空幫你解鎖喔～';
    }
    if (
      /^(LUMOS|LUMOSMAXIMA|NOX|APARECIUM|RIDDIKULUS|STUPEFY|PETRIFICUSTOTALUS|SECTUMSEMPRA|PROTEGO|REPARO|INCENDIO|AGUAMENTI|CONFUNDO|路摸思|吶克斯|顯形咒|叱叱荒唐|昏昏倒地|整整石化|神鋒無影|破心護|復復修|嘶嘶聲)$/.test(
        compactCode
      )
    ) {
      return isEn
        ? "✨ Your wand flickered briefly... but that spell won't open this lock! Try another phrase."
        : '✨ 魔杖微微發亮了一下…但這句咒語打不開這道鎖喔，再試試看別的密語！';
    }
    if (/^(芝麻開門|OPENSESAME|SESAME)$/.test(normCode)) {
      return isEn
        ? '🚪 A soft chuckle echoes from behind the door — "Not Ali Baba\'s cave!" Try again.'
        : '🚪 門後只傳來一聲輕笑——「這不是阿里巴巴的山洞喔～」再想想看！';
    }
    if (/^(1234|123456|0000|PASSWORD|PASSCODE|SECRET|TEST|ADMIN|密語|通關密語)$/.test(normCode)) {
      return isEn
        ? "🕵️ Hmm... that looks like a wild guess! The lock didn't even budge."
        : '🕵️ 嗯…這看起來像是隨手猜的密碼，鎖頭完全沒有動靜呢！';
    }
    const normWithoutNames = normCode.replace(/EUNICE|TOM/g, '');
    if (
      /(好帥|超帥|最帥|很帥|真帥|大帥哥|帥哥|好美|超美|最美|很美|真美|大美女|美女|好漂亮|超漂亮|很漂亮|最漂亮|好可愛|超可愛|最可愛|好正|超正|男神|女神|天生一對|好登對|超登對|郎才女貌|神仙眷侶|HANDSOME|BEAUTIFUL|GORGEOUS|STUNNING|PRETTY|CUTE|LOVELY|BESTCOUPLE)/.test(
        normWithoutNames
      ) ||
      (/(新郎|新娘|董董|董哥|老董|智瑋|羽涵|涵姐|TOM|EUNICE)/.test(normCode) &&
        /(帥|美|漂亮|正|可愛|讚|棒|優秀|溫柔|聰明|厲害|COOL|GREAT|AWESOME|AMAZING|SWEET|PERFECT|BEST)/.test(
          normWithoutNames
        ))
    ) {
      return isEn
        ? '😎 Thanks, we know~ Not the right answer though, try again!'
        : '😎 謝謝，我知道～但這不是正確答案喔，再猜猜看！';
    }
    if (
      /(新婚快樂|百年好合|永浴愛河|早生貴子|白頭偕老|永遠幸福|恭喜|CONGRATS|CONGRATULATIONS|HAPPY|WEDDING|LOVE|FOREVER|TOM|EUNICE)/.test(
        normCode
      )
    ) {
      return isEn
        ? '💌 Sweet message received! The lock is still waiting for the exact secret phrase though~'
        : '💌 收到滿滿的祝福了！不過這道鎖還在等那句特別的密語喔～';
    }

    // 2. 依嘗試次數輪播神秘互動台詞（完全不暴雷）
    if (attemptNum === 1) {
      return isEn
        ? '🔐 The lock rattled slightly — not quite the magic words yet!'
        : '🔐 鎖頭輕輕晃了一下，似乎還差一點靈感喔！';
    }
    if (attemptNum === 2) {
      return isEn
        ? "🤔 Still locked... could there be a tiny detail you haven't noticed?"
        : '🤔 還是沒打開呢…仔細想想有沒有漏掉什麼小細節？';
    }
    if (attemptNum === 3) {
      return isEn
        ? '🕯️ A faint glow shimmers inside the keyhole, waiting for the right phrase...'
        : '🕯️ 鎖孔裡透出一絲神秘微光，但這不是它在等的答案～';
    }
    if (attemptNum === 4) {
      return isEn
        ? '🦉 An owl tilts its head at you as if to say, "Maybe explore around a bit more?"'
        : '🦉 貓頭鷹歪著頭看著你，彷彿在說「再多逛逛這個網站看看？」';
    }
    const cyclingZh = [
      `🗝️ 越挫越勇！已嘗試第 ${attemptNum} 次——真正的線索往往藏在意想不到的角落喔！`,
      `✨ 鎖頭發出「喀噠」一聲又彈回去了（第 ${attemptNum} 次嘗試），換個角度再來挑戰吧！`,
      `🎩 魔術師守則第一條：好戲通常藏在大家容易滑過去的地方～（第 ${attemptNum} 次嘗試）`,
    ];
    const cyclingEn = [
      `🗝️ Attempt #${attemptNum} — love the persistence! Clues often hide in unexpected corners.`,
      `✨ Click... and it snapped back shut (attempt #${attemptNum}). Try looking from a fresh angle!`,
      `🎩 Magician's Rule #1: the best secrets hide right where people scroll past~ (attempt #${attemptNum})`,
    ];
    const pool = isEn ? cyclingEn : cyclingZh;
    return pool[(attemptNum - 5) % pool.length];
  }

  if (elPasscodeRedeemForm) {
    elPasscodeRedeemForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!elPasscodeFeedback) return;
      elPasscodeFeedback.classList.remove('hidden', 'is-success', 'is-error');

      const nameVal = sanitizeGuestNameInput(
        elPasscodeNameInput ? elPasscodeNameInput.value : currentPlayerName
      );
      const codeVal = elPasscodeCodeInput ? elPasscodeCodeInput.value.trim().slice(0, 100) : '';

      if (!nameVal) {
        elPasscodeFeedback.classList.add('is-error');
        elPasscodeFeedback.textContent =
          currentLang === 'en' ? 'Please enter your name first.' : '請先輸入您的大名喔！';
        triggerPasscodeShake(elPasscodeNameInput);
        if (elPasscodeNameInput) elPasscodeNameInput.focus();
        return;
      }
      if (!codeVal) {
        elPasscodeFeedback.classList.add('is-error');
        elPasscodeFeedback.textContent =
          currentLang === 'en' ? 'Please enter the secret passcode.' : '請輸入密語！';
        triggerPasscodeShake(elPasscodeCodeInput);
        if (elPasscodeCodeInput) elPasscodeCodeInput.focus();
        return;
      }

      setPlayerName(nameVal);
      const normCode = codeVal.replace(/[\s!！。.,，「」『』“”"']+/g, '').toUpperCase();
      const digest = await sha256HexForPasscode(normCode);
      if (!digest || !SECRET_PASSCODE_SHA256_SET.has(digest)) {
        passcodeWrongAttempts += 1;
        elPasscodeFeedback.classList.add('is-error');
        elPasscodeFeedback.textContent = getPlayfulWrongPasscodeReply(
          normCode,
          passcodeWrongAttempts,
          currentLang
        );
        triggerPasscodeShake(elPasscodeCodeInput);
        return;
      }

      passcodeWrongAttempts = 0;
      if (elPasscodeRedeemCard) {
        elPasscodeRedeemCard.classList.remove('passcode-unlocked');
        void elPasscodeRedeemCard.offsetWidth;
        elPasscodeRedeemCard.classList.add('passcode-unlocked');
      }
      if (navigator && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate([30, 40, 80]);
        } catch (_e) {}
      }
      launchConfetti();
      if (btnPasscodeVerify) btnPasscodeVerify.disabled = true;
      elPasscodeFeedback.classList.add('is-success');
      elPasscodeFeedback.textContent =
        currentLang === 'en'
          ? `🎉 Passcode verified! Registering ${nameVal}...`
          : `🎉 密語驗證成功！正在為 ${nameVal} 登記通關...`;

      let res = { sent: false, ok: false };
      try {
        res = await postLeaderboardEvent({
          action: 'passcode',
          name: nameVal,
          passcode: codeVal,
        });
      } finally {
        if (btnPasscodeVerify) btnPasscodeVerify.disabled = false;
      }

      if (res.sent && res.ok) {
        elPasscodeFeedback.textContent =
          currentLang === 'en'
            ? `🎉 Verified! ${nameVal} is now registered on the Secret Passcode Hall of Fame!`
            : `🎉 密語正確！已成功登記「${nameVal}」為彩蛋通關勇者！`;
        if (isAdminOnlyUnlocked()) renderAdminLeaderboardPanel();
      } else if (res.error === 'event_not_open_yet') {
        elPasscodeFeedback.classList.remove('is-success');
        elPasscodeFeedback.classList.add('is-error');
        elPasscodeFeedback.textContent =
          currentLang === 'en'
            ? '⏳ Leaderboard registration opens at 2026/11/29 12:20 (GMT+8).'
            : '⏳ 排行榜將於 2026/11/29 12:20（台灣時間）婚禮正式開席後開放登記喔！';
      } else if (res.error === 'event_closed') {
        elPasscodeFeedback.textContent =
          currentLang === 'en'
            ? `🎉 Passcode verified! Live leaderboard registration has wrapped up—congrats, ${nameVal}!`
            : `🎉 密語正確！婚禮現場排行榜登記已圓滿截止，恭喜「${nameVal}」成功解開彩蛋！`;
      } else {
        elPasscodeFeedback.textContent =
          currentLang === 'en'
            ? `🎉 Passcode verified for ${nameVal}! Show this screen to the hosts!`
            : `🎉 密語驗證成功！「${nameVal}」恭喜解鎖終極彩蛋！`;
      }
    });
  }

  if (btnQuizSubmit) {
    btnQuizSubmit.addEventListener('click', handleSubmitQuizOption);
  }

  btnQuizNext.addEventListener('click', () => {
    ensureQuizStartToken();
    quizIndex += 1;
    renderCurrentQuizQuestion();
  });

  if (elHpCipherSpellBtn) {
    elHpCipherSpellBtn.addEventListener('click', () => {
      cipherClueRevealed = true;
      updateCipherClueUi(true, quizScore >= 10);
    });
  }

  window.addEventListener('te-debug-preview-score', (ev) => {
    if (window.__TE_DEBUG_AUTH__ !== true) return;
    const targetScore = Number(ev && ev.detail && ev.detail.score);
    if (!Number.isFinite(targetScore)) return;
    const clamped = Math.max(0, Math.min(QUIZ_QUESTIONS.length, Math.round(targetScore)));
    quizStarted = true;
    quizIndex = QUIZ_QUESTIONS.length;
    quizScore = clamped;
    groomScore = Math.min(3, Math.round(clamped / 3));
    brideScore = Math.min(3, Math.round(clamped / 3));
    forcedSealWatermarkActive = false;
    cipherClueRevealed = false;
    if (elQuizIntroView) elQuizIntroView.classList.add('hidden');
    showHubView('quiz');
    showQuizSummary(false);
  });

  if (btnQuizStart) {
    btnQuizStart.addEventListener('click', startQuiz);
  }
  btnQuizRestart.addEventListener('click', showQuizIntro);
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
  if (elSeatingSideSelect) {
    elSeatingSideSelect.addEventListener('change', () => {
      seatingSideFilter = elSeatingSideSelect.value || 'all';
      seatingGroupFilter = 'all';
      selectedSeatingZoneId = null;
      if (seatingNeedsFilter !== 'all') seatingNeedsFilter = 'all';
      syncSeatingFilterSelects();
      renderSeatingSection();
      renderSeatingAutocomplete();
    });
  }
  if (elSeatingGroupSelect) {
    elSeatingGroupSelect.addEventListener('change', () => {
      seatingGroupFilter = elSeatingGroupSelect.value || 'all';
      selectedSeatingZoneId = null;
      if (seatingNeedsFilter !== 'all') seatingNeedsFilter = 'all';
      renderSeatingSection();
      renderSeatingAutocomplete();
    });
  }
  if (elSeatingSearchInput) {
    const handleSeatingSearchChange = () => {
      selectedSeatingZoneId = null;
      if (seatingNeedsFilter !== 'all') {
        seatingNeedsFilter = 'all';
      }
      seatingAutocompleteIndex = -1;
      renderSeatingSection();
      renderSeatingAutocomplete();
    };
    elSeatingSearchInput.addEventListener('input', handleSeatingSearchChange);
    elSeatingSearchInput.addEventListener('search', handleSeatingSearchChange);
    elSeatingSearchInput.addEventListener('focus', () => {
      if (elSeatingSearchInput.value.trim()) {
        renderSeatingAutocomplete();
      }
    });
    document.addEventListener('pointerdown', (e) => {
      if (!elSeatingAutocompleteList || elSeatingAutocompleteList.classList.contains('hidden')) return;
      const target = e.target;
      if (target === elSeatingSearchInput || elSeatingAutocompleteList.contains(target)) return;
      closeSeatingAutocomplete();
    });
    elSeatingSearchInput.addEventListener('keydown', (e) => {
      if (!seatingAutocompleteItems.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        seatingAutocompleteIndex = (seatingAutocompleteIndex + 1) % seatingAutocompleteItems.length;
        renderSeatingAutocomplete();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        seatingAutocompleteIndex =
          seatingAutocompleteIndex <= 0
            ? seatingAutocompleteItems.length - 1
            : seatingAutocompleteIndex - 1;
        renderSeatingAutocomplete();
      } else if (e.key === 'Enter' && seatingAutocompleteIndex >= 0) {
        e.preventDefault();
        selectSeatingAutocompleteItem(seatingAutocompleteItems[seatingAutocompleteIndex]);
      } else if (e.key === 'Escape') {
        closeSeatingAutocomplete();
      }
    });
  }

  window.addEventListener('te-debug-auth-change', () => {
    renderSeatingSection();
    updateCountdown(true);
  });

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

    applyLanguage();
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

  let lastRenderedEpochSec = -1;
  let lastRenderedRemSec = -1;
  let tickRafId = 0;

  function updateCountdown(force = false) {
    const now = Date.now();
    const diff = REAL_TARGET_TIMESTAMP - now;
    const epochSec = Math.floor(now / 1000);
    const remSec = diff <= 0 ? 0 : Math.floor(diff / 1000);
    const stateChanging = (diff <= 0) !== isTimeUp;

    if (!force && !stateChanging && epochSec === lastRenderedEpochSec && remSec === lastRenderedRemSec) {
      return;
    }
    lastRenderedEpochSec = epochSec;
    lastRenderedRemSec = remSec;

    elCurrentTwTime.textContent = twFormatter.format(new Date(now));
    renderLoveStoryNote(false);

    if (diff <= 0) {
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';

      enterTimeUpState();
      return;
    }

    if (isTimeUp) {
      exitTimeUpState();
    }

    const totalSeconds = remSec;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    elDays.textContent = pad2(days);
    elHours.textContent = pad2(hours);
    elMinutes.textContent = pad2(minutes);
    elSeconds.textContent = pad2(seconds);
  }

  function tick() {
    if (document.hidden) {
      tickRafId = 0;
      return;
    }
    updateCountdown(false);
    tickRafId = requestAnimationFrame(tick);
  }

  function ensureCountdownTickLoop() {
    if (!document.hidden && !tickRafId) {
      updateCountdown(true);
      tickRafId = requestAnimationFrame(tick);
    }
  }

  // Dual-Palette 33⅓ RPM Austrian Salon Audio Engine (Vienna & Salzburg Honeymoon Homage):
  // - Light Mode (Day): Johann Strauss II — "The Blue Danube" (Op. 314, D major 3/4 waltz)
  // - Dark Mode (Night): W. A. Mozart — Piano Concerto No. 21 in C major, K. 467, II. Andante (F major)
  let bgmAudioCtx = null;
  let bgmMasterGain = null;
  let bgmNoteTarget = null;
  let bgmLightBusGain = null;
  let bgmDarkBusGain = null;
  let bgmLoopTimer = null;
  let bgmWatchdogTimer = null;
  let bgmWakeRetryTimers = [];
  let bgmLightBarIndex = 0;
  let bgmDarkBarIndex = 0;
  let bgmWasStandby = false;
  let bgmNeedsRebuild = false;
  let bgmLastCtxTime = -1;
  let bgmFrozenTicks = 0;

  function getBgmThemeMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

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

  // 16-bar candlelit nocturnal Andante in F Major — W. A. Mozart, Piano Concerto No. 21 (K. 467), II. Andante
  // 4/4 meter with pulsing muted-string triplets, cello pizzicato, and singing cantabile forte-piano
  // Each bar: { pizz: [[beat, midi], ...], pad: [m1, m2, m3], triplets: [t1, t2, t3], triplets2?: [t1, t2, t3], notes: [[beat, midi, durBeats, gain, isChime?], ...] }
  const MOZART_K467_ANDANTE_BARS = [
    // Bars 1–3: Noble F-major rising arpeggio -> singing high F5 -> iconic 4-3 suspension (F5 -> E5) over C7/G
    {
      pizz: [[0, 41], [2, 48]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      notes: [[0, 72, 1.05, 0.052], [1, 65, 1.05, 0.048], [2, 69, 1.05, 0.051], [3, 72, 1.08, 0.054]],
    },
    {
      pizz: [[0, 41], [2, 48]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      notes: [[0, 77, 2.95, 0.06], [3, 81, 0.42, 0.052], [3.333, 79, 0.42, 0.05], [3.667, 77, 0.45, 0.049]],
    },
    {
      pizz: [[0, 43], [2, 48]],
      pad: [55, 58, 64],
      triplets: [55, 58, 64],
      notes: [[0, 77, 1.05, 0.057], [1, 76, 2.45, 0.053], [3, 84, 0.95, 0.021, true]],
    },

    // Bars 4–6: Answering C7 arpeggio -> singing E5 -> tender 6-5 appoggiatura (D5 -> C5) resolving to F
    {
      pizz: [[0, 48], [2, 43]],
      pad: [55, 58, 64],
      triplets: [55, 58, 64],
      notes: [[0, 70, 1.05, 0.051], [1, 64, 1.05, 0.047], [2, 67, 1.05, 0.05], [3, 70, 1.08, 0.053]],
    },
    {
      pizz: [[0, 48], [2, 43]],
      pad: [55, 58, 64],
      triplets: [55, 58, 64],
      notes: [[0, 76, 2.95, 0.059], [3, 79, 0.42, 0.051], [3.333, 77, 0.42, 0.049], [3.667, 76, 0.45, 0.048]],
    },
    {
      pizz: [[0, 41], [2, 48]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      notes: [[0, 74, 1.05, 0.056], [1, 72, 1.9, 0.052], [3, 72, 0.42, 0.047], [3.333, 74, 0.42, 0.049], [3.667, 76, 0.45, 0.051]],
    },

    // Bars 7–10: F7/A -> Bb lyrical arch -> Mozart's chiaroscuro Bbm6/Db sigh (Db5 -> C5) -> F/C - C7
    {
      pizz: [[0, 45], [2, 41]],
      pad: [57, 60, 63],
      triplets: [57, 60, 63],
      notes: [[0, 77, 1.95, 0.058], [2, 77, 0.98, 0.053], [3, 75, 1.05, 0.054]],
    },
    {
      pizz: [[0, 46], [2, 50]],
      pad: [58, 62, 65],
      triplets: [58, 62, 65],
      notes: [[0, 74, 1.95, 0.057], [2, 77, 0.68, 0.055], [2.667, 74, 0.68, 0.051], [3.333, 70, 0.72, 0.049]],
    },
    {
      pizz: [[0, 49], [2, 48]],
      pad: [56, 58, 65],
      triplets: [56, 58, 65],
      notes: [[0, 73, 1.95, 0.056], [2, 72, 0.98, 0.053], [3, 71, 0.42, 0.048], [3.333, 72, 0.42, 0.05], [3.667, 73, 0.45, 0.051]],
    },
    {
      pizz: [[0, 48], [2, 48]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      triplets2: [55, 58, 64],
      notes: [[0, 72, 1.05, 0.055], [1, 69, 1.05, 0.052], [2, 70, 1.02, 0.053], [3, 67, 1.05, 0.05]],
    },

    // Bars 11–16: Solo forte-piano crystalline entrance -> cantabile dialogue -> moonlit tonic breath
    {
      pizz: [[0, 41], [2, 48]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      notes: [[0, 65, 1.5, 0.051], [1.5, 72, 0.62, 0.05], [2, 77, 1.05, 0.056], [3, 81, 1.08, 0.059]],
    },
    {
      pizz: [[0, 43], [2, 48]],
      pad: [58, 62, 65],
      triplets: [58, 62, 65],
      triplets2: [55, 58, 64],
      notes: [[0, 82, 1.05, 0.058], [1, 79, 0.98, 0.055], [2, 76, 1.05, 0.054], [3, 72, 0.55, 0.049], [3.5, 70, 0.58, 0.048]],
    },
    {
      pizz: [[0, 45], [2, 50]],
      pad: [57, 60, 64],
      triplets: [57, 60, 64],
      triplets2: [57, 62, 65],
      notes: [[0, 69, 1.45, 0.052], [1.5, 72, 0.58, 0.051], [2, 77, 1.35, 0.057], [3.333, 76, 0.42, 0.051], [3.667, 74, 0.45, 0.05]],
    },
    {
      pizz: [[0, 43], [2, 48]],
      pad: [55, 58, 62],
      triplets: [55, 58, 62],
      triplets2: [55, 58, 64],
      notes: [[0, 70, 1.05, 0.053], [1, 67, 1.02, 0.05], [2, 72, 0.68, 0.054], [2.667, 69, 0.68, 0.052], [3.333, 67, 0.72, 0.05]],
    },
    {
      pizz: [[0, 41], [2, 41]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      triplets2: [58, 62, 65],
      notes: [[0, 65, 2.1, 0.054], [1, 77, 1.5, 0.024, true], [2, 74, 1.02, 0.048], [3, 70, 1.02, 0.046]],
    },
    {
      pizz: [[0, 41], [2, 48]],
      pad: [57, 60, 65],
      triplets: [57, 60, 65],
      notes: [[0, 69, 2.1, 0.05], [2, 84, 1.6, 0.02, true], [3, 67, 0.98, 0.045]],
    },
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

  function syncBgmThemeBuses(immediate = false) {
    if (!bgmAudioCtx || !bgmLightBusGain || !bgmDarkBusGain) return;
    try {
      const now = bgmAudioCtx.currentTime;
      const isDark = getBgmThemeMode() === 'dark';
      const lightTarget = isDark ? 0.0001 : 1.0;
      const darkTarget = isDark ? 1.0 : 0.0001;
      bgmLightBusGain.gain.cancelScheduledValues(now);
      bgmDarkBusGain.gain.cancelScheduledValues(now);
      if (immediate || typeof bgmLightBusGain.gain.setTargetAtTime !== 'function') {
        bgmLightBusGain.gain.setValueAtTime(lightTarget, now);
        bgmDarkBusGain.gain.setValueAtTime(darkTarget, now);
      } else {
        bgmLightBusGain.gain.setTargetAtTime(lightTarget, now, 0.09);
        bgmDarkBusGain.gain.setTargetAtTime(darkTarget, now, 0.09);
      }
    } catch (_e) {
      // ignore sub-bus gain ramp errors
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
    bgmLightBusGain = null;
    bgmDarkBusGain = null;
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
      toneFilter.frequency.setValueAtTime(1680, bgmAudioCtx.currentTime);
      toneFilter.Q.setValueAtTime(0.52, bgmAudioCtx.currentTime);
      toneFilter.connect(master);

      const lightBus = bgmAudioCtx.createGain();
      const darkBus = bgmAudioCtx.createGain();
      lightBus.connect(toneFilter);
      darkBus.connect(toneFilter);

      // Warm Viennese salon echo so felt-piano, strings & music-box notes bloom gently
      const delay = bgmAudioCtx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.29, bgmAudioCtx.currentTime);
      const echoFilter = bgmAudioCtx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(940, bgmAudioCtx.currentTime);
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
      bgmLightBusGain = lightBus;
      bgmDarkBusGain = darkBus;
      syncBgmThemeBuses(true);

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
    const targetBus = bgmLightBusGain || bgmNoteTarget;
    if (!targetBus) return;
    const freq = midiToHz(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + (isChime ? 0.012 : 0.024));
    env.gain.exponentialRampToValueAtTime(peakGain * 0.34, startTime + (isChime ? 0.28 : 0.38));
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
    env.connect(targetBus);

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

    oscMain.onended = () => {
      try {
        warmGain.disconnect();
        env.disconnect();
      } catch (_e) {
        // ignore audio node cleanup errors
      }
    };
    oscMain.start(startTime);
    oscWarm.start(startTime);
    oscMain.stop(startTime + durationSec + 0.05);
    oscWarm.stop(startTime + durationSec + 0.05);
  }

  // Dark Mode Voice 1: Warm Cello/Bass Pizzicato Pluck
  function scheduleMozartPizzBass(ctx, midi, startTime, durationSec, peakGain = 0.04) {
    const targetBus = bgmDarkBusGain || bgmNoteTarget;
    if (!targetBus) return;
    const freq = midiToHz(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + 0.016);
    env.gain.exponentialRampToValueAtTime(peakGain * 0.28, startTime + 0.26);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
    env.connect(targetBus);

    const oscFund = ctx.createOscillator();
    oscFund.type = 'sine';
    oscFund.frequency.setValueAtTime(freq, startTime);

    const oscBody = ctx.createOscillator();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(freq * 2, startTime);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.16, startTime);
    bodyGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

    oscFund.connect(env);
    oscBody.connect(bodyGain);
    bodyGain.connect(env);

    oscFund.onended = () => {
      try {
        bodyGain.disconnect();
        env.disconnect();
      } catch (_e) {
        // ignore audio node cleanup errors
      }
    };
    oscFund.start(startTime);
    oscBody.start(startTime);
    oscFund.stop(startTime + durationSec + 0.05);
    oscBody.stop(startTime + durationSec + 0.05);
  }

  // Dark Mode Voice 2: Velvet Muted Strings (con sordino) Nocturnal Halo
  function scheduleMozartMutedStrings(ctx, midiList, startTime, durationSec, peakGain = 0.011) {
    const targetBus = bgmDarkBusGain || bgmNoteTarget;
    if (!targetBus || !midiList || !midiList.length) return;
    midiList.forEach((midi, idx) => {
      const freq = midiToHz(midi);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.65, durationSec * 0.26));
      env.gain.setValueAtTime(peakGain * 0.85, startTime + durationSec * 0.72);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
      env.connect(targetBus);

      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      if (osc.detune) osc.detune.setValueAtTime((idx - 1) * 3.5, startTime);
      osc.connect(env);
      osc.onended = () => {
        try {
          env.disconnect();
        } catch (_e) {
          // ignore audio node cleanup errors
        }
      };
      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.06);
    });
  }

  // Dark Mode Voice 3: Feather-Soft Muted Triplet Accompaniment (Mozart's Moonlit Heartbeat)
  function scheduleMozartTripletNote(ctx, midi, startTime, durationSec, peakGain = 0.014) {
    const targetBus = bgmDarkBusGain || bgmNoteTarget;
    if (!targetBus) return;
    const freq = midiToHz(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + 0.032);
    env.gain.exponentialRampToValueAtTime(peakGain * 0.42, startTime + durationSec * 0.62);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
    env.connect(targetBus);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(env);
    osc.onended = () => {
      try {
        env.disconnect();
      } catch (_e) {
        // ignore audio node cleanup errors
      }
    };
    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.04);
  }

  // Dark Mode Voice 4: Singing Cantabile Solo Forte-Piano & Starlight Harmonic
  function scheduleMozartCantabileNote(ctx, midi, startTime, durationSec, peakGain, isChime = false) {
    const targetBus = bgmDarkBusGain || bgmNoteTarget;
    if (!targetBus) return;
    const freq = midiToHz(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + (isChime ? 0.016 : 0.03));
    env.gain.exponentialRampToValueAtTime(peakGain * 0.52, startTime + Math.min(0.65, durationSec * 0.48));
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
    env.connect(targetBus);

    const oscMain = ctx.createOscillator();
    oscMain.type = 'sine';
    oscMain.frequency.setValueAtTime(freq, startTime);

    const oscOver = ctx.createOscillator();
    oscOver.type = isChime ? 'sine' : 'triangle';
    oscOver.frequency.setValueAtTime(freq * 2, startTime);
    const overGain = ctx.createGain();
    overGain.gain.setValueAtTime(isChime ? 0.09 : 0.14, startTime);
    overGain.gain.exponentialRampToValueAtTime(0.01, startTime + Math.min(0.48, durationSec * 0.6));

    oscMain.connect(env);
    oscOver.connect(overGain);
    overGain.connect(env);

    oscMain.onended = () => {
      try {
        overGain.disconnect();
        env.disconnect();
      } catch (_e) {
        // ignore audio node cleanup errors
      }
    };
    oscMain.start(startTime);
    oscOver.start(startTime);
    oscMain.stop(startTime + durationSec + 0.05);
    oscOver.stop(startTime + durationSec + 0.05);
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
    const barStart = bgmAudioCtx.currentTime + 0.05;

    if (getBgmThemeMode() === 'dark') {
      const beatSec = 0.86; // Tranquil candlelit Andante (~70 BPM quarter pulse; 3 triplets/beat)
      const tripletSec = beatSec / 3;
      const bar = MOZART_K467_ANDANTE_BARS[bgmDarkBarIndex % MOZART_K467_ANDANTE_BARS.length];
      bgmDarkBarIndex = (bgmDarkBarIndex + 1) % MOZART_K467_ANDANTE_BARS.length;

      // 1. Muted con sordino strings sustain halo
      scheduleMozartMutedStrings(bgmAudioCtx, bar.pad, barStart, beatSec * 3.92, 0.0105);

      // 2. Cello/bass pizzicato on beats 1 & 3
      if (bar.pizz && bar.pizz.length) {
        bar.pizz.forEach(([pBeat, pMidi]) => {
          scheduleMozartPizzBass(bgmAudioCtx, pMidi, barStart + pBeat * beatSec, beatSec * 1.55, 0.038);
        });
      }

      // 3. Twelve pulsing triplet accompaniment notes across the 4 beats
      for (let step = 0; step < 12; step += 1) {
        const activeTriad = step >= 6 && bar.triplets2 ? bar.triplets2 : bar.triplets;
        if (activeTriad && activeTriad.length) {
          const tMidi = activeTriad[step % activeTriad.length];
          const tGain = step % 3 === 0 ? 0.0155 : 0.0125;
          scheduleMozartTripletNote(
            bgmAudioCtx,
            tMidi,
            barStart + step * tripletSec,
            tripletSec * 1.18,
            tGain
          );
        }
      }

      // 4. Singing solo forte-piano cantabile melody
      bar.notes.forEach((n) => {
        const [beatOffset, midi, durBeats, gain, isChime] = n;
        const rubato = (Math.random() - 0.5) * 0.01;
        const tStart = Math.max(bgmAudioCtx.currentTime + 0.02, barStart + beatOffset * beatSec + rubato);
        scheduleMozartCantabileNote(
          bgmAudioCtx,
          midi,
          tStart,
          Math.max(0.32, durBeats * beatSec),
          gain,
          Boolean(isChime)
        );
      });

      bgmLoopTimer = window.setTimeout(scheduleNextBgmBar, Math.round(beatSec * 4 * 1000));
      return;
    }

    const beatSec = 0.43; // Unhurried, tender Viennese 3/4 waltz (~140 quarter BPM = ~46 bars/min)
    const bar = BLUE_DANUBE_BARS[bgmLightBarIndex % BLUE_DANUBE_BARS.length];
    bgmLightBarIndex = (bgmLightBarIndex + 1) % BLUE_DANUBE_BARS.length;

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
    syncBgmThemeBuses(false);
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

  function handleBgmThemeSwitch() {
    if (getBgmThemeMode() === 'dark') {
      bgmDarkBarIndex = 0;
    } else {
      bgmLightBarIndex = 0;
    }
    syncBgmButtonA11y();
    if (!bgmPlaying) return;

    if (bgmLoopTimer) {
      clearTimeout(bgmLoopTimer);
      bgmLoopTimer = null;
    }
    if (!isVinylAudioHealthy()) {
      rebuildAndWakeVinylOnGesture();
      return;
    }
    syncBgmThemeBuses(false);
    wakeVinylBgm();
  }

  const unlockBgmAfterStandby = (e) => {
    if (!bgmPlaying || document.hidden || isVinylAudioHealthy()) return;
    if (btnBgm && e && e.target && typeof e.target.closest === 'function' && e.target.closest('#bgm-btn')) {
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
    updateCountdown(true);
  });

  btnTheme.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    safeSetStorage(STORAGE_KEY_THEME, next);
    handleBgmThemeSwitch();
  });

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
    if (!document.hidden) {
      ensureCountdownTickLoop();
      if (particles.length > 0 || !reducedMotionQuery.matches) {
        ensureConfettiLoop();
      }
    }
  });

  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener('change', () => {
      syncAmbientPetals();
      ensureConfettiLoop();
    });
  }

  btnCelebrate.addEventListener('click', launchConfetti);

  function applyDeepLinkFromUrl() {
    if (document.body.classList.contains('debug-locked')) return;
    let target = '';
    try {
      const params = new URLSearchParams(window.location.search);
      target = (params.get('tab') || '').trim().toLowerCase();
    } catch (_e) {
      target = '';
    }
    if (!target && window.location.hash) {
      target = window.location.hash.replace(/^#/, '').trim().toLowerCase();
    }
    if (target === 'seating' || target === 'seat' || target === 'seats') {
      showHubView('seating');
    } else if (target === 'menu' || target === 'banquet-menu') {
      showHubView('banquet-menu');
    }
  }

  function openSeatingZoomLightbox(imgSrc) {
    if (!imgSrc) return;
    let box = document.getElementById('seating-zoom-lightbox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'seating-zoom-lightbox';
      box.className = 'seating-zoom-lightbox hidden';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');

      const toolbar = document.createElement('div');
      toolbar.className = 'seating-zoom-toolbar';
      const tip = document.createElement('span');
      tip.id = 'seating-zoom-tip';
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.id = 'seating-zoom-close-btn';
      closeBtn.className = 'seating-zoom-close-btn';
      closeBtn.addEventListener('click', () => box.classList.add('hidden'));
      toolbar.append(tip, closeBtn);

      const scrollWrap = document.createElement('div');
      scrollWrap.className = 'seating-zoom-scroll';
      const img = document.createElement('img');
      img.id = 'seating-zoom-img';
      img.className = 'seating-zoom-img';
      scrollWrap.append(img);

      box.append(toolbar, scrollWrap);
      box.addEventListener('click', (ev) => {
        if (ev.target === box || ev.target === scrollWrap) {
          box.classList.add('hidden');
        }
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && !box.classList.contains('hidden')) {
          box.classList.add('hidden');
        }
      });
      document.body.append(box);
    }
    const tipEl = document.getElementById('seating-zoom-tip');
    const closeEl = document.getElementById('seating-zoom-close-btn');
    const imgEl = document.getElementById('seating-zoom-img');
    if (tipEl) {
      tipEl.textContent =
        currentLang === 'en'
          ? 'Pinch to zoom · Tap outside to close'
          : '支援雙指放大檢視 · 點擊空白處關閉';
    }
    if (closeEl) {
      closeEl.textContent = currentLang === 'en' ? '✕ Close' : '✕ 關閉';
    }
    if (imgEl) {
      imgEl.src = imgSrc;
      imgEl.alt = currentLang === 'en' ? 'Seating Floor Plan' : '婚宴座位平面圖';
    }
    box.classList.remove('hidden');
  }

  function initSeatingSearchClearBtn() {
    if (!elSeatingSearchInput || !elSeatingSearchInput.parentNode) return;
    if (document.getElementById('seating-search-clear-btn')) return;
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.id = 'seating-search-clear-btn';
    clearBtn.className = 'seating-search-clear-btn hidden';
    clearBtn.setAttribute('aria-label', 'Clear search');
    clearBtn.textContent = '✕';
    const syncClearVisibility = () => {
      clearBtn.classList.toggle('hidden', !elSeatingSearchInput.value.trim());
    };
    clearBtn.addEventListener('click', () => {
      elSeatingSearchInput.value = '';
      selectedSeatingZoneId = null;
      closeSeatingAutocomplete();
      syncClearVisibility();
      renderSeatingSection();
      elSeatingSearchInput.focus();
    });
    elSeatingSearchInput.addEventListener('input', syncClearVisibility);
    elSeatingSearchInput.addEventListener('change', syncClearVisibility);
    elSeatingSearchInput.parentNode.append(clearBtn);
    syncClearVisibility();
  }

  function initBackToTopButton() {
    if (document.getElementById('back-to-top-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'back-to-top-btn';
    btn.className = 'back-to-top-btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑';
    btn.addEventListener('click', () => {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (_e) {
        window.scrollTo(0, 0);
      }
    });
    document.body.append(btn);
    let ticking = false;
    const syncVisibility = () => {
      ticking = false;
      btn.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(syncVisibility);
        }
      },
      { passive: true }
    );
    syncVisibility();
  }

  // Initialize
  initPreferences();
  initSeatingSearchClearBtn();
  initBackToTopButton();
  ensureConfettiLoop();
  ensureCountdownTickLoop();
  applyDeepLinkFromUrl();
  window.addEventListener('hashchange', applyDeepLinkFromUrl);

  // Register Offline Service Worker (Network-First + Zero Easter Egg Spoiler)
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || window.location.protocol === 'http:') &&
    !document.getElementById('debug-auth-gate')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }
  // =========================================================================
  // Boutique Guest Touches: Add to Calendar (.ics), Weather Tip, Native Share & Scroll Reveal
  // =========================================================================
  var editorialRevealObserver;
  function observeEditorialReveal(container, selector) {
    if (!container) return;
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver !== 'function') return;

    const nodes = Array.from(container.querySelectorAll(selector));
    if (!nodes.length) return;

    if (!editorialRevealObserver) {
      editorialRevealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              editorialRevealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -24px 0px', threshold: 0.06 }
      );
    }

    const vh = window.innerHeight || 800;
    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.96) {
        el.classList.remove('editorial-reveal');
        el.classList.add('is-revealed');
      } else {
        el.classList.add('editorial-reveal');
        editorialRevealObserver.observe(el);
      }
    });
  }

  function getWeddingCalendarEventDetails() {
    const isEn = currentLang === 'en';
    const summary = isEn
      ? 'Tom & Eunice Wedding Banquet · Brick Yard 33 1/3'
      : 'Tom & Eunice 婚禮午宴 · 陽明山美軍俱樂部 Brick Yard 33 1/3';
    const location = isEn
      ? 'Brick Yard 33 1/3, No. 49, Kaixuan Rd., Shilin Dist., Taipei City'
      : '陽明山美軍俱樂部 Brick Yard 33 1/3（台北市士林區凱旋路 49 號）';
    const descriptionLines = isEn
      ? [
          '11:30 Outdoor Cocktail Reception | 12:30 Wedding Banquet.',
          'Shuttle bus (prior reservation required): departs promptly at 11:00 AM from MRT Jiantan Station Exit 2 (Jihe Rd.).',
          'Dress Code: Milk Tea & Earth Tones (beige, oat, camel, warm brown).',
          'Yangmingshan can be breezy—please bring a light jacket or shawl.',
          'Wedding Site: https://chihweitung.github.io/wedding-vc/',
        ]
      : [
          '11:30 戶外雞尾酒迎賓｜12:30 午宴正式開席。',
          '接駁小巴（需事前預約）：11:00 準時從捷運劍潭站 2 號出口（基河路）發車。',
          'Dress Code：奶茶色系 & 大地色系（米白、燕麥、奶茶、暖棕）。',
          '陽明山山區微涼，建議攜帶薄外套或披肩。',
          '婚禮網站：https://chihweitung.github.io/wedding-vc/',
        ];
    return {
      summary,
      location,
      descriptionText: descriptionLines.join('\n'),
      descriptionIcs: descriptionLines.join('\\n'),
      startUtc: '20261129T033000Z',
      endUtc: '20261129T073000Z',
    };
  }

  function buildGoogleCalendarUrl() {
    const ev = getWeddingCalendarEventDetails();
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: ev.summary,
      dates: `${ev.startUtc}/${ev.endUtc}`,
      location: ev.location,
      details: ev.descriptionText,
      ctz: 'Asia/Taipei',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function downloadWeddingCalendarIcs() {
    const ev = getWeddingCalendarEventDetails();
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tom and Eunice Wedding//20261129//ZH',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:tom-eunice-wedding-20261129@wedding-vc',
      'DTSTAMP:20261127T080000Z',
      `DTSTART:${ev.startUtc}`,
      `DTEND:${ev.endUtc}`,
      `SUMMARY:${ev.summary}`,
      `LOCATION:${ev.location}`,
      `DESCRIPTION:${ev.descriptionIcs}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Tom & Eunice Wedding Reminder',
      'TRIGGER:-PT60M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Tom-and-Eunice-Wedding-20261129.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function shareWeddingSectionLink(hash, btnEl) {
    const isEn = currentLang === 'en';
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const shareUrl = `${baseUrl}#${hash}`;
    const title =
      hash === 'menu'
        ? isEn
          ? 'Tom & Eunice · Wedding Banquet Menu'
          : 'Tom & Eunice · 婚宴佳餚與調酒菜單'
        : isEn
          ? 'Tom & Eunice · Wedding Seating Chart'
          : 'Tom & Eunice · 婚宴座位表查詢';
    const text =
      hash === 'menu'
        ? isEn
          ? 'Check out the Brick Yard 33 1/3 buffet menu & cocktails!'
          : '一起看看 11/29 陽明山美軍俱樂部婚宴菜單與調酒！'
        : isEn
          ? 'Search your table & view the Brick Yard 33 1/3 seating chart!'
          : '快速搜尋 11/29 Tom & Eunice 婚宴桌次與座位圖！';

    if (navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (_err) {
        // User cancelled or share unavailable; fall through only if not AbortError
        if (_err && _err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      if (btnEl) {
        const orig = btnEl.textContent;
        btnEl.textContent = isEn ? '✅ Link Copied' : '✅ 已複製連結';
        window.setTimeout(() => {
          btnEl.textContent = isEn ? '🔗 Share' : '🔗 分享連結';
        }, 2000);
      }
    } catch (_e) {
      // Ignore clipboard failure
    }
  }

  var elDressCodeText;
  var elWeatherTipText;
  var elAddCalendarBtn;
  var elCalendarMenu;
  var elCalendarGoogleLink;
  var elCalendarIcsBtn;
  var elSeatingShareBtn;
  var elMenuShareBtn;

  function setCalendarMenuOpen(isOpen) {
    const menu = elCalendarMenu || document.getElementById('countdown-calendar-menu');
    const btn = elAddCalendarBtn || document.getElementById('countdown-add-calendar-btn');
    if (!menu || !btn) return;
    menu.classList.toggle('hidden', !isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function ensureBoutiqueExtrasMounted() {
    const transitCard = document.getElementById('countdown-transit-card');
    if (transitCard && !document.getElementById('countdown-transit-footer')) {
      const footerStrip = document.createElement('div');
      footerStrip.id = 'countdown-transit-footer';
      footerStrip.className = 'countdown-transit-footer';

      const tipsStack = document.createElement('div');
      tipsStack.className = 'countdown-tips-stack';

      const dressRow = document.createElement('div');
      dressRow.className = 'countdown-dresscode-row';
      elDressCodeText = document.createElement('span');
      elDressCodeText.className = 'countdown-dresscode-text';
      const swatches = document.createElement('span');
      swatches.className = 'countdown-dresscode-swatches';
      swatches.setAttribute('aria-hidden', 'true');
      ['#efe7dc', '#d6c3ab', '#b58e6b', '#7c5a43'].forEach((hex) => {
        const dot = document.createElement('span');
        dot.className = 'countdown-dresscode-swatch';
        dot.style.backgroundColor = hex;
        swatches.appendChild(dot);
      });
      dressRow.append(elDressCodeText, swatches);

      elWeatherTipText = document.createElement('p');
      elWeatherTipText.className = 'countdown-weather-tip';
      tipsStack.append(dressRow, elWeatherTipText);

      const calWrap = document.createElement('div');
      calWrap.id = 'countdown-calendar-wrap';
      calWrap.className = 'countdown-calendar-wrap';

      elAddCalendarBtn = document.createElement('button');
      elAddCalendarBtn.type = 'button';
      elAddCalendarBtn.id = 'countdown-add-calendar-btn';
      elAddCalendarBtn.className = 'countdown-calendar-btn';
      elAddCalendarBtn.setAttribute('aria-haspopup', 'menu');
      elAddCalendarBtn.setAttribute('aria-expanded', 'false');
      elAddCalendarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = elCalendarMenu && elCalendarMenu.classList.contains('hidden');
        setCalendarMenuOpen(Boolean(willOpen));
      });

      elCalendarMenu = document.createElement('div');
      elCalendarMenu.id = 'countdown-calendar-menu';
      elCalendarMenu.className = 'countdown-calendar-menu hidden';
      elCalendarMenu.setAttribute('role', 'menu');

      elCalendarGoogleLink = document.createElement('a');
      elCalendarGoogleLink.id = 'countdown-cal-google';
      elCalendarGoogleLink.className = 'countdown-calendar-option';
      elCalendarGoogleLink.setAttribute('role', 'menuitem');
      elCalendarGoogleLink.target = '_blank';
      elCalendarGoogleLink.rel = 'noopener noreferrer';
      elCalendarGoogleLink.addEventListener('click', () => setCalendarMenuOpen(false));

      elCalendarIcsBtn = document.createElement('a');
      elCalendarIcsBtn.id = 'countdown-cal-ics';
      elCalendarIcsBtn.className = 'countdown-calendar-option';
      elCalendarIcsBtn.setAttribute('role', 'menuitem');
      elCalendarIcsBtn.href = './wedding-20261129.ics';
      elCalendarIcsBtn.addEventListener('click', () => {
        setCalendarMenuOpen(false);
      });

      elCalendarMenu.append(elCalendarGoogleLink, elCalendarIcsBtn);
      calWrap.append(elAddCalendarBtn, elCalendarMenu);

      document.addEventListener('click', (e) => {
        if (elCalendarMenu && !elCalendarMenu.classList.contains('hidden') && !calWrap.contains(e.target)) {
          setCalendarMenuOpen(false);
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elCalendarMenu && !elCalendarMenu.classList.contains('hidden')) {
          setCalendarMenuOpen(false);
        }
      });

      footerStrip.append(tipsStack, calWrap);
      transitCard.append(footerStrip);
    }

    const seatingTop = document.querySelector('#seating-section .section-top-row');
    if (seatingTop && !document.getElementById('seating-share-link-btn')) {
      elSeatingShareBtn = document.createElement('button');
      elSeatingShareBtn.type = 'button';
      elSeatingShareBtn.id = 'seating-share-link-btn';
      elSeatingShareBtn.className = 'secondary-btn sm-btn section-share-btn';
      elSeatingShareBtn.addEventListener('click', () => shareWeddingSectionLink('seating', elSeatingShareBtn));
      let actionsGroup = document.getElementById('seating-top-actions');
      if (!actionsGroup) {
        actionsGroup = document.createElement('div');
        actionsGroup.id = 'seating-top-actions';
        actionsGroup.className = 'section-top-actions';
        seatingTop.appendChild(actionsGroup);
      }
      const existingZoomBtn = document.getElementById('seating-zoom-map-btn');
      if (existingZoomBtn && existingZoomBtn.parentNode !== actionsGroup) {
        actionsGroup.insertBefore(existingZoomBtn, actionsGroup.firstChild);
      }
      actionsGroup.appendChild(elSeatingShareBtn);
    }

    const menuTop = document.querySelector('#banquet-menu-section .section-top-row');
    if (menuTop && !document.getElementById('menu-share-link-btn')) {
      elMenuShareBtn = document.createElement('button');
      elMenuShareBtn.type = 'button';
      elMenuShareBtn.id = 'menu-share-link-btn';
      elMenuShareBtn.className = 'secondary-btn sm-btn section-share-btn';
      elMenuShareBtn.addEventListener('click', () => shareWeddingSectionLink('menu', elMenuShareBtn));
      menuTop.append(elMenuShareBtn);
    }
  }

  function syncBoutiqueExtrasUi() {
    ensureBoutiqueExtrasMounted();
    const isEn = currentLang === 'en';
    if (elDressCodeText) {
      elDressCodeText.textContent = isEn
        ? '👗 Dress Code: Milk Tea & Earth Tones'
        : '👗 Dress Code：奶茶色系 & 大地色系';
    }
    if (elWeatherTipText) {
      elWeatherTipText.textContent = isEn
        ? '🧥 Yangmingshan can be breezy—we recommend a light jacket or shawl for the outdoor cocktail hour.'
        : '🧥 陽明山山區微涼，戶外迎賓時段建議攜帶薄外套或披肩';
    }
    if (elAddCalendarBtn) {
      elAddCalendarBtn.textContent = isEn ? '📅 Add to Calendar ▾' : '📅 加入行事曆 ▾';
    }
    if (elCalendarGoogleLink) {
      elCalendarGoogleLink.href = buildGoogleCalendarUrl();
      elCalendarGoogleLink.textContent = isEn ? '📆 Google Calendar' : '📆 Google 日曆（直接開啟）';
    }
    if (elCalendarIcsBtn) {
      elCalendarIcsBtn.href = isEn ? './wedding-20261129-en.ics' : './wedding-20261129.ics';
      elCalendarIcsBtn.textContent = isEn ? '🍎 Apple / Outlook (.ics)' : '🍎 Apple / Outlook 行事曆';
    }
    if (elSeatingShareBtn) {
      elSeatingShareBtn.textContent = isEn ? '🔗 Share' : '🔗 分享連結';
    }
    if (elMenuShareBtn) {
      elMenuShareBtn.textContent = isEn ? '🔗 Share' : '🔗 分享連結';
    }
  }

  syncBoutiqueExtrasUi();
})();
