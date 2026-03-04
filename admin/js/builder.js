import Admin from './admin.js';
import supabase from './supabase-config.js';

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
        // Sync custom size inputs with current size
        this.syncSizeInputs();
    },

    syncSizeInputs() {
        const size = this.paperSizes[this.paperSize];
        if (!size) return;
        const wInput = document.getElementById('customWidth');
        const hInput = document.getElementById('customHeight');
        if (wInput) wInput.value = size.width;
        if (hInput) hInput.value = size.height;
    },

    changePaperSize(newSize) {
        if (!this.paperSizes[newSize]) {
            console.error('Invalid paper size:', newSize);
            return;
        }
        this.paperSize = newSize;
        this.syncSizeInputs();
        this.createPageBackground();
        Admin.showToast('info', 'Paper Size Changed', `Changed to ${this.paperSizes[newSize].label} (${this.paperSizes[newSize].width}×${this.paperSizes[newSize].height}px)`);
        console.log('Paper size changed to:', newSize);
    },

    applyCustomSize() {
        const wInput = document.getElementById('customWidth');
        const hInput = document.getElementById('customHeight');
        if (!wInput || !hInput) return;

        let w = parseInt(wInput.value) || 1123;
        let h = parseInt(hInput.value) || 794;

        // Clamp values
        w = Math.max(200, Math.min(4000, w));
        h = Math.max(200, Math.min(4000, h));
        wInput.value = w;
        hInput.value = h;

        // Update the custom paper size entry
        this.paperSizes['custom'] = { width: w, height: h, label: 'Custom Size' };
        this.paperSize = 'custom';

        // Update dropdown
        const selector = document.getElementById('paperSizeSelect');
        if (selector) selector.value = 'custom';

        this.createPageBackground();
        Admin.showToast('info', 'Custom Size Applied', `Certificate resized to ${w}×${h}px`);
        console.log('Custom size applied:', w, 'x', h);
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
                if (data.paperSize) {
                    // If custom, restore the custom dimensions
                    if (data.paperSize === 'custom' && data.customWidth && data.customHeight) {
                        this.paperSizes['custom'] = {
                            width: data.customWidth,
                            height: data.customHeight,
                            label: 'Custom Size'
                        };
                    }
                    if (this.paperSizes[data.paperSize]) {
                        this.paperSize = data.paperSize;
                        console.log('Loaded paper size:', this.paperSize);
                        const selector = document.getElementById('paperSizeSelect');
                        if (selector) selector.value = this.paperSize;
                    }
                    this.syncSizeInputs();
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
            const json = this.canvas.toJSON(['data_type', 'id', 'shadow', 'strokeWidth', 'stroke', 'charSpacing', 'lineHeight', 'opacity', 'textBackgroundColor', 'underline', 'linethrough', 'paintFirst']);
            json.objects = json.objects.filter(o => o.id !== 'page-bg' && o.id !== 'page-shadow');

            // Save paper size with template
            json.paperSize = this.paperSize;
            // Save custom dimensions so they can be restored
            const currentSize = this.paperSizes[this.paperSize];
            if (currentSize) {
                json.customWidth = currentSize.width;
                json.customHeight = currentSize.height;
            }

            console.log('Template JSON created with', json.objects.length, 'objects');
            console.log('Paper size:', this.paperSize);

            // Try to fetch current config with retry logic
            console.log('Fetching current config...');
            let currentSettings = {};

            try {
                const currentConfig = await Admin.getSiteConfig();
                console.log('Current config retrieved:', currentConfig);
                currentSettings = currentConfig.settings || {};
                console.log('Current settings:', currentSettings);
            } catch (configError) {
                console.warn('Failed to fetch current config, will use fallback:', configError.message);
                // Fallback: Try to fetch only settings column directly
                try {
                    console.log('Attempting direct settings fetch...');
                    const { data, error } = await supabase
                        .from('site_config')
                        .select('settings')
                        .eq('config_key', 'main')
                        .single();

                    if (!error && data) {
                        currentSettings = data.settings || {};
                        console.log('Direct fetch successful, got settings');
                    } else {
                        console.warn('Direct fetch failed, using empty settings');
                    }
                } catch (directError) {
                    console.warn('Direct fetch also failed, continuing with empty settings');
                }
            }

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
            let detailedHelp = '';

            if (error.message.includes('timed out') || error.message.includes('CORS')) {
                errorMessage = 'Database connection timeout';
                detailedHelp = 'Please run fix_certificate_builder_timeout.sql in your Supabase SQL editor, then refresh this page.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error';
                detailedHelp = 'Check your internet connection and ensure Supabase is accessible.';
            } else if (error.message.includes('permission denied') || error.message.includes('policy')) {
                errorMessage = 'Permission denied';
                detailedHelp = 'Run fix_certificate_builder_timeout.sql to update database policies.';
            }

            Admin.showToast('error', 'Save Failed', `${errorMessage}. ${detailedHelp}`);
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
        const enhancerPanel = document.getElementById('textEnhancerPanel');

        const isText = obj && (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text');
        const isShape = obj && (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'line');

        if (textProps) textProps.style.display = isText ? 'block' : 'none';
        if (enhancerPanel) enhancerPanel.style.display = isText ? 'block' : 'none';

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
        const enhancerPanel = document.getElementById('textEnhancerPanel');
        if (noSelMsg) noSelMsg.style.display = 'block';
        if (objProps) objProps.style.display = 'none';
        if (enhancerPanel) enhancerPanel.style.display = 'none';
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
            this.updateEnhancerFromObject(obj);
        }

        if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
            setVal('propRectFill', obj.fill);
            setVal('propOpacity', Math.round((obj.opacity || 1) * 100));
        } else if (obj.type === 'line') {
            setVal('propRectFill', obj.stroke); // Use fill input for stroke
            setVal('propOpacity', Math.round((obj.opacity || 1) * 100));
        }
    },

    // --- Text Enhancer Methods ---

    updateEnhancerFromObject(obj) {
        if (!obj) return;
        const setRange = (id, val, displayId, displaySuffix) => {
            const el = document.getElementById(id);
            const display = document.getElementById(displayId);
            if (el) el.value = val;
            if (display) display.textContent = (displaySuffix !== undefined) ? val + displaySuffix : val;
        };

        // Shadow
        const shadow = obj.shadow;
        if (shadow) {
            const s = typeof shadow === 'string' ? new fabric.Shadow(shadow) : shadow;
            const colorEl = document.getElementById('enhShadowColor');
            if (colorEl) colorEl.value = this._toHex(s.color || '#000000');
            setRange('enhShadowBlur', s.blur || 0, 'enhShadowBlurVal', '');
            setRange('enhShadowX', s.offsetX || 0, 'enhShadowXVal', '');
            setRange('enhShadowY', s.offsetY || 0, 'enhShadowYVal', '');
        } else {
            const colorEl = document.getElementById('enhShadowColor');
            if (colorEl) colorEl.value = '#000000';
            setRange('enhShadowBlur', 0, 'enhShadowBlurVal', '');
            setRange('enhShadowX', 0, 'enhShadowXVal', '');
            setRange('enhShadowY', 0, 'enhShadowYVal', '');
        }

        // Stroke
        const strokeColorEl = document.getElementById('enhStrokeColor');
        if (strokeColorEl) strokeColorEl.value = this._toHex(obj.stroke || '#000000');
        setRange('enhStrokeWidth', obj.strokeWidth || 0, 'enhStrokeWidthVal', '');

        // Spacing
        setRange('enhLetterSpacing', obj.charSpacing || 0, 'enhLetterSpacingVal', '');
        setRange('enhLineHeight', obj.lineHeight || 1.16, 'enhLineHeightVal', '');

        // Opacity
        setRange('enhTextOpacity', Math.round((obj.opacity || 1) * 100), 'enhTextOpacityVal', '%');

        // Background
        const bgToggle = document.getElementById('enhBgToggle');
        const bgColor = document.getElementById('enhBgColor');
        if (obj.textBackgroundColor && obj.textBackgroundColor !== '') {
            if (bgToggle) { bgToggle.textContent = 'On'; bgToggle.classList.add('active'); }
            if (bgColor) bgColor.value = this._toHex(obj.textBackgroundColor);
        } else {
            if (bgToggle) { bgToggle.textContent = 'Off'; bgToggle.classList.remove('active'); }
        }

        // Transforms
        const upperBtn = document.getElementById('enhUppercase');
        const capBtn = document.getElementById('enhCapitalize');
        const underBtn = document.getElementById('enhUnderline');
        const lineBtn = document.getElementById('enhLinethrough');

        if (upperBtn) upperBtn.classList.toggle('active', obj._enhUppercase || false);
        if (capBtn) capBtn.classList.toggle('active', obj._enhCapitalize || false);
        if (underBtn) underBtn.classList.toggle('active', obj.underline || false);
        if (lineBtn) lineBtn.classList.toggle('active', obj.linethrough || false);
    },

    _toHex(c) {
        if (!c) return '#000000';
        if (c.startsWith('#')) return c.slice(0, 7);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = c;
        return ctx.fillStyle;
    },

    _applyShadow() {
        if (!this.activeObject) return;
        const color = document.getElementById('enhShadowColor')?.value || '#000000';
        const blur = parseFloat(document.getElementById('enhShadowBlur')?.value) || 0;
        const offsetX = parseFloat(document.getElementById('enhShadowX')?.value) || 0;
        const offsetY = parseFloat(document.getElementById('enhShadowY')?.value) || 0;

        if (blur === 0 && offsetX === 0 && offsetY === 0) {
            this.activeObject.set('shadow', null);
        } else {
            this.activeObject.set('shadow', new fabric.Shadow({
                color: color,
                blur: blur,
                offsetX: offsetX,
                offsetY: offsetY
            }));
        }
        this.canvas.renderAll();
    },

    applyTextPreset(preset) {
        if (!this.activeObject) return;
        const obj = this.activeObject;
        const isText = obj.type === 'textbox' || obj.type === 'i-text';
        if (!isText) return;

        // Reset first
        obj.set({
            shadow: null,
            stroke: null,
            strokeWidth: 0,
            paintFirst: 'fill'
        });

        switch (preset) {
            case 'glow':
                obj.set({
                    shadow: new fabric.Shadow({ color: '#f59e0b', blur: 15, offsetX: 0, offsetY: 0 }),
                    fill: '#fbbf24'
                });
                break;
            case 'emboss':
                obj.set({
                    shadow: new fabric.Shadow({ color: 'rgba(255,255,255,0.6)', blur: 1, offsetX: -1, offsetY: -1 }),
                    fill: '#555555'
                });
                break;
            case 'neon':
                obj.set({
                    shadow: new fabric.Shadow({ color: '#00ff88', blur: 20, offsetX: 0, offsetY: 0 }),
                    fill: '#00ff88',
                    stroke: '#00ff88',
                    strokeWidth: 0.5
                });
                break;
            case 'vintage':
                obj.set({
                    fill: '#8B4513',
                    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 3, offsetX: 2, offsetY: 2 }),
                    charSpacing: 200,
                    fontFamily: 'Cinzel'
                });
                break;
            case 'outline':
                obj.set({
                    fill: 'transparent',
                    stroke: '#333333',
                    strokeWidth: 2,
                    paintFirst: 'stroke'
                });
                break;
            case 'elegant':
                obj.set({
                    fill: '#c5a059',
                    shadow: new fabric.Shadow({ color: 'rgba(197,160,89,0.4)', blur: 8, offsetX: 0, offsetY: 2 }),
                    charSpacing: 300,
                    fontFamily: 'Great Vibes'
                });
                break;
        }

        this.canvas.renderAll();
        this.updatePropsFromObject();
        Admin.showToast('info', 'Preset Applied', `"${preset.charAt(0).toUpperCase() + preset.slice(1)}" style applied to text.`);
    },

    resetTextEnhancements() {
        if (!this.activeObject) return;
        const obj = this.activeObject;
        const isText = obj.type === 'textbox' || obj.type === 'i-text';
        if (!isText) return;

        obj.set({
            shadow: null,
            stroke: null,
            strokeWidth: 0,
            charSpacing: 0,
            lineHeight: 1.16,
            opacity: 1,
            textBackgroundColor: '',
            underline: false,
            linethrough: false,
            paintFirst: 'fill'
        });
        obj._enhUppercase = false;
        obj._enhCapitalize = false;

        this.canvas.renderAll();
        this.updatePropsFromObject();
        Admin.showToast('info', 'Reset', 'All text enhancements cleared.');
    },

    bindEnhancerInputs() {
        const self = this;
        const bind = (id, event, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, callback);
        };

        // Enhancer collapse/expand toggle
        const toggle = document.getElementById('enhancerToggle');
        const body = document.getElementById('enhancerBody');
        if (toggle && body) {
            toggle.addEventListener('click', () => {
                const collapsed = body.classList.toggle('collapsed');
                toggle.classList.toggle('collapsed', collapsed);
            });
        }

        // Shadow
        const shadowInputs = ['enhShadowColor', 'enhShadowBlur', 'enhShadowX', 'enhShadowY'];
        shadowInputs.forEach(id => {
            bind(id, 'input', () => {
                // Update display values
                const blurVal = document.getElementById('enhShadowBlur')?.value || 0;
                const xVal = document.getElementById('enhShadowX')?.value || 0;
                const yVal = document.getElementById('enhShadowY')?.value || 0;
                const blurDisplay = document.getElementById('enhShadowBlurVal');
                const xDisplay = document.getElementById('enhShadowXVal');
                const yDisplay = document.getElementById('enhShadowYVal');
                if (blurDisplay) blurDisplay.textContent = blurVal;
                if (xDisplay) xDisplay.textContent = xVal;
                if (yDisplay) yDisplay.textContent = yVal;
                self._applyShadow();
            });
        });

        // Stroke
        bind('enhStrokeColor', 'input', () => {
            if (!self.activeObject) return;
            self.activeObject.set('stroke', document.getElementById('enhStrokeColor').value);
            self.canvas.renderAll();
        });
        bind('enhStrokeWidth', 'input', (e) => {
            if (!self.activeObject) return;
            const val = parseFloat(e.target.value);
            document.getElementById('enhStrokeWidthVal').textContent = val;
            self.activeObject.set('strokeWidth', val);
            if (val > 0) {
                self.activeObject.set('paintFirst', 'stroke');
                if (!self.activeObject.stroke) {
                    self.activeObject.set('stroke', document.getElementById('enhStrokeColor')?.value || '#000000');
                }
            } else {
                self.activeObject.set('stroke', null);
                self.activeObject.set('strokeWidth', 0);
            }
            self.canvas.renderAll();
        });

        // Letter Spacing
        bind('enhLetterSpacing', 'input', (e) => {
            if (!self.activeObject) return;
            const val = parseInt(e.target.value);
            document.getElementById('enhLetterSpacingVal').textContent = val;
            self.activeObject.set('charSpacing', val);
            self.canvas.renderAll();
        });

        // Line Height
        bind('enhLineHeight', 'input', (e) => {
            if (!self.activeObject) return;
            const val = parseFloat(e.target.value);
            document.getElementById('enhLineHeightVal').textContent = val.toFixed(2);
            self.activeObject.set('lineHeight', val);
            self.canvas.renderAll();
        });

        // Opacity
        bind('enhTextOpacity', 'input', (e) => {
            if (!self.activeObject) return;
            const val = parseInt(e.target.value);
            document.getElementById('enhTextOpacityVal').textContent = val + '%';
            self.activeObject.set('opacity', val / 100);
            self.canvas.renderAll();
        });

        // Background toggle
        const bgToggle = document.getElementById('enhBgToggle');
        if (bgToggle) {
            bgToggle.addEventListener('click', () => {
                if (!self.activeObject) return;
                const isOn = bgToggle.classList.toggle('active');
                if (isOn) {
                    bgToggle.textContent = 'On';
                    const color = document.getElementById('enhBgColor')?.value || '#ffffff';
                    self.activeObject.set('textBackgroundColor', color);
                } else {
                    bgToggle.textContent = 'Off';
                    self.activeObject.set('textBackgroundColor', '');
                }
                self.canvas.renderAll();
            });
        }

        bind('enhBgColor', 'input', () => {
            if (!self.activeObject) return;
            const bgToggleEl = document.getElementById('enhBgToggle');
            if (bgToggleEl && bgToggleEl.classList.contains('active')) {
                self.activeObject.set('textBackgroundColor', document.getElementById('enhBgColor').value);
                self.canvas.renderAll();
            }
        });

        // Text Transforms
        const uppercaseBtn = document.getElementById('enhUppercase');
        if (uppercaseBtn) {
            uppercaseBtn.addEventListener('click', () => {
                if (!self.activeObject) return;
                const obj = self.activeObject;
                const active = !obj._enhUppercase;
                obj._enhUppercase = active;
                if (active) {
                    obj._enhCapitalize = false;
                    obj.set('text', obj.text.toUpperCase());
                    document.getElementById('enhCapitalize')?.classList.remove('active');
                }
                uppercaseBtn.classList.toggle('active', active);
                self.canvas.renderAll();
                self.updatePropsFromObject();
            });
        }

        const capitalizeBtn = document.getElementById('enhCapitalize');
        if (capitalizeBtn) {
            capitalizeBtn.addEventListener('click', () => {
                if (!self.activeObject) return;
                const obj = self.activeObject;
                const active = !obj._enhCapitalize;
                obj._enhCapitalize = active;
                if (active) {
                    obj._enhUppercase = false;
                    obj.set('text', obj.text.replace(/\b\w/g, c => c.toUpperCase()));
                    document.getElementById('enhUppercase')?.classList.remove('active');
                }
                capitalizeBtn.classList.toggle('active', active);
                self.canvas.renderAll();
                self.updatePropsFromObject();
            });
        }

        const underlineBtn = document.getElementById('enhUnderline');
        if (underlineBtn) {
            underlineBtn.addEventListener('click', () => {
                if (!self.activeObject) return;
                const obj = self.activeObject;
                const isOn = !obj.underline;
                obj.set('underline', isOn);
                underlineBtn.classList.toggle('active', isOn);
                self.canvas.renderAll();
            });
        }

        const linethroughBtn = document.getElementById('enhLinethrough');
        if (linethroughBtn) {
            linethroughBtn.addEventListener('click', () => {
                if (!self.activeObject) return;
                const obj = self.activeObject;
                const isOn = !obj.linethrough;
                obj.set('linethrough', isOn);
                linethroughBtn.classList.toggle('active', isOn);
                self.canvas.renderAll();
            });
        }
    },

    bindPropertyInputs() {
        // Bind text enhancer inputs
        this.bindEnhancerInputs();

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
