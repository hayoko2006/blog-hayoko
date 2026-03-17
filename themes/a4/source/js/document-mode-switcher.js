/**
 * 文档显示模式切换器 - 支持分页模式与连续滚动模式切换
 * 功能：分页/连续模式切换、页面尺寸调整（A4/A5/B5）、状态保持、平滑过渡
 */

(function() {
    'use strict';
    
    console.log('📄 DocumentModeSwitcher 启动');
    
    // 配置
    const CONFIG = {
        defaultMode: 'paginated', // 默认模式：paginated | continuous
        defaultPageSize: 'A4',    // 默认页面尺寸
        pageSizes: {
            'A4': { width: 210, height: 297, name: 'A4' },
            'A5': { width: 148, height: 210, name: 'A5' },
            'B5': { width: 176, height: 250, name: 'B5' },
            'Letter': { width: 216, height: 279, name: 'Letter' }
        },
        margin: 20,               // 页边距（mm）
        pageSpacing: 20,          // 页面间距（px）
        showShadow: true,         // 是否显示页面阴影
        dpi: 96,                  // 每英寸像素数
        animationDuration: 300    // 切换动画时长（ms）
    };
    
    // 状态管理
    const state = {
        mode: CONFIG.defaultMode,
        pageSize: CONFIG.defaultPageSize,
        zoom: 100, // 缩放比例，默认100%
        paginatedState: {
            currentPage: 0,
            totalPages: 0,
            scrollY: 0
        },
        continuousState: {
            scrollPercentage: 0,
            activeHeadingId: null
        },
        tocState: {
            activeHeadingId: null,
            headingToPageMap: new Map(), // 标题ID到页码的映射
            observer: null
        },
        isInitialized: false
    };
    
    // DOM元素引用
    let elements = {
        container: null,          // 文章内容容器 (.post-md)
        originalContent: null,    // 原始内容备份
        switcherUI: null,         // 切换UI容器
        modeToggle: null,         // 模式切换按钮
        sizeSelect: null,         // 页面尺寸选择器
        zoomSelect: null,         // 缩放比例选择器
        currentPageIndicator: null // 当前页码指示器（仅分页模式）
    };
    
    // 主控制器
    const DocumentModeSwitcher = {
        
        /**
         * 初始化
         */
        init() {
            console.log('🔧 DocumentModeSwitcher: 初始化');
            
            try {
                // 查找内容容器
                this.findContentContainer();
                if (!elements.container) {
                    console.error('❌ DocumentModeSwitcher: 找不到内容容器');
                    return;
                }
                
                // 备份原始内容
                this.backupOriginalContent();
                
                // 创建UI控件
                this.createSwitcherUI();
                
                // 应用初始模式
                this.applyMode(state.mode);
                
                // 保存初始状态
                this.saveState();
                
                state.isInitialized = true;
                console.log('✅ DocumentModeSwitcher: 初始化完成');
                
                // 绑定事件
                this.bindEvents();
                
            } catch (error) {
                console.error('❌ DocumentModeSwitcher: 初始化失败:', error);
            }
        },
        
        /**
         * 查找内容容器
         */
        findContentContainer() {
            // 优先查找带分页属性的容器
            const paginateContainers = document.querySelectorAll('[data-paginate="true"]');
            if (paginateContainers.length > 0) {
                for (const container of paginateContainers) {
                    if (container.children.length > 0) {
                        elements.container = container;
                        console.log('✅ 找到带分页属性的容器:', container);
                        break;
                    }
                }
            }
            
            // 如果没找到，查找常见的文章容器
            if (!elements.container) {
                const selectors = [
                    '.post-md',
                    '.post-content',
                    '.paper-main .post-body',
                    '.paper-main > div',
                    'article .content'
                ];
                
                for (const selector of selectors) {
                    const container = document.querySelector(selector);
                    if (container && container.children.length > 0) {
                        elements.container = container;
                        console.log(`✅ 使用选择器 "${selector}" 找到容器`);
                        break;
                    }
                }
            }
            
            if (elements.container) {
                console.log('📦 容器信息:', {
                    tagName: elements.container.tagName,
                    className: elements.container.className,
                    childCount: elements.container.children.length
                });
            }
        },
        
        /**
         * 备份原始内容
         */
        backupOriginalContent() {
            elements.originalContent = elements.container.innerHTML;
            console.log('💾 原始内容已备份，长度:', elements.originalContent.length);
        },
        
        /**
         * 创建切换UI
         */
        createSwitcherUI() {
            // 创建UI容器
            elements.switcherUI = document.createElement('div');
            elements.switcherUI.className = 'doc-mode-switcher';
            elements.switcherUI.innerHTML = `
                <div class="doc-mode-switcher-container">
                    <div class="doc-mode-switcher-group">
                        <button class="doc-mode-toggle" title="切换显示模式 (Alt+M)">
                            <span class="doc-mode-icon paginated">📄</span>
                            <span class="doc-mode-icon continuous">📜</span>
                            <span class="doc-mode-label">分页模式</span>
                        </button>
                        
                        <div class="doc-mode-size-selector">
                            <select class="doc-size-select" title="页面尺寸">
                                <option value="A4">A4</option>
                                <option value="A5">A5</option>
                                <option value="B5">B5</option>
                                <option value="Letter">Letter</option>
                            </select>
                        </div>
                        
                        <div class="doc-mode-zoom-selector">
                            <select class="doc-zoom-select" title="缩放比例">
                                <option value="50">50%</option>
                                <option value="100" selected>100%</option>
                                <option value="150">150%</option>
                            </select>
                        </div>
                        
                        <div class="doc-page-nav" style="display: none;">
                            <button class="doc-nav-btn doc-nav-prev" title="上一页 (←)">
                                ←
                            </button>
                            <div class="doc-nav-input-group">
                                <input type="number" class="doc-nav-input" min="1" value="1" title="输入页码跳转">
                                <span class="doc-nav-separator">/</span>
                                <span class="doc-nav-total">1</span>
                            </div>
                            <button class="doc-nav-btn doc-nav-next" title="下一页 (→)">
                                →
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // 获取子元素引用
            elements.modeToggle = elements.switcherUI.querySelector('.doc-mode-toggle');
            elements.sizeSelect = elements.switcherUI.querySelector('.doc-size-select');
            elements.zoomSelect = elements.switcherUI.querySelector('.doc-zoom-select');
            elements.pageNav = elements.switcherUI.querySelector('.doc-page-nav');
            elements.navPrevBtn = elements.switcherUI.querySelector('.doc-nav-prev');
            elements.navNextBtn = elements.switcherUI.querySelector('.doc-nav-next');
            elements.navInput = elements.switcherUI.querySelector('.doc-nav-input');
            elements.navTotal = elements.switcherUI.querySelector('.doc-nav-total');
            
            // 设置初始值
            elements.sizeSelect.value = state.pageSize;
            elements.zoomSelect.value = state.zoom;
            
            // 添加到页面
            document.body.appendChild(elements.switcherUI);
            console.log('🎨 切换UI已创建');
        },
        
        /**
         * 绑定事件
         */
        bindEvents() {
            // 模式切换按钮
            elements.modeToggle.addEventListener('click', () => {
                this.toggleMode();
            });
            
            // 页面尺寸选择
            elements.sizeSelect.addEventListener('change', (e) => {
                this.changePageSize(e.target.value);
            });
            
            // 缩放比例选择
            elements.zoomSelect.addEventListener('change', (e) => {
                this.changeZoom(parseInt(e.target.value));
            });
            
            // 上一页按钮
            if (elements.navPrevBtn) {
                elements.navPrevBtn.addEventListener('click', () => {
                    this.navigateToPage(state.paginatedState.currentPage - 1);
                });
            }
            
            // 下一页按钮
            if (elements.navNextBtn) {
                elements.navNextBtn.addEventListener('click', () => {
                    this.navigateToPage(state.paginatedState.currentPage + 1);
                });
            }
            
            // 页码输入框
            if (elements.navInput) {
                elements.navInput.addEventListener('change', (e) => {
                    const pageNum = parseInt(e.target.value);
                    if (!isNaN(pageNum)) {
                        this.navigateToPage(pageNum - 1);
                    }
                });
                
                elements.navInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const pageNum = parseInt(e.target.value);
                        if (!isNaN(pageNum)) {
                            this.navigateToPage(pageNum - 1);
                        }
                    }
                });
            }
            
            // 键盘快捷键
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === 'm') {
                    e.preventDefault();
                    this.toggleMode();
                } else if (state.mode === 'paginated') {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        this.navigateToPage(state.paginatedState.currentPage - 1);
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        this.navigateToPage(state.paginatedState.currentPage + 1);
                    }
                }
            });
            
            // 窗口大小变化时调整UI位置
            window.addEventListener('resize', () => {
                this.updateUIPosition();
            });
            
            // 滚动事件（用于连续模式）
            window.addEventListener('scroll', () => {
                if (state.mode === 'continuous') {
                    this.updateTOCHighlight();
                }
            });
            
            console.log('🎮 事件绑定完成');
        },
        
        /**
         * 初始化目录与正文滚动联动
         */
        initTOCSync() {
            console.log('📑 初始化目录与正文滚动联动');
            
            // 清除之前的observer
            if (state.tocState.observer) {
                state.tocState.observer.disconnect();
            }
            
            // 重置标题到页码的映射
            state.tocState.headingToPageMap.clear();
            
            // 查找所有标题元素
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length === 0) {
                console.log('⚠️ 未找到标题元素，跳过目录联动初始化');
                return;
            }
            
            // 建立标题到页码的映射
            if (state.mode === 'paginated') {
                const pages = document.querySelectorAll('.doc-page');
                pages.forEach((page, pageIndex) => {
                    const pageHeadings = page.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    pageHeadings.forEach(heading => {
                        if (heading.id) {
                            state.tocState.headingToPageMap.set(heading.id, pageIndex);
                            console.log(`📑 标题 ${heading.id} 映射到第 ${pageIndex + 1} 页`);
                        }
                    });
                });
            } else {
                // 连续模式下，所有标题都在同一页
                headings.forEach(heading => {
                    if (heading.id) {
                        state.tocState.headingToPageMap.set(heading.id, 0);
                    }
                });
            }
            
            // 创建IntersectionObserver
            state.tocState.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const headingId = entry.target.id;
                        if (headingId) {
                            state.tocState.activeHeadingId = headingId;
                            this.updateTOCHighlight();
                            
                            // 如果在分页模式下，更新当前页码
                            if (state.mode === 'paginated') {
                                const pageIndex = state.tocState.headingToPageMap.get(headingId);
                                if (pageIndex !== undefined && pageIndex !== state.paginatedState.currentPage) {
                                    state.paginatedState.currentPage = pageIndex;
                                    this.updateUI();
                                }
                            }
                        }
                    }
                });
            }, {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            });
            
            // 观察所有标题元素
            headings.forEach(heading => {
                state.tocState.observer.observe(heading);
            });
            
            // 绑定目录点击事件
            this.bindTOCLinks();
            
            console.log('✅ 目录与正文滚动联动初始化完成');
            console.log(`📑 建立了 ${state.tocState.headingToPageMap.size} 个标题到页码的映射`);
        },
        
        /**
         * 更新目录高亮
         */
        updateTOCHighlight() {
            if (!state.tocState.activeHeadingId) return;
            
            // 查找目录元素
            const tocLinks = document.querySelectorAll('.post-toc a');
            if (tocLinks.length === 0) return;
            
            // 移除所有高亮
            tocLinks.forEach(link => {
                link.style.fontWeight = 'normal';
                link.style.color = '';
            });
            
            // 高亮当前标题对应的目录项
            tocLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href === `#${state.tocState.activeHeadingId}`) {
                    link.style.fontWeight = 'bold';
                    link.style.color = '#4f7dde';
                    
                    // 滚动目录到可见区域
                    link.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        },
        
        /**
         * 绑定目录点击事件
         */
        bindTOCLinks() {
            const tocLinks = document.querySelectorAll('.post-toc a');
            tocLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        const headingId = href.substring(1);
                        const heading = document.getElementById(headingId);
                        if (heading) {
                            // 如果在分页模式下，导航到对应的页面
                            if (state.mode === 'paginated') {
                                const pageIndex = state.tocState.headingToPageMap.get(headingId);
                                if (pageIndex !== undefined) {
                                    this.navigateToPage(pageIndex);
                                    // 滚动到标题位置
                                    setTimeout(() => {
                                        heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 300);
                                }
                            } else {
                                // 连续模式下直接滚动到标题
                                heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                    }
                });
            });
            console.log('🔗 目录点击事件绑定完成');
        },
        
        /**
         * 切换显示模式
         */
        toggleMode() {
            const newMode = state.mode === 'paginated' ? 'continuous' : 'paginated';
            console.log(`🔄 切换模式: ${state.mode} → ${newMode}`);
            
            // 保存当前状态
            this.saveState();
            
            // 应用新模式
            this.applyMode(newMode);
            
            // 更新状态
            state.mode = newMode;
            
            // 更新UI
            this.updateUI();
            
            // 保存到localStorage
            this.persistState();
        },
        
        /**
         * 导航到指定页面
         */
        navigateToPage(pageIndex) {
            if (state.mode !== 'paginated') return;
            
            // 边界处理
            const totalPages = state.paginatedState.totalPages;
            if (totalPages === 0) return;
            
            // 确保页码在有效范围内
            pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
            
            // 更新当前页码
            state.paginatedState.currentPage = pageIndex;
            
            // 滚动到目标页面
            const pages = document.querySelectorAll('.doc-page');
            if (pages.length > pageIndex) {
                const targetPage = pages[pageIndex];
                targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
                console.log(`📍 导航到第 ${pageIndex + 1} 页`);
            }
            
            // 更新UI
            this.updateUI();
        },
        
        /**
         * 应用指定模式
         */
        applyMode(mode) {
            console.log(`🎯 应用模式: ${mode}`);
            
            // 恢复原始内容
            this.restoreOriginalContent();
            
            // 根据模式渲染
            if (mode === 'paginated') {
                this.applyPaginatedMode();
            } else {
                this.applyContinuousMode();
            }
            
            // 应用缩放效果
            this.applyZoom();
            
            // 添加过渡动画
            this.addTransitionAnimation();
        },
        
        /**
         * 应用分页模式
         */
        applyPaginatedMode() {
            console.log('📄 应用分页模式');
            
            // 获取页面尺寸
            const pageSize = CONFIG.pageSizes[state.pageSize];
            const dimensions = this.calculatePageDimensions(pageSize);
            
            // 分页算法
            const pages = this.paginateContent(dimensions.contentHeight);
            state.paginatedState.totalPages = pages.length;
            state.paginatedState.currentPage = Math.min(state.paginatedState.currentPage, pages.length - 1);
            
            // 渲染页面
            this.renderPages(pages, dimensions);
            
            // 显示页码指示器
            if (elements.currentPageIndicator) {
                elements.currentPageIndicator.style.display = 'flex';
                this.updatePageIndicator();
            }
            
            // 初始化目录与正文滚动联动
            this.initTOCSync();
            
            // 滚动到保存的位置
            this.restorePaginatedState();
        },
        
        /**
         * 应用连续滚动模式
         */
        applyContinuousMode() {
            console.log('📜 应用连续滚动模式');
            
            // 隐藏页码指示器
            if (elements.currentPageIndicator) {
                elements.currentPageIndicator.style.display = 'none';
            }
            
            // 初始化目录与正文滚动联动
            this.initTOCSync();
            
            // 恢复连续模式状态
            this.restoreContinuousState();
        },
        
        /**
         * 更改页面尺寸
         */
        changePageSize(size) {
            if (!CONFIG.pageSizes[size]) {
                console.warn(`⚠️ 未知的页面尺寸: ${size}`);
                return;
            }
            
            console.log(`📏 更改页面尺寸: ${state.pageSize} → ${size}`);
            state.pageSize = size;
            
            // 如果当前是分页模式，重新分页
            if (state.mode === 'paginated') {
                this.applyPaginatedMode();
            }
            
            // 保存状态
            this.persistState();
        },
        
        /**
         * 更改缩放比例
         */
        changeZoom(zoom) {
            console.log(`🔍 更改缩放比例: ${state.zoom}% → ${zoom}%`);
            state.zoom = zoom;
            
            // 应用缩放效果
            this.applyZoom();
            
            // 保存状态
            this.persistState();
        },
        
        /**
         * 应用缩放效果
         */
        applyZoom() {
            if (!elements.container) return;
            
            const scale = state.zoom / 100;
            elements.container.style.transform = `scale(${scale})`;
            elements.container.style.transformOrigin = 'top center';
            elements.container.style.transition = `transform 0.3s ease`;
            
            // 调整容器的外边距，以保持居中
            if (state.mode === 'paginated') {
                const pages = document.querySelectorAll('.doc-page');
                pages.forEach(page => {
                    page.style.marginBottom = `${CONFIG.pageSpacing * scale}px`;
                });
            }
            
            console.log(`✅ 应用缩放比例: ${state.zoom}%`);
        },
        
        /**
         * 计算页面尺寸（像素）
         */
        calculatePageDimensions(pageSize) {
            const mmToPx = (mm) => Math.round((mm / 25.4) * CONFIG.dpi);
            const width = mmToPx(pageSize.width);
            const height = mmToPx(pageSize.height);
            const margin = mmToPx(CONFIG.margin);
            
            return {
                width,
                height,
                margin,
                contentWidth: width - (2 * margin),
                contentHeight: height - (2 * margin)
            };
        },
        
        /**
         * 分页算法
         */
        paginateContent(pageHeight) {
            // 获取所有文本内容元素，包括深层嵌套的
            const contentElements = this.flattenContentElements(elements.container);
            const pages = [];
            let currentPage = [];
            let currentHeight = 0;
            
            console.log(`📏 页面高度: ${pageHeight}px, 元素数量: ${contentElements.length}`);
            
            for (let i = 0; i < contentElements.length; i++) {
                const child = contentElements[i];
                const height = this.measureElementHeight(child);
                
                console.log(`📐 元素 ${i}: ${child.tagName || 'TEXT'} - 高度: ${height}px`);
                
                if (currentHeight + height <= pageHeight || currentPage.length === 0) {
                    currentPage.push(child);
                    currentHeight += height;
                    console.log(`➕ 添加到当前页，累计高度: ${currentHeight}px`);
                } else {
                    pages.push([...currentPage]);
                    console.log(`📄 完成一页，累计页数: ${pages.length}`);
                    currentPage = [child];
                    currentHeight = height;
                    console.log(`➕ 开始新页，初始高度: ${currentHeight}px`);
                }
            }
            
            if (currentPage.length > 0) {
                pages.push(currentPage);
                console.log(`📄 完成最后一页，总页数: ${pages.length}`);
            }
            
            console.log(`📊 分页完成: ${pages.length} 页, 处理元素数: ${contentElements.length}`);
            return pages;
        },
        
        /**
         * 扁平化内容元素，包括深层嵌套的元素
         */
        flattenContentElements(container) {
            const elements = [];
            
            function traverse(node) {
                // 跳过脚本和样式元素
                if (node.tagName && (node.tagName.toLowerCase() === 'script' || node.tagName.toLowerCase() === 'style')) {
                    return;
                }
                
                // 如果是文本节点且有内容，创建一个包装元素
                if (node.nodeType === 3 && node.textContent.trim()) {
                    const textWrapper = document.createElement('p');
                    textWrapper.textContent = node.textContent;
                    elements.push(textWrapper);
                }
                // 如果是元素节点
                else if (node.nodeType === 1) {
                    // 对于表格相关元素，保持结构
                    const tableElements = ['TABLE', 'TR', 'TBODY', 'THEAD', 'TFOOT', 'TD', 'TH'];
                    if (tableElements.includes(node.tagName)) {
                        elements.push(node);
                    }
                    // 对于列表元素，保持结构
                    else if (node.tagName === 'UL' || node.tagName === 'OL') {
                        elements.push(node);
                    }
                    // 对于列表项，只在其父元素不是UL或OL时添加
                    else if (node.tagName === 'LI') {
                        const parent = node.parentElement;
                        if (!parent || (parent.tagName !== 'UL' && parent.tagName !== 'OL')) {
                            elements.push(node);
                        }
                    }
                    // 对于独立的块级元素，直接添加
                    else if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'].includes(node.tagName)) {
                        elements.push(node);
                    }
                    // 对于其他容器元素，递归处理子节点
                    else {
                        // 特殊处理目录容器
                        if (node.classList && node.classList.contains('post-toc')) {
                            // 递归处理目录内容
                            for (let i = 0; i < node.childNodes.length; i++) {
                                traverse(node.childNodes[i]);
                            }
                        }
                        // 对于其他容器，递归处理子节点
                        else {
                            for (let i = 0; i < node.childNodes.length; i++) {
                                traverse(node.childNodes[i]);
                            }
                        }
                    }
                }
            }
            
            // 遍历容器的所有子节点
            for (let i = 0; i < container.childNodes.length; i++) {
                traverse(container.childNodes[i]);
            }
            
            console.log(`📦 扁平化完成: ${elements.length} 个元素`);
            return elements;
        },
        
        /**
         * 测量元素高度
         */
        measureElementHeight(element) {
            // 创建临时测量容器
            const temp = document.createElement('div');
            temp.style.cssText = `
                position: fixed;
                top: -9999px;
                left: -9999px;
                width: 794px;
                visibility: hidden;
                box-sizing: border-box;
            `;
            
            const clone = element.cloneNode(true);
            clone.style.boxSizing = 'border-box';
            clone.style.maxWidth = '100%';
            
            temp.appendChild(clone);
            document.body.appendChild(temp);
            
            // 获取高度（包括边距）
            const height = clone.offsetHeight;
            const style = window.getComputedStyle(clone);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            const totalHeight = height + marginTop + marginBottom;
            
            document.body.removeChild(temp);
            
            // 增加安全余量
            return Math.ceil(totalHeight * 1.15) + 10;
        },
        
        /**
         * 渲染页面
         */
        renderPages(pages, dimensions) {
            // 清空容器
            elements.container.innerHTML = '';
            
            pages.forEach((pageElements, pageIndex) => {
                // 创建页面容器
                const page = document.createElement('div');
                page.className = 'doc-page';
                page.dataset.pageIndex = pageIndex;
                
                page.style.cssText = `
                    width: ${dimensions.width}px;
                    min-height: ${dimensions.height}px;
                    background: white;
                    margin: 0 auto ${CONFIG.pageSpacing}px;
                    box-shadow: ${CONFIG.showShadow ? '0 5px 20px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)' : 'none'};
                    border: 1px solid #e0e0e0;
                    border-radius: 3px;
                    position: relative;
                    box-sizing: border-box;
                    page-break-inside: avoid;
                    transition: all ${CONFIG.animationDuration}ms ease;
                `;
                
                // 内容区域
                const content = document.createElement('div');
                content.className = 'doc-page-content';
                content.style.cssText = `
                    width: ${dimensions.contentWidth}px;
                    min-height: ${dimensions.contentHeight}px;
                    max-height: ${dimensions.contentHeight}px;
                    padding: ${dimensions.margin}px;
                    box-sizing: border-box;
                    overflow: hidden;
                `;
                
                // 为代码框和表格添加特殊处理
                function handleCodeBlocks() {
                    // 处理代码块
                    const codeBlocks = content.querySelectorAll('pre, code');
                    codeBlocks.forEach(block => {
                        // 跳过代码表格中的pre标签，它们会在后面单独处理
                        if (block.tagName === 'PRE' && !block.closest('.gutter') && !block.closest('.code')) {
                            // 为独立的pre标签添加滚动功能
                            block.style.maxHeight = '300px';
                            block.style.overflow = 'auto';
                            block.style.backgroundColor = '#f5f5f5';
                            block.style.padding = '10px';
                            block.style.borderRadius = '4px';
                        } else if (block.tagName === 'CODE' && block.parentElement.tagName !== 'PRE') {
                            // 为inline code添加样式
                            block.style.backgroundColor = '#f0f0f0';
                            block.style.padding = '2px 4px';
                            block.style.borderRadius = '3px';
                            block.style.fontFamily = 'monospace';
                        }
                    });
                    
                    // 处理代码表格
                    const codeTables = content.querySelectorAll('table');
                    codeTables.forEach(table => {
                        // 检查是否是代码表格（包含gutter和code类）
                        const gutterTd = table.querySelector('.gutter');
                        const codeTd = table.querySelector('.code');
                        
                        if (gutterTd && codeTd) {
                            // 设置表格样式
                            table.style.width = '100%';
                            table.style.borderCollapse = 'collapse';
                            table.style.margin = '10px 0';
                            table.style.backgroundColor = '#f5f5f5';
                            table.style.borderRadius = '4px';
                            table.style.overflow = 'hidden';
                            
                            // 设置单元格样式
                            const tds = table.querySelectorAll('td');
                            tds.forEach(td => {
                                td.style.padding = '0';
                                td.style.verticalAlign = 'top';
                            });
                            
                            // 为gutter添加样式
                            if (gutterTd) {
                                gutterTd.style.backgroundColor = '#e8e8e8';
                                gutterTd.style.borderRight = '1px solid #d0d0d0';
                                gutterTd.style.padding = '10px 5px';
                                gutterTd.style.textAlign = 'right';
                                gutterTd.style.fontFamily = 'monospace';
                                gutterTd.style.fontSize = '14px';
                                gutterTd.style.color = '#666';
                                
                                // 处理gutter中的pre标签
                                const gutterPre = gutterTd.querySelector('pre');
                                if (gutterPre) {
                                    gutterPre.style.maxHeight = '300px';
                                    gutterPre.style.overflow = 'auto';
                                    gutterPre.style.backgroundColor = 'transparent';
                                    gutterPre.style.padding = '0';
                                    gutterPre.style.borderRadius = '0';
                                    gutterPre.style.margin = '0';
                                }
                            }
                            
                            // 为code添加样式
                            if (codeTd) {
                                codeTd.style.padding = '10px';
                                
                                // 处理code中的pre标签
                                const codePre = codeTd.querySelector('pre');
                                if (codePre) {
                                    codePre.style.maxHeight = '300px';
                                    codePre.style.overflow = 'auto';
                                    codePre.style.backgroundColor = 'transparent';
                                    codePre.style.padding = '0';
                                    codePre.style.borderRadius = '0';
                                    codePre.style.margin = '0';
                                }
                            }
                            
                            // 确保表格不会超出页面宽度
                            table.style.maxWidth = '100%';
                            table.style.overflow = 'auto';
                        }
                    });
                }
                
                // 添加元素
                pageElements.forEach(el => {
                    content.appendChild(el.cloneNode(true));
                });
                
                // 处理代码框
                handleCodeBlocks();
                
                // 页脚（页码）
                const footer = document.createElement('div');
                footer.className = 'doc-page-footer';
                footer.textContent = `第 ${pageIndex + 1} 页 / 共 ${pages.length} 页`;
                footer.style.cssText = `
                    position: absolute;
                    bottom: 12px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #888;
                    font-size: 12px;
                    font-family: 'Microsoft YaHei', 'Segoe UI', 'Calibri', Arial, sans-serif;
                    text-align: center;
                    width: 100%;
                    font-weight: normal;
                    letter-spacing: 0.5px;
                `;
                
                page.appendChild(content);
                page.appendChild(footer);
                elements.container.appendChild(page);
            });
            
            // 添加分页样式
            this.addPaginatedStyles();
        },
        
        /**
         * 保存当前状态
         */
        saveState() {
            if (state.mode === 'paginated') {
                // 保存分页状态
                const currentPage = this.getCurrentPage();
                state.paginatedState.currentPage = currentPage;
                state.paginatedState.scrollY = window.scrollY;
            } else {
                // 保存连续滚动状态
                state.continuousState.scrollPercentage = this.getScrollPercentage();
                state.continuousState.activeHeadingId = this.getActiveHeadingId();
            }
            
            console.log('💾 状态已保存:', state);
        },
        
        /**
         * 恢复原始内容
         */
        restoreOriginalContent() {
            if (elements.originalContent) {
                elements.container.innerHTML = elements.originalContent;
                console.log('↩️ 原始内容已恢复');
            }
        },
        
        /**
         * 恢复分页状态
         */
        restorePaginatedState() {
            if (state.paginatedState.currentPage > 0) {
                const pages = document.querySelectorAll('.doc-page');
                if (pages.length > 0) {
                    const targetPage = pages[Math.min(state.paginatedState.currentPage, pages.length - 1)];
                    targetPage.scrollIntoView({ behavior: 'smooth' });
                    console.log(`📍 恢复到第 ${state.paginatedState.currentPage + 1} 页`);
                }
            }
        },
        
        /**
         * 恢复连续滚动状态
         */
        restoreContinuousState() {
            if (state.continuousState.scrollPercentage > 0) {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const targetY = scrollHeight * (state.continuousState.scrollPercentage / 100);
                window.scrollTo({ top: targetY, behavior: 'smooth' });
                console.log(`📍 恢复到滚动位置 ${state.continuousState.scrollPercentage}%`);
            }
            
            if (state.continuousState.activeHeadingId) {
                const heading = document.getElementById(state.continuousState.activeHeadingId);
                if (heading) {
                    heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        },
        
        /**
         * 获取当前页码
         */
        getCurrentPage() {
            const pages = document.querySelectorAll('.doc-page');
            if (pages.length === 0) return 0;
            
            const viewportMiddle = window.scrollY + (window.innerHeight / 2);
            let closestPage = 0;
            let minDistance = Infinity;
            
            pages.forEach((page, index) => {
                const rect = page.getBoundingClientRect();
                const pageMiddle = rect.top + window.scrollY + (rect.height / 2);
                const distance = Math.abs(pageMiddle - viewportMiddle);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPage = index;
                }
            });
            
            return closestPage;
        },
        
        /**
         * 获取滚动百分比
         */
        getScrollPercentage() {
            const scrollTop = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
        },
        
        /**
         * 获取活动标题ID
         */
        getActiveHeadingId() {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let activeHeading = null;
            let maxVisibility = 0;
            
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                const visibility = Math.min(rect.height, window.innerHeight - rect.top);
                
                if (rect.top >= 0 && rect.top <= window.innerHeight && visibility > maxVisibility) {
                    maxVisibility = visibility;
                    activeHeading = heading;
                }
            });
            
            return activeHeading ? activeHeading.id : null;
        },
        
        /**
         * 更新UI
         */
        updateUI() {
            // 更新模式切换按钮
            if (elements.modeToggle) {
                const label = elements.modeToggle.querySelector('.doc-mode-label');
                const iconPaginated = elements.modeToggle.querySelector('.doc-mode-icon.paginated');
                const iconContinuous = elements.modeToggle.querySelector('.doc-mode-icon.continuous');
                
                if (state.mode === 'paginated') {
                    label.textContent = '分页模式';
                    iconPaginated.style.opacity = '1';
                    iconContinuous.style.opacity = '0.5';
                } else {
                    label.textContent = '连续模式';
                    iconPaginated.style.opacity = '0.5';
                    iconContinuous.style.opacity = '1';
                }
            }
            
            // 更新页面尺寸选择器
            if (elements.sizeSelect) {
                elements.sizeSelect.value = state.pageSize;
            }
            
            // 更新导航组件
            if (elements.pageNav) {
                if (state.mode === 'paginated') {
                    elements.pageNav.style.display = 'flex';
                    
                    // 更新页码输入框和总页数
                    if (elements.navInput && elements.navTotal) {
                        elements.navInput.value = state.paginatedState.currentPage + 1;
                        elements.navTotal.textContent = state.paginatedState.totalPages;
                    }
                    
                    // 更新导航按钮状态
                    if (elements.navPrevBtn) {
                        elements.navPrevBtn.disabled = state.paginatedState.currentPage === 0;
                        elements.navPrevBtn.style.opacity = state.paginatedState.currentPage === 0 ? '0.5' : '1';
                        elements.navPrevBtn.style.cursor = state.paginatedState.currentPage === 0 ? 'not-allowed' : 'pointer';
                    }
                    
                    if (elements.navNextBtn) {
                        elements.navNextBtn.disabled = state.paginatedState.currentPage === state.paginatedState.totalPages - 1;
                        elements.navNextBtn.style.opacity = state.paginatedState.currentPage === state.paginatedState.totalPages - 1 ? '0.5' : '1';
                        elements.navNextBtn.style.cursor = state.paginatedState.currentPage === state.paginatedState.totalPages - 1 ? 'not-allowed' : 'pointer';
                    }
                } else {
                    elements.pageNav.style.display = 'none';
                }
            }
            
            // 更新UI位置
            this.updateUIPosition();
        },
        
        /**
         * 更新页码指示器
         */
        updatePageIndicator() {
            if (!elements.currentPageIndicator) return;
            
            const currentEl = elements.currentPageIndicator.querySelector('.doc-page-current');
            const totalEl = elements.currentPageIndicator.querySelector('.doc-page-total');
            
            if (currentEl && totalEl) {
                currentEl.textContent = state.paginatedState.currentPage + 1;
                totalEl.textContent = state.paginatedState.totalPages;
            }
        },
        
        /**
         * 更新UI位置
         */
        updateUIPosition() {
            if (!elements.switcherUI) return;
            
            // 固定在右上角
            elements.switcherUI.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
            `;
        },
        
        /**
         * 添加分页样式
         */
        addPaginatedStyles() {
            const styleId = 'doc-paginated-styles';
            if (document.getElementById(styleId)) return;
            
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .doc-page {
                    break-inside: avoid;
                    font-family: 'Microsoft YaHei', 'Segoe UI', 'Calibri', Arial, sans-serif;
                }
                
                .doc-page-content {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #333;
                }
                
                .doc-page-content > *:first-child {
                    margin-top: 0;
                }
                
                .doc-page-content > *:last-child {
                    margin-bottom: 0;
                }
                
                .doc-page-content img {
                    max-width: 100% !important;
                    height: auto !important;
                    display: block;
                }
                
                .doc-page-content table {
                    width: 100% !important;
                    max-width: 100% !important;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                
                .doc-page-content pre,
                .doc-page-content code {
                    white-space: pre-wrap !important;
                    word-wrap: break-word !important;
                    max-width: 100%;
                }
                
                @media print {
                    .doc-page {
                        box-shadow: none !important;
                        margin: 0 !important;
                        border: 1px solid #ddd !important;
                        page-break-after: always;
                    }
                    
                    .doc-page-content {
                        padding: 2cm !important;
                    }
                    
                    .doc-mode-switcher {
                        display: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        },
        
        /**
         * 添加切换动画
         */
        addTransitionAnimation() {
            // 添加淡入效果
            elements.container.style.opacity = '0';
            elements.container.style.transition = `opacity ${CONFIG.animationDuration}ms ease`;
            
            setTimeout(() => {
                elements.container.style.opacity = '1';
            }, 50);
        },
        
        /**
         * 持久化状态到localStorage
         */
        persistState() {
            try {
                const persistData = {
                    mode: state.mode,
                    pageSize: state.pageSize,
                    zoom: state.zoom,
                    timestamp: Date.now()
                };
                localStorage.setItem('docModeSwitcherState', JSON.stringify(persistData));
                console.log('💾 状态已保存到localStorage');
            } catch (error) {
                console.warn('⚠️ 无法保存状态到localStorage:', error);
            }
        },
        
        /**
         * 从localStorage恢复状态
         */
        restorePersistedState() {
            try {
                const saved = localStorage.getItem('docModeSwitcherState');
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.mode) state.mode = data.mode;
                    if (data.pageSize) state.pageSize = data.pageSize;
                    if (data.zoom) state.zoom = data.zoom;
                    console.log('🔄 从localStorage恢复状态:', data);
                }
            } catch (error) {
                console.warn('⚠️ 无法从localStorage恢复状态:', error);
            }
        },
        
        /**
         * 公开API
         */
        api: {
            switchToPaginated() {
                if (state.mode !== 'paginated') {
                    DocumentModeSwitcher.toggleMode();
                }
            },
            
            switchToContinuous() {
                if (state.mode !== 'continuous') {
                    DocumentModeSwitcher.toggleMode();
                }
            },
            
            setPageSize(size) {
                DocumentModeSwitcher.changePageSize(size);
            },
            
            getState() {
                return { ...state };
            },
            
            refresh() {
                if (state.isInitialized && state.mode === 'paginated') {
                    DocumentModeSwitcher.applyPaginatedMode();
                }
            }
        }
    };
    
    // 初始化流程
    function initialize() {
        console.log('🚀 DocumentModeSwitcher 开始初始化');
        
        // 恢复持久化状态
        DocumentModeSwitcher.restorePersistedState();
        
        // 等待DOM就绪
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => DocumentModeSwitcher.init(), 100);
            });
        } else {
            setTimeout(() => DocumentModeSwitcher.init(), 100);
        }
        
        // 备用初始化
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!state.isInitialized) {
                    console.log('⏰ 备用初始化');
                    DocumentModeSwitcher.init();
                }
            }, 500);
        });
    }
    
    // 启动初始化
    initialize();
    
    // 暴露到全局
    window.DocumentModeSwitcher = DocumentModeSwitcher.api;
    
})();