import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type SourceLanguage = "zh" | "en";
type Voice = "sreypov" | "dara" | "sovann";
type Screen = "setup" | "processing" | "editor";

type Segment = {
  id: number;
  start: number;
  end: number;
  source: string;
  text: string;
};

const initialSegments: Segment[] = [
  {
    id: 1,
    start: 0,
    end: 4.2,
    source: "Today, we are going to explore a completely new idea.",
    text: "ថ្ងៃនេះ យើងនឹងស្វែងយល់ពីគំនិតថ្មីមួយទាំងអស់គ្នា។",
  },
  {
    id: 2,
    start: 4.2,
    end: 8.8,
    source: "It can change the way we create and share stories.",
    text: "វាអាចផ្លាស់ប្តូររបៀបដែលយើងបង្កើត និងចែករំលែករឿងរ៉ាវ។",
  },
  {
    id: 3,
    start: 8.8,
    end: 13.6,
    source: "The process is simple, fast, and made for every creator.",
    text: "ដំណើរការនេះងាយស្រួល រហ័ស និងបង្កើតឡើងសម្រាប់អ្នកច្នៃប្រឌិតគ្រប់រូប។",
  },
  {
    id: 4,
    start: 13.6,
    end: 18.4,
    source: "Your voice can now reach a Khmer audience naturally.",
    text: "ឥឡូវនេះ សំឡេងរបស់អ្នកអាចទៅដល់ទស្សនិកជនខ្មែរបានយ៉ាងធម្មជាតិ។",
  },
];

