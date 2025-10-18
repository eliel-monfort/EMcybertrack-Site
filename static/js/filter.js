document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const posts = document.querySelectorAll('.post-entry, .first-entry');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filterValue = this.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Filter posts
      posts.forEach(post => {
        const postTags = post.getAttribute('data-tags');
        
        if (filterValue === 'all') {
          post.classList.remove('hidden');
        } else {
          if (postTags && postTags.split(',').includes(filterValue)) {
            post.classList.remove('hidden');
          } else {
            post.classList.add('hidden');
          }
        }
      });
    });
  });
});
