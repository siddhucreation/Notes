/*
=========================================================
 DOCVAULT
 GitHub Folder = Website Folder
=========================================================

 GitHub:
 https://github.com/siddhucreation/Notes

 Structure:

 Notes
 └── documents
      ├── Folder 1
      │    └── file.pdf
      ├── Folder 2
      │    └── file.pdf
      └── notes.pdf

=========================================================
*/


/* ======================================================
   GITHUB SETTINGS
====================================================== */

const GITHUB_OWNER = "siddhucreation";
const GITHUB_REPO = "Notes";
const GITHUB_PATH = "documents";
const BRANCH = "main";


/* ======================================================
   LOGIN DETAILS
====================================================== */

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


/* ======================================================
   APP VARIABLES
====================================================== */

let role =
    sessionStorage.getItem("docvault_role") || "";

let currentPath =
    GITHUB_PATH;

let currentItems = [];

const app =
    document.getElementById("app");


/* ======================================================
   HTML ESCAPE
====================================================== */

function escapeHTML(text) {

    return String(text).replace(
        /[&<>"']/g,

        function (character) {

            return {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[character];

        }

    );

}


/* ======================================================
   LOGIN SCREEN
====================================================== */

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
                    Document Access Portal
                </p>


                <div class="field">

                    <label>
                        User ID
                    </label>

                    <input
                        id="uid"
                        type="text"
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
                        onkeydown="
                            if(event.key === 'Enter'){
                                login();
                            }
                        "
                    >

                </div>


                <button
                    class="primary loginBtn"
                    onclick="login()"
                >

                    Sign In

                </button>


                <div
                    id="error"
                    class="error"
                ></div>

            </section>

        </main>

    `;

}


/* ======================================================
   LOGIN
====================================================== */

function login() {

    const id =
        document
            .getElementById("uid")
            .value
            .trim();

    const password =
        document
            .getElementById("pwd")
            .value;


    if (
        !ACCOUNTS[id] ||
        ACCOUNTS[id].password !== password
    ) {

        document
            .getElementById("error")
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


/* ======================================================
   LOGOUT
====================================================== */

function logout() {

    sessionStorage.removeItem(
        "docvault_role"
    );

    location.reload();

}


/* ======================================================
   MAIN FILE MANAGER
====================================================== */

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
                        style="
                            width:35px;
                            height:35px;
                        "
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
                                : "Read Only"
                        }

                    </span>


                    <button
                        class="logout"
                        onclick="logout()"
                    >

                        Sign Out

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
                            Browse folders and documents
                        </div>

                    </div>

                </div>


                <div class="notice">

                    ${
                        role === "admin"

                        ?

                        "Admin portal — manage your files and folders directly from GitHub."

                        :

                        "Read-only access — view and download available documents."

                    }

                </div>


                <div class="searchBox">

                    <input
                        id="search"
                        class="search"
                        type="text"
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

                        Loading documents...

                    </div>

                </div>


            </main>

        </div>

    `;


    loadFolder();

}


/* ======================================================
   GITHUB API URL
====================================================== */

function getGitHubAPIURL(path) {

    const encodedPath =
        path
            .split("/")
            .filter(Boolean)
            .map(
                part =>
                    encodeURIComponent(part)
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


/* ======================================================
   RAW FILE URL
====================================================== */

function getRawFileURL(path) {

    const encodedPath =
        path
            .split("/")
            .filter(Boolean)
            .map(
                part =>
                    encodeURIComponent(part)
            )
            .join("/");


    return (

        "https://raw.githubusercontent.com/" +

        GITHUB_OWNER +

        "/" +

        GITHUB_REPO +

        "/" +

        BRANCH +

        "/" +

        encodedPath

    );

}


/* ======================================================
   LOAD CURRENT FOLDER
====================================================== */

async function loadFolder() {

    const grid =
        document.getElementById("grid");


    if (!grid) {
        return;
    }


    drawBreadcrumb();


    grid.innerHTML = `

        <div class="empty">

            Loading documents...

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
                "The selected path is not a folder."
            );

        }


        currentItems =
            data;


        drawFiles(
            currentItems
        );


        drawBreadcrumb();

    }

    catch (error) {

        console.error(
            "GitHub error:",
            error
        );


        grid.innerHTML = `

            <div class="empty">

                <strong>
                    Unable to load documents
                </strong>

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


/* ======================================================
   DISPLAY FILES AND FOLDERS
====================================================== */

function drawFiles(items) {

    const grid =
        document.getElementById("grid");


    const searchElement =
        document.getElementById("search");


    const search =
        searchElement
            ? searchElement.value
                .toLowerCase()
                .trim()
            : "";


    const filtered =
        items
            .filter(
                item =>
                    item.name
                        .toLowerCase()
                        .includes(search)
            )
            .sort(
                (a, b) => {

                    if (
                        a.type === "dir" &&
                        b.type !== "dir"
                    ) {

                        return -1;

                    }


                    if (
                        a.type !== "dir" &&
                        b.type === "dir"
                    ) {

                        return 1;

                    }


                    return a.name
                        .localeCompare(
                            b.name
                        );

                }
            );


    if (
        filtered.length === 0
    ) {

        grid.innerHTML = `

            <div class="empty">

                No files or folders found.

            </div>

        `;

        return;

    }


    grid.innerHTML = "";


    filtered.forEach(
        item => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "item";


            const isFolder =
                item.type === "dir";


            const icon =
                isFolder
                    ? "📁"
                    : getFileIcon(
                        item.name
                    );


            card.innerHTML = `

                <div>

                    <div class="icon">

                        ${icon}

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
                                : getFileType(
                                    item.name
                                )
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
                                onclick="openFolder('${escapeHTML(
                                    item.path
                                )}')"
                            >

                                Open

                            </button>

                        `

                        :

                        `

                            <button
                                class="mini"
                                onclick="previewFile('${escapeHTML(
                                    item.path
                                )}')"
                            >

                                Preview

                            </button>


                            <button
                                class="mini"
                                onclick="downloadFile('${escapeHTML(
                                    item.path
                                )}')"
                            >

                                Download

                            </button>

                        `

                    }

                </div>

            `;


            grid.appendChild(
                card
            );

        }
    );

}


/* ======================================================
   FILE ICON
====================================================== */

function getFileIcon(name) {

    const extension =
        name
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf")
        return "📕";


    if (
        extension === "doc" ||
        extension === "docx"
    )
        return "📘";


    if (
        extension === "ppt" ||
        extension === "pptx"
    )
        return "📙";


    if (
        extension === "xls" ||
        extension === "xlsx"
    )
        return "📗";


    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "webp"
    )
        return "🖼️";


    if (
        extension === "zip" ||
        extension === "rar"
    )
        return "🗜️";


    return "📄";

}


/* ======================================================
   FILE TYPE
====================================================== */

function getFileType(name) {

    const extension =
        name
            .split(".")
            .pop()
            .toUpperCase();


    return extension + " Document";

}


/* ======================================================
   OPEN FOLDER
====================================================== */

function openFolder(path) {

    currentPath =
        path;


    const search =
        document.getElementById(
            "search"
        );


    if (search) {

        search.value = "";

    }


    loadFolder();

}


/* ======================================================
   PDF PREVIEW
====================================================== */

function previewFile(path) {

    const fileName =
        path
            .split("/")
            .pop();


    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();


    /*
      PDF PREVIEW
    */

    if (extension === "pdf") {

        showPDFViewer(
            path,
            fileName
        );

        return;

    }


    /*
      OTHER FILE TYPES
    */

    const fileURL =
        getRawFileURL(
            path
        );


    window.open(
        fileURL,
        "_blank",
        "noopener,noreferrer"
    );

}


/* ======================================================
   PDF VIEWER
====================================================== */

function showPDFViewer(
    path,
    fileName
) {

    const pdfURL =
        getRawFileURL(
            path
        );


    app.innerHTML = `

        <div class="pdfPage">


            <header class="top">

                <div
                    class="logo"
                    style="font-size:20px"
                >

                    <span
                        class="logoIcon"
                        style="
                            width:35px;
                            height:35px;
                        "
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
                style="
                    max-width:1300px;
                "
            >


                <div
                    class="heading"
                    style="
                        align-items:center;
                    "
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


                    <div
                        class="tools"
                    >

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
                            style="
                                text-decoration:none;
                            "
                        >

                            <button
                                class="primary"
                            >

                                Download

                            </button>

                        </a>

                    </div>

                </div>


                <div
                    style="
                        width:100%;
                        height:calc(100vh - 190px);
                        min-height:500px;
                        background:#525659;
                                  
