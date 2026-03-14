// 1. Load the gallery from Cloudinary
async function showCollection() {
    const gallerySection = document.getElementById('collection-list');
    if (!gallerySection) return;

    try {
        const response = await fetch('/gallery');
        const artifacts = await response.json();

        gallerySection.innerHTML = ''; 

        if (artifacts.length === 0) {
            gallerySection.innerHTML = '<p style="color: white;">The archive is empty. Scan an artifact to begin!</p>';
            return;
        }

        artifacts.forEach(item => {
            const card = `
                <div class="artifact-card" style="border: 1px solid #gold; margin: 10px; padding: 15px; border-radius: 10px; background: rgba(0,0,0,0.3);">
                    <img src="${item.imageUrl}" style="width:100%; border-radius: 5px;">
                    <h3 style="color: gold;">${item.title}</h3>
                    <p style="color: white;">${item.info}</p>
                </div>
            `;
            gallerySection.innerHTML += card;
        });
    } catch (error) {
        console.log("Gallery fetch error:", error);
    }
}

// 2. The Main Scan Function (Matches your HTML error)
async function analyzeArtifact() {
    const fileInput = document.getElementById('imageInput'); 
    const resultDiv = document.getElementById('result');     
    
    if (!fileInput || !fileInput.files[0]) {
        alert("Please select an image first!");
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    resultDiv.innerHTML = "<p style='color: gold;'>Scanning artifact... Connecting to Gemini 3.1...</p>";

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            resultDiv.innerHTML = "Error: " + data.error;
        } else {
            resultDiv.innerHTML = `
                <div style="border: 2px solid gold; padding: 15px; border-radius: 10px; background: rgba(0,0,0,0.5);">
                    <h2 style="color: gold;">Analysis Complete!</h2>
                    <h3>${data.title}</h3>
                    <p>${data.info}</p>
                </div>
            `;
            // Automatically update the gallery below
            showCollection();
        }
    } catch (error) {
        resultDiv.innerHTML = "Server connection error. Try again.";
    }
}

// 3. Helper for the file input error
function updateFileName() {
    const fileInput = document.getElementById('imageInput');
    console.log("File selected: " + fileInput.files[0].name);
}

// Run when the page opens
window.onload = showCollection;