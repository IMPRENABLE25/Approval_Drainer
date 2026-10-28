# Threat Model — Approval Drainer

## 1. Objectif du document

Ce document définit le modèle de menace du module Approval Drainer du projet Smart Contract Security Lab.

Il vise à identifier les actifs exposés, les acteurs, les surfaces d’attaque et les risques liés aux approbations de tokens dans l’écosystème Web3.

Le laboratoire permettra de reproduire un scénario d’approbation malveillante dans un environnement contrôlé, d’analyser ses conséquences et de vérifier les mesures de protection.

## 2. Périmètre

Le laboratoire couvre :

- Le phishing à travers une interface dApp frauduleuse simulée.
- Les approbations de tokens ERC-20.
- Les autorisations accordées à des contrats tiers.
- L’exploitation pédagogique d’une autorisation préalablement accordée.
- La détection, l’analyse et la révocation des permissions dangereuses.
- La validation des correctifs à l’aide de tests automatisés.

Le laboratoire ne couvre pas, dans sa première version, le vol de phrases de récupération, le vol de clés privées, les signatures de transactions destinées à des utilisateurs réels ou les attaques contre des protocoles tiers.

## 3. Actifs à protéger

| Actif | Description | Niveau de protection |
|---|---|---|
| Tokens de test | Actifs ERC-20 fictifs utilisés pour les expériences | Élevé |
| Wallet de test | Compte utilisé pour signer les transactions pédagogiques | Élevé |
| Autorisations ERC-20 | Permissions accordées aux contrats tiers | Élevé |
| Clés privées de test | Secrets des comptes exclusivement dédiés au laboratoire | Critique |
| Contrats de démonstration | Contrats vulnérables et corrigés | Élevé |
| Intégrité des résultats | Résultats des tests et preuves d'audit | Élevé |

Aucune clé privée réelle, phrase de récupération ou ressource financière ayant une valeur réelle ne doit être utilisée.

## 4. Acteurs et capacités

### 4.1 Utilisateur

L'utilisateur interagit avec une interface Web3 et peut :

- Connecter un wallet.
- Consulter son solde de tokens.
- Accorder une approbation ERC-20.
- Examiner les permissions existantes.
- Révoquer une autorisation.

L'utilisateur peut ne pas comprendre la différence entre connecter un wallet et accorder à un contrat le droit de transférer ses tokens.

### 4.2 Attaquant simulé

Dans le laboratoire, l'attaquant représente l'opérateur d'une interface frauduleuse.

Ses capacités supposées sont :

- Contrôler l'interface Web3 de démonstration.
- Présenter une demande d'approbation trompeuse.
- Contrôler un contrat tiers de test.
- Exploiter une autorisation accordée dans les limites définies par le token.
- Tenter de dissimuler la portée réelle de la permission dans l'interface simulée.

L'attaquant ne dispose pas automatiquement de la clé privée de l'utilisateur et ne peut pas transférer les tokens sans mécanisme d'autorisation valide.

### 4.3 Défenseur

Le défenseur représente le développeur, l'auditeur ou l'utilisateur prudent. Il doit :

- Examiner les contrats et les transactions.
- Identifier les permissions excessives.
- Vérifier les adresses et les réseaux.
- Révoquer les autorisations inutiles.
- Tester les protections et documenter les résultats.

## 5. Surfaces d'attaque

### 5.1 Interface utilisateur

Une interface frauduleuse peut présenter une opération dangereuse comme une action anodine, masquer le montant demandé ou utiliser un nom trompeur.

**Risque :** l'utilisateur approuve une opération sans comprendre les permissions qu'il accorde.

**Mesures de défense :**
- Afficher explicitement l'adresse du contrat bénéficiaire.
- Présenter le token et le montant autorisé.
- Signaler les approbations illimitées.
- Ne jamais demander de phrase de récupération ou de clé privée.
- Séparer clairement les actions de connexion, d'approbation et de transfert.

### 5.2 Approbations ERC-20

La fonction `approve` permet au détenteur d'un token d'autoriser un compte tiers à transférer des tokens dans les limites de l'allocation accordée.

**Risque :** une allocation excessive ou persistante peut permettre des transferts non souhaités.

**Mesures de défense :**
- Préférer les allocations minimales nécessaires.
- Éviter les approbations illimitées lorsqu'elles ne sont pas indispensables.
- Vérifier régulièrement les allocations actives.
- Révoquer les autorisations inutiles.
- Tester le comportement des allocations après transfert et révocation.

### 5.3 Contrat tiers

Un contrat peut utiliser une allocation accordée pour demander des transferts de tokens.

**Risque :** les tokens autorisés peuvent être transférés sans qu'une nouvelle approbation soit nécessaire pour chaque transfert, tant que les conditions du token et l'allocation le permettent.

