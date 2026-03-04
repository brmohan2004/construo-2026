/**
 * CONSTRUO 2026 - Certificates Page Logic
 * Handles confirmed participants table, preview, download, and bulk generation.
 */
import Admin from './admin.js';

const CertApp = {
    participants: [],
    tableData: [],
    filteredData: [],
    canvasJson: null,
    paperSize: 'A4-landscape',
    selectedIds: new Set(),

    templateConfig: {
        eventName: 'CONSTRUO 2026',
        college: 'Government College of Technology, Coimbatore',
        sig1Name: 'Dr. A. Ramesh',
        sig1Title: 'Event Coordinator',
        sig2Name: 'Prof. S. Kumar',
        sig2Title: 'Head of Department',
        themeColor: '#c5a059',
        bgUrl: ''
    },

    paperSizes: {
        'A4-landscape': { width: 1123, height: 794 },
        'A4-portrait': { width: 794, height: 1123 },
        'Letter-landscape': { width: 1100, height: 850 },
        'Letter-portrait': { width: 850, height: 1100 },
        'A3-landscape': { width: 1587, height: 1122 },
    },

    async init() {
        Admin.init();
        await this.loadConfig();
        await this.loadParticipants();
        this.bindEvents();
        console.log('CertApp Initialized');
    },

    async loadConfig() {
        try {
            const config = await Admin.getSiteConfig();
            if (config?.certificates) {
                this.templateConfig = { ...this.templateConfig, ...config.certificates };
            }
            let data = config?.settings?.certificate_template || config?.certificate_template;
            if (data) {
                if (typeof data === 'string') data = JSON.parse(data);
                this.canvasJson = data;
                if (data.paperSize) this.paperSize = data.paperSize;
            }
            this.applyTemplateConfig();
        } catch (error) {
            console.error('Failed to load certificate config:', error);
        }
    },

    applyTemplateConfig() {
        const conf = this.templateConfig;
        const setIfExists = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setIfExists('cert-event-display', conf.eventName);
        setIfExists('cert-college-display', conf.college);
        setIfExists('cert-sig1-name', conf.sig1Name);
        setIfExists('cert-sig1-title', conf.sig1Title);
        setIfExists('cert-sig2-name', conf.sig2Name);
        setIfExists('cert-sig2-title', conf.sig2Title);
        document.documentElement.style.setProperty('--cert-accent', conf.themeColor);
    },

    async loadParticipants() {
        try {
            const { registrations } = await Admin.getRegistrations();
            this.participants = registrations.filter(r => r.status === 'confirmed');

            this.tableData = [];
            this.participants.forEach(p => {
                const events = (p.events && p.events.length > 0) ? p.events : ['General Participation'];
                events.forEach(eventName => {
                    this.tableData.push({
                        ...p,
                        uniqueId: `${p.id}_${eventName.replace(/\s+/g, '_')}`,
                        targetEvent: eventName
                    });
                });
            });

            this.filteredData = [...this.tableData];
            this.renderTable();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load participants:', error);
            document.getElementById('tableBody').innerHTML =
                '<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;">Error loading data. Please try refreshing.</td></tr>';
        }
    },

    updateStats() {
        document.getElementById('confirmedCount').textContent = this.participants.length;
        document.getElementById('totalRowCount').textContent = this.tableData.length;
        document.getElementById('selectedCount').textContent = this.selectedIds.size;
    },

    renderTable() {
        const tbody = document.getElementById('tableBody');
        if (this.filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="cert-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p>No confirmed participants found.</p>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = this.filteredData.map(row => {
            const isSelected = this.selectedIds.has(row.uniqueId);
            return `<tr class="${isSelected ? 'selected-row' : ''}" data-uid="${row.uniqueId}">
                <td class="cert-cell-check">
                    <input type="checkbox" class="participant-checkbox" value="${row.uniqueId}" ${isSelected ? 'checked' : ''}>
                </td>
                <td><span class="cert-cell-reg">${row.registrationNumber || 'N/A'}</span></td>
                <td class="cert-cell-name">${row.participant?.name || 'N/A'}</td>
                <td class="cert-cell-email">${row.participant?.email || 'N/A'}</td>
                <td class="cert-cell-college">${row.participant?.college || 'N/A'}</td>
                <td><span class="cert-cell-event">${row.targetEvent}</span></td>
                <td>
                    <div class="cert-actions">
                        <button class="cert-action-btn cert-action-preview" data-uid="${row.uniqueId}" title="Preview Certificate">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Preview
                        </button>
                        <button class="cert-action-btn cert-action-download" data-uid="${row.uniqueId}" title="Download Certificate">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    bindEvents() {
        // Select All
        document.getElementById('selectAll').addEventListener('change', e => {
            const checked = e.target.checked;
            if (checked) {
                this.filteredData.forEach(r => this.selectedIds.add(r.uniqueId));
            } else {
                this.selectedIds.clear();
            }
            this.renderTable();
            this.updateBulkButton();
            this.updateStats();
        });

        // Individual checkbox clicks (delegation)
        document.getElementById('tableBody').addEventListener('change', e => {
            if (e.target.classList.contains('participant-checkbox')) {
                const uid = e.target.value;
                if (e.target.checked) {
                    this.selectedIds.add(uid);
                    e.target.closest('tr').classList.add('selected-row');
                } else {
                    this.selectedIds.delete(uid);
                    e.target.closest('tr').classList.remove('selected-row');
                }
                this.updateBulkButton();
                this.updateStats();

                // Update selectAll state
                const allChecked = this.filteredData.every(r => this.selectedIds.has(r.uniqueId));
                document.getElementById('selectAll').checked = allChecked;
            }
        });

        // Action button clicks (delegation)
        document.getElementById('tableBody').addEventListener('click', e => {
            const previewBtn = e.target.closest('.cert-action-preview');
            const downloadBtn = e.target.closest('.cert-action-download');

            if (previewBtn) {
                const uid = previewBtn.dataset.uid;
                this.previewCertificate(uid);
            }
            if (downloadBtn) {
                const uid = downloadBtn.dataset.uid;
                this.downloadSingle(uid);
            }
        });

        // Bulk button
        document.getElementById('bulkActionBtn').addEventListener('click', () => this.handleBulkAction());

        // Search
        document.getElementById('searchInput').addEventListener('input', e => {
            this.filterTable(e.target.value);
        });

        // Preview modal close
        document.getElementById('closePreview').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('closePreviewBtn').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('previewModal').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closePreviewModal();
        });

        // Download from preview
        document.getElementById('downloadFromPreview').addEventListener('click', () => {
            if (this._previewRow) this.downloadPDF(this._previewRow);
        });
    },

    filterTable(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            this.filteredData = [...this.tableData];
        } else {
            this.filteredData = this.tableData.filter(row => {
                const name = (row.participant?.name || '').toLowerCase();
                const email = (row.participant?.email || '').toLowerCase();
                const college = (row.participant?.college || '').toLowerCase();
                const regNum = (row.registrationNumber || '').toLowerCase();
                const event = (row.targetEvent || '').toLowerCase();
                return name.includes(q) || email.includes(q) || college.includes(q) || regNum.includes(q) || event.includes(q);
            });
        }
        this.renderTable();
    },

    updateBulkButton() {
        const btn = document.getElementById('bulkActionBtn');
        const text = document.getElementById('bulkBtnText');
        const icon = document.getElementById('bulkIcon');
        const count = this.selectedIds.size;

        if (count >= 2) {
            btn.disabled = false;
            btn.classList.add('active-download');
            text.textContent = `Download ${count} Certificates`;
            icon.innerHTML = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
        } else if (count === 1) {
            btn.disabled = false;
            btn.classList.remove('active-download');
            text.textContent = `1 Selected — Select more`;
            icon.innerHTML = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>';
        } else {
            btn.disabled = true;
            btn.classList.remove('active-download');
            text.textContent = 'Bulk Generation';
            icon.innerHTML = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>';
        }
    },

    async handleBulkAction() {
        const count = this.selectedIds.size;
        if (count < 2) {
            Admin.showToast('warning', 'Selection Required', 'Please select at least 2 participants.');
            return;
        }

        // Show processing overlay
        const overlay = document.createElement('div');
        overlay.className = 'cert-processing-overlay';
        overlay.innerHTML = `<div class="cert-processing-card">
            <div class="spinner"></div>
            <p>Generating certificates...</p>
            <div class="progress-text" id="bulkProgress">0 / ${count}</div>
        </div>`;
        document.body.appendChild(overlay);

        let done = 0;
        for (const uid of this.selectedIds) {
            const row = this.tableData.find(r => r.uniqueId === uid);
            if (row) {
                await this.downloadPDF(row);
                done++;
                const el = document.getElementById('bulkProgress');
                if (el) el.textContent = `${done} / ${count}`;
            }
        }

        document.body.removeChild(overlay);
        Admin.showToast('success', 'Complete', `${done} certificates downloaded successfully!`);
    },

    // --- Preview ---
    previewCertificate(uniqueId) {
        const row = this.tableData.find(r => r.uniqueId === uniqueId);
        if (!row) return;
        this._previewRow = row;

        const modal = document.getElementById('previewModal');
        const body = document.getElementById('previewBody');

        if (this.canvasJson) {
            body.innerHTML = '<div class="cert-preview-canvas-wrap"><canvas id="previewCanvas"></canvas></div>';
            modal.classList.add('active');

            setTimeout(() => {
                const dims = this.paperSizes[this.paperSize] || this.paperSizes['A4-landscape'];
                const canvasEl = document.getElementById('previewCanvas');
                const staticCanvas = new fabric.StaticCanvas('previewCanvas', {
                    width: dims.width,
                    height: dims.height
                });

                staticCanvas.loadFromJSON(JSON.parse(JSON.stringify(this.canvasJson)), () => {
                    staticCanvas.getObjects().forEach(obj => {
                        if (obj.data_type && (obj.type === 'textbox' || obj.type === 'i-text')) {
                            if (obj.data_type === 'name') obj.set('text', (row.participant?.name || 'PARTICIPANT').toUpperCase());
                            if (obj.data_type === 'event') obj.set('text', row.targetEvent || '{Event Name}');
                            if (obj.data_type === 'college') obj.set('text', row.participant?.college || '{College Name}');
                        }
                    });
                    staticCanvas.renderAll();
                });
            }, 100);
        } else {
            // Fallback: show the HTML template
            const clone = document.getElementById('cert-content').cloneNode(true);
            clone.style.display = 'block';
            clone.querySelector('#cert-user-name').textContent = (row.participant?.name || 'PARTICIPANT').toUpperCase();
            clone.querySelector('#cert-participation-event').textContent = `for ${row.targetEvent}`;
            body.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'cert-preview-fallback';
            wrap.appendChild(clone);
            body.appendChild(wrap);
            modal.classList.add('active');
        }
    },

    closePreviewModal() {
        const modal = document.getElementById('previewModal');
        modal.classList.remove('active');
        this._previewRow = null;
    },

    // --- Download ---
    async downloadSingle(uniqueId) {
        const row = this.tableData.find(r => r.uniqueId === uniqueId);
        if (row) {
            Admin.showToast('info', 'Generating', `Creating certificate for ${row.participant?.name || 'participant'}...`);
            await this.downloadPDF(row);
        }
    },

    async downloadPDF(row) {
        if (this.canvasJson) {
            return new Promise((resolve) => {
                const canvasEl = document.createElement('canvas');
                canvasEl.id = 'temp-cert-canvas-' + Date.now();
                canvasEl.style.display = 'none';
                document.body.appendChild(canvasEl);

                const dims = this.paperSizes[this.paperSize] || this.paperSizes['A4-landscape'];
                const staticCanvas = new fabric.StaticCanvas(canvasEl.id, {
                    width: dims.width,
                    height: dims.height
                });

                staticCanvas.loadFromJSON(JSON.parse(JSON.stringify(this.canvasJson)), () => {
                    staticCanvas.getObjects().forEach(obj => {
                        if (obj.data_type && (obj.type === 'textbox' || obj.type === 'i-text')) {
                            if (obj.data_type === 'name') obj.set('text', (row.participant?.name || 'PARTICIPANT').toUpperCase());
                            if (obj.data_type === 'event') obj.set('text', row.targetEvent || '{Event Name}');
                            if (obj.data_type === 'college') obj.set('text', row.participant?.college || '{College Name}');
                        }
                    });
                    staticCanvas.renderAll();

                    const dataUrl = staticCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });

                    const pxToMm = (px) => (px * 25.4) / 96;
                    const pdfWidth = pxToMm(dims.width);
                    const pdfHeight = pxToMm(dims.height);
                    const orientation = dims.width >= dims.height ? 'landscape' : 'portrait';

                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF({
                        orientation: orientation,
                        unit: 'mm',
                        format: [pdfWidth, pdfHeight]
                    });

                    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

                    const safeName = (row.participant?.name || 'Participant').replace(/\s+/g, '_');
                    const safeEvent = (row.targetEvent || 'Event').replace(/\s+/g, '_');
                    pdf.save(`${safeName}_${safeEvent}.pdf`);

                    document.body.removeChild(canvasEl);
                    resolve();
                });
            });
        }

        // Fallback to html2pdf
        document.getElementById('cert-user-name').textContent = (row.participant?.name || 'PARTICIPANT').toUpperCase();
        document.getElementById('cert-participation-event').textContent = `for ${row.targetEvent}`;

        const element = document.getElementById('cert-content');
        const opt = {
            margin: 0,
            filename: `${(row.participant?.name || 'Participant').replace(/\s+/g, '_')}_${(row.targetEvent || 'Event').replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 3, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF error:', error);
            Admin.showToast('error', 'Generation Error', 'Failed to generate PDF');
        }
    }
};

window.CertApp = CertApp;
window.refreshData = () => CertApp.loadParticipants();
document.addEventListener('DOMContentLoaded', () => CertApp.init());
