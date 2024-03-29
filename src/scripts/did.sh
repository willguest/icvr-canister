#!/usr/bin/env bash

function generate_did() {
    local canister=$1
    canister_root="src/declarations/$canister"

    cargo build --manifest-path="$Cargo.toml" \
    --target wasm32-unknown-unknown \
    --release --package "$canister"

    candid-extractor "target/wasm32-unknown-unknown/release/$canister.wasm" > "$canister_root/$canister.did"
}

# The list of canisters of your project
CANISTERS=frontend,backend

for canister in $(echo $CANISTERS | sed "s/,/ /g")
do
  generate_did "$canister"
done
