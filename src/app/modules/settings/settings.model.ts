import { Schema, model } from 'mongoose';
import { ISettings } from './settings.interface';

const settingsSchema = new Schema<ISettings>(
     {
          privacyPolicy: {
               type: String,
               default: '',
          },
          aboutUs: {
               type: String,
               default: '',
          },
          support: {
               type: String,
               default: '',
          },
          termsOfService: {
               type: String,
               default: '',
          },
          social: {
               contactEmail: {
                    type: String,
                    default: '',
               },
               phone: {
                    type: String,
                    default: '',
               },
               address: {
                    type: String,
                    default: '',
               },
               instagram: {
                    type: String,
                    default: '',
               },
               linkedin: {
                    type: String,
                    default: '',
               },
          },
     },
     { timestamps: true },
);

// Create the model
const Settings = model<ISettings>('Settings', settingsSchema);

export default Settings;
