let currentArtifact = null;

function updateFileName() {
    const input = document.getElementById('artifactInput');
    const label = document.getElementById('file-chosen');
    label.innerText = input.files[0] ? input.files[0].name : "No file selected";
}

async function analyzeArtifact() {
    const fileInput = document.getElementById('artifactInput');
    if (!fileInput.files[0]) return alert("Please select a file first.");

    const btn = document.querySelector('.btn-primary');
    btn.innerText = "Scanning...";
    
    const formData = new FormData();
    formData.append('artifact', fileInput.files[0]);

    try {
        const res = await fetch('/analyze', { method: 'POST', body: formData });
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        currentArtifact = data;
        document.getElementById('resImg').src = data.imageUrl;
        document.getElementById('resTitle').innerText = data.title;
        document.getElementById('resInfo').innerText = data.info;
        
        document.getElementById('upload-page').classList.add('hidden');
        document.getElementById('result-page').classList.remove('hidden');
    } catch (err) { 
        alert("Error: " + err.message); 
    } finally {
        btn.innerText = "Analyze Artifact";
    }
}

function saveToCollection() {
    const col = JSON.parse(localStorage.getItem('artifacts')) || [];
    col.push(currentArtifact);
    localStorage.setItem('artifacts', JSON.stringify(col));
    goBack();
}

function showCollection() {
    document.getElementById('upload-page').classList.add('hidden');
    document.getElementById('collection-page').classList.remove('hidden');
    const grid = document.getElementById('collection-grid');
    const col = JSON.parse(localStorage.getItem('artifacts')) || [];
    grid.innerHTML = col.map((item, i) => `
        <div class="card" onclick="openDetail(${i})">
            <img src="${item.imageUrl}" style="width:100%; border-radius:8px;">
            <p style="font-size:0.8rem; margin-top:10px;">${item.title}</p>
        </div>
    `).join('');
}

function openDetail(i) {
    const item = JSON.parse(localStorage.getItem('artifacts'))[i];
    document.getElementById('detailTitle').innerText = item.title;
    document.getElementById('detailImage').src = item.imageUrl;
    document.getElementById('detailInfo').innerText = item.info;
    document.getElementById('detail-overlay').classList.remove('hidden');
}

function closeDetail() { document.getElementById('detail-overlay').classList.add('hidden'); }
function goBack() { location.reload(); }