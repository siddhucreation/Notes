/*
  DocVault — GitHub folders = website folders

  CHANGE THESE:
*/
const GITHUB_OWNER="siddhucreation";
const GITHUB_REPO="Notes";
const GITHUB_PATH="documents";
const BRANCH="main";


/* =========================
   LOGIN
========================= */

const ACCOUNTS = {
    user: {
        password: "user123",
        role: "user"
    },

    admin: {
        password: "admin123",
        role: "admin"
    }
};

let role = sessionStorage.getItem("docvault_role") || "";
let currentPath = GITHUB_PATH;
let currentItems = [];

const app = document.getElementById("app");


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}


/* =========================
   LOGIN PAGE
========================= */

function showLogin() {

    app.innerHTML = `
        <main class="login">

            <section class="card">

                <div class="logo">
                    <span class="logoIcon">▣</span>
                    DocVault
                </div>

                <p class="muted">
                    Simple document access portal
                </p>

                <div class="field">
                    <label>User ID</label>
                    <input
                        id="uid"
                        placeholder="Enter User ID"
                        autocomplete="username"
                    >
                </div>

                <div class="field">
                    <label>Password</label>
                    <input
                        id="pwd"
                        type="password"
                        placeholder="Enter Password"
                        autocomplete="current-password"
                    >
                </div>

                <button
                    class="primary loginBtn"
                    onclick="login()"
                >
                    Sign in
                </button>

                <div id="error" class="error"></div>

            </section>

        </main>
    `;
}


/* =========================
   LOGIN
========================= */

function login() {

    const id = document.getElementById("uid").value.trim();
    const password = document.getElementById("pwd").value;

    if (
        !ACCOUNTS[id] ||
        ACCOUNTS[id].password !== password
    ) {

        document.getElementById("error").textContent =
            "Invalid User ID or Password.";

        return;
    }

    role = ACCOUNTS[id].role;

    sessionStorage.setItem(
        "docvault_role",
        role
    );

    currentPath = GITHUB_PATH;

    showManager();
}


/* =========================
   LOGOUT
========================= */

function logout() {

    sessionStorage.removeItem("docvault_role");

    location.reload();
}


/* =========================
   MAIN PAGE
========================= */

function showManager() {

    app.innerHTML = `

        <div>

            <header class="top">

                <div class="logo" style="font-size:20px">

                    <span
                        class="logoIcon"
                        style="width:35px;height:35px"
                    >
                        ▣
                    </span>

                    DocVault

                </div>

                <div class="right">

                    <span class="badge">
                        ${role === "admin" ? "Admin" : "Read only"}
                    </span>

                    <button
                        class="logout"
                        onclick="logout()"
                    >
                        Sign out
                    </button>

                </div>

            </header>


            <main class="main">

                <div class="heading">

                    <div>

                        <h1>Documents</h1>

                        <div class="muted">
                            Folders and files are loaded directly from GitHub.
                        </div>

                    </div>

                </div>


                <div class="notice">

                    ${
                        role === "admin"
                        ?
                        "Admin portal. Manage folders and files directly in GitHub."
                        :
                        "Read-only access. You can open folders and view/download documents."
                    }

                </div>


                <div class="searchBox">

                    <input
                        id="search"
                        class="search"
                        placeholder="Search this folder..."
                        oninput="filterFiles()"
                    >

                </div>


                <div
                    id="breadcrumb"
                    class="crumb"
                ></div>


                <div
                    id="grid"
                    class="grid"
                >

                    <div class="empty">
                        Loading...
                    </div>

                </div>

            </main>

        </div>
    `;

    loadFolder();
}


/* =========================
   CREATE GITHUB API URL
========================= */

function getGitHubAPIURL(path) {

    let encodedPath = path
        .split("/")
        .filter(Boolean)
        .map(part => encodeURIComponent(part))
        .join("/");

    return (
        "https://api.github.com/repos/" +
        encodeURIComponent(GITHUB_OWNER) +
        "/" +
        encodeURIComponent(GITHUB_REPO) +
        "/contents/" +
        encodedPath +
        "?ref=" +
        encodeURIComponent(BRANCH)
    );
}


/* =========================
   LOAD FOLDER
========================= */

