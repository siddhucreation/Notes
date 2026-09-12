# DocVault — GitHub Folders = Website Folders

This version does exactly this:

- You create folders in GitHub.
- You upload PDFs/documents into those GitHub folders.
- The website automatically reads the repository structure.
- Folders appear as folders.
- Files appear as documents.
- Users can view/download.
- There is one login page with separate User and Admin credentials.
- Admin is detected automatically, but the admin portal is read-only with respect to GitHub: actual file management is done in GitHub.

## 1. Create your GitHub repository

Example:

    my-notes/
      documents/
        Mathematics/
          notes.pdf
        Important/
          notice.pdf

The repository must be **public** because the website uses GitHub's public Contents API without a server.

## 2. Configure app.js

Open `app.js` and change:

    const GITHUB_OWNER="YOUR_GITHUB_USERNAME";
    const GITHUB_REPO="YOUR_REPOSITORY";
    const GITHUB_PATH="documents";

For example:

    const GITHUB_OWNER="siddhpatel";
    const GITHUB_REPO="my-notes";
    const GITHUB_PATH="documents";

If your PDFs are directly in the repository root, use:

    const GITHUB_PATH="";

## 3. Demo login

User:
    ID: user
    Password: user123

Admin:
    ID: admin
    Password: admin123

Change these before using the site. Note that these credentials are frontend credentials and are NOT suitable for protecting highly sensitive information.

## 4. Deploy

Push `index.html`, `style.css`, and `app.js` to GitHub, then import that repository into Vercel.

No build command is needed. It is a static website.

## Important security limitation

Because the document repository is public, anyone who knows the repository URL can access the files without logging into the website. The website login is therefore only a UI gate, not true document security.

If the notes must be genuinely private, use private storage plus a backend/server-side access layer instead.
