/*
  DOCVAULT
  GitHub folders = Website folders
  Built-in PDF preview

  CHANGE THESE:
*/

const GITHUB_OWNER="siddhucreation";
const GITHUB_REPO="Notes";
const GITHUB_PATH="documents";
const BRANCH="main";


/* =========================
   LOGIN ACCOUNTS
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


/* =========================
   APP
========================= */

const app = document.getElementById("app");


/* =========================
   HTML ESCAPE
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

                    <span class="logoIcon">
                        ▣
                    </span>

                    DocVault

                </div>

                <p class="muted">
                    Simple document access portal
                </p>


                <div class="field">

                    <label>
                        User ID
                    </label>

                    <input
                        id="uid"
                        placeholder="Enter User ID"
                        autocomplete="username"
                    >

                </div>


                <div class="field">

                    <label>
                        Password
                    </label>

                    <input
                        id="pwd"
                        type="password"
                        placeholder="Enter Password"
                        autocomplete="current-password"
                        onkeydown="if(event.key==='Enter') login()"
                    >

                </div>


                <button
                    class="primary loginBtn"
                    onclick="login()"
                >
                    Sign in
                </button>


                <div
                    id="error"
                    class="error"
                ></div>

            </section>

        </main>

    `;

}


/* =========================
   LOGIN
========================= */

function login() {

    const id =
        document.getElementById("uid")
        .value
        .trim();

    const password =
        document.getElementById("pwd")
        .value;


    if (
        !ACCOUNTS[id] ||
        ACCOUNTS[id].password !== password
    ) {

        document.getElementById("error")
            .textContent =
            "Invalid User ID or Password.";

        return;

    }


    role =
        ACCOUNTS[id].role;


    sessionStorage.setItem(
        "docvault_role",
        role
    );


    currentPath =
        GITHUB_PATH;


    showManager();

}


/* =========================
   LOGOUT
========================= */

function logout() {

    sessionStorage.removeItem(
        "docvault_role"
    );

    location.reload();

}


/* =========================
   MAIN FILE MANAGER
========================= */

