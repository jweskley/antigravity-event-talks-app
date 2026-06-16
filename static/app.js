// --- APP STATE ---
let state = {
    updates: [],
    filteredUpdates: [],
    selectedUpdate: null,
    currentFilter: 'all',
    searchQuery: '',
    isLoading: false
};

// --- DOM ELEMENTS ---
const elements = {
    btnRefresh: document.getElementById('btn-refresh'),
    btnExportCSV: document.getElementById('btn-export-csv'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    iconSun: document.querySelector('.icon-sun'),
    iconMoon: document.querySelector('.icon-moon'),
    iconRefresh: document.querySelector('.icon-refresh'),
    searchInput: document.getElementById('search-input'),
    filterPills: document.getElementById('filter-pills'),
    statsBadgeNum: document.querySelector('#stats-badge .stats-num'),
    syncTime: document.getElementById('sync-time'),
    
    // Feed sections
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    feedContainer: document.getElementById('feed-container'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    
    // Workspace sections
    workspaceEmpty: document.getElementById('workspace-empty'),
    workspaceContent: document.getElementById('workspace-content'),
    workspaceSection: document.querySelector('.workspace-section'),
    btnCloseWorkspace: document.getElementById('btn-close-workspace'),
    selectedDate: document.getElementById('selected-date'),
    selectedType: document.getElementById('selected-type'),
    selectedHtmlContent: document.getElementById('selected-html-content'),
    
    // Sharing panel
    twitterTweetPreview: document.getElementById('twitter-tweet-preview'),
    tweetCharCount: document.getElementById('tweet-char-count'),
    btnShareTwitter: document.getElementById('btn-share-twitter'),
    btnCopyLink: document.getElementById('btn-copy-link'),
    btnCopyText: document.getElementById('btn-copy-text'),
    toastContainer: document.getElementById('toast-container')
};

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    
    // Refresh button
    elements.btnRefresh.addEventListener('click', () => {
        if (!state.isLoading) {
            fetchReleaseNotes();
        }
    });

    // Search bar input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    // Filter pills
    elements.filterPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        // Remove active class from other pills
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        state.currentFilter = pill.dataset.filter;
        applyFilters();
    });

    // Workspace action buttons
    elements.btnShareTwitter.addEventListener('click', shareOnTwitter);
    elements.btnCopyLink.addEventListener('click', copyPermalinkToClipboard);
    elements.btnCopyText.addEventListener('click', copyTextToClipboard);
    elements.btnExportCSV.addEventListener('click', exportToCSV);
    elements.btnThemeToggle.addEventListener('click', toggleTheme);

    // Mobile workspace close button
    elements.btnCloseWorkspace.addEventListener('click', () => {
        elements.workspaceSection.classList.remove('open');
    });

    // Close mobile workspace when clicking outside of details card
    elements.workspaceSection.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && e.target === elements.workspaceSection) {
            elements.workspaceSection.classList.remove('open');
        }
    });

    // Reset Search button inside Empty State
    elements.btnClearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        state.currentFilter = 'all';
        
        // Reset active filter pill in UI
        document.querySelectorAll('.pill').forEach(p => {
            if (p.dataset.filter === 'all') {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        
        applyFilters();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // "/" key focuses search bar (if not typing in input)
        if (e.key === '/' && document.activeElement !== elements.searchInput) {
            e.preventDefault();
            elements.searchInput.focus();
            elements.searchInput.select();
        }
        // "Escape" key blurs search bar
        if (e.key === 'Escape' && document.activeElement === elements.searchInput) {
            elements.searchInput.blur();
        }
    });
});

// --- INITIALIZE APP ---
function initApp() {
    initTheme();
    // Load last sync time
    const lastSync = localStorage.getItem('last_sync_time');
    if (lastSync) {
        elements.syncTime.textContent = `Sincronizado às ${lastSync}`;
    } else {
        elements.syncTime.textContent = 'Nunca sincronizado';
    }
    fetchReleaseNotes();
}

// --- FETCH DATA FROM FLASK API ---
async function fetchReleaseNotes() {
    setLoading(true);
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success) {
            state.updates = data.updates;
            state.filteredUpdates = [...data.updates];
            
            // Render the items
            renderFeed();
            updateStats();
            
            // Update last sync time
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            elements.syncTime.textContent = `Sincronizado às ${timeStr}`;
            localStorage.setItem('last_sync_time', timeStr);
            
            // If we have items and none is selected, select the first one automatically
            if (state.updates.length > 0 && !state.selectedUpdate) {
                selectUpdate(state.updates[0].id);
            } else if (state.selectedUpdate) {
                // Keep the selection if it still exists
                const stillExists = state.updates.find(u => u.id === state.selectedUpdate.id);
                if (stillExists) {
                    selectUpdate(state.selectedUpdate.id);
                } else {
                    selectUpdate(state.updates[0].id);
                }
            }
            
            showToast('Notas de versão carregadas com sucesso!', 'success');
        } else {
            throw new Error(data.error || 'Erro ao carregar dados');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast(`Erro: ${error.message}`, 'error');
        
        // Fallback check: if there is no current data, show empty state
        if (state.updates.length === 0) {
            elements.emptyState.classList.remove('hidden');
        }
    } finally {
        setLoading(false);
    }
}

