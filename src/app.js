// https://e621.net/posts?limit=1&tags=order:random+fox+gay+score:%3E100

// Store the verified state
let isAgeVerified = false;
let pendingRatingChange = null;

function ejs_code_clavier(keyStroke){
    ejs_code_eventChooser = (!document.all) ? keyStroke.which : event.keyCode;
    if (event.keyCode == 13){
        console.log("entré")
        search()
    }
}document.onkeypress = ejs_code_clavier;

// Tag lists for automatic rating detection
const explicitTags = [
    'penis', 'pussy', 'genitalia', 'sex', 'penetration', 'cum', 'nude', 'naked', 
    'nipples', 'balls', 'dick', 'cock', 'vagina', 'nsfw', 'explicit', 'adult',
    'intercourse', 'mating', 'genitals', 'masturbation', 'orgasm', 'breeding'
];

const questionableTags = [
    'bondage', 'fetish', 'inflation', 'transformation', 'vore', 'macro', 'micro',
    'paw_fetish', 'foot_fetish', 'tickling', 'belly', 'chubby', 'fat', 'weight_gain',
    'muscle', 'muscular', 'hyper', 'latex', 'leather', 'lingerie', 'maid', 'bikini',
    'underwear', 'panties', 'bra', 'dominance', 'submission', 'leash', 'collar'
];

function detectRatingFromTags(searchTerms) {
    // Convert to lowercase and split into individual terms
    const terms = searchTerms.toLowerCase().split(/[\s,]+/);
    
    // Check for explicit tags first
    for (const term of terms) {
        if (explicitTags.some(tag => term.includes(tag))) {
            return 'e';
        }
    }
    
    // Then check for questionable tags
    for (const term of terms) {
        if (questionableTags.some(tag => term.includes(tag))) {
            return 'q';
        }
    }
    
    // If no matching tags found, return null to keep current rating
    return null;
}

// Profile functionality
let currentProfilePage = 1;
let currentUsername = '';

function loadProfile(username) {
    currentUsername = username;
    currentProfilePage = 1;
    
    // Fetch user data
    fetch(`https://e621.net/users.json?search[name_matches]=${username}`, {
        headers: {
            'User-Agent': 'Vineyard/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.length > 0) {
            const user = data[0];
            
            // Update profile information
            document.getElementById('profile-username').textContent = user.name;
            document.getElementById('post-count').textContent = user.post_upload_count || '0';
            document.getElementById('profile-level').textContent = `Level ${user.level}`;
            
            // Format join date
            const joinDate = new Date(user.created_at);
            document.getElementById('join-date').textContent = `Joined ${joinDate.toLocaleDateString()}`;
            
            // Set avatar
            const avatarImg = document.getElementById('profile-avatar-img');
            if (user.avatar_id) {
                avatarImg.src = `https://static1.e621.net/data/avatars/${user.avatar_id}`;
            } else {
                avatarImg.src = 'path/to/default/avatar.png'; // Add a default avatar image
            }
            
            // Set about text if available
            const aboutElement = document.getElementById('profile-about');
            if (user.description) {
                aboutElement.textContent = user.description;
            } else {
                aboutElement.textContent = 'No description available';
            }
            
            // Load their works
            loadProfileWorks(0);
        } else {
            document.getElementById('profile-username').textContent = 'User not found';
        }
    })
    .catch(error => {
        console.error('Error loading profile:', error);
        document.getElementById('profile-username').textContent = 'Error loading profile';
    });
}

