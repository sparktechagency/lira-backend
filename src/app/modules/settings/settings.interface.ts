import { Document } from 'mongoose';

// Define the interface for your settings
export interface ISettings extends Document {
     privacyPolicy: string;
     aboutUs: string;
     support: string;
     termsOfService: string;
     social: {
          contactEmail: string;
          phone: string;
          address: string;
          instagram: string;
          linkedin: string;
     };
     note: string;
}
