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
const productNoteInput = document.getElementById('productNote');
const companySelect = document.getElementById('companySelect');
const productImageInput = document.getElementById('productImage');
const cameraImageInput = document.getElementById('cameraImage');
const fileNameSpan = document.getElementById('file-name');
const fileStatusBox = document.getElementById('fileStatusBox');
const clearImageBtn = document.getElementById('clearImageBtn');
const saveBtn = document.getElementById('saveBtn');
const orderListContainer = document.getElementById('orderList');
const searchInput = document.getElementById('searchInput');

// 📱 TELEFON LOGİKASI ÜÇÜN ELEMENTLƏR
const customerPhoneBox = document.getElementById('customerPhoneBox');
const customerPhoneInput = document.getElementById('customerPhone');

// BİLDİRİŞ ELEMENTLƏRİ
const createNotifyBox = document.getElementById('createNotifyBox');
const listNotifyBox = document.getElementById('listNotifyBox');

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
const modalProductNote = document.getElementById('modalProductNote');
const editProductName = document.getElementById('editProductName');
const editProductCount = document.getElementById('editProductCount');
const editProductNote = document.getElementById('editProductNote');
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
const bulkSelectAllBtn = document.getElementById('bulkSelectAllBtn');

let selectedFile = null;
let currentFilter = "all";
let searchQuery = ""; 
let allOrders = [];
let activeOrderId = null; 

let isBulkSelectMode = false;
let selectedOrderIds = new Set();

// 🔘 SİFARİŞ NÖVÜ SEÇİM LOGİKASI
let selectedOrderType = "normal";
let editSelectedOrderType = "normal";

// Düymələrin kliklənməsi və pəncərənin idarəsi
document.getElementById('typeNormalBtn').addEventListener('click', () => {
    selectedOrderType = "normal";
    document.getElementById('typeNormalBtn').style.background = "#007bff";
    document.getElementById('typeNormalBtn').style.borderColor = "#007bff";
    document.getElementById('typeNormalBtn').style.color = "#fff";
    
    document.getElementById('typeCustomerBtn').style.background = "#222";
    document.getElementById('typeCustomerBtn').style.borderColor = "#333";
    document.getElementById('typeCustomerBtn').style.color = "#aaa";

    if (customerPhoneBox) customerPhoneBox.style.display = "none";
    if (customerPhoneInput) customerPhoneInput.value = "";
});

document.getElementById('typeCustomerBtn').addEventListener('click', () => {
    selectedOrderType = "customer";
    document.getElementById('typeCustomerBtn').style.background = "#6f42c1"; 
    document.getElementById('typeCustomerBtn').style.borderColor = "#6f42c1";
    document.getElementById('typeCustomerBtn').style.color = "#fff";
    
    document.getElementById('typeNormalBtn').style.background = "#222";
    document.getElementById('typeNormalBtn').style.borderColor = "#333";
    document.getElementById('typeNormalBtn').style.color = "#aaa";

    if (customerPhoneBox) customerPhoneBox.style.display = "block";
});

// Redaktə modalında düymələr və nömrə xanası idarəsi
function setEditOrderType(type) {
    editSelectedOrderType = type;
    const normalBtn = document.getElementById('editTypeNormalBtn');
    const customerBtn = document.getElementById('editTypeCustomerBtn');
    const editPhoneBox = document.getElementById('editCustomerPhoneBox');
    
    if (type === 'normal') {
        if (normalBtn) { normalBtn.style.background = "#007bff"; normalBtn.style.color = "#fff"; normalBtn.style.borderColor = "#007bff"; }
        if (customerBtn) { customerBtn.style.background = "#222"; customerBtn.style.color = "#aaa"; customerBtn.style.borderColor = "#333"; }
        if (editPhoneBox) editPhoneBox.style.display = "none";
    } else {
        if (customerBtn) { customerBtn.style.background = "#6f42c1"; customerBtn.style.color = "#fff"; customerBtn.style.borderColor = "#6f42c1"; }
        if (normalBtn) { normalBtn.style.background = "#222"; normalBtn.style.color = "#aaa"; normalBtn.style.borderColor = "#333"; }
        if (editPhoneBox) editPhoneBox.style.display = "block";
    }
}
if (document.getElementById('editTypeNormalBtn')) document.getElementById('editTypeNormalBtn').addEventListener('click', () => setEditOrderType('normal'));
if (document.getElementById('editTypeCustomerBtn')) document.getElementById('editTypeCustomerBtn').addEventListener('click', () => setEditOrderType('customer'));


