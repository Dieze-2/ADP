/**
 * Générateur de rapport HTML
 */

class HTMLGenerator {
    constructor() {
        this.template = null;
    }

    /**
     * Génère le HTML à partir des données JSON
     */
    generate(data) {
        try {
            // Utiliser la fonction de template
            const html = generateAuditReport(data);
            return html;
        } catch (error) {
            console.error('Erreur lors de la génération HTML:', error);
            throw new Error(`Impossible de générer le HTML: ${error.message}`);
        }
    }

    /**
     * Télécharge le fichier HTML
     */
    download(html, filename) {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Prévisualise le HTML dans un iframe
     */
    preview(html, iframeElement) {
        if (!iframeElement) {
            throw new Error('Element iframe non trouvé');
        }
        
        // Injecter le HTML dans l'iframe
        iframeElement.srcdoc = html;
    }
}

// Export
window.HTMLGenerator = HTMLGenerator;
