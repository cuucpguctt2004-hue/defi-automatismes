# Défi Automatismes

Petite application web d'entraînement quotidien aux **automatismes de calcul** du lycée (programme de mathématiques de la voie technologique) :

- carrés à connaître ;
- fractions (addition, soustraction, multiplication, division), y compris avec des nombres négatifs ;
- nombres négatifs (addition, soustraction, règle des signes, priorités, (−3)² et −3²) ;
- pourcentages (coefficient multiplicateur, hausses et baisses, taux d'évolution, évolutions successives, taux d'évolution moyen, indices base 100) ;
- suites arithmétiques et géométriques (terme général, calcul d'un terme, raison, suites définies par récurrence, sommes de termes, notation Σ) ;
- puissances (produit, quotient, puissance de puissance, exposant nul ou négatif) ;
- notation scientifique ;
- développement avec les identités remarquables ;
- factorisation (a² − b² et a² ± 2ab + b²).

Les questions sont **générées au hasard** à chaque séance. Les mauvaises réponses proposées dans les QCM correspondent aux erreurs les plus fréquentes, comme écrire 2x² au lieu de (2x)² = 4x². Chacune affiche une explication.

## Fonctionnalités

- **Défi du jour** : 10 questions variées, avec un chrono.
  - Les **6 premiers défis** reprennent, dans l'ordre, les jours 1 à 6 de la fiche d'entraînement de la semaine (PDF).
  - Ensuite, chaque défi propose des **questions nouvelles**, différentes de celles déjà vues récemment. Il met l'accent sur les équations du premier degré, les fractions et les nombres négatifs, puis les suites et le second degré, avec une question d'entretien sur les autres notions (identités remarquables, puissances, pourcentages…).
  - Le programme de la semaine du 6 au 11 novembre 2026 n'est plus proposé après cette semaine.
- **Révisions automatiques** : chaque question ratée revient au début des défis suivants (5 au maximum par séance), jusqu'à ce qu'elle soit réussie.
- **Entraînement par thème** : 10 questions sur un seul thème.
- **Correction immédiate** pour chaque question, et récapitulatif des erreurs à la fin.
- **Historique**, série de jours d'affilée et record de temps sans faute, enregistrés dans le navigateur (`localStorage`).
- **Activité « Les suites en Python »** (`suites.html`) : 6 étapes guidées pour calculer les termes d'une suite arithmétique ou géométrique avec un vrai programme Python, exécuté directement dans le navigateur (moteur Pyodide inclus dans le dossier `pyodide/`, sans installation ni compte).
- **Thèmes** : carrés, fractions, nombres négatifs, puissances, notation scientifique, pourcentages, développer, factoriser, suites, équations du premier degré et équations du second degré.
- **Fiche rappel** : identités remarquables, puissances, fractions, nombres négatifs, équations du premier et du second degré, pourcentages, suites, carrés de 1 à 15.
- Fonctionne sur téléphone et sur ordinateur, en mode clair et en mode sombre, sans connexion après le premier chargement.

## Mettre l'application en ligne avec GitHub Pages

   `https://<ton-nom-utilisateur>.github.io/defi-automatismes/`.


## Personnaliser

- **Prénom affiché** : modifie la constante `PRENOM` en haut du fichier `app.js`. Laisse `""` pour afficher seulement « Salut ! ».
- **Questions** : tous les générateurs sont dans `questions.js`, avec une fonction par thème.
- **Composition du défi du jour** : fonction `defiDuJour()` dans `questions.js`.
- **Programme de la semaine** : tableau `PROGRAMME` dans `questions.js` (une fonction par jour). Pour un nouveau programme, remplace ces questions.
- **Repartir de zéro** (nouvelle semaine) : dans le navigateur, efface les données du site, ou change la clé `PROG_KEY` dans `app.js`.

## Confidentialité

Aucune donnée n'est envoyée sur Internet : l'historique reste uniquement dans le navigateur de l'appareil utilisé. Il est perdu si on efface les données du site ou si on change d'appareil.

## Structure

```
index.html    page et fiche rappel
style.css     mise en forme (clair et sombre, mobile)
questions.js  générateurs de questions et vérification des réponses
app.js        interface : défi, chrono, correction, historique
suites.html   activité « Les suites en Python »
pyodide/      moteur Python pour le navigateur (Pyodide 0.26.4, licence MPL 2.0)
```
