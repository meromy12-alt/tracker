import { useState, useEffect, useMemo } from "react";
import { Search, Plus, BookOpen, Star, BarChart3, Trash2, Loader2, ArrowLeft, Sparkles, Eye, EyeOff, ExternalLink, Library as LibraryIcon, Compass, Users } from "lucide-react";

const GOOGLE_BOOKS_KEY = "AIzaSyBwITmWfX-ocya_EQPdwi7c7TONZI4JQRE";

    const PALETTES = {
        parchment: { bg: "#F4F1EA", surface: "#FAF7F0", ink: "#2D3A2E", muted: "#6B7B6E", accent: "#7A9471", soft: "#D4DDC9", border: "#E5E0D3", warm: "#C97B4A" },
        rosewood: { bg: "#FAF0F0", surface: "#FFF5F5", ink: "#3A2020", muted: "#8B6B6B", accent: "#B87C7C", soft: "#F0D4D4", border: "#E8D0D0", warm: "#C97B4A" },
        slate: { bg: "#F0F2F5", surface: "#F8F9FB", ink: "#1E2A3A", muted: "#6B7A8B", accent: "#5B7FA6", soft: "#D4DCE8", border: "#DDE3EC", warm: "#C97B4A" },
        amber: { bg: "#FBF5E6", surface: "#FFFBF0", ink: "#3A2A0A", muted: "#8B7A4A", accent: "#C49A3A", soft: "#EFE0B0", border: "#E8D8A0", warm: "#C97B4A" },
        lavender: { bg: "#F5F0FB", surface: "#FAF7FF", ink: "#2A1F3A", muted: "#7B6B8B", accent: "#9B7AB8", soft: "#E0D4F0", border: "#DDD0EC", warm: "#C97B4A" },
        turquoise: { bg: "#EEF8F8", surface: "#F5FCFC", ink: "#0D3535", muted: "#4A7B7B", accent: "#2A9D8F", soft: "#C4E8E5", border: "#B8E0DC", warm: "#E07A5F" },
        midnight: { bg: "#1C1F1C", surface: "#242724", ink: "#E8E4DC", muted: "#8A9B8D", accent: "#8FAF85", soft: "#2D352D", border: "#333A33", warm: "#C97B4A" },
        dusk: { bg: "#1E1A2E", surface: "#252036", ink: "#E8E0F0", muted: "#8A7A9B", accent: "#9B7AB8", soft: "#2D2840", border: "#35304A", warm: "#C97B4A" },
        forest: { bg: "#141A14", surface: "#1A221A", ink: "#E0EAE0", muted: "#6B8B6B", accent: "#5A8A5A", soft: "#1F2F1F", border: "#283828", warm: "#C97B4A" },
    };

    let T = PALETTES.parchment;

    const STATUSES = [
        { key: "want", label: "Want to read", color: "#8B7AB0" },
        { key: "reading", label: "Currently reading", color: "#7A9471" },
        { key: "finished", label: "Finished", color: "#5B8B95" },
        { key: "dnf", label: "Did not finish", color: "#A89888" },
    ];

    const MOODS = ["adventurous", "cosy", "dark", "emotional", "funny", "hopeful", "mysterious", "reflective", "tense", "uplifting"];
    const PACES = ["slow", "medium", "fast"];
    const CONTENT_WARNINGS = ["violence", "death", "grief", "mental health", "sexual content", "abuse", "medical", "war"];
    const THEMES = ["identity", "love", "loss", "family", "justice", "power", "redemption", "survival", "friendship", "war", "nature", "class", "faith", "memory", "freedom"];

    const MOOD_FROM_CATEGORY = {
        "cozy": ["cosy"], "feel-good": ["cosy", "hopeful"], "humor": ["funny"], "humour": ["funny"],
        "comedy": ["funny"], "thriller": ["tense"], "suspense": ["tense"], "mystery": ["mysterious"],
        "detective": ["mysterious"], "horror": ["dark", "tense"], "romance": ["emotional", "hopeful"],
        "adventure": ["adventurous"], "fantasy": ["adventurous"], "literary": ["reflective"],
        "memoir": ["reflective", "emotional"], "biography": ["reflective"], "self-help": ["hopeful"],
        "young adult": ["emotional"], "historical": ["reflective"], "dystopian": ["dark", "tense"],
        "science fiction": ["adventurous"],
    };

    const MOOD_FROM_KEYWORD = {
        "heartwarming": ["cosy", "hopeful"], "uplifting": ["uplifting", "hopeful"], "gentle": ["cosy"],
        "wholesome": ["cosy"], "hilarious": ["funny"], "witty": ["funny"], "haunting": ["dark", "reflective"],
        "gripping": ["tense"], "thrilling": ["tense"], "mysterious": ["mysterious"], "moving": ["emotional"],
        "poignant": ["emotional", "reflective"], "epic": ["adventurous"], "thought-provoking": ["reflective"],
    };

    const PACE_FROM_KEYWORD = {
        "fast-paced": "fast", "page-turner": "fast", "thrilling": "fast",
        "slow burn": "slow", "literary": "slow", "meditative": "slow",
    };

    const MODERN_CUTOFF = 2000;

    const MOOD_TO_QUERY = {
        modern: {
            cosy: '"cozy mystery" OR "feel-good fiction"', funny: '"comedic novel" OR "humorous fiction"',
            dark: '"dark fiction" OR "literary horror"', tense: '"domestic thriller" OR "psychological thriller"',
            mysterious: '"contemporary mystery"', emotional: '"book club fiction"',
            reflective: '"literary fiction"', hopeful: '"uplifting" OR "feel-good"',
            uplifting: '"uplifting fiction"', adventurous: '"adventure novel" OR "fantasy"',
        },
        classic: {
            cosy: 'subject:"fiction" "comfort"', funny: 'subject:"humor"',
            dark: 'subject:"gothic" OR subject:"horror"', tense: 'subject:"suspense"',
            mysterious: 'subject:"detective" OR subject:"mystery"', emotional: 'subject:"romance"',
            reflective: 'subject:"philosophy"', hopeful: 'subject:"romance"',
            uplifting: 'subject:"romance"', adventurous: 'subject:"adventure"',
        },
    };

    const uid = () => Math.random().toString(36).slice(2, 10);

    const getInitials = (author) => {
        if (!author || author === "Unknown") return "?";
        return author.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    };

    const coverUrl = (book, size = "M") => {
        if (book.coverOverride) return book.coverOverride;
        if (book.isbn) return `https://covers.openlibrary.org/b/isbn/${book.isbn}-${size}.jpg?default=false`;
        if (book.cover) return book.cover.replace(/&edge=curl/, "");
        return null;
    };

    const coverSrcSet = (book) => {
        if (book.coverOverride) return undefined;
        if (!book.isbn) return undefined;
        return `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false 1x, https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false 2x`;
    };

    const STORAGE_KEY = "marginalia.books.v1";
    const SESSION_SEEN_KEY = "marginalia.session_seen.v1";
    const GOAL_KEY = "marginalia.goal.v1";

    const loadBooks = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (_e) { return []; } };
    const saveBooks = (books) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); } catch (_e) { /* ignore */ } };

    const exportBooks = (books) => {
        const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books }, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `marginalia-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importBooks = (file, setBooks) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const books = data.books || data;
                if (!Array.isArray(books)) throw new Error("Invalid format");
                if (window.confirm(`Import ${books.length} books? This will replace your current library.`)) setBooks(books);
            } catch (_e) { alert("Could not read that file. Make sure it's a Marginalia backup JSON."); }
        };
        reader.readAsText(file);
    };

    (function migrate() {
        try { const old = localStorage.getItem("trackmate.books.v1"); const current = localStorage.getItem(STORAGE_KEY); if (old && !current) localStorage.setItem(STORAGE_KEY, old); } catch (_e) { /* ignore */ }
    })();

    function pickIsbn(ids = []) { const i13 = ids.find(i => i.type === "ISBN_13"); const i10 = ids.find(i => i.type === "ISBN_10"); return i13?.identifier || i10?.identifier || null; }
    function stripHtml(s) { if (!s) return null; return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
    function isIsbnQuery(q) { const c = q.replace(/[\s-]/g, ""); return /^\d{10}$|^\d{13}$/.test(c); }

    function normaliseGoogleBook(item) {
        const v = item.volumeInfo || {};
        const isbn = pickIsbn(v.industryIdentifiers);
        const googleThumb = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail;
        const cover = googleThumb ? googleThumb.replace(/^http:/, "https:") : null;
        const subjects = (v.categories || []).slice(0, 6);
        const synopsis = stripHtml(v.description);
        const inferredMoods = new Set();
        subjects.forEach(cat => { const lower = cat.toLowerCase(); Object.entries(MOOD_FROM_CATEGORY).forEach(([key, moods]) => { if (lower.includes(key)) moods.forEach(m => inferredMoods.add(m)); }); });
        const inferredFromKeywords = new Set();
        if (synopsis) { const lower = synopsis.toLowerCase(); Object.entries(MOOD_FROM_KEYWORD).forEach(([keyword, moods]) => { if (lower.includes(keyword)) moods.forEach(m => inferredFromKeywords.add(m)); }); }
        let inferredPace = null;
        const pages = v.pageCount || null;
        if (pages) { if (pages < 250) inferredPace = "fast"; else if (pages > 500) inferredPace = "slow"; else inferredPace = "medium"; }
        if (synopsis) { const lower = synopsis.toLowerCase(); Object.entries(PACE_FROM_KEYWORD).forEach(([kw, pace]) => { if (lower.includes(kw)) inferredPace = pace; }); }
        return { googleId: item.id, title: v.title || "Untitled", author: (v.authors || []).slice(0, 2).join(", ") || "Unknown", year: v.publishedDate ? parseInt(v.publishedDate.slice(0, 4), 10) : null, cover, isbn, pages, subjects, synopsis, publisher: v.publisher || null, inferredMoods: Array.from(inferredMoods), inferredKeywordMoods: Array.from(inferredFromKeywords), inferredPace };
    }

    function buildEraQuery(answers, era) {
        const parts = [];
        const moodMap = MOOD_TO_QUERY[era] || MOOD_TO_QUERY.modern;
        if (answers.mood && moodMap[answers.mood]) parts.push(`(${moodMap[answers.mood]})`);
        if (answers.energy === "carry") parts.push("(thriller OR adventure)");
        else if (answers.energy === "comfort") parts.push("(cozy OR heartwarming)");
        else if (answers.energy === "think") parts.push("(literary OR thoughtful)");
        return parts.length ? parts.join(" ") : (era === "modern" ? "fiction 2020" : "classic fiction");
    }

    async function tryGoogleQuery(q, orderBy = "relevance") {
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&printType=books&orderBy=${orderBy}&langRestrict=en&key=${GOOGLE_BOOKS_KEY}`);
            if (!res.ok) return { ok: false, status: res.status, query: q };
            const data = await res.json();
            return { ok: true, query: q, books: (data.items || []).map(normaliseGoogleBook) };
        } catch (err) { return { ok: false, status: 0, query: q, error: err.message }; }
    }

    function filterByEra(books, era) {
        if (era === "any") return books;
        return books.filter(b => { if (!b.year) return true; if (era === "modern") return b.year >= MODERN_CUTOFF; return b.year < MODERN_CUTOFF; });
    }

    async function discoverBooks(answers) {
        const era = answers.era || "any";
        let collected = [];
        if (era === "modern" || era === "any") {
            const mq = buildEraQuery(answers, "modern");
            const r1 = await tryGoogleQuery(mq, "newest"); if (r1.ok) collected.push(...filterByEra(r1.books, "modern"));
            const r2 = await tryGoogleQuery(mq, "relevance"); if (r2.ok) collected.push(...filterByEra(r2.books, "modern"));
        }
        if (era === "classic" || era === "any") {
            const cq = buildEraQuery(answers, "classic");
            const r3 = await tryGoogleQuery(cq, "relevance"); if (r3.ok) collected.push(...filterByEra(r3.books, "classic"));
        }
        const seen = new Set();
        collected = collected.filter(b => { if (seen.has(b.googleId)) return false; seen.add(b.googleId); return true; });
        if (era === "any") {
            const modern = collected.filter(b => b.year && b.year >= MODERN_CUTOFF);
            const classics = collected.filter(b => !b.year || b.year < MODERN_CUTOFF);
            collected = [...modern, ...classics.slice(0, Math.ceil(classics.length / 3))];
        }
        if (collected.length === 0) {
            const r = await tryGoogleQuery(answers.mood ? `${answers.mood} fiction` : "fiction", "relevance");
            if (r.ok) collected = filterByEra(r.books, era);
        }
        if (collected.length === 0) throw new Error("No results found. Try different answers.");
        return { books: collected };
    }

    function scoreExternal(book, a) {
        let score = 0; const reasons = [];
        if (a.length && book.pages) { const fits = (a.length === "short" && book.pages < 300) || (a.length === "medium" && book.pages >= 250 && book.pages <= 450) || (a.length === "long" && book.pages > 400); if (fits) { score += 2; reasons.push("length matches"); } }
        if (a.mood) { if (book.inferredMoods?.includes(a.mood)) { score += 3; reasons.push("mood matches"); } else if (book.inferredKeywordMoods?.includes(a.mood)) { score += 1; } }
        if (a.energy && book.inferredPace) { const ok = (a.energy === "carry" && book.inferredPace !== "slow") || (a.energy === "think") || (a.energy === "comfort" && book.inferredPace !== "fast"); if (ok) { score += 1; reasons.push("energy aligns"); } }
        if (a.era === "modern" && book.year && book.year >= 2010) score += 0.5;
        if (a.era === "modern" && book.year && book.year >= 2020) score += 0.5;
        if (book.cover) score += 0.5;
        if (book.synopsis && book.synopsis.length > 100) score += 0.5;
        return { score, reasons };
    }

    function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function buildWhyText(book, answers, isExternal) {
        const bits = [];
        if (book.year) { if (book.year >= 2020) bits.push("recently published"); else if (book.year >= 2000) bits.push(`from ${book.year}`); else bits.push(`a ${book.year} classic`); }
        if (book.pages) { if (book.pages < 250) bits.push("short"); else if (book.pages > 500) bits.push("a longer read"); }
        const moods = book.moods?.length ? book.moods : book.inferredMoods || [];
        if (answers.mood && moods.includes(answers.mood)) bits.push(`tagged ${answers.mood}`);
        else if (moods.length > 0) bits.push(`feels ${moods.slice(0, 2).join(" and ")}`);
        if (bits.length === 0) return null;
        return `${isExternal ? "From outside your library" : "From your TBR"} — ${bits.join(", ")}.`;
    }

    // ─── EmptyCover ───────────────────────────────────────────────────────────────

    function EmptyCover({ book, size = "M" }) {
        const initials = getInitials(book.author);
        const titleWords = (book.title || "").split(" ").slice(0, 3).join(" ");
        const patternIdx = (book.title || "").length % 3;
        const fontSize = size === "L" ? 22 : size === "M" ? 14 : 11;
        const initialsSize = size === "L" ? 32 : size === "M" ? 20 : 16;
        return (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${T.accent}30, ${T.warm}20)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: patternIdx === 0 ? `repeating-linear-gradient(45deg, ${T.accent} 0, ${T.accent} 1px, transparent 0, transparent 8px)` : patternIdx === 1 ? `repeating-linear-gradient(0deg, ${T.accent} 0, ${T.accent} 1px, transparent 0, transparent 16px)` : `repeating-linear-gradient(90deg, ${T.accent} 0, ${T.accent} 1px, transparent 0, transparent 16px)` }} />
                <div style={{ width: initialsSize * 1.8, height: initialsSize * 1.8, borderRadius: 999, background: `${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: initialsSize, fontWeight: 500, color: T.accent, lineHeight: 1 }}>{initials}</span>
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize, fontWeight: 500, color: T.ink, textAlign: "center", lineHeight: 1.3, wordBreak: "break-word" }}>{titleWords}{(book.title || "").split(" ").length > 3 ? "…" : ""}</div>
                {book.year && size !== "S" && <div style={{ fontSize: fontSize - 2, color: T.muted, marginTop: 4 }}>{book.year}</div>}
            </div>
        );
    }

    // ─── App ─────────────────────────────────────────────────────────────────────

    export default function App() {
        const [keyStatus, setKeyStatus] = useState("checking"); // checking | valid | invalid
        const [books, setBooks] = useState(loadBooks);
        const [view, setView] = useState("library");

        useEffect(() => {
            const params = new URLSearchParams(window.location.search);
            const key = params.get("key");
            if (key) {
                try { localStorage.setItem("marginalia.key", key); } catch (_e) { /* ignore */ }
            }
            const storedKey = key || localStorage.getItem("marginalia.key");
            if (!storedKey) { setKeyStatus("invalid"); return; }
            fetch(`https://marginalia-dda02-default-rtdb.firebaseio.com/keys/${storedKey}.json`)
                .then(r => r.json())
                .then(val => { setKeyStatus(val === "active" ? "valid" : "invalid"); })
                .catch(() => { setKeyStatus("valid"); }); // fail open on network error
        }, []);
        const [activeId, setActiveId] = useState(null);
        const [filterStatus, setFilterStatus] = useState("all");
        const [libraryTab, setLibraryTab] = useState("grid");
        const [findBook, setFindBook] = useState(null);
        const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

        const [palette, setPalette] = useState(() => { try { return localStorage.getItem("marginalia.palette") || "parchment"; } catch (_e) { return "parchment"; } });
        // eslint-disable-next-line
        T = PALETTES[palette] || PALETTES.parchment;

        const [readingGoal, setReadingGoal] = useState(() => { try { return JSON.parse(localStorage.getItem(GOAL_KEY) || "null"); } catch (_e) { return null; } });

        useEffect(() => { saveBooks(books); }, [books]);
        useEffect(() => { try { localStorage.setItem("marginalia.palette", palette); } catch (_e) { /* ignore */ } }, [palette]);
        useEffect(() => { try { localStorage.setItem(GOAL_KEY, JSON.stringify(readingGoal)); } catch (_e) { /* ignore */ } }, [readingGoal]);
        useEffect(() => {
            const handler = () => setIsMobile(window.innerWidth < 600);
            window.addEventListener("resize", handler);
            return () => window.removeEventListener("resize", handler);
        }, []);

        const addBook = (book, status = "want") => {
            const newBook = { id: uid(), addedAt: Date.now(), status, rating: 0, moods: [], pace: null, contentWarnings: [], notes: "", quotes: [], themes: [], characters: "", startedAt: "", finishedAt: "", ...book };
            setBooks([newBook, ...books]); setActiveId(newBook.id); setView("book");
            return newBook;
        };

        const addBookSilent = (book, status = "want") => {
            const newBook = { id: uid(), addedAt: Date.now(), status, rating: 0, moods: [], pace: null, contentWarnings: [], notes: "", quotes: [], themes: [], characters: "", startedAt: "", finishedAt: "", ...book };
            setBooks(b => [newBook, ...b]); return newBook;
        };

        const updateBook = (id, patch) => setBooks(books.map(b => b.id === id ? { ...b, ...patch } : b));
        const deleteBook = (id) => { if (!window.confirm("Remove this book from your library?")) return; setBooks(books.filter(b => b.id !== id)); setView("library"); setActiveId(null); };

        const activeBook = books.find(b => b.id === activeId);
        const filtered = filterStatus === "all" ? books : books.filter(b => b.status === filterStatus);
        const tbrCount = books.filter(b => b.status === "want").length;

        if (keyStatus === "checking") return (
                <div style={{ minHeight: "100vh", background: "#FAF7F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
                    <div style={{ textAlign: "center", color: "#6B7B6E" }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "#2D3A2E", marginBottom: 8 }}>Marginalia</div>
                        <div style={{ fontSize: 14 }}>Loading your library…</div>
                    </div>
                </div>
            );

            if (keyStatus === "invalid") return (
                <div style={{ minHeight: "100vh", background: "#FAF7F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
                    <div style={{ textAlign: "center", maxWidth: 420 }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: "#2D3A2E", marginBottom: 8 }}>Marginalia</div>
                        <div style={{ fontSize: 13, color: "#6B7B6E", marginBottom: 24, lineHeight: 1.6 }}>the notes you make, the books you keep</div>
                        <div style={{ background: "white", border: "1px solid #E5E0D3", borderRadius: 14, padding: 28, marginBottom: 20 }}>
                            <div style={{ fontSize: 18, fontWeight: 600, color: "#2D3A2E", marginBottom: 8 }}>Access required</div>
                            <div style={{ fontSize: 14, color: "#6B7B6E", lineHeight: 1.7 }}>
                                This app requires a valid access link.<br />
                                If you purchased Marginalia on Etsy, please use the link from your welcome PDF.<br /><br />
                                If you need help, contact us through your Etsy order.
                            </div>
                        </div>
                        <a href="https://www.etsy.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#7A9471", color: "white", padding: "10px 24px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Get Marginalia on Etsy →</a>
                    </div>
                </div>
            );

            return (
                <div style={{
                    minHeight: "100vh", background: T.bg, color: T.ink,

        return (
            <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 16, lineHeight: 1.55 }}>
                <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; font-size: inherit; }
        button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        ::selection { background: ${T.accent}40; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blurReveal { from { filter: blur(20px); } to { filter: blur(0); } }
        .fade-in { animation: fadeIn 240ms ease both; }
        .spin { animation: spin 1s linear infinite; }
        .reveal { animation: blurReveal 600ms ease both; }
      `}</style>

                <header style={{ borderBottom: `1px solid ${T.border}`, background: T.surface, padding: isMobile ? "10px 12px" : "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
                    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 8 : 12 }}>
                        <button onClick={() => { setView("library"); setActiveId(null); }} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, color: T.ink }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accent, display: "grid", placeItems: "center", color: T.surface, flexShrink: 0 }}><BookOpen size={18} /></div>
                            <div style={{ textAlign: "left" }}>
                                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>Marginalia</div>
                                {!isMobile && <div style={{ fontSize: 11, color: T.muted, marginTop: 3, letterSpacing: "0.04em" }}>the notes you make, the books you keep</div>}
                            </div>
                        </button>
                        <div style={{ display: "flex", gap: isMobile ? 4 : 8, alignItems: "center", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
                            <PalettePicker palette={palette} setPalette={setPalette} isMobile={isMobile} />
                            <button onClick={() => setView("whatnow")} style={{ ...btn(view === "whatnow"), padding: isMobile ? "8px 10px" : "8px 16px" }} title="What now?"><Sparkles size={16} />{!isMobile && " What now?"}</button>
                            <button onClick={() => setView("stats")} style={{ ...btn(view === "stats"), padding: isMobile ? "8px 10px" : "8px 16px" }} title="Stats"><BarChart3 size={16} />{!isMobile && " Stats"}</button>
                            <button onClick={() => exportBooks(books)} style={{ ...btn(false), padding: isMobile ? "8px 10px" : "8px 16px" }} title="Export">{isMobile ? "⬇" : "Export"}</button>
                            <label style={{ ...btn(false), cursor: "pointer", padding: isMobile ? "8px 10px" : "8px 16px" }} title="Import">{isMobile ? "⬆" : "Import"}<input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) importBooks(e.target.files[0], setBooks); }} /></label>
                            <button onClick={() => setView("add")} style={{ ...btnPrimary, padding: isMobile ? "8px 12px" : "8px 18px" }}><Plus size={16} /> Add book</button>
                        </div>
                    </div>
                </header>

                <main style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "16px 12px 60px" : "24px 20px 80px" }} className="fade-in" key={view + (activeId || "") + palette}>
                    {view === "library" && <Library books={filtered} allBooks={books} filterStatus={filterStatus} setFilterStatus={setFilterStatus} libraryTab={libraryTab} setLibraryTab={setLibraryTab} onOpen={(id) => { setActiveId(id); setView("book"); }} onAdd={() => setView("add")} tbrCount={tbrCount} onWhatNow={() => setView("whatnow")} readingGoal={readingGoal} setReadingGoal={setReadingGoal} onFind={setFindBook} />}
                    {view === "add" && <AddBook onAdd={addBook} onCancel={() => setView("library")} />}
                    {view === "book" && activeBook && <BookDetail book={activeBook} onUpdate={(p) => updateBook(activeBook.id, p)} onDelete={() => deleteBook(activeBook.id)} onBack={() => setView("library")} isMobile={isMobile} onFind={setFindBook} />}
                    {view === "stats" && <Stats books={books} onBack={() => setView("library")} />}
                    {view === "whatnow" && <WhatNow books={books} onBack={() => setView("library")} onPick={(id) => updateBook(id, { status: "reading" })} onOpen={(id) => { setActiveId(id); setView("book"); }} onAddExternal={addBookSilent} onFind={setFindBook} />}
                </main>

                {findBook && (
                    <div onClick={() => setFindBook(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                        <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.25)", width: "100%", maxWidth: 340 }}>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>{findBook.title}</div>
                            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>by {findBook.author}</div>
                            <div style={{ display: "grid", gap: 8 }}>
                                <a href={`https://bookshop.org/search?keywords=${encodeURIComponent(findBook.title + " " + findBook.author)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", color: T.ink, textDecoration: "none", fontSize: 14, borderRadius: 10, border: `1px solid ${T.accent}40`, background: `${T.accent}15` }}>
                                    <span style={{ fontSize: 20 }}>🪴</span>
                                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>Bookshop.org</div><div style={{ fontSize: 12, color: T.muted }}>Support indie bookshops</div></div>
                                </a>
                                <a href={`https://www.amazon.com/s?k=${encodeURIComponent(findBook.title + " " + findBook.author)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", color: T.ink, textDecoration: "none", fontSize: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                    <span style={{ fontSize: 20 }}>📦</span>
                                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>Amazon</div><div style={{ fontSize: 12, color: T.muted }}>Fast delivery</div></div>
                                </a>
                                {findBook.isbn && <a href={`https://www.thalia.de/suche/?sq=${findBook.isbn}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", color: T.ink, textDecoration: "none", fontSize: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                    <span style={{ fontSize: 20 }}>🇩🇪</span>
                                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>Thalia</div><div style={{ fontSize: 12, color: T.muted }}>German bookshop</div></div>
                                </a>}
                                <a href={`https://www.worldcat.org/search?q=${encodeURIComponent(findBook.title + " " + findBook.author)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", color: T.ink, textDecoration: "none", fontSize: 14, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                    <span style={{ fontSize: 20 }}>📚</span>
                                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>WorldCat</div><div style={{ fontSize: 12, color: T.muted }}>Find at a library near you</div></div>
                                </a>
                            </div>
                            <button onClick={() => setFindBook(null)} style={{ ...secondary, width: "100%", marginTop: 16, justifyContent: "center" }}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── PalettePicker ────────────────────────────────────────────────────────────

    function PalettePicker({ palette, setPalette, isMobile }) {
        const [open, setOpen] = useState(false);
        const options = [
            { key: "parchment", label: "Parchment", swatch: "#7A9471", bg: "#F4F1EA" },
            { key: "rosewood", label: "Rosewood", swatch: "#B87C7C", bg: "#FAF0F0" },
            { key: "slate", label: "Slate", swatch: "#5B7FA6", bg: "#F0F2F5" },
            { key: "amber", label: "Amber", swatch: "#C49A3A", bg: "#FBF5E6" },
            { key: "lavender", label: "Lavender", swatch: "#9B7AB8", bg: "#F5F0FB" },
            { key: "turquoise", label: "Turquoise", swatch: "#2A9D8F", bg: "#EEF8F8" },
            { key: "midnight", label: "Midnight", swatch: "#8FAF85", bg: "#1C1F1C" },
            { key: "dusk", label: "Dusk", swatch: "#9B7AB8", bg: "#1E1A2E" },
            { key: "forest", label: "Forest", swatch: "#5A8A5A", bg: "#141A14" },
        ];
        const current = options.find(o => o.key === palette) || options[0];
        return (
            <div style={{ position: "relative" }}>
                <button onClick={() => setOpen(o => !o)} style={{ ...btn(false), gap: 6, padding: isMobile ? "8px 10px" : "8px 16px" }}>
                    <span style={{ width: 14, height: 14, borderRadius: 999, background: current.swatch, border: `2px solid ${T.border}`, display: "inline-block", flexShrink: 0 }} />
                    {!isMobile && "Colours"}
                </button>
                {open && (
                    <>
                        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                        <div style={{ position: "fixed", top: isMobile ? 100 : 60, left: isMobile ? 12 : "auto", right: isMobile ? 12 : 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9998, minWidth: 180 }}>
                            {options.map(o => (
                                <button key={o.key} onClick={() => { setPalette(o.key); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "none", background: palette === o.key ? `${T.accent}20` : "transparent", color: T.ink, cursor: "pointer", textAlign: "left", fontSize: 14 }}>
                                    <span style={{ width: 20, height: 20, borderRadius: 999, background: o.bg, border: `3px solid ${o.swatch}`, flexShrink: 0 }} />
                                    {o.label}
                                    {palette === o.key && <span style={{ marginLeft: "auto", color: T.accent }}>✓</span>}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ─── GoalCard ─────────────────────────────────────────────────────────────────

    function GoalCard({ goal, setGoal, books }) {
        const [editing, setEditing] = useState(false);
        const [draft, setDraft] = useState("");
        const year = new Date().getFullYear();
        const count = books.filter(b => b.status === "finished").length;
        const pct = goal ? Math.min(100, Math.round((count / goal.target) * 100)) : 0;

        if (!goal && !editing) return (
            <button onClick={() => { setEditing(true); setDraft(""); }} style={{ width: "100%", padding: "12px 20px", borderRadius: 14, border: `1px dashed ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", marginBottom: 24, fontSize: 13, textAlign: "center", fontFamily: "inherit" }}>
                + Set a reading goal for {year}
            </button>
        );

        if (editing) return (
            <div style={{ padding: "16px 20px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>How many books in {year}?</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="number" min="1" max="365" value={draft} onChange={e => setDraft(e.target.value)} placeholder="e.g. 24" autoFocus style={{ ...inputStyle, width: 100, minHeight: 36 }} onKeyDown={e => { if (e.key === "Enter" && parseInt(draft) > 0) { setGoal({ target: parseInt(draft), year }); setEditing(false); } }} />
                    <button onClick={() => { if (parseInt(draft) > 0) { setGoal({ target: parseInt(draft), year }); setEditing(false); } }} style={btnPrimary}>Set goal</button>
                    <button onClick={() => setEditing(false)} style={secondary}>Cancel</button>
                </div>
            </div>
        );

        return (
            <div style={{ padding: "16px 20px", borderRadius: 14, border: `1px solid ${T.accent}30`, background: `linear-gradient(135deg, ${T.accent}08, ${T.warm}05)`, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 500 }}>{year} reading goal</div>
                        <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{count} of {goal.target} books · {pct}%</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setDraft(String(goal.target)); setEditing(true); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>Edit</button>
                        <button onClick={() => { if (window.confirm("Remove reading goal?")) setGoal(null); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>Remove</button>
                    </div>
                </div>
                <div style={{ height: 8, background: T.bg, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? T.warm : T.accent, borderRadius: 999, transition: "width 600ms ease" }} />
                </div>
                {pct >= 100 && <div style={{ fontSize: 12, color: T.warm, marginTop: 6, fontStyle: "italic" }}>Goal reached — wonderful.</div>}
            </div>
        );
    }

    // ─── Library ──────────────────────────────────────────────────────────────────

    function Library({ books, allBooks, filterStatus, setFilterStatus, libraryTab, setLibraryTab, onOpen, onAdd, tbrCount, onWhatNow, readingGoal, setReadingGoal, onFind }) {
        if (allBooks.length === 0) return (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400, marginBottom: 8 }}>Your shelves are empty</div>
                <p style={{ color: T.muted, maxWidth: 420, margin: "0 auto 24px" }}>Search for any book by title, author, or ISBN.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={onAdd} style={btnPrimary}><Search size={16} /> Find your first book</button>
                    <button onClick={onWhatNow} style={secondary}><Sparkles size={16} /> Or discover one</button>
                </div>
            </div>
        );

        const counts = { all: allBooks.length };
        STATUSES.forEach(s => { counts[s.key] = allBooks.filter(b => b.status === s.key).length; });

        const authorMap = {};
        allBooks.forEach(b => { const a = b.author || "Unknown"; if (!authorMap[a]) authorMap[a] = []; authorMap[a].push(b); });
        const authors = Object.entries(authorMap).sort((a, b) => b[1].length - a[1].length);

        return (
            <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 400, margin: "8px 0 4px", letterSpacing: "-0.02em" }}>Your library</h1>
                <p style={{ color: T.muted, marginBottom: 20 }}>{allBooks.length} {allBooks.length === 1 ? "book" : "books"} · no streaks, no pressure, just yours</p>
                <button onClick={onWhatNow} style={{ width: "100%", padding: "16px 20px", borderRadius: 14, border: `1px solid ${T.accent}40`, background: `linear-gradient(135deg, ${T.accent}12, ${T.warm}08)`, color: T.ink, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Sparkles size={20} color={T.accent} />
                        <div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 500 }}>Stuck on what to read next?</div>
                            <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>Pick from your {tbrCount}-book TBR or discover something new.</div>
                        </div>
                    </div>
                    <span style={{ color: T.accent, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap" }}>What now? →</span>
                </button>
                <GoalCard goal={readingGoal} setGoal={setReadingGoal} books={allBooks} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    <FilterPill active={filterStatus === "all"} onClick={() => setFilterStatus("all")} count={counts.all}>All</FilterPill>
                    {STATUSES.map(s => <FilterPill key={s.key} active={filterStatus === s.key} onClick={() => setFilterStatus(s.key)} count={counts[s.key]} color={s.color}>{s.label}</FilterPill>)}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    <button onClick={() => setLibraryTab("grid")} style={{ ...btn(libraryTab === "grid"), fontSize: 13, minHeight: 34, padding: "6px 12px" }}><LibraryIcon size={14} /> Books</button>
                    <button onClick={() => setLibraryTab("authors")} style={{ ...btn(libraryTab === "authors"), fontSize: 13, minHeight: 34, padding: "6px 12px" }}><Users size={14} /> Authors</button>
                </div>

                {libraryTab === "authors" ? (
                    <div style={{ display: "grid", gap: 12 }}>
                        {authors.map(([author, authorBooks]) => (
                            <div key={author} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 999, background: `${T.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500, color: T.accent }}>{getInitials(author)}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500 }}>{author}</div>
                                        <div style={{ fontSize: 13, color: T.muted }}>{authorBooks.length} {authorBooks.length === 1 ? "book" : "books"}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {authorBooks.map(b => (
                                        <button key={b.id} onClick={() => onOpen(b.id)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, color: T.ink, cursor: "pointer", textAlign: "left" }}>
                                            {b.title}
                                            <span style={{ marginLeft: 6, fontSize: 11, padding: "2px 6px", borderRadius: 999, background: STATUSES.find(s => s.key === b.status)?.color || T.muted, color: "white" }}>
                                                {STATUSES.find(s => s.key === b.status)?.label?.split(" ")[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : books.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 12 }}>No books in this shelf yet.</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
                        {books.map(b => <BookCard key={b.id} book={b} onClick={() => onOpen(b.id)} onFind={onFind} />)}
                    </div>
                )}
            </div>
        );
    }

    // ─── BookCard ─────────────────────────────────────────────────────────────────

    function BookCard({ book, onClick, onFind }) {
        const [imgError, setImgError] = useState(false);
        const cover = coverUrl(book, "M");
        const status = STATUSES.find(s => s.key === book.status);
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ aspectRatio: "2/3", borderRadius: 8, overflow: "hidden", background: T.soft, boxShadow: "0 4px 12px rgba(45,58,46,0.08)", border: `1px solid ${T.border}`, position: "relative" }}>
                        {cover && !imgError
                            ? <img src={cover} srcSet={coverSrcSet(book)} alt={`Cover of ${book.title}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgError(true)} />
                            : <EmptyCover book={book} size="M" />
                        }
                        <div style={{ position: "absolute", top: 8, left: 8, padding: "3px 8px", borderRadius: 999, background: status.color, color: "white", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{status.label}</div>
                    </div>
                    <div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 500, lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{book.title}</div>
                        <div style={{ color: T.muted, fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.author}</div>
                        {book.rating > 0 && <div style={{ marginTop: 4 }}><StarDisplay rating={book.rating} size={11} /></div>}
                    </div>
                </div>
                {book.status === "want" && onFind && (
                    <button onClick={() => onFind(book)} style={{ background: T.accent, border: "none", borderRadius: 6, color: T.surface, fontSize: 11, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "inherit", alignSelf: "flex-start", fontWeight: 500 }}>
                        <ExternalLink size={10} /> Find in store
                    </button>
                )}
            </div>
        );
    }

    // ─── FilterPill ───────────────────────────────────────────────────────────────

    function FilterPill({ active, onClick, count, color, children }) {
        return (
            <button onClick={onClick} aria-pressed={active} style={{ minHeight: 34, padding: "5px 12px", borderRadius: 999, border: active ? `1.5px solid ${color || T.accent}` : `1px solid ${T.border}`, background: active ? `${color || T.accent}15` : "transparent", color: T.ink, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {color && <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />}
                {children}<span style={{ color: T.muted, fontWeight: 400 }}>{count}</span>
            </button>
        );
    }

    // ─── WhatNow ──────────────────────────────────────────────────────────────────

    function WhatNow({ books, onBack, onPick, onOpen, onAddExternal, onFind }) {
        const tbr = useMemo(() => books.filter(b => b.status === "want"), [books]);
        const [step, setStep] = useState("intro");
        const [mode, setMode] = useState(null);
        const [blindMode, setBlindMode] = useState(false);
        const [revealed, setRevealed] = useState(false);
        const [answers, setAnswers] = useState({ energy: null, length: null, mood: null, era: null, avoid: [] });
        const [rejectedIds, setRejectedIds] = useState(() => { try { return JSON.parse(sessionStorage.getItem("marginalia.rejected") || "[]"); } catch (_e) { return []; } });
        const [seenIds, setSeenIds] = useState(() => { try { return JSON.parse(sessionStorage.getItem(SESSION_SEEN_KEY) || "[]"); } catch (_e) { return []; } });
        const [match, setMatch] = useState(null);
        const [loading, setLoading] = useState(false);
        const [imgError, setImgError] = useState(false);

        const remember = (id) => { if (!id) return; const next = [...seenIds, id].slice(-50); setSeenIds(next); try { sessionStorage.setItem(SESSION_SEEN_KEY, JSON.stringify(next)); } catch (_e) { /* ignore */ } };

        const reject = (id) => {
            if (!id) return;
            const next = [...rejectedIds, id];
            setRejectedIds(next);
            try { sessionStorage.setItem("marginalia.rejected", JSON.stringify(next)); } catch (_e) { /* ignore */ }
            return next;
        };

        const matchFromLibrary = (a, excludeIds) => {
            const pool = tbr.filter(b => !excludeIds.includes(b.id));
            if (pool.length === 0) return { book: null, relaxed: null, answers: a, source: "library" };
            const lengthFn = (b) => { if (!a.length || !b.pages) return true; if (a.length === "short") return b.pages < 300; if (a.length === "medium") return b.pages >= 250 && b.pages <= 450; return b.pages > 400; };
            const energyFn = (b) => { if (!a.energy) return true; if (a.energy === "carry") return !b.pace || b.pace !== "slow"; if (a.energy === "think") return !b.pace || b.pace !== "fast"; return !b.pace || b.pace === "slow" || b.moods?.includes("cosy"); };
            const moodFn = (b) => !a.mood || !b.moods || b.moods.length === 0 || b.moods.includes(a.mood);
            const avoidFn = (b) => !a.avoid?.length || !b.contentWarnings || !a.avoid.some(cw => b.contentWarnings.includes(cw));
            let survivors = pool.filter(b => avoidFn(b) && moodFn(b) && lengthFn(b) && energyFn(b));
            if (survivors.length > 0) return { book: pickRandom(survivors), relaxed: null, answers: a, source: "library" };
            survivors = pool.filter(b => moodFn(b) && lengthFn(b) && energyFn(b));
            if (survivors.length > 0) return { book: pickRandom(survivors), relaxed: "content warnings", answers: a, source: "library" };
            survivors = pool.filter(b => lengthFn(b) && energyFn(b));
            if (survivors.length > 0) return { book: pickRandom(survivors), relaxed: "mood", answers: a, source: "library" };
            return { book: pickRandom(pool), relaxed: "all preferences", answers: a, source: "library" };
        };

        const matchFromDiscovery = async (a, excludeIds) => {
            const ownedIds = new Set(books.map(b => b.googleId).filter(Boolean));
            const ownedTitles = new Set(books.map(b => b.title?.toLowerCase()));
            const seenSet = new Set(seenIds);
            setLoading(true);
            try {
                const { books: candidates } = await discoverBooks(a);
                const available = candidates.filter(c => !ownedIds.has(c.googleId) && !ownedTitles.has(c.title.toLowerCase()) && !excludeIds.includes(c.googleId));
                if (available.length === 0) return { book: null, relaxed: null, answers: a, source: "discover", error: "No new books found. Try different answers." };
                const scored = available.map(b => { const s = scoreExternal(b, a); if (seenSet.has(b.googleId)) s.score -= 1.5; return { book: b, ...s }; }).sort((x, y) => y.score - x.score);
                const top = scored.slice(0, 6);
                const r = Math.random();
                const chosen = r < 0.5 ? top[0] : (r < 0.8 ? top[1] || top[0] : top[2] || top[0]);
                remember(chosen.book.googleId);
                return { book: chosen.book, relaxed: null, answers: a, source: "discover", score: chosen.score, reasons: chosen.reasons };
            } catch (err) {
                return { book: null, relaxed: null, answers: a, source: "discover", error: err.message };
            } finally { setLoading(false); }
        };

        const finishQuestionnaire = async (final, overrideExcludeIds) => {
            const excludeIds = overrideExcludeIds !== undefined ? overrideExcludeIds : rejectedIds;
            setImgError(false);
            const m = mode === "library" ? matchFromLibrary(final, excludeIds) : await matchFromDiscovery(final, excludeIds);
            setMatch(m); setRevealed(!blindMode); setStep("reveal");
        };

        if (step === "intro") return (
            <div>
                <button onClick={onBack} style={backBtn}><ArrowLeft size={16} /> Library</button>
                <div style={{ maxWidth: 560, margin: "20px auto 0", textAlign: "center" }}>
                    <Sparkles size={32} color={T.accent} style={{ marginBottom: 16 }} />
                    <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 400, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>What now?</h1>
                    <p style={{ color: T.muted, fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>A few quick questions. I'll suggest one book.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 480, margin: "0 auto" }}>
                        <ChoiceCard onClick={() => { setMode("library"); setStep("mode"); }} icon={<LibraryIcon size={22} color={T.accent} />} title="From my library" subtitle={`Pick from your ${tbr.length}-book TBR.`} disabled={tbr.length === 0} />
                        <ChoiceCard onClick={() => { setMode("discover"); setStep("mode"); }} icon={<Compass size={22} color={T.warm} />} title="Something new" subtitle="Discover a book from anywhere." />
                    </div>
                    {tbr.length === 0 && <p style={{ color: T.muted, fontSize: 12, marginTop: 16 }}>Your TBR is empty — only "Something new" is available.</p>}
                </div>
            </div>
        );

        if (step === "mode") return (
            <div>
                <button onClick={() => setStep("intro")} style={backBtn}><ArrowLeft size={16} /> Back</button>
                <QStep title="How would you like to see your match?">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 480, margin: "0 auto" }}>
                        <ChoiceCard onClick={() => { setBlindMode(false); setStep("q1"); }} icon={<Eye size={22} color={T.accent} />} title="Show me the cover" subtitle="The normal way." />
                        <ChoiceCard onClick={() => { setBlindMode(true); setStep("q1"); }} icon={<EyeOff size={22} color={T.warm} />} title="Surprise me" subtitle="Cover hidden until you reveal." />
                    </div>
                </QStep>
            </div>
        );

        const totalQuestions = mode === "discover" ? 5 : 4;

        if (step === "q1") return (
            <div>
                <button onClick={() => setStep("mode")} style={backBtn}><ArrowLeft size={16} /> Back</button>
                <QStep step={1} total={totalQuestions} title="How much energy do you have right now?">
                    <ChoiceList>
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, energy: "carry" })); setStep("q2"); }} title="Carry me away" subtitle="I want plot, pace, momentum." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, energy: "think" })); setStep("q2"); }} title="Let me think a bit" subtitle="Something to chew on." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, energy: "comfort" })); setStep("q2"); }} title="I just want comfort" subtitle="Cosy, gentle, easy company." />
                    </ChoiceList>
                </QStep>
            </div>
        );

        if (step === "q2") return (
            <div>
                <button onClick={() => setStep("q1")} style={backBtn}><ArrowLeft size={16} /> Back</button>
                <QStep step={2} total={totalQuestions} title="How long do you want to live in this book?">
                    <ChoiceList>
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, length: "short" })); setStep("q3"); }} title="A weekend" subtitle="Under 300 pages." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, length: "medium" })); setStep("q3"); }} title="A week or two" subtitle="Around 300–450 pages." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, length: "long" })); setStep("q3"); }} title="As long as it takes" subtitle="Over 400 pages." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, length: null })); setStep("q3"); }} title="No preference" subtitle="Length doesn't matter." muted />
                    </ChoiceList>
                </QStep>
            </div>
        );

        if (step === "q3") {
            const next = mode === "discover" ? "q_era" : "q5";
            return (
                <div>
                    <button onClick={() => setStep("q2")} style={backBtn}><ArrowLeft size={16} /> Back</button>
                    <QStep step={3} total={totalQuestions} title="What kind of feeling are you chasing?" subtitle="Pick one, or skip.">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 540, margin: "0 auto" }}>
                            {MOODS.map(m => <button key={m} onClick={() => { setAnswers(a => ({ ...a, mood: m })); setStep(next); }} style={{ ...tagPill(false), minHeight: 44, padding: "10px 18px", fontSize: 14 }}>{m}</button>)}
                        </div>
                        <div style={{ textAlign: "center", marginTop: 24 }}>
                            <button onClick={() => { setAnswers(a => ({ ...a, mood: null })); setStep(next); }} style={{ ...secondary, fontSize: 13 }}>Skip — any mood is fine</button>
                        </div>
                    </QStep>
                </div>
            );
        }

        if (step === "q_era") return (
            <div>
                <button onClick={() => setStep("q3")} style={backBtn}><ArrowLeft size={16} /> Back</button>
                <QStep step={4} total={totalQuestions} title="Modern or classic?">
                    <ChoiceList>
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, era: "modern" })); setStep("q5"); }} title="Modern" subtitle="Published since around 2000." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, era: "classic" })); setStep("q5"); }} title="Classics" subtitle="Pre-2000 canon and gems." />
                        <ChoiceCard onClick={() => { setAnswers(a => ({ ...a, era: "any" })); setStep("q5"); }} title="No preference" subtitle="Mostly modern with some classics." muted />
                    </ChoiceList>
                </QStep>
            </div>
        );

        if (step === "q5") {
            const toggle = (cw) => setAnswers(a => ({ ...a, avoid: a.avoid.includes(cw) ? a.avoid.filter(x => x !== cw) : [...a.avoid, cw] }));
            const stepNum = mode === "discover" ? 5 : 4;
            return (
                <div>
                    <button onClick={() => setStep(mode === "discover" ? "q_era" : "q3")} style={backBtn}><ArrowLeft size={16} /> Back</button>
                    <QStep step={stepNum} total={totalQuestions} title="Anything you want to avoid?" subtitle="Optional.">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 540, margin: "0 auto" }}>
                            {CONTENT_WARNINGS.map(cw => <button key={cw} onClick={() => toggle(cw)} aria-pressed={answers.avoid.includes(cw)} style={{ ...tagPill(answers.avoid.includes(cw), T.warm), minHeight: 44, padding: "10px 18px", fontSize: 14 }}>{cw}</button>)}
                        </div>
                        <div style={{ textAlign: "center", marginTop: 24 }}>
                            <button onClick={() => finishQuestionnaire(answers)} style={btnPrimary} disabled={loading}>
                                {loading ? <><Loader2 size={16} className="spin" /> Searching…</> : "Find my match →"}
                            </button>
                        </div>
                    </QStep>
                </div>
            );
        }

        if (step === "reveal" && match) {
            const { book, relaxed, source } = match;
            const cover = book ? coverUrl(book, "L") : null;
            const showCover = revealed;
            const isExternal = source === "discover";
            const whyText = book ? buildWhyText(book, match.answers, isExternal) : null;

            const handleAddToTBR = () => {
                onAddExternal({ title: book.title, author: book.author, year: book.year, cover: book.cover, isbn: book.isbn, pages: book.pages, subjects: book.subjects, synopsis: book.synopsis, publisher: book.publisher, googleId: book.googleId }, "want");
                onBack();
            };

            return (
                <div>
                    <button onClick={onBack} style={backBtn}><ArrowLeft size={16} /> Library</button>
                    <div style={{ maxWidth: 720, margin: "20px auto 0", textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                            {isExternal ? "A book found for you" : "A book from your TBR"}
                        </div>
                        {whyText && showCover && <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: T.muted, fontStyle: "italic", marginBottom: 16 }}>{whyText}</div>}
                        {relaxed && <div style={{ fontSize: 13, color: T.warm, fontStyle: "italic", marginBottom: 16 }}>I relaxed the {relaxed} filter to find something.</div>}
                        {match.error && <div style={{ fontSize: 14, color: T.muted, padding: 24, background: T.surface, borderRadius: 12, marginBottom: 16 }}>{match.error}</div>}

                        {book && (
                            <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 180px) 1fr", gap: 20, alignItems: "center", textAlign: "left", marginTop: 16 }}>
                                <div style={{ aspectRatio: "2/3", borderRadius: 10, overflow: "hidden", background: T.soft, boxShadow: "0 8px 24px rgba(45,58,46,0.15)", border: `1px solid ${T.border}` }}>
                                    {cover && !imgError ? (
                                        <img src={cover} srcSet={coverSrcSet(book)} alt={showCover ? `Cover of ${book.title}` : "Hidden"} className={showCover ? "reveal" : ""} style={{ width: "100%", height: "100%", objectFit: "cover", filter: showCover ? "none" : "blur(20px)", transition: "filter 600ms ease" }} onError={() => setImgError(true)} />
                                    ) : (
                                        <div style={{ filter: showCover ? "none" : "blur(20px)", width: "100%", height: "100%" }}><EmptyCover book={book} size="L" /></div>
                                    )}
                                </div>
                                <div>
                                    {showCover ? (
                                        <>
                                            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 400, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{book.title}</h2>
                                            <div style={{ color: T.muted, fontSize: 14, marginBottom: 12 }}>by {book.author}{book.year && ` · ${book.year}`}{book.pages && ` · ${book.pages}pp`}</div>
                                            {book.synopsis && <div style={{ fontSize: 13, lineHeight: 1.6, color: T.ink, fontStyle: "italic" }}>{book.synopsis.length > 200 ? book.synopsis.slice(0, 200) + "…" : book.synopsis}</div>}
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400, margin: "0 0 6px" }}>A book {isExternal ? "found for you" : "from your TBR"}</h2>
                                            <div style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>{book.pages ? `${book.pages} pages` : "Length unknown"}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                            {book && !showCover && <button onClick={() => setRevealed(true)} style={btnPrimary}><Eye size={16} /> Reveal</button>}
                            {book && showCover && !isExternal && (
                                <>
                                    <button onClick={() => { onPick(book.id); onOpen(book.id); }} style={btnPrimary}>Yes — I'll start this</button>
                                    <button onClick={() => { const newIds = reject(book.id); finishQuestionnaire(answers, newIds); setRevealed(!blindMode); }} style={secondary}>Show me another</button>
                                    <button onClick={onBack} style={{ ...secondary, color: T.muted }}>Not today</button>
                                </>
                            )}
                            {book && showCover && isExternal && (
                                <>
                                    <button onClick={handleAddToTBR} style={btnPrimary}><Plus size={16} /> Add to TBR</button>
                                    <button onClick={() => onFind(book)} style={{ ...secondary, background: T.accent, color: T.surface, border: "none" }}><ExternalLink size={16} /> Find in store</button>
                                    <button onClick={() => { const newIds = reject(book.googleId); finishQuestionnaire(answers, newIds); setRevealed(!blindMode); }} style={secondary}>Skip</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    }

    // ─── QStep / ChoiceList / ChoiceCard ─────────────────────────────────────────

    function QStep({ step, total, title, subtitle, children }) {
        return (
            <div style={{ maxWidth: 640, margin: "20px auto 0" }}>
                {step && <div style={{ fontSize: 12, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Question {step} of {total}</div>}
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.2 }}>{title}</h1>
                {subtitle && <p style={{ color: T.muted, textAlign: "center", marginBottom: 28, fontSize: 14 }}>{subtitle}</p>}
                <div style={{ marginTop: 24 }}>{children}</div>
            </div>
        );
    }

    function ChoiceList({ children }) { return <div style={{ display: "grid", gap: 10, maxWidth: 480, margin: "0 auto" }}>{children}</div>; }

    function ChoiceCard({ onClick, title, subtitle, icon, muted, disabled }) {
        return (
            <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.surface, color: muted || disabled ? T.muted : T.ink, cursor: disabled ? "not-allowed" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, opacity: disabled ? 0.5 : 1 }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
                {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
                <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500 }}>{title}</div>
                    {subtitle && <div style={{ color: T.muted, fontSize: 13, marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>}
                </div>
            </button>
        );
    }

    // ─── AddBook ──────────────────────────────────────────────────────────────────

    function AddBook({ onAdd, onCancel }) {
        const [query, setQuery] = useState("");
        const [results, setResults] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [hasSearched, setHasSearched] = useState(false);
        const [manualMode, setManualMode] = useState(false);
        const [manual, setManual] = useState({ title: "", author: "", year: "", pages: "" });
        const [manualCover, setManualCover] = useState(null);

        const doSearch = async (e) => {
            e?.preventDefault(); if (!query.trim()) return;
            setLoading(true); setError(null); setHasSearched(true); setResults([]);
            try { const r = await searchBooks(query); setResults(r); if (r.length === 0) setError("No books found."); }
            catch (err) { setError(`Couldn't reach the book search service. ${err.message || ""}`); }
            finally { setLoading(false); }
        };

        const pickBook = async (b) => {
            let synopsis = b.synopsis || null;
            if (!synopsis && b.googleId && b.googleId.startsWith("/works/")) {
                try {
                    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://openlibrary.org${b.googleId}.json`)}`);
                    if (res.ok) {
                    const data = await res.json();
                    if (data.description) {
                        synopsis = typeof data.description === "string" ? data.description : data.description.value || null;
                    }
                }
                } catch (_e) { /* ignore */ }
            }
            onAdd({ title: b.title, author: b.author, year: b.year, cover: b.cover, isbn: b.isbn, pages: b.pages, subjects: b.subjects || [], synopsis, publisher: b.publisher || null, googleId: b.googleId });
        };

        const submitManual = () => {
            if (!manual.title.trim()) return;
            onAdd({ title: manual.title.trim(), author: manual.author.trim() || "Unknown", year: parseInt(manual.year) || null, pages: parseInt(manual.pages) || null, cover: null, coverOverride: manualCover || undefined, isbn: null, subjects: [], synopsis: null, publisher: null, googleId: uid() });
        };

        if (manualMode) return (
            <div>
                <button onClick={() => setManualMode(false)} style={backBtn}><ArrowLeft size={16} /> Back to search</button>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Add manually</h1>
                <p style={{ color: T.muted, margin: "0 0 24px" }}>Fill in what you know. Only the title is required.</p>
                <div style={{ display: "grid", gap: 14, maxWidth: 480 }}>
                    <div>
                        <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Title *</div>
                        <input value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} placeholder="Book title" style={inputStyle} autoFocus />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Author</div>
                        <input value={manual.author} onChange={e => setManual(m => ({ ...m, author: e.target.value }))} placeholder="Author name" style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Year</div>
                            <input type="number" value={manual.year} onChange={e => setManual(m => ({ ...m, year: e.target.value }))} placeholder="e.g. 2023" style={inputStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Pages</div>
                            <input type="number" value={manual.pages} onChange={e => setManual(m => ({ ...m, pages: e.target.value }))} placeholder="e.g. 320" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Cover image (optional)</div>
                        <label style={{ ...btnPrimary, cursor: "pointer", display: "inline-flex" }}>
                            {manualCover ? "Replace cover" : "Upload cover"}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setManualCover(ev.target.result); reader.readAsDataURL(file); }} />
                        </label>
                        {manualCover && <div style={{ marginTop: 10, width: 80, aspectRatio: "2/3", borderRadius: 6, overflow: "hidden", border: `1px solid ${T.border}` }}><img src={manualCover} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    </div>
                    <button onClick={submitManual} disabled={!manual.title.trim()} style={{ ...btnPrimary, opacity: manual.title.trim() ? 1 : 0.5 }}>Add to library</button>
                </div>
            </div>
        );

        return (
            <div>
                <button onClick={onCancel} style={backBtn}><ArrowLeft size={16} /> Back to library</button>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Add a book</h1>
                <p style={{ color: T.muted, margin: "0 0 24px" }}>Search by title, author, or ISBN.</p>
                <form onSubmit={doSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted }} />
                        <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="e.g. Project Hail Mary, Tolkien, 9780451526538" style={{ ...inputStyle, paddingLeft: 42 }} />
                    </div>
                    <button type="submit" disabled={loading || !query.trim()} style={{ ...btnPrimary, opacity: loading || !query.trim() ? 0.5 : 1 }}>
                        {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Search
                    </button>
                </form>

                {error && (
                    <div style={{ padding: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 16 }}>
                        <div style={{ color: T.ink, marginBottom: 12 }}>{error}</div>
                        <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Can't find it? You can add it manually instead.</div>
                        <button onClick={() => setManualMode(true)} style={btnPrimary}><Plus size={16} /> Add manually</button>
                    </div>
                )}

                {!hasSearched && (
                    <div style={{ display: "grid", gap: 12 }}>
                        <div style={{ padding: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, color: T.muted, fontSize: 14 }}>
                            <strong style={{ color: T.ink, display: "block", marginBottom: 6 }}>Tips</strong>
                            Try the title alone first, then add the author if too many results come up. You can also search by ISBN.
                        </div>
                        <button onClick={() => setManualMode(true)} style={{ ...secondary, alignSelf: "flex-start" }}><Plus size={16} /> Add a book manually</button>
                    </div>
                )}

                {results.length > 0 && (
                    <div style={{ display: "grid", gap: 10 }}>
                        {results.map(b => (
                            <button key={b.googleId} onClick={() => pickBook(b)} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 12, alignItems: "center", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10, cursor: "pointer", color: T.ink, textAlign: "left" }}>
                                <div style={{ aspectRatio: "2/3", borderRadius: 6, overflow: "hidden", background: T.soft, border: `1px solid ${T.border}` }}>
                                    {coverUrl(b, "S")
                                        ? <img src={coverUrl(b, "S")} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.target.style.display = "none"} />
                                        : <EmptyCover book={b} size="S" />
                                    }
                                </div>
                                <div>
                                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 500 }}>{b.title}</div>
                                    <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>{b.author}{b.year && ` · ${b.year}`}{b.pages && ` · ${b.pages}pp`}</div>
                                </div>
                                <Plus size={20} color={T.accent} />
                            </button>
                        ))}
                        <button onClick={() => setManualMode(true)} style={{ ...secondary, justifyContent: "center", marginTop: 4, fontSize: 13 }}>Can't find the right edition? Add manually</button>
                    </div>
                )}
            </div>
        );
    }

    // ─── BookDetail ───────────────────────────────────────────────────────────────

    function BookDetail({ book, onUpdate, onDelete, onBack, isMobile, onFind }) {
        const [showSynopsis, setShowSynopsis] = useState(false);
        const [newQuote, setNewQuote] = useState("");
        const [imgError, setImgError] = useState(false);
        const cover = coverUrl(book, "L");
        const status = STATUSES.find(s => s.key === book.status);
        const isWantToRead = book.status === "want";
        const toggleMood = (m) => onUpdate({ moods: book.moods.includes(m) ? book.moods.filter(x => x !== m) : [...book.moods, m] });
        const toggleCw = (cw) => onUpdate({ contentWarnings: book.contentWarnings.includes(cw) ? book.contentWarnings.filter(x => x !== cw) : [...book.contentWarnings, cw] });
        const toggleTheme = (t) => { const themes = book.themes || []; onUpdate({ themes: themes.includes(t) ? themes.filter(x => x !== t) : [...themes, t] }); };

        return (
            <div>
                <button onClick={onBack} style={backBtn}><ArrowLeft size={16} /> Library</button>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(160px, 220px) 1fr", gap: isMobile ? 16 : 28, marginBottom: 28 }}>
                    <div style={{ aspectRatio: "2/3", borderRadius: 10, overflow: "hidden", background: T.soft, boxShadow: "0 8px 24px rgba(45,58,46,0.12)", border: `1px solid ${T.border}`, maxWidth: isMobile ? 160 : "100%" }}>
                        {cover && !imgError
                            ? <img src={cover} srcSet={coverSrcSet(book)} alt={`Cover of ${book.title}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgError(true)} />
                            : <EmptyCover book={book} size="L" />
                        }
                    </div>
                    <div>
                        <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, background: status.color, color: "white", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>{status.label}</div>
                        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 400, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{book.title}</h1>
                        <div style={{ color: T.muted, fontSize: 15, marginBottom: 14 }}>by {book.author}{book.year && ` · ${book.year}`}{book.pages && ` · ${book.pages} pages`}</div>
                        {isWantToRead && (
                            <button onClick={() => onFind(book)} style={{ ...btnPrimary, marginBottom: 14 }}><ExternalLink size={16} /> Find in store</button>
                        )}
                        {!isWantToRead && (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 12, color: T.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>Your rating</div>
                                <StarRating value={book.rating} onChange={(r) => onUpdate({ rating: r })} />
                            </div>
                        )}
                        {book.synopsis && (
                            <div>
                                <div style={{ fontSize: 12, color: T.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>Synopsis</div>
                                <div style={{ fontSize: 14, lineHeight: 1.6, color: T.ink }}>
                                    {showSynopsis || book.synopsis.length < 280 ? book.synopsis : book.synopsis.slice(0, 280) + "…"}
                                    {book.synopsis.length >= 280 && <button onClick={() => setShowSynopsis(!showSynopsis)} style={{ background: "none", border: "none", color: T.accent, padding: 0, marginLeft: 6, fontSize: 13, fontWeight: 500 }}>{showSynopsis ? "Show less" : "Read more"}</button>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Section title="Reading status">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {STATUSES.map(s => (
                            <button key={s.key} onClick={() => onUpdate({ status: s.key })} aria-pressed={book.status === s.key} style={{ minHeight: 38, padding: "6px 12px", borderRadius: 10, border: book.status === s.key ? `1.5px solid ${s.color}` : `1px solid ${T.border}`, background: book.status === s.key ? `${s.color}15` : "transparent", color: T.ink, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />{s.label}
                            </button>
                        ))}
                    </div>
                </Section>

                {!isWantToRead && (
                    <>
                        <Section title="Your reading dates">
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Started</div>
                                    <input type="date" value={book.startedAt || ""} onChange={e => onUpdate({ startedAt: e.target.value })} style={{ ...inputStyle, minHeight: 40 }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Finished</div>
                                    <input type="date" value={book.finishedAt || ""} onChange={e => onUpdate({ finishedAt: e.target.value })} style={{ ...inputStyle, minHeight: 40 }} />
                                </div>
                            </div>
                        </Section>

                        <Section title="How did it feel?" hint="Tag the moods you noticed.">
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{MOODS.map(m => <button key={m} onClick={() => toggleMood(m)} aria-pressed={book.moods.includes(m)} style={tagPill(book.moods.includes(m))}>{m}</button>)}</div>
                        </Section>

                        <Section title="Pace">
                            <div style={{ display: "flex", gap: 8 }}>{PACES.map(p => <button key={p} onClick={() => onUpdate({ pace: book.pace === p ? null : p })} aria-pressed={book.pace === p} style={tagPill(book.pace === p)}>{p}</button>)}</div>
                        </Section>

                        <Section title="Content warnings" hint="Useful for revisits or recommendations.">
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{CONTENT_WARNINGS.map(cw => <button key={cw} onClick={() => toggleCw(cw)} aria-pressed={book.contentWarnings.includes(cw)} style={tagPill(book.contentWarnings.includes(cw), T.warm)}>{cw}</button>)}</div>
                        </Section>

                        <Section title="Themes" hint="What ideas does this book explore?">
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                {THEMES.map(t => <button key={t} onClick={() => toggleTheme(t)} aria-pressed={(book.themes || []).includes(t)} style={tagPill((book.themes || []).includes(t))}>{t}</button>)}
                            </div>
                            <input value={book.customTheme || ""} onChange={e => onUpdate({ customTheme: e.target.value })} placeholder="Add your own theme and press Enter…" style={inputStyle}
                                onKeyDown={e => { if (e.key === "Enter" && book.customTheme?.trim()) { const themes = book.themes || []; const t = book.customTheme.trim(); if (!themes.includes(t)) onUpdate({ themes: [...themes, t], customTheme: "" }); } }} />
                            {(book.themes || []).filter(t => !THEMES.includes(t)).length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                                    {(book.themes || []).filter(t => !THEMES.includes(t)).map(t => (
                                        <span key={t} style={{ ...tagPill(true), cursor: "default", display: "flex", alignItems: "center", gap: 4 }}>
                                            {t}<button onClick={() => onUpdate({ themes: (book.themes || []).filter(x => x !== t) })} style={{ background: "none", border: "none", color: T.muted, padding: 0, cursor: "pointer", fontSize: 12 }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section title="Main characters" hint="People worth remembering.">
                            <textarea value={book.characters || ""} onChange={e => onUpdate({ characters: e.target.value })} rows={3} placeholder="e.g. Harry Potter — orphan wizard…" style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
                        </Section>

                        <Section title="Underlined passages" hint="Lines that stayed with you.">
                            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                                {(book.quotes || []).map((q, i) => (
                                    <div key={i} style={{ position: "relative", padding: "14px 16px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, borderLeft: `3px solid ${T.accent}` }}>
                                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, lineHeight: 1.6, color: T.ink, fontStyle: "italic" }}>"{q.text}"</div>
                                        <button onClick={() => onUpdate({ quotes: (book.quotes || []).filter((_, j) => j !== i) })} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>×</button>
                                    </div>
                                ))}
                            </div>
                            <textarea value={newQuote} onChange={e => setNewQuote(e.target.value)} placeholder="Type a passage you want to keep…" rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                                onKeyDown={e => { if (e.key === "Enter" && e.metaKey && newQuote.trim()) { onUpdate({ quotes: [...(book.quotes || []), { text: newQuote.trim(), addedAt: Date.now() }] }); setNewQuote(""); } }} />
                            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                                <button onClick={() => { if (!newQuote.trim()) return; onUpdate({ quotes: [...(book.quotes || []), { text: newQuote.trim(), addedAt: Date.now() }] }); setNewQuote(""); }} style={{ ...btnPrimary, minHeight: 36, padding: "6px 14px", fontSize: 13 }} disabled={!newQuote.trim()}>Save passage</button>
                                <span style={{ fontSize: 12, color: T.muted }}>or Cmd+Enter</span>
                            </div>
                        </Section>

                        <Section title="Your notes">
                            <textarea value={book.notes} onChange={e => onUpdate({ notes: e.target.value })} rows={4} placeholder="Thoughts, favourite moments, things to remember…" style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} />
                        </Section>
                    </>
                )}

                {book.subjects?.length > 0 && (
                    <Section title="Genres" hint="From Open Library.">
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{book.subjects.map(s => <span key={s} style={{ ...tagPill(false), cursor: "default" }}>{s}</span>)}</div>
                    </Section>
                )}

                <Section title="Cover image" hint="Upload your own cover if the automatic one is wrong.">
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <label style={{ ...btnPrimary, minHeight: 40, cursor: "pointer" }}>
                            {book.coverOverride ? "Replace cover" : "Upload cover"}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => onUpdate({ coverOverride: ev.target.result }); reader.readAsDataURL(file); }} />
                        </label>
                        {book.coverOverride && <button onClick={() => onUpdate({ coverOverride: "" })} style={secondary}>Remove custom cover</button>}
                    </div>
                </Section>

                <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                    <button onClick={onDelete} style={{ ...btn(false), color: "#B45A5A" }}><Trash2 size={16} /> Remove from library</button>
                </div>
            </div>
        );
    }

    // ─── StarRating / StarDisplay ─────────────────────────────────────────────────

    function StarRating({ value, onChange }) {
        const [hover, setHover] = useState(0);
        const display = hover || value;
        return (
            <div style={{ display: "flex", gap: 2, alignItems: "center" }} onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map(i => {
                    const full = display >= i; const half = display >= i - 0.5 && display < i;
                    return (
                        <span key={i} style={{ position: "relative", width: 30, height: 30, display: "inline-block" }}>
                            <button onClick={() => onChange(i - 0.5)} onMouseEnter={() => setHover(i - 0.5)} aria-label={`${i - 0.5} stars`} style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", background: "none", border: "none", padding: 0, zIndex: 2, cursor: "pointer" }} />
                            <button onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} stars`} style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%", background: "none", border: "none", padding: 0, zIndex: 2, cursor: "pointer" }} />
                            <Star size={26} fill={full ? T.warm : "transparent"} color={full || half ? T.warm : T.border} strokeWidth={1.5} style={{ position: "absolute", left: 2, top: 2 }} />
                            {half && <span style={{ position: "absolute", left: 2, top: 2, width: 13, height: 26, overflow: "hidden" }}><Star size={26} fill={T.warm} color={T.warm} strokeWidth={1.5} /></span>}
                        </span>
                    );
                })}
                <button onClick={() => onChange(0)} style={{ marginLeft: 6, background: "none", border: "none", color: T.muted, fontSize: 12, cursor: value > 0 ? "pointer" : "default", opacity: value > 0 ? 1 : 0 }}>clear</button>
                <span style={{ marginLeft: 4, color: T.muted, fontSize: 13 }}>{display > 0 ? display.toFixed(1) : ""}</span>
            </div>
        );
    }

    function StarDisplay({ rating, size = 13 }) {
        return (
            <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map(i => {
                    const full = rating >= i; const half = rating >= i - 0.5 && rating < i;
                    return (
                        <span key={i} style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
                            <Star size={size} fill={full ? T.warm : "transparent"} color={full || half ? T.warm : T.border} strokeWidth={1.5} />
                            {half && <span style={{ position: "absolute", left: 0, top: 0, width: size / 2, height: size, overflow: "hidden" }}><Star size={size} fill={T.warm} color={T.warm} strokeWidth={1.5} /></span>}
                        </span>
                    );
                })}
                <span style={{ marginLeft: 3, fontSize: size - 2, color: T.muted }}>{rating.toFixed(1)}</span>
            </div>
        );
    }

    // ─── Stats ────────────────────────────────────────────────────────────────────

    function Stats({ books, onBack }) {
        const data = useMemo(() => {
            const finished = books.filter(b => b.status === "finished");
            const thisYear = new Date().getFullYear().toString();
            const finishedThisYear = finished.filter(b => b.finishedAt?.startsWith(thisYear));
            const totalPages = finished.reduce((s, b) => s + (b.pages || 0), 0);
            const pagesThisYear = finishedThisYear.reduce((s, b) => s + (b.pages || 0), 0);
            const rated = finished.filter(b => b.rating > 0);
            const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length) : 0;
            const longestBook = finished.reduce((best, b) => (!best || (b.pages || 0) > (best.pages || 0)) ? b : best, null);
            const authorCounts = {}; finished.forEach(b => { authorCounts[b.author] = (authorCounts[b.author] || 0) + 1; });
            const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const moodCounts = {}; finished.forEach(b => b.moods.forEach(m => { moodCounts[m] = (moodCounts[m] || 0) + 1; }));
            const moods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
            const moodThisYear = {}; finishedThisYear.forEach(b => b.moods.forEach(m => { moodThisYear[m] = (moodThisYear[m] || 0) + 1; }));
            const topMoodThisYear = Object.entries(moodThisYear).sort((a, b) => b[1] - a[1])[0]?.[0];
            const paceCounts = { slow: 0, medium: 0, fast: 0 }; finished.forEach(b => { if (b.pace) paceCounts[b.pace]++; });
            const subjectCounts = {}; finished.forEach(b => (b.subjects || []).forEach(s => { subjectCounts[s] = (subjectCounts[s] || 0) + 1; }));
            const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
            const topGenre = topSubjects[0]?.[0];
            const statusCounts = {}; STATUSES.forEach(s => { statusCounts[s.key] = books.filter(b => b.status === s.key).length; });
            let blurb = null;
            if (finished.length >= 3) {
                const topMood = moods[0]?.[0];
                const topPace = Object.entries(paceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
                const avgPages = totalPages / finished.length;
                blurb = `You tend to reach for ${topMood || "varied"} books${topPace ? `, often at a ${topPace} pace` : ""}. Most are around ${Math.round(avgPages)} pages.`;
            }
            return { finished, finishedThisYear, totalPages, pagesThisYear, avgRating, longestBook, topAuthors, moods, topMoodThisYear, paceCounts, topSubjects, topGenre, statusCounts, blurb };
        }, [books]);

        if (books.length === 0) return (
            <div>
                <button onClick={onBack} style={backBtn}><ArrowLeft size={16} /> Library</button>
                <div style={{ padding: 60, textAlign: "center", color: T.muted }}>Add some books and your stats will appear here.</div>
            </div>
        );

        const year = new Date().getFullYear();

        return (
            <div>
                <button onClick={onBack} style={backBtn}><ArrowLeft size={16} /> Library</button>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Your reading</h1>
                <p style={{ color: T.muted, marginBottom: 28 }}>A gentle look at the books you've finished.</p>
                {data.blurb && <div style={{ padding: 20, background: `linear-gradient(135deg, ${T.accent}15, ${T.warm}10)`, border: `1px solid ${T.accent}30`, borderRadius: 14, marginBottom: 24, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.5, fontStyle: "italic", color: T.ink }}>"{data.blurb}"</div>}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                    <StatCard label="Books finished" value={data.finished.length} />
                    <StatCard label="Pages read" value={data.totalPages.toLocaleString()} />
                    <StatCard label="Avg rating" value={data.avgRating > 0 ? data.avgRating.toFixed(1) : "—"} suffix={data.avgRating > 0 ? "/5" : ""} />
                    <StatCard label="Reading now" value={data.statusCounts.reading} />
                </div>

                {data.finishedThisYear.length > 0 && (
                    <Section title={`${year} highlights`}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                            <div style={{ textAlign: "center", padding: 12 }}>
                                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: T.accent }}>{data.finishedThisYear.length}</div>
                                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>books this year</div>
                            </div>
                            <div style={{ textAlign: "center", padding: 12 }}>
                                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: T.accent }}>{data.pagesThisYear.toLocaleString()}</div>
                                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>pages this year</div>
                            </div>
                            {data.topMoodThisYear && <div style={{ textAlign: "center", padding: 12 }}>
                                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: T.accent, textTransform: "capitalize" }}>{data.topMoodThisYear}</div>
                                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>favourite mood this year</div>
                            </div>}
                            {data.longestBook && <div style={{ textAlign: "center", padding: 12 }}>
                                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: T.accent, lineHeight: 1.3 }}>{data.longestBook.title}</div>
                                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>longest book ({data.longestBook.pages}pp)</div>
                            </div>}
                            {data.topGenre && <div style={{ textAlign: "center", padding: 12 }}>
                                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, color: T.accent }}>{data.topGenre}</div>
                                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>top genre</div>
                            </div>}
                        </div>
                    </Section>
                )}

                {data.moods.length > 0 && <Section title="Moods you reach for"><BarList items={data.moods} max={data.moods[0][1]} color={T.accent} /></Section>}
                {(data.paceCounts.slow + data.paceCounts.medium + data.paceCounts.fast) > 0 && <Section title="Pace"><PaceDistribution counts={data.paceCounts} /></Section>}
                {data.topAuthors.length > 0 && <Section title="Most-read authors"><BarList items={data.topAuthors} max={data.topAuthors[0][1]} color={T.warm} /></Section>}
                {data.topSubjects.length > 0 && <Section title="Genres & themes"><BarList items={data.topSubjects} max={data.topSubjects[0][1]} color="#8B7AB0" /></Section>}
            </div>
        );
    }

    function StatCard({ label, value, suffix = "" }) {
        return (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}<span style={{ fontSize: 16, color: T.muted }}>{suffix}</span></div>
            </div>
        );
    }

    function BarList({ items, max, color }) {
        return (
            <div style={{ display: "grid", gap: 8 }}>
                {items.map(([label, count]) => (
                    <div key={label} style={{ display: "grid", gridTemplateColumns: "120px 1fr 36px", gap: 10, alignItems: "center", fontSize: 13 }}>
                        <div style={{ color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                        <div style={{ height: 8, background: T.bg, borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${(count / max) * 100}%`, height: "100%", background: color, borderRadius: 999 }} /></div>
                        <div style={{ color: T.muted, textAlign: "right" }}>{count}</div>
                    </div>
                ))}
            </div>
        );
    }

    function PaceDistribution({ counts }) {
        const total = counts.slow + counts.medium + counts.fast;
        const colors = { slow: "#8B7AB0", medium: T.accent, fast: T.warm };
        return (
            <div>
                <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                    {["slow", "medium", "fast"].map(p => counts[p] > 0 && <div key={p} style={{ width: `${(counts[p] / total) * 100}%`, background: colors[p] }} />)}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                    {["slow", "medium", "fast"].map(p => (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 999, background: colors[p] }} />
                            <span style={{ color: T.ink, textTransform: "capitalize" }}>{p}</span>
                            <span style={{ color: T.muted }}>{counts[p]}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function Section({ title, hint, children }) {
        return (
            <section style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 8 }}>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 500, margin: 0 }}>{title}</h2>
                    {hint && <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>{hint}</div>}
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>{children}</div>
            </section>
        );
    }

    // ─── Styles ───────────────────────────────────────────────────────────────────

    const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surface, color: T.ink, minHeight: 42, outline: "none" };
    const btn = (active) => ({ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "8px 16px", borderRadius: 10, border: active ? `1.5px solid ${T.accent}` : `1px solid ${T.border}`, background: active ? `${T.accent}15` : "transparent", color: T.ink, fontWeight: 500, fontSize: 14, cursor: "pointer" });
    const btnPrimary = { display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "8px 18px", borderRadius: 10, border: "none", background: T.accent, color: T.surface, fontWeight: 500, fontSize: 14, cursor: "pointer" };
    const secondary = { display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "8px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.ink, fontWeight: 500, fontSize: 14, cursor: "pointer" };
    const backBtn = { background: "none", border: "none", color: T.muted, padding: 0, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" };
    const tagPill = (active, color = T.accent) => ({ minHeight: 34, padding: "5px 11px", borderRadius: 999, border: active ? `1.5px solid ${color}` : `1px solid ${T.border}`, background: active ? `${color}20` : "transparent", color: T.ink, fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize" });


