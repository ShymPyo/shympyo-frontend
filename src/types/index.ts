import { User, AdminPlace } from '../services/api';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  ProfileEdit: { user: User };
  Main: undefined;
  AdminLogin: undefined;
  AdminMain: undefined;
  AdminSpaceEdit: { place: AdminPlace };
  AdminLetterList: undefined;
  GeneralLogin: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  QR: undefined;
  Letter: undefined;
  Settings: undefined;
};