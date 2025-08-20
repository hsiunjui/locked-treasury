# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

# 环境
- node v22.18.0
- npm 10.9.3

# 创建项目
```shell
mkdir locked-treasury
cd locked-treasury
npm init -y
```

# hardhat (V2)
```shell
npm install --save-dev hardhat@^2.22.6
npm install --save-dev @nomicfoundation/hardhat-toolbox@^3.0.0 dotenv
```
# 初始化
```shell
npx hardhat # javascript project
```

# 添加配置
- hardhat.config.js
- .env
- scripts/deploy.js

# 编译合约
```shell
npx hardhat compile
```

# 部署合约
```shell
npx hardhat run scripts/deploy.js --network sepolia
```
# 验证合约
- scripts/verify.js
```shell
npx hardhat run scripts/verify.js --network sepolia
```