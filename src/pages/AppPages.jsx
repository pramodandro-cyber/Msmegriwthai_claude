import { useState, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { signIn, signUp, signOut } from "../api/authClient";
import { generateFundingReport } from "../api/reportClient";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = { blue:'#1e40af',teal:'#0891b2',cyan:'#06b6d4',green:'#10b981',amber:'#f59e0b',red:'#ef4444',navy:'#0f172a',text:'#1e293b',muted:'#64748b',border:'#e2e8f0',bg:'#f0f9ff',white:'#ffffff',indigo:'#4f46e5' };
const grad = `linear-gradient(135deg,${C.blue},${C.teal})`;
const mkCard = (e={}) => ({ background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:24,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',...e });
const mkPbtn = (e={}) => ({ padding:'12px 28px',borderRadius:9,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,background:grad,color:'#fff',...e });
const mkObtn = (e={}) => ({ padding:'10px 22px',borderRadius:9,border:`1.5px solid ${C.blue}`,cursor:'pointer',fontWeight:700,fontSize:14,background:'transparent',color:C.blue,...e });
const mkInp = (e={}) => ({ width:'100%',padding:'11px 14px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:14,color:C.text,background:'#f8fafc',outline:'none',boxSizing:'border-box',...e });
const LBL = { fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6 };

// ── State Schemes DB ──────────────────────────────────────────────────────────
const STATE_SCHEMES = {
  "Maharashtra":[{name:"Maharashtra MSME Policy 2019",benefit:"25% capital subsidy on plant & machinery up to ₹25L",type:"Capital Subsidy",sectors:["Manufacturing","Food Processing","Textile"]},{name:"Mahatma Phule Jan Arogya Yojana",benefit:"Subsidized health insurance for MSME workers",type:"Insurance",sectors:["All"]},{name:"Maharashtra Udyog Protsahan Yojana",benefit:"5-year electricity duty exemption for new units",type:"Tax Exemption",sectors:["Manufacturing"]},{name:"Mumbai Startup Policy",benefit:"₹10L seed grant + co-working space for startups",type:"Grant",sectors:["Technology","Services"]},{name:"MAHA-DBT Scheme",benefit:"Direct benefit transfer for MSME equipment purchase",type:"DBT Subsidy",sectors:["Manufacturing","Agriculture"]}],
  "Gujarat":[{name:"Gujarat MSME Assistance Scheme",benefit:"20% capital subsidy on fixed assets up to ₹30L",type:"Capital Subsidy",sectors:["Manufacturing","Textile"]},{name:"iCreate Gujarat",benefit:"Startup incubation + ₹5L equity-free grant",type:"Grant",sectors:["Technology"]},{name:"Gujarat Solar Power Policy",benefit:"Subsidized solar rooftop for MSME units",type:"Energy Subsidy",sectors:["Manufacturing","All"]},{name:"Gujarat Textile Policy",benefit:"Interest subsidy of 7% on term loans for 5 years",type:"Interest Subsidy",sectors:["Textile"]},{name:"Vibrant Gujarat MSME Scheme",benefit:"Land at concessional rates in GIDC estates",type:"Infrastructure",sectors:["Manufacturing"]}],
  "Tamil Nadu":[{name:"TNSIM Scheme",benefit:"35% capital subsidy for Micro units up to ₹25L",type:"Capital Subsidy",sectors:["Manufacturing","Food Processing"]},{name:"TIDCO MSME Cluster Development",benefit:"Shared infrastructure funding for MSME clusters",type:"Infrastructure",sectors:["Manufacturing","Textile"]},{name:"Tamil Nadu Startup & Innovation Policy",benefit:"₹15L grant + mentorship for tech startups",type:"Grant",sectors:["Technology"]},{name:"SIPCOT Industrial Estates",benefit:"Subsidized industrial plots in SIPCOT parks",type:"Infrastructure",sectors:["Manufacturing"]},{name:"TN Leather Sector Subsidy",benefit:"40% capital subsidy for leather goods manufacturers",type:"Capital Subsidy",sectors:["Manufacturing","Leather"]}],
  "Karnataka":[{name:"Karnataka MSME & Startup Policy 2020",benefit:"25% capital investment subsidy up to ₹50L",type:"Capital Subsidy",sectors:["Manufacturing","Technology"]},{name:"Elevate Karnataka",benefit:"₹50L grant for high-growth startups",type:"Grant",sectors:["Technology"]},{name:"Karnataka Udyog Mitra",benefit:"Single window clearance + 5% interest subvention",type:"Interest Subsidy",sectors:["All"]},{name:"KIADB Industrial Plots",benefit:"Industrial plots at 30% below market rate",type:"Infrastructure",sectors:["Manufacturing"]},{name:"Suvarna Karnataka Scheme",benefit:"Employment incentive ₹3,000/employee/month",type:"Employment",sectors:["Manufacturing","Services"]}],
  "Andhra Pradesh":[{name:"AP MSME Development Policy",benefit:"20% investment subsidy on fixed capital up to ₹40L",type:"Capital Subsidy",sectors:["Manufacturing","Agro Processing"]},{name:"YSR Jagananna Chedodu",benefit:"₹10,000–₹75,000 working capital for micro enterprises",type:"Working Capital",sectors:["Services","Retail","Trading"]},{name:"AP Sunrise Scheme",benefit:"₹1L–₹10L zero-interest loans for SC/ST entrepreneurs",type:"Loan Subsidy",sectors:["All"]},{name:"APIIC Industrial Parks",benefit:"Ready sheds at subsidized rates",type:"Infrastructure",sectors:["Manufacturing"]},{name:"AP Export Promotion Scheme",benefit:"8% freight subsidy for export-oriented MSMEs",type:"Export",sectors:["Manufacturing","Agro","Textile"]}],
  "Telangana":[{name:"T-IDEA Scheme",benefit:"25% capital subsidy + 5-year tax holiday",type:"Capital Subsidy",sectors:["Manufacturing","Technology"]},{name:"WE-HUB Program",benefit:"₹10L grant for women-led enterprises",type:"Grant",sectors:["All"]},{name:"T-Hub Innovation Grant",benefit:"₹25L for deep-tech startups + global exposure",type:"Grant",sectors:["Technology"]},{name:"Telangana Industrial Health Clinic",benefit:"Revival support for sick MSMEs",type:"Revival",sectors:["Manufacturing"]},{name:"TASK Skill Development",benefit:"Subsidized skilling for MSME workforce",type:"Skilling",sectors:["All"]}],
  "Rajasthan":[{name:"Rajasthan MSME Act Benefits",benefit:"30% capital subsidy for general, 35% for SC/ST",type:"Capital Subsidy",sectors:["Manufacturing","Handicraft"]},{name:"iStart Rajasthan",benefit:"₹5L seed grant + incubation for startups",type:"Grant",sectors:["Technology"]},{name:"Rajasthan Handicraft Scheme",benefit:"50% subsidy on artisan tool purchase",type:"Equipment",sectors:["Handicraft","Textile"]},{name:"RIICO Industrial Plot Scheme",benefit:"Industrial plots at subsidized rates",type:"Infrastructure",sectors:["Manufacturing"]},{name:"Rajasthan Tourism MSME",benefit:"40% subsidy for tourism-linked MSMEs",type:"Capital Subsidy",sectors:["Tourism"]}],
  "Uttar Pradesh":[{name:"UP MSME Promotion Policy 2022",benefit:"25% capital subsidy on plant & machinery up to ₹20L",type:"Capital Subsidy",sectors:["Manufacturing","Food Processing"]},{name:"UP One District One Product (ODOP)",benefit:"Subsidized raw material + market linkage support",type:"Market Linkage",sectors:["Manufacturing","Handicraft"]},{name:"CM Yuva Udyami Yojana",benefit:"₹5L interest-free loan for youth entrepreneurs",type:"Loan Subsidy",sectors:["All"]},{name:"UP Startup Policy 2020",benefit:"₹15L grant + income tax rebate for 5 years",type:"Grant",sectors:["Technology"]},{name:"UP Kaushal Vikas Yojana",benefit:"Free skill training + placement linkage",type:"Skilling",sectors:["Manufacturing","Services"]}],
  "West Bengal":[{name:"WB MSME Incentive Scheme",benefit:"20% capital subsidy on fixed assets up to ₹25L",type:"Capital Subsidy",sectors:["Manufacturing","Jute","Leather"]},{name:"Karma Sathi Prakalpa",benefit:"₹2L–₹10L loan at 2% interest for micro business",type:"Loan Subsidy",sectors:["All"]},{name:"WB Women Entrepreneur Scheme",benefit:"₹5L collateral-free loan at 4% for women",type:"Loan Subsidy",sectors:["All"]},{name:"Bengal Silicon Valley Hub",benefit:"Subsidized co-working + ₹10L startup grant",type:"Grant",sectors:["Technology"]},{name:"Sishu Sathi MSME Policy",benefit:"Employment incentive ₹2,000/worker for 2 years",type:"Employment",sectors:["Manufacturing","Services"]}],
  "Delhi":[{name:"Delhi Industrial Policy 2021",benefit:"25% capital subsidy for manufacturing MSMEs",type:"Capital Subsidy",sectors:["Manufacturing"]},{name:"Delhi Startup Policy",benefit:"₹10L grant + mentorship + co-working for startups",type:"Grant",sectors:["Technology","Services"]},{name:"Delhi MSME Loan Guarantee Scheme",benefit:"75% loan guarantee for MSMEs without collateral",type:"Guarantee",sectors:["All"]},{name:"Delhi Rozgar Bazaar",benefit:"Free recruitment + skill upgrade for MSME workforce",type:"Employment",sectors:["Services","Manufacturing"]}],
  "Punjab":[{name:"Punjab MSME Policy 2022",benefit:"30% capital subsidy on plant & machinery up to ₹40L",type:"Capital Subsidy",sectors:["Manufacturing","Food Processing"]},{name:"Punjab Ghar Ghar Rozgar",benefit:"Training + ₹3L loan for youth-led micro enterprises",type:"Loan Subsidy",sectors:["All"]},{name:"PSIEC Industrial Estates",benefit:"Land and sheds at subsidized rates",type:"Infrastructure",sectors:["Manufacturing"]},{name:"Punjab Export Promotion Scheme",benefit:"6% export incentive on FOB value",type:"Export",sectors:["Manufacturing","Agriculture"]}],
  "Haryana":[{name:"Haryana MSME Policy 2019",benefit:"25% capital subsidy up to ₹50L for new units",type:"Capital Subsidy",sectors:["Manufacturing","IT"]},{name:"Haryana Entrepreneurs Hub",benefit:"₹10L grant + co-working space for startups",type:"Grant",sectors:["Technology"]},{name:"HSIIDC Industrial Plots",benefit:"Industrial land allocation at subsidized rates",type:"Infrastructure",sectors:["Manufacturing"]},{name:"Haryana Employment Incentive",benefit:"₹5,000/month per SC/ST/women employee for 3 years",type:"Employment",sectors:["Manufacturing","Services"]}],
  "Kerala":[{name:"Kerala MSME Development Scheme",benefit:"25% capital subsidy on equipment up to ₹20L",type:"Capital Subsidy",sectors:["Manufacturing","Coir","Handloom"]},{name:"Kerala Startup Mission (KSUM)",benefit:"₹15L equity-free grant + incubation",type:"Grant",sectors:["Technology"]},{name:"Kerala Women Entrepreneur Scheme",benefit:"₹5L collateral-free loan at 4% interest",type:"Loan Subsidy",sectors:["All"]},{name:"Kerala Tourism MSME",benefit:"35% subsidy for eco-tourism & hospitality MSMEs",type:"Capital Subsidy",sectors:["Tourism"]}],
  "Madhya Pradesh":[{name:"MP MSME Vikas Niti 2021",benefit:"30% capital subsidy + 5-year tax waiver",type:"Capital Subsidy",sectors:["Manufacturing","Agro"]},{name:"Mukhyamantri Yuva Udyami Yojana",benefit:"₹10L–₹1Cr loan with 15-20% margin money",type:"Loan Subsidy",sectors:["All"]},{name:"MP Export Promotion Incentive",benefit:"5% freight subsidy for export-oriented units",type:"Export",sectors:["Manufacturing","Agriculture"]},{name:"MP Startup Policy",benefit:"₹5L grant + 5-year rent-free co-working",type:"Grant",sectors:["Technology"]}],
};
const ALL_STATES = [...Object.keys(STATE_SCHEMES),"Assam","Bihar","Chhattisgarh","Goa","Himachal Pradesh","Jharkhand","Manipur","Meghalaya","Odisha","Uttarakhand"].sort();

// ── FIXED: Form field components defined OUTSIDE any other component ──────────
// This prevents re-mounting on every keystroke (was the cause of focus loss)
function FieldInput({ label, value, onChange, type='text', opts }) {
  return (
    <div>
      <label style={LBL}>{label}</label>
      {opts
        ? <select value={value} onChange={e => onChange(e.target.value)} style={mkInp()}>
            <option value="">Select…</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={mkInp()}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
      }
    </div>
  );
}

function FieldToggle({ label, value, onChange }) {
  return (
    <div>
      <label style={LBL}>{label}</label>
      <div style={{ display:'flex', gap:8 }}>
        {['Yes','No'].map(v => (
          <button key={v} onClick={() => onChange(v)} style={{ flex:1,padding:'9px',borderRadius:7,border:'1.5px solid',cursor:'pointer',fontWeight:700,fontSize:13,background:value===v?C.blue:'transparent',borderColor:value===v?C.blue:C.border,color:value===v?'#fff':C.muted }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ScoreGauge({ score }) {
  const color = score>=75?C.green:score>=50?C.amber:C.red;
  const pct=score/100, totalArc=220, startAng=160;
  const toXY=(a,r)=>[90+r*Math.cos(a*Math.PI/180),90+r*Math.sin(a*Math.PI/180)];
  const arc=(r,s,sw)=>{ const [x1,y1]=toXY(s,r);const [x2,y2]=toXY(s+sw,r);return `M${x1},${y1} A${r},${r} 0 ${sw>180?1:0},1 ${x2},${y2}`; };
  const na=startAng+pct*totalArc; const [nx,ny]=toXY(na,52);
  return (
    <div style={{textAlign:'center'}}>
      <svg width={180} height={140} viewBox="0 0 180 140">
        <path d={arc(65,startAng,totalArc)} fill="none" stroke="#e2e8f0" strokeWidth={14} strokeLinecap="round"/>
        <path d={arc(65,startAng,pct*totalArc)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"/>
        <line x1={90} y1={90} x2={nx} y2={ny} stroke={color} strokeWidth={3} strokeLinecap="round"/>
        <circle cx={90} cy={90} r={6} fill={color}/>
        <text x={90} y={120} textAnchor="middle" fontSize={32} fontWeight={900} fill={color}>{score}</text>
        <text x={90} y={136} textAnchor="middle" fontSize={11} fill={C.muted}>Funding Readiness Score</text>
      </svg>
    </div>
  );
}

function Badge({ t, color='blue' }) {
  const cl = { blue:{bg:'#dbeafe',c:C.blue},green:{bg:'#d1fae5',c:C.green},amber:{bg:'#fef3c7',c:C.amber},red:{bg:'#fee2e2',c:C.red},teal:{bg:'#ccfbf1',c:C.teal},indigo:{bg:'#e0e7ff',c:C.indigo} };
  const s = cl[color]||cl.blue;
  return <span style={{padding:'3px 10px',borderRadius:100,background:s.bg,color:s.c,fontSize:11,fontWeight:700}}>{t}</span>;
}

function Pill({ n, pct, color }) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,color:C.text,fontWeight:600}}>{n}</span><span style={{fontSize:13,fontWeight:700,color}}>{pct}%</span></div>
      <div style={{height:7,background:'#e2e8f0',borderRadius:6}}><div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:6}}/></div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ page, nav, authState, setAuthState }) {
  return (
    <nav style={{background:C.navy,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:58,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px rgba(0,0,0,0.3)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>nav('home')}>
        <div style={{width:34,height:34,borderRadius:9,background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:17,color:'#fff'}}>M</div>
        <div>
          <div style={{fontWeight:900,fontSize:15,color:'#fff'}}>MSMEGrowth <span style={{color:C.cyan}}>AI</span></div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.35)',lineHeight:1}}>Funding Intelligence Platform</div>
        </div>
      </div>
      <div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
        {[['home','Home'],['pricing','Pricing']].map(([p,l])=>(
          <button key={p} onClick={()=>nav(p)} style={{background:page===p?'rgba(6,182,212,0.12)':'transparent',border:'none',color:page===p?C.cyan:'rgba(255,255,255,0.5)',padding:'6px 12px',borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:13}}>{l}</button>
        ))}
        {authState ? <>
          {['dashboard','admin'].map(p=>(
            <button key={p} onClick={()=>nav(p)} style={{background:page===p?'rgba(6,182,212,0.12)':'transparent',border:'none',color:page===p?C.cyan:'rgba(255,255,255,0.5)',padding:'6px 12px',borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:13,textTransform:'capitalize'}}>{p}</button>
          ))}
          <div style={{width:32,height:32,borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',marginLeft:4}} onClick={()=>{ signOut(); setAuthState(false); nav('home'); }}>R</div>
        </> : <>
          <button onClick={()=>nav('signin')} style={{background:'transparent',border:'none',color:'rgba(255,255,255,0.6)',padding:'6px 12px',borderRadius:7,cursor:'pointer',fontWeight:600,fontSize:13}}>Sign In</button>
          <button onClick={()=>nav('signup')} style={mkPbtn({padding:'7px 16px',fontSize:13})}>Get Started</button>
        </>}
        <button onClick={()=>nav('assessment')} style={{...mkPbtn({padding:'7px 14px',fontSize:13}),background:'rgba(6,182,212,0.18)',color:C.cyan,marginLeft:4}}>Check Eligibility</button>
      </div>
    </nav>
  );
}

// ── Auth Pages ────────────────────────────────────────────────────────────────
function AuthPage({ mode, nav, setAuthState }) {
  const [email,setEmail]=useState('');
  const [pwd,setPwd]=useState('');
  const [name,setName]=useState('');
  const [company,setCompany]=useState('');
  const [loading,setLoading]=useState(false);
  const isLogin = mode==='signin';

  const handle = async () => {
    setLoading(true);
    const credentials = { email, password: pwd, fullName: name, companyName: company };
    try {
      if (isLogin) await signIn(credentials);
      else await signUp(credentials);
      setAuthState(true);
      nav('dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'calc(100vh - 58px)',background:`linear-gradient(160deg,${C.navy},#1e3a5f)`,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:C.white,borderRadius:20,padding:40,width:'100%',maxWidth:440,boxShadow:'0 24px 64px rgba(0,0,0,0.25)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:48,height:48,borderRadius:12,background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:22,color:'#fff',margin:'0 auto 14px'}}>M</div>
          <h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:'0 0 4px'}}>{isLogin?'Welcome Back':'Create Account'}</h2>
          <p style={{color:C.muted,fontSize:14,margin:0}}>{isLogin?'Sign in to your MSMEGrowth AI account':'Start your MSME funding journey today'}</p>
        </div>
        {!isLogin && <>
          <label style={LBL}>Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} style={{...mkInp(),marginBottom:14}} placeholder="Ravi Kumar"/>
          <label style={LBL}>Company Name</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} style={{...mkInp(),marginBottom:14}} placeholder="Sunrise Manufacturing Pvt Ltd"/>
        </>}
        <label style={LBL}>Email Address</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{...mkInp(),marginBottom:14}} placeholder="you@company.in"/>
        <label style={LBL}>Password</label>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} style={{...mkInp(),marginBottom:22}} placeholder="••••••••"/>
        <button onClick={handle} style={{...mkPbtn({width:'100%',padding:'14px',fontSize:15}),opacity:loading?0.7:1}}>{loading?'Processing…':isLogin?'Sign In →':'Create Account →'}</button>
        <p style={{textAlign:'center',fontSize:13,color:C.muted,marginTop:16}}>
          {isLogin?'No account? ':'Have an account? '}
          <button onClick={()=>nav(isLogin?'signup':'signin')} style={{background:'none',border:'none',color:C.blue,cursor:'pointer',fontWeight:700,fontSize:13}}>{isLogin?'Sign Up Free':'Sign In'}</button>
        </p>
      </div>
    </div>
  );
}

// ── Pricing Page ──────────────────────────────────────────────────────────────
function PricingPage({ nav }) {
  const [billing, setBilling] = useState('monthly');
  const plans = [
    { name:'Free',price:0,icon:'🌱',color:C.green,features:['1 Report/month','Basic AI Analysis','Central Schemes Only','Email Support'],cta:'Get Started Free',action:()=>nav('signup') },
    { name:'Starter',price:billing==='monthly'?999:9499,icon:'⚡',color:C.blue,popular:true,features:['10 Reports/month','Full AI Analysis','State + Central Schemes','PDF Download','Priority Support'],cta:'Start Free Trial',action:()=>nav('signup') },
    { name:'Pro',price:billing==='monthly'?2999:28799,icon:'🚀',color:C.indigo,features:['Unlimited Reports','All 28 States Schemes','White-label Reports','API Access','Dedicated Manager'],cta:'Go Pro',action:()=>nav('signup') },
    { name:'Enterprise',price:null,icon:'🏢',color:C.navy,features:['Unlimited Reports','Custom AI Models','NBFC Integrations','Bulk Assessment','SLA Support'],cta:'Contact Sales',action:()=>nav('signup') },
  ];
  return (
    <div>
      <div style={{background:`linear-gradient(160deg,${C.navy},#1e3a5f)`,padding:'72px 32px',textAlign:'center'}}>
        <h1 style={{fontSize:'clamp(26px,4vw,46px)',fontWeight:900,color:'#fff',margin:'0 0 12px'}}>Simple, Transparent Pricing</h1>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:16,marginBottom:28}}>Start free. Scale as your MSME grows.</p>
        <div style={{display:'inline-flex',background:'rgba(255,255,255,0.08)',borderRadius:100,padding:4,gap:4}}>
          {['monthly','yearly'].map(b=>(
            <button key={b} onClick={()=>setBilling(b)} style={{padding:'8px 22px',borderRadius:100,border:'none',cursor:'pointer',fontWeight:700,fontSize:13,background:billing===b?C.white:'transparent',color:billing===b?C.text:'rgba(255,255,255,0.6)',textTransform:'capitalize'}}>{b}{b==='yearly'&&<span style={{color:C.green,fontSize:11,marginLeft:6}}>-20%</span>}</button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'40px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}}>
          {plans.map(p=>(
            <div key={p.name} style={{...mkCard({padding:28,position:'relative',borderColor:p.popular?C.blue:C.border,boxShadow:p.popular?`0 0 0 2px ${C.blue},0 8px 32px rgba(30,64,175,0.15)`:undefined})}}>
              {p.popular&&<div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:grad,color:'#fff',fontSize:11,fontWeight:800,padding:'4px 16px',borderRadius:100}}>⭐ MOST POPULAR</div>}
              <div style={{fontSize:34,marginBottom:12}}>{p.icon}</div>
              <h3 style={{fontSize:19,fontWeight:900,margin:'0 0 8px'}}>{p.name}</h3>
              <div style={{marginBottom:18}}>{p.price===null?<div style={{fontSize:26,fontWeight:900,color:p.color}}>Custom</div>:<><span style={{fontSize:34,fontWeight:900,color:p.color}}>₹{p.price.toLocaleString('en-IN')}</span><span style={{color:C.muted,fontSize:13}}>/{billing==='monthly'?'mo':'yr'}</span></>}</div>
              <div style={{marginBottom:22}}>{p.features.map(f=><div key={f} style={{display:'flex',gap:8,marginBottom:7,fontSize:13}}><span style={{color:C.green,fontWeight:700}}>✓</span>{f}</div>)}</div>
              <button onClick={p.action} style={{...mkPbtn({width:'100%',padding:'11px'}),background:p.popular?grad:'transparent',color:p.popular?'#fff':C.blue,border:p.popular?'none':`1.5px solid ${C.blue}`}}>{p.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FIXED Assessment Page ─────────────────────────────────────────────────────
const INIT_FORM = {
  name:'',companyName:'',companyType:'',sector:'',state:'',businessAge:'',
  turnover:'',netProfit:'',employees:'',assets:'',liabilities:'',creditScore:'',
  gst:'Yes',udyam:'No',existingLoans:'No',collateral:'No',exportBiz:'No',womenLed:'No',scstOwned:'No',
  loanPurpose:'',loanAmount:''
};
const CO_TYPES = ['Proprietorship','Partnership','LLP','Private Limited','Public Limited','OPC'];
const SECTORS = ['Manufacturing','Trading','Services','Technology','Agriculture','Food Processing','Textile','Construction','Healthcare','Logistics','Retail','Education','Handicraft','Tourism'];

function AssessmentPage({ nav, setReport }) {
  const [step,   setStep]   = useState(1);
  const [form,   setForm]   = useState(INIT_FORM);
  const [files,  setFiles]  = useState([]);
  const [loading,setLoading]= useState(false);
  const [loadMsg,setLoadMsg]= useState('');
  const [err,    setErr]    = useState('');
  const fRef = useRef(null);

  // Stable field updater — won't cause child remounting
  const upd = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);

  const toB64 = f => new Promise((res,rej)=>{ const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(f); });

  const buildReport = (f) => {
    const t = parseFloat(f.turnover)||0, p = parseFloat(f.netProfit)||0;
    const a = parseFloat(f.assets)||0, l = parseFloat(f.liabilities)||0;
    const emp = parseInt(f.employees)||0, cs = parseInt(f.creditScore)||650;
    const margin = t>0 ? ((p/t)*100).toFixed(1) : '0';
    const der = l>0&&(a-l)>0 ? (l/(a-l)).toFixed(2) : '1.2';
    const msme = t<=50?'Micro':t<=250?'Small':t<=1000?'Medium':'Large';
    const score = Math.min(95, Math.max(30,
      (f.gst==='Yes'?10:0)+(f.udyam==='Yes'?10:0)+
      (cs>=700?15:cs>=600?8:3)+
      (p>0?15:0)+(t>50?10:t>20?6:3)+
      (f.collateral==='Yes'?10:0)+(f.existingLoans==='No'?5:0)+
      (emp>10?8:emp>5?5:3)+(a>l?5:0)
    ));
    const stateS = STATE_SCHEMES[f.state]||[];
    const wc = Math.round(Math.min(t*0.25, 200));
    const tl = Math.round(Math.min(a*0.6, 500));
    const ul = Math.round(Math.min(t*0.15, 50));
    const wcP = Math.min(92, Math.max(40, score+(f.collateral==='Yes'?8:0)+(f.gst==='Yes'?5:0)));
    const tlP = Math.min(88, Math.max(35, score-5+(f.collateral==='Yes'?12:0)));
    const ulP = Math.min(75, Math.max(25, score-15+(cs>=700?10:0)));
    const eligible = [], ineligible = [];
    if(t<=50) eligible.push({name:'MUDRA Shishu/Kishore',ministry:'Ministry of Finance',benefit:'Collateral-free micro loans for small businesses',amount:'Up to ₹5L',type:'Central'});
    else eligible.push({name:'MUDRA Tarun',ministry:'Ministry of Finance',benefit:'Loan for established micro enterprises',amount:'Up to ₹10L',type:'Central'});
    if(f.udyam==='Yes') eligible.push({name:'CGTMSE Credit Guarantee',ministry:'Ministry of MSME',benefit:'Collateral-free loan guarantee cover',amount:'Up to ₹2 Cr',type:'Central'});
    else ineligible.push({name:'CGTMSE',reason:'Udyam registration required — register first'});
    if(f.gst==='Yes') eligible.push({name:'SIDBI GST-linked Loan',ministry:'SIDBI',benefit:'Pre-approved loans based on GST turnover history',amount:'Up to ₹1 Cr',type:'Central'});
    if(f.womenLed==='Yes') eligible.push({name:'Stand-Up India',ministry:'Ministry of Finance',benefit:'Term loan for women entrepreneurs',amount:'₹10L – ₹1 Cr',type:'Central'});
    else ineligible.push({name:'Stand-Up India',reason:'Available only for women-led or SC/ST enterprises'});
    if(f.exportBiz==='Yes') eligible.push({name:'ECGC Export Credit',ministry:'Ministry of Commerce',benefit:'Export credit insurance and guarantees',amount:'Up to ₹5 Cr',type:'Central'});
    else ineligible.push({name:'ECGC Export Credit',reason:'Business must be export-oriented'});
    if(stateS.length) eligible.push({name:stateS[0].name,ministry:`${f.state} Government`,benefit:stateS[0].benefit,amount:'As per scheme',type:'State'});
    if(stateS.length>1) eligible.push({name:stateS[1].name,ministry:`${f.state} Government`,benefit:stateS[1].benefit,amount:'As per scheme',type:'State'});
    ineligible.push({name:'PLI Scheme',reason:'Turnover below ₹100 Cr threshold for PLI eligibility'});
    const flags = [];
    if(cs<650) flags.push({flag:'Low Credit Score',severity:'High',desc:`Credit score ${cs} is below the 700 threshold preferred by most lenders. Improve by clearing dues on time.`});
    if(l>a) flags.push({flag:'Liabilities exceed assets',severity:'High',desc:'Total liabilities are higher than assets which signals high financial risk to lenders.'});
    if(p<=0) flags.push({flag:'No reported profit',severity:'Medium',desc:'Net profit is zero or negative. Lenders will require explanation and future projections.'});
    if(f.udyam==='No') flags.push({flag:'No Udyam Registration',severity:'Medium',desc:'Without Udyam registration you miss out on MSME-priority lending rates and scheme access.'});
    if(flags.length===0) flags.push({flag:'No major risk flags',severity:'Low',desc:'Your profile looks clean. Maintain GST compliance and credit discipline to keep it that way.'});
    return {
      msme, fundingScore:score,
      scoreBreakdown:[
        {cat:'Financial Health',val:Math.min(95,Math.max(30,p>0?60+Math.round(parseFloat(margin)):35))},
        {cat:'Compliance',val:(f.gst==='Yes'?50:0)+(f.udyam==='Yes'?50:0)||30},
        {cat:'Credit Profile',val:cs>=750?90:cs>=700?75:cs>=650?60:cs>=600?45:30},
        {cat:'Business Stability',val:Math.min(90,30+parseInt(f.businessAge||0)*8)},
        {cat:'Market Position',val:t>500?85:t>100?70:t>50?58:t>20?48:38},
      ],
      businessOverview:{
        summary:`${f.companyName||'This business'} is a ${msme}-category ${f.companyType||'enterprise'} in the ${f.sector||'business'} sector based in ${f.state||'India'}, with ₹${t}L annual turnover and ${emp} employees. ${p>0?'The business is profitable and shows positive financial health.':'The business should focus on improving profitability before approaching lenders.'}`,
        strengths:[
          f.gst==='Yes'?'GST registered — eligible for GST-linked loans':'Consider GST registration for better loan access',
          f.collateral==='Yes'?'Has collateral to secure term loans':'Build assets as collateral for future loans',
          f.udyam==='Yes'?'Udyam registered — MSME benefits apply':`${emp} employees contributing to operations`,
        ],
        concerns:[
          p<=0?'Not currently profitable — lenders require positive P&L':'Maintain profitability consistently',
          cs<700?`Credit score ${cs} needs improvement to 700+ for best rates`:'Maintain existing credit discipline',
        ]
      },
      financialSnapshot:{
        annualTurnover:`₹${t} Lakhs`, netProfit:`₹${p} Lakhs`, profitMargin:`${margin}%`,
        debtEquityRatio:`${der}:1`, currentRatio:a>0?(a/Math.max(l,1)).toFixed(2):'N/A', employees:`${emp}`
      },
      loanEligibility:[
        {type:'Working Capital Loan',maxAmt:`₹${wc} Lakhs`,rate:'10–13% p.a.',tenure:'12 months',probability:wcP,banks:['SBI','Canara Bank','Bank of Baroda']},
        {type:'Term Loan',maxAmt:`₹${tl} Lakhs`,rate:'11–14% p.a.',tenure:'5 years',probability:tlP,banks:['SIDBI','HDFC Bank','Axis Bank']},
        {type:'Unsecured Business Loan',maxAmt:`₹${ul} Lakhs`,rate:'16–22% p.a.',tenure:'36 months',probability:ulP,banks:['Bajaj Finserv','IDFC First','Lendingkart']},
      ],
      eligibleSchemes: eligible,
      ineligibleSchemes: ineligible,
      subsidyOpportunities:[
        {name:'CLCSS Technology Upgrade',type:'Capital',amount:'15% up to ₹15L',desc:'Capital subsidy on technology upgradation for manufacturing MSMEs'},
        {name:'Interest Subvention Scheme',type:'Interest',amount:'2% p.a.',desc:'RBI-mandated 2% interest subvention on working capital for GST-registered MSMEs'},
        ...(stateS.length>2?[{name:stateS[2].name,type:stateS[2].type,amount:'As per scheme',desc:stateS[2].benefit}]:[{name:'State Capital Subsidy',type:'Capital',amount:'20–30%',desc:`Check ${f.state||'your state'} Industries Dept for applicable machinery subsidies`}])
      ],
      creditRiskFlags: flags,
      recommendations:[
        {title:f.udyam==='No'?'Register on Udyam Portal':'Maintain Udyam compliance',desc:f.udyam==='No'?'Udyam registration is free and unlocks MSME-priority lending, lower interest rates, and 200+ scheme eligibilities.':'Ensure your Udyam certificate is up to date and turnover details are accurate.',priority:'High'},
        {title:'Improve CIBIL score',desc:'Pay all EMIs and credit card dues on time. Keep credit utilisation below 30%. A score above 700 unlocks the best loan rates.',priority:cs<700?'High':'Low'},
        {title:'Apply for CGTMSE guarantee',desc:'CGTMSE provides a 75% government guarantee on your loan, making it much easier to get approved without collateral.',priority:f.collateral==='No'?'High':'Medium'},
        {title:`Explore ${f.state||'state'} capital subsidy`,desc:`Apply through the ${f.state||'state'} Industries Department for a capital subsidy of 20–35% on new machinery and equipment purchases.`,priority:'Medium'},
      ],
      fundingRoadmap:[
        {phase:'Phase 1',timeline:'Month 1–2',action:`Register on Udyam portal${f.udyam==='No'?'':', apply for MUDRA/SIDBI working capital loan'} and gather 2 years ITR + bank statements`,target:`Secure ₹${wc} L working capital`},
        {phase:'Phase 2',timeline:'Month 3–6',action:`Apply for ${f.state||'state'} capital subsidy and CGTMSE-backed term loan through ${f.collateral==='Yes'?'your bank':'SIDBI'}`,target:`Receive machinery/equipment funding of ₹${Math.round(tl*0.4)} L`},
        {phase:'Phase 3',timeline:'Month 6–12',action:'Expand operations, file GST returns consistently, and build 12-month banking track record for next credit cycle',target:`Scale turnover to ₹${Math.round(t*1.3)} L with improved credit score`},
      ],
    };
  };

  const analyze = async () => {
    setLoading(true);
    setErr('');

    try {
      let docs = [];
      if (files.length) {
        setLoadMsg('Uploading documents...');
        docs = await Promise.all(
          files.map(async f => ({
            name: f.name,
            mime: f.type || 'application/pdf',
            contentBase64: await toB64(f),
          })),
        );
      }

      setLoadMsg('Running AI financial analysis...');
      const fallbackReport = buildReport(form);
      const report = await generateFundingReport({ form, docs, fallbackReport });
      setReport(report);
      nav('report');
    } catch (e) {
      setErr(e?.message || 'Something went wrong while generating the report.');
    } finally {
      setLoading(false);
      setLoadMsg('');
    }
  };

  const STEPS = ['Company Details','Financial Data','Entrepreneur Profile','Documents'];

  if (loading) return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,background:'#f8fafc'}}>
      <div style={{width:64,height:64,border:`5px solid #e2e8f0`,borderTop:`5px solid ${C.teal}`,borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:20,fontWeight:800,color:C.text,margin:'0 0 6px'}}>Analyzing your business…</p>
        <p style={{color:C.muted,fontSize:14}}>{loadMsg}</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{maxWidth:820,margin:'0 auto',padding:'44px 24px'}}>
      <h2 style={{fontSize:26,fontWeight:900,color:C.text,margin:'0 0 4px'}}>Business Funding Assessment</h2>
      <p style={{color:C.muted,marginBottom:28}}>Fill in your details to receive an AI-powered Funding Intelligence Report.</p>

      {/* Step bar */}
      <div style={{display:'flex',marginBottom:32,background:C.white,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
        {STEPS.map((s,i)=>{ const active=step===i+1,done=step>i+1; return(
          <div key={s} style={{flex:1,padding:'13px 6px',textAlign:'center',background:active?grad:done?'#f0fdf4':'transparent',cursor:done?'pointer':'default'}} onClick={()=>done&&setStep(i+1)}>
            <div style={{fontSize:10,fontWeight:700,color:active?'#fff':done?C.green:C.muted,textTransform:'uppercase',letterSpacing:'0.04em'}}>{done?'✓ ':''}{s}</div>
          </div>
        ); })}
      </div>

      {/* Step 1 */}
      {step===1 && (
        <div style={mkCard()}>
          <p style={{fontSize:12,color:C.teal,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 18px'}}>Company Details</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <FieldInput label="Your Name"        value={form.name}        onChange={v=>upd('name',v)}/>
            <FieldInput label="Company Name"     value={form.companyName} onChange={v=>upd('companyName',v)}/>
            <FieldInput label="Company Type"     value={form.companyType} onChange={v=>upd('companyType',v)} opts={CO_TYPES}/>
            <FieldInput label="Business Sector"  value={form.sector}      onChange={v=>upd('sector',v)}      opts={SECTORS}/>
            <FieldInput label="State / UT"       value={form.state}       onChange={v=>upd('state',v)}       opts={ALL_STATES}/>
            <FieldInput label="Business Age (Years)" value={form.businessAge} onChange={v=>upd('businessAge',v)} type="number"/>
            <FieldToggle label="GST Registered?"          value={form.gst}   onChange={v=>upd('gst',v)}/>
            <FieldToggle label="Udyam / MSME Registered?" value={form.udyam} onChange={v=>upd('udyam',v)}/>
          </div>
          {form.state && STATE_SCHEMES[form.state] && (
            <div style={{marginTop:18,background:'#eff6ff',borderRadius:10,padding:14,border:`1px solid #dbeafe`}}>
              <p style={{fontSize:12,color:C.blue,fontWeight:700,margin:'0 0 4px'}}>🏛️ {STATE_SCHEMES[form.state].length} State Schemes Found for {form.state}</p>
              <p style={{fontSize:12,color:C.muted,margin:0}}>{STATE_SCHEMES[form.state].slice(0,2).map(s=>s.name).join(' · ')} {STATE_SCHEMES[form.state].length>2?`+ ${STATE_SCHEMES[form.state].length-2} more`:''}</p>
            </div>
          )}
          <button onClick={()=>setStep(2)} style={mkPbtn({width:'100%',marginTop:24,padding:'13px'})}>Next: Financial Data →</button>
        </div>
      )}

      {/* Step 2 */}
      {step===2 && (
        <div style={mkCard()}>
          <p style={{fontSize:12,color:C.teal,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 18px'}}>Financial Information (₹ in Lakhs)</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <FieldInput label="Annual Turnover (₹L)"   value={form.turnover}    onChange={v=>upd('turnover',v)}    type="number"/>
            <FieldInput label="Net Profit / Loss (₹L)" value={form.netProfit}   onChange={v=>upd('netProfit',v)}   type="number"/>
            <FieldInput label="Total Assets (₹L)"      value={form.assets}      onChange={v=>upd('assets',v)}      type="number"/>
            <FieldInput label="Total Liabilities (₹L)" value={form.liabilities} onChange={v=>upd('liabilities',v)} type="number"/>
            <FieldInput label="No. of Employees"       value={form.employees}   onChange={v=>upd('employees',v)}   type="number"/>
            <FieldInput label="CIBIL / Credit Score"   value={form.creditScore} onChange={v=>upd('creditScore',v)} type="number"/>
            <FieldToggle label="Existing Loans?"  value={form.existingLoans} onChange={v=>upd('existingLoans',v)}/>
            <FieldToggle label="Have Collateral?" value={form.collateral}    onChange={v=>upd('collateral',v)}/>
          </div>
          <p style={{fontSize:12,color:C.teal,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'20px 0 14px'}}>Funding Requirement</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <FieldInput label="Purpose of Funding" value={form.loanPurpose} onChange={v=>upd('loanPurpose',v)} opts={['Working Capital','Machinery Purchase','Business Expansion','Export Finance','Infrastructure','R&D','Other']}/>
            <FieldInput label="Loan Amount Required (₹L)" value={form.loanAmount} onChange={v=>upd('loanAmount',v)} type="number"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:24}}>
            <button onClick={()=>setStep(1)} style={mkObtn({width:'100%',padding:'12px'})}>← Back</button>
            <button onClick={()=>setStep(3)} style={mkPbtn({width:'100%',padding:'12px'})}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3 && (
        <div style={mkCard()}>
          <p style={{fontSize:12,color:C.teal,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 8px'}}>Entrepreneur Profile</p>
          <p style={{color:C.muted,fontSize:13,marginBottom:18}}>These details unlock additional scheme eligibility for women-led, SC/ST, and export businesses.</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <FieldToggle label="Women-Led Enterprise?" value={form.womenLed}  onChange={v=>upd('womenLed',v)}/>
            <FieldToggle label="SC / ST Owned?"        value={form.scstOwned} onChange={v=>upd('scstOwned',v)}/>
            <FieldToggle label="Export Business?"      value={form.exportBiz} onChange={v=>upd('exportBiz',v)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:24}}>
            <button onClick={()=>setStep(2)} style={mkObtn({width:'100%',padding:'12px'})}>← Back</button>
            <button onClick={()=>setStep(4)} style={mkPbtn({width:'100%',padding:'12px'})}>Next: Documents →</button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step===4 && (
        <div>
          <div style={mkCard({marginBottom:14})}>
            <p style={{fontSize:12,color:C.teal,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 8px'}}>Upload Documents (Optional)</p>
            <p style={{color:C.muted,fontSize:13,marginBottom:18}}>Upload ITR, GST Returns, Balance Sheet, or Bank Statements for higher accuracy.</p>
            <div
              onClick={()=>fRef.current.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); setFiles(f=>[...f,...Array.from(e.dataTransfer.files).filter(x=>x.type==='application/pdf')]); }}
              style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:36,textAlign:'center',cursor:'pointer',background:'#f8fafc'}}
            >
              <div style={{fontSize:40,marginBottom:10}}>📂</div>
              <p style={{fontWeight:700,color:C.text,margin:'0 0 4px'}}>Drag & Drop PDFs here</p>
              <p style={{fontSize:13,color:C.muted,margin:'0 0 14px'}}>ITR · GST Returns · Balance Sheet · Bank Statements</p>
              <span style={{background:C.blue,color:'#fff',padding:'8px 20px',borderRadius:7,fontSize:13,fontWeight:700}}>Browse Files</span>
              <input ref={fRef} type="file" accept=".pdf" multiple onChange={e=>setFiles(f=>[...f,...Array.from(e.target.files)])} style={{display:'none'}}/>
            </div>
            {files.length>0 && (
              <div style={{marginTop:14}}>
                {files.map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:`1px solid ${C.border}`}}>
                    <span>📄</span>
                    <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:600}}>{f.name}</p><p style={{margin:0,fontSize:11,color:C.muted}}>{(f.size/1024).toFixed(1)} KB</p></div>
                    <button onClick={()=>setFiles(fl=>fl.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:C.red,cursor:'pointer',fontSize:18}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {err && (
            <div style={{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:8,padding:'12px 16px',marginBottom:14,fontSize:13,color:'#92400e'}}>
              ⚠️ {err}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <button onClick={()=>setStep(3)} style={mkObtn({width:'100%',padding:'13px'})}>← Back</button>
            <button onClick={analyze} style={mkPbtn({width:'100%',padding:'13px'})}>🚀 Generate AI Report</button>
          </div>
          <p style={{textAlign:'center',fontSize:12,color:C.muted,marginTop:10}}>~30 sec · {(STATE_SCHEMES[form.state]?.length||0)+15}+ schemes checked · Documents not stored</p>
        </div>
      )}
    </div>
  );
}

// ── Report Page ───────────────────────────────────────────────────────────────
function ReportPage({ report, nav }) {
  const [tab, setTab] = useState('overview');
  if (!report) return (
    <div style={{textAlign:'center',padding:80}}>
      <p style={{color:C.muted,fontSize:17}}>No report yet. <button onClick={()=>nav('assessment')} style={{color:C.blue,background:'none',border:'none',cursor:'pointer',fontWeight:700,fontSize:17}}>Run Assessment →</button></p>
    </div>
  );
  const r = report;
  const pc = p => p>=75?C.green:p>=55?C.amber:C.red;
  const tabs = [['overview','📊 Overview'],['loans','💰 Loans'],['schemes','🏛️ Schemes'],['state','🗺️ State Schemes'],['risk','🛡️ Risk & Recs'],['roadmap','🗺️ Roadmap']];

  return (
    <div style={{background:'#f8fafc',minHeight:'100vh'}}>
      <div style={{background:C.navy,padding:'28px 32px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:14}}>
          <div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:4,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Funding Intelligence Report</div>
            <h2 style={{fontSize:22,fontWeight:900,margin:'0 0 4px',color:'#fff'}}>{r.meta?.company}</h2>
            <p style={{color:'rgba(255,255,255,0.45)',margin:0,fontSize:13}}>Generated: {r.meta?.date} · State: <strong style={{color:C.cyan}}>{r.meta?.state}</strong> · MSME: <strong style={{color:C.cyan}}>{r.msme}</strong></p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>window.print()} style={mkObtn({color:'#fff',borderColor:'rgba(255,255,255,0.3)',padding:'9px 16px',fontSize:13})}>📄 Download PDF</button>
            <button onClick={()=>nav('assessment')} style={mkPbtn({padding:'9px 16px',fontSize:13})}>+ New Report</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 24px'}}>
        {/* KPI cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:24}}>
          {[
            {l:'Funding Score',v:`${r.fundingScore}/100`,c:r.fundingScore>=75?C.green:r.fundingScore>=50?C.amber:C.red,ic:'🎯'},
            {l:'MSME Category',v:r.msme,c:C.blue,ic:'🏭'},
            {l:'Eligible Schemes',v:`${r.eligibleSchemes?.length||0}`,c:C.teal,ic:'🏛️'},
            {l:'State Schemes',v:`${r.stateSchemes?.length||0}`,c:C.indigo,ic:'🗺️'},
            {l:'Max Loan Est.',v:r.loanEligibility?.[1]?.maxAmt||'—',c:C.green,ic:'💰'},
            {l:'Risk Flags',v:`${r.creditRiskFlags?.length||0}`,c:r.creditRiskFlags?.length>2?C.red:C.amber,ic:'🛡️'},
          ].map(s=>(
            <div key={s.l} style={mkCard({padding:18})}>
              <div style={{fontSize:22,marginBottom:6}}>{s.ic}</div>
              <div style={{fontSize:20,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{display:'flex',gap:4,background:C.white,borderRadius:12,padding:4,border:`1px solid ${C.border}`,marginBottom:22,overflowX:'auto'}}>
          {tabs.map(([k,lb])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:'0 0 auto',padding:'9px 14px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,whiteSpace:'nowrap',background:tab===k?grad:'transparent',color:tab===k?'#fff':C.muted}}>
              {lb}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab==='overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div style={mkCard()}>
              <h3 style={{fontSize:15,fontWeight:800,margin:'0 0 14px'}}>Funding Readiness</h3>
              <ScoreGauge score={r.fundingScore}/>
              <div style={{marginTop:16}}>
                {r.scoreBreakdown?.map(s=><Pill key={s.cat} n={s.cat} pct={s.val} color={s.val>=75?C.green:s.val>=55?C.amber:C.red}/>)}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={mkCard()}>
                <h3 style={{fontSize:15,fontWeight:800,margin:'0 0 12px'}}>Business Overview</h3>
                <p style={{fontSize:13,color:C.muted,lineHeight:1.7,margin:'0 0 14px'}}>{r.businessOverview?.summary}</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div><p style={{fontSize:11,color:C.green,fontWeight:700,margin:'0 0 5px',textTransform:'uppercase'}}>Strengths</p>{r.businessOverview?.strengths?.map((s,i)=><p key={i} style={{fontSize:12,margin:'0 0 3px'}}>✓ {s}</p>)}</div>
                  <div><p style={{fontSize:11,color:C.amber,fontWeight:700,margin:'0 0 5px',textTransform:'uppercase'}}>Concerns</p>{r.businessOverview?.concerns?.map((c,i)=><p key={i} style={{fontSize:12,margin:'0 0 3px'}}>⚠ {c}</p>)}</div>
                </div>
              </div>
              <div style={mkCard()}>
                <h3 style={{fontSize:15,fontWeight:800,margin:'0 0 12px'}}>Financial Snapshot</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {r.financialSnapshot && Object.entries(r.financialSnapshot).map(([k,v])=>(
                    <div key={k} style={{background:'#f8fafc',borderRadius:8,padding:'9px 12px'}}>
                      <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em'}}>{k.replace(/([A-Z])/g,' $1').trim()}</div>
                      <div style={{fontSize:15,fontWeight:800,color:C.text,marginTop:2}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loans */}
        {tab==='loans' && (
          <div>
            {r.loanEligibility?.map((loan,i)=>(
              <div key={i} style={{...mkCard({padding:22,marginBottom:14}),display:'grid',gridTemplateColumns:'1fr auto',gap:18,alignItems:'center'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                    <h3 style={{fontSize:16,fontWeight:800,margin:0}}>{loan.type}</h3>
                    <Badge t={loan.probability>=75?'High Probability':loan.probability>=55?'Moderate':'Lower Chance'} color={loan.probability>=75?'green':loan.probability>=55?'amber':'red'}/>
                  </div>
                  <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:10}}>
                    <span style={{fontSize:13,color:C.muted}}>💰 <strong style={{color:C.green}}>{loan.maxAmt}</strong></span>
                    <span style={{fontSize:13,color:C.muted}}>📈 <strong style={{color:C.text}}>{loan.rate}</strong></span>
                    <span style={{fontSize:13,color:C.muted}}>🗓️ <strong style={{color:C.text}}>{loan.tenure}</strong></span>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {loan.banks?.map(b=><span key={b} style={{fontSize:12,background:'#eff6ff',color:C.blue,padding:'3px 10px',borderRadius:6,fontWeight:600}}>{b}</span>)}
                  </div>
                </div>
                <div style={{textAlign:'center',minWidth:76}}>
                  <svg width={76} height={76} viewBox="0 0 76 76">
                    <circle cx={38} cy={38} r={30} fill="none" stroke="#e2e8f0" strokeWidth={7}/>
                    <circle cx={38} cy={38} r={30} fill="none" stroke={pc(loan.probability)} strokeWidth={7} strokeDasharray={`${2*Math.PI*30*loan.probability/100} ${2*Math.PI*30}`} strokeLinecap="round" transform="rotate(-90 38 38)"/>
                    <text x={38} y={43} textAnchor="middle" fontSize={14} fontWeight={900} fill={pc(loan.probability)}>{loan.probability}%</text>
                  </svg>
                  <p style={{fontSize:10,color:C.muted,margin:'3px 0 0',fontWeight:700}}>PROBABILITY</p>
                </div>
              </div>
            ))}
            <div style={mkCard()}>
              <h3 style={{fontSize:15,fontWeight:800,margin:'0 0 14px'}}>Loan Probability Comparison</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={r.loanEligibility?.map(l=>({name:l.type.replace(' Loan','').replace('Business ',''),pct:l.probability}))}>
                  <XAxis dataKey="name" tick={{fontSize:11}}/><YAxis domain={[0,100]} tick={{fontSize:11}}/>
                  <Tooltip formatter={v=>`${v}%`}/>
                  <Bar dataKey="pct" name="Probability" radius={[6,6,0,0]} fill={C.teal}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Schemes */}
        {tab==='schemes' && (
          <div>
            <h3 style={{fontSize:16,fontWeight:800,margin:'0 0 14px'}}>✅ Eligible Government Schemes</h3>
            <div style={{display:'grid',gap:12,marginBottom:24}}>
              {r.eligibleSchemes?.map((s,i)=>(
                <div key={i} style={{...mkCard({padding:18}),borderLeft:`4px solid ${C.green}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                    <div>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}><h4 style={{fontSize:14,fontWeight:800,margin:0}}>{s.name}</h4><Badge t={s.type||'Central'} color={s.type==='State'?'indigo':'blue'}/></div>
                      <p style={{fontSize:12,color:C.teal,fontWeight:700,margin:'0 0 5px',textTransform:'uppercase'}}>{s.ministry}</p>
                      <p style={{fontSize:13,color:C.muted,margin:0,lineHeight:1.6}}>{s.benefit}</p>
                    </div>
                    <span style={{background:'#d1fae5',color:C.green,padding:'4px 12px',borderRadius:100,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>💸 {s.amount}</span>
                  </div>
                </div>
              ))}
            </div>
            <h3 style={{fontSize:16,fontWeight:800,margin:'0 0 14px'}}>Subsidy Opportunities</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginBottom:24}}>
              {r.subsidyOpportunities?.map((s,i)=>(
                <div key={i} style={mkCard({padding:18})}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><Badge t={s.type} color="teal"/><span style={{fontWeight:800,color:C.green,fontSize:14}}>{s.amount}</span></div>
                  <h4 style={{fontSize:14,fontWeight:700,margin:'0 0 5px'}}>{s.name}</h4>
                  <p style={{fontSize:13,color:C.muted,margin:0,lineHeight:1.6}}>{s.desc}</p>
                </div>
              ))}
            </div>
            <h3 style={{fontSize:16,fontWeight:800,margin:'0 0 14px'}}>❌ Not Eligible</h3>
            <div style={{...mkCard({padding:0}),overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f8fafc'}}><th style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>Scheme</th><th style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>Reason Not Eligible</th></tr></thead>
                <tbody>{r.ineligibleSchemes?.map((s,i)=><tr key={i} style={{borderTop:`1px solid ${C.border}`}}><td style={{padding:'11px 16px',fontSize:13,fontWeight:600}}>{s.name}</td><td style={{padding:'11px 16px',fontSize:13,color:C.muted}}>{s.reason}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* State Schemes */}
        {tab==='state' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <h3 style={{fontSize:16,fontWeight:800,margin:0}}>State-Specific Schemes — {r.meta?.state}</h3>
              <Badge t={`${r.stateSchemes?.length||0} schemes`} color="indigo"/>
            </div>
            {r.stateSchemes?.length>0
              ? <div style={{display:'grid',gap:12}}>
                  {r.stateSchemes.map((s,i)=>(
                    <div key={i} style={{...mkCard({padding:20}),borderLeft:`4px solid ${C.indigo}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
                        <div>
                          <h4 style={{fontSize:14,fontWeight:800,margin:'0 0 6px'}}>{s.name}</h4>
                          <p style={{fontSize:13,color:C.muted,margin:'0 0 10px',lineHeight:1.6}}>{s.benefit}</p>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{s.sectors?.map(sec=><span key={sec} style={{fontSize:11,background:'#e0e7ff',color:C.indigo,padding:'2px 8px',borderRadius:6,fontWeight:600}}>{sec}</span>)}</div>
                        </div>
                        <Badge t={s.type} color="indigo"/>
                      </div>
                    </div>
                  ))}
                </div>
              : <div style={mkCard({padding:28,textAlign:'center'})}><p style={{color:C.muted}}>Select a supported state in your assessment to see state-specific schemes.</p></div>
            }
          </div>
        )}

        {/* Risk & Recs */}
        {tab==='risk' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div>
              <h3 style={{fontSize:16,fontWeight:800,margin:'0 0 14px'}}>Credit Risk Flags</h3>
              {r.creditRiskFlags?.map((f,i)=>{ const col=f.severity==='High'?C.red:f.severity==='Medium'?C.amber:C.green; return(
                <div key={i} style={{...mkCard({padding:16,marginBottom:10,borderLeft:`4px solid ${col}`})}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:13,fontWeight:700}}>{f.flag}</span><Badge t={f.severity} color={f.severity==='High'?'red':f.severity==='Medium'?'amber':'green'}/></div>
                  <p style={{fontSize:13,color:C.muted,margin:0,lineHeight:1.6}}>{f.desc}</p>
                </div>
              ); })}
            </div>
            <div>
              <h3 style={{fontSize:16,fontWeight:800,margin:'0 0 14px'}}>Recommendations</h3>
              {r.recommendations?.map((rec,i)=>(
                <div key={i} style={mkCard({padding:16,marginBottom:10})}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:13,fontWeight:700}}>{rec.title}</span><Badge t={`${rec.priority} Priority`} color={rec.priority==='High'?'red':rec.priority==='Medium'?'amber':'green'}/></div>
                  <p style={{fontSize:13,color:C.muted,margin:0,lineHeight:1.6}}>{rec.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap */}
        {tab==='roadmap' && (
          <div>
            <h3 style={{fontSize:16,fontWeight:800,margin:'0 0 20px'}}>Your Personalized Funding Roadmap</h3>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:27,top:28,bottom:28,width:2,background:grad,borderRadius:2}}/>
              {r.fundingRoadmap?.map((phase,i)=>(
                <div key={i} style={{display:'flex',gap:18,marginBottom:18}}>
                  <div style={{width:54,height:54,borderRadius:'50%',background:grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,flexShrink:0,zIndex:1,boxShadow:'0 0 0 4px #f8fafc'}}>{i+1}</div>
                  <div style={{...mkCard({flex:1,padding:20})}}>
                    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:8}}>
                      <h4 style={{fontSize:15,fontWeight:800,margin:0}}>{phase.phase}</h4>
                      <span style={{background:'#eff6ff',color:C.blue,padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:700}}>📅 {phase.timeline}</span>
                    </div>
                    <p style={{fontSize:13,color:C.text,margin:'0 0 8px',lineHeight:1.6}}>{phase.action}</p>
                    <div style={{background:'#f0fdf4',borderRadius:7,padding:'7px 12px',display:'inline-block'}}>
                      <span style={{fontSize:12,color:C.green,fontWeight:700}}>🎯 {phase.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@media print{nav,button{display:none!important}}`}</style>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const MOCK_REPORTS=[{id:'RPT001',company:'Sunrise Manufacturing',date:'2026-02-14',score:74,loan:'₹85L',schemes:6},{id:'RPT002',company:'Alpha Traders',date:'2026-01-22',score:61,loan:'₹30L',schemes:4},{id:'RPT003',company:'BlueWave Tech',date:'2025-12-05',score:88,loan:'₹2.5Cr',schemes:8}];
function DashboardPage({ nav }) {
  const activity=[{m:'Oct',r:2},{m:'Nov',r:4},{m:'Dec',r:3},{m:'Jan',r:6},{m:'Feb',r:5},{m:'Mar',r:8}];
  return(
    <div style={{maxWidth:1100,margin:'0 auto',padding:'44px 24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,flexWrap:'wrap',gap:14}}>
        <div><h2 style={{fontSize:26,fontWeight:900,color:C.text,margin:'0 0 4px'}}>My Dashboard</h2><p style={{color:C.muted,margin:0,fontSize:14}}>Ravi Kumar · Sunrise Manufacturing · <Badge t="Starter Plan" color="blue"/></p></div>
        <button onClick={()=>nav('assessment')} style={mkPbtn({padding:'9px 18px',fontSize:13})}>+ New Assessment</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:14,marginBottom:24}}>
        {[{l:'Reports Generated',v:'3',ic:'📄',c:C.blue},{l:'Best Funding Score',v:'74',ic:'🎯',c:C.green},{l:'Schemes Found',v:'18',ic:'🏛️',c:C.teal},{l:'Reports Left',v:'7/10',ic:'📊',c:C.amber}].map(s=>(
          <div key={s.l} style={mkCard({padding:20})}><div style={{fontSize:26,marginBottom:8}}>{s.ic}</div><div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',marginTop:2}}>{s.l}</div></div>
        ))}
      </div>
      <div style={mkCard({marginBottom:20})}>
        <h3 style={{fontSize:15,fontWeight:800,margin:'0 0 14px'}}>Report Activity</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={activity}><XAxis dataKey="m" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="r" stroke={C.teal} strokeWidth={2} dot={{fill:C.teal}} name="Reports"/></LineChart>
        </ResponsiveContainer>
      </div>
      <div style={mkCard({padding:0,overflow:'hidden'})}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}><h3 style={{margin:0,fontSize:15,fontWeight:800}}>Report History</h3></div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f8fafc'}}>{['Report ID','Company','Date','Score','Max Loan','Schemes',''].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
          <tbody>{MOCK_REPORTS.map(r=>(
            <tr key={r.id} style={{borderTop:`1px solid ${C.border}`}}>
              <td style={{padding:'13px 14px',fontSize:12,fontWeight:700,color:C.blue}}>{r.id}</td>
              <td style={{padding:'13px 14px',fontSize:13,fontWeight:600}}>{r.company}</td>
              <td style={{padding:'13px 14px',fontSize:12,color:C.muted}}>{r.date}</td>
              <td style={{padding:'13px 14px'}}><span style={{fontWeight:700,color:r.score>=75?C.green:r.score>=55?C.amber:C.red}}>{r.score}/100</span></td>
              <td style={{padding:'13px 14px',fontSize:13,fontWeight:600,color:C.green}}>{r.loan}</td>
              <td style={{padding:'13px 14px',fontSize:13}}>{r.schemes} found</td>
              <td style={{padding:'13px 14px'}}><button onClick={()=>nav('report')} style={mkObtn({padding:'5px 12px',fontSize:12})}>View →</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────────
const MOCK_USERS=[{id:1,name:'Ravi Kumar',email:'ravi@sunrisemfg.in',company:'Sunrise Manufacturing',plan:'Pro',reports:3,date:'2026-02-14',score:74},{id:2,name:'Priya Sharma',email:'priya@greenfoods.co',company:'Green Foods Pvt Ltd',plan:'Starter',reports:1,date:'2026-03-01',score:81},{id:3,name:'Arjun Mehta',email:'arjun@techcraft.io',company:'TechCraft Solutions',plan:'Starter',reports:2,date:'2026-03-10',score:67},{id:4,name:'Sunita Patel',email:'sunita@fabricworld.in',company:'Fabric World',plan:'Free',reports:1,date:'2026-03-11',score:58}];
function AdminPage() {
  const mrr=[{m:'Oct',v:62000},{m:'Nov',v:89000},{m:'Dec',v:118000},{m:'Jan',v:162000},{m:'Feb',v:198000},{m:'Mar',v:241000}];
  return(
    <div style={{maxWidth:1200,margin:'0 auto',padding:'44px 24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,flexWrap:'wrap',gap:14}}>
        <div><h2 style={{fontSize:26,fontWeight:900,color:C.text,margin:'0 0 4px'}}>Admin Dashboard</h2><p style={{color:C.muted,margin:0}}>MSMEGrowth AI · Platform Overview</p></div>
        <div style={{display:'flex',gap:8}}><Badge t="● Supabase" color="green"/><Badge t="● Clerk" color="blue"/><Badge t="● Razorpay" color="teal"/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:24}}>
        {[{l:'Total Users',v:'214',ic:'👥',c:C.blue},{l:'Active Subs',v:'89',ic:'💳',c:C.teal},{l:'MRR',v:'₹2.41L',ic:'💸',c:C.green},{l:'Reports',v:'389',ic:'📄',c:C.indigo},{l:'Avg Score',v:'71',ic:'🎯',c:C.amber},{l:'States Active',v:'12',ic:'🗺️',c:C.red}].map(s=>(
          <div key={s.l} style={mkCard({padding:20})}><div style={{fontSize:26,marginBottom:8}}>{s.ic}</div><div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',marginTop:2}}>{s.l}</div></div>
        ))}
      </div>
      <div style={mkCard({marginBottom:20})}>
        <h3 style={{fontSize:15,fontWeight:800,margin:'0 0 14px'}}>MRR Growth</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={mrr}><XAxis dataKey="m" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/><Tooltip formatter={v=>`₹${v.toLocaleString('en-IN')}`}/><Line type="monotone" dataKey="v" stroke={C.teal} strokeWidth={2.5} dot={{fill:C.teal}} name="MRR"/></LineChart>
        </ResponsiveContainer>
      </div>
      <div style={mkCard({padding:0,overflow:'hidden'})}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}><h3 style={{margin:0,fontSize:15,fontWeight:800}}>Users & Leads</h3></div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f8fafc'}}>{['Name','Company','Email','Plan','Score','Reports','Joined'].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
          <tbody>{MOCK_USERS.map(u=>(
            <tr key={u.id} style={{borderTop:`1px solid ${C.border}`}}>
              <td style={{padding:'13px 14px',fontSize:13,fontWeight:700}}>{u.name}</td>
              <td style={{padding:'13px 14px',fontSize:13}}>{u.company}</td>
              <td style={{padding:'13px 14px',fontSize:12,color:C.muted}}>{u.email}</td>
              <td style={{padding:'13px 14px'}}><Badge t={u.plan} color={u.plan==='Pro'?'indigo':u.plan==='Starter'?'blue':'green'}/></td>
              <td style={{padding:'13px 14px'}}><span style={{fontWeight:800,color:u.score>=75?C.green:u.score>=55?C.amber:C.red}}>{u.score}</span></td>
              <td style={{padding:'13px 14px',fontSize:13}}>{u.reports}</td>
              <td style={{padding:'13px 14px',fontSize:12,color:C.muted}}>{u.date}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Homepage ──────────────────────────────────────────────────────────────────
function HomePage({ nav }) {
  const feats=[{ic:'🎯',t:'Funding Readiness Score',d:'AI-powered 0–100 score across 12 financial parameters.'},{ic:'🏛️',t:'State + Central Schemes',d:'Match against 200+ schemes across all 28 Indian states.'},{ic:'💰',t:'Loan Eligibility Calculator',d:'Instant estimates for WC, term, and unsecured loans.'},{ic:'📄',t:'Professional PDF Report',d:'Bank-ready Funding Intelligence Report in minutes.'},{ic:'⚡',t:'AI Document Analysis',d:'Upload ITR or GST — AI extracts & verifies your data.'},{ic:'🛡️',t:'Credit Risk Assessment',d:'Identify and resolve flags before approaching lenders.'}];
  return(
    <div>
      <div style={{background:`linear-gradient(160deg,${C.navy} 0%,#1e3a5f 50%,#0c4a6e 100%)`,padding:'88px 32px',textAlign:'center'}}>
        <div style={{display:'inline-block',background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.25)',borderRadius:100,padding:'6px 18px',marginBottom:22}}>
          <span style={{color:C.cyan,fontSize:13,fontWeight:700}}>🇮🇳 India's AI-Powered MSME Funding Intelligence Platform</span>
        </div>
        <h1 style={{fontSize:'clamp(28px,5vw,54px)',fontWeight:900,color:'#fff',margin:'0 0 16px',lineHeight:1.12}}>Unlock Every Rupee Your<br/><span style={{background:`linear-gradient(90deg,${C.cyan},${C.teal})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>MSME Deserves</span></h1>
        <p style={{fontSize:17,color:'rgba(255,255,255,0.6)',maxWidth:520,margin:'0 auto 36px',lineHeight:1.7}}>Discover loans, government schemes, and subsidies you qualify for — AI analysis in under 3 minutes.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>nav('assessment')} style={mkPbtn({fontSize:16,padding:'15px 38px',borderRadius:12})}>Check Funding Eligibility →</button>
          <button onClick={()=>nav('pricing')} style={mkObtn({color:'#fff',borderColor:'rgba(255,255,255,0.3)',fontSize:14,padding:'13px 26px',borderRadius:12})}>View Pricing</button>
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:36,marginTop:60,flexWrap:'wrap'}}>
          {[['10,000+','MSMEs Analyzed'],['₹2,400 Cr','Funding Unlocked'],['200+','Schemes Covered'],['14+','States Supported']].map(([v,l])=>(
            <div key={l} style={{textAlign:'center'}}><div style={{fontSize:28,fontWeight:900,background:`linear-gradient(90deg,${C.cyan},#fff)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{v}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:2}}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'72px 32px'}}>
        <div style={{textAlign:'center',marginBottom:48}}><h2 style={{fontSize:32,fontWeight:900,color:C.text,margin:'0 0 10px'}}>Complete Funding Intelligence</h2><p style={{color:C.muted,fontSize:16}}>One platform for every MSME funding need in India.</p></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18}}>
          {feats.map(f=><div key={f.t} style={mkCard({padding:26})}><div style={{fontSize:34,marginBottom:12}}>{f.ic}</div><h3 style={{fontSize:16,fontWeight:800,color:C.text,margin:'0 0 6px'}}>{f.t}</h3><p style={{fontSize:14,color:C.muted,lineHeight:1.7,margin:0}}>{f.d}</p></div>)}
        </div>
      </div>
      <div style={{background:C.navy,padding:'24px',textAlign:'center'}}><p style={{color:'rgba(255,255,255,0.3)',fontSize:12,margin:0}}>© 2026 MSMEGrowth AI · India's Funding Intelligence Platform 🇮🇳 · Payments by Razorpay · Auth by Clerk · Data on Supabase</p></div>
    </div>
  );
}


export { C, Nav, HomePage, PricingPage, AuthPage, AssessmentPage, ReportPage, DashboardPage, AdminPage };
