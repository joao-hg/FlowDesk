const fs = require('fs');

// Lê o token do arquivo .env para evitar vazamento de segurança
const envContent = fs.readFileSync('.env', 'utf8');
const NOTION_TOKEN = envContent.split('\n').find(line => line.startsWith('NOTION_TOKEN=')).split('=')[1].trim();
const DATABASE_ID = 'c4deb4e281d583a8822d01a151068b0e'; 

async function syncToNotion() {
    try {
        const docContent = fs.readFileSync('DOCUMENTACAO.md', 'utf8');
        
        const blocks = docContent.split('\n').filter(line => line.trim().length > 0).slice(0, 100).map(line => ({
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [{ type: 'text', text: { content: line.substring(0, 2000) } }]
            }
        }));

        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parent: { page_id: DATABASE_ID }, // Modificado de database_id para page_id
                properties: {
                    title: [
                        { text: { content: `Sync: ${new Date().toLocaleString('pt-BR')}` } }
                    ]
                },
                children: blocks
            })
        });

        if (!response.ok) {
            const error = await response.json();
            // Fallback para append blocks direto na página caso não possa criar subpáginas
            if (error.code === 'object_not_found' || error.message.includes('parent')) {
                const responseFallback = await fetch(`https://api.notion.com/v1/blocks/${DATABASE_ID}/children`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${NOTION_TOKEN}`,
                        'Notion-Version': '2022-06-28',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ children: blocks })
                });
                if (!responseFallback.ok) {
                    const fallbackError = await responseFallback.json();
                    console.error('Erro ao sincronizar com o Notion (Page Fallback):', JSON.stringify(fallbackError, null, 2));
                    return;
                }
            } else {
                console.error('Erro ao sincronizar com o Notion:', JSON.stringify(error, null, 2));
                return;
            }
        }
        
        console.log('✅ Sincronizado com o Notion com sucesso!');
    } catch (err) {
        console.error('Falha na execução:', err);
    }
}

syncToNotion();
