"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, User, Heart, CreditCard, Award, Printer, Play, 
  CheckCircle2, AlertCircle, LogOut, Loader2, ShieldCheck
} from "lucide-react";
import { translations, type Lang } from "../translations";
import { getChildByName, getSongsByChild, purchaseSong, likeSong, getDb, Child, Song, topUpParentWallet, getParentWallet } from "../db";
import { db as firestoreDb } from "../firebase";
import { doc, collection, onSnapshot, query, where } from "firebase/firestore";

export default function ParentPortal() {
  const [lang, setLang] = useState<Lang>("KOR");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Login states
  const [childName, setChildName] = useState("");
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard states
  const [childSongs, setChildSongs] = useState<Song[]>([]);
  const [parentWallet, setParentWallet] = useState(150);

  // Audio player states
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);

  // Card Payment & Recharge States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "verifying" | "securing" | "recharging" | "success">("idle");
  const [paymentStep, setPaymentStep] = useState<number>(1); // 1: Info, 2: Loading, 3: Success
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard" | "korea" | "generic">("generic");

  const handleCardNumberChange = (value: string) => {
    const clean = value.replace(/\D/g, "");
    const formatted = clean.match(/.{1,4}/g)?.join(" ") || clean;
    setCardNumber(formatted.substring(0, 19));

    if (clean.startsWith("4")) {
      setCardBrand("visa");
    } else if (clean.startsWith("5")) {
      setCardBrand("mastercard");
    } else if (clean.startsWith("9") || clean.startsWith("3")) {
      setCardBrand("korea");
    } else {
      setCardBrand("generic");
    }
  };

  const handleExpiryChange = (value: string) => {
    const clean = value.replace(/\D/g, "");
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    setExpiryDate(formatted.substring(0, 5));
  };

  const handleCvvChange = (value: string) => {
    const clean = value.replace(/\D/g, "");
    setCvv(clean.substring(0, 3));
  };

  const handleProcessRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\s/g, "");
    const cleanExpiry = expiryDate.replace(/\//g, "");
    if (cleanCard.length < 15 || cleanExpiry.length < 4 || cvv.length < 3 || !cardholderName.trim()) {
      setToastMessage(t("invalidCard"));
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setPaymentStep(2);
    setPaymentStatus("verifying");

    setTimeout(() => {
      setPaymentStatus("securing");
      setTimeout(() => {
        setPaymentStatus("recharging");
        setTimeout(async () => {
          const newBalance = await topUpParentWallet(selectedAmount);
          setParentWallet(newBalance);
          setPaymentStatus("success");
          setPaymentStep(3);
          
          setToastMessage(t("paySuccessCont"));
          setTimeout(() => setToastMessage(null), 3000);
        }, 1200);
      }, 1200);
    }, 1200);
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

  // Sync balances & Setup Firestore Real-time Listeners
  useEffect(() => {
    const loadWallet = async () => {
      const wallet = await getParentWallet();
      setParentWallet(wallet);
    };
    loadWallet();

    let unsubscribeWallet: any;
    if (firestoreDb) {
      unsubscribeWallet = onSnapshot(doc(firestoreDb, "metadata", "parentWallet"), (docSnap) => {
        if (docSnap.exists()) {
          setParentWallet(docSnap.data().balance);
        }
      });
    }

    return () => {
      if (unsubscribeWallet) unsubscribeWallet();
    };
  }, []);

  // Real-time listener for child profile and songs updates from Firestore
  useEffect(() => {
    if (!activeChild || !firestoreDb) return;

    const unsubscribeChild = onSnapshot(doc(firestoreDb, "children", activeChild.name.toLowerCase()), (docSnap) => {
      if (docSnap.exists()) {
        setActiveChild(docSnap.data() as Child);
      }
    });

    const songsQuery = query(collection(firestoreDb, "songs"), where("author", "==", activeChild.name.trim()));
    const unsubscribeSongs = onSnapshot(songsQuery, (snapshot) => {
      const songsList = snapshot.docs.map(doc => doc.data() as Song);
      setChildSongs(songsList);
    });

    return () => {
      unsubscribeChild();
      unsubscribeSongs();
    };
  }, [activeChild?.name]);

  // Audio Play Simulation Effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setPlayTime((prev) => {
          if (prev >= currentTrack.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.["KOR"] || key;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;

    const child = await getChildByName(childName.trim());
    if (child) {
      setActiveChild(child);
      setLoginError(null);
      const songs = await getSongsByChild(child.name);
      setChildSongs(songs);
      
      setToastMessage(lang === "KOR" ? `🔓 보호자 인증 완료: ${child.name} 어린이` : `🔓 Authentication complete for parent of ${child.name}`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setLoginError(t("enterLoungeErr"));
    }
  };

  const handleLogOut = () => {
    setActiveChild(null);
    setChildSongs([]);
    setChildName("");
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleBuyAlbum = async (songId: string) => {
    const res = await purchaseSong(songId);
    if (res.success) {
      // Refresh local state
      const wallet = await getParentWallet();
      setParentWallet(wallet);
      if (activeChild) {
        const updatedChild = await getChildByName(activeChild.name);
        if (updatedChild) setActiveChild(updatedChild);
        
        const songs = await getSongsByChild(activeChild.name);
        setChildSongs(songs);
      }
      setToastMessage(t(res.msgKey));
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage(res.msgKey === "enterLoungeErr" ? t(res.msgKey) : res.msgKey);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleLike = async (songId: string) => {
    await likeSong(songId);
    if (activeChild) {
      const songs = await getSongsByChild(activeChild.name);
      setChildSongs(songs);
    }
    setToastMessage(t("likeSuccess"));
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
      
      {/* Printable Area overrides */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .certificate-container {
            border: 10px double #ffb703 !important;
            padding: 40px !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white border-2 border-yellow-500 text-slate-900 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold animate-ticket">
          <span className="text-yellow-500">✨</span>
          <p className="text-xs sm:text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Header */}
      <header className="no-print w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>{lang === "KOR" ? "이전 화면" : "Main Gate"}</span>
        </Link>

        <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-black text-blue-700 flex items-center gap-2 shadow-sm">
          <User className="w-4 h-4" />
          <span>{t("parentLounge")}</span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start z-10">
        
        {/* LOGIN SCREEN (NO-PRINT) */}
        {!activeChild && (
          <div className="no-print max-w-md w-full mx-auto space-y-6 text-center animate-ticket mt-8">
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{t("parentWelcome")}</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                  {t("parentWelcomeDesc")}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                    {t("childNameInput")}
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => {
                      setChildName(e.target.value);
                      setLoginError(null);
                    }}
                    required
                    placeholder={lang === "KOR" ? "아이 이름을 적어주세요 (예: 민우)" : "Enter child's name..."}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                  />
                </div>

                {loginError && (
                  <div className="bg-red-55 border border-red-200 p-3.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-red-600 font-bold animate-shake">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#ffb703] hover:bg-[#ffb703]/90 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-900/10 transition-all hover:scale-[1.01]"
                >
                  <span>{t("btnLogin")}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DASHBOARD (Logged In) */}
        {activeChild && (
          <div className="space-y-8 animate-ticket">
            
            {/* Parent Lounge HUD (NO-PRINT) */}
            <div className="no-print w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl gap-6 shadow-sm text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-3xl">☕</div>
                <div>
                  <h4 className="text-lg font-black text-slate-905">{activeChild.name} {lang === "KOR" ? "어린이 학부모님 라운지" : "Parent Lounge"}</h4>
                  <p className="text-xs text-slate-500 font-semibold">{t("childNameInput")}: {activeChild.name} ({activeChild.age}세) • {activeChild.ticketNumber}</p>
                </div>
              </div>

              {/* Wallet balances */}
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none bg-blue-50 border border-blue-150 py-2.5 px-4 rounded-xl text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] sm:text-xs font-black text-blue-600 block uppercase tracking-wider">{t("parentWallet")}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <strong className="text-base sm:text-lg font-black text-blue-800">{parentWallet} KidZos</strong>
                    <button
                      onClick={() => {
                        setSelectedAmount(100);
                        setCardNumber("");
                        setExpiryDate("");
                        setCvv("");
                        setCardholderName("");
                        setPaymentStatus("idle");
                        setPaymentStep(1);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                    >
                      {lang === "KOR" ? "충전" : "Charge"}
                    </button>
                  </div>
                </div>

                <div className="flex-1 md:flex-none bg-amber-50 border border-amber-200 py-2.5 px-4.5 rounded-xl text-center">
                  <span className="text-[10px] sm:text-xs font-black text-amber-700 block uppercase tracking-wider">{t("kidzoBalance")}</span>
                  <strong className="text-base sm:text-lg font-black text-amber-900">{activeChild.kidzoBalance} KidZos</strong>
                </div>
                
                <button
                  onClick={handleLogOut}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-500/30 text-slate-500 hover:text-red-500 transition-all cursor-pointer flex items-center justify-center"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl mx-auto text-left">
              
              {/* Albums Catalog (Col span 2) */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 border-b border-slate-200 pb-3">
                  {lang === "KOR" ? `🎵 ${activeChild.name} 어린이의 발매 음원` : `🎵 Released Songs of ${activeChild.name}`}
                </h3>

                {childSongs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {childSongs.map((song) => (
                      <div key={song.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
                        
                        {/* Artwork Preview */}
                        <div className="flex gap-4 items-center">
                          <div 
                            className="w-20 h-20 rounded-2xl p-2 relative flex flex-col justify-between text-[8px] font-bold text-white border border-white/10 shrink-0"
                            style={{ background: song.coverBg }}
                          >
                            <span className="opacity-75 leading-none">KZ RECORD</span>
                            <span className="text-base text-right mt-1">{song.sticker}</span>
                            <span className="truncate block leading-tight font-black bg-black/20 p-1 rounded-sm">{song.title.split(" (")[0]}</span>
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="text-base font-black text-slate-900 truncate">{song.title}</h4>
                            <p className="text-xs text-amber-650 font-bold uppercase tracking-wider">{song.genre} • {song.tempo}</p>
                            <span className="inline-block mt-2 text-[10px] bg-red-50 border border-red-150 text-red-600 px-2 py-0.5 rounded font-bold">
                              {t("heartsLabel")}: {song.likes} | {t("purchasesLabel")}: {song.purchases}
                            </span>
                          </div>
                        </div>

                        {/* Song operations */}
                        <div className="space-y-2.5">
                          {/* Play button */}
                          <button
                            onClick={() => {
                              setCurrentTrack(song);
                              setPlayTime(0);
                              setIsPlaying(true);
                            }}
                            className="w-full py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-yellow-500/40 text-slate-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current text-slate-600" />
                            <span>Preview Song</span>
                          </button>

                          {/* Sponsor and Like */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBuyAlbum(song.id)}
                              className="flex-1 py-2.5 rounded-xl bg-[#ffb703] hover:bg-[#ffb703]/95 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>{lang === "KOR" ? "10 키조 구매" : "Buy Album"}</span>
                            </button>
                            <button
                              onClick={() => handleLike(song.id)}
                              className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-150 hover:bg-red-100 text-red-650 flex items-center justify-center cursor-pointer transition-colors"
                              title="Like"
                            >
                              <Heart className="w-4.5 h-4.5 fill-current" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-250 rounded-2xl py-12 px-6 text-center text-slate-500 font-semibold text-xs sm:text-sm">
                    ⚠️ {t("noCreationsYet")}
                  </div>
                )}
              </div>

              {/* Right Column: Player (Col span 1) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Visualizer Player */}
                <div className="glassmorphism-card rounded-2xl p-6 text-center flex flex-col justify-start gap-5 min-h-[300px]">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-205 pb-3 text-left">
                    PARENT CASSETTE DECK
                  </h4>

                  {currentTrack ? (
                    <div className="space-y-5 animate-ticket">
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-900 truncate">{currentTrack.title}</h4>
                        <p className="text-xs text-amber-650 font-bold uppercase tracking-wider">{currentTrack.genre} • {currentTrack.tempo}</p>
                      </div>

                      {/* Wave visualizer */}
                      <div className="flex items-end justify-center gap-1.5 h-10 w-full px-4 bg-slate-50 py-2.5 rounded-xl border border-slate-200">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => {
                          const heights = ["h-2", "h-5", "h-9", "h-3", "h-7", "h-8", "h-4", "h-9", "h-6", "h-2"];
                          return (
                            <div
                              key={idx}
                              className={`bg-[#ffb703] w-1.5 rounded transition-all duration-300 ${
                                isPlaying ? heights[(idx + Math.floor(playTime)) % 10] : "h-1.5 bg-slate-300"
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Custom Audio Controller */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-500">
                            {Math.floor(playTime / 60)}:{(playTime % 60).toString().padStart(2, '0')}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full relative overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 transition-all"
                              style={{ width: `${(playTime / currentTrack.durationSeconds) * 105}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-550">{currentTrack.duration}</span>
                        </div>

                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-[#ffb703] text-gray-950 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer shadow-sm"
                          >
                            {isPlaying ? (
                              <div className="flex gap-1 items-center justify-center">
                                <div className="w-1 h-3.5 bg-gray-950" />
                                <div className="w-1 h-3.5 bg-gray-950" />
                              </div>
                            ) : (
                              <Play className="w-4.5 h-4.5 fill-gray-950 text-gray-950 ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 font-semibold text-xs leading-relaxed border border-dashed border-slate-250 rounded-xl bg-slate-50 flex-1 flex items-center justify-center">
                      💡 {lang === "KOR" ? "음원을 재생하려면 목록의 Preview 버튼을 눌러주세요." : "Press Preview on song list to play audio."}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* EXPERIENCE CERTIFICATE (PRINTABLE) */}
            {childSongs.length > 0 && (
              <div className="w-full max-w-3xl mx-auto space-y-6 animate-ticket">
                
                {/* Print button (NO-PRINT) */}
                <div className="no-print flex justify-end">
                  <button
                    onClick={handlePrint}
                    className="py-3 px-5 rounded-xl bg-[#002855] hover:bg-[#002855]/95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-transform hover:scale-[1.01]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t("printCert")}</span>
                  </button>
                </div>

                {/* Printable Certificate Frame */}
                <div className="certificate-container p-6 sm:p-12 border-8 border-double border-yellow-500 bg-white text-gray-950 rounded-3xl shadow-2xl relative select-none">
                  
                  {/* Watermark Logo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-gray-900">
                    <span className="text-[120px] font-black italic select-none">KidZania</span>
                  </div>

                  {/* Ornate corner borders */}
                  <div className="absolute inset-2 border border-yellow-500/20 rounded-2xl pointer-events-none" />

                  {/* Certificate Header */}
                  <div className="text-center space-y-4 border-b border-gray-250 pb-6">
                    <div className="flex justify-center items-center gap-2">
                      <span className="text-[#002855] text-3xl font-black italic tracking-tighter">KidZania</span>
                      <div className="w-2 h-2 rounded-full bg-[#ffb703]" />
                      <span className="text-gray-900 text-base font-black uppercase tracking-wider">Pop Music Studio</span>
                    </div>
                    <h1 className="text-2.5xl sm:text-3.5xl font-black text-gray-900 tracking-wide border-t border-b border-gray-300 py-3 mt-4">
                      {t("certTitle")}
                    </h1>
                  </div>

                  {/* Certificate Body */}
                  <div className="py-8 space-y-8 text-center">
                    <div className="space-y-1.5">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-mono font-black block uppercase tracking-wider">Recipient Name</span>
                      <strong className="text-xl sm:text-2xl font-black text-gray-900 border-b-2 border-gray-900 px-6 pb-1 inline-block">
                        {activeChild.name} 어린이
                      </strong>
                    </div>

                    <p className="text-sm sm:text-base leading-loose max-w-2xl mx-auto font-bold text-gray-800 text-center">
                      {t("certBody")}
                    </p>

                    <div className="grid grid-cols-2 gap-6 text-xs text-gray-700 font-bold border-t border-gray-200 pt-6 max-w-md mx-auto text-left">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">{t("certDate")}</span>
                        <span className="text-sm font-mono font-black text-gray-900">
                          {new Date().toISOString().split("T")[0]}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Official Stamp</span>
                        <div className="kidzania-stamp mt-1 text-center scale-110">CERTIFIED</div>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Footer */}
                  <div className="text-center pt-4 border-t border-gray-250 pb-2">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      {t("certIssuer")}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      {/* CARD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 relative overflow-hidden animate-ticket space-y-6 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t("modalRechargeTitle")}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{t("selectRechargeAmount")}</p>
                </div>
              </div>
              
              {paymentStep !== 2 && (
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            {paymentStep === 1 && (
              <form onSubmit={handleProcessRecharge} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Package + Form */}
                <div className="space-y-6">
                  
                  {/* Packages */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {t("selectRechargeAmount")}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { amount: 50, price: "5,000 KRW", badge: "Basic", color: "border-emerald-200 bg-emerald-50/20 text-emerald-800" },
                        { amount: 100, price: "9,000 KRW", badge: "-10%", color: "border-blue-200 bg-blue-50/20 text-blue-800" },
                        { amount: 200, price: "16,000 KRW", badge: "-20%", color: "border-yellow-200 bg-yellow-50/20 text-yellow-800" }
                      ].map((pkg) => (
                        <button
                          key={pkg.amount}
                          type="button"
                          onClick={() => setSelectedAmount(pkg.amount)}
                          className={`p-3 rounded-2xl border text-center relative flex flex-col justify-between h-24 transition-all cursor-pointer ${
                            selectedAmount === pkg.amount
                              ? "border-blue-600 bg-blue-50/30 scale-[1.02] shadow-sm"
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
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5">
                      {t("cardDetails")}
                    </label>

                    {/* Card Number */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500">{t("cardNumber")}</span>
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
                        <span className="text-[10px] font-black text-slate-500">{t("cardExpiry")}</span>
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
                        <span className="text-[10px] font-black text-slate-500">{t("cardCvv")}</span>
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
                      <span className="text-[10px] font-black text-slate-500">{t("cardHolder")}</span>
                      <input
                        type="text"
                        required
                        placeholder="KIDZANIA TRAINEE"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
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
                    <div className="text-base sm:text-lg font-mono tracking-widest font-bold my-2 drop-shadow-md">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    {/* Cardholder name and Expiry */}
                    <div className="flex justify-between items-end">
                      <div className="min-w-0">
                        <span className="text-[7px] text-white/50 block font-mono font-black uppercase tracking-wider leading-none">Card Holder</span>
                        <span className="text-[10px] font-bold font-mono tracking-wide truncate block mt-1 uppercase">
                          {cardholderName || "CARDHOLDER NAME"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-white/50 block font-mono font-black uppercase tracking-wider leading-none">Expires</span>
                        <span className="text-[10px] font-bold font-mono tracking-wider block mt-1">
                          {expiryDate || "MM/YY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-450 font-bold">
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
                      ? `성공적으로 결제되었습니다. ${selectedAmount} 키조가 충전되어 총 ${parentWallet} 키조가 되었습니다.` 
                      : `Payment processed. ${selectedAmount} KidZos added. Total balance is now ${parentWallet} KidZos.`
                    }
                  </p>
                </div>

                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-md transition-colors"
                >
                  {lang === "KOR" ? "라운지로 돌아가기" : "Return to Lounge"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      </main>

      {/* Footer */}
      <footer className="no-print w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-[9px] text-slate-505 border-t border-slate-205 mt-10">
        <p>© 2026 KidZania Pop Music Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}