// 🕒 TARİX FORMATLAYICI
function formatCustomDate(timestampValue) {
    if (!timestampValue) return "";
    const date = new Date(timestampValue);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
        return `Bugün, ${timeStr}`;
    } else {
        const months = ["Yan", "Fev", "Mar", "Apr", "May", "İyun", "İyul", "Avq", "Sen", "Okt", "Noy", "Dek"];
        return `${date.getDate()} ${months[date.getMonth()]} ${timeStr}`;
    }
}

// 🔔 BİLDİRİŞ
function showNotification(targetBox, text, type) {
    if(!targetBox) return;
    targetBox.textContent = text;
    targetBox.className = `inline-notify ${type}`; 
    targetBox.style.display = "block";
    setTimeout(() => { targetBox.style.display = "none"; }, 3000);
}

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

// SİFARİŞİ BAZAYA YAZMAQ
saveBtn.addEventListener('click', async () => {
    const name = productNameInput.value.trim(); 
    const count = productCountInput.value.trim(); 
    const note = productNoteInput ? productNoteInput.value.trim() : ""; 
    const company = companySelect.value;
    const phone = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    
    if (!name) { 
        showNotification(createNotifyBox, "⚠️ Zəhmət olmasa məhsul adını daxil edin!", "error"); 
        return; 
    }
    if (selectedOrderType === "customer" && !phone) {
        showNotification(createNotifyBox, "⚠️ Müştəri sifarişi üçün telefon nömrəsi daxil edilməlidir!", "error");
        return;
    }
    
    saveBtn.disabled = true; saveBtn.textContent = "Göndərilir..."; let imageUrl = "";
    if (selectedFile) {
        const formData = new FormData(); formData.append("image", selectedFile);
        try { const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData }); const result = await response.json(); if (result.success) imageUrl = result.data.url; } catch (error) { console.error("Yükləmə xətası:", error); }
    }
    try {
        await addDoc(collection(db, "orders"), { 
            name: name, 
            count: count ? parseInt(count) : null, 
            note: note || "", 
            company: company, 
            image: imageUrl, 
            orderType: selectedOrderType, 
            customerPhone: selectedOrderType === "customer" ? phone : "", 
            status: "active", 
            timestamp: new Date().getTime() 
        });
        
        productNameInput.value = ""; productCountInput.value = ""; if(productNoteInput) productNoteInput.value = ""; companySelect.value = ""; productImageInput.value = ""; cameraImageInput.value = ""; selectedFile = null; fileStatusBox.style.display = 'none';
        if (customerPhoneInput) customerPhoneInput.value = "";

        document.getElementById('typeNormalBtn').click();
        showNotification(createNotifyBox, "✅ Sifariş uğurla göndərildi!", "success");
    } catch (error) { 
        showNotification(createNotifyBox, "❌ Xəta: " + error.message, "error"); 
    } finally { saveBtn.disabled = false; saveBtn.textContent = "Sifarişi Təsdiqlə"; }
});

