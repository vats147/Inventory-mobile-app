import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  ...jest.requireActual('react-native/Libraries/Interaction/InteractionManager'),
  runAfterInteractions: (fn) => fn(),
  createInteractionHandle: () => 1,
  clearInteractionHandle: jest.fn(),
}));
