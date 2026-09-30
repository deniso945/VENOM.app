// ==========================================
// CONFIGURATION GLOBALE & HORAIRES
// ==========================================
const CONFIG = {
    whatsappNumber: "32400000000",
    adminPin: "482915",       // Code PIN aléatoire à 6 chiffres pour accéder à l'admin
    confirmPin: "7319",       // Code PIN aléatoire à 4 chiffres pour publier une promo
    menus: {
        chocolat: {
            title: "MENU CHOCOLAT 🍫",
            openHour: 17, // 17h00
            closeHour: 0, // 00h00 (minuit)
            products: [
                { id: 'c1', name: '🍫 Variété Choco 1', desc: 'Notes riches et profondes, qualité supérieure.', price: 15, minAchat: 30, stock: 100 },
                { id: 'c2', name: '🍫 Variété Choco 2', desc: 'Texture dense et arômes uniques sélectionnés.', price: 15, minAchat: 30, stock: 100 }
            ]
        },
        poudreux: {
            title: "MENU POUDREUX ⏳",
            openHour: 18, // 18h00
            closeHour: 3, // 03h00 du matin
            products: [
                { id: 'p1', name: '⏳ Poudreux Classic', desc: 'Finesse et pureté incomparables.', price: 20, minAchat: 40, stock: 100 },
                { id: 'p2', name: '⏳ Poudreux Premium', desc: 'Cristaux d\'exception pour amateurs exigeants.', price: 25, minAchat: 40, stock: 100 },
                { id: 'p3', name: '✨ Édition Limitée', desc: 'Le sommet de la gamme, sans minimum requis.', price: 50, minAchat: 0, stock: 200 }
            ]
        }
    },
    communes: [
        { id: 'saint-gilles', name: 'Saint-Gilles', minPrice: 20, time: '10 min - 15 min' },
        { id: 'forest', name: 'Forest', minPrice: 40, time: '15 min - 20 min' },
        { id: 'ixelles', name: 'Ixelles', minPrice: 40, time: '15 min - 25 min' },
        { id: 'uccle', name: 'Uccle', minPrice: 40, time: '20 min - 30 min' }
    ]
};

// ==========================================
// ÉTAT DE L'APPLICATION (Stocké en LocalStorage)
// ==========================================
let currentMenuType = '';
let currentPageIndex = 0;
let totalPages = 0;

// Gestion des promos actives (sauvegardées pour persister)
function getActivePromo() {
    let promo = localStorage.getItem('venom_active_promo');
    return promo ? JSON.parse(promo) : null;
}

function saveActivePromo(promoObj) {
    localStorage.setItem('venom_active_promo', JSON.stringify(promoObj));
}

// Vérifier si un menu est ouvert selon l'heure actuelle
function isMenuOpen(menuKey) {
    const now = new Date();
    const currentHour = now.getHours();
    const menu = CONFIG.menus[menuKey];

    if (menu.openHour < menu.closeHour) {
        // Ex: 17h à 00h
        return currentHour >= menu.openHour && currentHour < menu.closeHour;
    } else {
        // Ex: 18h à 03h du matin (franchit minuit)
        return currentHour >= menu.openHour || currentHour < menu.closeHour;
    }
}

// ==========================================
// NAVIGATION CLIENT
// ==========================================
function openBook(type) {
    // Vérification des horaires
    if (!isMenuOpen(type)) {
        const menu = CONFIG.menus[type];
        alert(`Ce menu est actuellement FERMÉ.\nHoraires d'ouverture : de ${menu.openHour}h00 à ${menu.closeHour === 0 ? '00h00' : menu.closeHour + 'h00'}.`);
        return;
    }

    currentMenuType = type;
    currentPageIndex = 0;
    
    const root = document.documentElement;
    if (type === 'chocolat') {
        root.style.setProperty('--theme-color', 'var(--choco-color)');
        root.style.setProperty('--theme-glow', 'var(--choco-glow)');
    } else {
        root.style.setProperty('--theme-color', 'var(--sand-color)');
        root.style.setProperty('--theme-glow', 'var(--sand-glow)');
    }
    
    document.getElementById('menu-indicator').innerText = CONFIG.menus[type].title;

    document.getElementById('home-view').style.display = 'none';
    document.getElementById('promo-client-view').style.display = 'none';
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-dashboard-view').style.display = 'none';
    document.getElementById('book-view').style.display = 'block';

    buildPages();
    updatePageState();
}