async function loadFolder() {

    const grid = document.getElementById("grid");

    drawBreadcrumb();

    if (
        GITHUB_OWNER === "YOUR_GITHUB_USERNAME" ||
        GITHUB_REPO === "YOUR_REPOSITORY"
    ) {

        grid.innerHTML = `
            <div class="empty">
                Please set your GitHub username
                and repository name in app.js.
            </div>
        `;

        return;
    }


    grid.innerHTML = `
        <div class="empty">
            Loading GitHub files...
        </div>
    `;


    try {

        const response = await fetch(
            getGitHubAPIURL(currentPath),
            {
                headers: {
                    "Accept": "application/vnd.github+json"
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "GitHub API error: " + response.status
            );

        }


        const data = await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "This path is not a folder."
            );

        }


        currentItems = data;

        drawFiles(data);

        drawBreadcrumb();

    }

    catch (error) {

        grid.innerHTML = `
            <div class="empty">

                Could not load this folder.

                <br><br>

                <small>
                    ${escapeHTML(error.message)}
                </small>

                <br><br>

                <button
                    class="mini"
                    onclick="loadFolder()"
                >
                    Retry
                </button>

            </div>
        `;

    }
}


/* =========================
   DISPLAY FILES
========================= */

function drawFiles(items) {

    const grid = document.getElementById("grid");

    const searchInput =
        document.getElementById("search");

    const search =
        searchInput
        ?
        searchInput.value.toLowerCase().trim()
        :
        "";


    const filtered = items
        .filter(item =>
            item.name.toLowerCase().includes(search)
        )
        .sort((a, b) => {

            if (a.type === "dir" && b.type !== "dir")
                return -1;

            if (a.type !== "dir" && b.type === "dir")
                return 1;

            return a.name.localeCompare(b.name);

        });


    if (filtered.length === 0) {

        grid.innerHTML = `
            <div class="empty">
                No files or folders found.
            </div>
        `;

        return;
    }


    grid.innerHTML = "";


    filtered.forEach(item => {

        const card =
            document.createElement("article");

        card.className = "item";


        const isFolder =
            item.type === "dir";


        card.innerHTML = `

            <div>

                <div class="icon">
                    ${isFolder ? "📁" : "📄"}
                </div>

                <div
                    class="name"
                    title="${escapeHTML(item.name)}"
                >
                    ${escapeHTML(item.name)}
                </div>

                <div class="meta">
                    ${isFolder ? "Folder" : "Document"}
                </div>

            </div>


            <div class="actions">

                <button class="mini">

                    ${
                        isFolder
                        ?
                        "Open"
                        :
                        "View / Download"
                    }

                </button>

            </div>

        `;


        const button =
            card.querySelector("button");


        if (isFolder) {

            button.onclick = function () {

                /*
                  THIS IS THE IMPORTANT FIX.

                  Use the exact path returned
                  by GitHub.
                */

                currentPath = item.path;

                document.getElementById("search").value = "";

                loadFolder();

            };

        }

        else {

            button.onclick = function () {

                openFile(item);

            };

        }


        grid.appendChild(card);

    });
}


/* =========================
   OPEN FILE
========================= */

function openFile(item) {

    let url =
        item.download_url;


    if (!url) {

        url =
            "https://github.com/" +
            GITHUB_OWNER +
            "/" +
            GITHUB_REPO +
            "/blob/" +
            BRANCH +
            "/" +
            item.path;

    }


    window.open(
        url,
        "_blank"
    );
}


/* =========================
   SEARCH
========================= */

function filterFiles() {

    drawFiles(currentItems);

}


/* =========================
   BREADCRUMB
========================= */

function drawBreadcrumb() {

    const breadcrumb =
        document.getElementById("breadcrumb");

    if (!breadcrumb)
        return;


    breadcrumb.innerHTML = "";


    const home =
        document.createElement("span");

    home.textContent = "Home";

    home.onclick = function () {

        currentPath = GITHUB_PATH;

        document.getElementById("search").value = "";

        loadFolder();

    };


    breadcrumb.appendChild(home);


    if (!currentPath)
        return;


    const base =
        GITHUB_PATH
            .split("/")
            .filter(Boolean);


    const current =
        currentPath
            .split("/")
            .filter(Boolean);


    const remaining =
        current.slice(base.length);


    let builtPath =
        GITHUB_PATH;


    remaining.forEach(folder => {

        const separator =
            document.createElement("b");

        separator.textContent = "/";

        breadcrumb.appendChild(separator);


        builtPath += "/" + folder;


        const span =
            document.createElement("span");

        span.textContent = folder;


        const pathForClick =
            builtPath;


        span.onclick = function () {

            currentPath =
                pathForClick;

            document.getElementById("search").value = "";

            loadFolder();

        };


        breadcrumb.appendChild(span);

    });

}


/* =========================
   START
========================= */

if (role) {

    showManager();

}
else {

    showLogin();

}
