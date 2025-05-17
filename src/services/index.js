import tourService from './tourService';
import userService from './userService';
import bookingService from './bookingService';
import paymentService from './paymentService';
import agentService from './agentService';
import { api, calculateDiscount, calculateTourDiscount } from './api';

export {
  tourService,
  userService,
  bookingService,
  paymentService,
  agentService,
  api,
  calculateDiscount,
  calculateTourDiscount
};

export default {
  tourService,
  userService,
  bookingService,
  paymentService,
  agentService,
  api
}; 