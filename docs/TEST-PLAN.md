# Test Plan — Approval Drainer

## 1. Objectif

Ce document définit la stratégie de test du module Approval Drainer du projet Smart Contract Security Lab.

L'objectif est de vérifier le fonctionnement des approbations ERC-20, de reproduire les risques liés aux autorisations excessives, de valider les mécanismes de révocation et de vérifier les mesures correctives.

Les tests doivent permettre de distinguer les comportements attendus des comportements dangereux, tout en produisant des résultats reproductibles.

## 2. Périmètre des tests

Les tests couvrent :

- Les fonctions d'approbation et de consultation des allocations ERC-20.
- Les transferts effectués par un bénéficiaire autorisé.
- Les limites de solde et d'allocation.
- La révocation des autorisations.
- Les contrôles de l'interface Web3.
- Les comportements des contrats vulnérables et corrigés.
- Les interactions avec le wallet de test.
- La validation du déploiement sur BNB Chain Testnet.
- Les opérations du pool de staking, la comptabilité des récompenses et les hypothèses de tokens externes.
- La comparaison entre le pool challenge et sa référence sécurisée, dans la suite mainteneur séparée.

Les signatures hors chaîne, les mécanismes Permit2 et les autres variantes d'autorisation sont exclus de la première version, sauf extension ultérieure du périmètre.

## 3. Environnements de test

### 3.1 Blockchain locale

L'environnement local constitue la référence pour les expériences.

Technologies prévues :
- Foundry pour les tests des smart contracts.
- Forge pour l'exécution des tests et le fuzzing.
- Anvil pour simuler une blockchain EVM locale.
- Solidity pour les contrats de test.
- OpenZeppelin Contracts pour les composants ERC-20 standardisés.

### 3.2 Interface Web3

L'interface sera testée avec un wallet dédié aux expériences et connecté au réseau approprié.

Technologies prévues :
- Next.js et TypeScript.
- Wagmi et Viem.
- MetaMask.
- Tailwind CSS.

### 3.3 BNB Chain Testnet

Le testnet sera utilisé après validation locale pour confirmer les interactions réelles avec le réseau.

Les tests seront limités aux comptes et aux actifs fictifs. Les résultats du testnet ne remplaceront pas les tests automatisés locaux.

## 4. Stratégie de test

La validation suit cinq niveaux :

1. **Tests unitaires :** vérifier les fonctions individuelles et les règles d'autorisation.
2. **Tests de sécurité :** reproduire les comportements dangereux et vérifier les protections.
3. **Tests d'intégration :** contrôler les interactions entre l'interface, le wallet et les contrats.
4. **Fuzzing et invariants :** tester plusieurs valeurs et séquences d'opérations.
5. **Tests de déploiement :** vérifier les adresses, le réseau et le comportement des contrats sur le testnet.

## 5. Cas de test

### 5.1 Connexion et état initial

| ID | Test | Résultat attendu |
|---|---|---|
| TP-01 | Connecter le wallet de test | Le compte est identifié correctement |
| TP-02 | Connecter le wallet sans approuver de token | Aucune allocation n'est créée automatiquement |
| TP-03 | Consulter le solde initial | Le solde affiché correspond à l'état de la blockchain |
| TP-04 | Consulter une allocation inexistante | L'allocation initiale est nulle |
| TP-05 | Utiliser un réseau incompatible | L'interface signale l'incompatibilité et bloque les opérations concernées |

### 5.2 Approbations ERC-20

| ID | Test | Résultat attendu |
|---|---|---|
| TP-06 | Accorder une allocation limitée | L'allocation correspond au montant demandé et signé |
| TP-07 | Lire l'allocation après approbation | La valeur observée correspond à la blockchain |
| TP-08 | Présenter une allocation excessive | L'interface affiche un avertissement explicite |
| TP-09 | Vérifier le bénéficiaire de l'allocation | L'adresse affichée correspond au bénéficiaire réel |
| TP-10 | Refuser une demande dans le wallet | Aucune allocation n'est créée par cette demande rejetée |

### 5.3 Transferts autorisés

| ID | Test | Résultat attendu |
|---|---|---|
| TP-11 | Effectuer un transfert autorisé dans les limites disponibles | Le transfert réussit si toutes les conditions sont satisfaites |
| TP-12 | Dépasser l'allocation disponible | Le transfert échoue |
| TP-13 | Dépasser le solde disponible | Le transfert échoue |
| TP-14 | Effectuer plusieurs transferts successifs | L'allocation restante est correctement mise à jour |
| TP-15 | Tenter un transfert sans allocation valide | Le transfert échoue |

### 5.4 Révocation