function loadProfileWorks(direction) {
    if (!currentUsername) return;
    
    const galerie = document.getElementById("galerie");
    const pageNumber = document.getElementById("pageNumber");
    const loadingMessage = document.getElementById("loading-message");
    
    // Update page number
    if (direction) {
        currentProfilePage += direction;
        if (currentProfilePage < 1) currentProfilePage = 1;
    }
    pageNumber.textContent = currentProfilePage;
    
    // Show loading message
    if (loadingMessage) {
        loadingMessage.style.display = 'block';
    }
    
    // Clear current gallery
    galerie.innerHTML = '';
    
    // Fetch user's works
    let query = `https://e621.net/posts.json?tags=user:${currentUsername}+order:date&page=${currentProfilePage}`;
    fetch(query, {
        headers: {
            'User-Agent': 'Vineyard/1.0'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach(post => {
                showPicture(post);
            });
        } else {
            if (direction > 0) {
                currentProfilePage--;
                pageNumber.textContent = currentProfilePage;
            }
            galerie.innerHTML = '<p class="no-results">No more works found</p>';
        }
    })
    .catch(error => {
        console.error('Error loading works:', error);
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        galerie.innerHTML = '<p class="error">Error loading works</p>';
    });
}

var page = 1
function search(arg) {
    const searchBox = document.getElementById("searchBox").value;
    const rattingOption = document.getElementById("rattingOption");
    const galerie = document.getElementById("galerie");
    const orderSelect = document.getElementById("orderSelect").value;
    const minimumScore = document.getElementById("minimumScoreInput").value;
    const loadingMessage = document.getElementById("loading-message");
    const welcomeMessage = document.getElementById("welcome-message");
    
    // Check if searching for a specific work ID
    const workIdMatch = searchBox.match(/^#(\d+)$/);
    if (workIdMatch) {
        const workId = workIdMatch[1];
        let query = `https://e621.net/posts/${workId}.json`;
        fetch(query, {
            headers: {
                'User-Agent': 'Vineyard/1.0'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.post) {
                galerie.innerHTML = '';
                showPicture(data.post);
                welcomeMessage.style.display = 'none';
            } else {
                galerie.innerHTML = '<p class="error">Work not found</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            galerie.innerHTML = '<p class="error">Error loading work</p>';
        });
        return;
    }

    // Detect rating from search terms one final time before search
    const detectedRating = detectRatingFromTags(searchBox);
    if (detectedRating) {
        const ratingHierarchy = { 's': 0, 'q': 1, 'e': 2 };
        const currentRating = rattingOption.value;
        
        if (ratingHierarchy[detectedRating] > ratingHierarchy[currentRating]) {
            if (!isAgeVerified) {
                // Show verification modal first
                showAgeVerification(detectedRating, () => {
                    rattingOption.value = detectedRating;
                    performSearch();
                });
                return;
            } else {
                rattingOption.value = detectedRating;
            }
        }
    }
    
    performSearch();

    function performSearch() {
        let query = `https://e621.net/posts.json?tags=${searchBox}`
        if (rattingOption.value != 0){query += `+rating%3A${rattingOption.value}`}
        if (orderSelect == 1){query += `+order%3Arandom`}
        if (minimumScore != ""){query += `+score:%3E${minimumScore}`}
        if (arg){
            if (arg == 1){
                page += 1
            }else if (arg == -1){
                if(page > 1){
                    page -= 1
                }else{
                    return
                }
            }
            query += `&page=${page}`
        }else{
            page = 1
        }
        
        // Hide welcome message and show loading message
        welcomeMessage.style.display = 'none';
        loadingMessage.classList.remove("hidden")
        document.getElementById("pageNumber").textContent = page

        console.log(query)
        const loadItem = async () => {
            try {
                const result = await fetch(query)
                const data = await result.json()
                console.log(data)
                galerie.innerHTML = loadingMessage.outerHTML + welcomeMessage.outerHTML // Keep both messages
                welcomeMessage.style.display = 'none' // Keep welcome hidden during search
                
                let loadedImages = 0
                const totalImages = data.posts.length
                
                for (let i = 0; i < data.posts.length; i++) {
                    let rating = ""
                    switch(data.posts[i].rating){
                        case "s":
                            rating = "safe"
                            break
                        case "q":
                            rating = "mature"
                            break
                        case "e":
                            rating = "adult"
                            break
                    }
                    
                    if (data.posts[i].file.url != null) {
                        const imgDiv = document.createElement("div")
                        imgDiv.className = "image-container"
                        if (data.posts[i].rating !== 's') {
                            imgDiv.classList.add('unsafe', 'blurred')
                        }
                        
                        const img = document.createElement("img")
                        img.src = String(data.posts[i].preview.url)
                        img.loading = "lazy"
                        imgDiv.appendChild(img)
                        
                        let clickCount = 0
                        let clickTimer = null
                        
                        imgDiv.addEventListener('click', (e) => {
                            clickCount++
                            
                            if (data.posts[i].rating !== 's') {
                                if (clickCount === 1) {
                                    // First click removes blur
                                    imgDiv.classList.remove('blurred')
                                    
                                    // Reset click count after 500ms if no second click
                                    clickTimer = setTimeout(() => {
                                        clickCount = 0
                                    }, 500)
                                    
                                } else if (clickCount === 2) {
                                    // Second click shows the post
                                    clearTimeout(clickTimer)
                                    clickCount = 0
                                    showPicture(String(data.posts[i].id))
                                }
                            } else {
                                // Safe posts don't need unblurring
                                showPicture(String(data.posts[i].id))
                            }
                        })
                        
                        galerie.appendChild(imgDiv)
                    }
                }
                
                // If no images were found, hide loading message
                if (totalImages === 0) {
                    loadingMessage.classList.add("hidden")
                    welcomeMessage.style.display = 'block'; // Show welcome message if no images found
                    const noResults = document.createElement("div")
                    noResults.className = "no-results"
                    noResults.innerHTML = "<p>No images found</p>"
                    galerie.appendChild(noResults)
                }
            } catch (error) {
                console.error("Error loading images:", error)
                loadingMessage.classList.add("hidden")
                welcomeMessage.style.display = 'block'; // Show welcome message on error
                const errorMessage = document.createElement("div")
                errorMessage.className = "error-message"
                errorMessage.innerHTML = "<p>Error loading images. Please try again.</p>"
                galerie.appendChild(errorMessage)
            }
        }
        loadItem()
    }
}

// Helper function to convert rating codes to friendly names
function getFriendlyRating(rating) {
    const ratingMap = {
        's': 'Safe',
        'q': 'Questionable',
        'e': 'Explicit'
    };
    return ratingMap[rating.toLowerCase()] || 'Unknown';
}

function showPicture(ID) {
    const modalContent = document.getElementById("modalContent");
    const loadItem = async () => {
        const post = await getPost(ID);
        if (!post) return;

        const modal = document.getElementById("modal");
        const modalImg = document.getElementById("modalImg");
        const modalBackground = document.getElementById("modalBackground");
        let isZoomed = false;

        // Set up the modal image
        modalImg.src = post.file.url;
        modalImg.alt = post.description || 'Post Image';
        
        // Update modal info with friendly rating
        document.getElementById("postId").textContent = post.id;
        document.getElementById("postRating").textContent = getFriendlyRating(post.rating);
        
        // Show the modal
        modal.style.display = "block";
        
        const setupModal = () => {
            // Handle zoom click
            modalImg.addEventListener('click', () => {
                isZoomed = !isZoomed;
                modalImg.classList.toggle('zoomed', isZoomed);
                
                if (isZoomed) {
                    modalContent.style.overflow = 'auto';
                    modalContent.style.cursor = 'move';
                } else {
                    modalContent.style.overflow = 'auto';
                    modalContent.style.cursor = 'default';
                }
            });

            // Handle modal close
            modalBackground.addEventListener('click', CloseModal);
            
            // Set up download button
            const downloadBtn = document.getElementById('downloadPost');
            downloadBtn.addEventListener('click', () => {
                window.open(post.file.url, '_blank');
            });
            
            // Set up view on e621 button
            const viewBtn = document.getElementById('viewOnE6');
            viewBtn.addEventListener('click', () => {
                window.open(`https://e621.net/posts/${ID}`, '_blank');
            });
            
            // Add profile link in the modal info
            const modalInfo = document.querySelector('.modal-info');
            if (modalInfo && post.uploader_name) {
                const uploaderInfo = document.createElement('p');
                uploaderInfo.innerHTML = `Uploaded by: <a href="profile.html?user=${post.uploader_name}" onclick="loadProfile('${post.uploader_name}'); return false;">${post.uploader_name}</a>`;
                modalInfo.appendChild(uploaderInfo);
            }

            // Handle mouse wheel for zooming
            modalContent.addEventListener('wheel', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    const currentScale = modalImg.style.transform ? 
                        parseFloat(modalImg.style.transform.replace('scale(', '').replace(')', '')) : 
                        1;
                    
                    const newScale = Math.max(0.5, Math.min(3, currentScale + delta));
                    modalImg.style.transform = `scale(${newScale})`;
                    
                    if (newScale > 1) {
                        modalContent.style.overflow = 'auto';
                        modalContent.style.cursor = 'move';
                        isZoomed = true;
                        modalImg.classList.add('zoomed');
                    } else {
                        modalContent.style.overflow = 'auto';
                        modalContent.style.cursor = 'default';
                        isZoomed = false;
                        modalImg.classList.remove('zoomed');
                    }
                }
            });

            // Add keyboard shortcuts for zooming
            document.addEventListener('keydown', (e) => {
                if (modal.style.display === 'block') {
                    if (e.key === 'Escape') {
                        CloseModal();
                    } else if (e.ctrlKey && e.key === '0') {
                        // Reset zoom
                        modalImg.style.transform = 'scale(1)';
                        modalImg.classList.remove('zoomed');
                        isZoomed = false;
                        modalContent.style.overflow = 'auto';
                        modalContent.style.cursor = 'default';
                    }
                }
            });
        }

        setupModal();
    }
    loadItem();
}

