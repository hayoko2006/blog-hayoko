const util = require('hexo-util');
const slugize = util.slugize;
const stripHTML = util.stripHTML;

// 渲染Markdown并提取TOC
function renderMarkdownWithToc(content, options = {}) {
    // 默认选项
    const {
        maxDepth = 3, // 最大标题深度（1: h1, 2: h2, 3: h3）
        minDepth = 1, // 最小标题深度
        anchorIdPrefix = 'heading-',
        generateIds = true
    } = options;

    // 1. 渲染Markdown为HTML
    let html;
    if (typeof content === 'string' && content.trim().startsWith('<')) {
        // 如果内容已经是HTML，直接使用
        html = content;
    } else {
        // 使用Hexo的Markdown渲染器
        html = hexo.render.renderSync({
            text: content,
            engine: 'markdown'
        });
    }

    // 2. 使用cheerio解析HTML
    const cheerio = require('cheerio');
    const $ = cheerio.load(html, {
        decodeEntities: false
    });

    // 3. 提取标题并构建TOC树
    const toc = [];
    const stack = []; // 用于构建树结构的栈
    const usedIds = new Set(); // 记录已使用的ID
    
    // 选择所有h1-h3标题（根据配置）
    const headingSelector = [];
    for (let i = minDepth; i <= maxDepth; i++) {
        headingSelector.push(`h${i}`);
    }
    
    $(headingSelector.join(',')).each(function() {
        const $this = $(this);
        const level = parseInt(this.tagName.substring(1), 10);
        const text = stripHTML($this.html()).trim();
        
        // 生成唯一ID
        let id = $this.attr('id');
        if (!id && generateIds) {
            // 基于标题文本生成slug
            let baseId = slugize(text) || `heading-${usedIds.size + 1}`;
            id = baseId;
            let counter = 1;
            while (usedIds.has(id)) {
                id = `${baseId}-${counter}`;
                counter++;
            }
            usedIds.add(id);
            $this.attr('id', id);
        }
        
        const node = {
            level: level,
            text: text,
            id: id || '',
            children: []
        };
        
        // 构建树结构
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }
        
        if (stack.length === 0) {
            toc.push(node);
            stack.push(node);
        } else {
            stack[stack.length - 1].children.push(node);
            stack.push(node);
        }
    });
    
    // 4. 更新HTML（添加了ID）
    html = $.html();
    
    return {
        html: html,
        toc: toc
    };
}

// 从HTML中提取TOC（不修改HTML）
function extractTocFromHtml(html, options = {}) {
    const {
        maxDepth = 3,
        minDepth = 1,
        generateIds = false
    } = options;
    
    const cheerio = require('cheerio');
    const $ = cheerio.load(html, {
        decodeEntities: false
    });
    
    const toc = [];
    const stack = [];
    const usedIds = new Set();
    
    const headingSelector = [];
    for (let i = minDepth; i <= maxDepth; i++) {
        headingSelector.push(`h${i}`);
    }
    
    $(headingSelector.join(',')).each(function() {
        const $this = $(this);
        const level = parseInt(this.tagName.substring(1), 10);
        const text = stripHTML($this.html()).trim();
        
        let id = $this.attr('id');
        if (!id && generateIds) {
            let baseId = slugize(text) || `heading-${usedIds.size + 1}`;
            id = baseId;
            let counter = 1;
            while (usedIds.has(id)) {
                id = `${baseId}-${counter}`;
                counter++;
            }
            usedIds.add(id);
        }
        
        const node = {
            level: level,
            text: text,
            id: id || '',
            children: []
        };
        
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }
        
        if (stack.length === 0) {
            toc.push(node);
            stack.push(node);
        } else {
            stack[stack.length - 1].children.push(node);
            stack.push(node);
        }
    });
    
    return toc;
}

// 注册Hexo辅助函数
hexo.extend.helper.register('renderMarkdownWithToc', function(content, options) {
    return renderMarkdownWithToc(content, options);
});

hexo.extend.helper.register('extractTocFromHtml', function(html, options) {
    return extractTocFromHtml(html, options);
});

hexo.extend.helper.register('markdownToHtml', function(content) {
    if (typeof content === 'string' && content.trim().startsWith('<')) {
        return content;
    }
    return hexo.render.renderSync({
        text: content,
        engine: 'markdown'
    });
});

// 示例数据（用于测试）
const exampleMarkdown = `# 第一章：引言

这是引言部分。

## 1.1 背景介绍

背景内容。

### 1.1.1 详细说明

详细信息。

## 1.2 研究目的

研究目的内容。

# 第二章：方法

方法章节。`;

// 导出函数供测试使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderMarkdownWithToc,
        extractTocFromHtml
    };
}