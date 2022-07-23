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
  const walletJohn = anchor.web3.Keypair.generate();

  let wl: string[] = [
    walletAlice.publicKey.toString(),
    walletBob.publicKey.toString(),
  ];

  before(async () => {
    await provider.connection
      .requestAirdrop(walletAlice.publicKey, LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
    await provider.connection
      .requestAirdrop(walletBob.publicKey, LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
    await provider.connection
      .requestAirdrop(walletJohn.publicKey, LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
  });

  it("Is initialized with a WL!", async () => {
    await program.methods.initialize(wl).accounts({
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
    console.log('Alice votes YES: ', account);
  })

  it('Bob votes NO', async () => {
    await program.methods.vote("-").accounts({
      baseAccount: baseAccount.publicKey,
      user: walletBob.publicKey,
    })
    .signers([walletBob])
    .rpc()

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('Bob votes NO: ', account);
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
      console.log('Bob tries again to vote NO: ', account);
    } catch ({error}) {
      console.log('Bob tries again to vote NO: ');
      assert.equal(error.errorMessage, 'You can not vote, you have already done it');
      return;
    }
  })

  it('Initial wallet votes YES', async () => {
    try {
      await program.methods.vote("+").accounts({
        baseAccount: baseAccount.publicKey,
        user: wallet,
      })
      .rpc()
    } catch ({error}) {
      console.log('Initial wallet vote YES');
      assert.equal(error.errorMessage, 'You are not part of the whitelist');
      return;
    }
  })


  it('John votes NO', async () => {
    try {
      await program.methods.vote("-").accounts({
        baseAccount: baseAccount.publicKey,
        user: walletJohn.publicKey,
      })
      .signers([walletJohn])
      .rpc()
    } catch ({error}) {
      console.log('John votes NO');
      assert.equal(error.errorMessage, 'You are not part of the whitelist');
      return;
    }
  })
});
