# Smart Contract Security Lab — Approval Drainer

> **BNB Smart Chain Testnet uniquement.** `ApprovalDrainer` est volontairement vulnérable et sert uniquement à un exercice contrôlé avec du tBNB et des WTBNB sans valeur réelle. Ne l'utilisez jamais avec des actifs réels.

## Contrats déployés

Le script BSC déploie exactement ces deux contrats :

- `WrappedTestBNB` (`WTBNB`) : enveloppe le tBNB natif en ERC-20. `deposit()` reçoit du tBNB et crée le même montant de WTBNB ; `withdraw(amount)` brûle les WTBNB et rend le tBNB.
- `ApprovalDrainer` : contrat de démonstration qui appelle `transferFrom`. Tout appelant peut demander le transfert depuis un propriétaire, mais le token n'accepte que si le propriétaire a approuvé ce contrat et dans la limite de l'allowance et de son solde.

Le tBNB natif sert au gas et ne prend pas en charge `approve`. Seuls les WTBNB créés par le wrapper peuvent être approuvés dans cet exercice.

## Prérequis

- Foundry (`forge`, `cast`)
- Solidity `0.8.24`
- Dépendances Foundry présentes dans `lib/` (`forge-std` et OpenZeppelin Contracts)
- Compte de déploiement dédié au BSC Testnet, financé en tBNB de test

Vérifiez que le RPC est bien sur le chain ID `97` :

```sh
cast chain-id --rpc-url https://bsc-testnet-dataseed.bnbchain.org
```

## Déploiement BSC Testnet

La clé est saisie de façon masquée dans le terminal, préfixée par `0x` si nécessaire, et retirée de l'environnement après l'opération :

```sh
read -s -p "Clé privée du compte dédié BSC Testnet: " BSC_TESTNET_PRIVATE_KEY; echo
case "$BSC_TESTNET_PRIVATE_KEY" in 0x*) ;; *) BSC_TESTNET_PRIVATE_KEY="0x$BSC_TESTNET_PRIVATE_KEY" ;; esac
export BSC_TESTNET_PRIVATE_KEY
forge script script/DeployBscTestnet.s.sol:DeployBscTestnet \
  --rpc-url https://bsc-testnet-dataseed.bnbchain.org \
  --broadcast
unset BSC_TESTNET_PRIVATE_KEY
```

Le script vérifie le chain ID `97`. Les adresses de déploiement sont écrites dans `deployments/bsc-testnet.json`, ignoré par Git. Le contrat à déployer est uniquement celui du script `DeployBscTestnet` : il instancie `WrappedTestBNB` et `ApprovalDrainer`.

## Démonstration

1. Le wallet propriétaire dépose du tBNB dans `WrappedTestBNB` pour recevoir des WTBNB.
2. Le propriétaire approuve `ApprovalDrainer` pour un montant choisi et vérifie l'adresse du spender ainsi que le montant avant signature.
3. Un autre wallet appelle `exerciseAllowance(token, owner, recipient, amount)`. L'appel peut réussir sans nouvelle signature du propriétaire tant que son allowance et son solde le permettent.
4. Le propriétaire peut révoquer l'allowance en appelant `approve(drainer, 0)` sur le contrat WTBNB.
5. Le destinataire peut convertir les WTBNB reçus en tBNB via `withdraw`.

Une connexion de wallet seule n'accorde aucune permission. L'approbation est une transaction on-chain visible publiquement. La révocation empêche les transferts ultérieurs, mais ne récupère pas les tokens déjà transférés.

## Vérification locale

```sh
forge build
forge test
```

Les tests utilisent un ERC-20 fictif local et vérifient les limites de l'allowance, la révocation, l'approbation illimitée et le dépôt/retrait du wrapper. Ils ne déploient aucun contrat sur un réseau.

## Configuration frontend

Utilisez les adresses `wrappedTbnb` et `approvalDrainer` affichées par le déploiement pour renseigner :

```env
NEXT_PUBLIC_BSC_WTBNB_ADDRESS=
NEXT_PUBLIC_BSC_DRAINER_ADDRESS=
```

Ne placez jamais de clé privée dans les variables publiques `NEXT_PUBLIC_*` ou dans Vercel.
