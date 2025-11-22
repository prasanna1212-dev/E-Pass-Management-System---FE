import './App.css'
import LoginDashboard from "./components/LoginDashboard"
import LandingPage from "./components/LandingPage"
import AdminLandingPage from './components/AdminLandingPage'
import {BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import NetworkStatusChecker from "./components/NetworkStatusChecker";
import { Toaster } from 'react-hot-toast';
// import QRScanner from './components/QRScanner';
import RenewalForm from './components/RenewalForm';

function App() {
  return (
    <>
    <Toaster position="top-center" />
      <Router>
        <NetworkStatusChecker></NetworkStatusChecker>
        <Routes>
          <Route path="/" element={<LoginDashboard />} />
          <Route path="/user-dashboard" element={<LandingPage />} />
          <Route path="/admin-dashboard" element={<AdminLandingPage />} />
          <Route path="/renewal-request/:id" element={<RenewalForm />} />
          {/* <Route path="/scanner" element={<QRScanner />} /> */}
        </Routes>
      </Router>
    </>
  )
}

export default App;
