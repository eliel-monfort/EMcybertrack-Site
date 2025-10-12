// Knowledge Base Navigation - Manual Structure (WORKING VERSION)
// Simple and reliable - update navigationStructure when adding content

document.addEventListener('DOMContentLoaded', function() {
    buildSimpleNavigation();
});

function buildSimpleNavigation() {
    const navContainer = document.getElementById('knowledge-tree');
    if (!navContainer) return;
    
    // Get current URL for highlighting active page
    const currentUrl = window.location.pathname;
    
    // NAVIGATION STRUCTURE - UPDATE THIS WHEN ADDING NEW CONTENT
    const navigationStructure = {
        "Network Security": {
            type: "folder",
            children: {
                "Fundamentals": {
                    type: "page",
                    url: "/experience/knowledge/network-security/fundamentals/"
                },
            }
        },
        "Penetration Testing": {
            type: "folder",
            children: {
                "Active Directory": {
                    type: "folder",
                    children: {
                        "Methodology": {
                            type: "page",
                            url: "/experience/knowledge/penetration-testing/active-directory/methodology/"
                        }
                    }
                },
                "Methodology": {
                    type: "page",
                    url: "/experience/knowledge/penetration-testing/methodology/"
                }
            }
        }
    };
    
    // Clear loading message
    navContainer.innerHTML = '';
    
    // Build navigation tree
    buildNavigationLevel(navigationStructure, navContainer, currentUrl);
}

// Recursively builds navigation levels
function buildNavigationLevel(structure, container, currentUrl) {
    Object.keys(structure).forEach(key => {
        const item = structure[key];
        const li = document.createElement('li');
        
        if (item.type === 'folder') {
            // Create folder button (expandable)
            const button = document.createElement('button');
            button.className = 'nav-item has-children';
            button.textContent = key;
            
            // Auto-expand if current page is inside this folder
            const shouldExpand = isCurrentPathActive(item.children, currentUrl);
            if (shouldExpand) {
                button.classList.add('expanded');
            }
            
            button.onclick = function() {
                toggleFolder(this);
            };
            
            li.appendChild(button);
            
            // Create children container
            const ul = document.createElement('ul');
            if (shouldExpand) {
                ul.classList.add('expanded');
            }
            
            // Recursively build children
            buildNavigationLevel(item.children, ul, currentUrl);
            li.appendChild(ul);
            
        } else if (item.type === 'page') {
            // Create page link (clickable)
            const a = document.createElement('a');
            a.className = 'nav-item';
            a.href = '#';
            a.textContent = key;
            
            // Highlight if this is the current page
            if (currentUrl === item.url) {
                a.classList.add('active');
            }
            
            a.onclick = function() {
                loadContent(item.url, this);
                return false;
            };
            
            li.appendChild(a);
        }
        
        container.appendChild(li);
    });
}

// Checks if current page is anywhere in the children tree
function isCurrentPathActive(children, currentUrl) {
    for (const key in children) {
        const child = children[key];
        if (child.type === 'page' && child.url === currentUrl) {
            return true;
        }
        if (child.type === 'folder' && child.children && isCurrentPathActive(child.children, currentUrl)) {
            return true;
        }
    }
    return false;
}

// Toggles folder open/close state
function toggleFolder(button) {
    const ul = button.nextElementSibling;
    const isExpanded = button.classList.contains('expanded');
    
    if (isExpanded) {
        button.classList.remove('expanded');
        ul.classList.remove('expanded');
    } else {
        button.classList.add('expanded');
        ul.classList.add('expanded');
    }
}

// Loads content via AJAX without page refresh
function loadContent(url, clickedLink) {
    // Show loading indicator
    const loader = document.getElementById('content-loader');
    const mainContent = document.getElementById('main-content');
    
    if (loader) loader.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
    
    // Update active navigation states
    document.querySelectorAll('.nav-item').forEach(link => {
        link.classList.remove('active');
    });
    clickedLink.classList.add('active');
    
    // Fetch new content
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('.knowledge-article');
            
            if (newContent && mainContent) {
                // Replace content
                mainContent.innerHTML = newContent.innerHTML;
                
                // Update page title
                const newTitle = doc.querySelector('h1');
                if (newTitle) {
                    document.title = newTitle.textContent + ' - EM cybertrack';
                }
                
                // Update URL without page refresh
                history.pushState({}, '', url);
            }
            
            // Hide loading, show content
            if (loader) loader.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading content:', error);
            
            // Hide loading on error
            if (loader) loader.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
        });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function() {
    location.reload();
});