function closeBook() {
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('book-view').style.display = 'none';
    document.getElementById('promo-client-view').style.display = 'none';
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-dashboard-view').style.display = 'none';
}

function openPromoView() {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('promo-client-view').style.display = 'block';
    updateClientPromoDisplay();
}

function buildPages() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    const menuData = CONFIG.menus[currentMenuType];
    const products = menuData.products;
    totalPages = products.length + 1;

    // 1. Pages Produits
    products.forEach((prod, index) => {
        const page = document.createElement('div');
        page.className = 'page'; 
        page.id = `page-${index}`;
        page.innerHTML = `
            <div class="product-visual title-font">${prod.name.split(' ')[0]} 📸</div>
            <h2 class="product-title">${prod.name}</h2>
            <p class="product-desc">${prod.desc}</p>
            <div>
                <div class="product-price">${prod.price}€ / unité</div>
                ${prod.minAchat > 0 ? `<div class="product-min">⚠️ Minimum requis : ${prod.minAchat}€</div>` : `<div class="product-min">✅ Aucun minimum requis</div>`}
            </div>
            <div class="swipe-indicator">Cliquez sur Suivant pour continuer</div>
        `;
        container.appendChild(page);
    });

    // 2. Page Formulaire de Commande & Panier
    const formPage = document.createElement('div');
    formPage.className = 'page';
    formPage.id = `page-${products.length}`;
    
    let qtyHTML = '';
    products.forEach(prod => {
        qtyHTML += `
            <div class="qty-row">
                <div class="qty-info">
                    <h4>${prod.name}</h4>
                    <p>${prod.price}€ - Stock: ${prod.stock}</p>
                </div>
                <input type="number" min="0" value="0" class="qty-input product-qty" 
                    data-id="${prod.id}" data-price="${prod.price}" data-stock="${prod.stock}" data-min="${prod.minAchat}"
                    oninput="validateOrder()">
            </div>
        `;
    });

    let communeHTML = '';
    CONFIG.communes.forEach(com => {
        communeHTML += `<option value="${com.id}" data-min="${com.minPrice}" data-time="${com.time}">${com.name} (Min. ${com.minPrice}€)</option>`;
    });

    formPage.innerHTML = `
        <h2 class="section-title">1. VOS QUANTITÉS</h2>
        ${qtyHTML}

        <h2 class="section-title">2. LIVRAISON & NOTES</h2>
        <select class="input-field" id="commune-select" onchange="validateOrder()">
            ${communeHTML}
        </select>
        <input type="text" class="input-field" id="address-input" placeholder="Rue et numéro (Obligatoire)" oninput="validateOrder()">
        <input type="text" class="input-field" id="note-input" placeholder="Notes / Instructions spéciales (ex: Intercom 3B)">

        <div class="recap-box">
            <div class="recap-row"><span>Temps estimé :</span> <span id="recap-time">--</span></div>
            <div class="recap-row" id="promo-recap-row" style="display:none; color: #4ade80;"><span>Réduction appliquée :</span> <span id="recap-promo-text">--</span></div>
            <div class="recap-total"><span>Total :</span> <span id="recap-price">0 €</span></div>
        </div>

        <div id="error-messages" class="error-messages"></div>

        <button class="submit-btn" id="submit-btn" onclick="sendWhatsApp()" disabled>FINALISER LA COMMANDE</button>
    `;
    container.appendChild(formPage);
    setTimeout(validateOrder, 100);
}

function turnPage(direction) {
    const newIndex = currentPageIndex + direction;
    if (newIndex >= 0 && newIndex < totalPages) {
        currentPageIndex = newIndex;
        updatePageState();
    }
}