// MODAL AÇMAQ
function openModal(order) {
    activeOrderId = order.id; switchToViewMode();
    modalProductName.textContent = order.name;
    if (order.count !== null && order.count !== undefined) { modalProductCount.textContent = order.count + " ədəd"; } else { modalProductCount.textContent = "Tələb olunmayıb"; }
    modalProductNote.textContent = order.note || "Qeyd yoxdur";

    const typeBadge = document.getElementById('modalOrderTypeBadge');
    const modalPhoneRow = document.getElementById('modalPhoneRow');
    const modalCustomerPhone = document.getElementById('modalCustomerPhone');

    if (typeBadge) {
        if (order.orderType === 'customer') {
            typeBadge.textContent = "👤 Müştəri Sifarişi";
            typeBadge.style.background = "#6f42c1";
            typeBadge.style.display = "inline-block";
            // 📞 TELEFON NÖMRƏSİ BURADA (DETAL SƏHİFƏSİNDƏ) GÖRSƏNƏCƏK
            if (modalPhoneRow && modalCustomerPhone) {
                modalCustomerPhone.textContent = order.customerPhone || "Nömrə yoxdur";
                modalPhoneRow.style.display = "flex";
            }
        } else {
            typeBadge.style.display = "none"; 
            if (modalPhoneRow) modalPhoneRow.style.display = "none";
        }
    }

    if (order.company) { modalCompanyBadge.textContent = order.company; modalCompanyBadge.style.display = "inline-block"; } else { modalCompanyBadge.textContent = "Seçilməyib"; }
    if (order.image) { modalImageContainer.innerHTML = `<img src="${order.image}" alt="Böyük Şəkil" style="max-width:100%; border-radius:8px;">`; } else { modalImageContainer.innerHTML = `<div style="width:100%; height:120px; background:#121212; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:3rem;">📦</div>`; }
    
    editProductName.value = order.name; 
    editProductCount.value = order.count || ""; 
    if(editProductNote) editProductNote.value = order.note || ""; 
    editCompanySelect.value = order.company || "";
    
    const editPhoneInput = document.getElementById('editCustomerPhone');
    if (editPhoneInput) editPhoneInput.value = order.customerPhone || "";

    setEditOrderType(order.orderType || 'normal');
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
    const updatedName = editProductName.value.trim(); 
    const updatedCount = editProductCount.value.trim(); 
    const updatedNote = editProductNote ? editProductNote.value.trim() : ""; 
    const updatedCompany = editCompanySelect.value;
    const editPhoneInput = document.getElementById('editCustomerPhone');
    const updatedPhone = editPhoneInput ? editPhoneInput.value.trim() : "";
    
    if (!updatedName) { showNotification(listNotifyBox, "⚠️ Məhsul adı boş buraxıla bilməz!", "error"); return; }
    modalSaveEditBtn.disabled = true; modalSaveEditBtn.textContent = "Yenilənir...";
    try { 
        await updateDoc(doc(db, "orders", activeOrderId), { 
            name: updatedName, 
            count: updatedCount ? parseInt(updatedCount) : null, 
            note: updatedNote, 
            company: updatedCompany,
            orderType: editSelectedOrderType,
            customerPhone: editSelectedOrderType === "customer" ? updatedPhone : ""
        }); 
        closeModal();
        showNotification(listNotifyBox, "✏️ Sifariş uğurla yeniləndi!", "success");
    } catch (error) { showNotification(listNotifyBox, "❌ Xəta: " + error.message, "error"); } finally { modalSaveEditBtn.disabled = false; modalSaveEditBtn.textContent = "💾 Yadda Saxla"; }
});

modalDeleteBtn.addEventListener('click', async () => { 
    if (activeOrderId) { 
        const idToUpdate = activeOrderId; 
        const foundOrder = allOrders.find(o => o.id === idToUpdate);
        closeModal(); 
        await updateDoc(doc(db, "orders", idToUpdate), { status: "passive" }); 
        showNotification(listNotifyBox, `✓ ${foundOrder.name} alındı olaraq təsdiqləndi!`, "success");
    } 
});

