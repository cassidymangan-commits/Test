export type RootStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  Pairing: undefined;
  Main: undefined;
  PromptDetail: { promptId: string };
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
