import './App.css';
import React from "react";
import Photobooth from "./components/Photobooth";
import "./styles/global.css";

const logoSrc = "/assets/logo/evergene-logo.png"; // Optional logo path

const INK = "#111111";
const PINK = "#e8607a";
const CREAM = "#f7f4ee";

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Pirata+One&family=Gaegu:wght@400;700&display=swap');

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes twinkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50%      { transform: scale(1.18) rotate(8deg); opacity: 0.7; }
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

html, body { margin: 0; background: ${CREAM}; }
* { box-sizing: border-box; }

.eg-twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 3s ease-in-out infinite; }
.eg-float   { animation: floaty 4s ease-in-out infinite; }

button { transition: transform 0.15s ease, box-shadow 0.15s ease; }
button:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 ${PINK} !important; }
button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 ${PINK} !important; }
::selection { background: ${PINK}; color: #fff; }

.eg-header {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 22px 44px 18px 44px;
  border-bottom: 2px solid rgba(17,17,17,0.12);
  animation: fadeUp 0.7s ease both;
}
.eg-tagline {
  display: flex; align-items: center; gap: 12px;
  font-family: 'Gaegu', cursive; font-weight: 700; font-size: 1.5rem; color: ${INK};
}
.eg-meta {
  justify-self: end;
  display: flex; align-items: center; gap: 10px;
  font-family: 'Gaegu', cursive; font-weight: 700; font-size: 1.1rem; color: ${INK};
}
@media (max-width: 1000px) {
  .eg-header { grid-template-columns: 1fr; justify-items: start; }
  .eg-meta { justify-self: start; }
}
.eg-frame-grid { width: 100%; }
.eg-booth-row { width: 100%; justify-content: center; flex-wrap: wrap; padding: 0 16px; }
.eg-webcam-box { width: min(400px, 100%); }
.eg-sticker-tray { flex-wrap: wrap; justify-content: center; }
.eg-strip-canvas { width: min(260px, 82vw) !important; height: auto !important; }
.eg-booth-controls { flex-wrap: wrap; justify-content: center; }
.eg-back-button { z-index: 2; }
.eg-footer { flex-wrap: wrap; padding: 12px 16px 28px !important; gap: 10px !important; text-align: center; }
@media (max-width: 700px) {
  .eg-header { padding: 16px 14px !important; gap: 12px !important; justify-items: center; text-align: center; }
  .eg-header > div:first-child { justify-content: center; flex-wrap: wrap; gap: 8px !important; }
  .eg-header h1 { font-size: 2rem !important; }
  .eg-tagline { justify-content: center; font-size: 1.15rem !important; gap: 7px !important; }
  .eg-meta { justify-self: center; justify-content: center; flex-wrap: wrap; font-size: 1rem !important; gap: 6px !important; }
  .eg-main { padding-top: 18px !important; padding-bottom: 20px !important; }
  .eg-frame-grid { gap: 12px !important; padding: 8px !important; }
  .eg-frame-grid > div { width: calc(50% - 8px) !important; max-width: 150px; }
  .eg-frame-grid img { width: 100% !important; height: auto !important; }
  .eg-top-bar { height: auto !important; min-height: 54px; padding: 48px 10px 10px; }
  .eg-title-wrap { gap: 7px !important; max-width: 100%; }
  .eg-title-bar { font-size: clamp(1.05rem, 5vw, 1.5rem) !important; letter-spacing: 1px !important; padding: 8px 14px !important; }
  .eg-back-button { left: 10px !important; top: 0 !important; height: 36px !important; padding: 0 16px !important; font-size: 18px !important; }
  .eg-main-content { min-height: 0 !important; }
  .eg-booth-row { flex-direction: column; align-items: center; gap: 24px !important; padding: 0 12px; }
  .eg-booth-row > div { width: 100%; display: flex; flex-direction: column; align-items: center; }
  .eg-webcam-box { width: 100% !important; max-width: 400px; }
  .eg-booth-controls { gap: 8px !important; }
  .eg-booth-controls button, .eg-booth-controls label { font-size: 18px !important; padding: 9px 16px !important; }
  .eg-sticker-tray { gap: 8px !important; }
  .eg-sticker-tray img { width: 48px !important; height: 48px !important; }
  .eg-strip-canvas { width: min(260px, 78vw) !important; height: auto !important; max-width: 100%; }
  .eg-footer span { width: auto !important; }
}
@media (max-width: 380px) {
  .eg-header h1 { font-size: 1.7rem !important; }
  .eg-tagline { font-size: 1rem !important; }
  .eg-meta { font-size: .9rem !important; }
  .eg-frame-grid { gap: 9px !important; }
  .eg-frame-grid > div { width: calc(50% - 6px) !important; }
}

`;

/* Hand-drawn style SVG doodles (no emoji characters) */
function StarIcon({ size = 20, color = INK, filled = false, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6" />
    </svg>
  );
}

function HeartIcon({ size = 18, color = PINK, filled = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7-4.6-9.3-9C1 8.6 3 5 6.4 5c2 0 3.6 1.1 5.6 3.2C14 6.1 15.6 5 17.6 5 21 5 23 8.6 21.3 12 19 16.4 12 21 12 21z" />
    </svg>
  );
}

function App() {
  return (
    <div className="App" style={{
      position: "relative",
      overflow: "hidden",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: CREAM,
      backgroundImage: `
        radial-gradient(circle at 20% 10%, rgba(232, 96, 122, 0.07) 0%, transparent 45%),
        radial-gradient(circle at 85% 90%, rgba(17, 17, 17, 0.05) 0%, transparent 50%)
      `,
      color: INK,
      fontFamily: "'Gaegu', cursive",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <style>{globalCss}</style>

      {/* Header */}
      <header className="eg-header">
        {/* Left: logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <StarIcon size={22} className="eg-twinkle" />
          <img
            src={logoSrc}
            alt="Evergene Logo"
            style={{ width: 46, height: 46, objectFit: "contain" }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <h1 style={{
              fontFamily: "'UnifrakturMaguntia', serif",
              fontSize: "2.6rem",
              fontWeight: 400,
              letterSpacing: "2px",
              color: INK,
              margin: 0,
              lineHeight: 1
            }}>
              Evergene
            </h1>
            <span style={{
              fontFamily: "'Pirata One', serif",
              fontSize: "0.95rem",
              letterSpacing: "7px",
              color: PINK,
              marginTop: 4,
              textTransform: "uppercase"
            }}>
              Photobooth
            </span>
          </div>
          <StarIcon size={20} className="eg-twinkle" />
        </div>

        {/* Center: tagline */}
        <div className="eg-tagline">
          <HeartIcon />
          <span>Choose your favorite frame design</span>
          <HeartIcon />
        </div>

        {/* Right: meta */}
        <div className="eg-meta">
          <span>7 members</span>
          <HeartIcon size={14} filled={false} />
          <span>7 different vibes</span>
          <HeartIcon size={14} filled={false} />
          <span>1 ENHYPEN</span>
        </div>
      </header>

      {/* Main Photobooth Component Area */}
      <main className="eg-main" style={{
        position: "relative",
        flex: 1,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingBottom: "40px",
        paddingTop: "36px"
      }}>
        <Photobooth />
      </main>

      {/* Footer */}
      <footer className="eg-footer" style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: "10px 0 44px 0",
        fontFamily: "'Gaegu', cursive",
        fontSize: "1.15rem",
        color: PINK,
        letterSpacing: "1px"
      }}>
        <span style={{ width: 90, height: 2, background: PINK, opacity: 0.7 }} />
        <StarIcon size={20} color={PINK} className="eg-twinkle" />
        <span>ENHYPEN</span>
        <HeartIcon size={14} filled={false} />
        <span>ALWAYS &amp; FOREVER</span>
        <HeartIcon size={14} filled={false} />
        <StarIcon size={20} color={PINK} className="eg-twinkle" />
        <span style={{ width: 90, height: 2, background: PINK, opacity: 0.7 }} />
      </footer>

      {/* Corner heart doodle */}
      <svg
        className="eg-float"
        width="70"
        height="70"
        viewBox="0 0 70 70"
        fill="none"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "absolute", right: 28, bottom: 24, opacity: 0.55 }}
        aria-hidden="true"
      >
        <path d="M35 52s-17-10.5-22-21c-4-8 1-17 10-17 5 0 9 3 12 8 3-5 7-8 12-8 9 0 14 9 10 17-5 10.500-22 21-22 21z" />
        <path d="M6 64 L62 24" />
      </svg>
    </div>
  );
}

export default App;