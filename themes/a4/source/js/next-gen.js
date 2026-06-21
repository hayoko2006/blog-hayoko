/**
 * Next-Gen Blog Features v3
 * 下一代博客创新功能集合 - 大幅增强版
 */

(function() {
    'use strict';

    // ==================== 工具函数 ====================
    const utils = {
        debounce(fn, delay) {
            let timer;
            return function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        },
        throttle(fn, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        animateValue(obj, start, end, duration, suffix = '') {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                obj.textContent = Math.floor(easeOutQuart * (end - start) + start) + suffix;
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        }
    };

    // ==================== 1. 粒子背景效果 ====================
    class ParticleBackground {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.particles = [];
            this.mouse = { x: null, y: null };
            this.init();
        }

        init() {
            if (window.matchMedia('(pointer: coarse)').matches) return;
            
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'particle-bg';
            this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;opacity:0.4;';
            document.body.insertBefore(this.canvas, document.body.firstChild);
            
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles();
            this.animate();
            
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            });
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        createParticles() {
            const count = Math.min(50, Math.floor(window.innerWidth / 30));
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * 2 + 1,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.5,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;
                
                // 鼠标交互
                if (this.mouse.x != null) {
                    const dx = this.mouse.x - p.x;
                    const dy = this.mouse.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        p.x -= dx * 0.01;
                        p.y -= dy * 0.01;
                    }
                }
                
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(194, 94, 0, ${p.opacity})`;
                this.ctx.fill();
            });
            
            // 连线
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 150) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.strokeStyle = `rgba(194, 94, 0, ${0.1 * (1 - dist / 150)})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(() => this.animate());
        }
    }

    // ==================== 2. 打字机效果标题 ====================
    class TypewriterEffect {
        constructor() {
            this.elements = document.querySelectorAll('.post-main-title, .index-header h1');
            this.init();
        }

        init() {
            this.elements.forEach(el => {
                const text = el.textContent;
                el.textContent = '';
                el.style.opacity = '1';
                this.type(el, text, 0);
            });
        }

        type(el, text, index) {
            if (index < text.length) {
                el.textContent += text.charAt(index);
                setTimeout(() => this.type(el, text, index + 1), 80 + Math.random() * 40);
            }
        }
    }

    // ==================== 3. 滚动触发动画 ====================
    class ScrollReveal {
        constructor() {
            this.elements = [];
            this.init();
        }

        init() {
            const selectors = [
                '.post-md h2',
                '.post-md h3',
                '.post-md p',
                '.post-md blockquote',
                '.post-md pre',
                '.post-md table',
                '.post-md ul',
                '.post-md ol',
                '.post-md img'
            ];
            
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(30px)';
                    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    this.elements.push(el);
                });
            });

            this.checkVisibility();
            window.addEventListener('scroll', utils.throttle(() => this.checkVisibility(), 100));
        }

        checkVisibility() {
            this.elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.85) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }
            });
        }
    }

    // ==================== 4. 阅读进度条 ====================
    class ReadingProgress {
        constructor() {
            this.init();
        }

        init() {
            const bar = document.createElement('div');
            bar.className = 'reading-progress-bar';
            bar.innerHTML = '<div class="reading-progress-fill"></div>';
            document.body.appendChild(bar);

            const percentage = document.createElement('div');
            percentage.className = 'reading-percentage';
            document.body.appendChild(percentage);

            window.addEventListener('scroll', utils.throttle(() => this.update(), 50), { passive: true });
            this.update();
        }

        update() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            
            document.querySelector('.reading-progress-fill').style.width = progress + '%';
            const pct = document.querySelector('.reading-percentage');
            pct.textContent = Math.round(progress) + '%';
            pct.style.opacity = progress > 3 ? '1' : '0';
        }
    }

    // ==================== 5. 浮动工具栏 ====================
    class FloatingToolbar {
        constructor() {
            this.init();
        }

        init() {
            const toolbar = document.createElement('div');
            toolbar.className = 'floating-toolbar';
            toolbar.innerHTML = `
                <div class="ft-menu" id="ft-menu">
                    <button class="ft-item" data-label="沉浸式阅读" data-action="immersive">📖</button>
                    <button class="ft-item" data-label="阅读设置" data-action="settings">⚙️</button>
                    <button class="ft-item" data-label="回到顶部" data-action="top">⬆️</button>
                </div>
                <button class="ft-main-btn" id="ft-toggle">✨</button>
            `;
            document.body.appendChild(toolbar);

            const toggle = document.getElementById('ft-toggle');
            const menu = document.getElementById('ft-menu');
            
            toggle.addEventListener('click', () => {
                menu.classList.toggle('show');
                toggle.classList.toggle('active');
            });

            menu.querySelectorAll('.ft-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'immersive') this.toggleImmersive();
                    if (action === 'settings') this.toggleSettings();
                    if (action === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
                    menu.classList.remove('show');
                    toggle.classList.remove('active');
                });
            });
        }

        toggleImmersive() {
            document.body.classList.toggle('immersive-mode');
            const isActive = document.body.classList.contains('immersive-mode');
            this.showToast(isActive ? '已进入沉浸式阅读模式' : '已退出沉浸式阅读模式');
        }

        toggleSettings() {
            const panel = document.querySelector('.theme-settings-panel');
            if (panel) panel.classList.toggle('show');
        }

        showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'reader-toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    }

    // ==================== 6. 智能目录 ====================
    class SmartToc {
        constructor() {
            this.init();
        }

        init() {
            const article = document.querySelector('.post-md');
            if (!article) return;

            const headings = Array.from(article.querySelectorAll('h2, h3, h4'));
            if (headings.length < 2) return;

            headings.forEach((h, i) => {
                if (!h.id) h.id = 'heading-' + i;
            });

            const container = document.createElement('div');
            container.className = 'smart-toc-container';
            container.innerHTML = `
                <button class="smart-toc-toggle">📑</button>
                <nav class="smart-toc collapsed">
                    <div class="smart-toc-header">文章目录</div>
                    <ul class="smart-toc-list"></ul>
                </nav>
            `;

            const list = container.querySelector('.smart-toc-list');
            headings.forEach(h => {
                const level = parseInt(h.tagName[1]);
                const li = document.createElement('li');
                li.className = `smart-toc-item level-${level}`;
                li.innerHTML = `<a href="#${h.id}">${h.textContent}</a>`;
                li.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                list.appendChild(li);
            });

            const toggle = container.querySelector('.smart-toc-toggle');
            const toc = container.querySelector('.smart-toc');
            toggle.addEventListener('click', () => toc.classList.toggle('collapsed'));

            document.body.appendChild(container);

            // 高亮当前章节
            const items = list.querySelectorAll('li');
            window.addEventListener('scroll', utils.throttle(() => {
                let active = -1;
                headings.forEach((h, i) => {
                    if (h.getBoundingClientRect().top <= 150) active = i;
                });
                items.forEach((item, i) => {
                    item.classList.toggle('active', i === active);
                });
            }, 100));
        }
    }

    // ==================== 7. 主题设置面板 ====================
    class ThemeSettings {
        constructor() {
            this.init();
        }

        init() {
            const panel = document.createElement('div');
            panel.className = 'theme-settings-panel';
            panel.innerHTML = `
                <div class="ts-header">🎨 阅读设置</div>
                <div class="ts-section">
                    <div class="ts-label">字体风格</div>
                    <div class="ts-options">
                        <button data-font="default" class="active">默认</button>
                        <button data-font="serif">宋体</button>
                        <button data-font="sans">黑体</button>
                        <button data-font="mono">等宽</button>
                    </div>
                </div>
                <div class="ts-section">
                    <div class="ts-label">主题配色</div>
                    <div class="ts-options">
                        <button data-theme="default" class="active">纸张</button>
                        <button data-theme="dark">暗黑</button>
                        <button data-theme="sepia">护眼</button>
                        <button data-theme="green">薄荷</button>
                    </div>
                </div>
                <div class="ts-section">
                    <div class="ts-label">字号 <span class="font-size-value">16px</span></div>
                    <input type="range" class="font-size-slider" min="14" max="22" value="16">
                </div>
                <div class="ts-section">
                    <div class="ts-label">行高 <span class="line-height-value">1.8</span></div>
                    <input type="range" class="line-height-slider" min="1.4" max="2.4" value="1.8" step="0.1">
                </div>
            `;
            document.body.appendChild(panel);

            // 字体切换
            panel.querySelectorAll('[data-font]').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.body.setAttribute('data-font', btn.dataset.font);
                    localStorage.setItem('ng-font', btn.dataset.font);
                    panel.querySelectorAll('[data-font]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // 主题切换
            panel.querySelectorAll('[data-theme]').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.body.setAttribute('data-theme', btn.dataset.theme);
                    localStorage.setItem('ng-theme', btn.dataset.theme);
                    if (btn.dataset.theme === 'dark' && typeof DarkReader !== 'undefined') {
                        DarkReader.disable();
                    }
                    panel.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // 字号
            const fsSlider = panel.querySelector('.font-size-slider');
            fsSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                document.documentElement.style.setProperty('--article-font-size', val + 'px');
                panel.querySelector('.font-size-value').textContent = val + 'px';
                localStorage.setItem('ng-font-size', val);
            });

            // 行高
            const lhSlider = panel.querySelector('.line-height-slider');
            lhSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                document.documentElement.style.setProperty('--article-line-height', val);
                panel.querySelector('.line-height-value').textContent = val;
                localStorage.setItem('ng-line-height', val);
            });

            // 恢复设置
            this.restoreSettings();
        }

        restoreSettings() {
            const font = localStorage.getItem('ng-font');
            const theme = localStorage.getItem('ng-theme');
            const fs = localStorage.getItem('ng-font-size');
            const lh = localStorage.getItem('ng-line-height');

            if (font && font !== 'default') {
                document.body.setAttribute('data-font', font);
                document.querySelector(`[data-font="${font}"]`)?.classList.add('active');
                document.querySelector('[data-font="default"]')?.classList.remove('active');
            }
            if (theme && theme !== 'default') {
                document.body.setAttribute('data-theme', theme);
                document.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');
                document.querySelector('[data-theme="default"]')?.classList.remove('active');
            }
            if (fs) {
                document.documentElement.style.setProperty('--article-font-size', fs + 'px');
                document.querySelector('.font-size-slider').value = fs;
                document.querySelector('.font-size-value').textContent = fs + 'px';
            }
            if (lh) {
                document.documentElement.style.setProperty('--article-line-height', lh);
                document.querySelector('.line-height-slider').value = lh;
                document.querySelector('.line-height-value').textContent = lh;
            }
        }
    }

    // ==================== 8. 阅读分析器 ====================
    class ReadingAnalyzer {
        constructor() {
            this.init();
        }

        init() {
            const article = document.querySelector('.post-md');
            if (!article) return;

            const text = article.textContent || '';
            const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
            const english = (text.match(/[a-zA-Z]+/g) || []).length;
            const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 5);
            const readTime = Math.ceil(chinese / 400 + english / 200);
            const techTerms = (text.match(/(算法|数据|系统|框架|协议|模型|引擎|架构|接口|组件|函数|类|变量)/g) || []).length;
            const techDensity = chinese > 0 ? (techTerms / chinese * 100).toFixed(1) : 0;

            let difficulty = '简单', diffClass = 'easy';
            const avgLen = sentences.length > 0 ? chinese / sentences.length : 0;
            if (avgLen > 30 || techDensity > 5) { difficulty = '困难'; diffClass = 'hard'; }
            else if (avgLen > 20 || techDensity > 2) { difficulty = '中等'; diffClass = 'medium'; }

            const div = document.createElement('div');
            div.className = 'reading-analyzer';
            div.innerHTML = `
                <div class="ra-header">📊 文章分析</div>
                <div class="ra-stats">
                    <div class="ra-stat"><span class="ra-value" data-target="${readTime}">0</span><span class="ra-label">分钟阅读</span></div>
                    <div class="ra-stat"><span class="ra-value" data-target="${chinese}">0</span><span class="ra-label">中文字符</span></div>
                    <div class="ra-stat"><span class="ra-value" data-target="${sentences.length}">0</span><span class="ra-label">句子数</span></div>
                    <div class="ra-stat"><span class="ra-value ${diffClass}">${difficulty}</span><span class="ra-label">难度</span></div>
                </div>
                <div class="ra-detail">
                    <div class="ra-bar"><div class="ra-bar-fill" style="width:0%"></div></div>
                    <span class="ra-bar-label">专业度 ${techDensity}%</span>
                </div>
            `;

            const title = document.querySelector('.post-main-title');
            if (title) title.parentNode.insertBefore(div, title.nextSibling);

            // 数字动画
            setTimeout(() => {
                div.querySelectorAll('.ra-value[data-target]').forEach(el => {
                    utils.animateValue(el, 0, parseInt(el.dataset.target), 1000);
                });
                div.querySelector('.ra-bar-fill').style.width = Math.min(techDensity * 8, 100) + '%';
            }, 300);
        }
    }

    // ==================== 9. 知识图谱 ====================
    class KnowledgeGraph {
        constructor() {
            this.init();
        }

        init() {
            const nodes = [];
            document.querySelectorAll('.post-meta a[href*="/tags/"]').forEach(a => {
                nodes.push({ id: a.textContent.trim(), type: 'tag', url: a.href });
            });
            document.querySelectorAll('.post-meta a[href*="/categories/"]').forEach(a => {
                nodes.push({ id: a.textContent.trim(), type: 'category', url: a.href });
            });

            const seen = new Set();
            const unique = nodes.filter(n => {
                if (seen.has(n.id)) return false;
                seen.add(n.id);
                return true;
            });

            if (unique.length === 0) return;

            const widget = document.createElement('div');
            widget.className = 'knowledge-graph-widget';
            widget.innerHTML = `
                <div class="kg-header">
                    <span>🔗 知识关联</span>
                    <button class="kg-toggle">▼</button>
                </div>
                <div class="kg-content">
                    <div class="kg-nodes">
                        ${unique.map(n => `<a href="${n.url}" class="kg-node kg-${n.type}">${n.id}</a>`).join('')}
                    </div>
                </div>
            `;

            widget.querySelector('.kg-toggle').addEventListener('click', function() {
                this.textContent = this.textContent === '▼' ? '▶' : '▼';
                widget.querySelector('.kg-content').classList.toggle('collapsed');
            });

            const meta = document.querySelector('.post-meta');
            if (meta) meta.parentNode.insertBefore(widget, meta.nextSibling);
        }
    }

    // ==================== 10. 代码块增强 ====================
    class CodeEnhancer {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('pre code').forEach(code => {
                const pre = code.parentElement;
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';

                const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
                const lang = langClass ? langClass.replace('language-', '') : 'code';

                const header = document.createElement('div');
                header.className = 'code-block-header';
                header.innerHTML = `
                    <span class="code-lang">${lang}</span>
                    <button class="code-copy-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <span>复制</span>
                    </button>
                `;

                header.querySelector('.code-copy-btn').addEventListener('click', function() {
                    navigator.clipboard.writeText(code.textContent).then(() => {
                        this.classList.add('copied');
                        this.querySelector('span').textContent = '已复制';
                        setTimeout(() => {
                            this.classList.remove('copied');
                            this.querySelector('span').textContent = '复制';
                        }, 2000);
                    });
                });

                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(header);
                wrapper.appendChild(pre);
            });
        }
    }

    // ==================== 11. 图片灯箱 ====================
    class ImageLightbox {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('.post-md img').forEach(img => {
                if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', () => this.open(img));
            });
        }

        open(img) {
            const overlay = document.createElement('div');
            overlay.className = 'image-lightbox';
            overlay.innerHTML = `
                <div class="lightbox-backdrop"></div>
                <img src="${img.src}" alt="${img.alt || ''}" class="lightbox-img">
                <button class="lightbox-close">✕</button>
            `;
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => overlay.classList.add('show'));

            const close = () => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    document.body.style.overflow = '';
                }, 300);
            };

            overlay.querySelector('.lightbox-close').addEventListener('click', close);
            overlay.querySelector('.lightbox-backdrop').addEventListener('click', close);
            document.addEventListener('keydown', function esc(e) {
                if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
            });
        }
    }

    // ==================== 12. 文章推荐 ====================
    class ArticleRecommend {
        constructor() {
            this.init();
        }

        init() {
            const currentTags = Array.from(document.querySelectorAll('.post-meta a[href*="/tags/"]')).map(a => a.textContent.trim());
            if (currentTags.length === 0) return;

            // 从文章列表获取相关文章
            const allLinks = Array.from(document.querySelectorAll('.post-list-item a, .archive-item a'));
            const related = allLinks.filter(a => {
                const parent = a.closest('.post-list-item, .archive-item');
                if (!parent) return false;
                const tags = Array.from(parent.querySelectorAll('a[href*="/tags/"]')).map(t => t.textContent.trim());
                return tags.some(t => currentTags.includes(t)) && a.href !== location.href;
            }).slice(0, 3);

            if (related.length === 0) return;

            const section = document.createElement('div');
            section.className = 'article-recommend';
            section.innerHTML = `
                <div class="ar-header">📚 相关推荐</div>
                <div class="ar-list">
                    ${related.map(a => `
                        <a href="${a.href}" class="ar-item">
                            <span class="ar-title">${a.textContent}</span>
                            <span class="ar-arrow">→</span>
                        </a>
                    `).join('')}
                </div>
            `;

            const footer = document.querySelector('.post-footer-pre-next');
            if (footer) footer.parentNode.insertBefore(section, footer);
        }
    }

    // ==================== 13. 鼠标轨迹效果 ====================
    class CursorTrail {
        constructor() {
            this.trail = [];
            this.init();
        }

        init() {
            if (window.matchMedia('(pointer: coarse)').matches) return;

            for (let i = 0; i < 8; i++) {
                const dot = document.createElement('div');
                dot.className = 'cursor-trail';
                dot.style.cssText = `
                    position: fixed;
                    width: ${8 - i}px;
                    height: ${8 - i}px;
                    background: rgba(194, 94, 0, ${0.3 - i * 0.03});
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9998;
                    transition: transform 0.1s linear;
                `;
                document.body.appendChild(dot);
                this.trail.push({ el: dot, x: 0, y: 0 });
            }

            let mouseX = 0, mouseY = 0;
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            const animate = () => {
                this.trail.forEach((t, i) => {
                    const prev = i === 0 ? { x: mouseX, y: mouseY } : this.trail[i - 1];
                    t.x += (prev.x - t.x) * 0.3;
                    t.y += (prev.y - t.y) * 0.3;
                    t.el.style.transform = `translate(${t.x - 4}px, ${t.y - 4}px)`;
                });
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    // ==================== 初始化 ====================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    function run() {
        const isPost = document.querySelector('.post-md') !== null;
        const isPage = document.querySelector('.paper-main') !== null;

        if (isPost || isPage) {
            new ParticleBackground();
            new CursorTrail();
            new TypewriterEffect();
            new ScrollReveal();
            new ReadingProgress();
            new FloatingToolbar();
            new SmartToc();
            new ThemeSettings();
            new ReadingAnalyzer();
            new KnowledgeGraph();
            new CodeEnhancer();
            new ImageLightbox();
            new ArticleRecommend();
        }
    }

    init();
})();
