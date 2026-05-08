export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing q" });

  try {
    const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,first_publish_year,isbn,cover_i,language,edition_count,number_of_pages_median&limit=40`;
    const olRes = await fetch(olUrl);
    if (olRes.ok) {
      const olData = await olRes.json();
      const docs = olData.docs || [];
      const scored = docs.map(doc => {
          let score = 0;
          if ((doc.language || []).includes("eng")) score += 50;
          const isbns = doc.isbn || [];
          const isbn13 = isbns.find(i => i.length === 13);
          const isbn10 = isbns.find(i => i.length === 10);
          if (isbn13) score += 30; else if (isbn10) score += 15;
          if (doc.cover_i) score += 20;
          if ((doc.edition_count || 0) > 5) score += 10;
          if (doc.number_of_pages_median) score += 5;
          return {
              googleId: doc.key,
              title: doc.title || "Untitled",
              author: (doc.author_name || []).slice(0, 2).join(", ") || "Unknown",
              year: doc.first_publish_year || null,
              isbn: isbn13 || isbn10 || null,
              cover: null,
              pages: doc.number_of_pages_median || null,
              subjects: [], synopsis: null, publisher: null, score,
          };
      }).filter(b => b.score >= 50).sort((a, b) => b.score - a.score).slice(0, 12);
      if (scored.length >= 1) return res.status(200).json({ results: scored, source: "openlibrary" });
    }
  } catch (e) { /* fall through to Google */ }

  const GOOGLE_KEY = process.env.GOOGLE_BOOKS_KEY;
  if (!GOOGLE_KEY) return res.status(200).json({ results: [], source: "none" });

  const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&printType=books&langRestrict=en&key=${GOOGLE_KEY}`);
  if (!gbRes.ok) return res.status(200).json({ results: [], source: "none" });
  const gbData = await gbRes.json();
  const results = (gbData.items || []).filter(item => {
          const v = item.volumeInfo || {};
          return v.language === "en" && (v.industryIdentifiers || []).length > 0;
      }).slice(0, 12).map(item => {
          const v = item.volumeInfo || {};
          const isbns = v.industryIdentifiers || [];
          const isbn13 = isbns.find(i => i.type === "ISBN_13")?.identifier;
          const isbn10 = isbns.find(i => i.type === "ISBN_10")?.identifier;
          const thumb = v.imageLinks?.thumbnail;
          return {
              googleId: item.id,
              title: v.title || "Untitled",
              author: (v.authors || []).slice(0, 2).join(", ") || "Unknown",
              year: v.publishedDate ? parseInt(v.publishedDate.slice(0, 4), 10) : null,
              isbn: isbn13 || isbn10 || null,
              cover: thumb ? thumb.replace(/^http:/, "https:").replace(/&edge=curl/, "") : null,
              pages: v.pageCount || null,
              subjects: (v.categories || []).slice(0, 6),
              synopsis: v.description ? v.description.replace(/<[^>]+>/g, "").trim() : null,
              publisher: v.publisher || null, score: 50,
          };
      });
  return res.status(200).json({ results, source: "google" });
} 