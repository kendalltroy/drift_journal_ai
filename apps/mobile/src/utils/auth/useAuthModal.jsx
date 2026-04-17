import { Modal } from 'react-native';
import { NativeAuthForm } from './NativeAuthForm';
import { useAuthStore, useAuthModal } from './store';


/**
 * This component renders a modal for authentication purposes.
 * To show it programmatically, you should either use the `useRequireAuth` hook or the `useAuthModal` hook.
 *
 * @example
 * ```js
 * import { useAuthModal } from '@/utils/useAuthModal';
 * function MyComponent() {
 * const { open } = useAuthModal();
 * return <Button title="Login" onPress={() => open({ mode: 'signin' })} />;
 * }
 * ```
 *
 * @example
 * ```js
 * import { useRequireAuth } from '@/utils/useAuth';
 * function MyComponent() {
 *   // automatically opens the auth modal if the user is not authenticated
 *   useRequireAuth();
 *   return <Text>Protected Content</Text>;
 * }
 *
 */
export const AuthModal = () => {
  const { isOpen, mode } = useAuthModal();
  const { auth } = useAuthStore();

  return (
    <Modal
      visible={isOpen && !auth}
      transparent={false}
      animationType="slide"
    >
      <NativeAuthForm mode={mode} key={mode} />
    </Modal>
  );
};

export default useAuthModal;
