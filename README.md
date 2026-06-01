# Estimation foncière (méthode résiduelle USPI)

Outil d'estimation de terrains à bâtir pour le canton de Vaud (extensible Genève, Fribourg).
Site statique, aucun serveur : tous les calculs tournent dans le navigateur, les dossiers et
comparables sont stockés en `localStorage`, le PDF est produit via l'impression du navigateur.

## Lancer en local

```powershell
# depuis le dossier "Dev foncier"
python -m http.server 5180
# puis ouvrir http://localhost:5180
```

## Ergonomie : façade simple + mode expert

À l'ouverture, écran unique épuré : quatre champs (commune, surface, indice CUS/IUS, prix
au m² SBP) et le résultat mis en avant (fourchette prudente / réaliste / potentiel, barre
visuelle, bouton « être rappelé » si un email de contact est renseigné). Toute la mécanique
USPI (réglages détaillés et onglets Synthèse / Détail / Acquéreur / Communes / Comparables /
Avis) est repliée derrière le bouton **Mode expert**, destiné au courtier lors du rappel.

## Conformité à la méthode USPI

Méthode fidèle aux supports Immodéveloppement 1 (USPI) :
- Carvalho, Introduction : *Valeur du terrain = Produit de vente − Prix de revient − Risques et bénéfices*, « de manière sommaire et avec prudence ».
- Delacrétaz, Faisabilité : prix de revient CFC 0 (terrain + frais d'acquisition ~5%), CFC 1, CFC 2 (cube SIA 116 × prix au m³, différencié habitation/sous-sol/parking), CFC 4 (~120 CHF/m²), CFC 5 (~7%). Précision SIA 102 : ±15% avant-projet, ±10% projet.

## Architecture des fichiers

| Fichier      | Rôle |
|--------------|------|
| `data.js`    | Données de référence : défauts USPI, dégressivité, base de communes, scénarios, glossaire. |
| `calc.js`    | Moteur de calcul résiduel, pur et sans DOM. C'est la « base ». Testable seul. |
| `app.js`     | Interface interactive : saisie, vues, persistance, comparables, PDF. |
| `index.html` | Structure et onglets. |
| `styles.css` | Design éditorial + feuille d'impression A4 une page. |

## Méthode

```
Recette vente     = SBP x (prix réf. au m² SBP x % dégressivité par taille de programme)
Terrain défendable = Recette vente
                   - (Coûts construction + Frais commercialisation
                      + Marge acquéreur + Frais PPE éventuels)
puis abattement servitudes.
```

Points clés du modèle :

- Le prix de vente est exprimé en **CHF par m² de SBP** (pas au m² habitable).
- La **dégressivité s'applique à la SBP du programme par unité**. C'est la variable
  critique : un programme de petites unités (mitoyennes) se vend plus cher au m² qu'une
  grande villa unique.
- Les **frais d'acquisition du terrain n'entament pas** le terrain défendable. Ils ne
  servent que dans la vue acquéreur (coût de revient).
- La **marge est définie par niveau** (éditable Prudente / Réaliste / Optimale).

Trois niveaux de valorisation, pensés côté propriétaire et alignés sur la logique d'un
promoteur (outil orienté génération de lead : le client clique, le courtier rappelle) :

- **Prudente (plancher)** : villa unique, 70% SBP, marge promoteur 15%. Minimum défendable.
- **Réaliste (cœur de marché)** : deux logements mitoyens, 100% SBP, marge 15%. Valeur la plus probable.
- **Optimale (potentiel)** : deux mitoyens, 100% SBP, marge resserrée 10%. Haut de fourchette crédible et tenable.

## Validation Bavois 1181

Avec les paramètres du dossier d'origine (600 m², IUS 0.5, prix réf. 7'250 CHF/m² SBP,
coût 1'000 CHF/m³, ratio volume/SBP 4), l'application retrouve :

| Niveau | Terrain défendable |
|--------|--------------------|
| Prudente (plancher) | ~207'000 |
| Réaliste (cœur de marché) | ~467'000 |
| Optimale (potentiel, marge 10%) | ~579'000 |

Soit une fourchette client de l'ordre de 200'000 à 580'000 CHF, valeur réaliste 470'000.
Dans l'onglet Avis, ces trois bornes se pré-remplissent automatiquement et restent
ajustables manuellement avant d'afficher au client.

## Leviers de calibrage

Pour un autre dossier, par ordre d'impact : **prix de référence au m² SBP** et **tableau
de dégressivité**, puis **coût au m³** et **ratio volume/SBP**, puis **marges par
niveau**, enfin **abattement servitudes** et **niveaux habitables** (emprise au sol).
Toutes ces cellules sont éditables (surbrillance jaune) et le détail par scénario montre
chaque ligne CFC.

## Base de communes (onglet Communes)

Vous saisissez vos propres données par commune (prix au m² SBP, IUS village, hauteur
corniche, surface min, notes). Elles sont fusionnées avec les communes de base : une
commune ajoutée ou modifiée surcharge la base, et la sélection d'une commune dans un
dossier pré-remplit ces références (surchargeables au cas par cas). Les notes de commune
s'affichent sous le champ commune.

## Persistance et déploiement

- Dossiers : `localStorage` clé `uspi_dossiers` (+ export/import JSON par dossier).
- Comparables : `localStorage` clé `uspi_comparables`.
- Communes : `localStorage` clé `uspi_communes` (surcharges et ajouts sur la base).
- Déploiement : copier les fichiers sur n'importe quel hébergement statique
  (GitHub Pages, comme le calculateur d'impôt voisin).

## Conformité

- Cours USPI Jean-Christophe Delacrétaz, Faisabilité du projet, Immodéveloppement 1.
- Jurisprudence TF 4C.424/2004 et 4A_457/2017 (devoir d'information sur la marge de tolérance).
- Norme SIA 102 art. 4.31 (avant-projet ±15%) et 4.32 (projet ±10%).

## Préférences de rédaction

Aucun tiret cadratin ni demi-cadratin dans les textes générés. Intervalles avec « à »,
virgules, parenthèses ou deux-points.
