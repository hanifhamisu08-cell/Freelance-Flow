const $app = document.querySelector("#app");
const $toast = document.querySelector("#toast");
const csrf = document.querySelector('meta[name="csrf-token"]').content;

const state = {
    user: null,
    view: "dashboard",
    clients: [],
    selectedClientId: null,
    selectedSlug: null,
    stats: null,
    theme: localStorage.getItem("ff-theme") || "dark",
};

document.documentElement.className = state.theme;

async function req(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf,
            "Accept": "application/json",
            ...(options.headers || {}),
        },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    return data;
}

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }[char]));
}

function showToast(message, type = "ok") {
    $toast.textContent = message;
    $toast.classList.toggle("error", type === "error");
    $toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => $toast.hidden = true, 3200);
}

function icon(text) {
    return `<span class="icon">${text}</span>`;
}

function logo() {
    return `<div class="brand"><div class="brand-mark">FF</div><div><div class="brand-name">FreelanceFlow</div><div class="muted mono" style="font-size:10px">Live dashboards + autopilot</div></div></div>`;
}

async function bootstrap() {
    try {
        const data = await req("/api/auth/me");
        state.user = data.user;
    } catch {
        state.user = null;
    }
    render();
}

function render() {
    if (!state.user) return renderAuth();
    return renderShell();
}

function renderAuth() {
    $app.innerHTML = `
        <section class="auth-shell">
            <div class="auth-grid">
                <div>
                    <div class="eyebrow"><span class="dot"></span> Qwen Cloud Hackathon · Autopilot Agent</div>
                    <h1 class="hero-title">Live client dashboards with an <span class="gradient-text">AI autopilot</span> on top.</h1>
                    <p class="hero-copy">FreelanceFlow lets a freelancer share live, privacy-controlled project dashboards with clients. Stage 2 adds an approval queue that drafts insights, reports and next actions.</p>
                    <div class="feature-grid">
                        <div class="feature">${icon("D")}<div><strong>Per-client dashboards</strong><span>Unique shareable URL per client with a universal tracker.</span></div></div>
                        <div class="feature">${icon("P")}<div><strong>Privacy controls</strong><span>Toggle every public field before clients see the dashboard.</span></div></div>
                        <div class="feature">${icon("AI")}<div><strong>AI insights</strong><span>Plain-language synthesis of raw traffic and request activity.</span></div></div>
                        <div class="feature">${icon("A")}<div><strong>Autopilot queue</strong><span>Draft reports and actions, then approve or send.</span></div></div>
                    </div>
                </div>
                <div class="panel auth-card">
                    ${logo()}
                    <div class="tabs">
                        <button class="active" data-auth-tab="register">Register</button>
                        <button data-auth-tab="login">Sign in</button>
                    </div>
                    <form id="auth-form">
                        <div id="name-field" class="field"><label>Your name</label><input name="name" value="Flow Founder" required></div>
                        <div class="field"><label>Email</label><input name="email" type="email" value="founder@freelanceflow.app" required></div>
                        <div class="field"><label>Password</label><input name="password" type="password" value="prototype123" required></div>
                        <button class="primary-btn" style="width:100%;margin-top:14px" type="submit">Create account →</button>
                    </form>
                    <p class="muted" style="font-size:12px;text-align:center">Demo credentials are prefilled. After signing in, hit Seed data to explore.</p>
                    <div class="quick-roles">
                        <button data-quick-login="founder"><strong class="teal">Freelancer</strong><br><span class="muted mono">founder@freelanceflow.app</span></button>
                        <button data-quick-login="owner"><strong class="amber">Business Owner</strong><br><span class="muted mono">owner@demo.com</span></button>
                    </div>
                </div>
            </div>
        </section>`;
    wireAuth();
}

function wireAuth() {
    let mode = "register";
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
        button.addEventListener("click", () => {
            mode = button.dataset.authTab;
            document.querySelectorAll("[data-auth-tab]").forEach((b) => b.classList.toggle("active", b === button));
            document.querySelector("#name-field").classList.toggle("hide", mode === "login");
            document.querySelector("#auth-form button[type=submit]").textContent = mode === "login" ? "Sign in →" : "Create account →";
        });
    });
    document.querySelector("#auth-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
            const payload = Object.fromEntries(form.entries());
            const data = await req(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) });
            state.user = data.user;
            state.view = data.user.role === "owner" ? "owner" : "dashboard";
            showToast(`Welcome, ${data.user.name}.`);
            render();
        } catch (error) {
            showToast(error.message, "error");
        }
    });
    document.querySelectorAll("[data-quick-login]").forEach((button) => {
        button.addEventListener("click", async () => {
            const isOwner = button.dataset.quickLogin === "owner";
            try {
                const data = await req("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: isOwner ? "owner@demo.com" : "founder@freelanceflow.app",
                        password: isOwner ? "owner123" : "prototype123",
                    }),
                });
                state.user = data.user;
                state.view = data.user.role === "owner" ? "owner" : "dashboard";
                showToast(`Welcome, ${data.user.name}.`);
                render();
            } catch {
                showToast(isOwner ? "Owner account is created when you seed demo data." : "Register or seed demo data first.", "error");
            }
        });
    });
}

