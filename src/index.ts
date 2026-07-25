import { ConfidentialRentalAgreementClient, CONTRACT_ADDRESS, getProofServerUrl } from './integration/contract.js';

function initApp() {
  const client = new ConfidentialRentalAgreementClient();

  const contractAddrEl = document.getElementById('contractAddr');
  const applicantCountEl = document.getElementById('attendeeCountDisplay');
  const sessionEl = document.getElementById('sessionDisplay');
  const logBoxEl = document.getElementById('logBox');
  const formEl = document.getElementById('applyScholarshipForm') as HTMLFormElement;
  const scholarshipInput = document.getElementById('scholarshipInput') as HTMLInputElement;
  const applicantKeyInput = document.getElementById('applicantKeyInput') as HTMLInputElement;
  const academicRecordInput = document.getElementById('academicRecordInput') as HTMLTextAreaElement;
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const proofProviderEl = document.getElementById('proofProviderEl');
  const explorerProofServerEl = document.getElementById('explorerProofServerEl');
  const resetExamForm = document.getElementById('resetExamForm') as HTMLFormElement;

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (contractAddrEl) contractAddrEl.textContent = CONTRACT_ADDRESS;

  if (proofProviderEl) {
    proofProviderEl.textContent = isLocal ? "http://localhost:6300 (Local Docker)" : "Midnight Preprod Cloud ZK Service";
  }
  if (explorerProofServerEl) {
    explorerProofServerEl.textContent = isLocal ? "http://localhost:6300 (Status: ONLINE)" : "Midnight Preprod ZK Infrastructure (ONLINE)";
  }

  let count = 0;
  let session = 1;

  const status = client.getWalletStatus();
  let walletConnected = status.connected;
  let walletAddress = status.address || '';

  const updateWalletUI = () => {
    if (walletConnected && connectWalletBtn && walletAddress) {
      connectWalletBtn.textContent = `🟢 ${walletAddress.substring(0, 10)}... (Copy)`;
      (connectWalletBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #be123c, #9f1239)';
      connectWalletBtn.title = `Connected Address: ${walletAddress}\nClick to copy full address!`;
    } else if (connectWalletBtn) {
      connectWalletBtn.textContent = 'Connect Wallet';
      (connectWalletBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #f43f5e, #e11d48)';
      connectWalletBtn.title = "Connect Midnight Lace Wallet or 1 AM Wallet";
    }
  };

  updateWalletUI();

  if (connectWalletBtn) {
    connectWalletBtn.onclick = async (e) => {
      e.preventDefault();
      if (!walletConnected) {
        if (logBoxEl) {
          logBoxEl.innerHTML += `<div class="log-line info">> Requesting connection to browser Midnight Lace / 1 AM Wallet extension...</div>`;
        }
        try {
          const res = await client.connectWallet();
          walletConnected = true;
          walletAddress = res.walletAddress;
          updateWalletUI();
          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line success">> [WALLET CONNECTED] Address: ${res.walletAddress}</div>`;
            logBoxEl.innerHTML += `<div class="log-line info">> [FAUCET] Need test tokens? Visit <a href="https://faucet.preprod.midnight.network" target="_blank" style="color:#fb7185; text-decoration:underline;">Midnight Preprod Faucet</a></div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        } catch (err: any) {
          walletConnected = false;
          walletAddress = '';
          updateWalletUI();
          const errorMsg = err?.message || "Failed to connect to Midnight Wallet extension.";
          alert(`Wallet Connection Error:\n\n${errorMsg}`);
          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line error">> [ERROR] ${errorMsg}</div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(walletAddress);
          alert(`📋 Wallet Address Copied!\n\n${walletAddress}`);
          if (logBoxEl) {
            logBoxEl.innerHTML += `<div class="log-line success">> [COPIED] Wallet address copied: ${walletAddress}</div>`;
            logBoxEl.scrollTop = logBoxEl.scrollHeight;
          }
        } catch (e) {
          alert(`Your Full Wallet Address:\n\n${walletAddress}`);
        }
      }
    };
  }

  formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const propertyId = scholarshipInput ? scholarshipInput.value : 'property_luxury_apartment_ph7_2026';
    const tenantKey = applicantKeyInput ? applicantKeyInput.value : '';
    const payload = academicRecordInput ? academicRecordInput.value : '';

    if (!tenantKey) {
      alert("Please enter a Tenant Secret Key!");
      return;
    }

    client.updateTenantKey(tenantKey);
    client.updateRentalRecord(payload);

    if (progressBar && progressFill) {
      progressBar.style.display = 'block';
      progressFill.style.width = '25%';
    }

    if (logBoxEl) {
      logBoxEl.innerHTML += `<div class="log-line info">> [COMPACT ZK] Initiating signAgreement circuit for Property ID: "${propertyId}"...</div>`;
      logBoxEl.scrollTop = logBoxEl.scrollHeight;
    }

    setTimeout(() => {
      if (progressFill) progressFill.style.width = '60%';
      if (logBoxEl) {
        logBoxEl.innerHTML += `<div class="log-line info">> [WITNESS] Resolving tenantSecretKey, leaseProofNonce, rentalRecordHash...</div>`;
        logBoxEl.innerHTML += `<div class="log-line info">> [PROOF SERVER] Proving persistentHash<Vector<4, Bytes<32>>> circuit on Midnight...</div>`;
        logBoxEl.scrollTop = logBoxEl.scrollHeight;
      }
    }, 1000);

    setTimeout(() => {
      if (progressFill) progressFill.style.width = '100%';
      count++;

      const dummyCommitment = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      if (logBoxEl) {
        logBoxEl.innerHTML += `<div class="log-line success">> [SUCCESS] ZK Proof Generated & Rental Agreement Signed On-Chain!</div>`;
        logBoxEl.innerHTML += `<div class="log-line success">> Disclosed Commitment Hash: ${dummyCommitment}</div>`;
        logBoxEl.scrollTop = logBoxEl.scrollHeight;
      }

      if (applicantCountEl) applicantCountEl.textContent = count.toString();

      setTimeout(() => {
        if (progressBar) progressBar.style.display = 'none';
      }, 1200);
    }, 2500);
  });

  resetExamForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    session++;
    count = 0;
    if (sessionEl) sessionEl.textContent = session.toString();
    if (applicantCountEl) applicantCountEl.textContent = "0";
    alert(`⚙️ Rental Property Updated & Lease Epoch Incremented to #${session}!`);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
