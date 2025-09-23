# Guide de l'Onglet Groups dans le Debug Panel

## Vue d'ensemble

L'onglet Groups permet de contrôler les différents groupes d'éléments lumineux et leurs effets dans la scène. C'est ici que vous ajustez l'apparence lumineuse du robot et de ses composants.

## Structure de l'interface

### 1. Modes de Sécurité

Ces presets changent instantanément la couleur de base du robot pour différents états :

#### **Safe (Sûr)**
- Couleur : Vert (0x00ff00)
- État : Système normal et sécurisé
- Utilisation : Mode par défaut

#### **Neutral (Neutre)**
- Couleur : Bleu (0x0080ff)
- État : Mode attente ou standby
- Utilisation : Robot en pause

#### **Warning (Attention)**
- Couleur : Orange (0xffa500)
- État : Alerte ou attention requise
- Utilisation : Signaler un événement

#### **Alert (Alerte)**
- Couleur : Rouge (0xff0000)
- État : Danger ou erreur critique
- Utilisation : Situations d'urgence

#### **Processing**
- Couleur : Violet (0x9d4edd)
- État : Traitement en cours
- Utilisation : Calculs ou chargement

### 2. Contrôle d'Exposure

**Slider d'Exposure (0.1 - 3.0)**
- Contrôle la luminosité globale de toute la scène
- 1.0 = exposition normale
- < 1.0 = scène plus sombre
- > 1.0 = scène plus lumineuse
- Affecte TOUS les éléments uniformément

### 3. Contrôles Bloom par Groupe

Chaque groupe peut avoir son intensité de bloom ajustée individuellement :

#### **Bloom Iris (0.0 - 10.0)**
- Intensité de la lueur de l'iris (œil central)
- Valeurs élevées = œil très brillant
- Point focal principal du robot

#### **Bloom Eye Rings (0.0 - 10.0)**
- Intensité des anneaux autour de l'œil
- Crée un effet de halo technologique
- Accentue le regard du robot

#### **Bloom Reveal Rings (0.0 - 10.0)**
- Intensité des anneaux magiques/révélation
- Utilisé pour les effets spéciaux
- Animations de transformation

### 4. Informations affichées

- **État actuel** : Mode de sécurité actif
- **Valeurs** : Intensités actuelles de chaque groupe
- **Feedback visuel** : Les sliders montrent les valeurs en temps réel

## Utilisation pratique

### Pour un look "normal"
1. Mode de sécurité : Safe (vert)
2. Exposure : 1.0
3. Bloom Iris : 2.0-3.0
4. Bloom Eye Rings : 1.5-2.5
5. Bloom Reveal Rings : 1.0-2.0

### Pour un look "dramatique"
1. Mode de sécurité : Alert (rouge) ou Processing (violet)
2. Exposure : 0.7-0.8 (plus sombre)
3. Bloom Iris : 5.0-7.0
4. Bloom Eye Rings : 4.0-6.0
5. Bloom Reveal Rings : 3.0-5.0

### Pour un look "subtil"
1. Mode de sécurité : Neutral (bleu)
2. Exposure : 1.2-1.5 (plus clair)
3. Bloom Iris : 1.0-1.5
4. Bloom Eye Rings : 0.5-1.0
5. Bloom Reveal Rings : 0.0-0.5

## Interactions avec d'autres systèmes

### Avec l'onglet PBR
- Les modes de sécurité changent les couleurs de base
- Le bloom interagit avec l'éclairage PBR
- L'exposure affecte le rendu PBR global

### Avec les particules
- Les groupes de particules peuvent hériter des couleurs
- Le bloom peut s'appliquer aux trails de particules
- Synchronisation possible des effets

## Conseils d'utilisation

1. **Commencez par l'exposure** : Ajustez d'abord la luminosité globale
2. **Choisissez un mode** : Sélectionnez l'ambiance avec les modes de sécurité
3. **Affinez groupe par groupe** : Ajustez chaque bloom individuellement
4. **Testez en mouvement** : Les effets bloom sont plus visibles en animation

## Performance

- Bloom élevé = plus d'impact sur les FPS
- L'exposure a peu d'impact performance
- Les modes de sécurité sont instantanés
- Réduisez le bloom si les FPS chutent

## Cas d'usage typiques

- **Présentation** : Mode Safe avec bloom modéré
- **Démo technique** : Mode Processing avec bloom élevé
- **Debug** : Exposure élevée, bloom faible
- **Cinématique** : Mode Alert avec bloom dramatique