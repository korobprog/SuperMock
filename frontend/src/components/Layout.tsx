import Navigation from "./Navigation";
import { Outlet } from "react-router-dom";
import { YandexMetrika } from "./YandexMetrika";

const Layout = () => {
  return (
    <div className="min-h-screen">
      <YandexMetrika counterId={103986343} />
      <Navigation />
      <div className="pt-20">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
