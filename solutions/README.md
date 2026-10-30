# Solutions mainteneur — module WTBNB / ApprovalDrainer

Ce dossier contient le rapport correspondant aux contrats actuels, ainsi qu'une variante de coffre sécurisée à titre de comparaison.

- Le déploiement du laboratoire reste défini dans `script/DeployBscTestnet.s.sol` : il déploie `WrappedTestBNB` et le `ApprovalDrainer` vulnérable pour le testnet.
- Le déploiement enregistré sur BNB Testnet (chain ID 97) utilise WTBNB `0x498F14c64A3B8caeD7aCEd7dBf74EDf693C7A3E5` et ApprovalDrainer `0x208de901d09C8f7adb02D5809E3324805C09286F`.
- La référence `SafeTokenVault` n'est pas incluse dans ce script et n'est pas déployée à l'adresse du drainer.
- Les suites sont locales : `forge test` puis `FOUNDRY_PROFILE=solutions forge test`.
- Les adresses déployées sont dans `deployments/bsc-testnet.json` sur la machine de déploiement ; ce fichier reste ignoré car il est propre à chaque déploiement.

!!!Le drainer est volontairement dangereux et réservé aux actifs fictifs sur un réseau de test. Ne pointez jamais ce front-end ou ce contrat vers des actifs réels.
