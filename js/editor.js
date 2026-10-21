/**
 * Éditeur interactif de rapports d'audit
 * ✅ VERSION AVEC SUPPORT HEIC
 * ✅ Ajout Points forts + pré-remplissage Objectif
 */

// Icônes SVG 16 px (tracé Lucide), héritent de la couleur du texte
const ICONS = {
    chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>'
};

class AuditEditor {
    constructor() {
        this.currentData = null;
        this.pointFortCounter = 0;
        this.ecartCounter = 0;
        this.observationCounter = 0;
        this.pendingUndo = null;

        // Les trois types de cartes : seules les valeurs diffèrent
        this.KINDS = {
            pointfort: {
                label: 'Point fort', cardClass: 'pointfort-card', idAttr: 'pointfortId',
                imageKey: 'pointFortNumber', counter: 'pointFortCounter', prefix: 'pointfort',
                summaryField: '.pointfort-titre'
            },
            ecart: {
                label: 'Écart', cardClass: 'ecart-card', idAttr: 'ecartId',
                imageKey: 'ecartNumber', counter: 'ecartCounter', prefix: 'ecart',
                summaryField: '.ecart-exigence'
            },
            observation: {
                label: 'Observation', cardClass: 'observation-card', idAttr: 'observationId',
                imageKey: 'observationNumber', counter: 'observationCounter', prefix: 'observation',
                summaryField: '.observation-constat'
            }
        };

        // Plan d'action attendu sur les écarts et les observations
        this.PLAN_FIELDS = [
            { key: 'action', label: 'Action' },
            { key: 'responsable', label: 'Responsable' },
            { key: 'delai', label: 'Délai' }
        ];
        // Codes de référentiel du type INS-2426, PRO-0255
        this.REF_CODE = /\b[A-Z]{2,5}-\d{2,6}\b/g;

        this.RECIPIENTS_STORAGE_KEY = 'generator-plan-action-recipients';

        // Bandeau de la première diapositive (au-dessus du titre)
        this.DEFAULT_KICKER = 'Audit interne – Secteur Fournitures';

        this.DEFAULT_OBJECTIVE =
            "Evaluer les éventuels écarts sur le terrain avec le référentiel du secteur Fournitures et remonter les améliorations potentielles.";

        this.initializeElements();
        this.attachEventListeners();
        this.attachCardListeners();
        this.initSectionNav();
        this.initAssistant();
        this.initClipboardPaste();
    }


    /**
     * Initialise les éléments DOM
     */
    initializeElements() {
        this.loadFromJsonBtn = document.getElementById('loadFromJson');
        this.createFromScratchBtn = document.getElementById('createFromScratch');
        this.saveAndPreviewBtn = document.getElementById('saveAndPreview');
        this.exportJsonBtn = document.getElementById('exportJsonBtn');
        this.resetFormBtn = document.getElementById('resetForm');

        this.form = document.getElementById('auditForm');
        this.editEmpty = document.getElementById('editEmpty');

        // ✅ Points forts
        this.pointsFortsContainer = document.getElementById('pointsforts-container');
        this.addPointFortBtn = document.getElementById('addPointFort');

        this.ecartsContainer = document.getElementById('ecarts-container');
        this.observationsContainer = document.getElementById('observations-container');

        this.addEcartBtn = document.getElementById('addEcart');
        this.addObservationBtn = document.getElementById('addObservation');

        // ✅ Nouveau : prochainesEtapesTexte remplace prochainesEtapes (liste)
        this.formFields = {
            reportKicker: document.getElementById('reportKicker'),
            auditNumber: document.getElementById('auditNumber'),
            auditTitle: document.getElementById('auditTitle'),
            team: document.getElementById('team'),
            period: document.getElementById('period'),
            reportDate: document.getElementById('reportDate'),
            objective: document.getElementById('objective'),
            perimeter: document.getElementById('perimeter'),
            referentials: document.getElementById('referentials'),
            contextePoste: document.getElementById('contextePoste'),
            contexteArticle: document.getElementById('contexteArticle'),
            contexteOperation: document.getElementById('contexteOperation'),
            auditedPersons: document.getElementById('auditedPersons'),
            distribution: document.getElementById('distribution'),
            remarquesAudites: document.getElementById('remarquesAudites'),
            remarquesReunion: document.getElementById('remarquesReunion'),

            // ⚠️ ces champs existent encore dans index.html chez vous, mais ne seront plus utilisés
            // on les garde pour éviter crash si présents
            situationActuelle: document.getElementById('situationActuelle'),
            situationCible: document.getElementById('situationCible'),

            prochainesEtapes: document.getElementById('prochainesEtapes'),
            noteFinale: document.getElementById('noteFinale'),
            planActionRecipients: document.getElementById('planActionRecipients')
        };
    }


    /**
     * Attache les écouteurs d'événements
     */
    attachEventListeners() {
        // Boutons principaux
        if (this.loadFromJsonBtn) this.loadFromJsonBtn.addEventListener('click', () => this.loadFromParsedData());
        this.createFromScratchBtn.addEventListener('click', () => this.createNewReport());
        this.saveAndPreviewBtn.addEventListener('click', () => this.saveAndPreview());
        this.exportJsonBtn.addEventListener('click', () => this.exportJSON());
        this.resetFormBtn.addEventListener('click', () => this.resetForm());

        // ✅ NOUVEAU : Bouton pour charger un fichier JSON externe
        const loadJsonFileBtn = document.getElementById('loadFromJsonFile');
        if (loadJsonFileBtn) {
            loadJsonFileBtn.addEventListener('click', () => this.loadFromJsonFile());
        }

        // Boutons d'ajout
        if (this.addPointFortBtn) this.addPointFortBtn.addEventListener('click', () => this.addPointFort(null, { isNew: true }));
        this.addEcartBtn.addEventListener('click', () => this.addEcart(null, { isNew: true }));
        this.addObservationBtn.addEventListener('click', () => this.addObservation(null, { isNew: true }));
    }


    /**
     * Charge les données depuis le parsing Word
     */
    loadFromParsedData() {
        if (!window.app || !window.app.currentData) {
            alert('❌ Aucune donnée parsée disponible.\n\nVeuillez d\'abord importer un fichier Word dans l\'onglet "Import Word".');
            return;
        }

        console.log('📂 Chargement des données parsées:', window.app.currentData);

        // Copie profonde pour éviter de modifier l'original
        this.currentData = JSON.parse(JSON.stringify(window.app.currentData));

        // ✅ Garantir pointsForts si absent (compat)
        if (!Array.isArray(this.currentData.pointsForts)) this.currentData.pointsForts = [];

        this.populateForm(this.currentData);
        this.showForm();

        // Scroll vers le haut du formulaire
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log('✅ Formulaire rempli avec les données parsées');
    }