// 📊 TOPLU SEÇİM VƏ FİLTRASİYA LOGİKASI
function getVisibleOrders() {
    return allOrders.filter(order => {
        let matchFilter = true;
        if (currentFilter !== "all") {
            if (currentFilter === "type-customer") {
                // Müştəri düyməsi basılıbsa, yalnız müştəri sifarişlərini göstər
                matchFilter = (order.orderType === "customer");
            } else if (currentFilter === "none") {
                // Şirkətsiz düyməsi basılıbsa, şirkəti olmayan adi sifarişləri göstər
                matchFilter = !order.company && (order.orderType !== "customer");
            } else {
                // ✅ Yenilənmiş məntiq: Əgər mağaza filtri (məs. ABV) seçilibsə, həm mağazanın öz sifarişləri, həm də müştərinin o mağazadan olan istəkləri birlikdə görünəcək!
                matchFilter = (order.company === currentFilter);
            }
        }
        return matchFilter && (searchQuery === "" || order.name.toLowerCase().includes(searchQuery));
    });
}

function enterBulkSelectMode(firstOrderId) { isBulkSelectMode = true; selectedOrderIds.clear(); if (firstOrderId) selectedOrderIds.add(firstOrderId); bulkSelectPanel.style.display = "flex"; updateBulkPanelUI(); renderOrders(); }
function exitBulkSelectMode() { isBulkSelectMode = false; selectedOrderIds.clear(); bulkSelectPanel.style.display = "none"; renderOrders(); }
function toggleOrderSelection(orderId) { if (selectedOrderIds.has(orderId)) { selectedOrderIds.delete(orderId); } else { selectedOrderIds.add(orderId); } if (selectedOrderIds.size === 0) { exitBulkSelectMode(); } else { updateBulkPanelUI(); renderOrders(); } }

function updateBulkPanelUI() { 
    bulkSelectCount.textContent = `${selectedOrderIds.size} məhsul seçildi`; 
    const visibleOrders = getVisibleOrders();
    if (visibleOrders.length > 0 && visibleOrders.every(order => selectedOrderIds.has(order.id))) {
        bulkSelectAllBtn.textContent = "❌ Seçimi Təmizlə";
    } else {
        bulkSelectAllBtn.textContent = "🌐 Hamısını Seç";
    }
}

bulkCancelBtn.addEventListener('click', exitBulkSelectMode);
bulkSelectAllBtn.addEventListener('click', () => {
    const visibleOrders = getVisibleOrders();
    const isAllSelected = visibleOrders.length > 0 && visibleOrders.every(order => selectedOrderIds.has(order.id));
    if (isAllSelected) { visibleOrders.forEach(order => selectedOrderIds.delete(order.id)); if (selectedOrderIds.size === 0) { exitBulkSelectMode(); return; } } 
    else { visibleOrders.forEach(order => selectedOrderIds.add(order.id)); }
    updateBulkPanelUI(); renderOrders();
});

bulkMarkPassiveBtn.addEventListener('click', async () => {
    if (selectedOrderIds.size === 0) return;
    const batch = writeBatch(db); 
    selectedOrderIds.forEach(id => { batch.update(doc(db, "orders", id), { status: "passive" }); });
    await batch.commit(); exitBulkSelectMode(); 
    showNotification(listNotifyBox, `🟢 Sifarişlər alındı edildi!`, "success");
});

bulkDeleteBtn.addEventListener('click', async () => {
    if (selectedOrderIds.size === 0) return;
    const batch = writeBatch(db); 
    selectedOrderIds.forEach(id => { batch.delete(doc(db, "orders", id)); });
    await batch.commit(); exitBulkSelectMode(); 
    showNotification(listNotifyBox, `🗑️ Məhsullar tam silindi!`, "success");
});

searchInput.addEventListener('input', (e) => { searchQuery = e.target.value.toLowerCase().trim(); renderOrders(); });