function renderShell() {
    const owner = state.user.role === "owner";
    const nav = owner
        ? [["owner", "Overview"], ["owner-finance", "Finance"], ["owner-invoices", "Invoices"], ["owner-budget", "Budget"], ["owner-security", "Security"], ["owner-bugs", "Bugs"], ["owner-uptime", "Uptime"], ["owner-requests", "Requests"]]
        : [["dashboard", "Dashboard"], ["intelligence", "Intelligence"], ["autopilot", "Autopilot"], ["reports", "Reports"]];
    $app.innerHTML = `
        <div class="app-shell">
            <header class="topbar">
                <div class="topbar-main">
                    ${logo()}
                    <nav class="nav-tabs">
                        ${nav.map(([key, label]) => `<button class="${state.view === key ? "active" : ""}" data-view="${key}">${label}</button>`).join("")}
                    </nav>
                    <div class="spacer"></div>
                    <button class="ghost-btn" id="theme-toggle">${state.theme === "dark" ? "Light" : "Dark"}</button>
                    ${owner ? "" : `<button class="ghost-btn" id="seed-btn">Seed data</button>`}
                    <div class="profile-chip"><span class="avatar">${esc(state.user.name.slice(0, 1).toUpperCase())}</span><span>${esc(state.user.name)}</span></div>
                    <button class="danger-btn" id="logout-btn">Switch Role</button>
                </div>
                ${owner ? "" : `<div class="telemetry" id="telemetry"></div>`}
            </header>
            <main class="main" id="main"></main>
            <footer class="footer">FreelanceFlow · Stage 1 live dashboards · Stage 2 autopilot</footer>
        </div>`;
    wireShell();
    loadView();
}

