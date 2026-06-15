import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDDiPUUbX7PswseiOliElrYujBqYquu9A",
    authDomain: "zakaz-5f32b.firebaseapp.com",
    projectId: "zakaz-5f32b",
    storageBucket: "zakaz-5f32b.firebasestorage.app",
    messagingSenderId: "983658317062",
    appId: "1:983658317062:web:01c189ad4cf102df250a87",
    measurementId: "G-Q30GWSN7BM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const IMGBB_API_KEY = "4051df84ed1e0dbe5f13f79db310ca45";

// HTML Elementləri
const productNameInput = document.getElementById('productName');
const productCountInput = document.getElementById('productCount');
const companySelect = document.getElementById('companySelect');
const productImageInput = document.getElementById('productImage');
const cameraImageInput = document.getElementById('cameraImage');
const fileNameSpan = document.getElementById('file-name');
const fileStatusBox = document.getElementById('fileStatusBox');
const clearImageBtn = document.getElementById('clearImageBtn');
const saveBtn = document.getElementById('saveBtn');
const orderListContainer = document.getElementById('orderList');
const searchInput = document.getElementById('searchInput'); // 🔍 Yeni axtarış elementi

const navCreate = document.getElementById('nav-create');
const navList = document.getElementById('nav-list');
const pageCreate = document.getElementById('page-create');
const pageList = document.getElementById('page-list');

// MODAL ELEMENTLƏRİ
const detailsModal = document.getElementById('detailsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalImageContainer = document.getElementById('modalImageContainer');
const modalViewMode = document.getElementById('modalViewMode');
const modalEditMode = document.getElementById('modalEditMode');
const viewModeButtons = document.getElementById('viewModeButtons');
const editModeButtons = document.getElementById('editModeButtons');
const modalProductName = document.getElementById('modalProductName');
const modalCompanyBadge = document.getElementById('modalCompanyBadge');
const modalProductCount = document.getElementById('modalProductCount');
const editProductName = document.getElementById('editProductName');
const editProductCount = document.getElementById('editProductCount');
const editCompanySelect = document.getElementById('editCompanySelect');
const modalEditBtn = document.getElementById('modalEditBtn');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
const modalCancelEditBtn = document.getElementById('modalCancelEditBtn');
const modalSaveEditBtn = document.getElementById('modalSaveEditBtn');

// TOPLU SEÇİM ELEMENTLƏRİ
const bulkSelectPanel = document.getElementById('bulkSelectPanel');
const bulkSelectCount = document.getElementById('bulkSelectCount');
const bulkCancelBtn = document.getElementById('bulkCancelBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const bulkMarkPassiveBtn = document.getElementById('bulkMarkPassiveBtn');

let selectedFile = null;
let currentFilter = "all";
let searchQuery = ""; // 🔍 Axtarış mətni üçün dəyişən
let allOrders = [];
let activeOrderId = null; 

let isBulkSelectMode = false;
let selectedOrderIds = new Set();

// Səhifə Keçidləri
navCreate.addEventListener('click', () => {
    navCreate.classList.add('active'); navList.classList.remove('active');
    pageCreate.classList.add('active'); pageList.classList.remove('active');
    exitBulkSelectMode();
});
navList.addEventListener('click', () => {
    navList.classList.add('active'); navCreate.classList.remove('active');
    pageList.classList.add('active'); pageCreate.classList.remove('active');
});

function handleFileSelection(file) { if (file) { selectedFile = file; fileNameSpan.textContent = "📸 Şəkil Yükləndi"; fileStatusBox.style.display = 'flex'; } }
productImageInput.addEventListener('change', (e) => { handleFileSelection(e.target.files[0]); cameraImageInput.value = ""; });
cameraImageInput.addEventListener('change', (e) => { handleFileSelection(e.target.files[0]); productImageInput.value = ""; });
clearImageBtn.addEventListener('click', () => { productImageInput.value = ""; cameraImageInput.value = ""; selectedFile = null; fileStatusBox.style.display = 'none'; });

// SİFARİŞİ GÖNDƏRMƏK
saveBtn.addEventListener('click', async () => {
    const name = productNameInput.value.trim(); const count = productCountInput.value.trim(); const company = companySelect.value;
    if (!name) { alert("Zəhmət olmasa məhsul adını daxil edin!"); return; }
    saveBtn.disabled = true; saveBtn.textContent = "Göndərilir..."; let imageUrl = "";
    if (selectedFile) {
        const formData = new FormData(); formData.append("image", selectedFile);
        try { const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData }); const result = await response.json(); if (result.success) imageUrl = result.data.url; } catch (error) { console.error("Yükləmə xətası:", error); }
    }
    try {
        await addDoc(collection(db, "orders"), { name: name, count: count ? parseInt(count) : null, company: company, image: imageUrl, status: "active", timestamp: new Date().getTime() });
        productNameInput.value = ""; productCountInput.value = ""; companySelect.value = ""; productImageInput.value = ""; cameraImageInput.value = ""; selectedFile = null; fileStatusBox.style.display = 'none';
        alert("Sifariş uğurla yazıldı!");
    } catch (error) { alert("Xəta: " + error.message); } finally { saveBtn.disabled = false; saveBtn.textContent = "Sifarişi Göndər"; }
});

