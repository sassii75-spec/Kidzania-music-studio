"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Play, Pause, Award, Sparkles, Heart, CreditCard, 
  Volume2, VolumeX, SkipBack, SkipForward, Activity, Star, 
  MessageSquare, Send, ShieldCheck, Loader2, CheckCircle2, 
  ChevronRight, AlertCircle
} from "lucide-react";
import { translations, type Lang } from "../translations";
import { 
  getLeaderboard, Song, purchaseSong, likeSong, 
  getParentWallet, topUpParentWallet, addReview, 
  getReviewsBySong, Review 
} from "../db";
import { db as firestoreDb } from "../firebase";
import { collection, onSnapshot, doc, query, where } from "firebase/firestore";

export default function BillboardChart() {
  const [lang, setLang] = useState<Lang>("KOR");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Simulated visualizer heights when playing
  const [visHeights, setVisHeights] = useState<number[]>(new Array(15).fill(4));

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [authorInput, setAuthorInput] = useState<string>("");

  // Wallet and recharge state
  const [walletBalance, setWalletBalance] = useState<number>(150);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<number>(1);
  const [paymentStatus, setPaymentStatus] = useState<"verifying" | "securing" | "recharging" | "idle">("idle");
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedPrice, setSelectedPrice] = useState<string>("9,000 KRW");
  
  // Credit card inputs
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard" | "korea" | "generic">("generic");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Load initial language
    const savedLang = localStorage.getItem("kidzania_lang") as Lang;
    if (savedLang) setLang(savedLang);

    // Initial data load (leaderboard and wallet)
    const loadInitialData = async () => {
      const initialSongs = await getLeaderboard();
      setSongs(initialSongs);
      if (initialSongs.length > 0) {
        setSelectedSong(prev => prev ? (initialSongs.find(s => s.id === prev.id) || initialSongs[0]) : initialSongs[0]);
      }
      
      const bal = await getParentWallet();
      setWalletBalance(bal);
    };
    loadInitialData();

    // Setup real-time listener if Firebase is configured
    let unsubscribe: any;
    let unsubscribeWallet: any;
    if (firestoreDb) {
      unsubscribe = onSnapshot(collection(firestoreDb, "songs"), (snapshot) => {
        const latestSongs = snapshot.docs.map(doc => doc.data() as Song);
        // Sort algorithm: (purchases * 100) + (likes * 10) + score
        latestSongs.sort((a, b) => {
          const scoreA = (a.purchases * 100) + (a.likes * 10) + a.score;
          const scoreB = (b.purchases * 100) + (b.likes * 10) + b.score;
          return scoreB - scoreA;
        });
        setSongs(latestSongs);
      });

      // Wallet listener
      unsubscribeWallet = onSnapshot(doc(firestoreDb, "metadata", "parentWallet"), (docSnap) => {
        if (docSnap.exists()) {
          setWalletBalance(docSnap.data().balance);
        }
      });
    }

    // Sync state on local storage events
    const handleStorageChange = async () => {
      const updatedLang = localStorage.getItem("kidzania_lang") as Lang;
      if (updatedLang) setLang(updatedLang);

      const latestSongs = await getLeaderboard();
      setSongs(latestSongs);
      
      const bal = await getParentWallet();
      setWalletBalance(bal);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (unsubscribe) unsubscribe();
      if (unsubscribeWallet) unsubscribeWallet();
    };
  }, []);

  // Sync selectedSong fields (likes, purchases, score) when global songs list updates
  useEffect(() => {
    if (selectedSong && songs.length > 0) {
      const updated = songs.find((s) => s.id === selectedSong.id);
      if (updated) {
        setSelectedSong(updated);
      }
    }
  }, [songs]);

  // Load reviews when selectedSong changes
  useEffect(() => {
    if (!selectedSong) {
      setReviews([]);
      return;
    }
    
    const fetchReviews = async () => {
      const list = await getReviewsBySong(selectedSong.id);
      setReviews(list);
    };
    fetchReviews();

    // Set up real-time listener for reviews if firestoreDb exists
    let unsubscribeReviews: any;
    if (firestoreDb) {
      const reviewsRef = collection(firestoreDb, "reviews");
      const q = query(reviewsRef, where("songId", "==", selectedSong.id));
      unsubscribeReviews = onSnapshot(q, (snap) => {
        const list = snap.docs.map((doc) => doc.data() as Review);
        setReviews(list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)));
      });
    }

    return () => {
      if (unsubscribeReviews) unsubscribeReviews();
    };
  }, [selectedSong?.id]);

  // Audio Play Effect
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log("Audio playback prevented:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, selectedSong]);

  // Sync mute state with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Load new audio when selectedSong changes
  useEffect(() => {
    if (audioRef.current && selectedSong) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log("Playback failed:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [selectedSong]);

  // Equalizer visualizer animation when playing
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setVisHeights(
          Array.from({ length: 15 }, () => Math.floor(Math.random() * 32) + 6)
        );
      }, 120);
    } else {
      setVisHeights(new Array(15).fill(4));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.["KOR"] || key;
  };

  const handlePlaySong = (song: Song) => {
    setSelectedSong(song);
    setIsPlaying(true);
  };

  const handleNextTrack = () => {
    if (songs.length === 0 || !selectedSong) return;
    const currentIndex = songs.findIndex((s) => s.id === selectedSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setSelectedSong(songs[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (songs.length === 0 || !selectedSong) return;
    const currentIndex = songs.findIndex((s) => s.id === selectedSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setSelectedSong(songs[prevIndex]);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && duration > 0) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const calculateTotalScore = (song: Song): number => {
    return (song.purchases * 100) + (song.likes * 10) + song.score;
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem("kidzania_lang", l);
    window.dispatchEvent(new Event("storage"));
  };

  const handleCardNumberChange = (value: string) => {
    const clean = value.replace(/\D/g, "").substring(0, 16);
    let formatted = "";
    for (let i = 0; i < clean.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += clean[i];
    }
    setCardNumber(formatted);

    // Detect brand
    if (clean.startsWith("4")) setCardBrand("visa");
    else if (clean.startsWith("5")) setCardBrand("mastercard");
    else if (clean.startsWith("9")) setCardBrand("korea");
    else setCardBrand("generic");
  };

  const handleExpiryChange = (value: string) => {
    const clean = value.replace(/\D/g, "").substring(0, 4);
    if (clean.length >= 3) {
      setExpiryDate(clean.substring(0, 2) + "/" + clean.substring(2, 4));
    } else {
      setExpiryDate(clean);
    }
  };

  const handleCvvChange = (value: string) => {
    const clean = value.replace(/\D/g, "").substring(0, 3);
    setCvv(clean);
  };

  const handleRechargePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\s/g, "");
    const cleanExpiry = expiryDate.replace(/\//g, "");

    if (cleanCard.length < 16 || cleanExpiry.length < 4 || cvv.length < 3 || !cardholderName.trim()) {
      setToastMessage(lang === "KOR" ? "⚠️ 올바른 카드 정보를 입력해 주세요." : "⚠️ Please enter valid card details.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setPaymentStep(2);
    setPaymentStatus("verifying");

    // Stage 1: Card validation
    setTimeout(() => {
      setPaymentStatus("securing");
      // Stage 2: Gateway security
      setTimeout(() => {
        setPaymentStatus("recharging");
        // Stage 3: Adding KidZos
        setTimeout(async () => {
          const newBalance = await topUpParentWallet(selectedAmount);
          setWalletBalance(newBalance);
          setPaymentStep(3);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong) return;
    if (!commentInput.trim()) return;

    await addReview(selectedSong.id, ratingInput, commentInput, authorInput);
    
    // Reset form
    setCommentInput("");
    setAuthorInput("");
    setRatingInput(5);

    setToastMessage(lang === "KOR" ? "⭐ 후기가 성공적으로 등록되었습니다!" : "⭐ Review submitted successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLike = async () => {
    if (!selectedSong) return;
    await likeSong(selectedSong.id);
    setToastMessage(lang === "KOR" ? "❤️ 응원의 좋아요를 보냈습니다!" : "❤️ Like sent successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSponsor = async () => {
    if (!selectedSong) return;
    
    if (walletBalance < 10) {
      setToastMessage(lang === "KOR" ? "⚠️ 키조가 부족합니다! 충전 후 이용해 주세요." : "⚠️ Insufficient KidZos! Please recharge.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const res = await purchaseSong(selectedSong.id);
    if (res.success) {
      const newBal = await getParentWallet();
      setWalletBalance(newBal);
      setShowConfetti(true);
      setToastMessage(lang === "KOR" ? "🎁 10 키조를 후원했습니다! 어린이가 기뻐할 거예요." : "🎁 Sponsored 10 KidZos! The child will be thrilled.");
      setTimeout(() => {
        setToastMessage(null);
        setShowConfetti(false);
      }, 4000);
    } else {
      setToastMessage(lang === "KOR" ? "⚠️ 후원에 실패했습니다." : "⚠️ Sponsorship failed.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border-2 border-yellow-500 text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold animate-ticket">
          <span className="text-yellow-500">✨</span>
          <p className="text-xs sm:text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Confetti Animation Effect (if active) */}
      {showConfetti && (
        <div className="confetti-canvas fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="text-center space-y-4 animate-float">
            <span className="text-8xl">🎉</span>
            <h2 className="text-3xl font-black text-yellow-400 text-glow-yellow">THANK YOU!</h2>
            <p className="text-white text-lg font-bold">10 KidZos Sponsored to the Kid Producer!</p>
          </div>
        </div>
      )}

      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#e63946]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#ffb703]/5 blur-3xl pointer-events-none" />

      {/* HTML5 Audio Player */}
      <audio
        ref={audioRef}
        src={selectedSong?.audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || selectedSong?.durationSeconds || 135);
          }
        }}
        onEnded={() => {
          handleNextTrack();
        }}
      />

      {/* Main Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-505 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>{lang === "KOR" ? "이전 화면" : "Main Gate"}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Parent Wallet HUD */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-black text-blue-700 shadow-sm">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>{t("parentWallet")}: {walletBalance} KidZos</span>
            <button
              onClick={() => {
                setPaymentStep(1);
                setIsPaymentModalOpen(true);
              }}
              className="ml-1.5 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[9px] font-extrabold uppercase transition-colors cursor-pointer"
            >
              {lang === "KOR" ? "충전" : "Charge"}
            </button>
          </div>

          {/* Header Title Badge */}
          <div className="hidden sm:flex bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-black text-blue-700 items-center gap-2 shadow-sm">
            <Award className="w-4 h-4 text-yellow-650" />
            <span>{t("musicChart")}</span>
          </div>

          {/* Language picker */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => handleLangChange("KOR")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                lang === "KOR" ? "bg-[#ffb703] text-slate-950 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => handleLangChange("ENG")}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                lang === "ENG" ? "bg-[#ffb703] text-slate-950 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start z-10">
        
        {/* Title Block */}
        <div className="space-y-3 text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs sm:text-sm font-extrabold text-amber-700">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span>REAL-TIME BILLBOARD TOP CHARTS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {t("chartTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold max-w-xl mx-auto">
            {t("chartDesc")}
          </p>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left Side: Leaderboard List (Col span 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-4 py-2 text-xs font-black text-slate-500 uppercase tracking-wider">
              <span>{lang === "KOR" ? "순위 및 곡정보" : "Rank & Track Details"}</span>
              <span>{lang === "KOR" ? "차트 점수" : "Chart Score"}</span>
            </div>

            <div className="space-y-3.5">
              {songs.map((song, index) => {
                const totalScore = calculateTotalScore(song);
                const isCurrent = selectedSong?.id === song.id;
                const rank = index + 1;

                // Rank Badge UI
                let rankBadge = <span className="text-sm font-bold text-slate-400">{rank}</span>;
                if (rank === 1) rankBadge = <span className="text-2xl animate-float">🥇</span>;
                else if (rank === 2) rankBadge = <span className="text-2xl">🥈</span>;
                else if (rank === 3) rankBadge = <span className="text-2xl">🥉</span>;

                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlaySong(song)}
                    className={`p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer border-2 transition-all ${
                      isCurrent
                        ? "border-[#ffb703] bg-amber-50/50 shadow-md scale-[1.01]"
                        : "border-transparent bg-white shadow-sm hover:border-slate-300"
                    }`}
                  >
                    {/* Rank Number / Badge */}
                    <div className="w-10 flex items-center justify-center shrink-0">
                      {rankBadge}
                    </div>

                    {/* Album Art Cover */}
                    <div
                      className="w-16 h-16 rounded-xl p-1.5 relative flex flex-col justify-between text-[6px] font-black text-white border border-white/20 shrink-0 shadow-sm"
                      style={{ background: song.coverBg }}
                    >
                      <span className="opacity-70 leading-none">KZ RECORD</span>
                      <span className="text-sm text-right leading-none select-none">{song.sticker}</span>
                      <span className="truncate block bg-black/35 px-1 py-0.5 rounded-sm text-center leading-none uppercase">
                        {song.title.split(" (")[0]}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {song.title}
                        </h3>
                        {isCurrent && isPlaying && (
                          <div className="flex gap-0.5 items-end h-3 shrink-0">
                            <div className="w-0.5 bg-yellow-500 h-full animate-bounce [animation-duration:0.6s]" />
                            <div className="w-0.5 bg-yellow-500 h-2 animate-bounce [animation-duration:0.4s]" />
                            <div className="w-0.5 bg-yellow-500 h-full animate-bounce [animation-duration:0.5s]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-bold">
                        {song.author} ({song.age}{lang === "KOR" ? "세" : " yrs"}) •{" "}
                        <span className="text-blue-600 font-extrabold">{song.genre}</span>
                      </p>

                      {/* Small Info Badges */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-bold">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-red-500/20 text-red-650" />
                          <span>{song.likes}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-blue-600" />
                          <span>{song.purchases}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>AI: {song.score}</span>
                        </span>
                      </div>
                    </div>

                    {/* Score Value badge */}
                    <div className="text-right shrink-0">
                      <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        {t("scoreLabel")}
                      </span>
                      <span className="text-base sm:text-lg font-black text-amber-700">
                        {totalScore.toLocaleString()}
                      </span>
                    </div>

                  </div>
                );
              })}

              {songs.length === 0 && (
                <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-500 font-semibold text-sm">
                  {lang === "KOR" ? "아직 발매된 앨범이 없습니다." : "No albums released yet."}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Cassette Deck Player (Col span 5) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="glassmorphism-card rounded-3xl p-6 border-2 border-slate-205 bg-white shadow-md relative overflow-hidden flex flex-col justify-start">
              
              <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#ffb703]/5 to-transparent pointer-events-none -z-10" />
              
              {/* Header Label */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>KIDZANIA PLAYBACK DECK</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">STEREO TYPE I</span>
              </div>

              {selectedSong ? (
                <div className="space-y-6">
                  {/* Cassette Tape Mockup */}
                  <div className="flex justify-center py-2">
                    <div className="w-64 h-40 bg-[#002855] border-4 border-gray-850 rounded-2xl relative shadow-2xl flex flex-col justify-between p-3.5 select-none overflow-hidden border-2 border-yellow-500/25">
                      
                      {/* Top Bar Text Info */}
                      <div className="flex justify-between items-center text-[8px] font-mono text-gray-400 font-bold">
                        <span>KID PRODUCER DEMO TAPE</span>
                        <span>DOLBY SYSTEM</span>
                      </div>

                      {/* Windows & rollers */}
                      <div className="w-48 h-18 bg-[#030712] border-2 border-gray-850 rounded-xl mx-auto flex items-center justify-around relative">
                        
                        {/* Left Roller Spindle */}
                        <div className={`w-9 h-9 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center relative ${isPlaying ? 'animate-tape-roll [animation-duration:3.5s]' : ''}`}>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-700 -translate-x-1/2" />
                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700 -translate-y-1/2" />
                        </div>

                        {/* Spindle Tape Window Title Label */}
                        <div className="text-center">
                          <span className="text-[7px] font-mono text-gray-500 block uppercase tracking-wider leading-none">
                            {selectedSong.genre}
                          </span>
                          <span className="text-[6px] font-mono text-blue-400 block font-bold leading-none mt-1">
                            {selectedSong.tempo}
                          </span>
                        </div>

                        {/* Right Roller Spindle */}
                        <div className={`w-9 h-9 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center relative ${isPlaying ? 'animate-tape-roll [animation-duration:3.5s]' : ''}`}>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-700 -translate-x-1/2" />
                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700 -translate-y-1/2" />
                        </div>
                      </div>

                      {/* Track Title label write-in styling */}
                      <div className="text-[10px] font-mono font-black text-[#ffb703] truncate tracking-wide text-center uppercase border-t border-blue-900 pt-2 text-glow-yellow">
                        {selectedSong.title}
                      </div>
                    </div>
                  </div>

                  {/* Equalizer Visualizer Bars */}
                  <div className="flex items-end justify-center gap-1.5 h-10 w-full px-4 bg-slate-50 py-2 rounded-xl border border-slate-200">
                    {visHeights.map((h, i) => (
                      <div
                        key={i}
                        className="bg-yellow-500 w-1.5 rounded-t transition-all duration-100"
                        style={{ height: `${(h / 38) * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Player Metadata & Stats */}
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-slate-900">{selectedSong.title}</h3>
                    <p className="text-xs text-slate-655 font-bold">
                      {lang === "KOR" ? "창작자" : "Creator"}:{" "}
                      <span className="text-amber-650 font-extrabold">
                        {selectedSong.author} ({selectedSong.age}{lang === "KOR" ? "세" : " yrs"})
                      </span>
                    </p>
                  </div>

                  {/* Interactive Sponsor & Like Action Row */}
                  <div className="grid grid-cols-2 gap-3 px-2">
                    {/* Like Button */}
                    <button
                      onClick={handleLike}
                      className="py-2.5 px-4 rounded-xl border border-red-200 hover:border-red-300 bg-red-50/20 hover:bg-red-50/50 text-red-600 hover:text-red-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.01]"
                    >
                      <Heart className="w-4 h-4 fill-red-500/20 text-red-650" />
                      <span>{lang === "KOR" ? `좋아요 (${selectedSong.likes})` : `Like (${selectedSong.likes})`}</span>
                    </button>

                    {/* Sponsor 10 KidZos Button */}
                    <button
                      onClick={handleSponsor}
                      className="py-2.5 px-4 rounded-xl border border-yellow-200 hover:border-yellow-300 bg-amber-50/20 hover:bg-amber-50/50 text-amber-700 hover:text-amber-800 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.01]"
                    >
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>{lang === "KOR" ? "10 키조 후원" : "Sponsor 10"}</span>
                    </button>
                  </div>

                  {/* Seek Bar & Time */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 w-8 text-left">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 135}
                        step={0.1}
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ffb703] outline-none"
                      />
                      <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>

                  {/* Play Controls & volume */}
                  <div className="flex items-center justify-between px-4">
                    {/* Mute Button */}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isMuted 
                          ? "bg-red-50 border-red-200 text-red-600" 
                          : "bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-550 hover:text-slate-800"
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                    </button>

                    {/* Navigation controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePrevTrack}
                        className="p-3 rounded-full bg-slate-55 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all cursor-pointer hover:scale-105"
                        title="Previous Track"
                      >
                        <SkipBack className="w-4.5 h-4.5 fill-current" />
                      </button>

                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-14 h-14 rounded-full bg-[#ffb703] hover:bg-[#ffb703]/90 text-gray-950 hover:scale-105 transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-yellow-900/10"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 fill-gray-950 text-gray-950" />
                        ) : (
                          <Play className="w-6 h-6 fill-gray-950 text-gray-950 ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={handleNextTrack}
                        className="p-3 rounded-full bg-slate-55 border border-slate-205 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all cursor-pointer hover:scale-105"
                        title="Next Track"
                      >
                        <SkipForward className="w-4.5 h-4.5 fill-current" />
                      </button>
                    </div>

                    {/* Empty placeholder to balance spacing */}
                    <div className="w-10 h-10" />
                  </div>

                  {/* Lyrics Display Panel */}
                  <div className="border-t border-slate-200 pt-5 space-y-2 text-left">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {lang === "KOR" ? "나만의 가사" : "Song Lyrics"}
                    </span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-36 overflow-y-auto text-xs sm:text-sm font-semibold font-mono text-amber-805 leading-relaxed scrollbar-thin">
                      {selectedSong.lyrics ? (
                        <pre className="whitespace-pre-wrap font-sans">{selectedSong.lyrics}</pre>
                      ) : (
                        <p className="text-gray-500 italic">No lyrics available.</p>
                      )}
                    </div>
                  </div>

                  {/* Reviews & Star Evaluation Panel */}
                  <div className="border-t border-slate-200 pt-5 space-y-4 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        {lang === "KOR" ? "⭐ 평가 및 후기" : "⭐ Ratings & Reviews"}
                      </span>
                      {reviews.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          ★ {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length})
                        </span>
                      )}
                    </div>

                    {/* Write Review Form */}
                    <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500">
                          {lang === "KOR" ? "별점 선택" : "Select Star Rating"}
                        </span>
                        {/* 5-star interactive input */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setRatingInput(star)}
                              className="focus:outline-none cursor-pointer"
                            >
                              <Star
                                className={`w-4 h-4 transition-all ${
                                  star <= ratingInput
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-slate-300 hover:text-slate-450"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Nickname & Comment Inputs */}
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder={lang === "KOR" ? "닉네임 (작성 안할 시 익명)" : "Nickname (Optional)"}
                          value={authorInput}
                          onChange={(e) => setAuthorInput(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-yellow-500"
                        />
                        <textarea
                          placeholder={lang === "KOR" ? "어린이 프로듀서에게 따뜻한 한마디 후기를 남겨주세요!" : "Leave a warm feedback for the kid producer!"}
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          required
                          rows={2}
                          className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-yellow-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === "KOR" ? "후기 등록하기" : "Submit Review"}</span>
                      </button>
                    </form>

                    {/* Reviews List */}
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {reviews.length > 0 ? (
                        reviews.map((rev) => (
                          <div key={rev.id} className="bg-white border border-slate-100 rounded-xl p-3 space-y-1 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">
                                {rev.authorName}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star
                                    key={idx}
                                    className={`w-3 h-3 ${
                                      idx < rev.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 font-semibold leading-normal font-sans text-left">
                              {rev.comment}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 block text-right">
                              {rev.registeredAt}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-slate-400 font-bold italic text-xs">
                          {lang === "KOR" ? "💬 첫 번째 별점 후기를 남겨주세요!" : "💬 Be the first to leave a feedback!"}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 font-semibold text-sm border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  💡 {lang === "KOR" ? "음원을 재생하려면 차트 목록에서 곡을 선택하세요." : "Select a track from the chart to play."}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Main Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-[10px] text-slate-500 border-t border-slate-200 z-10 mt-10">
        <p className="max-w-md mx-auto leading-normal">
          본 웹 서비스는 키자니아(KidZania)와 함께하는 '대중음악프로듀서' 체험용 사이트입니다.<br />
          © 2026 KidZania Pop Music Studio. All rights reserved.
        </p>
      </footer>

      {/* Interactive Credit Card Charge Modal */}
      {isPaymentModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative animate-ticket max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer text-lg font-black"
            >
              ✕
            </button>

            <div className="space-y-1 text-left">
              <h3 className="text-2xl font-black text-slate-900">{t("modalRechargeTitle")}</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                {t("selectRechargeAmount")}
              </p>
            </div>

            {paymentStep === 1 && (
              <form onSubmit={handleRechargePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: Form Controls */}
                <div className="space-y-6">
                  {/* Select recharge items */}
                  <div className="space-y-2.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      RECHARGE PACKAGES
                    </label>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { amount: 50, price: "5,000 KRW", badge: "Basic" },
                        { amount: 100, price: "9,000 KRW", badge: "Popular" },
                        { amount: 200, price: "16,000 KRW", badge: "Best" }
                      ].map((pkg) => (
                        <button
                          type="button"
                          key={pkg.amount}
                          onClick={() => {
                            setSelectedAmount(pkg.amount);
                            setSelectedPrice(pkg.price);
                          }}
                          className={`p-4 rounded-2xl flex flex-col items-center justify-between text-center border-2 transition-all relative cursor-pointer ${
                            selectedAmount === pkg.amount
                              ? "border-blue-600 bg-blue-50/20 shadow-md scale-[1.02] font-black"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <span className="absolute -top-2 -right-1 px-1.5 py-0.5 text-[8px] font-extrabold rounded-md uppercase tracking-wider bg-slate-900 text-white">
                            {pkg.badge}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 mt-2">KidZos</span>
                          <strong className="text-xl font-black text-slate-900 leading-tight">+{pkg.amount}</strong>
                          <span className="text-[10px] font-bold text-slate-400 mt-1">{pkg.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credit Card Inputs */}
                  <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                      {t("cardDetails")}
                    </label>

                    {/* Card Number */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-505">{t("cardNumber")}</span>
                      <input
                        type="text"
                        required
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Expiry and CVV inline */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-505">{t("cardExpiry")}</span>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-550">{t("cardCvv")}</span>
                        <input
                          type="password"
                          required
                          placeholder="***"
                          value={cvv}
                          onChange={(e) => handleCvvChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-center"
                        />
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-505">{t("cardHolder")}</span>
                      <input
                        type="text"
                        required
                        placeholder="KIDZANIA TRAINEE"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] mt-2"
                  >
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>{t("btnPay")}</span>
                  </button>

                </div>

                {/* Right Column: Interactive Card Preview */}
                <div className="flex flex-col justify-center items-center bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    CARD PREVIEW
                  </span>
                  
                  {/* Visual Credit Card */}
                  <div 
                    className={`w-full max-w-[320px] h-48 rounded-2xl relative p-6 text-white flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10 select-none bg-gradient-to-br transition-all duration-500 ${
                      cardBrand === "visa" 
                        ? "from-blue-600 to-indigo-800 shadow-blue-500/20" 
                        : cardBrand === "mastercard" 
                        ? "from-red-600 to-amber-700 shadow-red-500/20" 
                        : cardBrand === "korea" 
                        ? "from-rose-600 to-blue-700 shadow-rose-500/20" 
                        : "from-slate-800 to-slate-950 shadow-slate-900/30"
                    }`}
                  >
                    {/* Card layout lines */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                    {/* Top Row: Chip and Brand */}
                    <div className="flex justify-between items-start">
                      {/* Gold Chip */}
                      <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-yellow-500 border border-amber-400/30 relative overflow-hidden flex flex-col justify-around p-1 shadow-inner">
                        <div className="h-0.5 bg-black/10 w-full" />
                        <div className="h-0.5 bg-black/10 w-full" />
                        <div className="h-0.5 bg-black/10 w-full" />
                      </div>
                      {/* Brand label */}
                      <span className="text-xs font-black italic tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded">
                        {cardBrand === "visa" && "VISA"}
                        {cardBrand === "mastercard" && "Mastercard"}
                        {cardBrand === "korea" && "KOREA CARD"}
                        {cardBrand === "generic" && "CREDIT CARD"}
                      </span>
                    </div>

                    {/* Card Number */}
                    <div className="text-base sm:text-lg font-mono tracking-widest font-bold my-2 drop-shadow-md text-left">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    {/* Cardholder name and Expiry */}
                    <div className="flex justify-between items-end">
                      <div className="min-w-0 text-left">
                        <span className="text-[7px] text-white/50 block font-mono font-black uppercase tracking-wider leading-none">Card Holder</span>
                        <span className="text-[10px] font-bold font-mono tracking-wide truncate block mt-1 uppercase">
                          {cardholderName || "CARDHOLDER NAME"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7px] text-white/50 block font-mono font-black uppercase tracking-wider leading-none">Expires</span>
                        <span className="text-[10px] font-bold font-mono tracking-wider block mt-1">
                          {expiryDate || "MM/YY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                    <span className="text-blue-500">🔒</span>
                    <span>256-bit SSL Secure Transaction & local encryption</span>
                  </div>

                </div>

              </form>
            )}

            {/* Payment Processing loading screen */}
            {paymentStep === 2 && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-ticket">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-900">
                    {paymentStatus === "verifying" && (lang === "KOR" ? "카드 번호 검증 중..." : "Verifying Card Number...")}
                    {paymentStatus === "securing" && (lang === "KOR" ? "결제 게이트웨이 보안 연결 중..." : "Securing Connection...")}
                    {paymentStatus === "recharging" && (lang === "KOR" ? "지갑에 키조 충전 요청 중..." : "Recharging KidZos...")}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold">
                    {lang === "KOR" ? "창을 닫지 마세요. 결제가 진행 중입니다." : "Do not close this window. Transaction in progress."}
                  </p>
                </div>
              </div>
            )}

            {/* Success step screen */}
            {paymentStep === 3 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-ticket">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900">
                    {lang === "KOR" ? "충전이 완료되었습니다!" : "Recharge Complete!"}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold max-w-sm">
                    {lang === "KOR" 
                      ? `성공적으로 결제되었습니다. ${selectedAmount} 키조가 충전되어 총 ${walletBalance} 키조가 되었습니다.` 
                      : `Payment processed. ${selectedAmount} KidZos added. Total balance is now ${walletBalance} KidZos.`
                    }
                  </p>
                </div>

                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-md transition-colors"
                >
                  {lang === "KOR" ? "차트로 돌아가기" : "Return to Chart"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
