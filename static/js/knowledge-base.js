// Knowledge Base - Automatic Content Loading from Hugo Pages
class KnowledgeBase {
    constructor() {
        this.searchInput = document.getElementById('knowledge-search');
        this.searchSuggestions = document.getElementById('search-suggestions');
        this.knowledgeTree = document.getElementById('knowledge-tree');
        this.mainContent = document.getElementById('knowledge-main');
        
        this.contentIndex = new Map(); // Store all content
        this.searchData = [];
        this.currentSearchResults = [];
        this.selectedSuggestionIndex = -1;
        
        this.init();
    }
    
    async init() {
        await this.loadContentIndex();
        this.buildNavigationTree();
        this.setupNavigation();
        this.setupSearch();
        this.setupKeyboardNavigation();
    }
    
    async loadContentIndex() {
        try {
            // Try to load the content index - you'll create this
            const response = await fetch('/index.json');
            if (response.ok) {
                const data = await response.json();
                this.processContentData(data);
            } else {
                // Fallback to manual content if index doesn't exist
                console.log('Content index not found, using fallback content');
                this.loadFallbackContent();
            }
        } catch (error) {
            console.log('Error loading content index:', error);
            this.loadFallbackContent();
        }
    }
    
    processContentData(pages) {
        this.searchData = [];
        const categories = new Map();
        
        // Process all pages from Hugo
        pages.forEach(page => {
            // Only process knowledge base pages
            if (page.section === 'knowledge' && page.type === 'knowledge') {
                const pathParts = page.permalink.split('/').filter(p => p);
                
                if (pathParts.length >= 3) { // experience/knowledge/category/item
                    const category = this.titleCase(pathParts[2].replace(/-/g, ' '));
                    const item = this.titleCase(pathParts[3] ? pathParts[3].replace(/-/g, ' ') : '');
                    
                    if (!categories.has(category)) {
                        categories.set(category, new Map());
                    }
                    
                    if (item) {
                        categories.get(category).set(item, {
                            title: page.title || item,
                            path: page.permalink,
                            content: page.content || page.summary || '',
                            date: page.date
                        });
                        
                        // Add to search data
                        this.searchData.push({
                            title: page.title || item,
                            path: page.permalink,
                            content: page.content || page.summary || '',
                            category: category,
                            displayPath: `${category} • ${item}`
                        });
                    }
                }
            }
        });
        
        this.contentIndex = categories;
    }
    
    loadFallbackContent() {
        // Fallback content structure for testing
        const fallbackData = new Map([
            ['Network Security', new Map([
                ['Fundamentals', {
                    title: 'Network Security Fundamentals',
                    path: '/experience/knowledge/network-security/fundamentals/',
                    content: `# Network Security Fundamentals

## Introduction
Network security is the foundation of cybersecurity, protecting data integrity, confidentiality, and availability.

## Key Concepts
- **Confidentiality**: Data encryption and access controls
- **Integrity**: Data validation and checksums  
- **Availability**: Redundancy and DDoS protection

## Common Threats
1. Man-in-the-Middle attacks
2. DDoS attacks
3. Data interception

## Best Practices
- Regular security assessments
- Network monitoring
- Employee training`,
                    date: new Date().toISOString()
                }],
                ['Protocols', {
                    title: 'Network Security Protocols',
                    path: '/experience/knowledge/network-security/protocols/',
                    content: `# Network Security Protocols

## SSL/TLS Protocols
Secure communication protocols for encrypted data transmission.

### TLS Versions
- TLS 1.2 (widely used)
- TLS 1.3 (latest, enhanced security)

## IPSec
Internet Protocol Security for network layer protection.

## SSH Protocol
Secure Shell protocol for remote access and file transfer.`,
                    date: new Date().toISOString()
                }]
            ])],
            ['Penetration Testing', new Map([
                ['Methodology', {
                    title: 'Penetration Testing Methodology',
                    path: '/experience/knowledge/pentest/methodology/',
                    content: `# Penetration Testing Methodology

## PTES (Penetration Testing Execution Standard)

### Pre-engagement
- Scope definition
- Legal agreements
- Timeline planning

### Intelligence Gathering
- Passive reconnaissance
- Active reconnaissance
- OSINT collection

### Vulnerability Analysis
- Vulnerability scanning
- Manual testing
- False positive analysis

### Exploitation
- Proof of concept development
- Exploitation techniques
- Post-exploitation activities`,
                    date: new Date().toISOString()
                }]
            ])]
        ]);
        
        this.contentIndex = fallbackData;
        
        // Build search data from fallback
        this.searchData = [];
        for (const [category, items] of fallbackData) {
            for (const [item, data] of items) {
                this.searchData.push({
                    title: data.title,
                    path: data.path,
                    content: data.content,
                    category: category,
                    displayPath: `${category} • ${item}`
                });
            }
        }
    }
    
    buildNavigationTree() {
        const tree = this.knowledgeTree;
        tree.innerHTML = '';
        
        const icons = {
            'Network Security': '🛡️',
            'Penetration Testing': '🔍',
            'Digital Forensics': '🔬',
            'Malware Analysis': '🦠',
            'Web Security': '🌐',
            'System Administration': '⚙️'
        };
        
        for (const [category, items] of this.contentIndex) {
            const categoryLi = document.createElement('li');
            const categoryLink = document.createElement('a');
            categoryLink.className = 'nav-item has-children';
            categoryLink.innerHTML = `${icons[category] || '📋'} ${category}`;
            categoryLink.href = '#';
            
            categoryLi.appendChild(categoryLink);
            
            const subList = document.createElement('ul');
            subList.className = 'sub-nav';
            
            for (const [itemName, itemData] of items) {
                const subLi = document.createElement('li');
                const subLink = document.createElement('a');
                subLink.className = 'nav-item';
                subLink.textContent = itemName;
                subLink.href = '#';
                subLink.dataset.path = itemData.path;
                subLink.dataset.title = itemData.title;
                
                subLi.appendChild(subLink);
                subList.appendChild(subLi);
            }
            
            categoryLi.appendChild(subList);
            tree.appendChild(categoryLi);
        }
    }
    