const processSteps = [
  { at: 6, title: "កំពុងដកសំឡេង", detail: "Extracting dialogue & ambience" },
  { at: 28, title: "កំពុងស្គាល់ពាក្យ", detail: "Speech recognition" },
  { at: 50, title: "កំពុងបកប្រែជាខ្មែរ", detail: "Context-aware translation" },
  { at: 72, title: "កំពុងបង្កើតសំឡេង", detail: "Khmer voice synthesis" },
  { at: 90, title: "កំពុងតម្រឹមអក្សរ", detail: "Subtitle timing & render" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, JSX.Element> = {
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 15v4h14v-4"/></>,
    spark: <><path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    pause: <><path d="M9 7v10"/><path d="M15 7v10"/></>,
    download: <><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M5 20h14"/></>,
    edit: <><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6 4 16Z"/><path d="m13.8 7.8 2.4 2.4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    captions: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h3M14 10h3M7 14h4M13 14h4"/></>,
    arrow: <><path d="M5 12h14"/><path d="m15 8 4 4-4 4"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    key: <><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/></>,
  };

  return (
    <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("zh");
  const [voice, setVoice] = useState<Voice>("sreypov");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [subtitleSize, setSubtitleSize] = useState(62);
  const [progress, setProgress] = useState(0);
  const [segments, setSegments] = useState(initialSegments);
  const [activeSegment, setActiveSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file) {
      setVideoUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setVideoUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  useEffect(() => {
    if (screen !== "processing") return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setScreen("editor"), 650);
          return 100;
        }
        return Math.min(100, current + (current > 88 ? 2 : 3));
      });
    }, 125);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const processStep = useMemo(() => {
    return [...processSteps].reverse().find((step) => progress >= step.at) ?? processSteps[0];
  }, [progress]);

  const currentCaption = segments[activeSegment]?.text ?? "";

  const handleFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("video/")) {
      setToast("សូមជ្រើសរើសឯកសារវីដេអូ");
      return;
    }
    setFile(nextFile);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const startProcessing = () => {
    if (!file) {
      setToast("បន្ថែមវីដេអូសិន ដើម្បីចាប់ផ្តើម");
      return;
    }
    setProgress(0);
    setScreen("processing");
  };

  const openDemo = () => {
    setScreen("editor");
    setActiveSegment(0);
  };

  const togglePlayback = () => {
    const element = videoRef.current;
    if (!element) {
      setIsPlaying((value) => !value);
      return;
    }
    if (element.paused) void element.play();
    else element.pause();
  };

  const syncActiveSegment = () => {
    const time = videoRef.current?.currentTime ?? 0;
    const index = segments.findIndex((segment) => time >= segment.start && time < segment.end);
    if (index >= 0) setActiveSegment(index);
  };

  const jumpToSegment = (index: number) => {
    setActiveSegment(index);
    if (videoRef.current) {
      videoRef.current.currentTime = segments[index].start;
      void videoRef.current.play();
    } else {
      setIsPlaying(true);
    }
  };

  const updateSegment = (index: number, text: string) => {
    setSegments((items) => items.map((segment, itemIndex) => itemIndex === index ? { ...segment, text } : segment));
  };

  const downloadText = (name: string, content: string, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`បានទាញយក ${name}`);
  };

  const downloadSrt = () => {
    const srtTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
      const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
      const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
      const millis = Math.floor((seconds % 1) * 1000).toString().padStart(3, "0");
      return `${hours}:${minutes}:${secs},${millis}`;
    };
    const content = segments.map((segment, index) => `${index + 1}\n${srtTime(segment.start)} --> ${srtTime(segment.end)}\n${segment.text}\n`).join("\n");
    downloadText("aksaradub-khmer.srt", content);
  };

  const downloadProject = () => {
    downloadText("aksaradub-project.json", JSON.stringify({ sourceLanguage, targetLanguage: "km", voice, segments }, null, 2), "application/json");
  };

  return (
    <div className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("setup")} aria-label="AksaraDub home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-copy"><strong>អក្ខរា</strong><small>AKSARADUB</small></span>
        </button>
        <div className="topbar-actions">
          <span className="backend-status"><i /> Demo mode</span>
          {screen === "editor" && (
            <button className="button button-primary compact" onClick={() => setExportOpen(true)}>
              <Icon name="download" size={17} /> នាំចេញ
            </button>
          )}
          <button className="icon-button" aria-label="More options"><Icon name="more" /></button>
        </div>
      </header>

      {screen === "setup" && (
        <main className="setup-page">
          <section className="hero">
            <div className="signal-orbit" aria-hidden="true">
              <span className="orbit orbit-a" /><span className="orbit orbit-b" />
              <div className="signal-core"><span /><span /><span /><span /><span /></div>
            </div>
            <p className="eyebrow"><span>AI DUBBING STUDIO</span> · FOR KHMER CREATORS</p>
            <h1>បម្លែងសំឡេងវីដេអូ<br /><em>ទៅជាភាសាខ្មែរ</em></h1>
            <p className="hero-copy">បកប្រែពីភាសាចិន ឬអង់គ្លេស ទៅជាសំឡេងខ្មែរធម្មជាតិ ជាមួយអក្សររត់ត្រឹមពេលវេលា។</p>
            <div className="hero-meta"><span><Icon name="spark" size={16} /> Voice cloning ready</span><span><Icon name="captions" size={16} /> Khmer subtitles</span></div>
          </section>

          <section className="studio-grid" aria-label="Dubbing setup">
            <article className="panel media-panel">
              <div className="panel-heading">
                <div><span className="step-number">01</span><div><p className="label">SOURCE VIDEO</p><h2>ជ្រើសរើសវីដេអូ</h2></div></div>
                <span className="format-pill">MP4 · MOV · WEBM</span>
              </div>

              <label className={`drop-zone ${file ? "has-file" : ""}`} htmlFor="video-upload" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                <input id="video-upload" type="file" accept="video/*" onChange={handleInput} />
                {file ? (
                  <>
                    <div className="file-preview"><Icon name="video" size={30} /></div>
                    <div className="file-copy"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB · Ready to dub</span></div>
                    <span className="file-check"><Icon name="check" size={18} /></span>
                  </>
                ) : (
                  <>
                    <div className="upload-disc"><Icon name="upload" size={27} /></div>
                    <strong>ទម្លាក់វីដេអូនៅទីនេះ</strong>
                    <span>ឬចុចដើម្បីជ្រើសពីឧបករណ៍របស់អ្នក</span>
                    <small>រហូតដល់ 2GB · 4K supported</small>
                  </>
                )}
              </label>

              <div className="privacy-note">
                <span className="privacy-icon"><Icon name="key" size={17} /></span>
                <div><strong>ឯកសាររបស់អ្នកនៅតែឯកជន</strong><p>Prototype នេះបើកវីដេអូតែក្នុង browser របស់អ្នកប៉ុណ្ណោះ។</p></div>
              </div>
            </article>

            <article className="panel settings-panel">
              <div className="panel-heading">
                <div><span className="step-number">02</span><div><p className="label">DUB SETTINGS</p><h2>កំណត់ការបកប្រែ</h2></div></div>
              </div>

              <div className="field-group">
                <div className="field-label"><span>ភាសាដើម</span><small>SOURCE</small></div>
                <div className="language-route">
                  <div className="segmented">
                    <button className={sourceLanguage === "zh" ? "active" : ""} onClick={() => setSourceLanguage("zh")}><b>中</b><span>ភាសាចិន</span></button>
                    <button className={sourceLanguage === "en" ? "active" : ""} onClick={() => setSourceLanguage("en")}><b>EN</b><span>English</span></button>
                  </div>
                  <span className="route-arrow"><Icon name="arrow" size={17} /></span>
                  <div className="target-language"><b>ខ្មែរ</b><span>KH</span></div>
                </div>
              </div>

              <div className="field-group">
                <div className="field-label"><span>សំឡេង AI</span><small>VOICE</small></div>
                <div className="voice-list">
                  {([
                    ["sreypov", "ស្រីពៅ", "Female · Warm"],
                    ["dara", "ដារ៉ា", "Male · Clear"],
                    ["sovann", "សុវណ្ណ", "Male · Deep"],
                  ] as [Voice, string, string][]).map(([id, name, detail], index) => (
                    <button key={id} className={`voice-card ${voice === id ? "active" : ""}`} onClick={() => setVoice(id)}>
                      <span className={`voice-avatar voice-${index + 1}`}>{name.charAt(0)}</span>
                      <span><strong>{name}</strong><small>{detail}</small></span>
                      <i>{voice === id && <Icon name="check" size={14} />}</i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="subtitle-row">
                <div className="subtitle-title"><span className="subtitle-icon"><Icon name="captions" size={18} /></span><div><strong>អក្សរខ្មែររត់ខាងក្រោម</strong><small>Burned-in Khmer subtitles</small></div></div>
                <button className={`switch ${subtitlesOn ? "on" : ""}`} onClick={() => setSubtitlesOn((value) => !value)} aria-label="Toggle subtitles"><span /></button>
              </div>
              <div className={`subtitle-control ${subtitlesOn ? "" : "disabled"}`}>
                <span>តូច</span><input type="range" min="42" max="82" value={subtitleSize} onChange={(event) => setSubtitleSize(Number(event.target.value))} /><span>ធំ</span>
              </div>
            </article>
          </section>

          <div className="start-row">
            <button className="button button-ghost" onClick={openDemo}><Icon name="play" size={17} /> មើល demo</button>
            <button className="button button-primary start-button" onClick={startProcessing}>
              <Icon name="spark" size={19} /> ចាប់ផ្តើមបង្កើតវីដេអូ <Icon name="arrow" size={18} />
            </button>
          </div>

          <aside className="backend-banner">
            <Icon name="key" size={19} /><p><strong>GitHub Pages ready:</strong> UI នេះអាចដាក់លើ GitHub Pages បាន។ AI dubbing ពិតត្រូវភ្ជាប់ API backend ដាច់ដោយឡែក ដើម្បីរក្សា key ឱ្យមានសុវត្ថិភាព។</p><span>Frontend only</span>
          </aside>
        </main>
      )}

      {screen === "processing" && (
        <main className="processing-page">
          <section className="processing-card">
            <div className="processing-orbit" aria-hidden="true"><span /><span /><div className="wave-bars">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</div></div>
            <p className="label">AKSARADUB AI ENGINE</p>
            <h1>{processStep.title}</h1>
            <p>{processStep.detail}</p>
            <strong className="progress-number">{progress.toString().padStart(2, "0")}<small>%</small></strong>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
            <div className="process-timeline">
              {processSteps.map((step, index) => <span key={step.title} className={progress >= step.at ? "done" : ""}><i>{progress >= step.at ? <Icon name="check" size={12} /> : index + 1}</i>{step.title}</span>)}
            </div>
            <small className="processing-note">កុំបិទ browser ខណៈពេលកំពុងដំណើរការ</small>
          </section>
        </main>
      )}

      {screen === "editor" && (
        <main className="editor-page">
          <section className="editor-intro">
            <div><p className="eyebrow"><span>PROJECT READY</span> · 4 SEGMENTS</p><h1>ពិនិត្យ និងកែសម្រួល</h1><p>ចុចលើប្រយោគណាមួយ ដើម្បីកែអក្សរខ្មែរមុនពេលនាំចេញ។</p></div>
            <div className="ready-badge"><span><Icon name="check" size={17} /></span><div><strong>បានបង្កើតរួចរាល់</strong><small>{sourceLanguage === "zh" ? "Chinese" : "English"} → Khmer · {voice}</small></div></div>
          </section>

          <section className="editor-grid">
            <article className="video-workbench">
              <div className={`video-stage ${isPlaying ? "playing" : ""}`}>
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} onTimeUpdate={syncActiveSegment} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} playsInline />
                ) : (
                  <div className="demo-film">
                    <div className="film-sun" /><div className="film-horizon" />
                    <div className="film-figure"><span /></div>
                    <div className="demo-label">DEMO PREVIEW</div>
                  </div>
                )}
                {subtitlesOn && <div className="burned-caption" style={{ fontSize: `clamp(1rem, ${subtitleSize / 32}vw, 1.75rem)` }}>{currentCaption}</div>}
                <button className="stage-play" onClick={togglePlayback} aria-label="Play video"><Icon name={isPlaying ? "pause" : "play"} size={27} /></button>
                <div className="stage-top"><span>9:16</span><span>KH · AI VOICE</span></div>
              </div>
              <div className="transport">
                <button onClick={togglePlayback}><Icon name={isPlaying ? "pause" : "play"} size={18} /></button>
                <span>{formatTime(segments[activeSegment]?.start ?? 0)}</span>
                <div className="transport-track"><i style={{ width: `${((activeSegment + 1) / segments.length) * 100}%` }} /><b style={{ left: `${((activeSegment + 1) / segments.length) * 100}%` }} /></div>
                <span>0:18</span>
              </div>
              <div className="audio-strip"><span className="audio-label">AI</span><div>{Array.from({ length: 54 }, (_, index) => <i key={index} style={{ height: `${20 + ((index * 13) % 75)}%` }} />)}</div></div>
            </article>

            <article className="transcript-panel">
              <div className="transcript-head"><div><p className="label">KHMER SUBTITLES</p><h2>អត្ថបទ និងពេលវេលា</h2></div><button className="icon-button"><Icon name="edit" size={18} /></button></div>
              <div className="segment-list">
                {segments.map((segment, index) => (
                  <div className={`segment ${activeSegment === index ? "active" : ""}`} key={segment.id} onClick={() => setActiveSegment(index)}>
                    <button className="segment-play" onClick={(event) => { event.stopPropagation(); jumpToSegment(index); }} aria-label={`Play segment ${index + 1}`}><Icon name="play" size={15} /></button>
                    <div className="segment-body">
                      <div className="segment-meta"><span>{String(index + 1).padStart(2, "0")}</span><time>{formatTime(segment.start)} — {formatTime(segment.end)}</time><small>{(segment.end - segment.start).toFixed(1)}s</small></div>
                      <textarea value={segment.text} onChange={(event) => updateSegment(index, event.target.value)} aria-label={`Khmer subtitle ${index + 1}`} />
                      <p>{segment.source}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="transcript-footer"><span><Icon name="globe" size={15} /> Auto-translated</span><span>92% confidence</span></div>
            </article>
          </section>

          <div className="editor-actions">
            <button className="button button-ghost" onClick={() => setScreen("setup")}>← កែការកំណត់</button>
            <div><button className="button button-outline" onClick={downloadSrt}><Icon name="captions" size={17} /> Download SRT</button><button className="button button-primary" onClick={() => setExportOpen(true)}><Icon name="download" size={17} /> នាំចេញវីដេអូ</button></div>
          </div>
        </main>
      )}

      {exportOpen && (
        <div className="modal-backdrop" onMouseDown={() => setExportOpen(false)}>
          <section className="export-modal" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
            <button className="modal-close" onClick={() => setExportOpen(false)} aria-label="Close"><Icon name="close" size={19} /></button>
            <div className="modal-icon"><Icon name="download" size={24} /></div>
            <p className="label">EXPORT PROJECT</p><h2>ជ្រើសរើសឯកសារ</h2><p className="modal-copy">Subtitle និង project data អាចទាញយកបានភ្លាមៗ។ Dubbed MP4 ត្រូវការភ្ជាប់ AI backend។</p>
            <div className="export-options">
              <button onClick={downloadSrt}><span><Icon name="captions" /><i><strong>Khmer Subtitles</strong><small>.SRT · Ready</small></i></span><Icon name="download" /></button>
              <button onClick={downloadProject}><span><Icon name="edit" /><i><strong>Editable Project</strong><small>.JSON · Ready</small></i></span><Icon name="download" /></button>
              <button className="locked" onClick={() => setToast("ភ្ជាប់ AI backend សិន ដើម្បី render MP4")}><span><Icon name="video" /><i><strong>Dubbed Video</strong><small>.MP4 · Backend required</small></i></span><Icon name="key" /></button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}