    /**
     * Crée un nouveau rapport vide
     */
    createNewReport() {
        console.log('➕ Création d\'un nouveau rapport vide');

        this.currentData = {
            metadata: {
                kicker: this.DEFAULT_KICKER,
                auditNumber: '',
                title: '',
                team: '',
                period: '',
                reportDate: '',
                objective: '',
                perimeter: '',
                referentials: [],
                context: {
                    poste: '',
                    article: '',
                    operation: ''
                }
            },
            summary: {
                pointFortCount: 0,
                ecartCount: 0,
                observationCount: 0,
                remarqueCount: 0
            },
            // ✅ Points forts
            pointsForts: [],
            ecarts: [],
            observations: [],
            remarques: {
                audites: [],
                reunion: []
            },
            auditedPersons: [],
            distribution: [],
            images: [],
            // ✅ nouveau cloture
            cloture: {
                prochainesEtapesTexte: '',
                noteFinale: ''
            }
        };

        // ✅ Pré-remplissage objectif uniquement en "nouveau rapport vide" et si vide
        if (!this.currentData.metadata.objective) {
            this.currentData.metadata.objective = this.DEFAULT_OBJECTIVE;
        }

        this.populateForm(this.currentData);
        this.showForm();
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log('✅ Formulaire vide créé');
    }


    /**
     * Remplit le formulaire avec les données
     */
    populateForm(data) {
        console.log('📝 Remplissage du formulaire...');

        // ✅ compat
        if (!Array.isArray(data.pointsForts)) data.pointsForts = [];
        if (!Array.isArray(data.images)) data.images = [];
        this.ensureImageIds(data.images);

        this.formFields.reportKicker.value = data.metadata.kicker || this.DEFAULT_KICKER;
        this.formFields.auditNumber.value = data.metadata.auditNumber || '';
        this.formFields.auditTitle.value = data.metadata.title || '';
        this.formFields.team.value = data.metadata.team || '';
        this.formFields.period.value = data.metadata.period || '';
        this.formFields.reportDate.value = data.metadata.reportDate || '';
        this.formFields.objective.value = data.metadata.objective || '';
        this.formFields.perimeter.value = data.metadata.perimeter || '';

        const refs = data.metadata.referentials || [];
        this.formFields.referentials.value = refs.join('\n');

        this.formFields.contextePoste.value = (data.metadata.context && data.metadata.context.poste) || '';
        this.formFields.contexteArticle.value = (data.metadata.context && data.metadata.context.article) || '';
        this.formFields.contexteOperation.value = (data.metadata.context && data.metadata.context.operation) || '';

        const persons = data.auditedPersons || [];
        this.formFields.auditedPersons.value = persons.join('\n');

        const distribution = data.distribution || [];
        this.formFields.distribution.value = distribution.join('\n');

        const remarquesAudites = (data.remarques && data.remarques.audites) || [];
        this.formFields.remarquesAudites.value = remarquesAudites.join('\n');

        const remarquesReunion = (data.remarques && data.remarques.reunion) || [];
        this.formFields.remarquesReunion.value = remarquesReunion.join('\n');

        // ✅ Clôture : prochaines étapes texte libre
        const cloture = data.cloture || {};
        const peTexte = (typeof cloture.prochainesEtapesTexte === 'string')
            ? cloture.prochainesEtapesTexte
            : (Array.isArray(cloture.prochainesEtapes) ? cloture.prochainesEtapes.join('\n') : '');

        if (this.formFields.prochainesEtapes) {
            this.formFields.prochainesEtapes.value = peTexte || '';
        }

        if (this.formFields.noteFinale) {
            this.formFields.noteFinale.value = (cloture.noteFinale || '');
        }

        if (this.formFields.planActionRecipients) {
            const recipients = (Array.isArray(data.planActionRecipients) && data.planActionRecipients.length > 0)
                ? data.planActionRecipients
                : this.getDefaultPlanActionRecipients();
            this.formFields.planActionRecipients.value = recipients.join('\n');
        }

        // Champs timeline encore présents dans le DOM → on vide pour éviter confusion
        if (this.formFields.situationActuelle) this.formFields.situationActuelle.value = '';
        if (this.formFields.situationCible) this.formFields.situationCible.value = '';

        // Reset containers
        if (this.pointsFortsContainer) this.pointsFortsContainer.innerHTML = '';
        this.ecartsContainer.innerHTML = '';
        this.observationsContainer.innerHTML = '';

        this.pointFortCounter = 0;
        this.ecartCounter = 0;
        this.observationCounter = 0;

        // Cartes repliées sauf la première de chaque section : vue d'ensemble immédiate
        const pointsForts = data.pointsForts || [];
        pointsForts.forEach((pf, i) => this.addPointFort(pf, { collapsed: i > 0 }));

        const ecarts = data.ecarts || [];
        ecarts.forEach((ecart, i) => this.addEcart(ecart, { collapsed: i > 0 }));

        const observations = data.observations || [];
        observations.forEach((obs, i) => this.addObservation(obs, { collapsed: i > 0 }));

        this.dismissUndo();
        this.updateCounts();

        console.log(`✅ Formulaire rempli: ${pointsForts.length} point(s) fort(s), ${ecarts.length} écarts, ${observations.length} observations`);
    }

    // =====================================================
    // CARTES : POINTS FORTS / ÉCARTS / OBSERVATIONS
    // Rendu commun aux trois types ; actions par délégation (data-action)
    // =====================================================

    getContainer(kind) {
        return {
            pointfort: this.pointsFortsContainer,
            ecart: this.ecartsContainer,
            observation: this.observationsContainer
        }[kind];
    }

    getCardNumber(card) {
        return parseInt(card.dataset[this.KINDS[card.dataset.kind].idAttr], 10);
    }

    getCard(kind, number) {
        const container = this.getContainer(kind);
        if (!container) return null;
        const cfg = this.KINDS[kind];
        return Array.from(container.querySelectorAll(`.${cfg.cardClass}`))
            .find(card => this.getCardNumber(card) === number) || null;
    }

    addPointFort(pointFort = null, options = {}) {
        return this.addItem('pointfort', pointFort, options);
    }

    addEcart(ecart = null, options = {}) {
        return this.addItem('ecart', ecart, options);
    }

    addObservation(obs = null, options = {}) {
        return this.addItem('observation', obs, options);
    }

