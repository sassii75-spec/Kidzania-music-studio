import { db as firestoreDb } from "./firebase";
import { 
  doc, setDoc, getDoc, updateDoc, collection, getDocs, 
  query, where, increment, runTransaction 
} from "firebase/firestore";

export interface Child {
  name: string;
  age: number;
  ticketNumber: string;
  kidzoBalance: number;
  completedAt?: string;
}

export interface Song {
  id: string;
  title: string;
  author: string;
  age: number;
  genre: string;
  tempo: string;
  theme: string;
  mood: string;
  lyrics: string;
  coverBg: string;
  sticker: string;
  audioUrl: string;
  duration: string;
  durationSeconds: number;
  purchases: number;
  likes: number;
  score: number;
  registeredAt: string;
}

export interface Review {
  id: string;
  songId: string;
  rating: number; // 1 to 5
  comment: string;
  authorName: string;
  registeredAt: string;
}

export interface DatabaseState {
  children: Child[];
  songs: Song[];
  parentWallet: number;
  reviews?: Review[];
}

const DEFAULT_SONGS: Song[] = [
  {
    id: "seed-1",
    title: "Dreaming Sky (꿈꾸는 하늘)",
    author: "지민 (Ji-min)",
    age: 9,
    genre: "K-Pop Dance",
    tempo: "Fast",
    theme: "Dream",
    mood: "Energetic ⚡",
    lyrics: "[Verse 1]\nReaching for the stars in the deep blue night\nI will spread my wings and take my flight\n[Chorus]\nDreaming sky, up so high\nNothing can stop me, I can fly!",
    coverBg: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    sticker: "👑",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "2:15",
    durationSeconds: 135,
    purchases: 8,
    likes: 18,
    score: 80,
    registeredAt: "2026-06-09"
  },
  {
    id: "seed-2",
    title: "Friendship Train (우정 기차)",
    author: "도윤 (Do-yun)",
    age: 8,
    genre: "Synthwave",
    tempo: "Medium",
    theme: "Friendship",
    mood: "Happy 😊",
    lyrics: "[Verse 1]\nAll aboard the train, hold my hand tight\nWe will ride together through the morning light\n[Chorus]\nFriendship train, through the rain\nHappy smiles are here again!",
    coverBg: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    sticker: "🌟",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "2:45",
    durationSeconds: 165,
    purchases: 4,
    likes: 11,
    score: 92,
    registeredAt: "2026-06-09"
  },
  {
    id: "seed-3",
    title: "Sweet Puppy (달콤한 강아지)",
    author: "서윤 (Seo-yun)",
    age: 6,
    genre: "Acoustic Pop",
    tempo: "Slow",
    theme: "Play",
    mood: "Cool 😎",
    lyrics: "[Verse 1]\nFluffy little ears, wagging little tail\nRunning in the garden, running down the trail\n[Chorus]\nSweet little puppy, cute and small\nYou are the best friend of them all!",
    coverBg: "linear-gradient(135deg, #f59e0b, #ef4444)",
    sticker: "🐾",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: "3:00",
    durationSeconds: 180,
    purchases: 2,
    likes: 6,
    score: 85,
    registeredAt: "2026-06-10"
  }
];

export const getDb = (): DatabaseState => {
  if (typeof window === "undefined") {
    return { children: [], songs: DEFAULT_SONGS, parentWallet: 150, reviews: [] };
  }
  const data = localStorage.getItem("kidzania_music_db");
  if (!data) {
    const initialState = {
      children: [],
      songs: DEFAULT_SONGS,
      parentWallet: 150,
      reviews: []
    };
    localStorage.setItem("kidzania_music_db", JSON.stringify(initialState));
    return initialState;
  }
  try {
    const parsed = JSON.parse(data);
    if (!parsed.reviews) parsed.reviews = [];
    return parsed;
  } catch (e) {
    return { children: [], songs: DEFAULT_SONGS, parentWallet: 150, reviews: [] };
  }
};

export const saveDb = (db: DatabaseState) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("kidzania_music_db", JSON.stringify(db));
  }
};

