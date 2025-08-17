const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 為了相容 GitHub Action 和本地端，使用環境變數 || '預設路徑'
// 建議將 'E:/AAAICEBREG/aaaiceberg-content' 改為 '.'，這樣它會自動使用當前資料夾
const contentRepoPath = process.env.CONTENT_REPO_PATH || '.';
const chartsPath = path.join(contentRepoPath, 'content', 'iceberg-charts');

// --- 新增：定義兩種輸出檔案的名稱 ---
const indexOutputName = 'entries-index.json';
const fullOutputName = 'entries-full.json';

console.log('开始生成词条索引与完整数据...');
console.log(`使用内容路径: ${path.resolve(contentRepoPath)}`);

try {
    const chartDirs = fs.readdirSync(chartsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`检测到 ${chartDirs.length} 个冰山图: ${chartDirs.join(', ')}`);

    for (const chartId of chartDirs) {
        const entriesDir = path.join(chartsPath, chartId, 'entries');

        if (!fs.existsSync(entriesDir)) {
            console.log(`- 冰山图 '${chartId}' 没有找到 entries 目录，已跳过。`);
            continue;
        }

        const entryFiles = fs.readdirSync(entriesDir).filter(file => file.endsWith('.md'));
        
        // --- 新增：為兩種數據分別建立陣列 ---
        const indexData = []; // 用於儲存簡易索引
        const fullData = [];  // 用於儲存完整數據

        console.log(`- 正在处理冰山图 '${chartId}'，发现 ${entryFiles.length} 个词条...`);

        for (const file of entryFiles) {
            const filePath = path.join(entriesDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data: metadata, content } = matter(fileContent);

            // --- 區域 1: 生成簡易索引 (entries-index.json) ---
            // ▼▼▼ 以下是您提供的原有邏輯，完整保留不變 ▼▼▼
            const githubPath = path.join('content/iceberg-charts', chartId, 'entries', file).replace(/\\/g, '/');
            const hasContent = content && content.trim().length > 0;
            const hasTitledLinks = Array.isArray(metadata.titledLinks) && metadata.titledLinks.length > 0;

            indexData.push({
                path: githubPath,
                id: metadata.id || null,
                name: metadata.name || file,
                layer: metadata.layer || null,
                categoryId: metadata.categoryId || null,
                tagIds: metadata.tagIds || [],
                lastUpdated: metadata.lastUpdated || null,
                hasContent: hasContent,
                hasTitledLinks: hasTitledLinks,
            });
            // ▲▲▲ 原有邏輯結束 ▲▲▲

            // --- 區域 2: 生成完整數據 (entries-full.json) ---
            // ▼▼▼ 這是新增的功能 ▼▼▼
            fullData.push({
                ...metadata,   // 包含所有元數據
                body: content  // 包含完整的 Markdown 內容
            });
            // ▲▲▲ 新增功能結束 ▲▲▲
        }

        // --- 寫入檔案 ---
        // 寫入簡易索引檔案
        const indexPath = path.join(chartsPath, chartId, indexOutputName);
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
        console.log(`  ✅ [索引] 索引文件已保存至: ${path.relative(contentRepoPath, indexPath)}`);

        // 寫入完整數據檔案
        const fullPath = path.join(chartsPath, chartId, fullOutputName);
        fs.writeFileSync(fullPath, JSON.stringify(fullData, null, 2));
        console.log(`  ✅ [完整] 完整数据文件已保存至: ${path.relative(contentRepoPath, fullPath)}`);
    }

    console.log('\n所有文件均已成功生成！');

} catch (error) {
    console.error('\n脚本执行出错:', error);
}