function wireShell() {
    document.querySelectorAll("[data-view]").forEach((button) => {
        button.addEventListener("click", () => {
            state.view = button.dataset.view;
            renderShell();
        });
    });
    document.querySelector("#theme-toggle").addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        localStorage.setItem("ff-theme", state.theme);
        document.documentElement.className = state.theme;
        renderShell();
    });
    document.querySelector("#logout-btn").addEventListener("click", async () => {
        await req("/api/auth/logout", { method: "POST" }).catch(() => {});
        state.user = null;
        state.clients = [];
        renderAuth();
    });
    const seed = document.querySelector("#seed-btn");
    if (seed) {
        seed.addEventListener("click", async () => {
            try {
                const data = await req("/api/seed", { method: "POST" });
                showToast(`Seeded ${data.seeded} new demo clients with live tracker data.`);
                await loadView();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }
}

async function loadView() {
    const main = document.querySelector("#main");
    main.innerHTML = `<div class="empty">Loading ${esc(state.view)}...</div>`;
    try {
        if (state.user.role === "owner") return renderOwnerView();
        await refreshStats();
        if (state.view === "dashboard") return renderDashboard();
        if (state.view === "intelligence") return renderIntelligence();
        if (state.view === "autopilot") return renderAutopilot();
        if (state.view === "reports") return renderReports();
        if (state.view === "client") return renderClient();
        if (state.view === "client-settings") return renderSettings();
        if (state.view === "client-requests") return renderRequests();
        if (state.view === "client-public") return renderPublic();
    } catch (error) {
        main.innerHTML = `<div class="empty critical">${esc(error.message)}</div>`;
    }
}

async function refreshStats() {
    state.stats = await req("/api/stats");
    const cells = [
        ["Autopilot", state.stats.autopilotEngaged ? "Engaged" : "Idle", state.stats.autopilotEngaged ? "teal" : ""],
        ["Hours saved", `${state.stats.hoursSaved}h`, "teal"],
        ["Auto-handled", state.stats.autoHandled, "teal"],
        ["Awaiting", state.stats.awaitingReview, state.stats.awaitingReview ? "amber" : ""],
        ["Insights", state.stats.insightCount, "amber"],
        ["Reports", state.stats.reportCount, "amber"],
        ["Events", state.stats.eventCount, ""],
        ["Requests", state.stats.pendingRequests, state.stats.pendingRequests ? "critical" : ""],
    ];
    const telemetry = document.querySelector("#telemetry");
    if (telemetry) telemetry.innerHTML = cells.map(([label, value, tone]) => `<div><span>${label}</span><b class="${tone}">${value}</b></div>`).join("");
}

async function loadClients() {
    const data = await req("/api/clients");
    state.clients = data.clients;
    return data.clients;
}

function viewHead(title, subtitle, actions = "") {
    return `<div class="view-head"><div><div class="section-label">FreelanceFlow</div><h2>${esc(title)}</h2><p class="muted">${esc(subtitle)}</p></div><div class="button-row">${actions}</div></div>`;
}

async function renderDashboard() {
    const clients = await loadClients();
    const main = document.querySelector("#main");
    main.innerHTML = `
        ${viewHead("Dashboard", "Client dashboards, tracker activity, and open project signals.", `<button class="primary-btn" id="new-client">New client</button>`)}
        <section class="grid">
            <div class="metric-card col-3"><span>Clients</span><strong>${state.stats.clientCount}</strong></div>
            <div class="metric-card col-3"><span>Events</span><strong>${state.stats.eventCount}</strong></div>
            <div class="metric-card col-3"><span>Pending requests</span><strong>${state.stats.pendingRequests}</strong></div>
            <div class="metric-card col-3"><span>Reports</span><strong>${state.stats.reportCount}</strong></div>
            <div class="panel col-8">
                <div class="split"><h3>Client portfolio</h3><button class="ghost-btn" id="refresh-dashboard">Refresh</button></div>
                <div class="list" style="margin-top:14px">
                    ${clients.length ? clients.map(clientCard).join("") : `<div class="empty">No clients yet. Seed demo data or create a client.</div>`}
                </div>
            </div>
            <form class="panel col-4" id="client-form">
                <h3>Add client</h3>
                <div class="field"><label>Name</label><input name="name" placeholder="Client name" required></div>
                <div class="field"><label>Contact email</label><input name="contactEmail" type="email" placeholder="client@example.com"></div>
                <div class="field"><label>Project title</label><input name="projectTitle" placeholder="Project title"></div>
                <div class="field"><label>Summary</label><textarea name="projectSummary" placeholder="What are you building?"></textarea></div>
                <button class="primary-btn" style="width:100%;margin-top:12px">Create dashboard</button>
            </form>
        </section>`;
    wireClientCards();
    document.querySelector("#client-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const res = await req("/api/clients", { method: "POST", body: JSON.stringify(data) });
        showToast(`${res.client.name} is ready.`);
        state.selectedClientId = res.client.id;
        state.selectedSlug = res.client.dashboardSlug;
        state.view = "client";
        renderShell();
    });
    document.querySelector("#refresh-dashboard").addEventListener("click", loadView);
    document.querySelector("#new-client").addEventListener("click", () => document.querySelector("[name=name]").focus());
}

function clientCard(client) {
    return `
        <article class="client-card" data-client="${esc(client.id)}" data-slug="${esc(client.dashboardSlug)}">
            <div class="split">
                <div><h3>${esc(client.name)}</h3><div class="muted">${esc(client.projectTitle || "Untitled project")}</div></div>
                <span class="pill teal">/${esc(client.dashboardSlug)}</span>
            </div>
            <p class="muted">${esc(client.projectSummary || "No summary yet.")}</p>
            <div class="stats-line">
                <span>${client.eventCount} events</span><span>${client.requestCount} requests</span><span>${client.insightCount} insights</span><span>${client.actionCount} actions</span>
            </div>
        </article>`;
}

function wireClientCards() {
    document.querySelectorAll("[data-client]").forEach((card) => {
        card.addEventListener("click", () => {
            state.selectedClientId = card.dataset.client;
            state.selectedSlug = card.dataset.slug;
            state.view = "client";
            renderShell();
        });
    });
}

async function currentClient() {
    if (!state.selectedClientId) {
        const clients = await loadClients();
        if (clients[0]) {
            state.selectedClientId = clients[0].id;
            state.selectedSlug = clients[0].dashboardSlug;
        }
    }
    if (!state.selectedClientId) return null;
    return req(`/api/clients/${state.selectedClientId}`);
}

async function renderClient() {
    const data = await currentClient();
    const main = document.querySelector("#main");
    if (!data) return main.innerHTML = `${viewHead("Client detail", "Pick or create a client first.")}<div class="empty">No client selected.</div>`;
    const m = data.metrics;
    main.innerHTML = `
        ${viewHead(data.client.name, data.client.projectSummary || "Live tracker and client workflow.", clientActions())}
        <section class="grid">
            <div class="metric-card col-3"><span>Total events</span><strong>${m.total}</strong></div>
            <div class="metric-card col-3"><span>Last 24h</span><strong>${m.last24h}</strong></div>
            <div class="metric-card col-3"><span>Last 7d</span><strong>${m.last7d}</strong></div>
            <div class="metric-card col-3"><span>Open requests</span><strong>${data.requests.filter((r) => r.status === "open").length}</strong></div>
            <div class="panel col-7">
                <h3>Traffic pulse</h3>
                <div class="chart-bars">${m.hourly.map((h) => `<i style="height:${Math.max(4, h.count * 11)}px"></i>`).join("")}</div>
            </div>
            <div class="panel col-5">
                <h3>Top pages</h3>
                <div class="list" style="margin-top:12px">${m.topPages.length ? m.topPages.map((p) => `<div class="list-item split"><strong>${esc(p.path || "/")}</strong><span class="pill teal">${p.count} visits</span></div>`).join("") : `<div class="empty">No traffic yet.</div>`}</div>
            </div>
            <div class="panel col-6">
                <h3>Recent events</h3>
                <table class="table"><thead><tr><th>Path</th><th>Type</th><th>Time</th></tr></thead><tbody>${data.events.slice(0, 8).map((e) => `<tr><td>${esc(e.path)}</td><td>${esc(e.eventType)}</td><td>${formatDate(e.createdAt)}</td></tr>`).join("")}</tbody></table>
            </div>
            <div class="panel col-6">
                <h3>Insights</h3>
                <div class="list" style="margin-top:12px">${data.insights.length ? data.insights.map((i) => `<div class="list-item"><strong>${esc(i.title)}</strong><span class="muted">${esc(i.body)}</span></div>`).join("") : `<div class="empty">Generate an insight to populate this panel.</div>`}</div>
            </div>
        </section>`;
    wireClientActions();
}

function clientActions() {
    return `
        <button class="ghost-btn" data-client-action="settings">Settings</button>
        <button class="ghost-btn" data-client-action="requests">Requests</button>
        <button class="ghost-btn" data-client-action="public">Public view</button>
        <button class="primary-btn" data-client-action="insight">Generate insight</button>`;
}

function wireClientActions() {
    document.querySelectorAll("[data-client-action]").forEach((button) => {
        button.addEventListener("click", async () => {
            const action = button.dataset.clientAction;
            if (action === "settings") state.view = "client-settings";
            if (action === "requests") state.view = "client-requests";
            if (action === "public") state.view = "client-public";
            if (action === "insight") {
                await req(`/api/insights/generate/${state.selectedClientId}`, { method: "POST" });
                showToast("Insight generated.");
                state.view = "client";
            }
            renderShell();
        });
    });
}

async function renderSettings() {
    const data = await currentClient();
    const fields = await req(`/api/clients/${data.client.id}/privacy`);
    document.querySelector("#main").innerHTML = `
        ${viewHead("Privacy settings", `Control what ${data.client.name} can see.`, `<button class="ghost-btn" data-back-client>Back</button>`)}
        <form class="panel" id="privacy-form">
            <div class="list">
                ${fields.fields.map((f) => `<label class="list-item split"><span><strong>${esc(f.label)}</strong><span class="muted">Visible on the public client dashboard.</span></span><input type="checkbox" name="${esc(f.key)}" ${f.visible ? "checked" : ""} style="width:auto;min-height:auto"></label>`).join("")}
            </div>
            <button class="primary-btn" style="margin-top:14px">Save privacy controls</button>
        </form>`;
    document.querySelector("[data-back-client]").addEventListener("click", () => { state.view = "client"; renderShell(); });
    document.querySelector("#privacy-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = {};
        fields.fields.forEach((f) => values[f.key] = event.currentTarget.elements[f.key].checked);
        await req(`/api/clients/${data.client.id}/privacy`, { method: "PATCH", body: JSON.stringify({ fields: values }) });
        showToast("Privacy settings saved.");
    });
}

