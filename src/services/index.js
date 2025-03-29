import tourService from './tourService';
import userService from './userService';
import bookingService from './bookingService';
import { api, calculateDiscount, calculateTourDiscount } from './api';

export {
  tourService,
  userService,
  bookingService,
  api,
  calculateDiscount,
  calculateTourDiscount
};

export default {
  tourService,
  userService,
  bookingService,
  api
}; 