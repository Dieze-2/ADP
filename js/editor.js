/**
 * Éditeur interactif de rapports d'audit
 * ✅ VERSION AVEC SUPPORT HEIC
 * ✅ Ajout Points forts + pré-remplissage Objectif
 */

class AuditEditor {
    constructor() {
        this.currentData = null;
        this.pointFortCounter = 0;
        this.ecartCounter = 0;
        this.observationCounter = 0;

        this.RECIPIENTS_STORAGE_KEY = 'generator-plan-action-recipients';

        this.DEFAULT_OBJECTIVE =
            "Evaluer les éventuels écarts sur le terrain avec le référentiel du secteur Fournitures et remonter les améliorations potentielles.";

        this.initializeElements();
        this.attachEventListeners();
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

        // ✅ Points forts
        this.pointsFortsContainer = document.getElementById('pointsforts-container');
        this.addPointFortBtn = document.getElementById('addPointFort');

        this.ecartsContainer = document.getElementById('ecarts-container');
        this.observationsContainer = document.getElementById('observations-container');

        this.addEcartBtn = document.getElementById('addEcart');
        this.addObservationBtn = document.getElementById('addObservation');

        // ✅ Nouveau : prochainesEtapesTexte remplace prochainesEtapes (liste)
        this.formFields = {
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
        this.loadFromJsonBtn.addEventListener('click', () => this.loadFromParsedData());
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
        if (this.addPointFortBtn) this.addPointFortBtn.addEventListener('click', () => this.addPointFort());
        this.addEcartBtn.addEventListener('click', () => this.addEcart());
        this.addObservationBtn.addEventListener('click', () => this.addObservation());
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
        this.form.style.display = 'block';

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
        this.form.style.display = 'block';
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

        const pointsForts = data.pointsForts || [];
        pointsForts.forEach((pf) => this.addPointFort(pf));

        const ecarts = data.ecarts || [];
        ecarts.forEach((ecart) => this.addEcart(ecart));

        const observations = data.observations || [];
        observations.forEach((obs) => this.addObservation(obs));

        console.log(`✅ Formulaire rempli: ${pointsForts.length} point(s) fort(s), ${ecarts.length} écarts, ${observations.length} observations`);
    }

    // =====================================================
    // ✅ POINTS FORTS
    // =====================================================

    addPointFort(pointFort = null) {
        this.pointFortCounter++;
        const pointFortNumber = this.pointFortCounter;

        const pfCard = document.createElement('div');
        pfCard.className = 'item-card pointfort-card';
        pfCard.dataset.pointfortId = pointFortNumber;

        const pfImages = this.getImagesForPointFort(pointFortNumber);

        const titreVal = (pointFort && pointFort.titre) || '';
        const constatVal = (pointFort && pointFort.constat) || '';

        pfCard.innerHTML = `
            <div class="item-card-header">
                <h4>✅ Point fort ${pointFortNumber}</h4>
                <button type="button" class="btn-remove" onclick="window.editor.removePointFort(this)">
                    🗑️ Supprimer
                </button>
            </div>

            <div class="form-group">
                <label>Titre</label>
                <input type="text"
                       class="pointfort-titre"
                       value="${this.escapeHtmlInput(titreVal)}"
                       placeholder="Ex: Standard bien appliqué / Bonne pratique observée">
            </div>

            <div class="form-group">
                <label>Constat</label>
                <textarea class="pointfort-constat"
                          rows="4"
                          placeholder="Décrivez le point fort observé...">${this.escapeHtmlTextarea(constatVal)}</textarea>
            </div>

            <div class="ecart-images-section">
                <div class="ecart-images-header">
                    <label>📸 Photos du point fort</label>
                    <button type="button" class="btn-add-image" onclick="window.editor.triggerPointFortImageUpload(${pointFortNumber})">
                        ➕ Ajouter une photo
                    </button>
                    <input type="file"
                           class="pointfort-image-input"
                           id="pointfort-image-input-${pointFortNumber}"
                           accept="image/*,.heic,.HEIC"
                           multiple
                           style="display: none;"
                           onchange="window.editor.handlePointFortImageUpload(${pointFortNumber}, event)">
                </div>

                <div class="ecart-images-grid" id="pointfort-images-${pointFortNumber}">
                    ${this.renderPointFortImages(pfImages, pointFortNumber)}
                </div>
            </div>
        `;

        if (this.pointsFortsContainer) this.pointsFortsContainer.appendChild(pfCard);

        console.log(`➕ Point fort ${pointFortNumber} ajouté avec ${pfImages.length} image(s)`);
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

    getImagesForPointFort(pointFortNumber) {
        if (!this.currentData || !this.currentData.images) return [];
        return this.currentData.images.filter(img => img.pointFortNumber === pointFortNumber);
    }

    renderPointFortImages(images, pointFortNumber) {
        if (!images || images.length === 0) return '';

        return images.map((img) => {
            const sizeKB = img.size
                ? (img.size / 1024).toFixed(1)
                : ((img.base64.length * 3 / 4) / 1024).toFixed(1);

            return `
                <div class="ecart-image-item" data-image-id="${this.escapeHtmlInput(img.id)}">
                    <img src="${this.escapeHtmlInput(img.base64)}"
                         alt="${this.escapeHtmlInput(img.alt || 'Image')}"
                         class="ecart-image-preview"
                         onclick="window.editor.openImageLightbox(this.src)">

                    <input type="text"
                           class="ecart-image-caption"
                           placeholder="Légende..."
                           value="${this.escapeHtmlInput(img.alt || img.caption || '')}"
                           onchange="window.editor.updateImageCaption(this.closest('[data-image-id]').dataset.imageId, this.value)">

                    <button type="button"
                            class="ecart-image-delete"
                            onclick="window.editor.removePointFortImage(${pointFortNumber}, this.closest('[data-image-id]').dataset.imageId)">
                        🗑️ Supprimer
                    </button>

                    <div class="ecart-image-size">📊 ${sizeKB} KB</div>
                </div>
            `;
        }).join('');
    }

    triggerPointFortImageUpload(pointFortNumber) {
        const input = document.getElementById(`pointfort-image-input-${pointFortNumber}`);
        if (input) input.click();
    }

    async handlePointFortImageUpload(pointFortNumber, event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        console.log(`📤 Upload de ${files.length} image(s) pour le point fort ${pointFortNumber}...`);

        if (!this.currentData.images) this.currentData.images = [];

        for (let file of files) {
            try {
                const processedFile = await this.convertHeicIfNeeded(file);
                // Redimensionnée + recompressée (une photo de 4 Mo passe à ~300 Ko)
                const compressed = await ImageCompressor.compressFile(processedFile);

                const imageData = {
                    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    base64: compressed.base64,
                    alt: file.name.replace(/\.[^/.]+$/, ''),
                    contentType: compressed.contentType,
                    size: compressed.size,
                    pointFortNumber: pointFortNumber,
                    caption: ''
                };

                this.currentData.images.push(imageData);
                console.log(`✅ Image ajoutée au point fort ${pointFortNumber}: ${file.name}`);
            } catch (error) {
                console.error(`❌ Erreur upload ${file.name}:`, error);
                alert(`❌ Erreur lors du traitement de ${file.name}:\n${error.message}`);
            }
        }

        this.refreshPointFortImages(pointFortNumber);
        event.target.value = '';
    }

    refreshPointFortImages(pointFortNumber) {
        const container = document.getElementById(`pointfort-images-${pointFortNumber}`);
        if (!container) return;

        const images = this.getImagesForPointFort(pointFortNumber);
        container.innerHTML = this.renderPointFortImages(images, pointFortNumber);

        console.log(`🔄 Images du point fort ${pointFortNumber} rafraîchies: ${images.length} image(s)`);
    }

    removePointFortImage(pointFortNumber, imageId) {
        if (!confirm('⚠️ Supprimer cette image ?')) return;

        const index = this.findImageIndexById(imageId);
        if (index !== -1) {
            this.currentData.images.splice(index, 1);
            this.refreshPointFortImages(pointFortNumber);
        }
    }

    removePointFort(button) {
        if (!confirm('⚠️ Supprimer ce point fort et ses images associées ?')) return;

        const pfCard = button.closest('.pointfort-card');
        const pfNumber = parseInt(pfCard.dataset.pointfortId);

        console.log(`🗑️ Suppression point fort ${pfNumber}`);

        if (this.currentData && this.currentData.images) {
            this.currentData.images = this.currentData.images.filter(
                img => img.pointFortNumber !== pfNumber
            );
            console.log(`  ✅ Images du point fort ${pfNumber} supprimées`);
        }

        pfCard.remove();
        this.reindexPointsForts();
    }

    reindexPointsForts() {
        const pfCards = this.pointsFortsContainer ? this.pointsFortsContainer.querySelectorAll('.pointfort-card') : [];

        pfCards.forEach((card, index) => {
            const newNumber = index + 1;
            const oldNumber = parseInt(card.dataset.pointfortId);

            card.dataset.pointfortId = newNumber;

            const title = card.querySelector('h4');
            if (title) title.textContent = `✅ Point fort ${newNumber}`;

            if (this.currentData && this.currentData.images) {
                this.currentData.images.forEach(img => {
                    if (img.pointFortNumber === oldNumber) img.pointFortNumber = newNumber;
                });
            }

            const imageInput = card.querySelector('.pointfort-image-input');
            if (imageInput) {
                imageInput.id = `pointfort-image-input-${newNumber}`;
                imageInput.setAttribute('onchange', `window.editor.handlePointFortImageUpload(${newNumber}, event)`);
            }

            const addBtn = card.querySelector('.btn-add-image');
            if (addBtn) {
                addBtn.setAttribute('onclick', `window.editor.triggerPointFortImageUpload(${newNumber})`);
            }

            const imagesGrid = card.querySelector('.ecart-images-grid');
            if (imagesGrid) {
                imagesGrid.id = `pointfort-images-${newNumber}`;
                this.refreshPointFortImages(newNumber);
            }
        });

        this.pointFortCounter = pfCards.length;
        console.log(`🔄 Points forts réindexés: ${this.pointFortCounter} point(s) fort(s)`);
    }

    // =====================================================
    // ÉCARTS / OBSERVATIONS (inchangés)
    // =====================================================

    /**
     * Ajoute un écart au formulaire
     */
    addEcart(ecart = null) {
        this.ecartCounter++;
        const ecartNumber = this.ecartCounter;

        const ecartCard = document.createElement('div');
        ecartCard.className = 'item-card ecart-card';
        ecartCard.dataset.ecartId = ecartNumber;

        // Récupérer les images associées à cet écart
        const ecartImages = this.getImagesForEcart(ecartNumber);

        const exigenceVal = (ecart && ecart.exigence) || '';
        const constatVal = (ecart && ecart.constat) || '';
        const actionVal = (ecart && ecart.action) || '';
        const responsableVal = (ecart && ecart.responsable) || '';
        const delaiVal = (ecart && ecart.delai) || '';

        ecartCard.innerHTML = `
            <div class="item-card-header">
                <h4>⚠️ Écart ${ecartNumber}</h4>
                <button type="button" class="btn-remove" onclick="window.editor.removeEcart(this)">
                    🗑️ Supprimer
                </button>
            </div>
            
            <div class="form-group">
                <label>Exigence</label>
                <input type="text" 
                       class="ecart-exigence" 
                       value="${this.escapeHtmlInput(exigenceVal)}"
                       placeholder="Ex: INS-2426 / Bonnes pratiques de fabrication">
            </div>
            
            <div class="form-group">
                <label>Constat</label>
                <textarea class="ecart-constat" 
                          rows="4" 
                          placeholder="Décrivez le constat observé...">${this.escapeHtmlTextarea(constatVal)}</textarea>
            </div>
            
            <!-- ✅ SECTION IMAGES POUR CET ÉCART -->
            <div class="ecart-images-section">
                <div class="ecart-images-header">
                    <label>📸 Photos du constat</label>
                    <button type="button" class="btn-add-image" onclick="window.editor.triggerImageUpload(${ecartNumber})">
                        ➕ Ajouter une photo
                    </button>
                    <input type="file" 
                           class="ecart-image-input" 
                           id="ecart-image-input-${ecartNumber}"
                           accept="image/*,.heic,.HEIC" 
                           multiple 
                           style="display: none;"
                           onchange="window.editor.handleEcartImageUpload(${ecartNumber}, event)">
                </div>
                
                <div class="ecart-images-grid" id="ecart-images-${ecartNumber}">
                    ${this.renderEcartImages(ecartImages, ecartNumber)}
                </div>
            </div>
            
            <div class="form-group">
                <label>Action corrective</label>
                <input type="text" 
                       class="ecart-action" 
                       value="${this.escapeHtmlInput(actionVal)}"
                       placeholder="Action à mettre en place">
            </div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label>Responsable</label>
                    <input type="text" 
                           class="ecart-responsable" 
                           value="${this.escapeHtmlInput(responsableVal)}"
                           placeholder="Nom du responsable">
                </div>
                <div class="form-group">
                    <label>Délai</label>
                    <input type="text" 
                           class="ecart-delai" 
                           value="${this.escapeHtmlInput(delaiVal)}"
                           placeholder="Ex: 31/12/2024">
                </div>
            </div>
        `;

        this.ecartsContainer.appendChild(ecartCard);

        console.log(`➕ Écart ${ecartNumber} ajouté avec ${ecartImages.length} image(s)`);
    }

    /**
     * Ajoute une observation au formulaire
     */
    addObservation(obs = null) {
        this.observationCounter++;
        const obsNumber = this.observationCounter;

        const obsCard = document.createElement('div');
        obsCard.className = 'item-card observation-card';
        obsCard.dataset.observationId = obsNumber;

        const obsImages = this.getImagesForObservation(obsNumber);

        const constatVal = (obs && obs.constat) || '';
        const risqueVal = (obs && obs.risque) || '';
        const actionVal = (obs && obs.action) || '';
        const responsableVal = (obs && obs.responsable) || '';
        const delaiVal = (obs && obs.delai) || '';

        obsCard.innerHTML = `
			<div class="item-card-header">
				<h4>👁️ Observation ${obsNumber}</h4>
				<button type="button" class="btn-remove" onclick="window.editor.removeObservation(this)">
					🗑️ Supprimer
				</button>
			</div>

			<div class="form-group">
				<label>Constat *</label>
				<textarea class="observation-constat"
						  rows="4"
						  placeholder="Décrivez l'observation..."
						  required>${this.escapeHtmlTextarea(constatVal)}</textarea>
			</div>

			<div class="observation-images-section">
				<div class="observation-images-header">
					<label>📸 Photos de l'observation</label>
					<button type="button" class="btn-add-image" onclick="window.editor.triggerObservationImageUpload(${obsNumber})">
						➕ Ajouter une photo
					</button>
					<input type="file"
						   class="observation-image-input"
						   id="observation-image-input-${obsNumber}"
						   accept="image/*,.heic,.HEIC"
						   multiple
						   style="display: none;"
						   onchange="window.editor.handleObservationImageUpload(${obsNumber}, event)">
				</div>

				<div class="observation-images-grid" id="observation-images-${obsNumber}">
					${this.renderObservationImages(obsImages, obsNumber)}
				</div>
			</div>

			<div class="form-group">
				<label>Risque associé</label>
				<textarea class="observation-risque"
						  rows="3"
						  placeholder="Décrivez le risque potentiel...">${this.escapeHtmlTextarea(risqueVal)}</textarea>
			</div>

			<div class="form-group">
				<label>Action</label>
				<input type="text"
					   class="observation-action"
					   value="${this.escapeHtmlInput(actionVal)}"
					   placeholder="Action à mettre en place">
			</div>

			<div class="form-grid">
				<div class="form-group">
					<label>Responsable</label>
					<input type="text"
						   class="observation-responsable"
						   value="${this.escapeHtmlInput(responsableVal)}"
						   placeholder="Nom du responsable">
				</div>
				<div class="form-group">
					<label>Délai</label>
					<input type="text"
						   class="observation-delai"
						   value="${this.escapeHtmlInput(delaiVal)}"
						   placeholder="Ex: 31/12/2024">
				</div>
			</div>
		`;

        this.observationsContainer.appendChild(obsCard);

        console.log(`➕ Observation ${obsNumber} ajoutée avec ${obsImages.length} image(s)`);
    }

    /**
     * Récupère les images associées à une observation
     */
    getImagesForObservation(observationNumber) {
        if (!this.currentData || !this.currentData.images) return [];

        return this.currentData.images.filter(img => img.observationNumber === observationNumber);
    }

    /**
     * Rend le HTML des images d'une observation
     */
    renderObservationImages(images, observationNumber) {
        if (!images || images.length === 0) return '';

        return images.map((img) => {
            const sizeKB = img.size
                ? (img.size / 1024).toFixed(1)
                : ((img.base64.length * 3 / 4) / 1024).toFixed(1);

            return `
                <div class="observation-image-item" data-image-id="${this.escapeHtmlInput(img.id)}">
                    <img src="${this.escapeHtmlInput(img.base64)}" 
                         alt="${this.escapeHtmlInput(img.alt || 'Image')}" 
                         class="observation-image-preview"
                         onclick="window.editor.openImageLightbox(this.src)">
                    
                    <input type="text" 
                           class="observation-image-caption" 
                           placeholder="Légende..."
                           value="${this.escapeHtmlInput(img.alt || img.caption || '')}"
                           onchange="window.editor.updateImageCaption(this.closest('[data-image-id]').dataset.imageId, this.value)">
                    
                    <button type="button" 
                            class="observation-image-delete" 
                            onclick="window.editor.removeObservationImage(${observationNumber}, this.closest('[data-image-id]').dataset.imageId)">
                        🗑️ Supprimer
                    </button>
                    
                    <div class="observation-image-size">📊 ${sizeKB} KB</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Déclenche l'upload d'image pour une observation
     */
    triggerObservationImageUpload(observationNumber) {
        const input = document.getElementById(`observation-image-input-${observationNumber}`);
        if (input) {
            input.click();
        }
    }

    /**
     * ✅ HEIC : Gère l'upload d'images pour une observation spécifique (AVEC CONVERSION HEIC)
     */
    async handleObservationImageUpload(observationNumber, event) {
        const files = event.target.files;

        if (!files || files.length === 0) return;

        console.log(`📤 Upload de ${files.length} image(s) pour l'observation ${observationNumber}...`);

        // Initialiser images si besoin
        if (!this.currentData.images) {
            this.currentData.images = [];
        }

        for (let file of files) {
            try {
                // ✅ HEIC : Conversion automatique si nécessaire
                const processedFile = await this.convertHeicIfNeeded(file);

                // Redimensionnée + recompressée (une photo de 4 Mo passe à ~300 Ko)
                const compressed = await ImageCompressor.compressFile(processedFile);

                const imageData = {
                    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    base64: compressed.base64,
                    alt: file.name.replace(/\.[^/.]+$/, ''),
                    contentType: compressed.contentType,
                    size: compressed.size,
                    observationNumber: observationNumber,
                    caption: ''
                };

                this.currentData.images.push(imageData);

                console.log(`✅ Image ajoutée à l'observation ${observationNumber}: ${file.name}`);

            } catch (error) {
                console.error(`❌ Erreur upload ${file.name}:`, error);
                alert(`❌ Erreur lors du traitement de ${file.name}:\n${error.message}`);
            }
        }

        // Rafraîchir l'affichage des images pour cette observation
        this.refreshObservationImages(observationNumber);

        // Reset input
        event.target.value = '';
    }

    /**
     * Rafraîchit l'affichage des images d'une observation
     */
    refreshObservationImages(observationNumber) {
        const container = document.getElementById(`observation-images-${observationNumber}`);
        if (!container) return;

        const images = this.getImagesForObservation(observationNumber);
        container.innerHTML = this.renderObservationImages(images, observationNumber);

        console.log(`🔄 Images de l'observation ${observationNumber} rafraîchies: ${images.length} image(s)`);
    }

    /**
     * Supprime une image d'une observation
     */
    removeObservationImage(observationNumber, imageId) {
        if (!confirm('⚠️ Supprimer cette image ?')) return;

        const index = this.findImageIndexById(imageId);
        if (index !== -1) {
            this.currentData.images.splice(index, 1);
            this.refreshObservationImages(observationNumber);
        }
    }

    /**
     * Supprime une observation (gérer aussi les images)
     */
    removeObservation(button) {
        if (!confirm('⚠️ Supprimer cette observation et ses images associées ?')) return;

        const obsCard = button.closest('.observation-card');
        const obsNumber = parseInt(obsCard.dataset.observationId);

        console.log(`🗑️ Suppression observation ${obsNumber}`);

        // Supprimer les images associées
        if (this.currentData && this.currentData.images) {
            this.currentData.images = this.currentData.images.filter(
                img => img.observationNumber !== obsNumber
            );
            console.log(`  ✅ Images de l'observation ${obsNumber} supprimées`);
        }

        // Supprimer la carte
        obsCard.remove();

        // Réindexer les observations restantes
        this.reindexObservations();
    }

    /**
     * Réindexe les observations après suppression
     */
    reindexObservations() {
        const obsCards = this.observationsContainer.querySelectorAll('.observation-card');

        obsCards.forEach((card, index) => {
            const newNumber = index + 1;
            const oldNumber = parseInt(card.dataset.observationId);

            // Mettre à jour le data-attribute
            card.dataset.observationId = newNumber;

            // Mettre à jour le titre
            const title = card.querySelector('h4');
            if (title) {
                title.textContent = `👁️ Observation ${newNumber}`;
            }

            // Mettre à jour les numéros d'observation dans les images
            if (this.currentData && this.currentData.images) {
                this.currentData.images.forEach(img => {
                    if (img.observationNumber === oldNumber) {
                        img.observationNumber = newNumber;
                    }
                });
            }

            // Mettre à jour les IDs et onclick
            const imageInput = card.querySelector('.observation-image-input');
            if (imageInput) {
                imageInput.id = `observation-image-input-${newNumber}`;
                imageInput.setAttribute('onchange', `window.editor.handleObservationImageUpload(${newNumber}, event)`);
            }

            const addBtn = card.querySelector('.btn-add-image');
            if (addBtn) {
                addBtn.setAttribute('onclick', `window.editor.triggerObservationImageUpload(${newNumber})`);
            }

            const imagesGrid = card.querySelector('.observation-images-grid');
            if (imagesGrid) {
                imagesGrid.id = `observation-images-${newNumber}`;
                this.refreshObservationImages(newNumber);
            }
        });

        this.observationCounter = obsCards.length;
        console.log(`🔄 Observations réindexées: ${this.observationCounter} observation(s)`);
    }

    /**
     * Collecte les données du formulaire
     */
    collectFormData() {
        console.log('📊 Collecte des données du formulaire...');

        const data = {
            metadata: {
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
            this.currentData = null;

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
                this.form.style.display = 'block';

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
     * Récupère les images associées à un écart
     */
    getImagesForEcart(ecartNumber) {
        if (!this.currentData || !this.currentData.images) return [];

        return this.currentData.images.filter(img => img.ecartNumber === ecartNumber);
    }

    /**
     * Rend le HTML des images d'un écart
     */
    renderEcartImages(images, ecartNumber) {
        if (!images || images.length === 0) return '';

        return images.map((img) => {
            const sizeKB = img.size
                ? (img.size / 1024).toFixed(1)
                : ((img.base64.length * 3 / 4) / 1024).toFixed(1);

            return `
                <div class="ecart-image-item" data-image-id="${this.escapeHtmlInput(img.id)}">
                    <img src="${this.escapeHtmlInput(img.base64)}" 
                         alt="${this.escapeHtmlInput(img.alt || 'Image')}" 
                         class="ecart-image-preview"
                         onclick="window.editor.openImageLightbox(this.src)">
                    
                    <input type="text" 
                           class="ecart-image-caption" 
                           placeholder="Légende..."
                           value="${this.escapeHtmlInput(img.alt || img.caption || '')}"
                           onchange="window.editor.updateImageCaption(this.closest('[data-image-id]').dataset.imageId, this.value)">
                    
                    <button type="button" 
                            class="ecart-image-delete" 
                            onclick="window.editor.removeEcartImage(${ecartNumber}, this.closest('[data-image-id]').dataset.imageId)">
                        🗑️ Supprimer
                    </button>
                    
                    <div class="ecart-image-size">📊 ${sizeKB} KB</div>
                </div>
            `;
        }).join('');
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
     * Déclenche l'upload d'image pour un écart
     */
    triggerImageUpload(ecartNumber) {
        const input = document.getElementById(`ecart-image-input-${ecartNumber}`);
        if (input) {
            input.click();
        }
    }

    /**
     * ✅ HEIC : Gère l'upload d'images pour un écart spécifique (AVEC CONVERSION HEIC)
     */
    async handleEcartImageUpload(ecartNumber, event) {
        const files = event.target.files;

        if (!files || files.length === 0) return;

        console.log(`📤 Upload de ${files.length} image(s) pour l'écart ${ecartNumber}...`);

        // Initialiser images si besoin
        if (!this.currentData.images) {
            this.currentData.images = [];
        }

        for (let file of files) {
            try {
                // ✅ HEIC : Conversion automatique si nécessaire
                const processedFile = await this.convertHeicIfNeeded(file);

                // Redimensionnée + recompressée (une photo de 4 Mo passe à ~300 Ko)
                const compressed = await ImageCompressor.compressFile(processedFile);

                const imageData = {
                    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    base64: compressed.base64,
                    alt: file.name.replace(/\.[^/.]+$/, ''),
                    contentType: compressed.contentType,
                    size: compressed.size,
                    ecartNumber: ecartNumber,
                    caption: ''
                };

                this.currentData.images.push(imageData);

                console.log(`✅ Image ajoutée à l'écart ${ecartNumber}: ${file.name}`);

            } catch (error) {
                console.error(`❌ Erreur upload ${file.name}:`, error);
                alert(`❌ Erreur lors du traitement de ${file.name}:\n${error.message}`);
            }
        }

        // Rafraîchir l'affichage des images pour cet écart
        this.refreshEcartImages(ecartNumber);

        // Reset input
        event.target.value = '';
    }

    /**
     * Rafraîchit l'affichage des images d'un écart
     */
    refreshEcartImages(ecartNumber) {
        const container = document.getElementById(`ecart-images-${ecartNumber}`);
        if (!container) return;

        const images = this.getImagesForEcart(ecartNumber);
        container.innerHTML = this.renderEcartImages(images, ecartNumber);

        console.log(`🔄 Images de l'écart ${ecartNumber} rafraîchies: ${images.length} image(s)`);
    }

    /**
     * Supprime une image d'un écart
     */
    removeEcartImage(ecartNumber, imageId) {
        if (!confirm('⚠️ Supprimer cette image ?')) return;

        const index = this.findImageIndexById(imageId);
        if (index !== -1) {
            this.currentData.images.splice(index, 1);
            this.refreshEcartImages(ecartNumber);
        }
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
            lightbox.innerHTML = `
                <div class="image-lightbox-content">
                    <button class="image-lightbox-close" onclick="document.getElementById('imageLightbox').classList.remove('active')">
                        ✕
                    </button>
                    <img src="" alt="Preview" class="image-lightbox-img">
                </div>
            `;
            document.body.appendChild(lightbox);

            // Fermeture au clic sur le fond
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    lightbox.classList.remove('active');
                }
            });

            // Fermeture avec la touche Échap
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                    lightbox.classList.remove('active');
                }
            });

            // Enregistré une seule fois (avant : un listener de plus à chaque ouverture)
            lightbox.addEventListener('transitionend', (e) => {
                if (e.propertyName === 'opacity' && !lightbox.classList.contains('active')) {
                    document.body.style.overflow = '';
                }
            });
        }

        const img = lightbox.querySelector('.image-lightbox-img');

        const preloadImg = new Image();
        preloadImg.onload = function () {
            img.src = base64;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            });
        };
        preloadImg.src = base64;
    }

    /**
     * Supprime un écart (gérer aussi les images)
     */
    removeEcart(button) {
        if (!confirm('⚠️ Supprimer cet écart et ses images associées ?')) return;

        const ecartCard = button.closest('.ecart-card');
        const ecartNumber = parseInt(ecartCard.dataset.ecartId);

        console.log(`🗑️ Suppression écart ${ecartNumber}`);

        // Supprimer les images associées
        if (this.currentData && this.currentData.images) {
            this.currentData.images = this.currentData.images.filter(
                img => img.ecartNumber !== ecartNumber
            );
            console.log(`  ✅ Images de l'écart ${ecartNumber} supprimées`);
        }

        // Supprimer la carte
        ecartCard.remove();

        // Réindexer les écarts restants
        this.reindexEcarts();
    }

    /**
     * Réindexe les écarts après suppression
     */
    reindexEcarts() {
        const ecartCards = this.ecartsContainer.querySelectorAll('.ecart-card');

        ecartCards.forEach((card, index) => {
            const newNumber = index + 1;
            const oldNumber = parseInt(card.dataset.ecartId);

            // Mettre à jour le data-attribute
            card.dataset.ecartId = newNumber;

            // Mettre à jour le titre
            const title = card.querySelector('h4');
            if (title) {
                title.textContent = `⚠️ Écart ${newNumber}`;
            }

            // Mettre à jour les numéros d'écart dans les images
            if (this.currentData && this.currentData.images) {
                this.currentData.images.forEach(img => {
                    if (img.ecartNumber === oldNumber) {
                        img.ecartNumber = newNumber;
                    }
                });
            }

            // Mettre à jour les IDs et onclick
            const imageInput = card.querySelector('.ecart-image-input');
            if (imageInput) {
                imageInput.id = `ecart-image-input-${newNumber}`;
                imageInput.setAttribute('onchange', `window.editor.handleEcartImageUpload(${newNumber}, event)`);
            }

            const addBtn = card.querySelector('.btn-add-image');
            if (addBtn) {
                addBtn.setAttribute('onclick', `window.editor.triggerImageUpload(${newNumber})`);
            }

            const imagesGrid = card.querySelector('.ecart-images-grid');
            if (imagesGrid) {
                imagesGrid.id = `ecart-images-${newNumber}`;
                this.refreshEcartImages(newNumber);
            }
        });

        this.ecartCounter = ecartCards.length;
        console.log(`🔄 Écarts réindexés: ${this.ecartCounter} écart(s)`);
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
        this.showPasteHint();
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
        alert('❌ Aucun rapport en cours. Créez ou chargez un rapport d\'abord.');
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
        alert(`❌ Impossible de coller l'image : ${error.message}`);
    }
}

/**
 * Feedback visuel — flash vert sur la zone image
 */
showPasteSuccess(type, number) {
    let gridId;
    if (type === 'ecart')       gridId = `ecart-images-${number}`;
    if (type === 'observation') gridId = `observation-images-${number}`;
    if (type === 'pointfort')   gridId = `pointfort-images-${number}`;

    const grid = document.getElementById(gridId);
    if (!grid) return;

    const section = grid.closest(
        '.ecart-images-section, .observation-images-section, .ecart-images-section'
    );
    const target = section || grid;

    target.classList.add('paste-success');
    setTimeout(() => target.classList.remove('paste-success'), 800);
}

/**
 * Toast d'aide si Ctrl+V est pressé hors zone image
 */
showPasteHint() {
    // Eviter les doublons
    if (document.getElementById('paste-hint-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'paste-hint-toast';
    toast.className = 'paste-hint-toast';
    toast.textContent = '💡 Cliquez dans un écart ou une observation, puis Ctrl+V';
    document.body.appendChild(toast);

    // Entrée
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Sortie
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

}

// Initialiser l'éditeur au chargement
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de l\'éditeur...');
    window.editor = new AuditEditor();
    console.log('✅ Éditeur initialisé');
});