    setupNavigation() {
        this.knowledgeTree.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (e.target.classList.contains('has-children')) {
                const subNav = e.target.nextElementSibling;
                const isExpanded = e.target.classList.contains('expanded');
                
                if (isExpanded) {
                    e.target.classList.remove('expanded');
                    subNav.classList.remove('expanded');
                } else {
                    // Close other expanded items
                    document.querySelectorAll('.nav-item.expanded').forEach(item => {
                        item.classList.remove('expanded');
                        if (item.nextElementSibling) {
                            item.nextElementSibling.classList.remove('expanded');
                        }
                    });
                    
                    e.target.classList.add('expanded');
                    subNav.classList.add('expanded');
                }
            } else if (e.target.dataset.path) {
                this.loadContentInPage(e.target.dataset.path, e.target.dataset.title);
                
                // Update active state
                document.querySelectorAll('.nav-item.active').forEach(item => {
                    item.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    }
    
    loadContentInPage(path, title) {
        // Find content by path
        let contentData = null;
        
        for (const [category, items] of this.contentIndex) {
            for (const [itemName, itemData] of items) {
                if (itemData.path === path) {
                    contentData = itemData;
                    break;
                }
            }
            if (contentData) break;
        }
        
        if (contentData) {
            const article = this.mainContent.querySelector('.knowledge-article');
            if (article) {
                article.innerHTML = `
                    <header class="knowledge-header">
                        <h1>${contentData.title}</h1>
                        <div class="knowledge-meta">
                            <time datetime="${new Date(contentData.date).toISOString().split('T')[0]}">
                                Last updated: ${new Date(contentData.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </time>
                        </div>
                    </header>
                    <div class="knowledge-body">
                        ${this.markdownToHtml(contentData.content)}
                    </div>
                `;
            }
        }
    }
    
    markdownToHtml(markdown) {
        return markdown
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')  
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h|u|l])/gm, '<p>')
            .replace(/$/g, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<[h|u])/g, '$1')
            .replace(/(<\/[h|u]>)<\/p>/g, '$1');
    }
    
    setupSearch() {
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.hideSearchSuggestions();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
        
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideSearchSuggestions();
            }, 200);
        });
    }
    
    performSearch(query) {
        const queryLower = query.toLowerCase();
        const results = this.searchData.filter(item => {
            return item.title.toLowerCase().includes(queryLower) ||
                   item.content.toLowerCase().includes(queryLower) ||
                   item.category.toLowerCase().includes(queryLower);
        });
        
        this.currentSearchResults = results.slice(0, 6);
        this.renderSearchSuggestions(this.currentSearchResults, query);
    }
    
    renderSearchSuggestions(results, query) {
        if (results.length === 0) {
            this.searchSuggestions.innerHTML = '<div class="search-empty">No results found</div>';
            this.showSearchSuggestions();
            return;
        }
        
        this.searchSuggestions.innerHTML = results.map((item, index) => `
            <div class="suggestion-item" data-path="${item.path}" data-title="${item.title}" data-index="${index}">
                <div class="suggestion-title">${this.highlightQuery(item.title, query)}</div>
                <div class="suggestion-path">${item.displayPath}</div>
            </div>
        `).join('');
        
        this.setupSuggestionClicks();
        this.showSearchSuggestions();
    }
    
    setupSuggestionClicks() {
        this.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSearchResult(item.dataset.path, item.dataset.title);
            });
        });
    }
    
    selectSearchResult(path, title) {
        this.hideSearchSuggestions();
        this.loadContentInPage(path, title);
        this.searchInput.value = '';
        
        // Update navigation
        const navItem = document.querySelector(`[data-path="${path}"]`);
        if (navItem) {
            document.querySelectorAll('.nav-item.active').forEach(item => {
                item.classList.remove('active');
            });
            navItem.classList.add('active');
            
            // Expand parent if needed
            const parentList = navItem.closest('ul.sub-nav');
            if (parentList) {
                const parentCategory = parentList.previousElementSibling;
                if (parentCategory) {
                    parentCategory.classList.add('expanded');
                    parentList.classList.add('expanded');
                }
            }
        }
    }
    
    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    showSearchSuggestions() {
        this.searchSuggestions.classList.add('active');
    }
    
    hideSearchSuggestions() {
        this.searchSuggestions.classList.remove('active');
    }
    
    titleCase(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
    
    setupKeyboardNavigation() {
        this.searchInput.addEventListener('keydown', (e) => {
            const suggestions = this.searchSuggestions.querySelectorAll('.suggestion-item');
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.min(
                        this.selectedSuggestionIndex + 1, 
                        suggestions.length - 1
                    );
                    this.updateSelectedSuggestion();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.max(
                        this.selectedSuggestionIndex - 1, 
                        -1
                    );
                    this.updateSelectedSuggestion();
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedSuggestionIndex >= 0) {
                        const selectedSuggestion = suggestions[this.selectedSuggestionIndex];
                        this.selectSearchResult(selectedSuggestion.dataset.path, selectedSuggestion.dataset.title);
                    }
                    break;
                    
                case 'Escape':
                    this.hideSearchSuggestions();
                    this.searchInput.blur();
                    break;
            }
        });
    }
    
    updateSelectedSuggestion() {
        this.searchSuggestions.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedSuggestionIndex);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeBase();
});
