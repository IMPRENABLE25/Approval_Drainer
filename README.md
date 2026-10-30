# Smart Contract Security Lab — Approval Drainer

## Objectif du laboratoire

**Classe de vulnérabilité étudiée :** dans un protocole, une allowance ERC-20 accordée à un contrat peut devenir exploitable si ce contrat ne contrôle pas correctement qui peut déclencher `transferFrom`, pour quel propriétaire, quel montant et vers quel destinataire. Une fonction publique mal protégée ou insuffisamment contrainte peut permettre à un tiers d'utiliser l'autorisation existante d'un utilisateur pour déplacer ses tokens. L'approbation ERC-20 n'est pas, à elle seule, une vulnérabilité : le risque vient de la manière dont le contrat spender utilise cette permission. La déconnexion du wallet ne révoque pas une allowance déjà accordée.

**Ce que démontre ce lab :** sur BNB Smart Chain Testnet et avec des actifs fictifs, `ApprovalDrainer` reproduit volontairement ce défaut de contrôle. Le propriétaire enveloppe du tBNB en WTBNB et approuve le spender ; un wallet tiers peut ensuite appeler sa fonction publique et choisir le montant ainsi que le destinataire, sans nouvelle signature du propriétaire. Le laboratoire permet d'observer les préconditions et les limites de l'exploitation, puis d'étudier une conception corrigée.

L'objectif est de comprendre et de vérifier que :

- connecter un wallet ne donne pas, à lui seul, le droit de déplacer ses tokens ;
- l'approbation `approve` est une transaction distincte, signée par le propriétaire ;
- une allowance reste active après déconnexion jusqu'à sa consommation ou sa révocation ;
- le contrat qui détient l'allowance peut appeler `transferFrom` sans nouvelle signature du propriétaire ;
- le transfert reste limité par le montant demandé, l'allowance restante et le solde WTBNB du propriétaire ;
- une interface et un contrat sûrs doivent rendre le spender, le montant et les effets du dépôt explicites.

Ce projet est un support pédagogique et de portfolio, pas un protocole de staking. Les offres affichées dans le front-end sont fictives : aucun pool de récompenses ni rendement réel n'est implémenté. Le but est d'étudier l'autorisation et le transfert de tokens.

## Contrats du laboratoire

Le déploiement BNB Testnet crée exactement deux contrats :

- **`WrappedTestBNB` (`WTBNB`)** : reçoit du tBNB natif avec `deposit()` et crée le même montant de WTBNB pour l'appelant. `withdraw(amount)` brûle les WTBNB de l'appelant et lui rend le tBNB correspondant.
- **`ApprovalDrainer`** : contrat volontairement vulnérable. Sa fonction publique `exerciseAllowance(token, owner, recipient, amount)` accepte un propriétaire, un destinataire et un montant fournis par l'appelant, puis appelle `transferFrom`.

Le contrat drainer ne peut transférer les WTBNB d'un propriétaire que si celui-ci lui a accordé une allowance. Une allowance n'est pas créée par le wrap : le propriétaire doit signer séparément `approve` sur WTBNB. Si l'allowance est active, un tiers peut déclencher le transfert sans nouvelle signature du propriétaire. La déconnexion du wallet ne révoque pas cette permission.

Le tBNB natif sert au gas et ne prend pas en charge `approve`. Seuls les WTBNB ERC-20 peuvent être approuvés dans cet exercice. Les contrats déployés sont volontairement vulnérables ou réservés au test : ne les utilisez jamais avec des actifs réels.

## Parcours de démonstration

1. Connecter le wallet A sur BNB Testnet et déposer au moins `0.01 tBNB` dans le wrapper pour recevoir des WTBNB.
2. Sur la page **Rewards**, examiner le token, l'adresse spender et le montant, puis signer l'approbation WTBNB destinée à `ApprovalDrainer`.
3. Déconnecter A et connecter le wallet B. La permission reste associée à A sur la blockchain.
4. Dans **Exercice**, sélectionner l'adresse du propriétaire A mémorisée après son approbation, saisir une adresse destinataire C et un montant couvert par le solde et l'allowance. B appelle alors le contrat drainer.
5. Vérifier les soldes et l'allowance, puis révoquer la permission avec `approve(spender, 0)` depuis le wallet A. Une révocation n'annule pas les transferts déjà effectués.

Le destinataire C reçoit des WTBNB. Il peut les échanger contre le tBNB de test sous-jacent avec `withdraw`, s'il contrôle le wallet C.

## Référence sécurisée

`solutions/contracts/SafeTokenVault.sol` est une référence locale qui illustre un flux plus sûr : le dépôt tire uniquement les tokens de `msg.sender` et crédite ce même compte ; le retrait renvoie les tokens à `msg.sender`. Elle empêche un appelant tiers de choisir arbitrairement le propriétaire et le destinataire.

**Cette référence n'est pas incluse dans le script de déploiement BNB Testnet et n'est pas déployée à la place du drainer.** Le bytecode déjà déployé ne peut pas être modifié par une mise à jour du dépôt. Pour une version sécurisée, il faut révoquer les allowances accordées au drainer, déployer un nouveau contrat et mettre à jour les adresses du front-end.

Le rapport d'analyse et la synthèse des correctifs se trouvent dans [`solutions/`](solutions/README.md).

## Vérification locale

Prérequis : Foundry (`forge`, `cast`), Solidity `0.8.24` et les dépendances présentes dans `lib/` (`forge-std` et OpenZeppelin Contracts).

```sh
forge build
forge test
FOUNDRY_PROFILE=solutions forge test
```

Les tests locaux vérifient le wrap et le retrait du tBNB, les limites et la révocation des allowances, ainsi que les protections de la référence sécurisée. Ils n'envoient aucune transaction sur un réseau.

## Déploiement BNB Testnet

Le script `script/DeployBscTestnet.s.sol` vérifie le chain ID `97` et déploie uniquement `WrappedTestBNB` et `ApprovalDrainer`. Vérifier le réseau avant de diffuser :

```sh
cast chain-id --rpc-url https://bsc-testnet-dataseed.bnbchain.org
```

Déployer avec un compte dédié au testnet, financé uniquement en tBNB de test :

```sh
read -s -p "Clé privée du compte dédié BSC Testnet: " BSC_TESTNET_PRIVATE_KEY; echo
case "$BSC_TESTNET_PRIVATE_KEY" in 0x*) ;; *) BSC_TESTNET_PRIVATE_KEY="0x$BSC_TESTNET_PRIVATE_KEY" ;; esac
export BSC_TESTNET_PRIVATE_KEY
forge script script/DeployBscTestnet.s.sol:DeployBscTestnet \
  --rpc-url https://bsc-testnet-dataseed.bnbchain.org \
  --broadcast
unset BSC_TESTNET_PRIVATE_KEY
```

Le script imprime les adresses et les écrit dans `deployments/bsc-testnet.json`, fichier local ignoré par Git. La clé privée ne doit jamais être commise ni placée dans une variable `NEXT_PUBLIC_*`.

## Front-end

Dans Vercel, définir `frontend` comme **Root Directory** et choisir Next.js. Configurer les adresses imprimées par le déploiement :

```env
NEXT_PUBLIC_BSC_WTBNB_ADDRESS=
NEXT_PUBLIC_BSC_DRAINER_ADDRESS=
```

Le front-end est limité à BNB Testnet (chain ID `97`). Toute approbation doit être vérifiée dans le wallet avant signature.
