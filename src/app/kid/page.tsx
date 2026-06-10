"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, Music, Award, CheckCircle2, 
  ArrowLeft, ArrowRight, Play, ChevronRight 
} from "lucide-react";
import { translations, type Lang } from "../translations";
import { registerChild, publishSong, getDb, getChildByName, Child } from "../db";
import { db as firestoreDb } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function KidPortal() {
  const [lang, setLang] = useState<Lang>("KOR");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Step 1: Check-in States
  const [kidName, setKidName] = useState("");
  const [kidAge, setKidAge] = useState(8);
  const [currentChild, setCurrentChild] = useState<Child | null>(null);

  // Step 2: Songwriting & Music Composer States
  const [selectedTheme, setSelectedTheme] = useState("dream");
  const [selectedMood, setSelectedMood] = useState("😊 Happy");
  const [lyricsLang, setLyricsLang] = useState<"KOR" | "ENG">("KOR");
  const [storyPrompt, setStoryPrompt] = useState("");
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [isLyricsGenerating, setIsLyricsGenerating] = useState(false);

  const [musicTitle, setMusicTitle] = useState("");
  const [musicGenre, setMusicGenre] = useState("kpop");
  const [musicGenStatus, setMusicGenStatus] = useState<"idle" | "queue" | "vocal" | "mix" | "ready">("idle");
  const [composedTrack, setComposedTrack] = useState<any>(null);
  
  // Step 3: Album Design & Publishing States
  const [coverBg, setCoverBg] = useState("linear-gradient(135deg, #ec4899, #8b5cf6)");
  const [coverSticker, setCoverSticker] = useState("👑");
  const [isReleased, setIsReleased] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Audio Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);

  // Step 4: Vocal Recording States & Simulations
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recHeights, setRecHeights] = useState<number[]>(new Array(12).fill(10));

  // Visualizer bouncing waves for recording mic activity
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecHeights(Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20));
      }, 100);
    } else {
      setRecHeights(new Array(12).fill(10));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Recording timer countdown (6 seconds) simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      setRecordingTimer(0);
      interval = setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev >= 6) {
            setIsRecording(false);
            setHasRecorded(true);
            setIsPlaying(false);
            setToastMessage(t("recordingSuccess"));
            setTimeout(() => setToastMessage(null), 3000);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setHasRecorded(false);
    setIsPlaying(true);
    setPlayTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
    setIsPlaying(false);
    setToastMessage(t("recordingSuccess"));
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem("kidzania_lang") as Lang;
    if (savedLang) setLang(savedLang);

    // Sync language updates
    const handleStorageChange = () => {
      const updatedLang = localStorage.getItem("kidzania_lang") as Lang;
      if (updatedLang) setLang(updatedLang);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Real-time listener for child balance/ticket updates from database
  useEffect(() => {
    if (!currentChild || !firestoreDb) return;

    const unsubscribe = onSnapshot(doc(firestoreDb, "children", currentChild.name.toLowerCase()), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentChild(docSnap.data() as Child);
      }
    });

    return () => unsubscribe();
  }, [currentChild?.name]);

  // Audio Play Simulation Effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && composedTrack) {
      interval = setInterval(() => {
        setPlayTime((prev) => {
          if (prev >= composedTrack.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, composedTrack]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.["KOR"] || key;
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kidName.trim()) return;

    const child = await registerChild(kidName.trim(), kidAge);
    setCurrentChild(child);
    setToastMessage(lang === "KOR" ? `🎫 ${child.name} 어린이 보딩패스 발급 완료!` : `🎫 Boarding pass generated for ${child.name}!`);
    setTimeout(() => {
      setToastMessage(null);
      setActiveStep(2);
    }, 1500);
  };

  const handleGenerateLyrics = () => {
    setIsLyricsGenerating(true);
    setTimeout(() => {
      let lyricsTemplate = "";
      if (lyricsLang === "KOR") {
        if (selectedTheme === "dream") {
          lyricsTemplate = `[1절]\n눈을 감으면 내 안에 펼쳐지는 별빛\n세상 가득 반짝이는 기쁨과 사랑\n나의 미래를 향해 힘차게 달려가요\n작은 걱정들은 모두 뒤로 하고서\n\n[후렴]\n저 높은 꿈을 향해 날아올라\n세상에서 가장 밝은 빛을 비출래요\n우리는 반짝이는 별빛처럼\n누구나 빛나는 주인공이죠!`;
        } else if (selectedTheme === "friendship") {
          lyricsTemplate = `[1절]\n파란 하늘 아래 친구와 함께 걷는 길\n두 손을 꼭 잡고서 약속을 해요\n어떤 어려움이 앞을 가로막아도\n언제나 서로를 든든하게 지켜주기로\n\n[후렴]\n우정의 기차가 달리기 시작해요\n앞을 향해 씽씽 신나게 달려가요\n서로 마주 보며 활짝 웃을 때\n우리는 가장 친한 단짝 친구!`;
        } else if (selectedTheme === "play") {
          lyricsTemplate = `[1절]\n초록빛 잔디밭을 신나게 뛰놀아봐요\n구름처럼 가볍게 뛰어올라요\n풍선을 던지고 높이 뛰면서\n하늘 높이 깔깔 큰 소리로 웃어봐요\n\n[후렴]\n신나는 놀이 시간, 즐거운 시간\n오늘 하루를 마음껏 즐겨봐요\n하나, 둘, 셋 소리치며\n우리는 매일매일 행복하죠!`;
        } else {
          lyricsTemplate = `[1절]\n엄마 아빠의 따뜻한 품에 안길 때\n가장 행복한 미소가 피어나요\n맛있는 저녁을 먹으며 나누는 이야기\n언제나 나를 사랑해주는 가족의 품\n\n[후렴]\n가족의 사랑은 따뜻하고 밝아요\n캄캄한 밤에도 나를 지켜줘요\n다 함께 웃으며 마음을 나눌 때\n가장 아름다운 사랑이 전해지죠!`;
        }
      } else {
        if (selectedTheme === "dream") {
          lyricsTemplate = `[Verse 1]\nI close my eyes and see the stars above\nA magical world filled with joy and love\nRunning so fast to my tomorrow\nLeaving behind all the tiny sorrow\n\n[Chorus]\nFlying high to reach my dream\nBrightest light you've ever seen\nWe are shinning, yes we are\nEvery kid is a brand new star!`;
        } else if (selectedTheme === "friendship") {
          lyricsTemplate = `[Verse 1]\nWalking together under the sunny sky\nWe make a promise, you and I\nNo matter what, we will stand so tall\nCatching each other whenever we fall\n\n[Chorus]\nFriendship train is on the track\nGoing forward, never back\nHand in hand, we make a sound\nBest friends are the best thing found!`;
        } else if (selectedTheme === "play") {
          lyricsTemplate = `[Verse 1]\nRunning around in the green green grass\nWatching the happy clouds quickly pass\nBouncing the ball, jumping so high\nLaughing out loud under the sky\n\n[Chorus]\nPlay time, joy time, let's go play\nMake the most of this sunny day\nShout it out, one two three\nPlay is the magic for you and me!`;
        } else {
          lyricsTemplate = `[Verse 1]\nMom and Dad, thank you for your embrace\nYour warm smiles are my favorite place\nEating dinner and sharing our day\nKnowing you love me in every way\n\n[Chorus]\nFamily love, warm and bright\nKeeps me safe through the night\nTogether we laugh, together we care\nLove is the magic we always share!`;
        }
      }

      setGeneratedLyrics(lyricsTemplate);
      setIsLyricsGenerating(false);
      setToastMessage(t("toastLyricsSuccess"));
      setTimeout(() => setToastMessage(null), 3000);
    }, 1500);
  };

  const handleGenerateMusic = () => {
    setMusicGenStatus("queue");
    
    // Stage 1 -> Stage 2 (Queue to Vocal)
    setTimeout(() => {
      setMusicGenStatus("vocal");
      
      // Stage 2 -> Stage 3 (Vocal to Mix)
      setTimeout(() => {
        setMusicGenStatus("mix");
        
        // Stage 3 -> Stage 4 (Mix to Ready)
        setTimeout(() => {
          setMusicGenStatus("ready");
          
          // Ready -> Complete Track Creation
          setTimeout(() => {
            const finalTitle = musicTitle.trim() || (selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1) + " Song");
            
            // Mock dynamic audio helix links
            let audioLink = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
            if (musicGenre === "synthwave") audioLink = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3";
            if (musicGenre === "hiphop") audioLink = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3";
            if (musicGenre === "acoustic") audioLink = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
            
            const newTrack = {
              title: finalTitle,
              genre: musicGenre === "kpop" ? "K-Pop Dance" : musicGenre === "synthwave" ? "Synthwave" : musicGenre === "hiphop" ? "Hip-Hop" : "Acoustic Pop",
              tempo: musicGenre === "acoustic" ? "Slow" : "Fast",
              lyrics: generatedLyrics || "[Instrumental Track]",
              theme: selectedTheme,
              mood: selectedMood,
              audioUrl: audioLink,
              duration: "2:15",
              durationSeconds: 135
            };
            
            setComposedTrack(newTrack);
            setPlayTime(0);
            setIsPlaying(false);
            setMusicGenStatus("idle");
            setToastMessage(t("toastMusicSuccess"));
            setTimeout(() => setToastMessage(null), 3000);
          }, 1000);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const handlePublish = async () => {
    if (!currentChild || !composedTrack) return;

    await publishSong(currentChild.name, {
      title: composedTrack.title,
      genre: composedTrack.genre,
      tempo: composedTrack.tempo,
      lyrics: composedTrack.lyrics,
      theme: composedTrack.theme,
      mood: composedTrack.mood,
      age: currentChild.age,
      coverBg: coverBg,
      sticker: coverSticker,
      audioUrl: composedTrack.audioUrl,
      duration: composedTrack.duration,
      durationSeconds: composedTrack.durationSeconds
    });

    // Awarded 8 kidzos simulation/db load
    const updatedChild = await getChildByName(currentChild.name);
    if (updatedChild) {
      setCurrentChild(updatedChild);
    } else {
      const db = getDb();
      const childObj = db.children.find((c) => c.name.trim().toLowerCase() === currentChild.name.trim().toLowerCase());
      if (childObj) {
        setCurrentChild(childObj);
      }
    }

    setIsReleased(true);
    setShowConfetti(true);
    setToastMessage(t("toastPublishSuccess"));
    setTimeout(() => {
      setToastMessage(null);
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background blur rings */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Confetti Animation Effect (if active) */}
      {showConfetti && (
        <div className="confetti-canvas fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="text-center space-y-4 animate-float">
            <span className="text-8xl">🎉</span>
            <h2 className="text-3xl font-black text-yellow-400 text-glow-yellow">CONGRATULATIONS!</h2>
            <p className="text-white text-lg font-bold">Album Released & +8 KidZos Earned!</p>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border-2 border-yellow-500 text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold animate-ticket">
          <span className="text-yellow-500">✨</span>
          <p className="text-xs sm:text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-505 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>{lang === "KOR" ? "이전 화면" : "Main Gate"}</span>
        </Link>

        {/* ZV supervisor tag */}
        <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-black text-blue-700 flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ZV: Genie</span>
        </div>
      </header>

      {/* Main Experience Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start z-10">
        
        {/* Step Indicator */}
        <div className="w-full max-w-3xl mx-auto mb-8 flex justify-between items-center relative px-2">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-10" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 -translate-y-1/2 -z-10 transition-all duration-500" 
            style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
          />

          {[
            { step: 1, label: lang === "KOR" ? "체크인" : "Check-in", emoji: "🎫" },
            { step: 2, label: lang === "KOR" ? "1단계 작사" : "Lyrics", emoji: "✍️" },
            { step: 3, label: lang === "KOR" ? "2단계 작곡" : "Compose", emoji: "🎹" },
            { step: 4, label: lang === "KOR" ? "3단계 녹음" : "Record", emoji: "🎤" },
            { step: 5, label: lang === "KOR" ? "4단계 발매" : "Release", emoji: "🚀" }
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => currentChild && setActiveStep(s.step)}
              disabled={!currentChild && s.step > 1}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer border-2 transition-all duration-300 ${
                activeStep === s.step
                  ? "bg-[#ffb703] border-transparent text-gray-950 scale-110 shadow-lg shadow-yellow-900/10"
                  : currentChild
                  ? "bg-white border-slate-200 text-slate-700 hover:border-slate-355 hover:text-slate-900 shadow-sm"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span className="text-xl">{s.emoji}</span>
              <span className="absolute -bottom-6 text-[10px] sm:text-xs font-black uppercase whitespace-nowrap tracking-wider hidden sm:block mt-1 text-slate-650 font-bold">
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Step 1: Ticket check-in & boarding pass */}
        {activeStep === 1 && (
          <div className="max-w-md w-full mx-auto space-y-6 text-center animate-ticket mt-4">
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{t("checkIn")}</h2>
                <p className="text-xs sm:text-sm text-slate-505 font-medium leading-relaxed">
                  {t("welcomeZV")}
                </p>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                    {lang === "KOR" ? "어린이 이름" : "Child Name"}
                  </label>
                  <input
                    type="text"
                    value={kidName}
                    onChange={(e) => setKidName(e.target.value)}
                    required
                    placeholder={lang === "KOR" ? "이름을 적어주세요 (예: 민우)" : "Enter name..."}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-yellow-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-505 uppercase tracking-wider block">
                    {lang === "KOR" ? "어린이 나이" : "Child Age"}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((age) => (
                      <button
                        type="button"
                        key={age}
                        onClick={() => setKidAge(age)}
                        className={`py-2 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                          kidAge === age
                            ? "bg-yellow-500 border-transparent text-gray-950 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#e63946] hover:bg-[#e63946]/90 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/10 transition-all hover:scale-[1.01]"
                >
                  <span>{lang === "KOR" ? "보딩패스 체험권 발급" : "Generate Boarding Pass"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Simulated Boarding Pass Ticket */}
            {currentChild && (
              <div className="boarding-pass p-5 rounded-3xl animate-ticket shadow-lg relative">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {/* Left Main Stub */}
                  <div className="flex-1 text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-[#002855] text-lg font-black italic">KidZania Boarding Pass</span>
                      <span className="text-xs font-mono bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">DEPARTURE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-700">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Passenger</span>
                        <span className="text-sm font-black text-gray-900">{currentChild.name} ({currentChild.age} yrs)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Ticket Number</span>
                        <span className="text-sm font-mono font-black text-[#002855]">{currentChild.ticketNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Experience Job</span>
                        <span className="text-sm font-black text-gray-900">Pop Musician (작사·작곡가)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Check-in Gate</span>
                        <span className="text-sm font-black text-[#e63946]">K-Pop Research Desk</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider line for ticket stub */}
                  <div className="hidden sm:block">
                    <div className="boarding-pass-divider" />
                  </div>

                  {/* Right Stub (Gate receipt) */}
                  <div className="sm:w-32 text-left sm:text-center space-y-3 shrink-0 flex flex-col justify-between">
                    <div className="text-[9px] font-mono text-gray-400 uppercase">Boarding Reward</div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl py-3 px-2 flex flex-col items-center">
                      <span className="text-[#003b7a] text-xs font-mono font-black tracking-wide">INITIAL KIDZO</span>
                      <strong className="text-xl font-black text-[#003b7a] mt-0.5">+20 KZ</strong>
                    </div>
                    <div className="kidzania-stamp text-center">APPROVED</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Songwriting (AI Lyricist) */}
        {activeStep === 2 && currentChild && (
          <div className="space-y-8 animate-ticket">
            
            {/* Wallet summary */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between bg-white border border-slate-250 p-4.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">👤</div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-900">{currentChild.name} 어린이 프로듀서</h4>
                  <p className="text-xs text-slate-505 font-semibold">{currentChild.ticketNumber}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 py-2 px-4.5 rounded-xl flex items-center gap-2">
                <span className="text-xs font-black text-amber-700">{t("kidzoBalance")}</span>
                <strong className="text-lg font-black text-amber-900">{currentChild.kidzoBalance} KidZos</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto text-left">
              {/* Left Column: AI Lyricist (Col-span 2) */}
              <div className="lg:col-span-2 space-y-8">
                
                <div className="glassmorphism-card rounded-2xl p-6 sm:p-7.5 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-red-500 animate-float" />
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">{t("lyricsStep")}</h3>
                    </div>
                    <span className="text-xs bg-red-50 border border-red-200 text-red-655 px-2.5 py-1 rounded-full font-mono font-bold">1</span>
                  </div>

                  <div className="space-y-4">
                    {/* Theme selector */}
                    <div className="space-y-2.5">
                      <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">{t("selectTheme")}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: "dream", label: lang === "KOR" ? "꿈과 희망" : "Dream", emoji: "⭐" },
                          { id: "friendship", label: lang === "KOR" ? "친구와 우정" : "Friendship", emoji: "🤝" },
                          { id: "play", label: lang === "KOR" ? "신나는 놀이" : "Play Time", emoji: "🎈" },
                          { id: "family", label: lang === "KOR" ? "사랑하는 가족" : "Family", emoji: "🏡" }
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme.id)}
                            className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                              selectedTheme === theme.id
                                ? "bg-red-50 border-red-500 text-red-655 shadow-sm scale-[1.02] font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-355 hover:text-slate-900"
                            }`}
                          >
                            <span className="text-xl">{theme.emoji}</span>
                            <span className="text-xs font-black">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mood selector */}
                    <div className="space-y-2.5">
                      <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">{t("selectMood")}</label>
                      <div className="flex flex-wrap gap-2.5">
                        {["😊 Happy", "😎 Cool", "⚡ Energetic", "🥺 Emotional"].map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${
                              selectedMood === mood
                                ? "bg-amber-50 border-amber-500 text-amber-705 shadow-sm font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-905 hover:border-slate-300"
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lyrics Language Selector */}
                    <div className="space-y-2.5">
                      <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">
                        {lang === "KOR" ? "가사 언어 선택" : "Lyrics Language"}
                      </label>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setLyricsLang("KOR")}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${
                            lyricsLang === "KOR"
                              ? "bg-red-55 border-red-500 text-red-650 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-905 hover:border-slate-300"
                          }`}
                        >
                          한국어 (Korean)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLyricsLang("ENG")}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${
                            lyricsLang === "ENG"
                              ? "bg-red-55 border-red-500 text-red-655 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-905 hover:border-slate-300"
                          }`}
                        >
                          English (영어)
                        </button>
                      </div>
                    </div>

                    {/* Story prompt input */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-black text-slate-550 uppercase tracking-wider block">{t("storyPrompt")}</label>
                      <textarea
                        value={storyPrompt}
                        onChange={(e) => setStoryPrompt(e.target.value)}
                        placeholder={t("promptPlaceholder")}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-red-500 transition-all font-semibold leading-relaxed"
                      />
                    </div>

                    {/* Generate button */}
                    <button
                      onClick={handleGenerateLyrics}
                      disabled={isLyricsGenerating}
                      className="w-full py-3.5 rounded-xl bg-[#e63946] hover:bg-[#e63946]/90 text-white hover:glow-pink text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] disabled:opacity-50 border border-transparent shadow"
                    >
                      {isLyricsGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating AI Lyrics...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{t("btnGenerateLyrics")}</span>
                        </>
                      )}
                    </button>

                    {/* Generated Lyrics output */}
                    {generatedLyrics && (
                      <div className="space-y-2.5 animate-ticket pt-4 border-t border-slate-200">
                        <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">{t("lyricsDisplay")}</label>
                        <textarea
                          value={generatedLyrics}
                          onChange={(e) => setGeneratedLyrics(e.target.value)}
                          rows={6}
                          className="w-full bg-red-50/20 border border-red-200 rounded-xl p-4 text-xs sm:text-sm font-mono text-red-800 leading-relaxed focus:outline-none focus:border-red-500 focus:bg-white font-semibold"
                        />
                        
                        <button
                          onClick={() => setActiveStep(3)}
                          className="w-full mt-4 py-3.5 rounded-xl bg-[#ffb703] text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01]"
                        >
                          <span>{lang === "KOR" ? "2단계: 작곡하기로 이동" : "Proceed to Compose Stage"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* Right Column: ZV Notes (Col-span 1) */}
              <div className="lg:col-span-1 space-y-8">
                <div className="glassmorphism-card rounded-2xl p-6 text-left space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">✍️</div>
                  <h3 className="text-base font-black text-slate-900">ZV의 작사 길라잡이</h3>
                  <div className="space-y-3.5 text-xs text-slate-650 font-semibold leading-relaxed">
                    <p>
                      {lang === "KOR" 
                        ? "작사는 노래에 생명력을 불어넣는 첫 단계예요. 꿈과 친구, 가족과의 즐거운 기억들을 떠올려보세요!"
                        : "Songwriting is the first step to breathe life into a track. Think of your dreams, friends, or family memories!"}
                    </p>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 font-mono text-slate-550">
                      <span className="text-[10px] text-slate-400 block font-bold">TIP</span>
                      <p>
                        {lang === "KOR"
                          ? "1. 마음에 드는 주제 카드와 오늘의 감정(기분)을 선택하세요."
                          : "1. Select a theme card and your mood emoji for today."}
                      </p>
                      <p>
                        {lang === "KOR"
                          ? "2. 나만의 이야기를 자유롭게 쓰고 가사 생성 버튼을 누르면 AI가 멋진 운율의 노랫말을 만들어 줍니다."
                          : "2. Write your own story and press generate. The AI will compose rhyming lyrics."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Step 3: Composing (AI Composer) */}
        {activeStep === 3 && currentChild && (
          <div className="space-y-8 animate-ticket">
            
            {/* Wallet summary */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between bg-white border border-slate-250 p-4.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">👤</div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-900">{currentChild.name} 어린이 프로듀서</h4>
                  <p className="text-xs text-slate-500 font-semibold">{currentChild.ticketNumber}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 py-2 px-4.5 rounded-xl flex items-center gap-2">
                <span className="text-xs font-black text-amber-700">{t("kidzoBalance")}</span>
                <strong className="text-lg font-black text-amber-900">{currentChild.kidzoBalance} KidZos</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto text-left">
              {/* Left Column: AI Composer (Col-span 2) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* AI Composer */}
                <div className="glassmorphism-card rounded-2xl p-6 sm:p-7.5 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <Music className="w-6 h-6 text-blue-500 animate-pulse" />
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">{t("composerStep")}</h3>
                    </div>
                    <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-1 rounded-full font-mono font-bold">2</span>
                  </div>

                  <div className="space-y-5">
                    {/* Song Title Input */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-black text-slate-505 uppercase tracking-wider block">{t("composerTitleInput")}</label>
                      <input
                        type="text"
                        value={musicTitle}
                        onChange={(e) => setMusicTitle(e.target.value)}
                        placeholder={t("composerTitlePlaceholder")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-bold"
                      />
                    </div>

                    {/* Genre / Style Selection */}
                    <div className="space-y-2.5">
                      <label className="text-xs sm:text-sm font-black text-slate-550 uppercase tracking-wider block">{t("selectStyle")}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: "kpop", label: "K-Pop Dance 🕺" },
                          { id: "synthwave", label: "Synthwave 🌌" },
                          { id: "hiphop", label: "Hip-Hop 🎤" },
                          { id: "acoustic", label: "Acoustic Pop 🎸" }
                        ].map((genre) => (
                          <button
                            key={genre.id}
                            onClick={() => setMusicGenre(genre.id)}
                            className={`px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${
                              musicGenre === genre.id
                                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-650 hover:border-slate-355 hover:text-slate-900"
                            }`}
                          >
                            {genre.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Compose Button */}
                    <button
                      onClick={handleGenerateMusic}
                      disabled={musicGenStatus !== "idle"}
                      className="w-full py-4.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:glow-cyan text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] disabled:opacity-50 shadow"
                    >
                      <Music className="w-4.5 h-4.5" />
                      <span>{t("btnGenerateMusic")}</span>
                    </button>

                    {/* Loading Overlay */}
                    {musicGenStatus !== "idle" && (
                      <div className="bg-slate-55 border border-slate-200 rounded-xl p-5 space-y-4 animate-ticket">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-blue-600 uppercase font-mono tracking-wider">
                              {musicGenStatus === "queue" && t("loadingQueue")}
                              {musicGenStatus === "vocal" && t("loadingVocal")}
                              {musicGenStatus === "mix" && t("loadingMix")}
                              {musicGenStatus === "ready" && t("loadingReady")}
                            </span>
                          </div>
                          <span className="font-mono text-slate-500">
                            {musicGenStatus === "queue" && "20%"}
                            {musicGenStatus === "vocal" && "55%"}
                            {musicGenStatus === "mix" && "85%"}
                            {musicGenStatus === "ready" && "100%"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{
                              width:
                                musicGenStatus === "queue"
                                  ? "20%"
                                  : musicGenStatus === "vocal"
                                  ? "55%"
                                  : musicGenStatus === "mix"
                                  ? "85%"
                                  : "100%"
                            }}
                          />
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* Right Column: Audio Player (Col-span 1) */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* Visualizer Player */}
                <div className="glassmorphism-card rounded-2xl p-6 relative overflow-hidden text-center flex flex-col justify-between min-h-[360px]">
                  <div className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none -z-10" />
                  
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3 text-left">
                    STUDIO CASSETTE TAPE
                  </h4>

                  {composedTrack ? (
                    <div className="space-y-6 animate-ticket">
                      {/* Cassette Tape Mockup */}
                      <div className="flex justify-center p-2.5">
                        <div className="w-56 h-36 bg-[#002855] border-4 border-gray-800 rounded-2xl relative shadow-2xl flex flex-col justify-between p-3 select-none overflow-hidden border-2 border-yellow-500/35">
                          {/* Top bar info */}
                          <div className="flex justify-between items-center text-[8px] font-mono text-gray-400">
                            <span>KIDZANIA CASSETTE TAPE</span>
                            <span>TYPE I</span>
                          </div>

                          {/* Windows & rollers */}
                          <div className="w-40 h-16 bg-[#030712] border-2 border-gray-800 rounded-xl mx-auto flex items-center justify-around relative">
                            {/* Left roller */}
                            <div className={`w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center relative ${isPlaying ? 'animate-tape-roll [animation-duration:3s]' : ''}`}>
                              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-700 -translate-x-1/2" />
                              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700 -translate-y-1/2" />
                            </div>

                            {/* Tape center window label */}
                            <div className="text-[7px] font-mono text-gray-500 leading-none">
                              {composedTrack.genre}
                            </div>

                            {/* Right roller */}
                            <div className={`w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center relative ${isPlaying ? 'animate-tape-roll [animation-duration:3s]' : ''}`}>
                              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-700 -translate-x-1/2" />
                              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700 -translate-y-1/2" />
                            </div>
                          </div>

                          {/* Track Title */}
                          <div className="text-[9px] font-bold text-yellow-400 truncate tracking-wide text-center uppercase border-t border-blue-900 pt-2 font-mono">
                            {composedTrack.title}
                          </div>
                        </div>
                      </div>

                      {/* Playing wave visualizer bar */}
                      <div className="flex items-end justify-center gap-1.5 h-10 w-full px-4.5 bg-slate-50 py-2.5 rounded-xl border border-slate-200">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((idx) => {
                          const heights = [
                            "h-2", "h-4", "h-7", "h-5", "h-9",
                            "h-3", "h-8", "h-6", "h-8", "h-3",
                            "h-9", "h-5", "h-7", "h-4", "h-2"
                          ];
                          return (
                            <div
                              key={idx}
                              className={`bg-blue-500 w-1.5 rounded transition-all duration-300 ${
                                isPlaying ? heights[(idx + Math.floor(playTime)) % 15] : "h-1.5 bg-slate-300"
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Player seek & play button */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-500">
                            {Math.floor(playTime / 60)}:{(playTime % 60).toString().padStart(2, '0')}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full relative overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${(playTime / composedTrack.durationSeconds) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-550">{composedTrack.duration}</span>
                        </div>

                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-12 h-12 rounded-full bg-blue-500 text-white hover:scale-105 transition-transform flex items-center justify-center cursor-pointer shadow-lg shadow-blue-900/10"
                          >
                            {isPlaying ? (
                              <div className="flex gap-1.5 items-center justify-center">
                                <div className="w-1.5 h-4 bg-white" />
                                <div className="w-1.5 h-4 bg-white" />
                              </div>
                            ) : (
                              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Proceed to Step 4 */}
                      <button
                        onClick={() => setActiveStep(4)}
                        className="w-full py-3.5 rounded-xl bg-[#ffb703] text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01]"
                      >
                        <span>{lang === "KOR" ? "3단계: 노래 녹음하러 가기" : "Go to Recording Stage"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed border border-dashed border-slate-300 rounded-xl bg-slate-50 flex-1 flex items-center justify-center">
                      💡 {lang === "KOR" ? "장르를 선택하고 음원 작곡하기 버튼을 눌러보세요." : "Select a genre and press compose to generate the backing track."}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Step 4: Vocal Recording (Vocal Recording Simulation) */}
        {activeStep === 4 && currentChild && composedTrack && (
          <div className="space-y-8 animate-ticket">
            
            {/* Wallet summary */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between bg-white border border-slate-250 p-4.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">👤</div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-900">{currentChild.name} 어린이 프로듀서</h4>
                  <p className="text-xs text-slate-500 font-semibold">{currentChild.ticketNumber}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 py-2 px-4.5 rounded-xl flex items-center gap-2">
                <span className="text-xs font-black text-amber-700">{t("kidzoBalance")}</span>
                <strong className="text-lg font-black text-amber-900">{currentChild.kidzoBalance} KidZos</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto text-left">
              
              {/* Left Column: Sing-along Teleprompter (Col-span 2) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="glassmorphism-card rounded-2xl p-6 sm:p-7.5 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <Music className="w-6 h-6 text-red-500 animate-pulse" />
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">🎤 노래방 자막 (Lyrics Teleprompter)</h3>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono max-h-96 overflow-y-auto text-center leading-loose">
                    <pre className="whitespace-pre-wrap font-sans text-base sm:text-lg font-black text-slate-800">
                      {generatedLyrics || "[Instrumental Composed]"}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Right Column: Microphone Recording Control Deck (Col-span 1) */}
              <div className="lg:col-span-1 space-y-8">
                <div className="glassmorphism-card rounded-2xl p-6 text-center space-y-6 relative overflow-hidden flex flex-col justify-start">
                  
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3 text-left">
                    STUDIO RECORDING BOOTH
                  </h4>

                  {/* Blinking REC indicator */}
                  {isRecording ? (
                    <div className="flex items-center gap-1.5 justify-center text-red-600 font-black text-sm animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <span>● REC (0:0{recordingTimer} / 0:06)</span>
                    </div>
                  ) : hasRecorded ? (
                    <div className="flex items-center gap-1.5 justify-center text-emerald-600 font-black text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t("recordingSuccess")}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-black uppercase">
                      STANDBY FOR VOCALS
                    </div>
                  )}

                  {/* Microphone Graphic & Animation */}
                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl shadow-md transition-all ${
                      isRecording 
                        ? "bg-red-50 border-red-500 scale-105 animate-pulse text-red-650" 
                        : hasRecorded 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-650" 
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}>
                      🎙️
                    </div>

                    {/* Microphone sound waves */}
                    <div className="flex items-end justify-center gap-1 h-12 w-full px-4">
                      {recHeights.map((h, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 rounded-t transition-all duration-100 ${
                            isRecording ? "bg-red-500" : hasRecorded ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Status instructions message */}
                  <p className="text-xs text-slate-505 font-semibold leading-relaxed px-2">
                    {isRecording 
                      ? t("recordingActive")
                      : hasRecorded
                      ? lang === "KOR"
                        ? "보컬이 성공적으로 녹음되어 반주와 함께 믹싱이 완료되었습니다! 발매 단계로 진행하세요."
                        : "Your vocal is successfully recorded and mixed with backing tracks! Proceed to Release."
                      : lang === "KOR"
                      ? "녹음 시작 단추를 누르면 6초간 노래 녹음이 시작됩니다. 마이크를 바라보고 즐겁게 불러보세요!"
                      : "Press Start to begin a 6-second recording simulation. Face the microphone and sing along!"
                    }
                  </p>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    {isRecording ? (
                      <button
                        onClick={handleStopRecording}
                        className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <span>{t("btnStopRecord")}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartRecording}
                        className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01] ${
                          hasRecorded
                            ? "bg-slate-100 border border-slate-250 text-slate-700 hover:bg-slate-200"
                            : "bg-[#e63946] text-white hover:bg-[#e63946]/90"
                        }`}
                      >
                        <span>{hasRecorded ? (lang === "KOR" ? "🎙️ 다시 녹음하기" : "🎙️ Record Again") : t("btnStartRecord")}</span>
                      </button>
                    )}

                    {hasRecorded && (
                      <button
                        onClick={() => setActiveStep(5)}
                        className="w-full py-3.5 rounded-xl bg-[#ffb703] text-slate-955 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01] animate-bounce"
                      >
                        <span>{t("btnGoToReleaseStage")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* Step 5: Album Design & Publishing */}
        {activeStep === 5 && currentChild && composedTrack && (
          <div className="space-y-8 animate-ticket max-w-4xl w-full mx-auto">
            
            {/* Wallet summary */}
            <div className="flex items-center justify-between bg-white border border-slate-250 p-4.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">🚀</div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-900">{currentChild.name} 어린이 프로듀서</h4>
                  <p className="text-xs text-slate-500 font-semibold">{composedTrack.title} 발매 대기 중</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 py-2 px-4.5 rounded-xl flex items-center gap-2">
                <span className="text-xs font-black text-amber-700">{t("kidzoBalance")}</span>
                <strong className="text-lg font-black text-amber-900">{currentChild.kidzoBalance} KidZos</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 text-left">
              {/* Album Art Editor */}
              <div className="glassmorphism-card rounded-2xl p-6 sm:p-7.5 space-y-6">
                <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-3">{t("albumArtTitle")}</h3>
                
                {/* Background Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">{t("albumCoverBg")}</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { label: "Pink-Purple 🌸", bg: "linear-gradient(135deg, #ec4899, #8b5cf6)" },
                      { label: "Blue-Indigo 🌊", bg: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
                      { label: "Orange-Red 🔥", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" },
                      { label: "Green-Emerald 🍀", bg: "linear-gradient(135deg, #10b981, #047857)" }
                    ].map((color) => (
                      <button
                        key={color.bg}
                        onClick={() => setCoverBg(color.bg)}
                        className={`h-11 rounded-xl border transition-all cursor-pointer ${
                          coverBg === color.bg ? "border-slate-900 ring-2 ring-yellow-500" : "border-slate-200"
                        }`}
                        style={{ background: color.bg }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Sticker Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider block">{t("stickerSelect")}</label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {["👑", "🌟", "🐾", "🎸", "🎧"].map((sticker) => (
                      <button
                        key={sticker}
                        onClick={() => setCoverSticker(sticker)}
                        className={`h-12 rounded-xl border text-2xl flex items-center justify-center cursor-pointer transition-all ${
                          coverSticker === sticker 
                            ? "bg-amber-50 border-amber-500 scale-105 shadow-sm" 
                            : "bg-slate-50 border-slate-200 hover:border-slate-355"
                        }`}
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Album Art Live Preview & Publish */}
              <div className="glassmorphism-card rounded-2xl p-6 sm:p-7.5 space-y-6 flex flex-col justify-between items-center text-center">
                
                {/* Live Album Cover Mockup */}
                <div 
                  className="w-60 h-60 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-between text-left select-none text-white border border-white/20 transition-all hover:scale-[1.01] duration-300"
                  style={{ background: coverBg }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black tracking-widest uppercase opacity-75">KZ RECORDS</span>
                    {/* Sticker stamp */}
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl animate-float">
                      {coverSticker}
                    </div>
                  </div>

                  <div className="space-y-1 bg-black/15 p-3 rounded-2xl backdrop-blur-xs">
                    <h4 className="text-base sm:text-lg font-black truncate">{composedTrack.title}</h4>
                    <p className="text-[10px] sm:text-xs font-mono font-black uppercase opacity-90">{currentChild.name} • {composedTrack.genre}</p>
                  </div>
                </div>

                {isReleased ? (
                  <div className="w-full space-y-3.5 animate-ticket pt-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-black">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{lang === "KOR" ? "정식 발매 완료!" : "Released Successfully!"}</span>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/chart" className="flex-1 py-3 rounded-xl bg-[#ffb703] hover:bg-[#ffb703]/90 text-slate-955 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-900/10">
                        <span>{t("musicChart")}</span>
                      </Link>
                      <Link href="/parent" className="flex-1 py-3 rounded-xl bg-[#002855] border border-blue-500/20 hover:bg-[#002855]/90 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-900/10">
                        <span>{t("parentLounge")}</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePublish}
                    className="w-full py-4.5 rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] shadow"
                  >
                    <span>{t("btnPublish")}</span>
                  </button>
                )}

              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-[9px] text-slate-500 border-t border-slate-200 mt-10">
        <p className="max-w-md mx-auto leading-normal mb-1">
          본 웹 서비스는 키자니아(KidZania)와 함께하는 '대중음악프로듀서' 체험용 사이트입니다.
        </p>
        <p>© 2026 KidZania Pop Music Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}
