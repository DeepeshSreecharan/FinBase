const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// Enhanced validation schemas with better error messages
const schemas = {
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Name should only contain letters and spaces',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    phone: Joi.string()
      .pattern(/^[6-9][0-9]{9}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Password confirmation does not match password'
      }),
    dateOfBirth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .required()
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'date.min': 'Please provide a valid date of birth'
      }),
    address: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Address must be at least 10 characters long',
        'string.max': 'Address cannot exceed 500 characters'
      }),
    agreedToTerms: Joi.boolean()
      .valid(true)
      .required()
      .messages({
        'any.only': 'You must agree to terms and conditions'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(1)
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        'string.pattern.base': 'Name should only contain letters and spaces'
      }),
    phone: Joi.string()
      .pattern(/^[6-9][0-9]{9}$/)
      .messages({
        'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number'
      }),
    address: Joi.string()
      .min(10)
      .max(500)
      .messages({
        'string.min': 'Address must be at least 10 characters long'
      })
  }),

  addMoney: Joi.object({
    amount: Joi.number()
      .positive()
      .min(1)
      .max(1000000)
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Amount must be a positive number',
        'number.min': 'Minimum amount is ₹1',
        'number.max': 'Maximum amount is ₹10,00,000',
        'number.precision': 'Amount can have maximum 2 decimal places'
      })
  }),

  transferMoney: Joi.object({
    toAccountNumber: Joi.string()
      .pattern(/^(CBI|AC)[0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid account number format'
      }),
    amount: Joi.number()
      .positive()
      .min(1)
      .max(1000000)
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Amount must be a positive number',
        'number.min': 'Minimum transfer amount is ₹1',
        'number.max': 'Maximum transfer amount is ₹10,00,000'
      }),
    description: Joi.string()
      .min(3)
      .max(500)
      .required()
      .messages({
        'string.min': 'Description must be at least 3 characters long',
        'string.max': 'Description cannot exceed 500 characters'
      })
  }),

  createFD: Joi.object({
    amount: Joi.number()
      .positive()
      .min(1000)
      .max(10000000)
      .required()
      .messages({
        'number.min': 'Minimum FD amount is ₹1,000',
        'number.max': 'Maximum FD amount is ₹1,00,00,000'
      }),
    tenure: Joi.number()
      .integer()
      .min(6)
      .max(120)
      .required()
      .messages({
        'number.min': 'Minimum tenure is 6 months',
        'number.max': 'Maximum tenure is 120 months (10 years)'
      })
  }),

  requestATMCard: Joi.object({
    cardType: Joi.string()
      .valid('debit', 'credit')
      .required()
      .messages({
        'any.only': 'Card type must be either debit or credit'
      }),
    deliveryAddress: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Delivery address must be at least 10 characters long',
        'string.max': 'Delivery address cannot exceed 500 characters'
      })
  }),

  setATMPin: Joi.object({
    cardId: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.hex': 'Invalid card ID format',
        'string.length': 'Invalid card ID format'
      }),
    pin: Joi.string()
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        'string.pattern.base': 'PIN must be exactly 4 digits'
      }),
    confirmPin: Joi.string()
      .valid(Joi.ref('pin'))
      .required()
      .messages({
        'any.only': 'PIN confirmation does not match PIN'
      })
  }),

  changeATMPin: Joi.object({
    cardId: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.hex': 'Invalid card ID format'
      }),
    oldPin: Joi.string()
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        'string.pattern.base': 'Old PIN must be exactly 4 digits'
      }),
    newPin: Joi.string()
      .pattern(/^\d{4}$/)
      .invalid(Joi.ref('oldPin'))
      .required()
      .messages({
        'string.pattern.base': 'New PIN must be exactly 4 digits',
        'any.invalid': 'New PIN must be different from old PIN'
      }),
    confirmNewPin: Joi.string()
      .valid(Joi.ref('newPin'))
      .required()
      .messages({
        'any.only': 'PIN confirmation does not match new PIN'
      })
  }),

  contact: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    phone: Joi.string()
      .pattern(/^[6-9][0-9]{9}$/)
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid 10-digit mobile number'
      }),
    subject: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Subject must be at least 5 characters long',
        'string.max': 'Subject cannot exceed 200 characters'
      }),
    message: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Message must be at least 10 characters long',
        'string.max': 'Message cannot exceed 1000 characters'
      }),
    category: Joi.string()
      .valid('general', 'account', 'card', 'loan', 'complaint', 'suggestion', 'technical')
      .default('general')
  })
};

// Query parameter validation
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid query parameters',
        error: error.details[0].message
      });
    }
    
    next();
  };
};

const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),
  
  transactionFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    type: Joi.string().valid('all', 'credit', 'debit', 'transfer').default('all'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  statsQuery: Joi.object({
    period: Joi.number().integer().min(1).max(365).default(30)
  })
};

const validateRegister = (req, res, next) => {
  const { name, email, phone, password, dateOfBirth, address, agreedToTerms, confirmPassword } = req.body;

  // Check required fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, email, phone, and password are required.'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters'
    });
  }

  // Check password confirmation
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Check terms agreement
  if (!agreedToTerms) {
    return res.status(400).json({
      success: false,
      message: 'You must agree to the terms and conditions'
    });
  }

  next();
};

module.exports = {
  validate,
  validateQueryParams,
  schemas,
  querySchemas,
  validateRegister
};