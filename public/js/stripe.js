/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
// import { loadStripe } from '@stripe/stripe-js';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51NfNjmA3SnFud3hNawrT3aNKGeWGvUvbsYWbc1MbRbAYnWToaKkyqCnVMTo1ghE9jopZm5VhucSD55P9qBQ4xwKW005sSMgHA7',
  );

  try {
    // 1) Get Checkout session
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Redirect to checkout form
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error');
  }
};