// MODAL FUNKSİYALARI
function openModal(order) {
    activeOrderId = order.id; switchToViewMode();
    modalProductName.textContent = order.name;
    if (order.count !== null && order.count !== undefined) { modalProductCount.textContent = order.count + " ədəd"; modalProductCount.style.color = "#fff"; } else { modalProductCount.textContent = "Tələb olunmayıb"; modalProductCount.style.color = "#888"; }
    if(order.status === "passive") { modalProductName.innerHTML = `${order.name} <span class="alindi-badge">✓ Alındı</span>`; }
    if (order.company) { modalCompanyBadge.textContent = order.company; modalCompanyBadge.style.display = "inline-block"; modalCompanyBadge.className = "company-badge"; } else { modalCompanyBadge.textContent = "Seçilməyib"; modalCompanyBadge.style.backgroundColor = "#555"; }
    if (order.image) { modalImageContainer.innerHTML = `<img src="${order.image}" alt="Böyük Şəkil">`; } else { modalImageContainer.innerHTML = `<div style="width:100%; height:120px; background:#121212; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:3rem;">📦</div>`; }
    editProductName.value = order.name; editProductCount.value = (order.count !== null && order.count !== undefined) ? order.count : ""; editCompanySelect.value = order.company || "";
    detailsModal.classList.add('open');
}
function switchToEditMode() { modalTitle.textContent = "✏️ Sifarişi Redaktə Et"; modalViewMode.style.display = "none"; modalEditMode.style.display = "flex"; viewModeButtons.style.display = "none"; editModeButtons.style.display = "flex"; }
function switchToViewMode() { modalTitle.textContent = "ℹ️ Sifariş Detalları"; modalViewMode.style.display = "flex"; modalEditMode.style.display = "none"; viewModeButtons.style.display = "flex"; editModeButtons.style.display = "none"; }
function closeModal() { detailsModal.classList.remove('open'); activeOrderId = null; }

modalEditBtn.addEventListener('click', switchToEditMode);
modalCancelEditBtn.addEventListener('click', switchToViewMode);
closeModalBtn.addEventListener('click', closeModal);
detailsModal.addEventListener('click', (e) => { if(e.target === detailsModal) closeModal(); });

modalSaveEditBtn.addEventListener('click', async () => {
    const updatedName = editProductName.value.trim(); const updatedCount = editProductCount.value.trim(); const updatedCompany = editCompanySelect.value;
    if (!updatedName) { alert("Məhsul adı boş buraxıla bilməz!"); return; }
    modalSaveEditBtn.disabled = true; modalSaveEditBtn.textContent = "Yenilənir...";
    try { await updateDoc(doc(db, "orders", activeOrderId), { name: updatedName, count: updatedCount ? parseInt(updatedCount) : null, company: updatedCompany }); closeModal(); } catch (error) { alert("Xəta: " + error.message); } finally { modalSaveEditBtn.disabled = false; modalSaveEditBtn.textContent = "💾 Yadda Saxla"; }
});