export const registerChild = async (name: string, age: number): Promise<Child> => {
  const trimmedName = name.trim();
  if (firestoreDb) {
    try {
      const childDocRef = doc(firestoreDb, "children", trimmedName.toLowerCase());
      const childSnap = await getDoc(childDocRef);
      if (childSnap.exists()) {
        return childSnap.data() as Child;
      }
      const ticketNumber = "KZ-" + Math.floor(100000 + Math.random() * 900000);
      const newChild: Child = {
        name: trimmedName,
        age,
        ticketNumber,
        kidzoBalance: 20
      };
      await setDoc(childDocRef, newChild);
      return newChild;
    } catch (e) {
      console.error("Firestore registerChild failed, falling back to local:", e);
    }
  }

  // LocalStorage Fallback
  const db = getDb();
  const existing = db.children.find((c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
  if (existing) return existing;

  const ticketNumber = "KZ-" + Math.floor(100000 + Math.random() * 900000);
  const newChild: Child = {
    name: trimmedName,
    age,
    ticketNumber,
    kidzoBalance: 20
  };
  db.children.push(newChild);
  saveDb(db);
  return newChild;
};

export const getChildByName = async (name: string): Promise<Child | null> => {
  if (firestoreDb) {
    try {
      const childDocRef = doc(firestoreDb, "children", name.trim().toLowerCase());
      const childSnap = await getDoc(childDocRef);
      if (childSnap.exists()) {
        return childSnap.data() as Child;
      }
      return null;
    } catch (e) {
      console.error("Firestore getChildByName failed, falling back to local:", e);
    }
  }
  const db = getDb();
  return db.children.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()) || null;
};

export const getSongsByChild = async (name: string): Promise<Song[]> => {
  if (firestoreDb) {
    try {
      const songsRef = collection(firestoreDb, "songs");
      const q = query(songsRef, where("author", "==", name.trim()));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data() as Song);
    } catch (e) {
      console.error("Firestore getSongsByChild failed, falling back to local:", e);
    }
  }
  const db = getDb();
  return db.songs.filter((s) => s.author.trim().toLowerCase() === name.trim().toLowerCase());
};

export const publishSong = async (
  name: string, 
  songData: Omit<Song, "id" | "author" | "purchases" | "likes" | "score" | "registeredAt">
): Promise<Song> => {
  const songId = "song-" + Date.now();
  const registeredAt = new Date().toISOString().split("T")[0];
  const score = Math.floor(80 + Math.random() * 16);

  const newSong: Song = {
    ...songData,
    id: songId,
    author: name,
    purchases: 0,
    likes: 0,
    score,
    registeredAt
  };

  if (firestoreDb) {
    try {
      // 1. Save Song
      await setDoc(doc(firestoreDb, "songs", songId), newSong);

      // 2. Award KidZos
      const childDocRef = doc(firestoreDb, "children", name.trim().toLowerCase());
      const childSnap = await getDoc(childDocRef);
      if (childSnap.exists()) {
        await updateDoc(childDocRef, {
          kidzoBalance: increment(8),
          completedAt: registeredAt
        });
      }
      return newSong;
    } catch (e) {
      console.error("Firestore publishSong failed, falling back to local:", e);
    }
  }

  // LocalStorage Fallback
  const db = getDb();
  const child = db.children.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (child) {
    child.kidzoBalance += 8;
    child.completedAt = registeredAt;
  }
  db.songs.push(newSong);
  saveDb(db);
  return newSong;
};

export const purchaseSong = async (songId: string): Promise<{ success: boolean; msgKey: string }> => {
  if (firestoreDb) {
    try {
      const result = await runTransaction(firestoreDb, async (transaction) => {
        const walletRef = doc(firestoreDb!, "metadata", "parentWallet");
        const songRef = doc(firestoreDb!, "songs", songId);

        const walletSnap = await transaction.get(walletRef);
        const songSnap = await transaction.get(songRef);

        if (!songSnap.exists()) {
          throw new Error("songNotFound");
        }

        const balance = walletSnap.exists() ? walletSnap.data().balance : 150;
        if (balance < 10) {
          return { success: false, msgKey: "Wallet balance is too low!" };
        }

        // Deduct 10 from parent
        transaction.set(walletRef, { balance: balance - 10 });

        // Add 10 to kid
        const songData = songSnap.data() as Song;
        const childDocRef = doc(firestoreDb!, "children", songData.author.trim().toLowerCase());
        const childSnap = await transaction.get(childDocRef);
        if (childSnap.exists()) {
          transaction.update(childDocRef, {
            kidzoBalance: increment(10)
          });
        }

        // Increment purchase count
        transaction.update(songRef, {
          purchases: increment(1)
        });

        return { success: true, msgKey: "purchaseSuccess" };
      });
      return result;
    } catch (e) {
      console.error("Firestore purchaseSong failed, falling back to local:", e);
    }
  }

  // LocalStorage Fallback
  const db = getDb();
  const song = db.songs.find((s) => s.id === songId);
  if (!song) return { success: false, msgKey: "enterLoungeErr" };

  if (db.parentWallet < 10) {
    return { success: false, msgKey: "Wallet balance is too low!" };
  }

  db.parentWallet -= 10;
  const child = db.children.find((c) => c.name.trim().toLowerCase() === song.author.trim().toLowerCase());
  if (child) {
    child.kidzoBalance += 10;
  }
  song.purchases += 1;
  saveDb(db);
  return { success: true, msgKey: "purchaseSuccess" };
};

