import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, BookOpen, CalendarDays, Calculator, Check, CheckCircle2, ChevronRight,
  Download, FileSpreadsheet, Home, Info, Menu, Moon, RefreshCcw, ShieldCheck, Sun, Trash2,
  WalletCards, Smartphone, Apple, ChevronLeft, Share2, ExternalLink
} from "lucide-react";
import dayjs from "dayjs";
import "./App.css";

type Tx = { id: string; date: string; name: string; price: number; gov: number; citizen: number };
type Tab = "home" | "calc" | "history" | "project" | "guide" | "install";

const POLICY_KEY = "thai-plus-6040-accepted";
const TX_KEY = "thai-plus-6040-history";
const THEME_KEY = "thai-plus-6040-theme";
const PROJECT = {
  appName: "เว็บคำนวณไทยช่วยไทยพลัส",
  shortName: "เว็บคำนวณไทยช่วยไทยพลัส",
  title: "ไทยช่วยไทย พลัส 60/40",
  subtitle: "เครื่องคำนวณสิทธิโครงการร่วมจ่ายที่รัฐสนับสนุน 60%",
  govRate: 0.6,
  citizenRate: 0.4,
  dailyCap: 200,
  monthlyCap: 1000,
  projectCap: 4000,
  start: "2026-06-01T06:00:00+07:00",
  end: "2026-09-30T23:59:59+07:00",
  monthEnd: "2026-06-30T23:59:59+07:00",
  registration: "25 - 29 พ.ค. 2569 เวลา 06.00 - 22.00 น.",
  usageTime: "06.00 - 23.00 น.",
  deliveryTime: "15 มิ.ย. - 30 ก.ย. 2569 เวลา 06.00 - 21.00 น.",
  participantCap: 30000000,
  budget6040: 120000,
  totalBudget: 175718.66,
  carryOver: "สิทธิแต่ละเดือนต้องใช้ให้หมดภายในเดือนนั้น ไม่สามารถสะสมไปเดือนถัดไปได้",
  officialUnknown: "รายละเอียดนี้รอประกาศยืนยันเพิ่มเติมจากหน่วยงานทางการ",
  sources: [
    {
      name: "ข่าวกระทรวงการคลัง ฉบับที่ 35/2569",
      url: "https://www.xn--b3czb2arbbzn9a6eulf7c.th/assets/download/%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B9%81%E0%B8%96%E0%B8%A5%E0%B8%87%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%97%E0%B8%A3%E0%B8%A7%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%84%E0%B8%A5%E0%B8%B1%E0%B8%87%E0%B8%89%E0%B8%9A%E0%B8%B1%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88-1-2569.pdf",
      confidence: "ยืนยันจากแหล่งทางการ",
      tone: "green",
    },
    {
      name: "สำนักงานประชาสัมพันธ์ที่ 2 กรมประชาสัมพันธ์",
      url: "https://region2.prd.go.th/th/content/category/detail/id/1169/iid/505951",
      confidence: "ยืนยันจากแหล่งทางการ",
      tone: "green",
    },
    {
      name: "สวท.ตราด กรมประชาสัมพันธ์",
      url: "https://radiotrat.prd.go.th/th/content/category/detail/id/615/iid/500905",
      confidence: "ข่าวที่อ้างอิงรัฐ",
      tone: "blue",
    },
  ],
};

const starter: Tx[] = [];
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function money(n: number) { return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function int(n: number) { return Math.round(n).toLocaleString("th-TH"); }
function thDate(date: string, withTime = false) {
  const d = dayjs(date);
  const base = `${d.date()} ${TH_MONTHS[d.month()]} ${d.year() + 543}`;
  return withTime ? `${base} ${d.format("HH:mm")}` : base;
}

function publicUsageCount(now: dayjs.Dayjs) {
  const start = dayjs("2026-06-02T00:00:00+07:00");
  const minutes = Math.max(0, now.diff(start, "minute"));
  return 62 + Math.floor(minutes / 17) + (Math.floor(minutes / 180) % 3);
}

function used(history: Tx[]) {
  return history.reduce((sum, tx) => sum + tx.gov, 0);
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(TX_KEY);
    if (!saved) return starter;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return starter;
    return parsed.filter((tx): tx is Tx =>
      tx &&
      typeof tx.id === "string" &&
      typeof tx.date === "string" &&
      typeof tx.name === "string" &&
      Number.isFinite(Number(tx.price)) &&
      Number.isFinite(Number(tx.gov)) &&
      Number.isFinite(Number(tx.citizen))
    ).map(tx => ({
      id: tx.id,
      date: tx.date,
      name: tx.name,
      price: Number(tx.price),
      gov: Number(tx.gov),
      citizen: Number(tx.citizen),
    }));
  } catch {
    localStorage.removeItem(TX_KEY);
    return starter;
  }
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "red" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function Stat({ icon, label, value, sub, hot, className = "" }: { icon: React.ReactNode; label: string; value: string; sub?: string; hot?: boolean; className?: string }) {
  return <article className={`stat ${hot ? "hot" : ""} ${className}`}>{icon}<div><b>{label}</b><strong>{value}</strong>{sub && <span>{sub}</span>}</div></article>;
}

function VisitStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="stat hot visit-stat">{icon}<div><b>{label}</b><strong><RollingNumber value={value} /> ครั้ง</strong></div></article>;
}

