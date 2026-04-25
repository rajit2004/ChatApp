import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {Bounce, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
ReactDOM.createRoot(document.getElementById("root")!).render(
 
    <>
    <App />
   <ToastContainer
position="top-center"
autoClose={2000}
limit={1}
hideProgressBar={false}
newestOnTop={false}
closeOnClick={false}
rtl={false}
pauseOnFocusLoss
draggable
pauseOnHover
theme="colored"
transition={Bounce}
/>
    </>
  
);