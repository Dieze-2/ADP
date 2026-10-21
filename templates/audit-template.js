/**
 * Template HTML - VERSION MODIFIÉE
 * ✅ Support des délimiteurs "/" et ":" pour les titres de constats
 * ✅ Retourne null (pas de titre) si aucun délimiteur présent
 */

/**
 * Distribue les images par écart ET par observation
 */
/**
 * Distribue les images par point fort, écart ET observation
 * - Comportement fallback conservé : image non associée => Écart 1 si ecartCount > 0 sinon ignorée
 */
function distributeImages(images, pointFortCount, ecartCount, observationCount) {
    const imagesPerPointFort = [];
    const imagesPerEcart = [];
    const imagesPerObservation = [];

    for (let i = 0; i < pointFortCount; i++) imagesPerPointFort.push([]);
    for (let i = 0; i < ecartCount; i++) imagesPerEcart.push([]);
    for (let i = 0; i < observationCount; i++) imagesPerObservation.push([]);

    if (!images || images.length === 0) {
        console.log('📊 Distribution des images: aucune image à distribuer');
        return { imagesPerPointFort, imagesPerEcart, imagesPerObservation };
    }

    console.log('📊 Distribution des images:');
    console.log(`  📷 ${images.length} image(s) totales`);
    console.log(`  ✅ ${pointFortCount} point(s) fort(s)`);
    console.log(`  ⚠️ ${ecartCount} écart(s)`);
    console.log(`  👁️ ${observationCount} observation(s)`);

    images.forEach((img) => {
        // ✅ Images pour points forts
        if (img.pointFortNumber && img.pointFortNumber >= 1 && img.pointFortNumber <= pointFortCount) {
            const pfIndex = img.pointFortNumber - 1;
            imagesPerPointFort[pfIndex].push(img);
            console.log(`  Image "${img.alt}" → Point fort ${img.pointFortNumber}`);
        }
        // Images pour écarts
        else if (img.ecartNumber && img.ecartNumber >= 1 && img.ecartNumber <= ecartCount) {
            const ecartIndex = img.ecartNumber - 1;
            imagesPerEcart[ecartIndex].push(img);
            console.log(`  Image "${img.alt}" → Écart ${img.ecartNumber}`);
        }
        // Images pour observations
        else if (img.observationNumber && img.observationNumber >= 1 && img.observationNumber <= observationCount) {
            const obsIndex = img.observationNumber - 1;
            imagesPerObservation[obsIndex].push(img);
            console.log(`  Image "${img.alt}" → Observation ${img.observationNumber}`);
        }
        // Fallback (comportement original préservé)
        else {
            if (ecartCount > 0) {
                imagesPerEcart[0].push(img);
                console.log(`  Image "${img.alt}" → Aucun rattachement, ajout à Écart 1 (fallback)`);
            } else {
                console.log(`  Image "${img.alt}" → Aucun rattachement, image ignorée (pas d'écart)`);
            }
        }
    });

    console.log('📊 Résultat distribution:');
    imagesPerPointFort.forEach((imgs, idx) => console.log(`  Point fort ${idx + 1}: ${imgs.length} image(s)`));
    imagesPerEcart.forEach((imgs, idx) => console.log(`  Écart ${idx + 1}: ${imgs.length} image(s)`));
    imagesPerObservation.forEach((imgs, idx) => console.log(`  Observation ${idx + 1}: ${imgs.length} image(s)`));

    return { imagesPerPointFort, imagesPerEcart, imagesPerObservation };
}




/**
 * Fonction principale : génère le rapport HTML complet
 */
/**
 * Fonction principale : génère le rapport HTML complet
 */