    /**
     * Ajoute une carte. options.collapsed : repliée ; options.isNew : ajout manuel
     * (animation, défilement et focus sur le premier champ)
     */
    addItem(kind, item = null, options = {}) {
        const cfg = this.KINDS[kind];
        const container = this.getContainer(kind);
        if (!container) return null;

        this.dismissUndo();
        this[cfg.counter]++;
        const number = this[cfg.counter];

        const card = document.createElement('article');
        card.className = `item-card ${cfg.cardClass}`;
        card.dataset.kind = kind;
        card.dataset[cfg.idAttr] = number;
        card.innerHTML = `
            <header class="item-card__head">
                <button type="button" class="item-card__toggle" data-action="toggle" aria-expanded="true">
                    <span class="item-card__chevron" aria-hidden="true">${ICONS.chevron}</span>
                    <span class="badge">${cfg.label} ${number}</span>
                    <span class="item-card__summary"></span>
                    ${kind === 'pointfort' ? '' : `<span class="pills" aria-hidden="true">${
                        this.PLAN_FIELDS.map(f => `<span class="pill" data-pill="${f.key}">${f.label}</span>`).join('')
                    }</span>`}
                    <span class="item-card__meta"></span>
                </button>
                <button type="button" class="icon-btn icon-btn--danger" data-action="remove"
                        aria-label="Supprimer ${cfg.label.toLowerCase()} ${number}">${ICONS.trash}</button>
            </header>
            <div class="collapsible">
                <div class="collapsible__inner">
                    <div class="item-card__body">${this.renderCardFields(kind, item)}</div>
                </div>
            </div>
        `;

        container.appendChild(card);
        this.refreshImages(kind, number);
        if (options.collapsed) this.setCollapsed(card, true);

        if (options.isNew) {
            card.classList.add('is-new');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const firstField = card.querySelector('input[type="text"], textarea');
            if (firstField) firstField.focus({ preventScroll: true });
        }

        this.updateCounts();
        return card;
    }

    renderCardFields(kind, item) {
        const value = (key) => this.escapeHtmlInput((item && item[key]) || '');
        const text = (cls, key, label, placeholder) => `
            <label class="form-group">
                <span class="field-label">${label}</span>
                <input type="text" class="${cls}" value="${value(key)}" placeholder="${placeholder}">
            </label>`;
        const area = (cls, key, label, placeholder, rows = 4) => `
            <label class="form-group">
                <span class="field-label">${label}</span>
                <textarea class="${cls}" rows="${rows}" placeholder="${placeholder}">${value(key)}</textarea>
            </label>`;
        const group = (...fields) => `<div class="group">${fields.join('')}</div>`;
        const owner = (prefix) => [
            text(`${prefix}-responsable`, 'responsable', 'Responsable', 'Nom ou fonction'),
            text(`${prefix}-delai`, 'delai', 'Délai', 'Ex : 31/12/2026')
        ];

        if (kind === 'pointfort') {
            return group(
                text('pointfort-titre', 'titre', 'Titre', 'Ex : Standard bien appliqué'),
                area('pointfort-constat', 'constat', 'Constat', 'Décrivez le point fort observé')
            ) + this.renderPhotoSection(kind);
        }
        if (kind === 'ecart') {
            return group(
                text('ecart-exigence', 'exigence', 'Exigence', 'Ex : INS-2426 / Bonnes pratiques de fabrication'),
                area('ecart-constat', 'constat', 'Constat', 'Décrivez le constat observé')
            )
                + '<span class="ref-detected" hidden></span>'
                + this.renderPhotoSection(kind)
                + group(text('ecart-action', 'action', 'Action corrective', 'Action à mettre en place'), ...owner('ecart'));
        }
        return group(area('observation-constat', 'constat', 'Constat', "Décrivez l'observation"))
            + this.renderPhotoSection(kind)
            + group(
                area('observation-risque', 'risque', 'Risque associé', 'Décrivez le risque potentiel', 3),
                text('observation-action', 'action', 'Action', 'Action à mettre en place'),
                ...owner('observation')
            );
    }

    renderPhotoSection(kind) {
        const prefix = this.KINDS[kind].prefix;
        return `
            <div class="photo-section">
                <div class="photo-section__head">
                    <span class="field-label">Photos</span>
                    <button type="button" class="btn btn--secondary btn--sm btn-add-image" data-action="add-photo">
                        ${ICONS.plus}<span>Ajouter</span>
                    </button>
                    <input type="file" class="${prefix}-image-input" accept="image/*,.heic,.HEIC" multiple hidden data-action="upload">
                </div>
                <div class="photo-grid ${prefix}-images-grid"></div>
                <p class="field-help">Ou cliquez dans la carte puis Ctrl+V pour coller une capture.</p>
            </div>
        `;
    }

    renderPhoto(img) {
        const bytes = img.size || (img.base64.length * 3 / 4);
        return `
            <figure class="photo" data-image-id="${this.escapeHtmlInput(img.id)}">
                <button type="button" class="photo__open" data-action="open-photo" aria-label="Agrandir la photo">
                    <img src="${this.escapeHtmlInput(img.base64)}" alt="${this.escapeHtmlInput(img.alt || 'Photo')}">
                </button>
                <button type="button" class="icon-btn photo__delete" data-action="remove-photo" aria-label="Supprimer la photo">${ICONS.trash}</button>
                <input type="text" class="photo__caption" placeholder="Légende" aria-label="Légende"
                       value="${this.escapeHtmlInput(img.alt || img.caption || '')}" data-action="caption">
                <figcaption class="photo__size">${Math.round(bytes / 1024)} Ko</figcaption>
            </figure>
        `;
    }

    getImages(kind, number) {
        const key = this.KINDS[kind].imageKey;
        const images = (this.currentData && this.currentData.images) || [];
        return images.filter(img => img[key] === number);
    }

    refreshImages(kind, number) {
        const card = this.getCard(kind, number);
        if (!card) return;
        card.querySelector('.photo-grid').innerHTML =
            this.getImages(kind, number).map(img => this.renderPhoto(img)).join('');
        this.updateCardSummary(card);
    }

    // Conservés pour le collage Ctrl+V
    refreshPointFortImages(number) { this.refreshImages('pointfort', number); }
    refreshEcartImages(number) { this.refreshImages('ecart', number); }
    refreshObservationImages(number) { this.refreshImages('observation', number); }

    updateCardSummary(card) {
        const kind = card.dataset.kind;
        const field = card.querySelector(this.KINDS[kind].summaryField);
        const text = field ? field.value.trim().replace(/\s+/g, ' ') : '';
        const summary = card.querySelector('.item-card__summary');
        summary.textContent = text || 'Sans titre';
        summary.classList.toggle('is-empty', !text);

        const count = this.getImages(kind, this.getCardNumber(card)).length;
        card.querySelector('.item-card__meta').textContent =
            count ? `${count} photo${count > 1 ? 's' : ''}` : '';
    }

