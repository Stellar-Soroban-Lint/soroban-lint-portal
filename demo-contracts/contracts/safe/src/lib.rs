#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

/// A minimal, lint-clean contract: every state-changing entrypoint authorizes
/// the caller, mutates storage once, and extends the entry's TTL.
#[contract]
pub struct SafeVault;

#[contractimpl]
impl SafeVault {
    pub fn set_balance(env: Env, who: Address, amount: i128) {
        who.require_auth();
        let key = Symbol::new(&env, "bal");
        env.storage().persistent().set(&key, &amount);
        env.storage().persistent().extend_ttl(&key, 100, 1_000);
    }

    pub fn balance(env: Env) -> i128 {
        let key = Symbol::new(&env, "bal");
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}