modalDeleteBtn.addEventListener('click', async () => { if (activeOrderId && confirm("Bu məhsul alındı olaraq qeyd edilsin?")) { const idToUpdate = activeOrderId; closeModal(); await updateDoc(doc(db, "orders", idToUpdate), { status: "passive" }); } });

// TOPLU SEÇİM REJİMİ
function enterBulkSelectMode(firstOrderId) { isBulkSelectMode = true; selectedOrderIds.clear(); if (firstOrderId) selectedOrderIds.add(firstOrderId); bulkSelectPanel.style.display = "flex"; updateBulkPanelUI(); renderOrders(); }
function exitBulkSelectMode() { isBulkSelectMode = false; selectedOrderIds.clear(); bulkSelectPanel.style.display = "none"; renderOrders(); }
function toggleOrderSelection(orderId) { if (selectedOrderIds.has(orderId)) { selectedOrderIds.delete(orderId); } else { selectedOrderIds.add(orderId); } if (selectedOrderIds.size === 0) { exitBulkSelectMode(); } else { updateBulkPanelUI(); const targetCard = document.querySelector(`.order-item[data-id="${orderId}"]`); if (targetCard) targetCard.classList.toggle('checked'); } }
function updateBulkPanelUI() { bulkSelectCount.textContent = `${selectedOrderIds.size} məhsul seçildi`; }
bulkCancelBtn.addEventListener('click', exitBulkSelectMode);

// TOPLU ALINDI REJİMİ
bulkMarkPassiveBtn.addEventListener('click', async () => {
    if (selectedOrderIds.size === 0) return;
    if (confirm(`Seçilmiş ${selectedOrderIds.size} məhsul alındı olaraq təsdiqlənsin?`)) {
        const batch = writeBatch(db); selectedOrderIds.forEach(id => { batch.update(doc(db, "orders", id), { status: "passive" }); });
        try { await batch.commit(); exitBulkSelectMode(); } catch (error) { alert("Xəta: " + error.message); }
    }
});

// TOPLU SİLMƏƏ
bulkDeleteBtn.addEventListener('click', async () => {
    if (selectedOrderIds.size === 0) return;
    if (confirm(`Seçilmiş ${selectedOrderIds.size} məhsul layihədən TAMAMİLƏ silinsin?`)) {
        const batch = writeBatch(db); selectedOrderIds.forEach(id => { batch.delete(doc(db, "orders", id)); });
        try { await batch.commit(); exitBulkSelectMode(); } catch (error) { alert("Xəta: " + error.message); }
    }
});

// 🔍 AXTARIŞ INPUTUNU DİNLƏYİRİK
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim(); // Yazılan mətni kiçik hərflərə çeviririk
    renderOrders(); // Hər hərf yazılanda siyahını yenidən rəndərləyirik
});