function generateAuditReport(data) {
    const {
        metadata = {},
        summary = {},
        pointsForts = [],
        ecarts = [],
        observations = [],
        remarques = { audites: [], reunion: [] },
        auditedPersons = [],
        distribution = [],
        images = [],
        cloture = {}
    } = data || {};

    console.log('🎨 GÉNÉRATION HTML');
    console.log('  📷 Images disponibles:', images.length);

    const { imagesPerPointFort, imagesPerEcart, imagesPerObservation } = distributeImages(
        images,
        pointsForts.length,
        ecarts.length,
        observations.length
    );

    // 1 (info) + pointsForts + ecarts + observations + 1 (clôture)
    const totalSlides = 1 + pointsForts.length + ecarts.length + observations.length + 1;

    // ✅ Préparer une version "normalisée" minimale pour l'embarqué
    const embeddedData = normalizeAuditDataForEmbed(data);

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit ${escapeHtmlText(metadata.auditNumber || '')} – ${escapeHtmlText(metadata.title || '')}</title>
    ${getStyles()}
</head>
<body>
    ${getToolbar()}
    <!-- ✅ Données embarquées (rapport ré-importable) -->
    <script id="embedded-audit-data" type="application/json">${escapeHtmlJsonForScriptTag(embeddedData)}</script>

    <div class="deck">
        ${generateSlide1(data, totalSlides)}
        ${generatePointFortSlides(data, totalSlides, imagesPerPointFort)}
        ${generateEcartSlides(data, totalSlides, imagesPerEcart)}
        ${observations.length > 0 ? generateObservationsSlide(data, totalSlides, imagesPerObservation) : ''}
        ${generateFinalSlide(data, totalSlides)}
    </div>
    ${getNavDots(totalSlides)}
    ${getMobileNav(totalSlides)}
    ${getSlideMenu(data, totalSlides)}
    ${getLightbox()}
    ${getScripts(getPlanActionRecipients(data))}
</body>
</html>`;
}



// Export global
// window.generateAuditReport = generateAuditReport;



// ========================================
// STYLES 
// ========================================
function getStyles() {
    return `<style>
    :root {

      --bg: #f5f5f1;
      --card-bg: #ffffff;
      --accent: #006039;
      --accent-soft: rgba(0, 96, 57, 0.06);
      --accent-2: #a37e2c;
      --accent-3: #006039;
      --accent-4: #a37e2c;
      --text-main: #10241a;
      --text-muted: #64748b;
      --danger: #b91c1c;
      --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-size-multiplier: 1;
	  --bar-ecarts-gradient: linear-gradient(90deg,#b91c1c,#f97316);
	  --bar-observations-gradient: linear-gradient(90deg,#f97316,#facc15);
    }

	:root[data-theme="dark"] {
	  /* =====================================================
	     DARK THEME (palette teal + sage/green)
	     Inspiré de:
	     - Teal: #016764 #005958 #014848 #00312F #001E1E
	     - Sage: #111611 ... #ace1af
	     ===================================================== */

	  /* Surfaces */
	  --bg: #001E1E;          /* fond global */
	  --card-bg: #00312F;     /* surface carte / panneau */

	  /* Accents */
	  --accent: #016764;      /* primaire */
	  --accent-soft: rgba(1, 103, 100, 0.18);

	  --accent-2: #ace1af;    /* secondaire clair (badges/dots/reliefs) */
	  --accent-3: #9bcb9e;    /* titres/KPI (plus doux que accent pur) */
	  --accent-4: #8ab48c;    /* labels/uppercase (moins flashy) */

	  /* Texte */
	  --text-main: #eef7f6;   /* très clair, légèrement teinté */
	  --text-muted: #b7cbc7;  /* gris-vert */

	  /* Danger (moins néon, plus cohérent) */
	  --danger: #fb7185;

	  /* Dégradés KPI (cohérents teal -> green) */
	  --bar-ecarts-gradient: linear-gradient(90deg, #fb7185, #f59e0b);
	  --bar-observations-gradient: linear-gradient(90deg, #016764, #9bcb9e);
	}

    :root[data-font-size="small"] {
      --font-size-multiplier: 0.875;
    }

    :root[data-font-size="large"] {
      --font-size-multiplier: 1.125;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      margin: 0;
      font-family: var(--font);
      background: radial-gradient(circle at top left, #e2e8f0 0, #f8fafc 40%, #ffffff 100%);
      color: var(--text-main);
      scroll-behavior: smooth;
      transition: background 0.5s ease;
    }

    /* ✅ DARK: fond cohérent avec la palette (teal profond + touches sage) */
    :root[data-theme="dark"] body {
      background:
        radial-gradient(circle at 20% 10%, rgba(1, 103, 100, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 80% 80%, rgba(172, 225, 175, 0.10) 0%, transparent 55%),
        radial-gradient(circle at 50% 50%, #001E1E 0%, #001616 100%);
    }

    .deck {
      width: 100%;
      min-height: 100vh;
      padding: 20px;
      padding-bottom: 80px;
    }

    body.presentation-mode {
      overflow: hidden;
    }

    body.presentation-mode .deck {
      height: 100vh;
      overflow: hidden;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    body.presentation-mode .slide {
      display: none;
      height: calc(100vh - 40px);
      max-width: calc(100vw - 40px);
      margin: 0;
      border-radius: 18px;
      overflow-y: auto;
      padding: 24px 32px;
    }

    body.presentation-mode .slide.active-slide {
      display: flex;
      flex-direction: column;
    }

    body.presentation-mode .slide-header {
      flex-shrink: 0;
      margin-bottom: 16px;
    }

    body.presentation-mode .grid-2 {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding-right: 8px;
    }

    body.presentation-mode .grid-2::-webkit-scrollbar {
      width: 8px;
    }

    body.presentation-mode .grid-2::-webkit-scrollbar-track {
      background: rgba(148, 163, 184, 0.1);
      border-radius: 4px;
    }

    body.presentation-mode .grid-2::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.3);
      border-radius: 4px;
    }

    body.presentation-mode .grid-2::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.5);
    }

    body.presentation-mode .card {
      flex-shrink: 0;
    }

    body.presentation-mode .slide-footer {
      flex-shrink: 0;
      margin-top: 12px;
    }

    body.presentation-mode .slide-title {
      font-size: calc(1.4rem * var(--font-size-multiplier));
    }

    body.presentation-mode .slide-kicker {
      font-size: calc(0.72rem * var(--font-size-multiplier));
    }

    body.presentation-mode p,
    body.presentation-mode li {
      font-size: calc(0.9rem * var(--font-size-multiplier));
    }

    body.presentation-mode .card-title {
      font-size: calc(0.85rem * var(--font-size-multiplier));
    }

    body.presentation-mode .obs-title {
      font-size: calc(0.95rem * var(--font-size-multiplier));
    }

    body.presentation-mode .image-block img {
      max-width: 100%;
    }

    .toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
      transition: all 0.3s ease;
    }

    .toolbar-toggle {
      background: rgba(248, 250, 252, 0.95);
      backdrop-filter: blur(10px);
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
      cursor: pointer;
      font-size: calc(0.85rem * var(--font-size-multiplier));
      color: var(--text-main);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    :root[data-theme="dark"] .toolbar-toggle {
      background: rgba(0, 49, 47, 0.88);
      border-color: rgba(155, 203, 158, 0.22);
    }

    .toolbar-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.25);
    }

    .toolbar-content {
      display: none;
      margin-top: 8px;
      background: rgba(248, 250, 252, 0.95);
      backdrop-filter: blur(10px);
      padding: 8px 12px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
      gap: 8px;
      flex-direction: column;
    }

    .toolbar-content.open {
      display: flex;
    }

    :root[data-theme="dark"] .toolbar-content {
      background: rgba(0, 49, 47, 0.88);
      border-color: rgba(155, 203, 158, 0.22);
    }

    .toolbar-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .toolbar-btn {
      padding: 6px 10px;
      font-size: calc(0.75rem * var(--font-size-multiplier));
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      background: transparent;
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font);
      white-space: nowrap;
    }

    .toolbar-btn:hover {
      background: var(--accent-soft);
      border-color: var(--accent);
      transform: translateY(-1px);
    }

    .toolbar-btn.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .toolbar-separator {
      width: 100%;
      height: 1px;
      background: rgba(148, 163, 184, 0.3);
      margin: 2px 0;
    }

    .nav-dots {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999;
      display: flex;
      gap: 10px;
      padding: 10px 16px;
      background: rgba(248, 250, 252, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
    }

    body.presentation-mode .nav-dots {
      display: none !important;
    }

    :root[data-theme="dark"] .nav-dots {
      background: rgba(0, 49, 47, 0.86);
      border-color: rgba(155, 203, 158, 0.22);
    }

    .nav-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .nav-dot:hover {
      background: var(--accent-2);
      transform: scale(1.2);
    }

    .nav-dot.active {
      background: var(--accent);
      width: 24px;
    }

    .mobile-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 999;
      display: none;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: rgba(248, 250, 252, 0.98);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(148, 163, 184, 0.8);
      box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.12);
    }

    :root[data-theme="dark"] .mobile-nav {
      background: rgba(0, 49, 47, 0.92);
      border-color: rgba(155, 203, 158, 0.18);
    }

    .mobile-nav-btn {
      padding: 8px 16px;
      font-size: calc(0.85rem * var(--font-size-multiplier));
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.5);
      background: transparent;
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .mobile-nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .mobile-nav-btn:not(:disabled):active {
      transform: scale(0.95);
      background: var(--accent-soft);
    }

    .mobile-nav-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mobile-nav-counter {
      font-size: calc(0.9rem * var(--font-size-multiplier));
      font-weight: 600;
      color: var(--accent);
    }

    .mobile-note-btn {
      padding: 6px 12px;
      font-size: calc(0.8rem * var(--font-size-multiplier));
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.5);
      background: rgba(255, 255, 255, 0.9);
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.2s ease;
      display: none;
    }

    .mobile-note-btn.visible {
      display: block;
    }

    .mobile-note-btn.has-note {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    :root[data-theme="dark"] .mobile-note-btn {
      background: rgba(0, 49, 47, 0.86);
      border-color: rgba(155, 203, 158, 0.22);
    }

    .mobile-menu-btn {
      padding: 8px 12px;
      font-size: calc(1.2rem * var(--font-size-multiplier));
      border: 1px solid rgba(148, 163, 184, 0.5);
      background: rgba(255, 255, 255, 0.9);
      color: var(--text-main);
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .mobile-menu-btn:active {
      transform: scale(0.95);
      background: var(--accent-soft);
    }

    :root[data-theme="dark"] .mobile-menu-btn {
      background: rgba(0, 49, 47, 0.86);
      border-color: rgba(155, 203, 158, 0.22);
    }

    .slide-menu {
      position: fixed;
      bottom: 60px;
      right: 20px;
      z-index: 1000;
      background: rgba(248, 250, 252, 0.98);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(148, 163, 184, 0.8);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
      max-height: 60vh;
      overflow-y: auto;
      display: none;
      flex-direction: column;
      min-width: 280px;
    }

    .slide-menu.open {
      display: flex;
    }

    :root[data-theme="dark"] .slide-menu {
      background: rgba(0, 49, 47, 0.92);
      border-color: rgba(155, 203, 158, 0.20);
    }

    .slide-menu-item {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: calc(0.85rem * var(--font-size-multiplier));
    }

    .slide-menu-item:last-child {
      border-bottom: none;
    }

    .slide-menu-item:hover {
      background: var(--accent-soft);
    }

    .slide-menu-item.active {
      background: var(--accent);
      color: white;
      font-weight: 600;
    }

    .slide-menu-item-number {
      font-weight: 600;
      color: var(--accent);
      margin-right: 8px;
    }

    .slide-menu-item.active .slide-menu-item-number {
      color: white;
    }

    @media (max-width: 768px) {
      .nav-dots {
        display: none;
      }
      .mobile-nav {
        display: flex;
      }
      .toolbar {
        top: auto;
        bottom: 70px;
        right: 12px;
      }
    }

    .slide {
      max-width: 1400px;
      margin: 0 auto 22px auto;
      background: radial-gradient(circle at top left, rgba(255, 255, 255, 1), rgba(248, 250, 252, 0.96));
      border-radius: 18px;
      padding: 26px 30px 24px;
      box-shadow:
        0 20px 45px rgba(15, 23, 42, 0.08),
        0 0 0 1px rgba(148, 163, 184, 0.35);
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease;
      scroll-margin-top: 20px;
    }

    .slide.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ✅ DARK: slide sur base card-bg + ombre plus "soft" verte */
    :root[data-theme="dark"] .slide {
      background: radial-gradient(circle at top left, rgba(0, 49, 47, 0.96), rgba(0, 30, 30, 0.96));
      box-shadow:
        0 20px 45px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(1, 103, 100, 0.45);
    }

    .slide::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top right, rgba(148, 163, 184, 0.18), transparent 55%),
        radial-gradient(circle at bottom left, rgba(226, 232, 240, 0.18), transparent 55%);
      opacity: 0.85;
      pointer-events: none;
    }

    /* ✅ DARK: glow teal + sage */
    :root[data-theme="dark"] .slide::before {
      background:
        radial-gradient(circle at top right, rgba(1, 103, 100, 0.26), transparent 55%),
        radial-gradient(circle at bottom left, rgba(172, 225, 175, 0.10), transparent 55%);
      opacity: 0.9;
    }

    .note-content {
      display: none;
      margin-top: 16px;
      padding: 14px;
      background: #fef7eb;
      border-left: 3px solid var(--accent-2);
      border-radius: 4px 8px 8px 4px;
      position: relative;
      z-index: 1;
    }

    :root[data-theme="dark"] .note-content {
      background: rgba(172, 225, 175, 0.08);
      border-left-color: rgba(155, 203, 158, 0.75);
    }

    .note-content.visible {
      display: block;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .note-title {
      font-size: calc(0.9rem * var(--font-size-multiplier));
      font-weight: 600;
      color: var(--accent-3);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .note-field {
      margin-bottom: 10px;
    }

    .note-label {
      display: block;
      font-size: calc(0.75rem * var(--font-size-multiplier));
      font-weight: 600;
      color: var(--accent-4);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .note-input,
    .note-textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid rgba(148, 163, 184, 0.5);
      border-radius: 6px;
      font-family: var(--font);
      font-size: calc(0.85rem * var(--font-size-multiplier));
      background: white;
      color: var(--text-main);
      transition: all 0.2s ease;
    }

    .note-input:focus,
    .note-textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .note-textarea {
      min-height: 60px;
      resize: vertical;
    }

    :root[data-theme="dark"] .note-input,
    :root[data-theme="dark"] .note-textarea {
      background: rgba(0, 30, 30, 0.85);
      border-color: rgba(155, 203, 158, 0.22);
      color: var(--text-main);
    }

    .note-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: flex-end;
    }

    .note-save,
    .note-cancel {
      padding: 6px 16px;
      font-size: calc(0.8rem * var(--font-size-multiplier));
      border-radius: 6px;
      border: 1px solid;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .note-save {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .note-save:hover {
      background: var(--accent-3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(1, 103, 100, 0.35);
    }

    .note-cancel {
      background: transparent;
      color: var(--text-muted);
      border-color: rgba(148, 163, 184, 0.5);
    }

    .note-cancel:hover {
      background: rgba(148, 163, 184, 0.1);
    }

    .note-display {
      display: none;
      font-size: calc(0.85rem * var(--font-size-multiplier));
      line-height: 1.5;
    }

    .note-display.visible {
      display: block;
    }

    .note-display-field {
      margin-bottom: 8px;
    }

    .note-display-label {
      font-weight: 600;
      color: var(--accent-4);
    }

	.closing-notes-content,
	.closing-steps-content {
	  white-space: pre-wrap;
	  word-wrap: break-word;
	  overflow-wrap: break-word;
	}

    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }

    .slide-title {
      font-size: calc(1.7rem * var(--font-size-multiplier));
      font-weight: 650;
      letter-spacing: 0.02em;
      transition: font-size 0.3s ease;
    }

    .slide-kicker {
      font-size: calc(0.78rem * var(--font-size-multiplier));
      text-transform: uppercase;
      color: var(--accent);
      letter-spacing: 0.16em;
      margin-bottom: 4px;
      transition: font-size 0.3s ease;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--accent);
      border: 1px solid rgba(0, 0, 0, 0.05);
      font-size: calc(0.75rem * var(--font-size-multiplier));
      color: #fefce8;
      transition: all 0.2s ease;
    }

    .badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 96, 57, 0.3);
    }

    :root[data-theme="dark"] .badge {
      background: rgba(1, 103, 100, 0.25);
      border-color: rgba(155, 203, 158, 0.18);
      color: var(--text-main);
    }

    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--accent-2);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }

    p {
      margin: 0 0 8px;
      line-height: 1.45;
      font-size: calc(1rem * var(--font-size-multiplier));
      transition: font-size 0.3s ease;
    }

    ul {
      margin: 6px 0 0 18px;
      padding: 0;
    }

    li {
      margin-bottom: 4px;
      font-size: calc(1rem * var(--font-size-multiplier));
      transition: font-size 0.3s ease;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: minmax(0,1.15fr) minmax(0,1fr);
      gap: 18px;
      position: relative;
      z-index: 1;
    }

    @media (max-width: 1024px) {
      .grid-2 {
        grid-template-columns: minmax(0,1fr);
      }
    }

    .card {
      background: linear-gradient(145deg, #ffffff, #f9fafb);
      border-radius: 14px;
      padding: 12px 14px 14px;
      border: 1px solid rgba(148, 163, 184, 0.6);
      box-shadow: 0 6px 18px rgba(148, 163, 184, 0.16);
      position: relative;
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(148, 163, 184, 0.24);
    }

    :root[data-theme="dark"] .card {
      background: radial-gradient(circle at top left, rgba(0, 49, 47, 0.92), rgba(0, 30, 30, 0.92));
      border: 1px solid rgba(155, 203, 158, 0.16);
      box-shadow: 0 18px 30px rgba(0, 0, 0, 0.55);
    }

    .card-title {
      font-size: calc(0.92rem * var(--font-size-multiplier));
      text-transform: uppercase;
      letter-spacing: .11em;
      color: var(--accent-3);
      margin-bottom: 8px;
      transition: font-size 0.3s ease;
    }

    .audit-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 8px;
      font-size: calc(0.85rem * var(--font-size-multiplier));
    }

    .audit-meta-item {
      padding: 8px 9px;
      border-radius: 10px;
      background: #fefcf5;
      border: 1px solid rgba(163, 126, 44, 0.55);
      transition: all 0.2s ease;
    }

    .audit-meta-item:hover {
      background: #fef7eb;
      border-color: var(--accent-2);
      transform: translateX(4px);
    }

    :root[data-theme="dark"] .audit-meta-item {
      background: rgba(0, 49, 47, 0.70);
      border-color: rgba(155, 203, 158, 0.18);
    }

    .audit-label {
      display: block;
      text-transform: uppercase;
      font-size: calc(0.7rem * var(--font-size-multiplier));
      color: var(--accent-4);
      letter-spacing: .12em;
      margin-bottom: 3px;
      transition: font-size 0.3s ease;
    }

    .audit-value {
      font-weight: 500;
      font-size: calc(1rem * var(--font-size-multiplier));
      transition: font-size 0.3s ease;
    }

    .kpi-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .kpi {
      flex: 1 1 170px;
      padding: 9px 11px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ffffff, #fef7eb);
      border: 1px solid rgba(163, 126, 44, 0.7);
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: all 0.3s ease;
    }

    .kpi:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 12px 24px rgba(163, 126, 44, 0.3);
    }

    :root[data-theme="dark"] .kpi {
	  background: radial-gradient(circle at top left, rgba(0, 49, 47, 0.80), rgba(0, 30, 30, 0.85));
	  border-color: rgba(1, 103, 100, 0.55);
    }

    .kpi-label {
      font-size: calc(0.78rem * var(--font-size-multiplier));
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: .12em;
      transition: font-size 0.3s ease;
      line-height: 1.3;
    }

    .kpi-value {
      font-size: calc(1.4rem * var(--font-size-multiplier));
      font-weight: 650;
      color: var(--accent-3);
      transition: font-size 0.3s ease;
    }

    .kpi-tag {
      font-size: calc(0.78rem * var(--font-size-multiplier));
      color: var(--accent-2);
      transition: font-size 0.3s ease;
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 6px;
    }

    .bar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bar-label-row {
      display: flex;
      justify-content: space-between;
      font-size: calc(0.78rem * var(--font-size-multiplier));
      color: var(--text-muted);
      transition: font-size 0.3s ease;
    }

    .bar-shell {
      height: 11px;
      border-radius: 999px;
      background: #e5e7eb;
      overflow: hidden;
      border: 1px solid rgba(148,163,184,0.8);
    }

    :root[data-theme="dark"] .bar-shell {
      background: rgba(0, 30, 30, 0.88);
      border-color: rgba(155, 203, 158, 0.16);
    }

    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 1.5s cubic-bezier(0.65, 0, 0.35, 1);
      width: 0;
    }

	.bar-fill.bar-ecarts {
	  background: var(--bar-ecarts-gradient);
	}

	.bar-fill.bar-observations {
	  background: var(--bar-observations-gradient);
	}

    .confusion-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .tag {
      font-size: calc(0.78rem * var(--font-size-multiplier));
      padding: 4px 9px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.7);
      background: #f8fafc;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }

    .tag:hover {
      background: var(--accent-soft);
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    :root[data-theme="dark"] .tag {
      border-color: rgba(155, 203, 158, 0.16);
      background: rgba(0, 49, 47, 0.72);
      color: var(--text-muted);
    }

    .timeline {
      position: relative;
      padding-left: 18px;
      margin-top: 5px;
    }

    .timeline::before {
      content: "";
      position: absolute;
      left: 6px;
      top: 2px;
      bottom: 2px;
      width: 2px;
      background: linear-gradient(to bottom, var(--accent-2), var(--accent-3));
      opacity: 0.7;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 10px;
      padding-left: 8px;
      opacity: 0;
      transform: translateX(-20px);
      transition: all 0.5s ease;
    }

    .timeline-item.visible {
      opacity: 1;
      transform: translateX(0);
    }

    .timeline-dot {
      position: absolute;
      left: -8px;
      top: 3px;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #ffffff;
      border: 2px solid var(--accent);
      transition: all 0.3s ease;
    }

    .timeline-item:hover .timeline-dot {
      transform: scale(1.3);
      box-shadow: 0 0 12px var(--accent);
    }

    :root[data-theme="dark"] .timeline-dot {
      background: rgba(0, 30, 30, 0.95);
    }

    .timeline-title {
      font-size: calc(0.9rem * var(--font-size-multiplier));
      font-weight: 600;
      margin-bottom: 2px;
      transition: font-size 0.3s ease;
    }

    .timeline-text {
      font-size: calc(0.86rem * var(--font-size-multiplier));
      color: var(--text-muted);
      transition: font-size 0.3s ease;
    }

    .obs-label {
      font-size: calc(0.78rem * var(--font-size-multiplier));
      text-transform: uppercase;
      letter-spacing: .14em;
      color: var(--text-muted);
      margin-bottom: 4px;
      transition: font-size 0.3s ease;
    }

    .obs-title {
      font-size: calc(1.05rem * var(--font-size-multiplier));
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--accent-3);
      transition: font-size 0.3s ease;
    }

    .obs-risk {
      border-left: 3px solid var(--danger);
      padding: 10px;
      font-size: calc(0.86rem * var(--font-size-multiplier));
      color: #b91c1c;
      margin-top: 10px;
      background: #fee2e2;
      border-radius: 4px 8px 8px 4px;
      transition: all 0.3s ease;
    }

    .obs-risk:hover {
      background: #fecaca;
      padding-left: 14px;
    }

    :root[data-theme="dark"] .obs-risk {
      color: #fecaca;
      background: rgba(127,29,29,0.28);
    }

    .slide-footer {
      margin-top: 8px;
      font-size: calc(0.75rem * var(--font-size-multiplier));
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
      position: relative;
      z-index: 1;
      transition: font-size 0.3s ease;
    }

    .slide-footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .note-toggle-btn {
      padding: 4px 10px;
      font-size: calc(0.75rem * var(--font-size-multiplier));
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.5);
      background: rgba(255, 255, 255, 0.9);
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .note-toggle-btn:hover {
      background: var(--accent-soft);
      border-color: var(--accent);
      transform: translateY(-1px);
    }

    .note-toggle-btn.has-note {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    :root[data-theme="dark"] .note-toggle-btn {
      background: rgba(0, 49, 47, 0.78);
      border-color: rgba(155, 203, 158, 0.18);
    }

    .image-block {
      margin-top: 10px;
      text-align: center;
    }

	.image-block img {
	  max-width: 49%;
	  height: auto;
	  border-radius: 6px;
	  border: 1px solid rgba(148, 163, 184, 0.7);
	  margin: 0.25rem;
	  cursor: zoom-in;
	  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	  opacity: 0;
	  transform: scale(0.95);
	}

	.image-block img.loaded {
	  opacity: 1;
	  transform: scale(1);
	}

	.image-block img:hover {
	  transform: scale(1.05);
	  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
	}

	.image-block img:active {
	  transform: scale(0.98);
	  transition-duration: 0.1s;
	}

	.image-block img:first-child:last-child {
	  max-width: 60%;
	}


    .image-caption {
      font-size: calc(0.8rem * var(--font-size-multiplier));
      color: var(--text-muted);
      margin-top: 0.25rem;
      transition: font-size 0.3s ease;
    }

	.lightbox {
	  position: fixed;
	  inset: 0;
	  background: rgba(0, 0, 0, 0);
	  backdrop-filter: blur(0px);
	  -webkit-backdrop-filter: blur(0px);
	  display: none;
	  align-items: center;
	  justify-content: center;
	  z-index: 3000;
	  opacity: 0;
	  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
				  background 0.4s cubic-bezier(0.4, 0, 0.2, 1),
				  backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.lightbox.open {
	  display: flex;
	  opacity: 1;
	  background: rgba(0, 0, 0, 0.95);
	  backdrop-filter: blur(10px);
	  -webkit-backdrop-filter: blur(10px);
	}

	@keyframes lightboxZoomIn {
	  from {
		opacity: 0;
		transform: scale(0.8) translateY(30px);
	  }
	  to {
		opacity: 1;
		transform: scale(1) translateY(0);
	  }
	}

	.lightbox-inner {
	  width: 90vw;
	  height: 90vh;
	  position: relative;
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  opacity: 0;
	  transform: scale(0.8) translateY(30px);
	  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
				  transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
	}

	.lightbox.open .lightbox-inner {
	  opacity: 1;
	  transform: scale(1) translateY(0);
	}

	.lightbox-img-container {
	  position: relative;
	  width: 100%;
	  height: calc(100% - 60px);
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  overflow: hidden;
	}

	.lightbox-img {
	  max-width: 100%;
	  max-height: 100%;
	  border-radius: 8px;
	  box-shadow: 0 20px 60px rgba(0,0,0,0.9);
	  display: block;
	  cursor: grab;
	  transition: transform 0.3s ease;
	  transform-origin: center center;
	  object-fit: contain;
	}

	.lightbox-img:hover {
	  transform: scale(1.02);
	}

	.lightbox-img.dragging {
	  cursor: grabbing;
	}


    .lightbox-controls {
      position: absolute;
      top: 50%;
      width: 100%;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      pointer-events: none;
      padding: 0 20px;
      z-index: 1;
    }

    .lightbox-prev,
    .lightbox-next {
      pointer-events: all;
      background: rgba(15,23,42,0.9);
      color: #f9fafb;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .lightbox-prev:hover,
    .lightbox-next:hover {
      background: rgba(15,23,42,1);
      transform: scale(1.1);
    }

    .lightbox-prev:disabled,
    .lightbox-next:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .lightbox-info {
      margin-top: 16px;
      text-align: center;
      color: white;
    }

    .lightbox-counter {
      font-size: calc(0.9rem * var(--font-size-multiplier));
      margin-bottom: 8px;
      opacity: 0.8;
    }

    .lightbox-caption {
      font-size: calc(0.95rem * var(--font-size-multiplier));
      max-width: 600px;
      line-height: 1.4;
    }

	.lightbox-close {
	  position: fixed;
	  top: 20px;
	  right: 20px;
	  background: rgba(15,23,42,0.9);
	  color: #f9fafb;
	  border: 1px solid rgba(255, 255, 255, 0.2);
	  border-radius: 50%;
	  width: 44px;
	  height: 44px;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  font-size: 24px;
	  cursor: pointer;
	  backdrop-filter: blur(10px);
	  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	  opacity: 0;
	}

	.lightbox.open .lightbox-close {
	  opacity: 1;
	  transition-delay: 0.2s;
	}

	.lightbox.open .lightbox-close:hover {
	  background: rgba(185, 28, 28, 0.9);
	  transform: rotate(90deg);
	}

	.lightbox.open .lightbox-close:not(:hover) {
	  transform: rotate(0deg);
	}



    .lightbox-zoom-controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      background: rgba(15,23,42,0.9);
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }

    .lightbox-zoom-btn {
      background: transparent;
      color: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 12px;
      transition: all 0.2s ease;
      border-radius: 4px;
    }

    .lightbox-zoom-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .lightbox-zoom-level {
      color: white;
      font-size: calc(0.85rem * var(--font-size-multiplier));
      display: flex;
      align-items: center;
      padding: 0 8px;
      min-width: 60px;
      justify-content: center;
    }

  @media print {
    @page {
      margin: 0;
      size: A4 landscape;
    }

    body {
      background: white !important;
      color: black !important;
    }

    .toolbar,
    .nav-dots,
    .mobile-nav,
    .lightbox,
    .note-toggle-btn,
    .slide-menu,
    .note-content {
      display: none !important;
    }

    .deck {
      padding: 0 !important;
      min-height: 0 !important;
    }

    .slide {
      page-break-after: always;
      page-break-inside: avoid;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 28px 32px !important;
      max-width: 100% !important;
      width: 100% !important;
      height: auto !important;
      min-height: 100vh !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      break-after: page;
      border-radius: 0 !important;
      opacity: 1 !important;
      transform: none !important;
      background: white !important;
      overflow: visible !important;
    }

    .slide:last-child {
      page-break-after: auto;
    }

    .slide::before {
      display: none !important;
    }

	body.scroll-mode-active {
	  overflow: hidden;
	}

	body.scroll-mode-active .deck {
	  height: 100vh;
	  overflow: hidden;
	}

	.toolbar-btn.scroll-mode-active {
	  background: var(--accent-3);
	  color: #ffffff;
	}


    #slide-1 .slide-header {
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      margin-bottom: 16px !important;
    }

    #slide-1 .grid-2 > .card:first-child {
      page-break-after: always !important;
      page-break-before: auto !important;
      page-break-inside: avoid !important;
      margin: 0 !important;
      padding: 24px !important;
      min-height: 0 !important;
      height: auto !important;
    }

    #slide-1 .grid-2 > .card:last-child {
      page-break-before: always !important;
      page-break-after: auto !important;
      page-break-inside: avoid !important;
      margin: 20px !important;
      padding: 24px !important;
      min-height: 0 !important;
      height: auto !important;
    }

    #slide-1 .slide-footer {
      page-break-before: avoid !important;
      margin-top: 16px !important;
      display: flex !important;
    }

    #slide-1 .grid-2 > .card:last-child .card-title {
      font-size: 0.85rem !important;
      margin-bottom: 10px !important;
    }

    #slide-1 .audit-meta {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }

    #slide-1 .audit-meta-item {
      padding: 8px !important;
    }

    #slide-1 .audit-label {
      font-size: 0.7rem !important;
    }

    #slide-1 .audit-value {
      font-size: 0.85rem !important;
    }

    #slide-1 .kpi-row {
      gap: 8px !important;
    }

    #slide-1 .kpi {
      padding: 8px 10px !important;
      flex: 1 1 calc(33.333% - 8px) !important;
    }

    #slide-1 .kpi-label {
      font-size: 0.7rem !important;
      line-height: 1.2 !important;
    }

    #slide-1 .kpi-value {
      font-size: 1.2rem !important;
    }

    #slide-1 .kpi-tag {
      font-size: 0.7rem !important;
    }

    #slide-1 .bar-group {
      margin-top: 8px !important;
    }

    #slide-1 .bar-label-row {
      font-size: 0.7rem !important;
    }

	.slide .card p,
	.slide .card li {
	  font-size: 0.82rem !important;
	  line-height: 1.3 !important;
	}

	.slide .card ul {
	  margin: 4px 0 0 14px !important;
	}

    .slide:not(#slide-1) {
      height: 100vh !important;
      overflow: hidden !important;
    }

    .card {
      box-shadow: none !important;
      border: 1px solid #ddd !important;
      break-inside: avoid;
      page-break-inside: avoid;
      padding: 10px 12px !important;
      flex-shrink: 0 !important;
      background: white !important;
    }

    .card:hover {
      transform: none !important;
    }

    .card-title {
      font-size: 0.8rem !important;
      margin-bottom: 6px !important;
    }

    .obs-title {
      font-size: 0.9rem !important;
    }

    p, li {
      font-size: 0.82rem !important;
      line-height: 1.3 !important;
    }

    ul {
      margin: 4px 0 0 14px !important;
    }

    .image-block {
      margin-top: 8px !important;
    }

    .image-block img {
      max-width: 45% !important;
      page-break-inside: avoid;
      opacity: 1 !important;
      transform: none !important;
    }

    .image-caption {
      font-size: 0.7rem !important;
    }

    .timeline-title {
      font-size: 0.82rem !important;
    }

    .timeline-text {
      font-size: 0.78rem !important;
    }

    .obs-label {
      font-size: 0.7rem !important;
    }

    .obs-risk {
      font-size: 0.78rem !important;
      padding: 8px !important;
    }

    .confusion-tags {
      gap: 6px !important;
    }

    .tag {
      font-size: 0.7rem !important;
      padding: 3px 8px !important;
    }

    .slide-footer {
      margin-top: 12px !important;
      font-size: 0.7rem !important;
      flex-shrink: 0 !important;
    }

    .badge {
      font-size: 0.7rem !important;
      padding: 3px 8px !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }


    @media (max-width: 640px) {
      .slide {
        padding: 18px 16px;
      }
      .slide-title {
        font-size: calc(1.3rem * var(--font-size-multiplier));
      }
      .slide-header {
        flex-direction: column;
        gap: 10px;
      }
      .image-block img {
        max-width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
    
    .image-block {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        margin-top: 20px;
    }
    
	.image-block img {
	  max-width: 49%;
	  height: auto;
	  border-radius: 6px;
	  border: 1px solid rgba(148, 163, 184, 0.7);
	  margin: 0.25rem;
	  cursor: zoom-in;
	  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	  opacity: 0;
	  transform: scale(0.95);
	}

	.image-block img.loaded {
	  opacity: 1;
	  transform: scale(1);
	}

	.image-block img:hover {
	  transform: scale(1.05);
	  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
	}

	.image-block img:active {
	  transform: scale(0.98);
	  transition-duration: 0.1s;
	}

	.image-block img:first-child:last-child {
	  max-width: 60%;
	}

    
    .image-block:has(img:nth-child(3)) img {
        max-width: 32%;
    }
    
    .image-caption {
        width: 100%;
        margin-top: 10px;
        font-size: 0.85rem;
        color: var(--text-muted);
        text-align: center;
        font-style: italic;
    }
    
    @media (max-width: 768px) {
        .image-block img {
            max-width: 100% !important;
        }
    }
    
    @media print {
        .image-block img {
            max-width: 45%;
            page-break-inside: avoid;
            opacity: 1 !important;
            transform: none !important;
        }
        
        .image-block img:first-child:last-child {
            max-width: 60%;
        }
    }
    
    </style>`; 
}


// ========================================
// COMPOSANTS HTML
// ========================================

function getToolbar() {
    return `<!-- TOOLBAR -->
  <div class="toolbar">
    <button class="toolbar-toggle" id="toolbarToggle">⚙️ Options</button>
    <div class="toolbar-content" id="toolbarContent">
      <div class="toolbar-row">
        <button class="toolbar-btn" id="fontDecrease">A-</button>
        <button class="toolbar-btn active" id="fontNormal">A</button>
        <button class="toolbar-btn" id="fontIncrease">A+</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-row">
        <button class="toolbar-btn" id="presentationMode">📽️ Mode Présentation</button>
        <button class="toolbar-btn" id="scrollModeToggle">🌀 Mode défilement</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-row">
        <button class="toolbar-btn" id="printPDF">🖨️ PDF</button>
        <button class="toolbar-btn" id="saveReport">💾 Enregistrer le rapport</button>
        <button class="toolbar-btn" id="exportJson">📤 Export Plan d'action</button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-row">
        <button class="toolbar-btn" id="themeToggle">🌓 Thème</button>
      </div>
    </div>
  </div>`;
}


function getNavDots(total) {
    let dots = '';
    for (let i = 0; i < total; i++) {
        dots += `<div class="nav-dot${i === 0 ? ' active' : ''}"></div>`;
    }
    return `<!-- NAVIGATION DOTS -->
  <div class="nav-dots" id="navDots">${dots}</div>`;
}

function getMobileNav(total) {
    return `<!-- NAVIGATION MOBILE -->
  <div class="mobile-nav">
    <button class="mobile-nav-btn" id="mobilePrev">←</button>
    <div class="mobile-nav-center">
      <span class="mobile-nav-counter" id="mobileCounter">1 / ${total}</span>
      <button class="mobile-note-btn" id="mobileNoteBtn">📝</button>
    </div>
    <button class="mobile-nav-btn" id="mobileNext">→</button>
    <button class="mobile-menu-btn" id="mobileMenuBtn">⋮</button>
  </div>`;
}

function getSlideMenu(data, total) {
    const pointsForts = Array.isArray(data.pointsForts) ? data.pointsForts : [];
    const ecarts = Array.isArray(data.ecarts) ? data.ecarts : [];
    const observations = Array.isArray(data.observations) ? data.observations : [];

    let menuItems = `<div class="slide-menu-item active"><span class="slide-menu-item-number">1</span>Informations</div>`;

    let slideNum = 2;

    // ✅ Points forts
    pointsForts.forEach((pf, i) => {
        menuItems += `<div class="slide-menu-item"><span class="slide-menu-item-number">${slideNum}</span>Point fort ${i + 1}</div>`;
        slideNum++;
    });

    // Écarts
    ecarts.forEach((ecart, i) => {
        menuItems += `<div class="slide-menu-item"><span class="slide-menu-item-number">${slideNum}</span>Écart ${i + 1}</div>`;
        slideNum++;
    });

    // Observations (si existantes)
    if (observations.length > 0) {
        menuItems += `<div class="slide-menu-item"><span class="slide-menu-item-number">${slideNum}</span>Observations</div>`;
        slideNum += observations.length;
    }

    menuItems += `<div class="slide-menu-item"><span class="slide-menu-item-number">${slideNum}</span>Clôture & Plan d'actions</div>`;

    return `<!-- MENU DÉROULANT -->
  <div class="slide-menu" id="slideMenu">${menuItems}</div>`;
}


function getLightbox() {
    return `<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox">
  <button class="lightbox-close" id="lightboxClose">✕</button>
  <div class="lightbox-inner">
    <div class="lightbox-controls">
      <button class="lightbox-prev" id="lightboxPrev">‹</button>
      <button class="lightbox-next" id="lightboxNext">›</button>
    </div>
    <div class="lightbox-img-container">
      <img src="" alt="" class="lightbox-img" id="lightboxImg">
    </div>
    <div class="lightbox-info">
      <div class="lightbox-counter" id="lightboxCounter">1 / 1</div>
      <div class="lightbox-caption" id="lightboxCaption"></div>
    </div>
  </div>
  <div class="lightbox-zoom-controls">
    <button class="lightbox-zoom-btn" id="zoomOut">−</button>
    <span class="lightbox-zoom-level" id="zoomLevel">100%</span>
    <button class="lightbox-zoom-btn" id="zoomIn">+</button>
    <button class="lightbox-zoom-btn" id="zoomReset">⟲</button>
  </div>
</div>`;
}

// ========================================
// GÉNÉRATION DES SLIDES
// ========================================

function generateSlide1(data, total) {
    const { metadata, summary, auditedPersons, distribution } = data;

    const pfCount = (summary && typeof summary.pointFortCount === 'number')
        ? summary.pointFortCount
        : (Array.isArray(data.pointsForts) ? data.pointsForts.length : 0);

    const hasPointsForts = pfCount > 0;

    return `<!-- SLIDE 1 : Couverture -->
  <section class="slide" id="slide-1" data-slide="1" data-title="Informations">
    <div class="slide-header">
      <div>
        <div class="slide-kicker">${escapeHtmlText(metadata.kicker || 'Audit interne – Secteur Fournitures')}</div>
        <div class="slide-title">Audit ${escapeHtmlText(metadata.auditNumber || 'N/A')}<br>${escapeHtmlText(metadata.title || '')}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Objectif &amp; périmètre</div>
        <p>
          ${escapeHtmlText(metadata.objective || 'Non spécifié')}
        </p>
        <p style="margin-top:4px;">
          <strong>Périmètre :</strong> ${escapeHtmlText(metadata.perimeter || 'N/A')}.
        </p>

        <div class="card-title" style="margin-top:10px;">Référentiels clés</div>
        <ul>
          ${
            metadata.referentials && metadata.referentials.length > 0
              ? metadata.referentials.map(ref => `<li>${escapeHtmlText(ref)}</li>`).join('')
              : '<li>Aucun référentiel spécifié</li>'
          }
        </ul>

        <div class="card-title" style="margin-top:10px;">Contexte</div>
        ${
          metadata.context && metadata.context.poste
            ? `<p>Poste : ${escapeHtmlText(metadata.context.poste)}</p>`
            : ''
        }
        ${
          metadata.context && metadata.context.article
            ? `<p>Article : ${escapeHtmlText(metadata.context.article)}</p>`
            : ''
        }
        ${
          metadata.context && metadata.context.operation
            ? `<p>Opération : ${escapeHtmlText(metadata.context.operation)}</p>`
            : ''
        }

        <div class="card-title" style="margin-top:10px;">Audités</div>
        <ul>
          ${
            auditedPersons && auditedPersons.length > 0
              ? auditedPersons.map(person => `<li>${escapeHtmlText(person)}</li>`).join('')
              : '<li>Aucune personne spécifiée</li>'
          }
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Informations audit</div>
        <div class="audit-meta">
          <div class="audit-meta-item">
            <span class="audit-label">N° d'audit</span>
            <span class="audit-value">${escapeHtmlText(metadata.auditNumber || 'N/A')}</span>
          </div>
          <div class="audit-meta-item">
            <span class="audit-label">Équipe</span>
            <span class="audit-value">${escapeHtmlText(metadata.team || 'N/A')}</span>
          </div>
          <div class="audit-meta-item">
            <span class="audit-label">Période</span>
            <span class="audit-value">${escapeHtmlText(metadata.period || 'N/A')}</span>
          </div>
          <div class="audit-meta-item">
            <span class="audit-label">Rapport établi le</span>
            <span class="audit-value">${escapeHtmlText(metadata.reportDate || 'N/A')}</span>
          </div>
          <div class="audit-meta-item">
            <span class="audit-label">Liste de diffusion</span>
            <span class="audit-value">${distribution && distribution.length > 0 ? escapeHtmlText(distribution.join(', ')) : 'N/A'}</span>
          </div>
        </div>

        <div class="card-title" style="margin-top:12px;">Synthèse &amp; KPI</div>
        <div class="kpi-row">
          ${hasPointsForts ? `
          <div class="kpi">
            <span class="kpi-label">Points forts<br>&nbsp;</span>
            <span class="kpi-value" data-countup="${pfCount}">${pfCount}</span>
            <span class="kpi-tag">Bonnes pratiques</span>
          </div>
          ` : ''}

          <div class="kpi">
            <span class="kpi-label">Nombre d'écarts<br>&nbsp;</span>
            <span class="kpi-value" data-countup="${summary.ecartCount || 0}">${summary.ecartCount || 0}</span>
            <span class="kpi-tag">Plan d'actions requis</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Nombre d'observations<br>&nbsp;</span>
            <span class="kpi-value" data-countup="${summary.observationCount || 0}">${summary.observationCount || 0}</span>
            <span class="kpi-tag">À discrétion du responsable</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Remarques des audités<br>&nbsp;</span>
            <span class="kpi-value" data-countup="${summary.remarqueCount || 0}">${summary.remarqueCount || 0}</span>
            <span class="kpi-tag">Voix du terrain</span>
          </div>
        </div>

        <div class="bar-group">
		  <div class="bar-item">
			<div class="bar-label-row">
			  <span>Écarts (non-conformités au référentiel)</span>
			  <span>${summary.ecartCount || 0}</span>
			</div>
			<div class="bar-shell">
			  <div class="bar-fill bar-ecarts"
				   data-width="${Math.min((summary.ecartCount || 0) * 14, 100)}"></div>
			</div>
		  </div>
		  <div class="bar-item">
			<div class="bar-label-row">
			  <span>Observations (pistes d'amélioration)</span>
			  <span>${summary.observationCount || 0}</span>
			</div>
			<div class="bar-shell">
			  <div class="bar-fill bar-observations"
				   data-width="${Math.min((summary.observationCount || 0) * 18, 100)}"></div>
			</div>
		  </div>
		</div>

      </div>
    </div>

    <div class="slide-footer">
      <div class="slide-footer-left">
        <span>Informations</span>
      </div>
      <span>1 / ${total}</span>
    </div>
  </section>`;
}


/**
 * Référence d'une image = son index dans data.images (copie unique dans
 * embedded-audit-data). Le runtime du rapport remplit src au chargement :
 * chaque photo n'est plus stockée deux fois dans le HTML.
 */
function getImageRef(data, img) {
    return Array.isArray(data.images) ? data.images.indexOf(img) : -1;
}

function escapeHtmlAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, ' ');
}

