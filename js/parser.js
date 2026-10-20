/**
 * Parser de fichiers Word d'audit vers JSON - VERSION AVEC IMAGES
 * Extrait le texte, les données structurées ET les images en Base64
 */

class AuditParser {
    constructor() {
        this.reset();
    }

    /**
     * Réinitialise l'état (appelé à chaque nouveau fichier : évite de
     * partager l'objet résultat entre deux imports)
     */
    reset() {
        this.sections = {
            metadata: {},
            summary: {},
            ecarts: [],
            observations: [],
            remarques: {
                audites: [],
                reunion: []
            },
            auditedPersons: [],
            distribution: [],
            images: []  // ✅ Stockage des images
        };
    }

    /**
     * Parse un fichier Word et extrait toutes les données + images
     */
    async parseWordFile(file) {
        try {
            this.reset();
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            console.log('🔄 DÉBUT DU PARSING (avec extraction d\'images)');
            console.log('📦 Taille du fichier:', this.formatBytes(arrayBuffer.byteLength));
            
            // ✅ ÉTAPE 1 : Convertir en HTML avec Mammoth (images incluses automatiquement)
            console.log('🔍 Conversion Word → HTML avec Mammoth...');
            
            const resultHtml = await mammoth.convertToHtml({ 
                arrayBuffer,
                // Mammoth va automatiquement convertir les images en Base64 dans le HTML
                convertImage: mammoth.images.imgElement(function(image) {
                    return image.read("base64").then(function(imageBuffer) {
                        return {
                            src: "data:" + image.contentType + ";base64," + imageBuffer
                        };
                    });
                })
            });
            
            const html = resultHtml.value;
            console.log('📄 HTML généré (longueur:', html.length, ')');
            
            // ✅ ÉTAPE 2 : Extraire le texte brut
            const resultText = await mammoth.extractRawText({ arrayBuffer });
            const rawText = resultText.value;
            
            console.log('📄 TEXTE BRUT (500 premiers caractères):');
            console.log(rawText.substring(0, 500));
            
            // ✅ ÉTAPE 3 : Extraire les images depuis le HTML
            await this.extractImages(html);
            
            // ✅ ÉTAPE 4 : Convertir HTML en texte structuré pour les référentiels
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const structuredText = this.htmlToStructuredText(tempDiv);
            
            // ✅ ÉTAPE 5 : Parser le texte
            this.parseText(rawText, structuredText);
            
            console.log('✅ PARSING TERMINÉ');
            console.log('📊 RÉSULTAT FINAL:', this.sections);
            
            return this.sections;
            
        } catch (error) {
            console.error('❌ Erreur lors du parsing:', error);
            throw new Error(`Impossible de lire le fichier: ${error.message}`);
        }
    }