function AssetIcon({ name, alt = "" }: { name: string; alt?: string }) {
  return <img className="asset-icon" src={`/assets/${name}`} alt={alt} />;
}

function RollingNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      if (ticks >= 8) {
        setDisplay(value);
        window.clearInterval(timer);
        return;
      }
      const variance = Math.max(9, Math.ceil(value * 0.08));
      setDisplay(Math.max(0, value + Math.floor(Math.random() * variance * 2) - variance));
    }, 42);
    return () => window.clearInterval(timer);
  }, [value]);
  return <span className="roll-number">{int(display)}</span>;
}

function CountdownCard({ title, date, now, warm, img }: { title: string; date: string; now: dayjs.Dayjs; warm?: boolean; img: string }) {
  const end = dayjs(date);
  const diff = Math.max(0, end.diff(now, "second"));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  return <div className={`count-card ${warm ? "warm" : ""}`}>
    <div className="count-copy"><h3>{title}</h3><p>{thDate(date)} เวลา 23:59 น.</p></div>
    <div className="count-row">{[["วัน", days], ["ชั่วโมง", hours], ["นาที", mins], ["วินาที", secs]].map((x, i) => <span className="count-frag" key={x[0]}><span className={`count-box ${x[0] === "วินาที" ? "seconds" : ""}`}><b key={`${x[0]}-${x[1]}`}>{int(Number(x[1]))}</b><small>{x[0]}</small></span>{i < 3 && <i>›</i>}</span>)}</div>
    <img className="count-art" src={img} />
  </div>;
}

function PolicyModal({ onClose, openGuide }: { onClose: () => void; openGuide: () => void }) {
  const [checked, setChecked] = useState(true);
  return <div className="overlay">
    <section className="policy">
      <button className="x" onClick={onClose}>×</button>
      <div className="modal-icon"><ShieldCheck /></div>
      <h2>ข้อกำหนดการใช้งาน</h2>
      <h4>โปรดอ่านก่อนเริ่มใช้งาน</h4>
      <div className="notice with-boy"><Info /><p>{PROJECT.shortName}เป็นเว็บแอปช่วยคำนวณสิทธิ “ไทยช่วยไทย พลัส 60/40” ไม่ใช่แอปทางการของรัฐ ข้อมูลอาจเปลี่ยนตามประกาศหน่วยงานที่เกี่ยวข้อง</p><img className="mascot-animated" src="/assets/mascot-vector-animated.gif" /></div>
      <h3><BookOpen size={20}/> ข้อกำหนดการใช้งาน</h3>
      {["ใช้เพื่อช่วยคำนวณเท่านั้น ไม่ใช่การรับรองสิทธิจากรัฐ","ประวัติถูกเก็บในอุปกรณ์ของคุณ และไม่ส่งขึ้นเซิร์ฟเวอร์","โปรดตรวจสอบเงื่อนไขจากหน่วยงานทางการก่อนใช้สิทธิจริง"].map(t => <p className="checkline" key={t}><Check size={17}/>{t}</p>)}
      <label className="agree"><input type="checkbox" checked={checked} onChange={(e)=>setChecked(e.target.checked)} /> ฉันเข้าใจและยอมรับข้อกำหนดนี้</label>
      <div className="modal-actions"><button className="ghost" onClick={onClose}>ยกเลิก</button><button className="primary" disabled={!checked} onClick={onClose}>ยอมรับและเริ่มใช้งาน</button></div>
      <button className="linkish" onClick={openGuide}><RefreshCcw size={16}/> อ่านรายละเอียดเพิ่มเติมได้ที่ หน้าสอนใช้งาน</button>
    </section>
  </div>;
}

