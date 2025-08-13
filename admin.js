// 登录
const loginForm=document.getElementById('loginForm');const loginPage=document.getElementById('loginPage');const mainPage=document.getElementById('mainPage');
loginForm.addEventListener('submit',async e=>{e.preventDefault();const u=document.getElementById('username').value.trim();const p=document.getElementById('password').value.trim();try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});if(r.status===401){alert('用户名或密码错误');return}if(!r.ok)throw new Error('登录失败');loginPage.style.display='none';mainPage.style.display='flex';loadMessages();}catch(err){alert('无法连接后台，请在项目目录执行 npm install && npm start，并通过 http://localhost:3000/admin.html 访问');}});

// 切换页面
const navItems=document.querySelectorAll('.sidebar-nav .nav-item');const pages=document.querySelectorAll('.page');const pageTitle=document.getElementById('pageTitle');
navItems.forEach(i=>i.addEventListener('click',()=>{navItems.forEach(n=>n.classList.remove('active'));i.classList.add('active');const p=i.getAttribute('data-page');pages.forEach(pg=>pg.classList.remove('active'));document.getElementById(p+'Page').classList.add('active');pageTitle.textContent=p==='dashboard'?'仪表板':p==='messages'?'留言管理':'系统设置';if(p==='messages')loadMessages();}));

document.getElementById('logoutBtn').addEventListener('click',()=>{mainPage.style.display='none';loginPage.style.display='flex';loginForm.reset();});

document.getElementById('sidebarToggle').addEventListener('click',()=>{document.querySelector('.sidebar').classList.toggle('active');});

// 留言
const messagesList=document.getElementById('messagesList');
async function loadMessages(){if(!messagesList)return;messagesList.innerHTML='<p>加载中...</p>';try{const res=await fetch('/api/messages');const data=await res.json();const list=(data&&data.data)||[];document.getElementById('statNewMsg').textContent=list.filter(m=>!m.read).length;messagesList.innerHTML=list.length?list.map(renderItem).join(''):'<p>暂无留言</p>';bindActions();}catch(e){messagesList.innerHTML='<p>无法连接后台服务</p>';}}
function renderItem(m){return `<div class="message-item" data-id="${m.id}"><div class="message-header"><span>${esc(m.name)}</span><span>${fmt(m.createdAt)}</span><span class="message-status ${m.read?'read':'unread'}">${m.read?'已读':'未读'}</span></div><div class="message-content"><p>${esc(m.message)}</p></div><div class="message-actions"><button class="btn btn-sm btn-mark-read">标记已读</button><button class="btn btn-sm btn-delete">删除</button></div></div>`}
function bindActions(){document.querySelectorAll('.btn-mark-read').forEach(b=>b.addEventListener('click',async function(){const root=this.closest('.message-item');const id=root.getAttribute('data-id');try{const r=await fetch(`/api/messages/${id}/read`,{method:'PUT'});if(!r.ok)throw 0;root.querySelector('.message-status').classList.remove('unread');root.querySelector('.message-status').classList.add('read');root.querySelector('.message-status').textContent='已读';}catch{alert('操作失败');}}));document.querySelectorAll('.btn-delete').forEach(b=>b.addEventListener('click',async function(){const root=this.closest('.message-item');const id=root.getAttribute('data-id');if(!confirm('确定删除该留言吗？'))return;try{const r=await fetch(`/api/messages/${id}`,{method:'DELETE'});if(!r.ok)throw 0;root.remove();}catch{alert('删除失败');}}));}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function fmt(iso){if(!iso)return'';try{const d=new Date(iso);const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;}catch{return iso;}}
