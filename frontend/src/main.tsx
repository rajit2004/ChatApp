import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingContext";

function ThemedToast() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-center"
      autoClose={2000}
      limit={1}
      hideProgressBar={false}
      closeOnClick={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      transition={Bounce}
      toastClassName="!bg-surface !border !border-border !text-text !rounded-lg !shadow-xl"
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <LoadingProvider>
      <App />
      <ThemedToast />
    </LoadingProvider>
  </ThemeProvider>
);
