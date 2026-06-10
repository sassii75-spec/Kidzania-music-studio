"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Play, Pause, Award, Sparkles, Heart, CreditCard, 
  Volume2, VolumeX, SkipBack, SkipForward, Activity 
} from "lucide-react";
import { translations, type Lang } from "../translations";
import { getLeaderboard, Song } from "../db";
import { db as firestoreDb } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

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

  useEffect(() => {
    // Load initial language
    const savedLang = localStorage.getItem("kidzania_lang") as Lang;
    if (savedLang) setLang(savedLang);

    // Initial leaderboard load
    const loadInitialData = async () => {
      const initialSongs = await getLeaderboard();
      setSongs(initialSongs);
      if (initialSongs.length > 0) {
        setSelectedSong(prev => prev ? (initialSongs.find(s => s.id === prev.id) || initialSongs[0]) : initialSongs[0]);
      }
    };
    loadInitialData();

    // Setup real-time listener if Firebase is configured
    let unsubscribe: any;
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
    }

    // Sync state on local storage events
    const handleStorageChange = async () => {
      const updatedLang = localStorage.getItem("kidzania_lang") as Lang;
      if (updatedLang) setLang(updatedLang);

      const latestSongs = await getLeaderboard();
      setSongs(latestSongs);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (unsubscribe) unsubscribe();
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
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
          {/* Header Title Badge */}
          <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-black text-blue-700 flex items-center gap-2 shadow-sm">
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
    </div>
  );
}
