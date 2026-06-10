export type Lang = "KOR" | "ENG";

export const translations: Record<string, Record<Lang, string>> = {
  brandTitle: {
    KOR: "키자니아 대중음악 연구소",
    ENG: "KidZania Pop Music Studio"
  },
  tagline: {
    KOR: "나만의 첫 번째 K-Pop 곡을 직접 작사, 작곡하고 앨범을 발매하는 어린이 프로듀서 체험!",
    ENG: "Experience being a kid producer composing, writing lyrics, and releasing your very first K-Pop track!"
  },
  checkIn: {
    KOR: "체험 시작 (체크인)",
    ENG: "Start Experience (Check-in)"
  },
  parentLounge: {
    KOR: "보호자 라운지",
    ENG: "Parent Lounge"
  },
  musicChart: {
    KOR: "실시간 빌보드 차트",
    ENG: "Live Billboard Chart"
  },
  welcomeZV: {
    KOR: "환영합니다! ZV(수퍼바이저)가 여러분의 음악 창작 과정을 도와줄 거예요. 먼저 탑승권에 인적사항을 적어주세요!",
    ENG: "Welcome! The ZV (Supervisor) will guide you through music creation. First, please fill in your details on the boarding pass!"
  },
  kidzoBalance: {
    KOR: "나의 키조 잔액",
    ENG: "My KidZo Balance"
  },
  kidzoEarned: {
    KOR: "총 획득한 키조",
    ENG: "Total Earned KidZos"
  },
  lyricsStep: {
    KOR: "1단계: 작사 (AI Lyricist)",
    ENG: "Step 1: Write Lyrics (AI Lyricist)"
  },
  composerStep: {
    KOR: "2단계: 작곡 (AI Composer)",
    ENG: "Step 2: Compose Music (AI Composer)"
  },
  recordingStep: {
    KOR: "3단계: 보컬 녹음 (Vocal Recording)",
    ENG: "Step 3: Vocal Recording"
  },
  releaseStep: {
    KOR: "4단계: 앨범 발매 및 표지 꾸미기",
    ENG: "Step 4: Design Album Cover & Release"
  },
  btnStartRecord: {
    KOR: "🎙️ 녹음 시작하기",
    ENG: "🎙️ Start Recording"
  },
  btnStopRecord: {
    KOR: "⏹️ 녹음 완료하기",
    ENG: "⏹️ Stop & Mix Vocals"
  },
  recordingActive: {
    KOR: "● 녹음 중... 마이크를 향해 노래를 부르세요!",
    ENG: "● RECORDING... Sing into the microphone!"
  },
  recordingSuccess: {
    KOR: "🎉 보컬 녹음 및 음원 믹싱 완료!",
    ENG: "🎉 Vocal recording & mixing complete!"
  },
  btnGoToReleaseStage: {
    KOR: "4단계: 앨범 발매하러 가기",
    ENG: "Step 4: Go to Release Stage"
  },
  selectTheme: {
    KOR: "작사 주제 선택하기",
    ENG: "Select Lyrics Theme"
  },
  selectMood: {
    KOR: "노래의 감정/기분 고르기",
    ENG: "Select Song Mood/Feel"
  },
  storyPrompt: {
    KOR: "나만의 이야기 적기 (프롬프트)",
    ENG: "Write Your Own Story (Prompt)"
  },
  promptPlaceholder: {
    KOR: "친구들과 노는 즐거운 이야기, 내 꿈 등 가사로 만들고 싶은 이야기를 자유롭게 써보세요!",
    ENG: "Write freely about playing with friends, your dreams, or anything you want to turn into lyrics!"
  },
  btnGenerateLyrics: {
    KOR: "✨ AI 가사 만들기",
    ENG: "✨ Create AI Lyrics"
  },
  lyricsDisplay: {
    KOR: "완성된 가사 (수정할 수 있어요)",
    ENG: "Finished Lyrics (You can edit it)"
  },
  composerTitleInput: {
    KOR: "곡 제목 입력",
    ENG: "Song Title"
  },
  composerTitlePlaceholder: {
    KOR: "창의적인 노래 제목을 지어주세요!",
    ENG: "Give your track a creative title!"
  },
  selectStyle: {
    KOR: "작곡 장르/스타일 선택",
    ENG: "Select Music Genre/Style"
  },
  btnGenerateMusic: {
    KOR: "🎶 AI 음원 작곡하기",
    ENG: "🎶 Compose AI Song"
  },
  loadingQueue: {
    KOR: "스튜디오 대기열에 참가 중...",
    ENG: "Joining the studio queue..."
  },
  loadingVocal: {
    KOR: "어린이 보컬 가이드 음성 합성 중...",
    ENG: "Synthesizing child vocal guide..."
  },
  loadingMix: {
    KOR: "악기 반주 트랙 믹싱 및 마스터링 중...",
    ENG: "Mixing and mastering instrumental track..."
  },
  loadingReady: {
    KOR: "키자니아 대중음악 완성!",
    ENG: "KidZania Pop Track Complete!"
  },
  albumArtTitle: {
    KOR: "나만의 앨범 커버 꾸미기",
    ENG: "Design Your Album Cover"
  },
  albumCoverBg: {
    KOR: "앨범 배경 색상 선택",
    ENG: "Select Album Background Color"
  },
  stickerSelect: {
    KOR: "키자니아 공식 인증 스탬프 스티커 부착",
    ENG: "Apply Official KidZania Stamp Sticker"
  },
  btnPublish: {
    KOR: "🚀 앨범 정식 발매하기 (8 키조 획득!)",
    ENG: "🚀 Release Album Officially (Earn 8 KidZos!)"
  },
  toastLyricsSuccess: {
    KOR: "멋진 가사가 생성되었습니다! 원하는 대로 가사를 다듬어 보세요.",
    ENG: "Beautiful lyrics generated! Feel free to polish them."
  },
  toastMusicSuccess: {
    KOR: "어린이 보컬이 녹음된 K-Pop 트랙이 완성되었습니다!",
    ENG: "Your K-Pop track with child vocals is ready!"
  },
  toastPublishSuccess: {
    KOR: "축하합니다! 앨범이 발매되어 빌보드 차트에 등록되었습니다. 8 키조가 지급되었습니다!",
    ENG: "Congratulations! Your album is released on the chart. 8 KidZos have been added!"
  },
  chartTitle: {
    KOR: "키자니아 대중음악 빌보드 차트",
    ENG: "KidZania Pop Music Billboard Chart"
  },
  chartDesc: {
    KOR: "직업체험을 완료한 어린이 프로듀서들의 실시간 인기 순위입니다 (판매량 + 하트 + 완성도 기준)",
    ENG: "Real-time popularity chart of kid producers who completed the job (based on sales + hearts + score)"
  },
  scoreLabel: {
    KOR: "차트 점수",
    ENG: "Chart Score"
  },
  heartsLabel: {
    KOR: "좋아요",
    ENG: "Likes"
  },
  purchasesLabel: {
    KOR: "누적 판매량",
    ENG: "Accumulated Sales"
  },
  parentWelcome: {
    KOR: "보호자 라운지 로그인",
    ENG: "Parent Lounge Login"
  },
  parentWelcomeDesc: {
    KOR: "자녀가 발급받은 보딩패스(체험권)의 이름을 입력하면, 아이가 발매한 앨범을 감상하고 구매할 수 있습니다.",
    ENG: "Enter your child's name from their boarding pass to listen to and purchase their albums."
  },
  childNameInput: {
    KOR: "어린이 체험자 이름",
    ENG: "Child Participant's Name"
  },
  btnLogin: {
    KOR: "입장하기",
    ENG: "Enter Lounge"
  },
  parentWallet: {
    KOR: "부모님 소지 키조 지갑",
    ENG: "Parent's KidZo Wallet"
  },
  purchaseBtn: {
    KOR: "💳 앨범 구매하기 (10 키조 후원)",
    ENG: "💳 Buy Album (Sponsor 10 KidZos)"
  },
  likeBtn: {
    KOR: "❤️ 응원의 좋아요 누르기",
    ENG: "❤️ Tap Like for Support"
  },
  purchasedBadge: {
    KOR: "구매 완료",
    ENG: "Purchased"
  },
  certTitle: {
    KOR: "키자니아 직업체험 이수증",
    ENG: "KidZania Career Experience Certificate"
  },
  certBody: {
    KOR: "위 어린이는 키자니아 대중음악 연구소에서 '작곡가 및 작사자' 직업체험 과정을 성실히 이수하여 창의적인 음악적 소양과 프로듀서 역량을 증명하였기에 이 이수증을 수여합니다.",
    ENG: "This certificate is awarded to the child above for successfully completing the 'Composer & Lyricist' career experience at the KidZania Pop Music Studio, demonstrating outstanding musical creativity."
  },
  certDate: {
    KOR: "체험 일자",
    ENG: "Date of Experience"
  },
  certIssuer: {
    KOR: "대한민국 키자니아 직업교육위원회",
    ENG: "KidZania Vocational Committee of Korea"
  },
  printCert: {
    KOR: "🖨️ 직업체험 이수증 인쇄하기",
    ENG: "🖨️ Print Career Certificate"
  },
  noCreationsYet: {
    KOR: "아직 자녀가 발매한 창작 음원이 없습니다. '어린이 직업 체험관'에서 곡을 먼저 완성해 주세요!",
    ENG: "Your child hasn't released any tracks yet. Complete a song in the 'Kid Studio' first!"
  },
  enterLoungeErr: {
    KOR: "⚠️ 해당 이름의 등록 정보를 찾을 수 없습니다. (예약/체크인을 먼저 진행하세요)",
    ENG: "⚠️ Cannot find reservation for this name. Please complete check-in first."
  },
  purchaseSuccess: {
    KOR: "🎉 후원 구매 성공! 자녀에게 10 키조가 전송되었으며 차트 점수가 상승했습니다.",
    ENG: "🎉 Purchase Success! 10 KidZos sent to your child and chart ranking boosted."
  },
  likeSuccess: {
    KOR: "❤️ 응원의 좋아요를 전송했습니다!",
    ENG: "❤️ Like sent successfully to support your child!"
  },
  btnRechargeKidzo: {
    KOR: "⚡ 키조 충전하기",
    ENG: "⚡ Recharge KidZos"
  },
  modalRechargeTitle: {
    KOR: "키자니아 키조 충전소",
    ENG: "KidZo Recharge Station"
  },
  selectRechargeAmount: {
    KOR: "충전할 키조 금액을 선택해 주세요",
    ENG: "Select KidZo amount to charge"
  },
  cardDetails: {
    KOR: "결제 카드 정보 입력",
    ENG: "Enter Payment Card Info"
  },
  cardNumber: {
    KOR: "카드 번호 (16자리)",
    ENG: "Card Number (16 digits)"
  },
  cardExpiry: {
    KOR: "유효기간 (MM/YY)",
    ENG: "Expiry Date (MM/YY)"
  },
  cardCvv: {
    KOR: "CVC/CVV (3자리)",
    ENG: "CVC/CVV (3 digits)"
  },
  cardHolder: {
    KOR: "소유자 이름",
    ENG: "Cardholder Name"
  },
  btnPay: {
    KOR: "결제 및 충전 완료",
    ENG: "Pay & Recharge"
  },
  payingStatus: {
    KOR: "신용카드 결제 승인 중...",
    ENG: "Approving credit card payment..."
  },
  paySuccessCont: {
    KOR: "🎉 결제 성공! 키조가 지갑에 충전되었습니다.",
    ENG: "🎉 Payment Success! KidZos added to your wallet."
  },
  invalidCard: {
    KOR: "⚠️ 올바른 카드 정보를 입력해 주세요.",
    ENG: "⚠️ Please enter valid card details."
  }
};
