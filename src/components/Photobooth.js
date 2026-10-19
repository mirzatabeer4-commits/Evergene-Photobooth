import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Webcam from "react-webcam";

const HEADING_FONT = "'Pirata One', 'UnifrakturCook', serif";
const HAND_FONT = "'Gaegu', 'Comic Sans MS', cursive";

/* ------------------------------------------------------------------ */
/*  Layout constants (all frame drawing happens in a 1200 x 3300 space) */
/* ------------------------------------------------------------------ */
const FRAME_W = 1200;
const FRAME_H = 3300;

const SLOT_WIDTH = 900;
const SLOT_HEIGHT = 600;
const STICKER_SIZE = 100;

const slots = [
    { x: 150, y: 330 },
    { x: 150, y: 970 },
    { x: 150, y: 1610 },
    { x: 150, y: 2250 }
];

const videoConstraints = {
    width: 900,
    height: 600,
    facingMode: "user"
};

const stickerOptions = [
    "/assets/stickers/jake.png",
    "/assets/stickers/jay.png",
    "/assets/stickers/jungwon.png",
    "/assets/stickers/sunghoon.png",
    "/assets/stickers/niki.png",
    "/assets/stickers/heeseung.png",
    "/assets/stickers/sunoo.png"
];

/* ------------------------------------------------------------------ */
/*  Per-member design: name, top doodles, bottom doodles               */
/*  bottom item = [type, x, y, size]                                   */
/* ------------------------------------------------------------------ */
const designs = {
    JUNGWON: { label: "JUNGWON", topL: "heart", topR: "star", bottom: [["crown", 270, 3070, 115]] },
    HEESEUNG: { label: "HEESEUNG", topL: "star", topR: "starFilled", bottom: [["sparkle", 300, 3080, 90]] },
    JAY: { label: "JAY", topL: "heart", topR: "dot", bottom: [["heart", 230, 3070, 60], ["signature", 470, 3090, 170]] },
    JAKE: { label: "JAKE", topL: "sparkle", topR: "starFilled", bottom: [["sparkle", 330, 3080, 85]] },
    SUNGHOON: { label: "SUNGHOON", topL: "star", topR: "star", bottom: [["signature", 380, 3090, 340]] },
    SUNOO: { label: "SUNOO", topL: "heart", topR: "heart", bottom: [["bolt", 320, 3080, 100]] },
    "NI-KI": { label: "Ni-Ki", topL: "star", topR: "bolt", bottom: [["heart", 170, 3010, 38], ["bolt", 340, 3080, 100]] }
};

const memberNames = Object.keys(designs);

/* ------------------------------------------------------------------ */
/*  Hand-drawn doodle helpers                                          */
/* ------------------------------------------------------------------ */
function makeRng(seedStr) {
    let a = 0;
    for (let i = 0; i < seedStr.length; i++) a = (a * 31 + seedStr.charCodeAt(i)) >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const wob = (r, amt) => (r() - 0.5) * amt;

function roundRectPath(p, x, y, w, h, rad) {
    p.moveTo(x + rad, y);
    p.arcTo(x + w, y, x + w, y + h, rad);
    p.arcTo(x + w, y + h, x, y + h, rad);
    p.arcTo(x, y + h, x, y, rad);
    p.arcTo(x, y, x + w, y, rad);
    p.closePath();
}

function polyPath(ctx, pts, cx, cy, S) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(cx + x * S, cy + y * S);
        else ctx.lineTo(cx + x * S, cy + y * S);
    });
    ctx.closePath();
}

function doodleStar(ctx, r, cx, cy, R, filled) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? R : R * 0.42;
        const x = cx + Math.cos(ang) * rad + wob(r, R * 0.1);
        const y = cy + Math.sin(ang) * rad + wob(r, R * 0.1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (filled) ctx.fill();
    ctx.stroke();
}

