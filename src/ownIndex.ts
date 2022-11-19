import * as web3 from "@solana/web3.js";
import { initializeKeypair } from "./initializeKeypair";
import { allInOneTransaction } from "./ownLib";
async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  const user = await initializeKeypair(connection);

  console.log("PublicKey:", user.publicKey.toBase58());
  await allInOneTransaction(connection, user, user.publicKey, 9);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