function escapeHtmlText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMultilineText(str) {
  // respecte \n (Enter/Shift+Enter) et \r\n (Windows)
  return escapeHtmlText(str).replace(/\r?\n/g, '<br>');
}


/**
 * ✅ NOUVEAU : Génère les slides de points forts (sans Plan d'actions)
 */
function generatePointFortSlides(data, totalSlides, imagesPerPointFort = []) {
    const pointsForts = Array.isArray(data.pointsForts) ? data.pointsForts : [];
    if (pointsForts.length === 0) return '';

    let slides = '';

    pointsForts.forEach((pf, index) => {
        const slideNumber = 2 + index; // juste après slide 1
        const pfNumber = pf.number || (index + 1);
        const pfImages = imagesPerPointFort[index] || [];

        slides += `
        <section class="slide" id="slide-${slideNumber}" data-slide="${slideNumber}" data-title="Point fort ${pfNumber}">
            <div class="slide-header">
                <div>
                    <div class="slide-kicker">Constats terrain</div>
                    <div class="slide-title">${escapeHtmlAttr(pf.titre || `Point fort ${pfNumber}`)}</div>
                </div>
                <div class="badge">
                    <span class="badge-dot"></span>
                    <span>Point fort ${pfNumber}</span>
                </div>
            </div>

            <div class="card">
                <h3 class="card-title">✅ Point fort</h3>
                <p style="margin-top: 15px;">${renderMultilineText(pf.constat || '')}</p>

                ${pfImages.length > 0 ? `
                <div class="image-block" style="margin-top: 20px;">
                    ${pfImages.map((img) => {
                        const safeAlt = escapeHtmlAttr(img.alt || '');
                        const safeCaption = escapeHtmlAttr(`Point fort ${pfNumber} - ${img.alt || ''}`);
                        return `
                            <img data-img="${getImageRef(data, img)}"
                                 alt="${safeAlt}"
                                 class="zoomable"
                                 data-caption="${safeCaption}"
                                 loading="lazy">
                        `;
                    }).join('')}

                    ${pfImages.length > 1 ? `
                    <p class="image-caption" style="margin-top: 10px; font-size: 0.85rem; color: #64748b; text-align: center;">
                        📷 ${pfImages.length} photo(s) - Cliquez pour agrandir
                    </p>` : ''}
                </div>
                ` : ''}
            </div>

            <div class="slide-footer">
                <div class="slide-footer-left">
                    <span>Point fort ${pfNumber}</span>
                </div>
                <span>${slideNumber} / ${totalSlides}</span>
            </div>
        </section>
        `;
    });

    return slides;
}

