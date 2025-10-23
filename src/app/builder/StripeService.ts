import Stripe from 'stripe';

import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import AppError from '../../errors/AppError';

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
     apiVersion: '2025-01-27.acacia',
});

class StripeService {
     // 1️⃣ Create or Get Stripe Customer
     async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
          try {
               // Check if customer already exists
               const customers = await stripe.customers.list({
                    email: email,
                    limit: 1,
               });

               if (customers.data.length > 0) {
                    return customers.data[0].id;
               }

               // Create new customer
               const customer = await stripe.customers.create({
                    email: email,
                    name: name,
                    metadata: {
                         userId: userId,
                    },
               });

               return customer.id;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Stripe customer creation failed: ${error.message}`);
          }
     }

     // 2️⃣ Add Card to Customer (Using Payment Method)
     async addCard(customerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
          try {
               // Attach payment method to customer
               const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customerId,
               });

               return paymentMethod;
          } catch (error: any) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Failed to add card: ${error.message}`);
          }
     }

     // 3️⃣ Get Customer's Cards
     async getCustomerCards(customerId: string): Promise<Stripe.PaymentMethod[]> {
          try {
               const paymentMethods = await stripe.paymentMethods.list({
                    customer: customerId,
                    type: 'card',
               });

               return paymentMethods.data;
          } catch (error: any) {
               throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch cards: ${error.message}`);
          }
     }

     // 4️⃣ Remove Card
     async removeCard(paymentMethodId: string): Promise<void> {
          try {
               await stripe.paymentMethods.detach(paymentMethodId);
          } catch (error: any) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Failed to remove card: ${error.message}`);
          }
     }

     // 5️⃣ Create Payout to Card (Using Instant Payouts)
     async createCardPayout(
          amount: number,
          currency: string,
          destinationCardId: string,
          metadata: Record<string, string>,
     ): Promise<Stripe.Payout> {
          try {
               // Create instant payout to debit card
               const payout = await stripe.payouts.create({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: currency.toLowerCase(),
                    destination: destinationCardId,
                    method: 'instant', // Instant transfer (faster but has fee)
                    metadata: metadata,
               });

               return payout;
          } catch (error: any) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Payout failed: ${error.message}`);
          }
     }

     // 6️⃣ Create Standard Payout (Takes 2-3 business days, lower fee)
     async createStandardPayout(
          amount: number,
          currency: string,
          destinationCardId: string,
          metadata: Record<string, string>,
     ): Promise<Stripe.Payout> {
          try {
               const payout = await stripe.payouts.create({
                    amount: Math.round(amount * 100),
                    currency: currency.toLowerCase(),
                    destination: destinationCardId,
                    method: 'standard', // Standard transfer (cheaper, slower)
                    metadata: metadata,
               });

               return payout;
          } catch (error: any) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Payout failed: ${error.message}`);
          }
     }

     // 7️⃣ Get Payout Status
     async getPayoutStatus(payoutId: string): Promise<Stripe.Payout> {
          try {
               const payout = await stripe.payouts.retrieve(payoutId);
               return payout;
          } catch (error: any) {
               throw new AppError(StatusCodes.NOT_FOUND, `Payout not found: ${error.message}`);
          }
     }

     // 8️⃣ Create External Account (Bank Account for Payout)
     async createExternalAccount(
          customerId: string,
          accountNumber: string,
          routingNumber: string,
          accountHolderName: string,
          country: string = 'US',
     ): Promise<Stripe.BankAccount> {
          try {
               const bankAccount = await stripe.customers.createSource(customerId, {
                    source: {
                         object: 'bank_account',
                         country: country,
                         currency: 'usd',
                         account_holder_name: accountHolderName,
                         account_holder_type: 'individual',
                         routing_number: routingNumber,
                         account_number: accountNumber,
                    } as any,
               });

               return bankAccount as Stripe.BankAccount;
          } catch (error: any) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Failed to add bank account: ${error.message}`);
          }
     }

     // 9️⃣ Verify Bank Account
     async verifyBankAccount(customerId: string, bankAccountId: string, amounts: number[]): Promise<Stripe.BankAccount> {
          try {
               const bankAccount = await stripe.customers.verifySource(customerId, bankAccountId, {
                    amounts: amounts,
               });

               return bankAccount as Stripe.BankAccount;
          } catch (error: any) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Bank verification failed: ${error.message}`);
          }
     }

     // 🔟 Calculate Payout Fee (Instant vs Standard)
     calculatePayoutFee(amount: number, method: 'instant' | 'standard'): number {
          if (method === 'instant') {
               // Instant: 1.5% + $0.50
               return amount * 0.015 + 0.5;
          } else {
               // Standard: 0.25% (max $5)
               return Math.min(amount * 0.0025, 5);
          }
     }
}

export default new StripeService();