async function loadGallery() {
    const gallerySection = document.getElementById('collection-list');
    
    try {
        const response = await fetch('/gallery');
        const artifacts = await response.json();

        if (artifacts.length === 0) {
            gallerySection.innerHTML = '<p>The archive is currently empty.</p>';
            return;
        }

        gallerySection.innerHTML = ''; 
 
        artifacts.forEach(item => {
            const card = `
                <div class="artifact-card">
                    <img src="${item.imageUrl}" alt="${item.title}" style="width:100%; border-radius: 8px;">
                    <div class="artifact-info">
                        <h3>${item.title}</h3>
                        <p>${item.info}</p>
                    </div>
                </div>
            `;
            gallerySection.innerHTML += card;
        });
    } catch (error) {
        console.error("Error loading gallery:", error);
        gallerySection.innerHTML = '<p>Failed to load the archive. Check your connection.</p>';
    }
}

async function analyzeImage() {
    const fileInput = document.getElementById('imageInput');
    const resultDiv = document.getElementById('result');
    
    if (!fileInput.files[0]) {
        alert("Please select an image first!");
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    resultDiv.innerHTML = "Scanning artifact...";

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            resultDiv.innerHTML = `Error: ${data.error}`;
        } else {
            resultDiv.innerHTML = `
                <h2>Found: ${data.title}</h2>
                <p>${data.info}</p>
                <img src="${data.imageUrl}" width="200">
            `;
            
            loadGallery();
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        resultDiv.innerHTML = "Analysis failed. The AI might be busy.";
    }
}

window.onload = loadGallery;