/**
 * ✅ FONCTION MODIFIÉE : Génère les slides d'écarts
 * Support délimiteurs "/" et ":" avec fallback null
 */
function generateEcartSlides(data, totalSlides, imagesPerEcart = []) {
    let slides = '';
    
    data.ecarts.forEach((ecart, index) => {
        const pfCount = Array.isArray(data.pointsForts) ? data.pointsForts.length : 0;
		const slideNumber = 2 + pfCount + index;

        
        // ✅ MODIFICATION : Extraction titre et code
        const ecartTitle = getEcartTitle(ecart.exigence);   // null si pas de délimiteur
        const ecartCode  = getEcartCode(ecart.exigence);    // toujours retourné

        // ✅ MODIFICATION : Générer HTML conditionnel pour le titre
        const displayTitle = ecartTitle 
            ? `<div class="slide-title">${escapeHtmlAttr(ecartTitle)}</div>` 
            : ''; // Aucun titre si null

        const ecartImages = imagesPerEcart[index] || [];
        
        slides += `
        <section class="slide" id="slide-${slideNumber}" data-slide="${slideNumber}" data-has-notes="true" data-title="Écart ${ecart.number}">
            <div class="slide-header">
                <div>
                    <div class="slide-kicker">Constats terrain</div>
                    ${displayTitle}
                </div>
                <div class="badge">
                    <span class="badge-dot"></span>
                    <span>${escapeHtmlAttr(ecartCode)}</span>
                </div>
            </div>

            <div class="card">
                <h3 class="card-title">📋 Constat</h3>
                <p style="margin-top: 15px;">${renderMultilineText(ecart.constat || '')}</p>
                
                ${ecartImages.length > 0 ? `
                <div class="image-block" style="margin-top: 20px;">
                    ${ecartImages.map((img, imgIndex) => {
						const safeAlt = escapeHtmlAttr(img.alt || '');
						const safeCaption = escapeHtmlAttr(`Écart ${ecart.number} - ${img.alt || ''}`);
						return `
							<img data-img="${getImageRef(data, img)}" 
								 alt="${safeAlt}" 
								 class="zoomable" 
								 data-caption="${safeCaption}"
								 loading="lazy">
							${imgIndex < ecartImages.length - 1 && ecartImages.length > 1 ? '' : ''}
						`;
					}).join('')}

                    ${ecartImages.length > 1 ? `
                    <p class="image-caption" style="margin-top: 10px; font-size: 0.85rem; color: #64748b; text-align: center;">
                        📷 ${ecartImages.length} photo${ecartImages.length > 1 ? 's' : ''} - Cliquez pour agrandir
                    </p>
                    ` : ''}
                </div>
                ` : ''}
            </div>

            ${getNoteContent(slideNumber)}

            <div class="slide-footer">
                <div class="slide-footer-left">
                    <span>Écart ${ecart.number}</span>
                    <button class="note-toggle-btn" data-slide="${slideNumber}">
                        📝 Plan d'action
                    </button>
                </div>
                <span>${slideNumber} / ${totalSlides}</span>
            </div>
        </section>
        `;
    });
    
    return slides;
}




