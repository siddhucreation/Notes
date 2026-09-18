const GITHUB_OWNER="siddhucreation";
const GITHUB_REPO="Notes";
const GITHUB_PATH="documents";
const BRANCH="main";

const ACCOUNTS={
  user:{password:"bca123",role:"user"},
  admin:{password:"admin123",role:"admin"}
};

let role=sessionStorage.getItem("docvault_role")||"";
let currentPath=GITHUB_PATH;
let currentItems=[];
const app=document.getElementById("app");

function esc(v){
  return String(v).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#039;"
  }[c]));
}

function apiURL(path){
  const p=path.split("/").filter(Boolean)
    .map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${p}?ref=${encodeURIComponent(BRANCH)}`;
}

function rawURL(path){
  const p=path.split("/").filter(Boolean)
    .map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${p}`;
}

function showLogin(){
  app.innerHTML=`
  <main class="login">
    <section class="card">
      <div class="logo"><span class="logoIcon">▣</span> DocVault</div>
      <p class="muted">Document Access Portal</p>

      <div class="field">
        <label>User ID</label>
        <input id="uid" type="text" placeholder="Enter User ID"
          autocomplete="username">
      </div>

      <div class="field">
        <label>Password</label>
        <input id="pwd" type="password" placeholder="Enter Password"
          autocomplete="current-password"
          onkeydown="if(event.key==='Enter')login()">
      </div>

      <button class="primary loginBtn" onclick="login()">Sign In</button>
      <div id="error" class="error"></div>
    </section>
  </main>`;
}

function login(){
  const uid=document.getElementById("uid").value.trim();
  const pwd=document.getElementById("pwd").value;
  const account=ACCOUNTS[uid];

  if(!account||account.password!==pwd){
    document.getElementById("error").textContent=
      "Invalid User ID or Password.";
    return;
  }

  role=account.role;
  sessionStorage.setItem("docvault_role",role);
  currentPath=GITHUB_PATH;
  showManager();
}

function logout(){
  sessionStorage.removeItem("docvault_role");
  role="";
  location.reload();
}

function showManager(){
  app.innerHTML=`
  <header class="top">
    <div class="logo" style="font-size:20px">
      <span class="logoIcon" style="width:35px;height:35px">▣</span>
      DocVault
    </div>
    <div class="right">
      <span class="badge">${role==="admin"?"Admin":"Read Only"}</span>
      <button class="logout" onclick="logout()">Sign Out</button>
    </div>
  </header>

  <main class="main">
    <div class="heading">
      <div>
        <h1>Documents</h1>
        <div class="muted">Browse folders and documents</div>
      </div>
    </div>

    <div class="notice">
      ${role==="admin"
        ?"Admin portal — manage your files through GitHub."
        :"Read-only access — preview and download documents."}
    </div>

    <div class="searchBox">
      <input id="search" class="search"
        placeholder="Search this folder..."
        oninput="filterFiles()">
    </div>

    <div id="breadcrumb" class="crumb"></div>

    <div id="grid" class="grid">
      <div class="empty">Loading documents...</div>
    </div>
  </main>`;

  loadFolder();
}

async function loadFolder(){
  const grid=document.getElementById("grid");
  if(!grid)return;

  grid.innerHTML=`<div class="empty">Loading documents...</div>`;

  try{
    const r=await fetch(apiURL(currentPath),{
      headers:{"Accept":"application/vnd.github+json"}
    });

    if(!r.ok)throw new Error(`GitHub error ${r.status}`);

    const data=await r.json();

    if(!Array.isArray(data))
      throw new Error("This path is not a folder.");

    currentItems=data;
    drawFiles(data);
    drawBreadcrumb();
  }catch(e){
    console.error(e);
    grid.innerHTML=`
      <div class="empty">
        <strong>Unable to load documents</strong>
        <br><br>
        ${esc(e.message)}
        <br><br>
        <button class="mini" onclick="loadFolder()">Retry</button>
      </div>`;
  }
}

