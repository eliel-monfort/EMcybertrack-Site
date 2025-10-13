document.addEventListener('DOMContentLoaded', function() {
    const searchBox = document.getElementById('knowledge-search');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const navItems = document.querySelectorAll('.nav-item');
            
            navItems.forEach(function(item) {
                const text = item.textContent.toLowerCase();
                const parentLi = item.parentElement;
                
                if (searchTerm === '' || text.indexOf(searchTerm) !== -1) {
                    parentLi.style.display = 'block';
                } else {
                    parentLi.style.display = 'none';
                }
            });
        });
    }
});
