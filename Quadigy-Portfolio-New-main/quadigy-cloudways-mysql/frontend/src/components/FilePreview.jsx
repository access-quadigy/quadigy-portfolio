// src/components/FilePreview.jsx
import React, { useRef, useEffect } from "react";

/* ---------- helpers ---------- */
const getExt = (url = "") =>
  (url.split("?")[0].split(".").pop() || "").toLowerCase();

const isYouTube = (url = "") =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

const toYouTubeEmbed = (url = "") => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.includes("/embed/")) return url;
    }
  } catch {}
  return url;
};

/* ---------- Aspect box ---------- */
function AspectBox({ children, aspect = "16/9" }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: aspect,
        position: "relative",
        background: "#000",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- component ---------- */
export default function FilePreview({
  fileUrl,
  label,
  className = "",
  aspect = "16/9",
}) {
  const vidRef = useRef(null);
  useEffect(() => {
    if (vidRef.current) {
      const p = vidRef.current.play?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }, [fileUrl]);

  if (!fileUrl) return null;
  const ext = getExt(fileUrl);

  const Wrap = ({ children }) => (
    <div
      className={`w-full rounded-xl overflow-hidden border border-[#e5e7eb] bg-white ${className}`}
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,.04)", marginBottom: 16 }}
    >
      {label && (
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid #eef0f2",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {label}
        </div>
      )}
      <div style={{ background: "#fafafa" }}>{children}</div>
    </div>
  );

  /* ---------- IMAGE ---------- */
  if (["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext)) {
    return (
      <Wrap>
        <AspectBox aspect={aspect}>
          <img
            src={fileUrl}
            alt={label || "image"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </AspectBox>
      </Wrap>
    );
  }

  /* ---------- YOUTUBE ---------- */
  if (isYouTube(fileUrl)) {
    const base = toYouTubeEmbed(fileUrl);
    const params = "autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1";
    const src = base.includes("?") ? `${base}&${params}` : `${base}?${params}`;
    return (
      <Wrap>
        <AspectBox aspect={aspect}>
          <iframe
            title={label || "YouTube"}
            src={src}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </AspectBox>
      </Wrap>
    );
  }

  /* ---------- VIDEO ---------- */
  if (["mp4", "webm", "ogg"].includes(ext)) {
    return (
      <Wrap>
        <AspectBox aspect={aspect}>
          <video
            ref={vidRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#000",
            }}
          >
            <source src={fileUrl} type={`video/${ext}`} />
            Your browser does not support the video tag.
          </video>
        </AspectBox>
      </Wrap>
    );
  }

  /* ---------- PDF ---------- */
  if (ext === "pdf") {
    return (
      <Wrap>
        <AspectBox aspect={aspect}>
          <iframe
            title={label || "PDF"}
            src={fileUrl}
            width="100%"
            height="100%"
            style={{ border: "none", display: "block" }}
          />
        </AspectBox>
      </Wrap>
    );
  }

  /* ---------- Office files (try Google Docs Viewer) ---------- */
  if (["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) {
    const googleViewer = `https://docs.google.com/gview?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`;

    const officeViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      fileUrl
    )}`;

    return (
      <Wrap>
        <AspectBox aspect={aspect}>
          <iframe
            title={label || "Office Document"}
            src={googleViewer}
            width="100%"
            height="100%"
            style={{ border: "none", display: "block" }}
          />
        </AspectBox>

        {/* Fallback link to Office Viewer (optional) */}
        <div style={{ padding: 8, textAlign: "center" }}>
          <a href={officeViewer} target="_blank" rel="noopener noreferrer">
            Open in Microsoft Office Viewer
          </a>
        </div>
      </Wrap>
    );
  }

  /* ---------- Fallback ---------- */
  return (
    <Wrap>
      <div style={{ padding: 16 }}>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          {label ? `${label} — Open file` : "Open file"}
        </a>
      </div>
    </Wrap>
  );
}
