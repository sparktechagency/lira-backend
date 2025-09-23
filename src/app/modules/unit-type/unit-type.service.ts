import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { UnitType } from './unit-type.model';
import { IUnitType } from './unit-type.interface';

//privacy policy
const createPrivacyPolicyToDB = async (payload: IUnitType) => {
     // check if privacy policy exist or not
     const isExistPrivacy = await UnitType.findOne({ type: 'privacy' });

     if (isExistPrivacy) {
          // update privacy is exist
          const result = await UnitType.findOneAndUpdate({ type: 'privacy' }, { content: payload?.content }, { new: true });
          const message = 'Privacy & Policy Updated successfully';
          return { message, result };
     } else {
          // create new if not exist
          const result = await UnitType.create({ ...payload, type: 'privacy' });
          const message = 'Privacy & Policy Created successfully';
          return { message, result };
     }
};

const getPrivacyPolicyFromDB = async () => {
     const result = await UnitType.findOne({ type: '' });
     if (!result) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Privacy policy doesn't exist!");
     }
     return result;
};


export const RuleService = {
     createPrivacyPolicyToDB,
     getPrivacyPolicyFromDB,
};
