// import React from "react";
// import { RouterProvider } from "react-router-dom";
// import { router } from "./router";
// import "./App.css";

// export default function App() {
//   return <RouterProvider router={router} />;
// }

import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'

// AppLayout wraps all protected pages with the sticky navbar
export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 52px)' }}>
        <Outlet />
      </main>
    </>
  )
}