    /**
     * Extrait les images depuis le HTML généré par Mammoth
     */
    async extractImages(html) {
        console.log('  🖼️ EXTRACTION DES IMAGES');
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const allImages = tempDiv.querySelectorAll('img');
        console.log(`    📊 ${allImages.length} image(s) trouvée(s) dans le HTML`);
        
        if (allImages.length === 0) {
            console.log('    ℹ️ Aucune image à extraire');
            this.sections.images = [];
            return;
        }
        
        // Réinitialiser les images
        this.sections.images = [];
        
        // Stratégie : Parcourir le HTML de manière séquentielle
        // et associer chaque image au dernier "Écart X" rencontré
        let currentEcartNumber = null;
        let currentObservationNumber = null;
        let imageCounter = 0;
        // Dédoublonnage sur la data URL complète : comparer les 100 premiers
        // caractères confondait des photos distinctes (même en-tête EXIF/PNG)
        const seenSources = new Set();
        
        // Parcourir tous les éléments
        const allElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div');
        
        console.log(`    📄 Analyse de ${allElements.length} éléments`);
        
        allElements.forEach((element, index) => {
            const text = element.textContent.trim();
            
            // Détecter un nouvel écart
            const ecartMatch = text.match(/^[ÉE]cart\s+(\d+)/i);
            if (ecartMatch) {
                currentEcartNumber = parseInt(ecartMatch[1], 10);
                currentObservationNumber = null;
                console.log(`    📍 Écart ${currentEcartNumber} détecté à l'élément ${index}`);
            }

            // Détecter une observation : les photos suivantes ne doivent plus
            // être rattachées au dernier écart rencontré
            const obsMatch = text.match(/^Observation\s+(\d+)/i);
            if (obsMatch) {
                currentObservationNumber = parseInt(obsMatch[1], 10);
                currentEcartNumber = null;
            }
            
            // Chercher les images dans cet élément et ses enfants
            const imgsInElement = element.querySelectorAll('img');
            
            if (imgsInElement.length > 0) {
                imgsInElement.forEach((img) => {
                    // Un <img> imbriqué est vu par chaque parent (p, div...) : doublon exact
                    const alreadyAdded = seenSources.has(img.src);

                    if (!alreadyAdded && img.src.startsWith('data:image')) {
                        seenSources.add(img.src);
                        const caption = this.findImageCaption(element, allElements, index);
                        
                        const imageData = {
                            id: `img-${imageCounter + 1}`,
                            base64: img.src,
                            alt: img.alt || caption || `Image ${imageCounter + 1}`,
                            contentType: this.extractMimeTypeFromDataUrl(img.src),
                            ecartNumber: currentEcartNumber,
                            observationNumber: currentObservationNumber,
                            caption: caption,
                            size: Math.round((img.src.length * 3) / 4) // Estimation de la taille
                        };
                        
                        this.sections.images.push(imageData);
                        
                        console.log(`    ✅ Image ${imageCounter + 1} ajoutée`, 
                                    currentEcartNumber ? `(Écart ${currentEcartNumber})` : '(Général)',
                                    caption ? `- Légende: "${caption.substring(0, 40)}..."` : '');
                        imageCounter++;
                    } else if (alreadyAdded) {
                        console.log(`    ⏭️ Image ignorée (doublon)`);
                    }
                });
            }
        });
        
        console.log(`    📊 TOTAL: ${this.sections.images.length} image(s) extraite(s)`);
        
        // Grouper les images par écart pour faciliter l'affichage
        const imagesByEcart = {};
        this.sections.images.forEach(img => {
            const key = img.ecartNumber || 'general';
            if (!imagesByEcart[key]) imagesByEcart[key] = [];
            imagesByEcart[key].push(img);
        });
        
        console.log('    📊 Répartition par écart:');
        Object.keys(imagesByEcart).forEach(key => {
            console.log(`      ${key}: ${imagesByEcart[key].length} image(s)`);
        });
    }

    /**
     * Trouve la légende d'une image
     */
    findImageCaption(currentElement, allElements, currentIndex) {
        // Chercher une légende dans l'élément suivant
        if (currentIndex + 1 < allElements.length) {
            const nextElement = allElements[currentIndex + 1];
            const nextText = nextElement.textContent.trim();
            
            // Si le texte suivant est court et ne commence pas par un mot-clé
            if (nextText.length > 0 && nextText.length < 200 && 
                !nextText.match(/^([ÉE]cart|Observation|Constat|Risque|Exigence|Action|Responsable|Délai|Plan)/i)) {
                return nextText;
            }
        }
        
        // Sinon, chercher dans l'élément actuel
        const currentText = currentElement.textContent.trim();
        const imgElement = currentElement.querySelector('img');
        
        if (imgElement) {
            // Enlever le src de l'image du texte pour obtenir juste la légende
            const textWithoutImg = currentText.replace(/data:image[^"]*/, '').trim();
            if (textWithoutImg.length > 0 && textWithoutImg.length < 200) {
                return textWithoutImg;
            }
        }
        
        return '';
    }

    /**
     * Extrait le MIME type depuis une data URL
     */
    extractMimeTypeFromDataUrl(dataUrl) {
        const match = dataUrl.match(/^data:([^;]+);/);
        return match ? match[1] : 'image/png';
    }

    /**
     * Formate la taille en octets de manière lisible
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Convertit le HTML en lignes structurées
     */
    htmlToStructuredText(div) {
        const lines = [];
        const paragraphs = div.querySelectorAll('p, li');
        
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            if (text) {
                lines.push(text);
            }
        });
        
        return lines;
    }

