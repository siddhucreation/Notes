/* =========================================================
   DOCVAULT
   GitHub-based document file manager
   ========================================================= */


/* =========================================================
   GITHUB CONFIGURATION
   ========================================================= */

const GITHUB_OWNER = "siddhucreation";
const GITHUB_REPO = "Notes";
const GITHUB_PATH = "documents";
const BRANCH = "main";


/* =========================================================
   LOGIN ACCOUNTS
   Change passwords here whenever you want.
   ========================================================= */

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


/* =========================================================
   APP VARIABLES
   ========================================================= */

let role = sessionStorage.getItem("docvault_role") || "";

let currentPath = GITHUB_PATH;

let currentItems = [];


/* =========================================================
   GET APP ELEMENT
   ========================================================= */

const app = document.getElementById("app");


/* =========================================================
   SAFETY FUNCTION
   ========================================================= */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const characters = {

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        };

        return characters[character];

    });

}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

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
                        onkeydown="if(event.key === 'Enter') login()"
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


/* =========================================================
   LOGIN
   ========================================================= */

function login() {

    const userId =
        document.getElementById("uid").value.trim();

    const password =
        document.getElementById("pwd").value;


    if (
        !ACCOUNTS[userId] ||
        ACCOUNTS[userId].password !== password
    ) {

        const error =
            document.getElementById("error");

        if (error) {

            error.textContent =
                "Invalid User ID or Password.";

        }

        return;

    }


    role =
        ACCOUNTS[userId].role;


    sessionStorage.setItem(
        "docvault_role",
        role
    );


    currentPath =
        GITHUB_PATH;


    showManager();

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    sessionStorage.removeItem(
        "docvault_role"
    );

    role = "";

    location.reload();

}


/* =========================================================
   MAIN FILE MANAGER
   ========================================================= */

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

                        "Admin portal — manage folders and files directly from GitHub."

                        :

                        "Read-only access — view and preview available documents."

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


/* =========================================================
   GITHUB API URL
   ========================================================= */

