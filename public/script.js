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
    btn.innerText = "SCANNING...";
    btn.disabled = true;
    
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
        alert(err.message); 
    } finally {
        btn.innerText = "ANALYZE ARTIFACT";
        btn.disabled = false;
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
    
    grid.innerHTML = "";
    const oldFooter = document.querySelector('.nav-footer');
    if (oldFooter) oldFooter.remove();

    if (col.length === 0) {
        grid.innerHTML = `<p style="color:#555; width:100%; margin-top: 20px;">Your collection is empty.</p>`;
    } else {
        grid.innerHTML = col.map((item, i) => `
            <div class="card" onclick="openDetail(${i})">
                <img src="${item.imageUrl}" style="width:100%; border-radius:10px;">
                <p style="font-size:15px; margin-top:12px; font-weight:600;">${item.title}</p>
            </div>
        `).join('');
    }

    const footer = document.createElement('div');
    footer.className = 'nav-footer';
    footer.innerHTML = `<button class="btn-secondary" onclick="goBack()">principal page</button>`;
    document.getElementById('collection-page').appendChild(footer);
}

function openDetail(i) {
    const artifacts = JSON.parse(localStorage.getItem('artifacts'));
    const item = artifacts[i];
    
    document.getElementById('detailTitle').innerText = item.title;
    document.getElementById('detailImage').src = item.imageUrl;
    document.getElementById('detailInfo').innerText = item.info;
    
    const container = document.getElementById('detail-text-container');
    const existingActions = container.querySelector('.detail-actions');
    if (existingActions) existingActions.remove();

    const actionDiv = document.createElement('div');
    actionDiv.className = 'detail-actions';
    actionDiv.style.marginTop = "30px";
    actionDiv.style.display = "flex";
    actionDiv.style.gap = "15px";

    actionDiv.innerHTML = `
        <button class="btn-secondary" onclick="closeDetail()">CLOSE</button>
        <button class="btn-discard" onclick="removeArtifact(${i})">REMOVE</button>
    `;
    
    container.appendChild(actionDiv);
    document.getElementById('detail-overlay').classList.remove('hidden');
}

function removeArtifact(i) {
    if (confirm("Are you sure you want to remove this artifact?")) {
        const artifacts = JSON.parse(localStorage.getItem('artifacts'));
        artifacts.splice(i, 1);
        localStorage.setItem('artifacts', JSON.stringify(artifacts));
        closeDetail();
        showCollection();
    }
}

function closeDetail() { 
    document.getElementById('detail-overlay').classList.add('hidden'); 
}

function goBack() { 
    window.location.href = "/";
}