function doodleSparkle(ctx, cx, cy, R) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - R);
    ctx.quadraticCurveTo(cx + R * 0.12, cy - R * 0.12, cx + R, cy);
    ctx.quadraticCurveTo(cx + R * 0.12, cy + R * 0.12, cx, cy + R);
    ctx.quadraticCurveTo(cx - R * 0.12, cy + R * 0.12, cx - R, cy);
    ctx.quadraticCurveTo(cx - R * 0.12, cy - R * 0.12, cx, cy - R);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.55);
    ctx.lineTo(cx, cy + R * 0.55);
    ctx.moveTo(cx - R * 0.55, cy);
    ctx.lineTo(cx + R * 0.55, cy);
    ctx.stroke();
}

function doodleHeart(ctx, cx, cy, S) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + S * 0.9);
    ctx.bezierCurveTo(cx - S * 1.6, cy - S * 0.2, cx - S * 0.7, cy - S * 1.3, cx, cy - S * 0.35);
    ctx.bezierCurveTo(cx + S * 0.7, cy - S * 1.3, cx + S * 1.6, cy - S * 0.2, cx, cy + S * 0.9);
    ctx.closePath();
    ctx.stroke();
}

function doodleCrown(ctx, cx, cy, S) {
    polyPath(
        ctx,
        [[-1, 0.7], [-1.05, -0.55], [-0.45, 0.1], [0, -0.8], [0.45, 0.1], [1.05, -0.55], [1, 0.7]],
        cx, cy, S
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.95, cy + S * 0.35);
    ctx.lineTo(cx + S * 0.95, cy + S * 0.35);
    ctx.stroke();
    [[-1.05, -0.55], [0, -0.8], [1.05, -0.55]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(cx + x * S, cy + y * S - S * 0.12, S * 0.07, 0, Math.PI * 2);
        ctx.fill();
    });
}

function doodleBolt(ctx, cx, cy, S) {
    polyPath(
        ctx,
        [[0.35, -1], [-0.55, 0.15], [-0.05, 0.15], [-0.35, 1], [0.55, -0.2], [0.05, -0.2]],
        cx, cy, S
    );
    ctx.stroke();
}

function doodleSignature(ctx, r, cx, cy, W) {
    const n = 12;
    let px = cx - W / 2;
    ctx.beginPath();
    ctx.moveTo(px, cy);
    for (let i = 1; i <= n; i++) {
        const x = cx - W / 2 + (W * i) / n;
        const y = cy + wob(r, W * 0.35);
        ctx.quadraticCurveTo(px + (x - px) * 0.5, cy + wob(r, W * 0.6), x, y);
        px = x;
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.45, cy + W * 0.12);
    ctx.quadraticCurveTo(cx, cy + W * 0.22, cx + W * 0.5, cy - W * 0.08);
    ctx.stroke();
}