async function renderRequests() {
    const data = await currentClient();
    document.querySelector("#main").innerHTML = `
        ${viewHead("Improvement requests", `Requests from ${data.client.name}.`, `<button class="ghost-btn" data-back-client>Back</button>`)}
        <section class="grid">
            <form class="panel col-4" id="request-form">
                <h3>New request</h3>
                <div class="field"><label>Message</label><textarea name="message" required></textarea></div>
                <button class="primary-btn" style="width:100%;margin-top:12px">Submit request</button>
            </form>
            <div class="panel col-8">
                <h3>Queue</h3>
                <div class="list" style="margin-top:12px">${data.requests.length ? data.requests.map((r) => `<div class="list-item split"><span><strong>${esc(r.message)}</strong><span class="muted">${formatDate(r.createdAt)}</span></span><button class="ghost-btn" data-resolve="${esc(r.id)}">${esc(r.status)}</button></div>`).join("") : `<div class="empty">No requests yet.</div>`}</div>
            </div>
        </section>`;
    document.querySelector("[data-back-client]").addEventListener("click", () => { state.view = "client"; renderShell(); });
    document.querySelector("#request-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        await req(`/api/clients/${data.client.id}/requests`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) });
        showToast("Request submitted.");
        renderRequests();
    });
    document.querySelectorAll("[data-resolve]").forEach((button) => button.addEventListener("click", async () => {
        await req(`/api/clients/${data.client.id}/requests/${button.dataset.resolve}/status`, { method: "PATCH", body: JSON.stringify({ status: "resolved" }) });
        showToast("Request resolved.");
        renderRequests();
    }));
}

