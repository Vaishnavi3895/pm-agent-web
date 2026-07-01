import { useState, useRef, useEffect } from "react";

const T={bg:"#FDFCFB",bgSoft:"#F7F3EF",bgMuted:"#EDE8E3",border:"#E8E2DB",borderMd:"#D5CDC4",ink:"#2D2633",inkMd:"#5C5467",inkSoft:"#9E96A8",accent:"#E8637A",accentSoft:"#FDF0F2",accentMd:"#F0A0AE",discover:{bg:"#FFF5F7",border:"#FFD6DF",text:"#A03355",dot:"#E8637A"},understand:{bg:"#F3F5FF",border:"#C5CEFF",text:"#2D4A9E",dot:"#5B72E8"},build:{bg:"#F2FCF6",border:"#B8EDD0",text:"#1A6642",dot:"#3BAF74"},grow:{bg:"#F9F3FF",border:"#DCC5F5",text:"#5C2D91",dot:"#9B59E8"}};
const FONT='"Pretendard","Noto Sans KR",-apple-system,BlinkMacSystemFont,sans-serif';

const TEMPLATES=[{id:"blank",label:"Blank",icon:"✦",desc:"Start from scratch"},{id:"existing_product",label:"Existing Product",icon:"🔁",desc:"New feature for a live product"},{id:"b2b_saas",label:"B2B SaaS",icon:"🏢",desc:"Enterprise software, subscriptions"},{id:"consumer",label:"Consumer App",icon:"📱",desc:"Mobile or web for end users"},{id:"marketplace",label:"Marketplace",icon:"🛒",desc:"Two-sided platform"},{id:"api",label:"API / Developer",icon:"⚡",desc:"Developer tools, platform product"},{id:"internal",label:"Internal Tool",icon:"🔧",desc:"Built for your own team"}];
const TEMPLATE_CTX={existing_product:"This is a NEW FEATURE for an ALREADY LAUNCHED product with real users. Do not do greenfield market discovery — anchor everything in the existing product's actual users, usage data, and constraints the PM already has. Skip questions a PM with a live product wouldn't need to answer (e.g. 'does this market exist').",b2b_saas:"B2B SaaS targeting business customers with subscription pricing. Focus on enterprise buying cycles, multi-stakeholder decisions, onboarding, retention.",consumer:"Consumer app targeting end users. Focus on virality, DAU/MAU, App Store distribution, low-friction onboarding, engagement loops.",marketplace:"Two-sided marketplace. Focus on supply-demand balance, liquidity, trust, take rate, chicken-and-egg.",api:"Developer tool or API product. Focus on DX, documentation, time-to-value, usage-based pricing, ecosystem.",internal:"Internal tool for a specific team. Focus on adoption, workflow integration, reducing manual work."};

const FMT=`FORMATTING: After every reply end with OPTIONS: ["opt1","opt2"]. When ready: WRAPUP: true. After confirm: emit COMPLETE marker.`;

const STEPS=[
  {id:"brainstorm",label:"Brainstorm",icon:"💭",phase:"Discover",phaseKey:"discover",placeholder:"Describe your product idea — what problem does it solve?",
   systemPrompt:(ctx)=>{
     const isExisting=ctx._template==="existing_product";
     return `You are a sharp PM brainstorming partner.
${isExisting?`This is a NEW FEATURE for an ALREADY LAUNCHED product. Don't brainstorm a product idea from scratch — instead get oriented on: what the existing product does today, who currently uses it, what's prompting this new feature (user request, data signal, competitive gap, strategic bet), and rough shape of the idea. Ask 1-2 questions at a time, starting with "what does your product do today and who's it for" if not already clear.`
     :`Explore through divergent thinking: angles, user types, analogies, pivots, "what if" scenarios.
${ctx._template&&ctx._template!=="blank"?`\nProduct type: ${TEMPLATE_CTX[ctx._template]||""}`:""}
Ask 1-2 questions at a time.`}
${ctx._teamNotes?.length>0?`\nTEAM NOTES:\n${ctx._teamNotes.map(n=>`- ${n.author}: "${n.text}"`).join("\n")}\n`:""}
${FMT}
BRAINSTORM_COMPLETE: {"coreIdea":"...","anglesExplored":"...","promisingDirection":"...","teamContributions":"...","existingProductContext":"${isExisting?"what the product does today and who uses it, else empty string":""}"}`;}},
  {id:"market_research",label:"Market Research",icon:"🔭",phase:"Understand",phaseKey:"understand",placeholder:"Tell me what you know about this market...",
   systemPrompt:(ctx)=>{
     const isExisting=ctx._template==="existing_product";
     return `You are an expert PM research analyst.
${isExisting?`This is a feature for an existing product (context: ${ctx.brainstorm?.existingProductContext||ctx.brainstorm?.coreIdea||"-"}). Don't research a market from scratch — instead capture: who within the existing user base this feature targets, what current behavior or pain point justifies it, and any known competitors who already have this feature. Ask 1-2 questions at a time.`
     :`${ctx._template&&ctx._template!=="blank"?`Product type: ${TEMPLATE_CTX[ctx._template]||""}\n`:""}Core idea: ${ctx.brainstorm?.coreIdea||"-"}, Direction: ${ctx.brainstorm?.promisingDirection||"-"}
Cover: problem, target customer, market, competitors. Ask 1-2 questions at a time.`}
${FMT}
RESEARCH_COMPLETE: {"problem":"...","targetCustomer":"...","market":"...","competitors":"...","interviewGuideRequested":true}`;}},
  {id:"opportunity_sizing",label:"Opportunity Sizing",icon:"📊",phase:"Understand",phaseKey:"understand",placeholder:"Let's size this market...",
   systemPrompt:(ctx)=>{
     const isExisting=ctx._template==="existing_product";
     return `You are an expert PM ${isExisting?"impact analyst":"market sizing analyst"}.
${isExisting?`This is a feature for an existing product. Don't do TAM/SAM/SOM market sizing — instead size the EXPECTED IMPACT on the existing product: what % or count of current users this affects, expected effect on the north star/key metric, and rough effort vs impact trade-off. Ask 1-2 questions about current user numbers or metrics if needed.`
     :`Problem: ${ctx.market_research?.problem||"-"}, Customer: ${ctx.market_research?.targetCustomer||"-"}, Market: ${ctx.market_research?.market||"-"}
Help size using TAM/SAM/SOM. Ask 1-2 questions.`}
${FMT}
SIZING_COMPLETE: {"tam":"${isExisting?"affected user count or % of base, else TAM":""}","sam":"${isExisting?"expected metric impact, else SAM":""}","som":"${isExisting?"realistic near-term impact, else SOM":""}","revenuePotential":"..."}`;}},
  {id:"problem_framing",label:"Problem Framing",icon:"🎯",phase:"Understand",phaseKey:"understand",placeholder:"Let's sharpen the problem statement...",
   systemPrompt:(ctx)=>{
     const isExisting=ctx._template==="existing_product";
     return `You are an expert PM using Jobs To Be Done. Also build 2-3 user personas.
Problem: ${ctx.market_research?.problem||"-"}, Customer: ${ctx.market_research?.targetCustomer||"-"}
${isExisting?"Since this is for an existing product, ground personas in REAL existing user segments, not hypothetical ones. \"Why now\" should reference what's changed recently (usage pattern, request volume, competitive move) rather than market timing." :""}
Cover: JTBD, workarounds, frustrations, why now. Then generate 2-3 persona sketches.
${FMT}
FRAMING_COMPLETE: {"jtbd":"...","painPoints":"...","alternatives":"...","whyNow":"...","personas":"[{name,role,goal,frustration,quote}]"}`;}},
  {id:"solution_concept",label:"Solution & Concept",icon:"✨",phase:"Understand",phaseKey:"understand",placeholder:"What does the solution look like?",
   systemPrompt:(ctx)=>`You are a senior PM defining product concept.
Problem: ${ctx.problem_framing?.jtbd||ctx.market_research?.problem||"-"}, Customer: ${ctx.market_research?.targetCustomer||"-"}
Help define: core solution, 3 must-have v1 features, key differentiator. Ask 1-2 questions.
${FMT}
CONCEPT_COMPLETE: {"vision":"...","valueProp":"...","mvpFeatures":"...","differentiator":"..."}`},
  {id:"wireframe",label:"Wireframe",icon:"🖼️",phase:"Build",phaseKey:"build",placeholder:"Describe your screens or drop a Figma screenshot...",
   systemPrompt:(ctx)=>`You are a senior PM and UX reviewer.
Vision: ${ctx.solution_concept?.vision||"-"}, Features: ${ctx.solution_concept?.mvpFeatures||"-"}
When image shared: WHAT I SEE / WHAT WORKS / GAPS & RISKS / SUGGESTED ADDITIONS / SUGGESTED CHANGES.
If no image: help map key screens, flows, navigation.
${FMT}
WIREFRAME_COMPLETE: {"keyScreens":"...","primaryFlow":"...","navStructure":"...","uxRisks":"...","suggestedAdditions":"...","revisionsTracked":"..."}`},
  {id:"prd",label:"PRD",icon:"📝",phase:"Build",phaseKey:"build",placeholder:"Let's write the PRD...",
   systemPrompt:(ctx)=>`You are an expert PM writing a PRD.
Market: ${ctx.market_research?.market||"-"}, Customer: ${ctx.market_research?.targetCustomer||"-"}, Problem: ${ctx.problem_framing?.jtbd||"-"}, Vision: ${ctx.solution_concept?.vision||"-"}, Features: ${ctx.solution_concept?.mvpFeatures||"-"}, Screens: ${ctx.wireframe?.keyScreens||"-"}
Ask 1-2 questions about timeline/team then write: Executive Summary, Problem, Goals & Metrics, Personas, Feature Requirements (P0/P1/P2), Out of Scope, Open Questions.
${FMT}
PRD_COMPLETE: {"summary":"...","goals":"...","features":"...","p0":"...","p1":"...","p2":"..."}`},
  {id:"prototype",label:"Prototype",icon:"🧩",phase:"Build",phaseKey:"build",placeholder:"What needs to be prototyped and validated?",
   systemPrompt:(ctx)=>`You are a senior PM planning a prototype.
Vision: ${ctx.solution_concept?.vision||"-"}, Features: ${ctx.solution_concept?.mvpFeatures||"-"}, PRD: ${ctx.prd?.summary||"-"}
Help define: scope, fidelity, critical flows. Generate THREE build-tool prompts.
${FMT}
PROTOTYPE_COMPLETE: {"scope":"...","keyScreens":"...","fidelity":"...","claudeCodePrompt":"...","lovablePrompt":"...","aiStudioPrompt":"..."}`},
  {id:"prototype_review",label:"Prototype Review",icon:"🔄",phase:"Build",phaseKey:"build",placeholder:"What changed during prototyping?",
   systemPrompt:(ctx)=>`You are a senior PM reconciling prototype changes.
Vision: ${ctx.solution_concept?.vision||"-"}, Features: ${ctx.solution_concept?.mvpFeatures||"-"}, PRD: ${ctx.prd?.features||"-"}
Ask what changed: features, UX discoveries, invalidated assumptions, team reactions.
${FMT}
PROTOTYPE_REVIEW_COMPLETE: {"changesFound":true,"summary":"...","revisedFeatures":"...","revisedVision":"...","revisedPrdFeatures":"...","droppedFeatures":"...","newInsights":"..."}`},
  {id:"gtm",label:"GTM Strategy",icon:"🚀",phase:"Grow",phaseKey:"grow",placeholder:"How do we take this to market?",
   systemPrompt:(ctx)=>{const rev=ctx.prototype_review;const vision=rev?.revisedVision||ctx.solution_concept?.vision||"-";const features=rev?.revisedFeatures||ctx.solution_concept?.mvpFeatures||"-";return `You are a senior PM & GTM strategist.
Product: ${vision}, Customer: ${ctx.market_research?.targetCustomer||"-"}, Market: ${ctx.market_research?.market||"-"}, SOM: ${ctx.opportunity_sizing?.som||"-"}${rev?.changesFound?`\nNote: ${rev.summary}`:""}
Ask 1-2 questions about channels/budget then produce: ICP, Positioning, Launch Channels, Pricing, 90-Day Plan, Key Metrics.
${FMT}
GTM_COMPLETE: {"icp":"...","positioning":"...","channels":"...","pricing":"...","metrics":"...","launchPlan":"..."}`;}},
];

const CK={brainstorm:"BRAINSTORM_COMPLETE",market_research:"RESEARCH_COMPLETE",opportunity_sizing:"SIZING_COMPLETE",problem_framing:"FRAMING_COMPLETE",solution_concept:"CONCEPT_COMPLETE",wireframe:"WIREFRAME_COMPLETE",prd:"PRD_COMPLETE",prototype:"PROTOTYPE_COMPLETE",prototype_review:"PROTOTYPE_REVIEW_COMPLETE",gtm:"GTM_COMPLETE"};
const EXISTING_PRODUCT_OVERRIDES={
  brainstorm:{label:"Feature Brainstorm",placeholder:"What does your product do today, and what feature are you considering?"},
  market_research:{label:"User & Competitive Context",placeholder:"Who within your existing users does this serve, and what's the signal?"},
  opportunity_sizing:{label:"Impact Sizing",placeholder:"How many existing users does this affect, and what's the expected impact?"},
  problem_framing:{label:"Problem Framing",placeholder:"Let's sharpen the problem using your real user segments..."},
};
function displayStep(step,template){const o=template==="existing_product"?EXISTING_PRODUCT_OVERRIDES[step.id]:null;return o?{...step,...o}:step;}
const PG=[{key:"discover",label:"Discover",steps:["brainstorm"]},{key:"understand",label:"Understand",steps:["market_research","opportunity_sizing","problem_framing","solution_concept"]},{key:"build",label:"Build",steps:["wireframe","prd","prototype","prototype_review"]},{key:"grow",label:"Grow",steps:["gtm"]}];

function xJ(t,k){try{const i=t.indexOf(k+":");if(i<0)return null;const s=t.indexOf("{",i),e=t.lastIndexOf("}")+1;if(s<0||e<=0)return null;return JSON.parse(t.substring(s,e));}catch{return null;}}
function xO(t){try{const i=t.lastIndexOf("OPTIONS:");if(i<0)return[];const s=t.indexOf("[",i),e=t.indexOf("]",s)+1;if(s<0||e<=0)return[];return JSON.parse(t.substring(s,e));}catch{return[];}}
function xW(t){return t.includes("WRAPUP: true");}
function cleanR(t,ck){let o=t;[ck+":",`WRAPUP: true`,"OPTIONS:"].forEach(m=>{const idx=m==="OPTIONS:"?o.lastIndexOf(m):o.indexOf(m);if(idx>=0)o=o.substring(0,idx);});return o.trim();}
async function callClaude(msgs,maxTok=1600,apiKey=""){const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":apiKey,"anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:maxTok,messages:msgs})});const d=await r.json();if(d.error)throw new Error(d.error.message);return d.content?.[0]?.text||"Something went wrong.";}
async function callClaudeWithSearch(msgs,maxTok=1600,apiKey=""){const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":apiKey,"anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:maxTok,messages:msgs,tools:[{type:"web_search_20250305",name:"web_search"}]})});const d=await r.json();if(d.error)throw new Error(d.error.message);const blocks=d.content||[];return blocks.map(b=>b.type==="text"?b.text:"").filter(Boolean).join("\n");}
function f2b64(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});}
function gMT(f){if(f.type)return f.type;const e=f.name.split(".").pop().toLowerCase();return e==="pdf"?"application/pdf":e==="jpg"||e==="jpeg"?"image/jpeg":"image/png";}
function mkProj(n="New project",tmpl="blank"){const now=new Date().toISOString();return{id:Date.now()+Math.random(),name:n,template:tmpl,currentStep:0,completedSteps:{},stepData:{},conversations:{},figmaLinks:{},teamNotes:[],versions:[],createdAt:now,lastTouched:now,sprints:null,assumptions:[],coachingQuestions:[],northStarMetric:null,mvpBaseline:null,checklistState:{},decisionLog:[],stakeholders:null,competitorData:null,metricSnapshots:[]};}
function snapshotVersion(proj,stepId,data){const v={id:Date.now()+Math.random(),stepId,stepLabel:STEPS.find(s=>s.id===stepId)?.label||stepId,data,ts:new Date().toISOString()};return[...(proj.versions||[]),v];}
function daysSince(iso){if(!iso)return 999;return Math.floor((Date.now()-new Date(iso).getTime())/(1000*60*60*24));}
async function extractAssumptions(stepLabel,stepData){
  const prompt=`A PM just completed the "${stepLabel}" step with this output:\n${JSON.stringify(stepData).slice(0,1200)}\n\nExtract 0-3 specific, checkable factual assumptions being made — things stated as fact that could later turn out wrong (e.g. "target customer is solo founders", "TAM assumes $50/mo pricing"). Skip vague statements. If there's nothing concrete to extract, return an empty array.\nReturn ONLY JSON array, no markdown: [{"text":"the assumption in one short sentence"}]`;
  try{
    const raw=await callClaude([{role:"user",content:prompt}],400,apiKey);
    const parsed=JSON.parse(raw.replace(/```json?|```/g,"").trim());
    return parsed.map(a=>({id:Date.now()+Math.random(),text:a.text,source:stepLabel,status:"holding",note:""}));
  }catch{return [];}
}
function missingCtx(sid,sd){const deps={opportunity_sizing:["market_research"],problem_framing:["market_research"],solution_concept:["market_research","problem_framing"],wireframe:["solution_concept"],prd:["solution_concept"],prototype:["solution_concept"],gtm:["solution_concept","prd"]};return(deps[sid]||[]).filter(d=>!sd[d]);}
function recNext(sid){const o=STEPS.map(s=>s.id);const i=o.indexOf(sid);return i>=0&&i<o.length-1?o[i+1]:null;}
const gph=(k)=>T[k]||T.discover;

// ─── Option Chips ──────────────────────────────────────────────────────────────
function OptionChips({options,phaseKey,onSelect,disabled}){
  const p=gph(phaseKey);
  if(!options?.length)return null;
  return <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8,alignSelf:"flex-start",maxWidth:"85%"}}>
    {options.map((o,i)=><button key={i} onClick={()=>!disabled&&onSelect(o)} disabled={disabled}
      style={{padding:"5px 13px",borderRadius:20,fontSize:12.5,cursor:disabled?"default":"pointer",border:`1px solid ${p.border}`,background:p.bg,color:p.text,fontWeight:500,fontFamily:FONT,opacity:disabled?0.5:1}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background=p.border;}} onMouseLeave={e=>e.currentTarget.style.background=p.bg}>{o}</button>)}
  </div>;
}

// ─── Wrapup Banner ─────────────────────────────────────────────────────────────
function WrapupBanner({stepLabel,nextLabel,phaseKey,onContinue,onStayMore}){
  const p=gph(phaseKey);
  return <div style={{margin:"4px 0",padding:"14px 16px",borderRadius:12,border:`1px solid ${p.border}`,background:p.bg,display:"flex",flexDirection:"column",gap:10}}>
    <div style={{fontSize:13,fontWeight:600,color:p.text}}>{stepLabel} looks complete</div>
    <div style={{fontSize:13,color:p.text,opacity:0.8}}>Anything else before <strong>{nextLabel}</strong>?</div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={onStayMore} style={{padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:500,border:`1px solid ${p.border}`,background:"transparent",color:p.text,cursor:"pointer",fontFamily:FONT}}>Keep exploring</button>
      <button onClick={onContinue} style={{padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:600,border:"none",background:p.dot,color:"#fff",cursor:"pointer",fontFamily:FONT}}>Move to {nextLabel}</button>
    </div>
  </div>;
}

