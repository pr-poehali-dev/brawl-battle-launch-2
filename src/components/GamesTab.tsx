import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const GAME_SCORES_URL = 'https://functions.poehali.dev/be3440bd-7b48-44a5-9e9b-442a9c17d5a8';

const GAME_META: Record<string, { unit: string; biggerIsBetter: boolean }> = {
  memory:    { unit: 'ходов',   biggerIsBetter: false },
  reaction:  { unit: 'мс',      biggerIsBetter: false },
  guess:     { unit: 'попыток', biggerIsBetter: false },
  tictactoe: { unit: 'побед',   biggerIsBetter: true  },
};

interface Leader { name: string; avatar_url: string | null; score: number; }

async function submitScore(game: string, score: number) {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  await fetch(GAME_SCORES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ game, score }),
  });
}

async function fetchLeaders(game: string): Promise<Leader[]> {
  const res = await fetch(`${GAME_SCORES_URL}?game=${game}`);
  const data = await res.json();
  return data.leaders || [];
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function Leaderboard({ game, refresh }: { game: string; refresh: number }) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const meta = GAME_META[game];

  useEffect(() => {
    setLoading(true);
    fetchLeaders(game).then(l => { setLeaders(l); setLoading(false); });
  }, [game, refresh]);

  if (loading) return <p className="text-xs text-muted-foreground text-center py-2">Загрузка...</p>;
  if (leaders.length === 0) return <p className="text-xs text-muted-foreground text-center py-2">Пока нет рекордов. Будь первым!</p>;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-1.5">
      {leaders.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-5 text-center text-base">{medals[i] || `${i + 1}`}</span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={l.avatar_url || ''} />
            <AvatarFallback className="text-[10px]">{l.name[0]}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate font-medium">{l.name}</span>
          <span className="text-muted-foreground text-xs">{l.score} {meta.unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Memory Game ────────────────────────────────────────────────────────────

const EMOJIS = ['🚀', '⭐', '💎', '🎯', '🔥', '🏆', '💡', '🎁'];

function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    const s = localStorage.getItem('memory_best');
    return s ? parseInt(s) : null;
  });
  const [lbRefresh, setLbRefresh] = useState(0);

  const init = useCallback(() => {
    const pairs = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setSelected([]);
    setMoves(0);
    setWon(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (selected.length === 2) {
      const [a, b] = selected;
      if (cards[a].emoji === cards[b].emoji) {
        setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
        setSelected([]);
      } else {
        const t = setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 900);
        return () => clearTimeout(t);
      }
    }
  }, [selected, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setWon(true);
      const isNew = bestScore === null || moves < bestScore;
      if (isNew) {
        setBestScore(moves);
        localStorage.setItem('memory_best', String(moves));
        submitScore('memory', moves).then(() => setLbRefresh(r => r + 1));
      }
    }
  }, [cards, moves, bestScore]);

  const flip = (i: number) => {
    if (selected.length === 2 || cards[i].flipped || cards[i].matched) return;
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, flipped: true } : c));
    setSelected(prev => [...prev, i]);
    if (selected.length === 1) setMoves(m => m + 1);
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">🃏 Memory</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">Ходов: {moves}</Badge>
            {bestScore !== null && <Badge variant="secondary">Мой рекорд: {bestScore}</Badge>}
            <Button size="sm" variant="ghost" onClick={init}>↺ Заново</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {won ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-4xl">🎉</p>
            <p className="font-semibold text-lg">Победа за {moves} ходов!</p>
            {bestScore === moves && <Badge className="bg-yellow-500 text-white">Новый рекорд!</Badge>}
            <Button onClick={init}>Играть ещё</Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {cards.map((card, i) => (
              <button
                key={card.id}
                onClick={() => flip(i)}
                className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all duration-300 border-2 select-none
                  ${card.flipped || card.matched ? 'bg-primary/10 border-primary/30 scale-95' : 'bg-muted border-muted-foreground/20 hover:border-primary/50 hover:scale-105 cursor-pointer'}
                  ${card.matched ? 'opacity-50' : ''}
                `}
              >
                {card.flipped || card.matched ? card.emoji : '❓'}
              </button>
            ))}
          </div>
        )}
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">🏆 Таблица лидеров</p>
          <Leaderboard game="memory" refresh={lbRefresh} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Reaction Game ───────────────────────────────────────────────────────────

function ReactionGame() {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'done' | 'early'>('idle');
  const [time, setTime] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(() => {
    const s = localStorage.getItem('reaction_best');
    return s ? parseInt(s) : null;
  });
  const [lbRefresh, setLbRefresh] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);

  const start = () => {
    setState('waiting');
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setState('ready');
      startRef.current = Date.now();
    }, delay);
  };

  const click = () => {
    if (state === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('early');
      return;
    }
    if (state === 'ready') {
      const elapsed = Date.now() - startRef.current;
      setTime(elapsed);
      setState('done');
      if (best === null || elapsed < best) {
        setBest(elapsed);
        localStorage.setItem('reaction_best', String(elapsed));
        submitScore('reaction', elapsed).then(() => setLbRefresh(r => r + 1));
      }
    }
  };

  const reset = () => { setState('idle'); setTime(null); };

  const bgMap: Record<string, string> = {
    idle: 'bg-muted hover:bg-muted/80',
    waiting: 'bg-red-500/20 cursor-pointer',
    ready: 'bg-green-500 cursor-pointer animate-pulse',
    done: 'bg-blue-500/20',
    early: 'bg-orange-500/20',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">⚡ Реакция</CardTitle>
          {best !== null && <Badge variant="secondary">Мой рекорд: {best} мс</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          onClick={state === 'idle' || state === 'done' || state === 'early' ? start : click}
          className={`w-full h-32 rounded-xl text-center transition-all duration-200 font-medium text-lg select-none ${bgMap[state]}`}
        >
          {state === 'idle' && '👆 Нажми, чтобы начать'}
          {state === 'waiting' && '⏳ Жди зелёного...'}
          {state === 'ready' && '🟢 ЖМИ!'}
          {state === 'early' && <span>😅 Слишком рано!<br /><span className="text-sm text-muted-foreground">Нажми для повтора</span></span>}
          {state === 'done' && time !== null && (
            <span>{time} мс {best === time && '🏆'}<br /><span className="text-sm text-muted-foreground">Нажми для повтора</span></span>
          )}
        </button>
        {(state === 'done' || state === 'early') && (
          <Button size="sm" variant="ghost" onClick={reset}>↺ Сброс</Button>
        )}
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">🏆 Таблица лидеров</p>
          <Leaderboard game="reaction" refresh={lbRefresh} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Guess Number ────────────────────────────────────────────────────────────

function GuessGame() {
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [input, setInput] = useState('');
  const [hint, setHint] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<{ n: number; hint: string }[]>([]);
  const [lbRefresh, setLbRefresh] = useState(0);

  const reset = () => {
    setSecret(Math.floor(Math.random() * 100) + 1);
    setInput('');
    setHint('');
    setAttempts(0);
    setWon(false);
    setHistory([]);
  };

  const guess = () => {
    const n = parseInt(input);
    if (isNaN(n) || n < 1 || n > 100) { setHint('Введи число от 1 до 100'); return; }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    let h = '';
    if (n === secret) {
      setWon(true);
      h = '🎯 Угадал!';
      submitScore('guess', newAttempts).then(() => setLbRefresh(r => r + 1));
    } else if (n < secret) {
      h = n < secret - 20 ? '🔼 Намного больше' : '🔼 Больше';
    } else {
      h = n > secret + 20 ? '🔽 Намного меньше' : '🔽 Меньше';
    }
    setHint(h);
    setHistory(prev => [{ n, hint: h }, ...prev]);
    setInput('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">🔢 Угадай число</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Попыток: {attempts}</Badge>
            <Button size="sm" variant="ghost" onClick={reset}>↺ Заново</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {won ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-4xl">🎯</p>
            <p className="font-semibold">Угадал за {attempts} {attempts === 1 ? 'попытку' : attempts < 5 ? 'попытки' : 'попыток'}!</p>
            <Button onClick={reset}>Играть ещё</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Я загадал число от 1 до 100. Угадай его!</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guess()}
                placeholder="Введи число..."
                min={1}
                max={100}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={guess}>Проверить</Button>
            </div>
            {hint && <p className="text-center font-medium text-base">{hint}</p>}
            {history.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 8).map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{h.n} {h.hint.split(' ')[0]}</Badge>
                ))}
              </div>
            )}
          </>
        )}
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">🏆 Таблица лидеров</p>
          <Leaderboard game="guess" refresh={lbRefresh} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tic Tac Toe ─────────────────────────────────────────────────────────────

type TTTCell = 'X' | 'O' | null;

function checkWinner(board: TTTCell[]): { winner: TTTCell; line: number[] } | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  return null;
}

function botMove(board: TTTCell[]): number {
  const empty = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  for (const i of empty) { const b = [...board]; b[i] = 'O'; if (checkWinner(b)) return i; }
  for (const i of empty) { const b = [...board]; b[i] = 'X'; if (checkWinner(b)) return i; }
  if (board[4] === null) return 4;
  const corners = [0,2,6,8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

function TicTacToe() {
  const [board, setBoard] = useState<TTTCell[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [scores, setScores] = useState({ you: 0, bot: 0, draw: 0 });
  const [blocked, setBlocked] = useState(false);
  const [lbRefresh, setLbRefresh] = useState(0);

  const result = checkWinner(board);
  const isDraw = !result && board.every(Boolean);

  useEffect(() => {
    if (result?.winner === 'X') {
      setScores(s => {
        const newYou = s.you + 1;
        submitScore('tictactoe', newYou).then(() => setLbRefresh(r => r + 1));
        return { ...s, you: newYou };
      });
    } else if (result?.winner === 'O') {
      setScores(s => ({ ...s, bot: s.bot + 1 }));
    } else if (isDraw) {
      setScores(s => ({ ...s, draw: s.draw + 1 }));
    }
  }, [result, isDraw]);

  useEffect(() => {
    if (!isX && !result && !isDraw) {
      setBlocked(true);
      const t = setTimeout(() => {
        setBoard(prev => {
          const b = [...prev];
          const idx = botMove(b);
          if (idx !== undefined) b[idx] = 'O';
          return b;
        });
        setIsX(true);
        setBlocked(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isX, result, isDraw]);

  const click = (i: number) => {
    if (board[i] || result || blocked || !isX) return;
    const b = [...board]; b[i] = 'X';
    setBoard(b);
    setIsX(false);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); setBlocked(false); };
  const winLine = result?.line ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">❌ Крестики-нолики</CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge className="bg-blue-500 text-white">Вы: {scores.you}</Badge>
            <Badge variant="outline">Ничья: {scores.draw}</Badge>
            <Badge className="bg-red-500 text-white">Бот: {scores.bot}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(result || isDraw) ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-3xl">{result?.winner === 'X' ? '🎉' : isDraw ? '🤝' : '🤖'}</p>
            <p className="font-semibold">{result?.winner === 'X' ? 'Вы победили!' : isDraw ? 'Ничья!' : 'Бот победил!'}</p>
            <Button size="sm" onClick={reset}>Ещё раз</Button>
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground">{isX ? '👆 Ваш ход (X)' : '🤖 Бот думает...'}</p>
        )}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => click(i)}
              className={`aspect-square rounded-lg text-3xl font-bold flex items-center justify-center border-2 transition-all select-none
                ${winLine.includes(i) ? 'bg-yellow-400/30 border-yellow-400' : 'bg-muted border-muted-foreground/20'}
                ${!cell && !result && isX ? 'hover:bg-primary/10 hover:border-primary/40 cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}>{cell}</span>
            </button>
          ))}
        </div>
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">🏆 Таблица лидеров</p>
          <Leaderboard game="tictactoe" refresh={lbRefresh} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function GamesTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MemoryGame />
      <ReactionGame />
      <GuessGame />
      <TicTacToe />
    </div>
  );
}