function updatePageState() {
    for (let i = 0; i < totalPages; i++) {
        const page = document.getElementById(`page-${i}`);
        if (i === currentPageIndex) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    }

    const controls = document.getElementById('book-controls');
    if (currentPageIndex === totalPages) {
        controls.style.display = 'none'; // géré dans le formulaire si besoin
    } else {
        controls.style.display = 'flex';
        document.getElementById('btn-prev').style.visibility = currentPageIndex === 0 ? 'hidden' : 'visible';
        const btnNext = document.getElementById('btn-next');
        if (currentPageIndex === totalPages - 1) {
            btnNext.style.display = 'none'; 
        } else {
            btnNext.style.display = 'block';
        }
    }
}

// ==========================================
// GESTION DES PROMOS CÔTÉ CLIENT
// ==========================================
function clientApplyPromo() {
    const inputCode = document.getElementById('client-promo-input').value.trim().toUpperCase();
    const msgBox = document.getElementById('client-promo-msg');
    let activePromo = getActivePromo();

    if (!activePromo) {
        msgBox.style.color = "var(--error-color)";
        msgBox.innerText = "Aucun code promo actif configuré pour le moment.";
        return;
    }

    // Vérification de la date d'expiration
    const now = new Date();
    const expiryDate = new Date(activePromo.endDate);
    if (now > expiryDate) {
        msgBox.style.color = "var(--error-color)";
        msgBox.innerText = "Ce code promo a expiré.";
        localStorage.removeItem('venom_active_promo');
        return;
    }

    // Vérification de la limite d'utilisations
    if (activePromo.maxUses !== "" && activePromo.usesCount >= parseInt(activePromo.maxUses)) {
        msgBox.style.color = "var(--error-color)";
        msgBox.innerText = "Ce code a atteint sa limite maximale de commandes.";
        return;
    }

    if (inputCode === activePromo.code) {
        activePromo.activatedByClient = true;
        saveActivePromo(activePromo);
        msgBox.style.color = "var(--choco-color)";
        msgBox.innerText = "Succès ! Code activé. Retournez commander pour en profiter.";
        updateClientPromoDisplay();
    } else {
        msgBox.style.color = "var(--error-color)";
        msgBox.innerText = "Code promo incorrect.";
    }
}

function updateClientPromoDisplay() {
    const display = document.getElementById('active-promo-display');
    let activePromo = getActivePromo();

    if (!activePromo) {
        display.innerHTML = "Aucune offre active.";
        return;
    }

    const now = new Date();
    const expiryDate = new Date(activePromo.endDate);
    if (now > expiryDate || (activePromo.maxUses !== "" && activePromo.usesCount >= parseInt(activePromo.maxUses))) {
        display.innerHTML = "L'offre précédente a expiré.";
        return;
    }

    let typeText = activePromo.type === 'percent' ? `${activePromo.value}% de réduction` : activePromo.type === 'fixed' ? `${activePromo.value}€ de réduction` : `Cadeau : ${activePromo.value}`;
    let statusClass = activePromo.activatedByClient ? "✅ Activé (Prêt à l'emploi)" : "⏳ Non activé (Entrez le code ci-dessus)";

    display.innerHTML = `
        <strong>Code :</strong> ${activePromo.code} <br>
        <strong>Avantage :</strong> ${typeText} <br>
        <strong>Fin de l'offre :</strong> ${expiryDate.toLocaleString()} <br>
        <strong>Statut :</strong> <span style="color: ${activePromo.activatedByClient ? '#4ade80' : '#fbbf24'}">${statusClass}</span>
    `;
}

