use anchor_lang::prelude::*;

declare_id!("DBC3gQSeCsaJPJy31Q9Yar2E3y2DESKwpDGL6gjEGU5M");

#[program]
pub mod solana_simple_voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, wl: Vec<String>,) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.wl = wl;
        base_account.voters = Vec::new();
        base_account.yes = 0;
        base_account.no = 0;
        Ok(())
    }

    pub fn vote(ctx: Context<VoteCtx>, sign: String) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let voter = ctx.accounts.user.key().to_string();

        if base_account.wl.contains(&voter) {
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
        } else {
            return err!(MyError::NoWL);
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
    wl: Vec<String>,
    voters: Vec<String>,
    yes: u8,
    no: u8,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const VECTOR_LENGTH_PREFIX: usize = 4;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_STRING_LENGTH: usize = 15 * 4; // 50 chars max.
const VECTOR_STRING_LENGTH: usize = ( STRING_LENGTH_PREFIX +  MAX_STRING_LENGTH ) * 10;
const MAX_VOTE_LENGTH: usize = 8;


impl BaseAccount {
    const LEN: usize = DISCRIMINATOR_LENGTH + VECTOR_LENGTH_PREFIX + ( VECTOR_STRING_LENGTH * 2 ) + (MAX_VOTE_LENGTH * 2 );
}

#[error_code]
pub enum MyError {
    #[msg("You can not vote, you have already done it")]
    NoVote,
    #[msg("You are not part of the whitelist")]
    NoWL
}
