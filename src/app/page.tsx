"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Music, User, Award, ArrowRight, Activity, Sparkles, Heart, CreditCard } from "lucide-react";
import { translations, type Lang } from "./translations";
import { getDb, getLeaderboard, type Song } from "./db";
import { db as firestoreDb } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("KOR");
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState({
    releasedAlbums: 3,
    producersCount: 3,
    distributedKidzo: 24
  });

  useEffect(() => {
    // Load lang from localstorage if available
    const savedLang = localStorage.getItem("kidzania_lang") as Lang;
    if (savedLang) setLang(savedLang);

    // Load dynamic stats from local DB (fallback)
    const loadData = async () => {
      const db = getDb();
      const count = db.songs.length;
      const kids = db.children.length;
      const totalKidzo = db.children.reduce((acc, c) => acc + c.kidzoBalance, 0);

      setStats({
        releasedAlbums: count,
        producersCount: kids > 0 ? kids : 3,
        distributedKidzo: totalKidzo > 0 ? totalKidzo : 24
      });

      const leaderboard = await getLeaderboard();
      setTopSongs(leaderboard.slice(0, 5));
    };

    loadData();

    // Setup Firebase subscription if configured
    let unsubscribeSongs: any;
    let unsubscribeChildren: any;

    if (firestoreDb) {
      unsubscribeSongs = onSnapshot(collection(firestoreDb, "songs"), (snapshot) => {
        const songsList = snapshot.docs.map(doc => doc.data() as Song);
        
        setStats(prev => ({
          ...prev,
          releasedAlbums: songsList.length > 0 ? songsList.length : prev.releasedAlbums
        }));

        const sorted = [...songsList].sort((a, b) => {
          const scoreA = (a.purchases * 100) + (a.likes * 10) + a.score;
          const scoreB = (b.purchases * 100) + (b.likes * 10) + b.score;
          return scoreB - scoreA;
        });
        setTopSongs(sorted.slice(0, 5));
      });

      unsubscribeChildren = onSnapshot(collection(firestoreDb, "children"), (snapshot) => {
        const childrenList = snapshot.docs.map(doc => doc.data() as any);
        if (childrenList.length > 0) {
          const totalKidzo = childrenList.reduce((acc, c) => acc + (c.kidzoBalance || 0), 0);
          setStats(prev => ({
            ...prev,
            producersCount: childrenList.length,
            distributedKidzo: totalKidzo
          }));
        }
      });
    }

    return () => {
      if (unsubscribeSongs) unsubscribeSongs();
      if (unsubscribeChildren) unsubscribeChildren();
    };
  }, []);

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem("kidzania_lang", l);
    // Trigger storage event to sync other pages
    window.dispatchEvent(new Event("storage"));
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.["KOR"] || key;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      {/* Main Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Logo badge */}
          <div className="bg-[#002855] border-2 border-[#ffb703] px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/10">
            <span className="text-[#e63946] text-xl sm:text-2xl font-black italic tracking-tighter">KidZania</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffb703]" />
            <span className="text-white text-xs sm:text-sm font-black uppercase tracking-wider">Music Studio</span>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => handleLangChange("KOR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              lang === "KOR" ? "bg-[#ffb703] text-slate-950 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => handleLangChange("ENG")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              lang === "ENG" ? "bg-[#ffb703] text-slate-950 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            English
          </button>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center py-10 z-10">
        <div className="space-y-4 max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs sm:text-sm font-extrabold text-blue-600">
            <Activity className="w-3.5 h-3.5" />
            <span>K-Pop Producer Role-play Experience</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-slate-900">
            {t("brandTitle")}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e63946] via-[#ffb703] to-[#002855] text-glow-yellow">
              {lang === "KOR" ? "나만의 앨범 데뷔!" : "Your Original Album Debut!"}
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-650 leading-relaxed max-w-2xl mx-auto font-medium">
            {t("tagline")}
          </p>
        </div>
        {/* Portals Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-2">
          
          {/* Card 1: Kid Portal */}
          <div className="kiosk-card rounded-3xl p-6 flex flex-col justify-between items-stretch text-left relative overflow-hidden group border-2 border-slate-200 hover:border-red-500/45 hover:scale-[1.01] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/10 transition-all" />
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">
                🎸
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {lang === "KOR" ? "어린이 직업 체험관" : "Kid Studio"}
                  <span className="text-[10px] font-mono bg-red-50 border border-red-100 text-red-600 px-2 py-0.5 rounded-full">ACTIVE</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                  {lang === "KOR" 
                    ? "직업체험 보딩패스를 발급받아 작사, 작곡을 경험하고 나만의 K-Pop 앨범을 제작하여 8 키조를 벌어보세요!" 
                    : "Create lyrics/music, design album cover, and earn 8 KidZos as a pop musician!"}
                </p>
              </div>
            </div>
            
            <Link href="/kid" className="mt-8 py-3.5 rounded-2xl bg-[#e63946] hover:bg-[#e63946]/90 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/10 transition-all hover:scale-[1.01]">
              <span>{t("checkIn")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Parent Lounge */}
          <div className="kiosk-card rounded-3xl p-6 flex flex-col justify-between items-stretch text-left relative overflow-hidden group border-2 border-slate-200 hover:border-blue-500/45 hover:scale-[1.01] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
                ☕
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {lang === "KOR" ? "보호자 라운지" : "Parent Lounge"}
                  <span className="text-[10px] font-mono bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded-full">LOUNGE</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                  {lang === "KOR" 
                    ? "자녀의 체험 음원을 감상하고 키조 화폐로 구매/좋아요하여 아이를 후원하고 공식 체험 이수증을 인쇄하세요!" 
                    : "Listen to your child's track, buy with KidZos, and download their official experience certificate."}
                </p>
              </div>
            </div>

            <Link href="/parent" className="mt-8 py-3.5 rounded-2xl bg-[#002855] hover:bg-[#002855]/90 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-900/10 border border-blue-500/20 transition-all hover:scale-[1.01]">
              <span>{t("parentLounge")}</span>
              <User className="w-4 h-4 text-blue-300" />
            </Link>
          </div>

          {/* Card 3: Billboard Chart */}
          <div className="kiosk-card rounded-3xl p-6 flex flex-col justify-between items-stretch text-left relative overflow-hidden group border-2 border-slate-200 hover:border-yellow-500/45 hover:scale-[1.01] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-yellow-500/10 transition-all" />
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
                🏆
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {lang === "KOR" ? "실시간 빌보드 차트" : "Live Music Chart"}
                  <span className="text-[10px] font-mono bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full">RANKING</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                  {lang === "KOR" 
                    ? "키자니아 대중음악 연구소에서 발매된 모든 어린이들의 실시간 음원 순위와 완성도 높은 곡들을 플레이해보세요!" 
                    : "Check live charts of tracks composed by children and play high completeness songs."}
                </p>
              </div>
            </div>

            <Link href="/chart" className="mt-8 py-3.5 rounded-2xl bg-[#ffb703] hover:bg-[#ffb703]/90 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-900/10 transition-all hover:scale-[1.01]">
              <span>{t("musicChart")}</span>
              <Award className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Live Statistic Counter Panels */}
        <div className="mt-16 w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-250 flex flex-col sm:flex-row justify-around items-center gap-6 text-center shadow-md">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm text-slate-500 font-extrabold uppercase tracking-wider block">
              {lang === "KOR" ? "오늘 발매된 앨범 수" : "Albums Released Today"}
            </span>
            <strong className="text-2xl sm:text-3xl font-black text-[#e63946]">{stats.releasedAlbums}개</strong>
          </div>
          <div className="w-px h-10 bg-slate-200 hidden sm:block" />
          <div className="space-y-1">
            <span className="text-xs sm:text-sm text-slate-500 font-extrabold uppercase tracking-wider block">
              {lang === "KOR" ? "참여한 어린이 프로듀서" : "Kid Producers Registered"}
            </span>
            <strong className="text-2xl sm:text-3xl font-black text-[#ffb703]">{stats.producersCount}명</strong>
          </div>
          <div className="w-px h-10 bg-slate-200 hidden sm:block" />
          <div className="space-y-1">
            <span className="text-xs sm:text-sm text-slate-500 font-extrabold uppercase tracking-wider block">
              {lang === "KOR" ? "지급된 체험 키조 총액" : "KidZos Distributed"}
            </span>
            <strong className="text-2xl sm:text-3xl font-black text-blue-600">{stats.distributedKidzo} KidZos</strong>
          </div>
        </div>

        {/* Top 5 Leaderboard Preview */}
        <div className="mt-12 w-full max-w-4xl space-y-4 text-left">
          <div className="flex justify-between items-end border-b-2 border-slate-250 pb-2.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              🏆 {lang === "KOR" ? "실시간 인기 음원 TOP 5" : "Real-time Popular Tracks TOP 5"}
            </h2>
            <Link href="/chart" className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
              <span>{lang === "KOR" ? "전체 차트 및 재생하러 가기" : "View Full Chart & Play"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border-2 border-slate-250 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-150">
            {topSongs.length > 0 ? (
              topSongs.map((song, index) => {
                const totalScore = (song.purchases * 100) + (song.likes * 10) + song.score;
                const rank = index + 1;
                let rankBadge = <span className="text-sm font-black text-slate-400">{rank}</span>;
                if (rank === 1) rankBadge = <span className="text-lg">🥇</span>;
                else if (rank === 2) rankBadge = <span className="text-lg">🥈</span>;
                else if (rank === 3) rankBadge = <span className="text-lg">🥉</span>;

                return (
                  <div key={song.id} className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {rankBadge}
                    </div>

                    {/* Cover Art */}
                    <div 
                      className="w-12 h-12 rounded-xl p-1 relative flex flex-col justify-between text-[5px] font-black text-white shrink-0 shadow-sm border border-white/20"
                      style={{ background: song.coverBg }}
                    >
                      <span className="opacity-60 leading-none">KZ</span>
                      <span className="text-xs text-right leading-none">{song.sticker}</span>
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 truncate leading-snug">
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {song.author} • <span className="text-blue-600 font-bold">{song.genre}</span>
                      </p>
                    </div>

                    {/* Stats (Likes & Score) */}
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="hidden sm:block">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">LIKES</span>
                        <span className="text-xs font-bold text-slate-650">❤️ {song.likes}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("scoreLabel")}</span>
                        <span className="text-sm sm:text-base font-black text-amber-700">{totalScore.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 font-semibold text-xs sm:text-sm">
                ⚠️ {lang === "KOR" ? "아직 등록된 음원이 없습니다." : "No tracks released yet."}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Main Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-[10px] text-slate-500 border-t border-slate-200 z-10 mt-10">
        <p className="max-w-md mx-auto leading-normal">
          본 웹 서비스는 어린이 직업체험 브랜드 키자니아(KidZania) 서울/부산의 '대중음악가' 연구원 체험용 하이브리드 포털 시뮬레이터입니다.<br />
          © 2026 KidZania Pop Music Studio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
