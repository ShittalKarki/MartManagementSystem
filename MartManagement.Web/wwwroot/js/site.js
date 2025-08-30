/* MartMS */
// Admin/staff shell: sidebar, theme toggle, toasts, and delete confirmation.
(function () {
    const html = document.documentElement;
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const collapseBtn = document.getElementById('sidebarCollapse');
    const mobileToggle = document.getElementById('sidebarToggle');
    const DESKTOP_BREAKPOINT = 1200;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) html.setAttribute('data-bs-theme', savedTheme);

    function isDrawerMode() {
        return window.innerWidth < DESKTOP_BREAKPOINT;
    }

    function openMobileSidebar() {
        sidebar?.classList.add('mobile-open');
        overlay?.classList.add('show');
        body.classList.add('sidebar-mobile-open');
        overlay?.setAttribute('aria-hidden', 'false');
    }

    function closeMobileSidebar() {
        sidebar?.classList.remove('mobile-open');
        overlay?.classList.remove('show');
        body.classList.remove('sidebar-mobile-open');
        overlay?.setAttribute('aria-hidden', 'true');
    }

    function setDesktopCollapsed(collapsed) {
        body.classList.toggle('sidebar-collapsed', collapsed);
        sidebar?.classList.toggle('collapsed', collapsed);
        localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
    }

    function applyLayoutMode() {
        if (!sidebar || !body.classList.contains('app-authenticated')) return;

        if (isDrawerMode()) {
            closeMobileSidebar();
            body.classList.remove('sidebar-collapsed');
            sidebar.classList.remove('collapsed');
        } else {
            const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            setDesktopCollapsed(collapsed);
        }
    }

    applyLayoutMode();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyLayoutMode, 150);
    });

    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const next = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-bs-theme', next);
        localStorage.setItem('theme', next);
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = next === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    });

    collapseBtn?.addEventListener('click', () => {
        if (isDrawerMode()) return;
        setDesktopCollapsed(!body.classList.contains('sidebar-collapsed'));
    });

    mobileToggle?.addEventListener('click', () => {
        if (sidebar?.classList.contains('mobile-open')) closeMobileSidebar();
        else openMobileSidebar();
    });

    overlay?.addEventListener('click', closeMobileSidebar);

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (isDrawerMode()) closeMobileSidebar();
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMobileSidebar();
    });

    const path = window.location.pathname.toLowerCase();
    const links = Array.from(document.querySelectorAll('.sidebar .nav-link'));

    links.forEach(l => l.classList.remove('active'));

    const paths = links.map(link => {
        try {
            return { link, p: new URL(link.href).pathname.toLowerCase() };
        } catch {
            return { link, p: '' };
        }
    }).filter(x => x.p);

    const exact = paths.find(x => x.p === path);
    if (exact) {
        exact.link.classList.add('active');
    } else {
        const partial = paths
            .filter(x => path.startsWith(x.p) && x.p.length > 1)
            .sort((a, b) => b.p.length - a.p.length)[0];
        partial?.link.classList.add('active');
    }

    window.mart = {
        toast: function (message, type) {
            const host = document.getElementById('toastHost');
            if (!host) return;
            const id = 't' + Date.now();
            const bg = type === 'error' ? 'text-bg-danger' : type === 'warning' ? 'text-bg-warning' : 'text-bg-success';
            host.insertAdjacentHTML('beforeend', `
                <div id="${id}" class="toast align-items-center ${bg} border-0" role="alert">
                    <div class="d-flex"><div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
                </div>`);
            const el = document.getElementById(id);
            bootstrap.Toast.getOrCreateInstance(el, { delay: 4500 }).show();
            el.addEventListener('hidden.bs.toast', () => el.remove());
        },

        confirmDelete: function (form, message) {
            const modalEl = document.getElementById('deleteModal');
            if (!modalEl) return form.submit();
            document.getElementById('deleteModalMessage').textContent = message || 'Delete this record?';
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            const btn = document.getElementById('deleteModalConfirm');
            const handler = () => {
                btn.removeEventListener('click', handler);
                modal.hide();
                form.submit();
            };
            btn.addEventListener('click', handler);
            modal.show();
            return false;
        },

        addLine: function (containerId, lineHtml) {
            const container = document.getElementById(containerId);
            const index = container.querySelectorAll('.line-row').length;
            container.insertAdjacentHTML('beforeend', lineHtml.replace(/__index__/g, index));
        },

        removeLine: function (btn) {
            const container = btn.closest('#lineItems');
            const rows = container?.querySelectorAll('.line-row');
            if (rows && rows.length > 1) btn.closest('.line-row')?.remove();
        }
    };

    document.querySelectorAll('[data-confirm-delete]').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            mart.confirmDelete(form, form.getAttribute('data-confirm-message'));
        });
    });

    const success = document.querySelector('[data-temp-success]')?.getAttribute('data-temp-success');
    const error = document.querySelector('[data-temp-error]')?.getAttribute('data-temp-error');
    if (success) mart.toast(success, 'success');
    if (error) mart.toast(error, 'error');

    document.querySelectorAll('.alert.toast-alert').forEach(el => {
        setTimeout(() => bootstrap.Alert.getOrCreateInstance(el)?.close(), 5000);
    });
})();

function togglePassword(btn) {
    const input = document.getElementById(btn.getAttribute('data-target'));
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.querySelector('i').className = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
}
