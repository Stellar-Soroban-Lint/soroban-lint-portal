#![no_std]

use soroban_sdk::{
    Env, Vec, contract, contracterror, contractimpl, contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Groth16Error {
    MalformedVerifyingKey = 0,
}

#[derive(Clone)]
#[contracttype]
pub struct VerificationKey {
    pub alpha: Bn254G1Affine,
    pub beta: Bn254G2Affine,
    pub gamma: Bn254G2Affine,
    pub delta: Bn254G2Affine,
    pub ic: Vec<Bn254G1Affine>,
}

#[derive(Clone)]
#[contracttype]
pub struct Proof {
    pub a: Bn254G1Affine,
    pub b: Bn254G2Affine,
    pub c: Bn254G1Affine,
}

#[contract]
pub struct Groth16Verifier;

#[contractimpl]
impl Groth16Verifier {
    pub fn verify_proof(
        env: Env,
        verification_key: VerificationKey,
        proof: Proof,
        public_inputs: Vec<Bn254Fr>,
    ) -> Result<bool, Groth16Error> {
        if public_inputs.len() + 1 != verification_key.ic.len() {
            return Err(Groth16Error::MalformedVerifyingKey);
        }

        let bn = env.crypto().bn254();
        let mut vk_x = verification_key.ic.get(0).unwrap();
        for (signal, point) in public_inputs.iter().zip(verification_key.ic.iter().skip(1)) {
            let term = bn.g1_mul(&point, &signal);
            vk_x = bn.g1_add(&vk_x, &term);
        }

        let neg_a = -proof.a;
        let lhs = soroban_sdk::vec![&env, neg_a, verification_key.alpha, vk_x, proof.c];
        let rhs = soroban_sdk::vec![
            &env,
            proof.b,
            verification_key.beta,
            verification_key.gamma,
            verification_key.delta
        ];

        Ok(bn.pairing_check(lhs, rhs))
    }
}