    /**
     * Lit un fichier comme ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parse le texte extrait
     */
    parseText(text, structuredLines) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        console.log('📋 PARSING DU TEXTE...');
        console.log('  Lignes texte brut:', lines.length);
        console.log('  Lignes structurées:', structuredLines.length);

        this.extractMetadata(text, lines, structuredLines);
        this.extractEcarts(text);
        this.extractObservations(text);
        this.extractRemarques(text);
        this.extractAuditedPersons(text);
        this.extractDistribution(text);
        this.calculateSummary();
        
        console.log('✅ EXTRACTION TEXTUELLE TERMINÉE');
    }

    /**
     * Extrait les métadonnées du rapport
     */
    extractMetadata(text, lines, structuredLines) {
        const metadata = {};

        console.log('🏷️ EXTRACTION MÉTADONNÉES');

        // AUDIT N°
        const auditNumberMatch = text.match(/AUDIT\s+N[°]?\s*:\s*([^\s\/\n]+)/i);
        if (auditNumberMatch) {
            metadata.auditNumber = auditNumberMatch[1].trim();
            console.log('  ✅ Audit N°:', metadata.auditNumber);
        }

        // Titre
        const titleMatch = text.match(/AUDIT\s+N[°]?\s*:\s*[^\s\/]+\s*\/\s*([^\n]+?)(?=\s*ÉQUIPE|\s*EQUIPE|$)/is);
        if (titleMatch) {
            metadata.title = titleMatch[1].trim();
            console.log('  ✅ Titre:', metadata.title);
        }

        // ÉQUIPE
        const teamMatch = text.match(/[ÉE]QUIPE\s*:\s*([^\n]+)/i);
        if (teamMatch) {
            metadata.team = teamMatch[1].trim();
            console.log('  ✅ Équipe:', metadata.team);
        }

        // PÉRIODE
        const periodMatch = text.match(/P[ÉE]RIODE\s*:\s*([^\s]+)/i);
        if (periodMatch) {
            metadata.period = periodMatch[1].trim();
            console.log('  ✅ Période:', metadata.period);
        }

        // RAPPORT ÉTABLI LE
        const reportDateMatch = text.match(/RAPPORT\s+[ÉE]TABLI\s+LE\s*:\s*([^\n]+)/i);
        if (reportDateMatch) {
            metadata.reportDate = reportDateMatch[1].trim();
            console.log('  ✅ Rapport établi le:', metadata.reportDate);
        }

        // OBJECTIF
        const objectifMatch = text.match(/OBJECTIF\s*:\s*([^\n]+(?:\n(?!P[ÉE]RIM[ÈE]TRE|R[ÉE]F[ÉE]RENTIEL)[^\n]+)*)/i);
        if (objectifMatch) {
            metadata.objective = objectifMatch[1].trim().replace(/\s+/g, ' ');
            console.log('  ✅ Objectif:', metadata.objective.substring(0, 100) + '...');
        }

        // PÉRIMÈTRE
        const perimeterMatch = text.match(/P[ÉE]RIM[ÈE]TRE\s*:\s*([^\n]+)/i);
        if (perimeterMatch) {
            metadata.perimeter = perimeterMatch[1].trim();
            console.log('  ✅ Périmètre:', metadata.perimeter);
        }

        // RÉFÉRENTIELS - Extraction améliorée
        console.log('  🔍 EXTRACTION RÉFÉRENTIELS');
        metadata.referentials = [];
        
        // Stratégie 1: Extraire la zone entre PÉRIMÈTRE et CONTEXTE
        const refZoneMatch = text.match(/P[ÉE]RIM[ÈE]TRE[^\n]*\n([\s\S]*?)CONTEXTE/i);
        
        if (refZoneMatch) {
            const refZone = refZoneMatch[1];
            console.log('    📄 Zone référentiels trouvée (longueur:', refZone.length, ')');
            
            // Pattern pour codes INS-XXXX, PRO-XXXX, etc.
            // Flag m : sans lui, $ = fin de texte et le dernier code avant une
            // ligne non codifiée (ex. DOCUMENTATION TECHNIQUE) était perdu
            const refPattern = /([A-Z]{3}-\d{4}\s+[^\n]*?)(?=\s*[A-Z]{3}-\d{4}|$)/gm;
            const matches = refZone.matchAll(refPattern);
            
            for (const match of matches) {
                let ref = match[1].trim().replace(/\s+/g, ' ');
                
                if (ref.length >= 15) {
                    metadata.referentials.push(ref);
                    console.log(`    ✅ Ajouté: "${ref}"`);
                }
            }
            
            // Chercher aussi "DOCUMENTATION TECHNIQUE"
            if (refZone.match(/DOCUMENTATION\s+TECHNIQUE/i)) {
                const docTech = refZone.match(/DOCUMENTATION\s+TECHNIQUE/i)[0];
                if (!metadata.referentials.includes(docTech)) {
                    metadata.referentials.push(docTech);
                    console.log(`    ✅ Ajouté: "${docTech}"`);
                }
            }
            
        } else {
            console.log('    ⚠️ Zone PÉRIMÈTRE...CONTEXTE non trouvée, tentative Plan B');
            
            // PLAN B: Chercher section RÉFÉRENTIEL
            const refHeaderMatch = text.match(/R[ÉE]F[ÉE]RENTIEL[^:]*:\s*([\s\S]*?)(?=CONTEXTE|$)/i);
            
            if (refHeaderMatch) {
                const refContent = refHeaderMatch[1];
                console.log('    🆘 Plan B: Section RÉFÉRENTIEL trouvée');
                
                const refPattern = /([A-Z]{3}-\d{4}\s+[^\n]*?)(?=\s*[A-Z]{3}-\d{4}|DOCUMENTATION|CONTEXTE|$)/gm;
                const matches = refContent.matchAll(refPattern);
                
                for (const match of matches) {
                    let ref = match[1].trim().replace(/\s+/g, ' ');
                    if (ref.length >= 15 && !metadata.referentials.includes(ref)) {
                        metadata.referentials.push(ref);
                        console.log(`    ✅ Ajouté (Plan B): "${ref}"`);
                    }
                }
                
                if (refContent.match(/DOCUMENTATION\s+TECHNIQUE/i)) {
                    const docTech = refContent.match(/DOCUMENTATION\s+TECHNIQUE/i)[0];
                    if (!metadata.referentials.includes(docTech)) {
                        metadata.referentials.push(docTech);
                        console.log(`    ✅ Ajouté (Plan B): "${docTech}"`);
                    }
                }
            }
        }
        
        // PLAN C: Utiliser les lignes structurées HTML
        if (metadata.referentials.length === 0 && structuredLines) {
            console.log('    🆘 Plan C: Utilisation lignes structurées HTML');
            
            let inRefSection = false;
            
            for (let i = 0; i < structuredLines.length; i++) {
                const line = structuredLines[i];
                
                if (line.match(/R[ÉE]F[ÉE]RENTIEL/i)) {
                    inRefSection = true;
                    console.log(`    📍 Début section ligne ${i}`);
                    continue;
                }
                
                if (inRefSection && line.match(/^CONTEXTE/i)) {
                    console.log(`    📍 Fin section ligne ${i}`);
                    break;
                }
                
                if (inRefSection && line.length >= 15) {
                    if (line.match(/^(OBJECTIF|P[ÉE]RIM[ÈE]TRE|CONCLUSION|R[ÉE]F[ÉE]RENTIEL)/i)) {
                        continue;
                    }
                    
                    metadata.referentials.push(line);
                    console.log(`    ✅ Ajouté (Plan C): "${line}"`);
                }
            }
        }
        
        console.log(`  📊 Total référentiels: ${metadata.referentials.length}`);

        // CONTEXTE
        metadata.context = {
            poste: '',
            article: '',
            operation: ''
        };

        const contextMatch = text.match(/CONTEXTE\s*:\s*([^]*?)(?=CONCLUSION|[ÉE]carts|$)/i);
        if (contextMatch) {
            const contextSection = contextMatch[1];
            
            const posteMatch = contextSection.match(/Poste\s*:\s*([^\n]+)/i);
            if (posteMatch) {
                metadata.context.poste = posteMatch[1].trim();
                console.log('  ✅ Contexte Poste:', metadata.context.poste);
            }

            const articleMatch = contextSection.match(/Article\s*:\s*([^\n]+)/i);
            if (articleMatch) {
                metadata.context.article = articleMatch[1].trim();
                console.log('  ✅ Contexte Article:', metadata.context.article);
            }

            const operationMatch = contextSection.match(/Op[ée]ration\s*:\s*([^\n]+)/i);
            if (operationMatch) {
                metadata.context.operation = operationMatch[1].trim();
                console.log('  ✅ Contexte Opération:', metadata.context.operation);
            }
        }

        this.sections.metadata = metadata;
    }

    /**
     * Extrait les écarts
     */
    extractEcarts(text) {
        console.log('⚠️ EXTRACTION ÉCARTS');
        const ecarts = [];
        
        // [ÉE] : Word écrit souvent « Écart » ; /Ecart/i ne matche pas « É »
        const ecartSectionMatch = text.match(/[ÉE]carts\s*([\s\S]*?)(?=Observations|Remarque\/s des audités|$)/i);
        
        if (!ecartSectionMatch) {
            console.log('  ❌ Section Ecarts non trouvée');
            this.sections.ecarts = ecarts;
            return;
        }

        const ecartSection = ecartSectionMatch[1];
        console.log('  ✅ Section Ecarts trouvée (longueur:', ecartSection.length, ')');

        const ecartRegex = /[ÉE]cart\s+(\d+)\s+([\s\S]*?)(?=[ÉE]cart\s+\d+|$)/gi;
        let match;

        while ((match = ecartRegex.exec(ecartSection)) !== null) {
            const number = match[1];
            const content = match[2];

            const ecart = {
                number: parseInt(number),
                exigence: '',
                constat: '',
                action: '',
                responsable: '',
                delai: ''
            };

            // Exigence
            const exigenceMatch = content.match(/Exigence\s*:\s*([^\n]+)/i);
            if (exigenceMatch) ecart.exigence = exigenceMatch[1].trim();

            // Constat
            const constatMatch = content.match(/Constat\s*:\s*([\s\S]+?)(?=Action\s*:|$)/i);
            if (constatMatch) ecart.constat = constatMatch[1].trim().replace(/\s+/g, ' ');

            // Action
            const actionMatch = content.match(/Action\s*:\s*([^\n]*)/i);
            if (actionMatch) ecart.action = actionMatch[1].trim();

            // Responsable
            const responsableMatch = content.match(/Responsable\s*:\s*([^\n]*)/i);
            if (responsableMatch) ecart.responsable = responsableMatch[1].trim();

            // Délai
            const delaiMatch = content.match(/D[ée]lai\s*:\s*([^\n]*)/i);
            if (delaiMatch) ecart.delai = delaiMatch[1].trim();

            ecarts.push(ecart);
            console.log(`  ✅ Écart ${number} extrait`);
        }

        console.log(`  📊 Total: ${ecarts.length} écarts`);
        this.sections.ecarts = ecarts;
    }

    /**
     * Extrait les observations
     */
    extractObservations(text) {
        console.log('👁️ EXTRACTION OBSERVATIONS');
        const observations = [];
        
        const obsSectionMatch = text.match(/Observations\s*([\s\S]*?)(?=Remarque\/s des audités|Remarque\/s réunion|$)/i);
        
        if (!obsSectionMatch) {
            console.log('  ❌ Section Observations non trouvée');
            this.sections.observations = observations;
            return;
        }

        const obsSection = obsSectionMatch[1];
        console.log('  ✅ Section Observations trouvée');

        const obsRegex = /Observation\s+(\d+)\s+([\s\S]*?)(?=Observation\s+\d+|$)/gi;
        let match;

        while ((match = obsRegex.exec(obsSection)) !== null) {
            const number = match[1];
            const content = match[2];

            const observation = {
                number: parseInt(number),
                constat: '',
                risque: ''
            };

            const constatMatch = content.match(/Constat\s*:\s*([\s\S]+?)(?=Risque\s*:|$)/i);
            if (constatMatch) observation.constat = constatMatch[1].trim().replace(/\s+/g, ' ');

            const risqueMatch = content.match(/Risque\s*:\s*([\s\S]+?)$/i);
            if (risqueMatch) observation.risque = risqueMatch[1].trim().replace(/\s+/g, ' ');

            observations.push(observation);
            console.log(`  ✅ Observation ${number} extraite`);
        }

        console.log(`  📊 Total: ${observations.length} observations`);
        this.sections.observations = observations;
    }

    /**
     * Extrait les remarques
     */
    extractRemarques(text) {
        console.log('💬 EXTRACTION REMARQUES');
        const remarques = { audites: [], reunion: [] };

        // Remarques des audités
        const auditesMatch = text.match(/Remarque\/s des audités\s*([\s\S]*?)(?=Remarque\/s réunion de clôture|$)/i);
        if (auditesMatch) {
            const content = auditesMatch[1];
            const items = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•'))
                .map(line => line.replace(/^[\*\-•]\s*/, '').trim())
                .filter(item => item && item.length > 2);
            remarques.audites = items;
            console.log(`  ✅ Remarques audités: ${items.length}`);
        }

        // Remarques réunion
        const reunionMatch = text.match(/Remarque\/s réunion de clôture\s*([\s\S]*?)(?=Liste de diffusion du rapport|$)/i);
        if (reunionMatch) {
            const content = reunionMatch[1];
            const items = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•'))
                .map(line => line.replace(/^[\*\-•]\s*/, '').trim())
                .filter(item => item && item !== '…' && item.length > 2);
            remarques.reunion = items;
            console.log(`  ✅ Remarques réunion: ${items.length}`);
        }

        this.sections.remarques = remarques;
    }

    /**
     * Extrait les personnes auditées
     */
    extractAuditedPersons(text) {
        console.log('👥 EXTRACTION PERSONNES AUDITÉES');
        const persons = [];
        
        const personsMatch = text.match(/Personnes auditées\s*([\s\S]*?)(?=Plan d'actions|$)/i);
        if (personsMatch) {
            const content = personsMatch[1];
            const items = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || /^[A-Z]+\s+[A-Z]/.test(line))
                .map(line => line.replace(/^[\*\-•]\s*/, '').trim())
                .filter(line => line.length > 2);
            persons.push(...items);
            console.log(`  ✅ Personnes: ${persons.length}`);
        }
        
        this.sections.auditedPersons = persons;
    }

    /**
     * Extrait la liste de diffusion
     */
    extractDistribution(text) {
        console.log('📧 EXTRACTION LISTE DE DIFFUSION');
        const distribution = [];
        
        const distMatch = text.match(/Liste de diffusion du rapport\s*([\s\S]*?)(?=Personnes auditées|$)/i);
        if (distMatch) {
            const content = distMatch[1];
            const items = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.match(/^(Liste|Personnes|Plan)/i) && line.length > 2);
            distribution.push(...items);
            console.log(`  ✅ Distribution: ${distribution.length}`);
        }
        
        this.sections.distribution = distribution;
    }

    /**
     * Calcule le résumé
     */
    calculateSummary() {
        this.sections.summary = {
            ecartCount: this.sections.ecarts.length,
            observationCount: this.sections.observations.length,
            remarqueCount: this.sections.remarques.audites.length
        };
        console.log('📊 RÉSUMÉ CALCULÉ:', this.sections.summary);
    }
}

// Export global
window.AuditParser = AuditParser;
