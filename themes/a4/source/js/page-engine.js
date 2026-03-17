/**
 * 前端分页引擎 - 模拟Word分页效果
 * 将HTML内容按“纸张”分页显示
 */

class PageEngine {
    /**
     * 创建分页引擎实例
     * @param {HTMLElement} container - 包含内容的容器（如 .post-md）
     * @param {Object} options - 配置选项
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            pageSize: 'A4',           // 页面尺寸：A4, B5, A3
            margin: 20,               // 页边距（单位：mm）
            pageSpacing: 20,          // 页面间距（单位：px）
            showShadow: true,         // 是否显示页面阴影
            dpi: 96,                  // 每英寸像素数
            ...options
        };

        // 页面尺寸定义（单位：mm）
        this.pageSizes = {
            'A4': { width: 210, height: 297 },
            'B5': { width: 176, height: 250 },
            'A3': { width: 297, height: 420 }
        };

        // 分页结果
        this.pages = [];
        this.pageContainers = [];
        
        this.init();
    }

    /**
     * 初始化分页引擎
     */
    init() {
        try {
            console.log('PageEngine: 初始化分页引擎，容器:', this.container);
            
            // 验证容器
            if (!this.container || !this.container.children.length) {
                console.warn('PageEngine: 容器为空或没有子元素');
                return;
            }

            console.log('PageEngine: 容器子元素数量:', this.container.children.length);
            
            // 执行分页
            this.paginate();
        } catch (error) {
            console.error('PageEngine: 初始化过程中发生错误:', error);
            console.error('错误堆栈:', error.stack);
        }
    }

    /**
     * 将毫米转换为像素
     * @param {number} mm - 毫米值
     * @returns {number} 像素值
     */
    mmToPx(mm) {
        const inches = mm / 25.4; // 1英寸 = 25.4毫米
        return inches * this.options.dpi;
    }

    /**
     * 获取当前配置的页面尺寸（像素）
     * @returns {Object} {width, height, contentWidth, contentHeight}
     */
    getPageDimensions() {
        const size = this.pageSizes[this.options.pageSize];
        if (!size) {
            console.warn(`PageEngine: 未知的页面尺寸 ${this.options.pageSize}，使用 A4 作为默认值`);
            return this.getPageDimensions('A4');
        }

        const width = this.mmToPx(size.width);
        const height = this.mmToPx(size.height);
        const margin = this.mmToPx(this.options.margin);
        
        return {
            width,
            height,
            margin,
            contentWidth: width - (2 * margin),
            contentHeight: height - (2 * margin)
        };
    }

    /**
     * 测量元素高度（考虑边距、边框等）
     * @param {HTMLElement} element - 要测量的元素
     * @param {HTMLElement} measureContainer - 测量容器
     * @returns {number} 元素高度（像素）
     */
    measureElementHeight(element, measureContainer) {
        // 克隆元素进行测量
        const clone = element.cloneNode(true);
        clone.style.visibility = 'hidden';
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.left = '-9999px';
        clone.style.width = '100%';
        
        measureContainer.appendChild(clone);
        const height = clone.offsetHeight;
        
        // 获取计算样式以包括垂直外边距
        const style = window.getComputedStyle(clone);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        
        measureContainer.removeChild(clone);
        
        // 返回总高度（元素高度 + 上下外边距）
        return height + marginTop + marginBottom;
    }

    /**
     * 获取需要分页的块级元素
     * @returns {Array<HTMLElement>} 块级元素数组
     */
    getBlockElements() {
        const elements = [];
        
        /**
         * 递归遍历DOM树，收集需要分页的块级元素
         * @param {HTMLElement} element - 当前元素
         */
        const traverse = (element) => {
            // 检查当前元素是否为块级元素
            const isBlock = this.isBlockElement(element);
            
            // 检查元素是否有块级子元素
            let hasBlockChildren = false;
            for (let child of element.children) {
                if (this.isBlockElement(child)) {
                    hasBlockChildren = true;
                    break;
                }
            }
            
            // 如果是块级元素且没有块级子元素，则添加到列表
            // 或者如果是特定的容器元素（如div、section），但包含需要单独处理的块级内容
            if (isBlock) {
                // 特殊处理：某些元素应该总是被包含，即使有块级子元素
                const selfContainedTags = ['img', 'hr', 'table', 'iframe', 'pre', 'blockquote'];
                if (selfContainedTags.includes(element.tagName.toLowerCase()) || !hasBlockChildren) {
                    elements.push(element);
                    return; // 不继续遍历子元素，因为已包含整个元素
                }
                // 如果有块级子元素，则继续遍历子元素
            }
            
            // 遍历子元素
            for (let child of element.children) {
                traverse(child);
            }
            
            // 处理文本节点？不，文本节点不是块级元素
        };
        
        // 从容器的直接子元素开始遍历
        for (let child of this.container.children) {
            traverse(child);
        }
        
        return elements;
    }

