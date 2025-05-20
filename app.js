/**
 * Family Notes - Frontend-only note-taking application
 * Features: Multiple tabs, folders, rich-text notes, dark mode, data export/import
 */

// Main data structure
const appData = {
    currentTabId: null,
    currentFolderId: null,
    tabs: [],
    folders: [],
    notes: []
};

// DOM Elements
const elements = {
    tabsList: document.getElementById('tabs'),
    foldersList: document.getElementById('folders-list'),
    notesContainer: document.getElementById('notes-container'),
    searchInput: document.getElementById('search-notes'),
    addTabBtn: document.getElementById('add-tab'),
    addFolderBtn: document.getElementById('add-folder'),
    addNoteBtn: document.getElementById('add-note'),
    tabModal: document.getElementById('tab-modal'),
    folderModal: document.getElementById('folder-modal'),
    noteModal: document.getElementById('note-modal'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    themeToggle: document.getElementById('theme-toggle'),
    exportDataBtn: document.getElementById('export-data'),
    importDataInput: document.getElementById('import-data'),
    tabNameInput: document.getElementById('tab-name'),
    folderNameInput: document.getElementById('folder-name'),
    noteTitleInput: document.getElementById('note-title'),
    noteContent: document.getElementById('note-content'),
    imageUpload: document.getElementById('image-upload'),
    fileUpload: document.getElementById('file-upload')
};

// Initialize the application
function initApp() {
    loadDataFromStorage();
    setupEventListeners();
    initTheme();
    
    // Create default tab if none exists
    if (appData.tabs.length === 0) {
        createTab('Ghi chú chung');
    }
    
    // Select the first tab or the previously selected tab
    if (!appData.currentTabId && appData.tabs.length > 0) {
        appData.currentTabId = appData.tabs[0].id;
    }
    
    renderUI();
}

// Setup all event listeners
function setupEventListeners() {
    // Tab management
    elements.addTabBtn.addEventListener('click', () => openTabModal());
    
    // Tab modal actions
    document.getElementById('tab-modal-save').addEventListener('click', saveTabModal);
    document.getElementById('tab-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('tab-modal-delete').addEventListener('click', deleteCurrentTab);
    
    // Folder management
    elements.addFolderBtn.addEventListener('click', () => openFolderModal());
    
    // Folder modal actions
    document.getElementById('folder-modal-save').addEventListener('click', saveFolderModal);
    document.getElementById('folder-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('folder-modal-delete').addEventListener('click', deleteCurrentFolder);
    
    // Note management
    elements.addNoteBtn.addEventListener('click', () => openNoteModal());
    
    // Note modal actions
    document.getElementById('note-modal-save').addEventListener('click', saveNoteModal);
    document.getElementById('note-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('note-modal-delete').addEventListener('click', deleteCurrentNote);
    
    // Note editor toolbar
    document.querySelectorAll('.editor-btn[data-command]').forEach(button => {
        button.addEventListener('click', executeCommand);
    });
    
    // File uploads
    elements.imageUpload.addEventListener('change', handleImageUpload);
    elements.fileUpload.addEventListener('change', handleFileUpload);
    
    // Search functionality
    elements.searchInput.addEventListener('input', filterNotes);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Data export/import
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataInput.addEventListener('change', importData);
    
    // Close modals when clicking on backdrop
    elements.modalBackdrop.addEventListener('click', closeModal);
}

// Load data from localStorage
function loadDataFromStorage() {
    const savedData = localStorage.getItem('familyNotesData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.assign(appData, parsedData);
    }
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('familyNotesData', JSON.stringify(appData));
}

// Render the entire UI
function renderUI() {
    renderTabs();
    renderFolders();
    renderNotes();
}

// Render tabs in the tab bar
function renderTabs() {
    elements.tabsList.innerHTML = '';
    
    appData.tabs.forEach(tab => {
        const tabElement = document.createElement('li');
        tabElement.className = `tab ${tab.id === appData.currentTabId ? 'active' : ''}`;
        tabElement.dataset.id = tab.id;
        tabElement.innerHTML = `
            ${tab.name}
            <span class="tab-edit"><i class="fas fa-pen"></i></span>
        `;
        
        // Click to select tab
        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-edit')) {
                selectTab(tab.id);
            } else {
                openTabModal(tab.id);
            }
        });
        
        elements.tabsList.appendChild(tabElement);
    });
}

// Render folders in sidebar
function renderFolders() {
    elements.foldersList.innerHTML = '';
    
    // Get folders for current tab
    const tabFolders = appData.folders.filter(folder => folder.tabId === appData.currentTabId);
    
    if (tabFolders.length === 0) {
        // Create default folder if none exists for this tab
        const defaultFolder = {
            id: generateId(),
            name: 'Mặc định',
            tabId: appData.currentTabId
        };
        appData.folders.push(defaultFolder);
        appData.currentFolderId = defaultFolder.id;
        saveDataToStorage();
    } else if (!appData.currentFolderId || !tabFolders.some(f => f.id === appData.currentFolderId)) {
        // Select first folder if current folder is not set or doesn't belong to current tab
        appData.currentFolderId = tabFolders[0].id;
    }
    
    // Render all folders for this tab
    tabFolders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.className = `folder ${folder.id === appData.currentFolderId ? 'active' : ''}`;
        folderElement.dataset.id = folder.id;
        folderElement.innerHTML = `
            <span class="folder-name">${folder.name}</span>
            <span class="folder-edit"><i class="fas fa-pen"></i></span>
        `;
        
        // Click to select folder
        folderElement.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-edit')) {
                selectFolder(folder.id);
            } else {
                openFolderModal(folder.id);
            }
        });
        
        elements.foldersList.appendChild(folderElement);
    });
}