// ─── Prototype Tools ───────────────────────────────────────────────────────────
function PrototypeTools({data}){
  const [cp,setCp]=useState(null);
  const copy=(txt,k)=>{navigator.clipboard.writeText(txt);setCp(k);setTimeout(()=>setCp(null),2000);};
  const tools=[{k:"claudeCode",label:"Claude Code",url:"https://claude.ai/code",prompt:data?.claudeCodePrompt},{k:"lovable",label:"Lovable",url:"https://lovable.dev",prompt:data?.lovablePrompt},{k:"aiStudio",label:"AI Studio",url:"https://aistudio.google.com",prompt:data?.aiStudioPrompt}];
  return <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>
    <div style={{fontSize:11,fontWeight:700,color:T.inkSoft,letterSpacing:"0.06em",textTransform:"uppercase"}}>Build with</div>
    {tools.map(t=><div key={t.k} style={{borderRadius:8,border:`1px solid ${T.border}`,overflow:"hidden",background:T.bgSoft}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderBottom:`1px solid ${T.border}`}}>
        <span style={{fontSize:13,fontWeight:600,color:T.ink}}>{t.label}</span>
        <a href={t.url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:T.accent,textDecoration:"none",fontWeight:500}}>Open ↗</a>
      </div>
      {t.prompt&&<div style={{position:"relative",padding:"9px 12px"}}>
        <div style={{fontSize:11.5,lineHeight:1.6,color:T.inkMd,maxHeight:66,overflow:"hidden",fontFamily:"monospace"}}>{t.prompt}</div>
        <button onClick={()=>copy(t.prompt,t.k)} style={{marginTop:6,padding:"3px 11px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{cp===t.k?"Copied ✓":"Copy"}</button>
      </div>}
    </div>)}
  </div>;
}

// ─── Metrics Dashboard ─────────────────────────────────────────────────────────
function MetricsDashboard({proj}){
  const done=Object.keys(proj.completedSteps).length;
  const total=STEPS.length;
  const inProg=STEPS.filter(s=>!proj.completedSteps[s.id]&&(proj.conversations[s.id]||[]).length>0).length;
  const pct=Math.round((done/total)*100);
  const health=Math.min(
    (proj.stepData.market_research?15:0)+(proj.stepData.opportunity_sizing?10:0)+(proj.stepData.problem_framing?15:0)+
    (proj.stepData.solution_concept?15:0)+(proj.stepData.prd?20:0)+(proj.stepData.gtm?15:0)+
    (proj.teamNotes?.length>0?5:0)+(proj.figmaLinks?.wireframe?5:0),100);
  const hColor=health>=80?"#3BAF74":health>=50?"#E8A93A":"#E8637A";
  const phases=PG.map(g=>({...g,d:g.steps.filter(s=>proj.completedSteps[s]).length,t:g.steps.length}));
  return <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,background:T.bgSoft,flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{position:"relative",width:40,height:40}}>
          <svg width="40" height="40" style={{transform:"rotate(-90deg)"}}>
            <circle cx="20" cy="20" r="16" fill="none" stroke={T.bgMuted} strokeWidth="3.5"/>
            <circle cx="20" cy="20" r="16" fill="none" stroke={T.accent} strokeWidth="3.5"
              strokeDasharray={`${2*Math.PI*16}`} strokeDashoffset={`${2*Math.PI*16*(1-pct/100)}`} strokeLinecap="round"/>
          </svg>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:10,fontWeight:700,color:T.ink}}>{pct}%</div>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.ink}}>{done}/{total} steps</div>
          <div style={{fontSize:11,color:T.inkSoft}}>{inProg>0?`${inProg} in progress`:"Get started"}</div>
        </div>
      </div>
      <div style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:2}}>Health</div>
        <div style={{fontSize:18,fontWeight:700,color:hColor}}>{health}<span style={{fontSize:11}}>/100</span></div>
      </div>
      {phases.map(g=>{const p=T[g.key];const pc=Math.round((g.d/g.t)*100);return <div key={g.key} style={{flex:1,minWidth:70}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,fontWeight:600,color:p.text}}>{g.label}</span><span style={{fontSize:10,color:T.inkSoft}}>{g.d}/{g.t}</span></div>
        <div style={{height:3,borderRadius:2,background:T.bgMuted,overflow:"hidden"}}><div style={{height:"100%",width:`${pc}%`,background:p.dot,borderRadius:2,transition:"width 0.4s"}}/></div>
      </div>;})}
    </div>
  </div>;
}

