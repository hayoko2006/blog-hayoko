/**
 * 前端分页引擎 - 超简修复版
 */

(function() {
    console.log('=== PageEngine 超简版启动 ===');
    
    // 等待页面完全加载
    function init() {
        console.log('PageEngine: 开始初始化');
        
        // 尝试多种容器选择器
        let container = null;
        const selectors = [
            '.post-md[data-paginate="true"]',
            '.post-md',
            '[data-paginate="true"]',
            '.paper-main .post-content',
            '.paper-main > div',
            'article'
        ];
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.children.length > 0) {
                console.log(`PageEngine: 使用选择器 "${selector}" 找到容器`);
                container = el;
                break;
            }
        }
        
        if (!container) {
            console.error('PageEngine: 没有找到内容容器');
            return;
        }
        
        console.log('PageEngine: 找到容器，子元素数量:', container.children.length);
        console.log('PageEngine: 容器HTML:', container.outerHTML.substring(0, 200));
        
        // 检查是否已有分页
        if (container.querySelector('.page-simple')) {
            console.log('PageEngine: 已经分页，跳过');
            return;
        }
        
        // 开始分页
        paginateSimple(container);
    }
    
    function paginateSimple(container) {
        console.log('PageEngine: 开始简单分页');
        
        try {
            // 页面尺寸（A4：210×297mm）
            const mmToPx = (mm) => Math.round((mm / 25.4) * 96);
            const pageWidth = mmToPx(210);  // A4宽度
            const pageHeight = mmToPx(297); // A4高度
            const margin = mmToPx(20);      // 页边距
            const contentHeight = pageHeight - (2 * margin);
            
            console.log(`PageEngine: 页面尺寸 ${pageWidth}×${pageHeight}px, 内容高度: ${contentHeight}px`);
            
            // 保存原始内容
            const original = Array.from(container.children);
            
            // 清空容器
            container.innerHTML = '';
            
            // 简单的分页算法
            let currentPage = [];
            let currentHeight = 0;
            let pages = [];
            
            for (const element of original) {
                // 简单高度估计（实际需要更精确的测量）
                const height = estimateElementHeight(element);
                
                if (currentHeight + height <= contentHeight || currentPage.length === 0) {
                    currentPage.push(element);
                    currentHeight += height;
                } else {
                    pages.push([...currentPage]);
                    currentPage = [element];
                    currentHeight = height;
                }
            }
            
            if (currentPage.length > 0) {
                pages.push(currentPage);
            }
            
            console.log(`PageEngine: 分页完成，共 ${pages.length} 页`);
            
            // 渲染页面
            renderPages(container, pages, pageWidth, pageHeight, margin);
            
        } catch (error) {
            console.error('PageEngine: 分页错误:', error);
        }
    }
    
    function estimateElementHeight(element) {
        // 临时测量
        const temp = document.createElement('div');
        temp.style.cssText = 'position: fixed; top: -9999px; width: 500px;';
        
        const clone = element.cloneNode(true);
        temp.appendChild(clone);
        document.body.appendChild(temp);
        
        const height = clone.offsetHeight;
        document.body.removeChild(temp);
        
        // 添加安全边距
        return height + 10;
    }
    
    function renderPages(container, pages, pageWidth, pageHeight, margin) {
        console.log('PageEngine: 渲染分页');
        
        pages.forEach((pageElements, pageIndex) => {
            // 创建页面
            const page = document.createElement('div');
            page.className = 'page-simple';
            page.style.cssText = `
                width: ${pageWidth}px;
                min-height: ${pageHeight}px;
                background: white;
                margin: 0 auto 20px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                box-sizing: border-box;
                position: relative;
            `;
            
            // 内容区域
            const content = document.createElement('div');
            content.className = 'page-content-simple';
            content.style.cssText = `
                width: ${pageWidth - (2 * margin)}px;
                min-height: ${pageHeight - (2 * margin)}px;
                padding: ${margin}px;
                box-sizing: border-box;
                overflow: hidden;
            `;
            
            // 添加元素
            pageElements.forEach(el => {
                content.appendChild(el.cloneNode(true));
            });
            
            // 页码
            const pageNum = document.createElement('div');
            pageNum.textContent = `第 ${pageIndex + 1} 页`;
            pageNum.style.cssText = `
                position: absolute;
                bottom: 10px;
                right: ${margin + 10}px;
                color: #666;
                font-size: 12px;
            `;
            
            page.appendChild(content);
            page.appendChild(pageNum);
            container.appendChild(page);
        });
        
        // 添加基本样式
        addSimpleStyles();
        
        console.log('PageEngine: 渲染完成');
    }
    
    function addSimpleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .page-simple {
                break-inside: avoid;
            }
            .page-content-simple > *:first-child {
                margin-top: 0;
            }
            .page-content-simple > *:last-child {
                margin-bottom: 0;
            }
            @media print {
                .page-simple {
                    box-shadow: none !important;
                    margin: 0 !important;
                    page-break-after: always;
                }
                .left-toc-container {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 多重初始化保障
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('PageEngine: DOMContentLoaded');
            setTimeout(init, 100);
        });
    } else {
        console.log('PageEngine: 文档已就绪');
        setTimeout(init, 100);
    }
    
    window.addEventListener('load', () => {
        console.log('PageEngine: window.load');
        setTimeout(init, 300);
    });
    
    // 最终备用
    setTimeout(() => {
        if (!document.querySelector('.page-simple')) {
            console.log('PageEngine: 备用初始化');
            init();
        }
    }, 2000);
    
})();