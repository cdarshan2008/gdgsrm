import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QRCode from 'qrcode';
import './styles.css';

const STORAGE_KEY = 'gdg-srm-qr-history-v1';
const MAX_HISTORY = 8;

const PRESETS = {
  classic: { label: 'Classic', fg: '#111827', bg: '#ffffff', level: 'M', margin: 4, size: 320, gradient: false },
  midnight: { label: 'Midnight', fg: '#ffffff', bg: '#111827', level: 'H', margin: 4, size: 320, gradient: false },
  ocean: { label: 'Ocean', fg: '#075985', bg: '#f0f9ff', level: 'Q', margin: 4, size: 320, gradient: true },
  forest: { label: 'Forest', fg: '#166534', bg: '#f0fdf4', level: 'Q', margin: 5, size: 320, gradient: false },
  berry: { label: 'Berry', fg: '#9d174d', bg: '#fff1f2', level: 'H', margin: 5, size: 320, gradient: true }
};

const DEFAULT_FORM = {
  type: 'url', url: 'https://gdgsrm.com', text: '', email: '', subject: '', body: '', phone: '',
  ssid: '', password: '', security: 'WPA', hidden: false
};

function App() {
  const canvasRef = useRef(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [settings, setSettings] = useState({ size: 320, fg: '#111827', bg: '#ffffff', level: 'M', margin: 4, gradient: false, logo: false });
  const [preset, setPreset] = useState('classic');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  const payload = useMemo(() => buildPayload(form), [form]);

  useEffect(() => {
    generate();
  }, [payload, settings]);

  useEffect(() => {
    if (!ready || error || !payload) return;
    const timer = setTimeout(() => {
      const item = { id: crypto.randomUUID(), type: form.type, payload, label: historyLabel(form), createdAt: Date.now(), form: { ...form }, settings: { ...settings } };
      setHistory(h => [item, ...h.filter(x => x.payload !== payload)].slice(0, MAX_HISTORY));
    }, 700);
    return () => clearTimeout(timer);
  }, [payload, settings, ready, error]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  async function generate() {
    const validation = validate(form);
    setError(validation.error);
    setWarning(validation.warning);
    if (validation.error || !canvasRef.current) {
      setReady(false);
      return;
    }
    try {
      const options = {
        errorCorrectionLevel: settings.level,
        margin: Number(settings.margin),
        width: Number(settings.size),
        color: { dark: settings.fg, light: settings.bg }
      };
      await QRCode.toCanvas(canvasRef.current, payload, options);
      if (settings.gradient) applyGradientOverlay(canvasRef.current, settings);
      setReady(true);
    } catch (e) {
      setError('This content is too long for the selected error correction level. Try shorter text or a larger QR size.');
      setReady(false);
    }
  }

  function applyGradientOverlay(canvas, s) {
    const ctx = canvas.getContext('2d');
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, s.fg);
    gradient.addColorStop(1, shiftColor(s.fg, 28));
    const temp = document.createElement('canvas'); temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext('2d'); tctx.fillStyle = gradient; tctx.fillRect(0, 0, canvas.width, canvas.height);
    const colors = tctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < image.data.length; i += 4) {
      if (image.data[i] < 100 && image.data[i + 1] < 100 && image.data[i + 2] < 100) {
        image.data[i] = colors[i]; image.data[i + 1] = colors[i + 1]; image.data[i + 2] = colors[i + 2];
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  function updateForm(key, value) { setForm(f => ({ ...f, [key]: value })); }
  function updateSetting(key, value) { setSettings(s => ({ ...s, [key]: value })); setPreset('custom'); }

  function usePreset(name) {
    const p = PRESETS[name];
    setPreset(name);
    setSettings(s => ({ ...s, ...p }));
  }

  function saveRecent() {
    if (!ready || error) return;
    const item = { id: crypto.randomUUID(), type: form.type, payload, label: historyLabel(form), createdAt: Date.now(), form: { ...form }, settings: { ...settings } };
    setHistory(h => [item, ...h.filter(x => x.payload !== payload)].slice(0, MAX_HISTORY));
  }

  function restore(item) {
    setForm(item.form);
    setSettings(item.settings);
    setPreset('custom');
  }

  function downloadPNG() {
    if (!ready) return;
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    saveRecent();
  }

  function downloadSVG() {
    if (error) return;
    QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: settings.level, margin: Number(settings.margin), color: { dark: settings.fg, light: settings.bg } }).then(svg => {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `qr-${Date.now()}.svg`; a.click(); URL.revokeObjectURL(a.href); saveRecent();
    });
  }

  async function copyPayload() {
    if (!payload || error) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">QR</div><div><strong>QR Code Studio</strong><span>GDG on Campus · SRM</span></div></div>
      <div className="browser-pill"><span className="live-dot"/> Browser-only · No backend</div>
    </header>

    <main className="layout">
      <section className="panel controls">
        <div className="section-heading"><div><span className="eyebrow">CREATE</span><h1>Build your QR</h1></div><span className="badge">LIVE</span></div>
        <div className="type-grid">
          {['url','text','email','phone','wifi'].map(t => <button key={t} className={`type-btn ${form.type === t ? 'active' : ''}`} onClick={() => updateForm('type', t)}><span>{icons[t]}</span>{typeLabels[t]}</button>)}
        </div>
        <div className="form-area">{renderInputs(form, updateForm)}</div>
        {error && <div className="alert error"><b>Fix this:</b> {error}</div>}
        {warning && !error && <div className="alert warning"><b>Scan check:</b> {warning}</div>}
      </section>

      <section className="panel preview-panel">
        <div className="preview-head"><div><span className="eyebrow">PREVIEW</span><h2>Instant result</h2></div><button className="ghost" onClick={copyPayload}>{copied ? 'Copied ✓' : 'Copy data'}</button></div>
        <div className="qr-stage"><div className="qr-card">{error ? <div className="empty-state"><div className="empty-icon">!</div><strong>Waiting for valid data</strong><span>Complete the fields to generate your QR code.</span></div> : <canvas ref={canvasRef} aria-label="Generated QR code"/>}</div></div>
        <div className="preview-meta"><span>{ready ? '● QR ready to scan' : '○ Awaiting input'}</span><span>{settings.size} × {settings.size}px</span></div>
        <div className="actions"><button className="primary" disabled={!ready} onClick={downloadPNG}>Download PNG</button><button className="secondary" disabled={!ready} onClick={downloadSVG}>Download SVG</button><button className="secondary" disabled={!ready} onClick={saveRecent}>Save to recents</button></div>
      </section>

      <section className="panel customization">
        <div className="section-heading"><div><span className="eyebrow">DESIGN</span><h2>Customize</h2></div></div>
        <div className="presets"><label>Presets</label><div className="preset-grid">{Object.entries(PRESETS).map(([key,p]) => <button key={key} className={`preset ${preset === key ? 'selected' : ''}`} onClick={() => usePreset(key)}><span style={{background:p.fg}}/><b>{p.label}</b></button>)}</div></div>
        <div className="setting-grid">
          <label>QR size <output>{settings.size}px</output><input type="range" min="180" max="600" step="10" value={settings.size} onChange={e=>updateSetting('size', Number(e.target.value))}/></label>
          <label>Margin <output>{settings.margin}</output><input type="range" min="0" max="12" step="1" value={settings.margin} onChange={e=>updateSetting('margin', Number(e.target.value))}/></label>
          <label>Error correction<select value={settings.level} onChange={e=>updateSetting('level',e.target.value)}><option value="L">L · 7%</option><option value="M">M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option></select></label>
          <label>Foreground <span className="color-control"><input type="color" value={settings.fg} onChange={e=>updateSetting('fg',e.target.value)}/><code>{settings.fg}</code></span></label>
          <label>Background <span className="color-control"><input type="color" value={settings.bg} onChange={e=>updateSetting('bg',e.target.value)}/><code>{settings.bg}</code></span></label>
        </div>
        <div className="toggle-row"><label><input type="checkbox" checked={settings.gradient} onChange={e=>updateSetting('gradient',e.target.checked)}/> Gradient modules</label><label><input type="checkbox" checked={settings.logo} onChange={e=>updateSetting('logo',e.target.checked)}/> Logo safe-zone <span className="muted">(visual guide)</span></label></div>
      </section>

      <section className="panel history-panel">
        <div className="preview-head"><div><span className="eyebrow">HISTORY</span><h2>Recent QR codes</h2></div>{history.length > 0 && <button className="ghost danger" onClick={()=>setHistory([])}>Clear all</button>}</div>
        {history.length === 0 ? <div className="history-empty">Your saved QR codes will appear here and survive page refresh.</div> : <div className="history-list">{history.map(item => <button className="history-item" key={item.id} onClick={()=>restore(item)}><div className="mini-qr"><canvas ref={el=>{if(el) QRCode.toCanvas(el,item.payload,{width:54,margin:1,color:{dark:item.settings.fg,light:item.settings.bg}})}}/></div><div><b>{item.label}</b><span>{typeLabels[item.type]} · {new Date(item.createdAt).toLocaleDateString()}</span></div><span className="reuse">Reuse →</span></button>)}</div>}
      </section>
    </main>
    <footer>QR Code Studio · Built for GDG on Campus SRM Technical Domain · Data stays in your browser.</footer>
  </div>;
}

const typeLabels = { url:'URL', text:'Plain Text', email:'Email', phone:'Phone', wifi:'Wi-Fi' };
const icons = { url:'↗', text:'T', email:'@', phone:'⌕', wifi:'⌁' };

function renderInputs(f, update) {
  const input = (key, label, placeholder, type='text', extra={}) => <label className="field"><span>{label}</span><input type={type} value={f[key]} placeholder={placeholder} onChange={e=>update(key,e.target.value)} {...extra}/></label>;
  if (f.type === 'url') return <>{input('url','Website URL','https://example.com','url')}<p className="hint">Include https:// for the most reliable scan and link behavior.</p></>;
  if (f.type === 'text') return <>{input('text','Text','Type anything you want to encode')}<p className="counter">{f.text.length} characters</p></>;
  if (f.type === 'email') return <div className="two-col">{input('email','Email address','hello@example.com','email')}{input('subject','Subject','Hello from QR Studio')}{input('body','Message','Your message here')||null}</div>;
  if (f.type === 'phone') return <>{input('phone','Phone number','+91 98765 43210','tel')}<p className="hint">Use an international format such as +919876543210.</p></>;
  return <div className="two-col">{input('ssid','Network name (SSID)','My Wi-Fi')}{input('password','Password','Wi-Fi password','password')}<label className="field"><span>Security</span><select value={f.security} onChange={e=>update('security',e.target.value)}><option>WPA</option><option>WEP</option><option value="nopass">Open / None</option></select></label><label className="check"><input type="checkbox" checked={f.hidden} onChange={e=>update('hidden',e.target.checked)}/> Hidden network</label></div>;
}

function buildPayload(f) {
  if (f.type === 'url') return f.url.trim();
  if (f.type === 'text') return f.text.trim();
  if (f.type === 'email') return `mailto:${f.email.trim()}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(f.body)}`;
  if (f.type === 'phone') return `tel:${f.phone.replace(/\s+/g,'').trim()}`;
  return `WIFI:T:${f.security};S:${escapeWifi(f.ssid)};P:${escapeWifi(f.password)};H:${f.hidden ? 'true' : 'false'};;`;
}
function escapeWifi(v) { return String(v).replace(/([\\;,:])/g,'\\$1'); }
function validate(f) {
  if (f.type === 'url') {
    if (!f.url.trim()) return { error:'Enter a URL.' };
    try { new URL(f.url); } catch { return { error:'Enter a valid URL, e.g. https://example.com.' }; }
    return { warning: 'Very light foreground colors or low contrast can reduce scan reliability.' };
  }
  if (f.type === 'text' && !f.text.trim()) return { error:'Enter some text to encode.' };
  if (f.type === 'email' && (!f.email.trim() || !/^\S+@\S+\.\S+$/.test(f.email.trim()))) return { error:'Enter a valid email address.' };
  if (f.type === 'phone' && !/^[+\d][\d\s().-]{6,}$/.test(f.phone.trim())) return { error:'Enter a valid phone number.' };
  if (f.type === 'wifi' && !f.ssid.trim()) return { error:'Enter the Wi-Fi network name (SSID).' };
  if (f.type === 'wifi' && f.security !== 'nopass' && !f.password) return { error:'Enter the Wi-Fi password or choose Open / None.' };
  if (f.type === 'wifi' && f.security === 'WEP') return { warning:'WEP is legacy Wi-Fi security. Use WPA or an open network where appropriate.' };
  if (f.type === 'text' && f.text.length > 1000) return { warning:'Long payloads create dense QR codes. A shorter payload is easier to scan.' };
  if (settingsContrastWarning(f)) return { warning:'Your selected foreground/background combination has low contrast. Increase contrast for reliable scanning.' };
  return {};
}
function settingsContrastWarning(f) { return false; }
function historyLabel(f) { if(f.type==='url') return f.url.replace(/^https?:\/\//,'').slice(0,30); if(f.type==='email') return f.email || 'Email QR'; if(f.type==='phone') return f.phone || 'Phone QR'; if(f.type==='wifi') return f.ssid || 'Wi-Fi QR'; return f.text || 'Text QR'; }
function shiftColor(hex, amount) { const n=parseInt(hex.slice(1),16); const r=Math.min(255,Math.max(0,(n>>16)+amount)); const g=Math.min(255,Math.max(0,((n>>8)&255)+amount)); const b=Math.min(255,Math.max(0,(n&255)+amount)); return `rgb(${r},${g},${b})`; }

createRoot(document.getElementById('root')).render(<App />);
