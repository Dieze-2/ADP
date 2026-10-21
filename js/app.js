/**
 * Application principale - VERSION AVEC IMPORT HTML ET JSON
 * ✅ Ajout support pointsForts (JSON) + pointFortNumber (images)
 * ✅ Ajout toggle thème clair/sombre générateur
 */

class AuditConverterApp {
    constructor() {
        this.parser = new AuditParser();
        this.validator = new AuditValidator();
        this.currentData = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.jsonSection = document.getElementById('jsonSection');
        this.jsonPreview = document.getElementById('jsonPreview');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');

        this.downloadJsonBtn = document.getElementById('downloadJson');
        this.editDataBtn = document.getElementById('editData');
        this.generateHtmlBtn = document.getElementById('generateHtml');
        this.retryBtn = document.getElementById('retryBtn');
    }

    attachEventListeners() {
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        const pickFileBtn = document.getElementById('pickFile');
        if (pickFileBtn && this.fileInput) {
            pickFileBtn.addEventListener('click', () => this.fileInput.click());
        }

        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            });

            this.uploadArea.addEventListener('dragleave', () => {
                this.uploadArea.classList.remove('dragover');
            });

            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processFile(files[0]);
                }
            });
        }

        if (this.downloadJsonBtn) {
            this.downloadJsonBtn.addEventListener('click', () => this.downloadJSON());
        }

        if (this.generateHtmlBtn) {
            this.generateHtmlBtn.addEventListener('click', () => this.generateHTML());
        }

        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', () => this.reset());
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        // Vidé tout de suite : re-sélectionner le même fichier redéclenche l'import
        event.target.value = '';
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        console.log('📄 Traitement du fichier:', file.name, 'Type:', file.type);

        const fileName = file.name.toLowerCase();
        const isWord = fileName.endsWith('.docx');
        const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm');
        const isJson = fileName.endsWith('.json');

        console.log('🔍 Détection:', { isWord, isHtml, isJson });

        if (!isWord && !isHtml && !isJson) {
            this.showError('⚠️ Format de fichier non supporté.\n\nVeuillez sélectionner un fichier :\n• .docx (Word)\n• .html (rapport existant)\n• .json (données structurées)');
            return;
        }

        try {
            this.hideAllSections();

            if (isWord) {
                console.log('📘 Traitement Word...');
                await this.processWordFile(file);
            } else if (isHtml) {
                console.log('🌐 Traitement HTML...');
                await this.processHtmlFile(file);
            } else if (isJson) {
                console.log('📊 Traitement JSON...');
                await this.processJsonFile(file);
            }

        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showError(error.message);
        }
    }

    async processWordFile(file) {
        this.showProgress('Lecture du fichier Word...', 20);
        this.showProgress('Extraction des données et images...', 40);
        // Même normalisation que JSON/HTML : schéma unique (cloture, observations.action...)
        this.currentData = this.normalizeJsonData(await this.parser.parseWordFile(file));

        this.showProgress('Validation des données...', 60);
        this.validator.validate(this.currentData);
        await this.compressImages();

        setTimeout(() => { this.goToEditor(); }, 500);
    }

    async processHtmlFile(file) {
        this.showProgress('Lecture du fichier HTML...', 20);
        const htmlContent = await this.readFileAsText(file);
        this.showProgress('Analyse du rapport HTML...', 40);
        this.currentData = this.parseHtmlReport(htmlContent);
        this.showProgress('Validation des données...', 60);
        this.validator.validate(this.currentData);
        await this.compressImages();

        setTimeout(() => { this.goToEditor(); }, 500);
    }

    async processJsonFile(file) {
        this.showProgress('Lecture du fichier JSON...', 20);

        try {
            const jsonContent = await this.readFileAsText(file);
            this.showProgress('Analyse des données JSON...', 40);

            let parsedData;
            try {
                parsedData = JSON.parse(jsonContent);
                console.log('✅ JSON parsé:', parsedData);
            } catch (parseError) {
                throw new Error(`Le fichier JSON est invalide : ${parseError.message}`);
            }

            if (!parsedData.metadata) {
                throw new Error('Le fichier JSON ne contient pas de section "metadata". Assurez-vous qu\'il s\'agit d\'un fichier d\'audit valide.');
            }

            this.showProgress('Validation des données...', 60);
            this.currentData = this.normalizeJsonData(parsedData);
            this.validator.validate(this.currentData);
            await this.compressImages();

            console.log('✅ JSON chargé avec succès');
            console.log('  ✅ Points forts:', this.currentData.pointsForts?.length || 0);
            console.log('  📊 Écarts:', this.currentData.ecarts?.length || 0);
            console.log('  👁️ Observations:', this.currentData.observations?.length || 0);
            console.log('  📷 Images:', this.currentData.images?.length || 0);

            setTimeout(() => { this.goToEditor(); }, 500);

        } catch (error) {
            console.error('❌ Erreur traitement JSON:', error);
            throw new Error(`Impossible de traiter le fichier JSON : ${error.message}`);
        }
    }

    normalizeJsonData(data) {
        console.log('🔧 Normalisation des données JSON...');

        const prochainesEtapesTexte =
            typeof data.cloture?.prochainesEtapesTexte === 'string'
                ? data.cloture.prochainesEtapesTexte
                : Array.isArray(data.cloture?.prochainesEtapes)
                    ? data.cloture.prochainesEtapes.join('\n')
                    : '';

        const normalized = {
            metadata: {
                kicker: data.metadata?.kicker || '',
                auditNumber: data.metadata?.auditNumber || '',
                title: data.metadata?.title || '',
                team: data.metadata?.team || '',
                period: data.metadata?.period || '',
                reportDate: data.metadata?.reportDate || '',
                objective: data.metadata?.objective || '',
                perimeter: data.metadata?.perimeter || '',
                referentials: Array.isArray(data.metadata?.referentials) ? data.metadata.referentials : [],
                context: {
                    poste: data.metadata?.context?.poste || '',
                    article: data.metadata?.context?.article || '',
                    operation: data.metadata?.context?.operation || ''
                }
            },
            // Compteurs recalculés en fin de fonction depuis les tableaux :
            // un summary stocké dans le fichier peut être périmé
            summary: {},
            pointsForts: Array.isArray(data.pointsForts) ? data.pointsForts : [],
            ecarts: Array.isArray(data.ecarts) ? data.ecarts : [],
            observations: Array.isArray(data.observations) ? data.observations : [],
            remarques: {
                audites: Array.isArray(data.remarques?.audites) ? data.remarques.audites : [],
                reunion: Array.isArray(data.remarques?.reunion) ? data.remarques.reunion : []
            },
            auditedPersons: Array.isArray(data.auditedPersons) ? data.auditedPersons : [],
            distribution: Array.isArray(data.distribution) ? data.distribution : [],
            images: Array.isArray(data.images) ? data.images : [],
            planActionRecipients: Array.isArray(data.planActionRecipients)
                ? data.planActionRecipients.filter(r => typeof r === 'string' && r.trim())
                : [],
            cloture: {
                noteFinale: data.cloture?.noteFinale || '',
                prochainesEtapesTexte: prochainesEtapesTexte
            }
        };

        normalized.pointsForts = normalized.pointsForts.map((pf, index) => ({
            number: pf.number || index + 1,
            titre: pf.titre || '',
            constat: pf.constat || ''
        }));

        normalized.ecarts = normalized.ecarts.map((ecart, index) => ({
            number: ecart.number || index + 1,
            exigence: ecart.exigence || '',
            constat: ecart.constat || '',
            action: ecart.action || '',
            responsable: ecart.responsable || '',
            delai: ecart.delai || ''
        }));

        normalized.observations = normalized.observations.map((obs, index) => ({
            number: obs.number || index + 1,
            constat: obs.constat || '',
            risque: obs.risque || '',
            action: obs.action || '',
            responsable: obs.responsable || '',
            delai: obs.delai || ''
        }));

        normalized.images = normalized.images.map((img) => {
            const normalizedImg = {
                id: img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                base64: img.base64 || '',
                alt: img.alt || img.caption || '',
                caption: img.caption || img.alt || '',
                contentType: img.contentType || 'image/jpeg',
                size: img.size || 0
            };

            if (img.ecartNumber !== undefined) normalizedImg.ecartNumber = img.ecartNumber;
            if (img.observationNumber !== undefined) normalizedImg.observationNumber = img.observationNumber;
            if (img.pointFortNumber !== undefined) normalizedImg.pointFortNumber = img.pointFortNumber;

            return normalizedImg;
        });

        // Même règle que l'éditeur (collectFormData) : remarques des audités uniquement
        normalized.summary = {
            pointFortCount: normalized.pointsForts.length,
            ecartCount: normalized.ecarts.length,
            observationCount: normalized.observations.length,
            remarqueCount: normalized.remarques.audites.length
        };

        console.log('✅ Données normalisées');
        return normalized;
    }

    /**
     * Compresse les images importées (Word, rapports et JSON existants)
     * et affiche le gain obtenu
     */
    async compressImages() {
        const images = this.currentData && this.currentData.images;
        if (!Array.isArray(images) || images.length === 0) {
            this.showProgress('Terminé !', 100);
            return;
        }

        const stats = await ImageCompressor.compressAll(images, (done, total) => {
            this.showProgress(`Optimisation des images (${done}/${total})...`, 70 + Math.round(30 * done / total));
        });

        const message = stats.compressed > 0
            ? `Terminé ! Images : ${ImageCompressor.formatBytes(stats.before)} → ${ImageCompressor.formatBytes(stats.after)}`
            : 'Terminé !';
        this.showProgress(message, 100);
        this.importSummary = stats.compressed > 0
            ? `Photos optimisées : ${ImageCompressor.formatBytes(stats.before)} → ${ImageCompressor.formatBytes(stats.after)}`
            : null;
        console.log(`🗜️ ${stats.compressed}/${stats.total} image(s) compressée(s) :`,
            ImageCompressor.formatBytes(stats.before), '→', ImageCompressor.formatBytes(stats.after));
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erreur lecture fichier'));
            reader.readAsText(file);
        });
    }

    parseHtmlReport(htmlString) {
        console.log('🔍 Parsing du rapport HTML...');

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const embeddedEl = doc.getElementById('embedded-audit-data');
        if (embeddedEl && embeddedEl.textContent) {
            try {
                const embeddedData = JSON.parse(embeddedEl.textContent);
                // Rapports antérieurs : destinataires présents seulement dans le script du rapport
                if (!Array.isArray(embeddedData.planActionRecipients)) {
                    embeddedData.planActionRecipients = this.extractLegacyRecipients(doc);
                }
                console.log('✅ Données embarquées détectées (embedded-audit-data)');
                return this.normalizeJsonData(embeddedData);
            } catch (e) {
                console.warn('⚠️ embedded-audit-data présent mais invalide, fallback parsing DOM', e);
            }
        }

        function getListAfterCardTitle(cardTitleEl) {
            if (!cardTitleEl) return null;
            let el = cardTitleEl.nextElementSibling;
            while (el) {
                if (el.tagName === 'UL') return el;
                if (el.classList && el.classList.contains('card-title')) return null;
                el = el.nextElementSibling;
            }
            return null;
        }

        const data = {
            metadata: {},
            summary: {},
            pointsForts: [],
            ecarts: [],
            observations: [],
            remarques: { audites: [], reunion: [] },
            auditedPersons: [],
            distribution: [],
            images: [],
            cloture: {}
        };

        const slide1 = doc.querySelector('#slide-1');
        if (slide1) {
            const kickerEl = slide1.querySelector('.slide-kicker');
            if (kickerEl) data.metadata.kicker = kickerEl.textContent.replace(/\s+/g, ' ').trim();

            const titleEl = slide1.querySelector('.slide-title');
            if (titleEl) {
                const titleText = titleEl.textContent.replace(/\s+/g, ' ').trim();
                const m = titleText.match(/\b(\d{4}-\d{3})\b/);
                if (m) {
                    data.metadata.auditNumber = m[1];
                    const after = titleText.split(m[1])[1] || '';
                    data.metadata.title = after.trim().replace(/^[-–—:]?\s*/, '');
                } else {
                    const match = titleText.match(/Audit\s+([^\s]+)\s*(.*)/i);
                    if (match) {
                        data.metadata.auditNumber = match[1].trim();
                        data.metadata.title = (match[2] || '').trim();
                    }
                }
            }

            const objectiveEl = slide1.querySelector('.card p');
            if (objectiveEl) data.metadata.objective = objectiveEl.textContent.trim();

            const perimeterMatch = slide1.textContent.match(/Périmètre\s*:\s*([^\n.]+)/i);
            if (perimeterMatch) data.metadata.perimeter = perimeterMatch[1].trim();

            data.metadata.context = {};
            const contextPoste = slide1.textContent.match(/Poste\s*:\s*([^\n]+)/i);
            if (contextPoste) data.metadata.context.poste = contextPoste[1].trim();

            const contextArticle = slide1.textContent.match(/Article\s*:\s*([^\n]+)/i);
            if (contextArticle) data.metadata.context.article = contextArticle[1].trim();

            const contextOperation = slide1.textContent.match(/Opération\s*:\s*([^\n]+)/i);
            if (contextOperation) data.metadata.context.operation = contextOperation[1].trim();

            const titles = Array.from(slide1.querySelectorAll('.card-title'));

            const refTitle = titles.find(t => t.textContent.toLowerCase().includes('référentiels'));
            if (refTitle) {
                const ul = getListAfterCardTitle(refTitle);
                if (ul) {
                    data.metadata.referentials = Array.from(ul.querySelectorAll('li'))
                        .map(li => li.textContent.trim())
                        .filter(text => text && text !== 'Aucun référentiel spécifié');
                }
            } else {
                data.metadata.referentials = [];
            }

            const audTitle = titles.find(t => t.textContent.toLowerCase().includes('audités'));
            if (audTitle) {
                const ul = getListAfterCardTitle(audTitle);
                if (ul) {
                    data.auditedPersons = Array.from(ul.querySelectorAll('li'))
                        .map(li => li.textContent.trim())
                        .filter(text => text && text !== 'Aucune personne spécifiée');
                }
            }

            const metaItems = slide1.querySelectorAll('.audit-meta-item');
            metaItems.forEach(item => {
                const label = item.querySelector('.audit-label')?.textContent.trim().toLowerCase();
                const value = item.querySelector('.audit-value')?.textContent.trim();
                if (!label || !value) return;

                if (label.includes('équipe')) data.metadata.team = value;
                if (label.includes('période')) data.metadata.period = value;
                if (label.includes('rapport')) data.metadata.reportDate = value;
                if (label.includes('diffusion')) data.distribution = value.split(',').map(s => s.trim());
                if (label.includes("n° d'audit") && !data.metadata.auditNumber) data.metadata.auditNumber = value.trim();
            });

            const kpis = slide1.querySelectorAll('.kpi-value');
            if (kpis.length >= 3) {
                data.summary.ecartCount = parseInt(kpis[0].textContent) || 0;
                data.summary.observationCount = parseInt(kpis[1].textContent) || 0;
                data.summary.remarqueCount = parseInt(kpis[2].textContent) || 0;
            }
        }

        const ecartSlides = doc.querySelectorAll('.slide[data-title^="Écart"]');
        ecartSlides.forEach((slide, index) => {
            const ecart = {
                number: index + 1,
                exigence: '',
                constat: '',
                action: '',
                responsable: '',
                delai: ''
            };

            const badge = slide.querySelector('.badge span:last-child');
            const title = slide.querySelector('.slide-title');

            if (badge && title) ecart.exigence = `${badge.textContent.trim()} / ${title.textContent.trim()}`;
            else if (badge) ecart.exigence = badge.textContent.trim();

            const constatEl = slide.querySelector('.card p');
            if (constatEl) ecart.constat = constatEl.textContent.replace('📋 Constat', '').trim();

            slide.querySelectorAll('.image-block img').forEach((img) => {
                data.images.push({
                    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    base64: img.src,
                    alt: img.alt || '',
                    caption: img.dataset.caption || '',
                    contentType: 'image/jpeg',
                    ecartNumber: ecart.number
                });
            });

            data.ecarts.push(ecart);
        });

        const obsSlides = doc.querySelectorAll('.slide[data-title^="Observation"]');
        obsSlides.forEach((slide, index) => {
            const obs = {
                number: index + 1,
                constat: '',
                risque: '',
                action: '',
                responsable: '',
                delai: ''
            };

            const constatEl = slide.querySelector('.card p');
            if (constatEl) obs.constat = constatEl.textContent.replace(/^Constat\s*:\s*/i, '').trim();

            const risqueEl = slide.querySelector('.obs-risk');
            if (risqueEl) obs.risque = risqueEl.textContent.replace(/^Risque\s*:\s*/i, '').trim();

            slide.querySelectorAll('.image-block img').forEach((img) => {
                data.images.push({
                    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    base64: img.src,
                    alt: img.alt || '',
                    caption: img.dataset.caption || '',
                    contentType: 'image/jpeg',
                    observationNumber: obs.number
                });
            });

            data.observations.push(obs);
        });

        const finalSlide = doc.querySelector('.slide[data-title*="Clôture"]');
        if (finalSlide) {
            const remarquesList = finalSlide.querySelectorAll('.card ul')[0];
            if (remarquesList) {
                data.remarques.audites = Array.from(remarquesList.querySelectorAll('li'))
                    .map(li => li.textContent.trim())
                    .filter(text => text && text !== 'Aucune remarque');
            }

            const closingNotes = finalSlide.querySelector('#closing-notes-content');
            if (closingNotes) data.cloture.noteFinale = closingNotes.textContent.trim();

            const closingSteps = finalSlide.querySelector('#closing-steps-content');
            if (closingSteps) data.cloture.prochainesEtapesTexte = closingSteps.textContent.trim();

            if (!data.cloture.prochainesEtapesTexte) {
                const stepsList = finalSlide.querySelector('#closing-steps-list');
                if (stepsList) {
                    const items = Array.from(stepsList.querySelectorAll('li'))
                        .map(li => li.textContent.trim())
                        .filter(text => text && text !== 'Aucune étape renseignée');
                    if (items.length) data.cloture.prochainesEtapesTexte = items.join('\n');
                }
            }
        }

        console.log('✅ HTML parsé avec succès');
        console.log('  📊 Métadonnées:', data.metadata);
        console.log('  ✅ Points forts:', data.pointsForts.length);
        console.log('  ⚠️ Écarts:', data.ecarts.length);
        console.log('  👁️ Observations:', data.observations.length);
        console.log('  📷 Images:', data.images.length);

        return this.normalizeJsonData(data);
    }

    extractLegacyRecipients(doc) {
        const scriptsEl = doc.getElementById('embedded-audit-scripts');
        const match = scriptsEl && scriptsEl.textContent.match(/var PLAN_ACTION_RECIPIENTS = (\[[^\]]*\]);/);
        if (!match) return [];
        try {
            const list = JSON.parse(match[1]);
            return Array.isArray(list) ? list.filter(r => typeof r === 'string') : [];
        } catch (e) {
            return [];
        }
    }

    showProgress(message, percent) {
        // La progression remplace le contenu de la zone de dépôt : retour à l'endroit de l'action
        if (this.uploadArea) this.uploadArea.classList.add('is-busy');
        if (this.progressSection) this.progressSection.style.display = 'block';
        if (this.progressText) this.progressText.textContent = message;
        if (this.progressFill) this.progressFill.style.width = `${percent}%`;
    }

    goToEditor() {
        console.log('✏️ Passage automatique à l\'éditeur...');

        if (window.editor) {
            window.editor.currentData = JSON.parse(JSON.stringify(this.currentData));
            window.editor.populateForm(window.editor.currentData);
            window.editor.showForm();

            const editTabBtn = document.querySelector('[data-tab="edit"]');
            if (editTabBtn) editTabBtn.click();
            window.scrollTo({ top: 0 });

            // Zone de dépôt prête pour un autre import ; gain affiché en notification
            this.hideAllSections();
            showToast(this.importSummary ? `Rapport importé. ${this.importSummary}` : 'Rapport importé.');
            this.importSummary = null;

            console.log('✅ Éditeur chargé avec les données importées');
        } else {
            console.error('❌ Éditeur non disponible');
        }
    }

    generateHTML() {
        try {
            console.log('🎨 Génération du HTML depuis l\'onglet Upload...');

            if (typeof generateAuditReport !== 'function') {
                throw new Error('La fonction generateAuditReport n\'est pas disponible. Vérifiez que audit-template.js est bien chargé.');
            }

            const htmlContent = generateAuditReport(this.currentData);
            console.log('✅ HTML généré (longueur:', htmlContent.length, 'caractères)');

            window.currentEditedData = this.currentData;
            window.currentEditedHTML = htmlContent;

            const previewTabBtn = document.querySelector('[data-tab="preview"]');
            if (previewTabBtn) {
                previewTabBtn.click();
                setTimeout(() => {
                    const iframe = document.getElementById('previewIframe');
                    if (iframe) iframe.srcdoc = htmlContent;
                }, 100);
            }

        } catch (error) {
            console.error('❌ Erreur génération HTML:', error);
            this.showError('Erreur lors de la génération du HTML: ' + error.message);
        }
    }

    downloadJSON() {
        const jsonString = JSON.stringify(this.currentData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const auditNumber = this.currentData.metadata.auditNumber || 'sans-numero';
        const fileName = `Audit ${auditNumber}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
        console.log(`✅ JSON téléchargé : ${fileName}`);
    }

    showError(message) {
        this.hideAllSections();
        if (this.errorSection) this.errorSection.style.display = 'block';
        if (this.errorMessage) this.errorMessage.textContent = message;
    }

    hideAllSections() {
        if (this.uploadArea) this.uploadArea.classList.remove('is-busy');
        if (this.progressSection) this.progressSection.style.display = 'none';
        if (this.jsonSection) this.jsonSection.style.display = 'none';
        if (this.errorSection) this.errorSection.style.display = 'none';
    }

    reset() {
        this.hideAllSections();
        if (this.fileInput) this.fileInput.value = '';
        this.currentData = null;
    }
}

// ========================================
// GESTION DES ONGLETS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initialisation de la navigation par onglets...');

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabList = document.querySelector('.segmented');
    const STEP_ORDER = ['upload', 'edit', 'preview'];

    // Segmented control : onglet sélectionné, curseur positionné via data-current
    function updateStepper(currentTab) {
        if (tabList) tabList.dataset.current = currentTab;
        tabBtns.forEach(b => {
            const selected = b.dataset.tab === currentTab;
            b.setAttribute('aria-selected', String(selected));
            b.tabIndex = selected ? 0 : -1;
        });

        // Aperçu : état vide tant qu'aucun rapport n'a été généré
        const hasPreview = !!window.currentEditedHTML;
        const previewEmpty = document.getElementById('previewEmpty');
        const previewFrame = document.getElementById('previewFrame');
        const downloadBtn = document.getElementById('downloadHtmlFinal');
        if (previewEmpty) previewEmpty.hidden = hasPreview;
        if (previewFrame) previewFrame.hidden = !hasPreview;
        if (downloadBtn) downloadBtn.disabled = !hasPreview;
        if (currentTab === 'preview') updatePreviewSummary();
    }

    // Cartes latérales de l'aperçu : poids du fichier, écarts, photos, destinataires
    function updatePreviewSummary() {
        const data = window.currentEditedData;
        const html = window.currentEditedHTML;
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('previewSize', html ? Math.round(new Blob([html]).size / 1024).toLocaleString('fr-FR') : '–');
        setText('previewEcarts', data && Array.isArray(data.ecarts) ? data.ecarts.length : '–');
        setText('previewPhotos', data && Array.isArray(data.images) ? data.images.length : '–');

        const list = document.getElementById('previewRecipients');
        if (!list) return;
        const recipients = (data && Array.isArray(data.planActionRecipients)) ? data.planActionRecipients : [];
        list.replaceChildren(...(recipients.length ? recipients : [null]).map(address => {
            const li = document.createElement('li');
            if (address) li.textContent = address;
            else { li.className = 'caption'; li.textContent = 'Aucun destinataire.'; }
            return li;
        }));
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            console.log(`📑 Changement d'onglet: ${targetTab}`);

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) targetContent.classList.add('active');
            updateStepper(targetTab);
        });

        // Flèches gauche / droite : onglet voisin (motif ARIA « tabs »)
        btn.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const offset = e.key === 'ArrowRight' ? 1 : STEP_ORDER.length - 1;
            const next = STEP_ORDER[(STEP_ORDER.indexOf(btn.dataset.tab) + offset) % STEP_ORDER.length];
            const nextBtn = document.querySelector(`.tab-btn[data-tab="${next}"]`);
            if (nextBtn) { nextBtn.click(); nextBtn.focus(); }
        });
    });
    updateStepper('upload');

    const goToTab = (tab) => {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (tabBtn) tabBtn.click();
        window.scrollTo({ top: 0 });
    };

    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => goToTab(el.dataset.goto));
    });

    // « Créer un rapport vide » depuis l'étape Import
    const startBlankBtn = document.getElementById('startBlank');
    if (startBlankBtn) {
        startBlankBtn.addEventListener('click', () => {
            goToTab('edit');
            if (window.editor) window.editor.createNewReport();
        });
    }

    // Bouton "Éditer les données"
    const editDataBtn = document.getElementById('editData');
    if (editDataBtn) {
        editDataBtn.addEventListener('click', () => {
            console.log('✏️ Ouverture de l\'éditeur depuis Upload');

            if (window.editor && window.app && window.app.currentData) {
                window.editor.currentData = JSON.parse(JSON.stringify(window.app.currentData));
                window.editor.populateForm(window.editor.currentData);

                window.editor.showForm();

                const editTabBtn = document.querySelector('[data-tab="edit"]');
                if (editTabBtn) editTabBtn.click();

                setTimeout(() => {
                    if (window.editor.form) {
                        window.editor.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300);
            } else {
                alert('❌ Aucune donnée disponible à éditer.');
            }
        });
    }

    // Bouton "Retour édition"
    const backToEditBtn = document.getElementById('backToEdit');
    if (backToEditBtn) {
        backToEditBtn.addEventListener('click', () => {
            console.log('← Retour à l\'édition');
            const editTabBtn = document.querySelector('[data-tab="edit"]');
            if (editTabBtn) editTabBtn.click();
        });
    }

    // Bouton "Télécharger HTML"
    const downloadHtmlFinalBtn = document.getElementById('downloadHtmlFinal');
    if (downloadHtmlFinalBtn) {
        downloadHtmlFinalBtn.addEventListener('click', () => {
            console.log('💾 Téléchargement du HTML final (avec notes intégrées)');

            const iframe = document.getElementById('previewIframe');
            if (!iframe || !iframe.contentWindow) {
                alert("❌ Iframe d'aperçu introuvable.");
                return;
            }

            let dataFromIframe = null;
            try {
                dataFromIframe = iframe.contentWindow.__AUDIT_DATA__ || null;
            } catch (e) {
                console.error("❌ Impossible d'accéder à l'iframe (same-origin?)", e);
                alert("❌ Impossible de récupérer les notes depuis l'aperçu.");
                return;
            }

            const data = dataFromIframe || window.currentEditedData;
            if (!data) {
                alert("❌ Aucune donnée disponible à exporter.");
                return;
            }

            let html = null;
            try {
                html = generateAuditReport(data);
            } catch (e) {
                console.error("❌ Erreur génération HTML:", e);
                alert("❌ Erreur génération HTML: " + e.message);
                return;
            }

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const auditNumber = (data.metadata && data.metadata.auditNumber) ? data.metadata.auditNumber : 'sans-numero';
            const fileName = `Rapport d'audit ${auditNumber}.html`;

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);
            window.currentEditedHTML = html;
            window.currentEditedData = data;

            showToast(`Rapport téléchargé : ${fileName}`);
            console.log(`✅ HTML téléchargé : ${fileName}`);
        });
    }

    console.log('✅ Navigation par onglets initialisée');

    // ========================================
    // TOGGLE THÈME — générateur uniquement
    // Clé localStorage : 'generator-theme'
    // Cible : document.documentElement (html)
    // N'affecte PAS le rapport HTML (srcdoc isolé)
    // ========================================
    const themeToggleBtn = document.getElementById('themeToggle');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Thème clair par défaut ; sombre via data-theme="dark"
            const html = document.documentElement;
            const toDark = html.getAttribute('data-theme') !== 'dark';

            if (toDark) html.setAttribute('data-theme', 'dark');
            else html.removeAttribute('data-theme');

            try {
                localStorage.setItem('generator-theme', toDark ? 'dark' : 'light');
            } catch (e) { /* préférence non mémorisée */ }
        });

        console.log('✅ Toggle thème initialisé');
    } else {
        console.warn('⚠️ Bouton #themeToggle introuvable');
    }
});

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de l\'application...');
    window.app = new AuditConverterApp();
    console.log('✅ Application initialisée');
});
