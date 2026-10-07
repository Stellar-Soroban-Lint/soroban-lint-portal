mod common;

use bn254_verifier::Groth16Error;
use common::{deploy, load_fixture, replace_first_signal};
use soroban_sdk::{Env, vec};

#[test]
fn verifies_gnark_fixture_with_supplied_vk() {
    let env = Env::default();

    let fixture = load_fixture(&env);
    let client = deploy(&env);

    assert!(client.verify_proof(
        &fixture.verification_key,
        &fixture.proof,
        &fixture.public_signals
    ));
}

#[test]
fn rejects_gnark_fixture_with_wrong_public_signal() {
    let env = Env::default();
    let fixture = load_fixture(&env);
    let client = deploy(&env);
    let wrong_signals = replace_first_signal(&env, &fixture.public_signals, "22");

    assert!(!client.verify_proof(&fixture.verification_key, &fixture.proof, &wrong_signals));
}

#[test]
fn rejects_wrong_public_signal_count() {
    let env = Env::default();
    let fixture = load_fixture(&env);
    let client = deploy(&env);
    let wrong_signals = vec![&env];

    assert_eq!(
        client.try_verify_proof(&fixture.verification_key, &fixture.proof, &wrong_signals),
        Err(Ok(Groth16Error::MalformedVerifyingKey))
    );
}

#[test]
fn supplied_verification_key_is_used_without_admin_or_storage() {
    let env = Env::default();

    let fixture = load_fixture(&env);
    let client = deploy(&env);

    assert!(client.verify_proof(
        &fixture.verification_key,
        &fixture.proof,
        &fixture.public_signals
    ));
}
