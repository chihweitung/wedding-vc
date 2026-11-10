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

  // 雙語介面文字設定 (繁體中文 / English)
  const I18N = {
    zh: {
      pageTitle: 'Tom & Eunice 婚宴倒數 — 2026.11.29 12:30',
      langBtnLabel: 'EN',
      eyebrowCountdown: 'WEDDING CELEBRATION · 婚宴倒數',
      eyebrowTimeUp: 'HAPPY WEDDING · 幸福時刻已來臨',
      eventTitle: '我們結婚了 · 誠摯邀請您共襄盛舉',
      targetSubtitle: '2026 年 11 月 29 日（星期日）中午 12:30 · 台灣時間 (UTC+8)',
      labelDays: 'DAYS · 天',
      labelHours: 'HOURS · 時',
      labelMinutes: 'MINUTES · 分',
      labelSeconds: 'SECONDS · 秒',
      metricHoursLabel: '距離幸福時刻還有',
      unitHours: '小時',
      metricMinutesLabel: '或是',
      unitMinutes: '分鐘',
      metricSecondsLabel: '倒數秒數',
      unitSeconds: '秒',
      videoCardEyebrow: 'OUR WEDDING FILM',
      videoCardTitle: '新人影片',
      videoCardDesc: '觀賞 Tom & Eunice 的專屬婚禮影片，一起見證我們的幸福故事',
      videoCardCta: '點擊觀賞影片 →',
      quizCardEyebrow: 'COUPLE QUIZ · 暖身題 + 10 題問答',
      quizCardTitle: '了解新人',
      quizCardDesc: '挑戰暖身題與 10 道關於新人的趣味問答，看看您對新郎還是新娘最熟悉！',
      quizCardCta: '開始挑戰問答 →',
      shareCardEyebrow: 'GOOGLE PHOTOS · SHARED ALBUM',
      shareCardTitle: '分享新人照片',
      shareCardDesc: '打開婚宴專屬 Google Photos 共享相簿，上傳您拍下的美好瞬間！',
      shareCardCta: '前往共享相簿 →',
      galleryCardEyebrow: 'OUR MEMORIES · 2014–2026',
      galleryCardTitle: '新人過去照片',
      galleryCardDesc: '回顧 Tom & Eunice 從相識、相戀到步入禮堂的珍貴歲月寫真',
      galleryCardCta: '瀏覽回憶相簿 →',
      footprintsCardEyebrow: 'LOVE FOOTPRINTS · GOOGLE MAPS TIMELINE',
      footprintsCardTitle: '新人交往軌跡',
      footprintsCardDesc: '探索 Tom & Eunice 的 Google Maps 戀愛足跡與跨國旅行地圖紀錄',
      footprintsCardCta: '探索交往軌跡地圖 →',
      seatingCardEyebrow: 'SEATING CHART · TABLE DIRECTORY',
      seatingCardTitle: '婚宴座位表',
      seatingCardDesc: '快速搜尋您的姓名或親友分類，查看美軍俱樂部宴會廳座位配置圖',
      seatingCardCta: '查詢桌次與座位圖 →',
      menuCardEyebrow: 'WEDDING BANQUET · BUFFET MENU',
      menuCardTitle: '婚宴餐點',
      menuCardDesc: '瀏覽美軍俱樂部豐盛百匯自助餐、現切牛排與 Bartender 特調飲品菜單',
      menuCardCta: '查看婚宴菜單 →',
      tabBackHub: '← 返回主選單',
      tabBackCountdown: '← 返回倒數計時',
      tabVideo: '🎬 新人影片',
      tabQuiz: '🌿 了解新人',
      tabSeating: '🪑 座位表',
      tabMenu: '🍽️ 婚宴餐點',
      tabShare: '📸 分享照片',
      tabGallery: '🎞️ 過去照片',
      tabFootprints: '🗺️ 交往軌跡',
      seatingPanelEyebrow: 'SEATING CHART · BRICK YARD 33 1/3',
      seatingPanelTitle: '美軍俱樂部 · 婚宴座位表',
      seatingExternalBtn: '開啟完整座位圖 ↗',
      seatingSearchPlaceholder: '🔍 輸入您的姓名或親友分類（例如：新娘大學、新郎交大、MOZ、同事、親戚）快速查詢...',
      menuPanelEyebrow: 'BRICK YARD 33 1/3 · WEDDING BUFFET MENU',
      menuPanelTitle: '美軍俱樂部 · 婚宴百匯自助餐菜單',
      menuExternalBtn: '開啟完整菜單相片 ↗',
      menuNoteText: '🍸 迎賓禮遇：現場設有「戶外雞尾酒點心吧」與「Bartender 現調調酒（每人一杯）」，自助百匯區提供現切爐烤曼哈頓牛排、豐富海陸主菜與精緻法式甜點（標註素食／蛋奶素／含酒精），敬請盡情享用！',
      viewGooglePhotoBtn: '📸 在 Google Photos 查看相片 ↗',
      sharePanelEyebrow: 'GOOGLE PHOTOS SHARED ALBUM',
      sharePanelTitle: '分享您鏡頭下的 Tom & Eunice',
      sharePanelDesc: '誠摯邀請您將今天在婚宴現場拍下的照片與影片上傳至我們的 Google Photos 共享相簿，與我們一起珍藏這一天！',
      shareStep1: '1. 點擊下方按鈕開啟 Google Photos 相簿',
      shareStep2: '2. 點選「新增相片」即可直接上傳分享',
      shareLinkBtn: '📸 開啟 Google Photos 婚禮共享相簿 ↗',
      galleryPanelEyebrow: 'OUR MEMORIES · 2014–2026',
      galleryPanelTitle: '新人過去照片 · 歲月寫真',
      galleryAlbumLinkBtn: '開啟完整 Google 相簿 ↗',
      eraAll: '全部年份 (2014–2026)',
      era2014: '2014–2017 青春相識',
      era2018: '2018–2021 遠距與成長',
      era2022: '2022–2026 攜手成家',
      footprintsPanelEyebrow: 'GOOGLE MAPS TIMELINE',
      footprintsPanelTitle: 'Tom & Eunice 交往軌跡',
      footprintStatsText: '🤵‍♂️ Tom (藍線) · 👰‍♀️ Eunice (粉線) · 🌍 最遠相距 13,877 km (奧蘭多 ↔ 高雄) · 遠距 9,100 km (住柏林 ↔ 高雄)',
      footprintTrackTom: '🤵‍♂️ Tom Tung · 台北 ➔ 新竹 ➔ 柏林 ➔ 新北 ➔ 台北',
      footprintTrackEunice: '👰‍♀️ Eunice Hsiao · 高雄 ➔ 諾丁漢 ➔ 高雄 ➔ 新北 ➔ 台北',
      yearAll: '全部足跡',
      openMapBtn: '在 Google Maps 查看地點 ↗',
      timelinePlayBtn: '▶ 播放交往軌跡影片',
      timelinePauseBtn: '⏸ 暫停播放',
      timelinePrevBtn: '⏮ 上一站',
      timelineNextBtn: '⏭ 下一站',
      timelineReplayBtn: '↺ 重播',
      timelineExportBtn: '🎥 匯出下載影片 (.webm)',
      timelineExportingBtn: '⏳ 正在錄製生成影片中...',
      mediaBadgeYoutube: 'OUR WEDDING FILM · 新人影片',
      mediaBadgeShorts: 'YOUTUBE SHORTS · 新人影片',
      mediaBadgeIgReel: 'INSTAGRAM REEL · 新人影片',
      mediaBadgeIg: 'INSTAGRAM · 新人影片',
      scoreBadge: (score, total) => `目前得分：${score} / ${total}`,
      correctHeadline: (label, text) => `✨ 答對了！正確答案就是 (${label}) ${text}`,
      wrongHeadline: (label, text) => `💡 差一點點！正確答案是 (${label}) ${text}`,
      nextBtn: '下一題 →',
      finishBtn: '查看最終成績 🎉',
      quizCompletedEyebrow: 'QUIZ COMPLETED · 答題完成',
      quizSummaryTitle: '感謝您的熱情參與！',
      restartBtn: '重新挑戰一次',
      toVideoBtn: '🎬 前往觀賞新人影片',
      clockCaption: '目前台灣時間：',
      celebrateBtn: '灑落花瓣祝福',
    },
    en: {
      pageTitle: 'Tom & Eunice Wedding Countdown — Nov 29, 2026 12:30 PM',
      langBtnLabel: '中文',
      eyebrowCountdown: 'WEDDING CELEBRATION · COUNTDOWN',
      eyebrowTimeUp: 'HAPPY WEDDING · THE MOMENT HAS ARRIVED',
      eventTitle: 'We Are Getting Married · Join Us in Celebrating',
      targetSubtitle: 'Sunday, November 29, 2026 at 12:30 PM · Taipei Time (UTC+8)',
      labelDays: 'DAYS',
      labelHours: 'HOURS',
      labelMinutes: 'MINUTES',
      labelSeconds: 'SECONDS',
      metricHoursLabel: 'Time Remaining',
      unitHours: 'hrs',
      metricMinutesLabel: 'or',
      unitMinutes: 'mins',
      metricSecondsLabel: 'Total',
      unitSeconds: 'secs',
      videoCardEyebrow: 'OUR WEDDING FILM',
      videoCardTitle: 'Wedding Film',
      videoCardDesc: 'Watch Tom & Eunice’s wedding video and celebrate our journey together.',
      videoCardCta: 'Watch Our Film →',
      quizCardEyebrow: 'COUPLE QUIZ · WARM-UP + 10 QUESTIONS',
      quizCardTitle: 'Get to Know Us',
      quizCardDesc: 'Take a warm-up & 10 fun questions about Tom & Eunice to see who you know best!',
      quizCardCta: 'Start the Quiz →',
      shareCardEyebrow: 'GOOGLE PHOTOS · SHARED ALBUM',
      shareCardTitle: 'Share Wedding Photos',
      shareCardDesc: 'Open our shared Google Photos album and upload the moments you captured today!',
      shareCardCta: 'Open Shared Album →',
      galleryCardEyebrow: 'OUR MEMORIES · 2014–2026',
      galleryCardTitle: 'Our Past Photos',
      galleryCardDesc: 'Look back on Tom & Eunice’s favorite photos from 2014 to our wedding day.',
      galleryCardCta: 'Browse Photo Memories →',
      footprintsCardEyebrow: 'LOVE FOOTPRINTS · GOOGLE MAPS TIMELINE',
      footprintsCardTitle: 'Love Footprints',
      footprintsCardDesc: 'Explore our Google Maps timeline and travel footprints together.',
      footprintsCardCta: 'Explore Timeline Map →',
      seatingCardEyebrow: 'SEATING CHART · TABLE DIRECTORY',
      seatingCardTitle: 'Seating Chart',
      seatingCardDesc: 'Search your name or group to find your seating zone at Brick Yard 33 1/3.',
      seatingCardCta: 'Find Your Seat →',
      menuCardEyebrow: 'WEDDING BANQUET · BUFFET MENU',
      menuCardTitle: 'Wedding Menu',
      menuCardDesc: 'Explore the Brick Yard 33 1/3 wedding buffet, carving station & Bartender cocktails.',
      menuCardCta: 'View Buffet Menu →',
      tabBackHub: '← Back to Menu',
      tabBackCountdown: '← Back to Countdown',
      tabVideo: '🎬 Wedding Film',
      tabQuiz: '🌿 Couple Quiz',
      tabSeating: '🪑 Seating',
      tabMenu: '🍽️ Menu',
      tabShare: '📸 Share Photos',
      tabGallery: '🎞️ Past Photos',
      tabFootprints: '🗺️ Footprints',
      seatingPanelEyebrow: 'SEATING CHART · BRICK YARD 33 1/3',
      seatingPanelTitle: 'Brick Yard 33 1/3 · Seating Chart',
      seatingExternalBtn: 'Open Full Floor Plan ↗',
      seatingSearchPlaceholder: '🔍 Search by guest name, table zone, or group (e.g., NCTU, MOZ, College, Colleagues)...',
      menuPanelEyebrow: 'BRICK YARD 33 1/3 · WEDDING BUFFET MENU',
      menuPanelTitle: 'Brick Yard 33 1/3 · Wedding Buffet Menu',
      menuExternalBtn: 'Open Full Menu Photo ↗',
      menuNoteText: '🍸 Welcome Perks: Enjoy our complimentary Outdoor Cocktail & Canapé Bar plus 1 Bartender Handcrafted Cocktail per guest, alongside our full carving & buffet stations!',
      viewGooglePhotoBtn: '📸 View on Google Photos ↗',
      sharePanelEyebrow: 'GOOGLE PHOTOS SHARED ALBUM',
      sharePanelTitle: 'Share Tom & Eunice Through Your Lens',
      sharePanelDesc: 'We warmly invite you to upload the photos and videos you captured at our wedding today to our Google Photos Shared Album!',
      shareStep1: '1. Click the button below to open Google Photos',
      shareStep2: '2. Tap "Add photos" to share your shots with us',
      shareLinkBtn: '📸 Open Wedding Google Photos Album ↗',
      galleryPanelEyebrow: 'OUR MEMORIES · 2014–2026',
      galleryPanelTitle: 'Past Photos · 2014–2026 Memories',
      galleryAlbumLinkBtn: 'Open Full Google Photos Album ↗',
      eraAll: 'All Years (2014–2026)',
      era2014: '2014–2017 First Chapters',
      era2018: '2018–2021 Across the Miles',
      era2022: '2022–2026 Forever Begins',
      footprintsPanelEyebrow: 'GOOGLE MAPS TIMELINE',
      footprintsPanelTitle: 'Tom & Eunice Love Footprints',
      footprintStatsText: '🤵‍♂️ Tom (Blue Line) · 👰‍♀️ Eunice (Pink Line) · 🌍 Max Distance: 13,877 km (Orlando ↔ Kaohsiung) & 9,100 km (Berlin ↔ Kaohsiung)',
      footprintTrackTom: '🤵‍♂️ Tom Tung · Taipei ➔ Hsinchu ➔ Berlin ➔ New Taipei ➔ Taipei',
      footprintTrackEunice: '👰‍♀️ Eunice Hsiao · Kaohsiung ➔ Nottingham ➔ Kaohsiung ➔ New Taipei ➔ Taipei',
      yearAll: 'All Footprints',
      openMapBtn: 'View on Google Maps ↗',
      timelinePlayBtn: '▶ Play Timeline Video',
      timelinePauseBtn: '⏸ Pause',
      timelinePrevBtn: '⏮ Prev',
      timelineNextBtn: '⏭ Next',
      timelineReplayBtn: '↺ Replay',
      timelineExportBtn: '🎥 Download Video (.webm)',
      timelineExportingBtn: '⏳ Recording Video...',
      mediaBadgeYoutube: 'OUR WEDDING FILM',
      mediaBadgeShorts: 'YOUTUBE SHORTS · WEDDING FILM',
      mediaBadgeIgReel: 'INSTAGRAM REEL · WEDDING FILM',
      mediaBadgeIg: 'INSTAGRAM · WEDDING FILM',
      scoreBadge: (score, total) => `Score: ${score} / ${total}`,
      correctHeadline: (label, text) => `✨ Correct! The answer is (${label}) ${text}`,
      wrongHeadline: (label, text) => `💡 Close! The correct answer is (${label}) ${text}`,
      nextBtn: 'Next Question →',
      finishBtn: 'See Final Score 🎉',
      quizCompletedEyebrow: 'QUIZ COMPLETED',
      quizSummaryTitle: 'Thank You for Playing!',
      restartBtn: 'Play Again',
      toVideoBtn: '🎬 Watch Wedding Film',
      clockCaption: 'Current Taiwan Time:',
      celebrateBtn: 'Shower Petals',
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
          '差一點點！少了 5 畫，是不是把草字頭或玉字旁算少筆畫啦？其實 Tom「董智瑋」（13+12+13=38 畫）加上 Eunice「蕭睦宸」（16+13+10=39 畫），兩人合起來總共是「77 畫」（七七事變／Lucky Double Seven）喔！',
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
        zh: 'Dcard 上的初次相遇',
        en: 'First Meeting on Dcard',
      },
      caption: {
        zh: '2014 年，從 Dcard 牽起的奇妙緣分，開啟了我們長達 12 年的故事篇章。',
        en: 'In 2014, a serendipitous match on Dcard started our 12-year love story.',
      },
    },
    {
      era: '2014-2017',
      yearLabel: '2015–2016 · CAMPUS DAYS',
      emoji: '🐮',
      imageUrl: '',
      title: {
        zh: '關渡與北藝大鷺鷥草原散步',
        en: 'Walks on the TNUA Campus Lawn',
      },
      caption: {
        zh: '在北藝大校園裡看校牛「小麗」、「奧米加咆哮獸」與「犇爺」，度過無數悠閒午後。',
        en: 'Countless sunny afternoons visiting the famous TNUA campus cows together.',
      },
    },
    {
      era: '2014-2017',
      yearLabel: '2017 · GRADUATION & TRIPS',
      emoji: '🎓',
      imageUrl: '',
      title: {
        zh: '學生時代的畢業與小旅行',
        en: 'Graduation & Island Road Trips',
      },
      caption: {
        zh: '一起走遍台灣南北角落，在每個城市留下屬於我們的青春合照。',
        en: 'Exploring cities and coastlines across Taiwan, capturing our youth.',
      },
    },
    {
      era: '2018-2021',
      yearLabel: '2018–2020 · BERLIN & NOTTINGHAM',
      emoji: '🇬🇧',
      imageUrl: '',
      title: {
        zh: '德國柏林工作 ＆ 英國諾丁漢留學',
        en: 'Living in Berlin & UK Study Abroad in Nottingham',
      },
      caption: {
        zh: 'Tom 住在德國柏林工作、Eunice 赴羅賓漢傳奇城市英國諾丁漢留學，從 9,100 公里跨洲遠距離到同在歐洲相聚。',
        en: 'From 9,100 km apart between Berlin and Kaohsiung to reuniting across Europe while Eunice studied in Nottingham.',
      },
    },
    {
      era: '2018-2021',
      yearLabel: '2020–2021 · REUNION IN TAIWAN',
      emoji: '🏡',
      imageUrl: '',
      title: {
        zh: '重聚台灣與日常小確幸',
        en: 'Reunited in Taiwan · Everyday Joy',
      },
      caption: {
        zh: '結束遠距離後回到同一個時區，一起探索沒有「臭菜」的美味料理與日常風景！',
        en: 'Back in the same time zone, sharing everyday meals and adventures.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2022–2024 · CAREER & TRAVELS',
      emoji: '✈️',
      imageUrl: '',
      title: {
        zh: 'Google BMC Team 與世界旅行',
        en: 'Career Milestones & World Travels',
      },
      caption: {
        zh: '在工作與生活中並肩成長，解鎖更多跨國旅行與難忘風景。',
        en: 'Growing together in our careers and unlocking new travel destinations.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2025 · SHE SAID YES',
      emoji: '💍',
      imageUrl: '',
      title: {
        zh: '求婚成功 · 邁向人生下一站',
        en: 'She Said Yes · Engaged!',
      },
      caption: {
        zh: '從兩個人到決定攜手一生，拍下屬於我們的婚紗寫真。',
        en: 'From two hearts to one future—celebrating our engagement and pre-wedding shoot.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2026.09 · AUSTRIA HONEYMOON',
      emoji: '🏔️',
      imageUrl: '',
      title: {
        zh: '2026 年 9 月 · 奧地利浪漫蜜月之旅',
        en: 'Sep 2026 · Romantic Honeymoon in Austria',
      },
      caption: {
        zh: '2026 年 9 月兩人攜手飛往奧地利維也納與阿爾卑斯山湖區小鎮，珍藏最浪漫的蜜月回憶。',
        en: 'Exploring Vienna and the Austrian Alpine lakes together in September 2026.',
      },
    },
    {
      era: '2022-2026',
      yearLabel: '2026.11.29 · WEDDING DAY',
      emoji: '🥂',
      imageUrl: '',
      title: {
        zh: '2026.11.29 我們結婚了！',
        en: '2026.11.29 Our Wedding Celebration',
      },
      caption: {
        zh: '在所有摯愛親友的見證下，正式步入禮堂！',
        en: 'Tying the knot surrounded by our dearest family and friends!',
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
      zone: { zh: '主廳中左側 · 新娘親戚（主桌左側）', en: 'Main Hall Center-Left · Bride Relatives' },
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
        en: ['Parents Friends'],
      },
      color: '#65a30d',
      fillColor: 'rgba(101, 163, 13, 0.20)',
      debugStats: { headcount: 72, veg: 0, stroller: 0, childSeat: 0 },
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
        { zh: '徐和志、許嵐音等二人', en: '徐和志、許嵐音 (2)' },
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
        { zh: 'Yalan chang', en: 'Yalan chang' },
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
        { zh: '張世瑤Anny', en: '張世瑤Anny' },
        { zh: '蔡青樺 Iris', en: '蔡青樺 Iris' },
        { zh: '沈育琪', en: '沈育琪' },
      ],
    },
    {
      id: 'zone-groom-colleagues',
      box: { x: 1340, y: 1608, w: 200, h: 756 },
      mapLabel: {
        cx: 1442,
        cy: 1985,
        bw: 68,
        bh: 194,
        fontSize: 29,
        lineStep: 29,
        zh: ['G', 'o', 'o', 'g', 'l', 'e'],
        en: ['G', 'o', 'o', 'g', 'l', 'e'],
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
      name: { zh: '新郎交大區（交大）', en: "Groom's NCTU" },
      zone: { zh: '外廳右列上方區 · 交大', en: 'Lower Hall Right Col · Upper (NCTU)' },
      guests: [
        { zh: 'Allan Sun', en: 'Allan Sun' },
        { zh: '葉峻宇', en: '葉峻宇' },
        { zh: '林煜峯等四人', en: '林煜峯 (4)' },
        { zh: 'Kj liu等二人', en: 'Kj liu (2)' },
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
      title: { zh: '🍝 經典主食 · 義大利麵、燉飯與蒲燒油飯', en: '🍝 Signature Mains: Pasta, Risotto & Rice' },
      desc: {
        zh: '• 匈牙利松阪豬肉醬義大利麵\n• 羅勒松子雞肉義大利麵\n• 蒲燒鯛魚油飯\n• 普羅旺斯海鮮燉飯\n• 托斯卡尼松露蕈菇燉飯（蛋奶素）',
        en: '• Hungarian Pork Jowl Pasta\n• Basil Pine Nut Chicken Pasta\n• Kabayaki Sea Bream Oil Rice\n• Provence Seafood Risotto\n• Tuscan Truffle Mushroom Risotto (Ovo-Lacto Veg)',
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
        en: '• Peppercorn Pork Belly & Chicken Soup\n• Classic French Onion Soup',
      },
      tag: { zh: '湯品 (2 品)', en: 'Soups (2 Items)' },
    },
    {
      courseNo: 'STATION 05 · SAVORY BITES & ARTISANAL PIZZA',
      title: { zh: '🍕 歐陸派對鹹點 ＆ 手工披薩', en: '🍕 Savory Party Bites & Handcrafted Pizza' },
      desc: {
        zh: '• 手工義大利香腸披薩 ／ 愛爾蘭牧羊人派\n• 莫札瑞拉起司牛肉串 ／ 巴薩米克起司鮮蝦\n• 水牛城辣雞蛋堡（微辣） ／ 蘆筍起司火腿捲\n• 軟法菇菇時蔬堡（蛋奶素）',
        en: "• Handcrafted Italian Sausage Pizza / Irish Shepherd's Pie\n• Mozzarella Beef Skewers / Balsamic Cheese Prawns\n• Buffalo Spicy Chicken Slider (Mild Spicy) / Asparagus Cheese Ham Rolls\n• Soft Baguette Mushroom Veggie Slider (Ovo-Lacto Veg)",
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
      distanceLabel: '245 km · 過年南北走春',
      desc: {
        zh: 'Tom 在新竹交大讀書（週末回台北、過年去彰化屏東）；Eunice 在台北讀書、2月回高雄過年。',
        en: 'Tom studied at NCTU in Hsinchu (Lunar New Year in Changhua & Pingtung) while Eunice spent Lunar New Year in Kaohsiung.',
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
        zh: '2014.02.14 第一次見面 ＆ 2014.02.28 正式交往 💕（台北）',
        en: 'Feb 14, 2014 First Meet & Feb 28, 2014 Officially Together 💕 (Taipei)',
      },
      distanceLabel: '0 km · 正式交往起點 💕',
      desc: {
        zh: '2/14 情人節在台北第一次見面，2/28 正式開始交往！兩人距離第一次歸零！',
        en: 'First met in Taipei on Valentine’s Day (2/14) and officially became a couple on 2/28!',
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
        zh: '2014.04 · 新北北海岸（兩人同遊看海 💕）',
        en: 'Apr 2014 · North Coast, New Taipei (Trip Together 💕)',
      },
      distanceLabel: '0 km · 北海岸同遊 💕',
      desc: {
        zh: '4 月兩人一起去北海岸看海吹風，在蔚藍海岸線留下甜蜜足跡。',
        en: 'A romantic April coastal trip together along Taiwan’s North Coast.',
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
        zh: '2014.06 · Eunice 畢業回高雄 ＆ 6月底飛日本北海道旅行',
        en: 'Jun 2014 · Eunice Graduated to Kaohsiung & Late-June Hokkaido Trip',
      },
      distanceLabel: '2,680 km · 新竹 ↔ 北海道',
      desc: {
        zh: '6 月 Eunice 大學畢業回高雄，6 月底飛往日本北海道旅行，之後回高雄；Tom 在新竹與台北。',
        en: 'Eunice graduated in June, moved back to Kaohsiung, and traveled to Hokkaido, Japan at the end of June.',
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
        zh: '2014.07 · Eunice 去新竹找 Tom ＆ 一起去台中旅行 💕',
        en: 'Jul 2014 · Eunice Visited Tom in Hsinchu & Trip Together to Taichung 💕',
      },
      distanceLabel: '0 km · 新竹＆台中相聚 💕',
      desc: {
        zh: '7 月 Eunice 從高雄去新竹找 Tom，兩人還一起去台中玩，之後 Eunice 回高雄。',
        en: 'In July, Eunice visited Tom in Hsinchu and they took a trip together to Taichung.',
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
        zh: '2015.02 · Tom 回台北工作（過年彰化屏東）· Eunice 2月日本東京之旅',
        en: 'Feb 2015 · Tom Working in Taipei · Eunice’s Tokyo Trip',
      },
      distanceLabel: '2,100 km · 台北 ↔ 東京',
      desc: {
        zh: '2015 年 Tom 回台北工作（過年去彰化屏東）；Eunice 2 月飛往日本東京旅行，之後回高雄。',
        en: 'Tom returned to Taipei for work while Eunice visited Tokyo in February before returning to Kaohsiung.',
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
        zh: '2015.10 · 台中相聚（Tom 新訓結束 💕）',
        en: 'Oct 2015 · Reunion in Taichung (Tom Completed Basic Training 💕)',
      },
      distanceLabel: '0 km · 台中相聚 💕',
      desc: {
        zh: '10 月 Tom 新訓結束，Eunice 特地前往台中相聚慶祝，之後回高雄。',
        en: 'Eunice traveled to Taichung in October to celebrate Tom finishing basic training.',
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
        zh: '2015.11 · Tom 美國加州 MTV 出差 ↔ Eunice 日本東京旅行',
        en: 'Nov 2015 · Tom in Mountain View (MTV) ↔ Eunice in Tokyo',
      },
      distanceLabel: '8,321 km · 飛越太平洋兩端',
      desc: {
        zh: '11 月 Tom 飛越太平洋前往美國矽谷 Mountain View 出差後回台北；Eunice 飛往日本東京玩後回高雄。',
        en: 'In November, Tom flew across the Pacific to Mountain View (MTV) on business while Eunice traveled to Tokyo.',
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
        zh: '2015.12 · Tom 先飛美西再轉美東奧蘭多迪士尼出差 ↔ Eunice 高雄（最遠距離 🌍）',
        en: 'Dec 2015 · Tom Flew via US West Coast to Orlando Disney ↔ Eunice in Kaohsiung (Max Distance 🌍)',
      },
      distanceLabel: '13,877 km · 全紀錄最遠距離 🌍',
      desc: {
        zh: '12 月 Tom 從台灣飛越太平洋至美西、再轉往美東佛州奧蘭多迪士尼出差（之後回台北），與高雄的 Eunice 相隔 13,877 公里（12 年最遠距離！）。',
        en: 'Tom flew across the Pacific from Taiwan via the US West Coast to Orlando, Florida—13,877 km from Eunice in Kaohsiung!',
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
        zh: '2016.02 · Eunice 日本仙台玩 ＆ 228 紀念日 Tom 南下高雄相聚 💕',
        en: 'Feb 2016 · Eunice’s Sendai Trip & 2/28 Anniversary Reunion in Kaohsiung 💕',
      },
      distanceLabel: '0 km · 228 高雄約會 💕',
      desc: {
        zh: '2 月 Eunice 去日本仙台玩後回高雄；228 交往兩週年紀念日 Tom 特地南下高雄找 Eunice！',
        en: 'After Eunice’s trip to Sendai in February, Tom traveled down to Kaohsiung on 2/28 to celebrate their anniversary!',
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
        zh: '2016.06 · Tom 經杜拜飛英國倫敦出差 ↔ Eunice 在高雄',
        en: 'Jun 2016 · Tom Flew via Dubai to London on Business ↔ Eunice in Kaohsiung',
      },
      distanceLabel: '9,820 km · 倫敦 ↔ 高雄',
      desc: {
        zh: '6 月 Tom 經杜拜飛往英國倫敦出差，之後回台北；Eunice 在高雄。',
        en: 'In June 2016, Tom traveled via Dubai to London on a business trip while Eunice was in Kaohsiung.',
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
        zh: '2016.07 · Tom 先飛美西再轉加拿大多倫多出差 ＆ 尼加拉大瀑布',
        en: 'Jul 2016 · Tom Flew via US West Coast to Toronto & Niagara Falls ↔ Eunice in Kaohsiung',
      },
      distanceLabel: '12,376 km · 多倫多 ↔ 高雄',
      desc: {
        zh: '7 月 Tom 從台灣飛越太平洋至美西、再轉往美東／加拿大多倫多出差並順遊尼加拉大瀑布（距高雄 12,376 km），之後回台北。',
        en: 'Tom flew across the Pacific via the US West Coast to Toronto and Niagara Falls in July (12,376 km from Kaohsiung).',
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
        zh: '2016.09 · Eunice 飛往美國西雅圖旅行 ↔ Tom 在台北',
        en: 'Sep 2016 · Eunice Traveled to Seattle, USA ↔ Tom in Taipei',
      },
      distanceLabel: '9,770 km · 西雅圖 ↔ 台北',
      desc: {
        zh: '9 月 Eunice 飛越太平洋前往美國西岸西雅圖旅行，之後回高雄；Tom 在台北。',
        en: 'Eunice flew across the Pacific to Seattle on the US West Coast in September 2016 before returning to Kaohsiung.',
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
        zh: '2016.10–11 · Tom 10月先飛美西轉美東匹茲堡出差 ＆ 11月舊金山 SFO 之旅',
        en: 'Oct–Nov 2016 · Tom Flew via US West Coast to Pittsburgh & Nov San Francisco (SFO) Trip',
      },
      distanceLabel: '12,730 km · 匹茲堡 ↔ 高雄',
      desc: {
        zh: '10 月 Tom 從台灣飛越太平洋至美西再轉飛美東匹茲堡出差後回台北；11 月再去美西舊金山 (SFO) 玩後回台北。',
        en: 'Tom flew across the Pacific via the US West Coast to Pittsburgh on business in October, and visited San Francisco (SFO) in November.',
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
        zh: '2016.12 · Eunice 北上台北跟 Tom 約會 💕（同月 Tom 飛成田轉夏威夷出差）',
        en: 'Dec 2016 · Sweet Date in Taipei 💕 & Tom’s Narita/Hawaii Trip',
      },
      distanceLabel: '0 km · 12月台北約會 💕',
      desc: {
        zh: '12 月 Tom 去成田與夏威夷出差返台，Eunice 北上台北跟 Tom 甜蜜約會，之後回高雄。',
        en: 'Eunice came up to Taipei for a December date with Tom around his Tokyo Narita & Hawaii business trip.',
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
        zh: '2017.06 · Tom 飛美國舊金山 SFO 出差 ↔ Eunice 飛日本京都旅行',
        en: 'Jun 2017 · Tom in San Francisco (SFO) ↔ Eunice in Kyoto, Japan',
      },
      distanceLabel: '8,602 km · 舊金山 ↔ 京都',
      desc: {
        zh: '6 月 Tom 飛越太平洋前往美國舊金山 (SFO) 出差後回台北；Eunice 飛往日本京都古都旅行後回高雄。',
        en: 'In June 2017, Tom flew across the Pacific to San Francisco while Eunice explored Kyoto, Japan.',
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
        zh: '2017.09–10 · 9月台北相聚 💕（Tom 遊關西 · Eunice 10月遊北海道）',
        en: 'Sep–Oct 2017 · Taipei Reunion 💕, Kansai & Hokkaido Trips',
      },
      distanceLabel: '0 km · 9月台北相聚 💕',
      desc: {
        zh: '9 月 Tom 去關西玩、Eunice 去台北相聚；10 月 Eunice 再飛北海道旅行後回高雄。',
        en: 'Reunited in Taipei in September alongside trips to Kansai and Hokkaido.',
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
        zh: '2017.11–12 · Eunice 連兩月北上台北跟 Tom 約會 💕（12月初 Tom 飛德州奧斯汀）',
        en: 'Nov–Dec 2017 · Taipei Dates Together 💕 & Tom’s Austin Trip',
      },
      distanceLabel: '0 km · 台北秋冬約會 💕',
      desc: {
        zh: '11 月與 12 月 Eunice 都北上台北跟 Tom 約會（12 月初 Tom 還飛了一趟美國德州奧斯汀出差）。',
        en: 'Eunice visited Taipei in both November and December for dates with Tom.',
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
        zh: '2018.02 · Eunice 日本關西旅行 ↔ Tom 在台北',
        en: 'Feb 2018 · Eunice in Kansai, Japan ↔ Tom in Taipei',
      },
      distanceLabel: '1,720 km · 台北 ↔ 關西',
      desc: {
        zh: '2018 年 2 月 Eunice 前往日本關西旅行，之後回高雄；Tom 在台北。',
        en: 'Eunice traveled to Kansai, Japan in February 2018 before returning to Kaohsiung.',
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
        zh: '2018.06–07 · 兩人一起去日本東京 ＆ 德國柏林 💕（Tom 展開柏林工作）',
        en: 'Jun–Jul 2018 · Together to Tokyo & Berlin, Germany 💕',
      },
      distanceLabel: '0 km · 東京＆柏林同行 💕',
      desc: {
        zh: '7 月 Eunice 跟 Tom 一起去東京與德國柏林，陪伴 Tom 展開柏林工作生活，之後 Eunice 回高雄。',
        en: 'Traveled together to Tokyo and Berlin in summer 2018 as Tom started working in Berlin.',
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
        zh: '2018.11–12 · 柏林 ↔ 高雄 9,100 公里遠距離（11月 Tom 返台 · 12月奧蘭多環球影城）',
        en: 'Nov–Dec 2018 · 9,100 km Long Distance: Berlin ↔ Kaohsiung',
      },
      distanceLabel: '9,100 km · 柏林 ↔ 高雄',
      desc: {
        zh: '兩人展開德國柏林與台灣高雄 9,100 公里遠距離；11 月 Tom 返台相聚，12 月飛奧蘭多環球影城出差後回柏林。',
        en: '9,100 km apart between Berlin and Kaohsiung, with a November reunion in Taiwan.',
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
        zh: '2019.01–02 · Tom 走訪阿姆斯特丹與波蘭 ↔ Eunice 在高雄',
        en: 'Jan–Feb 2019 · Tom in Amsterdam, Poland & Berlin ↔ Eunice in Kaohsiung',
      },
      distanceLabel: '9,606 km · 阿姆斯特丹 ↔ 高雄',
      desc: {
        zh: '1 月 Tom 造訪荷蘭阿姆斯特丹、2 月造訪波蘭後返回柏林住；與高雄的 Eunice 跨越時差天天聯繫。',
        en: 'Tom visited Amsterdam and Poland from Berlin while keeping in touch across time zones with Eunice in Kaohsiung.',
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
        zh: '2019.06 · 兩人飛越半個地球在加拿大 Whistler ＆ 溫哥華重逢同遊 💕',
        en: 'Jun 2019 · Reunited in Whistler & Vancouver, Canada 💕',
      },
      distanceLabel: '0 km · 加拿大重逢同遊 💕',
      desc: {
        zh: '6 月 Tom 從柏林飛越大西洋、Eunice 從台灣飛越太平洋，兩人在加拿大 Whistler 與溫哥華甜蜜會合旅行！之後各自回柏林與高雄。',
        en: 'Flew from Berlin and Taiwan to meet up in Whistler and Vancouver for an unforgettable June trip together!',
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
        zh: '2019.08–09 · Eunice 9月赴英國諾丁漢讀書 ＆ Tom 8月返台、9月去倫敦與諾丁漢後回柏林住',
        en: 'Aug–Sep 2019 · Eunice Started Studying in Nottingham, UK & Tom Visited London/Nottingham',
      },
      distanceLabel: '0 km ➔ 920 km（同在歐洲！）',
      desc: {
        zh: '8 月 Tom 先回台灣，9 月去倫敦與諾丁漢後回柏林住；Eunice 9 月去英國諾丁漢讀書，兩人距離從 9,100 公里縮短成歐洲 920 公里！',
        en: 'Tom visited Taiwan in August and London/Nottingham in September before returning to Berlin, as Eunice began her studies in Nottingham, UK!',
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
        zh: '2019.11 · 兩人從柏林與英國飛往法國巴黎約會 💕',
        en: 'Nov 2019 · Romantic Rendezvous in Paris, France 💕',
      },
      distanceLabel: '0 km · 巴黎浪漫會合 💕',
      desc: {
        zh: '11 月 Tom 從柏林、Eunice 從英國諾丁漢前往法國巴黎相聚同遊，之後各自返回柏林與英國。',
        en: 'Met up in Paris from Berlin and Nottingham for a romantic November getaway.',
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
        zh: '2019.12 · Eunice 先去柏林找 Tom，再一起去捷克布拉格過聖誕月 💕',
        en: 'Dec 2019 · Eunice Visited Berlin & Trip Together to Prague, Czechia 💕',
      },
      distanceLabel: '0 km · 柏林＆布拉格同遊 💕',
      desc: {
        zh: '12 月 Eunice 先從英國飛柏林找 Tom，接著兩人一起去捷克布拉格旅行，之後 Eunice 回英國。',
        en: 'Eunice flew to Berlin in December to visit Tom, and together they traveled to fairytale Prague.',
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
        zh: '2020.02 · Eunice 飛往德國柏林找 Tom 相聚 💕（之後返英）',
        en: 'Feb 2020 · Eunice Visited Tom in Berlin 💕',
      },
      distanceLabel: '0 km · 柏林冬日相聚 💕',
      desc: {
        zh: '2020 年 1 月 Tom 回台北過年後返柏林；2 月 Eunice 從英國飛去柏林找 Tom 相聚，之後回英國。',
        en: 'In February 2020, Eunice flew from the UK to Berlin to spend time with Tom.',
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
        zh: '2020.03–04 · 3月英國 COVID Lockdown · 4月 Eunice 平平安安回台灣高雄',
        en: 'Mar–Apr 2020 · COVID Lockdown in UK & Eunice Returned Safely to Kaohsiung',
      },
      distanceLabel: '9,100 km · 疫情下的跨洲守候',
      desc: {
        zh: '3 月歐洲遇上 COVID-19 封城，4 月 Eunice 平安飛回台灣高雄，與仍在柏林的 Tom 隔海守候。',
        en: 'Following the March 2020 COVID lockdown in the UK, Eunice returned safely to Kaohsiung in April.',
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
        zh: '2020.10 · Tom 回台灣休息 · 兩人一起去日月潭、台中玩 💕',
        en: 'Oct 2020 · Tom Returned to Taiwan · Trip Together to Sun Moon Lake & Taichung 💕',
      },
      distanceLabel: '0 km · 台灣重逢小旅行 💕',
      desc: {
        zh: '10 月 Tom 回台灣休息，兩人一起去日月潭、台中、嘉義與台北旅行，之後 Eunice 先回高雄。',
        en: 'Tom returned to Taiwan in October for a break, and together they visited Sun Moon Lake and Taichung!',
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
        zh: '2020.11 & 2021.04 · 結束遠距離！一起搬到新北板橋定居 💕',
        en: 'Nov 2020 & Apr 2021 · Long Distance Ended! Settled Together in Banqiao 💕',
      },
      distanceLabel: '0 km · 板橋同居日常 💕',
      desc: {
        zh: 'Eunice 於 2020 年 11 月搬到板橋，Tom 於 2021 年 4 月正式返台定居板橋，徹底結束跨國與南北遠距離！',
        en: 'Eunice moved to Banqiao in Nov 2020 and Tom returned for good in Apr 2021—officially ending their long-distance journey!',
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
        zh: '2024 · 兩人一起搬到台北忠孝復興 💕',
        en: '2024 · Moved Together to Zhongxiao Fuxing, Taipei 💕',
      },
      distanceLabel: '0 km · 忠孝復興新家 💕',
      desc: {
        zh: '2024 年 Eunice 跟 Tom 一起搬到台北東區忠孝復興，展開溫馨的市中心新生活。',
        en: 'Moved together to Zhongxiao Fuxing in central Taipei in 2024.',
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
        zh: '2026.09 · 奧地利浪漫蜜月之旅 (Vienna & Hallstatt, Austria) 💕',
        en: 'Sep 2026 · Romantic Honeymoon in Austria 💕',
      },
      distanceLabel: '0 km · 歐洲蜜月同行 💕',
      desc: {
        zh: '2026 年 9 月兩人一起飛往奧地利維也納與阿爾卑斯山湖區小鎮，留下最浪漫的蜜月足跡。',
        en: 'Side by side across Vienna and the Austrian Alpine lakes on their romantic honeymoon in September 2026.',
      },
      mapQuery: 'Hallstatt,Austria',
    },
    {
      year: '2026',
      dateTag: '2026.11.29',
      tom: { lat: 25.047, lng: 121.532, city: { zh: '2026.11.29 婚禮會場', en: '2026.11.29 Wedding' } },
      eunice: { lat: 25.047, lng: 121.532, city: { zh: '2026.11.29 婚禮會場', en: '2026.11.29 Wedding' } },
      lat: 25.047,
      lng: 121.532,
      place: {
        zh: '2026.11.29 我們結婚了 · 婚宴大喜之日 💍🥂',
        en: '2026.11.29 Wedding Banquet Celebration 💍🥂',
      },
      distanceLabel: '0 km · 攜手一輩子 ∞ 💕',
      desc: {
        zh: '從 2014 到 2026，走過新竹、高雄、東京、西雅圖、舊金山、諾丁漢、柏林、板橋與忠孝復興，今天正式步入禮堂！',
        en: 'From 2014 to 2026—after bridging cities, oceans, and time zones—tying the knot today!',
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

  const elMetricLabelHours = document.getElementById('metric-label-hours');
  const elUnitHours = document.getElementById('unit-hours');
  const elMetricLabelMinutes = document.getElementById('metric-label-minutes');
  const elUnitMinutes = document.getElementById('unit-minutes');
  const elMetricLabelSeconds = document.getElementById('metric-label-seconds');
  const elUnitSeconds = document.getElementById('unit-seconds');

  const elTotalHours = document.getElementById('total-hours');
  const elTotalMinutes = document.getElementById('total-minutes');
  const elTotalSeconds = document.getElementById('total-seconds');

  const elCurrentTwTime = document.getElementById('current-tw-time');
  const elClockCaption = document.getElementById('clock-caption');
  const elStateLabel = document.getElementById('countdown-state-label');
  const elEventTitle = document.getElementById('event-title');
  const elTargetSubtitle = document.getElementById('target-subtitle');

  const btnLang = document.getElementById('lang-btn');
  const elLangBtnLabel = document.getElementById('lang-btn-label');
  const btnToggleMs = document.getElementById('toggle-ms-btn');
  const btnTheme = document.getElementById('theme-btn');
  const btnFullscreen = document.getElementById('fullscreen-btn');
  const btnCelebrate = document.getElementById('celebrate-btn');

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

  function applyLanguage() {
    const dict = t();
    document.documentElement.setAttribute('data-lang', currentLang);
    document.documentElement.setAttribute('lang', currentLang === 'en' ? 'en' : 'zh-Hant-TW');
    document.title = dict.pageTitle;

    elLangBtnLabel.textContent = dict.langBtnLabel;
    elStateLabel.textContent = isTimeUp ? dict.eyebrowTimeUp : dict.eyebrowCountdown;
    elEventTitle.textContent = dict.eventTitle;
    elTargetSubtitle.textContent = dict.targetSubtitle;

    elLabelDays.textContent = dict.labelDays;
    elLabelHours.textContent = dict.labelHours;
    elLabelMinutes.textContent = dict.labelMinutes;
    elLabelSeconds.textContent = dict.labelSeconds;

    elMetricLabelHours.textContent = dict.metricHoursLabel;
    elUnitHours.textContent = dict.unitHours;
    elMetricLabelMinutes.textContent = dict.metricMinutesLabel;
    elUnitMinutes.textContent = dict.unitMinutes;
    elMetricLabelSeconds.textContent = dict.metricSecondsLabel;
    elUnitSeconds.textContent = dict.unitSeconds;

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
    if (btnTimelinePrev) btnTimelinePrev.textContent = dict.timelinePrevBtn;
    if (btnTimelineNext) btnTimelineNext.textContent = dict.timelineNextBtn;
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
      iframe.sandbox = 'allow-scripts allow-same-origin allow-presentation allow-popups';
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
        bh: 248,
        fontSize: 36,
        lineStep: 48,
        lines: currentLang === 'en' ? ['🍽️', 'B', 'A', 'R'] : ['🍽️', '取', '餐', '區'],
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

    if (
      query &&
      ['廁所', '洗手間', '化妝室', '男廁', '女廁', 'restroom', 'toilet', 'wc'].some((kw) =>
        kw.includes(query) || query.includes(kw)
      )
    ) {
      highlightedIds.add(RESTROOM_ZONE_ID);
    }

    if (
      query &&
      ['吧台', '吧檯', '飲料', '調酒', '酒水', 'bar'].some((kw) =>
        kw.includes(query) || query.includes(kw)
      )
    ) {
      highlightedIds.add(BAR_ZONE_ID);
    }

    if (
      query &&
      ['餐點', '餐點區', '取餐', '自助餐', 'buffet', 'food'].some((kw) =>
        kw.includes(query) || query.includes(kw)
      )
    ) {
      highlightedIds.add(BUFFET_ZONE_ID);
    }

    if (
      query &&
      ['接待桌', '接待', '簽到', '收禮', '迎賓', '禮金', 'reception', 'checkin', 'desk'].some((kw) =>
        kw.includes(query) || query.includes(kw)
      )
    ) {
      highlightedIds.add(RECEPTION_ZONE_ID);
    }

    if (
      query &&
      ['廚房', '備餐', 'kitchen'].some((kw) =>
        kw.includes(query) || query.includes(kw)
      )
    ) {
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

      if (
        query &&
        !matchesTableTitle &&
        !hasMatchingGuest &&
        !highlightedIds.has(RESTROOM_ZONE_ID) &&
        !highlightedIds.has(BAR_ZONE_ID) &&
        !highlightedIds.has(BUFFET_ZONE_ID) &&
        !highlightedIds.has(RECEPTION_ZONE_ID) &&
        !highlightedIds.has(KITCHEN_ZONE_ID)
      ) {
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
      distBadge.textContent = item.distanceLabel;

      header.append(yearBadge, distBadge);

      if (item.tom && item.eunice) {
        const pairRow = document.createElement('div');
        pairRow.style.display = 'flex';
        pairRow.style.flexWrap = 'wrap';
        pairRow.style.gap = '8px';
        pairRow.style.marginTop = '6px';
        pairRow.style.marginBottom = '4px';

        const tomTag = document.createElement('span');
        tomTag.style.fontSize = '0.78rem';
        tomTag.style.fontWeight = '600';
        tomTag.style.padding = '2px 10px';
        tomTag.style.borderRadius = '999px';
        tomTag.style.background = 'rgba(56, 189, 248, 0.14)';
        tomTag.style.color = '#0369a1';
        tomTag.style.border = '1px solid rgba(56, 189, 248, 0.4)';
        tomTag.textContent = `🤵‍♂️ Tom · ${item.tom.city[currentLang]}`;

        const euniceTag = document.createElement('span');
        euniceTag.style.fontSize = '0.78rem';
        euniceTag.style.fontWeight = '600';
        euniceTag.style.padding = '2px 10px';
        euniceTag.style.borderRadius = '999px';
        euniceTag.style.background = 'rgba(244, 114, 182, 0.14)';
        euniceTag.style.color = '#be185d';
        euniceTag.style.border = '1px solid rgba(244, 114, 182, 0.4)';
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
    const headerLeftText = `${currentItem.dateTag || currentItem.year}  ·  ${currentItem.distanceLabel}`;
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

    const stream = elTimelineVideoCanvas.captureStream(60);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Tom-Eunice-Timeline-2014-2026.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      timelineRecording = false;
      if (btnTimelineExport) {
        btnTimelineExport.disabled = false;
        btnTimelineExport.textContent = t().timelineExportBtn;
      }
    };

    recorder.start();
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
        const correctLabels = q.answerIndexes.map((idx) => `(${labels[idx]})`).join('、');
        const wrongIdx = [0, 1, 2, 3].find((idx) => !q.answerIndexes.includes(idx));
        const wrongLabel = labels[wrongIdx] || 'D';
        if (currentLang === 'en') {
          elQuizResultHeadline.textContent = isCorrect
            ? `✨ Correct! ${correctLabels} are all real C++ bugs in this code!`
            : `💡 It’s a trap! ${correctLabels} are all real bugs—only (${wrongLabel}) is false!`;
        } else {
          elQuizResultHeadline.textContent = isCorrect
            ? `✨ 答對了！${correctLabels} 三個都是這段 C++ 程式真正存在的 Bug（只要不選 ${wrongLabel} 都得分）！`
            : `💡 踩到陷阱啦！${correctLabels} 三個問題都真的存在，只有 (${wrongLabel}) 是錯的喔！`;
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
    isTimeUp = true;
    document.body.classList.add('is-time-up');
    if (elCountdownStageWrap) elCountdownStageWrap.classList.remove('hidden');
    elTimeupHub.classList.remove('hidden');
    elStateLabel.textContent = t().eyebrowTimeUp;
    syncHubNavPermissions();
    showHubView('menu');
    launchConfetti();
  }

  function exitTimeUpState() {
    if (!isTimeUp) return;
    isTimeUp = false;
    document.body.classList.remove('is-time-up');
    if (elCountdownStageWrap) elCountdownStageWrap.classList.remove('hidden');
    elTimeupHub.classList.add('hidden');
    clearVideoIframe();
    elStateLabel.textContent = t().eyebrowCountdown;
    syncHubNavPermissions();
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = REAL_TARGET_TIMESTAMP - now;

    elCurrentTwTime.textContent = twFormatter.format(new Date(now));

    if (diff <= 0) {
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';
      if (elMs) elMs.textContent = '.00';

      elTotalHours.textContent = '0';
      elTotalMinutes.textContent = '0';
      elTotalSeconds.textContent = '0';

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

    elTotalHours.textContent = numberFormatter.format(totalHours);
    elTotalMinutes.textContent = numberFormatter.format(totalMinutes);
    elTotalSeconds.textContent = numberFormatter.format(totalSeconds);
  }

  function tick() {
    updateCountdown();
    requestAnimationFrame(tick);
  }

  // Event Listeners
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

  // Wedding Botanical & Petal Celebration Effect
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animatingConfetti = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function launchConfetti() {
    const colors = ['#4a7356', '#84a98c', '#cad2c5', '#e6ccb2', '#ffffff', '#a3b18a'];
    for (let i = 0; i < 95; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 260,
        y: window.innerHeight * 0.42,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 13 - 3,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 8,
        alpha: 1,
      });
    }
    if (!animatingConfetti) {
      animatingConfetti = true;
      renderConfetti();
    }
  }

  function renderConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.vx *= 0.99;
      p.rotation += p.vRot;
      p.alpha -= 0.007;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    particles = particles.filter((p) => p.alpha > 0 && p.y < canvas.height + 40);
    if (particles.length > 0) {
      requestAnimationFrame(renderConfetti);
    } else {
      animatingConfetti = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  btnCelebrate.addEventListener('click', launchConfetti);

  // Initialize
  initPreferences();
  requestAnimationFrame(tick);

  // Register Offline Service Worker (Network-First + Zero Easter Egg Spoiler)
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || window.location.protocol === 'http:') &&
    !document.getElementById('debug-auth-gate')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=20261109e').catch(() => {});
    });
  }
})();
