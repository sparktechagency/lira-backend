export type ICreateAccount = {
     name: string;
     email: string;
     otp: number;
};
export type IBlockAccount = {
     name: string;
     email: string;
};
export type ICreateContest = {
     email: string;
     userName: string;
     category: string;
     startDate: string;
     endDate: string;
     contestName: string;
};
export type IResetPassword = {
     email: string;
     otp: number;
};


export interface IResetPasswordByEmail {
     email: string;
     resetUrl: string;
}
export interface IHelpContact {
     name: string;
     email: string;
     phone?: string;
     read: boolean;
     message: string;
}
export interface IHelpReplay {
     name: string;
     email: string;
     message: string;
}
export type IContact = {
     name: string;
     email: string;
     subject: string;
     message: string;
};