    /**
     * 判断元素是否为块级元素
     * @param {HTMLElement} element 
     * @returns {boolean}
     */
    isBlockElement(element) {
        try {
            const display = window.getComputedStyle(element).display;
            // 包括所有可能表现为块级的显示类型
            return display === 'block' || 
                   display === 'inline-block' ||
                   display === 'flex' || 
                   display === 'grid' ||
                   display === 'table' ||
                   display === 'inline-table' ||
                   display === 'list-item' ||
                   display === 'table-row' ||
                   display === 'table-row-group' ||
                   display === 'table-header-group' ||
                   display === 'table-footer-group' ||
                   display === 'table-cell' ||
                   display === 'table-column' ||
                   display === 'table-column-group' ||
                   display === 'table-caption' ||
                   display === 'flow-root';
        } catch (error) {
            console.warn('PageEngine: 无法获取元素显示类型:', element, error);
            // 如果无法获取计算样式，则根据标签名猜测
            const blockTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'img', 'hr', 'br', 'pre', 'blockquote', 'figure', 'figcaption', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main', 'form', 'fieldset', 'legend', 'textarea', 'select', 'option', 'button', 'canvas', 'video', 'audio', 'iframe', 'object', 'embed'];
            return blockTags.includes(element.tagName.toLowerCase());
        }
    }

