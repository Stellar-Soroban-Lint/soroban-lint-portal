#[allow(dead_code)]
mod common;

use common::fr_from_str;
use soroban_sdk::Env;

#[test]
fn caller_accepts_largest_canonical_public_input() {
    let env = Env::default();

    fr_from_str(
        &env,
        "21888242871839275222246405745257275088548364400416034343698204186575808495616",
    );
}

#[test]
#[should_panic(expected = "public signal must be canonical")]
fn caller_rejects_noncanonical_public_input() {
    let env = Env::default();

    fr_from_str(
        &env,
        "21888242871839275222246405745257275088548364400416034343698204186575808495617",
    );
}