// SİFARİŞLƏRİ SİYAHILAMAQ (YENİLƏNDİ)
function renderOrders() {
    orderListContainer.innerHTML = "";
    
    // 🛠️ HƏM ŞİRKƏTƏ, HƏM DƏ AXTARIŞA GÖRƏ EYNİ ANDA FİLTRLƏMƏ
    const filteredOrders = allOrders.filter(order => {
        // 1. Şirkət filtri yoxlanışı
        let matchCompany = true;
        if (currentFilter !== "all") {
            if (currentFilter === "none") matchCompany = !order.company;
            else matchCompany = (order.company === currentFilter);
        }

        // 2. Axtarış sözü yoxlanışı
        let matchSearch = true;
        if (searchQuery !== "") {
            matchSearch = order.name.toLowerCase().includes(searchQuery);
        }

        return matchCompany && matchSearch; // Hər iki şərt düzgündürsə məhsul siyahıda qalır
    });

    if (filteredOrders.length === 0) {
        orderListContainer.innerHTML = '<p class="empty-text">Axtarışa uyğun aktiv sifariş tapılmadı.</p>';
        return;
    }

    filteredOrders.forEach((order) => {
        const itemDiv = document.createElement('div');
        let isChecked = selectedOrderIds.has(order.id);
        let statusClass = (order.status === "passive") ? "status-passive" : "status-active";
        
        itemDiv.className = `order-item ${isBulkSelectMode ? 'selected-mode' : ''} ${isChecked ? 'checked' : ''} ${statusClass}`;
        itemDiv.setAttribute('data-id', order.id);

        const checkboxHtml = isBulkSelectMode ? `<div class="order-checkbox-container"><div class="custom-checkbox"></div></div>` : '';
        const imgTag = order.image 
            ? `<img src="${order.image}" width="55" height="55" alt="product">`
            : `<div style="width:55px; height:55px; background:#333; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📦</div>`;

        const companyBadge = order.company ? `<span class="company-badge">${order.company}</span>` : '';
        const alindiText = (order.status === "passive") ? `<span class="alindi-badge">✓ Alındı</span>` : '';
        let countText = (order.count !== null && order.count !== undefined) ? `Sayı: ${order.count} ədəd` : `<span style="color: #777; font-style: italic;">Tələb olunmayıb</span>`;

        let doneClass = (order.status === "passive") ? "done" : "";
        const deleteButtonHtml = isBulkSelectMode ? '' : `<button class="delete-btn quick-del ${doneClass}" data-id="${order.id}">✓</button>`;

        itemDiv.innerHTML = `
            <div class="order-clickable-area">
                ${checkboxHtml}
                ${imgTag}
                <div class="order-details">
                    <div>${companyBadge} ${alindiText}</div>
                    <strong>${order.name}</strong>
                    <span>${countText}</span>
                </div>
            </div>
            ${deleteButtonHtml}
        `;
        orderListContainer.appendChild(itemDiv);

        // UZUN BASMA MƏNTİQİ
        let pressTimer;
        itemDiv.addEventListener('touchstart', (e) => { if (isBulkSelectMode || e.target.classList.contains('quick-del')) return; pressTimer = window.setTimeout(() => { enterBulkSelectMode(order.id); }, 700); });
        itemDiv.addEventListener('mousedown', (e) => { if (isBulkSelectMode || e.target.classList.contains('quick-del')) return; pressTimer = window.setTimeout(() => { enterBulkSelectMode(order.id); }, 700); });
        const cancelPress = () => { clearTimeout(pressTimer); };
        itemDiv.addEventListener('touchend', cancelPress); itemDiv.addEventListener('touchmove', cancelPress); itemDiv.addEventListener('mouseup', cancelPress); itemDiv.addEventListener('mouseleave', cancelPress);
    });

    // KARTA TƏK KLİKLƏMƏ
    document.querySelectorAll('.order-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-del')) return;
            const id = item.getAttribute('data-id');
            if (isBulkSelectMode) { toggleOrderSelection(id); } else { const foundOrder = allOrders.find(o => o.id === id); if (foundOrder) openModal(foundOrder); }
        });
    });

    // SAĞDAKI QUŞ İŞARƏSİ
    document.querySelectorAll('.quick-del').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const orderId = e.target.getAttribute('data-id');
            const foundOrder = allOrders.find(o => o.id === orderId);
            if (foundOrder && foundOrder.status === "passive") return;
            if (confirm("Bu məhsul alındı olaraq qeyd edilsin?")) { await updateDoc(doc(db, "orders", orderId), { status: "passive" }); }
        });
    });
}

// REAL-TIME DATA
const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    allOrders = [];
    snapshot.forEach((docSnap) => { allOrders.push({ id: docSnap.id, ...docSnap.data() }); });
    renderOrders();
});

// FİLTRLƏR
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        exitBulkSelectMode();
    });
});