    setCollapsed(card, collapsed) {
        card.classList.toggle('is-collapsed', collapsed);
        card.querySelector('.item-card__toggle').setAttribute('aria-expanded', String(!collapsed));
        // Contenu replié : ni focusable au clavier, ni lu par les lecteurs d'écran
        card.querySelector('.collapsible').inert = collapsed;
    }

    async handleImageUpload(kind, number, input) {
        const files = Array.from(input.files || []);
        if (files.length === 0) return;

        this.dismissUndo();
        if (!this.currentData) this.currentData = { images: [] };
        if (!this.currentData.images) this.currentData.images = [];

        // Vignettes provisoires pendant la conversion HEIC / compression
        const card = this.getCard(kind, number);
        const grid = card && card.querySelector('.photo-grid');
        files.forEach(() => {
            const placeholder = document.createElement('div');
            placeholder.className = 'photo photo--loading skeleton';
            if (grid) grid.appendChild(placeholder);
        });

        for (const file of files) {
            try {
                const processedFile = await this.convertHeicIfNeeded(file);
                // Redimensionnée + recompressée (une photo de 4 Mo passe à ~300 Ko)
                const compressed = await ImageCompressor.compressFile(processedFile);
                this.currentData.images.push({
                    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                    base64: compressed.base64,
                    alt: file.name.replace(/\.[^/.]+$/, ''),
                    contentType: compressed.contentType,
                    size: compressed.size,
                    [this.KINDS[kind].imageKey]: number,
                    caption: ''
                });
            } catch (error) {
                console.error(`❌ Erreur upload ${file.name}:`, error);
                showToast(`Impossible d'ajouter ${file.name} : ${error.message}`, { tone: 'danger', duration: 6000 });
            }
        }

        input.value = '';
        this.refreshImages(kind, number);
    }

    removeImage(kind, number, imageId) {
        const index = this.findImageIndexById(imageId);
        if (index === -1) return;

        const [removed] = this.currentData.images.splice(index, 1);
        this.refreshImages(kind, number);

        this.offerUndo('Photo supprimée', () => {
            this.currentData.images.splice(index, 0, removed);
            this.refreshImages(kind, removed[this.KINDS[kind].imageKey]);
        });
    }

    /**
     * Supprime une carte et ses photos, avec « Annuler » pendant quelques secondes
     */
    removeItem(card) {
        const kind = card.dataset.kind;
        const cfg = this.KINDS[kind];
        const container = this.getContainer(kind);
        const number = this.getCardNumber(card);
        const position = Array.from(container.children).indexOf(card);
        const imagesSnapshot = ((this.currentData && this.currentData.images) || []).map(img => ({ ...img }));

        if (this.currentData && this.currentData.images) {
            this.currentData.images = this.currentData.images.filter(img => img[cfg.imageKey] !== number);
        }
        card.remove();
        this.renumber(kind, { remapImages: true });

        const label = `${cfg.label} ${number} ${kind === 'observation' ? 'supprimée' : 'supprimé'}`;
        this.offerUndo(label, () => {
            container.insertBefore(card, container.children[position] || null);
            if (this.currentData) this.currentData.images = imagesSnapshot;
            // Les photos ont retrouvé leur numérotation d'origine : seules les cartes sont renumérotées
            this.renumber(kind, { remapImages: false });
        });
    }

    /**
     * Renumérote les cartes selon leur position (1..n).
     * remapImages : reporte l'ancien numéro des photos sur le nouveau (après suppression)
     */
    renumber(kind, { remapImages }) {
        const cfg = this.KINDS[kind];
        const cards = Array.from(this.getContainer(kind).querySelectorAll(`.${cfg.cardClass}`));

        cards.forEach((card, index) => {
            const newNumber = index + 1;
            const oldNumber = this.getCardNumber(card);
            if (remapImages && oldNumber !== newNumber && this.currentData && this.currentData.images) {
                this.currentData.images.forEach(img => {
                    if (img[cfg.imageKey] === oldNumber) img[cfg.imageKey] = newNumber;
                });
            }
            card.dataset[cfg.idAttr] = newNumber;
            card.querySelector('.badge').textContent = `${cfg.label} ${newNumber}`;
            card.querySelector('[data-action="remove"]')
                .setAttribute('aria-label', `Supprimer ${cfg.label.toLowerCase()} ${newNumber}`);
        });

        cards.forEach((card, index) => this.refreshImages(kind, index + 1));
        this[cfg.counter] = cards.length;
        this.updateCounts();
    }

    offerUndo(message, undo) {
        this.dismissUndo();
        this.pendingUndo = showToast(message, { actionLabel: 'Annuler', onAction: undo, duration: 6000 });
    }

    // Toute nouvelle modification de structure rend l'annulation précédente caduque
    dismissUndo() {
        if (this.pendingUndo) this.pendingUndo.dismiss();
        this.pendingUndo = null;
    }

    updateCounts() {
        const counts = {};
        Object.keys(this.KINDS).forEach(kind => {
            const container = this.getContainer(kind);
            counts[kind] = container ? container.querySelectorAll(`.${this.KINDS[kind].cardClass}`).length : 0;
        });

        document.querySelectorAll('[data-count]').forEach(el => {
            el.textContent = counts[el.dataset.count] || 0;
        });

        this.updateSynthesis();
        this.updateAssistant();

        const s = (n) => (n > 1 ? 's' : '');
        const status = document.getElementById('formStatus');
        if (status) {
            status.textContent = [
                `${counts.pointfort} point${s(counts.pointfort)} fort${s(counts.pointfort)}`,
                `${counts.ecart} écart${s(counts.ecart)}`,
                `${counts.observation} observation${s(counts.observation)}`
            ].join(' · ');
        }
    }

    /**
     * Bandeau de synthèse : n° / période / titre de l'audit, mis à jour à la saisie
     */
    updateSynthesis() {
        const meta = document.getElementById('synthMeta');
        const title = document.getElementById('synthTitle');
        if (!meta || !title) return;

        const number = this.formFields.auditNumber.value.trim();
        const period = this.formFields.period.value.trim();
        meta.textContent = ['Audit', number, period].filter(Boolean).join(' · ');

        const titleText = this.formFields.auditTitle.value.trim();
        title.textContent = titleText || 'Sans titre';
        title.classList.toggle('is-empty', !titleText);
    }

