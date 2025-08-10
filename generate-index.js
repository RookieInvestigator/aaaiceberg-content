const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const contentRepoPath = process.env.CONTENT_REPO_PATH || 'E:/AAAICEBREG/aaaiceberg-content'; 
const chartsPath = path.join(contentRepoPath, 'content', 'iceberg-charts');

console.log('开始生成词条索引...');
console.log(`使用内容路径: ${contentRepoPath}`);

try {
    const chartDirs = fs.readdirSync(chartsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`检测到 ${chartDirs.length} 个冰山图: ${chartDirs.join(', ')}`);

    for (const chartId of chartDirs) {
        const entriesDir = path.join(chartsPath, chartId, 'entries');
        const indexPath = path.join(chartsPath, chartId, 'entries-index.json');
        
        if (!fs.existsSync(entriesDir)) {
            console.log(`- 冰山图 '${chartId}' 没有找到 entries 目录，已跳过。`);
            continue;
        }

        const entryFiles = fs.readdirSync(entriesDir).filter(file => file.endsWith('.md'));
        const indexData = [];

        console.log(`- 正在处理冰山图 '${chartId}'，发现 ${entryFiles.length} 个词条...`);

        for (const file of entryFiles) {
            const filePath = path.join(entriesDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');

            const { data: metadata, content } = matter(fileContent);

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

        }
        
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
        console.log(`  成功！索引文件已保存至: ${indexPath}`);
    }

    console.log('\n所有索引文件均已成功生成！');

} catch (error) {
    console.error('\n脚本执行出错:', error);
}