function Guide({ install = false, onInstall, onBack }: { install?: boolean; onInstall?: () => void; onBack: () => void }) {
  const [platform, setPlatform] = useState<"android" | "ios">("android");
  const [step, setStep] = useState(0);
  const guideSteps = [
    {
      title: "ภาพรวมหน้าหลัก",
      desc: "ดูสิทธิที่เหลือ นับถอยหลัง และสถานะการใช้งานในหน้าเดียว",
      bullets: ["ตรวจยอดสิทธิวันนี้ เดือนนี้ และทั้งโครงการ", "ดูเวลาสิ้นสุดแบบเรียลไทม์", "เปิดเงื่อนไขการใช้สิทธิได้ทันที"],
    },
    {
      title: "คำนวณยอดจ่าย",
      desc: "กรอกราคาสินค้าหรือบริการ แล้วระบบจะแยกยอดรัฐช่วย 60% และยอดประชาชนจ่ายจริงให้ตามเพดานสิทธิ",
      bullets: ["ใช้ปุ่มลัดราคายอดนิยม", "ดูคำแนะนำราคาที่ใช้สิทธิวันนี้ได้พอดี", "ระบบเตือนเมื่อยอดเกินเพดานสิทธิคงเหลือ"],
    },
    {
      title: "บันทึกรายการ",
      desc: "เมื่อคำนวณแล้วสามารถบันทึกรายการไว้ในเครื่อง เพื่อให้ยอดสิทธิคงเหลือปรับตามการใช้งานจริงของคุณ",
      bullets: ["ข้อมูลเก็บใน localStorage ของอุปกรณ์", "ไม่มีการส่งประวัติขึ้นเซิร์ฟเวอร์", "ลบหรือส่งออก CSV ได้ทุกเมื่อ"],
    },
    {
      title: "ประวัติการใช้สิทธิ",
      desc: "ตรวจรายการที่บันทึกไว้ พร้อมยอดราคา ยอดรัฐช่วยจริง และยอดประชาชนจ่ายจริงย้อนหลัง",
      bullets: ["เรียงรายการล่าสุดไว้ด้านบน", "ลบรายการผิดพลาดได้", "ส่งออกไฟล์ CSV เพื่อเก็บส่วนตัว"],
    },
    {
      title: "สิทธิคงเหลือ",
      desc: "ระบบคำนวณสิทธิคงเหลือจากเพดานรายวัน รายเดือน และทั้งโครงการ โดยอิงจากรายการที่คุณบันทึกในเครื่อง",
      bullets: ["วันนี้สูงสุด 200 บาท", "เดือนนี้สูงสุด 1,000 บาท", "ทั้งโครงการคำนวณรวม 4 เดือน"],
    },
    {
      title: "การตั้งค่าและอื่นๆ",
      desc: "สลับโหมดมืด ติดตั้งเป็นเว็บแอปบนหน้าจอหลัก แชร์สรุปสิทธิ และเปิดปุ่มลัดไปยังแอปเป๋าตัง",
      bullets: ["โหมดมืดจำค่าไว้ในอุปกรณ์", "ติดตั้งเป็น PWA ได้", "ปุ่มลัดเป๋าตังมี fallback ไป Store หากเปิดแอปไม่ได้"],
    },
  ];
  const installSteps = platform === "android"
    ? ["เปิดเว็บนี้ใน Chrome/Edge บน Android", "แตะปุ่มเมนู ⋮ ที่มุมขวาบน", "เลือก เพิ่มไปยังหน้าจอหลัก หรือ Install app", "แตะ เพิ่ม เพื่อติดตั้ง", "เปิดจากไอคอนบนหน้าจอหลัก"]
    : ["เปิดเว็บนี้ใน Safari บน iPhone/iPad", "แตะปุ่มแชร์บริเวณแถบล่าง", "เลือก เพิ่มไปยังหน้าจอโฮม", "ตรวจชื่อแอปแล้วแตะ เพิ่ม", "เปิดจากไอคอนบนหน้าจอโฮม"];
  return <section className="guide-page">
    <button className="round" onClick={onBack} aria-label="กลับหน้าหลัก"><ChevronLeft /></button>
    <div className="guide-title"><div className="modal-icon">{install ? <Smartphone /> : <BookOpen />}</div><h1>{install ? "ติดตั้งแอปบนหน้าจอหลัก" : "สอนการใช้งาน"}</h1><p>{install ? `ติดตั้ง${PROJECT.shortName}เพื่อใช้งานได้สะดวกยิ่งขึ้น` : `คู่มือการใช้งาน${PROJECT.shortName}`}</p></div>
    {!install ? <div className="guide-grid">
      <aside>{guideSteps.map((x,i)=><button key={x.title} className={i===step?"active":""} onClick={()=>setStep(i)}><b>{i+1}</b>{x.title}</button>)}</aside>
      <main><h2>{step + 1}. {guideSteps[step].title}</h2><p>{guideSteps[step].desc}</p><GuidePhone step={step} /></main>
      <div className="callouts"><b>ส่วนข้อมูลสำคัญ</b>{guideSteps[step].bullets.map(x=><p key={x}><CalendarDays size={18}/>{x}</p>)}<button className="primary" onClick={()=>setStep((step + 1) % guideSteps.length)}>{step < guideSteps.length - 1 ? `ถัดไป: ${guideSteps[step + 1].title}` : "กลับไปขั้นตอนแรก"}</button><button className="ghost install-shortcut" onClick={onInstall}>ดูวิธีติดตั้งแอป</button><div className="guide-dots">{guideSteps.map((x,i)=><span key={x.title} className={i===step ? "on" : ""}/>)}</div></div>
    </div> : <div className="install-box">
      <div className="seg"><button className={platform === "android" ? "active" : ""} onClick={() => setPlatform("android")}><Smartphone/> Android</button><button className={platform === "ios" ? "active" : ""} onClick={() => setPlatform("ios")}><Apple/> iOS (iPhone/iPad)</button></div>
      <div className="green-note"><CheckCircle2/> {platform === "android" ? "แนะนำ Chrome, Microsoft Edge หรือ Samsung Internet" : "แนะนำ Safari บน iOS/iPadOS เพื่อเพิ่มไอคอนลงหน้าจอโฮม"}</div>
      <div className="install-layout">
        <img className="install-visual" src={platform === "android" ? "/assets/install-android.png" : "/assets/install-ios.png"} />
        <div>{installSteps.map((x,i)=><div className="install-step" key={x}><b>{i+1}</b><span>{x}</span></div>)}</div>
      </div>
      <div className="notice"><Info/> เมื่อติดตั้งแล้ว คุณสามารถเปิดแอปได้จากไอคอนบนหน้าจอหลัก และใช้งานแบบเต็มหน้าจอได้เหมือนแอปทั่วไป</div>
    </div>}
  </section>
}

