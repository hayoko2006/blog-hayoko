/**
 * 前端分页引擎 - 最终暴力版
 * 无论如何都会尝试分页
 */

(function() {
    'use strict';
    
    console.log('🚀 PageEngine 最终版启动');
    
    // 主函数
    function runPageEngine() {
        // 检查是否存在文档模式切换器
        if (window.DocumentModeSwitcher) {
            console.log('🔍 PageEngine: 文档模式切换器已存在，跳过自动分页');
            return;
        }
        
        // 检查是否有分页属性但值为false
        const allPaginateContainers = document.querySelectorAll('[data-paginate]');
        for (const container of allPaginateContainers) {
            const paginateValue = container.getAttribute('data-paginate');
            if (paginateValue === 'false' || paginateValue === false) {
                console.log('🔍 PageEngine: 容器设置了 data-paginate="false"，跳过自动分页');
                return;
            }
        }
        
        console.log('🔍 PageEngine: 寻找内容容器');
        
        let bestContainer = null;
        
        // 1. 优先查找带有分页属性的容器
        const paginateContainers = document.querySelectorAll('[data-paginate="true"]');
        if (paginateContainers.length > 0) {
            console.log(`✅ PageEngine: 找到 ${paginateContainers.length} 个带分页属性的容器`);
            // 选择第一个有内容的容器
            for (const container of paginateContainers) {
                if (container.children.length > 0) {
                    bestContainer = container;
                    break;
                }
            }
        }
        
        // 2. 如果没有找到，查找常见的文章容器
        if (!bestContainer) {
            const commonSelectors = [
                '.post-md',
                '.post-content',
                '.paper-main .post-body',
                '.paper-main > div',
                'article .content',
                '.entry-content'
            ];
            
            for (const selector of commonSelectors) {
                const container = document.querySelector(selector);
                if (container && container.children.length > 0) {
                    bestContainer = container;
                    console.log(`✅ PageEngine: 使用选择器 "${selector}" 找到容器`);
                    break;
                }
            }
        }
        
        // 3. 如果还没找到，使用暴力查找
        if (!bestContainer) {
            console.log('⚠️ PageEngine: 使用暴力查找容器');
            const allDivs = document.querySelectorAll('div');
            let maxChildCount = 0;
            
            for (const div of allDivs) {
                const childCount = div.children.length;
                const textLength = div.textContent.length;
                
                if (childCount > 3 && textLength > 300) {
                    if (childCount > maxChildCount) {
                        maxChildCount = childCount;
                        bestContainer = div;
                    }
                }
            }
        }
        
        // 4. 最终后备
        if (!bestContainer) {
            bestContainer = document.querySelector('main') || document.querySelector('article') || document.body;
            console.log('⚠️ PageEngine: 使用后备容器:', bestContainer.tagName);
        }
        
        if (!bestContainer) {
            console.error('❌ PageEngine: 无法找到任何容器');
            return;
        }
        
        console.log('✅ PageEngine: 选择容器:', bestContainer.tagName, bestContainer.className);
        console.log('  子元素数量:', bestContainer.children.length);
        console.log('  文本长度:', bestContainer.textContent.length);
        
        // 检查是否已经有分页
        if (bestContainer.querySelector('.page-final')) {
            console.log('⚠️ PageEngine: 已经分页，跳过');
            return;
        }
        
        // 执行分页
        try {
            createPages(bestContainer);
            console.log('🎉 PageEngine: 分页完成！');
        } catch (error) {
            console.error('❌ PageEngine: 分页失败:', error);
            console.error('错误详情:', error.message);
            console.error('错误堆栈:', error.stack);
        }
    }
    
    function createPages(container) {
        // 页面尺寸（A4）
        const mmToPx = (mm) => Math.round((mm / 25.4) * 96);
        const pageWidth = mmToPx(210);
        const pageHeight = mmToPx(297);
        const margin = mmToPx(20);
        const contentHeight = pageHeight - (2 * margin);
        
        console.log(`📏 PageEngine: 页面 ${pageWidth}×${pageHeight}px, 内容区 ${contentHeight}px`);
        
        // 保存原始内容
        const originalChildren = Array.from(container.children);
        if (originalChildren.length === 0) {
            console.warn('📭 PageEngine: 容器为空，无法分页');
            return;
        }
        
        // 备份原始HTML（用于重置）
        const originalHTML = container.innerHTML;
        
        // 清空容器
        container.innerHTML = '';
        
        // 分页
        const pages = [];
        let currentPage = [];
        let currentHeight = 0;
        
        for (const child of originalChildren) {
            const height = measureHeight(child);
            
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
        const totalPages = pages.length;
        
        // 渲染页面
        pages.forEach((pageElements, pageIndex) => {
            const page = document.createElement('div');
            page.className = 'page-final';
            page.dataset.pageNum = pageIndex + 1;
            
            page.style.cssText = `
                width: ${pageWidth}px;
                min-height: ${pageHeight}px;
                background: white;
                margin: 30px auto 40px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
                border-radius: 3px;
                position: relative;
                box-sizing: border-box;
                page-break-inside: avoid;
            `;
            
            const content = document.createElement('div');
            content.className = 'page-content-final';
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
            
            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-footer-final';
            pageNumber.textContent = `第 ${pageIndex + 1} 页，共 ${totalPages} 页`;
            pageNumber.style.cssText = `
                position: absolute;
                bottom: 12px;
                left: 50%;
                transform: translateX(-50%);
                color: #666;
                font-size: 12px;
                font-family: 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
                text-align: center;
                width: 100%;
            `;
            
            page.appendChild(content);
            page.appendChild(pageNumber);
            container.appendChild(page);
        });
        
        // 添加重置按钮（调试用）
        if (pages.length > 1) {
            const resetBtn = document.createElement('button');
            resetBtn.textContent = '重置分页';
            resetBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                z-index: 9999;
                font-size: 12px;
            `;
            resetBtn.onclick = () => {
                container.innerHTML = originalHTML;
                resetBtn.remove();
                console.log('🔄 PageEngine: 已重置');
            };
            document.body.appendChild(resetBtn);
        }
        
        // 添加样式
        addStyles();
    }
    
    function measureHeight(element) {
        // 创建更接近实际环境的测量容器
        const temp = document.createElement('div');
        temp.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 794px; /* A4宽度 */
            max-width: 794px;
            visibility: hidden;
            box-sizing: border-box;
        `;
        
        const clone = element.cloneNode(true);
        
        // 确保克隆元素的样式不影响测量
        clone.style.boxSizing = 'border-box';
        clone.style.maxWidth = '100%';
        
        temp.appendChild(clone);
        document.body.appendChild(temp);
        
        // 获取精确高度（包括边距）
        const height = clone.offsetHeight;
        const style = window.getComputedStyle(clone);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const totalHeight = height + marginTop + marginBottom;
        
        document.body.removeChild(temp);
        
        // 增加更多余量防止溢出，特别是对于第二页及以后
        return Math.ceil(totalHeight * 1.15) + 10;
    }
    
    function addStyles() {
        const styleId = 'page-engine-final-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Word风格分页样式 */
            .page-final {
                break-inside: avoid;
                font-family: 'Microsoft YaHei', 'Segoe UI', 'Calibri', Arial, sans-serif;
            }
            
            .page-content-final {
                font-size: 14px;
                line-height: 1.6;
                color: #333;
            }
            
            .page-content-final > *:first-child {
                margin-top: 0;
            }
            
            .page-content-final > *:last-child {
                margin-bottom: 0;
            }
            
            .page-footer-final {
                font-family: 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
                font-size: 12px;
                color: #666;
                letter-spacing: 0.5px;
            }
            
            /* 防止内容溢出 */
            .page-content-final img {
                max-width: 100% !important;
                height: auto !important;
                display: block;
            }
            
            .page-content-final table {
                width: 100% !important;
                max-width: 100% !important;
                border-collapse: collapse;
                table-layout: fixed;
            }
            
            .page-content-final pre,
            .page-content-final code {
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                max-width: 100%;
                overflow-x: auto;
            }
            
            .page-content-final h1,
            .page-content-final h2,
            .page-content-final h3,
            .page-content-final h4,
            .page-content-final h5,
            .page-content-final h6 {
                page-break-after: avoid;
                page-break-inside: avoid;
            }
            
            .page-content-final p {
                page-break-inside: avoid;
                orphans: 3;
                widows: 3;
            }
            
            .page-content-final ul,
            .page-content-final ol {
                page-break-inside: avoid;
            }
            
            .page-content-final blockquote {
                page-break-inside: avoid;
            }
            
            /* 打印优化 */
            @media print {
                .page-final {
                    box-shadow: none !important;
                    margin: 0 !important;
                    border: 1px solid #ddd !important;
                    page-break-after: always;
                }
                
                .page-content-final {
                    padding: 2cm !important;
                }
                
                .page-footer-final {
                    position: fixed !important;
                    bottom: 1cm !important;
                }
                
                button {
                    display: none !important;
                }
                
                body {
                    background: white !important;
                }
                
                .left-toc-container,
                .post-header,
                .footer,
                .post-footer-pre-next {
                    display: none !important;
                }
            }
            
            /* 屏幕显示优化 */
            @media screen {
                .page-final {
                    transition: box-shadow 0.3s ease;
                }
                
                .page-final:hover {
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 多重初始化策略
    const strategies = [
        { name: 'DOMContentLoaded', wait: 100 },
        { name: 'window.load', wait: 300 },
        { name: '定时器1', wait: 1000 },
        { name: '定时器2', wait: 3000 },
        { name: '最终尝试', wait: 5000 }
    ];
    
    strategies.forEach(strategy => {
        if (strategy.name === 'DOMContentLoaded') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(runPageEngine, strategy.wait);
            });
        } else if (strategy.name === 'window.load') {
            window.addEventListener('load', () => {
                setTimeout(runPageEngine, strategy.wait);
            });
        } else {
            setTimeout(() => {
                if (!document.querySelector('.page-final')) {
                    console.log(`⏰ PageEngine: ${strategy.name}`);
                    runPageEngine();
                }
            }, strategy.wait);
        }
    });
    
    // 暴露给全局，方便调试
    window.PageEngineFinal = {
        run: runPageEngine,
        version: '1.0-final'
    };
    
    console.log('⚙️ PageEngine: 初始化策略已设置');
    
})();