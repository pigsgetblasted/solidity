npx hardhat compile
npx hardhat test
npx hardhat coverage


yarn hardhat run ./scripts/deploy.js --network mainnet


# DEVNET

<details>
  <summary>OverwatchUpgradeable</summary>

```
truffle deploy --network devnet --contract=OverwatchUpgradeable
0x29b8a6c8bA6DB43303046E633d77B84b95a1163C
```
</details>


<details>
  <summary>ERC1967Proxy</summary>

```
truffle deploy --network devnet --contract=ERC1967Proxy --arg=0x29b8a6c8bA6DB43303046E633d77B84b95a1163C --arg=0x8129fc1c --arg=false
0x004223A05735A8942C75Cd4539C5395054464db0
```
</details>


<details>
  <summary>Shadows</summary>

```
truffle deploy --network devnet --contract=ShadowRegistryUpgradeableV2
# 0x29b8a6c8bA6DB43303046E633d77B84b95a1163C
# gas: 1808214


# initialize
truffle deploy --network devnet --contract=ERC1967Proxy \
  --arg="0x29b8a6c8bA6DB43303046E633d77B84b95a1163C" --arg="0x8129fc1c"
# 0x004223A05735A8942C75Cd4539C5395054464db0
# gas: 229459


truffle deploy --network devnet --contract=ERC721SurrogateUpgradeableV2
# 0x2FE938b56d8B2875E660F7f043010b6317724849
# gas: 2436922
```
</details>


---


# LOCAL
<details>
  <summary>Example</summary>

```
truffle deploy --network mumbai --contract=xxx
truffle run verify xxx --network mumbai
```
</details>


---


# GOERLI

<details>
  <summary>Overwatch</summary>

```
truffle deploy --network goerli --contract=Overwatch
truffle run verify Overwatch --network goerli
0xdbB7561B376620EC87cAFc687c8B849ab8b41A01
```
</details>


<details>
  <summary>ERC721Surrogate_Upgradeable</summary>

```
truffle deploy --network goerli --contract=ERC721Surrogate_Upgradeable
> 0x90ca61c9eeECC0EB7b2B5c00f0e52FeAb8298037
```
</details>

<details>
  <summary>ERC1967Proxy</summary>

```
truffle deploy --network goerli --contract=ERC1967Proxy \
  --arg=0x90ca61c9eeECC0EB7b2B5c00f0e52FeAb8298037 \
  --arg=0xc4d66de80000000000000000000000000000000000000000000000000000000000000000

# 0x975f1ace337025b69504b9bfcb4e856640d442ad
# 0x0000000000000000000000000000000000000000


// arg 1, the implementaiton address
000000000000000000000000c57508dba4c5281a28a39a03fdfe907ce1f876df

// arg 2, data (bytes)
0000000000000000000000000000000000000000000000000000000000000040
0000000000000000000000000000000000000000000000000000000000000024
c4d66de8
000000000000000000000000acfa101ece167f1894150e090d9471aee2dd3041 // principal address
00000000000000000000000000000000000000000000000000000000
```
</details>


<details>
  <summary>Overwatch</summary>

```
// 2190476
truffle deploy --network goerli --contract=Overwatch
0xC334FA9a1A120F20DD21f192d6a2bC7BE87834f6
```
</details>


---


# MAINNET
<details>
  <summary>Overwatch</summary>

```
truffle deploy --network mainnet --contract=Overwatch
0x2eC7cb5fC58b503BD98AA8CCe7b34a442BebB96c
```
</details>


<details>
  <summary>Shadows</summary>

```
2,289,846
truffle deploy --network mainnet --contract=ERC721Surrogate_Upgradeable --gas=2500000 --gasPrice=20000000000
0x71111bA549f32cEae5575782042BB2Cf8B30CCc7



truffle deploy --network mainnet --contract=ERC721SurrogateUpgradeableV2
truffle run verify ERC721SurrogateUpgradeableV2 --network mainnet
0xc57508DBA4C5281a28a39a03FDFe907CE1f876DF



truffle deploy --network mainnet --contract=ShadowRegistryUpgradeable
truffle run verify ShadowRegistryUpgradeable --network mainnet
0x6F47DfF42468a220378148Aa3Aed8846ee84aeD3


truffle deploy --network mainnet --contract=ERC1967Proxy \
  --arg="0x6F47DfF42468a220378148Aa3Aed8846ee84aeD3" --arg="0x8129fc1c"
truffle run verify ERC1967Proxy --network mainnet
0xF781583039fB1B0A08D7ececEFf53fE2a5908858



truffle deploy --network mainnet --contract=ShadowRegistryUpgradeableV2
truffle run verify ShadowRegistryUpgradeableV2 --network mainnet
0x3ec81d18c702e57595F959d36662c218E71e9a50


```
</details>