    attachCardListeners() {
        this.form.addEventListener('submit', (e) => e.preventDefault());

        this.form.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            const card = actionEl && actionEl.closest('.item-card');
            if (!card) return;

            const kind = card.dataset.kind;
            const number = this.getCardNumber(card);

            switch (actionEl.dataset.action) {
                case 'toggle':
                    this.setCollapsed(card, !card.classList.contains('is-collapsed'));
                    break;
                case 'remove':
                    this.removeItem(card);
                    break;
                case 'add-photo':
                    card.querySelector('input[data-action="upload"]').click();
                    break;
                case 'open-photo':
                    this.openImageLightbox(actionEl.querySelector('img').src);
                    break;
                case 'remove-photo':
                    this.removeImage(kind, number, actionEl.closest('[data-image-id]').dataset.imageId);
                    break;
            }
        });

        this.form.addEventListener('change', (e) => {
            const el = e.target;
            if (el.matches('input[data-action="upload"]')) {
                const card = el.closest('.item-card');
                this.handleImageUpload(card.dataset.kind, this.getCardNumber(card), el);
            } else if (el.matches('[data-action="caption"]')) {
                this.updateImageCaption(el.closest('[data-image-id]').dataset.imageId, el.value);
            }
        });

        this.form.addEventListener('input', (e) => {
            if (['auditNumber', 'auditTitle', 'period'].includes(e.target.id)) this.updateSynthesis();
            this.scheduleAssistant();
            const card = e.target.closest('.item-card');
            if (card && e.target.matches(this.KINDS[card.dataset.kind].summaryField)) {
                this.updateCardSummary(card);
            }
        });
    }

    /**
     * Assistant : complétude du plan d'action (écarts, observations) et
     * codes de référentiel cités dans les exigences mais absents de la liste
     */
    initAssistant() {
        this.assistantFrame = null;
        const tips = document.getElementById('assistantTips');
        if (!tips) return;

        tips.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-tip]');
            if (!btn) return;

            if (btn.dataset.tip === 'add-ref') {
                const field = this.formFields.referentials;
                const current = field.value.replace(/\s+$/, '');
                field.value = (current ? current + '\n' : '') + btn.dataset.code;
                this.updateAssistant();
                showToast(`${btn.dataset.code} ajouté aux référentiels`);
                return;
            }

            // Compléter : ouvre la fiche et place le curseur dans le premier champ vide
            const card = this.getCard(btn.dataset.kind, Number(btn.dataset.number));
            if (!card) return;
            this.setCollapsed(card, false);
            const field = card.querySelector(`.${this.KINDS[btn.dataset.kind].prefix}-${btn.dataset.field}`);
            if (!field) return;
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus({ preventScroll: true });
        });
    }

    // Saisie : un seul recalcul par image
    scheduleAssistant() {
        if (this.assistantFrame) return;
        this.assistantFrame = requestAnimationFrame(() => {
            this.assistantFrame = null;
            this.updateAssistant();
        });
    }

    planStatus(card) {
        const prefix = this.KINDS[card.dataset.kind].prefix;
        return this.PLAN_FIELDS.map(f => {
            const field = card.querySelector(`.${prefix}-${f.key}`);
            return { ...f, filled: !!(field && field.value.trim()) };
        });
    }

    refCodes(text) {
        return Array.from(new Set(text.match(this.REF_CODE) || []));
    }

    updateAssistant() {
        const tipsList = document.getElementById('assistantTips');
        const referentials = (this.formFields.referentials.value || '').toUpperCase();
        const isKnown = (code) => referentials.includes(code);
        const esc = (s) => this.escapeHtmlInput(s);
        const tips = [];
        let filled = 0;
        let expected = 0;

        ['ecart', 'observation'].forEach(kind => {
            const container = this.getContainer(kind);
            if (!container) return;
            container.querySelectorAll(`.${this.KINDS[kind].cardClass}`).forEach(card => {
                const number = this.getCardNumber(card);
                const status = this.planStatus(card);
                const missing = status.filter(f => !f.filled);
                filled += status.length - missing.length;
                expected += status.length;

                status.forEach(f => {
                    const pill = card.querySelector(`[data-pill="${f.key}"]`);
                    if (pill) pill.classList.toggle('is-ok', f.filled);
                });

                const name = `${this.KINDS[kind].label} ${number}`;
                if (missing.length) {
                    tips.push({
                        type: 'missing',
                        html: `<strong>${name}</strong> : ${missing.map(f => f.label.toLowerCase()).join(', ')} à compléter`,
                        button: `<button type="button" class="btn btn--secondary btn--sm" data-tip="fill" data-kind="${kind}" data-number="${number}" data-field="${missing[0].key}" aria-label="Compléter ${name.toLowerCase()}">Compléter</button>`
                    });
                }

                if (kind !== 'ecart') return;
                const exigence = card.querySelector('.ecart-exigence');
                const codes = this.refCodes(exigence ? exigence.value : '');
                const chip = card.querySelector('.ref-detected');
                if (chip) {
                    chip.hidden = codes.length === 0;
                    const unknown = codes.filter(code => !isKnown(code));
                    chip.classList.toggle('is-missing', unknown.length > 0);
                    chip.textContent = unknown.length
                        ? `Absent des référentiels : ${unknown.join(', ')}`
                        : `✓ Référentiel reconnu : ${codes.join(', ')}`;
                }
                codes.filter(code => !isKnown(code)).forEach(code => {
                    if (tips.some(t => t.code === code)) return;
                    tips.push({
                        type: 'ref',
                        code,
                        html: `<strong>${esc(code)}</strong> cité dans l'écart ${number} mais absent des référentiels`,
                        button: `<button type="button" class="btn btn--secondary btn--sm" data-tip="add-ref" data-code="${esc(code)}" aria-label="Ajouter ${esc(code)} aux référentiels">Ajouter</button>`
                    });
                });
            });
        });

        // Anneau de progression
        const pct = expected ? Math.round(filled / expected * 100) : 0;
        const ring = document.getElementById('planRing');
        const ringValue = document.getElementById('planRingValue');
        const ringLabel = document.getElementById('planRingLabel');
        if (ring && ringValue && ringLabel) {
            ringValue.style.strokeDashoffset = String(314.16 * (1 - pct / 100));
            ringLabel.textContent = expected ? `${pct} %` : '–';
            ring.setAttribute('aria-valuenow', String(pct));
            ring.setAttribute('aria-valuetext', expected ? `${pct} % du plan d'action renseigné` : 'Aucun écart ni observation');
        }

        const tipsCount = document.getElementById('tipsCount');
        if (tipsCount) tipsCount.textContent = tips.length;
        if (!tipsList) return;

        const icon = { missing: '!', ref: '§', ok: '✓' };
        const MAX_TIPS = 5;
        let html = tips.slice(0, MAX_TIPS).map(t => `
            <li class="tip tip--${t.type}">
                <span class="tip__icon" aria-hidden="true">${icon[t.type]}</span>
                <span class="tip__text">${t.html}</span>
                ${t.button}
            </li>`).join('');
        if (tips.length > MAX_TIPS) {
            html += `<li class="tip tip--more">+ ${tips.length - MAX_TIPS} autre${tips.length - MAX_TIPS > 1 ? 's' : ''} point${tips.length - MAX_TIPS > 1 ? 's' : ''} à traiter</li>`;
        }
        if (!tips.length) {
            const text = expected
                ? '<strong>Tout est prêt.</strong> Le plan d\'action est complet.'
                : 'Ajoutez un écart ou une observation pour suivre le plan d\'action.';
            html = `<li class="tip tip--ok"><span class="tip__icon" aria-hidden="true">${icon.ok}</span><span class="tip__text">${text}</span></li>`;
        }
        // Pas de réécriture si rien n'a changé : préserve le focus et les animations
        if (this.lastTipsHtml !== html) {
            this.lastTipsHtml = html;
            tipsList.innerHTML = html;
        }
    }

    /**
     * Sommaire latéral : section visible mise en évidence au défilement
     */
    initSectionNav() {
        const links = Array.from(document.querySelectorAll('.section-nav a[href^="#"]'));
        if (links.length === 0 || typeof IntersectionObserver === 'undefined') return;

        const byId = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                links.forEach(link => link.classList.remove('is-active'));
                const link = byId.get(entry.target.id);
                if (link) link.classList.add('is-active');
            });
        }, { rootMargin: '-30% 0px -60% 0px' });

        byId.forEach((link, id) => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    }

    showForm() {
        this.form.hidden = false;
        if (this.editEmpty) this.editEmpty.hidden = true;
        this.updateCounts();
    }



    /**
     * Échappe une valeur injectée via innerHTML (attribut ou contenu).
     * Sans ça, un guillemet tronque le champ et un « </textarea> » venant
     * d'un JSON/HTML importé exécute du script (XSS).
     */
    /**
     * Destinataires par défaut d'un nouveau rapport : dernière saisie dans ce
     * navigateur, sinon config.local.js. Rien n'est stocké dans le repo.
     */
    getDefaultPlanActionRecipients() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.RECIPIENTS_STORAGE_KEY) || '[]');
            if (Array.isArray(saved) && saved.length > 0) return saved;
        } catch (e) { /* stockage indisponible : on passe à la config */ }

        const cfg = window.AUDIT_CONFIG || {};
        return Array.isArray(cfg.planActionRecipients) ? cfg.planActionRecipients : [];
    }


    rememberPlanActionRecipients(recipients) {
        try {
            localStorage.setItem(this.RECIPIENTS_STORAGE_KEY, JSON.stringify(recipients));
        } catch (e) { /* non bloquant */ }
    }


    escapeHtmlInput(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }


    escapeHtmlTextarea(str) {
        return this.escapeHtmlInput(str);
    }


    /**
     * Collecte les données du formulaire
     */
    collectFormData() {
        console.log('📊 Collecte des données du formulaire...');

        const data = {
            metadata: {
                kicker: this.formFields.reportKicker.value.trim(),
                auditNumber: this.formFields.auditNumber.value.trim(),
                title: this.formFields.auditTitle.value.trim(),
                team: this.formFields.team.value.trim(),
                period: this.formFields.period.value.trim(),
                reportDate: this.formFields.reportDate.value.trim(),
                objective: this.formFields.objective.value.trim(),
                perimeter: this.formFields.perimeter.value.trim(),
                referentials: this.formFields.referentials.value
                    .split('\n')
                    .map(r => r.trim())
                    .filter(r => r),
                context: {
                    poste: this.formFields.contextePoste.value.trim(),
                    article: this.formFields.contexteArticle.value.trim(),
                    operation: this.formFields.contexteOperation.value.trim()
                }
            },

            // ✅ Points forts
            pointsForts: [],

            ecarts: [],
            observations: [],
            remarques: {
                audites: this.formFields.remarquesAudites.value
                    .split('\n')
                    .map(r => r.trim())
                    .filter(r => r),
                reunion: this.formFields.remarquesReunion.value
                    .split('\n')
                    .map(r => r.trim())
                    .filter(r => r)
            },
            auditedPersons: this.formFields.auditedPersons.value
                .split('\n')
                .map(p => p.trim())
                .filter(p => p),
            distribution: this.formFields.distribution.value
                .split('\n')
                .map(d => d.trim())
                .filter(d => d),
            images: (this.currentData && this.currentData.images) || [],
            planActionRecipients: (this.formFields.planActionRecipients ? this.formFields.planActionRecipients.value : '')
                .split('\n')
                .map(r => r.trim())
                .filter(r => r),
            cloture: {
                noteFinale: (this.formFields.noteFinale ? this.formFields.noteFinale.value : '').trim(),
                prochainesEtapesTexte: (this.formFields.prochainesEtapes ? this.formFields.prochainesEtapes.value : '').trim()
            },
            summary: {}
        };

        // ✅ Points forts
        const pfCards = this.pointsFortsContainer ? this.pointsFortsContainer.querySelectorAll('.pointfort-card') : [];
        pfCards.forEach((card, index) => {
            const pf = {
                number: index + 1,
                titre: card.querySelector('.pointfort-titre').value.trim(),
                constat: card.querySelector('.pointfort-constat').value.trim()
            };
            data.pointsForts.push(pf);
        });

        // Écarts
        const ecartCards = this.ecartsContainer.querySelectorAll('.ecart-card');
        ecartCards.forEach((card, index) => {
            const ecart = {
                number: index + 1,
                exigence: card.querySelector('.ecart-exigence').value.trim(),
                constat: card.querySelector('.ecart-constat').value.trim(),
                action: card.querySelector('.ecart-action').value.trim(),
                responsable: card.querySelector('.ecart-responsable').value.trim(),
                delai: card.querySelector('.ecart-delai').value.trim()
            };
            data.ecarts.push(ecart);
        });

        // Observations
        const obsCards = this.observationsContainer.querySelectorAll('.observation-card');
        obsCards.forEach((card, index) => {
            const obs = {
                number: index + 1,
                constat: card.querySelector('.observation-constat').value.trim(),
                risque: card.querySelector('.observation-risque').value.trim(),
                action: (card.querySelector('.observation-action')?.value || '').trim(),
                responsable: (card.querySelector('.observation-responsable')?.value || '').trim(),
                delai: (card.querySelector('.observation-delai')?.value || '').trim()
            };
            data.observations.push(obs);
        });

        if (data.planActionRecipients.length > 0) {
            this.rememberPlanActionRecipients(data.planActionRecipients);
        }

        data.summary = {
            pointFortCount: data.pointsForts.length,
            ecartCount: data.ecarts.length,
            observationCount: data.observations.length,
            remarqueCount: data.remarques.audites.length
        };

        console.log('✅ Données collectées:', data);
        return data;
    }


    /**
     * Sauvegarde et prévisualise
     */
    saveAndPreview() {
        console.log('💾 Sauvegarde et prévisualisation...');

        // Collecter les données
        const data = this.collectFormData();

        // Générer le HTML
        try {
            console.log('🎨 Génération du HTML...');
			
            const html = generateAuditReport(data);

            // Afficher dans l'aperçu
            const iframe = document.getElementById('previewIframe');
            iframe.srcdoc = html;

            // Stocker pour export
            window.currentEditedData = data;
            window.currentEditedHTML = html;

            // Basculer vers l'onglet aperçu
            document.querySelector('[data-tab="preview"]').click();

            console.log('✅ Aperçu généré avec succès');

        } catch (error) {
            console.error('❌ Erreur génération HTML:', error);
            alert('❌ Erreur lors de la génération du HTML:\n\n' + error.message);
        }
    }


    /**
     * Exporte le JSON édité
     */
    exportJSON() {
        console.log('📥 Export JSON...');

        const data = this.collectFormData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // ✅ Générer un nom de fichier propre
        const auditNumber = data.metadata.auditNumber || 'sans-numero';
        const fileName = `Audit ${auditNumber}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);

        showToast(`JSON exporté : ${fileName}`);
        console.log(`✅ JSON exporté : ${fileName}`);
    }


    /**
     * Réinitialise le formulaire
     */
    resetForm() {
        if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser le formulaire ?\n\nToutes les modifications non sauvegardées seront perdues.')) {
            console.log('🔄 Réinitialisation du formulaire...');

            this.form.reset();
            if (this.pointsFortsContainer) this.pointsFortsContainer.innerHTML = '';
            this.ecartsContainer.innerHTML = '';
            this.observationsContainer.innerHTML = '';

            this.pointFortCounter = 0;
            this.ecartCounter = 0;
            this.observationCounter = 0;
            // Objet vide (et non null) : l'ajout de photos reste possible après réinitialisation
            this.currentData = { images: [] };
            this.dismissUndo();
            this.updateCounts();

            console.log('✅ Formulaire réinitialisé');
        }
    }


    /**
     * ✅ NOUVEAU : Charge un fichier JSON depuis le disque
     */
    loadFromJsonFile() {
        console.log('📂 Ouverture du sélecteur de fichier JSON...');

        // Créer un input file temporaire
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            console.log('📄 Fichier sélectionné:', file.name);

            try {
                // Lire le fichier
                const content = await this.readFileAsText(file);

                // Parser le JSON
                let data;
                try {
                    data = JSON.parse(content);
                } catch (parseError) {
                    alert(`❌ Le fichier JSON est invalide :\n${parseError.message}`);
                    return;
                }

                // Vérifier la structure
                if (!data.metadata) {
                    alert('❌ Le fichier JSON ne semble pas être un rapport d\'audit valide.\n\nIl doit contenir au minimum une section "metadata".');
                    return;
                }

                console.log('✅ JSON valide, chargement dans l\'éditeur...');

                // Rapports existants : photos alourdies avant la compression automatique
                await ImageCompressor.compressAll(data.images);

                // Charger dans l'éditeur
                this.currentData = data;
                if (!Array.isArray(this.currentData.pointsForts)) this.currentData.pointsForts = [];
                this.populateForm(this.currentData);
                this.showForm();

                // Scroll vers le formulaire
                this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });

                console.log('✅ Données JSON chargées avec succès');

            } catch (error) {
                console.error('❌ Erreur chargement JSON:', error);
                alert(`❌ Erreur lors du chargement du fichier :\n${error.message}`);
            }
        };

        // Déclencher le sélecteur
        input.click();
    }


    /**
     * ✅ NOUVEAU : Lit un fichier texte (helper)
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }


    /**
     * Trouve l'index d'une image par son id
     */
    findImageIndexById(imageId) {
        if (!this.currentData || !this.currentData.images) return -1;
        return this.currentData.images.findIndex(img => img.id === imageId);
    }


    /**
     * Garantit un id unique par image (JSON externes : id absent ou dupliqué)
     */
    ensureImageIds(images) {
        const seen = new Set();
        images.forEach(img => {
            if (!img.id || seen.has(img.id)) {
                img.id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            }
            seen.add(img.id);
        });
    }


    /**
     * Met à jour la légende d'une image
     */
    updateImageCaption(imageId, caption) {
        const index = this.findImageIndexById(imageId);
        if (index !== -1) {
            this.currentData.images[index].alt = caption;
            this.currentData.images[index].caption = caption;
            console.log(`✏️ Légende mise à jour pour image ${imageId}:`, caption);
        }
    }


    /**
     * ✅ HEIC : Détecte et convertit les fichiers HEIC en JPEG
     */
    async convertHeicIfNeeded(file) {
        const isHeic = file.type === 'image/heic' ||
            file.type === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif');

        if (!isHeic) {
            console.log(`ℹ️ ${file.name} n'est pas un HEIC, pas de conversion nécessaire`);
            return file;
        }

        console.log(`🔄 Conversion HEIC détectée pour: ${file.name}`);

        if (typeof heic2any === 'undefined') {
            throw new Error('La bibliothèque heic2any n\'est pas chargée. Veuillez recharger la page.');
        }

        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.92
            });

            const convertedFile = new File(
                [convertedBlob],
                file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
                { type: 'image/jpeg' }
            );

            console.log(`✅ HEIC converti avec succès: ${file.name} → ${convertedFile.name}`);
            console.log(`   Taille originale: ${(file.size / 1024).toFixed(1)} KB`);
            console.log(`   Taille convertie: ${(convertedFile.size / 1024).toFixed(1)} KB`);

            return convertedFile;

        } catch (error) {
            console.error('❌ Erreur conversion HEIC:', error);
            throw new Error(`Impossible de convertir ${file.name}: ${error.message}`);
        }
    }


    /**
     * Ouvre le lightbox pour preview avec animation fluide
     */
    openImageLightbox(base64) {
        let lightbox = document.getElementById('imageLightbox');

        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'imageLightbox';
            lightbox.className = 'image-lightbox';
            lightbox.setAttribute('role', 'dialog');
            lightbox.setAttribute('aria-modal', 'true');
            lightbox.setAttribute('aria-label', 'Photo agrandie');
            lightbox.innerHTML = `
                <div class="image-lightbox-content">
                    <button type="button" class="image-lightbox-close" aria-label="Fermer">✕</button>
                    <img src="" alt="Photo agrandie" class="image-lightbox-img">
                </div>
            `;
            document.body.appendChild(lightbox);

            // Fermeture : focus rendu à l'élément qui a ouvert la photo
            const close = () => {
                lightbox.classList.remove('active');
                if (this.lightboxOpener && this.lightboxOpener.isConnected) this.lightboxOpener.focus();
            };
            lightbox.querySelector('.image-lightbox-close').addEventListener('click', close);

            // Fermeture au clic sur le fond
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) close();
            });

            // Échap ferme ; Tab reste sur le bouton Fermer (seul élément actif)
            document.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('active')) return;
                if (e.key === 'Escape') close();
                if (e.key === 'Tab') {
                    e.preventDefault();
                    lightbox.querySelector('.image-lightbox-close').focus();
                }
            });

            // Enregistré une seule fois (avant : un listener de plus à chaque ouverture)
            lightbox.addEventListener('transitionend', (e) => {
                if (e.propertyName === 'opacity' && !lightbox.classList.contains('active')) {
                    document.body.style.overflow = '';
                }
            });
        }

        this.lightboxOpener = document.activeElement;
        const img = lightbox.querySelector('.image-lightbox-img');

        const preloadImg = new Image();
        preloadImg.onload = function () {
            img.src = base64;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    lightbox.querySelector('.image-lightbox-close').focus();
                });
            });
        };
        preloadImg.src = base64;
    }

	
	// =====================================================
