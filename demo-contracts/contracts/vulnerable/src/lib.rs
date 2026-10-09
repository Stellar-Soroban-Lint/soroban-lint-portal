#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Symbol, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInit = 1,
}

/// A deliberately unsafe contract used to demonstrate soroban-lint findings.
/// Do not copy any of this into real code.
#[contract]
pub struct VulnerableVault;

#[contractimpl]
impl VulnerableVault {
    // SL007 unprotected initializer, SL001 missing auth, SL005 missing TTL.
    pub fn init(env: Env, admin: Address) {
        env.storage().instance().set(&Symbol::new(&env, "init"), &true);
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
    }

    // SL001 missing auth, SL003 unchecked arithmetic, SL005 missing TTL.
    pub fn deposit(env: Env, who: Address, amount: u32) -> u32 {
        who.require_auth();
        let key = Symbol::new(&env, "bal");
        let current: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        let next = current + amount;
        env.storage().persistent().set(&key, &next);
        next
    }

    // SL002 panic hazard.
    pub fn peek(env: Env) -> u32 {
        let key = Symbol::new(&env, "bal");
        let value: u32 = env.storage().persistent().get(&key).unwrap();
        value
    }

    // SL004 unbounded storage growth, SL001 missing auth, SL005 missing TTL.
    pub fn add_item(env: Env, item: u32) {
        let key = Symbol::new(&env, "list");
        let mut list: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        list.push_back(item);
        env.storage().persistent().set(&key, &list);
    }

    // SL006 balance-like data written to temporary storage.
    pub fn cache(env: Env, balance: u32) {
        env.storage().temporary().set(&Symbol::new(&env, "balance"), &balance);
    }

    // SL008 unsafe block inside a contract crate.
    pub fn risky() -> u32 {
        let value = 0u32;
        let pointer = &value as *const u32;
        unsafe { *pointer }
    }
}
