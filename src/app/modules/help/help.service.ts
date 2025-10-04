import { HelpModel } from './help.model';
import { Help } from './help.interface';

const createHelp = async (payload: Help) => {
    const result = await HelpModel.create(payload);
    return result;
};
export const HelpService = {
    createHelp,
    // getHelp,
};