// --- RENDER FEED LIST ---
function renderFeed() {
    elements.feedContainer.innerHTML = '';
    
    if (state.filteredUpdates.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    state.filteredUpdates.forEach(update => {
        const card = document.createElement('div');
        card.className = `update-card type-${update.type.toLowerCase()}`;
        card.dataset.id = update.id;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        
        if (state.selectedUpdate && state.selectedUpdate.id === update.id) {
            card.classList.add('active');
        }
        
        // Check if type needs custom text formatting
        const badgeClass = `type-badge type-${update.type.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-date">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${update.date}</span>
                </div>
                <span class="${badgeClass}">${update.type}</span>
            </div>
            <div class="card-body">
                ${update.html}
            </div>
            <div class="card-footer">
                <button class="btn-card-copy" title="Copiar texto desta nota">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                <span class="card-action-text">
                    Ver detalhes
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </span>
            </div>
        `;
        
        // Card click handler
        card.addEventListener('click', () => {
            selectUpdate(update.id);
        });
        
        // Keyboard navigation for accessibility
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectUpdate(update.id);
            }
        });
        
        // Copy card click handler (stops propagation so card selection isn't triggered)
        const btnCopy = card.querySelector('.btn-card-copy');
        btnCopy.addEventListener('click', (e) => {
            e.stopPropagation();
            copyCardText(update);
        });
        
        elements.feedContainer.appendChild(card);
    });
}

