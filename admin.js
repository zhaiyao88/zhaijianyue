// 登录逻辑
const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const mainPage = document.getElementById('mainPage');

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (resp.status === 401) {
            alert('用户名或密码错误！');
            return;
        }
        if (!resp.ok) throw new Error('登录失败');
        // 远端校验成功
        loginPage.style.display = 'none';
        mainPage.style.display = 'flex';
        loadMessages();
        return;
    } catch (err) {
        // 网络错误或后台未启动时的兜底逻辑（演示环境）
        if (username === 'admin' && password === '123456') {
            alert('未连接到后台服务，已使用本地兜底登录（仅演示）。请尽快启动后台以加载数据。');
            loginPage.style.display = 'none';
            mainPage.style.display = 'flex';
            // 没有后台时不加载留言，以免报错
            return;
        }
        // alert('无法连接后台服务，请确认已通过 http://localhost:3000/admin.html 访问，并在终端执行 npm start 启动服务。');
    }
});

// 侧边栏切换页面
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const page = this.getAttribute('data-page');
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');
        switch(page) {
            case 'dashboard': pageTitle.textContent = '仪表板'; break;
            case 'content': pageTitle.textContent = '内容管理'; break;
            case 'services': pageTitle.textContent = '服务管理'; break;
            case 'messages': pageTitle.textContent = '留言管理'; loadMessages(); break;
            case 'settings': pageTitle.textContent = '系统设置'; break;
        }
    });
});

// 退出登录
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', function() {
    mainPage.style.display = 'none';
    loginPage.style.display = 'flex';
    loginForm.reset();
});

// 移动端侧边栏切换
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
});

// 留言管理：加载、标记已读、删除
const messagesList = document.getElementById('messagesList');

async function loadMessages() {
    if (!messagesList) return;
    messagesList.innerHTML = '<p>加载中...</p>';
    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        const messages = (data && data.data) || [];
        if (messages.length === 0) {
            messagesList.innerHTML = '<p>暂无留言</p>';
            return;
        }
        messagesList.innerHTML = messages.map(m => renderMessageItem(m)).join('');
        bindMessageActions();
    } catch (e) {
        messagesList.innerHTML = '<p>无法连接后台服务，请确认已启动</p>';
    }
}

function renderMessageItem(m) {
    return `
    <div class="message-item" data-id="${m.id}">
        <div class="message-header">
            <span class="message-author">${escapeHtml(m.name)}</span>
            <span class="message-time">${formatTime(m.createdAt)}</span>
            <span class="message-status ${m.read ? 'read' : 'unread'}">${m.read ? '已读' : '未读'}</span>
        </div>
        <div class="message-content">
            <p>${escapeHtml(m.message)}</p>
        </div>
        <div class="message-actions">
            <button class="btn btn-sm btn-reply">回复</button>
            <button class="btn btn-sm btn-mark-read">标记已读</button>
            <button class="btn btn-sm btn-delete">删除</button>
        </div>
    </div>`;
}

function bindMessageActions() {
    document.querySelectorAll('.btn-mark-read').forEach(btn => {
        btn.addEventListener('click', async function() {
            const root = this.closest('.message-item');
            const id = root.getAttribute('data-id');
            try {
                const res = await fetch(`/api/messages/${id}/read`, { method: 'PUT' });
                if (!res.ok) throw new Error();
                root.querySelector('.message-status').classList.remove('unread');
                root.querySelector('.message-status').classList.add('read');
                root.querySelector('.message-status').textContent = '已读';
            } catch (e) {
                alert('操作失败');
            }
        });
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            const root = this.closest('.message-item');
            const id = root.getAttribute('data-id');
            if (!confirm('确定删除该留言吗？')) return;
            try {
                const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error();
                root.remove();
            } catch (e) {
                alert('删除失败');
            }
        });
    });
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatTime(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return iso;
    }
}

