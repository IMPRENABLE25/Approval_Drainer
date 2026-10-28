# Security Requirements — Approval Drainer

## 1. Objectif

Ce document définit les exigences de sécurité du module Approval Drainer du projet Smart Contract Security Lab.

Il sert de référence pour la conception, le développement, les tests et l'audit du laboratoire. Chaque exigence possède un identifiant unique permettant de la relier aux tests et aux preuves collectées.

Le laboratoire doit démontrer les risques liés aux approbations ERC-20 excessives et vérifier les mesures permettant de réduire ces risques.

## 2. Périmètre de sécurité

Les exigences couvrent quatre domaines :

- **Interface Web3 :** présentation des demandes, informations sur les contrats et avertissements.
- **Gestion des autorisations :** lecture, création et révocation des allocations ERC-20.
- **Smart contracts :** contrôle des permissions, des transferts et des conditions d'exécution.
- **Environnement de test :** isolation des expériences, gestion des secrets et validation des résultats.

Les contrats vulnérables sont exclusivement destinés à la reproduction contrôlée de scénarios pédagogiques.

## 3. Classification des exigences

Les exigences sont classées selon leur priorité :

- **Critique :** condition indispensable à la sécurité du laboratoire.
- **Élevée :** protection nécessaire contre un risque important.
- **Moyenne :** amélioration de la fiabilité, de la transparence ou de l'expérience utilisateur.

## 4. Exigences de sécurité de l'interface

### SEC-01 — Protection des secrets

**Priorité : Critique**

L'interface ne doit jamais demander, collecter ou transmettre une phrase de récupération ou une clé privée.

Les signatures doivent être effectuées par le wallet de l'utilisateur.

**Critères de validation :**
- Aucun champ ne demande une phrase de récupération ou une clé privée.
- Aucun secret de wallet n'est envoyé à un serveur.
- Les comptes utilisés pour les expériences sont exclusivement des comptes de test.

### SEC-02 — Transparence des approbations

**Priorité : Critique**

Toute demande d'approbation doit présenter clairement le token concerné, l'adresse du bénéficiaire et le montant demandé.

**Critères de validation :**
- L'adresse du contrat bénéficiaire est visible.
- Le montant demandé est clairement indiqué.
- Les montants illimités sont identifiés explicitement.
- Les informations affichées correspondent aux paramètres de la transaction préparée.

### SEC-03 — Distinction entre connexion et autorisation

**Priorité : Critique**

La connexion du wallet ne doit jamais déclencher automatiquement une approbation ou un transfert de tokens.

**Critères de validation :**
- La connexion ne modifie aucune allocation ERC-20.
- Toute approbation exige une action explicite.
- Toute transaction est présentée au wallet pour validation.

### SEC-04 — Identification du réseau

**Priorité : Élevée**

L'interface doit identifier le réseau actif et vérifier qu'il correspond à l'environnement prévu.

**Critères de validation :**
- Le réseau sélectionné est visible.
- Les opérations incompatibles avec le réseau actif sont bloquées.
- L'interface indique clairement si elle utilise la blockchain locale ou BNB Chain Testnet.

### SEC-05 — Gestion des erreurs

**Priorité : Moyenne**

L'interface doit afficher des messages compréhensibles lorsque la connexion échoue, qu'une transaction est rejetée ou qu'une opération n'est pas confirmée.

**Critères de validation :**
- Aucun échec n'est présenté comme une réussite.
- Les transactions en attente sont distinguées des transactions confirmées.
- Les erreurs techniques ne révèlent aucun secret.

## 5. Exigences relatives aux approbations ERC-20

### SEC-06 — Lecture correcte des allocations

**Priorité : Critique**

Le laboratoire doit pouvoir consulter l'allocation d'un token accordée par un compte à un bénéficiaire donné.

**Critères de validation :**
- La valeur initiale d'une allocation inexistante est correctement interprétée.
- Le token, le propriétaire et le bénéficiaire sont identifiés.
- Les valeurs affichées correspondent à l'état observé sur la blockchain.

### SEC-07 — Principe du moindre privilège

**Priorité : Critique**

L'interface doit privilégier une allocation limitée au montant nécessaire à l'opération demandée plutôt qu'une allocation illimitée.

**Critères de validation :**
- Une allocation limitée peut être préparée et vérifiée.
- Une allocation illimitée fait apparaître un avertissement explicite.
- Le montant réellement demandé est présenté avant la signature.

Cette exigence constitue une mesure de prévention. Elle ne garantit pas, à elle seule, la sécurité du contrat bénéficiaire.

### SEC-08 — Révocation des autorisations

**Priorité : Critique**

Le laboratoire doit permettre de démontrer la révocation d'une allocation et de vérifier son effet sur les opérations ultérieures.

**Critères de validation :**
- Une révocation valide ramène l'allocation concernée à zéro.
- Le nouvel état est vérifié sur la blockchain.
- Un transfert dépendant exclusivement de cette allocation échoue après révocation.
- L'interface signale les éventuelles erreurs de révocation.

La révocation ne récupère pas les tokens déjà transférés et ne neutralise pas les autres permissions éventuellement accordées.

### SEC-09 — Vérification des limites de transfert

**Priorité : Élevée**

Les tests doivent vérifier que les transferts respectent l'allocation restante, le solde disponible et les règles du token.

**Critères de validation :**
- Un transfert autorisé peut réussir lorsque toutes les conditions sont réunies.
- Un transfert dépassant l'allocation disponible échoue.
- Un transfert dépassant le solde disponible échoue.
- Les résultats sont vérifiés à partir de l'état final de la blockchain.

### SEC-10 — Interprétation prudente des autorisations

**Priorité : Élevée**

L'interface ne doit pas considérer une autorisation existante comme une preuve de fiabilité du contrat bénéficiaire.

