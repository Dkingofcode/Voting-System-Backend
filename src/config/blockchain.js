const { ethers } = require('ethers');
const logger = require('../utils/logger');

class BlockchainConfig {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
  }

  async initialize() {
    try {
      // Initialize provider
      if (process.env.BLOCKCHAIN_NETWORK === 'localhost') {
        this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      } else if (process.env.INFURA_PROJECT_ID) {
        this.provider = new ethers.InfuraProvider(
          process.env.BLOCKCHAIN_NETWORK || 'sepolia',
          process.env.INFURA_PROJECT_ID
        );
      } else {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      }

      // Initialize wallet
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // Load contract ABI
      const contractABI = require('../contracts/abi/VotingSystem.json');
      
      // Initialize contract
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contractABI.abi,
        this.wallet
      );

      logger.info('Blockchain connection initialized successfully');
      
      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

      return true;
    } catch (error) {
      logger.error('Failed to initialize blockchain connection:', error);
      throw error;
    }
  }

  getProvider() {
    if (!this.provider) {
      throw new Error('Blockchain provider not initialized');
    }
    return this.provider;
  }

  getWallet() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet;
  }

  getContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    return this.contract;
  }

  async getGasPrice() {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice;
  }

  async estimateGas(transaction) {
    return await this.provider.estimateGas(transaction);
  }
}

module.exports = new BlockchainConfig();
