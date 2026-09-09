import Navbar from "./Navbar.jsx";

const AppLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-wrap">{children}</main>
    </div>
  );
};

export default AppLayout;