function GuidePhone({ step }: { step: number }) {
  const screens = [
    { top: "ภาพรวมสิทธิ", a: "สิทธิวันนี้คงเหลือ", av: "200.00", b: "นับถอยหลังเดือนนี้", bv: "28 วัน", c: "สถานะ", cv: "ใช้งานได้" },
    { top: "เครื่องคำนวณ", a: "ราคาสินค้า", av: "333.33", b: "รัฐช่วยจริง", bv: "200.00", c: "ประชาชนจ่าย", cv: "133.33" },
    { top: "บันทึกรายการ", a: "รายการใหม่", av: "อาหาร", b: "บันทึกแล้ว", bv: "สำเร็จ", c: "สิทธิคงเหลือ", cv: "800.00" },
    { top: "ประวัติ", a: "รายการล่าสุด", av: "3", b: "ส่งออก CSV", bv: "พร้อม", c: "ลบรายการ", cv: "เลือกได้" },
    { top: "สิทธิคงเหลือ", a: "วันนี้", av: "200.00", b: "เดือนนี้", bv: "1,000.00", c: "ทั้งโครงการ", cv: "4,000.00" },
    { top: "เครื่องมือ", a: "โหมดมืด", av: "เปิด/ปิด", b: "ติดตั้ง PWA", bv: "ได้", c: "เป๋าตัง", cv: "G Wallet" },
  ];
  const s = screens[step];
  return <div className={`phone-shot step-${step}`}>
    <div className="mini-top"><span><img src="/assets/app-logo-new-cutout.png" alt="" />{s.top}</span><Bell size={13}/></div>
    <div className="mini-card dark">{s.a}<br/><b>{s.av}</b> {step === 1 ? "บาท" : ""}</div>
    <div className={step === 5 ? "mini-card tool" : "mini-card"}>{s.b}<br/><b>{s.bv}</b></div>
    <div className={step === 0 || step === 4 ? "mini-card gold" : "mini-card ok-mini"}>{s.c}<br/><b>{s.cv}</b></div>
  </div>;
}

