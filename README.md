# Défi Automatismes

Petite application web d'entraînement quotidien aux **automatismes de calcul** du lycée (programme de mathématiques de la voie technologique) :

- carrés à connaître ;
- fractions (addition, soustraction, multiplication, division) ;
- puissances (produit, quotient, puissance de puissance, exposant nul ou négatif) ;
- notation scientifique ;
- développement avec les identités remarquables ;
- factorisation (a² − b² et a² ± 2ab + b²).

Les questions sont **générées au hasard** à chaque séance. Les mauvaises réponses proposées dans les QCM correspondent aux erreurs les plus fréquentes, comme écrire 2x² au lieu de (2x)² = 4x². Chacune affiche une explication.

## Fonctionnalités

- **Défi du jour** : 10 questions variées, avec un chrono.
- **Entraînement par thème** : 10 questions sur un seul thème.
- **Correction immédiate** pour chaque question, et récapitulatif des erreurs à la fin.
- **Historique**, série de jours d'affilée et record de temps sans faute, enregistrés dans le navigateur (`localStorage`).
- **Fiche rappel** : identités remarquables, règles sur les puissances et les fractions, carrés de 1 à 15.
- Fonctionne sur téléphone et sur ordinateur, en mode clair et en mode sombre, sans connexion après le premier chargement.

## Mettre l'application en ligne avec GitHub Pages

   `https://<ton-nom-utilisateur>.github.io/defi-automatismes/`.


## Personnaliser

- **Prénom affiché** : modifie la constante `PRENOM` en haut du fichier `app.js`. Laisse `""` pour afficher seulement « Salut ! ».
- **Questions** : tous les générateurs sont dans `questions.js`, avec une fonction par thème.
- **Composition du défi du jour** : fonction `defiDuJour()` dans `questions.js`.

## Confidentialité

Aucune donnée n'est envoyée sur Internet : l'historique reste uniquement dans le navigateur de l'appareil utilisé. Il est perdu si on efface les données du site ou si on change d'appareil.

## Structure

```
index.html    page et fiche rappel
style.css     mise en forme (clair et sombre, mobile)
questions.js  générateurs de questions et vérification des réponses
app.js        interface : défi, chrono, correction, historique
```