async function renderPublic() {
    const data = await currentClient();
    const publicData = await req(`/api/public/${data.client.dashboardSlug}`);
    document.querySelector("#main").innerHTML = `
        ${viewHead("Public dashboard", `Shareable URL: /client/${data.client.dashboardSlug}`, `<button class="ghost-btn" data-back-client>Back</button>`)}
        <section class="grid">
            <div class="panel col-7">
                <h3>${esc(publicData.client.projectTitle || publicData.client.name)}</h3>
                <p class="muted">${esc(publicData.client.projectSummary || "A client-ready project dashboard.")}</p>
                <div class="grid">
                    <div class="metric-card col-4"><span>Total visits</span><strong>${publicData.metrics.total}</strong></div>
                    <div class="metric-card col-4"><span>Week</span><strong>${publicData.metrics.last7d}</strong></div>
                    <div class="metric-card col-4"><span>Today</span><strong>${publicData.metrics.last24h}</strong></div>
                </div>
            </div>
            <form class="panel col-5" id="public-request">
                <h3>Client request box</h3>
                <div class="field"><label>Request</label><textarea name="message" placeholder="What should be improved?" required></textarea></div>
                <button class="primary-btn" style="width:100%;margin-top:12px">Send request</button>
            </form>
        </section>`;
    document.querySelector("[data-back-client]").addEventListener("click", () => { state.view = "client"; renderShell(); });
    document.querySelector("#public-request").addEventListener("submit", async (event) => {
        event.preventDefault();
        await req(`/api/public/${data.client.dashboardSlug}/request`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) });
        showToast("Public request submitted.");
        event.currentTarget.reset();
    });
}

async function renderIntelligence() {
    const clients = await loadClients();
    const details = await Promise.all(clients.map((c) => req(`/api/clients/${c.id}`)));
    const insights = details.flatMap((d) => d.insights.map((i) => ({ ...i, clientName: d.client.name })));
    document.querySelector("#main").innerHTML = `
        ${viewHead("Intelligence", "AI-style summaries generated from tracker and request activity.", clients[0] ? `<button class="primary-btn" id="gen-all">Generate for first client</button>` : "")}
        <div class="list">${insights.length ? insights.map((i) => `<div class="list-item"><span class="pill amber">${esc(i.clientName)}</span><strong>${esc(i.title)}</strong><span class="muted">${esc(i.body)}</span></div>`).join("") : `<div class="empty">No insights yet. Open a client and generate one.</div>`}</div>`;
    const button = document.querySelector("#gen-all");
    if (button) button.addEventListener("click", async () => {
        await req(`/api/insights/generate/${clients[0].id}`, { method: "POST" });
        showToast("Insight generated.");
        renderIntelligence();
    });
}