| ID | Test | Résultat attendu |
|---|---|---|
| TP-16 | Révoquer une allocation existante | L'allocation est ramenée à zéro |
| TP-17 | Relire l'allocation après révocation | La blockchain confirme la nouvelle valeur |
| TP-18 | Tenter un transfert dépendant de l'allocation révoquée | Le transfert échoue en l'absence d'une autre autorisation |
| TP-19 | Révoquer une allocation déjà nulle | Le comportement est documenté et ne provoque pas d'état incohérent |
| TP-20 | Rejeter la transaction de révocation | L'interface ne prétend pas que la révocation a réussi |

### 5.5 Sécurité de l'interface

| ID | Test | Résultat attendu |
|---|---|---|
| TP-21 | Vérifier les demandes d'approbation | Token, bénéficiaire et montant sont visibles |
| TP-22 | Vérifier une allocation illimitée | Un avertissement clair est affiché |
| TP-23 | Vérifier les informations du contrat | Les informations inconnues ne sont pas présentées comme vérifiées |
| TP-24 | Vérifier les messages d'erreur | Les erreurs sont compréhensibles et ne révèlent aucun secret |
| TP-25 | Rejeter une transaction dans le wallet | L'interface distingue le rejet de la confirmation |

### 5.6 Contrats vulnérables et corrigés

| ID | Test | Résultat attendu |
|---|---|---|
| TP-26 | Reproduire le scénario vulnérable | Le comportement attendu est démontré dans l'environnement isolé |
| TP-27 | Appliquer la correction | La cause identifiée est traitée |
| TP-28 | Rejouer le test initial | Le comportement dangereux étudié n'est plus reproductible dans les mêmes conditions |
| TP-29 | Vérifier les fonctionnalités légitimes | Les opérations prévues continuent de fonctionner |
| TP-30 | Comparer les deux versions | Les différences de comportement sont documentées |

Un contrat ERC-20 standard n'est pas nécessairement vulnérable parce qu'il autorise des approbations. Le scénario porte principalement sur l'obtention et l'exploitation abusive d'une autorisation par un tiers.

## 6. Fuzzing et invariants

Le fuzzing doit explorer plusieurs valeurs d'allocation, de solde et de transfert.

Les propriétés suivantes doivent être vérifiées :

- Un transfert via `transferFrom` ne peut pas dépasser l'allocation disponible.
- Un transfert ne peut pas dépasser le solde disponible.
- Une allocation révoquée ne permet plus les transferts qui en dépendent exclusivement.
- Les soldes et les allocations ne doivent pas devenir négatifs.
- La somme des soldes doit rester cohérente avec les règles du token de test.
- Une connexion de wallet ne doit pas créer d'autorisation.
- Une transaction rejetée ne doit pas être présentée comme confirmée.

Les invariants doivent tenir compte des particularités du token utilisé et des opérations autorisées dans le modèle de test.

Pour la référence mainteneur, vérifier également que le principal comptabilisé est couvert par le solde du token de dépôt, que `totalStaked` correspond aux positions du handler et que les récompenses réclamées ne dépassent pas les émissions comptabilisées. Les tests comparatifs et leurs preuves sont conservés dans le matériel de solution non distribué aux auditeurs.

## 7. Tests d'intégration

Les tests d'intégration vérifieront :

- La connexion au réseau attendu.
- La lecture des soldes et des allocations.
- La préparation d'une approbation.
- La transmission de la demande au wallet.
- La gestion des transactions en attente, rejetées, échouées ou confirmées.
- La mise à jour de l'interface après confirmation.
- La révocation et la vérification de son résultat.

Les tests automatisés des contrats resteront distincts des tests de l'interface afin de faciliter le diagnostic des erreurs.

## 8. Tests sur BNB Chain Testnet

Après validation locale, les contrôles suivants seront effectués :

- Vérification du réseau et de son identifiant.
- Vérification des adresses de contrats déployés.
- Vérification du code et des fonctions exposées.
- Lecture des soldes et allocations.
- Exécution des opérations pédagogiques prévues.
- Vérification des transactions dans un explorateur de blocs.
- Conservation des preuves de déploiement.

Le déploiement testnet ne doit pas être considéré comme un audit de sécurité complet.

## 9. Critères d'acceptation

La version est considérée comme validée lorsque :

- Tous les tests critiques réussissent.
- Les tests de reproduction et de non-régression sont concluants.
- Les transferts respectent les règles d'autorisation.
- La révocation est vérifiée.
- Les protections de l'interface sont opérationnelles.
- Les tests ne révèlent aucune fuite de secrets.
- Les résultats sont reproductibles et documentés.

Tout échec critique bloque la démonstration publique jusqu'à correction.

## 10. Rapport de test

Pour chaque campagne, consigner :

- La version du code testé.
- L'environnement et le réseau.
- L'identifiant du test.
- Les conditions initiales.
- Le résultat attendu.
- Le résultat observé.
- Le statut : réussi, échoué ou bloqué.
- Les preuves disponibles.
- Les anomalies et les corrections nécessaires.
