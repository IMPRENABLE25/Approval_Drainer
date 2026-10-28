# Architecture — Smart Contract Security Lab

## 1. Objectif

Ce document décrit l'architecture fonctionnelle et technique du module Approval Drainer.

L'architecture vise à séparer l'interface Web3, les smart contracts, les tests automatisés et l'infrastructure blockchain afin de faciliter la compréhension, la maintenance et l'analyse de sécurité.

La première version se concentre sur les approbations ERC-20 et leur exploitation pédagogique dans un environnement contrôlé.

## 2. Principes d'architecture

Le projet repose sur les principes suivants :

- **Séparation des responsabilités :** chaque composant possède un rôle défini.
- **Sécurité par conception :** les protections sont prévues dès la conception.
- **Isolation :** les contrats vulnérables sont séparés des composants corrigés.
- **Transparence :** les actions importantes sont expliquées à l'utilisateur.
- **Reproductibilité :** les tests et les expériences peuvent être rejoués.
- **Simplicité :** aucun backend n'est ajouté sans besoin fonctionnel justifié.
- **Évolutivité :** de futurs modules de sécurité pourront être ajoutés sans réécrire l'ensemble du projet.

## 3. Architecture générale

```text
Utilisateur
    |
    v
Interface Web3 — Next.js / TypeScript / Tailwind CSS
    |
    v
Couche Web3 — Wagmi / Viem
    |
    v
Wallet — MetaMask
    |
    v
Réseau EVM sélectionné
    |
    +-----------------------------+
    |                             |
    v                             v
Token ERC-20 de test        Contrat tiers de démonstration
    |                             |
    +-------------+---------------+
                  |
                  v
        État de la blockchain
        Soldes et allocations
```

Les tests Foundry constituent une couche indépendante qui valide directement les contrats. Ils ne dépendent pas du fonctionnement de l'interface.

## 4. Composants techniques

### 4.1 Interface utilisateur

**Technologies :**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Responsabilités :**
- Présenter le laboratoire et les scénarios pédagogiques.
- Connecter le wallet.
- Afficher le réseau et le compte actifs.
- Présenter les soldes et les allocations ERC-20.
- Expliquer les risques associés aux autorisations.
- Afficher les détails des opérations.
- Présenter l'état réel des transactions.

L'interface ne doit pas conserver de clé privée et ne doit pas demander de phrase de récupération.

### 4.2 Couche d'interaction Web3

**Technologies :**
- Wagmi
- Viem
- MetaMask

**Responsabilités :**
- Détecter la connexion du wallet.
- Lire les informations de la blockchain.
- Interroger les soldes et les allocations.
- Préparer les appels aux contrats.
- Demander au wallet de signer les transactions.
- Suivre les transactions jusqu'à leur état final.

La couche Web3 doit vérifier le réseau attendu avant toute opération. Les informations affichées doivent provenir des données de la transaction et de l'état de la blockchain, et non de simples valeurs statiques présentées comme réelles.

### 4.3 Smart contracts

**Technologies :**
- Solidity
- OpenZeppelin Contracts

Le laboratoire utilisera plusieurs catégories de contrats :

**Token ERC-20 de test**

Un token fictif permettant de simuler des soldes, des approbations et des transferts.

**Contrat de démonstration vulnérable**

Un contrat isolé permettant d'étudier les conséquences d'une autorisation accordée à un tiers. Il sera documenté comme volontairement vulnérable et réservé aux tests.

**Composants corrigés**

Des composants ou variantes permettant de démontrer les protections applicables. Les corrections dépendront de la cause identifiée : les risques liés à l'approbation doivent être traités par une gestion appropriée des permissions et une interface transparente, et non par l'ajout arbitraire de contrôles au token.

Les contrats ne doivent jamais être présentés comme sûrs uniquement parce qu'ils utilisent OpenZeppelin.

### 4.4 Tests et analyse de sécurité