// COLLER DEPUIS LE PRESSE-PAPIER (Ctrl+V)
// Fonctionne en file:// via événement paste natif
// =====================================================

/**
 * Initialise l'écoute du Ctrl+V sur les zones images
 */
initClipboardPaste() {
    // Écoute globale de l'événement paste sur le document
    document.addEventListener('paste', (event) => {
        this.handlePasteEvent(event);
    });

    console.log('📋 Écoute Ctrl+V initialisée');
}


/**
 * Gère l'événement paste — détecte si on est dans une zone image
 */
handlePasteEvent(event) {
    const items = event.clipboardData && event.clipboardData.items;
    if (!items) return;

    // Chercher une image dans le presse-papier
    let imageItem = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            imageItem = items[i];
            break;
        }
    }

    if (!imageItem) return;

    // Déterminer dans quelle zone on se trouve
    const activeElement = document.activeElement;
    const target = event.target;

    // Chercher la card parente
    const ecartCard = target.closest('.ecart-card') ||
                      activeElement.closest('.ecart-card');
    const obsCard   = target.closest('.observation-card') ||
                      activeElement.closest('.observation-card');
    const pfCard    = target.closest('.pointfort-card') ||
                      activeElement.closest('.pointfort-card');

    if (!ecartCard && !obsCard && !pfCard) {
        // Pas dans une zone image — afficher un toast d'aide
        showToast('Cliquez dans un point fort, un écart ou une observation, puis Ctrl+V');
        return;
    }

    // Empêcher le comportement par défaut
    event.preventDefault();

    // Lire l'image
    const file = imageItem.getAsFile();
    if (!file) return;

    if (ecartCard) {
        const ecartNumber = parseInt(ecartCard.dataset.ecartId);
        this.processClipboardImage(file, 'ecart', ecartNumber);
    } else if (obsCard) {
        const obsNumber = parseInt(obsCard.dataset.observationId);
        this.processClipboardImage(file, 'observation', obsNumber);
    } else if (pfCard) {
        const pfNumber = parseInt(pfCard.dataset.pointfortId);
        this.processClipboardImage(file, 'pointfort', pfNumber);
    }
}


