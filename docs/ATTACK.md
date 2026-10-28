# Attack Scenario — Approval Drainer

## 1. Présentation

Ce document décrit le scénario d'attaque étudié dans le module Approval Drainer du projet Smart Contract Security Lab.

L'objectif est de comprendre comment une interface décentralisée frauduleuse peut inciter un utilisateur à accorder une autorisation ERC-20 excessive à un contrat tiers, puis comment cette autorisation peut être exploitée.

L'expérience se déroule exclusivement dans un environnement contrôlé, avec des comptes et des tokens fictifs. Elle ne vise pas à créer un service de phishing opérationnel ni à cibler de véritables utilisateurs.

## 2. Objectifs du scénario

Le scénario doit permettre de :

- Comprendre le mécanisme d'approbation ERC-20.
- Distinguer la connexion d'un wallet de l'autorisation de transfert de tokens.
- Observer les conséquences d'une allocation excessive.
- Vérifier les conditions permettant à un contrat tiers de transférer les tokens autorisés.
- Détecter une autorisation dangereuse.
- Révoquer une allocation et vérifier l'effet de cette révocation.
- Comparer le comportement observé avant et après les mesures correctives.

## 3. Environnement de test

### 3.1 Environnement local

La première phase s'exécute sur une blockchain locale isolée.

Composants prévus :

- Une blockchain locale Anvil.
- Un wallet exclusivement dédié aux tests.
- Un token ERC-20 fictif.
- Une interface Web3 de démonstration.
- Un contrat tiers illustrant l'utilisation d'une allocation.
- Une version corrigée de l'interface et des protections associées.
- Une suite de tests automatisés avec Foundry.

### 3.2 Environnement de démonstration

Après validation locale, le laboratoire pourra être déployé sur BNB Chain Testnet.

Cette phase servira à vérifier le fonctionnement réel de l'interface avec un wallet de test et des transactions publiques sur le réseau de test.

Aucun fonds réel ne sera utilisé.

## 4. Acteurs

| Acteur | Rôle |
|---|---|
| Utilisateur de test | Interagit avec l'interface et signe les transactions de démonstration |
| Interface simulée | Présente une demande d'approbation pédagogique |
| Contrat ERC-20 | Gère les soldes et les autorisations |
| Contrat tiers de test | Illustre les conséquences d'une allocation accordée |
| Défenseur | Analyse les autorisations, applique les protections et vérifie les résultats |

## 5. Préconditions

Avant l'expérience, les conditions suivantes doivent être réunies :

- La blockchain locale est opérationnelle.
- Le wallet utilisé ne contient que des actifs de test.
- Le token ERC-20 fictif est déployé.
- Le compte de test possède un solde de tokens.
- Le contrat tiers de démonstration est déployé et identifié.
- L'interface affiche clairement qu'il s'agit d'un laboratoire pédagogique.
- Les tests peuvent observer les soldes et les autorisations avant et après chaque opération.

Aucune clé privée réelle, phrase de récupération ou autorisation accordée à un contrat de production ne doit être utilisée.

## 6. Déroulement de l'expérience

### Phase 1 — État initial

L'utilisateur ouvre l'interface pédagogique et connecte son wallet de test.

Le laboratoire relève :

- L'adresse du compte de test.
- Le réseau sélectionné.
- Le solde initial du token.
- L'adresse du token ERC-20.
- Le montant initial de l'allocation accordée au contrat tiers.

**Résultat attendu :** l'état initial est enregistré et l'utilisateur peut distinguer la connexion du wallet d'une autorisation de transfert.

### Phase 2 — Présentation de la demande d'approbation

L'interface présente une demande d'approbation simulant une pratique trompeuse : l'action semble nécessaire à l'utilisation d'un service, alors que le montant demandé est excessif par rapport au besoin annoncé.

L'interface de laboratoire doit permettre d'examiner les informations pertinentes avant la signature :

- Le token concerné.
- L'adresse du bénéficiaire de l'autorisation.
- Le montant demandé.
- La portée de la permission.
- Les conséquences potentielles de l'approbation.

**Résultat attendu :** la demande est identifiable comme potentiellement dangereuse et peut être examinée avant toute signature.

### Phase 3 — Autorisation contrôlée

Dans le scénario de test, le compte accorde une allocation prédéfinie au contrat tiers.

Le laboratoire relève la valeur de l'allocation et la compare à l'état initial.

Une approbation illimitée peut être étudiée séparément, mais uniquement avec le token fictif et dans le cadre des tests isolés.

**Résultat attendu :** l'allocation enregistrée sur la blockchain correspond à la permission effectivement accordée.

### Phase 4 — Démonstration de l'impact

Le contrat tiers de test tente d'effectuer un transfert de tokens dans les limites de l'allocation accordée.

Le laboratoire compare :