// ─── Live Competitor Research (real web search) ────────────────────────────────
function LiveCompetitorResearch({data,saved,onUpdate}){
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const result=saved;

  const generate=async()=>{
    setLoading(true);setError(null);
    const ctx=`Market: ${data.market||"-"}, Problem: ${data.problem||"-"}, Target customer: ${data.targetCustomer||"-"}, Known competitors mentioned: ${data.competitors||"-"}`;
    const prompt=`You are a market research analyst. Using web search, find the top 3 real, current competitors for this product space: ${ctx}

For each competitor, search for and report: company name, what they do (1 sentence), approximate funding raised or revenue if public, pricing model if known, and one notable recent signal (news, launch, funding round) from the last 12 months.

Return ONLY a JSON array, no markdown, no commentary: [{"name":"...","description":"...","funding":"...","pricing":"...","signal":"..."}]`;
    try{
      const raw=await callClaudeWithSearch([{role:"user",content:prompt}],1400,apiKey);
      const clean=raw.replace(/```json?|```/g,"").trim();
      const jsonMatch=clean.match(/\[[\s\S]*\]/);
      onUpdate(jsonMatch?JSON.parse(jsonMatch[0]):JSON.parse(clean));
    }catch(e){setError("Couldn't parse search results. Try again.");}
    setLoading(false);
  };

  return <div style={{marginTop:10,padding:"14px 16px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bgSoft}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:T.ink}}>🔭 Live competitor research</div>
        <div style={{fontSize:11,color:T.inkSoft,marginTop:1}}>Real web search · funding, pricing, recent signals</div>
      </div>
      <button onClick={generate} disabled={loading} style={{padding:"6px 16px",borderRadius:20,fontSize:12,fontWeight:600,border:"none",background:T.accent,color:"#fff",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Searching the web...":"Search now"}</button>
    </div>
    {error&&<div style={{fontSize:12,color:"#A03355",padding:"8px 12px",borderRadius:8,background:"#FFF5F7"}}>{error}</div>}
    {result?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {result.map((c,i)=><div key={i} style={{padding:"11px 13px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:13.5,fontWeight:700,color:T.ink}}>{c.name}</span>
          {c.funding&&<span style={{fontSize:11,fontWeight:600,color:"#1A6642",background:"#F2FCF6",padding:"1px 8px",borderRadius:10,border:"1px solid #B8EDD0"}}>{c.funding}</span>}
        </div>
        <div style={{fontSize:12.5,color:T.inkMd,lineHeight:1.55,marginBottom:5}}>{c.description}</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {c.pricing&&<span style={{fontSize:11,color:T.inkSoft}}>💵 {c.pricing}</span>}
          {c.signal&&<span style={{fontSize:11,color:T.inkSoft}}>📰 {c.signal}</span>}
        </div>
      </div>)}
    </div>}
    {!result&&!loading&&!error&&<div style={{fontSize:12,color:T.inkSoft,fontStyle:"italic"}}>Searches the live web for real competitor data — not AI-estimated.</div>}
  </div>;
}

// ─── PM Coaching Feedback ──────────────────────────────────────────────────────
function PMCoachingFeedback({stepLabel,stepData,fullContext}){
  const [loading,setLoading]=useState(false);
  const [feedback,setFeedback]=useState(null);
  const [dismissed,setDismissed]=useState(false);

  const generate=async()=>{
    setLoading(true);
    const ctxStr=Object.entries(fullContext||{}).filter(([k])=>!k.startsWith("_")).map(([k,v])=>`${k}: ${JSON.stringify(v).slice(0,300)}`).join("\n");
    const prompt=`You are a sharp, experienced VP of Product reviewing a junior PM's thinking after they completed the "${stepLabel}" step.

Full context so far:
${ctxStr}

Critique the QUALITY OF THINKING in this step specifically — not the format. Look for: unsupported assumptions, internal contradictions with earlier steps (e.g. target customer mismatch, TAM math that doesn't reconcile with claimed niche), missing evidence, vague or generic language that avoids a real decision, and anywhere they took the easy answer instead of the rigorous one.

Be direct and specific — cite the actual words they used. Don't be encouraging for the sake of it. If the thinking is genuinely solid, say so briefly, but most steps have at least one real gap worth surfacing.

Return ONLY JSON, no markdown: {"strength":"one specific thing done well, citing their words","gaps":["specific gap 1 with quote or reference","specific gap 2"],"sharpQuestion":"one pointed question that would most improve this if answered"}`;
    try{
      const raw=await callClaude([{role:"user",content:prompt}],700,apiKey);
      const clean=raw.replace(/```json?|```/g,"").trim();
      setFeedback(JSON.parse(clean));
    }catch{setFeedback(null);}
    setLoading(false);
  };

  if(dismissed)return null;

  return <div style={{marginTop:10,padding:"14px 16px",borderRadius:12,border:`1.5px solid #DCC5F5`,background:"#F9F3FF"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:feedback?10:0,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:"#9B59E8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>🧑‍🏫</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#5C2D91"}}>PM Coach</div>
          <div style={{fontSize:11,color:"#5C2D91",opacity:0.7}}>Honest feedback on your thinking, not your formatting</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {!feedback&&<button onClick={generate} disabled={loading} style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:600,border:"none",background:"#9B59E8",color:"#fff",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Reviewing...":"Get feedback"}</button>}
        <button onClick={()=>setDismissed(true)} style={{padding:"5px 9px",borderRadius:20,fontSize:12,border:"1.5px solid #DCC5F5",background:"transparent",color:"#5C2D91",cursor:"pointer",fontFamily:FONT}}>✕</button>
      </div>
    </div>
    {feedback&&<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {feedback.strength&&<div style={{padding:"9px 12px",borderRadius:8,background:"#F2FCF6",border:"1px solid #B8EDD0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#1A6642",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>✓ Strength</div>
        <div style={{fontSize:12.5,color:"#1A6642",lineHeight:1.55}}>{feedback.strength}</div>
      </div>}
      {feedback.gaps?.length>0&&<div style={{padding:"9px 12px",borderRadius:8,background:"#FFF5F7",border:"1px solid #FFD6DF"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#A03355",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>⚠ Gaps in the thinking</div>
        {feedback.gaps.map((g,i)=><div key={i} style={{fontSize:12.5,color:"#A03355",lineHeight:1.55,marginBottom:i<feedback.gaps.length-1?6:0}}>• {g}</div>)}
      </div>}
      {feedback.sharpQuestion&&<div style={{padding:"9px 12px",borderRadius:8,background:"#F3F5FF",border:"1px solid #C5CEFF"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#2D4A9E",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>? Sharpest question</div>
        <div style={{fontSize:12.5,color:"#2D4A9E",lineHeight:1.55,fontStyle:"italic"}}>{feedback.sharpQuestion}</div>
      </div>}
    </div>}
  </div>;
}

// ─── Assumption Tracker ────────────────────────────────────────────────────────
function AssumptionTracker({proj,onUpdate}){
  const [checking,setChecking]=useState(false);
  const assumptions=proj.assumptions||[];
  const flagged=assumptions.filter(a=>a.status==="contradicted");
  const open=assumptions.filter(a=>a.status!=="contradicted");

  const recheckAll=async()=>{
    if(!assumptions.length)return;
    setChecking(true);
    const ctxStr=Object.entries(proj.stepData||{}).filter(([k])=>!k.startsWith("_")).map(([k,v])=>`${k}: ${JSON.stringify(v).slice(0,250)}`).join("\n");
    const list=assumptions.map((a,i)=>`${i}. [${a.source}] ${a.text}`).join("\n");
    const prompt=`Project context:\n${ctxStr}\n\nAssumptions logged earlier in this project:\n${list}\n\nFor each assumption, check if anything in the current project context now contradicts it. Return ONLY JSON array, same order, no markdown: [{"status":"holding|contradicted","note":"if contradicted, cite the specific contradicting detail; else empty string"}]`;
    try{
      const raw=await callClaude([{role:"user",content:prompt}],900,apiKey);
      const results=JSON.parse(raw.replace(/```json?|```/g,"").trim());
      const updated=assumptions.map((a,i)=>({...a,status:results[i]?.status||a.status,note:results[i]?.note||""}));
      onUpdate(updated);
    }catch{}
    setChecking(false);
  };

  if(!assumptions.length)return null;

  return <div style={{marginTop:10,padding:"14px 16px",borderRadius:12,border:`1.5px solid ${flagged.length?"#FFD6DF":T.border}`,background:flagged.length?"#FFF5F7":T.bgSoft}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:15}}>⚠️</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:flagged.length?"#A03355":T.ink}}>Assumption tracker</div>
          <div style={{fontSize:11,color:flagged.length?"#A03355":T.inkSoft,opacity:0.85}}>{flagged.length>0?`${flagged.length} assumption${flagged.length>1?"s":""} contradicted by later work`:`${assumptions.length} tracked, all still holding`}</div>
        </div>
      </div>
      <button onClick={recheckAll} disabled={checking} style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,cursor:checking?"not-allowed":"pointer",opacity:checking?0.6:1,fontFamily:FONT}}>{checking?"Checking...":"Re-check now"}</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {flagged.map((a,i)=><div key={i} style={{padding:"9px 12px",borderRadius:8,background:"#fff",border:"1px solid #FFD6DF"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
          <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:10,background:"#A03355",color:"#fff",textTransform:"uppercase"}}>{a.source}</span>
          <span style={{fontSize:12.5,color:T.ink,fontWeight:500}}>{a.text}</span>
        </div>
        {a.note&&<div style={{fontSize:11.5,color:"#A03355",lineHeight:1.5}}>↳ {a.note}</div>}
      </div>)}
      {open.length>0&&flagged.length===0&&<div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {open.map((a,i)=><span key={i} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:T.bg,border:`1px solid ${T.border}`,color:T.inkMd}}>{a.text.slice(0,60)}{a.text.length>60?"…":""}</span>)}
      </div>}
    </div>
  </div>;
}

// ─── Jira / Linear Push ────────────────────────────────────────────────────────
function JiraLinearPush({sprints}){
  const [tool,setTool]=useState("jira");
  const [showConfig,setShowConfig]=useState(false);
  const [domain,setDomain]=useState("");
  const [email,setEmail]=useState("");
  const [token,setToken]=useState("");
  const [projectKey,setProjectKey]=useState("");
  const [pushing,setPushing]=useState(false);
  const [results,setResults]=useState(null);
  const [curlOut,setCurlOut]=useState(null);

  const allTickets=(sprints||[]).flatMap(sp=>(sp.tickets||[]).map(t=>({...t,sprint:sp.sprint,sprintGoal:sp.goal})));

  const buildJiraPayload=(t)=>({fields:{project:{key:projectKey},summary:t.title,description:{type:"doc",version:1,content:[{type:"paragraph",content:[{type:"text",text:`Sprint ${t.sprint}: ${t.sprintGoal||""}\nPriority: ${t.priority} · ${t.points} story points`}]}]},issuetype:{name:t.type==="fix"?"Bug":"Task"}}});
  const buildLinearPayload=(t)=>({query:`mutation{issueCreate(input:{title:"${(t.title||"").replace(/"/g,'\\"')}",description:"Sprint ${t.sprint}: ${(t.sprintGoal||"").replace(/"/g,'\\"')}",estimate:${t.points||1}}){success issue{id title}}}`});

  const pushTickets=async()=>{
    if(!allTickets.length)return;
    setPushing(true);setResults(null);
    const out=[];
    for(const t of allTickets){
      try{
        if(tool==="jira"){
          const url=`https://${domain}.atlassian.net/rest/api/3/issue`;
          const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Basic "+btoa(`${email}:${token}`)},body:JSON.stringify(buildJiraPayload(t))});
          if(res.ok){out.push({title:t.title,ok:true});}else{out.push({title:t.title,ok:false,error:`HTTP ${res.status} — likely blocked by CORS or auth`});}
        }else{
          const res=await fetch("https://api.linear.app/graphql",{method:"POST",headers:{"Content-Type":"application/json","Authorization":token},body:JSON.stringify(buildLinearPayload(t))});
          if(res.ok){const j=await res.json();out.push({title:t.title,ok:!j.errors,error:j.errors?.[0]?.message});}else{out.push({title:t.title,ok:false,error:`HTTP ${res.status}`});}
        }
      }catch(e){out.push({title:t.title,ok:false,error:"Network/CORS blocked — browser sandboxes can't reach external APIs directly. Use the cURL export instead."});}
    }
    setResults(out);setPushing(false);
  };

  const exportCurl=()=>{
    const lines=allTickets.map(t=>{
      if(tool==="jira"){
        return `curl -X POST "https://${domain||'YOUR_DOMAIN'}.atlassian.net/rest/api/3/issue" \\\n  -H "Content-Type: application/json" \\\n  -u "${email||'YOUR_EMAIL'}:YOUR_API_TOKEN" \\\n  -d '${JSON.stringify(buildJiraPayload(t))}'`;
      }
      return `curl -X POST "https://api.linear.app/graphql" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: YOUR_LINEAR_API_KEY" \\\n  -d '${JSON.stringify(buildLinearPayload(t))}'`;
    });
    setCurlOut(lines.join("\n\n"));
  };

  const copyCurl=()=>{if(curlOut)navigator.clipboard.writeText(curlOut);};

  if(!allTickets.length)return null;

  return <div style={{marginTop:14,padding:"16px 18px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bgSoft}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:14,fontWeight:700,color:T.ink}}>🔗 Push to Jira / Linear</div>
        <div style={{fontSize:11,color:T.inkSoft,marginTop:1}}>{allTickets.length} tickets ready across {sprints.length} sprints</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {["jira","linear"].map(tl=><button key={tl} onClick={()=>{setTool(tl);setResults(null);setCurlOut(null);}} style={{padding:"5px 13px",borderRadius:20,fontSize:12,fontWeight:600,border:`1.5px solid ${tool===tl?T.accent:T.border}`,background:tool===tl?T.accentSoft:T.bg,color:tool===tl?T.accent:T.inkMd,cursor:"pointer",fontFamily:FONT,textTransform:"capitalize"}}>{tl}</button>)}
      </div>
    </div>

    {!showConfig?<button onClick={()=>setShowConfig(true)} style={{padding:"8px 18px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Connect {tool==="jira"?"Jira":"Linear"}</button>
    :<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{padding:"10px 12px",borderRadius:8,background:"#FFF5F7",border:"1px solid #FFD6DF",fontSize:11.5,color:"#A03355",lineHeight:1.55}}>
        ⚠ Browser sandboxes block most cross-origin API calls (CORS), so a direct push from here may fail even with valid credentials. If it does, use <strong>Export as cURL</strong> below and run it from your terminal — that always works.
      </div>
      {tool==="jira"?<>
        <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="your-domain (from your-domain.atlassian.net)" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your-email@company.com" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
        <input value={projectKey} onChange={e=>setProjectKey(e.target.value)} placeholder="Project key (e.g. PROJ)" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
        <input value={token} onChange={e=>setToken(e.target.value)} type="password" placeholder="API token (id.atlassian.com/manage-profile/security/api-tokens)" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      </>:<>
        <input value={token} onChange={e=>setToken(e.target.value)} type="password" placeholder="Linear API key (linear.app/settings/api)" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      </>}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={pushTickets} disabled={pushing||(tool==="jira"?(!domain||!email||!token||!projectKey):!token)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT,opacity:pushing?0.6:1}}>{pushing?"Pushing...":`Push ${allTickets.length} tickets`}</button>
        <button onClick={exportCurl} style={{padding:"9px 16px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Export as cURL</button>
      </div>
    </div>}

    {results&&<div style={{marginTop:12,display:"flex",flexDirection:"column",gap:5}}>
      <div style={{fontSize:11,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em"}}>Results — {results.filter(r=>r.ok).length}/{results.length} succeeded</div>
      {results.map((r,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:6,background:r.ok?"#F2FCF6":"#FFF5F7",border:`1px solid ${r.ok?"#B8EDD0":"#FFD6DF"}`}}>
        <span style={{fontSize:13}}>{r.ok?"✓":"✕"}</span>
        <span style={{fontSize:12,color:r.ok?"#1A6642":"#A03355",flex:1}}>{r.title}</span>
        {r.error&&<span style={{fontSize:10.5,color:"#A03355",opacity:0.8}}>{r.error}</span>}
      </div>)}
    </div>}

    {curlOut&&<div style={{marginTop:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em"}}>cURL commands</span>
        <button onClick={copyCurl} style={{padding:"3px 11px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Copy all</button>
      </div>
      <pre style={{fontSize:10.5,lineHeight:1.6,color:T.inkMd,background:T.bg,padding:"10px 12px",borderRadius:8,border:`1px solid ${T.border}`,overflowX:"auto",maxHeight:200,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>{curlOut}</pre>
    </div>}
  </div>;
}

// ─── Version History ────────────────────────────────────────────────────────────
function VersionHistory({proj}){
  const [selected,setSelected]=useState(null);
  const versions=(proj.versions||[]).slice().reverse();
  const grouped={};
  versions.forEach(v=>{(grouped[v.stepId]=grouped[v.stepId]||[]).push(v);});

  const diffFields=(oldData,newData)=>{
    if(!oldData)return Object.keys(newData||{}).map(k=>({field:k,type:"added",val:newData[k]}));
    const out=[];
    const keys=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
    keys.forEach(k=>{
      const ov=oldData?.[k],nv=newData?.[k];
      const os=Array.isArray(ov)?ov.join(", "):String(ov||"");
      const ns=Array.isArray(nv)?nv.join(", "):String(nv||"");
      if(os!==ns)out.push({field:k,type:ov===undefined?"added":"changed",old:os,val:ns});
    });
    return out;
  };

  if(!versions.length)return <div style={{padding:"40px 24px",textAlign:"center",color:T.inkSoft}}>
    <div style={{fontSize:28,marginBottom:10}}>🕐</div>
    <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:4}}>No version history yet</div>
    <div style={{fontSize:12.5}}>A snapshot is saved every time you complete a step.</div>
  </div>;

  return <div style={{padding:"20px 24px",maxWidth:760,margin:"0 auto",display:"flex",gap:18}}>
    <div style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontSize:14,fontWeight:700,color:T.ink}}>🕐 Version History</div>
      {Object.entries(grouped).map(([stepId,vs])=>{
        const step=STEPS.find(s=>s.id===stepId);const p=T[step?.phaseKey||"discover"];
        return <div key={stepId}>
          <div style={{fontSize:11,fontWeight:700,color:p.text,marginBottom:5,display:"flex",alignItems:"center",gap:5}}>{step?.icon} {step?.label}</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {vs.map((v,i)=><button key={v.id} onClick={()=>setSelected(v)} style={{textAlign:"left",padding:"6px 10px",borderRadius:8,border:`1px solid ${selected?.id===v.id?T.accent:T.border}`,background:selected?.id===v.id?T.accentSoft:T.bg,cursor:"pointer",fontFamily:FONT}}>
              <div style={{fontSize:11.5,fontWeight:600,color:selected?.id===v.id?T.accent:T.ink}}>v{vs.length-i} {i===0?"(latest)":""}</div>
              <div style={{fontSize:10,color:T.inkSoft}}>{new Date(v.ts).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
            </button>)}
          </div>
        </div>;
      })}
    </div>
    <div style={{flex:1,minWidth:0}}>
      {!selected&&<div style={{padding:"30px 20px",textAlign:"center",color:T.inkSoft,fontSize:13}}>Select a version on the left to see what changed.</div>}
      {selected&&(()=>{
        const vs=grouped[selected.stepId];const idx=vs.findIndex(v=>v.id===selected.id);
        const prev=vs[idx+1]?.data||null;
        const diffs=diffFields(prev,selected.data);
        return <div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:T.ink}}>{selected.stepLabel} — v{vs.length-idx}</div>
            <div style={{fontSize:12,color:T.inkSoft}}>{new Date(selected.ts).toLocaleString()}{prev?` · compared to v${vs.length-idx-1}`:" · first version"}</div>
          </div>
          {diffs.length===0&&<div style={{fontSize:13,color:T.inkSoft,fontStyle:"italic"}}>No changes from previous version.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {diffs.map((d,i)=><div key={i} style={{padding:"10px 13px",borderRadius:10,border:`1px solid ${d.type==="added"?"#B8EDD0":"#FFD6DF"}`,background:d.type==="added"?"#F2FCF6":"#FFF5F7"}}>
              <div style={{fontSize:10,fontWeight:700,color:d.type==="added"?"#1A6642":"#A03355",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>{d.field.replace(/([A-Z])/g," $1").trim()} · {d.type}</div>
              {d.old&&<div style={{fontSize:12,color:"#A03355",textDecoration:"line-through",opacity:0.65,marginBottom:3,lineHeight:1.5}}>{d.old.slice(0,200)}</div>}
              <div style={{fontSize:12.5,color:d.type==="added"?"#1A6642":"#1A6642",lineHeight:1.5}}>{(d.val||"").toString().slice(0,300)}</div>
            </div>)}
          </div>
        </div>;
      })()}
    </div>
  </div>;
}

// ─── Nudge Digest ───────────────────────────────────────────────────────────────
function buildDigest(projects){
  const items=[];
  projects.forEach(p=>{
    const days=daysSince(p.lastTouched);
    const total=STEPS.length;const done=Object.keys(p.completedSteps||{}).length;
    if(days>=7&&done<total&&done>0){
      items.push({type:"stale",projId:p.id,projName:p.name,detail:`Untouched for ${days} days · ${done}/${total} steps done`});
    }
    (p.assumptions||[]).forEach(a=>{
      if(a.status==="contradicted")items.push({type:"contradiction",projId:p.id,projName:p.name,detail:a.text,note:a.note});
    });
  });
  return items;
}

function NudgeDigest({projects,onOpenProject,onClose}){
  const items=buildDigest(projects);
  const stale=items.filter(i=>i.type==="stale");
  const contradictions=items.filter(i=>i.type==="contradiction");

  return <div style={{position:"absolute",top:48,right:16,width:340,maxHeight:440,overflowY:"auto",background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:"0 8px 28px rgba(0,0,0,0.14)",zIndex:50,padding:"14px 16px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <div style={{fontSize:14,fontWeight:700,color:T.ink}}>🔔 Weekly digest</div>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.inkSoft}}>✕</button>
    </div>
    {items.length===0&&<div style={{fontSize:12.5,color:T.inkSoft,padding:"16px 4px",textAlign:"center",lineHeight:1.6}}>Nothing needs attention — every project is either fresh or complete.</div>}
    {contradictions.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:"#A03355",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>⚠ Contradicted assumptions</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {contradictions.map((it,i)=><button key={i} onClick={()=>onOpenProject(it.projId)} style={{textAlign:"left",padding:"9px 11px",borderRadius:9,border:"1px solid #FFD6DF",background:"#FFF5F7",cursor:"pointer",fontFamily:FONT}}>
          <div style={{fontSize:11.5,fontWeight:700,color:"#A03355",marginBottom:2}}>{it.projName}</div>
          <div style={{fontSize:12,color:"#A03355",lineHeight:1.5}}>{it.detail}</div>
          {it.note&&<div style={{fontSize:11,color:"#A03355",opacity:0.75,marginTop:2}}>↳ {it.note}</div>}
        </button>)}
      </div>
    </div>}
    {stale.length>0&&<div>
      <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>⏱ Going stale</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {stale.map((it,i)=><button key={i} onClick={()=>onOpenProject(it.projId)} style={{textAlign:"left",padding:"9px 11px",borderRadius:9,border:`1px solid ${T.border}`,background:T.bgSoft,cursor:"pointer",fontFamily:FONT}}>
          <div style={{fontSize:11.5,fontWeight:700,color:T.ink,marginBottom:2}}>{it.projName}</div>
          <div style={{fontSize:12,color:T.inkMd}}>{it.detail}</div>
        </button>)}
      </div>
    </div>}
  </div>;
}

// ─── Scope Creep Tracker ────────────────────────────────────────────────────────
function ScopeCreepTracker({proj}){
  const [analysis,setAnalysis]=useState(null);
  const [loading,setLoading]=useState(false);
  const baseline=proj.mvpBaseline;

  const analyze=async()=>{
    if(!baseline)return;
    setLoading(true);
    const current=`PRD features: ${proj.stepData.prd?.features||proj.stepData.prd?.p0||"-"}\n${proj.stepData.prototype_review?.changesFound?`Prototype review changes: ${proj.stepData.prototype_review.revisedFeatures||"-"}, dropped: ${proj.stepData.prototype_review.droppedFeatures||"-"}`:""}\nSprint tickets: ${(proj.sprints||[]).flatMap(sp=>sp.tickets||[]).map(t=>t.title).join("; ")||"-"}`;
    const prompt=`Original locked MVP scope (from Solution & Concept, locked on ${new Date(baseline.lockedAt).toLocaleDateString()}):\n${baseline.features}\n\nCurrent state of the project:\n${current}\n\nCompare current scope to the original baseline. Identify: items ADDED that weren't in the original MVP, items DROPPED that were in the original MVP but are now gone.\nReturn ONLY JSON, no markdown: {"added":["specific added item"],"dropped":["specific dropped item"],"verdict":"one sentence on whether this is healthy iteration or concerning drift"}`;
    try{
      const raw=await callClaude([{role:"user",content:prompt}],600,apiKey);
      setAnalysis(JSON.parse(raw.replace(/```json?|```/g,"").trim()));
    }catch{setAnalysis(null);}
    setLoading(false);
  };

  if(!baseline)return <div style={{padding:"14px 16px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bgSoft,fontSize:12.5,color:T.inkSoft,textAlign:"center"}}>Scope tracking starts once Solution & Concept is completed — that's when the MVP baseline locks.</div>;

  const driftCount=(analysis?.added?.length||0)+(analysis?.dropped?.length||0);

  return <div style={{padding:"16px 18px",borderRadius:12,border:`1px solid ${driftCount>2?"#FFD6DF":T.border}`,background:driftCount>2?"#FFF5F7":T.bgSoft}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:14,fontWeight:700,color:T.ink}}>📐 Scope creep tracker</div>
        <div style={{fontSize:11,color:T.inkSoft,marginTop:1}}>Baseline locked {new Date(baseline.lockedAt).toLocaleDateString()} at Solution & Concept</div>
      </div>
      <button onClick={analyze} disabled={loading} style={{padding:"6px 16px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Comparing...":"Check drift"}</button>
    </div>
    <div style={{padding:"9px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,marginBottom:analysis?10:0}}>
      <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Original MVP scope</div>
      <div style={{fontSize:12.5,color:T.inkMd,lineHeight:1.55}}>{baseline.features}</div>
    </div>
    {analysis&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {analysis.added?.length>0&&<div style={{padding:"9px 12px",borderRadius:8,background:"#FFF5F7",border:"1px solid #FFD6DF"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#A03355",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>+ Added since baseline ({analysis.added.length})</div>
        {analysis.added.map((a,i)=><div key={i} style={{fontSize:12.5,color:"#A03355",lineHeight:1.6}}>• {a}</div>)}
      </div>}
      {analysis.dropped?.length>0&&<div style={{padding:"9px 12px",borderRadius:8,background:T.bgMuted,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.inkMd,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>− Dropped since baseline ({analysis.dropped.length})</div>
        {analysis.dropped.map((d,i)=><div key={i} style={{fontSize:12.5,color:T.inkMd,lineHeight:1.6,textDecoration:"line-through",opacity:0.75}}>• {d}</div>)}
      </div>}
      {analysis.verdict&&<div style={{fontSize:12.5,color:T.ink,fontStyle:"italic",padding:"8px 10px",lineHeight:1.55}}>{analysis.verdict}</div>}
      {driftCount===0&&<div style={{fontSize:12.5,color:"#1A6642",padding:"8px 10px"}}>✓ No drift detected — current scope matches the original MVP.</div>}
    </div>}
  </div>;
}

// ─── Metric Consistency Check ────────────────────────────────────────────────────
function NorthStarMetric({proj,onSet}){
  const [editing,setEditing]=useState(!proj.northStarMetric);
  const [draft,setDraft]=useState(proj.northStarMetric||"");
  const commit=()=>{if(draft.trim()){onSet(draft.trim());setEditing(false);}};

  return <div style={{padding:"12px 16px",borderRadius:12,border:`1.5px solid ${T.accentMd}`,background:T.accentSoft,marginBottom:10}}>
    <div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>🎯 North star metric</div>
    {editing?<div style={{display:"flex",gap:6}}>
      <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")commit();}} placeholder="e.g. weekly active teams using core workflow" style={{flex:1,padding:"7px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      <button onClick={commit} style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Set</button>
    </div>:<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <span style={{fontSize:14,fontWeight:600,color:T.ink}}>{proj.northStarMetric}</span>
      <button onClick={()=>setEditing(true)} style={{background:"none",border:"none",color:T.accent,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Edit</button>
    </div>}
  </div>;
}

function MetricConsistencyCheck({proj}){
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  const check=async()=>{
    if(!proj.northStarMetric)return;
    setLoading(true);
    const mentions=`PRD goals: ${proj.stepData.prd?.goals||"-"}\nOKR-relevant GTM metrics: ${proj.stepData.gtm?.metrics||"-"}\nOpportunity sizing revenue: ${proj.stepData.opportunity_sizing?.revenuePotential||"-"}`;
    const prompt=`North star metric defined for this project: "${proj.northStarMetric}"\n\nOther places metrics or goals are mentioned across the project:\n${mentions}\n\nCheck whether these other mentions are consistent with the north star metric, or whether a different/conflicting metric has crept in (e.g. north star is "weekly active teams" but PRD goals talk about "total signups" instead).\nReturn ONLY JSON, no markdown: {"consistent":true,"conflicts":["specific conflict description"]}`;
    try{
      const raw=await callClaude([{role:"user",content:prompt}],500,apiKey);
      setResult(JSON.parse(raw.replace(/```json?|```/g,"").trim()));
    }catch{setResult(null);}
    setLoading(false);
  };

  if(!proj.northStarMetric)return null;

  return <div style={{marginTop:8}}>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:result?8:0}}>
      <button onClick={check} disabled={loading} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:11,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Checking...":"Check consistency"}</button>
    </div>
    {result&&<div style={{padding:"10px 13px",borderRadius:10,background:result.consistent?"#F2FCF6":"#FFF5F7",border:`1px solid ${result.consistent?"#B8EDD0":"#FFD6DF"}`}}>
      {result.consistent?<div style={{fontSize:12.5,color:"#1A6642"}}>✓ Metrics across the project stay consistent with your north star.</div>
      :<div style={{display:"flex",flexDirection:"column",gap:5}}>
        <div style={{fontSize:11,fontWeight:700,color:"#A03355",textTransform:"uppercase",letterSpacing:"0.05em"}}>⚠ Conflicting metrics found</div>
        {result.conflicts?.map((c,i)=><div key={i} style={{fontSize:12.5,color:"#A03355",lineHeight:1.55}}>• {c}</div>)}
      </div>}
    </div>}
  </div>;
}

// ─── Launch Readiness Checklist ──────────────────────────────────────────────────
function LaunchChecklist({proj,checklistState,onToggle}){
  const [items,setItems]=useState(null);
  const [loading,setLoading]=useState(false);

  const generate=async()=>{
    setLoading(true);
    const ctx=`PRD: ${proj.stepData.prd?.summary||"-"}, P0 features: ${proj.stepData.prd?.p0||proj.stepData.prd?.features||"-"}\nGTM: ${proj.stepData.gtm?.launchPlan||proj.stepData.gtm?.channels||"-"}\nKnown risks: present in risk register if generated\nStakeholders: present in stakeholder map if generated`;
    const prompt=`Generate a launch readiness checklist for this product, based on:\n${ctx}\n\nCover these categories: Product (feature completeness, QA), Go-to-market (positioning, channels ready), Operational (support, monitoring), Risk (key risks mitigated), Stakeholders (sign-offs needed).\n4-6 items total across categories, specific to this product not generic.\nReturn ONLY JSON array, no markdown: [{"category":"Product|GTM|Operational|Risk|Stakeholders","item":"specific checklist item"}]`;
    try{
      const raw=await callClaude([{role:"user",content:prompt}],700,apiKey);
      setItems(JSON.parse(raw.replace(/```json?|```/g,"").trim()));
    }catch{setItems([]);}
    setLoading(false);
  };

  const catColor={Product:T.build,GTM:T.grow,Operational:T.understand,Risk:T.discover,Stakeholders:T.understand};
  const checkedCount=items?items.filter((it,i)=>checklistState[i]).length:0;

  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:17,fontWeight:700,color:T.ink}}>🚦 Launch readiness checklist</div>
        <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>{items?`${checkedCount}/${items.length} ready`:"Pulled from your PRD, GTM plan, and risk work"}</div>
      </div>
      <button onClick={generate} disabled={loading} style={{padding:"8px 18px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Building...":items?"Regenerate":"Generate checklist"}</button>
    </div>
    {items?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
      {items.map((it,i)=>{const c=catColor[it.category]||T.discover;const checked=!!checklistState[i];return <button key={i} onClick={()=>onToggle(i)} style={{textAlign:"left",display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderRadius:10,border:`1.5px solid ${checked?"#B8EDD0":c.border}`,background:checked?"#F2FCF6":c.bg,cursor:"pointer",fontFamily:FONT}}>
        <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checked?"#3BAF74":c.dot}`,background:checked?"#3BAF74":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>{checked?"✓":""}</div>
        <div style={{flex:1}}>
          <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,background:T.bg,color:checked?"#1A6642":c.text,border:`1px solid ${checked?"#B8EDD0":c.border}`,textTransform:"uppercase",marginRight:8}}>{it.category}</span>
          <span style={{fontSize:13,color:checked?"#1A6642":T.ink,textDecoration:checked?"line-through":"none",opacity:checked?0.75:1}}>{it.item}</span>
        </div>
      </button>;})}
    </div>}
  </div>;
}

// ─── Exec Summary Generator ──────────────────────────────────────────────────────
function ExecSummary({proj}){
  const [loading,setLoading]=useState(false);
  const [summary,setSummary]=useState(null);
  const [length,setLength]=useState("brief");

  const generate=async()=>{
    setLoading(true);
    const sd=proj.stepData;
    const ctx=`Vision: ${sd.solution_concept?.vision||"-"}\nProblem: ${sd.problem_framing?.jtbd||sd.market_research?.problem||"-"}\nMarket: ${sd.market_research?.market||"-"}\nOpportunity: ${sd.opportunity_sizing?.som||"-"}\nPRD status: ${sd.prd?.summary||"not yet written"}\nKey risks: ${proj.assumptions?.filter(a=>a.status==="contradicted").map(a=>a.text).join("; ")||"none flagged"}\nGTM: ${sd.gtm?.positioning||"not yet defined"}\nSprint progress: ${(proj.sprints||[]).flatMap(sp=>sp.tickets||[]).filter(t=>t.status==="done").length} of ${(proj.sprints||[]).flatMap(sp=>sp.tickets||[]).length} tickets done\nNorth star metric: ${proj.northStarMetric||"not set"}`;
    const lengthInstr=length==="brief"?"Keep it to 4-5 short paragraphs, scannable in 60 seconds.":"Cover the same ground but with more supporting detail, roughly double the length.";
    const prompt=`Write a one-page executive update for this product project, in the voice of a PM writing to their VP or leadership team.\n\nProject context:\n${ctx}\n\n${lengthInstr}\nStructure: Status (one line, plain — on track / at risk / blocked), Key decisions made this period, Risks and open questions, What's needed from leadership (if anything).\nWrite in plain confident prose, no corporate filler, no "leverage" or "synergy". Lead with the most important thing. Use real specifics from the context, not generic placeholders.\nReturn plain text only, no markdown headers — just paragraph breaks.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],900,apiKey);setSummary(raw.trim());}catch{setSummary(null);}
    setLoading(false);
  };
  const copy=()=>{if(summary)navigator.clipboard.writeText(summary);};

  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:17,fontWeight:700,color:T.ink}}>📋 Exec summary</div>
        <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>One page, written for leadership, pulled from whatever's done so far</div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {["brief","detailed"].map(l=><button key={l} onClick={()=>setLength(l)} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,border:`1.5px solid ${length===l?T.accent:T.border}`,background:length===l?T.accentSoft:T.bg,color:length===l?T.accent:T.inkMd,cursor:"pointer",fontFamily:FONT,textTransform:"capitalize"}}>{l}</button>)}
        {summary&&<button onClick={copy} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Copy</button>}
        <button onClick={generate} disabled={loading} style={{padding:"6px 16px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Writing...":summary?"Regenerate":"Generate"}</button>
      </div>
    </div>
    {summary&&<div style={{padding:"20px 22px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bg,fontSize:14,lineHeight:1.75,color:T.ink,whiteSpace:"pre-wrap"}}>{summary}</div>}
    {!summary&&!loading&&<div style={{padding:"30px 20px",textAlign:"center",color:T.inkSoft,fontSize:13}}>Generates a leadership-ready update from whatever steps you've completed — works even if the project's only partway done.</div>}
  </div>;
}

// ─── Decision Log ────────────────────────────────────────────────────────────────
function DecisionLogPanel({proj,onAddDecision,onDeleteDecision}){
  const [showForm,setShowForm]=useState(false);
  const [decision,setDecision]=useState("");
  const [rationale,setRationale]=useState("");
  const [alternative,setAlternative]=useState("");
  const log=(proj.decisionLog||[]).slice().reverse();

  const submit=()=>{
    if(!decision.trim()||!rationale.trim())return;
    onAddDecision({id:Date.now()+Math.random(),decision:decision.trim(),rationale:rationale.trim(),alternative:alternative.trim(),ts:new Date().toISOString()});
    setDecision("");setRationale("");setAlternative("");setShowForm(false);
  };

  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <div style={{fontSize:17,fontWeight:700,color:T.ink}}>📒 Decision log</div>
        <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Why a call was made, not just what — so nobody re-litigates it in 6 months</div>
      </div>
      <button onClick={()=>setShowForm(s=>!s)} style={{padding:"7px 16px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{showForm?"Cancel":"+ Log a decision"}</button>
    </div>
    {showForm&&<div style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${T.accentMd}`,background:T.accentSoft,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
      <input value={decision} onChange={e=>setDecision(e.target.value)} placeholder="What was decided (e.g. 'Cutting SSO from v1')" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      <textarea value={rationale} onChange={e=>setRationale(e.target.value)} placeholder="Why this, specifically (the reasoning, not just the conclusion)" rows={2} style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",resize:"none",fontFamily:FONT,lineHeight:1.5}}/>
      <input value={alternative} onChange={e=>setAlternative(e.target.value)} placeholder="What was the alternative considered (optional)" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      <button onClick={submit} disabled={!decision.trim()||!rationale.trim()} style={{padding:"8px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:decision.trim()&&rationale.trim()?"pointer":"not-allowed",opacity:decision.trim()&&rationale.trim()?1:0.5,fontFamily:FONT}}>Save decision</button>
    </div>}
    {log.length===0&&!showForm&&<div style={{padding:"30px 20px",textAlign:"center",color:T.inkSoft,fontSize:13,lineHeight:1.6}}>No decisions logged yet. Capture the rationale right when you make a call — it's the part everyone forgets.</div>}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {log.map(d=><div key={d.id} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:5}}>
          <div style={{fontSize:13.5,fontWeight:700,color:T.ink}}>{d.decision}</div>
          <button onClick={()=>onDeleteDecision(d.id)} style={{background:"none",border:"none",color:T.inkSoft,cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>
        </div>
        <div style={{fontSize:12.5,color:T.inkMd,lineHeight:1.55,marginBottom:d.alternative?5:0}}>{d.rationale}</div>
        {d.alternative&&<div style={{fontSize:11.5,color:T.inkSoft,fontStyle:"italic"}}>Considered instead: {d.alternative}</div>}
        <div style={{fontSize:10.5,color:T.inkSoft,marginTop:6}}>{new Date(d.ts).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"})}</div>
      </div>)}
    </div>
  </div>;
}

// ─── Stakeholder Objection Rehearsal ─────────────────────────────────────────────
const DEFAULT_PERSONAS=[
  {name:"Skeptical VP",role:"Eng leadership",angle:"Pushes on feasibility, timeline realism, and technical debt"},
  {name:"Budget owner",role:"Finance",angle:"Pushes on ROI, cost, and whether this is the best use of resources right now"},
  {name:"Sales lead",role:"Go-to-market",angle:"Pushes on whether customers actually asked for this and how it sells"},
];

function ObjectionRehearsal({proj}){
  const [persona,setPersona]=useState(null);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const personas=proj.stakeholders?.length>0
    ?proj.stakeholders.filter(s=>s.influence==="High").map(s=>({name:s.name,role:s.role,angle:s.commsNote||"Pushes back based on their role and stake in this"}))
    :DEFAULT_PERSONAS;

  const startSession=async(p)=>{
    setPersona(p);setMessages([]);setLoading(true);
    const sd=proj.stepData;
    const ctx=`Vision: ${sd.solution_concept?.vision||"-"}\nPRD: ${sd.prd?.summary||"-"}\nGTM: ${sd.gtm?.positioning||"-"}\nRisks flagged: ${proj.assumptions?.filter(a=>a.status==="contradicted").map(a=>a.text).join("; ")||"none"}`;
    const prompt=`You are roleplaying as "${p.name}" (${p.role}) in a meeting where a PM is pitching this plan:\n${ctx}\n\nYour character's angle: ${p.angle}\n\nStay fully in character. Open with one sharp, realistic objection or tough question — the kind this specific person would actually raise first. Be skeptical but professional, not cartoonish. Keep it to 2-3 sentences. Do not break character or add meta-commentary.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],300,apiKey);setMessages([{role:"assistant",content:raw.trim()}]);}catch{setMessages([{role:"assistant",content:"Let's talk through this plan — I have some concerns."}]);}
    setLoading(false);
  };

  const reply=async()=>{
    if(!input.trim()||loading)return;
    const userMsg={role:"user",content:input.trim()};
    const newMsgs=[...messages,userMsg];
    setMessages(newMsgs);setInput("");setLoading(true);
    const sd=proj.stepData;
    const ctx=`Vision: ${sd.solution_concept?.vision||"-"}\nPRD: ${sd.prd?.summary||"-"}\nGTM: ${sd.gtm?.positioning||"-"}`;
    const sys=`You are roleplaying as "${persona.name}" (${persona.role}) in an ongoing pushback conversation about this plan:\n${ctx}\nYour angle: ${persona.angle}\nStay in character, stay skeptical but fair, keep responses to 2-4 sentences. If the PM gives a genuinely strong answer, you can concede a point — don't be contrarian for its own sake. Do not break character.`;
    const msgs=[{role:"user",content:sys},{role:"assistant",content:"Understood, staying in character."},...newMsgs];
    try{const raw=await callClaude(msgs,350);setMessages([...newMsgs,{role:"assistant",content:raw.trim()}]);}catch{setMessages([...newMsgs,{role:"assistant",content:"Let me think about that."}]);}
    setLoading(false);
  };

  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:17,fontWeight:700,color:T.ink}}>🗣️ Objection rehearsal</div>
      <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Pressure-test the plan before you're in the real room</div>
    </div>
    {!persona&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:12.5,color:T.inkMd,marginBottom:4}}>{proj.stakeholders?.length>0?"Pick a stakeholder from your map to role-play:":"Pick who should push back (generate a stakeholder map first for personalized personas):"}</div>
      {personas.map((p,i)=><button key={i} onClick={()=>startSession(p)} style={{textAlign:"left",padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bgSoft,cursor:"pointer",fontFamily:FONT}}>
        <div style={{fontSize:13.5,fontWeight:700,color:T.ink}}>{p.name} <span style={{fontSize:11,fontWeight:400,color:T.inkSoft}}>· {p.role}</span></div>
        <div style={{fontSize:12,color:T.inkMd,marginTop:2}}>{p.angle}</div>
      </button>)}
    </div>}
    {persona&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"9px 13px",borderRadius:10,background:T.accentSoft,border:`1px solid ${T.accentMd}`}}>
        <div style={{fontSize:12.5,fontWeight:600,color:T.accent}}>Role-playing: {persona.name} ({persona.role})</div>
        <button onClick={()=>{setPersona(null);setMessages([]);}} style={{background:"none",border:"none",color:T.accent,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Switch persona</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {messages.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
          <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px",background:m.role==="user"?T.accent:T.bgSoft,color:m.role==="user"?"#fff":T.ink,fontSize:13.5,lineHeight:1.6,border:m.role==="user"?"none":`1px solid ${T.border}`}}>{m.content}</div>
        </div>)}
        {loading&&<div style={{fontSize:12.5,color:T.inkSoft,fontStyle:"italic"}}>{persona.name} is thinking…</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")reply();}} placeholder="Make your case..." disabled={loading} style={{flex:1,padding:"10px 13px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13.5,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
        <button onClick={reply} disabled={loading||!input.trim()} style={{padding:"10px 20px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:loading||!input.trim()?"not-allowed":"pointer",opacity:loading||!input.trim()?0.5:1,fontFamily:FONT}}>Respond</button>
      </div>
    </div>}
  </div>;
}

// ─── Sales Battlecard ─────────────────────────────────────────────────────────────
function SalesBattlecard({proj}){
  const [loading,setLoading]=useState(false);
  const [card,setCard]=useState(null);
  const sd=proj.stepData;

  const generate=async()=>{
    setLoading(true);
    const competitorCtx=proj.competitorData?.length>0
      ?proj.competitorData.map(c=>`${c.name}: ${c.description} | pricing: ${c.pricing||"unknown"} | signal: ${c.signal||"-"}`).join("\n")
      :sd.market_research?.competitors||"no competitor data captured yet";
    const ctx=`Product: ${sd.solution_concept?.vision||"-"}\nValue prop: ${sd.solution_concept?.valueProp||"-"}\nDifferentiator: ${sd.solution_concept?.differentiator||"-"}\nTarget customer: ${sd.market_research?.targetCustomer||"-"}\nPositioning: ${sd.gtm?.positioning||"-"}\nPricing: ${sd.gtm?.pricing||"-"}\nCompetitors:\n${competitorCtx}`;
    const prompt=`Create a sales battlecard for this product, for an AE who needs to win deals against the competitors listed. Context:\n${ctx}\n\nReturn ONLY JSON, no markdown: {"oneLinePitch":"single sentence pitch","whyUs":["3-4 specific reasons to choose this product"],"competitors":[{"name":"...","theirStrength":"what they're good at, fairly stated","howToWin":"specific angle to win against them"}],"objections":[{"objection":"realistic prospect pushback","response":"sharp, specific response"}],"talkTrack":"a short 3-4 sentence opening talk track a rep could actually say on a call"}`;
    try{const raw=await callClaude([{role:"user",content:prompt}],1200,apiKey);setCard(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{setCard(null);}
    setLoading(false);
  };
  const copyAll=()=>{
    if(!card)return;
    const txt=`SALES BATTLECARD — ${proj.name}\n\nPITCH\n${card.oneLinePitch}\n\nWHY US\n${card.whyUs?.map(w=>`• ${w}`).join("\n")}\n\nCOMPETITORS\n${card.competitors?.map(c=>`${c.name}\n  Their strength: ${c.theirStrength}\n  How to win: ${c.howToWin}`).join("\n\n")}\n\nOBJECTION HANDLING\n${card.objections?.map(o=>`Q: ${o.objection}\nA: ${o.response}`).join("\n\n")}\n\nTALK TRACK\n${card.talkTrack}`;
    navigator.clipboard.writeText(txt);
  };

  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:17,fontWeight:700,color:T.ink}}>🃏 Sales battlecard</div>
        <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>For sales enablement — different audience than the PRD</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        {card&&<button onClick={copyAll} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Copy all</button>}
        <button onClick={generate} disabled={loading} style={{padding:"7px 16px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Building...":card?"Regenerate":"Generate"}</button>
      </div>
    </div>
    {!card&&!loading&&<div style={{padding:"30px 20px",textAlign:"center",color:T.inkSoft,fontSize:13,lineHeight:1.6}}>{proj.competitorData?.length>0?"Uses your live competitor research for sharper objection handling.":"Tip: run Live Competitor Research in Market Research first for sharper competitive angles."}</div>}
    {card&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{padding:"14px 16px",borderRadius:12,background:T.accentSoft,border:`1.5px solid ${T.accentMd}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>One-line pitch</div>
        <div style={{fontSize:15,fontWeight:600,color:T.ink,lineHeight:1.5}}>{card.oneLinePitch}</div>
      </div>
      {card.whyUs?.length>0&&<div style={{padding:"12px 15px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7}}>Why us</div>
        {card.whyUs.map((w,i)=><div key={i} style={{fontSize:13,color:T.inkMd,lineHeight:1.6,marginBottom:4}}>✓ {w}</div>)}
      </div>}
      {card.competitors?.length>0&&<div>
        <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7}}>Competitive angles</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {card.competitors.map((c,i)=><div key={i} style={{padding:"11px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bgSoft}}>
            <div style={{fontSize:13.5,fontWeight:700,color:T.ink,marginBottom:5}}>{c.name}</div>
            <div style={{fontSize:12,color:T.inkSoft,marginBottom:4}}><strong>Their strength:</strong> {c.theirStrength}</div>
            <div style={{fontSize:12.5,color:"#1A6642"}}><strong>How to win:</strong> {c.howToWin}</div>
          </div>)}
        </div>
      </div>}
      {card.objections?.length>0&&<div>
        <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7}}>Objection handling</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {card.objections.map((o,i)=><div key={i} style={{padding:"11px 14px",borderRadius:10,border:"1px solid #FFD6DF",background:"#FFF5F7"}}>
            <div style={{fontSize:12.5,fontWeight:600,color:"#A03355",marginBottom:4}}>"{o.objection}"</div>
            <div style={{fontSize:12.5,color:T.ink,lineHeight:1.55}}>{o.response}</div>
          </div>)}
        </div>
      </div>}
      {card.talkTrack&&<div style={{padding:"13px 15px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Opening talk track</div>
        <div style={{fontSize:13,color:T.ink,lineHeight:1.65,fontStyle:"italic"}}>{card.talkTrack}</div>
      </div>}
    </div>}
  </div>;
}

// ─── Post-launch Metrics Tracker ───────────────────────────────────────────────────
function PostLaunchMetrics({proj,onAddSnapshot,onDeleteSnapshot}){
  const [showForm,setShowForm]=useState(false);
  const [value,setValue]=useState("");
  const [note,setNote]=useState("");
  const [analysis,setAnalysis]=useState(null);
  const [loading,setLoading]=useState(false);
  const snapshots=(proj.metricSnapshots||[]).slice().sort((a,b)=>new Date(a.ts)-new Date(b.ts));
  const target=proj.northStarMetric;

  const submit=()=>{
    if(!value.trim())return;
    onAddSnapshot({id:Date.now()+Math.random(),value:value.trim(),note:note.trim(),ts:new Date().toISOString()});
    setValue("");setNote("");setShowForm(false);
  };

  const analyzeDrift=async()=>{
    if(snapshots.length<2)return;
    setLoading(true);
    const history=snapshots.map(s=>`${new Date(s.ts).toLocaleDateString()}: ${s.value}${s.note?` (${s.note})`:""}`).join("\n");
    const prompt=`North star metric: "${target||"not explicitly set"}"\nGTM targets/metrics: ${proj.stepData.gtm?.metrics||"-"}\n\nActual logged values over time:\n${history}\n\nAnalyze the trend. Is it tracking toward the target, flat, or declining? Suggest one specific course correction if needed.\nReturn ONLY JSON, no markdown: {"trend":"improving|flat|declining","verdict":"2-3 sentence analysis","suggestion":"one specific course correction, or empty string if on track"}`;
    try{const raw=await callClaude([{role:"user",content:prompt}],500,apiKey);setAnalysis(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{setAnalysis(null);}
    setLoading(false);
  };

  const trendColor={improving:"#1A6642",flat:"#7C4A0A",declining:"#A03355"};
  const trendBg={improving:"#F2FCF6",flat:"#FFF9F0",declining:"#FFF5F7"};
  const trendIcon={improving:"↗",flat:"→",declining:"↘"};

  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:17,fontWeight:700,color:T.ink}}>📈 Post-launch metrics</div>
        <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>{target?`Tracking against: ${target}`:"Set a north star metric in Scope & Metrics to track against a target"}</div>
      </div>
      <button onClick={()=>setShowForm(s=>!s)} style={{padding:"7px 16px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{showForm?"Cancel":"+ Log value"}</button>
    </div>
    {showForm&&<div style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${T.accentMd}`,background:T.accentSoft,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
      <input value={value} onChange={e=>setValue(e.target.value)} placeholder="Current value (e.g. '142 weekly active teams')" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Context (optional — e.g. 'after onboarding redesign')" style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
      <button onClick={submit} disabled={!value.trim()} style={{padding:"8px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:value.trim()?"pointer":"not-allowed",opacity:value.trim()?1:0.5,fontFamily:FONT}}>Save snapshot</button>
    </div>}
    {snapshots.length===0&&!showForm&&<div style={{padding:"30px 20px",textAlign:"center",color:T.inkSoft,fontSize:13,lineHeight:1.6}}>No metric snapshots yet. Log values periodically after launch to track real performance against your target.</div>}
    {snapshots.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
      {snapshots.slice().reverse().map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{fontSize:11,color:T.inkSoft,minWidth:74,flexShrink:0}}>{new Date(s.ts).toLocaleDateString([],{month:"short",day:"numeric"})}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{s.value}</div>
          {s.note&&<div style={{fontSize:11.5,color:T.inkSoft}}>{s.note}</div>}
        </div>
        <button onClick={()=>onDeleteSnapshot(s.id)} style={{background:"none",border:"none",color:T.inkSoft,cursor:"pointer",fontSize:12}}>✕</button>
      </div>)}
    </div>}
    {snapshots.length>=2&&<div>
      <button onClick={analyzeDrift} disabled={loading} style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${T.border}`,background:T.bgSoft,color:T.inkMd,fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT,marginBottom:analysis?10:0}}>{loading?"Analyzing trend...":"Analyze trend"}</button>
      {analysis&&<div style={{padding:"13px 15px",borderRadius:10,border:`1px solid ${T.border}`,background:trendBg[analysis.trend]||T.bgSoft}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:18,color:trendColor[analysis.trend]}}>{trendIcon[analysis.trend]}</span>
          <span style={{fontSize:12,fontWeight:700,color:trendColor[analysis.trend]||T.ink,textTransform:"uppercase",letterSpacing:"0.05em"}}>{analysis.trend}</span>
        </div>
        <div style={{fontSize:13,color:T.ink,lineHeight:1.6,marginBottom:analysis.suggestion?8:0}}>{analysis.verdict}</div>
        {analysis.suggestion&&<div style={{fontSize:12.5,color:T.inkMd,fontStyle:"italic",paddingTop:8,borderTop:`1px solid ${T.border}`}}>Suggested: {analysis.suggestion}</div>}
      </div>}
    </div>}
  </div>;
}

// ─── Persona Cards ─────────────────────────────────────────────────────────────
function PersonaCards({personas}){
  let list=[];try{list=typeof personas==="string"?JSON.parse(personas):personas;}catch{return null;}
  if(!Array.isArray(list)||!list.length)return null;
  const cols=[T.discover,T.understand,T.build,T.grow];
  return <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>
    <div style={{fontSize:11,fontWeight:700,color:T.inkSoft,letterSpacing:"0.06em",textTransform:"uppercase"}}>User personas</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {list.map((p,i)=>{const c=cols[i%cols.length];return <div key={i} style={{flex:"1 1 155px",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:c.dot,color:"#fff",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(p.name||"?")[0].toUpperCase()}</div>
          <div><div style={{fontSize:13,fontWeight:700,color:c.text}}>{p.name||"Persona"}</div><div style={{fontSize:11,color:c.text,opacity:0.7}}>{p.role||""}</div></div>
        </div>
        {p.goal&&<div style={{fontSize:12,color:c.text,marginBottom:3}}><strong>Goal:</strong> {p.goal}</div>}
        {p.frustration&&<div style={{fontSize:12,color:c.text,marginBottom:3}}><strong>Pain:</strong> {p.frustration}</div>}
        {p.quote&&<div style={{fontSize:11.5,color:c.text,fontStyle:"italic",marginTop:6,paddingTop:6,borderTop:`1px solid ${c.border}`,lineHeight:1.5}}>"{p.quote}"</div>}
      </div>;})}
    </div>
  </div>;
}

// ─── Prioritization Matrix ─────────────────────────────────────────────────────
function PrioritizationMatrix({data}){
  const [loading,setLoading]=useState(false);
  const [matrix,setMatrix]=useState(null);
  const [fw,setFw]=useState("rice");
  const generate=async()=>{
    setLoading(true);
    const feats=`P0: ${data.p0||data.features||"-"}\nP1: ${data.p1||"-"}\nP2: ${data.p2||"-"}`;
    const prompt=`PM prioritization expert. Features:\n${feats}\n\nGenerate ${fw.toUpperCase()} matrix. Return ONLY JSON array: [{"feature":"...","score":0,"rationale":"...","priority":"P0|P1|P2"}] sorted by priority. No markdown.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],800,apiKey);setMatrix(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{setMatrix([]);}
    setLoading(false);
  };
  return <div style={{marginTop:10,padding:"14px 16px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bgSoft}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:13,fontWeight:700,color:T.ink}}>⚖️ Prioritization Matrix</div>
      <div style={{display:"flex",gap:6}}>
        {["rice","moscow"].map(f=><button key={f} onClick={()=>setFw(f)} style={{padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:600,border:`1.5px solid ${fw===f?T.accent:T.border}`,background:fw===f?T.accentSoft:T.bg,color:fw===f?T.accent:T.inkMd,cursor:"pointer",fontFamily:FONT,textTransform:"uppercase"}}>{f}</button>)}
        <button onClick={generate} disabled={loading} style={{padding:"4px 13px",borderRadius:20,fontSize:11,fontWeight:600,border:"none",background:T.accent,color:"#fff",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Scoring...":"Generate"}</button>
      </div>
    </div>
    {matrix?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      {matrix.map((item,i)=>{const pc={P0:{bg:"#FFF5F7",border:"#FFD6DF",text:"#A03355"},P1:{bg:"#F3F5FF",border:"#C5CEFF",text:"#2D4A9E"},P2:{bg:"#F9F3FF",border:"#DCC5F5",text:"#5C2D91"}};const c=pc[item.priority]||pc.P2;
      return <div key={i} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${c.border}`,background:c.bg,display:"flex",alignItems:"flex-start",gap:9}}>
        <div style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10,background:c.text,color:"#fff",flexShrink:0,marginTop:1}}>{item.priority}</div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:c.text,marginBottom:2}}>{item.feature}</div><div style={{fontSize:11.5,color:c.text,opacity:0.75}}>{item.rationale}</div></div>
        {item.score>0&&<div style={{fontSize:15,fontWeight:700,color:c.text,flexShrink:0}}>{Math.round(item.score)}</div>}
      </div>;})}
    </div>}
  </div>;
}

// ─── Risk Register ─────────────────────────────────────────────────────────────
function RiskRegister({proj}){
  const [loading,setLoading]=useState(false);
  const [risks,setRisks]=useState(null);
  const generate=async()=>{
    setLoading(true);
    const ctx=`Product: ${proj.stepData.solution_concept?.vision||"-"}, Market: ${proj.stepData.market_research?.market||"-"}, GTM: ${proj.stepData.gtm?.channels||"-"}`;
    const prompt=`PM risk assessment for: ${ctx}\n\nGenerate 6-8 risks across: technical, market, team, regulatory, competitive, execution.\nReturn ONLY JSON: [{"risk":"...","category":"technical|market|team|regulatory|competitive|execution","probability":"High|Med|Low","impact":"High|Med|Low","mitigation":"..."}]. No markdown.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],800,apiKey);setRisks(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{setRisks([]);}
    setLoading(false);
  };
  const pc={High:"#E8637A",Med:"#E8A93A",Low:"#3BAF74"};
  const ci={technical:"⚙️",market:"📉",team:"👥",regulatory:"⚖️",competitive:"🏆",execution:"🎯"};
  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div><div style={{fontSize:17,fontWeight:700,color:T.ink}}>🛡️ Risk Register</div><div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Auto-generated from your brief</div></div>
      <button onClick={generate} disabled={loading} style={{padding:"8px 18px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Analysing...":"Generate"}</button>
    </div>
    {risks?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {risks.map((r,i)=><div key={i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg,display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{fontSize:18,flexShrink:0}}>{ci[r.category]||"⚠️"}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:600,color:T.ink}}>{r.risk}</span><span style={{fontSize:10,padding:"1px 7px",borderRadius:10,background:T.bgMuted,color:T.inkMd,fontWeight:600,textTransform:"uppercase"}}>{r.category}</span></div>
          <div style={{display:"flex",gap:10,marginBottom:5}}><span style={{fontSize:11,color:T.inkSoft}}>Probability: <strong style={{color:pc[r.probability]}}>{r.probability}</strong></span><span style={{fontSize:11,color:T.inkSoft}}>Impact: <strong style={{color:pc[r.impact]}}>{r.impact}</strong></span></div>
          <div style={{fontSize:12,color:T.inkMd,lineHeight:1.55}}>{r.mitigation}</div>
        </div>
      </div>)}
    </div>}
  </div>;
}

// ─── OKR Generator ─────────────────────────────────────────────────────────────
function OKRGenerator({proj}){
  const [loading,setLoading]=useState(false);
  const [okrs,setOkrs]=useState(null);
  const [q,setQ]=useState("Q1");
  const generate=async()=>{
    setLoading(true);
    const ctx=`Vision: ${proj.stepData.solution_concept?.vision||"-"}, GTM metrics: ${proj.stepData.gtm?.metrics||"-"}, ICP: ${proj.stepData.gtm?.icp||"-"}`;
    const prompt=`Senior PM creating OKRs for ${q}. Context: ${ctx}\n\nGenerate 3 Objectives with 2-3 measurable Key Results each.\nReturn ONLY JSON: [{"objective":"...","keyResults":["KR with number","KR with number"]}]. No markdown.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],700,apiKey);setOkrs(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{setOkrs([]);}
    setLoading(false);
  };
  const cols=[T.discover,T.understand,T.build];
  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:17,fontWeight:700,color:T.ink}}>🎯 OKR Generator</div><div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Aligned to your product strategy</div></div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {["Q1","Q2","Q3","Q4"].map(qt=><button key={qt} onClick={()=>setQ(qt)} style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,border:`1.5px solid ${q===qt?T.accent:T.border}`,background:q===qt?T.accentSoft:T.bg,color:q===qt?T.accent:T.inkMd,cursor:"pointer",fontFamily:FONT}}>{qt}</button>)}
        <button onClick={generate} disabled={loading} style={{padding:"7px 14px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT,marginLeft:4}}>{loading?"Writing...":"Generate"}</button>
      </div>
    </div>
    {okrs?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      {okrs.map((o,i)=>{const c=cols[i%cols.length];return <div key={i} style={{borderRadius:12,border:`1.5px solid ${c.border}`,overflow:"hidden"}}>
        <div style={{padding:"11px 16px",background:c.bg,display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:c.dot,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{fontSize:14,fontWeight:700,color:c.text}}>{o.objective}</div>
        </div>
        <div style={{padding:"9px 16px",display:"flex",flexDirection:"column",gap:5,background:T.bg}}>
          {o.keyResults?.map((kr,j)=><div key={j} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:c.dot,flexShrink:0,marginTop:5}}/>
            <div style={{fontSize:13,color:T.inkMd,lineHeight:1.55}}>{kr}</div>
          </div>)}
        </div>
      </div>;})}
    </div>}
  </div>;
}

// ─── Stakeholder Map ───────────────────────────────────────────────────────────
function StakeholderMap({proj,onUpdate}){
  const [loading,setLoading]=useState(false);
  const shs=proj.stakeholders;
  const generate=async()=>{
    setLoading(true);
    const ctx=`Product: ${proj.stepData.solution_concept?.vision||"-"}, Market: ${proj.stepData.market_research?.market||"-"}`;
    const prompt=`PM mapping stakeholders for: ${ctx}\n\nIdentify 6-8 stakeholders.\nReturn ONLY JSON: [{"name":"...","role":"...","influence":"High|Low","interest":"High|Low","action":"Manage closely|Keep informed|Keep satisfied|Monitor","commsNote":"..."}]. No markdown.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],700,apiKey);onUpdate(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{onUpdate([]);}
    setLoading(false);
  };
  const quad=(inf,int)=>{if(inf==="High"&&int==="High")return{label:"Manage closely",bg:"#FFF5F7",border:"#FFD6DF",text:"#A03355"};if(inf==="High"&&int==="Low")return{label:"Keep satisfied",bg:"#F3F5FF",border:"#C5CEFF",text:"#2D4A9E"};if(inf==="Low"&&int==="High")return{label:"Keep informed",bg:"#F2FCF6",border:"#B8EDD0",text:"#1A6642"};return{label:"Monitor",bg:T.bgSoft,border:T.border,text:T.inkMd};};
  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div><div style={{fontSize:17,fontWeight:700,color:T.ink}}>🕸️ Stakeholder Map</div><div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Influence × Interest matrix</div></div>
      <button onClick={generate} disabled={loading} style={{padding:"8px 18px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Mapping...":"Generate"}</button>
    </div>
    {shs?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {["Manage closely","Keep satisfied","Keep informed","Monitor"].map(action=>{const group=shs.filter(s=>s.action===action);if(!group.length)return null;const qd=quad(group[0].influence,group[0].interest);return <div key={action} style={{borderRadius:10,border:`1.5px solid ${qd.border}`,overflow:"hidden"}}>
        <div style={{padding:"8px 14px",background:qd.bg,fontSize:11,fontWeight:700,color:qd.text,letterSpacing:"0.05em",textTransform:"uppercase"}}>{action}</div>
        <div style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:7,background:T.bg}}>
          {group.map((s,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:qd.bg,border:`1.5px solid ${qd.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:qd.text,flexShrink:0}}>{(s.name||"?")[0]}</div>
            <div><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{s.name} <span style={{fontSize:11,fontWeight:400,color:T.inkSoft}}>· {s.role}</span></div><div style={{fontSize:12,color:T.inkMd}}>{s.commsNote}</div></div>
          </div>)}
        </div>
      </div>;})}
    </div>}
  </div>;
}

// ─── Interview Guide ───────────────────────────────────────────────────────────
function InterviewGuide({proj}){
  const [loading,setLoading]=useState(false);
  const [guide,setGuide]=useState(null);
  const generate=async()=>{
    setLoading(true);
    const ctx=`Problem: ${proj.stepData.market_research?.problem||"-"}, Customer: ${proj.stepData.market_research?.targetCustomer||"-"}, JTBD: ${proj.stepData.problem_framing?.jtbd||"-"}`;
    const prompt=`UX researcher creating interview guide for: ${ctx}\n\nGenerate: 3 screener questions, 5-min intro script, 8-10 discussion questions, 2-3 closing questions.\nReturn ONLY JSON: {"screener":["q1","q2","q3"],"intro":"...","questions":["q1",...],"closing":["q1","q2"]}. No markdown.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],900,apiKey);setGuide(JSON.parse(raw.replace(/```json?|```/g,"").trim()));}catch{setGuide(null);}
    setLoading(false);
  };
  const copyAll=()=>{if(!guide)return;const txt=`USER INTERVIEW GUIDE\n\nSCREENER\n${guide.screener?.map((q,i)=>`${i+1}. ${q}`).join("\n")}\n\nINTRO\n${guide.intro}\n\nDISCUSSION\n${guide.questions?.map((q,i)=>`${i+1}. ${q}`).join("\n")}\n\nCLOSING\n${guide.closing?.map((q,i)=>`${i+1}. ${q}`).join("\n")}`;navigator.clipboard.writeText(txt);};
  return <div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:17,fontWeight:700,color:T.ink}}>🎤 Interview Guide</div><div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Ready-to-use script for customer conversations</div></div>
      <div style={{display:"flex",gap:8}}>
        {guide&&<button onClick={copyAll} style={{padding:"7px 13px",borderRadius:20,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Copy all</button>}
        <button onClick={generate} disabled={loading} style={{padding:"7px 14px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Writing...":"Generate"}</button>
      </div>
    </div>
    {guide&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      {[{title:"Screener",icon:"🔍",items:guide.screener,c:T.discover},{title:"Discussion",icon:"💬",items:guide.questions,c:T.understand},{title:"Closing",icon:"🏁",items:guide.closing,c:T.build}].map(sec=><div key={sec.title} style={{borderRadius:10,border:`1.5px solid ${sec.c.border}`,overflow:"hidden"}}>
        <div style={{padding:"9px 14px",background:sec.c.bg,fontSize:12,fontWeight:700,color:sec.c.text}}>{sec.icon} {sec.title}</div>
        <div style={{padding:"10px 14px",background:T.bg,display:"flex",flexDirection:"column",gap:7}}>
          {sec.items?.map((qt,i)=><div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
            <div style={{width:19,height:19,borderRadius:"50%",background:sec.c.bg,border:`1px solid ${sec.c.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:sec.c.text,flexShrink:0}}>{i+1}</div>
            <div style={{fontSize:13,color:T.inkMd,lineHeight:1.55}}>{qt}</div>
          </div>)}
          {sec.title==="Screener"&&guide.intro&&<div style={{marginTop:5,padding:"9px 12px",borderRadius:8,background:T.bgSoft,fontSize:12,color:T.inkMd,fontStyle:"italic",lineHeight:1.6}}><strong>Intro:</strong> {guide.intro}</div>}
        </div>
      </div>)}
    </div>}
  </div>;
}

// ─── Sprint Planning ───────────────────────────────────────────────────────────
const TICKET_STATUSES=["todo","in_progress","blocked","done"];
const STATUS_META={
  todo:{label:"To do",bg:T.bgMuted,text:T.inkMd},
  in_progress:{label:"In progress",bg:"#F3F5FF",text:"#2D4A9E"},
  blocked:{label:"Blocked",bg:"#FFF5F7",text:"#A03355"},
  done:{label:"Done",bg:"#F2FCF6",text:"#1A6642"},
};

function StandupSummary({sprints}){
  const [loading,setLoading]=useState(false);
  const [summary,setSummary]=useState(null);
  const allTickets=(sprints||[]).flatMap(sp=>(sp.tickets||[]).map(t=>({...t,sprint:sp.sprint})));
  const done=allTickets.filter(t=>t.status==="done");
  const blocked=allTickets.filter(t=>t.status==="blocked");
  const inProgress=allTickets.filter(t=>t.status==="in_progress");

  const generate=async()=>{
    setLoading(true);
    const prompt=`Write a concise standup update from this sprint state.\nShipped/done: ${done.map(t=>t.title).join("; ")||"none"}\nIn progress: ${inProgress.map(t=>t.title).join("; ")||"none"}\nBlocked: ${blocked.map(t=>t.title).join("; ")||"none"}\n\nFormat as plain text, 3 short sections: "Shipped", "In progress", "Blocked" — each with brief bullet-style lines (use • not markdown). Keep it tight, like something pasted into Slack. No preamble.`;
    try{const raw=await callClaude([{role:"user",content:prompt}],500,apiKey);setSummary(raw.trim());}catch{setSummary(null);}
    setLoading(false);
  };
  const copy=()=>{if(summary)navigator.clipboard.writeText(summary);};

  if(!allTickets.length)return null;

  return <div style={{marginTop:14,padding:"16px 18px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bgSoft}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:14,fontWeight:700,color:T.ink}}>💬 Standup summary</div>
        <div style={{fontSize:11,color:T.inkSoft,marginTop:1}}>{done.length} done · {inProgress.length} in progress · {blocked.length} blocked</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {summary&&<button onClick={copy} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Copy</button>}
        <button onClick={generate} disabled={loading} style={{padding:"5px 13px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Writing...":"Generate"}</button>
      </div>
    </div>
    {summary&&<pre style={{fontSize:13,lineHeight:1.7,color:T.inkMd,background:T.bg,padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,whiteSpace:"pre-wrap",fontFamily:FONT,margin:0}}>{summary}</pre>}
  </div>;
}

function SprintPlanning({proj,onUpdateSprints}){
  const [loading,setLoading]=useState(false);
  const [vel,setVel]=useState(20);
  const sprints=proj.sprints;
  const generate=async()=>{
    setLoading(true);
    const ctx=`P0: ${proj.stepData.prd?.p0||proj.stepData.prd?.features||"-"}, P1: ${proj.stepData.prd?.p1||"-"}, P2: ${proj.stepData.prd?.p2||"-"}`;
    const prompt=`PM sprint planning, velocity ${vel} pts/sprint. Features:\n${ctx}\n\nBreak into 2-week sprints (3-4 sprints). Each sprint: 3-5 tickets with story points.\nReturn ONLY JSON: [{"sprint":1,"goal":"...","tickets":[{"title":"...","points":3,"type":"feat|fix|chore","priority":"P0|P1|P2"}]}]. No markdown.`;
    try{
      const raw=await callClaude([{role:"user",content:prompt}],900,apiKey);
      const parsed=JSON.parse(raw.replace(/```json?|```/g,"").trim());
      const withStatus=parsed.map(sp=>({...sp,tickets:(sp.tickets||[]).map(t=>({...t,status:"todo"}))}));
      onUpdateSprints(withStatus);
    }catch{onUpdateSprints([]);}
    setLoading(false);
  };
  const cycleStatus=(spIdx,tIdx)=>{
    const next=sprints.map((sp,i)=>i!==spIdx?sp:{...sp,tickets:sp.tickets.map((t,j)=>{if(j!==tIdx)return t;const curIdx=TICKET_STATUSES.indexOf(t.status||"todo");return{...t,status:TICKET_STATUSES[(curIdx+1)%TICKET_STATUSES.length]};})});
    onUpdateSprints(next);
  };
  const tc={feat:"#F3F5FF",fix:"#FFF5F7",chore:T.bgMuted};const tt={feat:"#2D4A9E",fix:"#A03355",chore:T.inkMd};
  return <div style={{padding:"20px 24px",maxWidth:720,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:17,fontWeight:700,color:T.ink}}>🗓️ Sprint Planning</div><div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>2-week sprints from your PRD · click a status pill to update it</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:11,color:T.inkSoft}}>Velocity:</span><input type="number" value={vel} onChange={e=>setVel(+e.target.value)} min={5} max={100} style={{width:50,padding:"4px 7px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:FONT,color:T.ink,background:T.bg,outline:"none"}}/><span style={{fontSize:10,color:T.inkSoft}}>pts</span></div>
        <button onClick={generate} disabled={loading} style={{padding:"7px 14px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,fontFamily:FONT}}>{loading?"Planning...":sprints?.length>0?"Regenerate":"Generate"}</button>
      </div>
    </div>
    {sprints?.length>0&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      {sprints.map((sp,i)=>{const tot=sp.tickets?.reduce((s,t)=>s+(t.points||0),0)||0;const c=[T.discover,T.understand,T.build,T.grow][i%4];return <div key={i} style={{borderRadius:12,border:`1.5px solid ${c.border}`,overflow:"hidden"}}>
        <div style={{padding:"9px 16px",background:c.bg,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:13,fontWeight:700,color:c.text}}>Sprint {sp.sprint}</div><div style={{fontSize:12,color:c.text,opacity:0.75}}>{sp.goal}</div></div>
          <div style={{fontSize:12,fontWeight:600,color:c.text}}>{tot}/{vel} pts</div>
        </div>
        <div style={{padding:"7px 12px",background:T.bg,display:"flex",flexDirection:"column",gap:4}}>
          {sp.tickets?.map((t,j)=>{const sm=STATUS_META[t.status||"todo"];return <div key={j} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bgSoft}}>
            <span style={{fontSize:10,padding:"2px 6px",borderRadius:5,background:tc[t.type]||T.bgMuted,color:tt[t.type]||T.inkMd,fontWeight:700}}>{t.type}</span>
            <span style={{flex:1,fontSize:13,color:T.inkMd,textDecoration:t.status==="done"?"line-through":"none",opacity:t.status==="done"?0.6:1}}>{t.title}</span>
            <span style={{fontSize:10,padding:"2px 6px",borderRadius:5,background:T.bgMuted,color:T.inkSoft,fontWeight:600}}>{t.priority}</span>
            <span style={{fontSize:12,fontWeight:700,color:c.text,minWidth:26,textAlign:"right"}}>{t.points}p</span>
            <button onClick={()=>cycleStatus(i,j)} style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:sm.bg,color:sm.text,border:"none",cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{sm.label}</button>
          </div>;})}
        </div>
      </div>;})}
    </div>}
    {sprints?.length>0&&<StandupSummary sprints={sprints}/>}
    {sprints?.length>0&&<JiraLinearPush sprints={sprints}/>}
  </div>;
}
const NB=["#FFF5F7","#F3F5FF","#F2FCF6","#F9F3FF","#FFF9F0","#F0FAFB"];
const NBo=["#FFD6DF","#C5CEFF","#B8EDD0","#DCC5F5","#FFE5B8","#B8E8F0"];
const NT=["#A03355","#2D4A9E","#1A6642","#5C2D91","#7C4A0A","#0A5C6A"];
const NOTE_ROTATE=[-2.5,1.5,-1,2,-1.5,1];
const SCRIBBLE_FONT='"Gaegu","Hi Melody","Pretendard",cursive';

function TeamNotesPanel({notes,onAdd,onDelete,onInject,injectedIds,collapsed,onToggle}){
  const [author,setAuthor]=useState("");const [text,setText]=useState("");
  const handleAdd=()=>{if(!text.trim())return;onAdd({id:Date.now(),author:author.trim()||"Teammate",text:text.trim(),ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});setText("");};

  if(collapsed)return <div style={{width:36,flexShrink:0,borderLeft:`1px solid ${T.border}`,background:"repeating-linear-gradient(180deg,#FFFDF8,#FFFDF8 27px,#FFE8EE 27px,#FFE8EE 28px)",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,cursor:"pointer"}} onClick={onToggle}>
    <div style={{fontSize:13,color:"#C47090",writingMode:"vertical-rl",transform:"rotate(180deg)",letterSpacing:"0.05em",fontWeight:700,marginTop:8,fontFamily:SCRIBBLE_FONT}}>✎ team notes</div>
    {notes.length>0&&<div style={{marginTop:10,width:20,height:20,borderRadius:"50%",background:T.accent,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff",boxShadow:"0 1px 4px rgba(232,99,122,0.4)"}}>{notes.length}</div>}
  </div>;

  return <div style={{width:280,flexShrink:0,borderLeft:`1px solid ${T.border}`,background:"linear-gradient(180deg,#FFFDF8,#FFFBF3)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* Spiral-bound notepad header */}
    <div style={{padding:"14px 16px 12px",borderBottom:`2px dashed #FFD6DF`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FFF0F4",position:"relative"}}>
      {/* spiral binding dots */}
      <div style={{position:"absolute",top:6,left:0,right:0,display:"flex",justifyContent:"space-evenly",padding:"0 20px"}}>
        {[...Array(8)].map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#fff",border:"1.5px solid #F0A0AE"}}/>)}
      </div>
      <div style={{marginTop:10}}>
        <div style={{fontSize:17,fontWeight:700,color:"#A03355",fontFamily:SCRIBBLE_FONT}}>✎ Team notes</div>
        <div style={{fontSize:11,color:"#C47090",marginTop:1,fontFamily:FONT}}>Anyone scribbles · PM sends to agent</div>
      </div>
      <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#C47090",marginTop:8}}>›</button>
    </div>

    {/* Ruled notepad body — handwritten scribble cards scattered like real sticky notes */}
    <div style={{flex:1,overflowY:"auto",padding:"16px 14px",
      backgroundImage:"repeating-linear-gradient(transparent,transparent 26px,#FFD6DF55 26px,#FFD6DF55 27px), linear-gradient(90deg,transparent 18px,#FFB8CB33 18px,#FFB8CB33 19px,transparent 19px)",
      backgroundSize:"100% 27px, 100% 100%",backgroundPosition:"0 8px, 0 0"}}>
      {notes.length===0&&<div style={{fontSize:14,color:"#C47090",lineHeight:2,paddingTop:6,opacity:0.85,fontFamily:SCRIBBLE_FONT,textAlign:"center"}}>✦ nothing scribbled yet ✦<br/><span style={{fontSize:12,fontFamily:FONT}}>Teammates can jot ideas here while the PM chats</span></div>}

      {notes.map((note,i)=>{
        const ci=i%NB.length;
        const rot=NOTE_ROTATE[i%NOTE_ROTATE.length];
        const inj=injectedIds.has(note.id);
        return <div key={note.id}
          style={{marginBottom:18,borderRadius:"3px 14px 4px 13px / 13px 4px 14px 3px",background:NB[ci],
            border:`2px solid ${NBo[ci]}`,boxShadow:`2px 4px 0 ${NBo[ci]}aa, 0 2px 8px rgba(0,0,0,0.06)`,
            position:"relative",transform:`rotate(${rot}deg)`,transition:"transform 0.2s, box-shadow 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform=`rotate(0deg) translateY(-3px)`;e.currentTarget.style.boxShadow=`3px 6px 0 ${NBo[ci]}aa, 0 6px 14px rgba(0,0,0,0.1)`;}}
          onMouseLeave={e=>{e.currentTarget.style.transform=`rotate(${rot}deg)`;e.currentTarget.style.boxShadow=`2px 4px 0 ${NBo[ci]}aa, 0 2px 8px rgba(0,0,0,0.06)`;}}>
          {/* washi tape strip, slightly crooked */}
          <div style={{position:"absolute",top:-10,left:"50%",transform:`translateX(-50%) rotate(${-rot*0.6}deg)`,width:46,height:18,borderRadius:2,
            background:`repeating-linear-gradient(45deg, ${NBo[ci]}cc, ${NBo[ci]}cc 4px, ${NBo[ci]}88 4px, ${NBo[ci]}88 8px)`,
            border:`1px solid ${NBo[ci]}`,opacity:0.9}}/>
          {/* pushpin dot accent on alternating notes */}
          {i%3===0&&<div style={{position:"absolute",top:6,right:10,width:8,height:8,borderRadius:"50%",background:NT[ci],opacity:0.5}}/>}
          <div style={{padding:"18px 14px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
              <span style={{fontSize:14,fontWeight:700,color:NT[ci],fontFamily:SCRIBBLE_FONT}}>{note.author}</span>
              <span style={{fontSize:10,color:NT[ci],opacity:0.5,fontFamily:FONT}}>{note.ts}</span>
            </div>
            <div style={{fontSize:14.5,color:NT[ci],lineHeight:1.6,marginBottom:11,fontFamily:SCRIBBLE_FONT}}>{note.text}</div>
            <div style={{display:"flex",gap:5}}>
              <button onClick={()=>!inj&&onInject(note)} style={{flex:1,padding:"5px 0",borderRadius:20,fontSize:11,fontWeight:600,border:`1.5px solid ${NBo[ci]}`,background:inj?NT[ci]:"transparent",color:inj?NB[ci]:NT[ci],cursor:inj?"default":"pointer",fontFamily:FONT,transition:"all 0.15s"}}>{inj?"✓ Sent":"↑ Send to agent"}</button>
              <button onClick={()=>onDelete(note.id)} style={{padding:"5px 9px",borderRadius:20,fontSize:11,border:`1.5px solid ${NBo[ci]}`,background:"transparent",color:NT[ci],cursor:"pointer",fontFamily:FONT}}>✕</button>
            </div>
          </div>
        </div>;
      })}
    </div>
    {/* Write a new note — torn paper scrap style */}
    <div style={{padding:"12px 14px",borderTop:`2px dashed #FFD6DF`,background:"#FFF0F4",flexShrink:0}}>
      <div style={{fontSize:11,fontWeight:700,color:"#A03355",marginBottom:7,fontFamily:SCRIBBLE_FONT,letterSpacing:"0.02em"}}>✎ jot something down</div>
      <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Your name"
        style={{width:"100%",padding:"6px 11px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:SCRIBBLE_FONT,boxSizing:"border-box",marginBottom:6}}/>
      <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)handleAdd();}}
        placeholder="Your idea... (Ctrl+Enter)" rows={2}
        style={{width:"100%",padding:"6px 11px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:13.5,background:T.bg,color:T.ink,outline:"none",resize:"none",fontFamily:SCRIBBLE_FONT,boxSizing:"border-box",lineHeight:1.5}}/>
      <button onClick={handleAdd} disabled={!text.trim()} style={{width:"100%",marginTop:7,padding:"8px",borderRadius:20,border:"none",background:"#E8637A",color:"#fff",fontSize:13,fontWeight:700,cursor:text.trim()?"pointer":"not-allowed",opacity:text.trim()?1:0.5,fontFamily:SCRIBBLE_FONT,boxShadow:text.trim()?"0 2px 8px rgba(232,99,122,0.35)":"none"}}>✦ stick it up</button>
    </div>
  </div>;
}

// ─── Project sidebar item ──────────────────────────────────────────────────────
function ProjectItem({project,isActive,onClick,onRename,onDelete,isOnly}){
  const [ed,setEd]=useState(false);const [draft,setDraft]=useState(project.name);const ref=useRef(null);
  useEffect(()=>{if(ed)ref.current?.focus();},[ed]);
  const commit=()=>{setEd(false);const t=draft.trim();if(t)onRename(t);else setDraft(project.name);};
  const done=Object.keys(project.completedSteps).length;const pct=Math.round((done/STEPS.length)*100);
  return <div onClick={onClick} style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,transition:"background 0.12s",background:isActive?"#fff":"transparent",border:isActive?`1px solid ${T.border}`:"1px solid transparent",boxShadow:isActive?"0 1px 3px rgba(0,0,0,0.06)":"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
      <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:done===STEPS.length?"#10B981":isActive?T.accent:T.borderMd}}/>
      {ed?<input ref={ref} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setEd(false);setDraft(project.name);}}} onClick={e=>e.stopPropagation()} style={{flex:1,fontSize:13,fontWeight:500,border:"none",borderBottom:`1.5px solid ${T.accent}`,background:"transparent",outline:"none",color:T.ink,padding:"1px 0"}}/>
      :<div onDoubleClick={e=>{e.stopPropagation();setEd(true);setDraft(project.name);}} style={{flex:1,fontSize:13,fontWeight:isActive?600:400,color:isActive?T.ink:T.inkMd,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{project.name}</div>}
      {!isOnly&&<button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.inkSoft,opacity:isActive?1:0,transition:"opacity 0.12s",padding:"1px 3px",lineHeight:1,flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color="#E24B4A"} onMouseLeave={e=>e.currentTarget.style.color=T.inkSoft}>✕</button>}
    </div>
    <div style={{height:2,borderRadius:2,background:T.bgMuted,overflow:"hidden",marginLeft:12}}><div style={{height:"100%",width:`${pct}%`,background:done===STEPS.length?"#10B981":T.accentMd,borderRadius:2,transition:"width 0.3s"}}/></div>
    <div style={{fontSize:10,color:T.inkSoft,marginLeft:12,marginTop:2}}>{done===0?"Not started":done===STEPS.length?"Complete":pct+"% done"}{project.template&&project.template!=="blank"?` · ${project.template.replace("_"," ")}`:""}</div>
  </div>;
}

// ─── Template Picker ───────────────────────────────────────────────────────────
function TemplatePicker({onSelect}){
  const [hov,setHov]=useState(null);
  return <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:16,maxWidth:480,margin:"0 auto"}}>
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>✦</div>
      <div style={{fontSize:18,fontWeight:700,color:T.ink,letterSpacing:"-0.02em",marginBottom:4}}>Start a new project</div>
      <div style={{fontSize:13,color:T.inkSoft}}>Pick a template to pre-configure the agent</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {TEMPLATES.map(tmpl=><button key={tmpl.id} onClick={()=>onSelect(tmpl.id)} onMouseEnter={()=>setHov(tmpl.id)} onMouseLeave={()=>setHov(null)}
        style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${hov===tmpl.id?T.accent:T.border}`,background:hov===tmpl.id?T.accentSoft:T.bg,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.15s"}}>
        <div style={{fontSize:20,marginBottom:6}}>{tmpl.icon}</div>
        <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:2}}>{tmpl.label}</div>
        <div style={{fontSize:11.5,color:T.inkSoft}}>{tmpl.desc}</div>
      </button>)}
    </div>
  </div>;
}

// ─── Final Brief ───────────────────────────────────────────────────────────────
function FinalBrief({proj,onClose,onUpdateSprints,onSetNorthStar,onToggleChecklist,onUpdateStakeholders,onAddDecision,onDeleteDecision,onAddSnapshot,onDeleteSnapshot}){
  const [shareMode,setShareMode]=useState(null);const [emailTo,setEmailTo]=useState("");const [slackHook,setSlackHook]=useState("");const [sending,setSending]=useState(false);const [sent,setSent]=useState(null);const [tab,setTab]=useState("brief");
  const secs=[{id:"brainstorm",label:"Brainstorm",fields:["coreIdea","anglesExplored","promisingDirection","teamContributions"]},{id:"market_research",label:"Market Research",fields:["problem","targetCustomer","market","competitors"]},{id:"opportunity_sizing",label:"Opportunity Sizing",fields:["tam","sam","som","revenuePotential"]},{id:"problem_framing",label:"Problem Framing",fields:["jtbd","painPoints","alternatives","whyNow"]},{id:"solution_concept",label:"Solution & Concept",fields:["vision","valueProp","mvpFeatures","differentiator"]},{id:"wireframe",label:"Wireframe",fields:["keyScreens","primaryFlow","navStructure","uxRisks","suggestedAdditions"]},{id:"prd",label:"PRD",fields:["summary","goals","features","p0","p1","p2"]},{id:"prototype",label:"Prototype",fields:["scope","keyScreens","fidelity"]},{id:"prototype_review",label:"Prototype Review",fields:["summary","droppedFeatures","newInsights","revisedFeatures"]},{id:"gtm",label:"GTM Strategy",fields:["icp","positioning","channels","pricing","metrics","launchPlan"]}];
  const rev=proj.stepData.prototype_review;const rSecs=new Set();if(rev?.changesFound){if(rev.revisedVision)rSecs.add("solution_concept");if(rev.revisedPrdFeatures)rSecs.add("prd");}
  const getData=(sid)=>{const b=proj.stepData[sid];if(!b||!rev?.changesFound)return b;if(sid==="solution_concept")return{...b,...(rev.revisedVision?{vision:rev.revisedVision}:{}),...(rev.revisedFeatures?{mvpFeatures:rev.revisedFeatures}:{})};if(sid==="prd")return{...b,...(rev.revisedPrdFeatures?{features:rev.revisedPrdFeatures}:{})};return b;};
  const buildText=()=>{let o=`PRODUCT BRIEF — ${proj.name}\n${new Date().toLocaleDateString()}\n${"─".repeat(50)}\n\n`;secs.forEach(s=>{const d=getData(s.id);if(!d)return;o+=`${s.label.toUpperCase()}${rSecs.has(s.id)?" [REVISED]":""}\n${"-".repeat(30)}\n`;s.fields.forEach(f=>{if(d[f])o+=`${f.replace(/([A-Z])/g," $1").trim()}: ${Array.isArray(d[f])?d[f].join(", "):d[f]}\n`;});o+="\n";});return o;};
  const printPDF=()=>{const s=document.createElement("style");s.innerHTML=`@media print{body *{visibility:hidden!important}#brief-print,#brief-print *{visibility:visible!important}#brief-print{position:fixed;top:0;left:0;width:100%;padding:24px}}`;document.head.appendChild(s);window.print();document.head.removeChild(s);};
  const sendEmail=()=>{window.open(`mailto:${emailTo}?subject=${encodeURIComponent("Product Brief: "+proj.name)}&body=${encodeURIComponent(buildText())}`);setSent("email");};
  const sendSlack=async()=>{if(!slackHook.startsWith("https://hooks.slack.com")){setSent("slack_err");return;}setSending(true);try{await fetch(slackHook,{method:"POST",body:JSON.stringify({text:`*Product Brief: ${proj.name}*\n\`\`\`${buildText().substring(0,2800)}\`\`\``})});setSent("slack");}catch{setSent("slack_err");}setSending(false);};
  const tabs=[{id:"brief",label:"Brief"},{id:"risks",label:"Risk Register"},{id:"okrs",label:"OKRs"},{id:"stakeholders",label:"Stakeholders"},{id:"sprints",label:"Sprint Plan"},{id:"interviews",label:"Interview Guide"},{id:"scope",label:"Scope & Metrics"},{id:"launch",label:"Launch Checklist"},{id:"exec",label:"Exec Summary"},{id:"decisions",label:"Decision Log"},{id:"rehearsal",label:"Objection Rehearsal"},{id:"battlecard",label:"Sales Battlecard"},{id:"postlaunch",label:"Post-Launch Metrics"},{id:"versions",label:"Version History"}];
  return <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bgSoft}}>
    <div style={{display:"flex",gap:2,padding:"0 20px",borderBottom:`1px solid ${T.border}`,background:T.bg,flexShrink:0,overflowX:"auto"}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",border:"none",borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",background:"transparent",color:tab===t.id?T.accent:T.inkSoft,fontSize:12.5,fontWeight:tab===t.id?600:400,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>{t.label}</button>)}
      <button onClick={onClose} style={{marginLeft:"auto",padding:"10px 14px",border:"none",background:"transparent",color:T.inkSoft,fontSize:12,cursor:"pointer",fontFamily:FONT,flexShrink:0}}>✕</button>
    </div>
    <div style={{flex:1,overflowY:"auto"}}>
      {tab==="risks"&&<RiskRegister proj={proj}/>}
      {tab==="okrs"&&<OKRGenerator proj={proj}/>}
      {tab==="stakeholders"&&<StakeholderMap proj={proj} onUpdate={onUpdateStakeholders}/>}
      {tab==="sprints"&&<SprintPlanning proj={proj} onUpdateSprints={onUpdateSprints}/>}
      {tab==="interviews"&&<InterviewGuide proj={proj}/>}
      {tab==="versions"&&<VersionHistory proj={proj}/>}
      {tab==="scope"&&<div style={{padding:"20px 24px",maxWidth:680,margin:"0 auto"}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:17,fontWeight:700,color:T.ink}}>📐 Scope & metric consistency</div>
          <div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>Catch drift before it becomes a crisis</div>
        </div>
        <NorthStarMetric proj={proj} onSet={onSetNorthStar}/>
        <MetricConsistencyCheck proj={proj}/>
        <div style={{height:14}}/>
        <ScopeCreepTracker proj={proj}/>
      </div>}
      {tab==="launch"&&<LaunchChecklist proj={proj} checklistState={proj.checklistState||{}} onToggle={onToggleChecklist}/>}
      {tab==="exec"&&<ExecSummary proj={proj}/>}
      {tab==="decisions"&&<DecisionLogPanel proj={proj} onAddDecision={onAddDecision} onDeleteDecision={onDeleteDecision}/>}
      {tab==="rehearsal"&&<ObjectionRehearsal proj={proj}/>}
      {tab==="battlecard"&&<SalesBattlecard proj={proj}/>}
      {tab==="postlaunch"&&<PostLaunchMetrics proj={proj} onAddSnapshot={onAddSnapshot} onDeleteSnapshot={onDeleteSnapshot}/>}
      {tab==="brief"&&<div style={{maxWidth:680,margin:"0 auto",padding:"20px 24px 48px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div><div style={{fontSize:20,fontWeight:700,color:T.ink,letterSpacing:"-0.02em"}}>{proj.name}</div><div style={{fontSize:12,color:T.inkSoft,marginTop:2}}>{new Date().toLocaleDateString()}{proj.template&&proj.template!=="blank"?` · ${proj.template.replace("_"," ")} template`:""}</div></div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18,padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.bg}}>
          <button onClick={printPDF} style={{padding:"7px 16px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Download PDF</button>
          <button onClick={()=>setShareMode(shareMode==="email"?null:"email")} style={{padding:"7px 16px",borderRadius:6,border:`1px solid ${T.border}`,background:shareMode==="email"?T.accentSoft:T.bg,color:shareMode==="email"?T.accent:T.inkMd,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FONT}}>Email</button>
          <button onClick={()=>setShareMode(shareMode==="slack"?null:"slack")} style={{padding:"7px 16px",borderRadius:6,border:`1px solid ${T.border}`,background:shareMode==="slack"?T.accentSoft:T.bg,color:shareMode==="slack"?T.accent:T.inkMd,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FONT}}>Slack</button>
        </div>
        {shareMode==="email"&&<div style={{marginBottom:12,padding:"12px 14px",borderRadius:8,border:`1px solid ${T.accentMd}`,background:T.accentSoft,display:"flex",gap:8}}>
          <input value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="teammate@company.com" style={{flex:1,padding:"7px 11px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
          <button onClick={sendEmail} style={{padding:"7px 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Open Mail</button>
        </div>}
        {shareMode==="slack"&&<div style={{marginBottom:12,padding:"12px 14px",borderRadius:8,border:`1px solid ${T.accentMd}`,background:T.accentSoft,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:12,color:T.inkMd}}>Paste your Slack Incoming Webhook URL</div>
          <div style={{display:"flex",gap:8}}><input value={slackHook} onChange={e=>setSlackHook(e.target.value)} placeholder="https://hooks.slack.com/services/..." style={{flex:1,padding:"7px 11px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/><button onClick={sendSlack} disabled={sending} style={{padding:"7px 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT,opacity:sending?0.6:1}}>{sending?"Sending…":"Send"}</button></div>
          {sent==="slack"&&<div style={{fontSize:12,color:"#1A6642"}}>Sent ✓</div>}
          {sent==="slack_err"&&<div style={{fontSize:12,color:"#A03355"}}>Check webhook URL</div>}
        </div>}
        <div id="brief-print">
          {secs.map(s=>{const d=getData(s.id);if(!d)return null;const step=STEPS.find(x=>x.id===s.id);const p=T[step?.phaseKey||"discover"];const rev2=rSecs.has(s.id);
          return <div key={s.id} style={{marginBottom:12,borderRadius:10,border:`1px solid ${rev2?"#F59E0B":T.border}`,overflow:"hidden",background:T.bg}}>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,background:p.bg,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:15}}>{step?.icon}</span><span style={{fontSize:14,fontWeight:700,color:p.text}}>{s.label}</span>
              <span style={{fontSize:10,padding:"1px 8px",borderRadius:10,background:T.bg,color:p.text,border:`1px solid ${p.border}`,fontWeight:500}}>{step?.phase}</span>
              {rev2&&<span style={{marginLeft:"auto",fontSize:10,padding:"1px 8px",borderRadius:10,background:"#FEF3C7",color:"#78350F",border:"1px solid #FDE68A",fontWeight:600}}>Revised after prototype</span>}
              {s.id==="wireframe"&&proj.figmaLinks?.wireframe&&<a href={proj.figmaLinks.wireframe} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:11,color:T.accent,fontWeight:500}}>Figma ↗</a>}
            </div>
            <div style={{padding:"12px 16px"}}>
              {s.id==="prototype"&&d.claudeCodePrompt&&<PrototypeTools data={d}/>}
              {s.id==="problem_framing"&&d.personas&&<PersonaCards personas={d.personas}/>}
              {s.id==="prd"&&<PrioritizationMatrix data={d}/>}
              {s.fields.filter(f=>d[f]&&f!=="personas").map(f=><div key={f} style={{marginBottom:7,paddingBottom:7,borderBottom:`1px solid ${T.bgMuted}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{f.replace(/([A-Z])/g," $1").trim()}</div>
                <div style={{fontSize:13.5,color:T.inkMd,lineHeight:1.65}}>{Array.isArray(d[f])?d[f].join(" · "):String(d[f])}</div>
              </div>)}
            </div>
          </div>;})}
        </div>
      </div>}
    </div>
  </div>;
}

// ─── API Key Gate ──────────────────────────────────────────────────────────────
function APIKeyGate({onSubmit}){
  const [key,setKey]=useState("");
  const [error,setError]=useState("");
  const [testing,setTesting]=useState(false);

  const submit=async()=>{
    if(!key.trim().startsWith("sk-ant-")){setError("That doesn't look like an Anthropic API key — it should start with sk-ant-");return;}
    setTesting(true);setError("");
    try{
      await callClaude([{role:"user",content:"Hi"}],10,key.trim());
      onSubmit(key.trim());
    }catch(e){
      setError("Key didn't work: "+e.message+". Check it's correct and has credit.");
    }
    setTesting(false);
  };

  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg,fontFamily:FONT}}>
    <div style={{width:420,padding:"36px 40px",borderRadius:20,border:`1.5px solid ${T.border}`,background:T.bg,boxShadow:"0 8px 32px rgba(0,0,0,0.08)"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{width:48,height:48,borderRadius:14,background:T.accentSoft,border:`1.5px solid ${T.accentMd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 14px"}}>✦</div>
        <div style={{fontSize:20,fontWeight:700,color:T.ink,letterSpacing:"-0.02em",marginBottom:6}}>PM Agent</div>
        <div style={{fontSize:13,color:T.inkSoft,lineHeight:1.6}}>Enter your Anthropic API key to get started.<br/>Your key stays in your browser — it's never stored or shared.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <input type="password" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit();}}
          placeholder="sk-ant-api03-..."
          style={{padding:"11px 14px",borderRadius:10,border:`1.5px solid ${error?T.accent:T.border}`,fontSize:14,background:T.bgSoft,color:T.ink,outline:"none",fontFamily:FONT,letterSpacing:"0.02em"}}
          onFocus={e=>e.target.style.borderColor=T.accentMd} onBlur={e=>e.target.style.borderColor=error?T.accent:T.border}/>
        {error&&<div style={{fontSize:12,color:T.accent,lineHeight:1.5}}>{error}</div>}
        <button onClick={submit} disabled={testing||!key.trim()} style={{padding:"11px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:14,fontWeight:600,cursor:testing||!key.trim()?"not-allowed":"pointer",opacity:testing||!key.trim()?0.5:1,fontFamily:FONT,boxShadow:"0 2px 8px rgba(232,99,122,0.3)"}}>
          {testing?"Checking key...":"Start building →"}
        </button>
      </div>
      <div style={{marginTop:18,padding:"12px 14px",borderRadius:10,background:T.bgSoft,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:11.5,color:T.inkSoft,lineHeight:1.7}}>
          🔑 Get a key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{color:T.accent,fontWeight:600,textDecoration:"none"}}>console.anthropic.com</a><br/>
          💳 Requires Anthropic credit (not a Claude.ai subscription)<br/>
          🔒 Key is never sent anywhere except directly to Anthropic
        </div>
      </div>
    </div>
  </div>;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const STORAGE_KEY="pm_agent_projects_v1";

export default function PMAgent(){
  const [apiKey,setApiKey]=useState("");
  const [projects,setProjects]=useState([]);
  const [activeId,setActiveId]=useState(null);
  const [showTpl,setShowTpl]=useState(true);
  const [input,setInput]=useState("");
  const [attachments,setAttachments]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showBrief,setShowBrief]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [notesPanelCollapsed,setNPC]=useState(false);
  const [wrapupState,setWrapupState]=useState({});
  const [figmaInput,setFigmaInput]=useState("");
  const [injectedNoteIds,setINI]=useState(new Set());
  const [darkMode,setDarkMode]=useState(false);
  const [storageLoaded,setStorageLoaded]=useState(false);
  const [showDigest,setShowDigest]=useState(false);
  const [saveStatus,setSaveStatus]=useState("idle");
  const bottomRef=useRef(null);const fileInputRef=useRef(null);
  const saveTimerRef=useRef(null);

  // Load saved projects on mount
  useEffect(()=>{
    (async()=>{
      try{
        const res=await window.storage?.get(STORAGE_KEY,false);
        if(res?.value){
          const saved=JSON.parse(res.value);
          if(Array.isArray(saved)&&saved.length>0){
            setProjects(saved);
            setActiveId(saved[0].id);
            setShowTpl(false);
          }
        }
      }catch(e){/* no saved data yet — fine */}
      setStorageLoaded(true);
    })();
  },[]);

  // Debounced autosave whenever projects change
  useEffect(()=>{
    if(!storageLoaded)return;
    if(saveTimerRef.current)clearTimeout(saveTimerRef.current);
    setSaveStatus("pending");
    saveTimerRef.current=setTimeout(async()=>{
      try{
        await window.storage?.set(STORAGE_KEY,JSON.stringify(projects),false);
        setSaveStatus("saved");
        setTimeout(()=>setSaveStatus("idle"),1500);
      }catch(e){setSaveStatus("error");}
    },800);
    return()=>clearTimeout(saveTimerRef.current);
  },[projects,storageLoaded]);

  const clearAllData=async()=>{
    try{await window.storage?.delete(STORAGE_KEY,false);}catch{}
    setProjects([]);setActiveId(null);setShowTpl(true);
  };

  const proj=projects.find(p=>p.id===activeId)||null;
  const step=proj?displayStep(STEPS[proj.currentStep],proj.template):STEPS[0];
  const stepConvo=proj?.conversations[step.id]||[];
  const isStepDone=!!(proj?.completedSteps[step.id]);
  const allDone=proj?STEPS.every(s=>proj.completedSteps[s.id]):false;
  const briefUnlocked=proj?Object.keys(proj.completedSteps).length>=4||allDone:false;
  const isInWrapup=proj?wrapupState[`${proj.id}_${step.id}`]==="pending":false;
  const p=T[step.phaseKey]||T.discover;
  const nextStep=proj?STEPS[proj.currentStep+1]:null;
  const mCtx=stepConvo.length===0&&proj?missingCtx(step.id,proj.stepData):[];
  const wfRev=(proj?.conversations.wireframe||[]).filter(m=>m.role==="user"&&m.attachments?.some(a=>a.mediaType?.startsWith("image/"))).length;

  const upd=(id,fn)=>setProjects(ps=>ps.map(p=>p.id===id?{...p,...fn(p)}:p));
  const createProj=(tmpl)=>{const n=mkProj(`Project ${projects.length+1}`,tmpl);setProjects(ps=>[...ps,n]);setActiveId(n.id);setShowTpl(false);setInput("");setAttachments([]);setShowBrief(false);};
  const delProj=(id)=>{if(projects.length===1)return;const rest=projects.filter(p=>p.id!==id);setProjects(rest);if(activeId===id){setActiveId(rest[rest.length-1].id);setShowTpl(false);}};
  const swProj=(id)=>{setActiveId(id);setInput("");setAttachments([]);setShowBrief(false);setShowTpl(false);};
  const goStep=(idx)=>{if(!proj)return;upd(proj.id,p=>({...p,currentStep:idx}));setShowBrief(false);};
  const dismissW=()=>setWrapupState(w=>({...w,[`${proj.id}_${step.id}`]:"dismissed"}));
  const confirmC=()=>{upd(proj.id,p=>({...p,completedSteps:{...p.completedSteps,[step.id]:true}}));dismissW();const ni=proj.currentStep+1;if(ni<STEPS.length)setTimeout(()=>upd(proj.id,p=>({...p,currentStep:ni})),50);};
  const addNote=(note)=>upd(proj.id,p=>({...p,teamNotes:[...p.teamNotes,note]}));
  const delNote=(id)=>upd(proj.id,p=>({...p,teamNotes:p.teamNotes.filter(n=>n.id!==id)}));
  const injNote=(note)=>{setINI(s=>new Set([...s,note.id]));sendMsg(`Team note from ${note.author}: "${note.text}"`);};
  const stepCtx=proj?{...proj.stepData,_template:proj.template,...(step.id==="brainstorm"?{_teamNotes:proj.teamNotes}:{})}:{};

  const handleFiles=async(files)=>{const atts=await Promise.all(Array.from(files).map(async f=>{const b=await f2b64(f);const mt=gMT(f);return{name:f.name,base64:b,mediaType:mt,preview:mt.startsWith("image/")?URL.createObjectURL(f):null};}));setAttachments(a=>[...a,...atts].slice(0,4));};

  const sendMsg=async(text)=>{
    if(!proj)return;
    const msg=(text||input).trim();if((!msg&&attachments.length===0)||loading)return;
    setInput("");const sA=[...attachments];setAttachments([]);if(isInWrapup)dismissW();setLoading(true);
    let uc=sA.length>0?[...sA.map(a=>a.mediaType==="application/pdf"?{type:"document",source:{type:"base64",media_type:"application/pdf",data:a.base64}}:{type:"image",source:{type:"base64",media_type:a.mediaType,data:a.base64}}),(msg?{type:"text",text:msg}:{type:"text",text:"Analyze these files."})]:msg;
    const uMsg={role:"user",content:uc,displayText:msg,attachments:sA.map(a=>({name:a.name,preview:a.preview,mediaType:a.mediaType}))};
    const hist=stepConvo;const nH=[...hist,uMsg];
    upd(proj.id,p=>({...p,conversations:{...p.conversations,[step.id]:nH},lastTouched:new Date().toISOString()}));
    const sys=step.systemPrompt(stepCtx);
    const msgs=hist.length===0?[{role:"user",content:sys+(typeof uc==="string"?"\n\nUser: "+uc:"\n\nUser shared files.")}]:[{role:"user",content:sys},{role:"assistant",content:"Understood."},...hist.map(m=>({role:m.role,content:m.content})),uMsg];
    try{
      const raw=await callClaude(msgs,1600,apiKey);const ck=CK[step.id];const ex=xJ(raw,ck);const opts=xO(raw);const wup=xW(raw);const cl=cleanR(raw,ck);
      const aMsg={role:"assistant",content:cl,options:opts,isWrapup:wup};
      upd(proj.id,p=>({...p,conversations:{...p.conversations,[step.id]:[...nH,aMsg]},...(ex?{stepData:{...p.stepData,[step.id]:ex}}:{})}));
      if(wup&&!ex)setWrapupState(w=>({...w,[`${proj.id}_${step.id}`]:"pending"}));
      if(ex){upd(proj.id,p=>({...p,completedSteps:{...p.completedSteps,[step.id]:true},versions:snapshotVersion(p,step.id,ex),...(step.id==="solution_concept"&&!p.mvpBaseline?{mvpBaseline:{features:ex.mvpFeatures,lockedAt:new Date().toISOString()}}:{})}));extractAssumptions(step.label,ex).then(newAs=>{if(newAs.length)upd(proj.id,p=>({...p,assumptions:[...(p.assumptions||[]),...newAs]}));});}
    }catch{upd(proj.id,p=>({...p,conversations:{...p.conversations,[step.id]:[...nH,{role:"assistant",content:"Something went wrong.",options:[]}]}}));}
    setLoading(false);setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  const dm=darkMode?{filter:"invert(1) hue-rotate(180deg)"}:{};
  if(!apiKey)return <APIKeyGate onSubmit={setApiKey}/>;

  return <div style={{display:"flex",height:"100vh",fontFamily:FONT,background:T.bg,overflow:"hidden",fontSize:14,color:T.ink,...dm}}>
    <style>{`@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');@import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Hi+Melody&display=swap');@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.bgMuted};border-radius:4px}`}</style>

    {sidebarOpen&&<div style={{width:240,flexShrink:0,borderRight:`1px solid ${T.border}`,background:T.bgSoft,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:26,height:26,borderRadius:8,background:T.accentSoft,border:`1.5px solid ${T.accentMd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✦</div><div style={{fontSize:14,fontWeight:700,color:T.ink,letterSpacing:"-0.02em"}}>PM Agent</div></div>
          <div style={{display:"flex",gap:5}}><button onClick={()=>setDarkMode(d=>!d)} style={{background:"none",border:`1px solid ${T.border}`,cursor:"pointer",fontSize:11,color:T.inkMd,padding:"3px 8px",borderRadius:20,fontFamily:FONT}}>{darkMode?"☀":"☾"}</button><button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.inkSoft}}>‹</button></div>
        </div>
      </div>
      <div style={{padding:"10px 8px 4px"}}><button onClick={()=>setShowTpl(true)} style={{width:"100%",padding:"7px 10px",borderRadius:7,border:`1.5px dashed ${T.borderMd}`,background:"transparent",color:T.inkMd,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:FONT}}><span style={{fontSize:15}}>+</span> New project</button></div>
      <div style={{flex:1,overflowY:"auto",padding:"8px"}}>{projects.map(p=><ProjectItem key={p.id} project={p} isActive={p.id===activeId} isOnly={projects.length===1} onClick={()=>swProj(p.id)} onRename={name=>setProjects(ps=>ps.map(x=>x.id===p.id?{...x,name}:x))} onDelete={()=>delProj(p.id)}/>)}</div>
      {briefUnlocked&&<div style={{padding:"8px"}}><button onClick={()=>setShowBrief(true)} style={{width:"100%",padding:"9px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>View Brief</button></div>}
      <div style={{padding:"8px 12px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:10.5,color:T.inkSoft,display:"flex",alignItems:"center",gap:5}}>
          {saveStatus==="pending"&&<>⋯ <span>Saving</span></>}
          {saveStatus==="saved"&&<>✓ <span>Saved</span></>}
          {saveStatus==="error"&&<span style={{color:"#A03355"}}>⚠ Save failed</span>}
          {saveStatus==="idle"&&storageLoaded&&<span>Auto-saved</span>}
        </div>
        {projects.length>0&&<button onClick={clearAllData} style={{fontSize:10,color:T.inkSoft,background:"none",border:"none",cursor:"pointer",fontFamily:FONT,textDecoration:"underline"}}>Clear all data</button>}
      </div>
    </div>}

    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 20px",height:52,borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bg,position:"relative"}}>
        {!sidebarOpen&&<button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.inkSoft,marginRight:4}}>›</button>}
        <div style={{fontSize:15,fontWeight:600,color:T.ink,letterSpacing:"-0.01em"}}>{proj?.name||"PM Agent"}</div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {(()=>{const digestCount=buildDigest(projects).length;return <button onClick={()=>setShowDigest(d=>!d)} style={{position:"relative",background:"none",border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",fontSize:15,padding:"5px 9px",color:T.inkMd}}>
            🔔
            {digestCount>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:16,height:16,borderRadius:8,background:T.accent,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:"1.5px solid #fff"}}>{digestCount}</span>}
          </button>;})()}
          {briefUnlocked&&<button onClick={()=>setShowBrief(b=>!b)} style={{padding:"5px 14px",borderRadius:6,border:`1px solid ${T.border}`,background:showBrief?T.accentSoft:T.bg,color:showBrief?T.accent:T.inkMd,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{showBrief?"Back to chat":"View brief"}</button>}
        </div>
        {showDigest&&<NudgeDigest projects={projects} onOpenProject={(id)=>{swProj(id);setShowDigest(false);}} onClose={()=>setShowDigest(false)}/>}
      </div>

      {!storageLoaded?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.inkSoft,fontSize:13}}>Loading your projects…</div>
      :showTpl?<div style={{flex:1,overflowY:"auto",display:"flex",alignItems:"center",justifyContent:"center"}}><TemplatePicker onSelect={createProj}/></div>
      :!proj?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.inkSoft}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>✦</div><div style={{fontSize:15,fontWeight:600,color:T.ink,marginBottom:8}}>Welcome to PM Agent</div><button onClick={()=>setShowTpl(true)} style={{padding:"9px 20px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Start a project</button></div></div>
      :<>
        {/* Phase rail */}
        <div style={{display:"flex",gap:0,padding:"0 16px",borderBottom:`1px solid ${T.border}`,background:T.bgSoft,flexShrink:0,overflowX:"auto"}}>
          {PG.map(group=><div key={group.key} style={{display:"flex",alignItems:"stretch"}}>
            {group.steps.map(sid=>{const s=displayStep(STEPS.find(x=>x.id===sid),proj.template);const i=STEPS.findIndex(x=>x.id===sid);const done=!!proj.completedSteps[sid];const active=proj.currentStep===i;const inP=!done&&(proj.conversations[sid]||[]).length>0;const gp=T[group.key];
            return <button key={sid} onClick={()=>goStep(i)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 14px",height:44,border:"none",borderBottom:active?`2px solid ${gp.dot}`:"2px solid transparent",background:active?T.bg:"transparent",cursor:"pointer",fontFamily:FONT,color:done?gp.dot:active?gp.text:inP?T.inkMd:T.inkSoft,fontSize:12.5,fontWeight:active?600:400,flexShrink:0,transition:"all 0.12s",borderRadius:active?"8px 8px 0 0":0}}>
              <span style={{fontSize:15}}>{s.icon}</span><span>{s.label}</span>
              {done&&<span style={{fontSize:12,color:gp.dot}}>✓</span>}
              {inP&&!done&&<span style={{width:5,height:5,borderRadius:"50%",background:gp.dot,display:"inline-block",flexShrink:0}}/>}
            </button>;})}<div style={{width:1,background:T.border,margin:"10px 6px",flexShrink:0}}/></div>)}
        </div>

        {/* Metrics dashboard */}
        <MetricsDashboard proj={proj}/>

        {showBrief?<FinalBrief proj={proj} onClose={()=>setShowBrief(false)} onUpdateSprints={(sprints)=>upd(proj.id,p=>({...p,sprints}))} onSetNorthStar={(m)=>upd(proj.id,p=>({...p,northStarMetric:m}))} onToggleChecklist={(i)=>upd(proj.id,p=>({...p,checklistState:{...p.checklistState,[i]:!p.checklistState?.[i]}}))} onUpdateStakeholders={(stakeholders)=>upd(proj.id,p=>({...p,stakeholders}))} onAddDecision={(d)=>upd(proj.id,p=>({...p,decisionLog:[...(p.decisionLog||[]),d]}))} onDeleteDecision={(id)=>upd(proj.id,p=>({...p,decisionLog:(p.decisionLog||[]).filter(d=>d.id!==id)}))} onAddSnapshot={(s)=>upd(proj.id,p=>({...p,metricSnapshots:[...(p.metricSnapshots||[]),s]}))} onDeleteSnapshot={(id)=>upd(proj.id,p=>({...p,metricSnapshots:(p.metricSnapshots||[]).filter(s=>s.id!==id)}))}/>:<>
          {step.id==="wireframe"&&<div style={{padding:"7px 20px",borderBottom:`1px solid ${T.border}`,background:T.bgSoft,display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:600,color:T.inkMd,flexShrink:0}}>Figma</span>
            <input value={figmaInput||proj.figmaLinks?.wireframe||""} onChange={e=>setFigmaInput(e.target.value)} onBlur={()=>{if(figmaInput.trim())upd(proj.id,p=>({...p,figmaLinks:{...p.figmaLinks,wireframe:figmaInput.trim()}}));}} placeholder="Paste Figma share link..." style={{flex:1,minWidth:180,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,background:T.bg,color:T.ink,outline:"none",fontFamily:FONT}}/>
            {proj.figmaLinks?.wireframe&&<a href={proj.figmaLinks.wireframe} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:T.accent,fontWeight:500,textDecoration:"none",flexShrink:0}}>Open ↗</a>}
            {wfRev>0&&<span style={{fontSize:11,padding:"2px 9px",borderRadius:10,background:p.bg,color:p.text,fontWeight:600,border:`1px solid ${p.border}`,flexShrink:0}}>{wfRev} revision{wfRev>1?"s":""}</span>}
          </div>}

          {step.id==="brainstorm"&&<div style={{padding:"7px 20px",borderBottom:`1px solid ${T.border}`,background:"#FFF0F4",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:700,color:"#A03355",letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:FONT}}>✎ Team Brainstorm</span>
            <span style={{fontSize:11,color:"#C47090",opacity:0.85}}>PM chats · teammates scribble notes on the right</span>
            {proj.teamNotes.length>0&&<span style={{marginLeft:"auto",fontSize:11,padding:"1px 9px",borderRadius:10,background:T.accent,color:"#fff",fontWeight:700}}>{proj.teamNotes.length}</span>}
          </div>}

          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px 12px",display:"flex",flexDirection:"column",gap:12}}>

                {stepConvo.length===0&&<div style={{textAlign:"center",paddingTop:48,color:T.inkSoft}}>
                  <div style={{width:56,height:56,borderRadius:18,background:p.bg,border:`1.5px solid ${p.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26,boxShadow:`0 4px 16px ${p.border}`}}>{step.icon}</div>
                  <div style={{fontSize:16,fontWeight:600,color:T.ink,marginBottom:5}}>{step.label}</div>
                  <div style={{fontSize:13,color:T.inkMd,marginBottom:16,maxWidth:360,margin:"0 auto 16px",lineHeight:1.6}}>{step.placeholder}</div>
                  <div style={{display:"inline-block",fontSize:11,padding:"3px 12px",borderRadius:20,background:p.bg,color:p.text,border:`1px solid ${p.border}`,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>{step.phase}</div>
                  {mCtx.length>0&&<div style={{margin:"20px auto 0",maxWidth:380,padding:"14px 16px",borderRadius:12,border:`1px solid ${T.border}`,background:T.bgSoft,textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:5}}>💡 Richer answers with more context</div>
                    <div style={{fontSize:12.5,color:T.inkMd,marginBottom:10,lineHeight:1.6}}>Complete these first, or continue and the agent will ask.</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {mCtx.map(d=>{const si=STEPS.findIndex(s=>s.id===d);const st=STEPS[si];return <button key={d} onClick={()=>goStep(si)} style={{padding:"4px 12px",borderRadius:20,fontSize:12,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,cursor:"pointer",fontWeight:500,fontFamily:FONT}}>{st?.icon} {st?.label}</button>;})}
                      <button onClick={()=>setInput("Let's continue")} style={{padding:"4px 12px",borderRadius:20,fontSize:12,border:`1.5px solid ${T.accentMd}`,background:T.accentSoft,color:T.accent,cursor:"pointer",fontFamily:FONT,fontWeight:500}}>Continue anyway</button>
                    </div>
                  </div>}
                </div>}

                {stepConvo.map((msg,i)=>{
                  const isLast=i===stepConvo.length-1;const isUser=msg.role==="user";
                  return <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start",gap:6}}>
                    {msg.attachments?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:isUser?"flex-end":"flex-start",maxWidth:"75%"}}>
                      {msg.attachments.map((a,ai)=><div key={ai} style={{borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`}}>
                        {a.preview?<img src={a.preview} alt={a.name} style={{display:"block",maxWidth:180,maxHeight:120,objectFit:"cover"}}/>:<div style={{padding:"8px 12px",fontSize:12,color:T.inkMd,display:"flex",alignItems:"center",gap:6,background:T.bgSoft}}><span>⎗</span>{a.name}</div>}
                      </div>)}
                    </div>}
                    {(msg.displayText||typeof msg.content==="string")&&<div style={{padding:"12px 16px",borderRadius:isUser?"20px 4px 20px 20px":"4px 20px 20px 20px",fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap",maxWidth:"74%",wordBreak:"break-word",background:isUser?T.accent:T.bg,color:isUser?"#fff":T.ink,border:isUser?"none":`1.5px solid ${T.border}`,boxShadow:isUser?"0 2px 8px rgba(232,99,122,0.18)":"0 1px 4px rgba(0,0,0,0.05)",animation:"fadeIn 0.2s ease"}}>
                      {msg.displayText||msg.content}
                    </div>}
                    {!isUser&&isLast&&step.id==="prototype"&&isStepDone&&proj.stepData.prototype&&<div style={{maxWidth:"80%",width:"100%"}}><PrototypeTools data={proj.stepData.prototype}/></div>}
                    {!isUser&&isLast&&step.id==="problem_framing"&&isStepDone&&proj.stepData.problem_framing?.personas&&<PersonaCards personas={proj.stepData.problem_framing.personas}/>}
                    {!isUser&&isLast&&step.id==="market_research"&&isStepDone&&proj.stepData.market_research&&<div style={{maxWidth:"85%",width:"100%"}}><LiveCompetitorResearch data={proj.stepData.market_research} saved={proj.competitorData} onUpdate={(competitorData)=>upd(proj.id,p=>({...p,competitorData}))}/></div>}
                    {!isUser&&isLast&&isStepDone&&<div style={{maxWidth:"85%",width:"100%"}}><PMCoachingFeedback stepLabel={step.label} stepData={proj.stepData[step.id]} fullContext={proj.stepData}/></div>}
                    {!isUser&&isLast&&isStepDone&&proj.assumptions?.length>0&&<div style={{maxWidth:"85%",width:"100%"}}><AssumptionTracker proj={proj} onUpdate={(updated)=>upd(proj.id,p=>({...p,assumptions:updated}))}/></div>}
                    {!isUser&&isLast&&msg.options?.length>0&&!isStepDone&&!isInWrapup&&<OptionChips options={msg.options} phaseKey={step.phaseKey} onSelect={sendMsg} disabled={loading}/>}
                  </div>;
                })}

                {isInWrapup&&!isStepDone&&nextStep&&<WrapupBanner stepLabel={step.label} nextLabel={nextStep.label} phaseKey={step.phaseKey} onContinue={confirmC} onStayMore={dismissW}/>}
                {loading&&<div style={{display:"flex",alignItems:"center",gap:8,color:T.inkSoft,fontSize:13}}><div style={{display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.inkSoft,animation:`bounce 1s ease-in-out ${i*0.15}s infinite`}}/>)}</div>Thinking</div>}
                <div ref={bottomRef}/>
              </div>

              <div style={{padding:"12px 20px 16px",borderTop:`1px solid ${T.border}`,background:T.bg,flexShrink:0}} onDragOver={e=>{e.preventDefault();e.currentTarget.style.background=T.bgSoft;}} onDragLeave={e=>{e.currentTarget.style.background=T.bg;}} onDrop={e=>{e.preventDefault();e.currentTarget.style.background=T.bg;if(!isStepDone)handleFiles(e.dataTransfer.files);}}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
                {!isStepDone?<div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {attachments.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"7px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSoft}}>
                    {attachments.map((a,i)=><div key={i} style={{position:"relative",borderRadius:6,overflow:"hidden",border:`1px solid ${T.border}`}}>
                      {a.preview?<img src={a.preview} alt={a.name} style={{display:"block",height:54,width:72,objectFit:"cover"}}/>:<div style={{height:54,width:72,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bgMuted,fontSize:10,color:T.inkMd,gap:3,padding:4,textAlign:"center"}}><span style={{fontSize:18}}>⎗</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:66}}>{a.name}</span></div>}
                      <button onClick={()=>setAttachments(aa=>aa.filter((_,j)=>j!==i))} style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                    </div>)}
                  </div>}
                  <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey))sendMsg();}} placeholder={isInWrapup?"Keep exploring, or tap a button above...":step.placeholder} disabled={loading} rows={3} style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:14,background:T.bg,color:T.ink,outline:"none",resize:"vertical",minHeight:80,maxHeight:200,lineHeight:1.6,boxSizing:"border-box",overflowY:"auto",fontFamily:FONT,transition:"border-color 0.12s"}} onFocus={e=>e.target.style.borderColor=T.accentMd} onBlur={e=>e.target.style.borderColor=T.border}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:7}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>fileInputRef.current?.click()} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.inkMd,fontSize:12,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:4}}><span>⎗</span> Attach</button>
                      <span style={{fontSize:11,color:T.inkSoft}}>{attachments.length>0?`${attachments.length} attached`:input.length>0?`${input.length} chars`:"Ctrl+Enter to send"}</span>
                    </div>
                    <button onClick={()=>sendMsg()} disabled={loading||(!input.trim()&&!attachments.length)} style={{padding:"9px 22px",borderRadius:20,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:(loading||(!input.trim()&&!attachments.length))?"not-allowed":"pointer",opacity:((!input.trim()&&!attachments.length)||loading)?0.4:1,fontFamily:FONT,boxShadow:(!input.trim()&&!attachments.length)||loading?"none":"0 2px 8px rgba(232,99,122,0.3)"}}>Send</button>
                  </div>
                </div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(()=>{const ri=recNext(step.id);const rx=STEPS.findIndex(s=>s.id===ri);const rs=rx>=0?STEPS[rx]:null;if(!rs||proj.completedSteps[rs.id])return null;const rp=T[rs.phaseKey];return <div style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${rp.border}`,background:rp.bg,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div><div style={{fontSize:13,fontWeight:600,color:rp.text}}>Up next: {rs.icon} {rs.label}</div><div style={{fontSize:12,color:rp.text,opacity:0.7}}>Or jump to any step above</div></div>
                    <button onClick={()=>goStep(rx)} style={{padding:"6px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"none",background:rp.dot,color:"#fff",cursor:"pointer",fontFamily:FONT}}>Go →</button>
                  </div>;})()}
                  {allDone&&<button onClick={()=>setShowBrief(true)} style={{padding:"11px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>View Full Brief ✦</button>}
                </div>}
              </div>
            </div>

            {step.id==="brainstorm"&&<TeamNotesPanel notes={proj.teamNotes} onAdd={addNote} onDelete={delNote} onInject={injNote} injectedIds={injectedNoteIds} collapsed={notesPanelCollapsed} onToggle={()=>setNPC(c=>!c)}/>}
          </div>
        </>}
      </>}
    </div>
    <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>;
}