// ==========================================
// CALCULS, VALIDATION & APPLICATION DE LA PROMO
// ==========================================
function validateOrder() {
    const inputs = document.querySelectorAll('.product-qty');
    const communeSelect = document.getElementById('commune-select');
    const addressInput = document.getElementById('address-input');
    const errorBox = document.getElementById('error-messages');
    const submitBtn = document.getElementById('submit-btn');
    
    let totalPrice = 0;
    let totalQty = 0;
    let errors = [];

    inputs.forEach(input => {
        let qty = parseInt(input.value) || 0;
        let price = parseFloat(input.getAttribute('data-price'));
        let stock = parseInt(input.getAttribute('data-stock'));
        let minAchat = parseFloat(input.getAttribute('data-min'));
        let name = input.previousElementSibling.querySelector('h4').innerText;

        if (qty > 0) {
            let cost = qty * price;
            totalPrice += cost;
            totalQty += qty;

            if (qty > stock) {
                errors.push(`Stock insuffisant pour ${name}.`);
                input.style.borderColor = "var(--error-color)";
            } else if (cost < minAchat) { 
                errors.push(`${name} : minimum ${minAchat}€.`);
                input.style.borderColor = "var(--error-color)";
            } else {
                input.style.borderColor = 'rgba(255,255,255,0.2)';
            }
        } else {
            input.style.borderColor = 'rgba(255,255,255,0.2)';
        }
    });

    const selectedCommune = communeSelect.options[communeSelect.selectedIndex];
    const communeMin = parseFloat(selectedCommune.getAttribute('data-min'));
    const communeTime = selectedCommune.getAttribute('data-time');

    if (totalQty > 0 && totalPrice < communeMin) {
        errors.push(`Minimum pour ${selectedCommune.text.split(' (')[0]} : ${communeMin}€.`);
    }

    if (totalQty > 0 && addressInput.value.trim().length < 5) {
        errors.push(`Adresse de livraison requise.`);
    }

    // Application de la réduction en temps réel si activée par le client
    let activePromo = getActivePromo();
    let finalPrice = totalPrice;
    let promoRow = document.getElementById('promo-recap-row');
    let promoText = document.getElementById('recap-promo-text');

    if (activePromo && activePromo.activatedByClient) {
        const now = new Date();
        const expiryDate = new Date(activePromo.endDate);
        const isValid = now <= expiryDate && (activePromo.maxUses === "" || activePromo.usesCount < parseInt(activePromo.maxUses));

        if (isValid && totalQty > 0) {
            promoRow.style.display = "flex";
            if (activePromo.type === 'percent') {
                let discount = (totalPrice * activePromo.value) / 100;
                finalPrice = Math.max(0, totalPrice - discount);
                promoText.innerText = `-${activePromo.value}% (-${discount.toFixed(1)}€)`;
            } else if (activePromo.type === 'fixed') {
                finalPrice = Math.max(0, totalPrice - activePromo.value);
                promoText.innerText = `-${activePromo.value}€`;
            } else if (activePromo.type === 'gift') {
                promoText.innerText = `Cadeau inclus : ${activePromo.value}`;
            }
        } else {
            promoRow.style.display = "none";
        }
    } else {
        promoRow.style.display = "none";
    }

    document.getElementById('recap-price').innerText = finalPrice + ' €';
    document.getElementById('recap-time').innerText = totalQty > 0 ? communeTime : '--';

    if (totalQty === 0) {
        errorBox.innerHTML = 'Indiquez au moins une quantité.';
        submitBtn.disabled = true;
    } else if (errors.length > 0) {
        errorBox.innerHTML = errors.join('<br>');
        submitBtn.disabled = true;
    } else {
        errorBox.innerHTML = '';
        submitBtn.disabled = false;
    }
}

// ==========================================
// PANNEAU ADMIN
// ==========================================
function openAdminLogin() {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('admin-login-view').style.display = 'block';
    document.getElementById('admin-pin-input').value = '';
    document.getElementById('admin-login-error').innerText = '';
}

function verifyAdminPin() {
    const pin = document.getElementById('admin-pin-input').value;
    const errorBox = document.getElementById('admin-login-error');

    if (pin === CONFIG.adminPin) {
        document.getElementById('admin-login-view').style.display = 'none';
        document.getElementById('admin-dashboard-view').style.display = 'block';
        loadAdminStatus();
    } else {
        errorBox.innerText = "Code PIN incorrect.";
    }
}

