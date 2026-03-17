/**
 * 前端分页引擎 - 立即执行版
 * 不等待任何事件，直接执行
 */

(function() {
    'use strict';
    
    console.log('⚡ PageEngine 立即执行版启动');
    
    // 立即执行
    setTimeout(executeNow, 50);
    
    // 后续尝试
    setTimeout(executeNow, 500);
    setTimeout(executeNow, 2000);
    
    function executeNow() {
        console.log('🔄 PageEngine: 执行分页');
        
        // 寻找文章内容
        let container = findArticleContent();
        
        if (!container) {
            console.warn('❌ PageEngine: 找不到内容容器');
            return;
        }
        
        // 如果已经有分页，跳过
        if (container.querySelector('.page-immediate')) {
            console.log('✅ PageEngine: 已经分页');
            return;
        }
        
        console.log('🎯 PageEngine: 找到容器', container.className);
        
        // 创建分页
        createPagination(container);
    }
    
    function findArticleContent() {
        // 优先查找带分页属性的容器
        const paginateContainer = document.querySelector('[data-paginate="true"]');
        if (paginateContainer) return paginateContainer;
        
        // 查找常见的文章容器
        const selectors = [
            '.post-md',
            '.post-content',
            '.article-content',
            '.entry-content',
            '.content',
            'article > div',
            '.paper-main > div'
        ];
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.children.length > 0) {
                return el;
            }
        }
        
        // 最后尝试：查找包含大量文本的容器
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
            if (div.textContent.length > 1000 && div.children.length > 3) {
                return div;
            }
        }
        
        return null;
    }
    
    function createPagination(container) {
        try {
            // A4尺寸
            const pageWidth = 794;  // 210mm ≈ 794px (96 DPI)
            const pageHeight = 1123; // 297mm ≈ 1123px
            const margin = 40;
            const contentHeight = pageHeight - (2 * margin);
            
            console.log(`📐 PageEngine: 创建分页，内容高度: ${contentHeight}px`);
            
            // 备份内容
            const original = container.innerHTML;
            
            // 获取子元素
            const children = Array.from(container.children);
            if (children.length === 0) {
                console.warn('📭 PageEngine: 容器为空');
                return;
            }
            
            // 清空容器
            container.innerHTML = '';
            
            // 分页
            const pages = [];
            let currentPage = [];
            let currentHeight = 0;
            
            for (const child of children) {
                const height = estimateHeight(child);
                
                if (currentHeight + height <= contentHeight || currentPage.length === 0) {
                    currentPage.push(child);
                    currentHeight += height;
                } else {
                    pages.push([...currentPage]);
                    currentPage = [child];
                    currentHeight = height;
                }
            }
            
            if (currentPage.length > 0) {
                pages.push(currentPage);
            }
            
            console.log(`📄 PageEngine: 创建了 ${pages.length} 页`);
            
            // 渲染
            renderPages(container, pages, pageWidth, pageHeight, margin);
            
            // 添加重置功能
            addResetButton(container, original);
            
        } catch (error) {
            console.error('💥 PageEngine: 分页错误:', error);
        }
    }
    
    function estimateHeight(element) {
        // 简单高度估计
        const temp = document.createElement('div');
        temp.style.cssText = 'position: absolute; top: -9999px; width: 700px;';
        
        const clone = element.cloneNode(true);
        temp.appendChild(clone);
        document.body.appendChild(temp);
        
        const height = clone.offsetHeight || 50;
        document.body.removeChild(temp);
        
        return height + 20; // 添加余量
    }
    
    function renderPages(container, pages, pageWidth, pageHeight, margin) {
        pages.forEach((pageElements, index) => {
            const page = document.createElement('div');
            page.className = 'page-immediate';
            page.style.cssText = `
                width: ${pageWidth}px;
                min-height: ${pageHeight}px;
                background: white;
                margin: 20px auto;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                box-sizing: border-box;
                position: relative;
            `;
            
            const content = document.createElement('div');
            content.className = 'page-content-immediate';
            content.style.cssText = `
                width: ${pageWidth - (2 * margin)}px;
                min-height: ${pageHeight - (2 * margin)}px;
                max-height: ${pageHeight - (2 * margin)}px;
                padding: ${margin}px;
                box-sizing: border-box;
                overflow: hidden;
            `;
            
            pageElements.forEach(el => {
                content.appendChild(el.cloneNode(true));
            });
            
            const pageNum = document.createElement('div');
            pageNum.textContent = `第 ${index + 1} 页`;
            pageNum.style.cssText = `
                position: absolute;
                bottom: 10px;
                right: ${margin}px;
                color: #999;
                font-size: 12px;
            `;
            
            page.appendChild(content);
            page.appendChild(pageNum);
            container.appendChild(page);
        });
        
        // 添加样式
        addStyles();
    }
    
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .page-immediate {
                break-inside: avoid;
            }
            .page-content-immediate > *:first-child {
                margin-top: 0;
            }
            .page-content-immediate > *:last-child {
                margin-bottom: 0;
            }
            .page-content-immediate img {
                max-width: 100%;
            }
            @media print {
                .page-immediate {
                    box-shadow: none !important;
                    margin: 0 !important;
                    page-break-after: always;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    function addResetButton(container, originalHTML) {
        const btn = document.createElement('button');
        btn.textContent = '取消分页';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #666;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10000;
            font-size: 12px;
        `;
        btn.onclick = () => {
            container.innerHTML = originalHTML;
            btn.remove();
            console.log('↩️ PageEngine: 已取消分页');
        };
        document.body.appendChild(btn);
    }
    
    // 暴露给控制台
    window.forcePagination = executeNow;
    
})();