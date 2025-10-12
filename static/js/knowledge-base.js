/* Knowledge Base Dynamic Sidebar Generator
   Builds sidebar navigation from content/experience/knowledge folder structure
   No manual updates needed - just add .md files to content/experience/knowledge/ */

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    buildKnowledgeTree();
    initializeSearch();
});

/* === SIDEBAR BUILDER === */
// Automatically builds navigation tree from Hugo's page structure
function buildKnowledgeTree() {
    const treeContainer = document.getElementById('knowledge-tree');
    if (!treeContainer) return;

    // Get current page URL for highlighting active item
    const currentPath = window.location.pathname;
    
    // Fetch site index to get all knowledge pages
    fetch('/index.json')
        .then(response => response.json())
        .then(data => {
            // Filter only knowledge pages from experience section
            const knowledgePages = data.filter(page => 
                page.section === 'experience' && 
                page.type === 'knowledge' &&
                page.permalink.includes('/knowledge/')
            );
            
            // Build hierarchical structure from pages
            const tree = buildHierarchy(knowledgePages);
            
            // Render the tree in sidebar
            renderTree(tree, treeContainer, currentPath);
        })
        .catch(error => {
            console.log('Could not load knowledge structure:', error);
            // Fallback: show message in sidebar
            treeContainer.innerHTML = '<li class="nav-item">Loading navigation...</li>';
        });
}

// Converts flat page list into hierarchical tree structure
function buildHierarchy(pages) {
    const tree = {};
    
    pages.forEach(page => {
        // Split URL path into segments, remove /experience/knowledge/ prefix
        const pathSegments = page.permalink
            .replace('/experience/knowledge/', '')
            .split('/')
            .filter(Boolean);
        
        let currentLevel = tree;
        
        // Build nested structure
        pathSegments.forEach((segment, index) => {
            if (!currentLevel[segment]) {
                currentLevel[segment] = {
                    title: formatTitle(segment),
                    pages: [],
                    children: {}
                };
            }
            
            // If this is the last segment (actual page), add page data
            if (index === pathSegments.length - 1 && page.title) {
                currentLevel[segment].pages.push(page);
            }
            
            currentLevel = currentLevel[segment].children;
        });
    });
    
    return tree;
}

// Formats folder/file names into readable titles
function formatTitle(segment) {
    return segment
        .replace(/-/g, ' ')        // Replace dashes with spaces
        .replace(/_/g, ' ')        // Replace underscores with spaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' ');
}

// Renders the hierarchical tree into HTML
function renderTree(tree, container, currentPath) {
    container.innerHTML = '';
    
    Object.keys(tree).sort().forEach(key => {
        const item = tree[key];
        const listItem = document.createElement('li');
        
        // Check if this item has sub-items
        const hasChildren = Object.keys(item.children).length > 0;
        
        if (hasChildren) {
            // Folder with sub-items
            const button = document.createElement('button');
            button.className = 'nav-item has-children';
            button.textContent = item.title;
            button.addEventListener('click', () => toggleExpand(button));
            listItem.appendChild(button);
            
            // Create sub-list for children
            const subList = document.createElement('ul');
            renderTree(item.children, subList, currentPath);
            listItem.appendChild(subList);
            
        } else if (item.pages.length > 0) {
            // Actual page link
            const page = item.pages[0];
            const link = document.createElement('a');
            link.className = 'nav-item';
            link.href = page.permalink;
            link.textContent = page.title || item.title;
            
            // Highlight current page
            if (currentPath === page.permalink) {
                link.classList.add('active');
            }
            
            listItem.appendChild(link);
        }
        
        container.appendChild(listItem);
    });
}

// Toggles expand/collapse for folders with sub-items
function toggleExpand(button) {
    const subList = button.nextElementSibling;
    const isExpanded = button.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse
        button.classList.remove('expanded');
        subList.classList.remove('expanded');
    } else {
        // Expand
        button.classList.add('expanded');
        subList.classList.add('expanded');
    }
}

/* === SEARCH FUNCTIONALITY === */
// Initializes search functionality
function initializeSearch() {
    const searchInput = document.getElementById('knowledge-search');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!searchInput || !suggestionsContainer) return;
    
    let searchData = [];
    let searchTimeout;
    
    // Load search data
    fetch('/index.json')
        .then(response => response.json())
        .then(data => {
            // Filter knowledge pages from experience section
            searchData = data.filter(page => 
                page.section === 'experience' && 
                page.type === 'knowledge' &&
                page.permalink.includes('/knowledge/')
            );
        })
        .catch(error => console.log('Search data not available:', error));
    
    // Search as user types
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value, searchData, suggestionsContainer);
        }, 200); // Delay to avoid too many searches
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            hideSuggestions(suggestionsContainer);
        }
    });
}

// Performs search and shows results
function performSearch(query, data, container) {
    if (!query || query.length < 2) {
        hideSuggestions(container);
        return;
    }
    
    // Search in title and content
    const results = data.filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.content.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Limit to 8 results
    
    if (results.length > 0) {
        showSuggestions(results, container, query);
    } else {
        hideSuggestions(container);
    }
}

// Shows search suggestions
function showSuggestions(results, container, query) {
    container.innerHTML = '';
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <div class="suggestion-title">${highlightText(result.title, query)}</div>
            <div class="suggestion-path">${result.permalink}</div>
        `;
        
        item.addEventListener('click', () => {
            window.location.href = result.permalink;
        });
        
        container.appendChild(item);
    });
    
    container.classList.add('active');
}

// Hides search suggestions
function hideSuggestions(container) {
    container.classList.remove('active');
    container.innerHTML = '';
}

// Highlights search terms in results
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}
