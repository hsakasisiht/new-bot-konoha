#  Google Drive Integration Guide

This guide explains how to set up and use the Google Drive integration features of the Konoha Bot.

##  Quick Start

### 1. Prerequisites
Ensure you have the `google-credentials.json` file in the `config/` folder. This file is obtained from the Google Cloud Console (OAuth 2.0 Client ID).

### 2. Authentication (One-Time Setup)
You need to authorize the bot to access your Google Drive. This is done directly through WhatsApp.

1.  **Get Auth Link:**
    Send the following command to the bot (as the Bot Owner):
    ```
    .authdrive url
    ```
    The bot will reply with a link.

2.  **Authorize:**
    -   Click the link.
    -   Sign in with the Google Account that has the Excel files.
    -   Allow access to Google Drive.
    -   Copy the code provided by Google.

3.  **Complete Setup:**
    Send the code back to the bot:
    ```
    .authdrive code YOUR_COPIED_CODE_HERE
    ```
    *Example:* `.authdrive code 4/0AeaYSH...`

4.  **Verify:**
    Check if everything is working:
    ```
    .authdrive status
    ```

---

##  Configuration Commands

Once authenticated, you need to tell the bot **which folder** to watch and **who** to send the files to.

### 1. Set Up a Folder Mapping
Map a Google Drive folder to a specific WhatsApp chat (Group or Individual).

**Command:**
```
.setfolder [Folder_ID] [Chat_ID] [Nickname]
```

-   **Folder_ID:** The ID from the Google Drive URL (e.g., `1abc...` from `drive.google.com/drive/folders/1abc...`).
-   **Chat_ID:** The WhatsApp ID of the group or person.
    -   *Tip:* Use `.getchatid` in the target group to get its ID easily.
-   **Nickname:** A short name to refer to this mapping (e.g., `sales`, `daily-report`).

**Example:**
```
.setfolder 12345abcde 1203630239823@g.us sales-team
```

### 2. Manage Contacts (Legacy/Direct Mode)
If you want to send files to specific contacts without auto-fetching:

-   **Add Contact:** `.setcontact [Name] [Number]`
    -   *Example:* `.setcontact John 628123456789`
-   **List Contacts:** `.showcontacts`

---

##  Usage Commands

### Fetch Excel Files
Manually trigger a check for the latest Excel file in a mapped folder.

**Command:**
```
.fetchexcel [Nickname]
```
-   **Nickname:** The nickname you defined in `.setfolder`.

**Example:**
```
.fetchexcel sales-team
```
The bot will:
1.  Look into the Google Drive folder associated with `sales-team`.
2.  Find the most recently modified Excel file.
3.  Download it.
4.  Send it to the chat associated with `sales-team`.

### Manage Mappings
-   **Show All Mappings:**
    ```
    .showfolders
    ```
-   **Stop/Remove a Mapping:**
    ```
    .stopfolder [Nickname]
    ```

---

##  Troubleshooting

-   **"Google Drive manager is not available"**: Ensure `google-credentials.json` is valid and restart the bot.
-   **"Authentication failed"**: The code might have expired. Generate a new URL with `.authdrive url`.
-   **"Folder not found"**: Check if the Folder ID is correct and if the authenticated Google account has access to it.