function getGitHubAPIURL(path) {

    const encodedPath =
        path
            .split("/")
            .filter(Boolean)
            .map(function (part) {

                return encodeURIComponent(part);

            })
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


/* =========================================================
   RAW GITHUB FILE URL
   ========================================================= */

function getRawFileURL(path) {

    const encodedPath =
        path
            .split("/")
            .filter(Boolean)
            .map(function (part) {

                return encodeURIComponent(part);

            })
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


/* =========================================================
   LOAD FOLDER
   ========================================================= */

async function loadFolder() {

    const grid =
        document.getElementById("grid");


    if (!grid) {

        return;

    }


    grid.innerHTML = `

        <div class="empty">

            Loading documents...

        </div>

    `;


    try {

        const response =
            await fetch(
                getGitHubAPIURL(currentPath),
                {
                    headers: {
                        "Accept":
                            "application/vnd.github+json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "GitHub returned error " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "This GitHub path is not a folder."
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
            "DocVault GitHub Error:",
            error
        );


        grid.innerHTML = `

            <div class="empty">

                <strong>
                    Unable to load documents
                </strong>

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


/* =========================================================
   DRAW FILES AND FOLDERS
   ========================================================= */

function drawFiles(items) {

    const grid =
        document.getElementById("grid");


    if (!grid) {

        return;

    }


    const searchElement =
        document.getElementById("search");


    const search =
        searchElement
            ? searchElement.value.toLowerCase().trim()
            : "";


    const filtered =
        items
            .filter(function (item) {

                return item.name
                    .toLowerCase()
                    .includes(search);

            })
            .sort(function (a, b) {

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


                return a.name.localeCompare(
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


    filtered.forEach(function (item) {

        const card =
            document.createElement("article");


        card.className = "item";


        const isFolder =
            item.type === "dir";


        const icon =
            isFolder
                ? "📁"
                : getFileIcon(item.name);


        const safePath =
            escapeHTML(item.path);


        card.innerHTML = `

            <div>

                <div class="icon">

                    ${icon}

                </div>


                <div
                    class="name"
                    title="${escapeHTML(item.name)}"
                >

                    ${escapeHTML(item.name)}

                </div>


                <div class="meta">

                    ${
                        isFolder
                            ? "Folder"
                            : getFileType(item.name)
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
                        onclick="openFolder('${safePath}')"
                    >
                        Open
                    </button>

                    `

                    :

                    `

                    <button
                        class="mini"
                        onclick="previewFile('${safePath}')"
                    >
                        Preview
                    </button>


                    <button
                        class="mini"
                        onclick="downloadFile('${safePath}')"
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


/* =========================================================
   FILE ICON
   ========================================================= */

function getFileIcon(name) {

    const extension =
        name
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf") {

        return "📕";

    }


    if (
        extension === "doc" ||
        extension === "docx"
    ) {

        return "📘";

    }


    if (
        extension === "ppt" ||
        extension === "pptx"
    ) {

        return "📙";

    }


    if (
        extension === "xls" ||
        extension === "xlsx"
    ) {

        return "📗";

    }


    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "webp"
    ) {

        return "🖼️";

    }


    if (
        extension === "zip" ||
        extension === "rar"
    ) {

        return "🗜️";

    }


    return "📄";

}


/* =========================================================
   FILE TYPE
   ========================================================= */

function getFileType(name) {

    const extension =
        name
            .split(".")
            .pop()
            .toUpperCase();


    return extension + " Document";

}


/* =========================================================
   OPEN FOLDER
   ========================================================= */

function openFolder(path) {

    currentPath =
        path;


    const search =
        document.getElementById("search");


    if (search) {

        search.value = "";

    }


    loadFolder();

}


/* =========================================================
   PREVIEW FILE
   ========================================================= */

function previewFile(path) {

    const fileName =
        path.split("/").pop();


    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "pdf") {

        showPDFViewer(
            path,
            fileName
        );

        return;

    }


    /*
      Images can also be previewed.
    */

    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "webp"
    ) {

        showImageViewer(
            path,
            fileName
        );

        return;

    }


    /*
      Other files
    */

    window.open(
        getRawFileURL(path),
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   PDF VIEWER
   ========================================================= */

function showPDFViewer(
    path,
    fileName
) {

    const pdfURL =
        getRawFileURL(path);


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
                style="max-width:1300px"
            >


                <div
                    class="heading"
                    style="align-items:center"
                >

                    <div>

                        <h1>
                            ${escapeHTML(fileName)}
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


                        <button
                            class="primary"
                            onclick="downloadFile('${escapeHTML(path)}')"
                        >
                            Download
                        </button>


                    </div>

                </div>


                <div
                    style="
                        width:100%;
                        height:calc(100vh - 190px);
                        min-height:500px;
                        background:#525659;
                        border-radius:16px;
                        overflow:hidden;
                        border:1px solid #ddd;
                    "
                >

                    <iframe
                        src="${pdfURL}"
                        title="PDF Preview"
                        style="
                            width:100%;
                            height:100%;
                            border:0;
                            display:block;
                            background:#525659;
                        "
                    ></iframe>

                </div>


            </main>

        </div>

    `;

}


/* =========================================================
   IMAGE VIEWER
   ========================================================= */

function showImageViewer(
    path,
    fileName
) {

    const imageURL =
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


            <main class="main">


                <div class="heading">

                    <div>

                        <h1>
                            ${escapeHTML(fileName)}
                        </h1>

                        <div class="muted">
                            Image Preview
                        </div>

                    </div>


                    <div class="tools">

                        <button
                            class="secondary"
                            onclick="showManager()"
                        >
                            Back
                        </button>


                        <button
                            class="primary"
                            onclick="downloadFile('${escapeHTML(path)}')"
                        >
                            Download
                        </button>

                    </div>

                </div>


                <div
                    style="
                        width:100%;
                        min-height:500px;
                        height:calc(100vh - 190px);
                        background:#f1f2f5;
                        border-radius:16px;
                        display:flex;
                        justify-content:center;
                        align-items:center;
                        overflow:auto;
                        padding:20px;
                        box-sizing:border-box;
                    "
                >

                    <img
                        src="${imageURL}"
                        alt="${escapeHTML(fileName)}"
                        style="
                            max-width:100%;
                            max-height:100%;
                            object-fit:contain;
                            border-radius:8px;
                        "
                    >

                </div>


            </main>

        </div>

    `;

}


/* =========================================================
   DOWNLOAD FILE
   ========================================================= */

function downloadFile(path) {

    const url =
        getRawFileURL(path);


    const link =
        document.createElement("a");


    link.href = url;

    link.target = "_blank";

    link.rel =
        "noopener noreferrer";


    link.download =
        path.split("/").pop();


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();

}


/* =========================================================
   SEARCH
   ========================================================= */

function filterFiles() {

    drawFiles(
        currentItems
    );

}


/* =========================================================
   BREADCRUMB
   ========================================================= */

function drawBreadcrumb() {

    const breadcrumb =
        document.getElementById(
            "breadcrumb"
        );


    if (!breadcrumb) {

        return;

    }


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


            const search =
                document.getElementById(
                    "search"
                );


            if (search) {

                search.value = "";

            }


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


    const remainingParts =
        currentParts.slice(
            baseParts.length
        );


    let builtPath =
        GITHUB_PATH;


    remainingParts.forEach(
        function (folder) {


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


            const folderLink =
                document.createElement(
                    "span"
                );


            folderLink.textContent =
                folder;


            const selectedPath =
                builtPath;


            folderLink.onclick =
                function () {

                    currentPath =
                        selectedPath;


                    const search =
                        document.getElementById(
                            "search"
                        );


                    if (search) {

                        search.value = "";

                    }


                    loadFolder();

                };


            breadcrumb.appendChild(
                folderLink
            );

        }
    );

}


/* =========================================================
   START APPLICATION
   ========================================================= */

if (role) {

    showManager();

}
else {

    showLogin();

     }
