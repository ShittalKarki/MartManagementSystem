/* MartMS */
// Customer shop: cart drawer, live search, and AJAX add-to-cart.
(function () {
    if (!document.body.classList.contains('customer-portal')) return;

    const token = document.querySelector('meta[name="request-verification-token"]')?.content;
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartDrawerOverlay');
    const cartBody = document.getElementById('cartDrawerBody');
    const cartSubtotal = document.getElementById('cartDrawerSubtotal');
    const cartTotal = document.getElementById('cartDrawerTotal');
    const cartBadge = document.getElementById('cartBadge');
    const searchInput = document.getElementById('shopSearchInput');
    const suggestions = document.getElementById('searchSuggestions');

    function openCartDrawer() {
        drawer?.classList.add('open');
        overlay?.classList.add('show');
        document.body.style.overflow = 'hidden';
        refreshCartDrawer();
    }

    function closeCartDrawer() {
        drawer?.classList.remove('open');
        overlay?.classList.remove('show');
        document.body.style.overflow = '';
    }

    document.getElementById('openCartDrawer')?.addEventListener('click', e => {
        e.preventDefault();
        openCartDrawer();
    });
    document.getElementById('closeCartDrawer')?.addEventListener('click', closeCartDrawer);
    overlay?.addEventListener('click', closeCartDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCartDrawer(); });

    function updateBadge(count) {
        if (!cartBadge) return;
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    function formatMoney(n) {
        return 'Rs. ' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderCartItems(cart) {
        if (!cartBody) return;
        if (!cart.items || !cart.items.length) {
            cartBody.innerHTML = `
                <div class="cart-empty">
                    <i class="bi bi-cart-x"></i>
                    <p class="mb-2 fw-semibold">Your cart is empty</p>
                    <p class="small text-muted mb-3">Browse products and add items to get started.</p>
                    <button type="button" class="btn btn-shop-primary btn-sm" id="cartEmptyShop">Start shopping</button>
                </div>`;
            document.getElementById('cartEmptyShop')?.addEventListener('click', () => { closeCartDrawer(); window.location.href = '/Shop'; });
            return;
        }

        cartBody.innerHTML = cart.items.map(item => `
            <div class="cart-item-row" data-product-id="${item.productId}">
                <div class="cart-item-thumb">
                    ${item.imagePath
                        ? `<img src="${item.imagePath}" alt="" />`
                        : `<div class="product-img-placeholder" style="background:${placeholderColor(item.productId)};font-size:1.25rem;height:100%"><i class="bi bi-box-seam"></i></div>`}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-semibold small">${escapeHtml(item.name)}</div>
                    <div class="text-muted small">${formatMoney(item.unitPrice)}</div>
                    <div class="d-flex align-items-center gap-2 mt-2">
                        <div class="qty-stepper qty-stepper-sm">
                            <button type="button" class="cart-qty-minus" data-id="${item.productId}"><i class="bi bi-dash"></i></button>
                            <span class="px-2 fw-semibold small">${item.quantity}</span>
                            <button type="button" class="cart-qty-plus" data-id="${item.productId}" data-max="${item.stockAvailable}"><i class="bi bi-plus"></i></button>
                        </div>
                        <button type="button" class="btn btn-link btn-sm text-danger p-0 cart-remove" data-id="${item.productId}">Remove</button>
                    </div>
                </div>
                <div class="fw-bold small text-end">${formatMoney(item.lineTotal)}</div>
            </div>`).join('');

        cartBody.querySelectorAll('.cart-qty-minus').forEach(btn => btn.addEventListener('click', () => {
            const row = cart.items.find(i => i.productId == btn.dataset.id);
            if (row) updateCartItem(btn.dataset.id, row.quantity - 1);
        }));
        cartBody.querySelectorAll('.cart-qty-plus').forEach(btn => btn.addEventListener('click', () => {
            const row = cart.items.find(i => i.productId == btn.dataset.id);
            const max = parseInt(btn.dataset.max, 10);
            if (row && row.quantity < max) updateCartItem(btn.dataset.id, row.quantity + 1);
        }));
        cartBody.querySelectorAll('.cart-remove').forEach(btn => btn.addEventListener('click', () => removeCartItem(btn.dataset.id)));
    }

    function placeholderColor(id) {
        const hues = ['#0d9488', '#0891b2', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];
        return hues[id % hues.length];
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function refreshCartDrawer() {
        fetch('/Shop/CartData')
            .then(r => r.json())
            .then(cart => {
                renderCartItems(cart);
                if (cartSubtotal) cartSubtotal.textContent = formatMoney(cart.subtotal);
                if (cartTotal) cartTotal.textContent = formatMoney(cart.total);
                updateBadge(cart.itemCount);
            })
            .catch(() => {});
    }

    function postCart(action, data) {
        const body = new URLSearchParams(data);
        body.append('__RequestVerificationToken', token || '');
        return fetch(action, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        }).then(r => r.json());
    }

    function updateCartItem(productId, quantity) {
        postCart('/Shop/UpdateCart', { productId, quantity })
            .then(res => {
                if (res.success) {
                    renderCartItems(res.cart);
                    if (cartSubtotal) cartSubtotal.textContent = formatMoney(res.cart.subtotal);
                    if (cartTotal) cartTotal.textContent = formatMoney(res.cart.total);
                    updateBadge(res.cart.itemCount);
                }
            });
    }

    function removeCartItem(productId) {
        postCart('/Shop/RemoveFromCart', { productId })
            .then(res => {
                if (res.success) {
                    renderCartItems(res.cart);
                    if (cartSubtotal) cartSubtotal.textContent = formatMoney(res.cart.subtotal);
                    if (cartTotal) cartTotal.textContent = formatMoney(res.cart.total);
                    updateBadge(res.cart.itemCount);
                    window.mart?.toast('Item removed', 'success');
                }
            });
    }

    document.getElementById('cartDrawerCheckout')?.addEventListener('click', function () {
        const btn = this;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing...';
        postCart('/Shop/Checkout', {})
            .then(res => {
                if (res.success) {
                    window.mart?.toast(res.message, 'success');
                    closeCartDrawer();
                    if (res.redirectUrl) window.location.href = res.redirectUrl;
                } else {
                    window.mart?.toast(res.message || 'Checkout failed', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-bag-check me-1"></i> Place order';
                }
            })
            .catch(() => {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-bag-check me-1"></i> Place order';
            });
    });

    document.querySelectorAll('.btn-add-cart-ajax').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const form = btn.closest('form');
            const productId = form?.querySelector('[name="productId"]')?.value;
            const qtyInput = form?.querySelector('[name="quantity"]');
            const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;
            if (!productId) return;

            btn.disabled = true;
            const origHtml = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            postCart('/Shop/AddToCart', { productId, quantity })
                .then(res => {
                    btn.disabled = false;
                    if (res.success) {
                        btn.classList.add('added');
                        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Added';
                        updateBadge(res.cart.itemCount);
                        window.mart?.toast(res.message, 'success');
                        setTimeout(() => {
                            btn.classList.remove('added');
                            btn.innerHTML = origHtml;
                        }, 1800);
                    } else {
                        btn.innerHTML = origHtml;
                        window.mart?.toast(res.message, 'error');
                    }
                })
                .catch(() => { btn.disabled = false; btn.innerHTML = origHtml; });
        });
    });

    document.querySelectorAll('.qty-stepper:not(.qty-stepper-sm)').forEach(stepper => {
        const input = stepper.querySelector('input[type="number"]');
        const minus = stepper.querySelector('.qty-minus');
        const plus = stepper.querySelector('.qty-plus');
        if (!input) return;
        minus?.addEventListener('click', () => {
            const min = parseInt(input.min, 10) || 1;
            input.value = Math.max(min, parseInt(input.value, 10) - 1);
        });
        plus?.addEventListener('click', () => {
            const max = parseInt(input.max, 10) || 99;
            input.value = Math.min(max, parseInt(input.value, 10) + 1);
        });
    });

    let searchTimer;
    searchInput?.addEventListener('input', function () {
        clearTimeout(searchTimer);
        const q = this.value.trim();
        if (q.length < 2) {
            suggestions?.classList.remove('show');
            suggestions.innerHTML = '';
            return;
        }
        searchTimer = setTimeout(() => {
            fetch('/Shop/SearchSuggestions?q=' + encodeURIComponent(q))
                .then(r => r.json())
                .then(items => {
                    if (!items.length) {
                        suggestions.innerHTML = '<div class="p-3 text-muted small text-center">No products found</div>';
                    } else {
                        suggestions.innerHTML = items.map(item => `
                            <a href="/Shop/Details/${item.id}" class="search-suggestion-item">
                                <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:#f1f5f9;flex-shrink:0">
                                    ${item.imagePath ? `<img src="${item.imagePath}" style="width:100%;height:100%;object-fit:cover" alt="">` : `<div class="d-flex align-items-center justify-content-center h-100 text-muted"><i class="bi bi-box-seam"></i></div>`}
                                </div>
                                <div class="flex-grow-1 min-width-0">
                                    <div class="fw-semibold small text-truncate">${escapeHtml(item.name)}</div>
                                    <div class="text-muted small">${escapeHtml(item.categoryName)}</div>
                                </div>
                                <div class="fw-bold small text-primary">${formatMoney(item.price)}</div>
                            </a>`).join('');
                    }
                    suggestions?.classList.add('show');
                });
        }, 280);
    });

    document.addEventListener('click', e => {
        if (!searchInput?.contains(e.target) && !suggestions?.contains(e.target))
            suggestions?.classList.remove('show');
    });

    const path = window.location.pathname.toLowerCase();
    document.querySelectorAll('.shop-navbar .nav-link').forEach(link => {
        try {
            const p = new URL(link.href).pathname.toLowerCase();
            if (p === path || (p !== '/shop' && path.startsWith(p))) link.classList.add('active');
            else if (p === '/shop' && path === '/shop') link.classList.add('active');
        } catch { /* ignore */ }
    });

    window.shopCart = { open: openCartDrawer, refresh: refreshCartDrawer };
})();
