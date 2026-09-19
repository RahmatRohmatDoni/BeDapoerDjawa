const fs = require('fs');
const path = require('path');

function search(dir) {
    if (dir.includes('node_modules') || dir.includes('.next')) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            search(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            const content = fs.readFileSync(p, 'utf8');
            if (content.includes('from("orders").insert') || content.includes("from('orders').insert")) {
                console.log(p);
            }
        }
    }
}
search('c:/Users/blu/Desktop/DapoerDjawa/DapoerDjawa');

