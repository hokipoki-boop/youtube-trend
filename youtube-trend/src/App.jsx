import { useState, useEffect } from "react";

const REGIONS = [
  { code: "KR", label: "🇰🇷 한국" },
  { code: "US", label: "🇺🇸 미국" },
  { code: "JP", label: "🇯🇵 일본" },
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
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      background: "#fff", border: "1px solid #f0f0f0",
      borderRadius: 14, padding: "12px 14px", marginBottom: 10,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#ccc", minWidth: 22, textAlign: "center", paddingTop: 2 }}>
        {rank}
      </div>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          src={video.thumbnail}
          alt={video.title}
          style={{ width: 100, height: 56, borderRadius: 8, objectFit: "cover", display: "block" }}
        />
        {video.isShort && (
          <span style={{
            position: "absolute", bottom: 4, left: 4,
            background: "#FF0000", color: "#fff",
            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4
          }}>Shorts</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#111",
          marginBottom: 3, lineHeight: 1.4,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{video.channelTitle} · {timeAgo(video.publishedAt)}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: "#f5f5f5", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#666" }}>👁 {formatCount(video.viewCount)}</span>
          <span style={{ background: "#f5f5f5", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#666" }}>❤️ {formatCount(video.likeCount)}</span>
          <span style={{ background: "#f5f5f5", borderRadius: 99, padding: "2px 9px", fontSize: 11, color: "#666" }}>💬 {formatCount(video.commentCount)}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [region, setRegion] = useState("KR");
  const [tab, setTab] = useState("trending");

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  });

  async function fetchVideos(reg, type) {
    setLoading(true);
    setError("");
    setVideos([]);
    try {
      let items = [];
      if (type === "shorts") {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=%23Shorts&regionCode=${reg}&order=viewCount&maxResults=20&key=${API_KEY}`
        );
        const searchData = await searchRes.json();
        if (searchData.error) throw new Error(searchData.error.message);
        const videoIds = (searchData.items || []).map(i => i.id.videoId).join(",");
        if (videoIds) {
          const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`
          );
          const statsData = await statsRes.json();
          items = statsData.items || [];
        }
      } else {
        const trendRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${reg}&maxResults=20&key=${API_KEY}`
        );
        const trendData = await trendRes.json();
        if (trendData.error) throw new Error(trendData.error.message);
        items = trendData.items || [];
      }

      setVideos(items.slice(0, 15).map(item => ({
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

  useEffect(() => { fetchVideos(region, tab); }, []);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px", fontFamily: "sans-serif", background: "#f9f9f9", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>YouTube 인기 콘텐츠</h1>
          <p style={{ fontSize: 12, color: "#999", marginTop: 3 }}>{today}</p>
        </div>
        <button onClick={() => fetchVideos(region, tab)} style={{
          background: "#fff", border: "1px solid #ddd", borderRadius: 8,
          padding: "7px 14px", fontSize: 13, cursor: "pointer"
        }}>🔄 새로고침</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["trending", "🔥 트렌딩"], ["shorts", "▶ Shorts"]].map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); fetchVideos(region, id); }} style={{
            background: tab === id ? "#111" : "#fff",
            color: tab === id ? "#fff" : "#555",
            border: `1px solid ${tab === id ? "#111" : "#ddd"}`,
            borderRadius: 99, padding: "6px 16px", fontSize: 13, cursor: "pointer"
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {REGIONS.map(r => (
          <button key={r.code} onClick={() => { setRegion(r.code); fetchVideos(r.code, tab); }} style={{
            background: region === r.code ? "#FF0000" : "#fff",
            color: region === r.code ? "#fff" : "#555",
            border: `1px solid ${region === r.code ? "#FF0000" : "#ddd"}`,
            borderRadius: 99, padding: "5px 14px", fontSize: 12, cursor: "pointer"
          }}>{r.label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
          <div style={{
            display: "inline-block", width: 22, height: 22,
            border: "2px solid #eee", borderTopColor: "#FF0000",
            borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 10
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 14 }}>불러오는 중...</p>
        </div>
      )}

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 10, padding: 16, color: "#cc0000", fontSize: 13, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && videos.map((v, i) => (
        <VideoCard key={v.id} video={v} rank={i + 1} />
      ))}
    </div>
  );
}