function saveAdminPromo() {
    const code = document.getElementById('adm-code').value.trim().toUpperCase();
    const type = document.getElementById('adm-type').value;
    const value = document.getElementById('adm-value').value;
    const endDate = document.getElementById('adm-end-date').value;
    const maxUses = document.getElementById('adm-max-uses').value;
    const confirmPin = document.getElementById('adm-confirm-pin').value;
    const errorBox = document.getElementById('adm-error');

    if (!code || !value || !endDate) {
        errorBox.innerText = "Veuillez remplir les champs obligatoires (Code, Valeur, Date de fin).";
        return;
    }

    if (confirmPin !== CONFIG.confirmPin) {
        errorBox.innerText = "Code de confirmation à 4 chiffres incorrect !";
        return;
    }

    const newPromo = {
        code: code,
        type: type,
        value: parseFloat(value),
        endDate: endDate,
        maxUses: maxUses,
        usesCount: 0,
        activatedByClient: false
    };

    saveActivePromo(newPromo);
    errorBox.style.color = "#4ade80";
    errorBox.innerText = "Offre publiée et active en temps réel avec succès !";
    document.getElementById('adm-confirm-pin').value = '';
    loadAdminStatus();
}

function loadAdminStatus() {
    const statusDiv = document.getElementById('adm-current-status');
    let activePromo = getActivePromo();

    if (!activePromo) {
        statusDiv.innerHTML = "Aucune offre configurée.";
        return;
    }

    statusDiv.innerHTML = `
        <strong>Code :</strong> ${activePromo.code} <br>
        <strong>Type :</strong> ${activePromo.type} (Valeur: ${activePromo.value}) <br>
        <strong>Expire le :</strong> ${new Date(activePromo.endDate).toLocaleString()} <br>
        <strong>Limite max :</strong> ${activePromo.maxUses ? activePromo.maxUses + ' commandes' : 'Illimité'} <br>
        <strong>Utilisations actuelles :</strong> ${activePromo.usesCount}
    `;
}

// ==========================================
// REDIRECTION WHATSAPP & COMPTEUR DE PROMO
// ==========================================
function sendWhatsApp() {
    const inputs = document.querySelectorAll('.product-qty');
    let orderDetails = '';
    let totalPrice = 0;

    inputs.forEach(input => {
        let qty = parseInt(input.value) || 0;
        if(qty > 0) {
            let name = input.previousElementSibling.querySelector('h4').innerText;
            let price = parseFloat(input.getAttribute('data-price'));
            orderDetails += `- ${name} : ${qty} (${qty * price}€)%0A`;
            totalPrice += (qty * price);
        }
    });

    const communeSelect = document.getElementById('commune-select');
    const communeName = communeSelect.options[communeSelect.selectedIndex].text.split(' (')[0];
    const address = document.getElementById('address-input').value;
    const note = document.getElementById('note-input').value.trim();

    // Gestion de la réduction finale sur WhatsApp
    let activePromo = getActivePromo();
    let finalPrice = totalPrice;
    let promoTextReport = "";

    if (activePromo && activePromo.activatedByClient) {
        const now = new Date();
        const expiryDate = new Date(activePromo.endDate);
        const isValid = now <= expiryDate && (activePromo.maxUses === "" || activePromo.usesCount < parseInt(activePromo.maxUses));

        if (isValid) {
            if (activePromo.type === 'percent') {
                let discount = (totalPrice * activePromo.value) / 100;
                finalPrice = Math.max(0, totalPrice - discount);
                promoTextReport = `Promo appliquée (${activePromo.code}) : -${activePromo.value}%%0A`;
            } else if (activePromo.type === 'fixed') {
                finalPrice = Math.max(0, totalPrice - activePromo.value);
                promoTextReport = `Promo appliquée (${activePromo.code}) : -${activePromo.value}€%0A`;
            } else if (activePromo.type === 'gift') {
                promoTextReport = `Cadeau promo inclus (${activePromo.code}) : ${activePromo.value}%0A`;
            }

            // Incrémenter le nombre d'utilisations de la promo
            activePromo.usesCount += 1;
            saveActivePromo(activePromo);
        }
    }

    const text = `*VENOM - NOUVELLE COMMANDE (${currentMenuType.toUpperCase()})*%0A%0A`
               + `*Produits :*%0A${orderDetails}%0A`
               + `${promoTextReport}`
               + `*Livraison :*%0ACommune : ${communeName}%0AAdresse : ${address}%0A`
               + (note ? `Note : ${note}%0A` : '') + `%0A`
               + `*TOTAL À PAYER : ${finalPrice} €*`;

    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;
    window.open(url, '_blank');
}