- Le solde de l'utilisateur avant l'opération.
- Le solde du destinataire après l'opération.
- Le montant de l'allocation avant et après le transfert.
- Le résultat de la transaction.
- Les conditions qui ont permis ou empêché le transfert.

**Résultat attendu :** les tests démontrent que le transfert dépend d'une autorisation valide, du solde disponible et des règles du token.

L'expérience doit également vérifier qu'un contrat tiers ne peut pas dépasser l'allocation restante par le seul fait que l'utilisateur a connecté son wallet.

### Phase 5 — Détection du risque

Le défenseur examine les autorisations actives et identifie celle qui présente un risque.

L'analyse doit déterminer :

- Quel contrat détient l'autorisation.
- Quel token est concerné.
- Quel montant reste autorisé.
- Si l'allocation est nécessaire au fonctionnement du service.
- Si elle doit être réduite ou révoquée.

**Résultat attendu :** le laboratoire identifie précisément la permission à risque et explique pourquoi elle est dangereuse.

### Phase 6 — Révocation

Le compte de test révoque l'allocation concernée.

L'état de l'autorisation est ensuite relu sur la blockchain et un nouveau test de transfert est effectué.

**Résultat attendu :** l'allocation est nulle après révocation et le transfert qui dépendait exclusivement de cette autorisation échoue, sauf si une autre permission ou un autre mécanisme valide le permet.

La révocation ne récupère pas automatiquement les tokens déjà transférés et ne neutralise pas les autres autorisations éventuellement accordées.

### Phase 7 — Validation des protections

Le scénario est rejoué avec la version corrigée de l'interface.

Les protections doivent notamment :

- Afficher le montant exact demandé.
- Identifier le contrat bénéficiaire.
- Signaler les allocations excessives.
- Favoriser les permissions limitées au besoin.
- Expliquer les conséquences d'une approbation.
- Permettre à l'utilisateur de vérifier les allocations existantes.

**Résultat attendu :** les tests confirment que les protections prévues fonctionnent et que les risques résiduels sont documentés.

## 7. Cas de test principaux

| ID | Test | Résultat attendu |
|---|---|---|
| AT-01 | Connexion du wallet | Aucun transfert ni aucune approbation automatique |
| AT-02 | Lecture d'une allocation inexistante | Allocation initiale nulle |
| AT-03 | Approbation limitée | Allocation conforme au montant signé |
| AT-04 | Approbation excessive | Risque identifié et signalé par l'interface |
| AT-05 | Transfert dans les limites autorisées | Opération possible si les autres conditions sont satisfaites |
| AT-06 | Transfert au-delà de l'allocation | Opération refusée |
| AT-07 | Révocation de l'allocation | Allocation ramenée à zéro |
| AT-08 | Transfert après révocation | Échec si aucune autre autorisation ne le permet |
| AT-09 | Changement de réseau | Opération bloquée ou interrompue si le réseau est incompatible |
| AT-10 | Contrat bénéficiaire non vérifié | Avertissement clair avant toute approbation |

## 8. Preuves à collecter

Pour chaque expérience, les éléments suivants doivent être conservés :

- Identifiant du test.
- État initial des soldes et des allocations.
- Paramètres de l'approbation.
- Adresse du contrat concerné.
- Résultat de la transaction.
- État final des soldes et des allocations.
- Captures d'écran de l'interface de démonstration.
- Résultats des tests automatisés.
- Analyse de la cause racine et des protections applicables.

Les captures et les journaux doivent éviter d'exposer des secrets ou des données personnelles.

## 9. Critères de réussite

Le scénario sera considéré comme validé lorsque :

1. L'état initial est reproductible.
2. Les approbations sont correctement interprétées.
3. Le risque d'une allocation excessive est démontré.
4. Les transferts respectent les règles du token et les permissions.
5. La révocation est confirmée sur la blockchain.
6. Les protections de l'interface sont vérifiées.
7. Les résultats sont accompagnés de preuves et d'une analyse de sécurité.
8. L'expérience fonctionne localement avant toute démonstration sur BNB Chain Testnet.

## 10. Limites et risques résiduels

Ce scénario se concentre sur les approbations ERC-20 classiques.

Il ne couvre pas automatiquement les signatures EIP-2612, Permit2, les signatures EIP-712 génériques, les compromissions de clés privées ou les autres mécanismes d'autorisation. Ces éléments nécessitent des scénarios distincts.

Une interface plus claire réduit le risque d'erreur, mais ne garantit pas à elle seule la sécurité. L'utilisateur doit également vérifier les informations de transaction présentées par son wallet et la fiabilité du contrat concerné.

## 11. Documents associés

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/THREAT_MODEL.md`
- `docs/SECURITY.md`
- `docs/TEST-PLAN.md`
- `docs/AUDIT_REPORT.md`