function drawIcon(ctx, r, type, x, y, s) {
    switch (type) {
        case "star": doodleStar(ctx, r, x, y, s, false); break;
        case "starFilled": doodleStar(ctx, r, x, y, s, true); break;
        case "sparkle": doodleSparkle(ctx, x, y, s); break;
        case "heart": doodleHeart(ctx, x, y, s * 0.8); break;
        case "crown": doodleCrown(ctx, x, y, s); break;
        case "bolt": doodleBolt(ctx, x, y, s * 1.2); break;
        case "signature": doodleSignature(ctx, r, x, y, s); break;
        case "dot":
            [[0, 0, 6], [26, -18, 4], [-22, 22, 4]].forEach(([dx, dy, rad]) => {
                ctx.beginPath();
                ctx.arc(x + dx, y + dy, rad, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        default: break;
    }
}

/* ------------------------------------------------------------------ */
/*  Frame generator: black chalk strip, name on top, doodles + logo    */
/*  below. `preview` fills the windows cream for the selection cards.  */
/* ------------------------------------------------------------------ */
function createFrame(member, scale = 1, preview = false) {
    const d = designs[member] || { label: member, topL: "star", topR: "star", bottom: [] };
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(FRAME_W * scale);
    canvas.height = Math.round(FRAME_H * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    const r = makeRng(member);

    // Preview windows (cream) go underneath the black body
    if (preview) {
        ctx.fillStyle = "#f4f1ec";
        slots.forEach((s) => {
            const w = new Path2D();
            roundRectPath(w, s.x, s.y, SLOT_WIDTH, SLOT_HEIGHT, 22);
            ctx.fill(w);
        });
    }

    // Black body with rounded window holes
    const body = new Path2D();
    roundRectPath(body, 0, 0, FRAME_W, FRAME_H, 50);
    slots.forEach((s) => roundRectPath(body, s.x, s.y, SLOT_WIDTH, SLOT_HEIGHT, 22));
    ctx.fillStyle = "#0c0c0d";
    ctx.fill(body, "evenodd");

    // Chalky texture
    ctx.save();
    ctx.clip(body, "evenodd");
    for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.07})`;
        const sz = 2 + r() * 5;
        ctx.fillRect(r() * FRAME_W, r() * FRAME_H, sz, sz * (0.5 + r() * 1.5));
    }
    for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.015 + r() * 0.03})`;
        ctx.lineWidth = 4 + r() * 10;
        const x = r() * FRAME_W;
        const y = r() * FRAME_H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + wob(r, 300), y + wob(r, 40));
        ctx.stroke();
    }
    ctx.restore();

    // Soft grey edge around each window
    ctx.strokeStyle = "#2b2b2e";
    ctx.lineWidth = 8;
    slots.forEach((s) => {
        const w = new Path2D();
        roundRectPath(w, s.x, s.y, SLOT_WIDTH, SLOT_HEIGHT, 22);
        ctx.stroke(w);
    });

    // White doodle style
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Member name at the top (outside the photo windows)
    ctx.save();
    ctx.translate(FRAME_W / 2, 175);
    ctx.rotate(-0.015);
    let size = 170;
    ctx.font = `700 ${size}px ${HAND_FONT}`;
    const tw = ctx.measureText(d.label).width;
    if (tw > 680) {
        size = size * (680 / tw);
        ctx.font = `700 ${size}px ${HAND_FONT}`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();

    // Top corner doodles
    drawIcon(ctx, r, d.topL, 150, 175, 46);
    drawIcon(ctx, r, d.topR, 1055, 160, 46);

    // Tiny scattered stars in the side margins
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
        const left = r() < 0.5;
        const x = left ? 40 + r() * 70 : 1090 + r() * 70;
        const y = 380 + r() * 2430;
        drawIcon(ctx, r, r() < 0.6 ? "star" : "sparkle", x, y, 14 + r() * 10);
    }

    // Bottom doodles
    ctx.lineWidth = 7;
    d.bottom.forEach(([type, x, y, s]) => drawIcon(ctx, r, type, x, y, s));

    ctx.lineWidth = 4;
    [[90, 3200, 20], [175, 3240, 14], [985, 3010, 16], [1105, 3050, 20]].forEach(([x, y, s]) =>
        drawIcon(ctx, r, "star", x, y, s)
    );

    // EN- logo
    ctx.font = "900 96px 'Arial Black', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const lx = 800;
    const ly = 3170;
    ctx.fillText("EN", lx, ly);
    const ew = ctx.measureText("EN").width;
    ctx.fillRect(lx + ew + 8, ly - 42, 60, 16);

    return canvas;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
function TitleStar({ flip }) {
    return (
        <svg
            width="70"
            height="50"
            viewBox="0 0 70 50"
            fill="none"
            stroke="#111"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: flip ? "scaleX(-1)" : "none", flexShrink: 0 }}
            aria-hidden="true"
        >
            <polygon className="eg-twinkle" points="22,8 26,18 37,19 29,26 31,37 22,31 13,37 15,26 7,19 18,18" />
            <path d="M44 14 L52 18" />
            <path d="M46 26 L56 26" />
            <path d="M44 38 L52 34" />
            <circle cx="6" cy="40" r="1.6" fill="#111" />
        </svg>
    );
}

