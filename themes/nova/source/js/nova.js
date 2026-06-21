/**
 * Nova Theme - Main JavaScript
 * Modern, Clean, Responsive Hexo Theme
 */

(function() {
  'use strict';

  // ===========================================
  // Theme Manager
  // ===========================================
  const ThemeManager = {
    init() {
      this.scheme = this.getStoredScheme() || NovaConfig.scheme || 'auto';
      this.applyScheme(this.scheme);
      this.bindEvents();
    },

    getStoredScheme() {
      try {
        return localStorage.getItem('nova-scheme');
      } catch (e) {
        return null;
      }
    },

    storeScheme(scheme) {
      try {
        localStorage.setItem('nova-scheme', scheme);
      } catch (e) {
        // Ignore
      }
    },

    applyScheme(scheme) {
      const html = document.documentElement;
      if (scheme === 'auto') {
        html.removeAttribute('data-scheme');
        html.setAttribute('data-scheme', 'auto');
      } else {
        html.setAttribute('data-scheme', scheme);
      }
      this.scheme = scheme;
    },

    toggle() {
      const schemes = ['light', 'dark', 'auto'];
      const currentIndex = schemes.indexOf(this.scheme);
      const nextIndex = (currentIndex + 1) % schemes.length;
      const nextScheme = schemes[nextIndex];
      this.applyScheme(nextScheme);
      this.storeScheme(nextScheme);
    },

    bindEvents() {
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }
    }
  };

  // ===========================================
  // Mobile Menu
  // ===========================================
  const MobileMenu = {
    init() {
      this.menu = document.getElementById('mobile-menu');
      this.toggleBtn = document.getElementById('menu-toggle');
      this.closeBtn = document.getElementById('mobile-menu-close');
      this.overlay = document.getElementById('mobile-menu-overlay');

      if (!this.menu) return;

      this.bindEvents();
    },

    open() {
      this.menu.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.menu.classList.remove('active');
      document.body.style.overflow = '';
    },

    bindEvents() {
      this.toggleBtn?.addEventListener('click', () => this.open());
      this.closeBtn?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', () => this.close());

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }
  };

  // ===========================================
  // Search
  // ===========================================
  const Search = {
    init() {
      if (!NovaConfig.search?.enable) return;

      this.modal = document.getElementById('search-modal');
      this.btn = document.getElementById('search-btn');
      this.closeBtn = document.getElementById('search-close');
      this.overlay = document.getElementById('search-overlay');
      this.input = document.getElementById('search-input');
      this.results = document.getElementById('search-results');

      if (!this.modal) return;

      this.searchData = null;
      this.bindEvents();
    },

    open() {
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => this.input?.focus(), 100);
    },

    close() {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
      if (this.input) this.input.value = '';
      if (this.results) this.results.innerHTML = '';
    },

    async loadSearchData() {
      if (this.searchData) return this.searchData;

      try {
        const response = await fetch('/search.xml');
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');
        const entries = xml.querySelectorAll('entry');

        this.searchData = Array.from(entries).map(entry => ({
          title: entry.querySelector('title')?.textContent || '',
          content: entry.querySelector('content')?.textContent || '',
          url: entry.querySelector('url')?.textContent || '',
          date: entry.querySelector('published')?.textContent || ''
        }));

        return this.searchData;
      } catch (e) {
        console.error('Failed to load search data:', e);
        return [];
      }
    },

    async search(keyword) {
      if (!keyword.trim()) {
        this.results.innerHTML = '';
        return;
      }

      const data = await this.loadSearchData();
      const lowerKeyword = keyword.toLowerCase();

      const results = data.filter(item => {
        return item.title.toLowerCase().includes(lowerKeyword) ||
               item.content.toLowerCase().includes(lowerKeyword);
      }).slice(0, 10);

      this.renderResults(results, keyword);
    },

    renderResults(results, keyword) {
      if (results.length === 0) {
        this.results.innerHTML = `
          <div class="search-no-results">
            <i class="fas fa-search"></i>
            <p>No results found for "${keyword}"</p>
          </div>
        `;
        return;
      }

      const html = results.map(item => {
        const excerpt = this.getExcerpt(item.content, keyword);
        return `
          <a href="${item.url}" class="search-result-item">
            <h4 class="search-result-title">${this.highlight(item.title, keyword)}</h4>
            <p class="search-result-excerpt">${excerpt}</p>
          </a>
        `;
      }).join('');

      this.results.innerHTML = html;
    },

    getExcerpt(content, keyword) {
      const text = content.replace(/<[^>]+>/g, '');
      const index = text.toLowerCase().indexOf(keyword.toLowerCase());

      if (index === -1) {
        return text.substring(0, 120) + '...';
      }

      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + 70);
      let excerpt = text.substring(start, end);

      if (start > 0) excerpt = '...' + excerpt;
      if (end < text.length) excerpt = excerpt + '...';

      return this.highlight(excerpt, keyword);
    },

    highlight(text, keyword) {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    },

    bindEvents() {
      this.btn?.addEventListener('click', () => this.open());
      this.closeBtn?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', () => this.close());

      let debounceTimer;
      this.input?.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.search(e.target.value), 300);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
        // Ctrl/Cmd + K to open search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.open();
        }
      });
    }
  };

  // ===========================================
  // Back to Top
  // ===========================================
  const BackToTop = {
    init() {
      this.btn = document.getElementById('back-to-top');
      if (!this.btn) return;

      this.bindEvents();
    },

    bindEvents() {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          this.btn.classList.add('visible');
        } else {
          this.btn.classList.remove('visible');
        }
      });

      this.btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  // ===========================================
  // Header Scroll Effect
  // ===========================================
  const HeaderScroll = {
    init() {
      this.header = document.getElementById('header');
      if (!this.header) return;

      this.bindEvents();
    },

    bindEvents() {
      let lastScroll = 0;

      window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
          this.header.classList.add('scrolled');
        } else {
          this.header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
      });
    }
  };

  // ===========================================
  // Table of Contents
  // ===========================================
  const TOC = {
    init() {
      this.toc = document.getElementById('post-toc');
      if (!this.toc) return;

      this.headings = document.querySelectorAll('#post-content h2, #post-content h3');
      this.tocLinks = this.toc.querySelectorAll('a');

      if (this.headings.length === 0 || this.tocLinks.length === 0) return;

      this.bindEvents();
    },

    bindEvents() {
      // Smooth scroll to heading
      this.tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(link.getAttribute('href'));
          if (target) {
            const offset = target.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: offset, behavior: 'smooth' });
          }
        });
      });

      // Highlight active heading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              this.tocLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                  link.classList.add('active');
                }
              });
            }
          });
        },
        { rootMargin: '-100px 0px -80% 0px' }
      );

      this.headings.forEach(heading => observer.observe(heading));
    }
  };

  // ===========================================
  // Background Animation (Canvas)
  // ===========================================
  const BackgroundAnimation = {
    init() {
      if (!NovaConfig.backgroundAnimation) return;

      this.canvas = document.getElementById('bg-canvas');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.animationId = null;

      this.resize();
      this.createParticles();
      this.animate();

      window.addEventListener('resize', () => {
        this.resize();
        this.createParticles();
      });
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    createParticles() {
      const count = Math.min(Math.floor(window.innerWidth / 15), 100);
      this.particles = [];

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    },

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const isDark = document.documentElement.getAttribute('data-scheme') === 'dark' ||
        (document.documentElement.getAttribute('data-scheme') === 'auto' &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);

      const color = isDark ? '255, 255, 255' : '99, 102, 241';

      // Update and draw particles
      this.particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = this.canvas.width;
        if (particle.x > this.canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = this.canvas.height;
        if (particle.y > this.canvas.height) particle.y = 0;

        // Draw particle
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${color}, ${particle.opacity})`;
        this.ctx.fill();

        // Draw connections
        for (let j = i + 1; j < this.particles.length; j++) {
          const other = this.particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(other.x, other.y);
            this.ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - distance / 150)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      });

      this.animationId = requestAnimationFrame(() => this.animate());
    }
  };

  // ===========================================
  // Smooth Scroll for Anchor Links
  // ===========================================
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#') return;

          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            const offset = target.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: offset, behavior: 'smooth' });
          }
        });
      });
    }
  };

  // ===========================================
  // Image Lazy Loading Enhancement
  // ===========================================
  const LazyLoad = {
    init() {
      const images = document.querySelectorAll('img[loading="lazy"]');

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          });
        });

        images.forEach(img => observer.observe(img));
      }
    }
  };

  // ===========================================
  // Copy Code Button
  // ===========================================
  const CopyCode = {
    init() {
      document.querySelectorAll('pre').forEach(pre => {
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fas fa-copy"></i>';
        button.setAttribute('aria-label', 'Copy code');

        button.addEventListener('click', async () => {
          const code = pre.querySelector('code') || pre;
          try {
            await navigator.clipboard.writeText(code.textContent);
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            setTimeout(() => {
              button.innerHTML = '<i class="fas fa-copy"></i>';
              button.classList.remove('copied');
            }, 2000);
          } catch (e) {
            console.error('Failed to copy:', e);
          }
        });

        pre.style.position = 'relative';
        pre.appendChild(button);
      });
    }
  };

  // ===========================================
  // Initialize
  // ===========================================
  function init() {
    ThemeManager.init();
    MobileMenu.init();
    Search.init();
    BackToTop.init();
    HeaderScroll.init();
    TOC.init();
    BackgroundAnimation.init();
    SmoothScroll.init();
    LazyLoad.init();
    CopyCode.init();
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
