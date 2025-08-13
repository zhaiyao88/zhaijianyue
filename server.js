const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, '[]', 'utf-8');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(__dirname));

// 工具函数：读取/写入留言
function readMessages() {
    try {
        const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function writeMessages(messages) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
}

// API 路由
app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// 创建留言
app.post('/api/messages', (req, res) => {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
        return res.status(400).json({ error: '缺少必要字段' });
    }
    const messages = readMessages();
    const newMessage = {
        id: nanoid(),
        name,
        email,
        message,
        read: false,
        createdAt: new Date().toISOString()
    };
    messages.unshift(newMessage);
    writeMessages(messages);
    res.status(201).json({ ok: true, data: newMessage });
});

// 获取留言列表
app.get('/api/messages', (req, res) => {
    const messages = readMessages();
    res.json({ ok: true, data: messages });
});

// 标记已读
app.put('/api/messages/:id/read', (req, res) => {
    const { id } = req.params;
    const messages = readMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: '未找到留言' });
    messages[idx].read = true;
    writeMessages(messages);
    res.json({ ok: true, data: messages[idx] });
});

// 删除留言
app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    const messages = readMessages();
    const newList = messages.filter(m => m.id !== id);
    if (newList.length === messages.length) return res.status(404).json({ error: '未找到留言' });
    writeMessages(newList);
    res.json({ ok: true });
});

// 简单登录（演示用）
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === 'admin' && password === '123456') {
        return res.json({ ok: true, token: 'demo-token' });
    }
    res.status(401).json({ ok: false, error: '用户名或密码错误' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
