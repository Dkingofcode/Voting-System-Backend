const express = require('express');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Initialize Ethers.js
const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_PROJECT_ID);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;

// Define your contract ABI (Application Binary Interface)
const contractABI = [
    // Add your contract's ABI here
];

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// API endpoint to get proposals
app.get('/proposals', async (req, res) => {
    try {
        const proposals = await contract.getProposals();
        res.json(proposals);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching proposals');
    }
});

// API endpoint to vote
app.post('/vote', async (req, res) => {
    const { proposalId } = req.body;
    try {
        const tx = await contract.vote(proposalId);
        await tx.wait();
        res.send('Vote cast successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error casting vote');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
