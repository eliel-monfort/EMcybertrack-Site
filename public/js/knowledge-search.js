// Professional Knowledge Base Search System
document.addEventListener('DOMContentLoaded', function() {
    initializeKnowledgeSearch();
});

function initializeKnowledgeSearch() {
    const searchInput = document.getElementById('knowledge-search');
    if (!searchInput) return;

    // Create search results dropdown
    createSearchDropdown();
    
    // Add search functionality
    setupSearchEvents();
    
    // Load and index all content
    indexAllContent();
}

let searchIndex = [];
let searchResults = [];
let selectedIndex = -1;

function createSearchDropdown() {
    const searchWrapper = document.querySelector('.search-wrapper');
    
    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.id = 'search-dropdown';
    
    searchWrapper.appendChild(dropdown);
}

function setupSearchEvents() {
    const searchInput = document.getElementById('knowledge-search');
    const dropdown = document.getElementById('search-dropdown');
    
    // Search on input
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length < 2) {
            hideDropdown();
            return;
        }
        performSearch(query);
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const dropdown = document.getElementById('search-dropdown');
        const results = dropdown.querySelectorAll('.search-result-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                updateSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    const result = searchResults[selectedIndex];
                    navigateToResult(result);
                }
                break;
                
            case 'Escape':
                hideDropdown();
                searchInput.blur();
                break;
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper')) {
            hideDropdown();
        }
    });
}

function indexAllContent() {
    // Get all navigation items for indexing
    const navItems = document.querySelectorAll('.nav-item[onclick*="loadContent"]');
    
    navItems.forEach(item => {
        const title = item.textContent.trim();
        const url = extractUrlFromOnclick(item.getAttribute('onclick'));
        
        if (url) {
            searchIndex.push({
                title: title,
                url: url,
                type: 'page',
                category: getCategoryFromUrl(url)
            });
        }
    });
    
    // Also index current page content
    indexCurrentPageContent();
}

function extractUrlFromOnclick(onclickValue) {
    const match = onclickValue.match(/loadContent\('([^']+)'/);
    return match ? match[1] : null;
}

function getCategoryFromUrl(url) {
    const parts = url.split('/').filter(p => p);
    if (parts.length >= 4) {
        return parts[3].replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return 'Knowledge Base';
}

function indexCurrentPageContent() {
    const currentContent = document.querySelector('.knowledge-body');
    if (!currentContent) return;
    
    const currentUrl = window.location.pathname;
    const currentTitle = document.querySelector('.knowledge-header h1')?.textContent || 'Current Page';
    
    // Index headings
    const headings = currentContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
        searchIndex.push({
            title: heading.textContent.trim(),
            url: currentUrl,
            type: 'heading',
            category: currentTitle,
            element: heading,
            headingLevel: heading.tagName.toLowerCase()
        });
    });
    
    // Index paragraphs with significant content
    const paragraphs = currentContent.querySelectorAll('p');
    paragraphs.forEach((p, index) => {
        const text = p.textContent.trim();
        if (text.length > 50) {
            searchIndex.push({
                title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                url: currentUrl,
                type: 'content',
                category: currentTitle,
                element: p,
                fullText: text
            });
        }
    });
}

function performSearch(query) {
    const queryLower = query.toLowerCase();
    
    searchResults = searchIndex.filter(item => {
        return item.title.toLowerCase().includes(queryLower) ||
               item.category.toLowerCase().includes(queryLower) ||
               (item.fullText && item.fullText.toLowerCase().includes(queryLower));
    });
    
    // Sort by relevance
    searchResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase().indexOf(queryLower);
        const bTitle = b.title.toLowerCase().indexOf(queryLower);
        
        // Exact matches first
        if (aTitle === 0 && bTitle !== 0) return -1;
        if (bTitle === 0 && aTitle !== 0) return 1;
        
        // Pages before content
        if (a.type === 'page' && b.type !== 'page') return -1;
        if (b.type === 'page' && a.type !== 'page') return 1;
        
        // Headings before paragraphs
        if (a.type === 'heading' && b.type === 'content') return -1;
        if (b.type === 'heading' && a.type === 'content') return 1;
        
        return a.title.length - b.title.length;
    });
    
    // Limit results
    searchResults = searchResults.slice(0, 8);
    selectedIndex = -1;
    
    displayResults(query);
}

function displayResults(query) {
    const dropdown = document.getElementById('search-dropdown');
    
    if (searchResults.length === 0) {
        dropdown.innerHTML = `
            <div class="search-no-results">
                <div class="no-results-text">No results found for "${query}"</div>
            </div>
        `;
        showDropdown();
        return;
    }
    
    const resultsHTML = searchResults.map((result, index) => {
        const icon = getResultIcon(result.type);
        const highlightedTitle = highlightMatch(result.title, query);
        
        return `
            <div class="search-result-item" data-index="${index}">
                <div class="result-icon">${icon}</div>
                <div class="result-content">
                    <div class="result-title">${highlightedTitle}</div>
                    <div class="result-meta">
                        <span class="result-type">${getTypeLabel(result.type)}</span>
                        <span class="result-separator">•</span>
                        <span class="result-category">${result.category}</span>
                    </div>
                </div>
                <div class="result-action">
                    <span class="action-hint">↵</span>
                </div>
            </div>
        `;
    }).join('');
    
    dropdown.innerHTML = `
        <div class="search-results-header">
            <span class="results-count">${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}</span>
            <span class="navigation-hint">Use ↑↓ to navigate</span>
        </div>
        ${resultsHTML}
    `;
    
    showDropdown();
}

function getResultIcon(type) {
    switch(type) {
        case 'page': return '📄';
        case 'heading': return '📍';
        case 'content': return '📝';
        default: return '🔍';
    }
}

function getTypeLabel(type) {
    switch(type) {
        case 'page': return 'Page';
        case 'heading': return 'Section';
        case 'content': return 'Content';
        default: return 'Result';
    }
}

function highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateSelection() {
    const items = document.querySelectorAll('.search-result-item');
    
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function navigateToResult(result) {
    hideDropdown();
    
    if (result.type === 'page') {
        // Navigate to different page
        loadContent(result.url);
    } else {
        // Scroll to element on current page
        if (result.element) {
            result.element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Highlight the element briefly
            result.element.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
            setTimeout(() => {
                result.element.style.backgroundColor = '';
            }, 2000);
        }
    }
    
    // Clear search
    document.getElementById('knowledge-search').value = '';
}

function loadContent(url) {
    // Use existing loadContent function if available
    if (typeof window.loadContent === 'function') {
        const activeLink = document.querySelector(`.nav-item[onclick*="${url}"]`);
        if (activeLink) {
            window.loadContent(url, activeLink);
        }
    } else {
        // Fallback to direct navigation
        window.location.href = url;
    }
}

function showDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    dropdown.style.display = 'block';
    dropdown.classList.add('show');
}

function hideDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    dropdown.style.display = 'none';
    dropdown.classList.remove('show');
    selectedIndex = -1;
}

// Add click handlers to results
document.addEventListener('click', function(e) {
    const resultItem = e.target.closest('.search-result-item');
    if (resultItem) {
        const index = parseInt(resultItem.dataset.index);
        const result = searchResults[index];
        if (result) {
            navigateToResult(result);
        }
    }
});
