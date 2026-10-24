const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');

const { requireAuth } = require('../middleware/auth.middleware');
const FinanceTransaction = require('../models/FinanceTransaction');
const FinanceBudget = require('../models/FinanceBudget');

const router = express.Router();

router.use(requireAuth);

const categories = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Food',
  'Transport',
  'Shopping',
  'Housing',
  'Utilities',
  'Healthcare',
  'Education',
  'Entertainment',
  'Subscriptions',
  'Travel',
  'Savings',
  'Other',
];

const transactionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().finite().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(50),
  date: z.coerce.date().optional(),
  paymentMethod: z.enum([
    'Cash',
    'Card',
    'Bank Transfer',
    'UPI',
    'Other',
  ]).optional(),
  notes: z.string().max(500).optional(),
});

const budgetSchema = z.object({
  category: z.string().trim().min(1).max(50),
  limitAmount: z.coerce.number().finite().positive().max(1_000_000_000),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

function getOwnerId(req) {
  return req.userId;
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function getMonthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return {
    start: new Date(year, monthNumber - 1, 1),
    end: new Date(year, monthNumber, 1),
  };
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/finance/summary?month=2026-10
router.get('/summary', async (req, res, next) => {
  try {
    const month = req.query.month || getCurrentMonth();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must use YYYY-MM format.',
      });
    }

    const { start, end } = getMonthRange(month);
    const owner = getOwnerId(req);

    const [totals, budgets] = await Promise.all([
      FinanceTransaction.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(owner),
            date: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      FinanceBudget.find({ owner, month }).lean(),
    ]);

    const income = totals.find((item) => item._id === 'income')?.total || 0;
    const expenses = totals.find((item) => item._id === 'expense')?.total || 0;

    const spentByCategory = await FinanceTransaction.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(owner),
          type: 'expense',
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const spendingMap = new Map(
      spentByCategory.map((item) => [item._id, item.spent])
    );

    const budgetDetails = budgets.map((budget) => {
      const spent = spendingMap.get(budget.category) || 0;

      return {
        ...budget,
        spent,
        remaining: budget.limitAmount - spent,
        percentage: Math.round((spent / budget.limitAmount) * 100),
      };
    });

    res.json({
      success: true,
      month,
      summary: {
        income,
        expenses,
        net: income - expenses,
        transactionCount: totals.reduce((sum, item) => sum + item.count, 0),
        totalBudget: budgets.reduce((sum, item) => sum + item.limitAmount, 0),
      },
      budgets: budgetDetails,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/finance/transactions?month=2026-10&type=expense
router.get('/transactions', async (req, res, next) => {
  try {
    const filter = { owner: getOwnerId(req) };

    if (req.query.type) {
      if (!['income', 'expense'].includes(req.query.type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction type.',
        });
      }
      filter.type = req.query.type;
    }

    if (req.query.month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month)) {
        return res.status(400).json({
          success: false,
          message: 'Month must use YYYY-MM format.',
        });
      }

      const { start, end } = getMonthRange(req.query.month);
      filter.date = { $gte: start, $lt: end };
    }

    const transactions = await FinanceTransaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .lean();

    res.json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
});

// POST /api/finance/transactions
router.post('/transactions', async (req, res, next) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction data.',
        errors: parsed.error.flatten(),
      });
    }

    const transaction = await FinanceTransaction.create({
      ...parsed.data,
      owner: getOwnerId(req),
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/finance/transactions/:id
router.patch('/transactions/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID.',
      });
    }

    const parsed = transactionSchema.partial().safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide valid transaction fields to update.',
        errors: parsed.success ? undefined : parsed.error.flatten(),
      });
    }

    const transaction = await FinanceTransaction.findOneAndUpdate(
      { _id: req.params.id, owner: getOwnerId(req) },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID.',
      });
    }

    const transaction = await FinanceTransaction.findOneAndDelete({
      _id: req.params.id,
      owner: getOwnerId(req),
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/finance/budgets?month=2026-10
router.get('/budgets', async (req, res, next) => {
  try {
    const filter = { owner: getOwnerId(req) };

    if (req.query.month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month)) {
        return res.status(400).json({
          success: false,
          message: 'Month must use YYYY-MM format.',
        });
      }
      filter.month = req.query.month;
    }

    const budgets = await FinanceBudget.find(filter)
      .sort({ month: -1, category: 1 })
      .lean();

    res.json({ success: true, budgets });
  } catch (error) {
    next(error);
  }
});

// POST /api/finance/budgets
router.post('/budgets', async (req, res, next) => {
  try {
    const parsed = budgetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid budget data.',
        errors: parsed.error.flatten(),
      });
    }

    const budget = await FinanceBudget.create({
      ...parsed.data,
      owner: getOwnerId(req),
    });

    res.status(201).json({ success: true, budget });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A budget already exists for this category and month.',
      });
    }
    next(error);
  }
});

// PATCH /api/finance/budgets/:id
router.patch('/budgets/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid budget ID.',
      });
    }

    const parsed = budgetSchema.partial().safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide valid budget fields to update.',
        errors: parsed.success ? undefined : parsed.error.flatten(),
      });
    }

    const budget = await FinanceBudget.findOneAndUpdate(
      { _id: req.params.id, owner: getOwnerId(req) },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    res.json({ success: true, budget });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A budget already exists for this category and month.',
      });
    }
    next(error);
  }
});

// DELETE /api/finance/budgets/:id
router.delete('/budgets/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid budget ID.',
      });
    }

    const budget = await FinanceBudget.findOneAndDelete({
      _id: req.params.id,
      owner: getOwnerId(req),
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    res.json({ success: true, message: 'Budget deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;