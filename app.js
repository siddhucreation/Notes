/*
  DocVault — GitHub folder/file viewer
  Change these 3 settings before deployment:
    GITHUB_OWNER = your GitHub username/org
    GITHUB_REPO  = repository name
    GITHUB_PATH  = folder containing your documents (use "" for repo root)

  IMPORTANT:
  This version uses GitHub's public Contents API, so the repository containing
  documents must be PUBLIC. Do not put private documents or secrets in a public repo.

  Demo login:
    User  = user / user123
    Admin = admin / admin123

  The admin portal is intentionally read-only here. You manage folders/files
  directly in GitHub; after a commit, the website reads the new structure.
*/
const GITHUB_OWNER="YOUR_GITHUB_USERNAME";
const GITHUB_REPO="YOUR_REPOSITORY";
const GITHUB_PATH="documents";
const BRANCH="main";

const ACCOUNTS={
  user:{password:"user123",role:"user"},
  admin:{password:"admin123",role:"admin"}
};

let role=sessionStorage.getItem("docvault_role")||"";
let currentPath="";
let cache=new Map();

const app=document.getElementById("app");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function loginView(){
app.innerHTML=`<main class="login"><section class="card">
<div class="logo"><span class="logoIcon">▣</span>DocVault</div>
<p class="muted">Simple document access portal</p>
<div class="field"><label>User ID</label><input id="uid" placeholder="Enter User ID" autocomplete="username"></div>
<div class="field"><label>Password</label><input id="pwd" type="password" placeholder="Enter password" autocomplete="current-password" onkeydown="if(event.key==='Enter')login()"></div>
<button class="primary loginBtn" onclick="login()">Sign in</button>
<div id="error" class="error"></div>
</section></main>`;
}
function login(){
const id=document.getElementById("uid").value.trim(),pw=document.getElementById("pwd").value;
if(!ACCOUNTS[id]||ACCOUNTS[id].password!==pw){document.getElementById("error").textContent="Invalid User ID or Password.";return}
role=ACCOUNTS[id].role;sessionStorage.setItem("docvault_role",role);currentPath="";manager();
}
function logout(){sessionStorage.clear();location.reload()}
function manager(){
app.innerHTML=`<div><header class="top"><div class="logo" style="font-size:20px"><span class="logoIcon" style="width:35px;height:35px">▣</span>DocVault</div><div class="right"><span class="badge">${role==="admin"?"Admin":"Read only"}</span><button class="logout" onclick="logout()">Sign out</button></div></header>
<main class="main"><div class="heading"><div><h1>Documents</h1><div class="muted">Folders and files are loaded directly from GitHub.</div></div></div>
${role==="user"?'<div class="notice">Read-only access. Upload, rename and delete are managed through GitHub.</div>': '<div class="notice">Admin portal. Manage the actual folders and files in your GitHub repository.</div>'}
<div class="searchBox"><input id="search" class="search" placeholder="Search this folder…" oninput="filterItems()"></div>
<div id="crumb" class="crumb"></div><div id="grid" class="grid"><div class="empty">Loading…</div></div>
</main></div>`;
loadFolder();
}
function apiPath(){return [GITHUB_PATH,currentPath].filter(Boolean).join("/")}
async function loadFolder(){
const grid=document.getElementById("grid");
if(GITHUB_OWNER==="YOUR_GITHUB_USERNAME"||GITHUB_REPO==="YOUR_REPOSITORY"){
grid.innerHTML='<div class="empty">Set GITHUB_OWNER and GITHUB_REPO in app.js first.</div>';drawCrumb();return;
}
grid.innerHTML='<div class="empty">Loading GitHub files…</div>';
try{
const url=`https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${apiPath()}?ref=${encodeURIComponent(BRANCH)}`;
const r=await fetch(url,{headers:{Accept:"application/vnd.github+json"}});
if(!r.ok)throw new Error("GitHub returned "+r.status);
const data=await r.json();
if(!Array.isArray(data))throw new Error("Path is not a folder.");
cache.set(currentPath,data);draw(data);drawCrumb();
}catch(e){grid.innerHTML=`<div class="empty">Could not load this folder.<br><small>${esc(e.message)}</small></div>`;drawCrumb()}
}
function draw(items){
const q=(document.getElementById("search")?.value||"").toLowerCase();
const list=items.filter(x=>x.name.toLowerCase().includes(q)).sort((a,b)=>(a.type==="dir"?0:1)-(b.type==="dir"?0:1)||a.name.localeCompare(b.name));
const grid=document.getElementById("grid");
if(!list.length){grid.innerHTML='<div class="empty">No files or folders found.</div>';return}
grid.innerHTML=list.map(x=>{
const folder=x.type==="dir";
const href=x.download_url||x.html_url||x._links?.html||"#";
return `<article class="item"><div><div class="icon">${folder?"📁":"📄"}</div><div class="name" title="${esc(x.name)}">${esc(x.name)}</div><div class="meta">${folder?"Folder":"Document"}</div></div><div class="actions"><button class="mini" onclick="${folder?`openFolder(${JSON.stringify(x.path)})`:`openFile(${JSON.stringify(href)})`}">${folder?"Open":"View / Download"}</button></div></article>`;
}).join("");
}
function filterItems(){const items=cache.get(currentPath);if(items)draw(items)}
function openFolder(path){currentPath=path.startsWith(GITHUB_PATH+"/")?path.slice(GITHUB_PATH.length+1):path===GITHUB_PATH?"":path;loadFolder()}
function openFile(url){window.open(url,"_blank","noopener")}
function drawCrumb(){
const c=document.getElementById("crumb");if(!c)return;
const parts=currentPath?currentPath.split("/").filter(Boolean):[];
c.innerHTML=`<span onclick="currentPath='';loadFolder()">Home</span>`+parts.map((p,i)=>`<b>/</b><span onclick="currentPath=${JSON.stringify(parts.slice(0,i+1).join("/"))};loadFolder()">${esc(p)}</span>`).join("");
}
if(role)manager();else loginView();
