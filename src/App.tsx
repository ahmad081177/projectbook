import { Outlet } from 'react-router';
import RTLProvider from './components/layout/RTLProvider';
import { ToastContainer } from './components/ui/Toast';

export default function App() {
  return (
    <RTLProvider>
      <Outlet />
      <ToastContainer />
    </RTLProvider>
  );
}