// Render notes in the main content area
function renderNotes(searchTerm = '') {
    elements.notesContainer.innerHTML = '';
    
    // Get notes for current tab and folder
    const folderNotes = appData.notes.filter(note => 
        note.tabId === appData.currentTabId && 
        note.folderId === appData.currentFolderId
    );
    
    // Apply search filter if provided
    const filteredNotes = searchTerm 
        ? folderNotes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            stripHtml(note.content).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : folderNotes;
    
    // Display filtered notes
    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        noteElement.dataset.id = note.id;
        
        noteElement.innerHTML = `
            <div class="note-card-header">
                <h3 class="note-title">${note.title}</h3>
            </div>
            <div class="note-content-preview">${note.content}</div>
            <div class="note-actions">
                <button class="note-btn note-edit"><i class="fas fa-pen"></i></button>
                <button class="note-btn note-delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Open note on click
        noteElement.addEventListener('click', (e) => {
            if (!e.target.closest('.note-actions')) {
                openNoteModal(note.id);
            }
        });
        
        // Edit button
        noteElement.querySelector('.note-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openNoteModal(note.id);
        });
        
        // Delete button
        noteElement.querySelector('.note-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
                deleteNote(note.id);
            }
        });
        
        elements.notesContainer.appendChild(noteElement);
    });
    
    // Show empty state
    if (filteredNotes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.style.gridColumn = '1 / -1';
        emptyState.style.textAlign = 'center';
        emptyState.style.padding = '50px 20px';
        emptyState.style.color = 'var(--secondary-color)';
        
        if (searchTerm) {
            emptyState.innerHTML = `<i class="fas fa-search fa-2x"></i><p>Không tìm thấy ghi chú phù hợp</p>`;
        } else {
            emptyState.innerHTML = `<i class="fas fa-sticky-note fa-2x"></i><p>Chưa có ghi chú nào. Hãy tạo ghi chú mới!</p>`;
        }
        
        elements.notesContainer.appendChild(emptyState);
    }
}

// Filter notes based on search input
function filterNotes() {
    const searchTerm = elements.searchInput.value.trim();
    renderNotes(searchTerm);
}

// Helper function to strip HTML tags for searching
function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

// Tab Management
function selectTab(tabId) {
    appData.currentTabId = tabId;
    appData.currentFolderId = null; // Reset folder selection
    saveDataToStorage();
    renderUI();
}

function createTab(name) {
    const newTab = {
        id: generateId(),
        name: name
    };
    
    appData.tabs.push(newTab);
    appData.currentTabId = newTab.id;
    saveDataToStorage();
    
    // Create default folder for new tab
    const defaultFolder = {
        id: generateId(),
        name: 'Mặc định',
        tabId: newTab.id
    };
    appData.folders.push(defaultFolder);
    appData.currentFolderId = defaultFolder.id;
    
    saveDataToStorage();
    renderUI();
}

function updateTab(tabId, newName) {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab) {
        tab.name = newName;
        saveDataToStorage();
        renderUI();
    }
}

function deleteTab(tabId) {
    // Find tab index
    const tabIndex = appData.tabs.findIndex(t => t.id === tabId);
    
    if (tabIndex === -1) return;
    
    // Delete all folders and notes in this tab
    appData.folders = appData.folders.filter(f => f.tabId !== tabId);
    appData.notes = appData.notes.filter(n => n.tabId !== tabId);
    
    // Remove tab
    appData.tabs.splice(tabIndex, 1);
    
    // Select another tab if available
    if (appData.tabs.length > 0) {
        appData.currentTabId = appData.tabs[0].id;
    } else {
        appData.currentTabId = null;
        // Create a new default tab if all tabs were deleted
        createTab('Ghi chú chung');
    }
    
    saveDataToStorage();
    renderUI();
}

// Folder Management
function selectFolder(folderId) {
    appData.currentFolderId = folderId;
    saveDataToStorage();
    renderUI();
}

function createFolder(name) {
    const newFolder = {
        id: generateId(),
        name: name,
        tabId: appData.currentTabId
    };
    
    appData.folders.push(newFolder);
    appData.currentFolderId = newFolder.id;
    saveDataToStorage();
    renderUI();
}

function updateFolder(folderId, newName) {
    const folder = appData.folders.find(f => f.id === folderId);
    if (folder) {
        folder.name = newName;
        saveDataToStorage();
        renderUI();
    }
}

function deleteFolder(folderId) {
    // Find folder index
    const folderIndex = appData.folders.findIndex(f => f.id === folderId);
    
    if (folderIndex === -1) return;
    
    // Delete all notes in this folder
    appData.notes = appData.notes.filter(n => n.folderId !== folderId);
    
    // Remove folder
    appData.folders.splice(folderIndex, 1);
    
    // Select another folder if available in current tab
    const tabFolders = appData.folders.filter(f => f.tabId === appData.currentTabId);
    if (tabFolders.length > 0) {
        appData.currentFolderId = tabFolders[0].id;
    } else {
        // Create a new default folder if all folders were deleted
        const defaultFolder = {
            id: generateId(),
            name: 'Mặc định',
            tabId: appData.currentTabId
        };
        appData.folders.push(defaultFolder);
        appData.currentFolderId = defaultFolder.id;
    }
    
    saveDataToStorage();
    renderUI();
}

// Note Management
function createNote(title, content) {
    const newNote = {
        id: generateId(),
        title: title,
        content: content,
        tabId: appData.currentTabId,
        folderId: appData.currentFolderId,
        createdAt: new Date().toISOString()
    };
    
    appData.notes.push(newNote);
    saveDataToStorage();
    renderNotes();
}

function updateNote(noteId, title, content) {
    const note = appData.notes.find(n => n.id === noteId);
    if (note) {
        note.title = title;
        note.content = content;
        saveDataToStorage();
        renderNotes();
    }
}

function deleteNote(noteId) {
    appData.notes = appData.notes.filter(n => n.id !== noteId);
    saveDataToStorage();
    renderNotes();
}

// Modal Management
function openTabModal(tabId = null) {
    const modalTitle = document.getElementById('tab-modal-title');
    const deleteBtn = document.getElementById('tab-modal-delete');
    
    if (tabId) {
        // Edit existing tab
        const tab = appData.tabs.find(t => t.id === tabId);
        elements.tabNameInput.value = tab.name;
        modalTitle.textContent = 'Chỉnh sửa tab';
        deleteBtn.classList.remove('hidden');
        elements.tabModal.dataset.id = tabId;
    } else {
        // Create new tab
        elements.tabNameInput.value = '';
        modalTitle.textContent = 'Tạo tab mới';
        deleteBtn.classList.add('hidden');
        delete elements.tabModal.dataset.id;
    }
    
    elements.tabModal.classList.remove('hidden');
    elements.modalBackdrop.classList.remove('hidden');
    elements.tabNameInput.focus();
}

function saveTabModal() {
    const tabName = elements.tabNameInput.value.trim();
    if (!tabName) return;
    
    const tabId = elements.tabModal.dataset.id;
    
    if (tabId) {
        // Update existing tab
        updateTab(tabId, tabName);
    } else {
        // Create new tab
        createTab(tabName);
    }
    
    closeModal();
}

function deleteCurrentTab() {
    const tabId = elements.tabModal.dataset.id;
    if (tabId) {
        if (confirm('Bạn có chắc chắn muốn xóa tab này? Tất cả thư mục và ghi chú trong tab này sẽ bị xóa.')) {
            deleteTab(tabId);
            closeModal();
        }
    }
}

function openFolderModal(folderId = null) {
    const modalTitle = document.getElementById('folder-modal-title');
    const deleteBtn = document.getElementById('folder-modal-delete');
    
    if (folderId) {
        // Edit existing folder
        const folder = appData.folders.find(f => f.id === folderId);
        elements.folderNameInput.value = folder.name;
        modalTitle.textContent = 'Chỉnh sửa thư mục';
        deleteBtn.classList.remove('hidden');
        elements.folderModal.dataset.id = folderId;
    } else {
        // Create new folder
        elements.folderNameInput.value = '';
        modalTitle.textContent = 'Tạo thư mục mới';
        deleteBtn.classList.add('hidden');
        delete elements.folderModal.dataset.id;
    }
    
    elements.folderModal.classList.remove('hidden');
    elements.modalBackdrop.classList.remove('hidden');
    elements.folderNameInput.focus();
}

function saveFolderModal() {
    const folderName = elements.folderNameInput.value.trim();
    if (!folderName) return;
    
    const folderId = elements.folderModal.dataset.id;
    
    if (folderId) {
        // Update existing folder
        updateFolder(folderId, folderName);
    } else {
        // Create new folder
        createFolder(folderName);
    }
    
    closeModal();
}

function deleteCurrentFolder() {
    const folderId = elements.folderModal.dataset.id;
    if (folderId) {
        if (confirm('Bạn có chắc chắn muốn xóa thư mục này? Tất cả ghi chú trong thư mục này sẽ bị xóa.')) {
            deleteFolder(folderId);
            closeModal();
        }
    }
}

function openNoteModal(noteId = null) {
    const modalTitle = document.getElementById('note-modal-title');
    const deleteBtn = document.getElementById('note-modal-delete');
    
    if (noteId) {
        // Edit existing note
        const note = appData.notes.find(n => n.id === noteId);
        elements.noteTitleInput.value = note.title;
        elements.noteContent.innerHTML = note.content;
        modalTitle.textContent = 'Chỉnh sửa ghi chú';
        deleteBtn.classList.remove('hidden');
        elements.noteModal.dataset.id = noteId;
    } else {
        // Create new note
        elements.noteTitleInput.value = '';
        elements.noteContent.innerHTML = '';
        modalTitle.textContent = 'Thêm ghi chú';
        deleteBtn.classList.add('hidden');
        delete elements.noteModal.dataset.id;
    }
    
    elements.noteModal.classList.remove('hidden');
    elements.modalBackdrop.classList.remove('hidden');
    elements.noteTitleInput.focus();
}

function saveNoteModal() {
    const noteTitle = elements.noteTitleInput.value.trim() || 'Ghi chú không tiêu đề';
    const noteContent = elements.noteContent.innerHTML;
    
    const noteId = elements.noteModal.dataset.id;
    
    if (noteId) {
        // Update existing note
        updateNote(noteId, noteTitle, noteContent);
    } else {
        // Create new note
        createNote(noteTitle, noteContent);
    }
    
    closeModal();
}

function deleteCurrentNote() {
    const noteId = elements.noteModal.dataset.id;
    if (noteId) {
        if (confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
            deleteNote(noteId);
            closeModal();
        }
    }
}

function closeModal() {
    elements.tabModal.classList.add('hidden');
    elements.folderModal.classList.add('hidden');
    elements.noteModal.classList.add('hidden');
    elements.modalBackdrop.classList.add('hidden');
}

// Rich-text editor functions
function executeCommand(e) {
    const command = e.target.closest('[data-command]').dataset.command;
    document.execCommand(command, false, null);
    elements.noteContent.focus();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.execCommand('insertImage', false, event.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            // Create a file attachment element
            const attachment = `
                <div class="file-attachment">
                    <i class="fas fa-paperclip"></i>
                    <span class="file-name">${file.name}</span>
                    <a class="file-download" href="${event.target.result}" download="${file.name}">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            `;
            
            // Insert at cursor position
            document.execCommand('insertHTML', false, attachment);
        };
        reader.readAsDataURL(file);
    }
}

// Theme management
function initTheme() {
    const darkModePreferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('familyNotesTheme');
    
    if (savedTheme === 'dark' || (!savedTheme && darkModePreferred)) {
        document.body.classList.add('dark-mode');
    }
}

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('familyNotesTheme', isDarkMode ? 'dark' : 'light');
}

// Data export/import
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `family_notes_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Validate basic structure
                if (importedData.tabs && Array.isArray(importedData.tabs) && 
                    importedData.folders && Array.isArray(importedData.folders) &&
                    importedData.notes && Array.isArray(importedData.notes)) {
                    
                    if (confirm('Nhập dữ liệu mới sẽ thay thế toàn bộ dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
                        Object.assign(appData, importedData);
                        saveDataToStorage();
                        renderUI();
                        alert('Nhập dữ liệu thành công!');
                    }
                } else {
                    alert('Định dạng tệp không hợp lệ!');
                }
            } catch (error) {
                alert('Lỗi khi nhập dữ liệu: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Helper function to generate unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Bổ sung các hàm mới cho trình soạn thảo phong phú

// Setup enhanced editor features
function setupEnhancedEditor() {
    // Heading selector
    const headingSelect = document.getElementById('heading-select');
    headingSelect.addEventListener('change', function() {
        const value = this.value;
        if (value) {
            // If value is not empty, wrap selected text in the specified tag
            document.execCommand('formatBlock', false, value);
        } else {
            // If value is empty, use paragraph
            document.execCommand('formatBlock', false, 'p');
        }
        elements.noteContent.focus();
    });
    
    // Text color
    const textColor = document.getElementById('text-color');
    textColor.addEventListener('input', function() {
        document.execCommand('foreColor', false, this.value);
        elements.noteContent.focus();
    });
    
    // Background color
    const bgColor = document.getElementById('bg-color');
    bgColor.addEventListener('input', function() {
        document.execCommand('hiliteColor', false, this.value);
        elements.noteContent.focus();
    });
    
    // Insert link
    document.getElementById('insert-link').addEventListener('click', insertLink);
    
    // Insert table
    document.getElementById('insert-table').addEventListener('click', insertTable);
    
    // Clear formatting
    document.getElementById('clear-format').addEventListener('click', function() {
        document.execCommand('removeFormat', false, null);
        elements.noteContent.focus();
    });
    
    // Update active state of buttons based on current selection
    elements.noteContent.addEventListener('mouseup', updateActiveButtons);
    elements.noteContent.addEventListener('keyup', updateActiveButtons);
}

// Insert link modal
function insertLink() {
    // Create modal if it doesn't exist
    let linkModal = document.getElementById('link-modal');
    
    if (!linkModal) {
        linkModal = document.createElement('div');
        linkModal.id = 'link-modal';
        linkModal.className = 'sub-modal hidden';
        linkModal.style.top = '30%';
        linkModal.style.left = '50%';
        linkModal.style.transform = 'translateX(-50%)';
        
        linkModal.innerHTML = `
            <label for="link-url">URL</label>
            <input type="text" id="link-url" placeholder="https://example.com">
            <label for="link-text">Văn bản hiển thị</label>
            <input type="text" id="link-text" placeholder="Nhập văn bản hiển thị">
            <div class="sub-modal-actions">
                <button id="link-cancel" class="cancel-btn">Huỷ</button>
                <button id="link-insert" class="save-btn">Chèn</button>
            </div>
        `;
        
        document.body.appendChild(linkModal);
        
        // Add event listeners
        document.getElementById('link-cancel').addEventListener('click', function() {
            linkModal.classList.add('hidden');
        });
        
        document.getElementById('link-insert').addEventListener('click', function() {
            const url = document.getElementById('link-url').value.trim();
            const text = document.getElementById('link-text').value.trim();
            
            if (url) {
                // Get current selection
                const selection = window.getSelection();
                
                // Create link
                const link = document.createElement('a');
                link.href = url.startsWith('http') ? url : 'https://' + url;
                link.textContent = text || url;
                link.target = '_blank';
                
                // If there is a selection, replace it with the link
                if (selection.toString()) {
                    document.execCommand('insertHTML', false, `<a href="${link.href}" target="_blank">${text || selection.toString()}</a>`);
                } else {
                    document.execCommand('insertHTML', false, `<a href="${link.href}" target="_blank">${text || url}</a>`);
                }
                
                linkModal.classList.add('hidden');
                elements.noteContent.focus();
            }
        });
    }
    
    // Get current selection for link text
    const selection = window.getSelection();
    if (selection.toString()) {
        document.getElementById('link-text').value = selection.toString();
    } else {
        document.getElementById('link-text').value = '';
    }
    
    document.getElementById('link-url').value = '';
    
    // Show modal
    linkModal.classList.remove('hidden');
    document.getElementById('link-url').focus();
}

// Insert table modal
function insertTable() {
    // Create modal if it doesn't exist
    let tableModal = document.getElementById('table-modal');
    
    if (!tableModal) {
        tableModal = document.createElement('div');
        tableModal.id = 'table-modal';
        tableModal.className = 'sub-modal hidden';
        tableModal.style.top = '30%';
        tableModal.style.left = '50%';
        tableModal.style.transform = 'translateX(-50%)';
        
        tableModal.innerHTML = `
            <label for="table-rows">Số hàng</label>
            <input type="number" id="table-rows" min="1" max="10" value="3">
            <label for="table-cols">Số cột</label>
            <input type="number" id="table-cols" min="1" max="10" value="3">
            <div class="sub-modal-actions">
                <button id="table-cancel" class="cancel-btn">Huỷ</button>
                <button id="table-insert" class="save-btn">Chèn</button>
            </div>
        `;
        
        document.body.appendChild(tableModal);
        
        // Add event listeners
        document.getElementById('table-cancel').addEventListener('click', function() {
            tableModal.classList.add('hidden');
        });
        
        document.getElementById('table-insert').addEventListener('click', function() {
            const rows = parseInt(document.getElementById('table-rows').value) || 3;
            const cols = parseInt(document.getElementById('table-cols').value) || 3;
            
            let tableHTML = '<table><thead><tr>';
            
            // Add header cells
            for (let i = 0; i < cols; i++) {
                tableHTML += `<th>Tiêu đề ${i + 1}</th>`;
            }
            
            tableHTML += '</tr></thead><tbody>';
            
            // Add rows and cells
            for (let i = 0; i < rows; i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < cols; j++) {
                    tableHTML += '<td>Nội dung</td>';
                }
                tableHTML += '</tr>';
            }
            
            tableHTML += '</tbody></table>';
            
            document.execCommand('insertHTML', false, tableHTML);
            tableModal.classList.add('hidden');
            elements.noteContent.focus();
        });
    }
    
    // Reset values
    document.getElementById('table-rows').value = 3;
    document.getElementById('table-cols').value = 3;
    
    // Show modal
    tableModal.classList.remove('hidden');
}

// Update active state of toolbar buttons based on current selection
function updateActiveButtons() {
    // Commands to check for active state
    const commands = [
        'bold', 'italic', 'underline', 'strikeThrough',
        'justifyLeft', 'justifyCenter', 'justifyRight'
    ];
    
    commands.forEach(command => {
        const button = document.querySelector(`[data-command="${command}"]`);
        if (button) {
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
    
    // Update heading selector
    const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
    const headingSelect = document.getElementById('heading-select');
    
    if (headingSelect) {
        if (['h1', 'h2', 'h3', 'blockquote', 'pre'].includes(formatBlock)) {
            headingSelect.value = formatBlock;
        } else {
            headingSelect.value = '';
        }
    }
}

// Add the setup to the existing setupEventListeners function
function setupEventListeners() {
    // Existing event listeners...
    
    // Tab management
    elements.addTabBtn.addEventListener('click', () => openTabModal());
    
    // Tab modal actions
    document.getElementById('tab-modal-save').addEventListener('click', saveTabModal);
    document.getElementById('tab-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('tab-modal-delete').addEventListener('click', deleteCurrentTab);
    
    // Folder management
    elements.addFolderBtn.addEventListener('click', () => openFolderModal());
    
    // Folder modal actions
    document.getElementById('folder-modal-save').addEventListener('click', saveFolderModal);
    document.getElementById('folder-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('folder-modal-delete').addEventListener('click', deleteCurrentFolder);
    
    // Note management
    elements.addNoteBtn.addEventListener('click', () => openNoteModal());
    
    // Note modal actions
    document.getElementById('note-modal-save').addEventListener('click', saveNoteModal);
    document.getElementById('note-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('note-modal-delete').addEventListener('click', deleteCurrentNote);
    
    // Note editor toolbar
    document.querySelectorAll('.editor-btn[data-command]').forEach(button => {
        button.addEventListener('click', executeCommand);
    });
    
    // Setup enhanced editor features
    setupEnhancedEditor();
    
    // File uploads
    elements.imageUpload.addEventListener('change', handleImageUpload);
    elements.fileUpload.addEventListener('change', handleFileUpload);
    
    // Search functionality
    elements.searchInput.addEventListener('input', filterNotes);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Data export/import
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataInput.addEventListener('change', importData);
    
    // Close modals when clicking on backdrop
    elements.modalBackdrop.addEventListener('click', closeModal);
}

// Nâng cao hiển thị ghi chú trong danh sách
function renderNotes(searchTerm = '') {
    elements.notesContainer.innerHTML = '';
    
    // Get notes for current tab and folder
    const folderNotes = appData.notes.filter(note => 
        note.tabId === appData.currentTabId && 
        note.folderId === appData.currentFolderId
    );
    
    // Apply search filter if provided
    const filteredNotes = searchTerm 
        ? folderNotes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            stripHtml(note.content).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : folderNotes;
    
    // Sort notes by creation date, newest first
    filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Display filtered notes
    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        noteElement.dataset.id = note.id;
        
        // Extract a color from the note title for the card accent
        const colorHue = simpleHash(note.title) % 360;
        noteElement.style.setProperty('--note-accent-color', `hsl(${colorHue}, 70%, 60%)`);
        noteElement.style.setProperty('--note-accent-color-light', `hsl(${colorHue}, 70%, 90%)`);
        
        // Format creation date
        const createdDate = new Date(note.createdAt);
        const formattedDate = createdDate.toLocaleDateString('vi-VN', { 
            day: 'numeric', month: 'short', year: 'numeric'
        });
        
        // Check if note has images or files
        const hasAttachments = note.content.includes('file-attachment') || note.content.includes('<img');
        
        noteElement.innerHTML = `
            <div class="note-card-header">
                <h3 class="note-title">${note.title}</h3>
            </div>
            <div class="note-content-preview">${note.content}</div>
            <div class="note-footer">
                <div class="note-date">
                    <i class="far fa-calendar-alt"></i> ${formattedDate}
                </div>
                ${hasAttachments ? '<div class="note-has-attachments"><i class="fas fa-paperclip"></i></div>' : ''}
            </div>
            <div class="note-actions">
                <button class="note-btn note-edit"><i class="fas fa-pen"></i></button>
                <button class="note-btn note-delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Open note on click
        noteElement.addEventListener('click', (e) => {
            if (!e.target.closest('.note-actions')) {
                openNoteModal(note.id);
            }
        });
        
        // Edit button
        noteElement.querySelector('.note-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openNoteModal(note.id);
        });
        
        // Delete button
        noteElement.querySelector('.note-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
                deleteNote(note.id);
            }
        });
        
        elements.notesContainer.appendChild(noteElement);
    });
    
    // Show empty state
    if (filteredNotes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.style.gridColumn = '1 / -1';
        emptyState.style.textAlign = 'center';
        emptyState.style.padding = '50px 20px';
        emptyState.style.color = 'var(--secondary-color)';
        
        if (searchTerm) {
            emptyState.innerHTML = `<i class="fas fa-search fa-2x"></i><p>Không tìm thấy ghi chú phù hợp</p>`;
        } else {
            emptyState.innerHTML = `<i class="fas fa-sticky-note fa-2x"></i><p>Chưa có ghi chú nào. Hãy tạo ghi chú mới!</p>`;
        }
        
        elements.notesContainer.appendChild(emptyState);
    }
}

// Simple hash function to generate consistent colors from note titles
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
