import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

// ─── Design tokens ──────────────────────────────────────────────
const C = {
  bg:"#0F1318", card:"#171D25", card2:"#1D2530", raised:"#232C38",
  input:"#1A2230", border:"#2A3545", borderLight:"#334055",
  text:"#EDF2FA", sub:"#6B8BAE", muted:"#3D556E",
  teal:"#00D4A8", tealDim:"#00D4A822", tealBorder:"#00D4A840",
  blue:"#4DA3FF", gold:"#F5B731", red:"#FF4060", amber:"#F5B731", purple:"#9B72FF",
  gradTeal:"linear-gradient(135deg, #00D4A8 0%, #00B8C8 100%)",
};

const fmt = (n, d=2) => Number(n).toFixed(d);
const fmtPct = n => (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%";
const clr = n => n >= 0 ? C.teal : C.red;
const ratingClr = r => r==="good"?C.teal:r==="warn"?C.amber:r==="bad"?C.red:C.sub;

// ─── Quant data (static — will come from financial API later) ───
const QUANT = {
  PLTR:{core:[{label:"EPS (TTM)",value:"$0.34",rating:"good",note:"First full GAAP profitable year"},{label:"P/E Ratio",value:"78×",rating:"warn",note:"Premium vs sector avg 42×"},{label:"Revenue Growth",value:"+27% YoY",rating:"good",note:"Accelerating 3 quarters"},{label:"Gross Margin",value:"81%",rating:"good",note:"Top-tier software margin"},{label:"D/E Ratio",value:"0.04",rating:"good",note:"Virtually debt-free"},{label:"Net Margin",value:"16%",rating:"good",note:"Expanding"}],full:[{label:"Forward P/E",value:"65×",rating:"warn",note:"Pricing in high growth"},{label:"P/S Ratio",value:"28×",rating:"warn",note:"Justified by margin"},{label:"ROE",value:"12%",rating:"good",note:"Improving sharply"},{label:"Current Ratio",value:"5.8×",rating:"good",note:"Fortress balance sheet"},{label:"RSI (14d)",value:"62",rating:"neutral",note:"Approaching overbought"},{label:"Short Interest",value:"4.2%",rating:"good",note:"Low short interest"}],summary:"PLTR shows operating leverage inflection. 81% gross margins with near-zero debt and accelerating revenue is the ideal setup. The 78× P/E is the main risk. Pattern match to NVDA Phase 2 is compelling."},
  RBRK:{core:[{label:"EPS (TTM)",value:"-$2.14",rating:"warn",note:"Pre-profitability"},{label:"Revenue Growth",value:"+48% YoY",rating:"good",note:"Best-in-class cybersecurity"},{label:"Gross Margin",value:"62%",rating:"good",note:"Strong for hybrid SaaS"},{label:"D/E Ratio",value:"1.2",rating:"warn",note:"Moderate post-IPO leverage"},{label:"Net Margin",value:"-28%",rating:"warn",note:"Investing in sales"},{label:"NRR",value:"127%",rating:"good",note:"Customers expanding spend"}],full:[{label:"ARR Growth",value:"+48%",rating:"good",note:"Key SaaS metric"},{label:"P/S Ratio",value:"14×",rating:"warn",note:"Fair for 48% growth"},{label:"Cash Runway",value:"~24mo",rating:"warn",note:"Needs FCF breakeven"},{label:"RSI (14d)",value:"54",rating:"good",note:"Neutral"},{label:"Short Interest",value:"8.6%",rating:"warn",note:"Elevated"},{label:"Avg Volume",value:"2.1M/day",rating:"neutral",note:"Liquid"}],summary:"RBRK is a classic post-IPO growth story. 127% NRR means customers keep spending more. Elevated short interest is worth monitoring but can be contrarian when fundamentals are strong."},
  SOUN:{core:[{label:"EPS (TTM)",value:"-$0.18",rating:"warn",note:"Pre-profitability"},{label:"Revenue Growth",value:"+82% YoY",rating:"good",note:"Exceptional off small base"},{label:"Gross Margin",value:"54%",rating:"good",note:"Improving with scale"},{label:"D/E Ratio",value:"0.6",rating:"good",note:"Manageable"},{label:"Net Margin",value:"-34%",rating:"warn",note:"High burn"},{label:"Short Interest",value:"18%",rating:"bad",note:"Very high — major flag"}],full:[{label:"Market Cap",value:"~$2.8B",rating:"neutral",note:"Small cap volatility"},{label:"Cash Position",value:"$88M",rating:"warn",note:"Watch dilution risk"},{label:"RSI (14d)",value:"71",rating:"warn",note:"Overbought"},{label:"Beta",value:"3.2",rating:"warn",note:"Highly volatile"},{label:"OEM Customers",value:"230+",rating:"good",note:"Sticky enterprise"},{label:"52wk Range",value:"$3.1–$11.4",rating:"neutral",note:"Near top"}],summary:"High-risk, high-reward. 82% revenue growth and OEM customer base are impressive. But 18% short interest is a major flag. Small speculative allocation only."},
  IONQ:{core:[{label:"EPS (TTM)",value:"-$0.72",rating:"warn",note:"Deep R&D stage"},{label:"Revenue Growth",value:"+95% YoY",rating:"good",note:"Off tiny $43M base"},{label:"Gross Margin",value:"48%",rating:"good",note:"Improving"},{label:"D/E Ratio",value:"0.3",rating:"good",note:"Low debt"},{label:"Net Margin",value:"-180%",rating:"bad",note:"Heavy R&D phase"},{label:"Cash Position",value:"$312M",rating:"good",note:"3+ years runway"}],full:[{label:"Govt Contracts",value:"DOE, AFRL",rating:"good",note:"Institutional validation"},{label:"Bookings Growth",value:"+76%",rating:"good",note:"Pipeline building"},{label:"RSI (14d)",value:"58",rating:"neutral",note:"Not stretched"},{label:"Short Interest",value:"11%",rating:"warn",note:"Timeline scepticism"},{label:"Beta",value:"2.8",rating:"warn",note:"High volatility"},{label:"Analyst Target",value:"$12–$18",rating:"neutral",note:"Wide range"}],summary:"Pure long-duration quantum computing bet. -180% margin irrelevant — $312M cash, govt validation, 2-4 year horizon required. Keep allocation small."},
  HOOD:{core:[{label:"EPS (TTM)",value:"$0.26",rating:"good",note:"First profitable year"},{label:"P/E Ratio",value:"31×",rating:"good",note:"Reasonable for fintech"},{label:"Revenue Growth",value:"+24% YoY",rating:"good",note:"Crypto volumes driving"},{label:"Gross Margin",value:"86%",rating:"good",note:"Software-like"},{label:"D/E Ratio",value:"0.1",rating:"good",note:"Very low"},{label:"Net Margin",value:"11%",rating:"good",note:"Inflecting positively"}],full:[{label:"Forward P/E",value:"22×",rating:"good",note:"Attractive if sustained"},{label:"ARPU",value:"$131",rating:"good",note:"Growing with crypto"},{label:"Gold Subs",value:"2.4M",rating:"good",note:"High-margin recurring"},{label:"Cash Position",value:"$4.8B",rating:"good",note:"Buyback potential"},{label:"RSI (14d)",value:"61",rating:"neutral",note:"Moderate momentum"},{label:"Short Interest",value:"5.8%",rating:"good",note:"Bears backed off"}],summary:"Genuine business transformation. Gold subscriptions + 24hr trading + retirement accounts is real. 31× P/E with 24% growth is reasonable. Main risk: crypto cycle dependency."},
  SMCI:{core:[{label:"EPS (TTM)",value:"$1.42",rating:"neutral",note:"Down from $6.50 peak"},{label:"Revenue Growth",value:"+14% YoY",rating:"warn",note:"Massive deceleration"},{label:"Gross Margin",value:"14%",rating:"bad",note:"Razor thin"},{label:"D/E Ratio",value:"1.8",rating:"warn",note:"Elevated"},{label:"Net Margin",value:"3%",rating:"bad",note:"Post-restatement"},{label:"Audit Status",value:"⚠ Delayed",rating:"bad",note:"Major red flag"}],full:[{label:"Auditor",value:"BDO (new)",rating:"warn",note:"E&Y resigned"},{label:"Class Action",value:"Active",rating:"bad",note:"Lawsuit ongoing"},{label:"Insider Sales",value:"$180M",rating:"bad",note:"Heavy selling"},{label:"Short Interest",value:"14%",rating:"bad",note:"Active investigation"},{label:"52wk Range",value:"$22–$118",rating:"bad",note:"Down 65%"},{label:"P/S Ratio",value:"0.9×",rating:"good",note:"Only bright spot"}],summary:"AVOID comprehensively. Delayed 10-K, auditor resignation, active class action, heavy insider selling are governance failures. The cheap P/E is a value trap."},
  CELH:{core:[{label:"EPS (TTM)",value:"$0.61",rating:"good",note:"Profitable but decelerating"},{label:"Revenue Growth",value:"-4% YoY",rating:"bad",note:"Distribution headwinds"},{label:"Gross Margin",value:"49%",rating:"good",note:"Compressed from 53%"},{label:"D/E Ratio",value:"0.0",rating:"good",note:"Zero debt"},{label:"Net Margin",value:"12%",rating:"good",note:"Still healthy"},{label:"Pepsi",value:"Renegotiating",rating:"warn",note:"Key risk"}],full:[{label:"International",value:"+38% YoY",rating:"good",note:"EU/APAC bright spot"},{label:"Inventory",value:"Elevated",rating:"warn",note:"Near-term headwind"},{label:"P/E Ratio",value:"45×",rating:"warn",note:"High for slower growth"},{label:"RSI (14d)",value:"44",rating:"neutral",note:"Neutral"},{label:"52wk Range",value:"$28–$98",rating:"bad",note:"Down 60%"},{label:"Short Interest",value:"9.4%",rating:"warn",note:"Bears active"}],summary:"WATCH not BUY. Pepsi renegotiation created artificial revenue cliff. International +38% proves brand works globally. Monitor next two earnings calls."},
};
["NVDA","TSLA","META","AAPL","MSFT","AMD","COIN","CRWD"].forEach(t=>{
  if(!QUANT[t])QUANT[t]={core:[{label:"EPS",value:"—",rating:"neutral",note:"Connect financial API"},{label:"P/E",value:"—",rating:"neutral",note:"Live data pending"},{label:"Revenue Growth",value:"—",rating:"neutral",note:"Live data pending"},{label:"Gross Margin",value:"—",rating:"neutral",note:"Live data pending"},{label:"D/E Ratio",value:"—",rating:"neutral",note:"Live data pending"},{label:"Net Margin",value:"—",rating:"neutral",note:"Live data pending"}],full:[],summary:`Connect a financial data API (e.g. Financial Modeling Prep free tier) to populate ${t}'s full quant profile.`};
});

// ─── Micro UI components ─────────────────────────────────────────
const Pill = ({label, color, size="sm"}) => (
  <span style={{fontSize:size==="sm"?9:11,fontWeight:700,letterSpacing:"0.06em",
    padding:size==="sm"?"3px 8px":"4px 12px",borderRadius:20,
    background:`${color}20`,color,border:`1px solid ${color}35`}}>
    {label}
  </span>
);

const ScoreRing = ({value, color=C.teal, size=44}) => {
  const r=16, circ=2*Math.PI*r, dash=(value/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.raised} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"center",fontSize:11,fontWeight:800,color,fontFamily:"'Outfit',sans-serif"}}>
        {value}
      </div>
    </div>
  );
};

