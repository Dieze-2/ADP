# ADP

Générateur de rapports d'audit HTML (Word / JSON / HTML → rapport autonome).

## Configuration

Copier `config.example.js` en `config.local.js` et y renseigner les destinataires du plan d'action.
`config.local.js` est ignoré par git : les adresses ne sont jamais publiées.

## Notes en réunion

Dans le rapport généré : saisir les notes, puis **💾 Enregistrer le rapport** (ou Ctrl+S).
Le fichier HTML enregistré contient les notes ; il se ré-ouvre et se ré-importe tel quel.
Chrome/Edge : l'emplacement est demandé une fois, les enregistrements suivants écrasent le même fichier.
Firefox : le fichier est téléchargé à chaque enregistrement.

Filet de sécurité : chaque note enregistrée est aussi gardée dans le navigateur ;
si le rapport est fermé sans enregistrer, la restauration est proposée à la réouverture.
