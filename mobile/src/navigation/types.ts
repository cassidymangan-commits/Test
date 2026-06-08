export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  History: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
