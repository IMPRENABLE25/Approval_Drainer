"use client";

import { useEffect, useState } from "react";
import {
  useConnection, useConnect, useDisconnect, useReadContract, useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { bscTestnet, localChain } from "../components/Providers";

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

export default function Home() {
  const { address, chainId, status } = useConnection();
  const isConnected = status === "connected";
  const connect = useConnect();
  const disconnect = useDisconnect();
  const writeContract = useWriteContract();
  const { data: txHash, isPending, error: writeError } = writeContract;
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  const [tokenInput, setTokenInput] = useState(bscToken);
  const [spenderInput, setSpenderInput] = useState(bscDrainer);
  const [ownerInput, setOwnerInput] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [amountInput, setAmountInput] = useState("0.01");

  useEffect(() => {
    if (address && !ownerInput) setOwnerInput(address);
  }, [address, ownerInput]);

  const token = isAddress(tokenInput) ? tokenInput as Address : undefined;
  const spender = isAddress(spenderInput) ? spenderInput as Address : undefined;
  const owner = isAddress(ownerInput) ? ownerInput as Address : undefined;
  const recipient = isAddress(recipientInput) ? recipientInput as Address : undefined;
  const isLocal = chainId === localChain.id;
  const isBscTestnet = chainId === bscTestnet.id;
  const isSupportedChain = isLocal || isBscTestnet;
  const isBscWrapper = isBscTestnet && Boolean(bscToken) && token?.toLowerCase() === bscToken.toLowerCase();

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

  const canInteract = Boolean(isConnected && isSupportedChain && token && spender && owner);
  const validAmount = Boolean(canInteract && amount && amount > ZERO);
  const valid = Boolean(validAmount && recipient);
  const isOwnerSigner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const submitApproval = (value: bigint) => token && spender && isOwnerSigner && writeContract.mutate({ address: token, abi: erc20Abi, functionName: "approve", args: [spender, value] });
  const approveFinite = () => amount !== undefined && submitApproval(amount);
  const revoke = () => submitApproval(ZERO);
  const wrap = () => isBscWrapper && wrapAmount && wrapAmount > ZERO && writeContract.mutate({ address: token!, abi: wrapperAbi, functionName: "deposit", value: wrapAmount });
  const unwrap = () => isBscWrapper && wrapAmount && wrapAmount > ZERO && writeContract.mutate({ address: token!, abi: wrapperAbi, functionName: "withdraw", args: [wrapAmount] });
  const exercise = () => valid && amount !== undefined && writeContract.mutate({
    address: spender!, abi: drainerAbi, functionName: "exerciseAllowance",
    args: [token!, owner!, recipient!, amount]
  });

  return <main className="mx-auto max-w-5xl px-5 py-10">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[.25em] text-cyan-300">Smart Contract Security Lab / Module 01</p><h1 className="mt-2 text-4xl font-bold">Approval Drainer</h1></div>
      {isConnected
        ? <button className="rounded-lg border border-slate-600 px-4 py-2" onClick={() => disconnect.mutate()}>Déconnecter {address?.slice(0, 6)}…</button>
        : <button className="rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-slate-950" onClick={() => connect.mutate({ connector: injected() })}>Connecter un wallet de test</button>}
    </header>

    <div className="mb-6 rounded-xl border border-amber-500/50 bg-amber-950/40 p-4 text-amber-100">
      <strong>Laboratoire de test uniquement.</strong> Connecter un wallet ne donne aucune allowance. Utilisez uniquement Anvil ou BNB Smart Chain Testnet (chain ID 97), et les tokens sans valeur de ce labo.
    </div>

    <section className="mb-5 rounded-2xl border border-cyan-700 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Obtenir WTBNB avec du tBNB</h2>
      <p className="mt-2 text-sm text-slate-300">Le tBNB natif sert au gas et ne supporte pas approve/transferFrom. Sur BNB Testnet, déposez du tBNB dans le wrapper pour recevoir le même montant de WTBNB, un ERC-20 de démonstration. Un peu de tBNB restera nécessaire pour payer les transactions.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={!isBscWrapper || isPending || !wrapAmount || wrapAmount <= ZERO} className="rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40" onClick={wrap}>Envelopper {amountInput || "0"} tBNB</button>
        <button disabled={!isBscWrapper || isPending || !wrapAmount || wrapAmount <= ZERO} className="rounded-lg border border-cyan-400 px-4 py-3 disabled:opacity-40" onClick={unwrap}>Récupérer {amountInput || "0"} tBNB</button>
      </div>
      {isBscTestnet && !bscToken && <p className="mt-3 text-sm text-amber-200">Configurez NEXT_PUBLIC_BSC_WTBNB_ADDRESS après le nouveau déploiement pour activer l'enveloppe.</p>}
    </section>

    <section className="grid gap-5 md:grid-cols-2">
      <article className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Inspecter une allowance</h2>
        <p className="mb-5 mt-2 text-sm text-slate-400">L'allowance est accordée par le propriétaire au spender. Les actions de lecture restent limitées aux réseaux de test configurés.</p>
        <label className="mb-3 block text-sm">ERC-20 à inspecter<input className="mt-1 w-full rounded bg-slate-800 p-3 font-mono" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Adresse de WTBNB" /></label>
        <label className="mb-3 block text-sm">Adresse du propriétaire<input className="mt-1 w-full rounded bg-slate-800 p-3 font-mono" value={ownerInput} onChange={e => setOwnerInput(e.target.value)} placeholder="Wallet qui a approuvé" /></label>
        <label className="block text-sm">Adresse du spender (contrat)<input className="mt-1 w-full rounded bg-slate-800 p-3 font-mono" value={spenderInput} onChange={e => setSpenderInput(e.target.value)} placeholder="Adresse d'ApprovalDrainer" /></label>
        {token && <div className="mt-3 break-all rounded border border-amber-500/30 p-3 text-xs text-amber-200">Token non certifié par cette interface : {name.data ?? "nom indisponible"} ({symbol.data ?? "symbole indisponible"}). Vérifiez l'adresse avant toute transaction.</div>}
        <div className="mt-4 rounded-lg bg-slate-800 p-4 text-sm">
          <p>Wallet signataire: <span className="break-all font-mono">{address ?? "—"}</span></p>
          <p className="mt-1">Propriétaire inspecté: <span className="break-all font-mono">{owner ?? "—"}</span></p>
          <p className="mt-1">Réseau: {chainId ?? "déconnecté"} {isLocal ? "(Anvil local)" : isBscTestnet ? "(BNB Testnet)" : isConnected ? "(réseau non autorisé — transactions bloquées)" : ""}</p>
          <p className="mt-3">Solde du propriétaire: {balance.data !== undefined && decimals.data !== undefined ? `${formatUnits(balance.data, decimals.data)} ${symbol.data ?? "tokens"}` : "—"}</p>
          <p className="mt-1">Allowance accordée: {allowance.data !== undefined && decimals.data !== undefined ? allowance.data === MAX_UINT ? "ILLIMITÉE — risque élevé" : `${formatUnits(allowance.data, decimals.data)} ${symbol.data ?? "tokens"}` : "—"}</p>
        </div>
        <button disabled={!canInteract || !isOwnerSigner || isPending} className="mt-4 w-full rounded-lg border border-cyan-400 px-4 py-3 disabled:opacity-40" onClick={revoke}>Révoquer (approve 0, propriétaire connecté requis)</button>
      </article>

      <article className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Parcours de démonstration : tBNB, WTBNB et allowance</h2>
        <ol className="mb-5 mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-400">
          <li>Le propriétaire connecte son wallet et enveloppe du tBNB en WTBNB.</li>
          <li>Le propriétaire accorde au drainer une allowance WTBNB limitée au montant choisi.</li>
          <li>Après signature, le propriétaire peut se déconnecter. L'allowance reste inscrite sur la blockchain.</li>
          <li>Un wallet tiers se connecte et déclenche le transfert vers un troisième wallet.</li>
        </ol>
        <label className="mb-3 block text-sm">Montant à autoriser / transférer<input type="number" min="0" step="any" className="mt-1 w-full rounded bg-slate-800 p-3" value={amountInput} onChange={e => setAmountInput(e.target.value)} /></label>
        <label className="mb-4 block text-sm">Destinataire du transfert<input className="mt-1 w-full rounded bg-slate-800 p-3 font-mono" value={recipientInput} onChange={e => setRecipientInput(e.target.value)} placeholder="Adresse du troisième wallet" /></label>
        <p className="mb-4 break-all text-xs text-slate-400">Appelant courant: {address ?? "—"}. Le propriétaire est le champ séparé ci-dessus. Tout appel déclencheur requiert une allowance suffisante.</p>
        <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-950/30 p-3 text-xs text-rose-100">
          <strong>À vérifier avant signature :</strong> le dépôt de tBNB dans le wrapper, dans le panneau précédent, est une vraie transaction qui émet des WTBNB. Ici, la transaction est <code>approve(spender, montant)</code> au profit de <code>ApprovalDrainer</code> ; elle n'effectue pas de dépôt dans un pool. Vérifiez le spender et le montant dans le wallet.
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button disabled={!validAmount || !isOwnerSigner || isPending} className="rounded-lg bg-cyan-300 px-3 py-3 font-semibold text-slate-950 disabled:opacity-40" onClick={approveFinite}>Propriétaire : autoriser le drainer</button>
          <button disabled={!valid || isPending} className="rounded-lg border border-rose-400 px-3 py-3 text-rose-200 disabled:opacity-40" onClick={exercise}>Wallet courant : déclencher</button>
        </div>
        {allowance.data !== undefined && allowance.data > ZERO && <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-100">Allowance active : {decimals.data !== undefined ? formatUnits(allowance.data, decimals.data) : "montant autorisé"} {symbol.data ?? "tokens"}. Le propriétaire peut se déconnecter ; un autre wallet peut encore déclencher le transfert.</p>}
        {!isOwnerSigner && isConnected && <p className="mt-3 text-xs text-amber-200">Pour approuver ou révoquer, reconnectez le wallet du propriétaire. Le wallet tiers peut déclencher le transfert ensuite.</p>}
      </article>
    </section>

    {(isPending || txHash || writeError || receipt.error) && <section className="mt-5 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm" aria-live="polite">
      <h2 className="font-semibold">État de la transaction</h2>
      {isPending && <p>En attente de confirmation dans le wallet…</p>}
      {txHash && <p className="break-all">Transaction envoyée : {txHash}</p>}
      {txHash && !receipt.isSuccess && !receipt.error && <p>En attente de confirmation sur la blockchain…</p>}
      {receipt.isSuccess && <p className="text-emerald-300">Transaction confirmée. Les soldes et l'allowance sont actualisés.</p>}
      {(writeError || receipt.error) && <p role="alert" className="break-words text-rose-300">Transaction rejetée ou échouée : {(writeError ?? receipt.error)?.message}</p>}
    </section>}
    <footer className="mt-8 text-sm text-slate-400">ApprovalDrainer reste volontairement vulnérable et sert uniquement au laboratoire. Ne lui accordez aucune permission sur des actifs réels. Le WTBNB n'est qu'un reçu ERC-20 contre du tBNB de test déposé dans le wrapper.</footer>
  </main>;
}
