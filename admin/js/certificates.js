import Admin from './admin.js';

// CertApp handles the participant table and bulk generation
const CertApp = {
    participants: [],
    templateData: null, // Stores the JSON canvas data used for generation

    async init() {
        Admin.init();

        // Load config and participants
        await this.loadConfig();
        await this.loadParticipants();

        // Bind Bulk Generate Button
        const bulkBtn = document.getElementById('bulkGenerateBtn');
        if (bulkBtn) {
            bulkBtn.onclick = () => {
                this.generateCertificates();
            };
        }

        // Bind Refresh
        window.refreshData = () => this.loadParticipants();
    },

    async loadConfig() {
        try {
            const config = await Admin.getSiteConfig();
            // Check settings.certificate_template first (our new storage), then fall back to top-level if it existed
            let template = config?.settings?.certificate_template || config?.certificate_template;

            if (template) {
                if (typeof template === 'string') {
                    this.templateData = JSON.parse(template);
                } else {
                    this.templateData = template;
                }
            } else {
                console.warn('No certificate template found in settings.');
            }
        } catch (error) {
            console.error('Failed to load certificate config:', error);
        }
    },

    async loadParticipants() {
        try {
            const { registrations } = await Admin.getRegistrations();
            // Filter confirmed and map data correctly
            this.participants = registrations
                .filter(r => r.status === 'confirmed')
                .map(r => {
                    // Handle participant data structure (it's inside r.participant JSONB)
                    const pData = r.participant || {};
                    return {
                        id: r.id || r.registration_id, // Use UUID if available
                        reg_number: r.registration_number,
                        full_name: pData.name || 'Unknown',
                        email: pData.email || 'N/A',
                        college: pData.college || 'N/A',
                        events: r.events || [],
                        status: r.status
                    };
                });

            const countEl = document.getElementById('confirmedCount');
            if (countEl) countEl.textContent = this.participants.length;

            this.renderTable();
        } catch (error) {
            console.error("Error loading participants", error);
            Admin.showToast('error', 'Error', 'Failed to load participants');
        }
    },

    renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (this.participants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #888;">No confirmed participants found.</td></tr>';
            return;
        }

        this.participants.forEach(p => {
            const row = document.createElement('tr');

            // Handle events array or single event
            let eventsDisplay = 'General Participation';
            if (p.events && Array.isArray(p.events) && p.events.length > 0) {
                eventsDisplay = p.events.join(', ');
            }

            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" value="${p.id}"></td>
                <td>${p.reg_number || 'N/A'}</td>
                <td><strong>${p.full_name}</strong></td>
                <td>${p.email}</td>
                <td>${p.college || 'N/A'}</td>
                <td><span class="badge" style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${eventsDisplay}</span></td>
                <td>
                    <button class="btn-sm btn-icon" onclick="window.CertApp.generateForId('${p.id}')" title="Download Certificate">
                        ⬇️
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        const genCount = document.getElementById('generatedCount');
        if (genCount) genCount.textContent = this.participants.length;

        // Select All Logic
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.checked = false;
            selectAll.onchange = (e) => {
                document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = e.target.checked);
            };
        }
    },

    async generateForId(id) {
        const p = this.participants.find(x => x.id === id);
        if (!p) return;
        await this.generatePDFs([p]);
    },

    async generateCertificates() {
        const checkboxes = document.querySelectorAll('.row-checkbox:checked');
        let selectedIds = Array.from(checkboxes).map(c => c.value);

        if (selectedIds.length === 0) {
            const confirmAll = confirm("No participants selected. Generate for ALL confirmed participants?");
            if (!confirmAll) return;
            selectedIds = this.participants.map(p => p.id);
        }

        const selectedParticipants = this.participants.filter(p => selectedIds.includes(p.id));
        await this.generatePDFs(selectedParticipants);
    },

    async generatePDFs(personList) {
        if (!this.templateData) {
            alert("No certificate template found! Please customize and save a template in the Builder first.");
            return;
        }

        const msg = `Generating ${personList.length} certificates...`;
        if (Admin.showToast) Admin.showToast('info', 'Generating', msg);

        // Create a hidden canvas for generation
        // We create a fresh one to avoid messing with any UI
        // Dimensions 1123x794 are mostly A4 landscape at 96 DPI
        const genCanvas = new fabric.Canvas(null, { width: 1123, height: 794, backgroundColor: '#ffffff' });

        for (const person of personList) {
            // Load template — handle both old and new format
            await new Promise(resolve => {
                // Deep copy to avoid mutating the original template definition between iterations
                const templateCopy = JSON.parse(JSON.stringify(this.templateData));

                // Filter out system objects and set background
                if (templateCopy.objects) {
                    templateCopy.objects = templateCopy.objects.filter(o => o.id !== 'page-bg' && o.id !== 'page-shadow');
                }

                // If the template had a custom background saved, use it; otherwise keep white
                if (!templateCopy.background) {
                    templateCopy.background = '#ffffff';
                }

                genCanvas.loadFromJSON(templateCopy, () => {
                    genCanvas.renderAll();
                    resolve();
                });
            });

            // Replace placeholders - iterate over objects
            // Important: We must get objects from the canvas instance after loading
            const objects = genCanvas.getObjects();

            objects.forEach(obj => {
                // Check for text (i-text, text, textbox)
                if ((obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') && obj.text) {
                    let text = obj.text;
                    let modified = false;

                    // Participant Name replacement
                    if (text.match(/{Participant Name}/i)) {
                        text = text.replace(/{Participant Name}/gi, person.full_name || 'Participant');
                        modified = true;
                    }

                    // Event Name replacement
                    if (text.match(/{Event Name}/i)) {
                        let eventName = 'CONSTRUO 2026';
                        if (person.events && Array.isArray(person.events) && person.events.length > 0) {
                            eventName = person.events.join(', ');
                        } else if (person.event_title) {
                            eventName = person.event_title;
                        }
                        text = text.replace(/{Event Name}/gi, eventName);
                        modified = true;
                    }

                    // College Name replacement
                    if (text.match(/{College Name}/i)) {
                        text = text.replace(/{College Name}/gi, person.college || '');
                        modified = true;
                    }

                    if (modified) {
                        obj.set('text', text);
                    }
                }
            });

            // Render synchronously after updates
            genCanvas.renderAll();

            // To generate high quality PDF, we multiply the canvas
            // Using 1.5x multiplier for better quality, essentially 150 DPI roughly
            const mult = 1.5;
            const imgWidth = 1123 * mult;
            const imgHeight = 794 * mult;
            const dataUrl = genCanvas.toDataURL({ format: 'png', multiplier: mult });

            // Create PDF
            // We set the PDF page size slightly larger (+2px) to prevent any sub-pixel overflow 
            // creating a second page due to rounding errors
            const opt = {
                margin: 0,
                filename: `Certificate_${(person.full_name || 'user').replace(/[^a-z0-9]/gi, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 1, useCORS: true },
                jsPDF: { unit: 'px', format: [imgWidth + 2, imgHeight + 2], orientation: 'landscape' }
            };

            const tempImg = document.createElement('img');
            tempImg.src = dataUrl;
            // Enforce exact dimensions matching the dataURL
            tempImg.style.width = `${imgWidth}px`;
            tempImg.style.height = `${imgHeight}px`;
            tempImg.style.display = 'block'; // Remove inline spacing

            // Wait for PDF generation before moving to next (to prevent browser freezing)
            await html2pdf().set(opt).from(tempImg).save();
        }

        if (Admin.showToast) Admin.showToast('success', 'Done', 'Certificates generated!');
    }
};

window.CertApp = CertApp;
document.addEventListener('DOMContentLoaded', () => CertApp.init());