// RENDER (SİYAHILAMAQ)
function renderOrders() {
    orderListContainer.innerHTML = "";
    const filteredOrders = getVisibleOrders();

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
        const imgTag = order.image ? `<img src="${order.image}" width="55" height="55" alt="product">` : `<div style="width:55px; height:55px; background:#333; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📦</div>`;
        const companyBadge = order.company ? `<span class="company-badge">${order.company}</span>` : '';
        
        // 📱 MƏHZ SİZİN İSTƏDİYİNİZ YENİLİK: Kartın üzərində nömrə gizlədildi, sadəcə mor rəngdə "👤 Müştəri" nişanı qaldı
        let typeBadgeHtml = '';
        if (order.orderType === 'customer') {
            typeBadgeHtml = `<span class="company-badge" style="background-color: #6f42c1; color: #fff;">👤 Müştəri</span>`;
        }

        const alindiText = (order.status === "passive") ? `<span class="alindi-badge">✓ Alındı</span>` : '';
        let countText = order.count ? `Sayı: ${order.count} ədəd` : `<span style="color: #777; font-style: italic;">Tələb olunmayıb</span>`;
        const deleteButtonHtml = isBulkSelectMode ? '' : `<button class="delete-btn quick-del" data-id="${order.id}">✓</button>`;

        itemDiv.innerHTML = `
            <div class="order-clickable-area">
                ${checkboxHtml}
                ${imgTag}
                <div class="order-details">
                    <div>${typeBadgeHtml} ${companyBadge} ${alindiText}</div>
                    <strong>${order.name}</strong>
                    <span>${countText}</span>
                </div>
            </div>
            ${deleteButtonHtml}
        `;
        orderListContainer.appendChild(itemDiv);

        // Uzun basma (Long Press) ilə toplu seçim rejimi
        let pressTimer;
        itemDiv.addEventListener('touchstart', () => { pressTimer = setTimeout(() => enterBulkSelectMode(order.id), 700); });
        itemDiv.addEventListener('mousedown', () => { pressTimer = setTimeout(() => enterBulkSelectMode(order.id), 700); });
        const cancelPress = () => clearTimeout(pressTimer);
        itemDiv.addEventListener('touchend', cancelPress); itemDiv.addEventListener('mouseup', cancelPress);
    });

    // Klikləmə məntiqləri
    document.querySelectorAll('.order-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-del')) return;
            const id = item.getAttribute('data-id');
            if (isBulkSelectMode) { toggleOrderSelection(id); } 
            else { const foundOrder = allOrders.find(o => o.id === id); if (foundOrder) openModal(foundOrder); }
        });
    });

    document.querySelectorAll('.quick-del').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const orderId = btn.getAttribute('data-id');
            await updateDoc(doc(db, "orders", orderId), { status: "passive" });
        });
    });
}

// REAL-TIME SNAPSHOT
const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    allOrders = [];
    snapshot.forEach((docSnap) => { allOrders.push({ id: docSnap.id, ...docSnap.data() }); });
    renderOrders();
});

// FİLTR TABLARI
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderOrders();
        exitBulkSelectMode();
    });
});

// 🔐 PİN KOD
const CORRECT_PIN = "7388"; 
let enteredPin = "";
const pinModal = document.getElementById('pinModal');
const pinError = document.getElementById('pinError');
const dots = document.querySelectorAll('.pin-dots .dot');

document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        if (val === "C") { enteredPin = ""; } else if (val === "back") { enteredPin = enteredPin.slice(0, -1); } else if (enteredPin.length < 4) { enteredPin += val; }
        
        dots.forEach((dot, index) => { if (index < enteredPin.length) dot.classList.add('active'); else dot.classList.remove('active'); });
        
        if (enteredPin.length === 4) {
            setTimeout(() => {
                if (enteredPin === CORRECT_PIN) {
                    pinModal.style.display = "none"; enteredPin = "";
                    dots.forEach(d => d.classList.remove('active'));
                } else {
                    pinError.style.display = "block"; enteredPin = "";
                    dots.forEach(d => d.classList.remove('active'));
                }
            }, 150);
        }
    });
});