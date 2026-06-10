const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function checkUsername(username) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/getChat?chat_id=@${username}`,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ok === false); // false = متاح
        } catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function sendToBot(text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => { res.on('data',()=>{}); res.on('end', resolve); });
    req.on('error', resolve);
    req.write(body);
    req.end();
  });
}

function generateUsernames() {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const all = alpha + '0123456789';
  const list = new Set();

  for (let a of alpha)
    for (let b of all)
      list.add(a+a+a+b);

  for (let a of alpha)
    list.add(a+a+a+a);

  for (let a of alpha)
    for (let b of all)
      list.add(a+b+b+a);

  for (let a of alpha)
    for (let b of alpha)
      for (let n of ['00','11','99','77','69'])
        list.add(a+b+n);

  return [...list];
}

async function main() {
  const usernames = generateUsernames();
  await sendToBot(`🚀 بدأ الفحص\n📋 ${usernames.length} يوزر`);

  let found = 0;
  let checked = 0;

  for (const username of usernames) {
    const available = await checkUsername(username);

    if (available) {
      found++;
      await sendToBot(`🎯 متاح!\n@${username}\nt.me/${username}`);
    }

    checked++;
    if (checked % 200 === 0) {
      await sendToBot(`⏳ ${checked}/${usernames.length} | لقينا: ${found}`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  await sendToBot(`✅ انتهى\nفحصت: ${checked}\nمتاح: ${found}`);
}

main();
