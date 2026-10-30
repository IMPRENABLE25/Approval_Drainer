# Synthèse des corrections — WTBNB / ApprovalDrainer

Les contrats présents dans `contracts/src/` sont les composants du laboratoire, dont `ApprovalDrainer`, volontairement vulnérable. `solutions/contracts/SafeTokenVault.sol` est une référence séparée et **n'est pas déployée** par le script BNB Testnet.

| Risque observé | Correction de référence | Vérification |
|---|---|---|
| Un tiers choisit le propriétaire, le destinataire et le montant dans `exerciseAllowance` | Supprimer ce spender de tout flux réel. Le dépôt sécurisé prend uniquement les tokens de `msg.sender` et les crédite au même compte. | Un appelant tiers ne peut pas utiliser l'allowance ou le dépôt d'un autre propriétaire. |
| Une allowance peut dépasser le dépôt ou être illimitée | L'interface demande une allowance exacte pour l'action nécessaire et affiche le token, le spender et le montant. | Les tests vulnérables confirment la limite `allowance`/solde et le maintien d'une allowance maximale. |
| Un appelant pourrait retirer les fonds d'un autre compte si le contrat accepte un propriétaire arbitraire | Le retrait de référence ne prend pas d'adresse bénéficiaire : il restitue les tokens à `msg.sender`, dans la limite du dépôt comptabilisé pour ce compte. | Le test de retrait tiers échoue et ne modifie pas le solde du propriétaire. |
| Tokens ERC-20 non standards et réentrance | `SafeERC20`, comparaison du delta réellement reçu, état mis à jour avant transfert et `ReentrancyGuard`. | Tests locaux de dépôt, retrait, isolation des comptes et montants comptabilisés. |

Pour un déploiement réel, la variante vulnérable ne doit pas être conservée comme spender actif. Révoquer les allowances existantes et déployer une nouvelle version sécurisée ; le bytecode du contrat déjà déployé est immuable.
