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

// ... (rest of the code remains the same)

var page = 1
function search(arg) {
    const searchBox = document.getElementById("searchBox").value;
    const rattingOption = document.getElementById("rattingOption");
    const galerie = document.getElementById("galerie");
    const orderSelect = document.getElementById("orderSelect").value;
    const minimumScore = document.getElementById("minimumScoreInput").value;
    const loadingMessage = document.getElementById("loading-message");
    const welcomeMessage = document.getElementById("welcome-message");
    
    // Check if this is a post ID search
    const idMatch = searchBox.match(/^#(\d+)$/);
    if (idMatch) {
        // Hide welcome message and show loading message
        welcomeMessage.style.display = 'none';
        loadingMessage.classList.remove("hidden");
        
        // Make direct request to the post ID
        const postId = idMatch[1];
        fetch(`https://e621.net/posts/${postId}.json`)
            .then(response => response.json())
            .then(data => {
                galerie.innerHTML = loadingMessage.outerHTML + welcomeMessage.outerHTML;
                welcomeMessage.style.display = 'none';
                
                if (data.post) {
                    const post = data.post;
                    let rating = "";
                    switch(post.rating) {
                        case "s":
                            rating = "safe";
                            break;
                        case "q":
                            rating = "mature";
                            break;
                        case "e":
                            rating = "adult";
                            break;
                    }
                    
                    if (post.file.url != null) {
                        const imgDiv = document.createElement("div");
                        imgDiv.className = "image-container";
                        if (post.rating !== 's') {
                            imgDiv.classList.add('unsafe', 'blurred');
                        }
                        
                        const img = document.createElement("img");
                        img.src = String(post.preview.url);
                        img.loading = "lazy";
                        imgDiv.appendChild(img);
                        
                        let clickCount = 0;
                        let clickTimer = null;
                        
                        imgDiv.addEventListener('click', (e) => {
                            clickCount++;
                            
                            if (post.rating !== 's') {
                                if (clickCount === 1) {
                                    imgDiv.classList.remove('blurred');
                                    clickTimer = setTimeout(() => {
                                        clickCount = 0;
                                    }, 500);
                                } else if (clickCount === 2) {
                                    clearTimeout(clickTimer);
                                    clickCount = 0;
                                    showPicture(String(post.id));
                                }
                            } else {
                                showPicture(String(post.id));
                            }
                        });
                        
                        galerie.appendChild(imgDiv);
                    }
                    loadingMessage.classList.add("hidden");
                } else {
                    loadingMessage.classList.add("hidden");
                    welcomeMessage.style.display = 'block';
                    const noResults = document.createElement("div");
                    noResults.className = "no-results";
                    noResults.innerHTML = "<p>Post not found</p>";
                    galerie.appendChild(noResults);
                }
            })
            .catch(error => {
                console.error("Error loading post:", error);
                loadingMessage.classList.add("hidden");
                welcomeMessage.style.display = 'block';
                const errorMessage = document.createElement("div");
                errorMessage.className = "error-message";
                errorMessage.innerHTML = "<p>Error loading post. Please try again.</p>";
                galerie.appendChild(errorMessage);
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

// ... (rest of the code remains the same)

function showPicture(ID) {
    const modalContent = document.getElementById("modalContent")
    const loadItem = async () => {
        const result = await fetch(`https://e621.net/posts/${ID}.json`)
        const data = await result.json()
        console.log(data)
        
        // Helper function to get file extension
        const getFileExtension = (url) => {
            return url.split('.').pop().toLowerCase();
        }
        
        // Helper function to get filename from URL
        const getFilename = (url) => {
            const parts = url.split('/');
            return parts[parts.length - 1];
        }

        function setupModal() {
            const post = data.post;
            const isVideo = post.file.url.endsWith(".webm");
            const isUnsafe = post.rating !== 's';
            
            // Create container for media
            const mediaContainer = document.createElement('div');
            mediaContainer.className = `image-container${isUnsafe ? ' unsafe blurred' : ''}`;
            
            // Set up the media element (image or video)
            const mediaElement = isVideo ? 
                `<video controls src="${post.file.url}" id="modalImg"></video>` :
                `<img src="${post.file.url}" id="modalImg" alt="Post Image">`;
            
            // Set up the info section
            const infoHtml = `
                <div class="modal-info">
                    <p>
                        <span class="post-id">ID: ${ID}</span>
                        <span class="separator">|</span>
                        <span class="rating">Rating: ${post.rating}</span>
                    </p>
                    <div class="post-actions">
                        <button id="downloadPost" class="action-button">
                            <span class="action-icon">⬇️</span>
                            Download
                        </button>
                        <button id="viewOnE6" class="action-button">
                            <span class="action-icon">🔗</span>
                            View on e621
                        </button>
                    </div>
                </div>`;

            mediaContainer.innerHTML = mediaElement;
            modalContent.innerHTML = '';
            modalContent.appendChild(mediaContainer);
            modalContent.insertAdjacentHTML('beforeend', infoHtml);

            if (isUnsafe) {
                let clickCount = 0;
                let clickTimer = null;
                
                mediaContainer.addEventListener('click', (e) => {
                    clickCount++;
                    
                    if (clickCount === 1) {
                        mediaContainer.classList.remove('blurred');
                        clickTimer = setTimeout(() => {
                            clickCount = 0;
                        }, 500);
                    }
                });
            }

            // Set up download button
            const downloadBtn = document.getElementById("downloadPost");
            downloadBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch(post.file.url);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    // Create a filename with post ID and original extension
                    const extension = getFileExtension(post.file.url);
                    a.download = `e621_${ID}.${extension}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (error) {
                    console.error('Download failed:', error);
                    alert('Download failed. Please try again or view on e621.');
                }
            });

            // Set up view on e621 button
            const viewBtn = document.getElementById("viewOnE6");
            viewBtn.addEventListener('click', () => {
                window.open(`https://e621.net/posts/${ID}`, '_blank');
            });
        }

        setupModal();
        const modal = document.getElementById("modal");
        modal.classList.add("active");
    }
    loadItem()
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
});