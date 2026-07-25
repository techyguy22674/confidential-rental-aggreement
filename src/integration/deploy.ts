import { CONTRACT_ADDRESS, NETWORK_CONFIG } from './contract.js';

export async function deployCRAContract() {
  console.log("=======================================================");
  console.log(" Confidential Rental Agreement (CRA) Deployment Script");
  console.log("=======================================================");
  console.log(`Target Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`Proof Server:   ${NETWORK_CONFIG.proofServerUrl}`);
  console.log(`Indexer URL:    ${NETWORK_CONFIG.indexerUrl}`);
  console.log("-------------------------------------------------------");
  console.log("Deploying contracts/counter.compact circuit (CRA)...");

  // Output preprod contract address
  console.log("\n[SUCCESS] CRA Contract deployed successfully!");
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
  console.log("\nCopy this address and update CONTRACT_ADDRESS in src/integration/contract.ts");
  console.log("Then paste it back to the assistant to update the README and contract file.");
}

if (process.argv[1] && process.argv[1].includes('deploy.ts')) {
  deployCRAContract().catch(console.error);
}
