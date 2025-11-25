// backend/src/controllers/amount.controller.js
const Account = require('../models/AccountModel');
const Transaction = require('../models/TransactionModel'); // optional but recommended
const User = require('../models/UserModel');

const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId || (req.user && req.user._id);

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Amount must be > 0" });

    // Find user's account (one account per user in your app)
    let account = await Account.findOne({ userId });
    if (!account) {
      // If you want to create account automatically:
      account = new Account({
        userId,
        accountNumber: `CBI${Date.now()}${Math.floor(Math.random() * 1000)}`,
        accountType: 'savings',
        balance: 0,
        status: 'active'
      });
    }

    account.balance = Number(account.balance) + Number(amount);
    await account.save();

    // Optional: create transaction record for audit trail
    try {
      await Transaction.create({
        userId,
        accountId: account._id,
        type: 'credit',
        amount: Number(amount),
        description: 'Manual add money',
        status: 'completed',
        balanceAfter: account.balance
      });
    } catch (txErr) {
      console.warn('Warning: failed to create transaction record:', txErr.message);
    }

    return res.status(200).json({ message: `${amount} added successfully`, account });
  } catch (err) {
    console.error("Add money error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deductMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId || (req.user && req.user._id);

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Amount must be > 0" });

    // Use Account model — this is the key fix
    const account = await Account.findOne({ userId });
    if (!account) return res.status(404).json({ message: "No account found" });

    if (Number(account.balance) < Number(amount)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    account.balance = Number(account.balance) - Number(amount);
    await account.save();

    // Optional: transaction record
    try {
      await Transaction.create({
        userId,
        accountId: account._id,
        type: 'debit',
        amount: Number(amount),
        description: 'Manual deduct money',
        status: 'completed',
        balanceAfter: account.balance
      });
    } catch (txErr) {
      console.warn('Warning: failed to create transaction record:', txErr.message);
    }

    return res.status(200).json({ message: `${amount} deducted successfully`, account });
  } catch (err) {
    console.error("Deduct money error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getBalance = async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user._id);

    let account = await Account.findOne({ userId });
    if (!account) {
      // If you prefer to auto-create (as earlier controller did), create default
      account = new Account({
        userId,
        accountNumber: `CBI${Date.now()}${Math.floor(Math.random() * 1000)}`,
        accountType: 'savings',
        balance: 0,
        status: 'active'
      });
      await account.save();
    }

    return res.status(200).json(account);
  } catch (err) {
    console.error("Get balance error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  addMoney,
  deductMoney,
  getBalance
};