**Mesures de défense :**
- Vérifier l'identité et le code du contrat bénéficiaire.
- Limiter le montant et la durée des permissions lorsque le mécanisme le permet.
- Tester les limites de transfert.
- Révoquer les allocations qui ne sont plus nécessaires.

### 5.4 Gestion des clés et des comptes

**Risque :** l'utilisation accidentelle d'un wallet personnel ou d'une clé réutilisée expose des ressources non prévues pour le laboratoire.

**Mesures de défense :**
- Utiliser exclusivement des comptes de test.
- Séparer les secrets de l'environnement local et les fichiers versionnés.
- Ne jamais publier de clé privée.
- Ne jamais utiliser de fonds réels dans le scénario d'attaque.

## 6. Scénario de menace principal

Le scénario retenu est une approbation ERC-20 obtenue par une interface Web3 frauduleuse simulée.

1. L'utilisateur ouvre l'interface pédagogique.
2. L'interface présente une action nécessitant une approbation.
3. L'utilisateur examine ou accepte la demande dans son wallet de test.
4. L'allocation accordée est consultée et vérifiée sur la blockchain locale.
5. Le contrat de démonstration tente un transfert dans les limites de l'autorisation.
6. Le laboratoire mesure le résultat et identifie les conditions ayant permis le transfert.
7. L'utilisateur révoque l'autorisation et les tests vérifient que les transferts concernés ne sont plus possibles.

Toutes les étapes sont réalisées avec des comptes et des tokens fictifs, sur une blockchain locale.

## 7. Évaluation des risques

| Menace | Probabilité estimée | Impact potentiel | Priorité |
|---|---|---|---|
| Approbation excessive | Élevée | Élevé | Critique |
| Adresse de contrat trompeuse | Moyenne à élevée | Élevé | Élevée |
| Autorisation oubliée | Élevée | Élevé | Critique |
| Fuite d'une clé de test | Faible à moyenne | Élevé | Élevée |
| Mauvaise interprétation d'une signature | Moyenne | Élevé | Élevée |

Ces niveaux sont des estimations initiales du laboratoire. Ils devront être réévalués selon le scénario effectivement implémenté.

## 8. Exigences de sécurité

Le laboratoire devra satisfaire aux exigences suivantes :

- **SEC-01 :** aucune clé privée ou phrase de récupération ne doit être demandée par l'interface.
- **SEC-02 :** chaque approbation doit être présentée avec son token, son bénéficiaire et son montant.
- **SEC-03 :** les allocations excessives doivent être identifiables.
- **SEC-04 :** les tests doivent démontrer le comportement d'un transfert autorisé.
- **SEC-05 :** les tests doivent démontrer le comportement après révocation.
- **SEC-06 :** les contrats vulnérables doivent rester confinés au laboratoire.
- **SEC-07 :** les transactions doivent être réalisées sur le réseau de test prévu.
- **SEC-08 :** les tests et les résultats doivent être documentés et reproductibles.

## 9. Limites du modèle

Ce modèle ne garantit pas la détection de toutes les formes de phishing Web3.

Une approbation ERC-20 classique est différente d'une signature hors chaîne, d'une autorisation EIP-2612 (`permit`), d'une signature Permit2 ou d'une transaction de transfert directe. Ces mécanismes peuvent présenter des risques distincts.

Ils pourront être ajoutés à des modules ultérieurs après validation du scénario principal.

## 10. Critères de validation

Le modèle de menace sera considéré comme correctement traité lorsque :

- Les acteurs, actifs et surfaces d'attaque sont identifiés.
- Le scénario est reproductible dans un environnement local isolé.
- Les tests démontrent les effets d'une approbation accordée.
- La révocation est vérifiée.
- Les mesures de défense sont documentées et testées.
- Les résultats sont consignés dans un rapport d'audit.

## 11. Documents associés

- `README.md` — Présentation générale du projet.
- `docs/ARCHITECTURE.md` — Architecture technique.
- `docs/ARCHITECTURE.md` — Architecture technique.
- `docs/ATTACK.md` — Déroulement détaillé du scénario.
- `docs/SECURITY.md` — Exigences de sécurité.
- `docs/TEST-PLAN.md` — Plan de validation.
- `docs/AUDIT_REPORT.md` — Rapport d'état du challenge.

## 12. Pool Stack&Win

La couche métier locale comprend un token de dépôt, un token de récompense, un compte gestionnaire de financement, les positions des participants et les récompenses préfinancées. Les frontières de confiance incluent le wallet du participant, l'adresse de token configurée au déploiement, le gestionnaire qui règle les périodes de récompense et les appels ERC-20 externes.

Les propriétés de sécurité à vérifier couvrent la cohérence entre principal comptabilisé et actifs reçus, l'attribution temporelle des récompenses, la couverture financière des périodes actives, l'autorisation du financement, et l'absence de répétition d'un paiement lors d'interactions externes. Les scénarios d'audit et le rapport détaillé sont maintenus séparément du matériel fourni aux auditeurs.