function CloseModal() {
    const modal = document.getElementById("modal")
    modal.classList.remove("active")
}

document.addEventListener('DOMContentLoaded', function() {
    const verificationModal = document.getElementById('age-verification-modal');
    const verifyCheckbox = document.getElementById('age-verify-checkbox');
    const verifyConfirm = document.getElementById('verify-confirm');
    const verifyCancel = document.getElementById('verify-cancel');
    const ratingSelect = document.getElementById('rattingOption');
    const messageElement = document.getElementById('verification-message');
    const searchBox = document.getElementById('searchBox');
    let lastDetectedRating = null;
    let isProcessingRating = false;

    // Store the current tooltip
    let currentTooltip = ratingSelect.options[ratingSelect.selectedIndex].title;
    ratingSelect.title = currentTooltip;

    // Update tooltip when selection changes
    ratingSelect.addEventListener('change', function() {
        currentTooltip = this.options[this.selectedIndex].title;
        this.title = currentTooltip;
        
        // Add some fun emoji reactions to the rating change
        if (this.value === 'e' && isAgeVerified) {
            this.style.borderColor = '#ff69b4';
            setTimeout(() => {
                this.style.borderColor = '';
            }, 1000);
        }
    });

    // Enable/disable confirm button based on checkbox
    verifyCheckbox.addEventListener('change', function() {
        verifyConfirm.disabled = !this.checked;
    });

    // Handle confirmation
    verifyConfirm.addEventListener('click', function() {
        isAgeVerified = true;
        verificationModal.classList.remove('active');
        if (pendingRatingChange) {
            ratingSelect.value = pendingRatingChange;
            pendingRatingChange = null;
        }
    });

    // Handle cancellation
    verifyCancel.addEventListener('click', function() {
        verificationModal.classList.remove('active');
        verifyCheckbox.checked = false;
        verifyConfirm.disabled = true;
        ratingSelect.value = 's'; // Reset to safe
        pendingRatingChange = null;
    });

    // Monitor rating changes
    ratingSelect.addEventListener('change', function(e) {
        if (this.value !== 's' && !isAgeVerified) {
            e.preventDefault();
            pendingRatingChange = this.value;
            this.value = 's';
            showAgeVerification(this.value, () => {
                ratingSelect.value = pendingRatingChange;
                pendingRatingChange = null;
            });
        }
    });

    // Add input event listener for real-time tag detection
    searchBox.addEventListener('input', async function(e) {
        const searchTerms = e.target.value;
        const detectedRating = detectRatingFromTags(searchTerms);
        
        if (detectedRating && detectedRating !== lastDetectedRating) {
            const ratingHierarchy = { 's': 0, 'q': 1, 'e': 2 };
            const currentRating = ratingSelect.value;
            
            // Only upgrade rating, never downgrade
            if (ratingHierarchy[detectedRating] > ratingHierarchy[currentRating]) {
                lastDetectedRating = detectedRating;
                
                if (isProcessingRating) return; // Prevent multiple popups
                isProcessingRating = true;

                if (!isAgeVerified) {
                    showAgeVerification(detectedRating, () => {
                        ratingSelect.value = detectedRating;
                        isProcessingRating = false;
                    });
                } else {
                    ratingSelect.value = detectedRating;
                    isProcessingRating = false;
                }
            }
        } else if (!searchTerms.trim()) {
            // Reset when search box is empty
            lastDetectedRating = null;
        }
    });

    // Add keyup event for immediate tag detection on paste
    searchBox.addEventListener('paste', function(e) {
        // Short timeout to allow paste to complete
        setTimeout(() => {
            const event = new Event('input');
            searchBox.dispatchEvent(event);
        }, 0);
    });

    function showAgeVerification(rating, callback) {
        const verificationModal = document.getElementById('age-verification-modal');
        const verifyCheckbox = document.getElementById('age-verify-checkbox');
        const verifyConfirm = document.getElementById('verify-confirm');
        const messageElement = document.getElementById('verification-message');
        
        // Set appropriate message based on rating
        let message;
        let emoji;
        switch(rating) {
            case 'e':
                message = "*Smirks knowingly* OwO What's this? You're about to enter the VERY spicy section~ ( ͡° ᴥ ͡°)<br><br>" +
                         "*Adjusts collar* This content is <strong>DEFINITELY</strong> not safe for work and <strong>STRICTLY</strong> for adults only!";
                emoji = "🌶️";
                break;
            case 'q':
                message = "*Blushes and fidgets with paws* This content might be a bit... spicy... >///<br><br>" +
                         "Not quite safe for work, so make sure you're old enough!";
                emoji = "😳";
                break;
            default: // 'all' or other
                message = "*Perks ears* Just a heads up, you might see some questionable or explicit content here!<br><br>" +
                         "Please verify you're old enough before proceeding~";
                emoji = "👀";
        }

        // Update modal content
        messageElement.innerHTML = `<span class="modal-emoji">${emoji}</span>${message}`;
        
        // Reset modal state
        verifyCheckbox.checked = false;
        verifyConfirm.disabled = true;

        // Show modal with animation
        requestAnimationFrame(() => {
            verificationModal.classList.add('active');
            // Focus trap
            verifyCheckbox.focus();
        });

        // Store callback
        currentVerificationCallback = callback;

        // Add escape key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeVerificationModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    function closeVerificationModal() {
        const verificationModal = document.getElementById('age-verification-modal');
        verificationModal.classList.remove('active');
        // Reset the rating select if needed
        if (pendingRatingChange) {
            ratingSelect.value = 's';
            pendingRatingChange = null;
        }
    }

    // Update event listeners
    verifyCancel.addEventListener('click', () => {
        closeVerificationModal();
    });

    verifyConfirm.addEventListener('click', () => {
        if (currentVerificationCallback) {
            currentVerificationCallback();
            currentVerificationCallback = null;
        }
        closeVerificationModal();
        isAgeVerified = true;
    });
    
    // Check if we're on the profile page and load profile if needed
    const urlParams = new URLSearchParams(window.location.search);
    const profileUser = urlParams.get('user');
    if (profileUser && window.location.pathname.endsWith('profile.html')) {
        loadProfile(profileUser);
    }
});

function getPost(ID) {
    return fetch(`https://e621.net/posts/${ID}.json`)
        .then(response => response.json())
        .then(data => data.post);
}