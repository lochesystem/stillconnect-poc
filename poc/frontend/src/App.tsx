import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Buyer from "./pages/Buyer";
import NewDemand from "./pages/NewDemand";
import DemandDetail from "./pages/DemandDetail";
import AuctionRoom from "./pages/AuctionRoom";
import Contract from "./pages/Contract";
import Escrow from "./pages/Escrow";
import Logistics from "./pages/Logistics";
import Marketplace from "./pages/Marketplace";
import Admin from "./pages/Admin";
import { TourOverlay } from "./tour/TourOverlay";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="buyer" element={<Buyer />} />
          <Route path="buyer/new" element={<NewDemand />} />
          <Route path="buyer/demand/:id" element={<DemandDetail />} />
          <Route path="auction/:demandId" element={<AuctionRoom />} />
          <Route path="contract/:id" element={<Contract />} />
          <Route path="contract/from-demand/:demandId" element={<Contract />} />
          <Route path="escrow/:id" element={<Escrow />} />
          <Route path="logistics/:id" element={<Logistics />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
      <TourOverlay />
    </>
  );
}