function drawFiles(items){
  const grid=document.getElementById("grid");
  if(!grid)return;

  const input=document.getElementById("search");
  const q=input?input.value.toLowerCase().trim():"";

  const list=items
    .filter(x=>x.name.toLowerCase().includes(q))
    .sort((a,b)=>{
      if(a.type==="dir"&&b.type!=="dir")return -1;
      if(a.type!=="dir"&&b.type==="dir")return 1;
      return a.name.localeCompare(b.name);
    });

  if(!list.length){
    grid.innerHTML=`<div class="empty">No files or folders found.</div>`;
    return;
  }

  grid.innerHTML="";

  list.forEach(item=>{
    const folder=item.type==="dir";
    const path=esc(item.path);

    const card=document.createElement("article");
    card.className="item";

    card.innerHTML=`
      <div>
        <div class="icon">${folder?"📁":fileIcon(item.name)}</div>
        <div class="name" title="${esc(item.name)}">${esc(item.name)}</div>
        <div class="meta">${folder?"Folder":fileType(item.name)}</div>
      </div>

      <div class="actions">
        ${folder
          ?`<button class="mini" onclick="openFolder('${path}')">Open</button>`
          :`
            <button class="mini" onclick="previewFile('${path}')">Preview</button>
            <button class="mini" onclick="downloadFile('${path}')">Download</button>
          `}
      </div>`;

    grid.appendChild(card);
  });
}

function fileIcon(name){
  const e=ext(name);

  if(e==="pdf")return"📕";
  if(["doc","docx"].includes(e))return"📘";
  if(["ppt","pptx"].includes(e))return"📙";
  if(["xls","xlsx"].includes(e))return"📗";
  if(["jpg","jpeg","png","webp","gif"].includes(e))return"🖼️";
  if(["zip","rar","7z"].includes(e))return"🗜️";

  return"📄";
}

function fileType(name){
  return ext(name).toUpperCase()+" File";
}

function ext(name){
  const p=name.split(".");
  return p.length>1?p.pop().toLowerCase():"";
}

function openFolder(path){
  currentPath=path;
  const s=document.getElementById("search");
  if(s)s.value="";
  loadFolder();
}

function filterFiles(){
  drawFiles(currentItems);
}

function drawBreadcrumb(){
  const box=document.getElementById("breadcrumb");
  if(!box)return;

  box.innerHTML="";

  const home=document.createElement("span");
  home.textContent="Home";
  home.onclick=()=>{
    currentPath=GITHUB_PATH;
    loadFolder();
  };
  box.appendChild(home);

  const base=GITHUB_PATH.split("/").filter(Boolean);
  const parts=currentPath.split("/").filter(Boolean);
  let built=GITHUB_PATH;

  parts.slice(base.length).forEach(part=>{
    const sep=document.createElement("b");
    sep.textContent="/";
    box.appendChild(sep);

    built+="/"+part;

    const link=document.createElement("span");
    link.textContent=part;

    const selected=built;
    link.onclick=()=>{
      currentPath=selected;
      loadFolder();
    };

    box.appendChild(link);
  });
}

function previewFile(path){
  const name=path.split("/").pop();
  const e=ext(name);

  if(e==="pdf"){
    showPDFViewer(path,name);
    return;
  }

  if(["jpg","jpeg","png","webp","gif"].includes(e)){
    showImageViewer(path,name);
    return;
  }

  window.open(rawURL(path),"_blank","noopener,noreferrer");
}

