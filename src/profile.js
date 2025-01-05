let currentArtist = '';
let currentPage = 1;
let currentTab = 'posts';

document.addEventListener('DOMContentLoaded', function() {
    // Get artist name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const artistName = urlParams.get('artist');
    
    if (artistName) {
        currentArtist = artistName;
        loadArtistProfile(artistName);
    } else {
        document.getElementById('profile-header').innerHTML = '<h1>No artist specified</h1>';
    }
});

function loadArtistProfile(artistName) {
    document.getElementById('artist-name').textContent = artistName;
    loadPosts();
}

function showTab(tab) {
    currentTab = tab;
    currentPage = 1;
    
    // Update UI
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
    
    // Clear current gallery
    document.getElementById('profile-gallery').innerHTML = '';
    
    // Load new content
    loadPosts();
}

function loadPosts() {
    const gallery = document.getElementById('profile-gallery');
    const pageNumber = document.getElementById('pageNumber');
    
    // Update page number display
    pageNumber.textContent = currentPage;
    
    // Construct query based on current tab
    let query = `https://e621.net/posts.json?page=${currentPage}&tags=`;
    if (currentTab === 'posts') {
        query += `user:${currentArtist}`;
    } else if (currentTab === 'favorites') {
        query += `fav:${currentArtist}`;
    }
    
    // Add rating filter if set
    const rattingOption = document.getElementById("rattingOption");
    if (rattingOption && rattingOption.value !== '0') {
        query += `+rating:${rattingOption.value}`;
    }

    fetch(query, {
        headers: {
            'User-Agent': 'Vineyard/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.posts && data.posts.length > 0) {
            // Clear gallery
            gallery.innerHTML = '';
            
            // Display posts
            data.posts.forEach(post => {
                showPicture(post, gallery);
            });
            
            // Update post count (only on first load)
            if (currentPage === 1 && currentTab === 'posts') {
                document.getElementById('post-count').textContent = `Posts: ${data.posts.length}`;
            }
        } else {
            gallery.innerHTML = '<p class="no-results">No posts found</p>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        gallery.innerHTML = '<p class="error">Error loading posts</p>';
    });
}

function loadMore(direction) {
    if ((direction === -1 && currentPage > 1) || direction === 1) {
        currentPage += direction;
        loadPosts();
        window.scrollTo(0, 0);
    }
}