// --- SELECT UPDATE DETAIL ---
function selectUpdate(id) {
    const update = state.updates.find(u => u.id === id);
    if (!update) return;
    
    state.selectedUpdate = update;
    
    // Highlight active card in feed list
    document.querySelectorAll('.update-card').forEach(card => {
        if (card.dataset.id === id) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    // Update workspace UI
    elements.workspaceEmpty.classList.add('hidden');
    elements.workspaceContent.classList.remove('hidden');
    
    // Open mobile bottom sheet overlay
    elements.workspaceSection.classList.add('open');
    
    elements.selectedDate.textContent = update.date;
    
    // Type badge update
    elements.selectedType.textContent = update.type;
    elements.selectedType.className = `type-badge type-${update.type.toLowerCase()}`;
    
    // Set html content
    elements.selectedHtmlContent.innerHTML = update.html;
    
    // Generate Twitter share text and live preview
    generateTweetPreview();
}

// --- GENERATE TWITTER PREVIEW TEXT ---
function generateTweetPreview() {
    if (!state.selectedUpdate) return;
    
    const update = state.selectedUpdate;
    const cleanText = stripHtml(update.html);
    
    // Twitter has a 280-char limit
    // We append the date, type, link and hash tags
    // Let's compute lengths:
    // "BigQuery Note (" + date + ") [" + type + "]: "
    const prefix = `BigQuery Release [${update.type}] (${update.date}): `;
    const suffix = `\n\nLink: ${update.link} #BigQuery #GoogleCloud`;
    
    // Twitter counts URL as 23 characters regardless of actual length
    // Let's compute character counts assuming url is 23 characters
    const urlLengthForTwitter = 23;
    const baseSuffixText = `\n\nLink:  #BigQuery #GoogleCloud`;
    const suffixLength = baseSuffixText.length + urlLengthForTwitter;
    
    const availableLength = 280 - prefix.length - suffixLength - 5; // buffer for spacing and "..."
    
    let trimmedText = cleanText.replace(/\s+/g, ' ').trim();
    if (trimmedText.length > availableLength) {
        trimmedText = trimmedText.slice(0, availableLength) + '...';
    }
    
    const tweetText = `${prefix}"${trimmedText}"${suffix}`;
    
    // For live UI preview (using real link length for representation)
    elements.twitterTweetPreview.innerText = tweetText;
    
    // Character count check for Twitter validation (using 23 chars for the link URL)
    const mockTweetTextForCount = `${prefix}"${trimmedText}"\n\nLink: ${"x".repeat(23)} #BigQuery #GoogleCloud`;
    const charCount = mockTweetTextForCount.length;
    elements.tweetCharCount.textContent = `${charCount} / 280`;
    
    // Color code warning sizes
    if (charCount > 280) {
        elements.tweetCharCount.className = 'char-count error';
    } else if (charCount > 250) {
        elements.tweetCharCount.className = 'char-count warning';
    } else {
        elements.tweetCharCount.className = 'char-count';
    }
}

// --- SHARE ON TWITTER EVENT ---
function shareOnTwitter() {
    if (!state.selectedUpdate) return;
    
    // Generate text content
    const tweetText = elements.twitterTweetPreview.innerText;
    
    // Create Twitter share URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    // Open in new tab
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// --- COPY PERMALINK ---
function copyPermalinkToClipboard() {
    if (!state.selectedUpdate) return;
    
    navigator.clipboard.writeText(state.selectedUpdate.link).then(() => {
        showToast('Link permanente copiado para a área de transferência!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Erro ao copiar link', 'error');
    });
}

// --- COPY TEXT ---
function copyTextToClipboard() {
    if (!state.selectedUpdate) return;
    
    const update = state.selectedUpdate;
    const cleanText = stripHtml(update.html);
    const textToCopy = `BigQuery Release Notes (${update.date}) - [${update.type}]\n\n${cleanText}\n\nLink: ${update.link}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Conteúdo textual copiado com sucesso!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Erro ao copiar conteúdo textual', 'error');
    });
}

// --- UTILITY: STRIP HTML TAGS ---
function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    
    // Format list items inside lists nicely before stripping HTML
    const lis = tmp.querySelectorAll('li');
    lis.forEach(li => {
        li.textContent = `• ${li.textContent}\n`;
    });
    
    return tmp.textContent || tmp.innerText || "";
}

// --- UTILITY: APPLY FILTERS ---
function applyFilters() {
    state.filteredUpdates = state.updates.filter(update => {
        // Filter by Tag
        const matchesType = state.currentFilter === 'all' || 
                            update.type.toLowerCase() === state.currentFilter.toLowerCase();
        
        // Filter by Search Query
        const cleanContent = stripHtml(update.html).toLowerCase();
        const matchesSearch = update.date.toLowerCase().includes(state.searchQuery) ||
                              update.type.toLowerCase().includes(state.searchQuery) ||
                              cleanContent.includes(state.searchQuery);
                              
        return matchesType && matchesSearch;
    });
    
    renderFeed();
    updateStats();
    
    // If our current selection is not visible in the filtered results, select the first visible item
    if (state.filteredUpdates.length > 0) {
        const isCurrentSelectedVisible = state.filteredUpdates.some(u => u.id === state.selectedUpdate?.id);
        if (!isCurrentSelectedVisible) {
            selectUpdate(state.filteredUpdates[0].id);
        }
    } else {
        // Hide details panel since there are no items
        elements.workspaceEmpty.classList.remove('hidden');
        elements.workspaceContent.classList.add('hidden');
    }
}

// --- UTILITY: SET LOADING STATE ---
function setLoading(loading) {
    state.isLoading = loading;
    if (loading) {
        elements.iconRefresh.classList.add('spinning');
        elements.btnRefresh.classList.add('btn-secondary');
        elements.btnRefresh.classList.remove('btn-primary');
        
        elements.loadingState.classList.remove('hidden');
        elements.feedContainer.innerHTML = '';
        elements.emptyState.classList.add('hidden');
    } else {
        elements.iconRefresh.classList.remove('spinning');
        elements.btnRefresh.classList.remove('btn-secondary');
        elements.btnRefresh.classList.add('btn-primary');
        elements.loadingState.classList.add('hidden');
    }
}

// --- UTILITY: UPDATE STATS ---
function updateStats() {
    elements.statsBadgeNum.textContent = state.filteredUpdates.length;
}

// --- UTILITY: SHOW TOAST NOTIFICATION ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Choose appropriate SVG icon
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `
            <svg class="toast-success-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    } else {
        iconSvg = `
            <svg class="toast-error-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
    }
    
    toast.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000);
}

// --- UTILITY: COPY SPECIFIC CARD TEXT ---
function copyCardText(update) {
    const cleanText = stripHtml(update.html);
    const textToCopy = `BigQuery Release Notes (${update.date}) - [${update.type}]\n\n${cleanText}\n\nLink: ${update.link}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Nota copiada para a área de transferência!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Erro ao copiar nota', 'error');
    });
}

// --- UTILITY: EXPORT FILTERED NOTES TO CSV ---
function exportToCSV() {
    if (state.filteredUpdates.length === 0) {
        showToast('Não há notas no feed atual para exportar.', 'error');
        return;
    }
    
    let csvRows = [];
    // Headers
    csvRows.push('"Data","Tipo","Descricao","Link"');
    
    state.filteredUpdates.forEach(update => {
        const cleanDesc = stripHtml(update.html).replace(/\s+/g, ' ').trim().replace(/"/g, '""');
        const cleanDate = update.date.replace(/"/g, '""');
        const cleanType = update.type.replace(/"/g, '""');
        const cleanLink = update.link.replace(/"/g, '""');
        
        csvRows.push(`"${cleanDate}","${cleanType}","${cleanDesc}","${cleanLink}"`);
    });
    
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Planilha CSV baixada com sucesso!', 'success');
}

// --- UTILITY: THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        elements.iconSun.classList.add('hidden');
        elements.iconMoon.classList.remove('hidden');
    } else {
        document.body.classList.remove('light-theme');
        elements.iconSun.classList.remove('hidden');
        elements.iconMoon.classList.add('hidden');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    if (isLight) {
        localStorage.setItem('theme', 'light');
        elements.iconSun.classList.add('hidden');
        elements.iconMoon.classList.remove('hidden');
        showToast('Modo claro ativado!', 'success');
    } else {
        localStorage.setItem('theme', 'dark');
        elements.iconSun.classList.remove('hidden');
        elements.iconMoon.classList.add('hidden');
        showToast('Modo escuro ativado!', 'success');
    }
}
