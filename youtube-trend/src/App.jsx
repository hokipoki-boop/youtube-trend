import { useState, useEffect } from "react";

const REGIONS = [
  { code: "KR", label: "🇰🇷 한국", lang: "ko", shortsQ: "쇼츠" },
  { code: "US", label: "🇺🇸 미국", lang: "en", shortsQ: "shorts" },
  { code: "JP", label: "🇯🇵 일본", lang: "ja", shortsQ: "ショート" },
];

const CATEGORIES = [
  { id: "0",  label: "🔥 전체" },
  { id: "10", label: "🎵 음악" },
  { id: "23", label: "😂 코미디" },
  { id: "24", label: "🎮 게임" },
  { id: "25", label: "📰 뉴스" },
  { id: "17", label: "⚽ 스포츠" },
  { id: "22", label: "👤 브이로그" },
];

const SORTS = [
  { id: "default", label: "🎯 YouTube 추천순" },
  { id: "viewCount", label: "👁 조회수순" },
  { id: "likeCount", label: "❤️ 좋아요순" },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function formatCount(n) {
  if (!n) return "0";
  n = parseInt(n);
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
  if (n >= 10000) return (n / 10000).toFixed(1) + "만";
  if (n >= 1000) return (n / 1000).toFixed(1) + "천";
  return n.toString();
}

function VideoCard({ video, rank }) {
  const url = video.isShort
    ? `https://www.youtube.com/shorts/${video.id}`
    : `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 10 }}>
      <div
        style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid #f0f0f0", borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#ccc", minWidth: 22, textAlign: "center", paddingTop: 2 }}>{rank}</div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={video.thumbnail} alt={video.title} style={{ width: 100, height: 56, borderRadius: 8, objectFit: "cover", display: "block" }} />
          {video.isShort && (
            <span style={{ position: "absolute", bottom: 4, left: 4, background: "#FF0000", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>Shorts</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{video.title}</div>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{video.channelTitle} · {timeAgo(video.publishedAt)}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: "#f5f5f5", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#666" }}>👁 {formatCount(video.viewCount)}</span>
            <span style={{ background: "#f5f5f5", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#666" }}>❤️ {formatCount(video.likeCount)}</span>
            <span style={{ background: "#f5f5f5", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#666" }}>💬 {formatCount(video.commentCount)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function Btn({ active, onClick, children, color = "#111" }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color : "#fff", color: active ? "#fff" : "#555",
      border: `1px solid ${active ? color : "#ddd"}`,
      borderRadius: 99, padding: "5px 14px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap"
    }}>{children}</button>
  );
}

export default function App() {
  const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const [allVideos, setAllVideos] = useState([]);
  const [showCount, setShowCount] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [region, setRegion] = useState("KR");
  const [tab, setTab] = useState("trending");
  const [category, setCategory] = useState("0");
  const [sort, setSort] = useState("default");

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  async function fetchVideos(reg, type, cat) {
    setLoading(true);
    setError("");
    setAllVideos([]);
    setShowCount(15);

    const regionInfo = REGIONS.find(r => r.code === reg);
    const lang = regionInfo?.lang || "ko";
    const shortsQ = encodeURIComponent(regionInfo?.shortsQ || "shorts");

    try {
      let items = [];

      if (type === "shorts") {
        if (reg === "KR") {
          // 한국은 검색 API + 한국어 제목 필터
          const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=%EC%87%BC%EC%B8%A0&regionCode=KR&relevanceLanguage=ko&order=viewCount&maxResults=30&key=${API_KEY}`
          );
          const searchData = await searchRes.json();
          if (searchData.error) throw new Error(searchData.error.message);
          const videoIds = (searchData.items || []).map(i => i.id.videoId).filter(Boolean).join(",");
          if (videoIds) {
            const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`);
            const statsData = await statsRes.json();
            if (statsData.error) throw new Error(statsData.error.message);
            // 한글 제목만 필터
            const filtered = (statsData.items || []).filter(item =>
              /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(item.snippet.title)
            );
            items = filtered.length >= 5 ? filtered : statsData.items || [];
          }
        } else {
          // 미국/일본은 트렌딩 API + 60초 이하 필터
          const trendRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${reg}&maxResults=50&key=${API_KEY}`
          );
          const trendData = await trendRes.json();
          if (trendData.error) throw new Error(trendData.error.message);
          items = (trendData.items || []).filter(item => {
            const d = item.contentDetails?.duration || "";
            const match = d.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
            const secs = (parseInt(match?.[1] || 0) * 60) + parseInt(match?.[2] || 0);
            return secs > 0 && secs <= 60;
          });
        }
      } else {
        let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${reg}&maxResults=50&key=${API_KEY}`;
        if (cat !== "0") url += `&videoCategoryId=${cat}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        items = data.items || [];
      }

      setAllVideos(items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        viewCount: item.statistics?.viewCount,
        likeCount: item.statistics?.likeCount,
        commentCount: item.statistics?.commentCount,
        isShort: type === "shorts",
      })));
    } catch (e) {
      setError(e.message || "불러오기 실패.");
    }
    setLoading(false);
  }

  useEffect(() => { fetchVideos(region, tab, category); }, []);

  const update = (r, t, c) => { setRegion(r); setTab(t); setCategory(c); fetchVideos(r, t, c); };

  const sortedVideos = [...allVideos].sort((a, b) => {
    if (sort === "viewCount") return parseInt(b.viewCount || 0) - parseInt(a.viewCount || 0);
    if (sort === "likeCount") return parseInt(b.likeCount || 0) - parseInt(a.likeCount || 0);
    return 0;
  });
  const videos = sortedVideos.slice(0, showCount);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px", fontFamily: "sans-serif", background: "#f9f9f9", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>YouTube 인기 콘텐츠</h1>
          <p style={{ fontSize: 12, color: "#999", marginTop: 3 }}>{today}</p>
        </div>
        <button onClick={() => fetchVideos(region, tab, category)} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>🔄 새로고침</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <Btn active={tab === "trending"} color="#111" onClick={() => update(region, "trending", category)}>🔥 트렌딩</Btn>
        <Btn active={tab === "shorts"} color="#111" onClick={() => update(region, "shorts", category)}>▶ Shorts</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {REGIONS.map(r => <Btn key={r.code} active={region === r.code} color="#FF0000" onClick={() => update(r.code, tab, category)}>{r.label}</Btn>)}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => <Btn key={c.id} active={category === c.id} color="#7B5EA7" onClick={() => update(region, tab, c.id)}>{c.label}</Btn>)}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {SORTS.map(s => <Btn key={s.id} active={sort === s.id} color="#E67E22" onClick={() => { setSort(s.id); setShowCount(15); }}>{s.label}</Btn>)}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
          <div style={{ display: "inline-block", width: 22, height: 22, border: "2px solid #eee", borderTopColor: "#FF0000", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 10 }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 14 }}>불러오는 중...</p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 10, padding: 16, color: "#cc0000", fontSize: 13, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && videos.map((v, i) => <VideoCard key={v.id} video={v} rank={i + 1} />)}

      {!loading && showCount < sortedVideos.length && (
        <button onClick={() => setShowCount(c => c + 15)} style={{
          width: "100%", background: "#fff", border: "1px solid #ddd",
          borderRadius: 10, padding: "12px", fontSize: 14, cursor: "pointer", color: "#555", marginTop: 4
        }}>
          더 보기 ({sortedVideos.length - showCount}개 남음)
        </button>
      )}

      {!loading && !error && allVideos.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc", fontSize: 14 }}>영상이 없어요</div>
      )}
    </div>
  );
}