**Technologies :**
- Foundry
- Forge
- Anvil

**Responsabilités :**
- Tester les fonctions des contrats.
- Reproduire les comportements dangereux.
- Vérifier les contrôles de permission.
- Tester les limites d'allocation et de solde.
- Vérifier les révocations.
- Effectuer du fuzzing.
- Définir des invariants de sécurité.
- Comparer les comportements vulnérables et corrigés.

Les tests constituent le principal mécanisme de validation reproductible du laboratoire.

### 4.5 Infrastructure blockchain

**Environnements :**
- Anvil pour le développement et les tests locaux.
- BNB Chain Testnet pour la démonstration publique.

La progression est volontairement séquentielle : aucun déploiement testnet n'est nécessaire tant que les scénarios et les tests locaux ne sont pas validés.

## 5. Flux fonctionnels

### 5.1 Connexion du wallet

1. L'utilisateur ouvre l'interface.
2. Il demande explicitement la connexion de son wallet.
3. L'interface identifie le compte et le réseau.
4. Elle lit les données accessibles sur la blockchain.
5. Aucun transfert ni aucune approbation n'est déclenché par la seule connexion.

### 5.2 Approbation ERC-20

1. L'interface prépare une demande d'approbation.
2. Elle affiche le token, le bénéficiaire et le montant.
3. L'utilisateur examine la demande dans le wallet.
4. Le wallet demande la confirmation.
5. Après confirmation et inclusion de la transaction, l'interface vérifie l'état de l'allocation.
6. Le résultat est affiché avec un statut fidèle à la blockchain.

### 5.3 Démonstration du risque

1. Le scénario de test établit l'état initial.
2. Une allocation est accordée au contrat de démonstration.
3. Le contrat tente une opération permise par cette allocation.
4. Les tests observent le transfert et l'allocation restante.
5. Les résultats sont consignés dans le rapport d'expérience.

### 5.4 Révocation

1. L'interface identifie une allocation existante.
2. Elle prépare une révocation vers une allocation nulle.
3. Le wallet demande la confirmation.
4. L'interface attend la confirmation de la transaction.
5. Elle relit l'allocation sur la blockchain.
6. Les tests vérifient qu'un transfert dépendant exclusivement de cette allocation échoue.

## 6. Organisation logique du dépôt

```text
smart-contract-security-lab/
|
|-- frontend/
|   |-- Interface Next.js
|   |-- Composants d'affichage des risques
|   |-- Connexion wallet
|   |-- Gestion des approbations
|   |-- Consultation des allocations
|
|-- contracts/src/
|   |-- token/LabToken.sol
|   |-- vulnerable/ApprovalDrainer.sol
|   |-- challenge/StakePoolChallenge.sol
|   |-- interfaces/IStakePool.sol
|   |-- safe/ApprovalPolicy.sol
|
|-- test/
|   |-- Tests unitaires, sécurité, fuzzing et invariants
|   |-- Tests de sécurité
|   |-- Tests de révocation
|   |-- Tests de non-régression
|   |-- Fuzzing et invariants
|
|-- script/
|   |-- Déploiement Anvil du challenge + export JSON des adresses
|
|-- solutions/ (local mainteneur, exclu de Git)
|   |-- Référence sécurisée, preuves d'exploitation et rapports privés
|
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- THREAT_MODEL.md
|   |-- ATTACK.md
|   |-- SECURITY.md
|   |-- TEST-PLAN.md
|   |-- AUDIT_REPORT.md
|   |-- AUDIT-SUBMISSION.md
|
|-- README.md
```

Les solutions sont placées dans `solutions/`, ignoré par Git pour empêcher leur inclusion accidentelle dans une distribution destinée aux auditeurs. Le profil Foundry `solutions` permet au mainteneur d'exécuter les tests comparatifs localement.

### Interface on-chain et écrans

