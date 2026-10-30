# Rapport de sécurité — Démonstration WTBNB / ApprovalDrainer

**Statut :** analyse du code du laboratoire et de ses déploiements de test.  
**Réseau visé :** BNB Smart Chain Testnet, chain ID 97.  
**Contrats déployés par `DeployBscTestnet` :** `WrappedTestBNB` et `ApprovalDrainer`.  
**Adresses du déploiement enregistré :** `WrappedTestBNB` — `0x498F14c64A3B8caeD7aCEd7dBf74EDf693C7A3E5` ; `ApprovalDrainer` — `0x208de901d09C8f7adb02D5809E3324805C09286F`.  
**Référence de correction :** `solutions/contracts/SafeTokenVault.sol` ; cette référence n'est pas déployée.

## Résumé

Le problème démontré est une autorisation ERC-20 donnée au contrat `ApprovalDrainer`. Sa fonction publique `exerciseAllowance(token, owner, recipient, amount)` accepte n'importe quel appelant et permet de choisir le propriétaire, le destinataire et le montant. Le contrat appelle ensuite `transferFrom`.

Un tiers ne peut pas déplacer des tokens simplement en se connectant. Il peut déclencher le transfert seulement si le propriétaire a déjà autorisé l'adresse du contrat drainer pour ce token, et dans les limites de l'allowance et du solde disponibles.

Le déploiement du laboratoire utilise des actifs de test sans valeur réelle. Ne réutilisez pas ce contrat avec des tokens de production.

## Contrats et comportement observé

### `WrappedTestBNB` — `0x498F14c64A3B8caeD7aCEd7dBf74EDf693C7A3E5`

Le wrapper reçoit du tBNB natif et crée la même quantité de WTBNB ERC-20 pour l'appelant. `withdraw(amount)` brûle les WTBNB de l'appelant et lui renvoie le tBNB correspondant. Le wrapper ne donne pas au drainer une allowance sur les WTBNB.

### `ApprovalDrainer` — `0x208de901d09C8f7adb02D5809E3324805C09286F`

La fonction `exerciseAllowance` ne comporte aucun contrôle d'accès. L'appelant choisit les quatre paramètres et le contrat exécute `IERC20(token).transferFrom(owner, recipient, amount)`. L'appel réussit si le token autorise le spender et si le solde du propriétaire suffit.

La quantité maximale transférable à un instant donné est limitée par le minimum entre le montant demandé, l'allowance restante et le solde du propriétaire. Une allowance illimitée peut rester active après un transfert partiel, selon le comportement ERC-20 du token.

## Constat SW-01 — Spender public permettant un transfert arbitraire depuis un propriétaire approuvé

**Sévérité dans une application avec des actifs de valeur : élevée.** L'exploitation exige que la victime ait préalablement approuvé ce contrat. Dans ce laboratoire, les tokens sont fictifs et le déploiement est sur un testnet.

- **Cause racine :** `exerciseAllowance` est accessible à tous et accepte un propriétaire ainsi qu'un destinataire arbitraires.
- **Précondition :** le propriétaire signe une transaction ERC-20 `approve` dont le spender est `ApprovalDrainer` et dont l'allowance est supérieure à zéro.
- **Scénario :** un tiers appelle la fonction après l'approbation, y compris après la déconnexion du wallet propriétaire. La déconnexion ne révoque pas l'allowance.
- **Impact :** transfert des WTBNB du propriétaire vers un destinataire choisi par l'appelant, jusqu'à la limite du solde et de l'allowance. Le destinataire peut ensuite brûler ses WTBNB avec `withdraw` pour récupérer le tBNB de test correspondant.
- **Preuves :** `test/ApprovalDrainer.t.sol` vérifie l'échec sans allowance, le transfert inférieur à l'allowance, l'échec au-delà de cette limite, le maintien d'une allowance maximale et le blocage après révocation.

### Facteurs qui ne constituent pas la cause

- Une connexion de wallet seule ne crée pas d'allowance.
- Le wrapper WTBNB n'autorise pas automatiquement le drainer.
- La fonction ne contourne pas les contrôles du token : c'est l'approbation antérieure qui permet à `transferFrom` de réussir.
- Les transactions d'approbation et de transfert restent visibles sur la blockchain, même si l'interface n'en avertit pas l'utilisateur.

## Correction et limites opérationnelles

La correction la plus sûre pour une application réelle est de ne pas déployer de spender arbitraire de ce type. Un flux de dépôt doit tirer uniquement les tokens de `msg.sender`, les comptabiliser au nom de ce même compte et permettre leur retrait uniquement par ce compte, vers lui-même. Il ne doit pas accepter une adresse propriétaire et un destinataire arbitraires fournis par un tiers.

`SafeTokenVault.sol` est une référence pédagogique qui applique ce modèle avec `SafeERC20`, une comptabilité par propriétaire, des transferts à montant exact et une garde de réentrance. Ses tests confirment qu'un tiers ne peut ni déposer depuis l'allowance d'un autre compte, ni retirer le dépôt d'un autre compte.

Le bytecode déjà déployé de `ApprovalDrainer` ne peut pas être corrigé par une modification locale du dépôt. Les approbations existantes doivent être révoquées sur le contrat WTBNB ; une version sécurisée doit être déployée à une nouvelle adresse et le front-end doit être configuré pour cette adresse.

## Vérifications

```sh
forge test
FOUNDRY_PROFILE=solutions forge test
```

La première commande vérifie les contrats et tests du laboratoire vulnérable. La seconde vérifie la référence sécurisée dans `solutions/`. Ces tests sont locaux et n'effectuent aucun déploiement.
