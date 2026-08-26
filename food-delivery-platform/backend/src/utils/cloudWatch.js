const AWS = require('aws-sdk');
const logger = require('../utils/logger');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const cloudwatch = new AWS.CloudWatch();

const putMetricData = async (namespace, metricData) => {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return;
    }

    const params = {
      Namespace: namespace,
      MetricData: metricData.map(item => ({
        MetricName: item.metricName,
        Value: item.value,
        Unit: item.unit || 'Count',
        Timestamp: new Date(),
        Dimensions: item.dimensions || [],
      })),
    };

    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    logger.error('CloudWatch metrics error:', error);
  }
};

const trackOrder = async (orderData) => {
  await putMetricData('FoodDelivery/Orders', [
    {
      metricName: 'OrdersPlaced',
      value: 1,
      unit: 'Count',
      dimensions: [
        { Name: 'RestaurantId', Value: orderData.restaurantId },
        { Name: 'Status', Value: orderData.status },
      ],
    },
  ]);
};

const trackAPIResponse = async (endpoint, statusCode, responseTime) => {
  await putMetricData('FoodDelivery/API', [
    {
      metricName: 'APIResponseTime',
      value: responseTime,
      unit: 'Milliseconds',
      dimensions: [{ Name: 'Endpoint', Value: endpoint }],
    },
    {
      metricName: 'APIRequests',
      value: 1,
      unit: 'Count',
      dimensions: [
        { Name: 'Endpoint', Value: endpoint },
        { Name: 'StatusCode', Value: statusCode.toString() },
      ],
    },
  ]);
};

const trackError = async (errorType, endpoint) => {
  await putMetricData('FoodDelivery/Errors', [
    {
      metricName: 'ErrorCount',
      value: 1,
      unit: 'Count',
      dimensions: [
        { Name: 'ErrorType', Value: errorType },
        { Name: 'Endpoint', Value: endpoint },
      ],
    },
  ]);
};

const trackUserActivity = async (userId, action) => {
  await putMetricData('FoodDelivery/Users', [
    {
      metricName: 'UserActions',
      value: 1,
      unit: 'Count',
      dimensions: [
        { Name: 'UserId', Value: userId },
        { Name: 'Action', Value: action },
      ],
    },
  ]);
};

module.exports = {
  putMetricData,
  trackOrder,
  trackAPIResponse,
  trackError,
  trackUserActivity,
};
