"use client";

import { useEffect, useState } from "react";
import {
  useConnection, useConnect, useDisconnect, useReadContract,
  useWaitForTransactionReceipt, useWriteContract
} from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { bscTestnet } from "../components/Providers";

const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ type: "bool" }] }
] as const;
const wrapperAbi = [
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] }
] as const;
const drainerAbi = [{
  type: "function", name: "exerciseAllowance", stateMutability: "nonpayable",
  inputs: [{ name: "token", type: "address" }, { name: "owner", type: "address" }, { name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], outputs: []
}] as const;
const ZERO = 0n;
const MAX_UINT = (1n << 256n) - 1n;
const bscToken = process.env.NEXT_PUBLIC_BSC_WTBNB_ADDRESS ?? "";
const bscDrainer = process.env.NEXT_PUBLIC_BSC_DRAINER_ADDRESS ?? "";

type Confirmation = "transfer" | null;

export default function Home() {
  const { address, chainId, status } = useConnection();
  const isConnected = status === "connected";
  const connect = useConnect();
  const disconnect = useDisconnect();
  const writeContract = useWriteContract();
  const { data: txHash, isPending, error: writeError } = writeContract;
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerPinned, setOwnerPinned] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [amountInput, setAmountInput] = useState("0.01");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [selectedOffer, setSelectedOffer] = useState("starter");

  // While selecting the owner implicitly, follow the connected wallet. Pin it
  // when the user starts an approval or disconnects to switch to the third wallet.
  useEffect(() => {
    if (address && !ownerPinned) setOwnerInput(address);
  }, [address, ownerPinned]);

  const token = isAddress(bscToken) ? bscToken as Address : undefined;
  const spender = isAddress(bscDrainer) ? bscDrainer as Address : undefined;
  const owner = isAddress(ownerInput) ? ownerInput as Address : undefined;
  const recipient = isAddress(recipientInput) ? recipientInput as Address : undefined;
  const isBscTestnet = chainId === bscTestnet.id;
  const isSupportedChain = isBscTestnet;
  const hasLabContracts = Boolean(token && spender);
  const isBscWrapper = isBscTestnet && hasLabContracts;
  const isOwnerSigner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());

  const name = useReadContract({ address: token, abi: erc20Abi, functionName: "name", query: { enabled: Boolean(token && isSupportedChain) } });
  const symbol = useReadContract({ address: token, abi: erc20Abi, functionName: "symbol", query: { enabled: Boolean(token && isSupportedChain) } });
  const decimals = useReadContract({ address: token, abi: erc20Abi, functionName: "decimals", query: { enabled: Boolean(token && isSupportedChain) } });
  const balance = useReadContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: owner ? [owner] : undefined, query: { enabled: Boolean(token && owner && isSupportedChain) } });
  const allowance = useReadContract({ address: token, abi: erc20Abi, functionName: "allowance", args: owner && spender ? [owner, spender] : undefined, query: { enabled: Boolean(token && spender && owner && isSupportedChain) } });

  useEffect(() => {
    if (receipt.isSuccess) {
      void allowance.refetch();
      void balance.refetch();
    }
  }, [receipt.isSuccess, txHash, allowance.refetch, balance.refetch]);

  let amount: bigint | undefined;
  let wrapAmount: bigint | undefined;
  try {
    if (decimals.data !== undefined && /^\d+(\.\d+)?$/.test(amountInput)) amount = parseUnits(amountInput, decimals.data);
    if (/^\d+(\.\d+)?$/.test(amountInput)) wrapAmount = parseUnits(amountInput, 18);
  } catch { amount = undefined; wrapAmount = undefined; }

  const canInteract = Boolean(isConnected && isSupportedChain && hasLabContracts && owner);
  const amountWithinBalance = amount !== undefined && balance.data !== undefined && amount <= balance.data;
  const validAmount = Boolean(canInteract && amount && amount > ZERO && amountWithinBalance);
  const validTransfer = Boolean(validAmount && recipient);
  const isConfiguredWrapper = Boolean(isBscWrapper && isOwnerSigner);

  const pinConnectedOwner = () => {
    if (!address) return;
    setOwnerInput(address);
    setOwnerPinned(true);
  };
  const disconnectWallet = () => {
    if (owner) setOwnerPinned(true);
    disconnect.mutate();
  };
  const submitApproval = (value: bigint) => {
    if (!token || !spender || !isBscTestnet || !isOwnerSigner) return;
    if (value > ZERO) setOwnerPinned(true);
    writeContract.mutate({ address: token, abi: erc20Abi, functionName: "approve", args: [spender, value] });
  };
  const approveFinite = () => amount !== undefined && submitApproval(amount);
  const revoke = () => submitApproval(ZERO);
  const wrap = () => isConfiguredWrapper && wrapAmount && wrapAmount > ZERO && writeContract.mutate({ address: token!, abi: wrapperAbi, functionName: "deposit", value: wrapAmount });
  const unwrap = () => isConfiguredWrapper && wrapAmount && wrapAmount > ZERO && writeContract.mutate({ address: token!, abi: wrapperAbi, functionName: "withdraw", args: [wrapAmount] });
  const exercise = () => validTransfer && amount !== undefined && writeContract.mutate({
    address: spender!, abi: drainerAbi, functionName: "exerciseAllowance",
    args: [token!, owner!, recipient!, amount]
  });

  const formattedBalance = balance.data !== undefined && decimals.data !== undefined
    ? formatUnits(balance.data, decimals.data) : "—";
  const formattedAllowance = allowance.data !== undefined && decimals.data !== undefined
    ? allowance.data === MAX_UINT ? "Illimitée" : formatUnits(allowance.data, decimals.data) : "—";
  const tokenSymbol = symbol.data ?? "WTBNB";

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Navigation principale">
      <a className="brand" href="#overview" aria-label="StakeFlow Lab, accueil">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span><strong>StakeFlow</strong><small>Security Lab</small></span>
      </a>
      <p className="side-label">ESPACE DE TRAVAIL</p>
      <nav className="side-nav">
        <a className="nav-link active" href="#overview" aria-current="page"><span className="nav-dot" />Tableau de bord</a>
        <a className="nav-link" href="#funds"><span className="nav-dot" />Fonds de test</a>
        <a className="nav-link" href="#rewards"><span className="nav-dot" />Rewards</a>
        <a className="nav-link" href="#permissions"><span className="nav-dot" />Autorisations</a>
      </nav>
      <div className="sidebar-note">
        <span className="status-dot" />
        <div><strong>Réseau de test</strong><small>BNB Testnet · chain 97</small></div>
      </div>
      <div className="side-footer">Module 01<br /><strong>Approval Risk</strong></div>
    </aside>

    <main className="main-content" id="overview">
      <header className="topbar">
        <div className="breadcrumb">Laboratoire <span>/</span> Autorisations ERC-20</div>
        <div className="topbar-actions">
          <div className={`network-pill ${isSupportedChain ? "network-ok" : ""}`}><span className="status-dot" />{!isConnected ? "Wallet déconnecté" : isBscTestnet ? "BNB Testnet · 97" : "Sélectionnez BNB Testnet"}</div>
          {isConnected
            ? <button className="button button-outline button-small" onClick={disconnectWallet}>Déconnecter · {address?.slice(0, 6)}…{address?.slice(-4)}</button>
            : <button className="button button-primary button-small" onClick={() => connect.mutate({ connector: injected() })}>Connecter un wallet de test</button>}
        </div>
      </header>

      <div className="page-wrap">
        <section className="page-heading">
          <div><p className="eyebrow">STAKEFLOW SECURITY LAB</p><h1>Pay OFF</h1><p className="heading-copy">Consultez vos WTBNB de test et explorez les offres pédagogiques.</p></div>
          <span className="environment-tag"><span className="status-dot" />BNB TESTNET · TEST</span>
        </section>

        <section className="notice" role="note">
          <span className="notice-mark" aria-hidden="true">i</span>
          <p><strong>Réseau de démonstration BNB Testnet (chain 97).</strong> Utilisez uniquement du tBNB et le WTBNB de test. Le wrap et l’approbation sont deux opérations distinctes. Avant toute approbation, vérifiez l’adresse du spender et le montant : une allowance confirmée reste active après déconnexion.</p>
        </section>

        <section className="summary-grid" aria-label="Résumé du compte inspecté">
          <article className="summary-card">
            <div className="summary-label">PROPRIÉTAIRE INSPECTÉ</div>
            <strong className="summary-value address-value">{owner ?? "Aucun propriétaire sélectionné"}</strong>
            <span className="summary-foot">{isOwnerSigner ? "Wallet connecté" : "Compte consulté sur la blockchain"}</span>
          </article>
          <article className="summary-card">
            <div className="summary-label">SOLDE DISPONIBLE</div>
            <strong className="summary-value">{formattedBalance} <span>{tokenSymbol}</span></strong>
            <span className="summary-foot">Solde du propriétaire sur le réseau actif</span>
          </article>
          <article className="summary-card">
            <div className="summary-label">ALLOWANCE DU CONTRAT</div>
            <strong className={`summary-value ${allowance.data && allowance.data > ZERO ? "value-warning" : ""}`}>{formattedAllowance} <span>{tokenSymbol}</span></strong>
            <span className="summary-foot">Spender : {spender ? `${spender.slice(0, 8)}…${spender.slice(-6)}` : "à configurer"}</span>
          </article>
          <article className="summary-card">
            <div className="summary-label">RÉSEAU ACTIF</div>
            <strong className="summary-value">{chainId ?? "—"}</strong>
            <span className="summary-foot">{isBscTestnet ? "BNB Smart Chain Testnet" : isConnected ? "Réseau non autorisé" : "Connectez un wallet"}</span>
          </article>
        </section>

        <section className="content-grid" id="funds">
          <article className="panel">
            <div className="panel-heading"><div><p className="eyebrow">01 · ACTIFS DE TEST</p><h2>Obtenir des WTBNB</h2></div><span className="step-number">01</span></div>
            <p className="panel-copy">Préparez des WTBNB de test en déposant du tBNB dans le wrapper. Le wallet signataire reçoit les tokens émis.</p>
            <div className="form-row">
              <label htmlFor="amount-wrap">Montant à envelopper</label>
              <div className="amount-control"><input id="amount-wrap" inputMode="decimal" value={amountInput} onChange={event => setAmountInput(event.target.value)} aria-describedby="wrap-help" /><span>tBNB</span></div>
              <small id="wrap-help" className="field-help">Gardez du tBNB pour les frais de transaction.</small>
            </div>
            <div className="action-row">
              <button className="button button-primary" disabled={!isConfiguredWrapper || isPending || !wrapAmount || wrapAmount <= ZERO} onClick={wrap}>Envelopper en WTBNB</button>
              <button className="button button-outline" disabled={!isConfiguredWrapper || isPending || !wrapAmount || wrapAmount <= ZERO} onClick={unwrap}>Récupérer le tBNB</button>
            </div>
            {!isConnected && <p className="inline-help">Connectez le wallet qui doit recevoir les WTBNB.</p>}
            {isConnected && !isOwnerSigner && <p className="inline-warning">Le propriétaire inspecté diffère du signataire. Le wrap est bloqué pour éviter de créditer un wallet et d’en afficher un autre.</p>}
            {isBscTestnet && !bscToken && <p className="inline-warning">Configurez NEXT_PUBLIC_BSC_WTBNB_ADDRESS avec l’adresse WTBNB déployée sur BNB Testnet.</p>}
            {isConnected && !isBscTestnet && <p className="inline-help">Changez le réseau du wallet vers BNB Testnet (chain ID 97).</p>}
          </article>

          <article className="panel" id="permission-details">
            <div className="panel-heading"><div><p className="eyebrow">02 · CONTRÔLE DES PERMISSIONS</p><h2>Inspecter l’allowance</h2></div><span className="step-number">02</span></div>
            <p className="panel-copy">Vérifiez l’adresse du token, le propriétaire et le spender avant de signer une autorisation.</p>
            <div className="field-stack">
              <label htmlFor="token-address">Contrat ERC-20</label>
              <div id="token-address" className="address-readonly mono">{token ?? "NEXT_PUBLIC_BSC_WTBNB_ADDRESS non configurée"}</div>
              <label htmlFor="owner-address">Propriétaire des tokens</label>
              <div className="input-with-action"><input id="owner-address" className="text-input mono" value={ownerInput} onChange={event => { setOwnerInput(event.target.value); setOwnerPinned(true); }} placeholder="Adresse du wallet propriétaire" /><button className="text-action" type="button" disabled={!address} onClick={pinConnectedOwner}>Utiliser le wallet connecté</button></div>
              <p className="field-help">Après déconnexion, cette adresse reste sélectionnée pour inspecter son allowance.</p>
              <label htmlFor="spender-address">Spender autorisé</label>
              <div id="spender-address" className="address-readonly mono">{spender ?? "NEXT_PUBLIC_BSC_DRAINER_ADDRESS non configurée"}</div>
            </div>
            {token && <div className="token-identity"><strong>{name.data ?? "Token non identifié"}</strong><span>{symbol.data ?? "Symbole indisponible"}</span><small>Vérifiez l’adresse du contrat auprès de la configuration du laboratoire.</small></div>}
            <div className="permission-table" role="table" aria-label="Détails de l’autorisation">
              <div role="row"><span role="cell">Compte signataire</span><strong role="cell" className="mono">{address ?? "Déconnecté"}</strong></div>
              <div role="row"><span role="cell">Compte inspecté</span><strong role="cell" className="mono">{owner ?? "Adresse invalide ou vide"}</strong></div>
              <div role="row"><span role="cell">État de l’autorisation</span><strong role="cell"><span className={`status-label ${allowance.data && allowance.data > ZERO ? "status-caution" : "status-neutral"}`}>{allowance.data && allowance.data > ZERO ? "Active" : "Aucune allowance"}</span></strong></div>
            </div>
            <button className="button button-danger-outline full-width" disabled={!canInteract || !isOwnerSigner || isPending || allowance.data === ZERO} onClick={revoke}>Révoquer l’autorisation (approve 0)</button>
          </article>
        </section>

        <section className="panel simulation-panel" id="rewards">
          <div className="panel-heading"><div><p className="eyebrow">02 · OFFRES PÉDAGOGIQUES</p><h2>Rewards</h2></div><span className="step-number">02</span></div>
          <p className="panel-copy">Choisissez une offre de démonstration et confirmez votre participation avec le wallet de test. Les montants et les offres sont fictifs.</p>
          <div className="offer-grid" role="group" aria-label="Offres de démonstration">
            <button type="button" className={`offer-card ${selectedOffer === "starter" ? "offer-selected" : ""}`} aria-pressed={selectedOffer === "starter"} onClick={() => { setSelectedOffer("starter"); setAmountInput("0.01"); }}>
              <span className="offer-kicker">OFFRE 01</span><strong>Découverte</strong><span>Montant de test · 0,01 WTBNB</span><small>Aucune récompense réelle</small>
            </button>
            <button type="button" className={`offer-card ${selectedOffer === "plus" ? "offer-selected" : ""}`} aria-pressed={selectedOffer === "plus"} onClick={() => { setSelectedOffer("plus"); setAmountInput("0.05"); }}>
              <span className="offer-kicker">OFFRE 02</span><strong>Exploration</strong><span>Montant de test · 0,05 WTBNB</span><small>Aucune récompense réelle</small>
            </button>
          </div>
          <div className="simulation-grid">
            <div className="field-stack">
              <label htmlFor="amount-transfer">Montant d’autorisation demandé</label>
              <div className="amount-control"><input id="amount-transfer" inputMode="decimal" value={amountInput} onChange={event => { setAmountInput(event.target.value); setSelectedOffer("custom"); }} /><span>{tokenSymbol}</span></div>
              <p className="field-help">Le montant est limité au solde WTBNB réellement lu sur BNB Testnet.</p>
              <label htmlFor="recipient-address">Adresse destinataire de l’exercice (wallet tiers)</label>
              <input id="recipient-address" className="text-input mono" value={recipientInput} onChange={event => setRecipientInput(event.target.value)} placeholder="Adresse du wallet destinataire" />
            </div>
            <div className="simulation-side">
              <div className="callout callout-info"><strong>Autorisation du dépôt de test</strong><p>Pour cette offre pédagogique, l’action appelle <code>approve</code> sur WTBNB. Elle donne à Pay OFF une allowance pouvant atteindre <strong>{amount !== undefined && decimals.data !== undefined ? `${formatUnits(amount, decimals.data)} ${tokenSymbol}` : "—"}</strong>. Aucun token n’est transféré au pool par cette transaction. Vérifiez le spender et le montant avant de signer.</p></div>
              <div className="simulation-actions">
                <button className="button button-primary" disabled={!validAmount || !isOwnerSigner || isPending} onClick={approveFinite}>Autoriser le dépôt</button>
                <button className="button button-danger" disabled={!validTransfer || isPending || !allowance.data || allowance.data < (amount ?? ZERO)} onClick={() => setConfirmation("transfer")}>Exercer l’allowance avec le wallet tiers</button>
              </div>
              {isConnected && !isOwnerSigner && <p className="inline-warning">L’approbation et la révocation exigent la signature du propriétaire. Un autre compte peut exercer une allowance existante.</p>}
            </div>
          </div>
        </section>

        <section className="panel simulation-panel" id="permissions">
          <div className="panel-heading"><div><p className="eyebrow">03 · CONTRÔLE</p><h2>Inspecter et révoquer l’autorisation</h2></div><span className="step-number">03</span></div>
          <p className="panel-copy">L’autorisation est consultable depuis n’importe quel wallet. Seul son propriétaire peut la révoquer en signant approve(spender, 0).</p>
          <div className="permission-table" role="table" aria-label="État de l’allowance de l’offre sélectionnée">
            <div role="row"><span role="cell">Offre choisie</span><strong role="cell">{selectedOffer === "starter" ? "Découverte" : selectedOffer === "plus" ? "Exploration" : "Montant personnalisé"}</strong></div>
            <div role="row"><span role="cell">Montant demandé</span><strong role="cell">{amount !== undefined && decimals.data !== undefined ? `${formatUnits(amount, decimals.data)} ${tokenSymbol}` : "—"}</strong></div>
            <div role="row"><span role="cell">Allowance actuelle</span><strong role="cell">{formattedAllowance} {tokenSymbol}</strong></div>
          </div>
          <button className="button button-danger-outline full-width" disabled={!canInteract || !isOwnerSigner || isPending || allowance.data === ZERO} onClick={revoke}>Révoquer l’autorisation (approve 0)</button>
        </section>

        <section className="panel simulation-panel" id="simulation">
          <div className="panel-heading"><div><p className="eyebrow">04 · EXERCICE DE SÉCURITÉ</p><h2>Vérifier les limites de l’allowance</h2></div><span className="step-number">04</span></div>
          <p className="panel-copy">Le compte tiers peut appeler le contrat vulnérable, mais le token limite le transfert au minimum entre l’allowance et le solde du propriétaire.</p>
          <button className="button button-danger" disabled={!validTransfer || isPending || !allowance.data || allowance.data < (amount ?? ZERO)} onClick={() => setConfirmation("transfer")}>Tester le transfert avec le wallet tiers</button>
        </section>

        {(isPending || txHash || writeError || receipt.error) && <section className="transaction-panel" aria-live="polite" aria-atomic="true">
          <div><p className="eyebrow">SUIVI ON-CHAIN</p><h2>État de la transaction</h2></div>
          <p>{isPending ? "En attente de signature dans le wallet…" : receipt.isSuccess ? "Transaction confirmée. Le solde et l’allowance sont actualisés." : txHash ? "Transaction envoyée, en attente de confirmation…" : "La transaction a échoué ou a été rejetée."}</p>
          {txHash && <span className="transaction-link mono">{txHash}</span>}
          {receipt.isSuccess && allowance.data !== undefined && allowance.data > ZERO && <p className="learning-reveal">L’approbation ERC-20 a été confirmée : Pay OFF dispose de l’allowance affichée. Le wrap est une opération séparée ; aucun dépôt en pool ni rendement n’a eu lieu. Cette permission reste active après déconnexion jusqu’à sa révocation ou consommation.</p>}
          {(writeError || receipt.error) && <p className="error-copy" role="alert">{(writeError ?? receipt.error)?.message}</p>}
        </section>}

        <footer className="page-footer">StakeFlow Security Lab · BNB Testnet uniquement · WTBNB et tBNB de test.</footer>
      </div>
    </main>

    {confirmation && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmation(null); }}>
      <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <p className="eyebrow">CONFIRMATION DE L’ACTION</p>
        <h2 id="confirm-title">Exécuter le transfert de test ?</h2>
        <p id="confirm-description">Cette transaction demande à Pay OFF d’utiliser une partie de l’allowance du propriétaire. Vérifiez le token, le montant et le destinataire ci-dessous.</p>
        <dl className="review-list">
          <div><dt>Token</dt><dd className="mono">{token ?? "—"}</dd></div>
          <div><dt>Propriétaire</dt><dd className="mono">{owner ?? "—"}</dd></div>
          <div><dt>Spender</dt><dd className="mono">{spender ?? "—"}</dd></div>
          <div><dt>Montant</dt><dd>{amount !== undefined && decimals.data !== undefined ? `${formatUnits(amount, decimals.data)} ${tokenSymbol}` : "—"}</dd></div>
          <div><dt>Destinataire</dt><dd className="mono">{recipient ?? "—"}</dd></div>
        </dl>
        <div className="modal-actions">
          <button className="button button-outline" onClick={() => setConfirmation(null)}>Annuler</button>
          <button className="button button-danger" disabled={isPending} onClick={() => { setConfirmation(null); exercise(); }}>Continuer vers le wallet</button>
        </div>
      </section>
    </div>}
  </div>;
}