| Interface | Données/fonctions | Événements | Écrans |
|---|---|---|---|
| ERC-20 `LabToken` | `balanceOf`, `allowance`, `approve`, `transfer`, `transferFrom` | `Transfer`, `Approval` | Dashboard, Security Center, Activity, Lab |
| `ApprovalDrainer` | `exerciseAllowance(token, owner, recipient, amount)` | `AllowanceExercised` | Security Lab, Activity |
| `IStakePool` / `StakePoolChallenge` | `stake`, `withdraw`, `claim`, `notifyRewardAmount` (owner), `earned`, `balanceOf`, `totalStaked`, `rewardRate`, `periodFinish` | `Staked`, `Withdrawn`, `RewardPaid`, `RewardProgramUpdated` | Rewards, Dashboard, Activity |

Le contrat ne fournit pas d'indexeur global d'allowances. Le Security Center doit interroger `allowance(owner, spender)` pour les tokens et spenders connus du laboratoire. L'historique repose sur les événements/logs des adresses déployées ; il ne constitue pas un scan complet du portefeuille.

## 7. Gestion des configurations et des secrets

Les configurations doivent distinguer l'environnement local du testnet.

Les adresses de contrats, les identifiants de réseau et les RPC sont des paramètres d'environnement. Les clés privées et autres secrets doivent être traités séparément et ne jamais être publiés dans le dépôt.

Les adresses déployées doivent être consignées avec le réseau correspondant pour éviter toute confusion entre les contrats locaux et les contrats testnet.

## 8. Sécurité de l'architecture

Les protections principales sont :

- Aucune conservation des clés privées dans l'application.
- Aucune demande de phrase de récupération.
- Confirmation explicite des transactions dans le wallet.
- Affichage clair du bénéficiaire et du montant de l'approbation.
- Vérification du réseau avant les opérations.
- Séparation des contrats vulnérables et corrigés.
- Tests de sécurité automatisés.
- Absence de fonds réels dans les expériences.
- Vérification des résultats à partir de la blockchain.

## 9. Choix de ne pas utiliser de backend

La première version n'a pas besoin de backend.

Les soldes, les allocations et les transactions sont consultables sur la blockchain. L'interface peut donc interagir directement avec le réseau par l'intermédiaire du wallet et d'un fournisseur RPC.

Un backend pourra être envisagé ultérieurement pour l'indexation historique, les rapports centralisés ou d'autres besoins spécifiques, après analyse des risques et des coûts.

## 10. Déploiement progressif

### Phase 1 — Conception

Valider le périmètre, le modèle de menace, le scénario et les exigences de sécurité.

### Phase 2 — Smart contracts

Développer le token de test et les contrats pédagogiques, puis les tester indépendamment de l'interface.

### Phase 3 — Validation locale

Reproduire les scénarios avec Anvil et Foundry, corriger les problèmes et vérifier les résultats.

### Phase 4 — Interface Web3

Connecter l'interface aux contrats validés et tester le parcours utilisateur.

### Phase 5 — BNB Chain Testnet

Déployer les composants autorisés après validation locale, puis vérifier les interactions et documenter les adresses.

### Phase 6 — Rapport d'audit

Présenter les vulnérabilités étudiées, les preuves, les correctifs, les résultats des tests et les limites restantes.

## 11. Limites

Cette architecture constitue un laboratoire pédagogique et non un protocole DeFi destiné à recevoir des fonds réels.

Les tests automatisés et le déploiement testnet ne garantissent pas l'absence de vulnérabilités. Toute réutilisation des composants dans un contexte réel nécessiterait une analyse de sécurité supplémentaire.

## 12. Documents associés

- `README.md`
- `docs/THREAT_MODEL.md`
- `docs/ATTACK.md`
- `docs/SECURITY.md`
- `docs/TEST-PLAN.md`
- `docs/AUDIT_REPORT.md`
- `docs/AUDIT-SUBMISSION.md`
