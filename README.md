# Blockchain-Based Voting System

A production-grade, secure, and transparent voting system built with blockchain technology to ensure immutable and verifiable election results.

## 🌟 Features

### Core Features
- ✅ **Blockchain Integration** - Ethereum smart contracts for tamper-proof voting
- ✅ **Anonymous Voting** - Privacy-preserving voter identity using cryptographic hashing
- ✅ **Real-time Results** - Live vote counting with blockchain verification
- ✅ **Multi-Election Support** - Manage multiple concurrent elections
- ✅ **Voter Verification** - KYC and identity verification system
- ✅ **Audit Trail** - Complete immutable record on blockchain
- ✅ **Role-Based Access** - Admin, Election Officer, and Voter roles

### Security Features
- 🔐 **End-to-End Encryption** - Secure data transmission
- 🔐 **JWT Authentication** - Token-based authentication with refresh tokens
- 🔐 **2FA Support** - Two-factor authentication option
- 🔐 **Rate Limiting** - DDoS protection and abuse prevention
- 🔐 **Input Validation** - Comprehensive request validation
- 🔐 **Account Lockout** - Brute force attack protection

### Technical Features
- 🚀 **RESTful API** - Clean and documented API endpoints
- 🚀 **Redis Caching** - High-performance caching layer
- 🚀 **Swagger Documentation** - Interactive API documentation
- 🚀 **Docker Support** - Full containerization
- 🚀 **Logging & Monitoring** - Comprehensive logging with Winston
- 🚀 **Error Handling** - Centralized error management

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0
- Hardhat (for blockchain development)
- Infura or Alchemy account (for Ethereum connectivity)
- MetaMask or similar Web3 wallet

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/voting-system.git
cd voting-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy Smart Contract

#### Local Blockchain (Hardhat)
```bash
# Terminal 1 - Start local blockchain
npx hardhat node

# Terminal 2 - Deploy contract
npm run deploy:local
```

#### Testnet (Sepolia)
```bash
# Make sure you have Sepolia ETH in your wallet
npm run deploy
```

### 4. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# With Docker
docker-compose up -d
```

### 5. Access the Application

- **API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
voting-system/
├── src/
│   ├── config/          # Configuration files
│   ├── contracts/       # Solidity smart contracts
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/               # Test files
├── scripts/             # Deployment scripts
├── logs/                # Application logs
└── docker-compose.yml   # Docker configuration
```

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Elections
- `GET /api/v1/elections` - Get all elections
- `GET /api/v1/elections/:id` - Get election details
- `POST /api/v1/elections` - Create election (Officer/Admin)
- `PUT /api/v1/elections/:id` - Update election (Officer/Admin)
- `POST /api/v1/elections/:id/publish` - Publish election
- `GET /api/v1/elections/:id/results` - Get election results
- `POST /api/v1/elections/:id/end` - End election

### Voting
- `POST /api/v1/votes` - Cast vote
- `GET /api/v1/votes/my-votes` - Get user's voting history
- `GET /api/v1/votes/verify/:txHash` - Verify vote on blockchain
- `GET /api/v1/votes/status/:electionId` - Check voting status

### Voters
- `GET /api/v1/voters/profile` - Get voter profile
- `POST /api/v1/voters/register` - Register as voter
- `PUT /api/v1/voters/profile` - Update profile
- `POST /api/v1/voters/verify` - Submit verification documents

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📦 Deployment

### Heroku

```bash
heroku create your-voting-system
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

### AWS EC2

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb redis-server

# Clone and setup
git clone your-repo
cd voting-system
npm install
npm start
```

### Docker

```bash
docker-compose up -d
```

## 🔒 Security Best Practices

1. **Never commit** `.env` file or private keys
2. **Use strong passwords** for all accounts
3. **Enable 2FA** for admin accounts
4. **Regular security audits** of smart contracts
5. **Keep dependencies updated** with `npm audit`
6. **Use HTTPS** in production
7. **Implement IP whitelisting** for admin endpoints
8. **Regular backups** of database

## 🛠️ Smart Contract Interaction

```javascript
// Example: Cast a vote using ethers.js
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Cast vote
const tx = await contract.castVote(electionId, candidateId, voterHash);
await tx.wait();
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Logs**: Check `logs/` directory
- **Blockchain Events**: Monitor smart contract events
- **Database Metrics**: Use MongoDB Atlas monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - [@yourhandle](https://twitter.com/yourhandle)

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contracts
- Hardhat for blockchain development
- Express.js and Node.js communities

## 📞 Support

For support, email support@votingsystem.com or open an issue.

---

**⚠️ Important**: This is a voting system. Ensure proper security audits before deploying to production!
```

## 🎯 Production Deployment Checklist

Before deploying to production:

- [ ] Smart contract security audit completed
- [ ] All environment variables set securely
- [ ] Database properly secured and backed up
- [ ] Redis configured with password
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured appropriately
- [ ] Logging and monitoring setup
- [ ] Error tracking configured (Sentry)
- [ ] Load balancing configured
- [ ] Backup and recovery plan in place
- [ ] DDoS protection enabled
- [ ] Regular security updates scheduled
- [ ] Compliance requirements met
- [ ] Disaster recovery plan documented

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Compile smart contract
npm run compile

# Deploy to testnet
npm run deploy

# Start development server
npm run dev

# Run tests
npm test

# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
