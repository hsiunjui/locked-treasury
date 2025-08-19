# 环境
```node
- node v20.19.2
- npm 10.8.2
```

# 创建项目
```bash
mkdir locked-treasury
cd locked-treasury
npm init -y
````

# hardhat
```js
npm install --save-dev hardhat
npm install --save-dev @nomicfoundation/hardhat-toolbox # --force
```

# 初始化hardhat
```js
touch .env
npx hardhat --init (Create a JavaScript project) // --force
```

# 安装 OpenZeppelin 库
```js
npm install @openzeppelin/contracts // --forces
```

# 创建合约
- contract

# 部署
```js
npx hardhat run scripts/deploy.js --network sepolia
```

# 验证合约
```js
npm install --save-dev @nomicfoundation/hardhat-verify

npx hardhat verify --network sepolia 0xYourDeployedContractAddress
```