    /**
     * 执行分页算法
     */
    paginate() {
        try {
            // 获取页面尺寸
            const dimensions = this.getPageDimensions();
            console.log('PageEngine: 页面尺寸:', dimensions);
            const pageHeight = dimensions.contentHeight;
            console.log('PageEngine: 页面内容高度:', pageHeight, 'px');
            
            // 创建测量容器 - 复制原始容器的类名以保持CSS上下文
            const measureContainer = document.createElement('div');
            measureContainer.className = this.container.className;
            measureContainer.style.cssText = `
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: ${dimensions.contentWidth}px;
                visibility: hidden;
                overflow: visible;
            `;
            document.body.appendChild(measureContainer);

        // 获取块级元素
        const elements = this.getBlockElements();
        if (elements.length === 0) {
            console.warn('PageEngine: 没有找到可分页的块级元素');
            document.body.removeChild(measureContainer);
            return;
        }

        // 测量每个元素的高度
        console.log('PageEngine: 开始测量', elements.length, '个元素的高度');
        const elementHeights = elements.map(el => 
            this.measureElementHeight(el, measureContainer)
        );
        console.log('PageEngine: 元素高度测量完成:', elementHeights);

        // 清理测量容器
        document.body.removeChild(measureContainer);

        // 分页算法
        this.pages = [];
        let currentPage = [];
        let currentHeight = 0;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const height = elementHeights[i];

            // 如果当前页为空或元素可以放入当前页（添加2px缓冲区防止溢出）
            if (currentHeight + height <= pageHeight - 2) {
                currentPage.push(element);
                currentHeight += height;
            } else {
                // 如果元素不能放入当前页
                if (currentPage.length > 0) {
                    // 保存当前页
                    this.pages.push([...currentPage]);
                    currentPage = [element];
                    currentHeight = height;
                } else {
                    // 单个元素高度超过页面高度，强制放在单独一页
                    this.pages.push([element]);
                    currentHeight = 0;
                }
            }
        }

        // 添加最后一页
        if (currentPage.length > 0) {
            this.pages.push(currentPage);
        }

        console.log('PageEngine: 分页完成，共', this.pages.length, '页');
        console.log('PageEngine: 每页元素数量:', this.pages.map(page => page.length));
        
        // 渲染分页
        this.renderPages(dimensions);
        } catch (error) {
            console.error('PageEngine: 分页过程中发生错误:', error);
            console.error('错误堆栈:', error.stack);
        }
    }

    /**
     * 渲染分页
     * @param {Object} dimensions - 页面尺寸
     */
    renderPages(dimensions) {
        try {
            // 保存原始内容到实例变量
            this.originalContent = Array.from(this.container.children);
            
            // 清空容器
            this.container.innerHTML = '';
            
            // 创建页面容器
            this.pageContainers = [];
        
        this.pages.forEach((pageElements, pageIndex) => {
            // 创建页面容器
            const pageContainer = document.createElement('div');
            pageContainer.className = 'page-engine-page';
            pageContainer.dataset.pageIndex = pageIndex;
            
            // 应用页面样式
            pageContainer.style.cssText = `
                width: ${dimensions.width}px;
                min-height: ${dimensions.height}px;
                background: white;
                margin: 0 auto ${this.options.pageSpacing}px;
                position: relative;
                box-sizing: border-box;
                ${this.options.showShadow ? 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);' : ''}
                page-break-inside: avoid;
            `;
            
            // 创建内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'page-engine-content';
            contentContainer.style.cssText = `
                width: ${dimensions.contentWidth}px;
                min-height: ${dimensions.contentHeight}px;
                max-height: ${dimensions.contentHeight}px;
                padding: ${dimensions.margin}px;
                box-sizing: border-box;
                position: relative;
                margin: 0 auto;
                overflow: hidden;
            `;
            
            // 添加元素到内容容器
            pageElements.forEach(element => {
                contentContainer.appendChild(element.cloneNode(true));
            });
            
            // 添加页码
            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-engine-number';
            pageNumber.textContent = `第 ${pageIndex + 1} 页`;
            pageNumber.style.cssText = `
                position: absolute;
                bottom: 10px;
                right: ${dimensions.margin + 10}px;
                color: #666;
                font-size: 12px;
                font-family: Arial, sans-serif;
            `;
            
            pageContainer.appendChild(contentContainer);
            pageContainer.appendChild(pageNumber);
            this.container.appendChild(pageContainer);
            this.pageContainers.push(pageContainer);
        });

        // 添加分页引擎样式
        this.addStyles(dimensions);
        
        console.log(`PageEngine: 成功分页，共 ${this.pages.length} 页`);
        } catch (error) {
            console.error('PageEngine: 渲染分页过程中发生错误:', error);
            console.error('错误堆栈:', error.stack);
        }
    }

    /**
     * 添加分页引擎样式
     * @param {Object} dimensions - 页面尺寸
     */
    addStyles(dimensions) {
        // 检查样式是否已添加
        if (document.getElementById('page-engine-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'page-engine-styles';
        style.textContent = `
            .page-engine-page {
                break-inside: avoid;
            }
            
            .page-engine-content {
                overflow: hidden;
            }
            
            .page-engine-content > *:first-child {
                margin-top: 0;
            }
            
            .page-engine-content > *:last-child {
                margin-bottom: 0;
            }
            
            /* 打印样式 */
            @media print {
                .page-engine-page {
                    box-shadow: none !important;
                    margin: 0 !important;
                    page-break-after: always;
                }
                
                .page-engine-number {
                    display: block;
                }
                
                body {
                    background: white !important;
                }
                
                .word-layout {
                    background: white !important;
                    padding: 0 !important;
                }
                
                .left-toc-container {
                    display: none !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 更新配置并重新分页
     * @param {Object} newOptions - 新配置
     */
    update(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.paginate();
    }

    /**
     * 重置为原始内容
     */
    reset() {
        this.container.innerHTML = '';
        if (this.originalContent) {
            this.originalContent.forEach(child => {
                this.container.appendChild(child);
            });
        }
        this.pages = [];
        this.pageContainers = [];
        
        // 移除样式
        const style = document.getElementById('page-engine-styles');
        if (style) {
            style.remove();
        }
    }
}

// 自动初始化（如果容器有特定类名）
function initPageEngine() {
    console.log('PageEngine: 初始化函数被调用，文档状态:', document.readyState);
    
    // 查找所有需要分页的容器
    const paginateContainers = document.querySelectorAll('.post-md[data-paginate="true"]');
    console.log('PageEngine: 找到分页容器数量:', paginateContainers.length);
    
    if (paginateContainers.length === 0) {
        console.warn('PageEngine: 没有找到需要分页的容器');
        console.warn('PageEngine: 尝试查找所有 .post-md 容器:', document.querySelectorAll('.post-md').length);
        console.warn('PageEngine: 当前页面URL:', window.location.href);
        return;
    }
    
    paginateContainers.forEach((container, index) => {
        console.log(`PageEngine: 初始化容器 ${index + 1}`, container);
        console.log(`PageEngine: 容器类名:`, container.className);
        console.log(`PageEngine: 容器子元素数量:`, container.children.length);
        console.log(`PageEngine: 容器data属性:`, {
            paginate: container.dataset.paginate,
            pageSize: container.dataset.pageSize,
            margin: container.dataset.margin,
            spacing: container.dataset.spacing
        });
        
        // 检查容器是否可见
        const style = window.getComputedStyle(container);
        console.log(`PageEngine: 容器显示状态:`, {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity
        });
        
        const pageSize = container.dataset.pageSize || 'A4';
        const margin = parseInt(container.dataset.margin) || 20;
        const spacing = parseInt(container.dataset.spacing) || 20;
        
        try {
            new PageEngine(container, {
                pageSize,
                margin,
                pageSpacing: spacing,
                showShadow: true
            });
            console.log(`PageEngine: 容器 ${index + 1} 初始化成功`);
        } catch (error) {
            console.error(`PageEngine: 容器 ${index + 1} 初始化失败:`, error);
            console.error('错误堆栈:', error.stack);
        }
    });
}

// 在 DOMContentLoaded 时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('PageEngine: DOMContentLoaded 事件触发');
    initPageEngine();
});

// 备用初始化：如果 DOMContentLoaded 已经触发，直接初始化
if (document.readyState === 'loading') {
    // 仍在加载，等待 DOMContentLoaded
    console.log('PageEngine: 文档仍在加载，等待 DOMContentLoaded');
} else {
    // DOMContentLoaded 已经触发，直接初始化
    console.log('PageEngine: 文档已加载，直接初始化');
    setTimeout(initPageEngine, 100); // 短暂延迟以确保所有元素就绪
}

// 额外的安全初始化：在 window.onload 时也尝试初始化
window.addEventListener('load', () => {
    console.log('PageEngine: window.load 事件触发，检查是否有遗漏的容器');
    // 再次检查，以防动态加载的内容
    setTimeout(initPageEngine, 500);
});

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageEngine;
}