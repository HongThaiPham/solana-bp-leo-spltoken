import { Connection, clusterApiUrl, PublicKey, Keypair } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js";
import * as fs from "fs";

const tokenName = "LEO TOKEN";
const description = "Token from Leo Pham";
const symbol = "LEO";
const sellerFeeBasisPoints = 100;
const imageFile = "leo1.png";
const imageFileUpdate = "leo2.png";

export async function createNftProgram(connection: Connection, user: Keypair) {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );
  const uriCreate = await getImageUri(metaplex, imageFile);
  const nft = await createNft(metaplex, uriCreate);
  const uriUpdate = await getImageUri(metaplex, imageFileUpdate);
  const nftUpdated = await updateNft(metaplex, uriUpdate, nft.mint.address);
  console.log(nftUpdated);
}

// create NFT
async function createNft(
  metaplex: Metaplex,
  uri: string
): Promise<NftWithToken> {
  const { nft } = await metaplex.nfts().create({
    uri: uri,
    name: tokenName,
    sellerFeeBasisPoints: sellerFeeBasisPoints,
    symbol: symbol,
  });

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );

  return nft;
}

async function updateNft(
  metaplex: Metaplex,
  uri: string,
  mintAddress: PublicKey
) {
  // get "NftWithToken" type from mint address
  const nft = await metaplex.nfts().findByMint({ mintAddress });

  // omit any fields to keep unchanged
  await metaplex.nfts().update({
    nftOrSft: nft,
    name: tokenName + "updated",
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: sellerFeeBasisPoints,
  });

  console.log(
    `Token Mint updated: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );
}

async function getImageUri(
  metaplex: Metaplex,
  imageName: string
): Promise<string> {
  // file to buffer
  const buffer = fs.readFileSync("assets/" + imageName);

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, imageName);

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file);
  console.log("image uri:", imageUri);

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex.nfts().uploadMetadata({
    name: tokenName,
    description: description,
    image: imageUri,
  });

  console.log("metadata uri:", uri);
  return uri;
}
