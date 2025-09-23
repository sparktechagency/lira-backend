import { model, Schema } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface';

const categorySchema = new Schema<ICategory, CategoryModel>(
     {
          serial: {
               type: Number,
               required: false,
          },
          name: {
               type: String,
               required: true,
               unique: true,
          },
          url: {
               type: String,
               required: true,
          },
          groupId: {
               type: Schema.Types.ObjectId,
               ref: 'Group',
               required: true,
          },
          group: {
               type: String,
               required: true,

          }
     },
     { timestamps: true },
);
// Pre-save middleware to auto-increment serial
categorySchema.pre('save', async function (next) {
     // Only set serial if it's a new document and serial is not already set
     if (this.isNew && !this.serial) {
          try {
               // Find the highest serial number and increment by 1
               const lastCategory = await Category.findOne({}, {}, { sort: { serial: -1 } });
               this.serial = lastCategory ? lastCategory.serial + 1 : 1;
          } catch (error) {
               return next(error as Error);
          }
     }
     next();
});

// Post-delete middleware to reorder serials
categorySchema.post('findOneAndDelete', async function (doc) {
     if (doc && doc.serial) {
          try {
               // Update all documents with serial greater than the deleted one
               await Category.updateMany(
                    { serial: { $gt: doc.serial } },
                    { $inc: { serial: -1 } }
               );
          } catch (error) {
               console.error('Error reordering serials after deletion:', error);
          }
     }
});

categorySchema.post('deleteOne', async function () {
     // Handle deleteOne as well
     const deletedDoc = await Category.findOne(this.getFilter());
     if (deletedDoc && deletedDoc.serial) {
          try {
               await Category.updateMany(
                    { serial: { $gt: deletedDoc.serial } },
                    { $inc: { serial: -1 } }
               );
          } catch (error) {
               console.error('Error reordering serials after deletion:', error);
          }
     }
});
export const Category = model<ICategory, CategoryModel>('Category', categorySchema);
