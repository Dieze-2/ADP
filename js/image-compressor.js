/**
 * Compression des images (photos d'audit)
 * - Redimensionne au plus MAX_DIMENSION px sur le grand côté
 * - Ré-encode en JPEG (PNG conservé si l'image a de la transparence)
 * - Garde l'original si la compression ne fait rien gagner
 * Tout se fait dans le navigateur (canvas), sans serveur.
 */

const ImageCompressor = {
    MAX_DIMENSION: 1600,           // largeur suffisante pour un écran 1080p / une page A4
    JPEG_QUALITY: 0.8,             // pas de différence visible à l'écran, ~5-10x plus léger
    MIN_BYTES_TO_PROCESS: 150 * 1024, // en dessous, et déjà assez petite : on ne touche pas
    // Captures d'écran (PNG légers) : conservées sans perte, sinon le texte
    // devient flou (réduction + artefacts JPEG)
    PNG_KEEP_MAX_BYTES: 500 * 1024,
    PNG_KEEP_MAX_DIMENSION: 2560,

    /**
     * Taille réelle (octets) d'une data URL base64
     */
    dataUrlBytes(dataUrl) {
        const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
        const padding = b64.endsWith('==') ? 2 : (b64.endsWith('=') ? 1 : 0);
        return Math.floor(b64.length * 3 / 4) - padding;
    },

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Image illisible'));
            img.src = src;
        });
    },

    hasTransparency(ctx, width, height) {
        const pixels = ctx.getImageData(0, 0, width, height).data;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 255) return true;
        }
        return false;
    },

    /**
     * Compresse une data URL. Retourne null si l'original doit être conservé.
     */
    async compressDataUrl(dataUrl) {
        if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null;

        const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
        // GIF (animation) et SVG (vectoriel) : la rastérisation dégraderait l'image
        if (mime === 'image/gif' || mime === 'image/svg+xml') return null;

        const originalBytes = this.dataUrlBytes(dataUrl);
        const img = await this.loadImage(dataUrl);
        const sourceWidth = img.naturalWidth;
        const sourceHeight = img.naturalHeight;
        if (!sourceWidth || !sourceHeight) return null;

        if (mime === 'image/png'
            && originalBytes < this.PNG_KEEP_MAX_BYTES
            && Math.max(sourceWidth, sourceHeight) <= this.PNG_KEEP_MAX_DIMENSION) {
            return null;
        }

        const scale = Math.min(1, this.MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
        if (scale === 1 && originalBytes < this.MIN_BYTES_TO_PROCESS) return null;

        const width = Math.round(sourceWidth * scale);
        const height = Math.round(sourceHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const transparent = mime !== 'image/jpeg' && this.hasTransparency(ctx, width, height);
        const contentType = transparent ? 'image/png' : 'image/jpeg';
        const output = transparent
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', this.JPEG_QUALITY);

        const outputBytes = this.dataUrlBytes(output);
        if (outputBytes >= originalBytes) return null;

        return { base64: output, contentType, size: outputBytes, width, height };
    },

    /**
     * Fichier (upload, collage) -> { base64, contentType, size }, compressé si utile
     */
    async compressFile(file) {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`));
            reader.readAsDataURL(file);
        });

        try {
            const compressed = await this.compressDataUrl(dataUrl);
            if (compressed) return compressed;
        } catch (error) {
            console.warn('⚠️ Compression impossible, image conservée telle quelle:', error);
        }
        return { base64: dataUrl, contentType: file.type || 'image/png', size: file.size };
    },

    /**
     * Compresse en place un tableau d'images { base64, contentType, size }.
     * Séquentiel : une seule photo décodée à la fois en mémoire.
     */
    async compressAll(images, onProgress) {
        const stats = { before: 0, after: 0, compressed: 0, total: 0 };
        if (!Array.isArray(images)) return stats;

        const list = images.filter(img => img && typeof img.base64 === 'string');
        stats.total = list.length;

        for (let i = 0; i < list.length; i++) {
            const img = list[i];
            const before = this.dataUrlBytes(img.base64);
            stats.before += before;

            try {
                const compressed = await this.compressDataUrl(img.base64);
                if (compressed) {
                    img.base64 = compressed.base64;
                    img.contentType = compressed.contentType;
                    img.size = compressed.size;
                    stats.compressed++;
                }
            } catch (error) {
                console.warn(`⚠️ Image ${img.id || i + 1} non compressée:`, error);
            }

            stats.after += this.dataUrlBytes(img.base64);
            if (onProgress) onProgress(i + 1, list.length);
            await new Promise(resolve => setTimeout(resolve, 0)); // laisse respirer l'interface
        }

        return stats;
    },

    formatBytes(bytes) {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    }
};

// Export global
window.ImageCompressor = ImageCompressor;