/**
 * Génère les slides d'observations
 */
function generateObservationsSlide(data, total, imagesPerObservation) {
    const { observations, ecarts } = data;

    const pfCount = Array.isArray(data.pointsForts) ? data.pointsForts.length : 0;
	const firstSlideNumber = 2 + pfCount + ecarts.length;


    let slides = '';

    observations.forEach((obs, index) => {
        const slideNumber = firstSlideNumber + index;
        const obsNumber = index + 1;
        
        const obsImages = imagesPerObservation[index] || [];
        
        const imagesHTML = obsImages.length > 0 ? `
            <div class="image-block">
                ${obsImages.map((img, imgIndex) => `
                    <img data-img="${getImageRef(data, img)}" 
                         alt="${escapeHtmlAttr(img.alt || img.caption || 'Image')}" 
                         class="zoomable loaded" 
                         data-caption="Observation ${obsNumber} - ${escapeHtmlAttr(img.alt || img.caption || 'Image')}"
                         loading="lazy">
                `).join('')}
                ${obsImages.length > 1 ? `<p class="image-caption">📷 ${obsImages.length} photo(s) - Cliquez pour agrandir</p>` : ''}
            </div>
        ` : '';

        slides += `
  <section class="slide" id="slide-${slideNumber}" data-slide="${slideNumber}" data-has-notes="true" data-title="Observation ${obsNumber}">
    <div class="slide-header">
      <div>
        <div class="slide-kicker">Constats terrain</div>
        <div class="slide-title">Observation ${obsNumber}</div>
      </div>
      <div class="badge">
        <span class="badge-dot"></span>
        <span>Observation ${obsNumber}</span>
      </div>
    </div>

    <div class="card">
      <div class="obs-label">Observation ${obsNumber}</div>
      <p style="font-size:calc(0.9rem * var(--font-size-multiplier)); margin-bottom: 15px;">
        <strong>Constat :</strong> ${renderMultilineText(obs.constat || 'Non spécifié')}
      </p>
      
      ${imagesHTML}
      
      ${
        obs.risque
          ? `<p class="obs-risk">
               <strong>Risque :</strong> ${renderMultilineText(obs.risque)}
             </p>`
          : ''
      }
    </div>

    ${getNoteContent(slideNumber)}

    <div class="slide-footer">
      <div class="slide-footer-left">
        <span>Observation ${obsNumber}</span>
        <button class="note-toggle-btn" data-slide="${slideNumber}">📝 Plan d'action</button>
      </div>
      <span>${slideNumber} / ${total}</span>
    </div>
  </section>`;
    });

    return slides;
}




function generateFinalSlide(data, total) {
    const { remarques, observations, ecarts } = data;
    const pfCount = Array.isArray(data.pointsForts) ? data.pointsForts.length : 0;
	const slideNumber = 2 + pfCount + ecarts.length + observations.length;


    const cloture = data.cloture || {};
    const noteFinale = (cloture.noteFinale || '').trim();

    const prochainesEtapesTexte =
        (typeof cloture.prochainesEtapesTexte === 'string' ? cloture.prochainesEtapesTexte : '').trim();

    // rétrocompat si anciens JSON contiennent cloture.prochainesEtapes[]
    const fallbackList = Array.isArray(cloture.prochainesEtapes)
        ? cloture.prochainesEtapes.filter(e => e && String(e).trim()).join('\n')
        : '';

    const prochainesEtapesDisplay = prochainesEtapesTexte || fallbackList;

    return `
  <section class="slide" id="slide-${slideNumber}" data-slide="${slideNumber}" data-has-notes="true" data-title="Clôture & Plan d'actions">
    <div class="slide-header">
      <div>
        <div class="slide-kicker">Voix du terrain &amp; clôture</div>
        <div class="slide-title">Remarques des audités &amp; axes d'amélioration</div>
      </div>
      <div class="badge">
        <span class="badge-dot"></span>
        <span>Plan d'actions &amp; suite</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Remarques des audités</div>
        <ul>
          ${
            remarques.audites && remarques.audites.length > 0
              ? remarques.audites.map(r => `<li>${escapeHtmlText(r)}</li>`).join('')
              : '<li>Aucune remarque</li>'
          }
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Notes de réunion de clôture</div>
        <div
          class="closing-notes-content"
          id="closing-notes-content"
          style="white-space:pre-wrap;">${escapeHtmlText(noteFinale)}</div>

        <div class="card-title" style="margin-top:15px;">Clôture &amp; prochaines étapes</div>
        <div
          class="closing-steps-content"
          id="closing-steps-content"
          style="margin-top:8px; white-space:pre-wrap;">${escapeHtmlText(prochainesEtapesDisplay)}</div>
      </div>
    </div>

    ${getNoteContent(slideNumber, true)}

    <div class="slide-footer">
      <div class="slide-footer-left">
        <span>Clôture &amp; feedback</span>
        <button class="note-toggle-btn" data-slide="${slideNumber}">📝 Notes de réunion de clôture</button>
      </div>
      <span>${slideNumber} / ${total}</span>
    </div>
  </section>`;
}





// ========================================
// FONCTIONS UTILITAIRES - ✅ MODIFIÉES
// ========================================

