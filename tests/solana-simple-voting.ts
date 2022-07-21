import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
const { SystemProgram } = anchor.web3;
const assert = require("assert");
import { SolanaSimpleVoting } from "../target/types/solana_simple_voting";

describe("solana-simple-voting", () => {

  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaSimpleVoting as Program<SolanaSimpleVoting>;
  const baseAccount = anchor.web3.Keypair.generate();
  const wallet = provider.wallet.publicKey;

  // Extra voters are
  const walletAlice = anchor.web3.Keypair.generate();
  const walletBob = anchor.web3.Keypair.generate();

  before(async () => {
    await provider.connection
      .requestAirdrop(walletAlice.publicKey, LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
    await provider.connection
      .requestAirdrop(walletBob.publicKey, LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
  });

  it("Is initialized!", async () => {

    await program.methods.initialize().accounts({
      baseAccount: baseAccount.publicKey,
      user: wallet,
      systemProgram: SystemProgram.programId
    })
    .signers([baseAccount])
    .rpc()

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
  });

  it('Alice votes YES', async () => {
    await program.methods.vote("+").accounts({
      baseAccount: baseAccount.publicKey,
      user: walletAlice.publicKey,
    })
    .signers([walletAlice])
    .rpc()

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
  })

  it('Bob votes NO', async () => {
    await program.methods.vote("-").accounts({
      baseAccount: baseAccount.publicKey,
      user: walletBob.publicKey,
    })
    .signers([walletBob])
    .rpc()

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('account: ', account);
  })

  it('Bob tries again to vote NO', async () => {
    try {
      await program.methods.vote("-").accounts({
        baseAccount: baseAccount.publicKey,
        user: walletBob.publicKey,
      })
      .signers([walletBob])
      .rpc()

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
    } catch ({error}) {
      assert.equal(error.errorMessage, 'You can not vote, you have already done it');
      return;
    }
  })

  it('initial wallets vote YES', async () => {
    await program.methods.vote("+").accounts({
      baseAccount: baseAccount.publicKey,
      user: wallet,
    })
    .rpc()
  })
});