function showManager() {

    app.innerHTML = `

        <div>

            <header class="top">


                <div
                    class="logo"
                    style="font-size:20px"
                >

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

                        ${
                            role === "admin"
                            ? "Admin"
                            : "Read only"
                        }

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

                        <h1>
                            Documents
                        </h1>

                        <div class="muted">
                            Browse your documents
                            and folders.
                        </div>

                    </div>

                </div>


                <div class="notice">

                    ${
                        role === "admin"

                        ?

                        "Admin portal. Manage folders and files directly in GitHub."

                        :

                        "Read-only access. You can open folders, preview PDFs and download documents."

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
   GITHUB API URL
========================= */

function getGitHubAPIURL(path) {

    const encodedPath = path
        .split("/")
        .filter(Boolean)
        .map(
            part => encodeURIComponent(part)
        )
        .join("/");


    return (
        "https://api.github.com/repos/" +

        encodeURIComponent(
            GITHUB_OWNER
        ) +

        "/" +

        encodeURIComponent(
            GITHUB_REPO
        ) +

        "/contents/" +

        encodedPath +

        "?ref=" +

        encodeURIComponent(
            BRANCH
        )
    );

}


/* =========================
   LOAD FOLDER
========================= */

async function loadFolder() {

    const grid =
        document.getElementById("grid");


    drawBreadcrumb();


    if (
        GITHUB_OWNER ===
        "YOUR_GITHUB_USERNAME" ||

        GITHUB_REPO ===
        "YOUR_REPOSITORY"
    ) {

        grid.innerHTML = `

            <div class="empty">

                Please configure
                GitHub settings in
                <b>app.js</b>.

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

        const response =
            await fetch(
                getGitHubAPIURL(
                    currentPath
                ),
                {
                    headers: {
                        "Accept":
                        "application/vnd.github+json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "GitHub API error: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "This path is not a folder."
            );

        }


        currentItems =
            data;


        drawFiles(data);


        drawBreadcrumb();


    }

    catch (error) {

        grid.innerHTML = `

            <div class="empty">

                Could not load this folder.

                <br><br>

                <small>
                    ${escapeHTML(
                        error.message
                    )}
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

    const grid =
        document.getElementById("grid");


    const searchInput =
        document.getElementById("search");


    const search =
        searchInput
        ?
        searchInput.value
            .toLowerCase()
            .trim()
        :
        "";


    const filtered =
        items

        .filter(item =>
            item.name
                .toLowerCase()
                .includes(search)
        )

        .sort((a, b) => {

            if (
                a.type === "dir" &&
                b.type !== "dir"
            )
                return -1;


            if (
                a.type !== "dir" &&
                b.type === "dir"
            )
                return 1;


            return a.name
                .localeCompare(
                    b.name
                );

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
            document.createElement(
                "article"
            );


        card.className = "item";


        const isFolder =
            item.type === "dir";


        card.innerHTML = `

            <div>

                <div class="icon">

                    ${
                        isFolder
                        ? "📁"
                        : "📄"
                    }

                </div>


                <div
                    class="name"
                    title="${escapeHTML(
                        item.name
                    )}"
                >

                    ${escapeHTML(
                        item.name
                    )}

                </div>


                <div class="meta">

                    ${
                        isFolder
                        ? "Folder"
                        : "PDF / Document"
                    }

                </div>

            </div>


            <div class="actions">

                ${
                    isFolder

                    ?

                    `
                    <button
                        class="mini"
                        onclick="openFolder('${escapeHTML(item.path)}')"
                    >
                        Open
                    </button>
                    `

                    :

                    `
                    <button
                        class="mini"
                        onclick="previewFile('${escapeHTML(item.path)}')"
                    >
                        Preview
                    </button>

                    <button
                        class="mini"
                        onclick="downloadFile('${escapeHTML(item.path)}')"
                    >
                        Download
                    </button>
                    `

                }

            </div>

        `;


        grid.appendChild(card);

    });

}


/* =========================
   OPEN FOLDER
========================= */

function openFolder(path) {

    currentPath =
        path;


    document.getElementById(
        "search"
    ).value = "";


    loadFolder();

}


/* =========================
   GET RAW GITHUB FILE URL
========================= */

function getRawFileURL(path) {

    return (
        "https://raw.githubusercontent.com/" +

        encodeURIComponent(
            GITHUB_OWNER
        ) +

        "/" +

        encodeURIComponent(
            GITHUB_REPO
        ) +

        "/" +

        encodeURIComponent(
            BRANCH
        ) +

        "/" +

        path
            .split("/")
            .map(
                part =>
                encodeURIComponent(part)
            )
            .join("/")
    );

}


/* =========================
   PDF PREVIEW
========================= */

function previewFile(path) {

    const fileName =
        path
            .split("/")
            .pop();


    const lower =
        fileName
            .toLowerCase();


    if (!lower.endsWith(".pdf")) {

        alert(
            "Built-in preview is currently available for PDF files."
        );

        return;

    }


    const pdfURL =
        getRawFileURL(path);


    app.innerHTML = `

        <div>

            <header class="top">

                <div
                    class="logo"
                    style="font-size:20px"
                >

                    <span
                        class="logoIcon"
                        style="width:35px;height:35px"
                    >
                        ▣
                    </span>

                    DocVault

                </div>


                <div class="right">

                    <button
                        class="logout"
                        onclick="showManager()"
                    >
                        ← Back
                    </button>

                </div>

            </header>


            <main
                class="main"
                style="max-width:1200px"
            >

                <div
                    class="heading"
                    style="align-items:center"
                >

                    <div>

                        <h1>
                            ${escapeHTML(
                                fileName
                            )}
                        </h1>

                        <div class="muted">
                            PDF Preview
                        </div>

                    </div>


                    <div class="tools">

                        <button
                            class="secondary"
                            onclick="showManager()"
                        >
                            Back
                        </button>


                        <a
                            href="${pdfURL}"
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            style="text-decoration:none"
                        >

                            <button class="action">
                                Download
                            </button>

                        </a>

                    </div>

                </div>


                <div
                    style="
                        background:#fff;
                        border:1px solid #e4e7ee;
                        border-radius:16px;
                        overflow:hidden;
                        height:calc(100vh - 190px);
                        min-height:500px;
                    "
                >

                    <iframe
                        src="${pdfURL}#toolbar=1&navpanes=0&view=FitH"
                        title="PDF Preview"
                        style="
                            width:100%;
                            height:100%;
                            border:0;
                        "
                    ></iframe>

                </div>

            </main>

        </div>

    `;

}


/* =========================
   DOWNLOAD
========================= */

function downloadFile(path) {

    const url =
        getRawFileURL(path);


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.target = "_blank";

    link.rel =
        "noopener noreferrer";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();

}


/* =========================
   SEARCH
========================= */

function filterFiles() {

    drawFiles(
        currentItems
    );

}


/* =========================
   BREADCRUMB
========================= */

function drawBreadcrumb() {

    const breadcrumb =
        document.getElementById(
            "breadcrumb"
        );


    if (!breadcrumb)
        return;


    breadcrumb.innerHTML = "";


    const home =
        document.createElement(
            "span"
        );


    home.textContent =
        "Home";


    home.onclick =
        function () {

            currentPath =
                GITHUB_PATH;


            document.getElementById(
                "search"
            ).value = "";


            loadFolder();

        };


    breadcrumb.appendChild(
        home
    );


    const baseParts =
        GITHUB_PATH
            .split("/")
            .filter(Boolean);


    const currentParts =
        currentPath
            .split("/")
            .filter(Boolean);


    const remaining =
        currentParts.slice(
            baseParts.length
        );


    let builtPath =
        GITHUB_PATH;


    remaining.forEach(
        folder => {

            const separator =
                document.createElement(
                    "b"
                );


            separator.textContent =
                "/";


            breadcrumb.appendChild(
                separator
            );


            builtPath +=
                "/" + folder;


            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                folder;


            const selectedPath =
                builtPath;


            span.onclick =
                function () {

                    currentPath =
                        selectedPath;


                    document.getElementById(
                        "search"
                    ).value = "";


                    loadFolder();

                };


            breadcrumb.appendChild(
                span
            );

        }
    );

}


/* =========================
   START APP
========================= */

if (role) {

    showManager();

}
else {

    showLogin();

}
