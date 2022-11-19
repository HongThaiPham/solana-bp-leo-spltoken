import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import {
  bundlrStorage,
  findMetadataPda,
  keypairIdentity,
  Metaplex,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import * as fs from "fs";

export async function allInOneTransaction(
  connection: web3.Connection,
  payer: web3.Keypair,
  mintAuthority: web3.PublicKey,
  decimals: number
) {
  const lamports = await token.getMinimumBalanceForRentExemptMint(connection);
  const mintKeyPair = web3.Keypair.generate();

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  const metadataPDA = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: mintKeyPair.publicKey });
  // CMKJT1uhrJPKcBeVJS7RMf9Yc6yT2qnq2d7pNWZtTmYx

  //   console.log({ k: metadataPDA.toBase58(), b: metadataPDA.bump });

  const buffer = fs.readFileSync("assets/logo.png");
  const file = toMetaplexFile(buffer, "logo.png");

  const imageUri = await metaplex.storage().upload(file);
  console.log("image uri:", imageUri);
  const;
}
