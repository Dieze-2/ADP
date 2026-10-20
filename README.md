# ADP

Générateur de rapports d'audit HTML (Word / JSON / HTML → rapport autonome).

## Destinataires du plan d'action

Saisis dans l'éditeur (section Clôture, champ « Destinataires du plan d'action »).
Ils sont intégrés au rapport : quiconque ouvre le HTML et clique sur « Export Plan d'action » a le mail pré-rempli, sans configuration.
La dernière saisie est mémorisée dans le navigateur du créateur pour les rapports suivants.

Optionnel : valeur par défaut via `config.local.js` (copie de `config.example.js`, ignoré par git).
Aucune adresse n'est stockée dans le repo.

## Notes en réunion

Dans le rapport généré : saisir les notes, puis **💾 Enregistrer le rapport** (ou Ctrl+S).
Le fichier HTML enregistré contient les notes ; il se ré-ouvre et se ré-importe tel quel.
Chrome/Edge : l'emplacement est demandé une fois, les enregistrements suivants écrasent le même fichier.
Firefox : le fichier est téléchargé à chaque enregistrement.

Filet de sécurité : chaque note enregistrée est aussi gardée dans le navigateur ;
si le rapport est fermé sans enregistrer, la restauration est proposée à la réouverture.
