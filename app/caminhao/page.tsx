"use client";

import TruckRegistration from "@/components/truck-registration";
import { withPermission } from "@/components/with-permission";

const CaminhaoPage = () => {
  return <TruckRegistration />;
};

export default withPermission(CaminhaoPage, "CAMINHAO");