async function showPDFViewer(path,name){
  const url=rawURL(path);

  app.innerHTML=`
  <header class="top">
    <div class="logo" style="font-size:20px">
      <span class="logoIcon" style="width:35px;height:35px">▣</span>
      DocVault
    </div>
    <div class="right">
      <button class="logout" onclick="showManager()">← Back</button>
    </div>
  </header>

  <main class="main" style="max-width:1300px">
    <div class="heading">
      <div>
        <h1>${esc(name)}</h1>
        <div class="muted">PDF Preview</div>
      </div>

      <div class="tools">
        <button class="secondary" onclick="showManager()">Back</button>
        <button class="primary"
          onclick="downloadFile('${esc(path)}')">
          Download
        </button>
      </div>
    </div>

    <div id="pdfViewer"
      style="
        width:100%;
        height:calc(100vh - 190px);
        min-height:500px;
        background:#525659;
        border-radius:16px;
        overflow:auto;
        padding:20px;
        box-sizing:border-box;
      ">
      <div style="color:white;text-align:center;padding:40px">
        Loading PDF...
      </div>
    </div>
  </main>`;

  try{
    await loadPDFJS();

    pdfjsLib.GlobalWorkerOptions.workerSrc=
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf=await pdfjsLib.getDocument({url}).promise;
    const viewer=document.getElementById("pdfViewer");

    if(!viewer)return;

    viewer.innerHTML="";

    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n);
      const viewport=page.getViewport({scale:1.35});

      const wrap=document.createElement("div");
      wrap.style.cssText=
        "display:flex;justify-content:center;margin-bottom:20px;width:100%";

      const canvas=document.createElement("canvas");
      canvas.width=viewport.width;
      canvas.height=viewport.height;
      canvas.style.cssText=
        "display:block;background:white;max-width:100%;height:auto";

      wrap.appendChild(canvas);
      viewer.appendChild(wrap);

      await page.render({
        canvasContext:canvas.getContext("2d"),
        viewport
      }).promise;
    }

  }catch(e){
    console.error("PDF.js:",e);

    const viewer=document.getElementById("pdfViewer");

    if(viewer){
      viewer.innerHTML=`
        <div style="color:white;text-align:center;padding:50px 20px">
          <h2>PDF Preview Failed</h2>
          <p>${esc(e.message)}</p>
          <br>
          <button class="primary"
            onclick="window.open('${url}','_blank')">
            Open PDF
          </button>
        </div>`;
    }
  }
}

function loadPDFJS(){
  return new Promise((resolve,reject)=>{
    if(window.pdfjsLib){
      resolve();
      return;
    }

    const s=document.createElement("script");

    s.src=
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

    s.onload=()=>{
      if(window.pdfjsLib)resolve();
      else reject(new Error("PDF.js unavailable."));
    };

    s.onerror=()=>{
      reject(new Error("Could not load PDF.js."));
    };

    document.head.appendChild(s);
  });
}

function showImageViewer(path,name){
  const url=rawURL(path);

  app.innerHTML=`
  <header class="top">
    <div class="logo" style="font-size:20px">
      <span class="logoIcon" style="width:35px;height:35px">▣</span>
      DocVault
    </div>
    <div class="right">
      <button class="logout" onclick="showManager()">← Back</button>
    </div>
  </header>

  <main class="main">
    <div class="heading">
      <div>
        <h1>${esc(name)}</h1>
        <div class="muted">Image Preview</div>
      </div>

      <div class="tools">
        <button class="secondary" onclick="showManager()">Back</button>
        <button class="primary"
          onclick="downloadFile('${esc(path)}')">
          Download
        </button>
      </div>
    </div>

    <div style="
      width:100%;
      height:calc(100vh - 190px);
      min-height:500px;
      background:#f1f2f5;
      border-radius:16px;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:auto;
      padding:20px;
      box-sizing:border-box">

      <img src="${url}"
        alt="${esc(name)}"
        style="
          max-width:100%;
          max-height:100%;
          object-fit:contain;
          border-radius:8px">

    </div>
  </main>`;
}

function downloadFile(path){
  const url=rawURL(path);
  const a=document.createElement("a");

  a.href=url;
  a.target="_blank";
  a.rel="noopener noreferrer";
  a.download=path.split("/").pop();

  document.body.appendChild(a);
  a.click();
  a.remove();
}


/* =========================
   START
   ========================= */

if(role){
  showManager();
}else{
  showLogin();
                                      }
