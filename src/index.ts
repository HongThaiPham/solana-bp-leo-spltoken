import { initializeKeypair } from "./initializeKeypair";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import {
  burnTokens,
  createNewMint,
  createTokenAccount,
  createTokenMetadata,
  mintTokens,
  transferTokens,
  updateTokenMetadata,
} from "./utils";
import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
} from "@metaplex-foundation/js";

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  const user = await initializeKeypair(connection);

  console.log("PublicKey:", user.publicKey.toBase58());

  // const mint = await createNewMint(
  //   connection,
  //   user, // We'll pay the fees
  //   user.publicKey, // We're the mint authority
  //   user.publicKey, // And the freeze authority >:)
  //   2 // Only two decimals!
  // );
  const mint = new web3.PublicKey(
    "Hasc9TUyuBpzwmcmdTPGd2oKGikPpccHxm2QHV6nYGqJ"
  );

  const receiver = web3.Keypair.generate().publicKey;
  // const receiverTokenAccount = await createTokenAccount(
  //   connection,
  //   user,
  //   mint,
  //   receiver
  // );

  // const tokenAccount = await createTokenAccount(
  //   connection,
  //   user,
  //   mint,
  //   user.publicKey // Associating our address with the token account
  // );
  const tokenAccount = await token.getAssociatedTokenAddress(
    mint,
    user.publicKey
  );
  // Mint 100 tokens to our address
  // await mintTokens(connection, user, mint, tokenAccount, user, 100);

  // await transferTokens(
  //   connection,
  //   user,
  //   tokenAccount,
  //   receiverTokenAccount.address,
  //   user.publicKey,
  //   50,
  //   mint
  // );

  // await burnTokens(connection, user, tokenAccount, mint, user, 25);

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  // Calling the token
  // await createTokenMetadata(
  //   connection,
  //   metaplex,
  //   mint,
  //   user,
  //   "LEO Token", // Token name
  //   "LEO", // Token symbol
  //   "LEO token for LEO party" // Token description
  // );

  await updateTokenMetadata(
    connection,
    metaplex,
    mint,
    user,
    "OEL Token- Updated", // Token name
    "OEL", // Token symbol
    "The revert token of LEO token" // Token description
  );
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
