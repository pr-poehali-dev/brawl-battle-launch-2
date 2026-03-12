import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { bbApi } from "@/lib/bbApi";

/* ─── TYPES ─────────────────────────────────────────────────────── */
type Tab = "home" | "profile" | "shop" | "events" | "giveaway" | "rewards" | "settings";

interface User {
  id: number;
  name: string;
  crystals: number;
  coins: number;
  beautyPoints: number;
  level: number;
  xp: number;
  xpMax: number;
  joinedAt: string;
  titles: string[];
  activeTitle: string;
  profileIcon: string;
  vipStyle: boolean;
  heartCollected: boolean;
  letterCollected: boolean;
  dailyGiftAt: string | null;
}

function apiUserToUser(u: Record<string, unknown>): User {
  return {
    id: u.id as number,
    name: u.username as string,
    crystals: u.crystals as number,
    coins: u.coins as number,
    beautyPoints: u.beauty_points as number,
    level: u.level as number,
    xp: u.xp as number,
    xpMax: u.xp_max as number,
    joinedAt: u.created_at ? new Date(u.created_at as string).toLocaleDateString("ru-RU") : "",
    titles: (u.titles as string[]) || [],
    activeTitle: (u.active_title as string) || "",
    profileIcon: (u.profile_icon as string) || "🎮",
    vipStyle: u.vip_style as boolean,
    heartCollected: u.heart_collected as boolean,
    letterCollected: u.letter_collected as boolean,
    dailyGiftAt: (u.daily_gift_at as string) || null,
  };
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

/* ─── CONSTANTS ─────────────────────────────────────────────────── */
const LAUNCH_DATE = new Date("2026-03-12T22:40:00");

const SHOP_ITEMS = [
  {
    id: 1,
    name: "Мини-сундук открытия",
    emoji: "🎁",
    price: 5,
    currency: "crystals",
    maxBuy: 3,
    availableAt: "22:45",
    gradient: "from-purple-600 to-pink-600",
    glow: "rgba(139,92,246,0.4)",
    prizes: [
      { name: "50 кристаллов", chance: 5, emoji: "💎" },
      { name: "VIP оформление", chance: 5, emoji: "👑" },
      { name: "Титул", chance: 50, emoji: "🏷️" },
      { name: "5 кристаллов", chance: 40, emoji: "✨" },
    ],
  },
  {
    id: 2,
    name: "Цепочка акций",
    emoji: "⛓️",
    price: 10,
    currency: "crystals",
    maxBuy: 1,
    availableAt: "22:50",
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(255,165,0,0.4)",
    stages: [
      { time: "22:45", reward: "10 кристаллов", emoji: "💎" },
      { time: "11:00 (13 марта)", reward: "10 кристаллов", emoji: "💎" },
      { time: "22:00 (13 марта)", reward: "Золотая иконка", emoji: "🌟" },
      { time: "11:00 (14 марта)", reward: 'Иконка "Открытие"', emoji: "🎊" },
      { time: "22:30 (14 марта)", reward: "25 кристаллов", emoji: "💎" },
    ],
  },
];

const CRYSTAL_PRICES = [
  { amount: 30, price: 15 },
  { amount: 120, price: 50 },
  { amount: 250, price: 100 },
  { amount: 500, price: 125 },
  { amount: 1000, price: 250 },
];

const EVENT_MILESTONES = [
  { users: 500, reward: "Розыгрыш 30 гемов", icon: "💎", reached: false },
  { users: 50, sub: true, reward: "Розыгрыш 30 гемов", icon: "🎬", reached: false },
  { users: 1000, reward: "Спонсорство 72 часа", icon: "🏆", reached: false },
  { users: 100, sub: true, reward: "Розыгрыш 80 гемов", icon: "🎯", reached: false },
];

/* ─── PARTICLES COMPONENT ───────────────────────────────────────── */
function Particles({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 4 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
    color: ["#FFD700", "#8B5CF6", "#00E5FF", "#FF006E", "#39FF14"][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            bottom: "0",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}

/* ─── FIREWORKS COMPONENT ───────────────────────────────────────── */
function Fireworks() {
  const [rockets, setRockets] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ["#FFD700", "#8B5CF6", "#00E5FF", "#FF006E", "#39FF14", "#FF6B00"];
    const interval = setInterval(() => {
      const id = Date.now();
      setRockets((prev) => [
        ...prev.slice(-20),
        { id, x: 10 + Math.random() * 80, y: 5 + Math.random() * 50, color: colors[Math.floor(Math.random() * colors.length)] },
      ]);
      setTimeout(() => setRockets((prev) => prev.filter((r) => r.id !== id)), 2000);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {rockets.map((r) => (
        <div key={r.id} style={{ position: "absolute", left: `${r.x}%`, top: `${r.y}%` }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: r.color,
                boxShadow: `0 0 8px ${r.color}`,
                transform: `rotate(${i * 30}deg) translateX(0)`,
                animation: `explode 1s ease-out ${i * 0.02}s forwards`,
                transformOrigin: "50% 50%",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── FLOATING LETTERS ──────────────────────────────────────────── */
function FloatingLetters({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute font-russo text-4xl font-bold text-gold text-glow-gold"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${10 + Math.random() * 70}%`,
            animationDelay: `${i * 0.3}s`,
            animation: `letter-float ${3 + Math.random() * 2}s ease-in-out infinite ${i * 0.3}s`,
            opacity: 0.7 + Math.random() * 0.3,
          }}
        >
          B
        </div>
      ))}
    </div>
  );
}

/* ─── SOCIAL ICONS ANIMATION ────────────────────────────────────── */
function SocialBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const icons = ["📺", "📱", "🎵", "📺", "📱", "🎵", "📺", "📱"];
  return (
    <div className="fixed inset-0 pointer-events-none z-45 overflow-hidden">
      {icons.map((icon, i) => (
        <div
          key={i}
          className="absolute text-3xl"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 85}%`,
            animation: `float ${2 + Math.random() * 2}s ease-in-out infinite ${i * 0.4}s`,
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
}

/* ─── COUNTDOWN TIMER ───────────────────────────────────────────── */
function CountdownTimer({ onLaunch }: { onLaunch: () => void }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [launched, setLaunched] = useState(false);
  const launchedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = LAUNCH_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (!launchedRef.current) {
          launchedRef.current = true;
          setLaunched(true);
          onLaunch();
        }
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onLaunch]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (launched) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07040f]">
      <Particles count={40} />
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">
        <div className="animate-float">
          <h1 className="font-russo text-5xl md:text-7xl text-gold text-glow-gold mb-2 tracking-widest">
            BRAWL BATTLE
          </h1>
          <p className="text-white/60 font-rubik text-lg md:text-xl tracking-wide">
            Торжественное открытие через...
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {[
            { val: pad(timeLeft.hours), label: "ЧАСОВ" },
            { val: pad(timeLeft.minutes), label: "МИНУТ" },
            { val: pad(timeLeft.seconds), label: "СЕКУНД" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 md:gap-6">
              <div className="flex flex-col items-center">
                <div
                  className="glass-purple neon-glow-purple rounded-2xl px-4 md:px-8 py-4 md:py-6 min-w-[80px] md:min-w-[120px]"
                  style={{ perspective: "500px" }}
                >
                  <span
                    key={item.val}
                    className="font-russo text-4xl md:text-7xl text-white block text-center"
                    style={{ animation: "number-tick 0.2s ease-out" }}
                  >
                    {item.val}
                  </span>
                </div>
                <span className="text-white/40 text-xs md:text-sm font-rubik mt-2 tracking-widest">
                  {item.label}
                </span>
              </div>
              {idx < 2 && (
                <span className="font-russo text-3xl md:text-5xl text-grape opacity-80 animate-pulse">
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl px-6 py-4 max-w-sm text-center">
          <p className="text-white/70 text-sm font-rubik leading-relaxed">
            🎊 Ивенты, розыгрыши, кристаллы и первые подарки — сразу после старта!
          </p>
        </div>

        <div className="flex gap-4 mt-2">
          <a
            href="https://t.me/brawlbattle397"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-purple rounded-full px-5 py-2 text-white text-sm font-rubik font-medium hover:scale-105 transition-transform"
          >
            📱 Telegram
          </a>
          <a
            href="https://youtube.com/@brawlbattle-o2c"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-gold rounded-full px-5 py-2 text-gold text-sm font-rubik font-medium hover:scale-105 transition-transform"
          >
            📺 YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── AUTH MODAL ────────────────────────────────────────────────── */
function AuthModal({
  onLogin,
}: {
  onLogin: (user: User) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !pass.trim()) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fn = mode === "register" ? bbApi.register : bbApi.login;
      const data = await fn(name.trim(), pass);
      if (data.error) {
        setError(data.error);
        return;
      }
      onLogin(apiUserToUser(data.user));
    } catch {
      setError("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07040f]/95 backdrop-blur-sm">
      <div className="glass-purple neon-glow-purple rounded-3xl p-8 w-full max-w-md mx-4 animate-scale-in">
        <h2 className="font-russo text-3xl text-gold text-glow-gold text-center mb-2">
          BRAWL BATTLE
        </h2>
        <p className="text-white/50 text-center text-sm font-rubik mb-8">
          {mode === "login" ? "Войди в аккаунт" : "Создай аккаунт"}
        </p>

        <div className="flex gap-2 glass rounded-xl p-1 mb-6">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg font-rubik text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? "gradient-purple text-white shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {m === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Имя пользователя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass rounded-xl px-4 py-3 text-white font-rubik placeholder-white/30 focus:outline-none focus:border-purple-500 border border-white/10 focus:border-grape bg-transparent"
          />
          <input
            type="password"
            placeholder={mode === "login" ? "Пароль" : "Придумай пароль"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="glass rounded-xl px-4 py-3 text-white font-rubik placeholder-white/30 focus:outline-none border border-white/10 focus:border-grape bg-transparent"
          />
          {error && <p className="text-red-400 text-sm font-rubik text-center">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="gradient-purple neon-glow-purple rounded-xl py-3 font-russo text-white text-lg hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "⏳ ЗАГРУЗКА..." : mode === "login" ? "ВОЙТИ" : "НАЧАТЬ"}
          </button>
        </div>

        {mode === "login" && (
          <p className="text-white/30 text-xs text-center mt-4 font-rubik">
            Для администраторов: пароль BBATTLE
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── NAV BAR ───────────────────────────────────────────────────── */
function NavBar({ tab, setTab, user }: { tab: Tab; setTab: (t: Tab) => void; user: User }) {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home", icon: "🏠", label: "Главная" },
    { id: "profile", icon: "👤", label: "Профиль" },
    { id: "shop", icon: "🛒", label: "Магазин" },
    { id: "events", icon: "⚡", label: "Ивенты" },
    { id: "giveaway", icon: "🎰", label: "Розыгрыши" },
    { id: "rewards", icon: "🏆", label: "Награды" },
    { id: "settings", icon: "⚙️", label: "Настройки" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 px-2 py-2">
      <div className="flex justify-around max-w-lg mx-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[44px] ${
              tab === t.id
                ? "scale-110"
                : "opacity-50 hover:opacity-80"
            }`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span
              className={`text-[9px] font-rubik font-medium leading-none ${
                tab === t.id ? "text-gold" : "text-white/60"
              }`}
            >
              {t.label}
            </span>
            {tab === t.id && (
              <div className="w-4 h-0.5 rounded-full gradient-gold mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── HOME PAGE ─────────────────────────────────────────────────── */
function HomePage({ user, setUser, launched }: { user: User; setUser: (u: User) => void; launched: boolean }) {
  const [showHeartPrize, setShowHeartPrize] = useState(false);
  const [showLetterPrize, setShowLetterPrize] = useState(false);
  const [dailyMsg, setDailyMsg] = useState("");

  const collectHeart = async () => {
    if (user.heartCollected) return;
    const data = await bbApi.collectGift(user.id, "heart");
    if (data.user) { setUser(apiUserToUser(data.user)); setShowHeartPrize(true); setTimeout(() => setShowHeartPrize(false), 3000); }
  };

  const collectLetter = async () => {
    if (user.letterCollected || !user.heartCollected) return;
    const data = await bbApi.collectGift(user.id, "letter");
    if (data.user) { setUser(apiUserToUser(data.user)); setShowLetterPrize(true); setTimeout(() => setShowLetterPrize(false), 3000); }
  };

  const claimDaily = async () => {
    const data = await bbApi.dailyGift(user.id);
    if (data.user) { setUser(apiUserToUser(data.user)); setDailyMsg(`+${data.reward} монет!`); setTimeout(() => setDailyMsg(""), 3000); }
    else if (data.error) { setDailyMsg(data.error); setTimeout(() => setDailyMsg(""), 3000); }
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-russo text-2xl text-white">
            Привет, <span className="text-gold text-glow-gold">{user.name}</span>!
          </h1>
          {user.activeTitle && (
            <span className="text-xs font-rubik text-grape">{user.activeTitle}</span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="glass-gold rounded-xl px-3 py-1.5 flex items-center gap-1">
            <span className="text-sm">💎</span>
            <span className="text-gold text-sm font-russo">{user.crystals}</span>
          </div>
          <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-1">
            <span className="text-sm">🪙</span>
            <span className="text-white text-sm font-russo">{user.coins}</span>
          </div>
        </div>
      </div>

      {launched ? (
        <>
          <div className="glass rounded-3xl p-6 mb-4 relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 animate-shimmer opacity-30" />
            <h2 className="font-russo text-xl text-gold text-glow-gold mb-4 text-center">
              🎊 САЙТ ОТКРЫТ! 🎊
            </h2>
            <p className="text-white/70 font-rubik text-center text-sm mb-4">
              Добро пожаловать в Brawl Battle! Собери первые подарки открытия.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={collectHeart}
                disabled={user.heartCollected}
                className={`relative rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 card-3d ${
                  user.heartCollected
                    ? "glass opacity-50 cursor-not-allowed"
                    : "glass-purple neon-glow-purple hover:scale-105 active:scale-95"
                }`}
              >
                <span className="text-5xl animate-float">{user.heartCollected ? "✅" : "💖"}</span>
                <span className="font-russo text-sm text-white">Star Сердце</span>
                <span className="text-xs text-white/50 font-rubik">Шанс на призы!</span>
              </button>

              <button
                onClick={collectLetter}
                disabled={user.letterCollected || !user.heartCollected}
                className={`relative rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 card-3d ${
                  user.letterCollected
                    ? "glass opacity-50 cursor-not-allowed"
                    : user.heartCollected
                    ? "glass-gold neon-glow-gold hover:scale-105 active:scale-95"
                    : "glass opacity-40 cursor-not-allowed"
                }`}
              >
                <span
                  className="text-5xl font-russo text-gold text-glow-gold"
                  style={user.heartCollected ? { animation: "letter-float 2s ease-in-out infinite" } : {}}
                >
                  {user.letterCollected ? "✅" : "Б"}
                </span>
                <span className="font-russo text-sm text-white">Star Буква Б</span>
                <span className="text-xs text-white/50 font-rubik">Бонусы профиля!</span>
              </button>
            </div>
          </div>

          {showHeartPrize && (
            <div className="glass-purple neon-glow-purple rounded-2xl p-4 mb-4 text-center animate-bounce-in">
              <p className="font-russo text-gold text-glow-gold text-lg">💖 Star Сердце получено!</p>
              <p className="text-white/70 text-sm font-rubik mt-1">Удача открыта — жди результаты розыгрыша!</p>
            </div>
          )}

          {showLetterPrize && (
            <div className="glass-gold neon-glow-gold rounded-2xl p-4 mb-4 text-center animate-bounce-in">
              <p className="font-russo text-gold text-glow-gold text-lg">✨ Star Буква Б получена!</p>
              <p className="text-white/70 text-sm font-rubik mt-1">Профиль украшен! Участвуй в розыгрышах.</p>
            </div>
          )}
        </>
      ) : (
        <div className="glass-purple neon-glow-purple rounded-3xl p-6 mb-4 text-center animate-fade-in">
          <div className="text-6xl mb-3 animate-float">⏳</div>
          <h2 className="font-russo text-xl text-white mb-2">Скоро открытие!</h2>
          <p className="text-white/60 font-rubik text-sm">
            Сайт откроется 12 марта в 22:40. Подарки и ивенты уже ждут тебя!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass rounded-2xl p-4 card-3d">
          <div className="text-2xl mb-1">✨</div>
          <div className="font-russo text-white text-sm">{user.beautyPoints}</div>
          <div className="text-white/50 text-xs font-rubik">Очки красоты</div>
        </div>
        <div className="glass rounded-2xl p-4 card-3d">
          <div className="text-2xl mb-1">🎯</div>
          <div className="font-russo text-white text-sm">Уровень {user.level}</div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
            <div
              className="gradient-purple h-1.5 rounded-full transition-all"
              style={{ width: `${(user.xp / user.xpMax) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="font-russo text-white text-sm mb-3">📢 Социальные сети</h3>
        <div className="flex gap-3">
          <a
            href="https://t.me/brawlbattle397"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 glass-purple rounded-xl py-3 text-center font-rubik text-sm text-white hover:scale-105 transition-transform"
          >
            📱 Telegram
          </a>
          <a
            href="https://youtube.com/@brawlbattle-o2c"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 glass-gold rounded-xl py-3 text-center font-rubik text-sm text-gold hover:scale-105 transition-transform"
          >
            📺 YouTube
          </a>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="font-russo text-white text-sm mb-3">🎁 Ежедневный подарок</h3>
        {dailyMsg && (
          <p className={`text-center text-sm font-rubik mb-2 ${dailyMsg.includes("+") ? "text-gold" : "text-red-400"}`}>
            {dailyMsg}
          </p>
        )}
        <button
          onClick={claimDaily}
          className="w-full gradient-purple neon-glow-purple rounded-xl py-3 font-russo text-white hover:scale-105 active:scale-95 transition-transform"
        >
          ОТКРЫТЬ ПОДАРОК
        </button>
      </div>
    </div>
  );
}

/* ─── PROFILE PAGE ──────────────────────────────────────────────── */
function ProfilePage({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="font-russo text-2xl text-white mb-6">Профиль</h1>

      <div className="glass-purple neon-glow-purple rounded-3xl p-6 mb-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer opacity-20" />
        <div className="relative">
          {user.vipStyle ? (
            <div className="relative inline-block">
              <div
                className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center text-4xl mx-auto mb-3 animate-spin-slow"
                style={{ boxShadow: "0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.2)" }}
              >
                {user.profileIcon}
              </div>
              <div className="absolute -top-1 -right-1 text-xl">👑</div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full glass-gold flex items-center justify-center text-4xl mx-auto mb-3">
              {user.profileIcon}
            </div>
          )}

          <h2 className="font-russo text-2xl text-white">{user.name}</h2>
          {user.activeTitle && (
            <span className="inline-block glass-gold rounded-full px-3 py-1 text-xs text-gold font-rubik mt-1">
              {user.activeTitle}
            </span>
          )}
          <p className="text-white/40 text-xs font-rubik mt-1">Дата регистрации: {user.joinedAt}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: "💎", val: user.crystals, label: "Кристаллы" },
          { icon: "🪙", val: user.coins, label: "Монеты" },
          { icon: "✨", val: user.beautyPoints, label: "Красота" },
        ].map((item) => (
          <div key={item.label} className="glass rounded-2xl p-3 text-center card-3d">
            <div className="text-2xl">{item.icon}</div>
            <div className="font-russo text-white text-lg">{item.val}</div>
            <div className="text-white/50 text-xs font-rubik">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-russo text-white text-sm">Уровень {user.level}</span>
          <span className="text-white/50 text-xs font-rubik">
            {user.xp} / {user.xpMax} XP
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className="gradient-purple neon-glow-purple h-3 rounded-full transition-all duration-500"
            style={{ width: `${(user.xp / user.xpMax) * 100}%` }}
          />
        </div>
      </div>

      {user.vipStyle && (
        <div className="glass-gold neon-glow-gold rounded-2xl p-4 mb-4 text-center">
          <span className="font-russo text-gold text-glow-gold">👑 VIP Оформление активно</span>
          <p className="text-white/60 text-xs font-rubik mt-1">Твой профиль сияет золотом!</p>
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <h3 className="font-russo text-white text-sm mb-3">🏷️ Титулы</h3>
        {user.titles.length === 0 ? (
          <p className="text-white/40 text-sm font-rubik text-center py-2">
            Пока нет титулов. Участвуй в ивентах!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.titles.map((t) => (
              <span key={t} className="glass-purple rounded-full px-3 py-1 text-xs text-white font-rubik">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SHOP PAGE ─────────────────────────────────────────────────── */
function ShopPage({ user, setUser, launched }: { user: User; setUser: (u: User) => void; launched: boolean }) {
  const [openResult, setOpenResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buyItem = async (item: typeof SHOP_ITEMS[0]) => {
    if (loading || user.crystals < item.price) return;
    setLoading(true);
    const data = await bbApi.buyItem(user.id, item.id);
    setLoading(false);
    if (data.error) { setOpenResult("❌ " + data.error); setTimeout(() => setOpenResult(null), 3000); return; }
    if (data.user) setUser(apiUserToUser(data.user));
    setOpenResult(data.prize || "Приз получен!");
    setTimeout(() => setOpenResult(null), 3000);
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="font-russo text-2xl text-white mb-2">Магазин</h1>
      <p className="text-white/50 text-sm font-rubik mb-6">Акции и особые предложения</p>

      {openResult && (
        <div className="glass-gold neon-glow-gold rounded-2xl p-4 mb-4 text-center animate-bounce-in">
          <p className="text-2xl mb-1">🎊</p>
          <p className="font-russo text-gold text-glow-gold">Выпало: {openResult}</p>
        </div>
      )}

      {!launched && (
        <div className="glass rounded-2xl p-4 mb-4 text-center">
          <p className="text-white/50 text-sm font-rubik">⏳ Магазин откроется в 22:45 после старта сайта</p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        {SHOP_ITEMS.map((item) => {
          const canBuy = launched && !loading && user.crystals >= item.price;

          return (
            <div
              key={item.id}
              className="glass rounded-3xl p-5 card-3d border border-purple-500/30"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl flex-shrink-0`}
                  style={{ boxShadow: `0 0 20px ${item.glow}` }}
                >
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-russo text-white text-base">{item.name}</h3>
                  <p className="text-white/40 text-xs font-rubik">
                    Доступно с {item.availableAt} · Макс. {item.maxBuy} шт.
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm">💎</span>
                    <span className="text-gold font-russo text-sm">{item.price} кристаллов</span>
                  </div>
                </div>
              </div>

              {"prizes" in item && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.prizes.map((p) => (
                    <span
                      key={p.name}
                      className="glass rounded-full px-2.5 py-1 text-xs text-white/70 font-rubik flex items-center gap-1"
                    >
                      {p.emoji} {p.name} — {p.chance}%
                    </span>
                  ))}
                </div>
              )}

              {"stages" in item && (
                <div className="flex flex-col gap-2 mb-4">
                  {item.stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm">{s.emoji}</span>
                      <span className="text-white/60 text-xs font-rubik flex-1">{s.time}</span>
                      <span className="text-white text-xs font-rubik">{s.reward}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => buyItem(item)}
                disabled={!canBuy}
                className={`w-full py-3 rounded-xl font-russo text-sm transition-all duration-200 ${
                  canBuy
                    ? `bg-gradient-to-r ${item.gradient} text-white hover:scale-105 active:scale-95`
                    : "glass text-white/30 cursor-not-allowed"
                }`}
              >
                {loading ? "⏳" : !launched ? "СКОРО" : user.crystals < item.price ? "НЕТ КРИСТАЛЛОВ" : "КУПИТЬ"}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="font-russo text-xl text-white mb-4">💎 Купить кристаллы</h2>
      <div className="grid grid-cols-2 gap-3">
        {CRYSTAL_PRICES.map((c) => (
          <div key={c.amount} className="glass-gold rounded-2xl p-4 card-3d text-center">
            <div className="text-3xl mb-1">💎</div>
            <div className="font-russo text-gold text-glow-gold text-xl">{c.amount}</div>
            <div className="text-white/60 text-xs font-rubik mb-3">кристаллов</div>
            <button className="gradient-gold rounded-xl px-4 py-2 text-[#07040f] font-russo text-sm w-full hover:scale-105 active:scale-95 transition-transform">
              {c.price} ₽
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── EVENTS PAGE ───────────────────────────────────────────────── */
function EventsPage({ launched }: { launched: boolean }) {
  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="font-russo text-2xl text-white mb-2">Ивенты</h1>
      <p className="text-white/50 text-sm font-rubik mb-6">Выполняй задания — получай награды</p>

      <div className="glass-purple neon-glow-purple rounded-3xl p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer opacity-20" />
        <h3 className="font-russo text-gold text-glow-gold text-lg mb-4 relative">
          🚀 Ивент Открытия
        </h3>
        <div className="flex flex-col gap-3 relative">
          {EVENT_MILESTONES.map((m, i) => (
            <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-rubik">
                  {m.sub ? `${m.users} подписчиков YouTube` : `${m.users} пользователей`}
                </p>
                <p className="text-gold text-xs font-rubik">{m.reward}</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  m.reached ? "gradient-gold text-[#07040f]" : "glass border border-white/20 text-white/30"
                }`}
              >
                {m.reached ? "✓" : "○"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-4">
        <h3 className="font-russo text-white text-base mb-3">📅 Расписание</h3>
        <div className="flex flex-col gap-2">
          {[
            { time: "22:40", event: "🎊 Официальное открытие", active: launched },
            { time: "22:45", event: "🎁 Мини-сундук в магазине", active: false },
            { time: "22:50", event: "⛓️ Цепочка акций", active: false },
            { time: "23:00", event: "🎁 Ежедневные подарки", active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl p-3 ${
                item.active ? "glass-purple border border-grape/30" : "glass"
              }`}
            >
              <span
                className={`font-russo text-sm min-w-[50px] ${
                  item.active ? "text-gold text-glow-gold" : "text-white/40"
                }`}
              >
                {item.time}
              </span>
              <span className="text-white/80 text-sm font-rubik">{item.event}</span>
              {item.active && (
                <span className="ml-auto text-xs text-neon-green font-rubik font-medium">СЕЙЧАС</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-russo text-white text-base mb-3">📺 YouTube задания</h3>
        <div className="flex flex-col gap-3">
          {[
            { task: "Подписаться на канал", reward: "10 монет", icon: "📺" },
            { task: "Смотреть видео 5 минут", reward: "5 монет", icon: "▶️" },
            { task: "Оставить комментарий", reward: "15 монет", icon: "💬" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{t.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-rubik">{t.task}</p>
                <p className="text-gold text-xs font-rubik">+{t.reward}</p>
              </div>
              <a
                href="https://youtube.com/@brawlbattle-o2c"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-gold rounded-lg px-3 py-1.5 text-gold text-xs font-rubik hover:scale-105 transition-transform"
              >
                Перейти
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── GIVEAWAY PAGE ─────────────────────────────────────────────── */
function GiveawayPage({ launched }: { launched: boolean }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    if (spinning || !launched) return;
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      const prizes = ["💎 30 гемов", "🌟 VIP статус", "🏆 Спонсорство", "🎁 50 кристаллов", "🪙 200 монет"];
      setResult(prizes[Math.floor(Math.random() * prizes.length)]);
      setSpinning(false);
    }, 2000);
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="font-russo text-2xl text-white mb-2">Розыгрыши</h1>
      <p className="text-white/50 text-sm font-rubik mb-6">Испытай удачу!</p>

      <div className="glass-purple neon-glow-purple rounded-3xl p-6 mb-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer opacity-20" />
        <h3 className="font-russo text-gold text-glow-gold text-lg mb-2 relative">Главный розыгрыш</h3>
        <p className="text-white/60 text-sm font-rubik mb-4 relative">Открытие сайта</p>

        <div
          className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 relative"
          style={{
            background: "conic-gradient(from 0deg, #FFD700, #8B5CF6, #00E5FF, #FF006E, #39FF14, #FFD700)",
            animation: spinning ? "spin-slow 0.5s linear infinite" : "none",
            boxShadow: "0 0 30px rgba(139,92,246,0.5)",
          }}
        >
          <div className="w-24 h-24 rounded-full glass flex items-center justify-center">
            {spinning ? (
              <span className="text-3xl" style={{ animation: "spin-slow 1s linear infinite" }}>🎰</span>
            ) : result ? (
              <span className="text-2xl font-russo text-white text-center px-2 leading-tight">{result}</span>
            ) : (
              <span className="text-4xl">🎲</span>
            )}
          </div>
        </div>

        {result && !spinning && (
          <p className="font-russo text-gold text-glow-gold text-lg mb-3 animate-bounce-in relative">
            🎊 {result}
          </p>
        )}

        <button
          onClick={spin}
          disabled={spinning || !launched}
          className={`relative px-8 py-3 rounded-xl font-russo text-white transition-all duration-200 ${
            !launched
              ? "glass text-white/30 cursor-not-allowed"
              : spinning
              ? "glass text-white/50 cursor-not-allowed"
              : "gradient-purple neon-glow-purple hover:scale-105 active:scale-95"
          }`}
        >
          {!launched ? "СКОРО" : spinning ? "КРУТИТСЯ..." : "КРУТИТЬ!"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-russo text-white text-base">📋 Активные розыгрыши</h3>

        {[
          {
            title: "Розыгрыш 30 гемов",
            condition: "500 пользователей",
            prize: "💎 30 гемов",
            progress: 0,
            total: 500,
            gradient: "from-purple-600 to-blue-600",
          },
          {
            title: "Розыгрыш 30 гемов",
            condition: "50 подписчиков YouTube",
            prize: "💎 30 гемов",
            progress: 0,
            total: 50,
            gradient: "from-red-600 to-orange-600",
          },
          {
            title: "Спонсорство 72ч",
            condition: "1000 пользователей",
            prize: "🏆 Спонсорство",
            progress: 0,
            total: 1000,
            gradient: "from-gold-dark to-yellow-500",
          },
          {
            title: "Розыгрыш 80 гемов",
            condition: "100 подписчиков YouTube",
            prize: "💎 80 гемов",
            progress: 0,
            total: 100,
            gradient: "from-emerald-600 to-teal-600",
          },
        ].map((r, i) => (
          <div key={i} className="glass rounded-2xl p-4 card-3d">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-russo text-white text-sm">{r.title}</h4>
                <p className="text-white/40 text-xs font-rubik">{r.condition}</p>
              </div>
              <span className="text-lg">{r.prize}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-1">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${r.gradient} transition-all`}
                style={{ width: `${(r.progress / r.total) * 100}%` }}
              />
            </div>
            <p className="text-white/40 text-xs font-rubik text-right">
              {r.progress} / {r.total}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── REWARDS PAGE ──────────────────────────────────────────────── */
function RewardsPage({ user }: { user: User }) {
  const achievements = [
    { icon: "🌟", name: "Первый шаг", desc: "Зарегистрировался", done: true },
    { icon: "💎", name: "Коллектор", desc: "Собери 100 кристаллов", done: user.crystals >= 100 },
    { icon: "📺", name: "Ютубер", desc: "Подпишись на YouTube", done: false },
    { icon: "💖", name: "Star Сердце", desc: "Собери первый подарок", done: false },
    { icon: "Б", name: "Star Буква", desc: "Собери букву Б", done: false },
    { icon: "🏆", name: "Победитель", desc: "Выиграй розыгрыш", done: false },
    { icon: "👑", name: "VIP", desc: "Получи VIP оформление", done: user.vipStyle },
    { icon: "🎯", name: "Уровень 5", desc: "Достигни 5-го уровня", done: user.level >= 5 },
  ];

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="font-russo text-2xl text-white mb-2">Награды</h1>
      <p className="text-white/50 text-sm font-rubik mb-6">Достижения и призы</p>

      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="font-russo text-white">Выполнено</span>
          <span className="text-gold font-russo">
            {achievements.filter((a) => a.done).length} / {achievements.length}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5 mt-2">
          <div
            className="gradient-gold h-2.5 rounded-full transition-all duration-500"
            style={{
              width: `${(achievements.filter((a) => a.done).length / achievements.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {achievements.map((a, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 text-center card-3d transition-all duration-300 ${
              a.done
                ? "glass-gold neon-glow-gold border border-gold/30"
                : "glass opacity-60"
            }`}
          >
            <div className={`text-3xl mb-2 font-russo ${a.done ? "" : "grayscale"}`}>
              {a.icon}
            </div>
            <p className={`font-russo text-xs ${a.done ? "text-gold" : "text-white/60"}`}>
              {a.name}
            </p>
            <p className="text-white/40 text-xs font-rubik mt-0.5">{a.desc}</p>
            {a.done && <div className="text-neon-green text-xs font-rubik mt-1">✓ Получено</div>}
          </div>
        ))}
      </div>

      <div className="glass-purple rounded-2xl p-4">
        <h3 className="font-russo text-white text-sm mb-3">🎁 Ежедневные награды</h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[10, 15, 20, 15, 25, 30, 50].map((coins, i) => (
            <div
              key={i}
              className={`flex-shrink-0 rounded-xl p-3 text-center min-w-[60px] ${
                i === 0 ? "gradient-gold border border-gold/40" : "glass"
              }`}
            >
              <p className="text-lg">🪙</p>
              <p className={`font-russo text-xs ${i === 0 ? "text-[#07040f]" : "text-white"}`}>
                {coins}
              </p>
              <p className={`text-xs font-rubik ${i === 0 ? "text-[#07040f]/70" : "text-white/40"}`}>
                Д.{i + 1}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SETTINGS PAGE ─────────────────────────────────────────────── */
function SettingsPage({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="font-russo text-2xl text-white mb-6">Настройки</h1>

      <div className="flex flex-col gap-3">
        <div className="glass rounded-2xl p-4">
          <h3 className="font-russo text-white text-sm mb-3">👤 Аккаунт</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/70 text-sm font-rubik">Имя</span>
              <span className="text-white font-russo text-sm">{user.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/70 text-sm font-rubik">Роль</span>
              <span className="text-gold text-sm font-rubik">
                {user.vipStyle ? "Администратор" : "Игрок"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/70 text-sm font-rubik">Дата регистрации</span>
              <span className="text-white/60 text-sm font-rubik">{user.joinedAt}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="font-russo text-white text-sm mb-3">🔗 Социальные сети</h3>
          <div className="flex flex-col gap-2">
            <a
              href="https://t.me/brawlbattle397"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2"
            >
              <span className="text-xl">📱</span>
              <span className="text-white/70 text-sm font-rubik flex-1">Telegram</span>
              <span className="text-grape text-xs font-rubik">t.me/brawlbattle397</span>
            </a>
            <a
              href="https://youtube.com/@brawlbattle-o2c"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2"
            >
              <span className="text-xl">📺</span>
              <span className="text-white/70 text-sm font-rubik flex-1">YouTube</span>
              <span className="text-grape text-xs font-rubik">@brawlbattle-o2c</span>
            </a>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="font-russo text-white text-sm mb-3">ℹ️ О проекте</h3>
          <div className="flex flex-col gap-2 text-sm font-rubik text-white/60">
            <p>Brawl Battle — игровая платформа с ивентами и розыгрышами.</p>
            <p>Версия: 1.0.0 — Открытие 12.03.2026</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="glass rounded-2xl p-4 text-center text-red-400 font-russo text-sm hover:bg-red-500/10 transition-colors"
        >
          🚪 Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────────────── */
export default function BrawlBattle() {
  const [launched, setLaunched] = useState(() => new Date() >= LAUNCH_DATE);
  const [showCountdown, setShowCountdown] = useState(() => new Date() < LAUNCH_DATE);
  const [user, setUser] = useState<User | null>(null);
  const setUserSafe = useCallback((u: User) => setUser(u), []);
  const [tab, setTab] = useState<Tab>("home");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showFloatingLetters, setShowFloatingLetters] = useState(false);
  const [showSocialBurst, setShowSocialBurst] = useState(false);

  const handleLaunch = useCallback(() => {
    setLaunched(true);
    setShowCountdown(false);
    setShowFireworks(true);
    setShowFloatingLetters(true);
    setShowSocialBurst(true);
    setTimeout(() => setShowFireworks(false), 10000);
    setTimeout(() => setShowFloatingLetters(false), 8000);
    setTimeout(() => setShowSocialBurst(false), 6000);
  }, []);

  if (showCountdown) {
    return <CountdownTimer onLaunch={handleLaunch} />;
  }

  if (!user) {
    return (
      <>
        <Particles count={25} />
        <AuthModal onLogin={setUserSafe} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#07040f] relative">
      <Particles count={20} />
      {showFireworks && <Fireworks />}
      <FloatingLetters active={showFloatingLetters} />
      <SocialBurst active={showSocialBurst} />

      <div className="relative z-10">
        {tab === "home" && <HomePage user={user} setUser={setUserSafe} launched={launched} />}
        {tab === "profile" && <ProfilePage user={user} setUser={setUserSafe} />}
        {tab === "shop" && <ShopPage user={user} setUser={setUserSafe} launched={launched} />}
        {tab === "events" && <EventsPage launched={launched} />}
        {tab === "giveaway" && <GiveawayPage launched={launched} />}
        {tab === "rewards" && <RewardsPage user={user} />}
        {tab === "settings" && <SettingsPage user={user} onLogout={() => setUser(null)} />}
      </div>

      <NavBar tab={tab} setTab={setTab} user={user} />
    </div>
  );
}