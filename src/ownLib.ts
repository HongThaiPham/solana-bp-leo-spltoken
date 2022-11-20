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
import {
  createCreateMetadataAccountV3Instruction,
  DataV2,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Account,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function allInOneTransaction(
  connection: web3.Connection,
  payer: web3.Keypair,
  decimals: number,
  amount: number
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

  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeyPair.publicKey,
    payer.publicKey
  );

  console.log("Token account:", associatedTokenAccount.toBase58());

  const buffer = fs.readFileSync("assets/logo.png");
  const file = toMetaplexFile(buffer, "logo.png");

  const imageUri = await metaplex.storage().upload(file);
  console.log("image uri:", imageUri);

  const { uri } = await metaplex.nfts().uploadMetadata({
    name: "LEO TOKEN",
    symbol: "LEO",
    image: imageUri,
    description: "Token from LEO",
  });

  console.log("metadata uri:", uri);

  const tokenMetadata = {
    name: "LEO TOKEN",
    symbol: "LEO",
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2;

  const transaction = new web3.Transaction().add(
    web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeyPair.publicKey,
      space: MINT_SIZE,
      lamports: lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeyPair.publicKey,
      9,
      payer.publicKey,
      payer.publicKey,
      TOKEN_PROGRAM_ID
    ),
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeyPair.publicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          collectionDetails: null,
          data: tokenMetadata,
          isMutable: true,
        },
      }
    )
  );

  let tokenAccount: Account;
  try {
    // check if token account already exists
    tokenAccount = await getAccount(connection, associatedTokenAccount);
  } catch (error: unknown) {
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      const createTokenAccountInstruction =
        createAssociatedTokenAccountInstruction(
          payer.publicKey,
          associatedTokenAccount,
          payer.publicKey,
          mintKeyPair.publicKey
        );
      transaction.add(createTokenAccountInstruction);
    } else {
      throw error;
    }
  }

  transaction.add(
    createMintToInstruction(
      mintKeyPair.publicKey,
      associatedTokenAccount,
      payer.publicKey,
      amount * Math.pow(10, decimals)
    )
  );

  const transactionSignature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeyPair]
  );
  console.log(
    `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  );
}