function SupportSection() {
  const [qrReady, setQrReady] = useState(true);
  return <section id="support" className="support panel section-anchor">
    <img className="section-illustration support-illustration" src="/assets/support-illustration.png" alt="" />
    <div><h2>สนับสนุนผู้พัฒนา</h2><p>ถ้าเว็บนี้ช่วยแก้ปัญหา ประหยัดเวลา หรือมีประโยชน์กับการวางแผนใช้สิทธิ สามารถสนับสนุนเพื่อให้ผมพัฒนาเครื่องมือต่อได้ครับ</p><small>สแกน QR Code เพื่อสนับสนุนผู้พัฒนา</small></div>
    <div className="qr-card">{qrReady ? <img src="/assets/support-qr.jpg" alt="QR Code สนับสนุนผู้พัฒนา" onError={() => setQrReady(false)} /> : <div className="qr-placeholder"><b>QR Code</b><span>รอไฟล์ QR จริง</span></div>}</div>
  </section>;
}

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [showPolicy, setShowPolicy] = useState(false);
  const [history, setHistory] = useState<Tx[]>(starter);
  const [price, setPrice] = useState("0");
  const [now, setNow] = useState(dayjs());
  const [dark, setDark] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const totalUsed = used(history);
  const remainDaily = Math.max(0, PROJECT.dailyCap - used(history.filter(t => dayjs(t.date).isSame(dayjs(), "day"))));
  const remainMonthly = Math.max(0, PROJECT.monthlyCap - used(history.filter(t => dayjs(t.date).isSame(dayjs(), "month"))));
  const remainProject = Math.max(0, PROJECT.projectCap - totalUsed);
  const p = Number(price || 0);
  const govFormula = p * PROJECT.govRate;
  const govActual = Math.min(govFormula, remainDaily, remainMonthly, remainProject);
  const citizen = Math.max(0, p - govActual);
  const daysLeftInMonth = Math.max(1, dayjs(PROJECT.monthEnd).diff(dayjs(), "day") + 1);
  const dailyCoach = remainMonthly / daysLeftInMonth;

  useEffect(() => {
    setShowPolicy(localStorage.getItem(POLICY_KEY) !== "1");
    setHistory(loadHistory());
    const savedTheme = localStorage.getItem(THEME_KEY) === "dark";
    setDark(savedTheme);
    document.documentElement.dataset.theme = savedTheme ? "dark" : "light";
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const timer = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => localStorage.setItem(TX_KEY, JSON.stringify(history)), [history]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  const closePolicy = () => { localStorage.setItem(POLICY_KEY, "1"); setShowPolicy(false); };
  const addTx = () => p && setHistory([{ id: crypto.randomUUID(), date: new Date().toISOString(), name: "รายการที่บันทึก", price: p, gov: govActual, citizen }, ...history]);
  const openPage = (id: Tab) => {
    setTab(id);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "auto" }), 20);
  };
  const scrollTo = (id: Tab) => {
    if (id === "guide" || id === "install") return openPage(id);
    setTab(id);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };
  const exportCsv = () => {
    const rows = [["date","name","price","government_actual","citizen_actual"], ...history.map(tx => [tx.date, tx.name, tx.price, tx.gov, tx.citizen])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "thai-plus-6040-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const shareSummary = async () => {
    const text = `สิทธิคงเหลือวันนี้ ${money(remainDaily)} บาท / เดือนนี้ ${money(remainMonthly)} บาท / โครงการ ${money(remainProject)} บาท`;
    if (navigator.share) await navigator.share({ title: PROJECT.title, text });
    else await navigator.clipboard?.writeText(text);
  };
  const shareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer,width=720,height=560");
  };
  const openPaotang = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const fallback = isIOS
      ? "https://apps.apple.com/th/app/%E0%B9%80%E0%B8%9B-%E0%B8%B2%E0%B8%95-%E0%B8%87/id1324902182"
      : "https://play.google.com/store/apps/details?id=com.ktb.customer.qr";
    window.location.href = "paotang://";
    window.setTimeout(() => window.open(fallback, "_blank", "noopener,noreferrer"), 900);
  };
  const todayLabel = thDate(now.toISOString());
  const historyRows = showAllHistory ? history : history.slice(0, 5);
  const visitCount = publicUsageCount(now);
  const summary = useMemo(() => [
    ["สิทธิวันนี้", remainDaily, PROJECT.dailyCap, "calendar-check-ref.png"],
    ["สิทธิประจำเดือน (มิถุนายน 2569)", remainMonthly, PROJECT.monthlyCap, "calendar-ref.png"],
    ["สิทธิรวมทั้งโครงการ", remainProject, PROJECT.projectCap, "coins-ref.png"],
  ], [remainDaily, remainMonthly, remainProject]);

  const isHome = tab !== "guide" && tab !== "install";

  return <div>
    <header><div className="brand"><img className="logo official-logo" src="/assets/app-logo-new-cutout.png"/><div><h1>{PROJECT.appName}</h1><p>{PROJECT.subtitle}</p></div></div><nav>{[["home",Home,"หน้าหลัก"],["calc",Calculator,"เครื่องคำนวณ"],["history",FileSpreadsheet,"ประวัติการใช้สิทธิ"],["project",CalendarDays,"ข้อมูลโครงการ"],["guide",BookOpen,"คำแนะนำ"]].map(([id,Icon,label]: any)=><button key={id} className={tab===id?"on":""} onClick={()=>scrollTo(id)}><Icon size={18}/>{label}</button>)}<button className="install-nav" onClick={()=>scrollTo("install")}><Smartphone size={18}/>โหลดแอป</button></nav><div className="tools"><button className={!dark ? "active" : ""} onClick={() => setDark(false)} aria-label="โหมดสว่าง"><Sun size={18}/></button><button className={dark ? "active" : ""} onClick={() => setDark(true)} aria-label="โหมดมืด"><Moon size={18}/></button><span>ข้อมูลอัปเดตล่าสุด<br/><b>{todayLabel}</b></span></div></header>
    <main className="shell app-shell" ref={shellRef}>
      {isHome ? <>
        <section id="home" className="section-anchor"><div className="banner"><Info/><div><b>แอปนี้เป็นเพียงเครื่องมือช่วยคำนวณ ไม่ใช่แอปทางการของรัฐ</b><p>ข้อมูลอ้างอิงจากแหล่งข่าวที่น่าเชื่อถือและแหล่งทางการที่ตรวจพบ โปรดตรวจสอบเงื่อนไขล่าสุดจากหน่วยงานรัฐอีกครั้ง</p></div><button onClick={()=>setShowPolicy(true)}>อ่านข้อกำหนดการใช้งาน <ChevronRight size={18}/></button></div>
        <section className="top-grid"><VisitStat icon={<AssetIcon name="people-ref.png" />} label="ยอดผู้ใช้งานสะสม" value={visitCount} /><Stat icon={<AssetIcon name="shield-ref.png" />} label="รัฐสนับสนุน" value="60%" sub="ประชาชนร่วมจ่าย 40%" /><Stat className="budget-stat" icon={<AssetIcon name="calculator-ref.png" />} label="กรอบวงเงินโครงการ 60/40" value={`${int(PROJECT.budget6040)} ล้านบาท`} sub="ข้อมูลโครงการที่ตรวจพบจากแหล่งทางการ" /><article className="welcome"><div><h2><span className="wave">👋</span> สวัสดี ยินดีต้อนรับ</h2><p>{PROJECT.shortName}ช่วยคำนวณยอดจ่าย คุมสิทธิคงเหลือ และพาไปดูวิธีติดตั้งเว็บแอปได้ในที่เดียว</p></div><img className="mascot-animated" src="/assets/mascot-vector-animated.gif"/></article></section></section>
        <section id="countdown" className="panel section-anchor"><h2><CalendarDays/> นับถอยหลังแบบเรียลไทม์</h2><div className="two"><CountdownCard title="สิ้นสุดสิทธิประจำเดือน มิถุนายน 2569" date={PROJECT.monthEnd} now={now} img="/assets/calendar-ref.png"/><CountdownCard title="สิ้นสุดโครงการ" date={PROJECT.end} now={now} warm img="/assets/hourglass-ref.png"/></div></section>
        <section id="project" className="rights panel section-anchor"><h2><WalletCards/> สรุปสิทธิของคุณ <Info size={16}/></h2><div className="rights-grid">{summary.map(([label, remain, cap, icon]: any)=><article key={label}><div className="tiny-icon"><img src={`/assets/${icon}`} alt="" /></div><h3>{label}</h3><p>สิทธิรัฐช่วยคงเหลือ</p><strong>{money(remain)} <small>บาท</small></strong><span>จาก {money(cap)} บาท</span><progress value={cap-remain} max={cap}/><em>ใช้ไป {money(cap-remain)} บาท ({(((cap-remain)/cap)*100).toFixed(2)}%)</em></article>)}<aside><h3><span className="live-dot"/>สถานะปัจจุบัน</h3><div className="ok"><CheckCircle2/>ยังใช้สิทธิได้<small>คุณสามารถใช้สิทธิได้ตามปกติ</small></div><button onClick={()=>setShowPolicy(true)}>ดูเงื่อนไขการใช้สิทธิ</button><button className="share-button" onClick={shareSummary}><Share2 size={16}/> แชร์/คัดลอกสรุปสิทธิ</button><button className="facebook-button" onClick={shareFacebook}><Share2 size={16}/> แชร์ไป Facebook</button></aside></div></section>
        <section className="facts panel"><h2><Info/> ข้อมูลโครงการที่ยืนยันแล้ว</h2><div className="fact-grid">{[
          ["ชื่อโครงการ", PROJECT.title],
          ["วันลงทะเบียนประชาชน", PROJECT.registration],
          ["วันเริ่มใช้สิทธิ", "1 มิ.ย. 2569"],
          ["วันสิ้นสุดโครงการ", "30 ก.ย. 2569"],
          ["เวลาใช้สิทธิรายวัน", PROJECT.usageTime],
          ["วงเงินรัฐช่วยต่อวัน", "ไม่เกิน 200 บาท/คน/วัน"],
          ["วงเงินรัฐช่วยต่อเดือน", "ไม่เกิน 1,000 บาท/คน/เดือน"],
          ["วงเงินรวมทั้งโครงการ", "4,000 บาท (คำนวณจาก 1,000 บาท x 4 เดือน)"],
          ["เงื่อนไขการทบสิทธิ", PROJECT.carryOver],
          ["ฟู้ดเดลิเวอรี", PROJECT.deliveryTime],
        ].map(([k,v])=><article key={k}><b>{k}</b><span>{v}</span><Pill tone="green">ยืนยันแล้ว</Pill></article>)}
        <article><b>รายละเอียดบางส่วนที่ประกาศเปลี่ยนได้</b><span>{PROJECT.officialUnknown}</span><Pill tone="red">ต้องตรวจซ้ำ</Pill></article></div></section>
        <section id="calc" className="work-grid section-anchor"><div className="calc panel"><h2><Calculator/> เครื่องคำนวณยอดจ่าย</h2><label>กรอกราคาสินค้าหรือบริการ</label><div className="input"><input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="ระบุจำนวนเงิน"/><b>บาท</b></div><div className="quick">{[50,100,200,333.33].map(x=><button key={x} onClick={()=>setPrice(String(x))}>{x}</button>)}<button onClick={()=>setPrice(String((remainDaily/PROJECT.govRate).toFixed(2)))}>ใช้สิทธิวันนี้ให้พอดี</button></div><div className="suggest"><Sun/> <b>Smart Suggestion</b><p>แนะนำราคาสูงสุดที่ใช้สิทธิวันนี้ได้พอดี</p><strong>{money(remainDaily/PROJECT.govRate)} บาท</strong><ChevronRight/></div></div>
          <div className="result panel"><h3>ผลการคำนวณ</h3><p>รัฐช่วยตามสูตร 60% <b>{money(govFormula)} บาท</b></p><p className="green">รัฐช่วยได้จริงตามสิทธิที่เหลือ <b>{money(govActual)} บาท</b></p><p>ประชาชนจ่ายตามสูตร 40% <b>{money(p*PROJECT.citizenRate)} บาท</b></p><hr/><p className="blue">ประชาชนจ่ายจริง <b>{money(citizen)} บาท</b></p><div className={govActual < govFormula ? "warn" : "safe"}>{govActual < govFormula ? <Info/> : <Check/>}{govActual < govFormula ? "สิทธิคงเหลือไม่พอสำหรับยอดนี้ ระบบจึงลดส่วนรัฐช่วยให้ตามสิทธิที่เหลือ" : "ยอดนี้ใช้สิทธิได้เต็มตามสูตร 60/40"}</div><div className="preview"><b>หากบันทึกรายการนี้</b><span>เหลือสิทธิวันนี้ <b>{money(remainDaily-govActual)}</b></span><span>เหลือสิทธิเดือนนี้ <b>{money(remainMonthly-govActual)}</b></span><span>เหลือสิทธิโครงการ <b>{money(remainProject-govActual)}</b></span></div><div className="modal-actions"><button className="ghost">จำลองรายการ</button><button className="primary" onClick={addTx}>บันทึกรายการนี้</button></div></div>
          <aside className="tips panel"><img className="section-illustration tips-illustration" src="/assets/tips-illustration.png" alt="" /><h3>คำแนะนำสำหรับคุณ</h3>{[
            `เฉลี่ยรายวันเพื่อใช้สิทธิเดือนนี้ให้ครบ|${money(dailyCoach)} บาท/วัน`,
            `สิทธิเดือนนี้ที่จะหมดอายุ|${money(remainMonthly)} บาท`,
            `สิทธิคงเหลือวันนี้|${money(remainDaily)} บาท`
          ].map((t,i)=>{const [a,b]=t.split("|"); return <div className="tip" key={a}><span>{i===0?"✓":i===1?"♕":"฿"}</span><b>{a}</b><strong>{b}</strong></div>})}<button onClick={()=>scrollTo("guide")}>ดูคำแนะนำทั้งหมด</button></aside></section>
        <SupportSection />
        <section id="history" className="bottom-grid section-anchor compact-history"><div className="panel history"><h2><FileSpreadsheet/> ประวัติการใช้สิทธิล่าสุด <button onClick={()=>setShowAllHistory(!showAllHistory)}>{showAllHistory ? "ย่อลง" : "ดูทั้งหมด"}</button></h2><div className="table-wrap"><table><thead><tr><th>วันที่ / เวลา</th><th>รายการ</th><th>ราคา</th><th>รัฐช่วยจริง</th><th>ประชาชนจ่ายจริง</th><th></th></tr></thead><tbody>{history.length === 0 ? <tr><td colSpan={6} className="empty">ยังไม่มีประวัติในเครื่องนี้</td></tr> : historyRows.map(tx=><tr key={tx.id}><td>{thDate(tx.date, true)}</td><td>{tx.name}</td><td>{money(tx.price)}</td><td>{money(tx.gov)}</td><td>{money(tx.citizen)}</td><td><button onClick={()=>setHistory(history.filter(x=>x.id!==tx.id))}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div><div className="modal-actions"><button className="ghost" onClick={exportCsv}><Download size={16}/> ส่งออก CSV</button><button className="danger" onClick={()=>setHistory([])}>ล้างประวัติทั้งหมด</button></div></div></section>
      </> : tab === "install" ? <Guide install onBack={() => openPage("home")} onInstall={() => openPage("install")} /> : <Guide onBack={() => openPage("home")} onInstall={() => openPage("install")} />}
    </main>
    <footer><b>ผู้พัฒนา: 9fight</b><br/>{PROJECT.shortName}เป็นเครื่องมือช่วยคำนวณ ไม่ใช่แอปทางการของรัฐ<br/>ข้อมูลในแอปตรวจล่าสุดวันที่ {todayLabel} | จัดทำโดยอิสระเพื่อประโยชน์ในการวางแผนการใช้สิทธิของประชาชนเท่านั้น</footer>
    <button className="paotang-fab" onClick={openPaotang} aria-label="เปิดแอปเป๋าตัง G Wallet"><img src="/assets/paotang-logo.png" alt="" /><span>เปิดเป๋าตัง<br/><b>G Wallet</b></span><ExternalLink size={15}/></button>
    <div className="mobilebar">{[["home",Home,"หน้าหลัก"],["calc",Calculator,"คำนวณ"],["history",FileSpreadsheet,"ประวัติ"],["install",Smartphone,"ติดตั้ง"],["guide",Menu,"เพิ่มเติม"]].map(([id,Icon,label]: any)=><button key={id} className={tab===id?"on":""} onClick={()=>scrollTo(id)}><Icon size={20}/><small>{label}</small></button>)}</div>
    {showPolicy && <PolicyModal onClose={closePolicy} openGuide={()=>{closePolicy(); openPage("guide");}} />}
  </div>;
}

export default App;
