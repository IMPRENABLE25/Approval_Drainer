"use client";

import { useEffect, useState } from "react";
import {
  useBalance, useConnection, useConnect, useDisconnect, useReadContract,
  useWaitForTransactionReceipt, useWriteContract
} from "wagmi";
import { formatUnits, isAddress, parseUnits, type Address, type Hash } from "viem";
import { bscTestnet, metaMaskConnector } from "./Providers";

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
const payOffAbi = [{
  type: "function", name: "exerciseAllowance", stateMutability: "nonpayable",
  inputs: [{ name: "token", type: "address" }, { name: "owner", type: "address" }, { name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], outputs: []
}] as const;
const ZERO = 0n;
const MIN_WRAP_AMOUNT = parseUnits("0.01", 18);
const GAS_RESERVE = parseUnits("0.0005", 18);
const MAX_UINT = (1n << 256n) - 1n;
const tokenConfig = process.env.NEXT_PUBLIC_BSC_WTBNB_ADDRESS ?? "";
const payOffConfig = process.env.NEXT_PUBLIC_BSC_DRAINER_ADDRESS ?? "";

type Page = "dashboard" | "funds" | "rewards" | "permissions" | "exercise";
type Props = { page: Page };
type PageMeta = { title: string; description: string; eyebrow: string };

const pageMeta: Record<Page, PageMeta> = {
  dashboard: { title: "Tableau de bord", description: "Vue d’ensemble du wallet et accès aux outils de démonstration.", eyebrow: "ACCUEIL" },
  funds: { title: "Fonds de test", description: "Enveloppez du tBNB en WTBNB et consultez le solde du wallet.", eyebrow: "ACTIFS" },
  rewards: { title: "Rewards", description: "Choisissez une offre pédagogique et examinez l’autorisation demandée.", eyebrow: "OFFRES DE DÉMONSTRATION" },
  permissions: { title: "Autorisations", description: "Inspectez l’allowance ERC-20 active et révoquez-la si nécessaire.", eyebrow: "CONTRÔLE DES ACCÈS" },
  exercise: { title: "Exercice de transfert", description: "Testez les limites d’une allowance avec un second wallet de test.", eyebrow: "SIMULATION CONTRÔLÉE" }
};

export function LabPage({ page }: Props) {
  const { address, chainId, status } = useConnection();
  const isConnected = status === "connected";
  const connect = useConnect();
  const disconnect = useDisconnect();
  const writeContract = useWriteContract();
  const { data: txHash, isPending, error: writeError } = writeContract;
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  const [ownerInput, setOwnerInput] = useState("");
  const [exerciseOwnerInput, setExerciseOwnerInput] = useState("");
  const [authorizedOwners, setAuthorizedOwners] = useState<string[]>([]);
  const [pendingApproval, setPendingApproval] = useState<{ hash: Hash; owner: Address } | null>(null);
  const [ownerPinned, setOwnerPinned] = useState(false);
  const [ownerReady, setOwnerReady] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [amountInput, setAmountInput] = useState("0.01");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState("starter");

  useEffect(() => {
    const savedOwner = window.sessionStorage.getItem("stakeflow.owner");
    if (savedOwner && isAddress(savedOwner)) {
      setOwnerInput(savedOwner);
      setOwnerPinned(true);
    }
    setOwnerReady(true);
  }, []);

  useEffect(() => {
    const savedExerciseOwner = window.sessionStorage.getItem("stakeflow.exerciseOwner");
    if (savedExerciseOwner && isAddress(savedExerciseOwner)) setExerciseOwnerInput(savedExerciseOwner);
    try {
      const savedOwners = JSON.parse(window.localStorage.getItem("stakeflow.authorizedOwners") ?? "[]");
      if (Array.isArray(savedOwners)) setAuthorizedOwners(savedOwners.filter((value): value is string => typeof value === "string" && isAddress(value)));
    } catch {
      window.localStorage.removeItem("stakeflow.authorizedOwners");
    }
  }, []);

  useEffect(() => {
    if (!ownerReady) return;
    setOwnerInput(address ?? "");
    setOwnerPinned(false);
  }, [address, ownerReady]);

  useEffect(() => {
    if (ownerReady && isAddress(ownerInput)) window.sessionStorage.setItem("stakeflow.owner", ownerInput);
  }, [ownerInput, ownerReady]);

  const token = isAddress(tokenConfig) ? tokenConfig as Address : undefined;
  const spender = isAddress(payOffConfig) ? payOffConfig as Address : undefined;
  const selectedOwnerInput = page === "exercise"
    ? exerciseOwnerInput
    : page === "permissions" && ownerPinned
      ? ownerInput
      : address ?? "";
  const owner = isAddress(selectedOwnerInput) ? selectedOwnerInput as Address : undefined;
  const recipient = isAddress(recipientInput) ? recipientInput as Address : undefined;
  const isBscTestnet = chainId === bscTestnet.id;
  const hasToken = Boolean(token);
  const hasContracts = Boolean(token && spender);
  const isOwnerSigner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const canInteract = Boolean(isConnected && isBscTestnet && hasContracts && owner);

  const name = useReadContract({ address: token, abi: erc20Abi, functionName: "name", query: { enabled: Boolean(token && isBscTestnet) } });
  const symbol = useReadContract({ address: token, abi: erc20Abi, functionName: "symbol", query: { enabled: Boolean(token && isBscTestnet) } });
  const decimals = useReadContract({ address: token, abi: erc20Abi, functionName: "decimals", query: { enabled: Boolean(token && isBscTestnet) } });
  const balance = useReadContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: owner ? [owner] : undefined, query: { enabled: Boolean(token && owner && isBscTestnet) } });
  const allowance = useReadContract({ address: token, abi: erc20Abi, functionName: "allowance", args: owner && spender ? [owner, spender] : undefined, query: { enabled: Boolean(token && spender && owner && isBscTestnet) } });
  const nativeBalance = useBalance({ address, chainId: bscTestnet.id, query: { enabled: Boolean(address && isBscTestnet) } });

  useEffect(() => {
    if (receipt.isSuccess) {
      void allowance.refetch();
      void balance.refetch();
      void nativeBalance.refetch();
    }
  }, [receipt.isSuccess, txHash, allowance.refetch, balance.refetch, nativeBalance.refetch]);

  useEffect(() => {
    if (!receipt.isSuccess || !txHash || !pendingApproval || pendingApproval.hash.toLowerCase() !== txHash.toLowerCase()) return;
    setAuthorizedOwners(current => {
      const next = current.some(saved => saved.toLowerCase() === pendingApproval.owner.toLowerCase())
        ? current
        : [...current, pendingApproval.owner];
      window.localStorage.setItem("stakeflow.authorizedOwners", JSON.stringify(next));
      return next;
    });
    setExerciseOwnerInput(pendingApproval.owner);
    window.sessionStorage.setItem("stakeflow.exerciseOwner", pendingApproval.owner);
    setPendingApproval(null);
  }, [receipt.isSuccess, txHash, pendingApproval]);

  let amount: bigint | undefined;
  let wrapAmount: bigint | undefined;
  try {
    if (decimals.data !== undefined && /^\d+(\.\d+)?$/.test(amountInput)) amount = parseUnits(amountInput, decimals.data);
    if (/^\d+(\.\d+)?$/.test(amountInput)) wrapAmount = parseUnits(amountInput, 18);
  } catch { amount = undefined; wrapAmount = undefined; }

  const amountWithinBalance = amount !== undefined && balance.data !== undefined && amount <= balance.data;
  const wrapMinimumMet = wrapAmount !== undefined && wrapAmount >= MIN_WRAP_AMOUNT;
  const wrapBalanceSufficient = wrapAmount !== undefined && nativeBalance.data !== undefined
    && nativeBalance.data.value >= wrapAmount + GAS_RESERVE;
  const validAmount = Boolean(canInteract && amount && amount > ZERO && amountWithinBalance);
  const validTransfer = Boolean(validAmount && recipient);
  const formattedBalance = balance.data !== undefined && decimals.data !== undefined ? formatUnits(balance.data, decimals.data) : "—";
  const formattedAllowance = allowance.data !== undefined && decimals.data !== undefined
    ? allowance.data === MAX_UINT ? "Illimitée" : formatUnits(allowance.data, decimals.data) : "—";
  const tokenSymbol = symbol.data ?? "WTBNB";
  const pageInfo = pageMeta[page];

  const pinConnectedOwner = () => {
    if (!address) return;
    setOwnerInput(address);
    setOwnerPinned(true);
  };
  const disconnectWallet = () => {
    disconnect.mutate();
    // The next connected account becomes the displayed owner by default.
    // Keeping the previous account pinned made a new wallet look like the old one.
    setOwnerPinned(false);
    setOwnerInput("");
    window.sessionStorage.removeItem("stakeflow.owner");
  };
  const submitApproval = (value: bigint) => {
    if (!token || !spender || !isBscTestnet || !isOwnerSigner) return;
    writeContract.mutate({ address: token, abi: erc20Abi, functionName: "approve", args: [spender, value] }, {
      onSuccess: hash => {
        if (value > ZERO && address) setPendingApproval({ hash, owner: address });
      }
    });
  };
  const addExerciseOwner = (value: string) => {
    if (!isAddress(value)) return;
    setAuthorizedOwners(current => {
      const next = current.some(saved => saved.toLowerCase() === value.toLowerCase()) ? current : [...current, value];
      window.localStorage.setItem("stakeflow.authorizedOwners", JSON.stringify(next));
      return next;
    });
  };
  const wrap = () => {
    if (!isBscTestnet || !hasToken || !isOwnerSigner || !wrapMinimumMet || !wrapBalanceSufficient || !wrapAmount || !address) return;
    writeContract.mutate({ address: token!, abi: wrapperAbi, functionName: "deposit", value: wrapAmount });
  };
  const unwrap = () => isBscTestnet && hasToken && isOwnerSigner && wrapAmount && wrapAmount > ZERO
    && writeContract.mutate({ address: token!, abi: wrapperAbi, functionName: "withdraw", args: [wrapAmount] });
  const exercise = () => validTransfer && amount !== undefined && writeContract.mutate({
    address: spender!, abi: payOffAbi, functionName: "exerciseAllowance",
    args: [token!, owner!, recipient!, amount]
  });
  const revoke = () => submitApproval(ZERO);

  const nav = [
    ["dashboard", "/", "Tableau de bord"], ["funds", "/funds", "Fonds de test"],
    ["rewards", "/rewards", "Rewards"], ["permissions", "/permissions", "Autorisations"],
    ["exercise", "/exercise", "Exercice"]
  ] as const;

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Navigation principale">
      <a className="brand" href="/" aria-label="StakeFlow, accueil">
        <span className="brand-mark" aria-hidden="true">S</span><span><strong>StakeFlow</strong><small>BNB Testnet</small></span>
      </a>
      <p className="side-label">NAVIGATION</p>
      <nav className="side-nav">{nav.map(([key, href, label]) =>
        <a key={key} className={`nav-link ${page === key ? "active" : ""}`} href={href} aria-current={page === key ? "page" : undefined}>
          <span className="nav-dot" />{label}
        </a>
      )}</nav>
      <div className="sidebar-note"><span className="status-dot" /><div><strong>Réseau requis</strong><small>BNB Testnet · chain 97</small></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumb">StakeFlow <span>/</span> {pageInfo.title}</div>
        <div className="topbar-actions">
          <div className={`network-pill ${isBscTestnet ? "network-ok" : ""}`}><span className="status-dot" />{!isConnected ? "Wallet déconnecté" : isBscTestnet ? "BNB Testnet · 97" : "Sélectionnez BNB Testnet"}</div>
          {isConnected
            ? <button className="button button-outline button-small" onClick={disconnectWallet}>Déconnecter · {address?.slice(0, 6)}…{address?.slice(-4)}</button>
            : <button className="button button-primary button-small" onClick={() => connect.mutate({ connector: metaMaskConnector })}>Connecter MetaMask</button>}
        </div>
      </header>

      <div className="page-wrap">
        <section className="page-heading"><div><p className="eyebrow">{pageInfo.eyebrow}</p><h1>{pageInfo.title}</h1><p className="heading-copy">{pageInfo.description}</p></div><span className="environment-tag"><span className="status-dot" />TESTNET</span></section>

        {page === "dashboard" && <>
          <section className="notice" role="note"><span className="notice-mark" aria-hidden="true">i</span><p><strong>BNB Testnet · chain 97.</strong> Cette interface utilise du tBNB et du WTBNB de test. Connectez votre wallet de test puis vérifiez le réseau et les adresses de contrats avant toute transaction.</p></section>
          <section className="summary-grid" aria-label="Résumé du wallet">
            <Summary label="WALLET CONNECTÉ" value={address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Non connecté"} foot={isOwnerSigner ? "Propriétaire des WTBNB" : "Connectez un wallet de test"} />
            <Summary label="SOLDE WTBNB" value={`${formattedBalance} ${tokenSymbol}`} foot="Lu depuis le contrat sur BNB Testnet" />
            <Summary label="ALLOWANCE DU SPENDER" value={`${formattedAllowance} ${tokenSymbol}`} foot="Permission ERC-20 actuelle" caution={Boolean(allowance.data && allowance.data > ZERO)} />
            <Summary label="RÉSEAU" value={chainId ? String(chainId) : "—"} foot={isBscTestnet ? "BNB Smart Chain Testnet" : "Chain ID 97 requise"} />
          </section>
          <section className="content-grid dashboard-links">
            <RouteCard href="/funds" number="01" title="Fonds de test" copy="Wrapper du tBNB et solde WTBNB." />
            <RouteCard href="/rewards" number="02" title="Rewards" copy="Offres de démonstration et participation." />
            <RouteCard href="/permissions" number="03" title="Autorisations" copy="Inspection et révocation de l’allowance." />
            <RouteCard href="/exercise" number="04" title="Exercice" copy="Simulation avec un wallet tiers." />
          </section>
        </>}

        {page === "funds" && <section className="panel route-panel">
          <div className="panel-heading"><div><p className="eyebrow">ACTIFS DE TEST</p><h2>Wrapper tBNB → WTBNB</h2></div><span className="step-number">01</span></div>
          <p className="panel-copy">Déposez du tBNB dans le contrat WTBNB. Le wrapper émet le même montant de tokens ERC-20 sur votre wallet. Gardez du tBNB pour les frais.</p>
          <div className="summary-grid funds-summary"><Summary label="SOLDE WTBNB" value={`${formattedBalance} ${tokenSymbol}`} foot={owner ?? "Wallet non sélectionné"} /><Summary label="SOLDE NATIF" value={nativeBalance.data ? `${formatUnits(nativeBalance.data.value, 18)} tBNB` : "— tBNB"} foot="Une réserve de 0,0005 tBNB est gardée pour les frais" /></div>
          <label htmlFor="wrap-amount">Montant à envelopper</label>
          <div className="amount-control"><input id="wrap-amount" inputMode="decimal" type="number" min="0.01" step="0.01" value={amountInput} onChange={event => setAmountInput(event.target.value)} /><span>tBNB</span></div>
          <p className="field-help">Minimum : 0,01 tBNB. Disponible : {nativeBalance.data ? `${formatUnits(nativeBalance.data.value, 18)} tBNB` : "lecture en cours"}.</p>
          <div className="action-row"><button className="button button-primary" disabled={!isBscTestnet || !hasToken || !isOwnerSigner || isPending || !wrapMinimumMet || !wrapBalanceSufficient} onClick={wrap}>Envelopper en WTBNB</button><button className="button button-outline" disabled={!isBscTestnet || !hasToken || !isOwnerSigner || isPending || !wrapAmount || wrapAmount <= ZERO || !balance.data || wrapAmount > balance.data} onClick={unwrap}>Récupérer le tBNB</button></div>
          {!isBscTestnet && <p className="inline-warning">Sélectionnez BNB Testnet (chain ID 97) dans MetaMask.</p>}
          {isBscTestnet && !token && <p className="inline-warning">Configurez NEXT_PUBLIC_BSC_WTBNB_ADDRESS.</p>}
          {isConnected && isBscTestnet && !isOwnerSigner && <div className="action-row"><button className="button button-outline" onClick={pinConnectedOwner}>Utiliser le wallet connecté comme propriétaire</button></div>}
          {isBscTestnet && wrapMinimumMet && nativeBalance.data && !wrapBalanceSufficient && <p className="inline-warning">Solde insuffisant pour ce wrap et les frais : réduisez le montant ou ajoutez du tBNB de test.</p>}
        </section>}

        {page === "rewards" && <section className="panel route-panel">
          <div className="panel-heading"><div><p className="eyebrow">OFFRES FICTIVES</p><h2>Sélectionnez une offre</h2></div><span className="step-number">02</span></div>
          <p className="panel-copy">Les offres servent à illustrer une demande d’autorisation ERC-20. Aucun dépôt au pool ni rendement n’est exécuté.</p>
          <div className="offer-grid" role="group" aria-label="Offres de démonstration">
            <button type="button" className={`offer-card ${selectedOffer === "starter" ? "offer-selected" : ""}`} aria-pressed={selectedOffer === "starter"} onClick={() => { setSelectedOffer("starter"); setAmountInput("0.01"); }}><span className="offer-kicker">OFFRE 01</span><strong>Découverte</strong><span>Montant de démonstration · 0,01 WTBNB</span><small>Aucune récompense réelle</small></button>
            <button type="button" className={`offer-card ${selectedOffer === "plus" ? "offer-selected" : ""}`} aria-pressed={selectedOffer === "plus"} onClick={() => { setSelectedOffer("plus"); setAmountInput("0.05"); }}><span className="offer-kicker">OFFRE 02</span><strong>Exploration</strong><span>Montant de démonstration · 0,05 WTBNB</span><small>Aucune récompense réelle</small></button>
          </div>
          <div className="form-row offer-amount"><label htmlFor="offer-amount">Montant de l’autorisation</label><div className="amount-control"><input id="offer-amount" inputMode="decimal" value={amountInput} onChange={event => { setAmountInput(event.target.value); setSelectedOffer("custom"); }} /><span>{tokenSymbol}</span></div><p className="field-help">Solde WTBNB disponible : {formattedBalance} {tokenSymbol}</p></div>
          <div className="action-row"><button className="button button-primary" disabled={!validAmount || !isOwnerSigner || isPending} onClick={() => amount !== undefined && submitApproval(amount)}>Autoriser le dépôt</button></div>
          {isConnected && !isOwnerSigner && <p className="inline-warning">Pour approuver, connectez le wallet qui détient les WTBNB.</p>}
        </section>}

        {page === "permissions" && <section className="panel route-panel">
          <div className="panel-heading"><div><p className="eyebrow">LECTURE ERC-20</p><h2>Allowance du wallet</h2></div><span className="step-number">03</span></div>
          <p className="panel-copy">La lecture est disponible après connexion ou saisie de l’adresse du propriétaire. Une révocation doit être signée par ce wallet.</p>
          <div className="field-stack"><label htmlFor="owner-address">Propriétaire des tokens</label><div className="input-with-action"><input id="owner-address" className="text-input mono" value={ownerInput} onChange={event => { setOwnerInput(event.target.value); setOwnerPinned(true); }} placeholder="Adresse du wallet propriétaire" /><button className="text-action" type="button" disabled={!address} onClick={pinConnectedOwner}>Utiliser le wallet connecté</button></div>
            <label htmlFor="token-address">Contrat du token</label><div id="token-address" className="address-readonly mono">{token ?? "NEXT_PUBLIC_BSC_WTBNB_ADDRESS non configurée"}</div>
            <label htmlFor="spender-address">Spender</label><div id="spender-address" className="address-readonly mono">{spender ?? "NEXT_PUBLIC_BSC_DRAINER_ADDRESS non configurée"}</div></div>
          {token && <div className="token-identity"><strong>{name.data ?? "Token non identifié"}</strong><span>{symbol.data ?? "Symbole indisponible"}</span><small>Contrat configuré pour cette démonstration.</small></div>}
          <div className="permission-table" role="table" aria-label="Détails de l’autorisation"><div role="row"><span role="cell">Propriétaire</span><strong role="cell" className="mono">{owner ?? "Adresse invalide ou vide"}</strong></div><div role="row"><span role="cell">Allowance</span><strong role="cell">{formattedAllowance} {tokenSymbol}</strong></div><div role="row"><span role="cell">État</span><strong role="cell"><span className={`status-label ${allowance.data && allowance.data > ZERO ? "status-caution" : "status-neutral"}`}>{allowance.data && allowance.data > ZERO ? "Active" : "Aucune allowance"}</span></strong></div></div>
          <button className="button button-danger-outline full-width" disabled={!canInteract || !isOwnerSigner || isPending || allowance.data === ZERO} onClick={revoke}>Révoquer (approve 0)</button>
          {!isOwnerSigner && <p className="field-help">Après déconnexion, l’adresse reste affichée. Seul le propriétaire peut révoquer.</p>}
        </section>}

        {page === "exercise" && <section className="panel route-panel">
          <div className="panel-heading"><div><p className="eyebrow">WALLET TIERS</p><h2>Exercer l’allowance</h2></div><span className="step-number">04</span></div>
          <p className="panel-copy">Après avoir accordé l’allowance depuis le wallet propriétaire, connectez ici le wallet tiers. Le propriétaire est repris automatiquement depuis l’étape Rewards.</p>
          <div className="field-stack"><label htmlFor="exercise-owner">Wallet propriétaire ayant approuvé</label>{authorizedOwners.length > 0 && <select className="text-input mono" aria-label="Choisir un wallet autorisé mémorisé" value={authorizedOwners.find(saved => saved.toLowerCase() === exerciseOwnerInput.toLowerCase()) ?? ""} onChange={event => { setExerciseOwnerInput(event.target.value); window.sessionStorage.setItem("stakeflow.exerciseOwner", event.target.value); }}><option value="">Choisir un wallet mémorisé</option>{authorizedOwners.map(saved => <option key={saved} value={saved}>{saved}</option>)}</select>}<input id="exercise-owner" className="text-input mono" value={exerciseOwnerInput} onChange={event => { setExerciseOwnerInput(event.target.value); window.sessionStorage.setItem("stakeflow.exerciseOwner", event.target.value); }} placeholder="Renseigné après l’approbation" />{isAddress(exerciseOwnerInput) && !authorizedOwners.some(saved => saved.toLowerCase() === exerciseOwnerInput.toLowerCase()) && <button className="text-action" type="button" onClick={() => addExerciseOwner(exerciseOwnerInput)}>Mémoriser cette adresse sur cet appareil</button>}<p className="field-help">C’est un wallet qui détient les WTBNB et a approuvé le spender. Les adresses mémorisées restent dans ce navigateur. Le wallet connecté est le compte tiers qui déclenche l’exercice.</p>
            <label htmlFor="exercise-amount">Montant du transfert</label><div className="amount-control"><input id="exercise-amount" inputMode="decimal" value={amountInput} onChange={event => setAmountInput(event.target.value)} /><span>{tokenSymbol}</span></div>
            <label htmlFor="recipient-address">Adresse destinataire (wallet C)</label><input id="recipient-address" className="text-input mono" value={recipientInput} onChange={event => setRecipientInput(event.target.value)} placeholder="Adresse qui recevra les WTBNB" /><p className="field-help">Le wallet connecté (B) paie le gas et appelle le contrat. Le wallet C reçoit les WTBNB retirés au wallet propriétaire (A).</p></div>
          <div className="permission-table" role="table" aria-label="Limites du transfert"><div role="row"><span role="cell">Allowance active</span><strong role="cell">{formattedAllowance} {tokenSymbol}</strong></div><div role="row"><span role="cell">Solde du propriétaire</span><strong role="cell">{formattedBalance} {tokenSymbol}</strong></div><div role="row"><span role="cell">Compte appelant</span><strong role="cell" className="mono">{address ?? "Wallet déconnecté"}</strong></div></div>
          <button className="button button-danger" disabled={!validTransfer || isPending || !allowance.data || allowance.data < (amount ?? ZERO)} onClick={() => setConfirmationOpen(true)}>Préparer le transfert de test</button>
          {isConnected && isOwnerSigner && <p className="inline-warning">Pour reproduire le scénario tiers, déconnectez le propriétaire puis connectez le second wallet.</p>}
        </section>}

        {page === "dashboard" && !isBscTestnet && <p className="inline-warning">Connectez MetaMask et sélectionnez BNB Testnet (chain ID 97) pour charger les données du wallet.</p>}

        {(isPending || txHash || writeError || receipt.error) && <section className="transaction-panel" aria-live="polite" aria-atomic="true"><div><p className="eyebrow">SUIVI DE TRANSACTION</p><h2>État on-chain</h2></div><p>{isPending ? "En attente de signature dans MetaMask…" : receipt.isSuccess ? "Transaction confirmée." : txHash ? "Transaction envoyée, en attente de confirmation…" : "La transaction a échoué ou a été rejetée."}</p>{txHash && <span className="transaction-link mono">{txHash}</span>}{receipt.isSuccess && page === "rewards" && <p className="learning-reveal">L’allowance a été confirmée et reste active après déconnexion, jusqu’à sa révocation ou consommation. Aucun dépôt dans un pool n’a eu lieu.</p>}{(writeError || receipt.error) && <p className="error-copy" role="alert">{(writeError ?? receipt.error)?.message}</p>}</section>}
        <footer className="page-footer">StakeFlow · BNB Testnet · WTBNB et tBNB de test.</footer>
      </div>
    </main>

        {confirmationOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmationOpen(false); }}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><p className="eyebrow">CONFIRMATION DE L’ACTION</p><h2 id="confirm-title">Exécuter le transfert de test ?</h2><p id="confirm-description">Le contrat spender utilisera une partie de l’allowance du propriétaire. Vérifiez le token, le montant et le destinataire.</p><dl className="review-list"><div><dt>Token</dt><dd className="mono">{token ?? "—"}</dd></div><div><dt>Propriétaire</dt><dd className="mono">{owner ?? "—"}</dd></div><div><dt>Spender</dt><dd className="mono">{spender ?? "—"}</dd></div><div><dt>Montant</dt><dd>{amount !== undefined && decimals.data !== undefined ? `${formatUnits(amount, decimals.data)} ${tokenSymbol}` : "—"}</dd></div><div><dt>Destinataire</dt><dd className="mono">{recipient ?? "—"}</dd></div></dl><div className="modal-actions"><button className="button button-outline" onClick={() => setConfirmationOpen(false)}>Annuler</button><button className="button button-danger" disabled={isPending} onClick={() => { setConfirmationOpen(false); exercise(); }}>Continuer vers MetaMask</button></div></section></div>}
  </div>;
}

function Summary({ label, value, foot, caution = false }: { label: string; value: string; foot: string; caution?: boolean }) {
  return <article className="summary-card"><div className="summary-label">{label}</div><strong className={`summary-value ${caution ? "value-warning" : ""}`}>{value}</strong><span className="summary-foot">{foot}</span></article>;
}

function RouteCard({ href, number, title, copy }: { href: string; number: string; title: string; copy: string }) {
  return <a className="route-card" href={href}><span className="step-number">{number}</span><strong>{title}</strong><span>{copy}</span><b>Ouvrir →</b></a>;
}
