import Admin from './admin.js';

window.CertBuilder = {
    canvas: null,
    activeObject: null,
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0,
    paperSize: 'A4-landscape', // Default paper size
    paperSizes: {
        'A4-landscape': { width: 1122, height: 794, label: 'A4 Landscape (297x210mm)' },
        'A4-portrait': { width: 794, height: 1122, label: 'A4 Portrait (210x297mm)' },
        'Letter-landscape': { width: 1056, height: 816, label: 'Letter Landscape (11x8.5in)' },
        'Letter-portrait': { width: 816, height: 1056, label: 'Letter Portrait (8.5x11in)' },
        'A3-landscape': { width: 1587, height: 1122, label: 'A3 Landscape (420x297mm)' },
        'custom': { width: 1122, height: 794, label: 'Custom Size' }
    },

    async init() {
        console.log('Initializing Certificate Builder...');
        await Admin.init();

        // 1. Initialize Fabric Canvas (fills entire container)
        this.canvas = new fabric.Canvas('c', {
            backgroundColor: '#1e1e1e',
            selection: true,
            preserveObjectStacking: true
        });

        // 2. Setup Infinite Canvas — Zoom
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** delta;
            zoom = Math.min(Math.max(zoom, 0.1), 5);
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            this.updateZoomIndicator();
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // 3. Setup Infinite Canvas — Pan (Middle click or Alt+Drag)
        this.canvas.on('mouse:down', (opt) => {
            const evt = opt.e;
            if (evt.altKey || evt.button === 1) {
                this.isDragging = true;
                this.canvas.selection = false;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
                this.canvas.defaultCursor = 'grabbing';
                this.canvas.setCursor('grabbing');
                evt.preventDefault();
                evt.stopPropagation();
            }
        });

        this.canvas.on('mouse:move', (opt) => {
            if (this.isDragging) {
                const e = opt.e;
                const vpt = this.canvas.viewportTransform;
                vpt[4] += e.clientX - this.lastPosX;
                vpt[5] += e.clientY - this.lastPosY;
                this.canvas.requestRenderAll();
                this.lastPosX = e.clientX;
                this.lastPosY = e.clientY;
                e.preventDefault();
            }
        });

        this.canvas.on('mouse:up', () => {
            if (this.isDragging) {
                this.canvas.setViewportTransform(this.canvas.viewportTransform);
                this.isDragging = false;
                this.canvas.selection = true;
                this.canvas.defaultCursor = 'default';
            }
        });

        // 4. Selection & Property Events
        this.canvas.on('selection:created', (e) => this.onSelection(e));
        this.canvas.on('selection:updated', (e) => this.onSelection(e));
        this.canvas.on('selection:cleared', () => this.onCleared());
        this.canvas.on('object:modified', () => this.updatePropsFromObject());
        this.canvas.on('object:scaling', () => this.updatePropsFromObject());
        this.canvas.on('object:moving', () => this.updatePropsFromObject());

        // 5. Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 6. Save Button - Ensure proper binding
        const saveBtn = document.getElementById('saveBuilderBtn');
        if (saveBtn) {
            saveBtn.onclick = async (e) => {
                e.preventDefault();
                console.log('Save button clicked');
                try {
                    await this.saveTemplate();
                } catch (error) {
                    console.error('Error in save button handler:', error);
                    // Error toast already shown in saveTemplate, no need to show again
                }
            };
            console.log('Save button bound successfully');
        } else {
            console.error('Save button not found!');
        }

        // 6b. Paper Size Selector
        this.bindPaperSizeSelector();

        // 7. Property Inputs Binding
        this.bindPropertyInputs();

        // 8. Initial Layout — resize canvas to fill container
        this.resizeToFit();
        window.addEventListener('resize', () => {
            requestAnimationFrame(() => this.resizeToFit());
        });

        // 9. Load existing template data (before creating page background)
        await this.loadConfig();

        // 10. Create the visual "Page" on the infinite canvas (after loading config to get paper size)
        this.createPageBackground();

        console.log('Certificate Builder ready.');
    },

    // --- Layout ---

    resizeToFit() {
        const container = document.querySelector('.builder-canvas-container');
        if (!container) return;
        this.canvas.setWidth(container.clientWidth);
        this.canvas.setHeight(container.clientHeight);
        this.canvas.renderAll();
    },

    createPageBackground() {
        // Remove existing helper objects
        this.canvas.getObjects()
            .filter(o => o.id === 'page-bg' || o.id === 'page-shadow')
            .forEach(o => this.canvas.remove(o));

        // Get dimensions from current paper size
        const size = this.paperSizes[this.paperSize];
        const W = size.width;
        const H = size.height;

        // Shadow behind the page
        const shadow = new fabric.Rect({
            left: 12, top: 12,
            width: W, height: H,
            fill: 'rgba(0,0,0,0.45)',
            rx: 2, ry: 2,
            selectable: false, evented: false,
            id: 'page-shadow',
            excludeFromExport: true
        });

        // The white page
        const page = new fabric.Rect({
            left: 0, top: 0,
            width: W, height: H,
            fill: '#ffffff',
            selectable: false, evented: false,
            id: 'page-bg',
            stroke: '#e0e0e0',
            strokeWidth: 1,
            excludeFromExport: true
        });

        this.canvas.add(shadow);
        this.canvas.add(page);
        this.canvas.sendToBack(page);
        this.canvas.sendToBack(shadow);

        this.centerPage();
    },

    centerPage() {
        // Get dimensions from current paper size
        const size = this.paperSizes[this.paperSize];
        const W = size.width;
        const H = size.height;
        
        const container = document.querySelector('.builder-canvas-container');
        if (!container) return;

        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const padding = 80;

        let scale = Math.min((cw - padding) / W, (ch - padding) / H);
        if (scale <= 0) scale = 0.1;

        const vpt = [scale, 0, 0, scale, 0, 0];
        vpt[4] = (cw - W * scale) / 2;
        vpt[5] = (ch - H * scale) / 2;

        this.canvas.setViewportTransform(vpt);
        this.updateZoomIndicator();
    },

    updateZoomIndicator() {
        const zoom = this.canvas.getZoom();
        const el = document.getElementById('zoomLevel');
        if (el) el.textContent = Math.round(zoom * 100) + '%';
    },

    // --- Paper Size Management ---

    bindPaperSizeSelector() {
        const selector = document.getElementById('paperSizeSelect');
        if (selector) {
            selector.onchange = (e) => {
                this.changePaperSize(e.target.value);
            };
            // Update selector to current value
            selector.value = this.paperSize;
            console.log('Paper size selector bound successfully');
        } else {
            console.warn('Paper size selector not found in HTML');
        }
    },

    changePaperSize(newSize) {
        if (!this.paperSizes[newSize]) {
            console.error('Invalid paper size:', newSize);
            return;
        }
        this.paperSize = newSize;
        this.createPageBackground(); // Recreate the page with new dimensions
        Admin.showToast('info', 'Paper Size Changed', `Changed to ${this.paperSizes[newSize].label}`);
        console.log('Paper size changed to:', newSize);
    },

    // --- Keyboard ---

    handleKeyboard(e) {
        // Delete key
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Don't delete if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            this.deleteSelected();
            e.preventDefault();
        }

        // Ctrl+A = Select all (non-system objects)
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
            const objs = this.canvas.getObjects().filter(o => o.id !== 'page-bg' && o.id !== 'page-shadow' && o.selectable !== false);
            const selection = new fabric.ActiveSelection(objs, { canvas: this.canvas });
            this.canvas.setActiveObject(selection);
            this.canvas.requestRenderAll();
        }
    },

    // --- Data ---

    async loadConfig() {
        try {
            console.log('Loading certificate template config...');
            const config = await Admin.getSiteConfig();
            console.log('Site config loaded:', config);
            
            // Check settings.certificate_template first (our new storage), then fall back to top-level if it existed
            let data = config?.settings?.certificate_template || config?.certificate_template;

            if (data) {
                if (typeof data === 'string') data = JSON.parse(data);

                // Load paper size if saved
                if (data.paperSize && this.paperSizes[data.paperSize]) {
                    this.paperSize = data.paperSize;
                    console.log('Loaded paper size:', this.paperSize);
                    // Update selector
                    const selector = document.getElementById('paperSizeSelect');
                    if (selector) selector.value = this.paperSize;
                }

                if (data && data.objects) {
                    fabric.util.enlivenObjects(data.objects, (objs) => {
                        objs.forEach(obj => {
                            if (obj.id === 'page-bg' || obj.id === 'page-shadow') return;
                            this.canvas.add(obj);
                        });
                        this.canvas.renderAll();
                    });
                    console.log('Template loaded successfully with', data.objects.length, 'objects');
                } else {
                    console.log('No template objects found');
                }
            } else {
                console.log('No certificate template data found in config');
            }
        } catch (error) {
            console.error('Failed to load certificate config:', error);
            Admin.showToast('warning', 'Load Warning', 'No existing template found. Starting fresh.');
        }
    },

    async saveTemplate() {
        console.log('=== Starting saveTemplate ==>');
        
        // Show loading indicator
        const saveBtn = document.getElementById('saveBuilderBtn');
        const originalText = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Saving...';
        }
        
        try {
            // Serialize, excluding system helper objects
            const json = this.canvas.toJSON(['data_type', 'id']);
            json.objects = json.objects.filter(o => o.id !== 'page-bg' && o.id !== 'page-shadow');
            
            // Save paper size with template
            json.paperSize = this.paperSize;
            
            console.log('Template JSON created with', json.objects.length, 'objects');
            console.log('Paper size:', this.paperSize);

            // Fetch current config to ensure we don't overwrite other settings
            console.log('Fetching current config...');
            const currentConfig = await Admin.getSiteConfig();
            console.log('Current config retrieved:', currentConfig);
            
            const currentSettings = currentConfig.settings || {};
            console.log('Current settings:', currentSettings);

            // Merge our template into settings
            const newSettings = {
                ...currentSettings,
                certificate_template: json
            };
            console.log('New settings prepared, updating...');

            const result = await Admin.updateSiteConfig('settings', newSettings);
            console.log('Update result:', result);
            
            Admin.showToast('success', 'Saved Successfully', `Certificate template saved with ${json.objects.length} objects!`);
            console.log('=== saveTemplate completed successfully ==>');
            return result;
        } catch (error) {
            console.error('=== Failed to save template ===>');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            
            // Check if it's a timeout/CORS error
            let errorMessage = error.message;
            if (error.message.includes('timed out') || error.message.includes('CORS')) {
                errorMessage = 'Connection timeout. Please add http://localhost:8000 to Supabase CORS settings in your dashboard.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Check your internet connection and Supabase CORS settings.';
            }
            
            Admin.showToast('error', 'Save Failed', errorMessage);
            throw error;
        } finally {
            // Restore button state
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        }
    },

    // --- Add Elements ---

    addText() {
        const text = new fabric.Textbox('New Text', {
            left: 100, top: 100,
            width: 300,
            fontSize: 40,
            fontFamily: 'Arial',
            fill: '#333333'
        });
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.canvas.renderAll();
    },

    addPlaceholder(type) {
        const map = {
            name: { text: '{Participant Name}', color: '#000000' },
            event: { text: '{Event Name}', color: '#555555' },
            college: { text: '{College Name}', color: '#555555' }
        };
        const conf = map[type];
        if (!conf) return;

        const text = new fabric.Textbox(conf.text, {
            left: 200, top: 200,
            width: 400,
            fontSize: 40,
            fontFamily: 'Arial',
            fill: conf.color,
            textAlign: 'center',
            data_type: type
        });

        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.canvas.renderAll();
    },

    addRect() {
        const rect = new fabric.Rect({
            left: 100, top: 100,
            fill: '#cccccc',
            width: 200, height: 100
        });
        this.canvas.add(rect);
        this.canvas.setActiveObject(rect);
        this.canvas.renderAll();
    },

    addCircle() {
        const circle = new fabric.Circle({
            left: 100, top: 100,
            radius: 50,
            fill: '#cccccc'
        });
        this.canvas.add(circle);
        this.canvas.setActiveObject(circle);
        this.canvas.renderAll();
    },

    addTriangle() {
        const triangle = new fabric.Triangle({
            left: 100, top: 100,
            width: 100, height: 100,
            fill: '#cccccc'
        });
        this.canvas.add(triangle);
        this.canvas.setActiveObject(triangle);
        this.canvas.renderAll();
    },

    addLine() {
        const line = new fabric.Line([0, 0, 200, 0], {
            left: 100, top: 100,
            stroke: '#000000',
            strokeWidth: 2
        });
        this.canvas.add(line);
        this.canvas.setActiveObject(line);
        this.canvas.renderAll();
    },

    addImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                    // Scale down large images to fit page
                    const maxW = 600;
                    if (img.width > maxW) {
                        const scale = maxW / img.width;
                        img.set({ scaleX: scale, scaleY: scale });
                    }
                    img.set({ left: 100, top: 100 });
                    this.canvas.add(img);
                    this.canvas.setActiveObject(img);
                    this.canvas.renderAll();
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },

    // --- Canvas Actions ---

    setBackgroundColor(color) {
        const pageBg = this.canvas.getObjects().find(o => o.id === 'page-bg');
        if (pageBg) {
            pageBg.set('fill', color);
            this.canvas.renderAll();
        }
    },

    deleteSelected() {
        const active = this.canvas.getActiveObjects();
        if (active.length) {
            this.canvas.discardActiveObject();
            active.forEach((obj) => {
                if (obj.id !== 'page-bg' && obj.id !== 'page-shadow') {
                    this.canvas.remove(obj);
                }
            });
            this.canvas.renderAll();
        }
    },

    bringForward() {
        const active = this.canvas.getActiveObject();
        if (active) {
            this.canvas.bringForward(active);
            this.canvas.renderAll();
        }
    },

    sendBackward() {
        const active = this.canvas.getActiveObject();
        if (active) {
            this.canvas.sendBackwards(active);
            // Ensure bg stays at bottom
            const bg = this.canvas.getObjects().find(o => o.id === 'page-bg');
            const shadow = this.canvas.getObjects().find(o => o.id === 'page-shadow');
            if (bg) this.canvas.sendToBack(bg);
            if (shadow) this.canvas.sendToBack(shadow);
            this.canvas.renderAll();
        }
    },

    setTextAlign(align) {
        if (this.activeObject && (this.activeObject.type === 'textbox' || this.activeObject.type === 'i-text')) {
            this.activeObject.set('textAlign', align);
            this.canvas.renderAll();
        }
    },

    // --- Selection & Properties ---

    onSelection(e) {
        const obj = e.selected[0];
        // Prevent selecting background helpers
        if (obj && (obj.id === 'page-bg' || obj.id === 'page-shadow')) {
            this.canvas.discardActiveObject();
            return;
        }

        this.activeObject = obj;
        const noSelMsg = document.getElementById('noSelectionMsg');
        const objProps = document.getElementById('objectProps');
        if (noSelMsg) noSelMsg.style.display = 'none';
        if (objProps) objProps.style.display = 'block';

        // Show/Hide type-specific props
        const textProps = document.getElementById('textProps');
        const rectProps = document.getElementById('rectProps'); // We reuse this for all shapes

        const isText = obj && (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text');
        const isShape = obj && (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'line');

        if (textProps) textProps.style.display = isText ? 'block' : 'none';

        // Update label for line vs shape
        if (rectProps) {
            rectProps.style.display = isShape ? 'block' : 'none';
            const label = rectProps.querySelector('.prop-label');
            if (label) label.textContent = (obj.type === 'line') ? 'Stroke Color' : 'Fill Color';
        }

        this.updatePropsFromObject();
    },

    onCleared() {
        this.activeObject = null;
        const noSelMsg = document.getElementById('noSelectionMsg');
        const objProps = document.getElementById('objectProps');
        if (noSelMsg) noSelMsg.style.display = 'block';
        if (objProps) objProps.style.display = 'none';
    },

    updatePropsFromObject() {
        if (!this.activeObject) return;
        const obj = this.activeObject;

        // Helper to convert any color to hex for input[type=color]
        const toHex = (c) => {
            if (!c) return '#000000';
            if (c.startsWith('#')) return c.slice(0, 7);
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.fillStyle = c;
            return ctx.fillStyle;
        };

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                // If it's a color input, ensure hex
                if (el.type === 'color') {
                    el.value = toHex(val);
                } else {
                    el.value = val;
                }
            }
        };

        setVal('propX', Math.round(obj.left));
        setVal('propY', Math.round(obj.top));
        setVal('propW', Math.round(obj.getScaledWidth()));
        setVal('propH', Math.round(obj.getScaledHeight()));

        if (obj.type === 'textbox' || obj.type === 'i-text') {
            setVal('propTextContent', obj.text);
            setVal('propFontFamily', obj.fontFamily);
            setVal('propFontSize', obj.fontSize);
            setVal('propColor', obj.fill);
        }

        if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
            setVal('propRectFill', obj.fill);
            setVal('propOpacity', Math.round((obj.opacity || 1) * 100));
        } else if (obj.type === 'line') {
            setVal('propRectFill', obj.stroke); // Use fill input for stroke
            setVal('propOpacity', Math.round((obj.opacity || 1) * 100));
        }
    },

    bindPropertyInputs() {
        const bind = (id, event, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, callback);
        };

        // Position
        ['propX', 'propY'].forEach(id => {
            bind(id, 'input', (e) => {
                if (!this.activeObject) return;
                this.activeObject.set(id === 'propX' ? 'left' : 'top', parseInt(e.target.value));
                this.activeObject.setCoords();
                this.canvas.renderAll();
            });
        });

        // Size
        ['propW', 'propH'].forEach(id => {
            bind(id, 'input', (e) => {
                if (!this.activeObject) return;
                const val = parseInt(e.target.value);
                if (id === 'propW') this.activeObject.scaleToWidth(val);
                else this.activeObject.scaleToHeight(val);
                this.activeObject.setCoords();
                this.canvas.renderAll();
            });
        });

        // Text Props
        bind('propTextContent', 'input', (e) => {
            if (this.activeObject && (this.activeObject.type === 'textbox' || this.activeObject.type === 'i-text')) {
                this.activeObject.set('text', e.target.value);
                this.canvas.renderAll();
            }
        });

        bind('propFontFamily', 'change', (e) => {
            if (this.activeObject && (this.activeObject.type === 'textbox' || this.activeObject.type === 'i-text')) {
                this.activeObject.set('fontFamily', e.target.value);
                this.canvas.renderAll();
            }
        });

        bind('propFontSize', 'input', (e) => {
            if (this.activeObject && (this.activeObject.type === 'textbox' || this.activeObject.type === 'i-text')) {
                this.activeObject.set('fontSize', parseInt(e.target.value));
                this.canvas.renderAll();
            }
        });

        bind('propColor', 'input', (e) => {
            if (this.activeObject) {
                this.activeObject.set('fill', e.target.value);
                this.canvas.renderAll();
            }
        });

        // Shape props (Rect, Circle, Triangle, Line)
        bind('propRectFill', 'input', (e) => {
            if (!this.activeObject) return;
            const val = e.target.value;

            if (this.activeObject.type === 'line') {
                this.activeObject.set('stroke', val);
            } else if (['rect', 'circle', 'triangle'].includes(this.activeObject.type)) {
                this.activeObject.set('fill', val);
            }
            this.canvas.renderAll();
        });

        bind('propOpacity', 'input', (e) => {
            if (this.activeObject) {
                this.activeObject.set('opacity', parseInt(e.target.value) / 100);
                this.canvas.renderAll();
            }
        });

        // Bold / Italic toggles
        const boldBtn = document.getElementById('propBold');
        if (boldBtn) boldBtn.onclick = () => {
            if (this.activeObject && (this.activeObject.type === 'textbox' || this.activeObject.type === 'i-text')) {
                const isBold = this.activeObject.fontWeight === 'bold';
                this.activeObject.set('fontWeight', isBold ? 'normal' : 'bold');
                boldBtn.style.background = isBold ? '#2e2e2e' : '#ea580c';
                this.canvas.renderAll();
            }
        };

        const italicBtn = document.getElementById('propItalic');
        if (italicBtn) italicBtn.onclick = () => {
            if (this.activeObject && (this.activeObject.type === 'textbox' || this.activeObject.type === 'i-text')) {
                const isItalic = this.activeObject.fontStyle === 'italic';
                this.activeObject.set('fontStyle', isItalic ? 'normal' : 'italic');
                italicBtn.style.background = isItalic ? '#2e2e2e' : '#ea580c';
                this.canvas.renderAll();
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CertBuilder.init();
});
