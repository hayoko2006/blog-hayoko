/**
 * Word-like Navigation Pane Component
 * 
 * Renders a multi-level table of contents with expand/collapse functionality
 * similar to Microsoft Word's navigation pane.
 */

class WordNav {
    /**
     * Create a WordNav instance
     * @param {HTMLElement} container - The container element to render into
     * @param {Array} tocData - TOC tree structure from markdown-toc.js
     * @param {Object} options - Configuration options
     */
    constructor(container, tocData, options = {}) {
        this.container = container;
        this.tocData = tocData || [];
        this.options = {
            defaultExpanded: true,
            scrollOffset: 20,
            smoothScroll: true,
            ...options
        };
        
        this.activeItem = null;
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create main list
        const ul = document.createElement('ul');
        ul.className = 'word-nav';
        
        // Render TOC tree
        this.renderTocItems(this.tocData, ul);
        
        this.container.appendChild(ul);
        
        // Add event listeners
        this.setupEventListeners();
        
        // Set initial expanded state
        this.setInitialExpandedState();
        
        // Setup scroll spy
        this.setupScrollSpy();
    }
    
    /**
     * Recursively render TOC items
     * @param {Array} items - TOC items array
     * @param {HTMLElement} parentUl - Parent UL element
     */
    renderTocItems(items, parentUl) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.dataset.level = item.level;
            li.dataset.id = item.id;
            
            // Create nav item
            const navItem = document.createElement('div');
            navItem.className = 'word-nav-item';
            navItem.dataset.id = item.id;
            
            // Create toggle button
            const toggle = document.createElement('div');
            toggle.className = 'word-nav-toggle';
            if (item.children && item.children.length > 0) {
                toggle.classList.add(this.options.defaultExpanded ? 'expanded' : 'collapsed');
                const toggleIcon = document.createElement('div');
                toggleIcon.className = 'word-nav-toggle-icon';
                toggle.appendChild(toggleIcon);
            } else {
                toggle.classList.add('empty');
            }
            
            // Create text span
            const textSpan = document.createElement('span');
            textSpan.className = 'word-nav-text';
            textSpan.textContent = item.text;
            
            // Assemble nav item
            navItem.appendChild(toggle);
            navItem.appendChild(textSpan);
            li.appendChild(navItem);
            
            // Create children list if needed
            if (item.children && item.children.length > 0) {
                const childUl = document.createElement('ul');
                this.renderTocItems(item.children, childUl);
                li.appendChild(childUl);
                
                // Set initial expanded/collapsed state
                li.classList.add(this.options.defaultExpanded ? 'expanded' : 'collapsed');
            }
            
