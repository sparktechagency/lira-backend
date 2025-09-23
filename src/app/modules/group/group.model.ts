import { model, Schema } from 'mongoose';
import { GroupModel, IGroup } from './group.interface';


const groupSchema = new Schema<IGroup, GroupModel>(
     {
          serial:{
               type: Number,
               required: false,
          },
          name: {
               type: String,
               required: true,
               unique: true,
          }
     },
     { timestamps: true },
);
// Pre-save middleware to auto-increment serial
groupSchema.pre('save', async function(next) {
     // Only set serial if it's a new document and serial is not already set
     if (this.isNew && !this.serial) {
          try {
               // Find the highest serial number and increment by 1
               const lastGroup = await Group.findOne({}, {}, { sort: { serial: -1 } });
               this.serial = lastGroup ? lastGroup.serial + 1 : 1;
          } catch (error) {
               return next(error as Error);
          }
     }
     next();   
});

// Post-delete middleware to reorder serials
groupSchema.post('findOneAndDelete', async function(doc) {
     if (doc && doc.serial) {
          try {
               // Update all documents with serial greater than the deleted one
               await Group.updateMany(
                    { serial: { $gt: doc.serial } },
                    { $inc: { serial: -1 } }
               );
          } catch (error) {
               console.error('Error reordering serials after deletion:', error);
          }
     }
});

groupSchema.post('deleteOne', async function() {
     // Handle deleteOne as well
     const deletedDoc = await Group.findOne(this.getFilter());
     if (deletedDoc && deletedDoc.serial) {
          try {
               await Group.updateMany(
                    { serial: { $gt: deletedDoc.serial } },
                    { $inc: { serial: -1 } }
               );
          } catch (error) {
               console.error('Error reordering serials after deletion:', error);
          }
     }
});
export const Group = model<IGroup, GroupModel>('Group', groupSchema);
