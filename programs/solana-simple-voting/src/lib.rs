use anchor_lang::prelude::*;

declare_id!("DBC3gQSeCsaJPJy31Q9Yar2E3y2DESKwpDGL6gjEGU5M");

#[program]
pub mod solana_simple_voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.voters = Vec::new();
        base_account.yes = 0;
        base_account.no = 0;
        Ok(())
    }

    pub fn vote(ctx: Context<VoteCtx>, sign: String) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let voter = ctx.accounts.user.key().to_string();

        if !base_account.voters.contains(&voter) {
            if sign == "-" {
                base_account.no += 1;
            } else if sign == "+" {
                base_account.yes += 1;
            }
            base_account.voters.push(voter);
        } else {
            return err!(MyError::NoVote);
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = BaseAccount::LEN)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct VoteCtx<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    pub user: Signer<'info>
}


#[account]
#[derive(Default)]
pub struct BaseAccount {
    voters: Vec<String>,
    yes: u8,
    no: u8,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stor
const MAX_VOTE_LENGTH: usize = 1 * 4; // 280 chars maes the size of the string.


impl BaseAccount {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + STRING_LENGTH_PREFIX + MAX_VOTE_LENGTH;
}

#[error_code]
pub enum MyError {
    #[msg("You can not vote, you have already done it")]
    NoVote
}
