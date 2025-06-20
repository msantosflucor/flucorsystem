"use client";

import ParkingDashboard from "@/components/parking-dashboard";
import { withPermission } from "@/components/with-permission";

const EstacionamentoPage = () => {
  return <ParkingDashboard />;
};

export default withPermission(EstacionamentoPage, "ESTACIONAMENTO");
