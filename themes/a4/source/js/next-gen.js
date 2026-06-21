/**
 * Next-Gen Blog Features
 * 下一代博客创新功能集合
 */

(function() {
    'use strict';

    // ==================== 1. 阅读进度条 ====================
    class ReadingProgress {
        constructor() {
            this.progressBar = null;
            this.init();
        }

        init() {
            // 创建进度条元素
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'reading-progress-bar';
            this.progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
            document.body.appendChild(this.progressBar);

            // 创建百分比显示
            this.percentage = document.createElement('div');
            this.percentage.className = 'reading-percentage';
            document.body.appendChild(this.percentage);

            // 绑定滚动事件
            window.addEventListener('scroll', this.updateProgress.bind(this), { passive: true });
            this.updateProgress();
        }

        updateProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            
            const fill = this.progressBar.querySelector('.reading-progress-fill');
            if (fill) {
                fill.style.width = progress + '%';
            }
            
            if (this.percentage) {
                this.percentage.textContent = Math.round(progress) + '%';
                this.percentage.style.opacity = progress > 5 ? '1' : '0';
            }
        }
    }

    // ==================== 2. 沉浸式阅读模式 ====================
    class ImmersiveReader {
        constructor() {
            this.isActive = false;
            this.button = null;
            this.init();
        }

        init() {
            // 创建沉浸式阅读按钮
            this.button = document.createElement('button');
            this.button.className = 'immersive-reader-btn';
            this.button.innerHTML = '📖';
            this.button.title = '沉浸式阅读模式';
            this.button.setAttribute('aria-label', '切换沉浸式阅读模式');
            
            this.button.addEventListener('click', this.toggle.bind(this));
            document.body.appendChild(this.button);

            // ESC 退出
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isActive) {
                    this.deactivate();
                }
            });
        }

        toggle() {
            this.isActive ? this.deactivate() : this.activate();
        }

        activate() {
            this.isActive = true;
            document.body.classList.add('immersive-mode');
            this.button.innerHTML = '✕';
            this.button.title = '退出沉浸式阅读';
            
            // 保存当前滚动位置
            this.savedScroll = window.pageYOffset;
            
            // 显示提示
            this.showToast('已进入沉浸式阅读模式，按 ESC 退出');
        }

        deactivate() {
            this.isActive = false;
            document.body.classList.remove('immersive-mode');
            this.button.innerHTML = '📖';
            this.button.title = '沉浸式阅读模式';
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'reader-toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        }
    }

    // ==================== 3. 智能目录高亮与滚动定位 ====================
    class SmartToc {
        constructor() {
            this.headings = [];
            this.tocLinks = [];
            this.currentActive = null;
            this.init();
        }

        init() {
            // 获取文章中的所有标题
            const article = document.querySelector('.post-md, .paper-main');
            if (!article) return;

            this.headings = Array.from(article.querySelectorAll('h1, h2, h3, h4'));
            if (this.headings.length === 0) return;

            // 为每个标题添加锚点 ID
            this.headings.forEach((heading, index) => {
                if (!heading.id) {
                    heading.id = 'heading-' + index;
                }
            });

            // 创建浮动智能目录
            this.createFloatingToc();

            // 绑定滚动事件
            window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
            this.onScroll();
        }

        createFloatingToc() {
            const toc = document.createElement('nav');
            toc.className = 'smart-toc';
            toc.innerHTML = '<div class="smart-toc-header">目录</div><ul class="smart-toc-list"></ul>';
            
            const list = toc.querySelector('.smart-toc-list');
            
            this.headings.forEach(heading => {
                const level = parseInt(heading.tagName[1]);
                const li = document.createElement('li');
                li.className = 'smart-toc-item level-' + level;
                
                const link = document.createElement('a');
                link.href = '#' + heading.id;
                link.textContent = heading.textContent;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                
                li.appendChild(link);
                list.appendChild(li);
                this.tocLinks.push({ li, link, heading });
            });

            // 创建切换按钮
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'smart-toc-toggle';
            toggleBtn.innerHTML = '☰';
            toggleBtn.title = '目录';
            toggleBtn.addEventListener('click', () => {
                toc.classList.toggle('collapsed');
            });

            const container = document.createElement('div');
            container.className = 'smart-toc-container';
            container.appendChild(toggleBtn);
            container.appendChild(toc);
            
            document.body.appendChild(container);
        }

        onScroll() {
            const scrollPos = window.pageYOffset + 150;
            let activeIndex = -1;

            // 找到当前可见的标题
            for (let i = this.headings.length - 1; i >= 0; i--) {
                if (this.headings[i].offsetTop <= scrollPos) {
                    activeIndex = i;
                    break;
                }
            }

            // 更新高亮
            this.tocLinks.forEach((item, index) => {
                if (index === activeIndex) {
                    item.li.classList.add('active');
                    item.li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.li.classList.remove('active');
                }
            });
        }
    }

    // ==================== 4. 文章内联知识图谱 ====================
    class KnowledgeGraph {
        constructor() {
            this.nodes = [];
            this.links = [];
            this.init();
        }

        init() {
            // 从页面提取关键词和链接
            this.extractKeywords();
            
            if (this.nodes.length > 0) {
                this.createGraphWidget();
            }
        }

        extractKeywords() {
            // 提取标签
            const tagLinks = document.querySelectorAll('.post-meta a[href*="/tags/"]');
            tagLinks.forEach(tag => {
                this.nodes.push({
                    id: tag.textContent.trim(),
                    type: 'tag',
                    url: tag.href
                });
            });

            // 提取分类
            const catLinks = document.querySelectorAll('.post-meta a[href*="/categories/"]');
            catLinks.forEach(cat => {
                this.nodes.push({
                    id: cat.textContent.trim(),
                    type: 'category',
                    url: cat.href
                });
            });

            // 提取文章内链接
            const articleLinks = document.querySelectorAll('.post-md a');
            articleLinks.forEach(link => {
                if (link.hostname === location.hostname && !link.href.includes('/tags/') && !link.href.includes('/categories/')) {
                    this.nodes.push({
                        id: link.textContent.trim() || '相关文章',
                        type: 'article',
                        url: link.href
                    });
                }
            });

            // 去重
            const seen = new Set();
            this.nodes = this.nodes.filter(n => {
                if (seen.has(n.id)) return false;
                seen.add(n.id);
                return true;
            });
        }

        createGraphWidget() {
            const widget = document.createElement('div');
            widget.className = 'knowledge-graph-widget';
            widget.innerHTML = `
                <div class="kg-header">
                    <span>🔗 知识关联</span>
                    <button class="kg-toggle" aria-label="展开/收起">▼</button>
                </div>
                <div class="kg-content">
                    <div class="kg-nodes">
                        ${this.nodes.map(n => `
                            <a href="${n.url}" class="kg-node kg-${n.type}">${n.id}</a>
                        `).join('')}
                    </div>
                </div>
            `;

            // 切换展开/收起
            const toggle = widget.querySelector('.kg-toggle');
            const content = widget.querySelector('.kg-content');
            toggle.addEventListener('click', () => {
                content.classList.toggle('collapsed');
                toggle.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
            });

            // 插入到文章末尾
            const postMeta = document.querySelector('.post-meta');
            if (postMeta) {
                postMeta.parentNode.insertBefore(widget, postMeta.nextSibling);
            }
        }
    }

    // ==================== 5. 字体与主题实时切换器 ====================
    class ThemeSwitcher {
        constructor() {
            this.currentFont = localStorage.getItem('preferred-font') || 'default';
            this.currentTheme = localStorage.getItem('preferred-theme') || 'default';
            this.init();
        }

        init() {
            // 创建设置面板
            this.panel = document.createElement('div');
            this.panel.className = 'theme-settings-panel';
            this.panel.innerHTML = `
                <div class="ts-header">阅读设置</div>
                <div class="ts-section">
                    <div class="ts-label">字体</div>
                    <div class="ts-options font-options">
                        <button data-font="default" class="active">默认</button>
                        <button data-font="serif">宋体</button>
                        <button data-font="sans">黑体</button>
                        <button data-font="mono">等宽</button>
                    </div>
                </div>
                <div class="ts-section">
                    <div class="ts-label">主题</div>
                    <div class="ts-options theme-options">
                        <button data-theme="default" class="active">纸张</button>
                        <button data-theme="dark">暗黑</button>
                        <button data-theme="sepia">护眼</button>
                        <button data-theme="green">薄荷</button>
                    </div>
                </div>
                <div class="ts-section">
                    <div class="ts-label">字号 <span class="font-size-value">16px</span></div>
                    <input type="range" class="font-size-slider" min="14" max="22" value="16" step="1">
                </div>
                <div class="ts-section">
                    <div class="ts-label">行高 <span class="line-height-value">1.8</span></div>
                    <input type="range" class="line-height-slider" min="1.4" max="2.4" value="1.8" step="0.1">
                </div>
            `;

            // 创建触发按钮
            this.trigger = document.createElement('button');
            this.trigger.className = 'theme-settings-trigger';
            this.trigger.innerHTML = '⚙️';
            this.trigger.title = '阅读设置';
            this.trigger.addEventListener('click', () => this.togglePanel());

            document.body.appendChild(this.trigger);
            document.body.appendChild(this.panel);

            // 绑定事件
            this.bindEvents();
            
            // 应用保存的设置
            this.applySettings();
        }

        bindEvents() {
            // 字体切换
            this.panel.querySelectorAll('.font-options button').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setFont(btn.dataset.font);
                    this.panel.querySelectorAll('.font-options button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // 主题切换
            this.panel.querySelectorAll('.theme-options button').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setTheme(btn.dataset.theme);
                    this.panel.querySelectorAll('.theme-options button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // 字号调节
            const fontSizeSlider = this.panel.querySelector('.font-size-slider');
            fontSizeSlider.addEventListener('input', (e) => {
                const size = e.target.value;
                document.documentElement.style.setProperty('--article-font-size', size + 'px');
                this.panel.querySelector('.font-size-value').textContent = size + 'px';
                localStorage.setItem('article-font-size', size);
            });

            // 行高调节
            const lineHeightSlider = this.panel.querySelector('.line-height-slider');
            lineHeightSlider.addEventListener('input', (e) => {
                const height = e.target.value;
                document.documentElement.style.setProperty('--article-line-height', height);
                this.panel.querySelector('.line-height-value').textContent = height;
                localStorage.setItem('article-line-height', height);
            });

            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (!this.panel.contains(e.target) && !this.trigger.contains(e.target)) {
                    this.panel.classList.remove('show');
                }
            });
        }

        togglePanel() {
            this.panel.classList.toggle('show');
        }

        setFont(font) {
            document.body.setAttribute('data-font', font);
            localStorage.setItem('preferred-font', font);
        }

        setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('preferred-theme', theme);
            
            // 如果切换到暗黑模式，禁用 DarkReader（避免冲突）
            if (theme === 'dark' && typeof DarkReader !== 'undefined') {
                DarkReader.disable();
            }
        }

        applySettings() {
            // 应用字体
            if (this.currentFont !== 'default') {
                this.setFont(this.currentFont);
                const btn = this.panel.querySelector(`[data-font="${this.currentFont}"]`);
                if (btn) {
                    this.panel.querySelectorAll('.font-options button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }

            // 应用主题
            if (this.currentTheme !== 'default') {
                this.setTheme(this.currentTheme);
                const btn = this.panel.querySelector(`[data-theme="${this.currentTheme}"]`);
                if (btn) {
                    this.panel.querySelectorAll('.theme-options button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }

            // 应用字号
            const savedSize = localStorage.getItem('article-font-size');
            if (savedSize) {
                document.documentElement.style.setProperty('--article-font-size', savedSize + 'px');
                this.panel.querySelector('.font-size-slider').value = savedSize;
                this.panel.querySelector('.font-size-value').textContent = savedSize + 'px';
            }

            // 应用行高
            const savedHeight = localStorage.getItem('article-line-height');
            if (savedHeight) {
                document.documentElement.style.setProperty('--article-line-height', savedHeight);
                this.panel.querySelector('.line-height-slider').value = savedHeight;
                this.panel.querySelector('.line-height-value').textContent = savedHeight;
            }
        }
    }

    // ==================== 6. 阅读时间预估与文章难度分析 ====================
    class ReadingAnalyzer {
        constructor() {
            this.init();
        }

        init() {
            const article = document.querySelector('.post-md');
            if (!article) return;

            const text = article.textContent || '';
            const stats = this.analyze(text);
            this.displayStats(stats);
        }

        analyze(text) {
            // 基础统计
            const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
            const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
            const totalChars = text.length;
            
            // 阅读时间估算（中文 400 字/分钟，英文 200 词/分钟）
            const readTimeMinutes = Math.ceil(chineseChars / 400 + englishWords / 200);
            
            // 难度分析
            const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
            const avgSentenceLength = sentences.length > 0 ? chineseChars / sentences.length : 0;
            
            // 专业词汇密度
            const technicalTerms = (text.match(/(算法|数据|系统|框架|协议|模型|引擎|架构|接口|组件)/g) || []).length;
            const techDensity = chineseChars > 0 ? (technicalTerms / chineseChars * 100).toFixed(1) : 0;
            
            // 难度评级
            let difficulty = '简单';
            let difficultyClass = 'easy';
            if (avgSentenceLength > 30 || techDensity > 5) {
                difficulty = '困难';
                difficultyClass = 'hard';
            } else if (avgSentenceLength > 20 || techDensity > 2) {
                difficulty = '中等';
                difficultyClass = 'medium';
            }

            return {
                chineseChars,
                englishWords,
                totalChars,
                readTimeMinutes,
                sentenceCount: sentences.length,
                avgSentenceLength: avgSentenceLength.toFixed(1),
                techDensity,
                difficulty,
                difficultyClass
            };
        }

        displayStats(stats) {
            const container = document.createElement('div');
            container.className = 'reading-analyzer';
            container.innerHTML = `
                <div class="ra-header">
                    <span>📊 文章分析</span>
                </div>
                <div class="ra-stats">
                    <div class="ra-stat">
                        <span class="ra-value">${stats.readTimeMinutes}</span>
                        <span class="ra-label">分钟阅读</span>
                    </div>
                    <div class="ra-stat">
                        <span class="ra-value">${stats.chineseChars}</span>
                        <span class="ra-label">中文字符</span>
                    </div>
                    <div class="ra-stat">
                        <span class="ra-value">${stats.sentenceCount}</span>
                        <span class="ra-label">句子数</span>
                    </div>
                    <div class="ra-stat">
                        <span class="ra-value ${stats.difficultyClass}">${stats.difficulty}</span>
                        <span class="ra-label">难度</span>
                    </div>
                </div>
                <div class="ra-detail">
                    <div class="ra-bar">
                        <div class="ra-bar-fill" style="width: ${Math.min(stats.techDensity * 10, 100)}%"></div>
                    </div>
                    <span class="ra-bar-label">专业度: ${stats.techDensity}%</span>
                </div>
            `;

            // 插入到文章标题下方
            const postTitle = document.querySelector('.post-main-title');
            if (postTitle) {
                postTitle.parentNode.insertBefore(container, postTitle.nextSibling);
            }
        }
    }

    // ==================== 7. 代码块复制与语言标识 ====================
    class CodeBlockEnhancer {
        constructor() {
            this.init();
        }

        init() {
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach(code => {
                const pre = code.parentElement;
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                
                // 获取语言
                const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
                const lang = langClass ? langClass.replace('language-', '') : 'text';
                
                // 创建头部
                const header = document.createElement('div');
                header.className = 'code-block-header';
                header.innerHTML = `
                    <span class="code-lang">${lang}</span>
                    <button class="code-copy-btn" aria-label="复制代码">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>复制</span>
                    </button>
                `;
                
                // 复制功能
                const copyBtn = header.querySelector('.code-copy-btn');
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(code.textContent).then(() => {
                        copyBtn.classList.add('copied');
                        copyBtn.querySelector('span').textContent = '已复制';
                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            copyBtn.querySelector('span').textContent = '复制';
                        }, 2000);
                    });
                });
                
                // 包装代码块
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(header);
                wrapper.appendChild(pre);
            });
        }
    }

    // ==================== 8. 图片懒加载与点击放大 ====================
    class ImageEnhancer {
        constructor() {
            this.init();
        }

        init() {
            const images = document.querySelectorAll('.post-md img, .post-main img');
            images.forEach(img => {
                // 添加懒加载
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
                
                // 添加点击放大
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', () => this.openLightbox(img));
            });
        }

        openLightbox(img) {
            const overlay = document.createElement('div');
            overlay.className = 'image-lightbox';
            overlay.innerHTML = `
                <div class="lightbox-backdrop"></div>
                <img src="${img.src}" alt="${img.alt || ''}" class="lightbox-img">
                <button class="lightbox-close" aria-label="关闭">✕</button>
            `;
            
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            
            // 动画
            requestAnimationFrame(() => overlay.classList.add('show'));
            
            // 关闭
            const close = () => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    document.body.style.overflow = '';
                }, 300);
            };
            
            overlay.querySelector('.lightbox-close').addEventListener('click', close);
            overlay.querySelector('.lightbox-backdrop').addEventListener('click', close);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });
            
            // ESC 关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }
    }

    // ==================== 初始化所有功能 ====================
    function init() {
        // 等待 DOM 就绪
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initFeatures);
        } else {
            initFeatures();
        }
    }

    function initFeatures() {
        // 检查是否在文章页面
        const isPost = document.querySelector('.post-md') !== null;
        const isPage = document.querySelector('.paper-main') !== null;
        
        if (isPost || isPage) {
            new ReadingProgress();
            new ImmersiveReader();
            new SmartToc();
            new KnowledgeGraph();
            new ThemeSwitcher();
            new ReadingAnalyzer();
            new CodeBlockEnhancer();
            new ImageEnhancer();
        }
    }

    init();
})();
