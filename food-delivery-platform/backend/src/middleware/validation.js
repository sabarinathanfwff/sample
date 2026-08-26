const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const { matchedData } = require('express-validator');
const logger = require('../utils/logger');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    }));

    logger.warn('Validation error:', { errors: extractedErrors, path: req.path });
    return res.status(400).json({ error: 'Validation failed', details: extractedErrors });
  };
};

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().optional(),
    role: Joi.string().valid('customer', 'restaurant_owner').default('customer'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  restaurant: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    cuisineType: Joi.array().items(Joi.string()).required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    phone: Joi.string().required(),
    email: Joi.string().email().optional(),
    imageUrl: Joi.string().uri().optional(),
    coverImageUrl: Joi.string().uri().optional(),
    openingTime: Joi.string().optional(),
    closingTime: Joi.string().optional(),
    deliveryTime: Joi.number().optional(),
    minimumOrder: Joi.number().optional(),
    deliveryFee: Joi.number().optional(),
  }),

  menuItem: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    category: Joi.string().required(),
    imageUrl: Joi.string().uri().optional(),
    isVegetarian: Joi.boolean().default(false),
    isVegan: Joi.boolean().default(false),
    isGlutenFree: Joi.boolean().default(false),
    spiceLevel: Joi.number().min(0).max(5).default(0),
    calories: Joi.number().optional(),
    preparationTime: Joi.number().optional(),
    isFeatured: Joi.boolean().default(false),
  }),

  review: Joi.object({
    restaurantId: Joi.string().uuid().optional(),
    menuItemId: Joi.string().uuid().optional(),
    orderId: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().optional(),
    images: Joi.array().items(Joi.string()).optional(),
  }),

  address: Joi.object({
    label: Joi.string().optional(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    isDefault: Joi.boolean().default(false),
  }),

  order: Joi.object({
    restaurantId: Joi.string().uuid().required(),
    addressId: Joi.string().uuid().required(),
    paymentMethod: Joi.string().required(),
    specialInstructions: Joi.string().optional(),
  }),
};

const validateBody = (schema) => {
  return [
    body().custom((value, { req }) => {
      const { error } = schema.validate(value);
      if (error) {
        throw new Error(error.details[0].message);
      }
      return true;
    }),
    (req, res, next) => {
      try {
        req.body = matchedData(req, { locations: ['body'] });
        next();
      } catch (error) {
        res.status(400).json({ error: 'Invalid request body' });
      }
    },
  ];
};

const validateParams = (schema) => {
  return [
    param().custom((value, { req }) => {
      const { error } = schema.validate(value);
      if (error) {
        throw new Error(error.details[0].message);
      }
      return true;
    }),
    (req, res, next) => {
      try {
        req.params = matchedData(req, { locations: ['params'] });
        next();
      } catch (error) {
        res.status(400).json({ error: 'Invalid request parameters' });
      }
    },
  ];
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  schemas,
};