function getNoteContent(slideNumber, isClosingSlide = false) {
  if (isClosingSlide) {
    return `
      <div class="note-content" id="note-${slideNumber}">
        <div class="note-title">Notes de réunion de clôture</div>

        <div class="note-field">
          <label class="note-label">Compte-rendu</label>
          <textarea class="note-textarea note-closing-notes" rows="4" placeholder="Saisir librement les échanges, décisions, points ouverts..."></textarea>
        </div>

        <div class="note-field">
          <label class="note-label">Prochaines étapes (texte libre)</label>
          <textarea class="note-textarea note-closing-steps" rows="4" placeholder="Saisir librement les prochaines étapes..."></textarea>
        </div>

        <div class="note-actions">
          <button class="note-save" data-slide="${slideNumber}">
            💾 Enregistrer les notes
          </button>
          <button class="note-cancel" data-slide="${slideNumber}">
            ↩️ Annuler les modifications
          </button>
        </div>

        <div class="note-display">
          <div class="note-display-title">Notes enregistrées</div>
          <div class="note-display-content note-display-closing-notes"></div>
          <div class="note-display-content note-display-closing-steps"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="note-content" id="note-${slideNumber}">
      <div class="note-title">Plan d'action</div>

      <div class="note-field">
        <label class="note-label">Action</label>
        <textarea class="note-textarea note-action" rows="3" placeholder="Décrire l'action à mettre en place..."></textarea>
      </div>

      <div class="note-field">
        <label class="note-label">Responsable</label>
        <input class="note-input note-responsable" placeholder="Nom du responsable">
      </div>

      <div class="note-field">
        <label class="note-label">Délai</label>
        <input class="note-input note-delai" placeholder="Ex : 31/12/2024">
      </div>

      <div class="note-actions">
        <button class="note-save" data-slide="${slideNumber}">
          💾 Enregistrer le plan d'action
        </button>
        <button class="note-cancel" data-slide="${slideNumber}">
          ↩️ Annuler les modifications
        </button>
      </div>

      <div class="note-display">
        <div class="note-display-title">Plan d'action enregistré</div>
        <div class="note-display-row">
          <span class="note-display-label">Action :</span>
          <span class="note-display-action"></span>
        </div>
        <div class="note-display-row">
          <span class="note-display-label">Responsable :</span>
          <span class="note-display-responsable"></span>
        </div>
        <div class="note-display-row">
          <span class="note-display-label">Délai :</span>
          <span class="note-display-delai"></span>
        </div>
      </div>
    </div>
  `;
}


/**
 * ✅ FONCTION MODIFIÉE : Extrait le code (avant délimiteur)
 */
function getEcartCode(exigence) {
    if (!exigence) return '';
    
    const trimmed = exigence.trim();
    
    const slashPos = trimmed.indexOf('/');
    const colonPos = trimmed.indexOf(':');
    
    let delimiterPos = -1;
    
    if (slashPos !== -1 && colonPos !== -1) {
        delimiterPos = Math.min(slashPos, colonPos);
    } else if (slashPos !== -1) {
        delimiterPos = slashPos;
    } else if (colonPos !== -1) {
        delimiterPos = colonPos;
    }
    
    if (delimiterPos !== -1) {
        return trimmed.substring(0, delimiterPos).trim();
    }
    
    return trimmed;
}


/**
 * ✅ FONCTION MODIFIÉE : Extrait le titre (après délimiteur / ou :)
 * Retourne NULL si aucun délimiteur trouvé
 */
function getEcartTitle(exigence) {
    if (!exigence) return null;
    
    const trimmed = exigence.trim();
    
    const slashPos = trimmed.indexOf('/');
    const colonPos = trimmed.indexOf(':');
    
    let delimiterPos = -1;
    
    if (slashPos !== -1 && colonPos !== -1) {
        delimiterPos = Math.min(slashPos, colonPos);
    } else if (slashPos !== -1) {
        delimiterPos = slashPos;
    } else if (colonPos !== -1) {
        delimiterPos = colonPos;
    }
    
    if (delimiterPos !== -1) {
        const title = trimmed.substring(delimiterPos + 1).trim();
        if (title.length > 0) {
            return title;
        }
    }
    
    // ✅ AUCUN DÉLIMITEUR TROUVÉ → RETOURNER NULL
    return null;
}


function getFirstSentence(text) {
    if (!text) return '';
    const sentences = text.split(/[.!?]/);
    return sentences[0].trim();
}

function generateRiskText(ecart) {
    const defaultRisks = {
        'INS-2426': "L'utilisation de documents non maîtrisés expose le poste à des réglages inadaptés et à des difficultés de conformité documentaire.",
        'INS-0255': "Un document hétérogène devient difficile à maintenir et crée des divergences entre les pratiques de terrain et les référentiels.",
        'Plan de maintenance': "Le non-respect des échéances de maintenance accroît le risque de pannes imprévues et de dérives de réglage.",
        'INS-4622': "L'absence de traçabilité empêche de prouver le niveau réel de surveillance du process.",
        'INS-6348': "Des enregistrements incomplets réduisent la capacité d'analyse et fragilisent la démonstration de maîtrise du processus."
    };
    
    for (const [key, risk] of Object.entries(defaultRisks)) {
        if (ecart.exigence.includes(key)) return risk;
    }
    
    return "Impact à évaluer selon le contexte opérationnel.";
}

function normalizeAuditDataForEmbed(data) {
    const d = data || {};
    const pf = Array.isArray(d.pointsForts) ? d.pointsForts : [];

    const normalized = {
        metadata: {
            kicker: d.metadata?.kicker || '',
            auditNumber: d.metadata?.auditNumber || '',
            title: d.metadata?.title || '',
            team: d.metadata?.team || '',
            period: d.metadata?.period || '',
            reportDate: d.metadata?.reportDate || '',
            objective: d.metadata?.objective || '',
            perimeter: d.metadata?.perimeter || '',
            referentials: Array.isArray(d.metadata?.referentials) ? d.metadata.referentials : [],
            context: {
                poste: d.metadata?.context?.poste || '',
                article: d.metadata?.context?.article || '',
                operation: d.metadata?.context?.operation || ''
            }
        },
        summary: {
            pointFortCount: d.summary?.pointFortCount ?? pf.length,
            ecartCount: d.summary?.ecartCount ?? (d.ecarts?.length || 0),
            observationCount: d.summary?.observationCount ?? (d.observations?.length || 0),
            remarqueCount: d.summary?.remarqueCount ?? (d.remarques?.audites?.length || 0)
        },

        // ✅ Points forts
        pointsForts: pf.map((p, i) => ({
            number: p.number || (i + 1),
            titre: p.titre || '',
            constat: p.constat || ''
        })),

        ecarts: Array.isArray(d.ecarts) ? d.ecarts.map((e, i) => ({
            number: e.number || (i + 1),
            exigence: e.exigence || '',
            constat: e.constat || '',
            action: e.action || '',
            responsable: e.responsable || '',
            delai: e.delai || ''
        })) : [],

        observations: Array.isArray(d.observations) ? d.observations.map((o, i) => ({
            number: o.number || (i + 1),
            constat: o.constat || '',
            risque: o.risque || '',
            action: o.action || '',
            responsable: o.responsable || '',
            delai: o.delai || ''
        })) : [],

        remarques: {
            audites: Array.isArray(d.remarques?.audites) ? d.remarques.audites : [],
            reunion: Array.isArray(d.remarques?.reunion) ? d.remarques.reunion : []
        },

        auditedPersons: Array.isArray(d.auditedPersons) ? d.auditedPersons : [],
        distribution: Array.isArray(d.distribution) ? d.distribution : [],

        // ✅ images : on conserve tel quel (base64, alt, ecartNumber, observationNumber, pointFortNumber...)
        images: Array.isArray(d.images) ? d.images : [],

        // Conservés dans les données : survivent à l'enregistrement et au ré-import
        planActionRecipients: Array.isArray(d.planActionRecipients) ? d.planActionRecipients : [],

        cloture: {
            noteFinale: d.cloture?.noteFinale || '',
            prochainesEtapesTexte:
                typeof d.cloture?.prochainesEtapesTexte === 'string'
                    ? d.cloture.prochainesEtapesTexte
                    : Array.isArray(d.cloture?.prochainesEtapes)
                        ? d.cloture.prochainesEtapes.join('\n')
                        : ''
        }
    };

    return normalized;
}


// ✅ IMPORTANT: empêche la fermeture de </script> si texte contient cette séquence
function escapeHtmlJsonForScriptTag(obj) {
    const json = JSON.stringify(obj ?? {}, null, 0);
    // Remplace le caractère "<" par le caractère Unicode U+003C encodé en JSON
    // => la sortie contient réellement "\u003c"
    return json.split('<').join('\\u003c');
}




// ========================================
// SCRIPTS JAVASCRIPT 
// ========================================

/**
 * Destinataires du mail « Plan d'action » : saisis dans le formulaire
 * (data.planActionRecipients), sinon config.local.js (non versionné).
 * Jamais d'adresses dans le repo.
 */
function getPlanActionRecipients(data) {
    const fromData = data && Array.isArray(data.planActionRecipients)
        ? data.planActionRecipients.filter(r => typeof r === 'string' && r.trim())
        : [];
    if (fromData.length > 0) return fromData;

    const cfg = (typeof window !== 'undefined' && window.AUDIT_CONFIG) || {};
    return Array.isArray(cfg.planActionRecipients)
        ? cfg.planActionRecipients.filter(r => typeof r === 'string' && r.trim())
        : [];
}

function getScripts(recipients = []) {
  const RAW_SCRIPT = `
/* =========================================================
 IMAGES : src rempli depuis embedded-audit-data (copie unique).
 Doit s'exécuter avant l'observer d'images et la lightbox.
 ========================================================= */
(function () {
  try {
    var el = document.getElementById("embedded-audit-data");
    var data = JSON.parse((el && el.textContent) || "{}");
    var images = Array.isArray(data.images) ? data.images : [];
    document.querySelectorAll("img[data-img]").forEach(function (img) {
      var entry = images[parseInt(img.getAttribute("data-img"), 10)];
      if (entry && typeof entry.base64 === "string" && entry.base64.indexOf("data:image/") === 0) {
        img.src = entry.base64;
      }
    });
  } catch (e) {
    console.error("[audit] Images non chargées:", e);
  }
})();
/* =========================================================
 ANTI "PAGE BLANCHE" : si un script plante ou si
 IntersectionObserver n'existe pas dans le viewer (srcdoc),
 on force l'affichage des slides.
 ========================================================= */
(function () {
  try {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".slide").forEach(s => s.classList.add("visible"));
      document.querySelectorAll(".image-block img").forEach(img => img.classList.add("loaded"));
      console.warn("[audit] IntersectionObserver indisponible => fallback visible activé");
    }
  } catch (e) {
    try { document.querySelectorAll(".slide").forEach(s => s.style.opacity = "1"); } catch (_) {}
    console.error("[audit] Fallback visibilité a échoué:", e);
  }
})();
  
  // ========================================
  // NAVIGATION AVEC MODE PRÉSENTATION
  // ========================================
  (function() {
    "use strict";
    const slides = document.querySelectorAll(".slide");
    const totalSlides = slides.length;
    let currentSlide = 0;
    let isPresentationMode = false;
    let slideObserver = null;

	let isScrollMode = false;
    let scrollModeCooldown = false;
    const SCROLL_MODE_COOLDOWN_MS = 500;
    let scrollModeTouchStartY = null;

    const slideMenu = document.getElementById("slideMenu");
    const menuItems = document.querySelectorAll(".slide-menu-item");
    const dots = document.querySelectorAll(".nav-dot");
    const mobilePrev = document.getElementById("mobilePrev");
    const mobileNext = document.getElementById("mobileNext");
    const mobileCounter = document.getElementById("mobileCounter");
    const mobileNoteBtn = document.getElementById("mobileNoteBtn");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const presentationModeBtn = document.getElementById("presentationMode");

    // ----------------------------------------
    // ✅ Harmonisation notes: clé localStorage scoppée par audit
    // ----------------------------------------
    function getNotesStorageKeyFromDom() {
      try {
        const el = document.getElementById("embedded-audit-data");
        if (!el) return "audit-notes::sans-numero";
        const embedded = JSON.parse(el.textContent || "{}");
        const auditNumber = (embedded && embedded.metadata && embedded.metadata.auditNumber)
          ? String(embedded.metadata.auditNumber).trim()
          : "sans-numero";
        const safe = auditNumber || "sans-numero";
        return "audit-notes::" + safe;
      } catch (e) {
        return "audit-notes::sans-numero";
      }
    }

    function loadNotesCacheScoped() {
      const key = getNotesStorageKeyFromDom();
      try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }

    function updateMobileNoteHasState(slideNum) {
      if (!mobileNoteBtn) return;
      const notes = loadNotesCacheScoped();
      mobileNoteBtn.classList.toggle("has-note", !!(slideNum && notes[slideNum]));
    }

    function updateNavigation() {
      dots.forEach((dot, i) => dot.classList.toggle("active", i === currentSlide));
      menuItems.forEach((item, i) => item.classList.toggle("active", i === currentSlide));

      if (mobileCounter) {
        mobileCounter.textContent = (currentSlide + 1) + " / " + totalSlides;
      }
      if (mobilePrev) mobilePrev.disabled = currentSlide === 0;
      if (mobileNext) mobileNext.disabled = currentSlide === totalSlides - 1;

      const currentSlideEl = slides[currentSlide];
      const hasNotes = currentSlideEl.dataset.hasNotes === "true";
      
      if (mobileNoteBtn) {
        if (hasNotes) {
          mobileNoteBtn.classList.add("visible");
          const slideNum = currentSlideEl.dataset.slide;
          updateMobileNoteHasState(slideNum);
        } else {
          mobileNoteBtn.classList.remove("visible");
          mobileNoteBtn.classList.remove("has-note");
        }
      }

      try {
        history.replaceState(null, "", "#slide-" + (currentSlide + 1));
      } catch (e) {}
    }

    function goToSlide(index) {
      if (index < 0 || index >= totalSlides) return;
      
      if (isPresentationMode) {
        slides[currentSlide].classList.remove("active-slide");
        currentSlide = index;
        slides[currentSlide].classList.add("active-slide");
      } else {
        currentSlide = index;
        slides[index].scrollIntoView({ behavior: "smooth", block: "start" });
      }
      
      updateNavigation();
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    }

    function prevSlide() {
      if (currentSlide > 0) goToSlide(currentSlide - 1);
    }

    function enableScrollMode() {
      if (isScrollMode) return;
      isScrollMode = true;
	  
      if (slideObserver) {
        slideObserver.disconnect();
        slideObserver = null;
      }

      document.body.classList.add("scroll-mode-active");

      if (isPresentationMode) {
        isPresentationMode = false;
        document.body.classList.remove("presentation-mode");
        slides.forEach(s => s.classList.remove("active-slide"));
        const presentationBtn = document.getElementById("presentationMode");
        if (presentationBtn) {
          presentationBtn.textContent = "📽️ Mode Présentation";
          presentationBtn.classList.remove("active");
        }
        if (slides[currentSlide]) {
          slides[currentSlide].scrollIntoView({ behavior: "instant", block: "start" });
        }
      }

      const scrollBtn = document.getElementById("scrollModeToggle");
      if (scrollBtn) {
        scrollBtn.classList.add("active");
      }

      window.addEventListener("wheel", handleScrollModeWheel, { passive: false });
      window.addEventListener("touchstart", handleScrollModeTouchStart, { passive: true });
      window.addEventListener("touchmove", handleScrollModeTouchMove, { passive: false });
    }

    function disableScrollMode() {
      if (!isScrollMode) return;
      isScrollMode = false;

      document.body.classList.remove("scroll-mode-active");

      const scrollBtn = document.getElementById("scrollModeToggle");
      if (scrollBtn) {
        scrollBtn.classList.remove("active");
      }

      window.removeEventListener("wheel", handleScrollModeWheel);
      window.removeEventListener("touchstart", handleScrollModeTouchStart);
      window.removeEventListener("touchmove", handleScrollModeTouchMove);

      scrollModeTouchStartY = null;
      scrollModeCooldown = false;
    }

    function toggleScrollMode() {
      if (isScrollMode) {
        disableScrollMode();
      } else {
        enableScrollMode();
      }
    }

    function handleScrollModeWheel(e) {
      if (!isScrollMode) return;

      e.preventDefault();
      if (scrollModeCooldown) return;

      const delta = e.deltaY;
      if (delta > 30) {
        nextSlide();
        startScrollModeCooldown();
      } else if (delta < -30) {
        prevSlide();
        startScrollModeCooldown();
      }
    }

    function handleScrollModeTouchStart(e) {
      if (!isScrollMode) return;
      if (!e.touches || e.touches.length === 0) return;
      scrollModeTouchStartY = e.touches[0].clientY;
    }

    function handleScrollModeTouchMove(e) {
      if (!isScrollMode) return;
      if (scrollModeTouchStartY === null) return;

      const currentY = e.touches[0].clientY;
      const diffY = scrollModeTouchStartY - currentY;

      if (Math.abs(diffY) < 40) return;

      e.preventDefault();
      if (scrollModeCooldown) return;

      if (diffY > 0) nextSlide();
      else prevSlide();

      scrollModeTouchStartY = null;
      startScrollModeCooldown();
    }

    function startScrollModeCooldown() {
      scrollModeCooldown = true;
      setTimeout(() => {
        scrollModeCooldown = false;
      }, SCROLL_MODE_COOLDOWN_MS);
    }

    if (slideMenu && mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        slideMenu.classList.toggle("open");
      });
      document.addEventListener("click", (e) => {
        if (!slideMenu.contains(e.target) && e.target !== mobileMenuBtn) {
          slideMenu.classList.remove("open");
        }
      });
    }

    if (presentationModeBtn) {
      presentationModeBtn.addEventListener("click", () => {
        isPresentationMode = !isPresentationMode;
        document.body.classList.toggle("presentation-mode", isPresentationMode);
        
        if (isPresentationMode) {
          presentationModeBtn.textContent = "📖 Mode Lecture";
          presentationModeBtn.classList.add("active");
          slides[currentSlide].classList.add("active-slide");
        } else {
          presentationModeBtn.textContent = "📽️ Mode Présentation";
          presentationModeBtn.classList.remove("active");
          slides.forEach(s => s.classList.remove("active-slide"));
          slides[currentSlide].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

	const scrollModeBtn = document.getElementById("scrollModeToggle");
    if (scrollModeBtn) {
      scrollModeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleScrollMode();
      });
    }

    if (slideMenu) {
      menuItems.forEach((item, index) => {
        item.addEventListener("click", () => {
          goToSlide(index);
          slideMenu.classList.remove("open");
        });
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => goToSlide(index));
    });

    if (mobilePrev) mobilePrev.addEventListener("click", prevSlide);
    if (mobileNext) mobileNext.addEventListener("click", nextSlide);
    
    if (mobileNoteBtn) {
      mobileNoteBtn.addEventListener("click", () => {
        const slideNum = slides[currentSlide].dataset.slide;
        const noteContent = document.getElementById("note-" + slideNum);
        if (noteContent) noteContent.classList.toggle("visible");
        updateMobileNoteHasState(slideNum);
      });
    }

    document.addEventListener("keydown", (e) => {
      const tag = e.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); nextSlide(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevSlide(); }
      else if (e.key === "Home") { e.preventDefault(); goToSlide(0); }
      else if (e.key === "End") { e.preventDefault(); goToSlide(totalSlides - 1); }
      else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (presentationModeBtn) presentationModeBtn.click();
      }
    });

    if (!isPresentationMode && !isScrollMode) {
      slideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const slideIndex = parseInt(entry.target.dataset.slide, 10) - 1;
            if (slideIndex !== currentSlide) {
              currentSlide = slideIndex;
              updateNavigation();
            }
          }
        });
      }, { root: null, rootMargin: "-50% 0px -50% 0px", threshold: 0 });

      slides.forEach(slide => slideObserver.observe(slide));
    }

    window.addEventListener("load", () => {
      const hash = window.location.hash;
      if (hash) {
        const slideNum = parseInt(hash.replace("#slide-", ""), 10);
        if (slideNum && slideNum > 0 && slideNum <= totalSlides) {
          setTimeout(() => goToSlide(slideNum - 1), 100);
        }
      }
    });

    if (typeof Hammer !== "undefined") {
      const deck = document.querySelector(".deck");
      if (deck) {
        const hammer = new Hammer(deck);
        hammer.on("swipeleft", () => nextSlide());
        hammer.on("swiperight", () => prevSlide());
      }
    }

    updateNavigation();
  })();

  // ============================================
  // IMAGES - LAZY LOADING & ANIMATION
  // ============================================
  (function() {
    "use strict";
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.complete) {
            img.classList.add("loaded");
            imageObserver.unobserve(img);
          } else {
            img.addEventListener("load", () => {
              img.classList.add("loaded");
              imageObserver.unobserve(img);
            });
            img.addEventListener("error", () => {
              console.error("❌ Erreur chargement image:", img.src.substring(0, 50) + "...");
              img.alt = "⚠️ Image non disponible";
              img.classList.add("loaded");
              imageObserver.unobserve(img);
            });
          }
        }
      });
    }, { rootMargin: "50px", threshold: 0.1 });
    
    const allImages = document.querySelectorAll(".image-block img");
    allImages.forEach(img => imageObserver.observe(img));
    console.log("📷 Observer d'images initialisé pour", allImages.length, "images");
  })();

  // ========================================
  // ANIMATIONS
  // ========================================
  (function() {
    "use strict";
    const slideObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".slide").forEach(slide => slideObserver.observe(slide));

    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".timeline-item");
          items.forEach((item, index) => {
            setTimeout(() => item.classList.add("visible"), index * 200);
          });
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll(".timeline").forEach(timeline => timelineObserver.observe(timeline));
  })();

  // ========================================
  // COUNTUP & BARRES
  // ========================================
  (function() {
    "use strict";
    if (typeof CountUp === "undefined") {
      document.querySelectorAll("[data-countup]").forEach(el => {
        el.textContent = parseInt(el.dataset.countup, 10);
      });
    } else {
      const kpiObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target;
            const endValue = parseInt(target.dataset.countup, 10);
            const countUp = new CountUp(target, endValue, { duration: 2, useEasing: true, useGrouping: false });
            if (!countUp.error) countUp.start();
            else target.textContent = endValue;
            kpiObserver.unobserve(target);
          }
        });
      }, { threshold: 0.5 });
      document.querySelectorAll("[data-countup]").forEach(el => kpiObserver.observe(el));
    }

    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const width = bar.dataset.width;
          setTimeout(() => { bar.style.width = width + "%"; }, 300);
          barObserver.unobserve(bar);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll(".bar-fill").forEach(bar => barObserver.observe(bar));
  })();

  // ========================================
  // LIGHTBOX
  // ========================================
  (function() {
    "use strict";
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");
    const lightboxCounter = document.getElementById("lightboxCounter");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const zoomIn = document.getElementById("zoomIn");
    const zoomOut = document.getElementById("zoomOut");
    const zoomReset = document.getElementById("zoomReset");
    const zoomLevel = document.getElementById("zoomLevel");

    let currentImages = [], currentIndex = 0, currentScale = 1;
    let isDragging = false, startX, startY, translateX = 0, translateY = 0;

    function getImagesFromSlide(slideElement) {
      return Array.from(slideElement.querySelectorAll(".zoomable"));
    }

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("zoomable")) {
        const slide = e.target.closest(".slide");
        currentImages = getImagesFromSlide(slide);
        currentIndex = currentImages.indexOf(e.target);
        openLightbox();
      }
    });

    function openLightbox() {
      if (currentImages.length === 0) return;
      updateLightboxImage();
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      resetZoom();
      lightboxImg.onerror = () => {
        console.error("❌ Erreur chargement image lightbox:", lightboxImg.src.substring(0, 50));
        lightboxCaption.textContent = "⚠️ Image non disponible";
      };
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      resetZoom();
    }

    function updateLightboxImage() {
      const img = currentImages[currentIndex];
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "";
      lightboxCaption.textContent = img.dataset.caption || img.alt || "";
      lightboxCounter.textContent = (currentIndex + 1) + " / " + currentImages.length;
      lightboxPrev.disabled = currentIndex === 0;
      lightboxNext.disabled = currentIndex === currentImages.length - 1;
    }

    function nextImage() {
      if (currentIndex < currentImages.length - 1) {
        currentIndex++;
        updateLightboxImage();
        resetZoom();
      }
    }

    function prevImage() {
      if (currentIndex > 0) {
        currentIndex--;
        updateLightboxImage();
        resetZoom();
      }
    }

    function updateZoom() {
      lightboxImg.style.transform = "translate(" + translateX + "px, " + translateY + "px) scale(" + currentScale + ")";
      if (zoomLevel) zoomLevel.textContent = Math.round(currentScale * 100) + "%";
    }

    function resetZoom() {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      updateZoom();
    }

    if (zoomIn) zoomIn.addEventListener("click", () => { currentScale = Math.min(currentScale + 0.25, 4); updateZoom(); });
    if (zoomOut) zoomOut.addEventListener("click", () => { currentScale = Math.max(currentScale - 0.25, 0.5); updateZoom(); });
    if (zoomReset) zoomReset.addEventListener("click", resetZoom);

    lightboxImg.addEventListener("wheel", (e) => {
      e.preventDefault();
      currentScale = e.deltaY < 0 ? Math.min(currentScale + 0.1, 4) : Math.max(currentScale - 0.1, 0.5);
      updateZoom();
    });

    lightboxImg.addEventListener("mousedown", (e) => {
      if (currentScale > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        lightboxImg.classList.add("dragging");
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateZoom();
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      lightboxImg.classList.remove("dragging");
    });

    if (typeof Hammer !== "undefined") {
      const hammer = new Hammer(lightboxImg);
      hammer.get("pinch").set({ enable: true });
      let lastScale = 1;
      hammer.on("pinchstart", () => { lastScale = currentScale; });
      hammer.on("pinch", (e) => {
        currentScale = Math.max(0.5, Math.min(lastScale * e.scale, 4));
        updateZoom();
      });
    }

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", prevImage);
    if (lightboxNext) lightboxNext.addEventListener("click", nextImage);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") { e.preventDefault(); nextImage(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevImage(); }
    });
  })();

  // ========================================
  // THÈME
  // ========================================
  (function() {
    "use strict";
    const root = document.documentElement;
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    const saved = localStorage.getItem("audit-theme");
    
    if (saved === "dark") {
      root.setAttribute("data-theme", "dark");
      btn.textContent = "☀️ Clair";
    } else {
      btn.textContent = "🌓 Sombre";
    }

    btn.addEventListener("click", () => {
      const isDark = root.getAttribute("data-theme") === "dark";
      document.body.style.transition = "background 0.5s ease";
      if (isDark) {
        root.removeAttribute("data-theme");
        localStorage.setItem("audit-theme", "light");
        btn.textContent = "🌓 Sombre";
      } else {
        root.setAttribute("data-theme", "dark");
        localStorage.setItem("audit-theme", "dark");
        btn.textContent = "☀️ Clair";
      }
      setTimeout(() => { document.body.style.transition = ""; }, 500);
    });
  })();

  // ========================================
  // TAILLE POLICE
  // ========================================
  (function() {
    "use strict";
    const root = document.documentElement;
    const fontDecrease = document.getElementById("fontDecrease");
    const fontNormal = document.getElementById("fontNormal");
    const fontIncrease = document.getElementById("fontIncrease");
    if (!fontDecrease || !fontNormal || !fontIncrease) return;
    const buttons = [fontDecrease, fontNormal, fontIncrease];

    function setFontSize(size) {
      root.removeAttribute("data-font-size");
      buttons.forEach(btn => btn.classList.remove("active"));
      if (size === "small") {
        root.setAttribute("data-font-size", "small");
        fontDecrease.classList.add("active");
      } else if (size === "large") {
        root.setAttribute("data-font-size", "large");
        fontIncrease.classList.add("active");
      } else {
        fontNormal.classList.add("active");
      }
      localStorage.setItem("audit-font-size", size);
    }

    fontDecrease.addEventListener("click", () => setFontSize("small"));
    fontNormal.addEventListener("click", () => setFontSize("normal"));
    fontIncrease.addEventListener("click", () => setFontSize("large"));
    
    const savedSize = localStorage.getItem("audit-font-size") || "normal";
    setFontSize(savedSize);
  })();

  // ========================================
  // TOOLBAR
  // ========================================
  (function() {
    "use strict";
    const toolbarToggle = document.getElementById("toolbarToggle");
    const toolbarContent = document.getElementById("toolbarContent");
    if (!toolbarToggle || !toolbarContent) return;

    toolbarToggle.addEventListener("click", () => toolbarContent.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      const toolbar = document.querySelector(".toolbar");
      if (!toolbar || !toolbar.contains(e.target)) {
        if (toolbarContent.classList.contains("open")) {
          toolbarContent.classList.remove("open");
        }
      }
    });
  })();

  // ========================================
  // NOTES STRUCTURÉES (✅ source de vérité = __AUDIT_DATA__)
  // + localStorage scoppé par audit
  // + ✅ migration des notes si ajout de points forts (décalage de slides)
  // ========================================
  (function() {
    "use strict";

    function loadEmbeddedAuditData() {
      const el = document.getElementById("embedded-audit-data");
      if (!el) return null;
      try {
        return JSON.parse(el.textContent || "{}");
      } catch (e) {
        console.error("❌ embedded-audit-data invalide:", e);
        return null;
      }
    }

    function normalizeCloture(d) {
      d.cloture = d.cloture || {};
      if (typeof d.cloture.prochainesEtapesTexte !== "string") {
        if (Array.isArray(d.cloture.prochainesEtapes)) {
          d.cloture.prochainesEtapesTexte = d.cloture.prochainesEtapes.join("\\n");
        } else {
          d.cloture.prochainesEtapesTexte = "";
        }
      }
      if (typeof d.cloture.noteFinale !== "string") d.cloture.noteFinale = "";
      return d;
    }

    function normalizePointsForts(d) {
      d.pointsForts = Array.isArray(d.pointsForts) ? d.pointsForts : [];
      d.pointsForts = d.pointsForts.map((p, i) => ({
        number: p.number || (i + 1),
        titre: p.titre || "",
        constat: p.constat || ""
      }));
      return d;
    }

    function normalizeObservations(d) {
      d.observations = Array.isArray(d.observations) ? d.observations : [];
      d.observations = d.observations.map((o, i) => ({
        number: o.number || (i + 1),
        constat: o.constat || "",
        risque: o.risque || "",
        action: o.action || "",
        responsable: o.responsable || "",
        delai: o.delai || ""
      }));
      return d;
    }

    function normalizeEcarts(d) {
      d.ecarts = Array.isArray(d.ecarts) ? d.ecarts : [];
      d.ecarts = d.ecarts.map((e, i) => ({
        number: e.number || (i + 1),
        exigence: e.exigence || "",
        constat: e.constat || "",
        action: e.action || "",
        responsable: e.responsable || "",
        delai: e.delai || ""
      }));
      return d;
    }

    function buildStorageKey(auditNumber) {
      const safe = (auditNumber || "sans-numero").toString().trim() || "sans-numero";
      return "audit-notes::" + safe;
    }

    const embedded = loadEmbeddedAuditData();
    const baseData = embedded || {};
    baseData.metadata = baseData.metadata || {};
    normalizePointsForts(baseData);
    normalizeEcarts(baseData);
    normalizeObservations(baseData);
    normalizeCloture(baseData);

    window.__AUDIT_DATA__ = baseData;

    const STORAGE_KEY = buildStorageKey(window.__AUDIT_DATA__.metadata.auditNumber);

    // ----------------------------------------
    // Brouillon de secours : toutes les notes saisies, sauvegardées à chaque
    // « Enregistrer » d'une note. Restauré à l'ouverture si le fichier n'a pas
    // été ré-enregistré depuis (fermeture accidentelle, crash...).
    // L'empreinte évite d'appliquer un brouillon à un rapport régénéré
    // dont les écarts/observations ont changé.
    // ----------------------------------------
    const DRAFT_KEY = "audit-draft::" + STORAGE_KEY;

    function hashString(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
      return h.toString(36);
    }

    function getStructureFingerprint(d) {
      return hashString(JSON.stringify([
        d.ecarts.map(e => [e.exigence, e.constat]),
        d.observations.map(o => [o.constat, o.risque])
      ]));
    }

    function extractNotes(d) {
      const pick = (x) => ({ action: x.action || "", responsable: x.responsable || "", delai: x.delai || "" });
      return {
        ecarts: d.ecarts.map(pick),
        observations: d.observations.map(pick),
        cloture: {
          noteFinale: d.cloture.noteFinale || "",
          prochainesEtapesTexte: d.cloture.prochainesEtapesTexte || ""
        }
      };
    }

    function applyNotes(d, notes) {
      (notes.ecarts || []).forEach((n, i) => { if (d.ecarts[i]) Object.assign(d.ecarts[i], n); });
      (notes.observations || []).forEach((n, i) => { if (d.observations[i]) Object.assign(d.observations[i], n); });
      if (notes.cloture) Object.assign(d.cloture, notes.cloture);
    }

    function saveDraft() {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          savedAt: new Date().toISOString(),
          fingerprint: getStructureFingerprint(window.__AUDIT_DATA__),
          notes: extractNotes(window.__AUDIT_DATA__)
        }));
      } catch (e) {
        console.error("Erreur sauvegarde brouillon:", e);
      }
      window.__AUDIT_DIRTY__ = true;
    }

    window.__AUDIT_CLEAR_DRAFT__ = function () {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      window.__AUDIT_DIRTY__ = false;
    };

    (function restoreDraftIfAny() {
      let draft = null;
      try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) {}
      if (!draft || !draft.notes) return;

      const current = window.__AUDIT_DATA__;
      if (draft.fingerprint !== getStructureFingerprint(current)) return;
      if (JSON.stringify(draft.notes) === JSON.stringify(extractNotes(current))) return;

      const when = draft.savedAt ? new Date(draft.savedAt).toLocaleString("fr-FR") : "?";
      if (confirm("Des notes saisies le " + when + " n'ont pas été enregistrées dans ce fichier.\\n\\nLes restaurer ?")) {
        applyNotes(current, draft.notes);
        window.__AUDIT_DIRTY__ = true;
      } else {
        window.__AUDIT_CLEAR_DRAFT__();
      }
    })();

    function loadNotesCache() {
      const saved = localStorage.getItem(STORAGE_KEY);
      try {
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        console.error("Erreur parsing notes cache:", e);
        return {};
      }
    }
    function saveNotesCache(notes) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error("Erreur sauvegarde notes cache:", e);
      }
    }

    function migrateNotesIfNeeded(notesCache) {
      const pfCount = window.__AUDIT_DATA__.pointsForts.length || 0;
      if (pfCount <= 0) return { notes: notesCache, migrated: false };

      const migratedNotes = {};
      let didMigrate = false;

      Object.keys(notesCache || {}).forEach((k) => {
        const slideNum = parseInt(k, 10);
        const val = notesCache[k];

        if (!Number.isFinite(slideNum) || slideNum <= 1) {
          migratedNotes[k] = val;
          return;
        }

        const newKey = String(slideNum + pfCount);
        migratedNotes[newKey] = val;
        didMigrate = true;
      });

      return { notes: didMigrate ? migratedNotes : notesCache, migrated: didMigrate };
    }

    // migrateNotesIfNeeded() n'est plus appelée : elle n'était pas idempotente
    // (clés décalées de +pfCount à chaque ouverture du rapport).
    let notesCache = loadNotesCache();

    function setHasNote(btn, has) {
      if (!btn) return;
      btn.classList.toggle("has-note", !!has);
    }

    function updateMobileNoteButtonFromCache() {
      const mobileNoteBtn = document.getElementById("mobileNoteBtn");
      if (!mobileNoteBtn) return;
      const currentSlideEl = document.querySelector(".slide.visible") || document.querySelector(".slide");
      const slideNum = currentSlideEl ? currentSlideEl.dataset.slide : null;
      mobileNoteBtn.classList.toggle("has-note", !!(slideNum && notesCache[slideNum]));
    }

    function getPointFortCount() {
      return window.__AUDIT_DATA__.pointsForts ? window.__AUDIT_DATA__.pointsForts.length : 0;
    }

    function getEcartIndexFromSlide(slideNum) {
      const pfCount = getPointFortCount();
      const idx = parseInt(slideNum, 10) - (2 + pfCount);
      if (Number.isNaN(idx)) return -1;
      return (idx >= 0 && idx < window.__AUDIT_DATA__.ecarts.length) ? idx : -1;
    }

    function getObsIndexFromSlide(slideNum) {
      const pfCount = getPointFortCount();
      const firstObsSlide = 2 + pfCount + window.__AUDIT_DATA__.ecarts.length;
      const idx = parseInt(slideNum, 10) - firstObsSlide;
      if (Number.isNaN(idx)) return -1;
      return (idx >= 0 && idx < window.__AUDIT_DATA__.observations.length) ? idx : -1;
    }

    function updateActionDisplay(noteContent, action, responsable, delai) {
      const displayAction = noteContent.querySelector(".note-display-action");
      const displayResp   = noteContent.querySelector(".note-display-responsable");
      const displayDelai  = noteContent.querySelector(".note-display-delai");
      if (displayAction) displayAction.textContent = action || "";
      if (displayResp)   displayResp.textContent   = responsable || "";
      if (displayDelai)  displayDelai.textContent  = delai || "";
    }

    function updateClosingDisplays(noteContent, noteFinale, prochainesEtapesTexte) {
      const displayClosing = noteContent.querySelector(".note-display-closing-notes");
      const displaySteps = noteContent.querySelector(".note-display-closing-steps");
      if (displayClosing) displayClosing.textContent = noteFinale || "(Aucune note enregistrée)";
      if (displaySteps) displaySteps.textContent = prochainesEtapesTexte || "";

      const closingNotesContent = document.getElementById("closing-notes-content");
      if (closingNotesContent) closingNotesContent.textContent = noteFinale || "";

      const closingStepsContent = document.getElementById("closing-steps-content");
      if (closingStepsContent) closingStepsContent.textContent = prochainesEtapesTexte || "";
    }

    document.querySelectorAll(".note-toggle-btn").forEach(btn => {
      const slideNum = btn.dataset.slide;
      const noteContent = document.getElementById("note-" + slideNum);
      if (!noteContent) return;

      const closingTextarea  = noteContent.querySelector(".note-closing-notes");
      const closingStepsArea = noteContent.querySelector(".note-closing-steps");
      const closing = !!closingTextarea || !!closingStepsArea;

      if (closing) {
        const nf = window.__AUDIT_DATA__.cloture?.noteFinale || "";
        const pe = window.__AUDIT_DATA__.cloture?.prochainesEtapesTexte || "";

        if (closingTextarea) closingTextarea.value = nf;
        if (closingStepsArea) closingStepsArea.value = pe;
        updateClosingDisplays(noteContent, nf, pe);

        const has = !!(nf.trim() || pe.trim());
        notesCache[slideNum] = has ? { closingNotes: nf, closingSteps: pe } : undefined;
        if (!has) delete notesCache[slideNum];
        setHasNote(btn, has);
      } else {
        const ecIdx = getEcartIndexFromSlide(slideNum);
        const obIdx = getObsIndexFromSlide(slideNum);

        let a = "", r = "", d = "";
        if (ecIdx !== -1) {
          const e = window.__AUDIT_DATA__.ecarts[ecIdx];
          a = e.action || ""; r = e.responsable || ""; d = e.delai || "";
        } else if (obIdx !== -1) {
          const o = window.__AUDIT_DATA__.observations[obIdx];
          a = o.action || ""; r = o.responsable || ""; d = o.delai || "";
        }

        const actionInput = noteContent.querySelector(".note-action");
        const respInput   = noteContent.querySelector(".note-responsable");
        const delaiInput  = noteContent.querySelector(".note-delai");
        if (actionInput) actionInput.value = a;
        if (respInput) respInput.value = r;
        if (delaiInput) delaiInput.value = d;
        updateActionDisplay(noteContent, a, r, d);

        const has = !!(a.trim() || r.trim() || d.trim());
        notesCache[slideNum] = has ? { action: a, responsable: r, delai: d } : undefined;
        if (!has) delete notesCache[slideNum];
        setHasNote(btn, has);
      }

      btn.addEventListener("click", () => {
        const isVisible = noteContent.classList.contains("visible");
        document.querySelectorAll(".note-content").forEach(nc => nc.classList.remove("visible"));
        if (!isVisible) noteContent.classList.add("visible");
      });

      const saveBtn = noteContent.querySelector(".note-save");
      const cancelBtn = noteContent.querySelector(".note-cancel");
      if (!saveBtn || !cancelBtn) return;

      saveBtn.addEventListener("click", () => {
        if (closing) {
          const nf = closingTextarea ? closingTextarea.value : "";
          const pe = closingStepsArea ? closingStepsArea.value : "";

          window.__AUDIT_DATA__.cloture = window.__AUDIT_DATA__.cloture || {};
          window.__AUDIT_DATA__.cloture.noteFinale = nf;
          window.__AUDIT_DATA__.cloture.prochainesEtapesTexte = pe;

          updateClosingDisplays(noteContent, nf, pe);

          const has = !!(nf.trim() || pe.trim());
          if (has) notesCache[slideNum] = { closingNotes: nf, closingSteps: pe };
          else delete notesCache[slideNum];

          saveNotesCache(notesCache);
          saveDraft();
          setHasNote(btn, has);
          noteContent.classList.remove("visible");
          updateMobileNoteButtonFromCache();
          return;
        }

        const actionInput = noteContent.querySelector(".note-action");
        const respInput   = noteContent.querySelector(".note-responsable");
        const delaiInput  = noteContent.querySelector(".note-delai");

        const action = actionInput ? actionInput.value.trim() : "";
        const responsable = respInput ? respInput.value.trim() : "";
        const delai = delaiInput ? delaiInput.value.trim() : "";

        const ecIdx = getEcartIndexFromSlide(slideNum);
        const obIdx = getObsIndexFromSlide(slideNum);

        if (ecIdx !== -1) {
          const e = window.__AUDIT_DATA__.ecarts[ecIdx];
          e.action = action; e.responsable = responsable; e.delai = delai;
        } else if (obIdx !== -1) {
          const o = window.__AUDIT_DATA__.observations[obIdx];
          o.action = action; o.responsable = responsable; o.delai = delai;
        }

        updateActionDisplay(noteContent, action, responsable, delai);

        const has = !!(action || responsable || delai);
        if (has) notesCache[slideNum] = { action, responsable, delai };
        else delete notesCache[slideNum];

        saveNotesCache(notesCache);
        saveDraft();
        setHasNote(btn, has);
        noteContent.classList.remove("visible");
        updateMobileNoteButtonFromCache();
      });

      cancelBtn.addEventListener("click", () => {
        const cached = notesCache[slideNum] || {};

        if (closing) {
          const nf = typeof cached.closingNotes === "string" ? cached.closingNotes : (window.__AUDIT_DATA__.cloture?.noteFinale || "");
          const pe = typeof cached.closingSteps === "string" ? cached.closingSteps : (window.__AUDIT_DATA__.cloture?.prochainesEtapesTexte || "");

          if (closingTextarea) closingTextarea.value = nf;
          if (closingStepsArea) closingStepsArea.value = pe;
          updateClosingDisplays(noteContent, nf, pe);

          noteContent.classList.remove("visible");
          return;
        }

        const action = cached.action || "";
        const responsable = cached.responsable || "";
        const delai = cached.delai || "";

        const actionInput = noteContent.querySelector(".note-action");
        const respInput   = noteContent.querySelector(".note-responsable");
        const delaiInput  = noteContent.querySelector(".note-delai");
        if (actionInput) actionInput.value = action;
        if (respInput) respInput.value = responsable;
        if (delaiInput) delaiInput.value = delai;

        updateActionDisplay(noteContent, action, responsable, delai);
        noteContent.classList.remove("visible");
      });
    });

    const exportBtn = document.getElementById("exportJson");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        try {
          const dataToExport = window.__AUDIT_DATA__ || {};
          const auditNumber = (dataToExport.metadata && dataToExport.metadata.auditNumber)
            ? String(dataToExport.metadata.auditNumber).trim()
            : "sans-numero";

          const fileName = "Plan d'action audit " + auditNumber + ".json";
          const json = JSON.stringify(dataToExport, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);

          const to = PLAN_ACTION_RECIPIENTS.join(";");

          const subject = "Plan d'action de l'audit " + auditNumber;
          const body = "Veuillez joindre le fichier .json téléchargé avec votre e-mail";

          const mailto =
            "mailto:" + encodeURIComponent(to) +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);

          window.location.href = mailto;

        } catch (e) {
          console.error("❌ Export Plan d'action impossible:", e);
          alert("❌ Export Plan d'action impossible : " + e.message);
        }
      });
    }

    updateMobileNoteButtonFromCache();
  })();

  // ========================================
  // ENREGISTRER LE RAPPORT (HTML autonome avec les notes intégrées)
  // Remplace le cycle export JSON -> générateur -> nouveau HTML.
  // ========================================
  (function() {
    "use strict";
    const saveBtn = document.getElementById("saveReport");
    if (!saveBtn) return;

    let fileHandle = null; // réutilisé : les enregistrements suivants écrasent le même fichier

    function buildReportHtml() {
      const doc = new DOMParser().parseFromString(__PRISTINE_HTML__, "text/html");
      const dataEl = doc.getElementById("embedded-audit-data");
      if (!dataEl) throw new Error("Bloc embedded-audit-data introuvable");
      // "<" échappé : le contenu d'un <script> est sérialisé tel quel
      dataEl.textContent = JSON.stringify(window.__AUDIT_DATA__)
        .split("<").join(String.fromCharCode(92) + "u003c");
      return "<!DOCTYPE html>\\n" + doc.documentElement.outerHTML;
    }

    function getFileName() {
      const n = (window.__AUDIT_DATA__.metadata && window.__AUDIT_DATA__.metadata.auditNumber) || "sans-numero";
      return "Rapport d'audit " + String(n).trim() + ".html";
    }

    function downloadFallback(html) {
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    async function saveReport() {
      const html = buildReportHtml();

      // Chrome/Edge : choix de l'emplacement une fois, puis écrasement direct
      if (window.showSaveFilePicker) {
        try {
          if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
              suggestedName: getFileName(),
              types: [{ description: "Rapport HTML", accept: { "text/html": [".html"] } }]
            });
          }
          const writable = await fileHandle.createWritable();
          await writable.write(html);
          await writable.close();
        } catch (e) {
          if (e && e.name === "AbortError") return; // annulé par l'utilisateur
          console.warn("Enregistrement direct impossible, téléchargement:", e);
          fileHandle = null;
          downloadFallback(html);
        }
      } else {
        downloadFallback(html); // Firefox/Safari : fichier dans Téléchargements
      }

      window.__AUDIT_CLEAR_DRAFT__();
      const label = saveBtn.textContent;
      saveBtn.textContent = "✅ Enregistré";
      setTimeout(() => { saveBtn.textContent = label; }, 1500);
    }

    saveBtn.addEventListener("click", () => {
      saveReport().catch((e) => {
        console.error("❌ Enregistrement impossible:", e);
        alert("❌ Enregistrement impossible : " + e.message);
      });
    });

    // Raccourci Ctrl+S / Cmd+S
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveBtn.click();
      }
    });

    // Alerte à la fermeture s'il reste des notes non enregistrées dans le fichier
    // (uniquement en autonome : pas dans l'aperçu du générateur)
    if (window.top === window) {
      window.addEventListener("beforeunload", (e) => {
        if (!window.__AUDIT_DIRTY__) return;
        e.preventDefault();
        e.returnValue = "";
      });
    }
  })();

  // ========================================
  // EXPORT PDF
  // ========================================
  (function() {
    "use strict";
    const printBtn = document.getElementById("printPDF");
    if (!printBtn) return;
    printBtn.addEventListener("click", () => {
      setTimeout(() => window.print(), 100);
    });
  })();
`;

  // Préambule injecté hors template literal :
  // - __PRISTINE_HTML__ : DOM d'origine, avant toute modif du runtime, base de « Enregistrer le rapport »
  // - PLAN_ACTION_RECIPIENTS : destinataires issus de config.local.js
  const PREAMBLE =
    'var __PRISTINE_HTML__ = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;\n' +
    'var PLAN_ACTION_RECIPIENTS = ' + JSON.stringify(recipients).split('<').join('\\u003c') + ';\n';

  const safeJs = (PREAMBLE + RAW_SCRIPT)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
    .replace(/\uFEFF/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "");

  // ✅ Empêche uniquement </script> de casser le HTML
  const embedded = safeJs.replace(/<\/script/gi, "<\\/script");

  return `
<script id="embedded-audit-scripts" type="application/json">${embedded}</script>
<script>
(function(){
  try {
    var el = document.getElementById("embedded-audit-scripts");
    if(!el) return;
    var code = el.textContent || "";
    if(!code.trim()) return;

    var wrapped = code + "\\n//# sourceURL=audit-runtime.js";
    new Function(wrapped)();

  } catch(e) {
    console.error("❌ Script audit impossible à exécuter:", e);
  }
})();
</script>
`;
}



// Export de la fonction principale
window.generateAuditReport = generateAuditReport;