**Critères de validation :**
- Les contrats non vérifiés ou dont l'identité ne peut être établie sont signalés.
- L'interface distingue les informations confirmées des informations inconnues.
- Aucune garantie de sécurité n'est déduite de la seule existence d'une approbation.

## 6. Exigences relatives aux smart contracts

### SEC-11 — Isolation des contrats vulnérables

**Priorité : Critique**

Les contrats volontairement vulnérables doivent être séparés des contrats de démonstration sécurisés.

**Critères de validation :**
- Les contrats vulnérables sont explicitement identifiés.
- Ils ne sont utilisés qu'avec des tokens et des comptes de test.
- Aucun contrat vulnérable n'est destiné à recevoir des actifs réels.
- Les limitations de ces contrats sont documentées.

### SEC-12 — Contrôle des permissions

**Priorité : Élevée**

Les contrats de démonstration doivent exposer des règles de permission explicites et testables.

**Critères de validation :**
- Les fonctions sensibles sont identifiées.
- Les conditions d'autorisation sont documentées.
- Les appels non autorisés sont testés.
- Les versions corrigées respectent les règles prévues.

### SEC-13 — Utilisation des standards

**Priorité : Élevée**

Les contrats de test doivent s'appuyer sur des implémentations ERC-20 standardisées lorsque cela est pertinent.

**Critères de validation :**
- Le comportement du token est conforme aux fonctions utilisées.
- Les hypothèses liées aux transferts et aux allocations sont documentées.
- Les écarts de comportement propres à certains tokens sont signalés comme hors périmètre ou couverts par des tests spécifiques.

## 7. Exigences de tests et de validation

### SEC-14 — Tests de reproduction

**Priorité : Critique**

Chaque vulnérabilité étudiée doit être accompagnée d'un test qui démontre les conditions nécessaires à son apparition.

**Critères de validation :**
- Le scénario initial est reproductible.
- Le résultat attendu est défini avant l'exécution.
- Le test distingue les opérations réussies des opérations rejetées.
- Les preuves permettent de comprendre la cause du résultat.

### SEC-15 — Tests de non-régression

**Priorité : Critique**

Les correctifs doivent être accompagnés de tests démontrant que le comportement dangereux n'est plus possible dans les conditions étudiées.

**Critères de validation :**
- Les tests de reproduction sont rejoués après correction.
- Les tests de sécurité réussissent sur la version corrigée.
- Les comportements légitimes continuent de fonctionner.
- Les résultats des deux versions sont comparés.

### SEC-16 — Tests par fuzzing

**Priorité : Élevée**

Lorsque cela est pertinent, Foundry doit être utilisé pour tester plusieurs valeurs et combinaisons de paramètres.

**Critères de validation :**
- Les montants, allocations et séquences d'opérations peuvent varier.
- Les cas limites sont couverts.
- Les propriétés de sécurité importantes sont formulées comme invariants.
- Les échecs détectés sont reproductibles et documentés.

## 8. Exigences relatives à l'environnement

### SEC-17 — Isolation des expériences

**Priorité : Critique**

La reproduction initiale doit avoir lieu sur une blockchain locale isolée.

**Critères de validation :**
- Les comptes sont dédiés aux tests.
- Les actifs sont fictifs.
- Les contrats vulnérables ne sont pas déployés sur un réseau de production.
- La démonstration locale fonctionne avant la phase testnet.

### SEC-18 — Déploiement sur BNB Chain Testnet

**Priorité : Élevée**

Le déploiement testnet ne peut intervenir qu'après la validation des tests locaux.

**Critères de validation :**
- Les contrats et leurs adresses sont documentés.
- Les transactions de déploiement sont vérifiables.
- Les clés privées ne sont jamais versionnées.
- Les fonds utilisés sont exclusivement des fonds de test.
- Le statut pédagogique des contrats vulnérables est clairement indiqué.

### SEC-19 — Protection du dépôt

**Priorité : Critique**

Le dépôt Git ne doit contenir aucun secret ou fichier sensible.

**Critères de validation :**
- Aucun fichier de secrets n'est versionné.
- Les variables d'environnement sensibles sont exclues du dépôt.
- Les fichiers d'exemple ne contiennent que des valeurs fictives.
- Les dépendances et versions utilisées sont documentées.

## 9. Matrice de traçabilité

| Exigence | Domaine | Preuve attendue |
|---|---|---|
| SEC-01 à SEC-05 | Interface | Tests fonctionnels, captures et vérifications réseau |
| SEC-06 à SEC-10 | Autorisations | Tests d'allocation, de transfert et de révocation |
| SEC-11 à SEC-13 | Smart contracts | Revue de code et tests de permissions |
| SEC-14 à SEC-16 | Validation | Résultats Foundry, fuzzing et non-régression |
| SEC-17 à SEC-19 | Infrastructure | Configuration de test, historique Git et preuves de déploiement |

## 10. Gestion des écarts

Toute exigence non satisfaite doit être enregistrée avec :

- Son identifiant.
- La description du problème.
- Le risque associé.
- Les preuves disponibles.
- La correction envisagée.
- Le résultat de la nouvelle validation.

Une exigence critique non satisfaite bloque la validation de la version concernée pour une démonstration publique.

## 11. Critères d'acceptation du laboratoire

Le module Approval Drainer pourra être déclaré prêt pour une démonstration lorsque :

1. Les exigences critiques sont satisfaites.
2. Les tests de reproduction et de non-régression réussissent.
3. Les approbations et révocations sont vérifiées sur la blockchain.
4. Les contrats vulnérables sont clairement isolés.
5. Aucun secret n'est présent dans le dépôt.
6. Le rapport d'audit présente les risques résiduels.
7. La démonstration locale est validée avant le déploiement testnet.
