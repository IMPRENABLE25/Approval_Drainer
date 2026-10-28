# Rapport de sécurité — Approval Drainer

## Périmètre actuel

Le déploiement de démonstration sur BNB Smart Chain Testnet instancie uniquement :

- `WrappedTestBNB` (`WTBNB`), un wrapper 1:1 du tBNB natif vers un token ERC-20 de test ;
- `ApprovalDrainer`, un contrat volontairement vulnérable qui utilise `transferFrom` pour démontrer l'abus d'une allowance préalablement approuvée.

Le script de déploiement refuse tout chain ID différent de `97`. Le tBNB et le WTBNB de ce laboratoire sont des actifs de test sans valeur réelle. Aucun pool de staking ou token ERC-20 préminé n'est déployé.

## Constat pédagogique

**Sévérité dans un contexte de production : critique si un utilisateur approuve le contrat avec des actifs de valeur.** `exerciseAllowance` est accessible à tout appelant et permet de choisir le propriétaire, le destinataire et le montant. Le contrat peut ainsi consommer l'allowance WTBNB accordée par le propriétaire, sans nouvelle signature de celui-ci, tant que l'allowance et le solde suffisent.

La cause est l'usage non restreint de `transferFrom` sur des adresses fournies par l'appelant. Le contrat ne vérifie pas que le transfert correspond à une action métier attendue. La démonstration n'est possible qu'après autorisation explicite du spender par le propriétaire ; la connexion du wallet ne confère aucune permission.

## Mesures de protection

- Inspecter le spender et le montant exact avant de signer `approve`.
- Préférer une allowance finie correspondant à l'action immédiate plutôt qu'une allowance illimitée.
- Révoquer les permissions inutilisées avec `approve(spender, 0)`.
- Vérifier l'adresse du contrat et le réseau avant toute interaction.
- Dans une dApp réelle, limiter l'autorisation à la quantité requise et lier l'utilisation de l'allowance à une action métier claire.

La révocation empêche les transferts ultérieurs, mais ne récupère pas les tokens déjà transférés. Les transactions et allowances sont consultables publiquement sur la blockchain.

## Vérification

Les tests Foundry du dépôt vérifient le comportement d'allowance, les limites de transfert, la révocation, l'approbation illimitée et les dépôts/retraits du wrapper. Exécuter `forge build` puis `forge test` avant toute nouvelle démonstration. Ce document ne constitue pas un audit indépendant ni une validation pour le réseau principal.