            parentUl.appendChild(li);
        });
    }
    
    /**
     * Setup event listeners for the navigation
     */
    setupEventListeners() {
        // Click on nav item (for navigation)
        this.container.addEventListener('click', (e) => {
            const navItem = e.target.closest('.word-nav-item');
            if (!navItem) return;
            
            const id = navItem.dataset.id;
            const toggle = navItem.querySelector('.word-nav-toggle');
            
            // Check if toggle button was clicked
            if (toggle && toggle.contains(e.target)) {
                this.toggleItem(navItem.parentElement);
            } else {
                // Navigate to section
                this.navigateTo(id);
            }
        });
    }
    
    /**
     * Toggle expand/collapse of a navigation item
     * @param {HTMLElement} li - The LI element to toggle
     */
    toggleItem(li) {
        const hasChildren = li.querySelector('ul');
        if (!hasChildren) return;
        
        const isExpanded = li.classList.contains('expanded');
        const toggle = li.querySelector('.word-nav-toggle');
        
        if (isExpanded) {
            li.classList.remove('expanded');
            li.classList.add('collapsed');
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
        } else {
            li.classList.remove('collapsed');
            li.classList.add('expanded');
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
        }
    }
    
    /**
     * Navigate to a section by ID
     * @param {string} id - The ID of the target section
     */
    navigateTo(id) {
        const targetElement = document.getElementById(id);
        if (!targetElement) {
            console.warn(`Element with ID "${id}" not found`);
            return;
        }
        
        // Update active item
        this.setActiveItem(id);
        
        // Smooth scroll to target
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - this.options.scrollOffset;
        
        if (this.options.smoothScroll) {
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                top: offsetPosition
            });
        }
    }
    
    /**
     * Set the active navigation item
     * @param {string} id - The ID of the active item
     */
    setActiveItem(id) {
        // Remove active class from previous item
        if (this.activeItem) {
            this.activeItem.classList.remove('active');
        }
        
        // Find and set new active item
        const navItem = this.container.querySelector(`.word-nav-item[data-id="${id}"]`);
        if (navItem) {
            navItem.classList.add('active');
            this.activeItem = navItem;
            
            // Ensure parent items are expanded
            this.expandParents(navItem.closest('li'));
        }
    }
    
    /**
     * Expand all parent items of a given element
     * @param {HTMLElement} li - The LI element
     */
    expandParents(li) {
        let current = li;
        while (current) {
            if (current.tagName === 'LI' && current.classList.contains('collapsed')) {
                this.toggleItem(current);
            }
            current = current.parentElement.closest('li');
        }
    }
    
    /**
     * Set initial expanded state based on options
     */
    setInitialExpandedState() {
        if (!this.options.defaultExpanded) {
            const allLis = this.container.querySelectorAll('li');
            allLis.forEach(li => {
                if (li.querySelector('ul')) {
                    li.classList.remove('expanded');
                    li.classList.add('collapsed');
                    const toggle = li.querySelector('.word-nav-toggle');
                    if (toggle) {
                        toggle.classList.remove('expanded');
                        toggle.classList.add('collapsed');
                    }
                }
            });
        }
    }
    
    /**
     * Setup scroll spy to highlight current section
     */
    setupScrollSpy() {
        if (!this.tocData.length) return;
        
        // Get all section IDs from TOC
        const sectionIds = this.getAllSectionIds(this.tocData);
        if (!sectionIds.length) return;
        
        let currentSectionId = null;
        
        const checkSection = () => {
            let nearestSectionId = null;
            let nearestDistance = Infinity;
            
            // Find the section closest to the viewport top
            sectionIds.forEach(id => {
                const element = document.getElementById(id);
                if (!element) return;
                
                const rect = element.getBoundingClientRect();
                const distance = Math.abs(rect.top - this.options.scrollOffset);
                
                // If element is near the top of viewport
                if (rect.top <= this.options.scrollOffset + 100 && distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestSectionId = id;
                }
            });
            
            // Update active section if changed
            if (nearestSectionId && nearestSectionId !== currentSectionId) {
                currentSectionId = nearestSectionId;
                this.setActiveItem(nearestSectionId);
            }
            
            // If no section found, check the first one
            if (!nearestSectionId && window.scrollY === 0) {
                const firstId = sectionIds[0];
                if (firstId && firstId !== currentSectionId) {
                    currentSectionId = firstId;
                    this.setActiveItem(firstId);
                }
            }
        };
        
        // Initial check
        checkSection();
        
        // Throttle scroll events for performance
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    checkSection();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    /**
     * Get all section IDs from TOC tree
     * @param {Array} items - TOC items
     * @returns {Array} - Array of section IDs
     */
    getAllSectionIds(items) {
        const ids = [];
        
        const traverse = (items) => {
            items.forEach(item => {
                if (item.id) ids.push(item.id);
                if (item.children && item.children.length > 0) {
                    traverse(item.children);
                }
            });
        };
        
        traverse(items);
        return ids;
    }
    
    /**
     * Update TOC data and re-render
     * @param {Array} tocData - New TOC data
     */
    update(tocData) {
        this.tocData = tocData || [];
        this.init();
    }
    
    /**
     * Expand all items
     */
    expandAll() {
        const allLis = this.container.querySelectorAll('li');
        allLis.forEach(li => {
            if (li.classList.contains('collapsed')) {
                this.toggleItem(li);
            }
        });
    }
    
    /**
     * Collapse all items
     */
    collapseAll() {
        const allLis = this.container.querySelectorAll('li');
        allLis.forEach(li => {
            if (li.classList.contains('expanded')) {
                this.toggleItem(li);
            }
        });
    }
}

// Auto-initialization when page loads and TOC data is available
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have TOC data from the server
    if (window.pageTOC) {
        const tocContainer = document.querySelector('.left-toc-container');
        if (tocContainer) {
            // Clear existing toc if any
            const existingToc = tocContainer.querySelector('#toc');
            if (existingToc) {
                existingToc.style.display = 'none';
            }
            
            // Create new container for word nav
            const wordNavContainer = document.createElement('div');
            wordNavContainer.className = 'word-nav-container';
            tocContainer.appendChild(wordNavContainer);
            
            // Initialize WordNav
            window.wordNav = new WordNav(wordNavContainer, window.pageTOC, {
                defaultExpanded: true,
                scrollOffset: 100,
                smoothScroll: true
            });
            
            console.log('WordNav initialized with', window.pageTOC.length, 'items');
        }
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordNav;
}