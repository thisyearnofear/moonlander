#!/usr/bin/env node

/**
 * Helper script to sign the Farcaster manifest
 * 
 * Usage:
 *   node scripts/sign-manifest.js <domain> <privateKey>
 * 
 * Example:
 *   node scripts/sign-manifest.js moonlander.example.com 0x...
 */

const fs = require('fs');
const path = require('path');

// This is a reference script. For actual signing, use:
// - Farcaster's official signer tools
// - ethers.js or web3.js libraries
// - Your Farcaster custody address

function signManifest(domain, privateKey) {
    console.log(`
Manifest Signing Instructions
==============================

To properly sign your manifest, you have two options:

Option 1: Using Farcaster Developer Tools (Recommended)
1. Go to: https://farcaster.xyz/~/settings/developer-tools
2. Enable Developer Mode
3. Use the Manifest Auditor tool
4. It will guide you through signing with your account

Option 2: Manual Signing
1. Install dependencies:
   npm install ethers

2. Run this script with your private key:
   node scripts/sign-manifest.js ${domain} <YOUR_PRIVATE_KEY>

3. The script will output the signature and public key
4. Update .well-known/farcaster.json with the values

Current domain: ${domain}

The signature proves you own this domain via your Farcaster account.
    `);

    if (privateKey) {
        console.log('NOTE: Signing with private keys is for development only.');
        console.log('Use official Farcaster tools for production deployment.');
    }
}

const domain = process.argv[2];
const privateKey = process.argv[3];

if (!domain) {
    console.error('Usage: node scripts/sign-manifest.js <domain> [privateKey]');
    process.exit(1);
}

signManifest(domain, privateKey);