export default function PhotoBooth() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const frameImgRef = useRef(null);

    const [selectedMember, setSelectedMember] = useState(null);
    const [frameLoaded, setFrameLoaded] = useState(false);
    const [fontsReady, setFontsReady] = useState(false);
    const [mode, setMode] = useState("photo");

    const [photos, setPhotos] = useState([]);
    const [photoCount, setPhotoCount] = useState(0);
    const [canTakePhoto, setCanTakePhoto] = useState(true);
    const [countdown, setCountdown] = useState(null);

    const [stickers, setStickers] = useState([]);
    const [selectedSticker, setSelectedSticker] = useState(null);

    const draggingPhoto = useRef(null);
    const draggingSticker = useRef(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Load the handwriting font, then allow frames to be drawn
    useEffect(() => {
        let active = true;
        const ready = () => active && setFontsReady(true);

        const finish = () => {
            Promise.all([
                document.fonts.load(`700 100px ${HAND_FONT}`),
                document.fonts.load(`400 100px ${HAND_FONT}`)
            ]).then(ready, ready);
        };

        let link = document.getElementById("gaegu-font");
        if (link) {
            finish();
        } else {
            link = document.createElement("link");
            link.id = "gaegu-font";
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap";
            link.onload = finish;
            link.onerror = ready;
            document.head.appendChild(link);
        }

        const safety = setTimeout(ready, 3000);
        return () => {
            active = false;
            clearTimeout(safety);
        };
    }, []);

    // Small previews for the selection screen
    const previews = useMemo(() => {
        if (!fontsReady) return {};
        const out = {};
        memberNames.forEach((m) => {
            out[m] = createFrame(m, 0.2, true).toDataURL("image/png");
        });
        return out;
    }, [fontsReady]);

    // Full-size frame for the selected member
    useEffect(() => {
        if (!selectedMember || !fontsReady) {
            frameImgRef.current = null;
            setFrameLoaded(false);
            return;
        }
        frameImgRef.current = createFrame(selectedMember, 1, false);
        setFrameLoaded(true);
    }, [selectedMember, fontsReady]);

    // Draw photos, frame, and stickers
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const frame = frameImgRef.current;

        if (!canvas || !frame || !frameLoaded) return;

        const ctx = canvas.getContext("2d");

        if (canvas.width !== frame.width || canvas.height !== frame.height) {
            canvas.width = frame.width;
            canvas.height = frame.height;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        photos.forEach((p) => {
            const slot = slots[p.slotIndex];
            if (!slot || !p.img.complete) return;

            const drawW = p.img.width * p.scale;
            const drawH = p.img.height * p.scale;

            ctx.save();
            ctx.beginPath();
            ctx.rect(slot.x, slot.y, SLOT_WIDTH, SLOT_HEIGHT);
            ctx.clip();
            ctx.drawImage(p.img, slot.x + p.offsetX, slot.y + p.offsetY, drawW, drawH);
            ctx.restore();
        });

        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

        stickers.forEach((s, i) => {
            if (!s.img.complete || !s.img.naturalWidth) return;

            ctx.drawImage(s.img, s.x, s.y, s.width, s.height);

            if (i === selectedSticker) {
                ctx.save();
                ctx.strokeStyle = "#e6193c";
                ctx.lineWidth = 6;
                ctx.strokeRect(s.x, s.y, s.width, s.height);
                ctx.restore();
            }
        });
    }, [photos, stickers, selectedSticker, frameLoaded]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // Add photo (scaled to cover the window, centered)
    const addPhoto = (img) => {
        if (photoCount >= 4) return;

        const scale = Math.max(SLOT_WIDTH / img.width, SLOT_HEIGHT / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        setPhotos((prev) => [
            ...prev,
            {
                img,
                slotIndex: photoCount,
                scale,
                offsetX: (SLOT_WIDTH - drawW) / 2,
                offsetY: (SLOT_HEIGHT - drawH) / 2
            }
        ]);

        const nextCount = photoCount + 1;
        setPhotoCount(nextCount);
        setCanTakePhoto(nextCount < 4);

        if (nextCount === 4) {
            setMode("decorate");
        }
    };

    // Take webcam photo
    const takePhotoNow = () => {
        const webcam = webcamRef.current;
        if (!webcam) {
            setCanTakePhoto(true);
            return;
        }

        const src = webcam.getScreenshot();

        if (!src) {
            setCanTakePhoto(true);
            return;
        }

        const img = new Image();
        img.onload = () => addPhoto(img);
        img.onerror = () => setCanTakePhoto(true);
        img.src = src;
    };

    const capturePhoto = () => {
        if (!canTakePhoto || countdown !== null) return;

        setCanTakePhoto(false);
        setCountdown(3);

        let current = 3;

        const interval = setInterval(() => {
            current -= 1;

            if (current === 0) {
                clearInterval(interval);
                setCountdown(null);
                takePhotoNow();
            } else {
                setCountdown(current);
            }
        }, 1000);
    };

    // Upload photo
    const uploadPhoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => addPhoto(img);
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    // Redo last photo
    const redoLastPhoto = () => {
        if (!photos.length) return;

        const updatedPhotos = photos.slice(0, -1);

        setPhotos(updatedPhotos);
        setPhotoCount(updatedPhotos.length);
        setCanTakePhoto(true);
        setMode("photo");
    };

    // Canvas coordinates
    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    // Add sticker
    const addSticker = (src) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const slot = slots[0];
            const x = Math.min(slot.x + 100, canvas.width - STICKER_SIZE);
            const y = Math.min(slot.y + 100, canvas.height - STICKER_SIZE);

            setStickers((prev) => [
                ...prev,
                {
                    img,
                    x: Math.max(0, x),
                    y: Math.max(0, y),
                    width: STICKER_SIZE,
                    height: STICKER_SIZE
                }
            ]);

            setSelectedSticker(stickers.length);
        };
        img.src = src;
    };

    // Mouse handlers
    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;
        const { x, y } = getCoords(e);

        if (mode === "decorate") {
            for (let i = stickers.length - 1; i >= 0; i--) {
                const s = stickers[i];
                if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
                    draggingSticker.current = i;
                    setSelectedSticker(i);
                    dragOffset.current = { x: x - s.x, y: y - s.y };
                    e.preventDefault();
                    return;
                }
            }
            setSelectedSticker(null);
        }

        if (mode === "photo") {
            for (let i = photos.length - 1; i >= 0; i--) {
                const p = photos[i];
                const slot = slots[p.slotIndex];
                const w = p.img.width * p.scale;
                const h = p.img.height * p.scale;

                if (
                    x >= slot.x + p.offsetX &&
                    x <= slot.x + p.offsetX + w &&
                    y >= slot.y + p.offsetY &&
                    y <= slot.y + p.offsetY + h
                ) {
                    draggingPhoto.current = i;
                    dragOffset.current = { x: x - slot.x - p.offsetX, y: y - slot.y - p.offsetY };
                    e.preventDefault();
                    return;
                }
            }
        }
    };

    const handleMouseMove = (e) => {
        if (!canvasRef.current) return;
        const { x, y } = getCoords(e);

        if (draggingSticker.current !== null && mode === "decorate") {
            const index = draggingSticker.current;
            setStickers((prev) => {
                const updated = [...prev];
                const s = updated[index];
                if (!s) return prev;
                updated[index] = {
                    ...s,
                    x: Math.max(0, Math.min(canvasRef.current.width - s.width, x - dragOffset.current.x)),
                    y: Math.max(0, Math.min(canvasRef.current.height - s.height, y - dragOffset.current.y))
                };
                return updated;
            });
        }

        if (draggingPhoto.current !== null && mode === "photo") {
            const index = draggingPhoto.current;
            setPhotos((prev) => {
                const updated = [...prev];
                const p = updated[index];
                if (!p) return prev;
                const slot = slots[p.slotIndex];
                const w = p.img.width * p.scale;
                const h = p.img.height * p.scale;

                updated[index] = {
                    ...p,
                    offsetX: Math.min(Math.max(x - slot.x - dragOffset.current.x, SLOT_WIDTH - w), 0),
                    offsetY: Math.min(Math.max(y - slot.y - dragOffset.current.y, SLOT_HEIGHT - h), 0)
                };
                return updated;
            });
        }
    };

    const handleMouseUp = () => {
        draggingPhoto.current = null;
        draggingSticker.current = null;
    };

    // Keyboard delete
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectedSticker !== null &&
                mode === "decorate"
            ) {
                e.preventDefault();
                setStickers((prev) => prev.filter((_, i) => i !== selectedSticker));
                setSelectedSticker(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedSticker, mode]);

    // Navigation back
    const handleBack = () => {
        if (mode === "decorate") {
            setMode("photo");
            setCanTakePhoto(photos.length < 4);
            setStickers([]);
            setSelectedSticker(null);
        } else {
            setSelectedMember(null);
            setFrameLoaded(false);
            setPhotos([]);
            setPhotoCount(0);
            setStickers([]);
            setSelectedSticker(null);
            setMode("photo");
            setCanTakePhoto(true);
        }
    };

    // Download strip
    const downloadPhoto = () => {
        const canvas = canvasRef.current;
        if (!canvas || !frameImgRef.current) return;

        drawCanvas();

        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `evergene-enhypen-${selectedMember || "strip"}.png`;
        a.click();
    };

    return (
        <div style={globalPageStyle}>
            <div style={centerCol}>
                <div className="eg-top-bar" style={topBar}>
                    {selectedMember && (
                        <button
                            style={{
                                ...buttonStyle,
                                position: "absolute",
                                left: 0,
                                top: 4,
                                height: 42,
                                padding: "0 22px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            onClick={handleBack}
                        >
                            Back
                        </button>
                    )}

                    <div className="eg-title-wrap" style={titleWrap}>
                        <TitleStar />
                        <h1 className="eg-title-bar" style={titleBar}>
                        {!selectedMember
                            ? "Select Your Bloodline"
                            : mode === "photo"
                            ? `${designs[selectedMember].label} - Strike a Pose`
                            : "Decorate Your Vampire Strip"}
                    </h1>
                        <TitleStar flip />
                    </div>
                </div>

                <div className="eg-main-content" style={mainContent}>
                    {!selectedMember ? (
                        <div className="eg-frame-grid" style={frameGrid}>
                            {memberNames.map((name, idx) => (
                                <div
                                    key={name}
                                    style={{ ...frameCardContainer, animation: `fadeUp 0.6s ease ${idx * 0.08}s both` }}
                                    onClick={() => setSelectedMember(name)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-12px) scale(1.05)";
                                        e.currentTarget.style.boxShadow =
                                            "0 0 0 3px #e8607a, 0 18px 32px rgba(0,0,0,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0px) scale(1)";
                                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
                                    }}
                                >
                                    {previews[name] ? (
                                        <img
                                            src={previews[name]}
                                            alt={`${designs[name].label} frame`}
                                            draggable={false}
                                            style={previewImgStyle}
                                        />
                                    ) : (
                                        <div style={previewPlaceholder} />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="eg-booth-row" style={rowStyle}>
                            <div>
                                {mode === "photo" && (
                                    <>
                                        <div className="eg-webcam-box" style={webcamBoxStyle}>
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/png"
                                                videoConstraints={videoConstraints}
                                                mirrored={true}
                                                style={{ width: "100%", display: "block" }}
                                            />

                                            {countdown !== null && (
                                                <div style={countdownOverlayStyle}>{countdown}</div>
                                            )}
                                        </div>

                                        <div className="eg-booth-controls" style={{ marginTop: 16, display: "flex", gap: 12 }}>
                                            {canTakePhoto && (
                                                <>
                                                    <button style={buttonStyle} onClick={capturePhoto}>
                                                        Take Photo
                                                    </button>

                                                    <label style={{ ...buttonStyle, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                                                        Upload
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={uploadPhoto}
                                                            style={{ display: "none" }}
                                                        />
                                                    </label>
                                                </>
                                            )}

                                            {photoCount > 0 && (
                                                <button style={buttonStyle} onClick={redoLastPhoto}>
                                                    Redo
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}

                                {mode === "decorate" && (
                                    <div className="eg-sticker-tray" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        {stickerOptions.map((src) => (
                                            <img
                                                key={src}
                                                src={src}
                                                alt="sticker"
                                                draggable={false}
                                                onClick={() => addSticker(src)}
                                                style={stickerThumbStyle}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <canvas
                                    ref={canvasRef}
                                    style={canvasStyle}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onDragStart={(e) => e.preventDefault()}
                                />

                                {mode === "decorate" && (
                                    <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                                        <button style={buttonStyle} onClick={downloadPhoto}>
                                            Download Strip
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const globalPageStyle = {
    color: "#111111",
    fontFamily: HAND_FONT,
    width: "100%",
    margin: 0,
    padding: "10px 0 40px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box"
};

const centerCol = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    width: "100%",
    maxWidth: "1250px"
};

const topBar = {
    width: "100%",
    height: 60,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};

const buttonStyle = {
    padding: "10px 26px",
    fontSize: 22,
    cursor: "pointer",
    fontFamily: HEADING_FONT,
    fontWeight: 400,
    letterSpacing: "2px",
    color: "#f7f4ee",
    border: "2px solid #111",
    borderRadius: 999,
    background: "#111",
    boxShadow: "3px 3px 0 #e8607a"
};

const frameGrid = {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
    maxWidth: "1250px",
    padding: "10px"
};

const frameCardContainer = {
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    width: "150px",
    lineHeight: 0
};

const previewImgStyle = {
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: 14
};

const previewPlaceholder = {
    width: "150px",
    height: "412px",
    borderRadius: 14,
    background: "#e9e4da"
};

const titleWrap = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 18
};

const titleBar = {
    margin: 0,
    textAlign: "center",
    fontFamily: HEADING_FONT,
    fontSize: "2.1rem",
    fontWeight: 400,
    letterSpacing: "3px",
    color: "#f7f4ee",
    background: "#111",
    padding: "8px 40px 10px 40px",
    borderRadius: 999,
    boxShadow: "4px 4px 0 #e8607a"
};

const mainContent = {
    minHeight: 550,
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start"
};

const rowStyle = {
    display: "flex",
    gap: 40,
    alignItems: "flex-start"
};

const webcamBoxStyle = {
    position: "relative",
    width: 400,
    borderRadius: 12,
    overflow: "hidden",
    border: "3px solid #111",
    boxShadow: "6px 6px 0 #e8607a"
};

const countdownOverlayStyle = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 110,
    fontFamily: HEADING_FONT,
    color: "#ffffff",
    background: "rgba(17,17,17,0.6)",
    pointerEvents: "none"
};

const stickerThumbStyle = {
    width: 60,
    height: 60,
    objectFit: "contain",
    cursor: "pointer",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))"
};

const canvasStyle = {
    width: 260,
    height: 715,
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
    display: "block",
    touchAction: "none",
    userSelect: "none"
};