export const likeSong = async (songId: string): Promise<void> => {
  if (firestoreDb) {
    try {
      const songRef = doc(firestoreDb, "songs", songId);
      await updateDoc(songRef, {
        likes: increment(1)
      });
      return;
    } catch (e) {
      console.error("Firestore likeSong failed, falling back to local:", e);
    }
  }
  const db = getDb();
  const song = db.songs.find((s) => s.id === songId);
  if (song) {
    song.likes += 1;
    saveDb(db);
  }
};

export const topUpParentWallet = async (amount: number): Promise<number> => {
  if (firestoreDb) {
    try {
      const walletRef = doc(firestoreDb, "metadata", "parentWallet");
      const walletSnap = await getDoc(walletRef);
      const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 150;
      const newBalance = currentBalance + amount;
      await setDoc(walletRef, { balance: newBalance });
      return newBalance;
    } catch (e) {
      console.error("Firestore topUpParentWallet failed, falling back to local:", e);
    }
  }
  const db = getDb();
  db.parentWallet += amount;
  saveDb(db);
  return db.parentWallet;
};

export const getParentWallet = async (): Promise<number> => {
  if (firestoreDb) {
    try {
      const walletRef = doc(firestoreDb, "metadata", "parentWallet");
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        return walletSnap.data().balance;
      } else {
        await setDoc(walletRef, { balance: 150 });
        return 150;
      }
    } catch (e) {
      console.error("Firestore getParentWallet failed, falling back to local:", e);
    }
  }
  return getDb().parentWallet;
};

export const getLeaderboard = async (): Promise<Song[]> => {
  if (firestoreDb) {
    try {
      const snap = await getDocs(collection(firestoreDb, "songs"));
      const songs = snap.docs.map(doc => doc.data() as Song);
      return songs.sort((a, b) => {
        const scoreA = (a.purchases * 100) + (a.likes * 10) + a.score;
        const scoreB = (b.purchases * 100) + (b.likes * 10) + b.score;
        return scoreB - scoreA;
      });
    } catch (e) {
      console.error("Firestore getLeaderboard failed, falling back to local:", e);
    }
  }

  const db = getDb();
  return [...db.songs].sort((a, b) => {
    const scoreA = (a.purchases * 100) + (a.likes * 10) + a.score;
    const scoreB = (b.purchases * 100) + (b.likes * 10) + b.score;
    return scoreB - scoreA;
  });
};

export const addReview = async (
  songId: string,
  rating: number,
  comment: string,
  authorName: string
): Promise<Review> => {
  const newReview: Review = {
    id: "rev-" + Math.floor(100000 + Math.random() * 900000),
    songId,
    rating,
    comment: comment.trim(),
    authorName: authorName.trim() || "익명 보호자 (Anonymous Parent)",
    registeredAt: new Date().toISOString().split("T")[0]
  };

  if (firestoreDb) {
    try {
      const reviewDocRef = doc(firestoreDb, "reviews", newReview.id);
      await setDoc(reviewDocRef, newReview);
      return newReview;
    } catch (e) {
      console.error("Firestore addReview failed, falling back to local:", e);
    }
  }

  // LocalStorage Fallback
  const db = getDb();
  if (!db.reviews) {
    db.reviews = [];
  }
  db.reviews.push(newReview);
  saveDb(db);
  return newReview;
};

export const getReviewsBySong = async (songId: string): Promise<Review[]> => {
  if (firestoreDb) {
    try {
      const reviewsRef = collection(firestoreDb, "reviews");
      const q = query(reviewsRef, where("songId", "==", songId));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => doc.data() as Review);
      return list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    } catch (e) {
      console.error("Firestore getReviewsBySong failed, falling back to local:", e);
    }
  }

  const db = getDb();
  const list = db.reviews || [];
  return list
    .filter((r) => r.songId === songId)
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
};