async function renderAutopilot() {
    const data = await req("/api/autopilot");
    document.querySelector("#main").innerHTML = `
        ${viewHead("Autopilot", "Draft actions that wait for freelancer approval.", `<button class="primary-btn" id="run-autopilot">Run autopilot</button>`)}
        <div class="list">${data.actions.length ? data.actions.map((a) => `<div class="list-item split"><span><span class="pill amber">${esc(a.clientName || "Client")}</span><strong>${esc(a.title)}</strong><span class="muted">${esc(a.detail)}</span></span><button class="ghost-btn" data-action="${esc(a.id)}">${esc(a.status)}</button></div>`).join("") : `<div class="empty">No actions yet. Run autopilot to draft a queue.</div>`}</div>`;
    document.querySelector("#run-autopilot").addEventListener("click", async () => {
        const res = await req("/api/autopilot", { method: "POST" });
        showToast(`Created ${res.created.length} autopilot actions.`);
        renderAutopilot();
    });
    document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", async () => {
        await req(`/api/autopilot/${button.dataset.action}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
        showToast("Action approved.");
        renderAutopilot();
    }));
}

async function renderReports() {
    const [reports, clients] = await Promise.all([req("/api/reports"), loadClients()]);
    document.querySelector("#main").innerHTML = `
        ${viewHead("Reports", "Draft, approve, and send client-facing summaries.")}
        <section class="grid">
            <form class="panel col-4" id="report-form">
                <h3>Draft report</h3>
                <div class="field"><label>Client</label><select name="clientId">${clients.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}</select></div>
                <div class="field"><label>Period</label><input name="period" value="This week"></div>
                <button class="primary-btn" style="width:100%;margin-top:12px">Draft report</button>
            </form>
            <div class="panel col-8">
                <h3>Report library</h3>
                <div class="list" style="margin-top:12px">${reports.reports.length ? reports.reports.map((r) => `<div class="list-item"><span class="pill teal">${esc(r.clientName || "Client")}</span><strong>${esc(r.title)}</strong><span class="muted">${esc(r.period)} · ${esc(r.status)}</span><pre class="muted" style="white-space:pre-wrap;margin:0">${esc(r.bodyMd)}</pre></div>`).join("") : `<div class="empty">No reports yet.</div>`}</div>
            </div>
        </section>`;
    document.querySelector("#report-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        await req("/api/reports", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) });
        showToast("Report drafted.");
        renderReports();
    });
}

async function renderOwnerView() {
    const stats = await req("/api/owner/stats");
    const titleMap = {
        "owner": "Owner overview",
        "owner-finance": "Finance",
        "owner-invoices": "Invoices",
        "owner-budget": "Budget",
        "owner-security": "Security",
        "owner-bugs": "Bugs",
        "owner-uptime": "Uptime",
        "owner-requests": "Requests",
    };
    document.querySelector("#main").innerHTML = `
        ${viewHead(titleMap[state.view] || "Owner overview", "Business owner command center translated from the prototype.")}
        <section class="grid">
            <div class="metric-card col-3"><span>Security score</span><strong style="color:${stats.securityScore.color}">${esc(stats.securityScore.grade)}</strong></div>
            <div class="metric-card col-3"><span>Revenue</span><strong>$${Number(stats.revenue).toLocaleString()}</strong></div>
            <div class="metric-card col-3"><span>Expenses</span><strong>$${Number(stats.expenses).toLocaleString()}</strong></div>
            <div class="metric-card col-3"><span>Uptime</span><strong>${stats.uptime}%</strong></div>
            <div class="panel col-7">
                <h3>${esc(titleMap[state.view] || "Overview")} board</h3>
                <p class="muted">This Laravel/Blade owner area preserves the prototype’s operational surfaces: finance, invoices, budget, security, bugs, uptime, and client requests.</p>
                <div class="list">
                    <div class="list-item"><strong>Open bugs</strong><span class="muted">${stats.openBugs} active bug/security items need review.</span></div>
                    <div class="list-item"><strong>Cash position</strong><span class="muted">Revenue and expenses are aggregated from seeded financial records.</span></div>
                    <div class="list-item"><strong>Operational posture</strong><span class="muted">Uptime and security score reflect owner-facing monitoring.</span></div>
                </div>
            </div>
            <div class="panel col-5">
                <h3>Owner navigation</h3>
                <p class="muted">Use the top navigation to move between owner modules without leaving the app shell.</p>
                <div class="chart-bars">${[8, 12, 10, 16, 14, 20, 18, 23, 19, 25, 24, 28].map((n) => `<i style="height:${n * 4}px"></i>`).join("")}</div>
            </div>
        </section>`;
}

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

bootstrap();