/**
 * Traite l'image collée et l'ajoute aux données
 */
async processClipboardImage(file, type, number) {
    console.log(`📋 Image collée pour ${type} ${number}`);

    if (!this.currentData) {
        showToast("Aucun rapport en cours : créez ou chargez un rapport d'abord.", { tone: 'danger' });
        return;
    }

    if (!this.currentData.images) {
        this.currentData.images = [];
    }

    try {
        // Conversion HEIC si nécessaire (peu probable depuis presse-papier mais par sécurité)
        const processedFile = await this.convertHeicIfNeeded(file);
        // Redimensionnée + recompressée (une photo de 4 Mo passe à ~300 Ko)
        const compressed = await ImageCompressor.compressFile(processedFile);

        // Nom automatique avec horodatage
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const fileName = `capture-${timestamp}`;

        const imageData = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            base64: compressed.base64,
            alt: fileName,
            contentType: compressed.contentType,
            size: compressed.size,
            caption: ''
        };

        // Associer à la bonne entité
        if (type === 'ecart') {
            imageData.ecartNumber = number;
        } else if (type === 'observation') {
            imageData.observationNumber = number;
        } else if (type === 'pointfort') {
            imageData.pointFortNumber = number;
        }

        this.currentData.images.push(imageData);

        // Rafraîchir l'affichage
        if (type === 'ecart') {
            this.refreshEcartImages(number);
        } else if (type === 'observation') {
            this.refreshObservationImages(number);
        } else if (type === 'pointfort') {
            this.refreshPointFortImages(number);
        }

        // Feedback visuel
        this.showPasteSuccess(type, number);

        console.log(`✅ Image collée ajoutée au ${type} ${number}`);

    } catch (error) {
        console.error('❌ Erreur collage image:', error);
        showToast(`Impossible de coller l'image : ${error.message}`, { tone: 'danger', duration: 6000 });
    }
}


/**
 * Feedback visuel — flash vert sur la zone image
 */
showPasteSuccess(type, number) {
    const card = this.getCard(type, number);
    const target = card && card.querySelector('.photo-section');
    if (!target) return;

    // Carte repliée : on l'ouvre pour montrer la photo ajoutée
    this.setCollapsed(card, false);
    target.classList.add('paste-success');
    setTimeout(() => target.classList.remove('paste-success'), 800);
}

}

// Initialiser l'éditeur au chargement
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de l\'éditeur...');
    window.editor = new AuditEditor();
    console.log('✅ Éditeur initialisé');
});
