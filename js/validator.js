/**
 * Validateur de données JSON d'audit
 */

class AuditValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Valide les données d'audit
     */
    validate(data) {
        this.errors = [];
        this.warnings = [];

        // Valider les métadonnées
        this.validateMetadata(data.metadata);

        // ✅ Valider points forts (optionnel)
        this.validatePointsForts(data.pointsForts);

        // Valider les écarts
        this.validateEcarts(data.ecarts);

        // Valider les observations
        this.validateObservations(data.observations);

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    /**
     * Valide les métadonnées
     */
    validateMetadata(metadata = {}) {
        // String() : un JSON peut contenir "auditNumber": 2024 (nombre) -> .trim() plantait
        const isBlank = (value) => String(value ?? '').trim() === '';

        // Champs obligatoires
        const requiredFields = ['auditNumber', 'team', 'period', 'reportDate'];

        for (const field of requiredFields) {
            if (isBlank(metadata[field])) {
                this.errors.push(`Métadonnée manquante: ${field}`);
            }
        }

        // Champs recommandés
        const recommendedFields = ['objective', 'perimeter'];

        for (const field of recommendedFields) {
            if (isBlank(metadata[field])) {
                this.warnings.push(`Métadonnée recommandée manquante: ${field}`);
            }
        }

        // Valider le format de la date
        if (metadata.reportDate) {
            const datePattern = /\d{2}\.\d{2}\.\d{4}/;
            if (!datePattern.test(String(metadata.reportDate))) {
                this.warnings.push(`Format de date inhabituel: ${metadata.reportDate}`);
            }
        }
    }

    /**
     * ✅ Valide les points forts
     */
    validatePointsForts(pointsForts) {
        if (pointsForts === undefined) return;

        if (!Array.isArray(pointsForts)) {
            this.errors.push('Les pointsForts doivent être un tableau');
            return;
        }

        pointsForts.forEach((pf, index) => {
            if (!pf.titre || pf.titre.trim() === '') {
                this.warnings.push(`Point fort ${index + 1}: Titre manquant`);
            }
            if (!pf.constat || pf.constat.trim() === '') {
                this.warnings.push(`Point fort ${index + 1}: Constat manquant`);
            }
        });
    }

    /**
     * Valide les écarts
     */
    validateEcarts(ecarts) {
        if (!Array.isArray(ecarts)) {
            this.errors.push('Les écarts doivent être un tableau');
            return;
        }

        ecarts.forEach((ecart, index) => {
            if (!ecart.exigence || ecart.exigence.trim() === '') {
                this.warnings.push(`Écart ${index + 1}: Exigence manquante`);
            }

            if (!ecart.constat || ecart.constat.trim() === '') {
                this.warnings.push(`Écart ${index + 1}: Constat manquant`);
            }
        });
    }

    /**
     * Valide les observations
     */
    validateObservations(observations) {
        if (!Array.isArray(observations)) {
            this.errors.push('Les observations doivent être un tableau');
            return;
        }

        observations.forEach((obs, index) => {
            if (!obs.constat || obs.constat.trim() === '') {
                this.warnings.push(`Observation ${index + 1}: Constat manquant`);
            }
        });
    }

    /**
     * Retourne un rapport de validation formaté
     */
    getReport() {
        let report = '';

        if (this.errors.length > 0) {
            report += '❌ ERREURS:\n';
            this.errors.forEach(err => {
                report += `  • ${err}\n`;
            });
            report += '\n';
        }

        if (this.warnings.length > 0) {
            report += '⚠️ AVERTISSEMENTS:\n';
            this.warnings.forEach(warn => {
                report += `  • ${warn}\n`;
            });
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            report = '✅ Toutes les validations sont passées avec succès!';
        }

        return report;
    }
}

// Export pour utilisation
window.AuditValidator = AuditValidator;