const MiniBar = ({v, color=C.teal, w=90}) => (
  <div style={{width:w,height:5,background:C.raised,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${Math.min(100,Math.max(0,v))}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.5s"}}/>
  </div>
);

const StatChip = ({label, value, color=C.text, sub}) => (
  <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,
    padding:"10px 14px",minWidth:88,flexShrink:0}}>
    <div style={{fontSize:9,color:C.sub,fontWeight:600,letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
    <div style={{fontSize:14,fontWeight:800,color,fontFamily:"'Outfit',sans-serif",lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:9,color:C.sub,marginTop:3}}>{sub}</div>}
  </div>
);

const Divider = () => <div style={{height:1,background:C.border}}/>;

const Spark = ({data, color=C.teal, w=100, h=32}) => {
  if (!data || data.length < 2) return null;
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-(((v-mn)/rng)*(h-6)+3)}`).join(" ");
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
};

// ─── Quant Panel ─────────────────────────────────────────────────
function QuantPanel({ticker, bias}) {
  const [showFull, setShowFull] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const data = QUANT[ticker];
  if (!data) return null;
  const metrics = showFull ? [...data.core, ...data.full] : data.core;

  const askAI = async () => {
    setAiOpen(true);
    if (aiText) return;
    setAiLoading(true);
    try {
      const result = await api.chat(
        [{ role:"user", content:`Analyse ${ticker}: ${metrics.map(m=>`${m.label}: ${m.value} (${m.note})`).join(", ")}. Bias: ${bias}. Give 3-4 sentences: what the numbers say, biggest risk, whether ${bias} is justified. Direct, no bullets.` }],
        null, 300
      );
      setAiText(result.content?.map(b=>b.text||"").join("")||data.summary);
    } catch { setAiText(data.summary); }
    setAiLoading(false);
  };

  return (
    <div style={{marginTop:12,borderRadius:12,overflow:"hidden",border:`1px solid ${C.border}`}}>
      <div style={{background:C.raised,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.sub,letterSpacing:"0.1em"}}>FUNDAMENTALS</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={e=>{e.stopPropagation();setShowFull(f=>!f);}}
            style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${C.borderLight}`,
              background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontWeight:700}}>
            {showFull ? "CORE ▲" : "FULL ▼"}
          </button>
          <button onClick={e=>{e.stopPropagation();askAI();}}
            style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${C.tealBorder}`,
              background:C.tealDim,color:C.teal,fontSize:9,cursor:"pointer",fontWeight:700}}>
            ✦ AI
          </button>
        </div>
      </div>
      <div style={{background:C.card,padding:"12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {metrics.map((m,i) => (
          <div key={i} style={{background:C.card2,borderRadius:10,padding:"9px 11px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:8,color:C.sub,fontWeight:600,marginBottom:3,letterSpacing:"0.06em"}}>{m.label}</div>
            <div style={{fontSize:12,fontWeight:800,color:ratingClr(m.rating),marginBottom:2,fontFamily:"'Outfit',sans-serif"}}>{m.value}</div>
            <div style={{fontSize:8,color:C.muted,lineHeight:1.4}}>{m.note}</div>
          </div>
        ))}
      </div>
      {aiOpen && (
        <div style={{background:`${C.teal}0A`,borderTop:`1px solid ${C.tealBorder}`,padding:"12px 14px"}}
          onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:9,color:C.teal,fontWeight:700,marginBottom:6,letterSpacing:"0.08em"}}>✦ AI ANALYSIS — {ticker}</div>
          {aiLoading
            ? <div style={{fontSize:10,color:C.sub,fontStyle:"italic"}}>Analysing…</div>
            : <div style={{fontSize:11,color:C.text,lineHeight:1.7}}>{aiText}</div>}
          <button onClick={e=>{e.stopPropagation();setAiOpen(false);}}
            style={{marginTop:8,padding:"4px 12px",borderRadius:8,border:`1px solid ${C.border}`,
              background:"transparent",color:C.sub,fontSize:9,cursor:"pointer"}}>CLOSE</button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Signals ────────────────────────────────────────────────
function TabSignals({onTrade, portfolio}) {
  const [signals, setSignals] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      try {
        const [sigRes, priceRes] = await Promise.all([api.getSignals(), api.getPrices()]);
        setSignals(sigRes.signals || []);
        setPrices(priceRes.prices || {});
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
    const iv = setInterval(async () => {
      try { const r = await api.getPrices(); setPrices(r.prices || {}); } catch {}
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const traded = portfolio.positions?.map(p => p.ticker) || [];
  const SECTOR_MAP = { PLTR:"AI", RBRK:"Cyber", SOUN:"AI/Voice", IONQ:"Quantum",
    HOOD:"Fintech", SMCI:"Infra", CELH:"Consumer", NVDA:"AI", TSLA:"EV",
    META:"Social", AAPL:"Tech", MSFT:"Tech", AMD:"Chips", COIN:"Crypto", CRWD:"Cyber" };
  const enriched = signals.map(s => ({ ...s, sector: SECTOR_MAP[s.ticker] || "Tech" }));
  const list = enriched.filter(s => filter === "ALL" || s.sector === filter);
  const allSectors = ["ALL", ...new Set(enriched.map(s => s.sector))];

  if (loading) return (
    <div style={{textAlign:"center",padding:"60px",color:C.sub,fontSize:13}}>
      Loading live signals…
    </div>
  );

  return (
    <div style={{padding:"16px 14px"}}>
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:2}}>
        {allSectors.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{flexShrink:0,padding:"6px 14px",fontSize:10,borderRadius:20,cursor:"pointer",
              border:`1px solid ${filter===s?C.teal:C.border}`,
              background:filter===s?C.tealDim:"transparent",
              color:filter===s?C.teal:C.sub,fontWeight:700,transition:"all 0.2s"}}>
            {s}
          </button>
        ))}
      </div>

      {list.map(sig => {
        const price = prices[sig.ticker] || sig.price || 0;
        const isT = traded.includes(sig.ticker);
        const open = sel === sig.ticker;
        const biasColor = sig.bias==="LONG" ? C.teal : sig.bias==="AVOID" ? C.red : C.amber;
        const anchorColor = sig.pattern?.includes("CAUTION") || sig.pattern?.includes("PTON") ? C.red : C.teal;

        return (
          <div key={sig.ticker} onClick={() => setSel(open ? null : sig.ticker)}
            style={{background:open?C.card2:C.card,border:`1px solid ${open?C.teal+"55":C.border}`,
              borderRadius:16,marginBottom:10,overflow:"hidden",cursor:"pointer",
              transition:"all 0.2s",boxShadow:open?`0 4px 24px ${C.teal}18`:"none"}}>

            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <ScoreRing value={sig.score} color={biasColor}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:15,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{sig.ticker}</span>
                  <Pill label={sig.bias} color={biasColor}/>
                  {isT && <Pill label="OPEN" color={C.blue}/>}
                </div>
                <div style={{fontSize:11,color:C.sub}}>{sig.ticker} · {sig.sector}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>${fmt(price)}</div>
              </div>
            </div>

            {open && (
              <div onClick={e => e.stopPropagation()}>
                <Divider/>
                <div style={{padding:"14px 16px",background:C.card2}}>
                  <div style={{display:"flex",gap:16,marginBottom:14}}>
                    {[["Sentiment",sig.sentiment,C.purple],["Momentum",sig.momentum,C.blue],["Signal",sig.score,C.teal]].map(([l,v,col]) => (
                      <div key={l}>
                        <div style={{fontSize:8,color:C.sub,marginBottom:4,fontWeight:600}}>{l}</div>
                        <MiniBar v={v} color={col} w={76}/>
                        <div style={{fontSize:10,color:col,marginTop:3,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {sig.topHeadline && !sig.topHeadline.includes("Dockers") && (
                    <div style={{fontSize:10,color:C.sub,lineHeight:1.6,marginBottom:12,
                      background:C.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                      📰 {sig.topHeadline}
                    </div>
                  )}

                  {sig.anchor && (
                    <div style={{background:`${anchorColor}0F`,border:`1px solid ${anchorColor}30`,
                      borderRadius:12,padding:"10px 14px",marginBottom:12}}>
                      <div style={{fontSize:8,color:C.sub,marginBottom:3,fontWeight:600}}>PATTERN → {sig.pattern}</div>
                      <div style={{fontSize:12,color:anchorColor,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>{sig.anchor.ref}</div>
                      <div style={{fontSize:10,color:C.sub,marginTop:3}}>
                        Hist return: +{sig.anchor.ret}% · {sig.anchor.tf}
                      </div>
                    </div>
                  )}

                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    {Object.entries(sig.fundamentals || {}).map(([k,v]) => (
                      <div key={k} style={{flex:1,background:C.card,borderRadius:10,padding:"8px 10px",border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:8,color:C.sub,fontWeight:600,textTransform:"uppercase"}}>{k}</div>
                        <div style={{fontSize:11,color:C.text,fontWeight:800,marginTop:2,fontFamily:"'Outfit',sans-serif"}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <QuantPanel ticker={sig.ticker} bias={sig.bias}/>

                  {sig.bias === "LONG" && !isT && (
                    <button onClick={() => onTrade(sig, price)}
                      style={{width:"100%",marginTop:14,padding:"14px",borderRadius:14,border:"none",
                        background:C.gradTeal,color:"#0A1A14",fontSize:13,fontWeight:800,cursor:"pointer",
                        fontFamily:"'Outfit',sans-serif",boxShadow:`0 4px 20px ${C.teal}40`}}>
                      Open Sandbox Trade
                    </button>
                  )}
                  {isT && (
                    <div style={{textAlign:"center",fontSize:11,color:C.blue,padding:"12px",marginTop:8,
                      background:`${C.blue}10`,borderRadius:12,fontWeight:600}}>
                      ✓ Position open in portfolio
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: AI ──────────────────────────────────────────────────────
function TabAI({portfolio, onTrade}) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [log, setLog] = useState([]);
  const [inp, setInp] = useState("");
  const PROMPTS = ["Compare PLTR to NVDA Phase 2","Best R:R signal for 6-week hold?","Explain SOUN's short interest risk","Is IONQ worth a 2-year hold?","Rank signals by risk-adjusted upside"];

  const genRecs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getRecommendations();
      setRecs(res.recommendations || []);
    } catch {
      setRecs([
        {ticker:"PLTR",action:"BUY",allocation:20,entry:22.10,target:31.50,stop:18.80,timeframe:"8 weeks",rationale:"Government AI contract momentum building. NVDA Phase 2 pattern match.",confidence:87},
        {ticker:"RBRK",action:"BUY",allocation:15,entry:68.40,target:95.00,stop:58.00,timeframe:"10 weeks",rationale:"ARR acceleration post-IPO lockup. Institutional accumulation in options.",confidence:74},
        {ticker:"SOUN",action:"BUY",allocation:8,entry:8.40,target:13.50,stop:6.80,timeframe:"4 weeks",rationale:"Sentiment spike ahead of earnings. Small allocation — high risk.",confidence:58},
      ]);
    }
    setLoading(false);
  }, []);

  const chat = async () => {
    if (!inp.trim()) return;
    const msg = inp.trim(); setInp("");
    const newLog = [...log, {role:"user", content:msg}];
    setLog(newLog);
    try {
      const res = await api.chat(newLog,
        `Trading analyst. Portfolio: $${portfolio.cash?.toFixed(2)||"1000"} cash. Max 3 sentences.`, 350);
      setLog([...newLog, {role:"assistant", content:res.content?.map(b=>b.text||"").join("")||"Error."}]);
    } catch { setLog([...newLog, {role:"assistant", content:"Connection error — check backend is running."}]); }
  };

  useEffect(() => { genRecs(); }, [genRecs]);

  return (
    <div style={{padding:"16px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>AI Trade Calls</div>
        <button onClick={genRecs} disabled={loading}
          style={{padding:"7px 14px",borderRadius:10,border:`1px solid ${C.tealBorder}`,
            background:C.tealDim,color:C.teal,fontSize:10,cursor:"pointer",fontWeight:700}}>
          {loading ? "Thinking…" : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13}}>Analysing live signals…</div>
      ) : recs.map((r, i) => {
        const rr = r.target && r.stop ? ((r.target - r.entry) / (r.entry - r.stop)).toFixed(1) : "—";
        const isT = portfolio.positions?.some(p => p.ticker === r.ticker);
        const open = active === i;
        return (
          <div key={i} onClick={() => setActive(open ? null : i)}
            style={{background:open?C.card2:C.card,border:`1px solid ${open?C.teal+"55":C.border}`,
              borderRadius:16,marginBottom:10,overflow:"hidden",cursor:"pointer",
              boxShadow:open?`0 4px 24px ${C.teal}18`:"none",transition:"all 0.2s"}}>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:12,background:C.tealDim,display:"flex",
                alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,
                color:C.teal,flexShrink:0,fontFamily:"'Outfit',sans-serif",border:`1px solid ${C.tealBorder}`}}>
                {r.ticker?.slice(0,2)}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{r.ticker}</span>
                  <Pill label={r.action} color={C.teal}/>
                  <Pill label={`${r.confidence}%`} color={r.confidence>80?C.teal:r.confidence>65?C.amber:C.sub}/>
                  {isT && <Pill label="OPEN" color={C.blue}/>}
                </div>
                <div style={{fontSize:10,color:C.sub}}>Alloc {r.allocation}% · R:R {rr}:1 · {r.timeframe}</div>
              </div>
            </div>
            {open && (
              <div onClick={e => e.stopPropagation()}>
                <Divider/>
                <div style={{padding:"14px 16px",background:C.card2}}>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    {[["Entry",r.entry,C.text],["Target",r.target,C.teal],["Stop",r.stop,C.red]].map(([l,v,col]) => (
                      <div key={l} style={{flex:1,background:C.card,borderRadius:10,padding:"9px 11px",border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:8,color:C.sub,fontWeight:600}}>{l}</div>
                        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:col,fontWeight:800,marginTop:2}}>${v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:C.sub,lineHeight:1.7,marginBottom:12}}>{r.rationale}</div>
                  <QuantPanel ticker={r.ticker} bias={r.action}/>
                  {!isT && (
                    <button onClick={() => onTrade({ticker:r.ticker,thesis:r.rationale}, r.entry, r.allocation/100)}
                      style={{width:"100%",marginTop:14,padding:"14px",borderRadius:14,border:"none",
                        background:C.gradTeal,color:"#0A1A14",fontSize:13,fontWeight:800,cursor:"pointer",
                        fontFamily:"'Outfit',sans-serif",boxShadow:`0 4px 20px ${C.teal}40`}}>
                      Execute in Sandbox
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{marginTop:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.teal,boxShadow:`0 0 6px ${C.teal}`}}/>
          <span style={{fontSize:11,fontWeight:700,color:C.sub,letterSpacing:"0.06em"}}>ASK THE ANALYST</span>
        </div>
        <div style={{maxHeight:170,overflowY:"auto",padding:"12px 14px"}}>
          {log.length === 0 && (
            <div>{PROMPTS.map((q,i) => (
              <div key={i} onClick={() => setInp(q)}
                style={{padding:"8px 12px",marginBottom:6,background:C.card2,
                  border:`1px solid ${C.border}`,borderRadius:10,cursor:"pointer",
                  fontSize:11,color:C.sub,lineHeight:1.4}}>
                {q}
              </div>
            ))}</div>
          )}
          {log.map((m,i) => (
            <div key={i} style={{marginBottom:8,textAlign:m.role==="user"?"right":"left"}}>
              <div style={{display:"inline-block",maxWidth:"85%",
                background:m.role==="user"?C.tealDim:C.card2,
                border:`1px solid ${m.role==="user"?C.tealBorder:C.border}`,
                borderRadius:12,padding:"9px 12px",fontSize:11,
                color:m.role==="user"?C.teal:C.text,lineHeight:1.6}}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",borderTop:`1px solid ${C.border}`}}>
          <input value={inp} onChange={e=>setInp(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&chat()}
            placeholder="Ask about any signal or position…"
            style={{flex:1,background:C.input,border:"none",padding:"12px 16px",
              fontSize:12,color:C.text,outline:"none"}}/>
          <button onClick={chat}
            style={{padding:"0 18px",background:C.gradTeal,border:"none",
              color:"#0A1A14",fontSize:14,fontWeight:800,cursor:"pointer"}}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Portfolio ───────────────────────────────────────────────
function TabPortfolio({portfolio, onClose}) {
  const totalVal = portfolio.totalValue || portfolio.cash || 1000;
  const totalPnl = portfolio.totalPnl || 0;
  const curve = [1000, ...(portfolio.tradeLog||[]).filter(t=>t.type==="SELL")
    .map((t,i,a)=>1000+a.slice(0,i+1).reduce((s,x)=>s+(x.pnl||0),0))];

  return (
    <div style={{padding:"16px 14px"}}>
      <div style={{background:"linear-gradient(145deg, #1D2530 0%, #171D25 100%)",
        border:`1px solid ${C.border}`,borderRadius:20,padding:"20px",marginBottom:14,
        boxShadow:"0 8px 32px #00000040"}}>
        <div style={{fontSize:11,color:C.sub,fontWeight:600,letterSpacing:"0.1em",marginBottom:6}}>PORTFOLIO VALUE</div>
        <div style={{fontSize:36,fontWeight:800,color:totalPnl>=0?C.teal:C.red,
          fontFamily:"'Outfit',sans-serif",lineHeight:1,marginBottom:8}}>
          ${fmt(totalVal)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,color:totalPnl>=0?C.teal:C.red,fontWeight:700}}>
            {totalPnl>=0?"▲":"▼"} ${Math.abs(totalPnl).toFixed(2)} ({fmtPct((totalPnl/1000)*100)})
          </span>
          <span style={{fontSize:11,color:C.sub}}>from $1,000 start</span>
        </div>
        {curve.length > 1 && (
          <div style={{marginTop:14}}>
            <Spark data={curve} color={totalPnl>=0?C.teal:C.red} w={320} h={48}/>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto"}}>
        <StatChip label="Cash" value={`$${fmt(portfolio.cash||1000)}`}/>
        <StatChip label="Positions" value={portfolio.stats?.tradesOpen||0} color={C.blue}/>
        <StatChip label="Win Rate"
          value={portfolio.stats?.winRate ? `${portfolio.stats.winRate}%` : "—"}
          color={C.teal}/>
      </div>

      {(!portfolio.positions || portfolio.positions.length === 0) ? (
        <div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13,
          background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>
          No open positions yet.<br/>Open trades from Signals or AI tabs.
        </div>
      ) : portfolio.positions.map((pos, i) => {
        const pnl = pos.pnl || 0;
        const pct = pos.pctChange || 0;
        return (
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
            borderRadius:16,padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{pos.ticker}</span>
                  <Pill label="LONG" color={C.teal}/>
                </div>
                <div style={{fontSize:10,color:C.sub}}>{pos.shares} shares · entry ${pos.entry}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:800,color:clr(pnl),fontFamily:"'Outfit',sans-serif"}}>
                  {pnl>=0?"+":"−"}${Math.abs(pnl).toFixed(2)}
                </div>
                <div style={{fontSize:10,color:clr(pct),fontWeight:700}}>{fmtPct(pct)}</div>
              </div>
            </div>
            <div style={{height:5,background:C.raised,borderRadius:3,overflow:"hidden",marginBottom:10}}>
              <div style={{width:`${Math.min(100,Math.max(0,50+pct*2))}%`,height:"100%",
                background:clr(pct),borderRadius:3,transition:"width 0.4s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Outfit',sans-serif"}}>
                ${fmt(pos.currentPrice||pos.entry)} now
              </div>
              <button onClick={() => onClose(pos.ticker)}
                style={{padding:"7px 16px",borderRadius:10,border:`1px solid ${C.red}50`,
                  background:`${C.red}15`,color:C.red,fontSize:10,cursor:"pointer",fontWeight:700}}>
                Close Position
              </button>
            </div>
            {pos.thesis && (
              <div style={{marginTop:10,fontSize:10,color:C.sub,lineHeight:1.5,
                borderTop:`1px solid ${C.border}`,paddingTop:10}}>{pos.thesis}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Log ────────────────────────────────────────────────────
function TabLog({portfolio}) {
  const log = portfolio.tradeLog || [];
  if (!log.length) return (
    <div style={{textAlign:"center",padding:"60px 20px",color:C.sub,fontSize:13}}>
      <div style={{fontSize:32,marginBottom:12}}>📋</div>
      No trades yet. Open positions from Signals or AI tabs.
    </div>
  );
  const closed = log.filter(t => t.type === "SELL");
  const wins = closed.filter(t => t.pnl > 0).length;
  const wr = closed.length ? ((wins/closed.length)*100).toFixed(0) : "—";
  const totalPnl = closed.reduce((s,t) => s+(t.pnl||0), 0);

  return (
    <div style={{padding:"16px 14px"}}>
      {closed.length > 0 && (
        <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto"}}>
          <StatChip label="Closed" value={closed.length}/>
          <StatChip label="Win Rate" value={`${wr}%`} color={parseInt(wr)>50?C.teal:C.red}/>
          <StatChip label="Realised" value={`${totalPnl>=0?"+":"−"}$${Math.abs(totalPnl).toFixed(2)}`} color={clr(totalPnl)}/>
        </div>
      )}
      {[...log].reverse().map((e,i) => (
        <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,
          borderRadius:14,padding:"12px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Pill label={e.type} color={e.type==="BUY"?C.teal:e.pnl>=0?C.gold:C.red}/>
              <span style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{e.ticker}</span>
            </div>
            {e.pnl !== undefined && (
              <span style={{fontSize:13,fontWeight:800,color:clr(e.pnl),fontFamily:"'Outfit',sans-serif"}}>
                {e.pnl>=0?"+":"−"}${Math.abs(e.pnl).toFixed(2)}
              </span>
            )}
          </div>
          <div style={{display:"flex",gap:14}}>
            <span style={{fontSize:10,color:C.sub}}>{e.shares} shares @ ${e.price}</span>
            {e.fee && <span style={{fontSize:10,color:C.muted}}>fee ${e.fee}</span>}
            <span style={{fontSize:10,color:C.muted}}>{e.time}</span>
          </div>
          {e.thesis && (
            <div style={{marginTop:8,fontSize:10,color:C.sub,lineHeight:1.5,
              borderTop:`1px solid ${C.border}`,paddingTop:8}}>{e.thesis}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────
const TABS = [
  {id:"signals", icon:"⚡", label:"Signals"},
  {id:"ai",      icon:"✦",  label:"AI"},
  {id:"port",    icon:"◎",  label:"Portfolio"},
  {id:"log",     icon:"≡",  label:"Log"},
];

export default function App() {
  const [tab, setTab] = useState("signals");
  const [portfolio, setPortfolio] = useState({cash:1000,positions:[],tradeLog:[],totalValue:1000,totalPnl:0,stats:{}});
  const [toast, setToast] = useState(null);

  // Load portfolio from backend on mount and poll every 30s
  useEffect(() => {
    const load = async () => {
      try { const p = await api.getPortfolio(); setPortfolio(p); } catch {}
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const showToast = (msg, color=C.teal) => {
    setToast({msg,color});
    setTimeout(() => setToast(null), 3500);
  };

  const openTrade = async (sig, price, alloc=0.15) => {
    try {
      const pct = Math.round(alloc * 100);
      const result = await api.buy(sig.ticker, pct, sig.thesis || "");
      if (result.success) {
        showToast(`Opened ${sig.ticker} · ${result.trade.shares} shares @ $${result.trade.price}`);
        const p = await api.getPortfolio();
        setPortfolio(p);
      } else {
        showToast(result.reason || "Trade failed", C.red);
      }
    } catch (e) {
      showToast("Trade error — check backend", C.red);
    }
  };

  const closeTrade = async (ticker) => {
    try {
      const result = await api.sell(ticker, "Manual close");
      if (result.success) {
        const pnl = result.pnl;
        showToast(`Closed ${ticker} · ${pnl>=0?"+":"−"}$${Math.abs(pnl).toFixed(2)}`, pnl>=0?C.teal:C.red);
        const p = await api.getPortfolio();
        setPortfolio(p);
      }
    } catch { showToast("Close failed — check backend", C.red); }
  };

  const totalPnl = portfolio.totalPnl || 0;
  const totalVal = portfolio.totalValue || 1000;

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",
      color:C.text,maxWidth:480,margin:"0 auto",position:"relative"}}>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 18px",
        position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:"0.02em",color:C.text,
              fontFamily:"'Outfit',sans-serif",lineHeight:1}}>
              Apex<span style={{color:C.teal}}>Signal</span>
            </div>
            <div style={{fontSize:9,color:C.sub,letterSpacing:"0.1em",marginTop:3,fontWeight:600}}>
              SANDBOX · $1,000 START
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:20,fontWeight:800,color:totalPnl>=0?C.teal:C.red,
              fontFamily:"'Outfit',sans-serif",lineHeight:1}}>
              ${fmt(totalVal)}
            </div>
            <div style={{fontSize:10,color:totalPnl>=0?C.teal:C.red,fontWeight:700,marginTop:3}}>
              {totalPnl>=0?"▲":"▼"} ${Math.abs(totalPnl).toFixed(2)} ({fmtPct((totalPnl/1000)*100)})
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.teal,boxShadow:`0 0 6px ${C.teal}`}}/>
          <span style={{fontSize:9,color:C.sub}}>
            Live · {portfolio.stats?.tradesOpen||0} positions · {portfolio.stats?.tradesClosed||0} closed
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{paddingBottom:70}}>
        {tab==="signals"  && <TabSignals onTrade={openTrade} portfolio={portfolio}/>}
        {tab==="ai"       && <TabAI portfolio={portfolio} onTrade={openTrade}/>}
        {tab==="port"     && <TabPortfolio portfolio={portfolio} onClose={closeTrade}/>}
        {tab==="log"      && <TabLog portfolio={portfolio}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:480,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{flex:1,padding:"10px 0 8px",background:"transparent",border:"none",
              cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{width:32,height:32,borderRadius:10,
              background:tab===t.id?C.tealDim:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              border:tab===t.id?`1px solid ${C.tealBorder}`:"1px solid transparent",transition:"all 0.2s"}}>
              <span style={{fontSize:14,color:tab===t.id?C.teal:C.muted}}>{t.icon}</span>
            </div>
            <span style={{fontSize:9,fontWeight:700,color:tab===t.id?C.teal:C.sub,letterSpacing:"0.06em"}}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:82,left:"50%",transform:"translateX(-50%)",
          background:C.card2,border:`1px solid ${toast.color}40`,borderRadius:14,
          padding:"12px 20px",fontSize:11,color:toast.color,whiteSpace:"nowrap",
          zIndex:100,maxWidth:"92vw",boxShadow:`0 4px 24px ${toast.color}30`,fontWeight:600}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
